import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  ClassData,
  User,
  Student,
  SeatAssignment,
  Announcement,
  Honor,
  AttendanceRecord,
  AttendanceStatus,
  GradeRecord,
  DisciplineRule,
  DisciplineRecord,
  Subject,
  AppSettings,
} from '../types';
import { api } from '../api';
import confetti from 'canvas-confetti';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  user: User | null;
  classData: ClassData | null;
  isLoading: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedStudentId: string | null;
  studentProfileInitialTab: 'attendance' | 'academics' | 'discipline' | 'info';
  openStudentProfile: (studentId: string, initialTab?: 'attendance' | 'academics' | 'discipline' | 'info') => void;
  closeStudentProfile: () => void;
  toast: ToastState | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  triggerConfetti: () => void;

  // Auth
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  changePassword: (current: string, next: string) => Promise<void>;
  resetStudentPassword: (studentId: string) => Promise<string>;

  // Data Actions
  updateSettings: (settings: AppSettings) => Promise<void>;
  addStudent: (student: Omit<Student, 'seatCode'>) => Promise<void>;
  updateStudent: (student: Student) => Promise<void>;
  deleteStudent: (studentId: string) => Promise<void>;
  importStudents: (newStudents: Student[]) => Promise<void>;

  updateSeats: (seats: SeatAssignment[]) => Promise<void>;

  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt'>) => Promise<void>;
  updateAnnouncement: (announcement: Announcement) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  togglePinAnnouncement: (id: string) => Promise<void>;

  addHonor: (honor: Omit<Honor, 'id'>) => Promise<void>;
  updateHonor: (honor: Honor) => Promise<void>;
  deleteHonor: (id: string) => Promise<void>;

  setAttendance: (studentId: string, date: string, status: AttendanceStatus, note?: string) => Promise<void>;
  setBatchAttendance: (date: string, status: AttendanceStatus) => Promise<void>;

  addDisciplineRecord: (record: Omit<DisciplineRecord, 'id' | 'createdAt'>) => Promise<void>;
  updateDisciplineRecord: (record: DisciplineRecord) => Promise<void>;
  deleteDisciplineRecord: (id: string) => Promise<void>;
  adjustConduct: (studentId: string, period: string, adjustedTier: string, reason: string) => Promise<void>;

  addGrade: (grade: Omit<GradeRecord, 'id'>) => Promise<void>;
  updateGrade: (grade: GradeRecord) => Promise<void>;
  deleteGrade: (id: string) => Promise<void>;
  importGrades: (grades: GradeRecord[]) => Promise<void>;

  addRule: (rule: Omit<DisciplineRule, 'id'>) => Promise<void>;
  updateRule: (rule: DisciplineRule) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;

  addSubject: (subject: Omit<Subject, 'id'>) => Promise<void>;
  updateSubject: (subject: Subject) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;

  restoreData: (jsonData: any, confirmDifferentClass?: boolean) => Promise<{ success: boolean; message: string; backupCreated?: string }>;
  resetDemoData: () => Promise<void>;
  refreshData: () => Promise<void>;

  // Supabase Cloud Sync (Multi-class isolated)
  supabaseStatus: {
    connected: boolean;
    url: string;
    table: string;
    classKey: string;
    usersKey: string;
    className: string;
    teacherUsername: string;
    teacherName: string;
    lastSync: string | null;
    error: string | null;
    hasRemoteData: boolean;
    hasMainClassData: boolean;
    notice: string;
  } | null;
  checkSupabaseStatus: () => Promise<any>;
  syncWithSupabaseNow: () => Promise<void>;
  pullFromSupabase: () => Promise<void>;
  getAvailableDatasets: () => Promise<any>;
  migrateSupabaseDataset: (sourceKey: string, confirmDifferentClass?: boolean) => Promise<any>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentProfileInitialTab, setStudentProfileInitialTab] = useState<'attendance' | 'academics' | 'discipline' | 'info'>('attendance');
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 3800);
  }, []);

  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3289C7', '#60A5FA', '#FBBF24', '#34D399', '#F472B6'],
      });
    } catch (e) {
      // safe fallback
    }
  }, []);

  // Sync state to server
  const persistChanges = async (partial: Partial<ClassData>) => {
    try {
      await api.updateData(partial);
    } catch (e: any) {
      showToast(e.message || 'Lỗi đồng bộ máy chủ', 'error');
      throw e;
    }
  };

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const token = api.getToken();
      if (token) {
        const me = await api.getMe();
        setUser(me);
        const data = await api.getData();
        setClassData(data);
      }
    } catch (err: any) {
      console.warn('Initial session error or not logged in:', err.message);
      api.clearToken();
      setUser(null);
      setClassData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const [supabaseStatus, setSupabaseStatus] = useState<{
    connected: boolean;
    url: string;
    table: string;
    classKey: string;
    usersKey: string;
    className: string;
    teacherUsername: string;
    teacherName: string;
    lastSync: string | null;
    error: string | null;
    hasRemoteData: boolean;
    hasMainClassData: boolean;
    notice: string;
  } | null>(null);

  const checkSupabaseStatus = useCallback(async () => {
    try {
      const status = await api.getSupabaseStatus();
      setSupabaseStatus(status);
      return status;
    } catch (e: any) {
      console.warn('Supabase status check failed:', e.message);
      return null;
    }
  }, []);

  const syncWithSupabaseNow = async () => {
    try {
      const res = await api.syncSupabaseNow();
      showToast(res.message, 'success');
      await checkSupabaseStatus();
    } catch (e: any) {
      showToast(e.message || 'Lỗi đồng bộ Supabase Cloud', 'error');
    }
  };

  const pullFromSupabase = async () => {
    try {
      const res = await api.pullSupabase();
      if (res.classData) {
        setClassData(res.classData);
      } else {
        await refreshData();
      }
      showToast(res.message, 'success');
      await checkSupabaseStatus();
    } catch (e: any) {
      showToast(e.message || 'Lỗi tải từ Supabase Cloud', 'error');
    }
  };

  const getAvailableDatasets = async () => {
    return await api.getSupabaseAvailableDatasets();
  };

  const migrateSupabaseDataset = async (sourceKey: string, confirmDifferentClass: boolean = false) => {
    try {
      const res = await api.migrateSupabaseDataset(sourceKey, confirmDifferentClass);
      if (res.classData) {
        setClassData(res.classData);
      } else {
        await refreshData();
      }
      showToast(res.message, 'success');
      await checkSupabaseStatus();
      return res;
    } catch (e: any) {
      showToast(e.message || 'Lỗi nạp từ Supabase', 'error');
      throw e;
    }
  };

  const refreshData = async () => {
    try {
      const data = await api.getData();
      setClassData(data);
      checkSupabaseStatus().catch(() => {});
    } catch (e: any) {
      showToast(e.message || 'Lỗi tải lại dữ liệu', 'error');
    }
  };

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(username, password);
      setUser(res.user);
      const data = await api.getData();
      setClassData(data);
      showToast(`Xin chào ${res.user.name}! Đăng nhập thành công.`, 'success');
      if (res.user.role === 'student') {
        setActiveTab('bulletin_seating'); // Default student to bulletin & seating or personal profile
      } else {
        setActiveTab('overview');
      }
    } catch (err: any) {
      showToast(err.message || 'Đăng nhập không thành công', 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
    setClassData(null);
    setSelectedStudentId(null);
    showToast('Đã đăng xuất khỏi hệ thống', 'info');
  };

  const changePassword = async (current: string, next: string) => {
    const res = await api.changePassword(current, next);
    if (user) {
      setUser({ ...user, mustChangePassword: false });
    }
    showToast(res.message, 'success');
  };

  const resetStudentPassword = async (studentId: string): Promise<string> => {
    const res = await api.resetStudentPassword(studentId);
    showToast(res.message, 'success');
    return res.message;
  };

  const openStudentProfile = (studentId: string, initialTab: 'attendance' | 'academics' | 'discipline' | 'info' = 'attendance') => {
    setSelectedStudentId(studentId);
    setStudentProfileInitialTab(initialTab);
  };

  const closeStudentProfile = () => {
    setSelectedStudentId(null);
  };

  // --- MUTATION IMPLEMENTATIONS ---

  const updateSettings = async (settings: AppSettings) => {
    if (!classData) return;
    const updated = { ...classData, settings };
    setClassData(updated);
    await persistChanges({ settings });
    showToast('Cài đặt đã được lưu và áp dụng ngay!', 'success');
  };

  const addStudent = async (studentData: Omit<Student, 'seatCode'>) => {
    if (!classData) return;
    const newStudent: Student = {
      ...studentData,
      id: studentData.id.trim().toUpperCase(),
    };
    const updatedStudents = [...classData.students, newStudent];
    setClassData({ ...classData, students: updatedStudents });
    await persistChanges({ students: updatedStudents });
    showToast(`Đã thêm học sinh ${newStudent.fullName} (${newStudent.id})`, 'success');
  };

  const updateStudent = async (student: Student) => {
    if (!classData) return;
    const updatedStudents = classData.students.map(s => (s.id === student.id ? student : s));
    setClassData({ ...classData, students: updatedStudents });
    await persistChanges({ students: updatedStudents });
    showToast(`Đã cập nhật hồ sơ ${student.fullName}`, 'success');
  };

  const deleteStudent = async (studentId: string) => {
    if (!classData) return;
    const student = classData.students.find(s => s.id === studentId);
    const updatedStudents = classData.students.filter(s => s.id !== studentId);
    // Unassign seat if assigned
    const updatedSeats = classData.seats.map(seat =>
      seat.studentId === studentId ? { ...seat, studentId: null } : seat
    );
    // Clean up attendance, grades, honors, discipline for this student
    const updatedAttendance = classData.attendance.filter(a => a.studentId !== studentId);
    const updatedGrades = classData.grades.filter(g => g.studentId !== studentId);
    const updatedHonors = classData.honors.filter(h => h.studentId !== studentId);
    const updatedDiscipline = classData.disciplineRecords.filter(d => d.studentId !== studentId);

    const nextData = {
      ...classData,
      students: updatedStudents,
      seats: updatedSeats,
      attendance: updatedAttendance,
      grades: updatedGrades,
      honors: updatedHonors,
      disciplineRecords: updatedDiscipline,
    };
    setClassData(nextData);
    await persistChanges(nextData);
    if (selectedStudentId === studentId) setSelectedStudentId(null);
    showToast(`Đã xóa học sinh ${student?.fullName || studentId}`, 'info');
  };

  const importStudents = async (newStudents: Student[]) => {
    if (!classData) return;
    const updatedStudents = [...classData.students, ...newStudents];
    setClassData({ ...classData, students: updatedStudents });
    await persistChanges({ students: updatedStudents });
    showToast(`Đã nhập thành công ${newStudents.length} học sinh vào lớp!`, 'success');
  };

  const updateSeats = async (seats: SeatAssignment[]) => {
    if (!classData) return;
    // Also sync seatCode to students
    const updatedStudents = classData.students.map(st => {
      const seat = seats.find(s => s.studentId === st.id);
      return {
        ...st,
        seatCode: seat ? seat.seatCode : undefined,
      };
    });

    const nextData = {
      ...classData,
      seats,
      students: updatedStudents,
    };
    setClassData(nextData);
    await persistChanges({ seats, students: updatedStudents });
    showToast('Đã lưu bố trí sơ đồ lớp thành công!', 'success');
  };

  const addAnnouncement = async (announcementData: Omit<Announcement, 'id' | 'createdAt'>) => {
    if (!classData) return;
    const newAnn: Announcement = {
      ...announcementData,
      id: `ann-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newAnn, ...classData.announcements];
    setClassData({ ...classData, announcements: updated });
    await persistChanges({ announcements: updated });
    showToast('Đã đăng thông báo thành công!', 'success');
  };

  const updateAnnouncement = async (announcement: Announcement) => {
    if (!classData) return;
    const updated = classData.announcements.map(a => (a.id === announcement.id ? announcement : a));
    setClassData({ ...classData, announcements: updated });
    await persistChanges({ announcements: updated });
    showToast('Đã cập nhật thông báo!', 'success');
  };

  const deleteAnnouncement = async (id: string) => {
    if (!classData) return;
    const updated = classData.announcements.filter(a => a.id !== id);
    setClassData({ ...classData, announcements: updated });
    await persistChanges({ announcements: updated });
    showToast('Đã xóa thông báo', 'info');
  };

  const togglePinAnnouncement = async (id: string) => {
    if (!classData) return;
    const updated = classData.announcements.map(a => (a.id === id ? { ...a, isPinned: !a.isPinned } : a));
    setClassData({ ...classData, announcements: updated });
    await persistChanges({ announcements: updated });
    showToast('Đã cập nhật trạng thái ghim bảng tin', 'info');
  };

  const addHonor = async (honorData: Omit<Honor, 'id'>) => {
    if (!classData) return;
    const newHonor: Honor = {
      ...honorData,
      id: `hon-${Date.now()}`,
    };
    const updated = [newHonor, ...classData.honors];
    setClassData({ ...classData, honors: updated });
    await persistChanges({ honors: updated });
    triggerConfetti();
    showToast(`Đã thêm vinh danh cho học sinh ${honorData.studentName}!`, 'success');
  };

  const updateHonor = async (honor: Honor) => {
    if (!classData) return;
    const updated = classData.honors.map(h => (h.id === honor.id ? honor : h));
    setClassData({ ...classData, honors: updated });
    await persistChanges({ honors: updated });
    showToast('Đã cập nhật vinh danh!', 'success');
  };

  const deleteHonor = async (id: string) => {
    if (!classData) return;
    const updated = classData.honors.filter(h => h.id !== id);
    setClassData({ ...classData, honors: updated });
    await persistChanges({ honors: updated });
    showToast('Đã xóa bản vinh danh', 'info');
  };

  const setAttendance = async (studentId: string, date: string, status: AttendanceStatus, note?: string) => {
    if (!classData) return;
    const existingIndex = classData.attendance.findIndex(a => a.studentId === studentId && a.date === date);
    let updated: AttendanceRecord[];

    if (existingIndex >= 0) {
      updated = [...classData.attendance];
      updated[existingIndex] = {
        ...updated[existingIndex],
        status,
        note: note !== undefined ? note : updated[existingIndex].note,
      };
    } else {
      updated = [
        ...classData.attendance,
        {
          id: `att-${Date.now()}-${studentId}`,
          studentId,
          date,
          status,
          note,
        },
      ];
    }

    setClassData({ ...classData, attendance: updated });
    await persistChanges({ attendance: updated });
  };

  const setBatchAttendance = async (date: string, status: AttendanceStatus) => {
    if (!classData) return;
    const updatedAttendance = [...classData.attendance];

    classData.students.forEach(student => {
      const idx = updatedAttendance.findIndex(a => a.studentId === student.id && a.date === date);
      if (idx >= 0) {
        updatedAttendance[idx] = {
          ...updatedAttendance[idx],
          status,
        };
      } else {
        updatedAttendance.push({
          id: `att-${Date.now()}-${student.id}`,
          studentId: student.id,
          date,
          status,
        });
      }
    });

    setClassData({ ...classData, attendance: updatedAttendance });
    await persistChanges({ attendance: updatedAttendance });
    showToast(`Đã điểm danh cả lớp ngày ${date}: ${status === 'present' ? 'Có mặt' : status}`, 'success');
  };

  // Discipline records with automatic attendance sync
  const addDisciplineRecord = async (recordData: Omit<DisciplineRecord, 'id' | 'createdAt'>) => {
    if (!classData) return;
    const newRecordId = `disc-${Date.now()}`;
    const newRecord: DisciplineRecord = {
      ...recordData,
      id: newRecordId,
      createdAt: new Date().toISOString(),
    };

    const updatedRecords = [newRecord, ...classData.disciplineRecords];

    // Check if rule has linkAttendance
    const rule = classData.rules.find(r => r.id === recordData.ruleId);
    let updatedAttendance = [...classData.attendance];

    if (rule && rule.linkAttendance !== 'none') {
      const attStatus = rule.linkAttendance as AttendanceStatus;
      const attIdx = updatedAttendance.findIndex(a => a.studentId === recordData.studentId && a.date === recordData.date);

      if (attIdx >= 0) {
        updatedAttendance[attIdx] = {
          ...updatedAttendance[attIdx],
          status: attStatus,
          note: recordData.note || rule.title,
          linkedDisciplineId: newRecordId,
        };
      } else {
        updatedAttendance.push({
          id: `att-link-${newRecordId}`,
          studentId: recordData.studentId,
          date: recordData.date,
          status: attStatus,
          note: recordData.note || rule.title,
          linkedDisciplineId: newRecordId,
        });
      }
    }

    const nextData = {
      ...classData,
      disciplineRecords: updatedRecords,
      attendance: updatedAttendance,
    };

    setClassData(nextData);
    await persistChanges(nextData);
    showToast(`Đã lưu ghi nhận thi đua: ${recordData.ruleTitle} (${recordData.points > 0 ? '+' : ''}${recordData.points}đ)`, 'success');
  };

  const updateDisciplineRecord = async (record: DisciplineRecord) => {
    if (!classData) return;
    const oldRecord = classData.disciplineRecords.find(d => d.id === record.id);
    const updatedRecords = classData.disciplineRecords.map(d => (d.id === record.id ? record : d));

    let updatedAttendance = [...classData.attendance];
    const rule = classData.rules.find(r => r.id === record.ruleId);

    // If attendance was linked, update it
    if (oldRecord) {
      const attIdx = updatedAttendance.findIndex(a => a.linkedDisciplineId === record.id);
      if (rule && rule.linkAttendance !== 'none') {
        const attStatus = rule.linkAttendance as AttendanceStatus;
        if (attIdx >= 0) {
          updatedAttendance[attIdx] = {
            ...updatedAttendance[attIdx],
            studentId: record.studentId,
            date: record.date,
            status: attStatus,
            note: record.note || rule.title,
          };
        } else {
          updatedAttendance.push({
            id: `att-link-${record.id}`,
            studentId: record.studentId,
            date: record.date,
            status: attStatus,
            note: record.note || rule.title,
            linkedDisciplineId: record.id,
          });
        }
      } else if (attIdx >= 0) {
        // Unlink rule now has no attendance mapping
        updatedAttendance[attIdx] = {
          ...updatedAttendance[attIdx],
          linkedDisciplineId: undefined,
        };
      }
    }

    const nextData = {
      ...classData,
      disciplineRecords: updatedRecords,
      attendance: updatedAttendance,
    };

    setClassData(nextData);
    await persistChanges(nextData);
    showToast('Đã cập nhật bản ghi thi đua!', 'success');
  };

  const deleteDisciplineRecord = async (id: string) => {
    if (!classData) return;
    const updatedRecords = classData.disciplineRecords.filter(d => d.id !== id);

    // Revert or unlink associated attendance record
    const updatedAttendance = classData.attendance.map(a => {
      if (a.linkedDisciplineId === id) {
        return {
          ...a,
          status: 'present' as AttendanceStatus,
          note: undefined,
          linkedDisciplineId: undefined,
        };
      }
      return a;
    });

    const nextData = {
      ...classData,
      disciplineRecords: updatedRecords,
      attendance: updatedAttendance,
    };

    setClassData(nextData);
    await persistChanges(nextData);
    showToast('Đã xóa ghi nhận thi đua và đồng bộ lại điểm danh!', 'info');
  };

  const adjustConduct = async (studentId: string, period: string, adjustedTier: string, reason: string) => {
    if (!classData) return;
    const currentAdjustments = { ...(classData.conductAdjustments || {}) };
    const key = `${studentId}_${period}`;
    currentAdjustments[key] = { adjustedTier, reason };

    const nextData = {
      ...classData,
      conductAdjustments: currentAdjustments,
    };
    setClassData(nextData);
    await persistChanges({ conductAdjustments: currentAdjustments });
    showToast('Đã lưu kết quả rèn luyện được điều chỉnh!', 'success');
  };

  const addGrade = async (gradeData: Omit<GradeRecord, 'id'>) => {
    if (!classData) return;
    const newGrade: GradeRecord = {
      ...gradeData,
      id: `gr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    const updated = [...classData.grades, newGrade];
    setClassData({ ...classData, grades: updated });
    await persistChanges({ grades: updated });
    showToast('Đã lưu điểm thành công!', 'success');
  };

  const updateGrade = async (grade: GradeRecord) => {
    if (!classData) return;
    const updated = classData.grades.map(g => (g.id === grade.id ? grade : g));
    setClassData({ ...classData, grades: updated });
    await persistChanges({ grades: updated });
    showToast('Đã cập nhật điểm đánh giá!', 'success');
  };

  const deleteGrade = async (id: string) => {
    if (!classData) return;
    const updated = classData.grades.filter(g => g.id !== id);
    setClassData({ ...classData, grades: updated });
    await persistChanges({ grades: updated });
    showToast('Đã xóa điểm', 'info');
  };

  const importGrades = async (newGrades: GradeRecord[]) => {
    if (!classData) return;
    const updated = [...classData.grades, ...newGrades];
    setClassData({ ...classData, grades: updated });
    await persistChanges({ grades: updated });
    showToast(`Đã nhập thành công ${newGrades.length} đầu điểm vào sổ!`, 'success');
  };

  const addRule = async (ruleData: Omit<DisciplineRule, 'id'>) => {
    if (!classData) return;
    const newRule: DisciplineRule = {
      ...ruleData,
      id: `r-${Date.now()}`,
    };
    const updated = [...classData.rules, newRule];
    setClassData({ ...classData, rules: updated });
    await persistChanges({ rules: updated });
    showToast(`Đã thêm quy tắc thi đua: ${newRule.title}`, 'success');
  };

  const updateRule = async (rule: DisciplineRule) => {
    if (!classData) return;
    const updated = classData.rules.map(r => (r.id === rule.id ? rule : r));
    setClassData({ ...classData, rules: updated });
    await persistChanges({ rules: updated });
    showToast(`Đã cập nhật quy tắc thi đua: ${rule.title}`, 'success');
  };

  const deleteRule = async (id: string) => {
    if (!classData) return;
    // Check if rule is in use
    const inUse = classData.disciplineRecords.some(d => d.ruleId === id);
    if (inUse) {
      const confirmDel = window.confirm(
        'Quy tắc này đã có bản ghi thi đua phát sinh trong lịch sử. Bạn có chắc chắn muốn xóa không? Điểm đã ghi trong quá khứ sẽ vẫn được bảo lưu.'
      );
      if (!confirmDel) return;
    }
    const updated = classData.rules.filter(r => r.id !== id);
    setClassData({ ...classData, rules: updated });
    await persistChanges({ rules: updated });
    showToast('Đã xóa quy tắc thi đua', 'info');
  };

  const addSubject = async (subjectData: Omit<Subject, 'id'>) => {
    if (!classData) return;
    const newSub: Subject = {
      ...subjectData,
      id: `sub-${Date.now()}`,
    };
    const updated = [...classData.subjects, newSub];
    setClassData({ ...classData, subjects: updated });
    await persistChanges({ subjects: updated });
    showToast(`Đã thêm môn học: ${newSub.name}`, 'success');
  };

  const updateSubject = async (subject: Subject) => {
    if (!classData) return;
    const updated = classData.subjects.map(s => (s.id === subject.id ? subject : s));
    setClassData({ ...classData, subjects: updated });
    await persistChanges({ subjects: updated });
    showToast(`Đã cập nhật môn ${subject.name}`, 'success');
  };

  const deleteSubject = async (id: string) => {
    if (!classData) return;
    const hasGrades = classData.grades.some(g => g.subjectId === id);
    if (hasGrades) {
      const confirmed = window.confirm(
        'CẢNH BÁO: Môn học này đã có dữ liệu điểm trong sổ điểm! Việc xóa môn học sẽ xóa toàn bộ các điểm số liên quan. Bạn có chắc chắn muốn xóa?'
      );
      if (!confirmed) return;
    }
    const updatedSubjects = classData.subjects.filter(s => s.id !== id);
    const updatedGrades = classData.grades.filter(g => g.subjectId !== id);
    const nextData = {
      ...classData,
      subjects: updatedSubjects,
      grades: updatedGrades,
    };
    setClassData(nextData);
    await persistChanges(nextData);
    showToast('Đã xóa môn học thành công', 'info');
  };

  const restoreData = async (jsonData: any, confirmDifferentClass: boolean = false) => {
    setIsLoading(true);
    try {
      const res = await api.restoreData(jsonData, confirmDifferentClass);
      await refreshData();
      showToast(res.message || 'Đã khôi phục dữ liệu lớp học thành công!', 'success');
      return res;
    } catch (e: any) {
      showToast(e.message || 'Lỗi khôi phục dữ liệu', 'error');
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const resetDemoData = async () => {
    setIsLoading(true);
    try {
      await api.resetDemoData();
      await refreshData();
      showToast('Đã thiết lập lại dữ liệu mẫu lớp học thành công!', 'success');
    } catch (e: any) {
      showToast(e.message || 'Lỗi thiết lập dữ liệu mẫu', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        classData,
        isLoading,
        activeTab,
        setActiveTab,
        selectedStudentId,
        studentProfileInitialTab,
        openStudentProfile,
        closeStudentProfile,
        toast,
        showToast,
        triggerConfetti,
        login,
        logout,
        changePassword,
        resetStudentPassword,
        updateSettings,
        addStudent,
        updateStudent,
        deleteStudent,
        importStudents,
        updateSeats,
        addAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        togglePinAnnouncement,
        addHonor,
        updateHonor,
        deleteHonor,
        setAttendance,
        setBatchAttendance,
        addDisciplineRecord,
        updateDisciplineRecord,
        deleteDisciplineRecord,
        adjustConduct,
        addGrade,
        updateGrade,
        deleteGrade,
        importGrades,
        addRule,
        updateRule,
        deleteRule,
        addSubject,
        updateSubject,
        deleteSubject,
        restoreData,
        resetDemoData,
        refreshData,
        supabaseStatus,
        checkSupabaseStatus,
        syncWithSupabaseNow,
        pullFromSupabase,
        getAvailableDatasets,
        migrateSupabaseDataset,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
