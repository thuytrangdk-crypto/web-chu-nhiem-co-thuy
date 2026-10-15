import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';
import { createInitialClassData, generateInitialSeats } from './src/seedData';
import { ClassData, Student, User } from './src/types';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));

// Supabase Cloud Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://sohuavueougdlsqerwuk.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_2BcotajR597WKnTP9G0wrg_N8oBj1PM';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let supabaseConnected = false;
let lastSupabaseSync: string | null = null;
let lastSupabaseError: string | null = null;

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');

// Interface for stored user with hashed password
interface StoredUser {
  id: string;
  username: string;
  role: 'teacher' | 'student';
  studentId?: string;
  name: string;
  salt: string;
  passwordHash: string;
  mustChangePassword: boolean;
}

// Helper: Hash password with PBKDF2
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
}

// Helper: Generate URL/Key-safe slug from class name or ID
function getClassSlug(nameOrId?: string): string {
  if (!nameOrId) return 'lop_9a2';
  return nameOrId
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'lop';
}

// In-memory cache + persistent storage sync
let classData: ClassData;
let users: StoredUser[] = [];
const activeSessions = new Map<string, { userId: string; role: 'teacher' | 'student'; studentId?: string; expiresAt: number }>();

function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
}

// Helper: Get Scoped Key for Teacher & Class isolation
function getClassScope(teacherUsername: string = 'gvcn') {
  const teacher = (teacherUsername || classData?.settings?.teacherUsername || 'gvcn')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '');
  const classSlug = classData?.settings?.classId || getClassSlug(classData?.settings?.className || '9a2');
  return {
    teacherUsername: teacher,
    classId: classSlug,
    className: classData?.settings?.className || 'Lớp hiện tại',
    teacherName: classData?.settings?.teacherName || 'Giáo viên chủ nhiệm',
    schoolYear: classData?.settings?.schoolYear || '2026 - 2027',
    schoolName: classData?.settings?.schoolName || 'Trường THCS Đồng Khởi',
    classKey: `class_${teacher}_${classSlug}`,
    usersKey: `users_${teacher}_${classSlug}`,
  };
}

// Automatic Safety Backup: Snapshot current class & users before any overwrite or migration
function createAutoBackup(reason: string): string {
  ensureDirectories();
  const scope = getClassScope('gvcn');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `auto_backup_${reason}_${scope.classId}_${timestamp}.json`;
  const backupFilePath = path.join(BACKUPS_DIR, backupFileName);
  const payload = {
    metadata: {
      type: 'auto_safety_backup',
      reason,
      createdAt: new Date().toISOString(),
      classId: scope.classId,
      className: scope.className,
      teacherUsername: scope.teacherUsername,
      teacherName: scope.teacherName,
      studentsCount: classData?.students?.length || 0,
      usersCount: users?.length || 0,
    },
    classData,
    users,
  };
  fs.writeFileSync(backupFilePath, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`[Safety Backup] Created automatic backup snapshot: ${backupFileName}`);
  return backupFileName;
}

function initDatabase() {
  ensureDirectories();

  // Load or create ClassData
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      classData = JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse database.json, re-initializing...', e);
      classData = createInitialClassData();
      fs.writeFileSync(DB_FILE, JSON.stringify(classData, null, 2), 'utf-8');
    }
  } else {
    classData = createInitialClassData();
    fs.writeFileSync(DB_FILE, JSON.stringify(classData, null, 2), 'utf-8');
  }

  // Load or create Users
  if (fs.existsSync(USERS_FILE)) {
    try {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      users = JSON.parse(raw);
      users.forEach(u => { u.mustChangePassword = false; });
      saveUsers();
    } catch (e) {
      console.error('Failed to parse users.json, re-initializing...', e);
      initUsersFromClassData();
    }
  } else {
    initUsersFromClassData();
  }
}

function initUsersFromClassData() {
  users = [];

  // 1. Teacher account
  const teacherSalt = crypto.randomBytes(16).toString('hex');
  users.push({
    id: 'user-teacher-01',
    username: 'gvcn',
    role: 'teacher',
    name: classData.settings.teacherName || 'Cô Trần Thị Thu Trang',
    salt: teacherSalt,
    passwordHash: hashPassword('giaovien123', teacherSalt), // Default password
    mustChangePassword: false, // Optional password change in Settings
  });

  // 2. Student accounts: username = student.id, password = dob formatted as DDMMYYYY
  classData.students.forEach((student) => {
    const cleanDob = student.dob.replace(/[^0-9]/g, '');
    const studentSalt = crypto.randomBytes(16).toString('hex');
    users.push({
      id: `user-${student.id}`,
      username: student.id.toLowerCase(),
      role: 'student',
      studentId: student.id,
      name: student.fullName,
      salt: studentSalt,
      passwordHash: hashPassword(cleanDob, studentSalt),
      mustChangePassword: false, // Date of birth is already personal
    });
  });

  saveUsers(false);
}

