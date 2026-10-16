import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  ShieldCheck,
  KeyRound,
  LogIn,
  User,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import { api } from '../api';

export const LoginModal: React.FC = () => {
  const { login } = useApp();
  const [roleMode, setRoleMode] = useState<'teacher' | 'student'>('teacher');

  // Teacher fields
  const [teacherPassword, setTeacherPassword] = useState('');

  // Student fields
  const [studentUsername, setStudentUsername] = useState('');
  const [studentPassword, setStudentPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [publicSettings, setPublicSettings] = useState<{ schoolName: string; className: string } | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    api.getPublicSettings()
      .then(data => {
        if (isMounted) {
          setPublicSettings(data);
          setSettingsError(null);
        }
      })
      .catch(err => {
        if (isMounted) {
          setSettingsError(err.message || 'Không tải được thông tin lớp');
        }
      });
    return () => { isMounted = false; };
  }, []);
  const schoolName = publicSettings?.schoolName || '';
  const className = publicSettings?.className || '';

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherPassword.trim()) {
      setError('Vui lòng nhập mật khẩu quản trị GVCN');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await login('gvcn', teacherPassword.trim());
    } catch (err: any) {
      setError(err.message || 'Mật khẩu quản trị không chính xác');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentUsername.trim() || !studentPassword.trim()) {
      setError('Vui lòng nhập ID học sinh và mật khẩu');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await login(studentUsername.trim(), studentPassword.trim());
    } catch (err: any) {
      setError(err.message || 'ID học sinh hoặc mật khẩu không chính xác');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F6FB] flex items-center justify-center p-4">
      <div className="bg-white rounded-[28px] shadow-xl border border-sky-100 max-w-[460px] w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Card */}
        <div className="bg-[#008AE6] pt-9 pb-8 px-6 text-white text-center relative rounded-t-[28px]">
          {/* Graduation Cap Badge */}
          <div className="w-16 h-16 mx-auto mb-3 bg-white/20 rounded-2xl flex items-center justify-center border border-white/25 shadow-inner backdrop-blur-xs">
            <GraduationCap className="w-9 h-9 text-white stroke-[2.2]" />
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
            GVCN
          </h1>

          <p className="text-sm font-medium text-white/95 mt-1.5 tracking-wide">
            {publicSettings ? [schoolName, className].filter(Boolean).join(' · ') || 'Hệ thống quản lý lớp học' : settingsError ? 'Chưa tải được thông tin trường, lớp' : 'Đang tải thông tin trường, lớp...'}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-7">
          {/* Segmented Role Switcher Tabs */}
          <div className="bg-slate-100/90 p-1.5 rounded-2xl flex gap-1.5 border border-slate-200/70 mb-6">
            <button
              type="button"
              onClick={() => {
                setRoleMode('teacher');
                setError(null);
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                roleMode === 'teacher'
                  ? 'bg-white text-[#008AE6] shadow-sm border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-[#008AE6]" />
              <span>Giáo Viên Chủ Nhiệm</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRoleMode('student');
                setError(null);
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                roleMode === 'student'
                  ? 'bg-white text-[#008AE6] shadow-sm border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-[#008AE6]" />
              <span>Học Sinh</span>
            </button>
          </div>

          {/* Server Settings Status Warning */}
          {settingsError && !error && (
            <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="font-semibold text-amber-950">Chưa tải được thông tin trường, lớp</p>
                <p className="text-amber-800 break-words">{settingsError}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="break-words">{error}</span>
            </div>
          )}

          {/* TEACHER FORM */}
          {roleMode === 'teacher' && (
            <form onSubmit={handleTeacherSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mật khẩu quản trị
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                    placeholder="Nhập mật khẩu GVCN"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#008AE6] focus:border-transparent bg-slate-50/70 pr-10"
                    autoFocus
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                  <span>Dùng mật khẩu riêng đã thiết lập cho ứng dụng.</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-4 bg-[#008AE6] hover:bg-[#0077C8] text-white font-bold text-sm rounded-2xl shadow-md shadow-sky-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang đăng nhập...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 stroke-[2.5]" />
                    <span>Đăng Nhập Vào Hệ Thống</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* STUDENT FORM */}
          {roleMode === 'student' && (
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                <label htmlFor="student-id" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ID học sinh
                </label>
                <div className="relative">
                  <input
                    id="student-id"
                    type="text"
                    value={studentUsername}
                    onChange={(e) => setStudentUsername(e.target.value)}
                    placeholder="Nhập mã hồ sơ học sinh (ví dụ: HS1040)"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#008AE6] focus:border-transparent bg-slate-50/70"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mật khẩu học sinh
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu học sinh"
                    autoComplete="current-password"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#008AE6] focus:border-transparent bg-slate-50/70 pr-10 font-mono"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Mật khẩu khởi tạo là ngày sinh định dạng <span className="font-mono text-slate-700 font-semibold">DDMMYYYY</span>. Nếu đã đổi mật khẩu, hãy dùng mật khẩu mới.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-4 bg-[#008AE6] hover:bg-[#0077C8] text-white font-bold text-sm rounded-2xl shadow-md shadow-sky-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang đăng nhập...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 stroke-[2.5]" />
                    <span>Đăng Nhập Học Sinh</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Text */}
          <div className="mt-7 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              Hệ thống quản lý lớp học dành riêng cho Giáo viên Chủ nhiệm
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
