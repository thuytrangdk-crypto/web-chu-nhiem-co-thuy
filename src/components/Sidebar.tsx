import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Megaphone,
  Users,
  Award,
  CalendarCheck,
  GraduationCap,
  Settings as SettingsIcon,
  X,
  UserCheck,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { activeTab, setActiveTab, user, openStudentProfile } = useApp();
  const isTeacher = user?.role === 'teacher';

  const navItems = [
    {
      id: 'overview',
      label: 'Tổng quan',
      icon: LayoutDashboard,
      description: 'Chỉ số & thống kê lớp',
      show: true,
    },
    {
      id: 'bulletin_seating',
      label: 'Bảng tin & sơ đồ lớp',
      icon: Megaphone,
      description: 'Thông báo & sơ đồ 56 chỗ',
      show: true,
    },
    {
      id: 'students',
      label: 'Học sinh',
      icon: Users,
      description: 'Danh sách & hồ sơ cá nhân',
      show: true,
    },
    {
      id: 'discipline',
      label: 'Thi đua',
      icon: Award,
      description: 'Ghi nhận nề nếp & rèn luyện',
      show: true,
    },
    {
      id: 'attendance',
      label: 'Điểm danh',
      icon: CalendarCheck,
      description: 'Chuyên cần ngày & tháng',
      show: true,
    },
    {
      id: 'academics',
      label: 'Học tập',
      icon: GraduationCap,
      description: 'Sổ điểm môn học & đánh giá',
      show: true,
    },
    {
      id: 'settings',
      label: 'Cài đặt',
      icon: SettingsIcon,
      description: 'Quy tắc, môn học & sao lưu',
      show: isTeacher, // Strictly hidden for students
    },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    onCloseMobile();
  };

  const content = (
    <div className="flex flex-col h-full bg-[#FAFDFE] border-r border-slate-200/80 w-64 select-none">
      {/* Mobile Header with close button */}
      <div className="p-4 flex items-center justify-between border-b border-slate-100 md:hidden">
        <span className="font-bold text-sm text-[#1E3A5F]">Danh mục quản lý</span>
        <button
          onClick={onCloseMobile}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav List */}
      <div className="p-3 space-y-1 flex-1 overflow-y-auto">
        {navItems
          .filter(item => item.show)
          .map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-3 cursor-pointer ${
                  isActive
                    ? 'bg-[#EAF6FF] text-[#1E3A5F] font-bold border border-[#C5E1F7] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent font-medium'
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg shrink-0 ${
                    isActive ? 'bg-[#3289C7] text-white' : 'text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="leading-tight truncate">
                  <div className="text-xs">{item.label}</div>
                  <div className="text-[10px] text-slate-400 font-normal truncate">
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
      </div>

      {/* Student Quick Profile Button (If logged in as student) */}
      {!isTeacher && user?.studentId && (
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={() => {
              if (user.studentId) openStudentProfile(user.studentId, 'discipline');
              onCloseMobile();
            }}
            className="w-full p-2.5 bg-sky-50 hover:bg-sky-100/80 border border-sky-200 rounded-xl text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#3289C7]" />
              <div className="text-xs font-bold text-[#1E3A5F]">Hồ sơ của tôi</div>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Xem điểm, điểm danh & thi đua cá nhân
            </div>
          </button>
        </div>
      )}

      {/* Footer Branding Info */}
      <div className="p-4 border-t border-slate-100 text-[11px] text-slate-400">
        <div className="font-semibold text-slate-600">GVCN v2.5</div>
        <div>Hệ thống quản trị lớp chủ nhiệm</div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block shrink-0">{content}</aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
