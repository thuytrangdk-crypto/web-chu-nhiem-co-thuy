import React, { useState } from 'react';
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
} from 'lucide-react';
import { AppSettings, DisciplineRule, Subject } from '../types';

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
  } = useApp();

  const [activeTab, setActiveTab] = useState<'general' | 'password' | 'rules' | 'subjects' | 'backup'>('general');

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

  // File upload for restore
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.classData || parsed.students) {
          setRestoreJson(parsed);
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
    if (window.confirm('CẢNH BÁO: Dữ liệu hiện tại sẽ được ghi đè hoàn toàn bởi bản sao lưu này. Bạn có chắc chắn muốn khôi phục?')) {
      await restoreData(restoreJson);
      setRestoreJson(null);
    }
  };

  const handleResetDemo = async () => {
    if (window.confirm('Bạn có chắc chắn muốn đặt lại dữ liệu mẫu lớp 10A1 ban đầu? Mọi chỉnh sửa tùy ý gần đây sẽ trở về trạng thái mẫu chuẩn.')) {
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
              Xuất toàn bộ cơ sở dữ liệu để lưu trữ ngoại tuyến hoặc khôi phục khi cần
            </p>
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
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-2">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Đã đọc tệp sao lưu thành công!
                  </div>
                  <button
                    onClick={handleConfirmRestore}
                    className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg"
                  >
                    Xác nhận ghi đè khôi phục
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Reset Demo Data */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-xs font-bold text-slate-700">Khôi phục dữ liệu mẫu ban đầu</div>
              <div className="text-[11px] text-slate-400">
                Đưa lớp 10A1 về cấu hình mẫu 36 học sinh và sơ đồ 56 chỗ mặc định
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
    </div>
  );
};
