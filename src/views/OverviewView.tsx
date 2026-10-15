import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  CalendarCheck,
  Award,
  Megaphone,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  MinusCircle,
  Filter,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const OverviewView: React.FC = () => {
  const { classData, user, openStudentProfile, setActiveTab } = useApp();
  const [timeFilter, setTimeFilter] = useState<string>('all'); // 'all', '10', '09', '11'
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-15');

  const students = classData?.students || [];
  const totalStudents = students.length;
  const maleCount = students.filter(s => s.gender === 'Nam').length;
  const femaleCount = students.filter(s => s.gender === 'Nữ').length;

  // Filtered discipline events
  const filteredDiscipline = useMemo(() => {
    return (classData?.disciplineRecords || []).filter(rec => {
      if (timeFilter === 'all') return true;
      const month = rec.date.split('-')[1];
      return month === timeFilter;
    });
  }, [classData?.disciplineRecords, timeFilter]);

  // Compute student conduct scores
  const startingScore = classData?.settings?.startingScore ?? 100;
  const tiers = classData?.settings?.evaluationTiers || { excellent: 90, good: 75, average: 50 };

  const studentScores = useMemo(() => {
    return students.map(student => {
      const records = filteredDiscipline.filter(d => d.studentId === student.id);
      const delta = records.reduce((sum, r) => sum + r.points, 0);
      const score = startingScore + delta;

      let tier = 'Chưa đạt';
      if (score >= tiers.excellent) tier = 'Tốt';
      else if (score >= tiers.good) tier = 'Khá';
      else if (score >= tiers.average) tier = 'Đạt';

      return { student, score, tier, delta, count: records.length };
    });
  }, [students, filteredDiscipline, startingScore, tiers]);

  const avgConductScore = totalStudents > 0
    ? Math.round((studentScores.reduce((acc, s) => acc + s.score, 0) / totalStudents) * 10) / 10
    : 0;

  // Conduct tier distribution
  const tierCounts = {
    excellent: studentScores.filter(s => s.tier === 'Tốt').length,
    good: studentScores.filter(s => s.tier === 'Khá').length,
    average: studentScores.filter(s => s.tier === 'Đạt').length,
    poor: studentScores.filter(s => s.tier === 'Chưa đạt').length,
  };

  // Top 5 students by conduct
  const topStudents = useMemo(() => {
    return [...studentScores]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [studentScores]);

  // Today's attendance stats for the selected date
  const dayAttendance = (classData?.attendance || []).filter(a => a.date === selectedDate);
  const presentCount = dayAttendance.filter(a => a.status === 'present').length;
  const lateCount = dayAttendance.filter(a => a.status === 'late').length;
  const excusedCount = dayAttendance.filter(a => a.status === 'excused').length;
  const unexcusedCount = dayAttendance.filter(a => a.status === 'unexcused').length;
  const attendanceRate = totalStudents > 0
    ? Math.round(((presentCount + lateCount) / totalStudents) * 100)
    : 100;

  // Published honors
  const honorsList = classData?.honors || [];

  // Recent activity stream (last 8 activities across discipline, announcements, honors)
  const recentActivities = useMemo(() => {
    const list: { id: string; title: string; time: string; type: 'disc' | 'ann' | 'hon'; icon: any; color: string }[] = [];

    (classData?.disciplineRecords || []).slice(0, 5).forEach(d => {
      list.push({
        id: d.id,
        title: `Ghi nhận thi đua: ${d.ruleTitle} (${d.points > 0 ? '+' : ''}${d.points}đ) - ${students.find(s => s.id === d.studentId)?.fullName || d.studentId}`,
        time: d.date,
        type: 'disc',
        icon: Award,
        color: d.points > 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50',
      });
    });

    (classData?.announcements || []).slice(0, 3).forEach(a => {
      list.push({
        id: a.id,
        title: `Thông báo: ${a.title}`,
        time: a.createdAt.slice(0, 10),
        type: 'ann',
        icon: Megaphone,
        color: 'text-[#3289C7] bg-[#EAF6FF]',
      });
    });

    (classData?.honors || []).slice(0, 3).forEach(h => {
      list.push({
        id: h.id,
        title: `Vinh danh: ${h.studentName} - ${h.title}`,
        time: h.date,
        type: 'hon',
        icon: Sparkles,
        color: 'text-amber-600 bg-amber-50',
      });
    });

    return list.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 7);
  }, [classData?.disciplineRecords, classData?.announcements, classData?.honors, students]);

  if (!classData) return null;

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-[#1E3A5F]">
            Tổng quan lớp {classData.settings.className}
          </h2>
          <p className="text-xs text-slate-500">
            Dữ liệu thống kê thời gian thực từ hoạt động của lớp
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Kỳ thi đua:</span>
          </div>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3289C7]"
          >
            <option value="all">Toàn năm học</option>
            <option value="10">Tháng 10 (Hiện tại)</option>
            <option value="09">Tháng 9</option>
            <option value="11">Tháng 11</option>
          </select>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Students */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Sĩ số học sinh</span>
            <div className="w-8 h-8 rounded-xl bg-[#EAF6FF] text-[#3289C7] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900">
              {totalStudents}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span>Nam: <strong className="text-slate-700">{maleCount}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Nữ: <strong className="text-slate-700">{femaleCount}</strong></span>
            </div>
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Chuyên cần hôm nay</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900">
              {attendanceRate}%
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
              <span className="text-emerald-700 font-medium">Có mặt: {presentCount}</span>
              <span aria-hidden="true">·</span>
              <span className="text-amber-700 font-medium">Muộn: {lateCount}</span>
              <span aria-hidden="true">·</span>
              <span className="text-rose-700 font-medium">Vắng: {excusedCount + unexcusedCount}</span>
            </div>
          </div>
        </div>

        {/* Conduct Average */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Điểm thi đua TB</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900">
              {avgConductScore}đ
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Điểm gốc: <strong className="text-slate-700">{startingScore}đ</strong>
            </div>
          </div>
        </div>

        {/* Announcements & Honors */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Bảng tin & Vinh danh</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Megaphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900">
              {classData.announcements.length}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span>Thông báo: <strong className="text-slate-700">{classData.announcements.length}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Vinh danh: <strong className="text-purple-700">{honorsList.length}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 Cols): Attendance breakdown & Conduct distribution */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Attendance Detail Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="font-bold text-sm text-[#1E3A5F]">Tình hình chuyên cần theo ngày</h3>
                <p className="text-xs text-slate-500">Xem trạng thái điểm danh lớp học</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs font-mono px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
                />
              </div>
            </div>

            {/* Visual Attendance Bar */}
            <div className="space-y-3">
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
                <div
                  style={{ width: `${(presentCount / (totalStudents || 1)) * 100}%` }}
                  className="bg-emerald-500 h-full transition-all duration-300"
                  title={`Có mặt: ${presentCount}`}
                />
                <div
                  style={{ width: `${(lateCount / (totalStudents || 1)) * 100}%` }}
                  className="bg-amber-400 h-full transition-all duration-300"
                  title={`Đi muộn: ${lateCount}`}
                />
                <div
                  style={{ width: `${(excusedCount / (totalStudents || 1)) * 100}%` }}
                  className="bg-sky-400 h-full transition-all duration-300"
                  title={`Vắng có phép: ${excusedCount}`}
                />
                <div
                  style={{ width: `${(unexcusedCount / (totalStudents || 1)) * 100}%` }}
                  className="bg-rose-500 h-full transition-all duration-300"
                  title={`Vắng không phép: ${unexcusedCount}`}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-bold text-emerald-900 font-mono">{presentCount}</span>
                    <span className="text-emerald-700 block text-[11px]">Có mặt ({Math.round((presentCount / (totalStudents || 1)) * 100)}%)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50/60 border border-amber-100">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <div>
                    <span className="font-bold text-amber-900 font-mono">{lateCount}</span>
                    <span className="text-amber-700 block text-[11px]">Đi muộn</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-xl bg-sky-50/60 border border-sky-100">
                  <AlertTriangle className="w-4 h-4 text-sky-600" />
                  <div>
                    <span className="font-bold text-sky-900 font-mono">{excusedCount}</span>
                    <span className="text-sky-700 block text-[11px]">Vắng có phép</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-xl bg-rose-50/60 border border-rose-100">
                  <MinusCircle className="w-4 h-4 text-rose-600" />
                  <div>
                    <span className="font-bold text-rose-900 font-mono">{unexcusedCount}</span>
                    <span className="text-rose-700 block text-[11px]">Vắng không phép</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Conduct Rating Breakdown Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-[#1E3A5F]">Phân bố xếp loại rèn luyện / thi đua</h3>
                <p className="text-xs text-slate-500">Theo ngưỡng cấu hình trong Cài đặt</p>
              </div>
              <button
                onClick={() => setActiveTab('discipline')}
                className="text-xs text-[#3289C7] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                Vào trang Thi đua <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200">
                <div className="text-xs font-semibold text-emerald-800">Loại Tốt (≥ {tiers.excellent}đ)</div>
                <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">{tierCounts.excellent}</div>
                <div className="text-[11px] text-emerald-600">{Math.round((tierCounts.excellent / (totalStudents || 1)) * 100)}% học sinh</div>
              </div>

              <div className="p-3 rounded-xl bg-sky-50/80 border border-sky-200">
                <div className="text-xs font-semibold text-sky-800">Loại Khá (≥ {tiers.good}đ)</div>
                <div className="text-2xl font-bold font-mono text-sky-700 mt-1">{tierCounts.good}</div>
                <div className="text-[11px] text-sky-600">{Math.round((tierCounts.good / (totalStudents || 1)) * 100)}% học sinh</div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200">
                <div className="text-xs font-semibold text-amber-800">Loại Đạt (≥ {tiers.average}đ)</div>
                <div className="text-2xl font-bold font-mono text-amber-700 mt-1">{tierCounts.average}</div>
                <div className="text-[11px] text-amber-600">{Math.round((tierCounts.average / (totalStudents || 1)) * 100)}% học sinh</div>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200">
                <div className="text-xs font-semibold text-rose-800">Cần rèn luyện (&lt; {tiers.average}đ)</div>
                <div className="text-2xl font-bold font-mono text-rose-700 mt-1">{tierCounts.poor}</div>
                <div className="text-[11px] text-rose-600">{Math.round((tierCounts.poor / (totalStudents || 1)) * 100)}% học sinh</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right (1 Col): Top Students & Recent Activity */}
        <div className="space-y-6">
          {/* Top Students */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <h3 className="font-bold text-sm text-[#1E3A5F] mb-3">Top dẫn đầu điểm thi đua</h3>
            <div className="space-y-2">
              {topStudents.map((item, idx) => (
                <div
                  key={item.student.id}
                  onClick={() => openStudentProfile(item.student.id, 'discipline')}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                      idx === 0 ? 'bg-amber-100 text-amber-800' : idx === 1 ? 'bg-slate-200 text-slate-800' : idx === 2 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">{item.student.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{item.student.id}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-[#3289C7]">{item.score}đ</span>
                    <span className="text-[10px] text-emerald-600 block">({item.tier})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <h3 className="font-bold text-sm text-[#1E3A5F] mb-3">Hoạt động gần đây</h3>
            <div className="space-y-2.5 text-xs">
              {recentActivities.map((act) => {
                const Icon = act.icon;
                return (
                  <div key={act.id} className="flex items-start gap-2.5">
                    <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${act.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 leading-tight">
                      <p className="text-slate-800 font-medium text-xs">{act.title}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{act.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
