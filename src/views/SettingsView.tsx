import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Settings,
  ShieldAlert,
  BookOpen,
  Award,
  Database,
  Save,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Lock,
  KeyRound,
  Cloud,
  CloudUpload,
  CloudDownload,
  RefreshCw,
  Sparkles,
  FileCode,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Terminal,
  ShieldCheck,
  Layers,
  AlertCircle,
  Info,
} from 'lucide-react';
import { AppSettings, DisciplineRule, Subject } from '../types';
import { SUPABASE_SCHEMA_SQL } from '../data/supabaseSql';

export const SettingsView: React.FC = () => {
  const {
    classData,
    updateSettings,
    changePassword,
    addRule,
    updateRule,
    deleteRule,
    addSubject,
    updateSubject,
    deleteSubject,
    restoreData,
    resetDemoData,
    showToast,
    supabaseStatus,
    syncWithSupabaseNow,
    pullFromSupabase,
    checkSupabaseStatus,
    getAvailableDatasets,
    migrateSupabaseDataset,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'general' | 'password' | 'rules' | 'subjects' | 'backup'>('general');
  const [supabaseSyncing, setSupabaseSyncing] = useState(false);
  const [supabasePulling, setSupabasePulling] = useState(false);
  const [showSqlSchema, setShowSqlSchema] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Multi-Class Audit & Safe Migration State
  const [showDatasetsModal, setShowDatasetsModal] = useState(false);
  const [datasetsList, setDatasetsList] = useState<any[] | null>(null);
  const [loadingDatasets, setLoadingDatasets] = useState(false);
  const [selectedMigrateSource, setSelectedMigrateSource] = useState<any | null>(null);
  const [confirmMigrateDiffClass, setConfirmMigrateDiffClass] = useState(false);
  const [migrating, setMigrating] = useState(false);

  // File Restore Multi-Class Verification State
  const [restoreSourceClass, setRestoreSourceClass] = useState<string | null>(null);
  const [restoreSourceTeacher, setRestoreSourceTeacher] = useState<string | null>(null);
  const [restoreIsDifferentClass, setRestoreIsDifferentClass] = useState(false);
  const [confirmRestoreDiffClass, setConfirmRestoreDiffClass] = useState(false);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    showToast('Đã sao chép toàn bộ mã SQL vào bộ nhớ tạm (clipboard)!', 'success');
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([SUPABASE_SCHEMA_SQL], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'supabase_schema.sql';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống file supabase_schema.sql thành công!', 'success');
  };

  useEffect(() => {
    checkSupabaseStatus().catch(() => {});
  }, [checkSupabaseStatus]);

  // Teacher Password Change State
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // General Settings Form
  const [generalForm, setGeneralForm] = useState<AppSettings>(
    classData?.settings || {
      appName: 'GVCN – Quản trị lớp chủ nhiệm',
      schoolName: 'THPT Chuyên Lê Hồng Phong',
      className: '10A1',
      schoolYear: '2025 - 2026',
      teacherName: 'ThS. Nguyễn Văn An',
      teacherPhone: '0912 345 678',
      teacherEmail: 'gvcn.10a1@thpt.edu.vn',
      startingScore: 100,
      evaluationTiers: { excellent: 90, good: 75, average: 50 },
    }
  );

  // Rule Form Modal State
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DisciplineRule | null>(null);
  const [ruleFormData, setRuleFormData] = useState<Omit<DisciplineRule, 'id'>>({
    code: '',
    title: '',
    group: 'Nề nếp',
    points: -2,
    linkAttendance: 'none',
    description: '',
  });

  // Subject Form Modal State
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectFormData, setSubjectFormData] = useState<Omit<Subject, 'id'>>({
    code: '',
    name: '',
    periodsPerWeek: 2,
    evalType: 'score',
    isActive: true,
    order: 1,
  });

  // Backup / Restore State
  const [restoreJson, setRestoreJson] = useState<any>(null);

  React.useEffect(() => {
    if (classData?.settings) {
      setGeneralForm(classData.settings);
    }
  }, [classData?.settings]);

  if (!classData) return null;

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(generalForm);
  };

  const handleOpenAddRule = () => {
    setRuleFormData({
      code: `QT-${String((classData.rules.length + 1)).padStart(2, '0')}`,
      title: '',
      group: 'Học tập',
      points: 2,
      linkAttendance: 'none',
      description: '',
    });
    setEditingRule(null);
    setIsRuleModalOpen(true);
  };

  const handleOpenEditRule = (rule: DisciplineRule) => {
    setEditingRule(rule);
    setRuleFormData({
      code: rule.code,
      title: rule.title,
      group: rule.group,
      points: rule.points,
      linkAttendance: rule.linkAttendance,
      description: rule.description || '',
    });
    setIsRuleModalOpen(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleFormData.title.trim()) {
      showToast('Vui lòng nhập tên sự việc/quy tắc', 'error');
      return;
    }
    if (editingRule) {
      await updateRule({ ...editingRule, ...ruleFormData });
    } else {
      await addRule(ruleFormData);
    }
    setIsRuleModalOpen(false);
  };

  const handleOpenAddSubject = () => {
    setSubjectFormData({
      code: '',
      name: '',
      periodsPerWeek: 2,
      evalType: 'score',
      isActive: true,
      order: classData.subjects.length + 1,
    });
    setEditingSubject(null);
    setIsSubjectModalOpen(true);
  };

  const handleOpenEditSubject = (sub: Subject) => {
    setEditingSubject(sub);
    setSubjectFormData({
      code: sub.code,
      name: sub.name,
      periodsPerWeek: sub.periodsPerWeek,
      evalType: sub.evalType,
      isActive: sub.isActive,
      order: sub.order,
    });
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectFormData.name.trim() || !subjectFormData.code.trim()) {
      showToast('Vui lòng nhập mã môn và tên môn học', 'error');
      return;
    }
    if (editingSubject) {
      await updateSubject({ ...editingSubject, ...subjectFormData });
    } else {
      await addSubject(subjectFormData);
    }
    setIsSubjectModalOpen(false);
  };

  // Backup Export
  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ classData, exportDate: new Date().toISOString() }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `SaoLuu_GVCN_${classData.settings.className}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Đã tải xuống bản sao lưu toàn bộ dữ liệu lớp học!', 'success');
  };

  // File upload for restore with multi-class verification
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.classData || parsed.students) {
          setRestoreJson(parsed);
          const incomingClass = parsed.metadata?.className || parsed.classData?.settings?.className || parsed.settings?.className || 'Chưa xác định';
          const incomingTeacher = parsed.metadata?.teacherName || parsed.classData?.settings?.teacherName || parsed.settings?.teacherName || 'Chưa rõ';
          const currentClass = classData?.settings?.className || 'Lớp hiện tại';

          setRestoreSourceClass(incomingClass);
          setRestoreSourceTeacher(incomingTeacher);
          const isDiff = incomingClass !== 'Chưa xác định' && incomingClass !== currentClass;
          setRestoreIsDifferentClass(isDiff);
          setConfirmRestoreDiffClass(false);

          if (isDiff) {
            showToast(`Cảnh báo: Tệp sao lưu thuộc "${incomingClass}", khác với lớp đang quản lý "${currentClass}"!`, 'error');
          }
        } else {
          showToast('Tệp JSON không đúng cấu trúc bản sao lưu của hệ thống GVCN', 'error');
        }
      } catch (err) {
        showToast('Tệp tải lên không phải là JSON hợp lệ', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = async () => {
    if (!restoreJson) return;
    if (restoreIsDifferentClass && !confirmRestoreDiffClass) {
      showToast('Vui lòng tích vào ô xác nhận chuyển đổi lớp khác trước khi thực hiện', 'error');
      return;
    }
    try {
      await restoreData(restoreJson, confirmRestoreDiffClass);
      setRestoreJson(null);
      setRestoreSourceClass(null);
      setRestoreSourceTeacher(null);
      setRestoreIsDifferentClass(false);
      setConfirmRestoreDiffClass(false);
    } catch (e: any) {
      // toast shown by context
    }
  };

  const handleResetDemo = async () => {
    if (window.confirm(`Bạn có chắc chắn muốn đặt lại dữ liệu mẫu cho ${classData?.settings?.className || 'lớp'} ban đầu? Hệ thống sẽ tự động tạo một bản sao lưu an toàn trước khi thực hiện.`)) {
      await resetDemoData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <h2 className="text-lg font-bold text-[#1E3A5F]">
          Cấu hình & Cài đặt hệ thống
        </h2>
        <p className="text-xs text-slate-500">
          Chỉ giáo viên chủ nhiệm mới có quyền truy cập và chỉnh sửa các mục này
        </p>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto no-scrollbar border-b border-slate-100 pb-2">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'general'
                ? 'bg-[#3289C7] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Cài đặt chung
          </button>

          <button
            onClick={() => setActiveTab('password')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'password'
                ? 'bg-[#3289C7] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Đổi mật khẩu GVCN
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'rules'
                ? 'bg-[#3289C7] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Quy tắc thi đua ({classData.rules.length})
          </button>

          <button
            onClick={() => setActiveTab('subjects')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'subjects'
                ? 'bg-[#3289C7] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Danh mục môn học ({classData.subjects.length})
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'backup'
                ? 'bg-[#3289C7] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Sao lưu & Khôi phục
          </button>
        </div>
      </div>

      {/* TAB A: CÀI ĐẶT CHUNG */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveGeneral} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-5 max-w-3xl">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-[#1E3A5F]">Thông tin đơn vị & lớp học</h3>
              <p className="text-xs text-slate-500">Áp dụng trực tiếp lên tiêu đề và báo cáo toàn ứng dụng</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên ứng dụng</label>
                <input
                  type="text"
                  required
                  value={generalForm.appName}
                  onChange={(e) => setGeneralForm({ ...generalForm, appName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#3289C7]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên trường</label>
                <input
                  type="text"
                  required
                  value={generalForm.schoolName}
                  onChange={(e) => setGeneralForm({ ...generalForm, schoolName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#3289C7]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên lớp</label>
                <input
                  type="text"
                  required
                  value={generalForm.className}
                  onChange={(e) => setGeneralForm({ ...generalForm, className: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#3289C7]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Năm học</label>
                <input
                  type="text"
                  required
                  value={generalForm.schoolYear}
                  onChange={(e) => setGeneralForm({ ...generalForm, schoolYear: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#3289C7]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Họ tên GVCN</label>
                <input
                  type="text"
                  required
                  value={generalForm.teacherName}
                  onChange={(e) => setGeneralForm({ ...generalForm, teacherName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#3289C7]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại GVCN</label>
                <input
                  type="text"
                  value={generalForm.teacherPhone}
                  onChange={(e) => setGeneralForm({ ...generalForm, teacherPhone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#3289C7]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Điểm khởi tạo thi đua mỗi kỳ (Mặc định: 100 hoặc 0)</label>
                <input
                  type="number"
                  value={generalForm.startingScore}
                  onChange={(e) => setGeneralForm({ ...generalForm, startingScore: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:ring-2 focus:ring-[#3289C7]"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Điểm khởi tạo dùng làm mốc cộng/trừ các sự việc thi đua trong kỳ đánh giá
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#3289C7] hover:bg-[#256ea4] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Lưu và áp dụng ngay
              </button>
            </div>
          </form>

          {/* Đổi mật khẩu GVCN trong Cài đặt chung */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4 max-w-3xl">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-[#008AE6] flex items-center justify-center font-bold">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1E3A5F]">Đổi mật khẩu Giáo viên chủ nhiệm</h3>
                  <p className="text-xs text-slate-500">Cập nhật mật khẩu quản trị bất kỳ lúc nào</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Không bắt buộc đổi mật khẩu
              </span>
            </div>

            {pwdMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  pwdMsg.isError
                    ? 'bg-rose-50 border border-rose-200 text-rose-700'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                }`}
              >
                {pwdMsg.isError ? (
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <span>{pwdMsg.text}</span>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setPwdMsg(null);
                if (!currentPwd) {
                  setPwdMsg({ text: 'Vui lòng nhập mật khẩu hiện tại', isError: true });
                  return;
                }
                if (newPwd.length < 6) {
                  setPwdMsg({ text: 'Mật khẩu mới phải có ít nhất 6 ký tự', isError: true });
                  return;
                }
                if (newPwd !== confirmPwd) {
                  setPwdMsg({ text: 'Xác nhận mật khẩu mới không khớp', isError: true });
                  return;
                }
                setPwdLoading(true);
                try {
                  await changePassword(currentPwd, newPwd);
                  setCurrentPwd('');
                  setNewPwd('');
                  setConfirmPwd('');
                  setPwdMsg({ text: 'Đã đổi mật khẩu quản trị GVCN thành công!', isError: false });
                } catch (err: any) {
                  setPwdMsg({ text: err.message || 'Mật khẩu hiện tại không đúng', isError: true });
                } finally {
                  setPwdLoading(false);
                }
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  required
                  placeholder="Nhập mật khẩu hiện tại (Mặc định: giaovien123)"
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#3289C7]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu mới</label>
                  <input
                    type="password"
                    required
                    placeholder="Ít nhất 6 ký tự"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#3289C7]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    required
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#3289C7]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="px-4 py-2 bg-[#008AE6] hover:bg-[#0077C8] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {pwdLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu GVCN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB RIÊNG: ĐỔI MẬT KHẨU GVCN */}
      {activeTab === 'password' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4 max-w-3xl">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#008AE6] flex items-center justify-center font-bold border border-sky-100">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1E3A5F]">Đổi mật khẩu tài khoản Giáo viên chủ nhiệm</h3>
                  <p className="text-xs text-slate-500">Quản lý và cập nhật mật khẩu quản trị lớp học</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Không bắt buộc đổi mật khẩu
              </span>
            </div>

            <div className="p-3.5 bg-sky-50/70 border border-sky-100 text-sky-900 text-xs rounded-xl flex items-start gap-2.5">
              <KeyRound className="w-4 h-4 text-[#008AE6] shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <p className="font-semibold text-slate-800">Lưu ý bảo mật:</p>
                <p className="mt-0.5">
                  Giáo viên chủ nhiệm có thể chủ động đổi mật khẩu bất kỳ lúc nào để bảo vệ hệ thống quản trị lớp. Mật khẩu mặc định hệ thống ban đầu là <code className="font-mono font-bold text-[#008AE6] bg-white px-1.5 py-0.5 rounded border border-sky-200">giaovien123</code>.
                </p>
              </div>
            </div>

            {pwdMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  pwdMsg.isError
                    ? 'bg-rose-50 border border-rose-200 text-rose-700'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                }`}
              >
                {pwdMsg.isError ? (
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <span>{pwdMsg.text}</span>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setPwdMsg(null);
                if (!currentPwd) {
                  setPwdMsg({ text: 'Vui lòng nhập mật khẩu hiện tại', isError: true });
                  return;
                }
                if (newPwd.length < 6) {
                  setPwdMsg({ text: 'Mật khẩu mới phải có ít nhất 6 ký tự', isError: true });
                  return;
                }
                if (newPwd !== confirmPwd) {
                  setPwdMsg({ text: 'Xác nhận mật khẩu mới không khớp', isError: true });
                  return;
                }
                setPwdLoading(true);
                try {
                  await changePassword(currentPwd, newPwd);
                  setCurrentPwd('');
                  setNewPwd('');
                  setConfirmPwd('');
                  setPwdMsg({ text: 'Đã đổi mật khẩu quản trị GVCN thành công!', isError: false });
                } catch (err: any) {
                  setPwdMsg({ text: err.message || 'Mật khẩu hiện tại không đúng', isError: true });
                } finally {
                  setPwdLoading(false);
                }
              }}
              className="space-y-4 pt-1"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mật khẩu hiện tại (*)
                </label>
                <input
                  type="password"
                  required
                  placeholder="Nhập mật khẩu GVCN hiện tại (Mặc định: giaovien123)"
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#008AE6] focus:border-transparent bg-slate-50/70"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Mật khẩu mới (*)
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Ít nhất 6 ký tự"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#008AE6] focus:border-transparent bg-slate-50/70"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Xác nhận mật khẩu mới (*)
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#008AE6] focus:border-transparent bg-slate-50/70"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="px-5 py-2.5 bg-[#008AE6] hover:bg-[#0077C8] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  {pwdLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu GVCN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB B: QUY TẮC THI ĐUA */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          {/* Thresholds Configuration */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <h3 className="font-bold text-sm text-[#1E3A5F]">Ngưỡng xếp loại rèn luyện / hạnh kiểm</h3>
            <p className="text-xs text-slate-500">
              Cấu hình số điểm tối thiểu để đạt từng mức xếp loại trong kỳ đánh giá
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <label className="block text-xs font-bold text-emerald-800 mb-1">Mức Tốt (≥ điểm)</label>
                <input
                  type="number"
                  value={generalForm.evaluationTiers?.excellent ?? 90}
                  onChange={(e) =>
                    setGeneralForm({
                      ...generalForm,
                      evaluationTiers: {
                        ...generalForm.evaluationTiers,
                        excellent: parseInt(e.target.value, 10) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-emerald-300 text-xs font-mono font-bold bg-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200">
                <label className="block text-xs font-bold text-sky-800 mb-1">Mức Khá (≥ điểm)</label>
                <input
                  type="number"
                  value={generalForm.evaluationTiers?.good ?? 75}
                  onChange={(e) =>
                    setGeneralForm({
                      ...generalForm,
                      evaluationTiers: {
                        ...generalForm.evaluationTiers,
                        good: parseInt(e.target.value, 10) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-sky-300 text-xs font-mono font-bold bg-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                <label className="block text-xs font-bold text-amber-800 mb-1">Mức Đạt (≥ điểm)</label>
                <input
                  type="number"
                  value={generalForm.evaluationTiers?.average ?? 50}
                  onChange={(e) =>
                    setGeneralForm({
                      ...generalForm,
                      evaluationTiers: {
                        ...generalForm.evaluationTiers,
                        average: parseInt(e.target.value, 10) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-amber-300 text-xs font-mono font-bold bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveGeneral}
                className="px-4 py-1.5 bg-[#3289C7] text-white text-xs font-semibold rounded-xl"
              >
                Lưu cấu hình ngưỡng
              </button>
            </div>
          </div>

          {/* Rules List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-[#1E3A5F]">Danh mục quy tắc thi đua</h3>
                <p className="text-xs text-slate-500">Mỗi ghi nhận lưu điểm tại thời điểm phát sinh để bảo lưu lịch sử</p>
              </div>

              <button
                onClick={handleOpenAddRule}
                className="px-3.5 py-1.5 bg-[#3289C7] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm quy tắc mới
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FAFDFE] border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Mã</th>
                    <th className="py-2.5 px-3">Tên sự việc</th>
                    <th className="py-2.5 px-3">Nhóm</th>
                    <th className="py-2.5 px-3 text-right">Điểm</th>
                    <th className="py-2.5 px-3">Liên kết điểm danh</th>
                    <th className="py-2.5 px-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classData.rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-600">{rule.code}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{rule.title}</td>
                      <td className="py-2.5 px-3 text-slate-600">{rule.group}</td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono font-bold ${
                          rule.points > 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {rule.points > 0 ? `+${rule.points}` : rule.points}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {rule.linkAttendance === 'none'
                          ? '-'
                          : rule.linkAttendance === 'late'
                          ? 'Đi muộn'
                          : rule.linkAttendance === 'unexcused'
                          ? 'Vắng không phép'
                          : 'Vắng có phép'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditRule(rule)}
                            className="p-1 text-slate-400 hover:text-slate-800 rounded"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteRule(rule.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB C: DANH MỤC MÔN HỌC */}
      {activeTab === 'subjects' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-[#1E3A5F]">Danh mục môn học áp dụng</h3>
              <p className="text-xs text-slate-500">Hệ thống sẽ cảnh báo nếu xóa môn học đã phát sinh điểm</p>
            </div>

            <button
              onClick={handleOpenAddSubject}
              className="px-3.5 py-1.5 bg-[#3289C7] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm môn học mới
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAFDFE] border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Mã môn</th>
                  <th className="py-2.5 px-3">Tên môn học</th>
                  <th className="py-2.5 px-3 text-center">Số tiết/tuần</th>
                  <th className="py-2.5 px-3">Hình thức đánh giá</th>
                  <th className="py-2.5 px-3 text-center">Trạng thái</th>
                  <th className="py-2.5 px-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classData.subjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{sub.code}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{sub.name}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{sub.periodsPerWeek}</td>
                    <td className="py-2.5 px-3">
                      {sub.evalType === 'score' ? (
                        <span className="text-sky-800 font-medium">Chấm điểm số (0 - 10)</span>
                      ) : (
                        <span className="text-purple-800 font-medium">Nhận xét (Đạt / Chưa đạt)</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => updateSubject({ ...sub, isActive: !sub.isActive })}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                          sub.isActive
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {sub.isActive ? 'Đang bật' : 'Tạm tắt'}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEditSubject(sub)}
                          className="p-1 text-slate-400 hover:text-slate-800 rounded"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteSubject(sub.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB D: SAO LƯU & KHÔI PHỤC */}
      {activeTab === 'backup' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-6 max-w-3xl">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-[#1E3A5F]">Sao lưu & Bảo vệ dữ liệu lớp học</h3>
            <p className="text-xs text-slate-500">
              Xuất toàn bộ cơ sở dữ liệu để lưu trữ ngoại tuyến hoặc đồng bộ trực tiếp lên Supabase Cloud
            </p>
          </div>

          {/* SUPABASE CLOUD SYNC CARD */}
          <div className="p-5 rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/60 via-teal-50/30 to-sky-50/50 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-sm text-slate-800">Cơ sở dữ liệu đám mây Supabase</h4>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Đang kết nối trực tiếp
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Đồng bộ thời gian thực hai chiều giữa ứng dụng và máy chủ Supabase Cloud
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await checkSupabaseStatus();
                    showToast('Đã làm mới thông tin kết nối Supabase Cloud', 'success');
                  } catch (e: any) {
                    showToast('Lỗi kiểm tra kết nối', 'error');
                  }
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Kiểm tra kết nối
              </button>
            </div>

            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-emerald-100 text-xs space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="text-slate-400">Dự án Supabase URL:</span>{' '}
                  <span className="font-mono font-medium text-slate-800 break-all">
                    {supabaseStatus?.url || 'https://sohuavueougdlsqerwuk.supabase.co'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Bảng lưu trữ:</span>{' '}
                  <span className="font-mono font-semibold text-[#008AE6]">public.app_data</span>
                </div>
                <div>
                  <span className="text-slate-400">Khóa lớp hiện tại:</span>{' '}
                  <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {supabaseStatus?.classKey || 'class_gvcn_lop_9a2'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Khóa tài khoản:</span>{' '}
                  <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {supabaseStatus?.usersKey || 'users_gvcn_lop_9a2'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Lớp đang quản lý:</span>{' '}
                  <span className="font-bold text-slate-900">{classData?.settings?.className || 'Lớp 9A2'}</span>{' '}
                  <span className="text-slate-500">({classData?.settings?.teacherName || 'GVCN'})</span>
                </div>
                <div>
                  <span className="text-slate-400">Trạng thái lưu trữ Cloud:</span>{' '}
                  {supabaseStatus?.hasRemoteData ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Đã lưu bản riêng trên Supabase
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      Chưa có bản lưu riêng trên Supabase
                    </span>
                  )}
                </div>
              </div>

              {/* Isolation Security Notice */}
              <div className="pt-2 border-t border-emerald-100 flex items-start gap-2 text-[11px] text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-emerald-800 font-semibold">Chế độ phân lập dữ liệu đa lớp đang kích hoạt:</strong>{' '}
                  <span>
                    Dữ liệu lớp hiện tại ({classData?.settings?.className}) được lưu trữ độc lập theo tài khoản giáo viên và mã lớp. Dữ liệu các lớp khác (ví dụ: Lớp 9A5 tại <code className="text-sky-700 font-mono">main_class_data</code>) được bảo toàn nguyên vẹn 100%, không bị đọc nhầm hay ghi đè.
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                disabled={supabaseSyncing}
                onClick={async () => {
                  setSupabaseSyncing(true);
                  try {
                    await syncWithSupabaseNow();
                  } finally {
                    setSupabaseSyncing(false);
                  }
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <CloudUpload className="w-4 h-4" />
                {supabaseSyncing ? 'Đang đồng bộ...' : `Đẩy dữ liệu ${classData?.settings?.className || 'lớp'} lên Supabase`}
              </button>

              <button
                type="button"
                disabled={supabasePulling}
                onClick={async () => {
                  setSupabasePulling(true);
                  try {
                    await pullFromSupabase();
                  } finally {
                    setSupabasePulling(false);
                  }
                }}
                className="px-4 py-2 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <CloudDownload className="w-4 h-4 text-emerald-600" />
                {supabasePulling ? 'Đang tải...' : `Tải dữ liệu ${classData?.settings?.className || 'lớp'} từ Supabase về`}
              </button>

              <button
                type="button"
                onClick={async () => {
                  setShowDatasetsModal(true);
                  setLoadingDatasets(true);
                  try {
                    const res = await getAvailableDatasets();
                    setDatasetsList(res.datasets || []);
                  } catch (e: any) {
                    showToast('Không thể tải danh sách lớp từ Supabase', 'error');
                  } finally {
                    setLoadingDatasets(false);
                  }
                }}
                className="px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold rounded-xl border border-sky-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                Kiểm tra các lớp trên Supabase
              </button>

              <button
                type="button"
                onClick={() => setShowSqlSchema(!showSqlSchema)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ml-auto ${
                  showSqlSchema
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                }`}
              >
                <FileCode className="w-4 h-4" />
                {showSqlSchema ? 'Ẩn mã SQL tạo bảng' : 'Xem mã SQL tạo bảng tự động'}
                {showSqlSchema ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* SQL Schema Viewer Panel */}
            {showSqlSchema && (
              <div className="p-4 bg-slate-900 border border-slate-700 rounded-2xl text-slate-200 space-y-3.5 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <Terminal className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs sm:text-sm">
                          Script SQL Khởi Tạo Bảng Tự Động (PostgreSQL DDL)
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Sẵn sàng chạy
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Bao gồm: bảng <code className="text-sky-300 font-mono">app_data</code> (đồng bộ đa lớp cách ly), <code className="text-sky-300 font-mono">classes</code>, <code className="text-sky-300 font-mono">students</code>, <code className="text-sky-300 font-mono">app_users</code>, Row Level Security (RLS) và Trigger tự động cập nhật.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopySql}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedSql ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span className="text-emerald-200 font-bold">Đã sao chép!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép SQL</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadSql}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải file .sql</span>
                    </button>

                    <a
                      href="https://supabase.com/dashboard/project/sohuavueougdlsqerwuk/sql/new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Mở SQL Editor</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Steps Guide */}
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 text-[11px] text-slate-300 space-y-1">
                  <p className="font-bold text-slate-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                    Hướng dẫn 3 bước thực hiện trên Supabase:
                  </p>
                  <ol className="list-decimal list-inside space-y-0.5 text-slate-300 pl-1">
                    <li>
                      Nhấn nút <strong className="text-indigo-300">"Sao chép SQL"</strong> ở trên hoặc mở file <code className="text-amber-300 font-mono">/supabase_schema.sql</code> trong dự án.
                    </li>
                    <li>
                      Truy cập <a href="https://supabase.com/dashboard/project/sohuavueougdlsqerwuk/sql/new" target="_blank" rel="noreferrer" className="text-sky-400 underline inline-flex items-center gap-0.5">Supabase Dashboard &gt; SQL Editor <ExternalLink className="w-2.5 h-2.5" /></a> và dán toàn bộ mã vào.
                    </li>
                    <li>
                      Nhấn <strong className="text-emerald-400">"Run" (Ctrl + Enter)</strong>. Supabase sẽ tạo bảng và cấp quyền truy cập công khai tức thì!
                    </li>
                  </ol>
                </div>

                {/* Code Viewer Container */}
                <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950/90">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400">
                    <span className="font-mono">supabase_schema.sql (PostgreSQL)</span>
                    <span>{SUPABASE_SCHEMA_SQL.split('\n').length} dòng</span>
                  </div>
                  <pre className="p-3.5 font-mono text-[11px] text-emerald-400/90 leading-relaxed overflow-x-auto max-h-72 overflow-y-auto selection:bg-indigo-600 selection:text-white">
                    {SUPABASE_SCHEMA_SQL}
                  </pre>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Export Backup */}
            <div className="p-5 rounded-2xl border border-sky-100 bg-[#EAF6FF]/40 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-[#3289C7] text-white flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-[#1E3A5F]">Tải về bản sao lưu đầy đủ</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tệp sao lưu chứa đầy đủ danh sách học sinh, điểm danh, bảng điểm, thi đua, sơ đồ lớp và cấu hình hiện tại.
              </p>
              <button
                onClick={handleExportBackup}
                className="w-full py-2.5 px-4 bg-[#3289C7] hover:bg-[#256ea4] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Xuất tệp sao lưu (.json)
              </button>
            </div>

            {/* Import Restore */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-slate-700 text-white flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-800">Khôi phục từ tệp sao lưu</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tải lên tệp sao lưu JSON đã lưu trước đây để phục hồi lại trạng thái lớp học.
              </p>
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreFile}
                className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 cursor-pointer"
              />

              {restoreJson && (
                <div className={`p-4 rounded-xl text-xs space-y-3 border ${
                  restoreIsDifferentClass
                    ? 'bg-rose-50 border-rose-200 text-rose-950'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                }`}>
                  <div className="flex items-start gap-2">
                    {restoreIsDifferentClass ? (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <div className="font-bold text-xs">
                        {restoreIsDifferentClass
                          ? 'CẢNH BÁO: Tệp sao lưu không khớp với lớp đang quản lý!'
                          : 'Tệp sao lưu hợp lệ và khớp với lớp đang quản lý'}
                      </div>
                      <div className="text-[11px] space-y-0.5">
                        <div>
                          <span className="text-slate-500">Lớp trong tệp sao lưu:</span>{' '}
                          <strong className={restoreIsDifferentClass ? 'text-rose-700' : 'text-emerald-800'}>
                            {restoreSourceClass || 'Chưa xác định'}
                          </strong>{' '}
                          {restoreSourceTeacher && <span className="text-slate-500">(GV: {restoreSourceTeacher})</span>}
                        </div>
                        <div>
                          <span className="text-slate-500">Lớp hiện tại đang quản lý:</span>{' '}
                          <strong className="text-slate-800">{classData?.settings?.className || 'Lớp 9A2'}</strong>{' '}
                          <span className="text-slate-500">({classData?.settings?.teacherName || 'GVCN'})</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Số lượng học sinh trong tệp:</span>{' '}
                          <strong>{restoreJson.students?.length || restoreJson.classData?.students?.length || 0} học sinh</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {restoreIsDifferentClass ? (
                    <div className="p-2.5 bg-rose-100/70 rounded-lg text-[11px] text-rose-900 space-y-2 border border-rose-200">
                      <p>
                        ⚠️ Bạn đang tải lên bản sao lưu của <strong>{restoreSourceClass}</strong> để thay thế cho <strong>{classData?.settings?.className}</strong>.
                      </p>
                      <p className="font-medium text-emerald-800 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Hệ thống sẽ TỰ ĐỘNG TẠO BẢN SAO LƯU AN TOÀN của {classData?.settings?.className} trước khi thực hiện ghi đè.
                      </p>
                      <label className="flex items-center gap-2 font-bold text-rose-950 cursor-pointer pt-1 border-t border-rose-200">
                        <input
                          type="checkbox"
                          checked={confirmRestoreDiffClass}
                          onChange={(e) => setConfirmRestoreDiffClass(e.target.checked)}
                          className="rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                        />
                        <span>Tôi xác nhận muốn chuyển đổi sang dữ liệu lớp {restoreSourceClass}</span>
                      </label>
                    </div>
                  ) : (
                    <p className="text-[11px] text-emerald-800 flex items-center gap-1 bg-white/70 p-2 rounded-lg border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      Hệ thống sẽ tự động tạo một bản sao lưu an toàn trước khi khôi phục dữ liệu.
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={restoreIsDifferentClass && !confirmRestoreDiffClass}
                      onClick={handleConfirmRestore}
                      className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        restoreIsDifferentClass
                          ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      }`}
                    >
                      {restoreIsDifferentClass
                        ? `Xác nhận chuyển đổi sang ${restoreSourceClass}`
                        : 'Xác nhận khôi phục dữ liệu lớp học'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRestoreJson(null);
                        setRestoreSourceClass(null);
                        setRestoreSourceTeacher(null);
                        setRestoreIsDifferentClass(false);
                        setConfirmRestoreDiffClass(false);
                      }}
                      className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-colors cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reset Demo Data */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-xs font-bold text-slate-700">Khôi phục dữ liệu mẫu ban đầu</div>
              <div className="text-[11px] text-slate-400">
                Đưa {classData?.settings?.className || 'lớp học'} về cấu hình mẫu chuẩn ban đầu (sẽ tự động sao lưu dữ liệu hiện tại trước)
              </div>
            </div>
            <button
              onClick={handleResetDemo}
              className="px-3.5 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Đặt lại dữ liệu mẫu
            </button>
          </div>
        </div>
      )}

      {/* RULE MODAL */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-xl">
            <h4 className="font-bold text-sm text-[#1E3A5F]">
              {editingRule ? 'Chỉnh sửa quy tắc thi đua' : 'Thêm quy tắc thi đua mới'}
            </h4>

            <form onSubmit={handleSaveRule} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mã quy tắc</label>
                  <input
                    type="text"
                    required
                    value={ruleFormData.code}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nhóm</label>
                  <select
                    value={ruleFormData.group}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, group: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  >
                    <option value="Học tập">Học tập</option>
                    <option value="Chuyên cần">Chuyên cần</option>
                    <option value="Nề nếp">Nề nếp</option>
                    <option value="Phong trào">Phong trào</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên sự việc (*)</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Đạt giải kỳ thi học sinh giỏi"
                  value={ruleFormData.title}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Điểm (+ hoặc -)</label>
                  <input
                    type="number"
                    required
                    placeholder="-2 hoặc +5"
                    value={ruleFormData.points}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, points: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Liên kết điểm danh</label>
                  <select
                    value={ruleFormData.linkAttendance}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, linkAttendance: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  >
                    <option value="none">Không liên kết</option>
                    <option value="late">Đi muộn</option>
                    <option value="unexcused">Vắng không phép</option>
                    <option value="excused">Vắng có phép</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#3289C7] text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  Lưu quy tắc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBJECT MODAL */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-xl">
            <h4 className="font-bold text-sm text-[#1E3A5F]">
              {editingSubject ? 'Chỉnh sửa môn học' : 'Thêm môn học mới'}
            </h4>

            <form onSubmit={handleSaveSubject} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mã môn (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="TOAN, VAN, ANH..."
                    value={subjectFormData.code}
                    onChange={(e) => setSubjectFormData({ ...subjectFormData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Số tiết/tuần</label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={subjectFormData.periodsPerWeek}
                    onChange={(e) => setSubjectFormData({ ...subjectFormData, periodsPerWeek: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên môn học (*)</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Tin học nâng cao"
                  value={subjectFormData.name}
                  onChange={(e) => setSubjectFormData({ ...subjectFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hình thức đánh giá</label>
                <select
                  value={subjectFormData.evalType}
                  onChange={(e) => setSubjectFormData({ ...subjectFormData, evalType: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                >
                  <option value="score">Chấm điểm số (0 - 10)</option>
                  <option value="comment">Đánh giá bằng nhận xét (Đạt / Chưa đạt)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#3289C7] text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  Lưu môn học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPABASE MULTI-CLASS AUDIT & SAFE MIGRATION MODAL */}
      {showDatasetsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-[#008AE6] flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">
                    Danh sách các lớp trên Supabase Cloud (Bảo vệ phân lập)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Mỗi lớp được lưu trữ độc lập theo tài khoản giáo viên và mã lớp riêng biệt
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDatasetsModal(false);
                  setSelectedMigrateSource(null);
                  setConfirmMigrateDiffClass(false);
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Reassurance banner */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong>Bảo toàn dữ liệu tuyệt đối:</strong> Dữ liệu của các lớp khác (như Lớp 9A5 tại <code className="font-mono text-emerald-800">main_class_data</code>) được lưu trữ độc lập trên Cloud, không bị xóa, không bị ghi đè và không tự động nạp vào lớp đang quản lý ({classData?.settings?.className}).
              </div>
            </div>

            {/* Migration Confirmation Step */}
            {selectedMigrateSource ? (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs space-y-3">
                <div className="font-bold text-amber-900 flex items-center gap-1.5 text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Xác nhận chuyển đổi dữ liệu lớp học
                </div>
                <div className="space-y-1.5 text-slate-700 bg-white p-3 rounded-lg border border-amber-200">
                  <div>
                    <span className="text-slate-400">Lớp nguồn trên Supabase:</span>{' '}
                    <strong className="text-amber-800">{selectedMigrateSource.className}</strong>{' '}
                    <span className="text-slate-500">(GV: {selectedMigrateSource.teacherName} - {selectedMigrateSource.studentsCount} học sinh)</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Lớp hiện tại đang quản lý:</span>{' '}
                    <strong className="text-slate-800">{classData?.settings?.className}</strong>{' '}
                    <span className="text-slate-500">(GV: {classData?.settings?.teacherName})</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold pt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Hệ thống sẽ TỰ ĐỘNG TẠO BẢN SAO LƯU AN TOÀN của {classData?.settings?.className} trước khi nạp.
                  </div>
                </div>

                <label className="flex items-center gap-2 font-bold text-amber-950 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={confirmMigrateDiffClass}
                    onChange={(e) => setConfirmMigrateDiffClass(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <span>Tôi xác nhận muốn chuyển đổi sang dữ liệu của {selectedMigrateSource.className}</span>
                </label>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    disabled={!confirmMigrateDiffClass || migrating}
                    onClick={async () => {
                      setMigrating(true);
                      try {
                        await migrateSupabaseDataset(selectedMigrateSource.id, true);
                        setShowDatasetsModal(false);
                        setSelectedMigrateSource(null);
                        setConfirmMigrateDiffClass(false);
                      } catch (e: any) {
                        // toast handled
                      } finally {
                        setMigrating(false);
                      }
                    }}
                    className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    {migrating ? 'Đang chuyển đổi...' : `Xác nhận nạp dữ liệu ${selectedMigrateSource.className}`}
                  </button>
                  <button
                    type="button"
                    disabled={migrating}
                    onClick={() => {
                      setSelectedMigrateSource(null);
                      setConfirmMigrateDiffClass(false);
                    }}
                    className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-colors cursor-pointer"
                  >
                    Quay lại danh sách
                  </button>
                </div>
              </div>
            ) : (
              /* Datasets Table / List */
              <div className="space-y-2">
                {loadingDatasets ? (
                  <div className="py-8 text-center text-xs text-slate-500">Đang kiểm tra dữ liệu Supabase...</div>
                ) : datasetsList && datasetsList.length > 0 ? (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {datasetsList.map((item) => (
                      <div key={item.id} className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 flex-wrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-800">{item.className}</span>
                            {item.isCurrentClass ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                Lớp đang quản lý
                              </span>
                            ) : item.is9A5 ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-800 border border-sky-300">
                                Lớp khác (Bảo toàn độc lập)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                Bản lưu trữ
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-3">
                            <span>Khóa: <code className="font-mono text-slate-700">{item.id}</code></span>
                            {item.teacherName && item.teacherName !== 'Không xác định' && (
                              <span>GV: <strong>{item.teacherName}</strong></span>
                            )}
                            {item.studentsCount > 0 && <span>{item.studentsCount} học sinh</span>}
                          </div>
                        </div>

                        {!item.isCurrentClass && !item.id.includes('users') && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMigrateSource(item);
                              setConfirmMigrateDiffClass(false);
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer"
                          >
                            Tùy chọn chuyển đổi sang lớp này
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-500">Chưa tìm thấy bản ghi nào trên bảng app_data</div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowDatasetsModal(false);
                  setSelectedMigrateSource(null);
                  setConfirmMigrateDiffClass(false);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
