import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  LogOut,
  KeyRound,
  User as UserIcon,
  Menu,
  ChevronDown,
} from 'lucide-react';
import { ChangePasswordModal } from './ChangePasswordModal';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const { user, classData, logout } = useApp();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const settings = classData?.settings;
  const isTeacher = user?.role === 'teacher';

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 shadow-2xs">
        {/* Left: Mobile menu toggle + Brand Title */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            title="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1E3A5F] to-[#3289C7] flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <span className="font-extrabold text-sm sm:text-base text-[#1E3A5F] tracking-tight whitespace-nowrap block">
                {settings?.appName || 'GVCN – Quản trị lớp chủ nhiệm'}
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:block">
                {settings?.schoolName || 'Trường THCS'} · Năm học {settings?.schoolYear || '2026 - 2027'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Contextual Class & Homeroom Info (Single-line clean unboxed text) */}
        <div className="hidden lg:flex items-center gap-3 text-xs text-slate-600 bg-[#EAF6FF]/50 px-3.5 py-1.5 rounded-xl border border-[#D0E7F9]">
          <span className="font-bold text-[#1E3A5F]">Lớp {settings?.className || '10A1'}</span>
          <span className="text-slate-300" aria-hidden="true">·</span>
          <span>GVCN: <strong className="text-slate-800">{settings?.teacherName || 'Thầy/Cô'}</strong></span>
          <span className="text-slate-300" aria-hidden="true">·</span>
          <span className="text-slate-500">{settings?.schoolYear}</span>
        </div>

        {/* Right: Account details + Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-50 border border-slate-200 transition-colors cursor-pointer text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-[#EAF6FF] text-[#3289C7] flex items-center justify-center font-bold text-xs border border-[#C5E1F7]">
                {user?.role === 'teacher' ? 'GV' : 'HS'}
              </div>
              <div className="hidden sm:block leading-tight pr-1">
                <div className="text-xs font-semibold text-slate-800 max-w-[130px] truncate">
                  {isTeacher ? settings?.teacherName || user?.name : user?.name}
                </div>
                <div className="text-[10px] text-slate-500">
                  {isTeacher ? 'Giáo viên chủ nhiệm' : `Học sinh (${user?.studentId})`}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserDropdown(false)}
                />
                <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="font-semibold text-slate-800">{isTeacher ? settings?.teacherName || user?.name : user?.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {isTeacher ? 'Tài khoản Quản trị' : `Mã: ${user?.studentId}`}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      setShowPasswordModal(true);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-[#3289C7]" />
                    <span>Đổi mật khẩu</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Change Password Modal (Optional, only opened when user clicks "Đổi mật khẩu") */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        isMandatory={false}
      />
    </>
  );
};