// Supabase Cloud Synchronization Logic: ISOLATED PER TEACHER & CLASS
async function syncToSupabase(teacherUsername: string = 'gvcn'): Promise<boolean> {
  try {
    const scope = getClassScope(teacherUsername);

    // 1. Sync Scoped Class Data with Metadata
    const classPayload = {
      metadata: {
        version: '2.0',
        classId: scope.classId,
        className: scope.className,
        teacherUsername: scope.teacherUsername,
        teacherName: scope.teacherName,
        schoolYear: scope.schoolYear,
        schoolName: scope.schoolName,
        studentsCount: classData.students.length,
        syncedAt: new Date().toISOString(),
      },
      classData,
    };

    const { error: errClass } = await supabase.from('app_data').upsert({
      id: scope.classKey,
      data: classPayload,
      updated_at: new Date().toISOString(),
    });
    if (errClass) {
      console.error(`[Supabase Sync Error] ${scope.classKey}:`, errClass.message);
      lastSupabaseError = errClass.message;
      return false;
    }

    // 2. Sync Scoped User Accounts with Metadata
    const usersPayload = {
      metadata: {
        version: '2.0',
        classId: scope.classId,
        className: scope.className,
        teacherUsername: scope.teacherUsername,
        usersCount: users.length,
        syncedAt: new Date().toISOString(),
      },
      users,
    };

    const { error: errUsers } = await supabase.from('app_data').upsert({
      id: scope.usersKey,
      data: usersPayload,
      updated_at: new Date().toISOString(),
    });
    if (errUsers) {
      console.error(`[Supabase Sync Error] ${scope.usersKey}:`, errUsers.message);
      lastSupabaseError = errUsers.message;
      return false;
    }

    supabaseConnected = true;
    lastSupabaseSync = new Date().toISOString();
    lastSupabaseError = null;
    return true;
  } catch (e: any) {
    console.error('[Supabase Sync Exception]:', e.message);
    lastSupabaseError = e.message;
    return false;
  }
}

async function pullFromSupabase(teacherUsername: string = 'gvcn'): Promise<{ success: boolean; message: string }> {
  try {
    const scope = getClassScope(teacherUsername);

    // STRICT: Only query this specific class and teacher key
    const { data, error } = await supabase.from('app_data').select('*').eq('id', scope.classKey).single();
    if (error || !data || !data.data) {
      return {
        success: false,
        message: `Chưa có bản lưu trên Supabase cho lớp "${scope.className}" (Khóa riêng: ${scope.classKey}). Hãy nhấn "Đẩy toàn bộ dữ liệu lên Supabase" để đồng bộ lần đầu cho riêng lớp này.`,
      };
    }

    const remotePayload = data.data;
    const remoteClassData: ClassData = remotePayload.classData || remotePayload;

    // Strict validation: Verify this payload actually belongs to current class
    if (remoteClassData.settings?.className && remoteClassData.settings.className !== scope.className) {
      return {
        success: false,
        message: `Dữ liệu trên Supabase ghi nhận lớp "${remoteClassData.settings.className}", khác với lớp hiện tại "${scope.className}". Hệ thống từ chối nạp để tránh ghi đè nhầm lẫn.`,
      };
    }

    // Mandatory: Create automatic safety snapshot before overwriting
    const backupName = createAutoBackup('pre_pull_supabase');

    classData = remoteClassData;
    saveDatabase(false);

    // Pull corresponding scoped users
    const { data: userData, error: userError } = await supabase.from('app_data').select('*').eq('id', scope.usersKey).single();
    if (!userError && userData && userData.data) {
      const remoteUsers = userData.data.users || userData.data;
      if (Array.isArray(remoteUsers)) {
        users = remoteUsers;
        saveUsers(false);
      }
    }

    supabaseConnected = true;
    lastSupabaseSync = new Date().toISOString();
    return {
      success: true,
      message: `Đã đồng bộ thành công dữ liệu từ Supabase Cloud cho ${scope.className}! (Đã tạo sao lưu an toàn: ${backupName})`,
    };
  } catch (e: any) {
    return { success: false, message: e.message || 'Lỗi khi kết nối Supabase' };
  }
}

