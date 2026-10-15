import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoginModal } from './components/LoginModal';
import { StudentProfileModal } from './components/StudentProfileModal';
import { OverviewView } from './views/OverviewView';
import { BulletinSeatingView } from './views/BulletinSeatingView';
import { StudentsView } from './views/StudentsView';
import { DisciplineView } from './views/DisciplineView';
import { AttendanceView } from './views/AttendanceView';
import { AcademicsView } from './views/AcademicsView';
import { SettingsView } from './views/SettingsView';
import { CheckCircle2, AlertCircle, Info, Loader2 } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, classData, activeTab, isLoading, toast } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If not logged in, render the login experience
  if (!user) {
    return <LoginModal />;
  }

  return (
    <div className="h-screen max-h-screen w-full flex flex-col bg-[#F4F9FD] text-[#0F2537] overflow-hidden">
      {/* Top Header */}
      <Header onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

      {/* Main Workspace Canvas */}
      <div className="flex-1 flex overflow-hidden min-h-0 w-full">
        {/* Left Sidebar */}
        <Sidebar
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Viewport Area with dedicated smooth vertical scrolling */}
        <main
          id="main-scroll-container"
          className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden scroll-smooth focus:outline-none"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full pb-24">
            {!classData || isLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#008AE6]" />
                <p className="text-xs">Đang tải dữ liệu lớp học...</p>
              </div>
            ) : (
              <>
                {activeTab === 'overview' && <OverviewView />}
                {activeTab === 'bulletin_seating' && <BulletinSeatingView />}
                {activeTab === 'students' && <StudentsView />}
                {activeTab === 'discipline' && <DisciplineView />}
                {activeTab === 'attendance' && <AttendanceView />}
                {activeTab === 'academics' && <AcademicsView />}
                {activeTab === 'settings' && <SettingsView />}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Global Student Profile Modal */}
      <StudentProfileModal />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold border ${
              toast.type === 'success'
                ? 'bg-emerald-900/90 text-white border-emerald-700 backdrop-blur-md'
                : toast.type === 'error'
                ? 'bg-rose-900/90 text-white border-rose-700 backdrop-blur-md'
                : 'bg-slate-900/90 text-white border-slate-700 backdrop-blur-md'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
