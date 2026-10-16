import express, { type Request, type Response, type NextFunction } from 'express';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { createInitialClassData, generateInitialSeats } from '../src/seedData.js';
import type { ClassData, Student } from '../src/types.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '3mb' }));
app.use('/api', (_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
app.get('/api/health', (_req, res) => res.json({ ok: true, build: 'gvcn-vercel-fix-v1' }));

interface StoredUser {
  id: string; username: string; role: 'teacher' | 'student'; studentId?: string;
  name: string; salt: string; passwordHash: string; mustChangePassword: boolean;
}
interface State { classData: ClassData; users: StoredUser[] }
let classData: ClassData;
let users: StoredUser[] = [];
let version = 0;
let dirty = false;
let exists = false;
let lastSavedAt: string | null = null;
let pendingBackups: { id: string; scope: string; data: State; reason: string }[] = [];
function scopeId() {
  const id = process.env.APP_DATA_SCOPE;
  if (!id || !/^[a-zA-Z0-9_-]{8,120}$/.test(id)) throw new Error('Cần đặt APP_DATA_SCOPE riêng, ít nhất 8 ký tự chữ/số/gạch nối.');
  return id;
}
function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('Cần đặt SESSION_SECRET dài ít nhất 32 ký tự.');
  return value;
}
function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Thiếu SUPABASE_URL hoặc SUPABASE_SECRET_KEY (chỉ đặt ở backend Vercel).');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
function hashPassword(password: string, salt: string) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
}
function safeEqual(a: string, b: string) {
  return a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
function signSession(user: StoredUser) {
  const payload = Buffer.from(JSON.stringify({ uid: user.id, scope: scopeId(),
    pv: crypto.createHash('sha256').update(user.passwordHash).digest('hex'),
    exp: Date.now() + 7 * 86400000 })).toString('base64url');
  return payload + '.' + crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
}
function verifySession(token: string) {
  try {
    const [payload, signature, extra] = token.split('.');
    if (extra || !signature || !safeEqual(signature, crypto.createHmac('sha256', secret()).update(payload).digest('base64url'))) return null;
    const value = JSON.parse(Buffer.from(payload, 'base64url').toString());
    const user = users.find(u => u.id === value.uid);
    if (!user || value.scope !== scopeId() || !Number.isFinite(value.exp) || value.exp < Date.now() ||
      value.pv !== crypto.createHash('sha256').update(user.passwordHash).digest('hex')) return null;
    return { userId: user.id, username: user.username, role: user.role, studentId: user.studentId };
  } catch { return null; }
}
function emptyClass(): ClassData {
  const initial = createInitialClassData();
  return { ...initial, settings: { ...initial.settings, schoolYear: '2026 - 2027', teacherPhone: '', teacherEmail: '' },
    students: [], seats: generateInitialSeats().map(s => ({ ...s, studentId: null })),
    attendance: [], grades: [], disciplineRecords: [], announcements: [], honors: [], conductAdjustments: {} };
}
function initUsersFromClassData() {
  const teachers = users.filter(u => u.role === 'teacher');
  users = [...teachers, ...classData.students.map(student => {
    const old = users.find(u => u.role === 'student' && u.studentId === student.id);
    if (old) return { ...old, name: student.fullName };
    const salt = crypto.randomBytes(16).toString('hex');
    return { id: `user-${student.id}`, username: student.id.toLowerCase(), role: 'student' as const,
      studentId: student.id, name: student.fullName, salt,
      passwordHash: hashPassword(student.dob.replace(/[^0-9]/g, ''), salt), mustChangePassword: false };
  })];
  saveUsers();
}
function getClassScope() {
  return { classKey: scopeId(), usersKey: scopeId(), className: classData.settings.className,
    teacherName: classData.settings.teacherName, teacherUsername: users.find(u => u.role === 'teacher')?.username || 'gvcn',
    classId: scopeId(), schoolName: classData.settings.schoolName, schoolYear: classData.settings.schoolYear };
}
function saveDatabase(_cloudSync = true) { dirty = true; }
function saveUsers(_cloudSync = true) { dirty = true; }
function createAutoBackup(reason: string) {
  const id = crypto.randomUUID();
  pendingBackups.push({ id, scope: scopeId(), reason, data: structuredClone({ classData, users }) });
  return id;
}
const arrayKeys = ['students', 'seats', 'announcements', 'honors', 'attendance', 'subjects', 'grades', 'rules', 'disciplineRecords'] as const;
function validatePatch(value: any) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Object.assign(new Error('Dữ liệu không hợp lệ'), { status: 400 });
  for (const key of arrayKeys) if (value[key] !== undefined && !Array.isArray(value[key])) throw Object.assign(new Error(`Mục ${key} phải là danh sách`), { status: 400 });
  if (value.settings !== undefined && (!value.settings || typeof value.settings !== 'object' || Array.isArray(value.settings))) throw Object.assign(new Error('Cài đặt không hợp lệ'), { status: 400 });
  if (value.students) {
    const ids = new Set<string>();
    for (const s of value.students) {
      if (!s || typeof s.id !== 'string' || !s.id.trim() || typeof s.fullName !== 'string' || typeof s.dob !== 'string' ||
        !s.dob.replace(/[^0-9]/g, '') || s.id.toLowerCase() === 'gvcn' || ids.has(s.id.toLowerCase()))
        throw Object.assign(new Error('Mã học sinh/ngày sinh không hợp lệ hoặc mã bị trùng.'), { status: 400 });
      ids.add(s.id.toLowerCase());
    }
  }
}
function validateClass(value: any) {
  validatePatch(value);
  if (!value.settings || typeof value.settings.className !== 'string' || !value.settings.className.trim() ||
    arrayKeys.some(k => !Array.isArray(value[k]))) throw Object.assign(new Error('Bản sao lưu thiếu dữ liệu lớp bắt buộc.'), { status: 400 });
}
async function load(req: Request) {
  secret(); dirty = false; pendingBackups = [];
  const { data, error } = await db().from('gvcn_private_state').select('*').eq('id', scopeId()).maybeSingle();
  if (error) throw new Error(`Không đọc được vùng dữ liệu riêng: ${error.message}. Kiểm tra SQL thiết lập và khóa backend.`);
  exists = !!data; version = data?.version || 0; lastSavedAt = data?.updated_at || null;
  if (data) { validateClass(data.data.classData); classData = data.data.classData; users = data.data.users; }
  else {
    // No startup write and no legacy reads. First creation requires the configured admin password.
    const password = process.env.INITIAL_ADMIN_PASSWORD;
    if (req.originalUrl.split('?')[0] !== '/api/auth/login' || req.method !== 'POST' || !password || password.length < 12 ||
      req.body?.username !== 'gvcn' || typeof req.body?.password !== 'string' || !safeEqual(req.body.password, password))
      throw Object.assign(new Error('Chưa khởi tạo vùng dữ liệu. Đăng nhập gvcn bằng INITIAL_ADMIN_PASSWORD đã đặt trên Vercel (ít nhất 12 ký tự).'), { status: 401 });
    classData = emptyClass();
    const salt = crypto.randomBytes(16).toString('hex');
    users = [{ id: 'teacher', username: 'gvcn', role: 'teacher', name: classData.settings.teacherName, salt,
      passwordHash: hashPassword(password, salt), mustChangePassword: false }];
    dirty = true;
  }
}
async function persist() {
  const client = db();
  // Backups are written durably before any replacement. Old app_data is never touched.
  if (pendingBackups.length) {
    const { error } = await client.from('gvcn_private_backups').insert(pendingBackups);
    if (error) throw new Error(`Không tạo được sao lưu: ${error.message}`);
  }
  validateClass(classData);
  const updated_at = new Date().toISOString();
  const row = { id: scopeId(), data: { classData, users }, version: version + 1, updated_at };
  const result = exists
    ? await client.from('gvcn_private_state').update(row).eq('id', scopeId()).eq('version', version).select('id')
    : await client.from('gvcn_private_state').insert(row).select('id');
  if (result.error || !result.data?.length) {
    if (!result.error || result.error.code === '23505') throw Object.assign(new Error('Dữ liệu vừa thay đổi ở thiết bị khác. Tải lại trang trước khi lưu.'), { status: 409 });
    throw new Error(`Lưu Supabase thất bại: ${result.error.message}`);
  }
  version++; lastSavedAt = updated_at;
}
// Serialize this instance's legacy route handlers. Database CAS also protects separate Vercel instances.
let queue: Promise<void> = Promise.resolve();
app.use('/api', (req, res, next) => {
  const run = async () => {
    const send = res.json.bind(res);
    const textSend = res.send.bind(res);
    await new Promise<void>(resolve => {
      res.once('finish', resolve); res.once('close', resolve);
      let responding = false;
      res.json = ((body: any) => {
        if (responding) return res;
        responding = true;
        void (async () => {
          try {
            if (res.statusCode < 400 && dirty) await persist();
            res.setHeader('X-Data-Version', String(version));
            send(body);
          } catch (err: any) {
            console.error('[GVCN save]', err.message);
            res.status(err.status || 503); send({ error: err.message });
          }
        })();
        return res;
      }) as typeof res.json;
      void load(req).then(() => {
        if (res.destroyed) return;
        if (req.method === 'POST' && ['/api/data/update','/api/data/restore','/api/data/reset-demo'].includes(req.originalUrl.split('?')[0])) {
          if (req.headers['if-match'] !== String(version)) return res.status(409).json({ error: 'Dữ liệu đã thay đổi hoặc chưa tải xong. Tải lại trang rồi thực hiện lại.' });
        }
        next();
      }).catch((err: any) => { console.error('[GVCN load]', err.message); res.status(err.status || 503).json({ error: err.message }); });
    });
    res.send = textSend;
  };
  queue = queue.then(run, run).catch(err => { console.error(err); if (!res.headersSent) res.status(500).end(); });
});

