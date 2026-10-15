import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  UserPlus,
  FileSpreadsheet,
  Download,
  Upload,
  Edit,
  Trash2,
  Eye,
  Filter,
  CheckCircle,
  AlertCircle,
  X,
  Phone,
  User,
  MapPin,
  Calendar,
} from 'lucide-react';
import { Student } from '../types';
import {
  downloadStudentTemplate,
  exportStudentsToExcel,
  parseStudentExcel,
  ImportError,
} from '../utils/excel';

export const StudentsView: React.FC = () => {
  const {
    user,
    classData,
    addStudent,
    updateStudent,
    deleteStudent,
    importStudents,
    openStudentProfile,
    showToast,
  } = useApp();

  const isTeacher = user?.role === 'teacher';

  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'Nam' | 'Nữ'>('all');
  const [seatFilter, setSeatFilter] = useState<'all' | 'seated' | 'unseated'>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Form State for Add/Edit
  const [formData, setFormData] = useState({
    id: '',
    fullName: '',
    gender: 'Nam' as 'Nam' | 'Nữ',
    dob: '',
    phone: '',
    parentPhone: '',
    address: '',
    notes: '',
  });

  // Import State
  const [importPreview, setImportPreview] = useState<{
    valid: Student[];
    errors: ImportError[];
  } | null>(null);
  const [importing, setImporting] = useState(false);

  const students = classData?.students || [];

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        s.fullName.toLowerCase().includes(search.toLowerCase()) ||
        s.id.toLowerCase().includes(search.toLowerCase());
      const matchGender = genderFilter === 'all' || s.gender === genderFilter;
      const matchSeat =
        seatFilter === 'all' ||
        (seatFilter === 'seated' && s.seatCode) ||
        (seatFilter === 'unseated' && !s.seatCode);
      return matchSearch && matchGender && matchSeat;
    });
  }, [students, search, genderFilter, seatFilter]);

  if (!classData) return null;

  const handleOpenAdd = () => {
    // Generate next student code e.g. HS1037
    const lastNum = students.reduce((max, s) => {
      const match = s.id.match(/\d+/);
      return match ? Math.max(max, parseInt(match[0], 10)) : max;
    }, 1000);
    const nextId = `HS${lastNum + 1}`;

    setFormData({
      id: nextId,
      fullName: '',
      gender: 'Nam',
      dob: '15/05/2008',
      phone: '',
      parentPhone: '',
      address: '',
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      id: student.id,
      fullName: student.fullName,
      gender: student.gender,
      dob: student.dob,
      phone: student.phone,
      parentPhone: student.parentPhone || '',
      address: student.address || '',
      notes: student.notes || '',
    });
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      showToast('Vui lòng nhập họ và tên học sinh', 'error');
      return;
    }
    if (!formData.dob.trim()) {
      showToast('Vui lòng nhập ngày sinh định dạng DD/MM/YYYY', 'error');
      return;
    }

    try {
      if (editingStudent) {
        await updateStudent({
          ...editingStudent,
          fullName: formData.fullName.trim(),
          gender: formData.gender,
          dob: formData.dob.trim(),
          phone: formData.phone.trim() || 'Chưa cập nhật',
          parentPhone: formData.parentPhone.trim(),
          address: formData.address.trim(),
          notes: formData.notes.trim(),
        });
        setEditingStudent(null);
      } else {
        await addStudent({
          id: formData.id.trim(),
          fullName: formData.fullName.trim(),
          gender: formData.gender,
          dob: formData.dob.trim(),
          phone: formData.phone.trim() || 'Chưa cập nhật',
          parentPhone: formData.parentPhone.trim(),
          address: formData.address.trim(),
          notes: formData.notes.trim(),
        });
        setIsAddModalOpen(false);
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi lưu học sinh', 'error');
    }
  };

  const handleDelete = (s: Student) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa học sinh ${s.fullName} (${s.id})? Hành động này sẽ giải phóng chỗ ngồi và xóa dữ liệu liên quan.`)) {
      deleteStudent(s.id);
    }
  };

  // Handle Excel file drop/selection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      const result = parseStudentExcel(buffer, students);
      setImportPreview({
        valid: result.validStudents,
        errors: result.errors,
      });
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = async () => {
    if (!importPreview || importPreview.valid.length === 0) return;
    setImporting(true);
    try {
      await importStudents(importPreview.valid);
      setIsImportModalOpen(false);
      setImportPreview(null);
    } catch (err: any) {
      showToast(err.message || 'Lỗi nhập dữ liệu', 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-[#1E3A5F]">
            Quản lý học sinh ({students.length} học sinh)
          </h2>
          <p className="text-xs text-slate-500">
            Hồ sơ học sinh lớp {classData.settings.className} · Năm học {classData.settings.schoolYear}
          </p>
        </div>

        {isTeacher && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={downloadStudentTemplate}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Tải tệp mẫu Excel có sẵn các cột chuẩn"
            >
              <Download className="w-3.5 h-3.5" />
              Tải file mẫu Excel
            </button>

            <button
              onClick={() => {
                setImportPreview(null);
                setIsImportModalOpen(true);
              }}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Nhập Excel
            </button>

            <button
              onClick={() => exportStudentsToExcel(students, classData.settings)}
              className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold rounded-xl border border-sky-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Xuất Excel
            </button>

            <button
              onClick={handleOpenAdd}
              className="px-3.5 py-1.5 bg-[#3289C7] hover:bg-[#256ea4] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Thêm học sinh
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo họ tên hoặc mã học sinh..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#3289C7]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Lọc:</span>
          </div>

          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value as any)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
          >
            <option value="all">Tất cả giới tính</option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>

          <select
            value={seatFilter}
            onChange={(e) => setSeatFilter(e.target.value as any)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
          >
            <option value="all">Tất cả chỗ ngồi</option>
            <option value="seated">Đã có chỗ ngồi</option>
            <option value="unseated">Chưa xếp chỗ</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#FAFDFE] border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4">Mã HS</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Giới tính</th>
                <th className="py-3 px-4">Ngày sinh</th>
                <th className="py-3 px-4">Số điện thoại</th>
                <th className="py-3 px-4">Chỗ ngồi</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Không tìm thấy học sinh nào phù hợp với bộ lọc tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-center font-mono text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {student.id}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => openStudentProfile(student.id)}
                        className="font-bold text-[#3289C7] hover:underline text-left cursor-pointer"
                      >
                        {student.fullName}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          student.gender === 'Nam'
                            ? 'bg-sky-50 text-sky-800'
                            : 'bg-rose-50 text-rose-800'
                        }`}
                      >
                        {student.gender}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {student.dob}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {student.phone}
                    </td>
                    <td className="py-3 px-4">
                      {student.seatCode ? (
                        <span className="font-mono text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                          {student.seatCode}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Chưa xếp</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openStudentProfile(student.id)}
                          className="p-1.5 text-slate-500 hover:text-[#3289C7] hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                          title="Xem hồ sơ chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isTeacher && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(student)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Chỉnh sửa thông tin"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(student)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Xóa học sinh"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT STUDENT MODAL */}
      {(isAddModalOpen || editingStudent) && isTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-xl animate-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-[#1E3A5F]">
                {editingStudent ? 'Chỉnh sửa hồ sơ học sinh' : 'Thêm học sinh mới vào lớp'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingStudent(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mã học sinh (*)
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingStudent)}
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Giới tính (*)
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên (*)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngày sinh (DD/MM/YYYY) (*)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="15/05/2008"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số điện thoại HS
                  </label>
                  <input
                    type="text"
                    placeholder="0912345678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số điện thoại phụ huynh
                </label>
                <input
                  type="text"
                  placeholder="0988776655"
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Địa chỉ thường trú / tạm trú
                </label>
                <input
                  type="text"
                  placeholder="Số nhà, đường, phường, quận..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ghi chú của GVCN
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú hoàn cảnh, năng khiếu, v.v."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingStudent(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#3289C7] hover:bg-[#256ea4] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {editingStudent ? 'Cập nhật hồ sơ' : 'Lưu học sinh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXCEL IMPORT MODAL */}
      {isImportModalOpen && isTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 border border-slate-200 shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-[#1E3A5F]">
                  Nhập danh sách học sinh từ file Excel
                </h3>
                <p className="text-xs text-slate-500">
                  Hệ thống tự động kiểm tra tính hợp lệ, định dạng ngày sinh DD/MM/YYYY và tránh trùng mã
                </p>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dropzone */}
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-[#3289C7] transition-colors bg-slate-50">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">
                Chọn tệp Excel (.xlsx, .xls) chứa danh sách học sinh
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Nếu chưa có file mẫu chuẩn, vui lòng bấm "Tải file mẫu Excel" ở ngoài bảng
              </p>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="mt-3 text-xs block mx-auto text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#3289C7] file:text-white hover:file:bg-[#256ea4] cursor-pointer"
              />
            </div>

            {/* Preview Results */}
            {importPreview && (
              <div className="flex-1 overflow-y-auto space-y-3">
                {/* Status Stats */}
                <div className="flex items-center gap-3 text-xs">
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 flex-1">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Hợp lệ: <strong>{importPreview.valid.length} dòng</strong> sẵn sàng nhập
                    </span>
                  </div>
                  {importPreview.errors.length > 0 && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 flex-1">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>
                        Lỗi: <strong>{importPreview.errors.length} dòng</strong> bị bỏ qua
                      </span>
                    </div>
                  )}
                </div>

                {/* Error Log */}
                {importPreview.errors.length > 0 && (
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs space-y-1">
                    <div className="font-bold text-rose-900">Chi tiết các dòng bị lỗi:</div>
                    {importPreview.errors.map((err, i) => (
                      <div key={i} className="text-rose-700">
                        · Dòng {err.row} [{err.field}]: {err.message}
                      </div>
                    ))}
                  </div>
                )}

                {/* Valid Rows Preview Table */}
                {importPreview.valid.length > 0 && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-100 px-3 py-2 text-[11px] font-bold text-slate-700 uppercase">
                      Xem trước danh sách hợp lệ ({importPreview.valid.length} học sinh)
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                          <tr>
                            <th className="py-2 px-3">Mã HS</th>
                            <th className="py-2 px-3">Họ và tên</th>
                            <th className="py-2 px-3">Giới tính</th>
                            <th className="py-2 px-3">Ngày sinh</th>
                            <th className="py-2 px-3">SĐT</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {importPreview.valid.map((st) => (
                            <tr key={st.id}>
                              <td className="py-2 px-3 font-mono font-bold text-slate-700">{st.id}</td>
                              <td className="py-2 px-3 font-semibold text-slate-800">{st.fullName}</td>
                              <td className="py-2 px-3">{st.gender}</td>
                              <td className="py-2 px-3 font-mono">{st.dob}</td>
                              <td className="py-2 px-3 font-mono">{st.phone}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={!importPreview || importPreview.valid.length === 0 || importing}
                onClick={handleConfirmImport}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {importing ? 'Đang nhập dữ liệu...' : `Xác nhận nhập ${importPreview?.valid.length || 0} học sinh`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
