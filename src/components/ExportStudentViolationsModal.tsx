import React, { useState, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  Calendar,
  AlertCircle,
  Download,
  AlertTriangle,
  Clock,
  User,
} from 'lucide-react';
import { ClassData, Student } from '../types';
import {
  exportStudentViolationsToExcel,
  formatDateVN,
  getExportTimeVN,
  isViolationRecord,
} from '../utils/exportStudentViolations';

interface ExportStudentViolationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: ClassData | null;
  student: Student | null;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

type PeriodType = 'month' | 'year' | 'custom';

export const ExportStudentViolationsModal: React.FC<ExportStudentViolationsModalProps> = ({
  isOpen,
  onClose,
  classData,
  student,
  showToast,
}) => {
  const [periodType, setPeriodType] = useState<PeriodType>('month');

  // Month selection (YYYY-MM)
  const currentMonthStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, []);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

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

  // Derive fromDate, toDate, periodLabel, and filePeriodSuffix
  const { fromDate, toDate, periodLabel, filePeriodSuffix } = useMemo(() => {
    const now = new Date();
    const vnDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const [currY] = vnDateStr.split('-').map(Number);
    const schoolYear = classData?.settings?.schoolYear || '2026 - 2027';
    const yearMatches = schoolYear.match(/\d{4}/g);
    const startYear = yearMatches?.[0] ? Number(yearMatches[0]) : currY;
    const endYear = yearMatches?.[1] ? Number(yearMatches[1]) : startYear + 1;

    if (periodType === 'month') {
      const [year, month] = selectedMonth.split('-').map(Number);
      const lastDay = new Date(year, month, 0).getDate();
      const from = `${year}-${String(month).padStart(2, '0')}-01`;
      const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      const label = `Tháng ${month}/${year}`;
      const suffix = `${String(month).padStart(2, '0')}-${year}`;
      return { fromDate: from, toDate: to, periodLabel: label, filePeriodSuffix: suffix };
    }

    if (periodType === 'year') {
      const from = `${startYear}-08-01`;
      const to = `${endYear}-07-31`;
      const label = `Cả năm học ${schoolYear}`;
      const cleanSchoolYear = `${startYear}-${endYear}`;
      return { fromDate: from, toDate: to, periodLabel: label, filePeriodSuffix: cleanSchoolYear };
    }

    // Custom
    const label = `Tùy chọn (${formatDateVN(customFrom)} – ${formatDateVN(customTo)})`;
    const fromClean = formatDateVN(customFrom).replace(/\//g, '-');
    const toClean = formatDateVN(customTo).replace(/\//g, '-');
    const suffix = `${fromClean}_${toClean}`;
    return { fromDate: customFrom, toDate: customTo, periodLabel: label, filePeriodSuffix: suffix };
  }, [periodType, selectedMonth, customFrom, customTo, classData]);

  if (!isOpen || !classData || !student) return null;

  const settings = classData.settings || {};

  // Count violations in range for preview
  const violationsInRange = (classData.disciplineRecords || [])
    .filter((r) => r.studentId === student.id)
    .filter((r) => r.date >= fromDate && r.date <= toDate)
    .filter(isViolationRecord);

  const totalDeductionInRange = violationsInRange.reduce(
    (sum, r) => sum + Math.abs(r.points),
    0
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

    if (violationsInRange.length === 0) {
      showToast(
        `Học sinh ${student.fullName} (${student.id}) không có vi phạm nào trong ${periodLabel}.`,
        'info'
      );
      return;
    }

    setExporting(true);
    try {
      exportStudentViolationsToExcel({
        classData,
        student,
        fromDate,
        toDate,
        periodLabel,
        filePeriodSuffix,
      });
      showToast(
        `Đã xuất báo cáo vi phạm của học sinh ${student.fullName} (${periodLabel}) thành công!`,
        'success'
      );
      onClose();
    } catch (err: any) {
      console.error('[ExportViolations]', err);
      showToast(err.message || 'Lỗi khi tạo file Excel vi phạm', 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1E3A5F]">
                Xuất Excel vi phạm kỷ luật
              </h3>
              <p className="text-xs text-slate-500">
                Báo cáo chi tiết & tổng hợp theo lỗi vi phạm cá nhân
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

        {/* Student identification card */}
        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#1E3A5F] font-extrabold flex items-center justify-center text-sm">
                {student.fullName.trim().charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-slate-800 text-sm">
                  {student.fullName}
                </div>
                <div className="text-[11px] text-slate-500">
                  Mã HS: <strong className="font-mono text-slate-700">{student.id}</strong> · {student.gender} · {student.dob}
                </div>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700">
              {settings.className}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200/80 pt-2">
            <span>
              GVCN: <strong>{settings.teacherName}</strong>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {getExportTimeVN()}
            </span>
          </div>
        </div>

        {/* Period Selector Tabs */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Chọn kỳ báo cáo vi phạm:
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setPeriodType('month')}
              className={`py-2 rounded-lg font-semibold transition-all cursor-pointer text-center ${
                periodType === 'month'
                  ? 'bg-white text-[#1E3A5F] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Theo tháng
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
              Cả năm học
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
              Khoảng ngày tùy chọn
            </button>
          </div>
        </div>

        {/* Period Specific Controls */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs">
          {periodType === 'month' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Chọn tháng và năm:
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-[#3289C7]"
              />
            </div>
          )}

          {periodType === 'year' && (
            <div className="text-slate-600 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#3289C7] shrink-0" />
              <span>
                Xuất toàn bộ vi phạm trong năm học <strong>{settings.schoolYear}</strong> (từ 01/08 đến 31/07).
              </span>
            </div>
          )}

          {periodType === 'custom' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Từ ngày:
                </label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-[#3289C7]"
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
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-[#3289C7]"
                />
              </div>
            </div>
          )}

          {/* Violations Preview badge */}
          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
            <span className="text-slate-500">
              Khoảng thời gian: <strong className="text-slate-800">{formatDateVN(fromDate)}</strong> – <strong className="text-slate-800">{formatDateVN(toDate)}</strong>
            </span>
            {violationsInRange.length > 0 ? (
              <span className="bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-lg font-bold text-[11px] flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {violationsInRange.length} vi phạm (-{totalDeductionInRange}đ)
              </span>
            ) : (
              <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-lg font-semibold text-[11px]">
                0 vi phạm
              </span>
            )}
          </div>
        </div>

        {/* Excel sheets summary */}
        <div className="p-3 bg-rose-50/70 border border-rose-200/70 rounded-xl text-[11px] text-rose-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-rose-950">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            File Excel .xlsx gồm 2 sheet chi tiết & tổng hợp:
          </div>
          <ul className="list-disc list-inside text-rose-900/90 space-y-0.5 pl-1">
            <li>
              <strong>Sheet 1 - Chi tiết vi phạm:</strong> STT, Ngày xảy ra, Lỗi vi phạm, Nội dung sự việc, Điểm trừ, Ghi chú, Người ghi nhận.
            </li>
            <li>
              <strong>Sheet 2 - Tổng hợp theo lỗi:</strong> Tên lỗi vi phạm, Số lượt, Tổng điểm trừ và dòng Tổng cộng.
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
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
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
