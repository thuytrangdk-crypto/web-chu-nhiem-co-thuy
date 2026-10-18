import * as XLSX from 'xlsx';
import { ClassData, Student, DisciplineRecord } from '../types';

export interface ExportDisciplineOptions {
  classData: ClassData;
  fromDate: string; // YYYY-MM-DD
  toDate: string;   // YYYY-MM-DD
  periodLabel: string; // e.g. "Tuần 6", "Tháng 10/2026", "Học kỳ 1", "Cả năm học", "Tùy chọn"
}

// Convert YYYY-MM-DD to DD/MM/YYYY
export function formatDateVN(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
  }
  return dateStr;
}

// Format current timestamp in Vietnam timezone (UTC+7)
export function getExportTimeVN(): string {
  const now = new Date();
  return now.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour12: false,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Defense against Excel Formula Injection (CSV/XLSX injection)
// Prepends single quote if string starts with formula triggers (=, +, -, @, tab, newline)
function sanitizeText(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

// Create a safe text cell that preserves leading zeros
function makeTextCell(val: string | number) {
  const safeStr = sanitizeText(val);
  return { t: 's', v: safeStr, z: '@' };
}

// Create a number cell
function makeNumCell(val: number) {
  return { t: 'n', v: Number.isFinite(val) ? val : 0 };
}

// Create a signed number cell for points (+/-)
function makeSignedNumCell(val: number) {
  const num = Number.isFinite(val) ? val : 0;
  const formatted = num > 0 ? `+${num}` : String(num);
  return { t: 'n', v: num, z: '+#,##0;-#,##0;0', w: formatted };
}

// Reusable evaluation tier calculation matching StudentProfileModal & DisciplineView
export function evaluateConductTier(
  totalScore: number,
  tiers?: { excellent: number; good: number; average: number }
): string {
  const t = tiers || { excellent: 90, good: 75, average: 50 };
  if (totalScore >= t.excellent) return 'Tốt';
  if (totalScore >= t.good) return 'Khá';
  if (totalScore >= t.average) return 'Đạt';
  return 'Chưa đạt';
}

export function exportDisciplineToExcel(options: ExportDisciplineOptions) {
  const { classData, fromDate, toDate, periodLabel } = options;

  if (!classData || !classData.students || classData.students.length === 0) {
    throw new Error('Chưa tải đủ dữ liệu học sinh của lớp. Vui lòng thử lại sau.');
  }

  const settings = classData.settings || {};
  const schoolName = settings.schoolName || 'TRƯỜNG THCS';
  const className = settings.className || 'Lớp';
  const teacherName = settings.teacherName || 'Giáo viên chủ nhiệm';
  const schoolYear = settings.schoolYear || '2026 - 2027';
  const startingScore = settings.startingScore ?? 100;
  const tiers = settings.evaluationTiers || { excellent: 90, good: 75, average: 50 };
  const exportTime = getExportTimeVN();

  const allStudents = classData.students;
  const allRecords = classData.disciplineRecords || [];

  // Filter records within the selected date range (inclusive), avoiding duplicate records
  const seenRecordIds = new Set<string>();
  const inRangeRecords = allRecords.filter((rec) => {
    if (!rec || !rec.date) return false;
    const recKey = rec.id || `${rec.studentId}_${rec.date}_${rec.ruleId}_${rec.points}`;
    if (seenRecordIds.has(recKey)) return false;
    seenRecordIds.add(recKey);
    return rec.date >= fromDate && rec.date <= toDate;
  });

  // Determine month string if reporting by month (e.g. fromDate = 2026-10-01 -> month = "10")
  const fromMonth = fromDate.split('-')[1];

  // ==========================================
  // 1. SHEET 1: “Tổng hợp thi đua”
  // ==========================================

  // Calculate scores for all students in the class
  interface StudentEval {
    student: Student;
    startingScore: number;
    positivePoints: number;
    negativePoints: number; // positive number as requested
    totalScore: number;
    calculatedTier: string;
    finalTier: string;
    isAdjusted: boolean;
    posCount: number;
    negCount: number;
    note: string;
    rank?: number;
  }

  const evaluations: StudentEval[] = allStudents.map((st) => {
    const studentRecords = inRangeRecords.filter((r) => r.studentId === st.id);
    const positivePoints = studentRecords
      .filter((r) => r.points > 0)
      .reduce((sum, r) => sum + r.points, 0);

    // negativePoints displayed as a positive number (e.g. -5 -> 5)
    const rawNegativeSum = studentRecords
      .filter((r) => r.points < 0)
      .reduce((sum, r) => sum + r.points, 0);
    const negativePoints = Math.abs(rawNegativeSum);

    const delta = positivePoints - negativePoints;
    const totalScore = startingScore + delta;

    const calculatedTier = evaluateConductTier(totalScore, tiers);

    // Check teacher conduct adjustments
    const periodMonthKey = `${st.id}_${fromMonth}`;
    const periodTotalKey = `${st.id}_total`;
    const adjustment =
      classData.conductAdjustments?.[periodMonthKey] ||
      classData.conductAdjustments?.[periodTotalKey] ||
      classData.conductAdjustments?.[`${st.id}_all`];

    const finalTier = adjustment ? adjustment.adjustedTier : calculatedTier;
    const isAdjusted = Boolean(adjustment);

    const posCount = studentRecords.filter((r) => r.points > 0).length;
    const negCount = studentRecords.filter((r) => r.points < 0).length;

    const noteParts: string[] = [];
    if (isAdjusted && adjustment?.reason) {
      noteParts.push(`Đã điều chỉnh xếp loại: ${adjustment.reason}`);
    }
    if (st.notes) {
      noteParts.push(st.notes);
    }

    return {
      student: st,
      startingScore,
      positivePoints,
      negativePoints,
      totalScore,
      calculatedTier,
      finalTier,
      isAdjusted,
      posCount,
      negCount,
      note: noteParts.join('; '),
    };
  });

  // Sort descending by totalScore; secondary sort alphabetically by fullName in Vietnamese
  evaluations.sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    return a.student.fullName.localeCompare(b.student.fullName, 'vi');
  });

  // Assign ranks: students with equal scores have identical rank (dense competition ranking)
  let currentRank = 1;
  evaluations.forEach((item, index) => {
    if (index > 0 && item.totalScore < evaluations[index - 1].totalScore) {
      currentRank = index + 1;
    }
    item.rank = currentRank;
  });

  // Build Sheet 1 Array of Arrays
  const aoaSummary: any[][] = [
    [makeTextCell(schoolName.toUpperCase())],
    [makeTextCell('BẢNG TỔNG HỢP THI ĐUA RÈN LUYỆN HỌC SINH')],
    [
      makeTextCell(`Lớp: ${className}`),
      makeTextCell(''),
      makeTextCell(`GVCN: ${teacherName}`),
      makeTextCell(''),
      makeTextCell(`Năm học: ${schoolYear}`),
    ],
    [
      makeTextCell(
        `Kỳ báo cáo: ${periodLabel} (Từ ngày ${formatDateVN(fromDate)} đến ngày ${formatDateVN(toDate)})`
      ),
      makeTextCell(''),
      makeTextCell(''),
      makeTextCell(`Thời gian xuất: ${exportTime}`),
    ],
    [], // Blank Row 5
    // Header Row 6
    [
      makeTextCell('STT'),
      makeTextCell('Mã hồ sơ học sinh'),
      makeTextCell('Họ và tên'),
      makeTextCell('Lớp'),
      makeTextCell('Điểm ban đầu'),
      makeTextCell('Tổng điểm cộng'),
      makeTextCell('Tổng điểm trừ'),
      makeTextCell('Tổng điểm thi đua'),
      makeTextCell('Xếp loại thi đua'),
      makeTextCell('Xếp hạng'),
      makeTextCell('Số lượt ghi nhận tích cực'),
      makeTextCell('Số lượt ghi nhận vi phạm'),
      makeTextCell('Ghi chú'),
    ],
  ];

  // Append Student Evaluation Rows
  evaluations.forEach((item, idx) => {
    aoaSummary.push([
      makeNumCell(idx + 1),
      makeTextCell(item.student.id),
      makeTextCell(item.student.fullName),
      makeTextCell(className),
      makeNumCell(item.startingScore),
      makeNumCell(item.positivePoints),
      makeNumCell(item.negativePoints),
      makeNumCell(item.totalScore),
      makeTextCell(item.finalTier),
      makeNumCell(item.rank || idx + 1),
      makeNumCell(item.posCount),
      makeNumCell(item.negCount),
      makeTextCell(item.note),
    ]);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(aoaSummary);

  // Column widths for Sheet 1
  wsSummary['!cols'] = [
    { wch: 8 },  // STT
    { wch: 20 }, // Mã hồ sơ học sinh
    { wch: 28 }, // Họ và tên
    { wch: 14 }, // Lớp
    { wch: 16 }, // Điểm ban đầu
    { wch: 18 }, // Tổng điểm cộng
    { wch: 18 }, // Tổng điểm trừ
    { wch: 20 }, // Tổng điểm thi đua
    { wch: 18 }, // Xếp loại thi đua
    { wch: 14 }, // Xếp hạng
    { wch: 26 }, // Số lượt tích cực
    { wch: 26 }, // Số lượt vi phạm
    { wch: 36 }, // Ghi chú
  ];

  // AutoFilter & Freeze Header row (Row 6)
  const lastRowSummary = aoaSummary.length;
  wsSummary['!autofilter'] = { ref: `A6:M${lastRowSummary}` };
  wsSummary['!views'] = [{ state: 'frozen', ySplit: 6 }];

  // ==========================================
  // 2. SHEET 2: “Chi tiết ghi nhận”
  // ==========================================

  // Sort records chronologically (newest first, then student name)
  const sortedRecords = [...inRangeRecords].sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return (a.studentId || '').localeCompare(b.studentId || '');
  });

  // Map student name lookup
  const studentMap = new Map<string, string>();
  allStudents.forEach((s) => studentMap.set(s.id, s.fullName));

  const aoaDetails: any[][] = [
    [makeTextCell(schoolName.toUpperCase())],
    [makeTextCell('SỔ CHI TIẾT GHI NHẬN THI ĐUA RÈN LUYỆN')],
    [
      makeTextCell(`Lớp: ${className}`),
      makeTextCell(''),
      makeTextCell(`GVCN: ${teacherName}`),
      makeTextCell(''),
      makeTextCell(`Năm học: ${schoolYear}`),
    ],
    [
      makeTextCell(
        `Kỳ báo cáo: ${periodLabel} (Từ ngày ${formatDateVN(fromDate)} đến ngày ${formatDateVN(toDate)})`
      ),
      makeTextCell(''),
      makeTextCell(''),
      makeTextCell(`Tổng số sự việc: ${sortedRecords.length}`),
    ],
    [], // Blank Row 5
    // Header Row 6 (Exactly the 8 requested columns)
    [
      makeTextCell('Thời gian'),
      makeTextCell('Mã hồ sơ học sinh'),
      makeTextCell('Họ và tên'),
      makeTextCell('Nội dung sự việc'),
      makeTextCell('Loại ghi nhận'),
      makeTextCell('Điểm cộng/trừ'),
      makeTextCell('Người ghi nhận'),
      makeTextCell('Ghi chú'),
    ],
  ];

  if (sortedRecords.length === 0) {
    aoaDetails.push([
      makeTextCell(''),
      makeTextCell(''),
      makeTextCell('Không có sự việc ghi nhận thi đua nào trong khoảng thời gian đã chọn.'),
      makeTextCell(''),
      makeTextCell(''),
      makeTextCell(''),
      makeTextCell(''),
      makeTextCell(''),
    ]);
  } else {
    sortedRecords.forEach((rec) => {
      const studentName = studentMap.get(rec.studentId) || rec.studentId;
      const recordType =
        rec.points > 0 ? 'Tích cực' : rec.points < 0 ? 'Vi phạm' : 'Ghi nhận';
      const author = (rec as any).author || teacherName;

      aoaDetails.push([
        makeTextCell(formatDateVN(rec.date)),
        makeTextCell(rec.studentId),
        makeTextCell(studentName),
        makeTextCell(rec.ruleTitle || rec.group || 'Ghi nhận thi đua'),
        makeTextCell(recordType),
        makeSignedNumCell(rec.points),
        makeTextCell(author),
        makeTextCell(rec.note || ''),
      ]);
    });
  }

  const wsDetails = XLSX.utils.aoa_to_sheet(aoaDetails);

  // Column widths for Sheet 2
  wsDetails['!cols'] = [
    { wch: 16 }, // Thời gian
    { wch: 20 }, // Mã hồ sơ học sinh
    { wch: 28 }, // Họ và tên
    { wch: 42 }, // Nội dung sự việc
    { wch: 18 }, // Loại ghi nhận
    { wch: 18 }, // Điểm cộng/trừ
    { wch: 28 }, // Người ghi nhận
    { wch: 36 }, // Ghi chú
  ];

  // AutoFilter & Freeze Header row (Row 6)
  const lastRowDetails = aoaDetails.length;
  wsDetails['!autofilter'] = { ref: `A6:H${lastRowDetails}` };
  wsDetails['!views'] = [{ state: 'frozen', ySplit: 6 }];

  // ==========================================
  // 3. COMPILE WORKBOOK & TRIGGER DOWNLOAD
  // ==========================================
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Tổng hợp thi đua');
  XLSX.utils.book_append_sheet(wb, wsDetails, 'Chi tiết ghi nhận');

  // Filename format: Thi_dua_[TenLop]_[TuNgay]_[DenNgay].xlsx
  const cleanClassName = className
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_À-ỹ]/g, '');
  const fromStr = formatDateVN(fromDate).replace(/\//g, '-');
  const toStr = formatDateVN(toDate).replace(/\//g, '-');
  const fileName = `Thi_dua_${cleanClassName}_${fromStr}_${toStr}.xlsx`;

  XLSX.writeFile(wb, fileName);
}
