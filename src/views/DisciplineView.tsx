import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Award,
  Calendar,
  User,
  PlusCircle,
  Clock,
  Edit,
  Trash2,
  Filter,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { DisciplineRecord, DisciplineRule } from '../types';

export const DisciplineView: React.FC = () => {
  const {
    user,
    classData,
    addDisciplineRecord,
    updateDisciplineRecord,
    deleteDisciplineRecord,
    adjustConduct,
    openStudentProfile,
    showToast,
  } = useApp();

  const isTeacher = user?.role === 'teacher';

  // Area A Form State (Ghi nhận sự việc)
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedRuleId, setSelectedRuleId] = useState('');
  const [eventDate, setEventDate] = useState('2026-10-15');
  const [eventNote, setEventNote] = useState('');

  // Area B Filter State (Kỳ đánh giá)
  const [periodFilter, setPeriodFilter] = useState<string>('all'); // 'all', '09', '10', '11', '12', '01', '02', '03', '04', '05'
  const [searchStudentInTable, setSearchStudentInTable] = useState('');

  // Adjustment Modal
  const [adjustingStudent, setAdjustingStudent] = useState<{
    id: string;
    name: string;
    currentTier: string;
    currentScore: number;
  } | null>(null);
  const [adjustedTierVal, setAdjustedTierVal] = useState('Tốt');
  const [adjustReason, setAdjustReason] = useState('');

  // Edit record modal
  const [editingRecord, setEditingRecord] = useState<DisciplineRecord | null>(null);

  const students = classData?.students || [];
  const rules = classData?.rules || [];
  const startingScore = classData?.settings?.startingScore ?? 100;
  const tiers = classData?.settings?.evaluationTiers || { excellent: 90, good: 75, average: 50 };

  // Currently selected rule details
  const currentRule = rules.find((r) => r.id === selectedRuleId);

  // Filtered discipline records based on period
  const filteredRecords = useMemo(() => {
    return (classData?.disciplineRecords || []).filter((rec) => {
      if (periodFilter === 'all') return true;
      const month = rec.date.split('-')[1];
      return month === periodFilter;
    });
  }, [classData?.disciplineRecords, periodFilter]);

  // Compute student scores & rankings in current period
  const studentEvaluations = useMemo(() => {
    return students.map((student) => {
      const records = filteredRecords.filter((d) => d.studentId === student.id);
      const delta = records.reduce((sum, r) => sum + r.points, 0);
      const totalScore = startingScore + delta;

      let calculatedTier = 'Chưa đạt';
      let tierColor = 'text-rose-700 bg-rose-50 border-rose-200';

      if (totalScore >= tiers.excellent) {
        calculatedTier = 'Tốt';
        tierColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
      } else if (totalScore >= tiers.good) {
        calculatedTier = 'Khá';
        tierColor = 'text-sky-700 bg-sky-50 border-sky-200';
      } else if (totalScore >= tiers.average) {
        calculatedTier = 'Đạt';
        tierColor = 'text-amber-700 bg-amber-50 border-amber-200';
      }

      // Check if teacher adjusted
      const periodKey = `${student.id}_${periodFilter}`;
      const adjustment = classData?.conductAdjustments?.[periodKey];
      const finalTier = adjustment ? adjustment.adjustedTier : calculatedTier;

      return {
        student,
        delta,
        totalScore,
        calculatedTier,
        finalTier,
        tierColor,
        isAdjusted: Boolean(adjustment),
        adjustmentReason: adjustment?.reason,
        eventCount: records.length,
      };
    });
  }, [students, filteredRecords, startingScore, tiers, periodFilter, classData?.conductAdjustments]);

  if (!classData) return null;

  // Handle Save Record (Area A)
  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      showToast('Vui lòng chọn học sinh', 'error');
      return;
    }
    if (!selectedRuleId || !currentRule) {
      showToast('Vui lòng chọn quy tắc thi đua', 'error');
      return;
    }
    if (!eventDate) {
      showToast('Vui lòng chọn ngày xảy ra sự việc', 'error');
      return;
    }

    try {
      await addDisciplineRecord({
        studentId: selectedStudentId,
        ruleId: currentRule.id,
        ruleTitle: currentRule.title,
        group: currentRule.group,
        points: currentRule.points,
        date: eventDate,
        note: eventNote.trim(),
      });

      // Clear note
      setEventNote('');
    } catch (err: any) {
      showToast(err.message || 'Lỗi ghi nhận sự việc', 'error');
    }
  };

  const handleDeleteRecord = (rec: DisciplineRecord) => {
    const student = students.find((s) => s.id === rec.studentId);
    if (
      window.confirm(
        `Xác nhận xóa sự việc "${rec.ruleTitle}" (${rec.points > 0 ? '+' : ''}${rec.points}đ) của học sinh ${student?.fullName || rec.studentId}? Hệ thống sẽ tự động tính lại tổng điểm và cập nhật điểm danh liên quan.`
      )
    ) {
      deleteDisciplineRecord(rec.id);
    }
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingStudent) return;
    try {
      await adjustConduct(adjustingStudent.id, periodFilter, adjustedTierVal, adjustReason.trim());
      setAdjustingStudent(null);
      setAdjustReason('');
    } catch (err: any) {
      showToast(err.message || 'Lỗi điều chỉnh kết quả', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-[#1E3A5F]">
            Quản lý Thi đua & Kết quả rèn luyện
          </h2>
          <p className="text-xs text-slate-500">
            Ghi nhận nề nếp, chuyên cần, phong trào và tổng kết rèn luyện lớp {classData.settings.className.replace(/^lớp\s*/i, '')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Điểm chuẩn kỳ:</span>
          <span className="text-xs font-mono font-bold text-[#3289C7] bg-[#EAF6FF] px-2.5 py-1 rounded-xl border border-[#BDE0FE]">
            {startingScore} điểm
          </span>
        </div>
      </div>

      {/* Main Layout: Desktop 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* AREA A: GHI NHẬN SỰ VIỆC (BÊN TRÁI TRÊN DESKTOP)                          */}
        {/* ========================================================================= */}
        {isTeacher ? (
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4 sticky top-16">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#EAF6FF] text-[#3289C7] flex items-center justify-center font-bold">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-[#1E3A5F]">Ghi nhận sự việc thi đua</h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Tự động cộng/trừ điểm và đồng bộ điểm danh nếu có liên kết
              </p>
            </div>

            <form onSubmit={handleSaveRecord} className="space-y-3.5">
              {/* Ngày xảy ra */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ngày xảy ra (Mặc định hôm nay) (*)
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#3289C7]"
                  />
                </div>
              </div>

              {/* Chọn học sinh */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chọn học sinh (*)
                </label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#3289C7]"
                >
                  <option value="">-- Chọn học sinh --</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullName} ({st.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Chọn quy tắc thi đua */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quy tắc thi đua (từ Cài đặt) (*)
                </label>
                <select
                  required
                  value={selectedRuleId}
                  onChange={(e) => setSelectedRuleId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#3289C7]"
                >
                  <option value="">-- Chọn sự việc / quy tắc --</option>
                  {rules.map((rule) => (
                    <option key={rule.id} value={rule.id}>
                      [{rule.group}] {rule.title} ({rule.points > 0 ? `+${rule.points}` : rule.points}đ)
                    </option>
                  ))}
                </select>
              </div>

              {/* Tự động hiển thị điểm cộng/trừ và liên kết điểm danh */}
              {currentRule && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Mức điểm áp dụng:</span>
                    <span
                      className={`font-mono font-bold text-sm ${
                        currentRule.points > 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {currentRule.points > 0 ? `+${currentRule.points}` : currentRule.points} điểm
                    </span>
                  </div>

                  {currentRule.linkAttendance !== 'none' && (
                    <div className="flex items-center gap-1.5 text-[11px] text-[#3289C7] font-medium pt-1 border-t border-slate-200">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        Tự động cập nhật điểm danh: <strong>{currentRule.linkAttendance === 'late' ? 'Đi muộn' : currentRule.linkAttendance === 'unexcused' ? 'Vắng không phép' : 'Vắng có phép'}</strong>
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Nhập ghi chú */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ghi chú chi tiết (nếu có)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú tiết học, hoàn cảnh, mức độ vi phạm hoặc biểu dương..."
                  value={eventNote}
                  onChange={(e) => setEventNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#3289C7]"
                />
              </div>

              {/* Nút Lưu ghi nhận */}
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-[#3289C7] hover:bg-[#256ea4] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                Lưu ghi nhận sự việc
              </button>
            </form>
          </div>
        ) : (
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
            <h3 className="font-bold text-sm text-[#1E3A5F]">Thi đua cá nhân</h3>
            <p className="text-xs text-slate-500">
              Bạn đang xem dữ liệu thi đua của chính mình.
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: AREA B (KỲ ĐÁNH GIÁ TRÊN) & AREA C (LỊCH SỬ DƯỚI)          */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 space-y-6">
          {/* ===================================================================== */}
          {/* AREA B: BẢNG KỲ ĐÁNH GIÁ (RIGHT TOP)                                  */}
          {/* ===================================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-[#1E3A5F]">
                  Bảng tổng kết thi đua & rèn luyện
                </h3>
                <p className="text-xs text-slate-500">
                  Tổng điểm = Điểm chuẩn ({startingScore}đ) + Điểm sự việc trong kỳ
                </p>
              </div>

              {/* Period Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Kỳ đánh giá:</span>
                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3289C7]"
                >
                  <option value="all">Toàn năm học</option>
                  <option value="10">Tháng 10 (Hiện tại)</option>
                  <option value="09">Tháng 9</option>
                  <option value="11">Tháng 11</option>
                  <option value="12">Tháng 12</option>
                  <option value="01">Tháng 1</option>
                  <option value="02">Tháng 2</option>
                  <option value="03">Tháng 3</option>
                  <option value="04">Tháng 4</option>
                  <option value="05">Tháng 5</option>
                </select>
              </div>
            </div>

            {/* Student Score Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FAFDFE] border-b border-slate-200 text-slate-600 font-bold sticky top-0 z-10 shadow-2xs">
                  <tr>
                    <th className="py-2.5 px-3">Mã HS</th>
                    <th className="py-2.5 px-3">Họ và tên</th>
                    <th className="py-2.5 px-3 text-center">Số sự việc</th>
                    <th className="py-2.5 px-3 text-right">Tổng điểm</th>
                    <th className="py-2.5 px-3 text-center">Kết quả rèn luyện</th>
                    {isTeacher && <th className="py-2.5 px-3 text-center">Điều chỉnh</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentEvaluations.map((item) => (
                    <tr key={item.student.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-600">
                        {item.student.id}
                      </td>
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => openStudentProfile(item.student.id, 'discipline')}
                          className="font-bold text-[#3289C7] hover:underline text-left cursor-pointer"
                        >
                          {item.student.fullName}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                        {item.eventCount}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                        <span>{item.totalScore}đ</span>
                        <span className="text-[10px] text-slate-400 font-normal ml-1">
                          ({item.delta > 0 ? `+${item.delta}` : item.delta})
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${item.tierColor}`}
                        >
                          {item.finalTier}
                          {item.isAdjusted && <span className="ml-1 text-[9px]">*</span>}
                        </span>
                      </td>
                      {isTeacher && (
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => {
                              setAdjustingStudent({
                                id: item.student.id,
                                name: item.student.fullName,
                                currentTier: item.finalTier,
                                currentScore: item.totalScore,
                              });
                              setAdjustedTierVal(item.finalTier);
                              setAdjustReason(item.adjustmentReason || '');
                            }}
                            className="text-[11px] text-[#3289C7] hover:underline font-semibold cursor-pointer"
                          >
                            Xác nhận/Sửa
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-400 italic">
              * Mức đánh giá được tính theo ngưỡng cấu hình trong Cài đặt (Tốt ≥ {tiers.excellent}đ, Khá ≥ {tiers.good}đ, Đạt ≥ {tiers.average}đ). GVCN có thể xác nhận/điều chỉnh có ghi lý do.
            </p>
          </div>

          {/* ===================================================================== */}
          {/* AREA C: LỊCH SỬ GHI NHẬN (RIGHT BOTTOM)                               */}
          {/* ===================================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-[#1E3A5F]">
                  Lịch sử ghi nhận sự việc ({filteredRecords.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Sắp xếp mới nhất trước · Cuộn mượt mà · Tiêu đề cố định
                </p>
              </div>
            </div>

            {/* Scrollable table with sticky header */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FAFDFE] border-b border-slate-200 text-slate-600 font-bold sticky top-0 z-10 shadow-2xs">
                  <tr>
                    <th className="py-2.5 px-3">Ngày</th>
                    <th className="py-2.5 px-3">Học sinh</th>
                    <th className="py-2.5 px-3">Sự việc</th>
                    <th className="py-2.5 px-3 text-right">Điểm</th>
                    <th className="py-2.5 px-3">Ghi chú</th>
                    {isTeacher && <th className="py-2.5 px-3 text-center">Thao tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Chưa có sự việc thi đua nào trong kỳ được chọn.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords
                      .slice()
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((rec) => {
                        const student = students.find((s) => s.id === rec.studentId);
                        return (
                          <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-medium text-slate-600 whitespace-nowrap">
                              {rec.date}
                            </td>
                            <td className="py-2.5 px-3">
                              <button
                                onClick={() => openStudentProfile(rec.studentId, 'discipline')}
                                className="font-bold text-[#3289C7] hover:underline text-left cursor-pointer"
                              >
                                {student?.fullName || rec.studentId}
                              </button>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">
                              {rec.ruleTitle}
                            </td>
                            <td
                              className={`py-2.5 px-3 text-right font-mono font-bold ${
                                rec.points > 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {rec.points > 0 ? `+${rec.points}` : rec.points}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 max-w-[180px] truncate">
                              {rec.note || '-'}
                            </td>
                            {isTeacher && (
                              <td className="py-2.5 px-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => setEditingRecord(rec)}
                                    className="p-1 text-slate-400 hover:text-slate-800 rounded cursor-pointer"
                                    title="Sửa sự việc"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRecord(rec)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                    title="Xóa sự việc"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ADJUST CONDUCT TIER MODAL */}
      {adjustingStudent && isTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-xl">
            <h4 className="font-bold text-sm text-[#1E3A5F]">
              Xác nhận / Điều chỉnh kết quả rèn luyện
            </h4>
            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <div>
                Học sinh: <strong>{adjustingStudent.name}</strong> ({adjustingStudent.id})
              </div>
              <div>
                Tổng điểm thi đua trong kỳ: <strong>{adjustingStudent.currentScore} điểm</strong>
              </div>
              <div>
                Kết quả tính theo điểm: <strong>{adjustingStudent.currentTier}</strong>
              </div>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mức xếp loại rèn luyện chính thức
                </label>
                <select
                  value={adjustedTierVal}
                  onChange={(e) => setAdjustedTierVal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  <option value="Tốt">Tốt</option>
                  <option value="Khá">Khá</option>
                  <option value="Đạt">Đạt</option>
                  <option value="Cần rèn luyện">Cần rèn luyện</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lý do điều chỉnh / Nhận xét của GVCN (*)
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ghi rõ căn cứ nhận xét, hoàn cảnh hoặc sự tiến bộ..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingStudent(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#3289C7] text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Lưu xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DISCIPLINE RECORD MODAL */}
      {editingRecord && isTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-xl">
            <h4 className="font-bold text-sm text-[#1E3A5F]">Chỉnh sửa sự việc thi đua</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày ghi nhận</label>
                <input
                  type="date"
                  value={editingRecord.date}
                  onChange={(e) => setEditingRecord({ ...editingRecord, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Điểm cộng/trừ</label>
                <input
                  type="number"
                  value={editingRecord.points}
                  onChange={(e) =>
                    setEditingRecord({ ...editingRecord, points: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi chú</label>
                <textarea
                  rows={2}
                  value={editingRecord.note || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingRecord(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  updateDisciplineRecord(editingRecord);
                  setEditingRecord(null);
                }}
                className="px-4 py-1.5 bg-[#3289C7] text-white text-xs font-semibold rounded-lg"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
