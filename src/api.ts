import { ClassData, User } from './types';

const TOKEN_KEY = 'gvcn_auth_token';

export const api = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string, remember: boolean = true) {
    if (remember) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
    }
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  },

  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
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

    const data = await res.json();
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
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await res.json();
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
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ studentId }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Đặt lại mật khẩu thất bại');
    return data;
  },

  async getData(): Promise<ClassData> {
    const token = this.getToken();
    if (!token) throw new Error('Chưa đăng nhập');

    const res = await fetch('/api/data', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
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
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedData),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể lưu dữ liệu');
  },

  async restoreData(backupJson: any): Promise<void> {
    const token = this.getToken();
    if (!token) throw new Error('Chưa đăng nhập');

    const res = await fetch('/api/data/restore', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(backupJson),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Khôi phục dữ liệu thất bại');
  },

  async resetDemoData(): Promise<void> {
    const token = this.getToken();
    if (!token) throw new Error('Chưa đăng nhập');

    const res = await fetch('/api/data/reset-demo', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể thiết lập lại dữ liệu');
  },
};
