import * as XLSX from 'xlsx';
import { Student, Subject, GradeRecord, ClassData } from '../types';

// Helper to format date string to DD/MM/YYYY
export function normalizeDate(input: any): string | null {
  if (!input) return null;
  if (typeof input === 'number') {
    // Excel serial date format
    const date = new Date(Math.round((input - 25569) * 86400 * 1000));
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }
  const str = String(input).trim();
  // If DD/MM/YYYY
  const dmyRegex = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;
  const match = str.match(dmyRegex);
  if (match) {
    const d = match[1].padStart(2, '0');
    const m = match[2].padStart(2, '0');
    const y = match[3];
    return `${d}/${m}/${y}`;
  }
  // If YYYY-MM-DD
  const ymdRegex = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/;
  const matchYmd = str.match(ymdRegex);
  if (matchYmd) {
    const y = matchYmd[1];
    const m = matchYmd[2].padStart(2, '0');
    const d = matchYmd[3].padStart(2, '0');
    return `${d}/${m}/${y}`;
  }
  return null;
}

// Download student Excel template
export function downloadStudentTemplate() {
  const sampleData = [
    {
      'Mã học sinh (*)': 'HS1040',
      'Họ và tên (*)': 'Lê Hoàng Nam',
      'Giới tính (*)': 'Nam',
      'Ngày sinh (DD/MM/YYYY) (*)': '15/08/2008',
      'Số điện thoại': '0901234567',
      'SĐT phụ huynh': '0912987654',
      'Địa chỉ': '123 Nguyễn Thị Minh Khai, Q.1',
      'Ghi chú': 'Đoàn viên tích cực',
    },
    {
      'Mã học sinh (*)': 'HS1041',
      'Họ và tên (*)': 'Trần Ngọc Bích',
      'Giới tính (*)': 'Nữ',
      'Ngày sinh (DD/MM/YYYY) (*)': '20/11/2008',
      'Số điện thoại': '0938112233',
      'SĐT phụ huynh': '0988223344',
      'Địa chỉ': '45 Lê Duẩn, Q.1',
      'Ghi chú': 'Học sinh chuyển trường',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  // Style column widths
  ws['!cols'] = [
    { wch: 18 },
    { wch: 25 },
    { wch: 14 },
    { wch: 26 },
    { wch: 18 },
    { wch: 18 },
    { wch: 32 },
    { wch: 25 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Mau_Nhap_Hoc_Sinh');
  XLSX.writeFile(wb, 'Mau_Danh_Sach_Hoc_Sinh_10A1.xlsx');
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

// Parse uploaded student Excel file
export function parseStudentExcel(
  fileData: ArrayBuffer,
  existingStudents: Student[]
): { validStudents: Student[]; errors: ImportError[] } {
  const workbook = XLSX.read(fileData, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const validStudents: Student[] = [];
  const errors: ImportError[] = [];
  const seenIdsInFile = new Set<string>();

  rawRows.forEach((row, index) => {
    const rowNum = index + 2; // Row 1 is header
    const rawId = (row['Mã học sinh (*)'] || row['Mã học sinh'] || row['Ma_HS'] || row['Mã HS'] || row['ID'] || '').toString().trim();
    const rawName = (row['Họ và tên (*)'] || row['Họ và tên'] || row['Họ tên'] || row['Ho_Ten'] || '').toString().trim();
    const rawGender = (row['Giới tính (*)'] || row['Giới tính'] || row['Gioi_Tinh'] || 'Nam').toString().trim();
    const rawDob = row['Ngày sinh (DD/MM/YYYY) (*)'] || row['Ngày sinh'] || row['Ngay_Sinh'] || '';
    const rawPhone = (row['Số điện thoại'] || row['SĐT'] || row['SDT'] || '').toString().trim();
    const rawParentPhone = (row['SĐT phụ huynh'] || row['SDT_Phu_Huynh'] || row['Điện thoại phụ huynh'] || '').toString().trim();
    const rawAddress = (row['Địa chỉ'] || row['Dia_Chi'] || '').toString().trim();
    const rawNotes = (row['Ghi chú'] || row['Ghi_Chu'] || '').toString().trim();

    if (!rawId) {
      errors.push({ row: rowNum, field: 'Mã học sinh', message: 'Mã học sinh không được để trống' });
      return;
    }

    if (!rawName) {
      errors.push({ row: rowNum, field: 'Họ và tên', message: 'Họ và tên không được để trống' });
      return;
    }

    const cleanId = rawId.toUpperCase();

    if (seenIdsInFile.has(cleanId)) {
      errors.push({ row: rowNum, field: 'Mã học sinh', message: `Mã học sinh ${cleanId} bị trùng lặp trong tệp Excel` });
      return;
    }
    seenIdsInFile.add(cleanId);

    if (existingStudents.some(s => s.id.toUpperCase() === cleanId)) {
      errors.push({ row: rowNum, field: 'Mã học sinh', message: `Mã học sinh ${cleanId} đã tồn tại trong danh sách lớp` });
      return;
    }

    const normalizedDob = normalizeDate(rawDob);
    if (!normalizedDob) {
      errors.push({ row: rowNum, field: 'Ngày sinh', message: `Ngày sinh "${rawDob}" không đúng định dạng DD/MM/YYYY` });
      return;
    }

    const gender: 'Nam' | 'Nữ' = rawGender.toLowerCase() === 'nữ' || rawGender.toLowerCase() === 'nu' ? 'Nữ' : 'Nam';

    validStudents.push({
      id: cleanId,
      fullName: rawName,
      gender,
      dob: normalizedDob,
      phone: rawPhone || 'Chưa cập nhật',
      parentPhone: rawParentPhone,
      address: rawAddress,
      notes: rawNotes,
    });
  });

  return { validStudents, errors };
}

// Export students to Excel
export function exportStudentsToExcel(students: Student[], settings: any) {
  const exportData = students.map((s, idx) => ({
    'STT': idx + 1,
    'Mã học sinh': s.id,
    'Họ và tên': s.fullName,
    'Giới tính': s.gender,
    'Ngày sinh': s.dob,
    'Số điện thoại': s.phone,
    'SĐT phụ huynh': s.parentPhone || '',
    'Vị trí ghế': s.seatCode || 'Chưa xếp',
    'Địa chỉ': s.address || '',
    'Ghi chú': s.notes || '',
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 25 },
    { wch: 12 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 30 },
    { wch: 20 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Lop_${settings.className}`);
  XLSX.writeFile(wb, `Danh_Sach_Lop_${settings.className}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// Download grade import template
export function downloadGradeTemplate(subjects: Subject[], students: Student[]) {
  const sampleData = [
    {
      'Mã học sinh (*)': students[0]?.id || 'HS1001',
      'Họ và tên': students[0]?.fullName || 'Nguyễn Minh Anh',
      'Mã môn học (*)': subjects[0]?.code || 'TOAN',
      'Tên môn': subjects[0]?.name || 'Toán học',
      'Học kỳ (*)': 'HK1',
      'Loại điểm (*)': 'tx', // tx: thường xuyên, gk: giữa kỳ, ck: cuối kỳ
      'Ngày đánh giá (DD/MM/YYYY)': '15/10/2026',
      'Điểm số hoặc Nhận xét (*)': '9.5',
      'Ghi chú': 'Kiểm tra 15 phút',
    },
    {
      'Mã học sinh (*)': students[1]?.id || 'HS1002',
      'Họ và tên': students[1]?.fullName || 'Trần Đức Bảo',
      'Mã môn học (*)': subjects[0]?.code || 'TOAN',
      'Tên môn': subjects[0]?.name || 'Toán học',
      'Học kỳ (*)': 'HK1',
      'Loại điểm (*)': 'gk',
      'Ngày đánh giá (DD/MM/YYYY)': '15/10/2026',
      'Điểm số hoặc Nhận xét (*)': '8.0',
      'Ghi chú': 'Kiểm tra giữa kỳ',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  ws['!cols'] = [
    { wch: 16 },
    { wch: 24 },
    { wch: 16 },
    { wch: 20 },
    { wch: 12 },
    { wch: 14 },
    { wch: 26 },
    { wch: 26 },
    { wch: 20 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Mau_Nhap_Diem');
  XLSX.writeFile(wb, 'Mau_Nhap_Bang_Diem.xlsx');
}

// Parse grade Excel
export function parseGradeExcel(
  fileData: ArrayBuffer,
  students: Student[],
  subjects: Subject[]
): { validGrades: GradeRecord[]; errors: ImportError[] } {
  const workbook = XLSX.read(fileData, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const validGrades: GradeRecord[] = [];
  const errors: ImportError[] = [];

  rawRows.forEach((row, index) => {
    const rowNum = index + 2;
    const rawStudentId = (row['Mã học sinh (*)'] || row['Mã học sinh'] || row['Ma_HS'] || '').toString().trim().toUpperCase();
    const rawSubjectCode = (row['Mã môn học (*)'] || row['Mã môn học'] || row['Môn học'] || row['Ma_Mon'] || '').toString().trim().toUpperCase();
    const rawSemester = (row['Học kỳ (*)'] || row['Học kỳ'] || 'HK1').toString().trim().toUpperCase();
    const rawType = (row['Loại điểm (*)'] || row['Loại điểm'] || 'tx').toString().trim().toLowerCase();
    const rawDate = row['Ngày đánh giá (DD/MM/YYYY)'] || row['Ngày đánh giá'] || '15/10/2026';
    const rawScoreVal = (row['Điểm số hoặc Nhận xét (*)'] || row['Điểm số'] || row['Giá trị điểm'] || row['Điểm'] || '').toString().trim();
    const rawNote = (row['Ghi chú'] || '').toString().trim();

    if (!rawStudentId) {
      errors.push({ row: rowNum, field: 'Mã học sinh', message: 'Mã học sinh không được để trống' });
      return;
    }

    const student = students.find(s => s.id.toUpperCase() === rawStudentId);
    if (!student) {
      errors.push({ row: rowNum, field: 'Mã học sinh', message: `Không tìm thấy học sinh có mã ${rawStudentId}` });
      return;
    }

    const subject = subjects.find(
      sub => sub.code.toUpperCase() === rawSubjectCode || sub.name.toLowerCase() === rawSubjectCode.toLowerCase()
    );
    if (!subject) {
      errors.push({ row: rowNum, field: 'Mã môn học', message: `Không tìm thấy môn học "${rawSubjectCode}"` });
      return;
    }

    const semester = rawSemester === 'HK2' ? 'HK2' : 'HK1';
    let type: 'tx' | 'gk' | 'ck' = 'tx';
    if (rawType.includes('gk') || rawType.includes('giữa kỳ') || rawType.includes('giua ky')) {
      type = 'gk';
    } else if (rawType.includes('ck') || rawType.includes('cuối kỳ') || rawType.includes('cuoi ky')) {
      type = 'ck';
    }

    let score: number | undefined = undefined;
    let evaluation: string | undefined = undefined;

    if (subject.evalType === 'score') {
      const parsedNum = parseFloat(rawScoreVal.replace(',', '.'));
      if (isNaN(parsedNum) || parsedNum < 0 || parsedNum > 10) {
        errors.push({ row: rowNum, field: 'Điểm số', message: `Điểm số "${rawScoreVal}" không hợp lệ (phải từ 0 đến 10)` });
        return;
      }
      score = Math.round(parsedNum * 10) / 10;
    } else {
      evaluation = rawScoreVal || 'Đạt';
    }

    const dateNorm = normalizeDate(rawDate) || '15/10/2026';
    const [d, m, y] = dateNorm.split('/');
    const isoDate = `${y}-${m}-${d}`;

    validGrades.push({
      id: `gr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      studentId: student.id,
      subjectId: subject.id,
      semester,
      type,
      date: isoDate,
      score,
      evaluation,
      note: rawNote,
    });
  });

  return { validGrades, errors };
}

// Export gradebook matrix to Excel
export function exportGradebookToExcel(classData: ClassData, semester: 'HK1' | 'HK2') {
  const activeSubjects = classData.subjects.filter(s => s.isActive);
  const rows = classData.students.map((student, idx) => {
    const rowObj: any = {
      'STT': idx + 1,
      'Mã HS': student.id,
      'Họ và tên': student.fullName,
    };

    let totalScoreSum = 0;
    let scoreSubjectCount = 0;

    activeSubjects.forEach(subject => {
      const studentGrades = classData.grades.filter(
        g => g.studentId === student.id && g.subjectId === subject.id && g.semester === semester
      );

      if (subject.evalType === 'score') {
        const scores = studentGrades.filter(g => g.score !== undefined).map(g => g.score as number);
        if (scores.length > 0) {
          const avg = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
          rowObj[subject.name] = avg;
          totalScoreSum += avg;
          scoreSubjectCount++;
        } else {
          rowObj[subject.name] = '-';
        }
      } else {
        const lastEval = studentGrades[studentGrades.length - 1];
        rowObj[subject.name] = lastEval?.evaluation || 'Chưa ĐG';
      }
    });

    rowObj['Điểm TB các môn'] = scoreSubjectCount > 0 ? (Math.round((totalScoreSum / scoreSubjectCount) * 10) / 10) : '-';
    return rowObj;
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Bang_Diem_${semester}`);
  XLSX.writeFile(wb, `Bang_Diem_${classData.settings.className}_${semester}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