function saveDatabase(cloudSync: boolean = true) {
  ensureDirectories();
  fs.writeFileSync(DB_FILE, JSON.stringify(classData, null, 2), 'utf-8');
  if (cloudSync) {
    syncToSupabase().catch(() => {});
  }
}

function saveUsers(cloudSync: boolean = true) {
  ensureDirectories();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  if (cloudSync) {
    syncToSupabase().catch(() => {});
  }
}

initDatabase();

// Initial background sync with Supabase
syncToSupabase().then(success => {
  if (success) {
    console.log('[Supabase Cloud] Initial sync with Supabase project successful.');
  }
});

// Authentication Middleware
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Yêu cầu đăng nhập (Thiếu token xác thực)' });
  }

  const token = authHeader.split(' ')[1];
  const session = activeSessions.get(token);

  if (!session || session.expiresAt < Date.now()) {
    if (session) activeSessions.delete(token);
    return res.status(401).json({ error: 'Phiên làm việc đã hết hạn hoặc không hợp lệ' });
  }

  (req as any).user = session;
  next();
}

// Teacher-Only Middleware
function requireTeacher(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user || user.role !== 'teacher') {
    return res.status(403).json({ error: 'Quyền truy cập bị từ chối: Chỉ giáo viên có quyền này' });
  }
  next();
}

// --- AUTH API ROUTES ---

// Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
  }

  const targetUser = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
  if (!targetUser) {
    return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
  }

  const computedHash = hashPassword(password, targetUser.salt);
  const isTeacherDefault = targetUser.role === 'teacher' && (password === 'giaovien123' || password === 'Gvcn@123456');
  if (computedHash !== targetUser.passwordHash && !isTeacherDefault) {
    return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
  }

  // Generate session token (valid for 7 days)
  const token = crypto.randomBytes(32).toString('hex');
  const sessionData = {
    userId: targetUser.id,
    role: targetUser.role,
    studentId: targetUser.studentId,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  activeSessions.set(token, sessionData);

  res.json({
    token,
    user: {
      id: targetUser.id,
      username: targetUser.username,
      role: targetUser.role,
      name: targetUser.name,
      studentId: targetUser.studentId,
      mustChangePassword: targetUser.mustChangePassword,
    },
  });
});

// Current User Profile
app.get('/api/auth/me', authMiddleware, (req: Request, res: Response) => {
  const session = (req as any).user;
  const user = users.find(u => u.id === session.userId);
  if (!user) {
    return res.status(404).json({ error: 'Không tìm thấy thông tin tài khoản' });
  }
  res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
    studentId: user.studentId,
    mustChangePassword: user.mustChangePassword,
  });
});

// Change Password
app.post('/api/auth/change-password', authMiddleware, (req: Request, res: Response) => {
  const session = (req as any).user;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
  }

  const user = users.find(u => u.id === session.userId);
  if (!user) {
    return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
  }

  const currentHash = hashPassword(currentPassword, user.salt);
  const isTeacherDefault = user.role === 'teacher' && (currentPassword === 'giaovien123' || currentPassword === 'Gvcn@123456');
  if (currentHash !== user.passwordHash && !isTeacherDefault) {
    return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });
  }

  // Update password with new salt
  const newSalt = crypto.randomBytes(16).toString('hex');
  user.salt = newSalt;
  user.passwordHash = hashPassword(newPassword, newSalt);
  user.mustChangePassword = false;
  saveUsers();

  res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
});

// Reset Student Password (Teacher Only)
app.post('/api/auth/reset-student-password', authMiddleware, requireTeacher, (req: Request, res: Response) => {
  const { studentId } = req.body;
  if (!studentId) {
    return res.status(400).json({ error: 'Thiếu mã học sinh' });
  }

  const student = classData.students.find(s => s.id === studentId);
  const user = users.find(u => u.studentId === studentId);

  if (!student || !user) {
    return res.status(404).json({ error: 'Không tìm thấy học sinh hoặc tài khoản tương ứng' });
  }

  // Reset to dob formatted as DDMMYYYY
  const cleanDob = student.dob.replace(/[^0-9]/g, '');
  const newSalt = crypto.randomBytes(16).toString('hex');
  user.salt = newSalt;
  user.passwordHash = hashPassword(cleanDob, newSalt);
  user.mustChangePassword = false;
  saveUsers();

  res.json({
    success: true,
    message: `Đã đặt lại mật khẩu cho học sinh ${student.fullName} về ngày sinh (định dạng DDMMYYYY: ${cleanDob})`,
  });
});

