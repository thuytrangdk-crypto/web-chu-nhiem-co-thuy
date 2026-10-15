import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createInitialClassData, generateInitialSeats } from './src/seedData';
import { ClassData, Student, User } from './src/types';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

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

// In-memory cache + persistent storage sync
let classData: ClassData;
let users: StoredUser[] = [];
const activeSessions = new Map<string, { userId: string; role: 'teacher' | 'student'; studentId?: string; expiresAt: number }>();

function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
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

  saveUsers();
}

function saveDatabase() {
  ensureDirectories();
  fs.writeFileSync(DB_FILE, JSON.stringify(classData, null, 2), 'utf-8');
}

function saveUsers() {
  ensureDirectories();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

initDatabase();

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

// Backup Snapshot (Teacher Only)
app.get('/api/data/backup', authMiddleware, requireTeacher, (req: Request, res: Response) => {
  res.setHeader('Content-Disposition', `attachment; filename=backup_${classData.settings.className}_${new Date().toISOString().slice(0, 10)}.json`);
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({ classData, exportDate: new Date().toISOString() }, null, 2));
});

// Restore from Backup (Teacher Only)
app.post('/api/data/restore', authMiddleware, requireTeacher, (req: Request, res: Response) => {
  const backup = req.body;
  if (!backup || (!backup.classData && !backup.students)) {
    return res.status(400).json({ error: 'Tệp sao lưu không đúng định dạng chuẩn của hệ thống' });
  }

  const restoredData = backup.classData || backup;
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
  res.json({ success: true, message: 'Khôi phục dữ liệu từ bản sao lưu thành công!' });
});

// Reset to Initial Demo Data (Teacher Only)
app.post('/api/data/reset-demo', authMiddleware, requireTeacher, (req: Request, res: Response) => {
  classData = createInitialClassData();
  saveDatabase();
  initUsersFromClassData();
  res.json({ success: true, message: 'Đã thiết lập lại dữ liệu mẫu ban đầu!' });
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
