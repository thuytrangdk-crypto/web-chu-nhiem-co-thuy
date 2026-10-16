import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Pin,
  Megaphone,
  Grid,
  Trophy,
  PenTool,
  Maximize2,
  Minimize2,
  Search,
  UserPlus,
  ArrowLeftRight,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  Sparkles,
  Award,
  Calendar,
  User,
  Plus,
  Save,
  Clock,
  Shuffle,
  RotateCcw,
} from 'lucide-react';
import { AnnouncementMedia, MediaEditor } from '../components/AnnouncementMedia';
import type { AnnouncementAttachment } from '../types';
import { Announcement, Honor, BadgeType, SeatAssignment } from '../types';

export const BulletinSeatingView: React.FC = () => {
  const {
    user,
    classData,
    updateSeats,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    togglePinAnnouncement,
    addHonor,
    updateHonor,
    deleteHonor,
    openStudentProfile,
    triggerConfetti,
    showToast,
  } = useApp();

  const isTeacher = user?.role === 'teacher';
  const [subTab, setSubTab] = useState<'seating' | 'announcements' | 'honors' | 'composer'>('seating');

  // --- SEATING CHART STATE ---
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchStudent, setSearchStudent] = useState('');
  const [selectedSeat, setSelectedSeat] = useState<SeatAssignment | null>(null);
  const [seatActionModal, setSeatActionModal] = useState<SeatAssignment | null>(null);
  const [swapTargetSeat, setSwapTargetSeat] = useState<SeatAssignment | null>(null);

  // --- COMPOSER STATE ---
  const [composerType, setComposerType] = useState<'announcement' | 'honor'>('announcement');
  const [composerTitle, setComposerTitle] = useState('');
  const [composerContent, setComposerContent] = useState('');
  const [composerTag, setComposerTag] = useState<Announcement['tag']>('Thông báo chung');
  const [composerIsPinned, setComposerIsPinned] = useState(false);
  const [composerStudentId, setComposerStudentId] = useState('');
  const [composerBadge, setComposerBadge] = useState<BadgeType>('gold_cup');
  const [composerDate, setComposerDate] = useState('2026-10-15');
  const [composerIsPublished, setComposerIsPublished] = useState(true);

  const [composerAttachments, setComposerAttachments] = useState<AnnouncementAttachment[]>([]);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [savingPost, setSavingPost] = useState(false);

  // --- EDIT MODAL STATE ---
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [editingHonor, setEditingHonor] = useState<Honor | null>(null);
  const [announcementFilterTag, setAnnouncementFilterTag] = useState<string>('all');

  const seats = classData?.seats || [];
  const students = classData?.students || [];

  // Helper map for student lookup
  const studentMap = useMemo(() => {
    const map = new Map<string, any>();
    students.forEach((s) => map.set(s.id, s));
    return map;
  }, [students]);

  // Students not currently assigned to any seat
  const unassignedStudents = useMemo(() => {
    const assignedIds = new Set(seats.map((s) => s.studentId).filter(Boolean));
    return students.filter((s) => !assignedIds.has(s.id));
  }, [students, seats]);

  if (!classData) return null;

  // Handle seat click
  const handleSeatClick = (seat: SeatAssignment) => {
    if (!isTeacher) {
      if (seat.studentId) {
        openStudentProfile(seat.studentId);
      }
      return;
    }

    if (swapTargetSeat) {
      // Execute swap
      handleExecuteSwap(swapTargetSeat, seat);
      setSwapTargetSeat(null);
      return;
    }

    setSeatActionModal(seat);
  };

  const handleAssignStudent = (seatCode: string, studentId: string) => {
    // Ensure student is not already seated elsewhere
    const newSeats = seats.map((s) => {
      if (s.seatCode === seatCode) {
        return { ...s, studentId };
      }
      if (s.studentId === studentId) {
        return { ...s, studentId: null };
      }
      return s;
    });

    updateSeats(newSeats);
    setSeatActionModal(null);
  };

  const handleVacateSeat = (seatCode: string) => {
    const newSeats = seats.map((s) =>
      s.seatCode === seatCode ? { ...s, studentId: null } : s
    );
    updateSeats(newSeats);
    setSeatActionModal(null);
  };

  const handleExecuteSwap = (seatA: SeatAssignment, seatB: SeatAssignment) => {
    if (seatA.seatCode === seatB.seatCode) return;
    const newSeats = seats.map((s) => {
      if (s.seatCode === seatA.seatCode) return { ...s, studentId: seatB.studentId };
      if (s.seatCode === seatB.seatCode) return { ...s, studentId: seatA.studentId };
      return s;
    });
    updateSeats(newSeats);
    showToast(`Đã hoán đổi chỗ ngồi giữa vị trí ${seatA.seatCode} và ${seatB.seatCode}!`, 'success');
  };

  const handleAutoAssignAlphabetical = () => {
    if (!window.confirm('Bạn có muốn tự động xếp chỗ học sinh theo thứ tự bảng chữ cái vào các ghế từ Dãy 1 đến Dãy 4?')) return;
    const sorted = [...students].sort((a, b) => a.fullName.localeCompare(b.fullName, 'vi'));
    const newSeats = seats.map((s, idx) => ({
      ...s,
      studentId: sorted[idx] ? sorted[idx].id : null,
    }));
    updateSeats(newSeats);
    showToast('Đã tự động xếp chỗ theo danh sách tên học sinh!', 'success');
  };

  // Composer submit
  const handleComposerSubmit = async (publishImmediate: boolean) => {
    if (mediaBusy || savingPost) return;
    if (!composerTitle.trim()) {
      showToast('Vui lòng nhập tiêu đề', 'error');
      return;
    }

    if (composerType === 'announcement') {
      if (!composerContent.trim()) {
        showToast('Vui lòng nhập nội dung thông báo', 'error');
        return;
      }
      setSavingPost(true);
      try {
      await addAnnouncement({
        title: composerTitle.trim(),
        content: composerContent.trim(),
        author: user?.name || classData.settings.teacherName || 'GVCN',
        isPinned: composerIsPinned,
        isPublished: publishImmediate,
        tag: composerTag,
        attachments: composerAttachments,
      });
      } catch (e: any) { showToast(e.message || 'Chưa lưu được thông báo', 'error'); return; }
      finally { setSavingPost(false); }
    } else {
      // Honor
      if (!composerStudentId) {
        showToast('Vui lòng chọn học sinh được vinh danh', 'error');
        return;
      }
      const st = studentMap.get(composerStudentId);
      setSavingPost(true);
      try {
      await addHonor({
        studentId: composerStudentId,
        studentName: st?.fullName || composerStudentId,
        title: composerTitle.trim(),
        description: composerContent.trim() || 'Thành tích nổi bật trong học tập và rèn luyện',
        date: composerDate,
        badge: composerBadge,
        isPublished: publishImmediate,
      });
      } catch (e: any) { showToast(e.message || 'Chưa lưu được vinh danh', 'error'); return; }
      finally { setSavingPost(false); }
    }

    // Reset form
    setComposerAttachments([]);
    setComposerTitle('');
    setComposerContent('');
    setComposerIsPinned(false);
    setComposerStudentId('');
    setSubTab(composerType === 'announcement' ? 'announcements' : 'honors');
  };

  const badgeIconMap: Record<BadgeType, { label: string; icon: any; color: string }> = {
    gold_cup: { label: 'Cúp Vàng Xuất Sắc', icon: Trophy, color: 'text-amber-500 bg-amber-50 border-amber-200' },
    silver_medal: { label: 'Huy Chương Bạc', icon: Award, color: 'text-slate-500 bg-slate-50 border-slate-200' },
    star: { label: 'Ngôi Sao Sáng', icon: Sparkles, color: 'text-sky-500 bg-sky-50 border-sky-200' },
    good_study: { label: 'Chăm Ngoan Học Tốt', icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-50 border-emerald-200' },
    good_deed: { label: 'Người Tốt Việc Tốt', icon: Sparkles, color: 'text-rose-500 bg-rose-50 border-rose-200' },
    creative: { label: 'Sáng Tạo Nổi Bật', icon: Trophy, color: 'text-purple-500 bg-purple-50 border-purple-200' },
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSubTab('seating')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'seating'
                ? 'bg-[#3289C7] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Grid className="w-4 h-4" />
            Sơ đồ lớp 56 chỗ
          </button>

          <button
            onClick={() => setSubTab('announcements')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'announcements'
                ? 'bg-[#3289C7] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            Bảng tin ({classData.announcements.length})
          </button>

          <button
            onClick={() => setSubTab('honors')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'honors'
                ? 'bg-[#3289C7] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Vinh danh ({classData.honors.length})
          </button>

          {isTeacher && (
            <button
              onClick={() => setSubTab('composer')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                subTab === 'composer'
                  ? 'bg-[#3289C7] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <PenTool className="w-4 h-4" />
              Đăng thông tin mới
            </button>
          )}
        </div>

        {subTab === 'seating' && (
          <div className="flex items-center gap-2 px-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Tìm chỗ học sinh..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#3289C7] w-40 sm:w-48"
              />
            </div>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              title={isFullscreen ? 'Thu nhỏ' : 'Chế độ trình chiếu / Toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB A: SƠ ĐỒ LỚP 56 CHỖ (4 DÃY, MỖI DÃY 7 BÀN, MỖI BÀN 2 CHỖ)       */}
      {/* ========================================================================= */}
      {subTab === 'seating' && (
        <div
          className={`bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-2xs space-y-6 ${
            isFullscreen ? 'fixed inset-0 z-50 overflow-y-auto rounded-none p-6 bg-slate-50' : ''
          }`}
        >
          {/* Header Controls for Seating */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#1E3A5F]">
                  Sơ đồ lớp học {classData.settings.className.replace(/^lớp\s*/i, '')} (56 chỗ ngồi)
                </h3>
                {isTeacher && (
                  <span className="text-[11px] font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                    Bấm vào ghế để xếp / đổi chỗ
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Mô phỏng 4 dãy bàn · 7 hàng ghế · 2 học sinh mỗi bàn · Lối đi thông thoáng
              </p>
            </div>

            {isTeacher && (
              <div className="flex items-center gap-2 flex-wrap">
                {swapTargetSeat && (
                  <div className="flex items-center gap-2 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 text-xs text-amber-800">
                    <span>Đang chọn ghế {swapTargetSeat.seatCode} để đổi. Hãy chọn ghế thứ 2:</span>
                    <button
                      onClick={() => setSwapTargetSeat(null)}
                      className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                )}

                <button
                  onClick={handleAutoAssignAlphabetical}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  Xếp theo A-Z
                </button>
              </div>
            )}
          </div>

          {/* CLASSROOM STAGE / FRONT VIEW */}
          <div className="max-w-4xl mx-auto space-y-4">
            {/* BLACKBOARD (BẢNG ĐEN) */}
            <div className="w-full bg-[#1A3326] text-white py-3 px-6 rounded-xl shadow-md text-center border-4 border-[#8B5A2B] relative flex items-center justify-center">
              <div className="absolute left-4 top-2 text-[10px] text-emerald-300 font-mono tracking-widest uppercase">
                BỤC GIẢNG & MÁY CHIẾU
              </div>
              <span className="font-extrabold tracking-widest text-sm sm:text-base text-emerald-100">
                ★ BẢNG ĐEN LỚP HỌC ★
              </span>
              <div className="absolute right-4 top-2 text-[10px] text-emerald-300 font-mono">
                {classData.settings.className}
              </div>
            </div>

            {/* TEACHER'S DESK (BÀN GIÁO VIÊN) */}
            <div className="flex justify-end pr-8 sm:pr-16">
              <div className="bg-amber-100 border-2 border-amber-700/60 rounded-xl px-5 py-2 text-center shadow-xs">
                <div className="text-[10px] font-bold text-amber-900 uppercase">BÀN GIÁO VIÊN</div>
                <div className="text-xs font-semibold text-amber-950 mt-0.5">
                  {classData.settings.teacherName || 'GVCN'}
                </div>
              </div>
            </div>

            {/* 4 COLUMNS (DÃY 1 -> DÃY 4) WITH WALKWAYS */}
            <div className="grid grid-cols-4 gap-2 sm:gap-5 pt-2 overflow-x-auto pb-4">
              {[1, 2, 3, 4].map((colIndex) => {
                // Get all seats for this column (7 rows x 2 seats = 14 seats)
                const colSeats = seats.filter((s) => s.column === colIndex);

                return (
                  <div
                    key={colIndex}
                    className="bg-[#F8FBFE] border border-[#D9EEFF] rounded-2xl p-2 sm:p-3 space-y-2.5 min-w-[130px]"
                  >
                    {/* Column Header */}
                    <div className="text-center pb-1 border-b border-sky-100">
                      <span className="text-xs font-extrabold text-[#1E3A5F] tracking-wide">
                        DÃY {colIndex}
                      </span>
                    </div>

                    {/* 7 Rows of Desks */}
                    {[1, 2, 3, 4, 5, 6, 7].map((rowIndex) => {
                      const seatLeft = colSeats.find(
                        (s) => s.row === rowIndex && s.position === 'T'
                      );
                      const seatRight = colSeats.find(
                        (s) => s.row === rowIndex && s.position === 'P'
                      );

                      const studentLeft = seatLeft?.studentId ? studentMap.get(seatLeft.studentId) : null;
                      const studentRight = seatRight?.studentId ? studentMap.get(seatRight.studentId) : null;

                      // Highlight if matching search
                      const isLeftMatch =
                        searchStudent &&
                        studentLeft?.fullName.toLowerCase().includes(searchStudent.toLowerCase());
                      const isRightMatch =
                        searchStudent &&
                        studentRight?.fullName.toLowerCase().includes(searchStudent.toLowerCase());

                      return (
                        <div
                          key={rowIndex}
                          className="bg-white rounded-xl border border-slate-200/90 p-1.5 shadow-2xs relative hover:border-[#3289C7] transition-all"
                        >
                          <div className="text-[9px] font-mono font-semibold text-slate-400 text-center mb-1">
                            Bàn {rowIndex}
                          </div>

                          <div className="grid grid-cols-2 gap-1.5">
                            {/* Seat Left */}
                            <button
                              type="button"
                              onClick={() => seatLeft && handleSeatClick(seatLeft)}
                              className={`p-1.5 rounded-lg text-left transition-all cursor-pointer min-h-[48px] flex flex-col justify-between border ${
                                isLeftMatch
                                  ? 'ring-2 ring-amber-400 bg-amber-50 border-amber-300'
                                  : studentLeft
                                  ? studentLeft.gender === 'Nam'
                                    ? 'bg-[#EBF5FF] border-[#BDE0FE] text-sky-950 hover:bg-[#D9EEFF]'
                                    : 'bg-[#FFF0F6] border-[#FFD6E7] text-rose-950 hover:bg-[#FFE0ED]'
                                  : 'bg-slate-50 border-dashed border-slate-300 text-slate-400 hover:bg-slate-100'
                              } ${
                                swapTargetSeat?.seatCode === seatLeft?.seatCode
                                  ? 'ring-2 ring-amber-500 scale-95'
                                  : ''
                              }`}
                              title={
                                studentLeft
                                  ? `${studentLeft.fullName} (${seatLeft?.seatCode})`
                                  : `Ghế trống (${seatLeft?.seatCode})`
                              }
                            >
                              <div className="flex items-center justify-between text-[8px] font-mono text-slate-400">
                                <span>{seatLeft?.seatCode}</span>
                                {studentLeft && (
                                  <span className={studentLeft.gender === 'Nam' ? 'text-sky-600 font-bold' : 'text-rose-600 font-bold'}>
                                    {studentLeft.gender === 'Nam' ? 'N' : 'Nữ'}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] font-bold truncate leading-tight mt-0.5">
                                {studentLeft ? studentLeft.fullName.split(' ').slice(-2).join(' ') : 'Trống'}
                              </div>
                            </button>

                            {/* Seat Right */}
                            <button
                              type="button"
                              onClick={() => seatRight && handleSeatClick(seatRight)}
                              className={`p-1.5 rounded-lg text-left transition-all cursor-pointer min-h-[48px] flex flex-col justify-between border ${
                                isRightMatch
                                  ? 'ring-2 ring-amber-400 bg-amber-50 border-amber-300'
                                  : studentRight
                                  ? studentRight.gender === 'Nam'
                                    ? 'bg-[#EBF5FF] border-[#BDE0FE] text-sky-950 hover:bg-[#D9EEFF]'
                                    : 'bg-[#FFF0F6] border-[#FFD6E7] text-rose-950 hover:bg-[#FFE0ED]'
                                  : 'bg-slate-50 border-dashed border-slate-300 text-slate-400 hover:bg-slate-100'
                              } ${
                                swapTargetSeat?.seatCode === seatRight?.seatCode
                                  ? 'ring-2 ring-amber-500 scale-95'
                                  : ''
                              }`}
                              title={
                                studentRight
                                  ? `${studentRight.fullName} (${seatRight?.seatCode})`
                                  : `Ghế trống (${seatRight?.seatCode})`
                              }
                            >
                              <div className="flex items-center justify-between text-[8px] font-mono text-slate-400">
                                <span>{seatRight?.seatCode}</span>
                                {studentRight && (
                                  <span className={studentRight.gender === 'Nam' ? 'text-sky-600 font-bold' : 'text-rose-600 font-bold'}>
                                    {studentRight.gender === 'Nam' ? 'N' : 'Nữ'}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] font-bold truncate leading-tight mt-0.5">
                                {studentRight ? studentRight.fullName.split(' ').slice(-2).join(' ') : 'Trống'}
                              </div>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Seating Legend */}
            <div className="flex items-center justify-center gap-4 pt-2 text-xs text-slate-500 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-[#EBF5FF] border border-[#BDE0FE] inline-block" />
                <span>Nam</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-[#FFF0F6] border border-[#FFD6E7] inline-block" />
                <span>Nữ</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-slate-50 border border-dashed border-slate-300 inline-block" />
                <span>Ghế trống ({seats.filter(s => !s.studentId).length} chỗ)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB B: BẢNG TIN THÔNG BÁO                                             */}
      {/* ========================================================================= */}
      {subTab === 'announcements' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {['all', 'Thông báo chung', 'Học tập', 'Thi đua', 'Lịch sinh hoạt'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setAnnouncementFilterTag(tag)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    announcementFilterTag === tag
                      ? 'bg-[#3289C7] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tag === 'all' ? 'Tất cả thông báo' : tag}
                </button>
              ))}
            </div>

            {isTeacher && (
              <button
                onClick={() => {
                  setComposerType('announcement');
                  setSubTab('composer');
                }}
                className="px-3.5 py-1.5 bg-[#3289C7] hover:bg-[#256ea4] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                Đăng bài mới
              </button>
            )}
          </div>

          {/* Announcements Feed */}
          <div className="space-y-3">
            {classData.announcements
              .filter((a) => {
                if (announcementFilterTag !== 'all' && a.tag !== announcementFilterTag) return false;
                if (!isTeacher && !a.isPublished) return false;
                return true;
              })
              .map((ann) => (
                <div
                  key={ann.id}
                  className={`bg-white rounded-2xl p-5 border transition-all shadow-2xs ${
                    ann.isPinned ? 'border-sky-300 bg-sky-50/20' : 'border-slate-200/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {ann.isPinned && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-[#3289C7] bg-[#EAF6FF] px-2 py-0.5 rounded-md border border-[#C5E1F7]">
                            <Pin className="w-3 h-3 fill-current" /> Đã ghim
                          </span>
                        )}
                        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {ann.tag}
                        </span>
                        {!ann.isPublished && (
                          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Bản nháp (Chưa công bố)
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                        {ann.title}
                      </h4>

                      <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                        {ann.content}
                      </p>
                      <AnnouncementMedia items={ann.attachments} />

                      <div className="flex items-center gap-3 mt-4 text-xs text-slate-400">
                        <span>Đăng bởi: <strong className="text-slate-600">{ann.author}</strong></span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{ann.createdAt.slice(0, 10)}</span>
                      </div>
                    </div>

                    {isTeacher && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => togglePinAnnouncement(ann.id)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            ann.isPinned
                              ? 'text-[#3289C7] border-sky-200 bg-sky-50'
                              : 'text-slate-400 border-slate-200 hover:bg-slate-50'
                          }`}
                          title={ann.isPinned ? 'Bỏ ghim' : 'Ghim lên đầu'}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingAnnouncement(ann)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                          title="Sửa thông báo"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Bạn có chắc chắn muốn xóa thông báo này?')) {
                              deleteAnnouncement(ann.id);
                            }
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Xóa thông báo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB C: VINH DANH THÀNH TÍCH (HALL OF FAME)                            */}
      {/* ========================================================================= */}
      {subTab === 'honors' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white p-6 rounded-2xl shadow-md">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-semibold tracking-wide uppercase mb-1">
                <Sparkles className="w-3.5 h-3.5" /> Bảng vàng danh dự
              </div>
              <h3 className="text-xl font-extrabold tracking-tight">
                Vinh danh học sinh xuất sắc lớp {classData.settings.className.replace(/^lớp\s*/i, '')}
              </h3>
              <p className="text-xs text-amber-100 mt-1">
                Ghi nhận những thành tích nổi bật và tấm gương chăm ngoan tiêu biểu
              </p>
            </div>

            {isTeacher && (
              <button
                onClick={() => {
                  setComposerType('honor');
                  setSubTab('composer');
                }}
                className="px-4 py-2 bg-white hover:bg-amber-50 text-amber-900 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                Vinh danh mới
              </button>
            )}
          </div>

          {/* Grid of Honors */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classData.honors
              .filter((h) => (isTeacher ? true : h.isPublished))
              .map((honor) => {
                const badgeInfo = badgeIconMap[honor.badge] || badgeIconMap.gold_cup;
                const BadgeIcon = badgeInfo.icon;

                return (
                  <div
                    key={honor.id}
                    className="bg-white rounded-2xl p-5 border border-amber-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${badgeInfo.color}`}
                        >
                          <BadgeIcon className="w-4 h-4" />
                          <span>{badgeInfo.label}</span>
                        </div>

                        {isTeacher && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingHonor(honor)}
                              className="p-1 rounded text-slate-400 hover:text-slate-700"
                              title="Sửa vinh danh"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('Bạn có chắc muốn xóa vinh danh này?')) {
                                  deleteHonor(honor.id);
                                }
                              }}
                              className="p-1 rounded text-slate-400 hover:text-rose-600"
                              title="Xóa vinh danh"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div
                        onClick={() => openStudentProfile(honor.studentId)}
                        className="font-extrabold text-base text-[#3289C7] hover:underline cursor-pointer"
                      >
                        {honor.studentName}
                      </div>
                      <div className="text-xs font-semibold text-slate-800 mt-1 leading-snug">
                        {honor.title}
                      </div>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        {honor.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-mono">{honor.date}</span>
                      <button
                        onClick={triggerConfetti}
                        className="text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" /> Chúc mừng!
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB D: ĐĂNG THÔNG TIN MỚI (COMPOSER WITH RICH PREVIEW)                */}
      {/* ========================================================================= */}
      {subTab === 'composer' && isTeacher && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-6 max-w-3xl mx-auto">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-bold text-base text-[#1E3A5F]">Soạn thảo thông tin mới</h3>
            <p className="text-xs text-slate-500">
              Đăng thông báo lên bảng tin lớp hoặc vinh danh thành tích học sinh
            </p>
          </div>

          {/* Type Selector */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setComposerType('announcement')}
              className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                composerType === 'announcement'
                  ? 'bg-[#EAF6FF] text-[#1E3A5F] border-[#3289C7]'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              <Megaphone className="w-4 h-4 text-[#3289C7]" />
              Thông báo bảng tin
            </button>

            <button
              type="button"
              onClick={() => setComposerType('honor')}
              className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                composerType === 'honor'
                  ? 'bg-amber-50 text-amber-900 border-amber-400'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-600" />
              Vinh danh học sinh
            </button>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {composerType === 'honor' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chọn học sinh được vinh danh (*)
                  </label>
                  <select
                    value={composerStudentId}
                    onChange={(e) => setComposerStudentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#3289C7] focus:outline-none"
                  >
                    <option value="">-- Chọn học sinh --</option>
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.fullName} ({st.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Huy hiệu vinh danh
                  </label>
                  <select
                    value={composerBadge}
                    onChange={(e) => setComposerBadge(e.target.value as BadgeType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#3289C7] focus:outline-none"
                  >
                    <option value="gold_cup">🏆 Cúp Vàng Xuất Sắc</option>
                    <option value="silver_medal">🥈 Huy Chương Bạc</option>
                    <option value="star">⭐ Ngôi Sao Sáng</option>
                    <option value="good_study">📚 Chăm Ngoan Học Tốt</option>
                    <option value="good_deed">❤️ Người Tốt Việc Tốt</option>
                    <option value="creative">💡 Sáng Tạo Nổi Bật</option>
                  </select>
                </div>
              </div>
            )}

            {composerType === 'announcement' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chủ đề thông báo
                  </label>
                  <select
                    value={composerTag}
                    onChange={(e) => setComposerTag(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#3289C7] focus:outline-none"
                  >
                    <option value="Thông báo chung">Thông báo chung</option>
                    <option value="Học tập">Học tập</option>
                    <option value="Thi đua">Thi đua</option>
                    <option value="Lịch sinh hoạt">Lịch sinh hoạt</option>
                    <option value="Khẩn">Khẩn</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={composerIsPinned}
                      onChange={(e) => setComposerIsPinned(e.target.checked)}
                      className="rounded border-slate-300 text-[#3289C7] focus:ring-[#3289C7]"
                    />
                    <span>Ghim thông báo lên đầu bảng tin</span>
                  </label>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tiêu đề {composerType === 'announcement' ? 'thông báo' : 'thành tích'} (*)
              </label>
              <input
                type="text"
                placeholder={
                  composerType === 'announcement'
                    ? 'Ví dụ: Kế hoạch tham quan dã ngoại học kỳ 1'
                    : 'Ví dụ: Đạt giải Nhất cuộc thi Sáng tạo Khoa học kỹ thuật cấp trường'
                }
                value={composerTitle}
                onChange={(e) => setComposerTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#3289C7] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nội dung chi tiết (*)
              </label>
              <textarea
                rows={4}
                placeholder="Nhập nội dung đầy đủ..."
                value={composerContent}
                onChange={(e) => setComposerContent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#3289C7] focus:outline-none"
              />
            </div>

            {composerType === 'announcement' && <MediaEditor items={composerAttachments} onChange={setComposerAttachments} busy={mediaBusy || savingPost} onBusy={setMediaBusy} />}

            {/* PREVIEW BOX */}
            {(composerTitle || composerContent) && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Xem trước nội dung
                </div>
                <div className="font-bold text-sm text-slate-800">{composerTitle || 'Chưa có tiêu đề'}</div>
                <div className="text-xs text-slate-600 mt-1 whitespace-pre-line">
                  {composerContent || 'Chưa có nội dung...'}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                disabled={mediaBusy || savingPost}
                onClick={() => handleComposerSubmit(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Lưu bản nháp
              </button>
              <button
                type="button"
                disabled={mediaBusy || savingPost}
                onClick={() => handleComposerSubmit(true)}
                className="px-5 py-2 bg-[#3289C7] hover:bg-[#256ea4] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {savingPost ? 'Đang lưu...' : mediaBusy ? 'Đang tải tệp...' : 'Đăng công bố ngay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEAT ACTION MODAL (FOR SEATING CHART) */}
      {seatActionModal && isTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 border border-slate-200 shadow-xl animate-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h4 className="font-bold text-sm text-[#1E3A5F]">
                  Thiết lập vị trí ghế {seatActionModal.seatCode}
                </h4>
                <p className="text-[11px] text-slate-400">
                  Dãy {seatActionModal.column} · Bàn {seatActionModal.row} · Ghế{' '}
                  {seatActionModal.position === 'T' ? 'Bên Trái' : 'Bên Phải'}
                </p>
              </div>
              <button
                onClick={() => setSeatActionModal(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gán học sinh vào ghế này:
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) handleAssignStudent(seatActionModal.seatCode, e.target.value);
                }}
                defaultValue={seatActionModal.studentId || ''}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#3289C7]"
              >
                <option value="">-- Chọn học sinh để xếp chỗ --</option>
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.fullName} ({st.id}) {st.seatCode ? `[Hiện tại: ${st.seatCode}]` : '[Chưa có chỗ]'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setSwapTargetSeat(seatActionModal);
                  setSeatActionModal(null);
                  showToast(`Hãy nhấp vào ghế thứ hai bạn muốn hoán đổi với ${seatActionModal.seatCode}!`, 'info');
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                Đổi vị trí với ghế khác
              </button>

              {seatActionModal.studentId && (
                <button
                  type="button"
                  onClick={() => handleVacateSeat(seatActionModal.seatCode)}
                  className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Bỏ trống ghế
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT ANNOUNCEMENT MODAL */}
      {editingAnnouncement && isTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90dvh] overflow-y-auto p-5 space-y-4 border border-slate-200 shadow-xl">
            <h4 className="font-bold text-sm text-[#1E3A5F]">Chỉnh sửa thông báo</h4>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tiêu đề</label>
              <input
                type="text"
                value={editingAnnouncement.title}
                onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nội dung</label>
              <textarea
                rows={4}
                value={editingAnnouncement.content}
                onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, content: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <MediaEditor items={editingAnnouncement.attachments || []} onChange={items => setEditingAnnouncement(current => current ? { ...current, attachments: items } : current)} busy={mediaBusy || savingPost} onBusy={setMediaBusy} />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={editingAnnouncement.isPublished}
                  onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, isPublished: e.target.checked })}
                />
                Công bố cho học sinh xem
              </label>
              <div className="flex items-center gap-2">
                <button
                  disabled={mediaBusy || savingPost}
                  onClick={() => setEditingAnnouncement(null)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  disabled={mediaBusy || savingPost}
                  onClick={async () => {
                    setSavingPost(true);
                    try { await updateAnnouncement(editingAnnouncement); setEditingAnnouncement(null); }
                    catch (e: any) { showToast(e.message || 'Chưa lưu được thông báo', 'error'); }
                    finally { setSavingPost(false); }
                  }}
                  className="px-4 py-1.5 bg-[#3289C7] text-white text-xs font-semibold rounded-lg"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