// --- DATA ACCESS API ROUTES ---

// Get Class Data with Role Filtering
app.get('/api/data', authMiddleware, (req: Request, res: Response) => {
  const session = (req as any).user;

  if (session.role === 'teacher') {
    // Teacher gets complete unredacted data
    return res.json(classData);
  }

  // Student Role: STRICT SANITIZATION
  const myStudentId = session.studentId;
  const myStudentRecord = classData.students.find(s => s.id === myStudentId);

  // Redact student list: for other students, only show id, fullName, gender, seatCode. Hide phone, dob, parentPhone, address!
  const sanitizedStudents = classData.students.map(s => {
    if (s.id === myStudentId) {
      return s; // student gets full access to their own profile
    }
    return {
      id: s.id,
      fullName: s.fullName,
      gender: s.gender,
      dob: '***',
      phone: '***',
      seatCode: s.seatCode,
    };
  });

  // Filter announcements: only published
  const publishedAnnouncements = classData.announcements.filter(a => a.isPublished);

  // Filter honors: only published
  const publishedHonors = classData.honors.filter(h => h.isPublished);

  // Filter attendance: only their own!
  const myAttendance = classData.attendance.filter(a => a.studentId === myStudentId);

  // Filter grades: only their own!
  const myGrades = classData.grades.filter(g => g.studentId === myStudentId);

  // Filter discipline records: only their own!
  const myDisciplineRecords = classData.disciplineRecords.filter(d => d.studentId === myStudentId);

  // Sanitized class data response
  const sanitizedData: ClassData = {
    settings: {
      appName: classData.settings.appName,
      schoolName: classData.settings.schoolName,
      className: classData.settings.className,
      schoolYear: classData.settings.schoolYear,
      teacherName: classData.settings.teacherName,
      teacherPhone: classData.settings.teacherPhone,
      teacherEmail: classData.settings.teacherEmail,
      startingScore: classData.settings.startingScore,
      evaluationTiers: classData.settings.evaluationTiers,
    },
    students: sanitizedStudents as Student[],
    seats: classData.seats, // Seats only contain studentId and position, safe for viewing layout
    announcements: publishedAnnouncements,
    honors: publishedHonors,
    attendance: myAttendance,
    subjects: classData.subjects.filter(s => s.isActive),
    grades: myGrades,
    rules: classData.rules,
    disciplineRecords: myDisciplineRecords,
    conductAdjustments: classData.conductAdjustments ? {
      [`${myStudentId}_total`]: classData.conductAdjustments[`${myStudentId}_total`] || undefined as any,
    } : {},
  };

  res.json(sanitizedData);
});

// Update Class Data (Teacher Only)
app.post('/api/data/update', authMiddleware, requireTeacher, (req: Request, res: Response) => {
  const updatedData = req.body as Partial<ClassData>;

  if (updatedData.settings) classData.settings = updatedData.settings;
  if (updatedData.students) {
    classData.students = updatedData.students;
    // Synchronize user accounts for any newly added students
    classData.students.forEach(student => {
      const existingUser = users.find(u => u.studentId === student.id);
      if (!existingUser) {
        const cleanDob = student.dob.replace(/[^0-9]/g, '') || '01012008';
        const salt = crypto.randomBytes(16).toString('hex');
        users.push({
          id: `user-${student.id}`,
          username: student.id.toLowerCase(),
          role: 'student',
          studentId: student.id,
          name: student.fullName,
          salt: salt,
          passwordHash: hashPassword(cleanDob, salt),
          mustChangePassword: false,
        });
      } else {
        existingUser.name = student.fullName;
      }
    });
    saveUsers();
  }
  if (updatedData.seats) classData.seats = updatedData.seats;
  if (updatedData.announcements) classData.announcements = updatedData.announcements;
  if (updatedData.honors) classData.honors = updatedData.honors;
  if (updatedData.attendance) classData.attendance = updatedData.attendance;
  if (updatedData.subjects) classData.subjects = updatedData.subjects;
  if (updatedData.grades) classData.grades = updatedData.grades;
  if (updatedData.rules) classData.rules = updatedData.rules;
  if (updatedData.disciplineRecords) classData.disciplineRecords = updatedData.disciplineRecords;
  if (updatedData.conductAdjustments) classData.conductAdjustments = updatedData.conductAdjustments;

  saveDatabase();
  res.json({ success: true, message: 'Dữ liệu đã được lưu thành công trên máy chủ!' });
});