// Authentication Middleware
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Yêu cầu đăng nhập (Thiếu token xác thực)' });
  }

  const token = authHeader.split(' ')[1];
  const session = verifySession(token);
  if (!session) return res.status(401).json({ error: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.' });

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
  if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
  }

  const targetUser = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
  if (!targetUser) {
    return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
  }

  const computedHash = hashPassword(password, targetUser.salt);
  if (!safeEqual(computedHash, targetUser.passwordHash)) {
    return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
  }

  const token = signSession(targetUser);

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

  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || !currentPassword || !newPassword) {
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
  if (!safeEqual(currentHash, user.passwordHash)) {
    return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });
  }

  // Update password with new salt
  const newSalt = crypto.randomBytes(16).toString('hex');
  user.salt = newSalt;
  user.passwordHash = hashPassword(newPassword, newSalt);
  user.mustChangePassword = false;
  saveUsers();

  res.json({ success: true, message: 'Đổi mật khẩu thành công!', token: signSession(user) });
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
  validatePatch(updatedData);

  if (updatedData.settings) classData.settings = { ...classData.settings, ...updatedData.settings };
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
    initUsersFromClassData();
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
      appScope: scopeId(),
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

  if (backupData.metadata?.appScope && backupData.metadata.appScope !== scopeId()) return res.status(409).json({ error: 'Bản sao lưu thuộc vùng dữ liệu khác.' });
  const restoredData = backupData.classData || backupData;
  validateClass(restoredData);
  const incomingClassName = backupData.metadata?.className || restoredData.settings?.className;
  const currentClassName = classData.settings.className;

  // Class mismatch detection: Prevent accidental overwrite of 9A2 with 9A5 or other classes
  if (incomingClassName && incomingClassName !== currentClassName) {
    return res.status(409).json({
      error: 'Phát hiện tệp sao lưu thuộc lớp khác',
      requiresConfirmation: false,
      sourceClass: incomingClassName,
      currentClass: currentClassName,
      sourceTeacher: backupData.metadata?.teacherName || restoredData.settings?.teacherName || 'Chưa rõ',
      message: `Tệp sao lưu này ghi nhận thuộc "${incomingClassName}" (Giáo viên: ${backupData.metadata?.teacherName || restoredData.settings?.teacherName || 'Chưa rõ'}), khác với lớp đang quản lý "${currentClassName}". Không nạp vào lớp hiện tại.`,
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
  classData = emptyClass();
  saveDatabase();
  initUsersFromClassData();
  res.json({
    success: true,
    message: `Đã thiết lập lại dữ liệu mẫu cho ${classData.settings.className}! (Đã tạo sao lưu trước đó: ${safetyBackupName})`,
  });
});

// All cloud access is restricted to APP_DATA_SCOPE in the private table.
app.get('/api/supabase/status', authMiddleware, requireTeacher, (_req, res) => {
  const scope = getClassScope();
  res.json({ connected: true, url: process.env.SUPABASE_URL, table: 'gvcn_private_state',
    classKey: scope.classKey, usersKey: scope.usersKey, className: scope.className,
    teacherUsername: scope.teacherUsername, teacherName: scope.teacherName,
    lastSync: lastSavedAt, error: null, hasRemoteData: true, hasMainClassData: false,
    notice: 'Dữ liệu được lưu trực tiếp trên Supabase trong vùng riêng của ứng dụng. Không truy cập lớp khác.' });
});
app.post('/api/supabase/sync-now', authMiddleware, requireTeacher, (_req, res) => {
  res.json({ success: true, message: 'Dữ liệu đã được lưu trực tiếp trên Supabase.', lastSync: lastSavedAt,
    classKey: scopeId(), usersKey: scopeId() });
});
app.post('/api/supabase/pull', authMiddleware, requireTeacher, (_req, res) => {
  res.json({ success: true, message: 'Đã đọc bản mới nhất của đúng ứng dụng từ Supabase.', classData });
});
app.get('/api/supabase/available-datasets', authMiddleware, requireTeacher, (_req, res) => {
  res.json({ currentClass: classData.settings.className, currentClassKey: scopeId(), datasets: [{
    id: scopeId(), updatedAt: lastSavedAt, className: classData.settings.className,
    teacherName: classData.settings.teacherName, studentsCount: classData.students.length,
    isCurrentClass: true, isExternal: false, is9A5: false, statusLabel: 'Lớp đang quản lý' }] });
});
app.post('/api/supabase/migrate-dataset', authMiddleware, requireTeacher, (_req, res) => {
  res.status(403).json({ error: 'Không cho phép nạp dữ liệu lớp khác. Hãy dùng bản sao lưu của chính lớp này.' });
});
app.get('/api/supabase/sql-schema', authMiddleware, requireTeacher, (_req, res) => {
  res.type('text/plain').send('Xem file supabase_setup_private.sql trong bộ mã đã sửa.');
});

// --- 404 & ERROR HANDLING MIDDLEWARE (ENSURE API ALWAYS RETURNS JSON) ---
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ error: `API endpoint không tồn tại: ${req.method} ${req.path}` });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[GVCN Server Error Handler]:', err);
  res.status(err.status || 500).json({ error: err.message || 'Lỗi xử lý nội bộ trên máy chủ' });
});


export default app;
