import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Calendar,
  Award,
  BookOpen,
  User,
  Phone,
  KeyRound,
  CheckCircle,
  Clock,
  AlertTriangle,
  MinusCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { AttendanceStatus } from '../types';

export const StudentProfileModal: React.FC = () => {
  const {
    user,
    classData,
    selectedStudentId,
    studentProfileInitialTab,
    closeStudentProfile,
    resetStudentPassword,
    deleteDisciplineRecord,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'attendance' | 'academics' | 'discipline' | 'info'>(
    studentProfileInitialTab || 'attendance'
  );
  const [academicSemester, setAcademicSemester] = useState<'HK1' | 'HK2'>('HK1');
  const [resettingPassword, setResettingPassword] = useState(false);

  if (!selectedStudentId || !classData) return null;

  const student = classData.students.find(s => s.id === selectedStudentId);
  if (!student) return null;

  const isTeacher = user?.role === 'teacher';

  // Attendance statistics for this student
  const studentAttendance = classData.attendance.filter(a => a.studentId === student.id);
  const presentCount = studentAttendance.filter(a => a.status === 'present').length;
  const lateCount = studentAttendance.filter(a => a.status === 'late').length;
  const excusedCount = studentAttendance.filter(a => a.status === 'excused').length;
  const unexcusedCount = studentAttendance.filter(a => a.status === 'unexcused').length;
  const totalRecordedDays = studentAttendance.length;

  // Discipline statistics for this student
  const studentDiscipline = classData.disciplineRecords.filter(d => d.studentId === student.id);
  const totalDisciplineDelta = studentDiscipline.reduce((sum, d) => sum + d.points, 0);
  const startingScore = classData.settings.startingScore ?? 100;
  const currentTotalScore = startingScore + totalDisciplineDelta;

  // Conduct tier determination
  const tiers = classData.settings.evaluationTiers || { excellent: 90, good: 75, average: 50 };
  let calculatedTier = 'Chưa đạt';
  let tierColor = 'text-rose-600 bg-rose-50 border-rose-200';
  if (currentTotalScore >= tiers.excellent) {
    calculatedTier = 'Tốt';
    tierColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  } else if (currentTotalScore >= tiers.good) {
    calculatedTier = 'Khá';
    tierColor = 'text-sky-700 bg-sky-50 border-sky-200';
  } else if (currentTotalScore >= tiers.average) {
    calculatedTier = 'Đạt';
    tierColor = 'text-amber-700 bg-amber-50 border-amber-200';
  }

  // Check if teacher manually adjusted
  const periodKey = `${student.id}_total`;
  const customAdjustment = classData.conductAdjustments?.[periodKey];
  const finalTier = customAdjustment ? customAdjustment.adjustedTier : calculatedTier;

  // Academic grades for this student
  const activeSubjects = classData.subjects.filter(s => s.isActive);
  const studentGrades = classData.grades.filter(
    g => g.studentId === student.id && g.semester === academicSemester
  );

  const handleResetPassword = async () => {
    const confirm = window.confirm(
      `Bạn có chắc chắn muốn đặt lại mật khẩu cho học sinh ${student.fullName}? Mật khẩu mới sẽ là ngày sinh (định dạng DDMMYYYY: ${student.dob.replace(/[^0-9]/g, '')}).`
    );
    if (!confirm) return;

    setResettingPassword(true);
    try {
      await resetStudentPassword(student.id);
    } catch (e: any) {
      showToast(e.message || 'Không thể đặt lại mật khẩu', 'error');
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-sky-100 max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-gradient-to-r from-[#F0F7FD] to-white">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Hồ sơ học sinh · Lớp {classData.settings.className}
          </div>
          <button
            onClick={closeStudentProfile}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Header: BIG NAME IN BEAUTIFUL OCEAN BLUE, BALANCED & CENTERED */}
        <div className="px-6 py-6 text-center border-b border-slate-100 bg-[#FAFDFE]">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold text-[#3289C7] bg-[#EAF6FF] border border-[#BDE0FE] mb-2">
            MÃ HỌC SINH: {student.id}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#3289C7] tracking-tight">
            {student.fullName}
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-3 text-xs sm:text-sm text-slate-600">
            <span className="font-medium">
              Giới tính: <strong className="text-slate-800">{student.gender}</strong>
            </span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span className="font-medium">
              Ngày sinh: <strong className="text-slate-800 font-mono">{student.dob}</strong>
            </span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span className="font-medium">
              SĐT liên hệ: <strong className="text-slate-800 font-mono">{student.phone}</strong>
            </span>
            {student.seatCode && (
              <>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <span className="font-medium">
                  Vị trí: <strong className="text-sky-700 font-mono">{student.seatCode}</strong>
                </span>
              </>
            )}
          </div>
        </div>

        {/* 4 Main Action Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'attendance'
                  ? 'border-[#3289C7] text-[#3289C7] bg-[#EAF6FF]/60'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Điểm danh
            </button>

            <button
              onClick={() => setActiveTab('academics')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'academics'
                  ? 'border-[#3289C7] text-[#3289C7] bg-[#EAF6FF]/60'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Học tập
            </button>

            <button
              onClick={() => setActiveTab('discipline')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'discipline'
                  ? 'border-[#3289C7] text-[#3289C7] bg-[#EAF6FF]/60'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Award className="w-4 h-4" />
              Thi đua
            </button>

            <button
              onClick={() => setActiveTab('info')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'info'
                  ? 'border-[#3289C7] text-[#3289C7] bg-[#EAF6FF]/60'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <User className="w-4 h-4" />
              Thông tin học sinh
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">
          {/* TAB 1: ĐIỂM DANH */}
          {activeTab === 'attendance' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                  <div className="text-xl font-bold font-mono text-emerald-700">{presentCount}</div>
                  <div className="text-xs text-emerald-800 font-medium mt-0.5">Có mặt</div>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-center">
                  <div className="text-xl font-bold font-mono text-amber-700">{lateCount}</div>
                  <div className="text-xs text-amber-800 font-medium mt-0.5">Đi muộn</div>
                </div>
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 text-center">
                  <div className="text-xl font-bold font-mono text-sky-700">{excusedCount}</div>
                  <div className="text-xs text-sky-800 font-medium mt-0.5">Vắng có phép</div>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-center">
                  <div className="text-xl font-bold font-mono text-rose-700">{unexcusedCount}</div>
                  <div className="text-xs text-rose-800 font-medium mt-0.5">Vắng không phép</div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Lịch sử điểm danh chi tiết ({totalRecordedDays} ngày đã ghi nhận)
                </h4>
                {studentAttendance.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-xl">
                    Chưa có dữ liệu điểm danh nào được ghi nhận cho học sinh này.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Ngày</th>
                          <th className="py-2.5 px-3">Trạng thái</th>
                          <th className="py-2.5 px-3">Ghi chú / Nguồn</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {studentAttendance
                          .slice()
                          .sort((a, b) => b.date.localeCompare(a.date))
                          .map((att) => {
                            let statusBadge = (
                              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Có mặt
                              </span>
                            );
                            if (att.status === 'late') {
                              statusBadge = (
                                <span className="text-amber-700 font-semibold flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" /> Đi muộn
                                </span>
                              );
                            } else if (att.status === 'excused') {
                              statusBadge = (
                                <span className="text-sky-700 font-semibold flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Vắng có phép
                                </span>
                              );
                            } else if (att.status === 'unexcused') {
                              statusBadge = (
                                <span className="text-rose-700 font-semibold flex items-center gap-1">
                                  <MinusCircle className="w-3.5 h-3.5" /> Vắng không phép
                                </span>
                              );
                            }

                            return (
                              <tr key={att.id} className="hover:bg-slate-50/60">
                                <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                                  {att.date}
                                </td>
                                <td className="py-2.5 px-3">{statusBadge}</td>
                                <td className="py-2.5 px-3 text-slate-500">
                                  {att.note || '-'}
                                  {att.linkedDisciplineId && (
                                    <span className="text-[10px] text-sky-600 block">
                                      (Tự động liên kết từ sự việc thi đua)
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: HỌC TẬP */}
          {activeTab === 'academics' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Bảng điểm môn học
                </h4>
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  <button
                    onClick={() => setAcademicSemester('HK1')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      academicSemester === 'HK1'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Học kỳ 1
                  </button>
                  <button
                    onClick={() => setAcademicSemester('HK2')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      academicSemester === 'HK2'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Học kỳ 2
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Môn học</th>
                      <th className="py-2.5 px-3">Thường xuyên (TX)</th>
                      <th className="py-2.5 px-3">Giữa kỳ (GK)</th>
                      <th className="py-2.5 px-3">Cuối kỳ (CK)</th>
                      <th className="py-2.5 px-3">ĐTB / Nhận xét</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeSubjects.map((subject) => {
                      const gradesForSub = studentGrades.filter((g) => g.subjectId === subject.id);
                      const txScores = gradesForSub.filter((g) => g.type === 'tx');
                      const gkScore = gradesForSub.find((g) => g.type === 'gk');
                      const ckScore = gradesForSub.find((g) => g.type === 'ck');

                      if (subject.evalType === 'comment') {
                        const lastEval = gradesForSub[gradesForSub.length - 1];
                        return (
                          <tr key={subject.id} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-3 font-semibold text-slate-800">
                              {subject.name}
                            </td>
                            <td colSpan={3} className="py-2.5 px-3 text-slate-400 italic">
                              Đánh giá bằng nhận xét
                            </td>
                            <td className="py-2.5 px-3 font-bold text-sky-700">
                              {lastEval?.evaluation || 'Chưa đánh giá'}
                            </td>
                          </tr>
                        );
                      }

                      // Numeric score calculation: TX weight 1, GK weight 2, CK weight 3
                      const txVals = txScores.map((g) => g.score).filter((s): s is number => s !== undefined);
                      let avgText = '-';
                      if (txVals.length > 0 || gkScore?.score !== undefined || ckScore?.score !== undefined) {
                        let totalWeight = 0;
                        let totalWeightedSum = 0;

                        if (txVals.length > 0) {
                          const txAvg = txVals.reduce((a, b) => a + b, 0) / txVals.length;
                          totalWeightedSum += txAvg * 1;
                          totalWeight += 1;
                        }
                        if (gkScore?.score !== undefined) {
                          totalWeightedSum += gkScore.score * 2;
                          totalWeight += 2;
                        }
                        if (ckScore?.score !== undefined) {
                          totalWeightedSum += ckScore.score * 3;
                          totalWeight += 3;
                        }

                        if (totalWeight > 0) {
                          const avg = Math.round((totalWeightedSum / totalWeight) * 10) / 10;
                          avgText = avg.toFixed(1);
                        }
                      }

                      return (
                        <tr key={subject.id} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {subject.name}
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            {txVals.length > 0 ? txVals.join(', ') : '-'}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-medium">
                            {gkScore?.score !== undefined ? gkScore.score : '-'}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-medium">
                            {ckScore?.score !== undefined ? ckScore.score : '-'}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-sky-700">
                            {avgText}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: THI ĐUA */}
          {activeTab === 'discipline' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">Điểm khởi tạo kỳ</div>
                  <div className="text-2xl font-bold font-mono text-slate-700 mt-1">
                    {startingScore}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#EAF6FF] border border-[#BDE0FE]">
                  <div className="text-xs text-sky-800 font-medium">Điểm tổng kết hiện tại</div>
                  <div className="text-2xl font-bold font-mono text-[#3289C7] mt-1">
                    {currentTotalScore}đ
                  </div>
                  <div className="text-[11px] text-sky-600 mt-0.5">
                    (Thay đổi: {totalDisciplineDelta > 0 ? `+${totalDisciplineDelta}` : totalDisciplineDelta}đ)
                  </div>
                </div>
                <div className={`p-3.5 rounded-xl border ${tierColor}`}>
                  <div className="text-xs font-medium">Xếp loại rèn luyện</div>
                  <div className="text-2xl font-extrabold mt-1">{finalTier}</div>
                  {customAdjustment && (
                    <div className="text-[10px] mt-0.5 italic">
                      Đã điều chỉnh: {customAdjustment.reason}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Lịch sử ghi nhận sự việc thi đua ({studentDiscipline.length})
                </h4>
                {studentDiscipline.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-xl">
                    Chưa có sự việc thi đua nào được ghi nhận cho học sinh này.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Ngày</th>
                          <th className="py-2.5 px-3">Sự việc</th>
                          <th className="py-2.5 px-3">Nhóm</th>
                          <th className="py-2.5 px-3 text-right">Điểm (+/-)</th>
                          <th className="py-2.5 px-3">Ghi chú</th>
                          {isTeacher && <th className="py-2.5 px-3 text-center">Xóa</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {studentDiscipline
                          .slice()
                          .sort((a, b) => b.date.localeCompare(a.date))
                          .map((rec) => (
                            <tr key={rec.id} className="hover:bg-slate-50/60">
                              <td className="py-2.5 px-3 font-mono font-medium text-slate-700">
                                {rec.date}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-slate-800">
                                {rec.ruleTitle}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500">{rec.group}</td>
                              <td
                                className={`py-2.5 px-3 text-right font-mono font-bold ${
                                  rec.points > 0 ? 'text-emerald-600' : 'text-rose-600'
                                }`}
                              >
                                {rec.points > 0 ? `+${rec.points}` : rec.points}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">{rec.note || '-'}</td>
                              {isTeacher && (
                                <td className="py-2.5 px-3 text-center">
                                  <button
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          `Xác nhận xóa ghi nhận sự việc "${rec.ruleTitle}" của học sinh này?`
                                        )
                                      ) {
                                        deleteDisciplineRecord(rec.id);
                                      }
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                    title="Xóa sự việc"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: THÔNG TIN HỌC SINH */}
          {activeTab === 'info' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-slate-400 mb-0.5">Mã học sinh</div>
                  <div className="font-mono font-bold text-slate-800">{student.id}</div>
                </div>
                <div>
                  <div className="text-slate-400 mb-0.5">Họ và tên</div>
                  <div className="font-bold text-slate-800">{student.fullName}</div>
                </div>
                <div>
                  <div className="text-slate-400 mb-0.5">Giới tính</div>
                  <div className="font-medium text-slate-800">{student.gender}</div>
                </div>
                <div>
                  <div className="text-slate-400 mb-0.5">Ngày sinh</div>
                  <div className="font-mono font-medium text-slate-800">{student.dob}</div>
                </div>
                <div>
                  <div className="text-slate-400 mb-0.5">Số điện thoại học sinh</div>
                  <div className="font-mono font-medium text-slate-800">{student.phone}</div>
                </div>
                <div>
                  <div className="text-slate-400 mb-0.5">Số điện thoại phụ huynh</div>
                  <div className="font-mono font-medium text-slate-800">
                    {student.parentPhone || 'Chưa cập nhật'}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-slate-400 mb-0.5">Địa chỉ liên hệ</div>
                  <div className="font-medium text-slate-800">
                    {student.address || 'Chưa cập nhật'}
                  </div>
                </div>
                {student.notes && (
                  <div className="sm:col-span-2">
                    <div className="text-slate-400 mb-0.5">Ghi chú của GVCN</div>
                    <div className="text-slate-700 italic">{student.notes}</div>
                  </div>
                )}
              </div>

              {/* Password management for Teacher */}
              {isTeacher && (
                <div className="p-4 bg-sky-50/70 rounded-xl border border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-[#3289C7]" />
                      Đặt lại mật khẩu tài khoản học sinh
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Mật khẩu sẽ được đặt lại về ngày sinh định dạng DDMMYYYY ({student.dob.replace(/[^0-9]/g, '')}). Học sinh sẽ được yêu cầu đổi mật khẩu ở lần đăng nhập tiếp theo.
                    </p>
                  </div>
                  <button
                    onClick={handleResetPassword}
                    disabled={resettingPassword}
                    className="px-3.5 py-2 bg-white hover:bg-sky-50 text-[#3289C7] font-semibold rounded-lg border border-sky-200 shadow-2xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {resettingPassword ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            onClick={closeStudentProfile}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