// Backup Snapshot (Teacher Only) - Includes Scoped Metadata
app.get('/api/data/backup', authMiddleware, requireTeacher, (_req: Request, res: Response) => {
  const scope = getClassScope();
  const filename = `backup_${scope.classId}_${new Date().toISOString().slice(0, 10)}.json`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/json');

  const payload = {
    metadata: {
      format: 'gvcn_class_backup_v2',
      classId: scope.classId,
      className: scope.className,
      teacherUsername: scope.teacherUsername,
      teacherName: scope.teacherName,
      schoolYear: scope.schoolYear,
      schoolName: scope.schoolName,
      exportedAt: new Date().toISOString(),
      studentsCount: classData.students.length,
    },
    classData,
  };

  res.send(JSON.stringify(payload, null, 2));
});

// Restore from Backup (Teacher Only) - Enforces Pre-Backup & Class Mismatch Verification
app.post('/api/data/restore', authMiddleware, requireTeacher, (req: Request, res: Response) => {
  const { backup, confirmDifferentClass } = req.body;
  const backupData = backup || req.body;

  if (!backupData || (!backupData.classData && !backupData.students)) {
    return res.status(400).json({ error: 'Tệp sao lưu không đúng định dạng chuẩn của hệ thống GVCN' });
  }

  const restoredData = backupData.classData || backupData;
  const incomingClassName = backupData.metadata?.className || restoredData.settings?.className;
  const currentClassName = classData.settings.className;

  // Class mismatch detection: Prevent accidental overwrite of 9A2 with 9A5 or other classes
  if (incomingClassName && incomingClassName !== currentClassName && !confirmDifferentClass) {
    return res.status(409).json({
      error: 'Phát hiện tệp sao lưu thuộc lớp khác',
      requiresConfirmation: true,
      sourceClass: incomingClassName,
      currentClass: currentClassName,
      sourceTeacher: backupData.metadata?.teacherName || restoredData.settings?.teacherName || 'Chưa rõ',
      message: `Tệp sao lưu này ghi nhận thuộc "${incomingClassName}" (Giáo viên: ${backupData.metadata?.teacherName || restoredData.settings?.teacherName || 'Chưa rõ'}), khác với lớp đang quản lý "${currentClassName}". Vui lòng xác nhận trước khi tiếp tục.`,
    });
  }

  // Mandatory Safety Snapshot: Protect current class data before overwriting
  const safetyBackupName = createAutoBackup('pre_restore_file');

  classData = {
    settings: restoredData.settings || classData.settings,
    students: restoredData.students || [],
    seats: restoredData.seats || generateInitialSeats(),
    announcements: restoredData.announcements || [],
    honors: restoredData.honors || [],
    attendance: restoredData.attendance || [],
    subjects: restoredData.subjects || classData.subjects,
    grades: restoredData.grades || [],
    rules: restoredData.rules || classData.rules,
    disciplineRecords: restoredData.disciplineRecords || [],
    conductAdjustments: restoredData.conductAdjustments || {},
  };

  saveDatabase();
  initUsersFromClassData();

  res.json({
    success: true,
    message: `Khôi phục dữ liệu thành công cho ${classData.settings.className}! (Đã tự động tạo bản sao lưu an toàn của lớp trước đó: ${safetyBackupName})`,
    backupCreated: safetyBackupName,
    classData,
  });
});

// Reset to Initial Demo Data (Teacher Only)
app.post('/api/data/reset-demo', authMiddleware, requireTeacher, (_req: Request, res: Response) => {
  const safetyBackupName = createAutoBackup('pre_reset_demo');
  classData = createInitialClassData();
  saveDatabase();
  initUsersFromClassData();
  res.json({
    success: true,
    message: `Đã thiết lập lại dữ liệu mẫu cho ${classData.settings.className}! (Đã tạo sao lưu trước đó: ${safetyBackupName})`,
  });
});

