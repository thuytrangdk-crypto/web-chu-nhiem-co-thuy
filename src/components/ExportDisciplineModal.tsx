import React, { useState, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  Calendar,
  AlertCircle,
  Download,
  Info,
  Clock,
  GraduationCap,
} from 'lucide-react';
import { ClassData } from '../types';
import {
  exportDisciplineToExcel,
  formatDateVN,
  getExportTimeVN,
} from '../utils/exportDisciplineExcel';

interface ExportDisciplineModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: ClassData | null;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

type PeriodType = 'week' | 'month' | 'semester' | 'year' | 'custom';

export const ExportDisciplineModal: React.FC<ExportDisciplineModalProps> = ({
  isOpen,
  onClose,
  classData,
  showToast,
}) => {
  // Period Mode
  const [periodType, setPeriodType] = useState<PeriodType>('month');

  // Week selection: 'current' (Tuần này) | 'previous' (Tuần trước)
  const [weekChoice, setWeekChoice] = useState<'current' | 'previous'>('current');

  // Month selection: YYYY-MM
  const currentMonthStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, []);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  // Semester selection: 'HK1' | 'HK2'
  const [selectedSemester, setSelectedSemester] = useState<'HK1' | 'HK2'>('HK1');

  // Custom date range
  const todayStr = useMemo(() => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  }, []);
  const [customFrom, setCustomFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  });
  const [customTo, setCustomTo] = useState<string>(todayStr);

  const [exporting, setExporting] = useState(false);

  // Derive fromDate, toDate, and periodLabel based on periodType
  const { fromDate, toDate, periodLabel } = useMemo(() => {
    const now = new Date();
    const vnDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const [currY, currM, currD] = vnDateStr.split('-').map(Number);

    if (periodType === 'week') {
      const current = new Date(currY, currM - 1, currD);
      const day = current.getDay(); // 0: Sun, 1: Mon...
      const offsetWeeks = weekChoice === 'current' ? 0 : -1;
      const diffToMonday = (day === 0 ? -6 : 1) - day + offsetWeeks * 7;
      const monday = new Date(currY, currM - 1, currD + diffToMonday);
      const sunday = new Date(currY, currM - 1, currD + diffToMonday + 6);

      const toYMD = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dt = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dt}`;
      };

      const from = toYMD(monday);
      const to = toYMD(sunday);
      const label =
        weekChoice === 'current'
          ? `Tuần này (${formatDateVN(from)} – ${formatDateVN(to)})`
          : `Tuần trước (${formatDateVN(from)} – ${formatDateVN(to)})`;

      return { fromDate: from, toDate: to, periodLabel: label };
    }

    if (periodType === 'month') {
      const [year, month] = selectedMonth.split('-').map(Number);
      const lastDay = new Date(year, month, 0).getDate();
      const from = `${year}-${String(month).padStart(2, '0')}-01`;
      const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      const label = `Tháng ${month}/${year}`;
      return { fromDate: from, toDate: to, periodLabel: label };
    }

    if (periodType === 'semester') {
      const schoolYear = classData?.settings?.schoolYear || '2026 - 2027';
      const yearMatches = schoolYear.match(/\d{4}/g);
      const startYear = yearMatches?.[0] ? Number(yearMatches[0]) : currY;
      const endYear = yearMatches?.[1] ? Number(yearMatches[1]) : startYear + 1;

      if (selectedSemester === 'HK1') {
        return {
          fromDate: `${startYear}-09-01`,
          toDate: `${endYear}-01-15`,
          periodLabel: `Học kỳ 1 (Năm học ${schoolYear})`,
        };
      } else {
        return {
          fromDate: `${endYear}-01-16`,
          toDate: `${endYear}-05-31`,
          periodLabel: `Học kỳ 2 (Năm học ${schoolYear})`,
        };
      }
    }

    if (periodType === 'year') {
      const schoolYear = classData?.settings?.schoolYear || '2026 - 2027';
      const yearMatches = schoolYear.match(/\d{4}/g);
      const startYear = yearMatches?.[0] ? Number(yearMatches[0]) : currY;
      const endYear = yearMatches?.[1] ? Number(yearMatches[1]) : startYear + 1;
      return {
        fromDate: `${startYear}-08-01`,
        toDate: `${endYear}-07-31`,
        periodLabel: `Cả năm học ${schoolYear}`,
      };
    }

    // Custom
    const label = `Tùy chọn (${formatDateVN(customFrom)} – ${formatDateVN(customTo)})`;
    return { fromDate: customFrom, toDate: customTo, periodLabel: label };
  }, [periodType, weekChoice, selectedMonth, selectedSemester, customFrom, customTo, classData]);

  if (!isOpen || !classData) return null;

  const settings = classData.settings || {};
  const totalStudents = classData.students.length;
  const recordsInRange = (classData.disciplineRecords || []).filter(
    (r) => r.date >= fromDate && r.date <= toDate
  );

  const handleExport = () => {
    if (!fromDate || !toDate) {
      showToast('Vui lòng chọn ngày bắt đầu và kết thúc hợp lệ', 'error');
      return;
    }
    if (fromDate > toDate) {
      showToast('Ngày bắt đầu không được lớn hơn ngày kết thúc', 'error');
      return;
    }
    if (totalStudents === 0) {
      showToast('Lớp hiện chưa có học sinh nào để xuất', 'error');
      return;
    }

    setExporting(true);
    try {
      exportDisciplineToExcel({
        classData,
        fromDate,
        toDate,
        periodLabel,
      });
      showToast(`Đã xuất báo cáo Excel thi đua (${periodLabel}) thành công!`, 'success');
      onClose();
    } catch (err: any) {
      console.error('[ExportDiscipline]', err);
      showToast(err.message || 'Lỗi khi tạo file Excel thi đua', 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-5 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1E3A5F] to-[#3289C7] flex items-center justify-center text-white shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1E3A5F]">
                Xuất Excel thi đua rèn luyện
              </h3>
              <p className="text-xs text-slate-500">
                {settings.schoolName || 'Trường THCS'} · {settings.className || 'Lớp'} · Năm học {settings.schoolYear}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Class & Context Banner */}
        <div className="bg-[#EAF6FF]/70 border border-[#CDE5F8] p-3.5 rounded-xl text-xs space-y-1.5 text-slate-700">
          <div className="flex items-center justify-between font-semibold text-[#1E3A5F]">
            <span className="flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-[#3289C7]" />
              Lớp: <strong>{settings.className}</strong> ({totalStudents} học sinh)
            </span>
            <span>
              GVCN: <strong>{settings.teacherName}</strong>
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-sky-100 pt-1.5">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Thời gian xuất: <strong>{getExportTimeVN()}</strong> (Giờ Việt Nam)
            </span>
            <span className="text-emerald-700 font-medium">
              Xuất toàn bộ học sinh lớp
            </span>
          </div>
        </div>

        {/* Period Selector Tabs */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Chọn kỳ báo cáo thi đua:
          </label>
          <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setPeriodType('week')}
              className={`py-2 rounded-lg font-semibold transition-all cursor-pointer text-center ${
                periodType === 'week'
                  ? 'bg-white text-[#1E3A5F] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tuần
            </button>
            <button
              type="button"
              onClick={() => setPeriodType('month')}
              className={`py-2 rounded-lg font-semibold transition-all cursor-pointer text-center ${
                periodType === 'month'
                  ? 'bg-white text-[#1E3A5F] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tháng
            </button>
            <button
              type="button"
              onClick={() => setPeriodType('semester')}
              className={`py-2 rounded-lg font-semibold transition-all cursor-pointer text-center ${
                periodType === 'semester'
                  ? 'bg-white text-[#1E3A5F] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Học kỳ
            </button>
            <button
              type="button"
              onClick={() => setPeriodType('year')}
              className={`py-2 rounded-lg font-semibold transition-all cursor-pointer text-center ${
                periodType === 'year'
                  ? 'bg-white text-[#1E3A5F] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cả năm
            </button>
            <button
              type="button"
              onClick={() => setPeriodType('custom')}
              className={`py-2 rounded-lg font-semibold transition-all cursor-pointer text-center ${
                periodType === 'custom'
                  ? 'bg-white text-[#1E3A5F] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tùy chọn
            </button>
          </div>
        </div>

        {/* Period Details Sub-form */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          {periodType === 'week' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Chọn tuần báo cáo:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setWeekChoice('current')}
                  className={`p-2.5 rounded-xl border text-left font-medium transition-colors cursor-pointer ${
                    weekChoice === 'current'
                      ? 'border-[#3289C7] bg-sky-50/50 text-[#1E3A5F]'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold">Tuần này</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Thứ 2 đến Chủ nhật tuần hiện tại
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setWeekChoice('previous')}
                  className={`p-2.5 rounded-xl border text-left font-medium transition-colors cursor-pointer ${
                    weekChoice === 'previous'
                      ? 'border-[#3289C7] bg-sky-50/50 text-[#1E3A5F]'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold">Tuần trước</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Thứ 2 đến Chủ nhật tuần vừa qua
                  </div>
                </button>
              </div>
            </div>
          )}

          {periodType === 'month' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Chọn tháng báo cáo:
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#3289C7]"
              />
            </div>
          )}

          {periodType === 'semester' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Chọn học kỳ:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedSemester('HK1')}
                  className={`p-2.5 rounded-xl border text-left font-medium transition-colors cursor-pointer ${
                    selectedSemester === 'HK1'
                      ? 'border-[#3289C7] bg-sky-50/50 text-[#1E3A5F]'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold">Học kỳ 1</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Từ 01/09 đến 15/01
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSemester('HK2')}
                  className={`p-2.5 rounded-xl border text-left font-medium transition-colors cursor-pointer ${
                    selectedSemester === 'HK2'
                      ? 'border-[#3289C7] bg-sky-50/50 text-[#1E3A5F]'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold">Học kỳ 2</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Từ 16/01 đến 31/05
                  </div>
                </button>
              </div>
            </div>
          )}

          {periodType === 'year' && (
            <div className="text-xs text-slate-600 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#3289C7] shrink-0" />
              <span>
                Báo cáo tổng kết toàn bộ năm học <strong>{settings.schoolYear}</strong> (từ ngày 01/08 đến 31/07).
              </span>
            </div>
          )}

          {periodType === 'custom' && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Từ ngày:
                </label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#3289C7]"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Đến ngày:
                </label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#3289C7]"
                />
              </div>
            </div>
          )}

          {/* Computed Date Range Info */}
          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Khoảng thời gian: <strong className="text-slate-800">{formatDateVN(fromDate)}</strong> đến <strong className="text-slate-800">{formatDateVN(toDate)}</strong>
            </span>
            <span className="bg-sky-100/70 text-sky-800 px-2 py-0.5 rounded-md font-semibold text-[11px]">
              {recordsInRange.length} sự việc ghi nhận
            </span>
          </div>
        </div>

        {/* Structure description */}
        <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl text-[11px] text-amber-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-950">
            <Info className="w-3.5 h-3.5 text-amber-600" />
            Cấu trúc tệp Excel gồm 2 sheet chuẩn:
          </div>
          <ul className="list-disc list-inside text-amber-800/95 space-y-0.5 pl-1">
            <li>
              <strong>Sheet 1 - Tổng hợp thi đua:</strong> STT, Mã HS, Họ tên, Lớp, Điểm ban đầu, Điểm cộng, Điểm trừ (dương), Điểm tổng, Xếp loại, Xếp hạng (đồng hạng), Lượt tích cực/vi phạm.
            </li>
            <li>
              <strong>Sheet 2 - Chi tiết ghi nhận:</strong> Thời gian, Mã HS, Họ tên, Nội dung, Loại ghi nhận, Điểm cộng/trừ có dấu, Người ghi nhận, Ghi chú.
            </li>
          </ul>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={exporting}
            onClick={handleExport}
            className="px-5 py-2.5 bg-[#1E3A5F] hover:bg-[#152843] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {exporting ? (
              'Đang tạo file Excel...'
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Xuất file Excel (.xlsx)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
