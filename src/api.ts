import { ClassData, User } from './types';

const TOKEN_KEY = `gvcn_auth_token:${window.location.host}`;
let dataVersion: string | null = null;
async function readJson(res: Response): Promise<any> {
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch {
    throw new Error(`Máy chủ trả về HTTP ${res.status}, không phải JSON. Kiểm tra bản triển khai và API trên Vercel.`);
  }
  if (res.ok) {
    const revision = res.headers.get('X-Data-Version');
    if (revision && /\/api\/(data(?:$|\/update|\/restore|\/reset-demo)|supabase\/pull)/.test(new URL(res.url).pathname)) dataVersion = revision;
    if (data.token) api.setToken(data.token);
  }
  return data;
}

export const api = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string, remember: boolean = true) {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    if (remember) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
    }
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    dataVersion = null;
  },

  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await readJson(res);
    if (!res.ok) {
      throw new Error(data.error || 'Đăng nhập không thành công');
    }

    this.setToken(data.token);
    return data;
  },

  async getMe(): Promise<User> {
    const token = this.getToken();
    if (!token) throw new Error('Chưa đăng nhập');

    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await readJson(res);
    if (!res.ok) {
      this.clearToken();
      throw new Error(data.error || 'Phiên làm việc hết hạn');
    }

    return data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const token = this.getToken();
    if (!token) throw new Error('Chưa đăng nhập');

    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'If-Match': dataVersion || '',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await readJson(res);
    if (!res.ok) throw new Error(data.error || 'Đổi mật khẩu thất bại');
    return data;
  },

  async resetStudentPassword(studentId: string): Promise<{ success: boolean; message: string }> {
    const token = this.getToken();
    if (!token) throw new Error('Chưa đăng nhập');

    const res = await fetch('/api/auth/reset-student-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'If-Match': dataVersion || '',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ studentId }),
    });

    const data = await readJson(res);
    if (!res.ok) throw new Error(data.error || 'Đặt lại mật khẩu thất bại');
    return data;
  },

  async getData(): Promise<ClassData> {
    const token = this.getToken();
    if (!token) throw new Error('Chưa đăng nhập');

    const res = await fetch('/api/data', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await readJson(res);
    if (!res.ok) throw new Error(data.error || 'Không thể tải dữ liệu');
    return data;
  },

  async updateData(updatedData: Partial<ClassData>): Promise<void> {
    const token = this.getToken();
    if (!token) throw new Error('Chưa đăng nhập');

    const res = await fetch('/api/data/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'If-Match': dataVersion || '',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedData),
    });

    const data = await readJson(res);
    if (!res.ok) throw new Error(data.error || 'Không thể lưu dữ liệu');
  },

  async restoreData(backupJson: any, confirmDifferentClass: boolean = false): Promise<{ success: boolean; message: string; backupCreated?: string; classData?: ClassData }> {
    const token = this.getToken();
    if (!token) throw new Error('Chưa đăng nhập');

    const res = await fetch('/api/data/restore', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'If-Match': dataVersion || '',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ backup: backupJson, confirmDifferentClass }),
    });

    const data = await readJson(res);
    if (!res.ok) {
      const err: any = new Error(data.message || data.error || 'Khôi phục dữ liệu thất bại');
      err.status = res.status;
      err.requiresConfirmation = data.requiresConfirmation;
      err.sourceClass = data.sourceClass;
      err.currentClass = data.currentClass;
      throw err;
    }
    return data;
  },

  async resetDemoData(): Promise<void> {
    const token = this.getToken();
    if (!token) throw new Error('Chưa đăng nhập');

    const res = await fetch('/api/data/reset-demo', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'If-Match': dataVersion || '',
      },
    });

    const data = await readJson(res);
    if (!res.ok) throw new Error(data.error || 'Không thể thiết lập lại dữ liệu');
  },

  async getSupabaseStatus(): Promise<{
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
  }> {
    const token = this.getToken();
    if (!token) throw new Error('Chưa đăng nhập');

    const res = await fetch('/api/supabase/status', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await readJson(res);
    if (!res.ok) throw new Error(data.error || 'Không thể kiểm tra Supabase');
    return data;
  },

  async syncSupabaseNow(): Promise<{ success: boolean; message: string; lastSync: string; classKey: string; usersKey: string }> {
    const token = this.getToken();
    if (!token) throw new Error('Chưa đăng nhập');

    const res = await fetch('/api/supabase/sync-now', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await readJson(res);
    if (!res.ok) throw new Error(data.error || 'Đồng bộ Supabase thất bại');
    return data;
  },

  async pullSupabase(): Promise<{ success: boolean; message: string; classData?: ClassData }> {
    const token = this.getToken();
    if (!token) throw new Error('Chưa đăng nhập');

    const res = await fetch('/api/supabase/pull', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await readJson(res);
    if (!res.ok) throw new Error(data.error || 'Tải dữ liệu từ Supabase thất bại');
    return data;
  },

  async getSupabaseAvailableDatasets(): Promise<{
    currentClass: string;
    currentClassKey: string;
    datasets: Array<{
      id: string;
      updatedAt: string;
      className: string;
      teacherName: string;
      studentsCount: number;
      isCurrentClass: boolean;
      isExternal: boolean;
      is9A5: boolean;
      statusLabel: string;
    }>;
  }> {
    const token = this.getToken();
    if (!token) throw new Error('Chưa đăng nhập');

    const res = await fetch('/api/supabase/available-datasets', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await readJson(res);
    if (!res.ok) throw new Error(data.error || 'Không thể tải danh sách dữ liệu Supabase');
    return data;
  },

  async migrateSupabaseDataset(sourceKey: string, confirmDifferentClass: boolean = false): Promise<{
    success: boolean;
    message: string;
    backupCreated: string;
    classData?: ClassData;
  }> {
    const token = this.getToken();
    if (!token) throw new Error('Chưa đăng nhập');

    const res = await fetch('/api/supabase/migrate-dataset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'If-Match': dataVersion || '',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sourceKey, confirmDifferentClass }),
    });

    const data = await readJson(res);
    if (!res.ok) {
      const err: any = new Error(data.message || data.error || 'Chuyển đổi dữ liệu thất bại');
      err.status = res.status;
      err.requiresConfirmation = data.requiresConfirmation;
      err.sourceClassName = data.sourceClassName;
      err.currentClassName = data.currentClassName;
      throw err;
    }
    return data;
  },

  async getSupabaseSqlSchema(): Promise<string> {
    const res = await fetch('/api/supabase/sql-schema');
    if (!res.ok) throw new Error('Không thể tải file SQL Schema');
    return await res.text();
  },
};