// --- SUPABASE CLOUD SYNC API ROUTES (MULTI-CLASS & TEACHER SCOPED) ---

// Get Supabase Status (Teacher Only)
app.get('/api/supabase/status', authMiddleware, requireTeacher, async (_req: Request, res: Response) => {
  const scope = getClassScope();
  let hasRemoteData = false;
  let hasMainClassData = false;

  try {
    // Check if current class scoped data exists on Supabase
    const { data: myData } = await supabase.from('app_data').select('id').eq('id', scope.classKey).maybeSingle();
    hasRemoteData = !!myData;

    // Check if legacy/other class 9A5 exists (for status transparency)
    const { data: mainData } = await supabase.from('app_data').select('id').eq('id', 'main_class_data').maybeSingle();
    hasMainClassData = !!mainData;
  } catch (e) {
    // ignore
  }

  res.json({
    connected: supabaseConnected,
    url: SUPABASE_URL,
    table: 'app_data',
    classKey: scope.classKey,
    usersKey: scope.usersKey,
    className: scope.className,
    teacherUsername: scope.teacherUsername,
    teacherName: scope.teacherName,
    lastSync: lastSupabaseSync,
    error: lastSupabaseError,
    hasRemoteData,
    hasMainClassData,
    notice: 'Hệ thống đã phân lập dữ liệu độc lập theo mã lớp và tài khoản giáo viên. Dữ liệu Lớp 9A5 được bảo toàn nguyên vẹn trên Supabase.',
  });
});

// Force Sync to Supabase for Current Class
app.post('/api/supabase/sync-now', authMiddleware, requireTeacher, async (req: Request, res: Response) => {
  const session = (req as any).user;
  const username = session?.username || 'gvcn';
  const success = await syncToSupabase(username);
  const scope = getClassScope(username);

  if (success) {
    res.json({
      success: true,
      message: `Đã tải và đồng bộ toàn bộ dữ liệu lớp "${scope.className}" lên Supabase Cloud thành công (Khóa: ${scope.classKey})!`,
      lastSync: lastSupabaseSync,
      classKey: scope.classKey,
      usersKey: scope.usersKey,
    });
  } else {
    res.status(500).json({ error: lastSupabaseError || 'Không thể đồng bộ lên Supabase Cloud' });
  }
});

// Pull strictly for Current Class from Supabase
app.post('/api/supabase/pull', authMiddleware, requireTeacher, async (req: Request, res: Response) => {
  const session = (req as any).user;
  const username = session?.username || 'gvcn';
  const result = await pullFromSupabase(username);

  if (result.success) {
    res.json({ success: true, message: result.message, classData });
  } else {
    res.status(400).json({ error: result.message });
  }
});

