import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { assignmentsApi, classesApi, usersApi } from '@/services/dashboardApi';
import type { AssignmentEntity, ClassEntity } from '@/services/dashboardApi';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  Plus,
  RefreshCw,
  School,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type AssignmentFilter = 'all' | 'submitted' | 'rubric';
type AssignmentFormMode = 'create' | 'edit';
type ManagedClassOption = {
  id: number;
  classCode?: string;
  name?: string;
  courseName?: string;
  studentCount?: number;
};

const filterOptions: Array<{ id: AssignmentFilter; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'submitted', label: 'Có bài nộp' },
  { id: 'rubric', label: 'Có tiêu chí' },
];

function formatDate(value?: string) {
  if (!value) return 'Chưa có';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa có';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'response' in error) {
    const data = (error as { response?: { data?: { message?: string; error?: string } } })
      .response?.data;
    return data?.message ?? data?.error ?? fallback;
  }

  return fallback;
}

function toPositiveNumber(value: unknown) {
  const numberValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
}

function getIdentityId(source?: Record<string, unknown> | null) {
  if (!source) return null;

  return (
    toPositiveNumber(source.id) ??
    toPositiveNumber(source.Id) ??
    toPositiveNumber(source.userId) ??
    toPositiveNumber(source.UserId) ??
    toPositiveNumber(source.teacherId) ??
    toPositiveNumber(source.TeacherId) ??
    toPositiveNumber(source.sub) ??
    toPositiveNumber(source.nameid) ??
    toPositiveNumber(
      source['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
    )
  );
}

function parseJwtPayload(token?: string | null) {
  if (!token) return null;

  const payload = token.split('.')[1];
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '='
    );
    const decoded = globalThis.atob(padded);
    const json = decodeURIComponent(
      Array.from(decoded)
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    );

    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function toClassOption(classEntity: ClassEntity): ManagedClassOption {
  return {
    id: classEntity.id,
    classCode: classEntity.classCode,
    name: classEntity.name,
    courseName: classEntity.courseName,
    studentCount: classEntity.studentCount,
  };
}

function getClassLabel(classItem: ManagedClassOption) {
  const className = classItem.classCode || classItem.name || `Lớp #${classItem.id}`;
  const courseName = classItem.courseName ? ` - ${classItem.courseName}` : '';
  const studentCount =
    typeof classItem.studentCount === 'number' ? ` (${classItem.studentCount} HS)` : '';

  return `${className}${courseName}${studentCount}`;
}

export const AssignmentsPage = () => {
  const { user, token, updateUser } = useAuthStore();
  const canManageAssignments = user?.role === 'teacher' || user?.role === 'school_admin';

  const [assignments, setAssignments] = useState<AssignmentEntity[]>([]);
  const [managedClasses, setManagedClasses] = useState<ManagedClassOption[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState<AssignmentFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClassesLoading, setIsClassesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classesError, setClassesError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<AssignmentFormMode | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentEntity | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formClassId, setFormClassId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchAssignments = useCallback(async (searchTerm: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await assignmentsApi.getAll({
        searchTerm: searchTerm.trim() || undefined,
      });

      setAssignments(response.items);
      setTotalCount(response.total);
    } catch (err) {
      setAssignments([]);
      setTotalCount(0);
      setError(getErrorMessage(err, 'Không tải được danh sách bài tập.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resolveUserId = useCallback(async () => {
    const storeUserId = getIdentityId(user as unknown as Record<string, unknown> | null);

    if (storeUserId) {
      return storeUserId;
    }

    const tokenUserId = getIdentityId(parseJwtPayload(token));

    if (tokenUserId) {
      updateUser({ id: tokenUserId });
      return tokenUserId;
    }

    const profile = await usersApi.getProfile();
    const profileRecord = profile as typeof profile & Record<string, unknown>;
    const profileUserId = getIdentityId(profileRecord);

    if (!profileUserId) {
      throw new Error('Missing user id');
    }

    updateUser({
      id: profileUserId,
      email: profile.email,
      fullName: profile.fullName,
      avatar: profile.avatar,
      schoolId: profile.schoolId,
      createdAt: profile.createdAt,
    });

    return profileUserId;
  }, [token, updateUser, user]);

  const fetchManageableClasses = useCallback(async () => {
    if (!canManageAssignments) return;

    setIsClassesLoading(true);
    setClassesError(null);

    try {
      const response =
        user?.role === 'teacher'
          ? await classesApi.getMyClasses(await resolveUserId())
          : await classesApi.getAll({ page: 1, pageSize: 100 });

      setManagedClasses((response.items ?? []).map(toClassOption));
    } catch (err) {
      setManagedClasses([]);
      setClassesError(getErrorMessage(err, 'Không tải được danh sách lớp học.'));
    } finally {
      setIsClassesLoading(false);
    }
  }, [canManageAssignments, resolveUserId, user?.role]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchAssignments(searchQuery);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [fetchAssignments, searchQuery]);

  useEffect(() => {
    if (formMode && canManageAssignments) {
      fetchManageableClasses();
    }
  }, [canManageAssignments, fetchManageableClasses, formMode]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      if (filter === 'submitted') return assignment.submissionCount > 0;
      if (filter === 'rubric') return assignment.metricCount > 0;
      return true;
    });
  }, [assignments, filter]);

  const selectableClasses = useMemo(() => {
    if (
      !editingAssignment ||
      managedClasses.some((classItem) => classItem.id === editingAssignment.classId)
    ) {
      return managedClasses;
    }

    return [
      {
        id: editingAssignment.classId,
        classCode: editingAssignment.classCode,
        name: editingAssignment.classCode || `Lớp #${editingAssignment.classId}`,
        courseName: editingAssignment.courseTitle,
        studentCount: undefined,
      },
      ...managedClasses,
    ];
  }, [editingAssignment, managedClasses]);

  const openCreateForm = () => {
    setFormMode('create');
    setEditingAssignment(null);
    setFormTitle('');
    setFormClassId('');
    setFormError(null);
    setClassesError(null);
  };

  const openEditForm = (assignment: AssignmentEntity) => {
    setFormMode('edit');
    setEditingAssignment(assignment);
    setFormTitle(assignment.title);
    setFormClassId(String(assignment.classId));
    setFormError(null);
    setClassesError(null);
  };

  const closeForm = () => {
    setFormMode(null);
    setEditingAssignment(null);
    setFormTitle('');
    setFormClassId('');
    setFormError(null);
  };

  const handleSaveAssignment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const classId = Number(formClassId);
    const title = formTitle.trim();

    if (!Number.isFinite(classId) || classId <= 0) {
      setFormError('Vui lòng chọn lớp học.');
      return;
    }

    if (!title) {
      setFormError('Vui lòng nhập tiêu đề bài tập.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      if (formMode === 'edit' && editingAssignment) {
        await assignmentsApi.update(editingAssignment.id, { classId, title });
      } else {
        await assignmentsApi.create({ classId, title });
      }

      closeForm();
      await fetchAssignments(searchQuery);
    } catch (err) {
      setFormError(getErrorMessage(err, 'Không lưu được bài tập.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAssignment = async (assignment: AssignmentEntity) => {
    const confirmed = window.confirm(`Xóa bài tập "${assignment.title}"?`);
    if (!confirmed) return;

    setDeletingId(assignment.id);
    setError(null);

    try {
      await assignmentsApi.delete(assignment.id);
      await fetchAssignments(searchQuery);
    } catch (err) {
      setError(getErrorMessage(err, 'Không xóa được bài tập.'));
    } finally {
      setDeletingId(null);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const renderAssignmentCard = (assignment: AssignmentEntity) => {
    const hasSubmissions = assignment.submissionCount > 0;

    return (
      <motion.div
        key={assignment.id}
        variants={itemVariants}
        className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-cyan-50 text-cyan-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
              {assignment.courseTitle || 'Bài tập'}
            </div>
            {canManageAssignments && (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => openEditForm(assignment)}
                  aria-label="Sửa bài tập"
                  title="Sửa bài tập"
                >
                  <FileText className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-sm"
                  onClick={() => handleDeleteAssignment(assignment)}
                  disabled={deletingId === assignment.id}
                  aria-label="Xóa bài tập"
                  title="Xóa bài tập"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <h3 className="text-lg font-bold text-[#0f4c5c] mb-2 line-clamp-2 group-hover:text-cyan-600 transition-colors">
            {assignment.title}
          </h3>
          <div className="space-y-2 text-sm text-slate-500 mb-6">
            <p className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {assignment.classCode || `Lớp #${assignment.classId}`}
            </p>
            <p className="flex items-center gap-1.5">
              <School className="w-4 h-4" />
              {assignment.schoolName || 'Chưa có trường'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
              <p className="text-xs text-slate-500 mb-1">Bài nộp</p>
              <p className="text-2xl font-bold text-[#0f4c5c]">
                {assignment.submissionCount}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
              <p className="text-xs text-slate-500 mb-1">Tiêu chí</p>
              <p className="text-2xl font-bold text-[#0f4c5c]">
                {assignment.metricCount}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span>
                Cập nhật:{' '}
                <span className="font-semibold">{formatDate(assignment.updatedAt)}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50/50 border-t border-border flex justify-between items-center">
          <div className="text-sm">
            {hasSubmissions ? (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Có bài nộp
              </span>
            ) : (
              <span className="text-amber-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> Chưa có bài nộp
              </span>
            )}
          </div>
          <Button
            type="button"
            className="bg-[#0f4c5c] hover:bg-[#0a3540] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1 h-auto"
          >
            {canManageAssignments ? 'Chấm bài' : 'Xem chi tiết'}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-6 md:p-8 rounded-3xl border border-border shadow-sm">
        <div>
          <div className="w-12 h-12 bg-cyan-50 rounded-2xl flex items-center justify-center mb-4">
            <ClipboardList className="w-6 h-6 text-cyan-600" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0f4c5c] mb-2">
            {canManageAssignments ? 'Quản lý bài tập' : 'Bài tập của tôi'}
          </h1>
          <p className="text-muted-foreground">
            {canManageAssignments
              ? 'Theo dõi bài tập đã giao, bài nộp và tiêu chí đánh giá.'
              : 'Theo dõi các bài tập được giao trong lớp học của bạn.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => fetchAssignments(searchQuery)}
            disabled={isLoading}
            className="rounded-2xl"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            Làm mới
          </Button>
          {canManageAssignments && (
            <Button
              type="button"
              onClick={openCreateForm}
              className="bg-gradient-to-r from-[#0f4c5c] to-[#1a667b] hover:from-[#0a3540] hover:to-[#0f4c5c] text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2 transform hover:-translate-y-0.5 h-auto"
            >
              <Plus className="w-5 h-5" />
              Tạo bài tập mới
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-2 rounded-2xl border border-border shadow-sm">
        <div className="flex w-full md:w-auto p-1 bg-slate-50 rounded-xl overflow-x-auto hide-scrollbar">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              className={cn(
                'px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap',
                filter === option.id
                  ? 'bg-white text-[#0f4c5c] shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex w-full md:w-auto items-center gap-3">
          <div className="text-sm font-medium text-slate-500 hidden md:flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            {filteredAssignments.length}/{totalCount} bài tập
          </div>
          <div className="w-full md:w-72 relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400 group-focus-within:text-[#0f4c5c] transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm bài tập..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f4c5c]/20 focus:border-[#0f4c5c] transition-all bg-slate-50 focus:bg-white text-sm"
            />
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="bg-white rounded-3xl border border-border shadow-sm p-6 animate-pulse"
            >
              <div className="h-6 w-28 bg-slate-100 rounded-full mb-5" />
              <div className="h-5 w-4/5 bg-slate-100 rounded mb-3" />
              <div className="h-4 w-2/3 bg-slate-100 rounded mb-8" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-20 bg-slate-100 rounded-2xl" />
                <div className="h-20 bg-slate-100 rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div className="bg-white rounded-3xl border border-red-100 p-8 shadow-sm text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="font-semibold text-[#0f4c5c] mb-2">Không tải được bài tập</p>
          <p className="text-sm text-slate-500 mb-5">{error}</p>
          <Button type="button" onClick={() => fetchAssignments(searchQuery)}>
            <RefreshCw className="w-4 h-4" />
            Thử lại
          </Button>
        </div>
      )}

      {!isLoading && !error && filteredAssignments.length === 0 && (
        <div className="bg-white rounded-3xl border border-border p-10 shadow-sm text-center">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <p className="font-semibold text-[#0f4c5c] mb-2">Chưa có bài tập phù hợp</p>
          <p className="text-sm text-slate-500">
            Thay đổi bộ lọc hoặc từ khóa tìm kiếm để xem thêm kết quả.
          </p>
        </div>
      )}

      {!isLoading && !error && filteredAssignments.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredAssignments.map(renderAssignmentCard)}
        </motion.div>
      )}

      {formMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <form
            onSubmit={handleSaveAssignment}
            className="w-full max-w-md rounded-2xl bg-white border border-border shadow-xl p-6"
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#0f4c5c]">
                  {formMode === 'create' ? 'Tạo bài tập mới' : 'Cập nhật bài tập'}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Nhập đúng lớp học và tiêu đề bài tập.
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Lớp học</span>
                <select
                  value={formClassId}
                  onChange={(event) => setFormClassId(event.target.value)}
                  disabled={isClassesLoading || selectableClasses.length === 0}
                  className="mt-2 w-full rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#0f4c5c] focus:ring-2 focus:ring-[#0f4c5c]/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">
                    {isClassesLoading
                      ? 'Đang tải lớp học...'
                      : selectableClasses.length
                        ? 'Chọn lớp học'
                        : 'Chưa có lớp học'}
                  </option>
                  {selectableClasses.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {getClassLabel(classItem)}
                    </option>
                  ))}
                </select>
              </label>

              {classesError && (
                <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  <p>{classesError}</p>
                  <button
                    type="button"
                    onClick={fetchManageableClasses}
                    className="mt-2 font-semibold text-[#0f4c5c] hover:underline"
                  >
                    Tải lại danh sách lớp
                  </button>
                </div>
              )}

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Tiêu đề</span>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(event) => setFormTitle(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#0f4c5c] focus:ring-2 focus:ring-[#0f4c5c]/20"
                  placeholder="Tên bài tập"
                />
              </label>
            </div>

            {formError && (
              <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {formError}
              </p>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="outline" onClick={closeForm} disabled={isSaving}>
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isSaving || isClassesLoading || !formClassId}
              >
                {isSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
                {formMode === 'create' ? 'Tạo bài tập' : 'Lưu thay đổi'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
