import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MinusCircle,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Eye,
} from 'lucide-react';
import { AttendanceStatus } from '../types';

export const AttendanceView: React.FC = () => {
  const {
    user,
    classData,
    setAttendance,
    setBatchAttendance,
    openStudentProfile,
    showToast,
  } = useApp();

  const isTeacher = user?.role === 'teacher';
  const [selectedDate, setSelectedDate] = useState('2026-10-15');
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [selectedMonth, setSelectedMonth] = useState('10');
  const [search, setSearch] = useState('');

  const students = classData?.students || [];
  const attendanceList = classData?.attendance || [];

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(search.toLowerCase()) ||
        s.id.toLowerCase().includes(search.toLowerCase())
    );
  }, [students, search]);

  // Attendance for selected date
  const dayRecordsMap = useMemo(() => {
    const map = new Map<string, any>();
    attendanceList
      .filter((a) => a.date === selectedDate)
      .forEach((a) => map.set(a.studentId, a));
    return map;
  }, [attendanceList, selectedDate]);

  // Date navigation helpers
  const handleShiftDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().slice(0, 10));
  };

  // Day Stats
  const dayStats = useMemo(() => {
    let present = 0;
    let late = 0;
    let excused = 0;
    let unexcused = 0;

    students.forEach((s) => {
      const rec = dayRecordsMap.get(s.id);
      const status: AttendanceStatus = rec?.status || 'present';
      if (status === 'present') present++;
      else if (status === 'late') late++;
      else if (status === 'excused') excused++;
      else if (status === 'unexcused') unexcused++;
    });

    return { present, late, excused, unexcused, total: students.length };
  }, [students, dayRecordsMap]);

  // Monthly stats per student
  const monthlyStats = useMemo(() => {
    return students.map((student) => {
      const studentMonthAtt = attendanceList.filter(
        (a) => a.studentId === student.id && a.date.split('-')[1] === selectedMonth
      );
      const present = studentMonthAtt.filter((a) => a.status === 'present').length;
      const late = studentMonthAtt.filter((a) => a.status === 'late').length;
      const excused = studentMonthAtt.filter((a) => a.status === 'excused').length;
      const unexcused = studentMonthAtt.filter((a) => a.status === 'unexcused').length;
      const total = studentMonthAtt.length;
      const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 100;

      return { student, present, late, excused, unexcused, total, rate };
    });
  }, [students, attendanceList, selectedMonth]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    if (!isTeacher) return;
    setAttendance(studentId, selectedDate, status);
  };

  if (!classData) return null;

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-[#1E3A5F]">
            Quản lý Điểm danh & Chuyên cần
          </h2>
          <p className="text-xs text-slate-500">
            Điểm danh trực tiếp hoặc tự động đồng bộ từ sự việc thi đua
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                viewMode === 'daily'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Theo ngày
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                viewMode === 'monthly'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tổng hợp tháng
            </button>
          </div>
        </div>
      </div>

      {/* DAILY VIEW */}
      {viewMode === 'daily' && (
        <div className="space-y-4">
          {/* Date Selector & Bulk Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleShiftDate(-1)}
                className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                title="Ngày hôm trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#3289C7]" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3289C7]"
                />
              </div>

              <button
                onClick={() => handleShiftDate(1)}
                className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                title="Ngày tiếp theo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setSelectedDate('2026-10-15')}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Hôm nay
              </button>
            </div>

            {/* Quick Bulk Action */}
            {isTeacher && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBatchAttendance(selectedDate, 'present')}
                  className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <CheckCheck className="w-4 h-4 text-emerald-600" />
                  Đánh dấu cả lớp Có mặt
                </button>
              </div>
            )}
          </div>

          {/* KPI Mini Bar for selected date */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <div>
                <div className="text-xl font-bold font-mono text-emerald-900">
                  {dayStats.present}
                </div>
                <div className="text-xs text-emerald-700 font-medium">Có mặt</div>
              </div>
            </div>

            <div className="bg-amber-50/80 p-3 rounded-2xl border border-amber-200 flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600" />
              <div>
                <div className="text-xl font-bold font-mono text-amber-900">{dayStats.late}</div>
                <div className="text-xs text-amber-700 font-medium">Đi muộn</div>
              </div>
            </div>

            <div className="bg-sky-50/80 p-3 rounded-2xl border border-sky-200 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-sky-600" />
              <div>
                <div className="text-xl font-bold font-mono text-sky-900">{dayStats.excused}</div>
                <div className="text-xs text-sky-700 font-medium">Vắng có phép</div>
              </div>
            </div>

            <div className="bg-rose-50/80 p-3 rounded-2xl border border-rose-200 flex items-center gap-3">
              <MinusCircle className="w-5 h-5 text-rose-600" />
              <div>
                <div className="text-xl font-bold font-mono text-rose-900">
                  {dayStats.unexcused}
                </div>
                <div className="text-xs text-rose-700 font-medium">Vắng không phép</div>
              </div>
            </div>
          </div>

          {/* Student Daily Attendance List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
            <div className="p-3 border-b border-slate-100 flex items-center justify-between">
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm học sinh điểm danh..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#3289C7]"
                />
              </div>

              <span className="text-xs text-slate-400">
                Hiển thị {filteredStudents.length} học sinh
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FAFDFE] border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4 w-12 text-center">STT</th>
                    <th className="py-2.5 px-4">Mã HS</th>
                    <th className="py-2.5 px-4">Họ và tên</th>
                    <th className="py-2.5 px-4">Trạng thái điểm danh ngày {selectedDate}</th>
                    <th className="py-2.5 px-4">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student, idx) => {
                    const rec = dayRecordsMap.get(student.id);
                    const currentStatus: AttendanceStatus = rec?.status || 'present';

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4 text-center font-mono text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-700">
                          {student.id}
                        </td>
                        <td className="py-2.5 px-4">
                          <button
                            onClick={() => openStudentProfile(student.id, 'attendance')}
                            className="font-bold text-[#3289C7] hover:underline text-left cursor-pointer"
                          >
                            {student.fullName}
                          </button>
                        </td>
                        <td className="py-2.5 px-4">
                          {isTeacher ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleStatusChange(student.id, 'present')}
                                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                                  currentStatus === 'present'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                                }`}
                              >
                                Có mặt
                              </button>

                              <button
                                onClick={() => handleStatusChange(student.id, 'late')}
                                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                                  currentStatus === 'late'
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                                }`}
                              >
                                Đi muộn
                              </button>

                              <button
                                onClick={() => handleStatusChange(student.id, 'excused')}
                                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                                  currentStatus === 'excused'
                                    ? 'bg-sky-600 text-white shadow-xs'
                                    : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200'
                                }`}
                              >
                                Vắng có phép
                              </button>

                              <button
                                onClick={() => handleStatusChange(student.id, 'unexcused')}
                                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                                  currentStatus === 'unexcused'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                                }`}
                              >
                                Vắng không phép
                              </button>
                            </div>
                          ) : (
                            <span className="font-semibold text-slate-800">
                              {currentStatus === 'present'
                                ? 'Có mặt'
                                : currentStatus === 'late'
                                ? 'Đi muộn'
                                : currentStatus === 'excused'
                                ? 'Vắng có phép'
                                : 'Vắng không phép'}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500">
                          {rec?.note || '-'}
                          {rec?.linkedDisciplineId && (
                            <span className="text-[10px] text-[#3289C7] block">
                              (Đồng bộ từ sự việc thi đua)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MONTHLY SUMMARY VIEW */}
      {viewMode === 'monthly' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-[#1E3A5F]">
                Bảng tổng hợp chuyên cần theo tháng
              </h3>
              <p className="text-xs text-slate-500">
                Thống kê số buổi có mặt, đi muộn, vắng phép và không phép
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Chọn tháng:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
              >
                <option value="09">Tháng 9</option>
                <option value="10">Tháng 10</option>
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

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FAFDFE] border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Mã HS</th>
                    <th className="py-2.5 px-3">Họ và tên</th>
                    <th className="py-2.5 px-3 text-center">Có mặt</th>
                    <th className="py-2.5 px-3 text-center">Đi muộn</th>
                    <th className="py-2.5 px-3 text-center">Có phép</th>
                    <th className="py-2.5 px-3 text-center">Không phép</th>
                    <th className="py-2.5 px-3 text-right">Tỉ lệ chuyên cần</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyStats.map((item) => (
                    <tr key={item.student.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-600">
                        {item.student.id}
                      </td>
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => openStudentProfile(item.student.id, 'attendance')}
                          className="font-bold text-[#3289C7] hover:underline text-left cursor-pointer"
                        >
                          {item.student.fullName}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">
                        {item.present}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-700">
                        {item.late}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-sky-700">
                        {item.excused}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-rose-700">
                        {item.unexcused}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                        {item.rate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