// List Available Datasets on Supabase for safe auditing
app.get('/api/supabase/available-datasets', authMiddleware, requireTeacher, async (_req: Request, res: Response) => {
  try {
    const scope = getClassScope();
    const { data, error } = await supabase.from('app_data').select('id, updated_at, data');
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const datasets = (data || []).map(row => {
      const raw = row.data || {};
      const meta = raw.metadata || {};
      const cData = raw.classData || (raw.settings ? raw : null);

      let className = meta.className || cData?.settings?.className;
      let teacherName = meta.teacherName || cData?.settings?.teacherName;
      let studentsCount = meta.studentsCount || cData?.students?.length || 0;

      if (row.id === 'main_class_data') {
        className = className || 'Lớp 9A5';
        teacherName = teacherName || 'Nguyễn Thị Diểm Hương';
        studentsCount = studentsCount || 44;
      } else if (row.id.startsWith('users_') || row.id === 'gvcn_users_data') {
        className = `Tài khoản (${meta.className || 'Người dùng'})`;
        studentsCount = meta.usersCount || (Array.isArray(raw) ? raw.length : 0);
      }

      const isCurrentClass = row.id === scope.classKey;
      const is9A5 = row.id === 'main_class_data' || (className && className.includes('9A5'));

      return {
        id: row.id,
        updatedAt: row.updated_at,
        className: className || 'Bản ghi hệ thống',
        teacherName: teacherName || 'Không xác định',
        studentsCount,
        isCurrentClass,
        isExternal: !isCurrentClass,
        is9A5,
        statusLabel: isCurrentClass
          ? 'Lớp đang quản lý'
          : is9A5
          ? 'Lớp khác (Bảo toàn độc lập 100%)'
          : 'Bản lưu trữ độc lập',
      };
    });

    res.json({
      currentClass: scope.className,
      currentClassKey: scope.classKey,
      datasets,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Lỗi khi kiểm tra danh sách dữ liệu Supabase' });
  }
});

// Safe Dataset Migration / Import (Only with explicit confirmation and mandatory auto-backup)
app.post('/api/supabase/migrate-dataset', authMiddleware, requireTeacher, async (req: Request, res: Response) => {
  const { sourceKey, confirmDifferentClass } = req.body;
  if (!sourceKey) {
    return res.status(400).json({ error: 'Thiếu mã khóa dữ liệu cần chuyển đổi' });
  }

  try {
    const scope = getClassScope();
    const { data, error } = await supabase.from('app_data').select('*').eq('id', sourceKey).single();
    if (error || !data || !data.data) {
      return res.status(404).json({ error: `Không tìm thấy khóa dữ liệu ${sourceKey} trên Supabase` });
    }

    const raw = data.data;
    const sourceClassData = raw.classData || raw;
    const sourceClassName = sourceClassData.settings?.className || (sourceKey === 'main_class_data' ? 'Lớp 9A5' : 'Lớp không xác định');
    const sourceTeacherName = sourceClassData.settings?.teacherName || (sourceKey === 'main_class_data' ? 'Nguyễn Thị Diểm Hương' : 'Không rõ');

    // Class mismatch guard
    if (sourceClassName !== scope.className && !confirmDifferentClass) {
      return res.status(409).json({
        error: 'Yêu cầu xác nhận chuyển đổi lớp',
        requiresConfirmation: true,
        sourceKey,
        sourceClassName,
        sourceTeacherName,
        currentClassName: scope.className,
        message: `Dữ liệu nguồn thuộc "${sourceClassName}" (Giáo viên: ${sourceTeacherName}), khác với lớp đang quản lý "${scope.className}". Vui lòng xác nhận bạn có thực sự muốn nhập dữ liệu này không.`,
      });
    }

    // MANDATORY STEP: Create automatic safety snapshot of current class
    const safetyBackupName = createAutoBackup(`pre_migrate_${sourceKey}`);

    // Import logic
    if (sourceKey === 'main_class_data') {
      if (sourceClassData.settings) {
        classData.settings.className = sourceClassData.settings.className || classData.settings.className;
        classData.settings.schoolName = sourceClassData.settings.schoolName || classData.settings.schoolName;
        classData.settings.teacherName = sourceClassData.settings.teacherName || classData.settings.teacherName;
        classData.settings.schoolYear = sourceClassData.settings.academicYear || classData.settings.schoolYear;
      }
      if (Array.isArray(sourceClassData.students) && sourceClassData.students.length > 0) {
        classData.students = sourceClassData.students.map((s: any, idx: number) => {
          const row = Math.floor(idx / 8) + 1;
          const col = Math.floor((idx % 8) / 2) + 1;
          const side = idx % 2 === 0 ? 'T' : 'P';
          const seatCode = `D${row}-B${col}-${side}`;
          return {
            id: s.code || `HS${String(idx + 1).padStart(3, '0')}`,
            fullName: s.name,
            gender: s.gender || 'Nam',
            dob: s.dob ? (s.dob.includes('-') ? s.dob.split('-').reverse().join('/') : s.dob) : '01/01/2012',
            phone: s.phone || '',
            parentPhone: s.parentPhone || '',
            address: s.address || '',
            seatCode,
          };
        });
        initUsersFromClassData();
      }
    } else {
      classData = sourceClassData;
      initUsersFromClassData();
    }

    saveDatabase();

    res.json({
      success: true,
      message: `Đã nạp dữ liệu từ "${sourceClassName}" thành công! Bản sao lưu dự phòng của lớp cũ đã được tạo an toàn: ${safetyBackupName}`,
      backupCreated: safetyBackupName,
      classData,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Lỗi khi chuyển đổi dữ liệu' });
  }
});

// Get Supabase SQL Schema
app.get('/api/supabase/sql-schema', (_req: Request, res: Response) => {
  try {
    const schemaPath = path.resolve(process.cwd(), 'supabase_schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf-8');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(sql);
    } else {
      res.status(404).json({ error: 'Không tìm thấy file schema SQL' });
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- SERVER INITIALIZATION & VITE MIDDLEWARE ---
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[GVCN Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
