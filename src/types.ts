export type Role = 'teacher' | 'student';

export interface User {
  id: string;
  username: string;
  role: Role;
  studentId?: string;
  name: string;
  mustChangePassword?: boolean;
}

export interface Student {
  id: string; // Mã học sinh (e.g. HS1001)
  fullName: string;
  gender: 'Nam' | 'Nữ';
  dob: string; // DD/MM/YYYY
  phone: string;
  parentPhone?: string;
  address?: string;
  notes?: string;
  seatCode?: string; // e.g. D1-B1-T
}

export type AttendanceStatus = 'present' | 'excused' | 'unexcused' | 'late';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  note?: string;
  linkedDisciplineId?: string;
}

export type GradeType = 'tx' | 'gk' | 'ck'; // Thường xuyên, Giữa kỳ, Cuối kỳ
export type Semester = 'HK1' | 'HK2';

export interface Subject {
  id: string;
  code: string;
  name: string;
  periodsPerWeek: number;
  evalType: 'score' | 'comment'; // Điểm số hoặc Nhận xét
  isActive: boolean;
  order: number;
}

export interface GradeRecord {
  id: string;
  studentId: string;
  subjectId: string;
  semester: Semester;
  type: GradeType;
  date: string; // YYYY-MM-DD
  score?: number; // 0 to 10
  evaluation?: string; // 'Đạt' | 'Chưa đạt' | text comment
  note?: string;
}

export type DisciplineGroup = 'Nề nếp' | 'Chuyên cần' | 'Học tập' | 'Phong trào' | 'Khác';

export interface DisciplineRule {
  id: string;
  code: string;
  title: string;
  group: DisciplineGroup;
  points: number; // e.g. +5 or -3
  linkAttendance: 'none' | 'late' | 'unexcused' | 'excused';
  description?: string;
}

export interface DisciplineRecord {
  id: string;
  studentId: string;
  ruleId: string;
  ruleTitle: string;
  group: string;
  points: number; // Điểm tại thời điểm ghi nhận
  date: string; // YYYY-MM-DD
  note?: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string; // ISO string
  author: string;
  isPinned: boolean;
  isPublished: boolean;
  tag: 'Thông báo chung' | 'Học tập' | 'Thi đua' | 'Lịch sinh hoạt' | 'Khẩn';
}

export type BadgeType = 'gold_cup' | 'silver_medal' | 'star' | 'good_study' | 'good_deed' | 'creative';

export interface Honor {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  badge: BadgeType;
  isPublished: boolean;
}

export interface AppSettings {
  appName: string;
  schoolName: string;
  className: string;
  schoolYear: string;
  teacherName: string;
  teacherPhone: string;
  teacherEmail: string;
  startingScore: number; // Điểm khởi tạo kỳ đánh giá (mặc định 100 hoặc 0)
  evaluationTiers: {
    excellent: number; // >= 90 Tốt
    good: number;      // >= 75 Khá
    average: number;   // >= 50 Đạt
  };
}

// Seat configuration: 4 columns, 7 rows, 2 seats per table = 56 seats
export interface SeatAssignment {
  seatCode: string; // D1-B1-T, D1-B1-P, etc.
  column: number;   // 1 to 4
  row: number;      // 1 to 7
  position: 'T' | 'P'; // Trái, Phải
  studentId: string | null;
}

export interface ClassData {
  settings: AppSettings;
  students: Student[];
  seats: SeatAssignment[];
  announcements: Announcement[];
  honors: Honor[];
  attendance: AttendanceRecord[];
  subjects: Subject[];
  grades: GradeRecord[];
  rules: DisciplineRule[];
  disciplineRecords: DisciplineRecord[];
  conductAdjustments?: Record<string, { adjustedTier: string; reason: string }>; // studentId_period -> adjustment
}
