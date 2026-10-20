import * as XLSX from 'xlsx';
import { ClassData, Student, DisciplineRecord } from '../types';

export interface ExportStudentViolationsOptions {
  classData: ClassData;
  student: Student;
  fromDate: string; // YYYY-MM-DD
  toDate: string;   // YYYY-MM-DD
  periodLabel: string; // e.g. "Tháng 10/2026", "Cả năm học 2026 - 2027", "Tùy chọn (01/10/2026 - 31/10/2026)"
  filePeriodSuffix: string; // e.g. "10-2026", "2026-2027", "01-10-2026_31-10-2026"
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
function sanitizeText(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

// Create safe text cell preserving leading zero
function makeTextCell(val: string | number) {
  const safeStr = sanitizeText(val);
  return { t: 's', v: safeStr, z: '@' };
}

// Create number cell
function makeNumCell(val: number) {
  return { t: 'n', v: Number.isFinite(val) ? val : 0 };
}

// Check if a discipline record is a violation (not praise/reward)
export function isViolationRecord(rec: DisciplineRecord): boolean {
  if (!rec) return false;
  // If points are negative, it is definitively a violation
  if (rec.points < 0) return true;
  // Positive points are praise/reward -> NEVER include
  if (rec.points > 0) return false;
  // If points === 0, check if it's categorized as a violation vs reward
  const title = (rec.ruleTitle || '').toLowerCase();
  const group = (rec.group || '').toLowerCase();
  if (
    title.includes('khen') ||
    title.includes('tích cực') ||
    title.includes('thưởng') ||
    group.includes('khen') ||
    group.includes('tích cực')
  ) {
    return false;
  }
  // Otherwise 0-point record classified under rules/violation is counted
  return true;
}

export function exportStudentViolationsToExcel(options: ExportStudentViolationsOptions) {
  const { classData, student, fromDate, toDate, periodLabel, filePeriodSuffix } = options;

  if (!classData || !student) {
    throw new Error('Dữ liệu học sinh hoặc lớp học không đầy đủ.');
  }

  const settings = classData.settings || {};
  const schoolName = settings.schoolName || 'TRƯỜNG THCS ĐỒNG KHỞI';
  const className = settings.className || 'Lớp 9A14';
  const teacherName = settings.teacherName || 'Cô Nguyễn Thị Thu Thủy';
  const schoolYear = settings.schoolYear || '2026 - 2027';
  const exportTime = getExportTimeVN();

  const allRecords = classData.disciplineRecords || [];

  // Filter violation records strictly for this student in the date range
  const studentViolations = allRecords
    .filter((r) => r.studentId === student.id)
    .filter((r) => r.date >= fromDate && r.date <= toDate)
    .filter(isViolationRecord)
    .sort((a, b) => b.date.localeCompare(a.date)); // newest first

  if (studentViolations.length === 0) {
    throw new Error(
      `Học sinh ${student.fullName} (${student.id}) không có ghi nhận vi phạm nào trong ${periodLabel}.`
    );
  }

  // ==========================================
  // SHEET 1: “Chi tiết vi phạm”
  // ==========================================
  const aoaDetails: any[][] = [
    [makeTextCell(schoolName.toUpperCase())],
    [makeTextCell('SỔ CHI TIẾT VI PHẠM KỶ LUẬT HỌC SINH')],
    [
      makeTextCell(`Họ và tên: ${student.fullName}`),
      makeTextCell(''),
      makeTextCell(`Mã hồ sơ: ${student.id}`),
      makeTextCell(''),
      makeTextCell(`Lớp: ${className}`),
    ],
    [
      makeTextCell(`GVCN: ${teacherName}`),
      makeTextCell(''),
      makeTextCell(`Năm học: ${schoolYear}`),
      makeTextCell(''),
      makeTextCell(`Thời gian xuất: ${exportTime}`),
    ],
    [
      makeTextCell(
        `Kỳ báo cáo: ${periodLabel} (Từ ngày ${formatDateVN(fromDate)} đến ngày ${formatDateVN(toDate)})`
      ),
      makeTextCell(''),
      makeTextCell(''),
      makeTextCell(`Tổng số vi phạm: ${studentViolations.length} lượt`),
    ],
    [], // Blank Row 6
    // Header Row 7
    [
      makeTextCell('STT'),
      makeTextCell('Ngày xảy ra'),
      makeTextCell('Lỗi vi phạm'),
      makeTextCell('Nội dung sự việc'),
      makeTextCell('Điểm trừ'),
      makeTextCell('Ghi chú'),
      makeTextCell('Người ghi nhận'),
    ],
  ];

  studentViolations.forEach((rec, idx) => {
    // Points deduction: displayed as positive number representing points deducted
    const deductionPoints = Math.abs(rec.points);
    const author = (rec as any).author || teacherName;

    aoaDetails.push([
      makeNumCell(idx + 1),
      makeTextCell(formatDateVN(rec.date)),
      makeTextCell(rec.ruleTitle || 'Lỗi vi phạm'),
      makeTextCell(rec.note || rec.group || 'Ghi nhận nề nếp'),
      makeNumCell(deductionPoints),
      makeTextCell(rec.note || ''),
      makeTextCell(author),
    ]);
  });

  const wsDetails = XLSX.utils.aoa_to_sheet(aoaDetails);

  wsDetails['!cols'] = [
    { wch: 8 },  // STT
    { wch: 16 }, // Ngày xảy ra
    { wch: 32 }, // Lỗi vi phạm
    { wch: 42 }, // Nội dung sự việc
    { wch: 14 }, // Điểm trừ
    { wch: 36 }, // Ghi chú
    { wch: 28 }, // Người ghi nhận
  ];

  // Freeze header row (Row 7) and AutoFilter
  const lastRowDetails = aoaDetails.length;
  wsDetails['!views'] = [{ state: 'frozen', ySplit: 7 }];
  wsDetails['!autofilter'] = { ref: `A7:G${lastRowDetails}` };

  // ==========================================
  // SHEET 2: “Tổng hợp theo lỗi”
  // ==========================================
  // Group by error/rule title
  const errorSummaryMap = new Map<string, { count: number; totalDeduction: number }>();

  studentViolations.forEach((rec) => {
    const errorName = rec.ruleTitle || 'Lỗi vi phạm khác';
    const deduction = Math.abs(rec.points);
    const existing = errorSummaryMap.get(errorName) || { count: 0, totalDeduction: 0 };
    errorSummaryMap.set(errorName, {
      count: existing.count + 1,
      totalDeduction: existing.totalDeduction + deduction,
    });
  });

  const aoaSummary: any[][] = [
    [makeTextCell(schoolName.toUpperCase())],
    [makeTextCell('BẢNG TỔNG HỢP VI PHẠM THEO LỖI')],
    [
      makeTextCell(`Học sinh: ${student.fullName}`),
      makeTextCell(''),
      makeTextCell(`Mã HS: ${student.id}`),
      makeTextCell(''),
      makeTextCell(`Lớp: ${className}`),
    ],
    [
      makeTextCell(`GVCN: ${teacherName}`),
      makeTextCell(''),
      makeTextCell(`Kỳ báo cáo: ${periodLabel}`),
      makeTextCell(''),
      makeTextCell(`Thời gian xuất: ${exportTime}`),
    ],
    [], // Blank Row 5
    // Header Row 6
    [
      makeTextCell('STT'),
      makeTextCell('Tên lỗi vi phạm'),
      makeTextCell('Số lượt vi phạm'),
      makeTextCell('Tổng điểm trừ'),
    ],
  ];

  let totalViolationsCount = 0;
  let totalDeductionPoints = 0;
  let summaryIdx = 1;

  // Sort errors by count descending
  const sortedErrors = Array.from(errorSummaryMap.entries()).sort(
    (a, b) => b[1].count - a[1].count || b[1].totalDeduction - a[1].totalDeduction
  );

  sortedErrors.forEach(([errorName, stat]) => {
    totalViolationsCount += stat.count;
    totalDeductionPoints += stat.totalDeduction;

    aoaSummary.push([
      makeNumCell(summaryIdx++),
      makeTextCell(errorName),
      makeNumCell(stat.count),
      makeNumCell(stat.totalDeduction),
    ]);
  });

  // Total summary row
  aoaSummary.push([
    makeTextCell('TỔNG CỘNG'),
    makeTextCell('Tất cả các lỗi vi phạm trong kỳ'),
    makeNumCell(totalViolationsCount),
    makeNumCell(totalDeductionPoints),
  ]);

  const wsSummary = XLSX.utils.aoa_to_sheet(aoaSummary);

  wsSummary['!cols'] = [
    { wch: 14 }, // STT / TỔNG CỘNG
    { wch: 42 }, // Tên lỗi
    { wch: 20 }, // Số lượt
    { wch: 20 }, // Tổng điểm trừ
  ];

  const lastRowSummary = aoaSummary.length;
  wsSummary['!views'] = [{ state: 'frozen', ySplit: 6 }];
  wsSummary['!autofilter'] = { ref: `A6:D${lastRowSummary - 1}` };

  // ==========================================
  // COMPILE WORKBOOK & DOWNLOAD
  // ==========================================
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsDetails, 'Chi tiết vi phạm');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Tổng hợp theo lỗi');

  // Filename format: Vi_pham_[MaHS]_[Thang-Nam hoặc NamHoc].xlsx
  const cleanId = student.id.replace(/[^a-zA-Z0-9_-]/g, '');
  const cleanSuffix = filePeriodSuffix.replace(/\//g, '-').replace(/\s+/g, '_');
  const fileName = `Vi_pham_${cleanId}_${cleanSuffix}.xlsx`;

  XLSX.writeFile(wb, fileName);
}
