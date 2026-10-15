import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  Download,
  Upload,
  FileSpreadsheet,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  X,
  Search,
} from 'lucide-react';
import { GradeRecord, Subject } from '../types';
import {
  downloadGradeTemplate,
  exportGradebookToExcel,
  parseGradeExcel,
  ImportError,
} from '../utils/excel';

export const AcademicsView: React.FC = () => {
  const {
    user,
    classData,
    addGrade,
    updateGrade,
    deleteGrade,
    importGrades,
    openStudentProfile,
    showToast,
  } = useApp();

  const isTeacher = user?.role === 'teacher';
  const [semester, setSemester] = useState<'HK1' | 'HK2'>('HK1');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Modals
  const [isAddScoreModalOpen, setIsAddScoreModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<GradeRecord | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Form State
  const [scoreForm, setScoreForm] = useState({
    studentId: '',
    subjectId: '',
    type: 'tx' as GradeRecord['type'],
    scoreVal: '',
    evalVal: 'Đạt',
    date: '2026-10-15',
    note: '',
  });

  // Import State
  const [importPreview, setImportPreview] = useState<{
    valid: GradeRecord[];
    errors: ImportError[];
  } | null>(null);
  const [importing, setImporting] = useState(false);

  const students = classData?.students || [];
  const subjects = (classData?.subjects || []).filter((s) => s.isActive);
  const grades = classData?.grades || [];

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(search.toLowerCase()) ||
        s.id.toLowerCase().includes(search.toLowerCase())
    );
  }, [students, search]);

  if (!classData) return null;

  const handleOpenAddScore = () => {
    setScoreForm({
      studentId: students[0]?.id || '',
      subjectId: subjects[0]?.id || '',
      type: 'tx',
      scoreVal: '8.5',
      evalVal: 'Đạt',
      date: '2026-10-15',
      note: 'Kiểm tra thường xuyên',
    });
    setIsAddScoreModalOpen(true);
  };

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scoreForm.studentId || !scoreForm.subjectId) {
      showToast('Vui lòng chọn học sinh và môn học', 'error');
      return;
    }

    const sub = subjects.find((s) => s.id === scoreForm.subjectId);
    let parsedScore: number | undefined = undefined;
    let evalVal: string | undefined = undefined;

    if (sub?.evalType === 'score') {
      parsedScore = parseFloat(scoreForm.scoreVal.replace(',', '.'));
      if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 10) {
        showToast('Điểm số phải từ 0 đến 10', 'error');
        return;
      }
    } else {
      evalVal = scoreForm.evalVal;
    }

    try {
      if (editingGrade) {
        await updateGrade({
          ...editingGrade,
          score: parsedScore,
          evaluation: evalVal,
          date: scoreForm.date,
          note: scoreForm.note.trim(),
        });
        setEditingGrade(null);
      } else {
        await addGrade({
          studentId: scoreForm.studentId,
          subjectId: scoreForm.subjectId,
          semester,
          type: scoreForm.type,
          date: scoreForm.date,
          score: parsedScore,
          evaluation: evalVal,
          note: scoreForm.note.trim(),
        });
        setIsAddScoreModalOpen(false);
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi lưu điểm', 'error');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      const result = parseGradeExcel(buffer, students, subjects);
      setImportPreview({
        valid: result.validGrades,
        errors: result.errors,
      });
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = async () => {
    if (!importPreview || importPreview.valid.length === 0) return;
    setImporting(true);
    try {
      await importGrades(importPreview.valid);
      setIsImportModalOpen(false);
      setImportPreview(null);
    } catch (err: any) {
      showToast(err.message || 'Lỗi nhập bảng điểm', 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-[#1E3A5F]">
            Quản lý Học tập & Sổ điểm môn học
          </h2>
          <p className="text-xs text-slate-500">
            Học kỳ {semester === 'HK1' ? '1' : '2'} · Lớp {classData.settings.className} · Năm học {classData.settings.schoolYear}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Semester Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setSemester('HK1')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                semester === 'HK1' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Học kỳ 1
            </button>
            <button
              onClick={() => setSemester('HK2')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                semester === 'HK2' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Học kỳ 2
            </button>
          </div>

          {isTeacher && (
            <>
              <button
                onClick={() => downloadGradeTemplate(subjects, students)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Tải bảng điểm mẫu Excel"
              >
                <Download className="w-3.5 h-3.5" />
                Tải file mẫu
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
                onClick={() => exportGradebookToExcel(classData, semester)}
                className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold rounded-xl border border-sky-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Xuất Excel
              </button>

              <button
                onClick={handleOpenAddScore}
                className="px-3.5 py-1.5 bg-[#3289C7] hover:bg-[#256ea4] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Nhập điểm
              </button>
            </>
          )}
        </div>
      </div>

      {/* Subject Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedSubjectId('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              selectedSubjectId === 'all'
                ? 'bg-[#3289C7] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả các môn (Tổng hợp)
          </button>
          {subjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubjectId(sub.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                selectedSubjectId === sub.id
                  ? 'bg-[#3289C7] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>

        <div className="relative w-60">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo tên học sinh..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#3289C7]"
          />
        </div>
      </div>

      {/* MATRIX TABLE: ALL SUBJECTS VIEW */}
      {selectedSubjectId === 'all' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAFDFE] border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">STT</th>
                  <th className="py-2.5 px-3">Mã HS</th>
                  <th className="py-2.5 px-3 min-w-[150px]">Họ và tên</th>
                  {subjects.map((sub) => (
                    <th key={sub.id} className="py-2.5 px-3 text-center whitespace-nowrap">
                      {sub.name}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-center whitespace-nowrap bg-sky-50/50">
                    ĐTB các môn
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student, idx) => {
                  let totalScoreSum = 0;
                  let scoreSubjectCount = 0;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                        {student.id}
                      </td>
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => openStudentProfile(student.id, 'academics')}
                          className="font-bold text-[#3289C7] hover:underline text-left cursor-pointer"
                        >
                          {student.fullName}
                        </button>
                      </td>
                      {subjects.map((sub) => {
                        const studentGrades = grades.filter(
                          (g) =>
                            g.studentId === student.id &&
                            g.subjectId === sub.id &&
                            g.semester === semester
                        );

                        if (sub.evalType === 'comment') {
                          const lastEval = studentGrades[studentGrades.length - 1];
                          return (
                            <td key={sub.id} className="py-2.5 px-3 text-center font-semibold text-sky-800">
                              {lastEval?.evaluation || '-'}
                            </td>
                          );
                        }

                        const scores = studentGrades
                          .map((g) => g.score)
                          .filter((s): s is number => s !== undefined);
                        if (scores.length > 0) {
                          const avg = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
                          totalScoreSum += avg;
                          scoreSubjectCount++;
                          return (
                            <td key={sub.id} className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                              {avg.toFixed(1)}
                            </td>
                          );
                        }

                        return (
                          <td key={sub.id} className="py-2.5 px-3 text-center text-slate-300 font-mono">
                            -
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-3 text-center font-mono font-extrabold text-[#3289C7] bg-sky-50/30">
                        {scoreSubjectCount > 0
                          ? (Math.round((totalScoreSum / scoreSubjectCount) * 10) / 10).toFixed(1)
                          : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SINGLE SUBJECT DETAILED VIEW */}
      {selectedSubjectId !== 'all' && currentSubject && (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-[#F8FBFE]">
            <div>
              <h3 className="font-bold text-sm text-[#1E3A5F]">
                Sổ điểm chi tiết môn {currentSubject.name} ({semester})
              </h3>
              <p className="text-xs text-slate-500">
                Hình thức: {currentSubject.evalType === 'score' ? 'Chấm điểm số (0 - 10)' : 'Đánh giá bằng nhận xét'} · Số tiết/tuần: {currentSubject.periodsPerWeek}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAFDFE] border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-4 w-12 text-center">STT</th>
                  <th className="py-2.5 px-4">Mã HS</th>
                  <th className="py-2.5 px-4">Họ và tên</th>
                  <th className="py-2.5 px-4">Thường xuyên (TX)</th>
                  <th className="py-2.5 px-4">Giữa kỳ (GK)</th>
                  <th className="py-2.5 px-4">Cuối kỳ (CK)</th>
                  <th className="py-2.5 px-4 text-center font-bold text-[#3289C7]">Điểm TB / Đánh giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student, idx) => {
                  const studentGrades = grades.filter(
                    (g) =>
                      g.studentId === student.id &&
                      g.subjectId === currentSubject.id &&
                      g.semester === semester
                  );

                  const txGrades = studentGrades.filter((g) => g.type === 'tx');
                  const gkGrade = studentGrades.find((g) => g.type === 'gk');
                  const ckGrade = studentGrades.find((g) => g.type === 'ck');

                  if (currentSubject.evalType === 'comment') {
                    const lastEval = studentGrades[studentGrades.length - 1];
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-700">{student.id}</td>
                        <td className="py-2.5 px-4 font-bold text-[#3289C7]">{student.fullName}</td>
                        <td colSpan={3} className="py-2.5 px-4 text-slate-400 italic">Đánh giá nhận xét định kỳ</td>
                        <td className="py-2.5 px-4 text-center font-bold text-sky-800">
                          {lastEval?.evaluation || 'Chưa đánh giá'}
                        </td>
                      </tr>
                    );
                  }

                  const txVals = txGrades.map((g) => g.score).filter((s): s is number => s !== undefined);
                  let avgStr = '-';
                  if (txVals.length > 0 || gkGrade?.score !== undefined || ckGrade?.score !== undefined) {
                    let totalWeight = 0;
                    let weightedSum = 0;

                    if (txVals.length > 0) {
                      const txAvg = txVals.reduce((a, b) => a + b, 0) / txVals.length;
                      weightedSum += txAvg * 1;
                      totalWeight += 1;
                    }
                    if (gkGrade?.score !== undefined) {
                      weightedSum += gkGrade.score * 2;
                      totalWeight += 2;
                    }
                    if (ckGrade?.score !== undefined) {
                      weightedSum += ckGrade.score * 3;
                      totalWeight += 3;
                    }

                    if (totalWeight > 0) {
                      avgStr = (Math.round((weightedSum / totalWeight) * 10) / 10).toFixed(1);
                    }
                  }

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-700">{student.id}</td>
                      <td className="py-2.5 px-4">
                        <button
                          onClick={() => openStudentProfile(student.id, 'academics')}
                          className="font-bold text-[#3289C7] hover:underline text-left cursor-pointer"
                        >
                          {student.fullName}
                        </button>
                      </td>
                      <td className="py-2.5 px-4 font-mono">
                        {txVals.length > 0 ? txVals.join(', ') : '-'}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-semibold">
                        {gkGrade?.score !== undefined ? gkGrade.score : '-'}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-semibold">
                        {ckGrade?.score !== undefined ? ckGrade.score : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono font-extrabold text-[#3289C7] text-sm">
                        {avgStr}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT SCORE MODAL */}
      {(isAddScoreModalOpen || editingGrade) && isTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-xl">
            <h4 className="font-bold text-base text-[#1E3A5F]">
              {editingGrade ? 'Chỉnh sửa điểm đánh giá' : 'Nhập điểm học sinh'}
            </h4>

            <form onSubmit={handleSaveScore} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Chọn học sinh</label>
                <select
                  disabled={Boolean(editingGrade)}
                  value={scoreForm.studentId}
                  onChange={(e) => setScoreForm({ ...scoreForm, studentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                >
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullName} ({st.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Môn học</label>
                  <select
                    disabled={Boolean(editingGrade)}
                    value={scoreForm.subjectId}
                    onChange={(e) => setScoreForm({ ...scoreForm, subjectId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Loại kiểm tra</label>
                  <select
                    value={scoreForm.type}
                    onChange={(e) => setScoreForm({ ...scoreForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  >
                    <option value="tx">Thường xuyên (TX)</option>
                    <option value="gk">Giữa kỳ (GK)</option>
                    <option value="ck">Cuối kỳ (CK)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Giá trị điểm số (0 - 10) hoặc Nhận xét
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 8.5 hoặc Đạt"
                  value={scoreForm.scoreVal}
                  onChange={(e) => setScoreForm({ ...scoreForm, scoreVal: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi chú</label>
                <input
                  type="text"
                  placeholder="Kiểm tra 15 phút, kiểm tra miệng..."
                  value={scoreForm.note}
                  onChange={(e) => setScoreForm({ ...scoreForm, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddScoreModalOpen(false);
                    setEditingGrade(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#3289C7] text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  Lưu điểm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXCEL IMPORT GRADE MODAL */}
      {isImportModalOpen && isTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 border border-slate-200 shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-[#1E3A5F]">
                  Nhập bảng điểm học sinh từ file Excel
                </h3>
                <p className="text-xs text-slate-500">
                  Kiểm tra mã học sinh, mã môn học và tính hợp lệ của thang điểm 0 - 10
                </p>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-[#3289C7] transition-colors bg-slate-50">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">
                Chọn tệp Excel bảng điểm (.xlsx, .xls)
              </p>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="mt-3 text-xs block mx-auto text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#3289C7] file:text-white hover:file:bg-[#256ea4] cursor-pointer"
              />
            </div>

            {importPreview && (
              <div className="flex-1 overflow-y-auto space-y-3">
                <div className="flex items-center gap-3 text-xs">
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 flex-1">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Hợp lệ: <strong>{importPreview.valid.length} đầu điểm</strong> sẵn sàng nhập
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

                {importPreview.errors.length > 0 && (
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs space-y-1">
                    <div className="font-bold text-rose-900">Chi tiết lỗi:</div>
                    {importPreview.errors.map((err, i) => (
                      <div key={i} className="text-rose-700">
                        · Dòng {err.row} [{err.field}]: {err.message}
                      </div>
                    ))}
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
                {importing ? 'Đang nhập...' : `Xác nhận nhập ${importPreview?.valid.length || 0} điểm`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
