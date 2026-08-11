import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { assignmentsApi, classesApi, usersApi } from '@/services/dashboardApi';
import type {
  AssignmentEntity,
  AssignmentStatus,
  AssignmentType,
  ClassEntity,
  CreateAssignmentRequest,
  SimulationValidateResponse,
  UpdateAssignmentRequest,
} from '@/services/dashboardApi';
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
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { AssignmentCard } from '@/components/Dashboard/AssignmentCard';
import { AssignmentTypeSelector } from '@/components/Dashboard/AssignmentTypeSelector';
import { AssignmentTypeBadge } from '@/components/Dashboard/AssignmentTypeBadge';
import { QuizBuilder } from '@/components/Dashboard/QuizBuilder';
import { ReportAssignmentForm } from '@/components/Dashboard/ReportAssignmentForm';
import { SimulationAssignmentForm } from '@/components/Dashboard/SimulationAssignmentForm';
import type { AssignmentClassOption } from '@/components/Dashboard/AssignmentFormFields';

type AssignmentFilter = 'all' | 'quiz' | 'text_report' | 'practical_simulation' | 'submitted';
type AssignmentFormMode = 'create' | 'create_quiz' | 'create_report' | 'create_simulation' | 'edit';
type ManagedClassOption = {
  id: number;
  classCode?: string;
  name?: string;
  courseName?: string;
  studentCount?: number;
};

const filterOptions: Array<{ id: AssignmentFilter; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'text_report', label: 'Báo cáo' },
  { id: 'practical_simulation', label: 'Thực hành mô phỏng' },
  { id: 'submitted', label: 'Có bài nộp' },
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

function toAssignmentClassOption(classItem: ManagedClassOption): AssignmentClassOption {
  return {
    id: classItem.id,
    label: getClassLabel(classItem),
  };
}

function getAssignmentType(assignment: AssignmentEntity): AssignmentType {
  return assignment.assignment_type ?? assignment.assignmentType ?? 'text_report';
}

function normalizeAssignmentStatus(status?: string): AssignmentStatus {
  if (status === 'draft' || status === 'published' || status === 'closed') {
    return status;
  }

  return 'published';
}

function buildUpdateAssignmentRequest(
  assignment: AssignmentEntity,
  classId: number,
  title: string
): UpdateAssignmentRequest {
  const assignmentType = getAssignmentType(assignment);
  const baseRequest: UpdateAssignmentRequest = {
    classId,
    title,
    description: assignment.description ?? '',
    assignmentType,
    dueDate: assignment.dueDate ?? null,
    maxScore: assignment.maxScore || 100,
    rubricId: assignment.rubricId ?? null,
    allowResubmit: assignment.allowResubmit ?? false,
    resubmitLimit: assignment.resubmitLimit ?? null,
    status: normalizeAssignmentStatus(assignment.status),
  };

  if (assignmentType === 'quiz') {
    return {
      ...baseRequest,
      quizDetail: {
        questions: assignment.quizDetail?.questions ?? [],
        timeLimitSeconds: assignment.quizDetail?.timeLimitSeconds ?? null,
        shuffleQuestions: assignment.quizDetail?.shuffleQuestions ?? false,
      },
    };
  }

  if (assignmentType === 'practical_simulation') {
    return {
      ...baseRequest,
      simulationDetail: {
        environmentSource: assignment.simulationDetail?.environmentSource ?? 'internal_sandbox',
        baseDiagram: assignment.simulationDetail?.baseDiagram ?? {},
        allowedComponentTypes: assignment.simulationDetail?.allowedComponentTypes ?? [],
        studentInputMode:
          assignment.simulationDetail?.studentInputMode === 'code_only'
            ? 'code_only'
            : 'circuit_build',
        starterCode: assignment.simulationDetail?.starterCode ?? null,
        answerKey: assignment.simulationDetail?.answerKey ?? {},
        autoGradingEnabled: assignment.simulationDetail?.autoGradingEnabled ?? false,
        autoGradingWeight: assignment.simulationDetail?.autoGradingWeight ?? 0,
      },
    };
  }

  return {
    ...baseRequest,
    reportDetail: {
      instructions: assignment.reportDetail?.instructions ?? assignment.description ?? '',
      allowedSubmissionTypes: assignment.reportDetail?.allowedSubmissionTypes?.length
        ? assignment.reportDetail.allowedSubmissionTypes
        : ['file'],
      allowedFileExtensions: assignment.reportDetail?.allowedFileExtensions ?? [],
      maxFileSizeMb: assignment.reportDetail?.maxFileSizeMb ?? 50,
    },
  };
}

function formatJson(value: unknown) {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return '{}';
  }
}

function parseJsonText(value: string) {
  try {
    return {
      data: JSON.parse(value || '{}') as unknown,
      error: null,
    };
  } catch {
    return {
      data: null,
      error: 'JSON chưa đúng định dạng.',
    };
  }
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
  const [detailAssignment, setDetailAssignment] = useState<AssignmentEntity | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [simulationBaseDiagram, setSimulationBaseDiagram] = useState<unknown>(null);
  const [simulationCircuitText, setSimulationCircuitText] = useState('');
  const [simulationValidateResult, setSimulationValidateResult] =
    useState<SimulationValidateResponse | null>(null);
  const [simulationValidateError, setSimulationValidateError] = useState<string | null>(null);
  const [isValidatingSimulation, setIsValidatingSimulation] = useState(false);

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
          : await classesApi.getAll({ pageNumber: 1, pageSize: 100 });

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
      if (filter === 'quiz') return assignment.assignment_type === 'quiz';
      if (filter === 'text_report') return assignment.assignment_type === 'text_report';
      if (filter === 'practical_simulation') return assignment.assignment_type === 'practical_simulation';
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

  const assignmentClassOptions = useMemo(
    () => selectableClasses.map(toAssignmentClassOption),
    [selectableClasses]
  );

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

  const handleCreateAssignment = async (request: CreateAssignmentRequest) => {
    setIsSaving(true);
    setFormError(null);

    try {
      await assignmentsApi.create(request);
      closeForm();
      await fetchAssignments(searchQuery);
    } catch (err) {
      setFormError(getErrorMessage(err, 'Không tạo được bài tập.'));
    } finally {
      setIsSaving(false);
    }
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
        await assignmentsApi.update(
          editingAssignment.id,
          buildUpdateAssignmentRequest(editingAssignment, classId, title)
        );
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

  const openAssignmentDetails = async (assignment: AssignmentEntity) => {
    setDetailAssignment(assignment);
    setDetailError(null);
    setSimulationBaseDiagram(null);
    setSimulationCircuitText('');
    setSimulationValidateResult(null);
    setSimulationValidateError(null);
    setIsDetailLoading(true);

    try {
      const detail = await assignmentsApi.getById(assignment.id);
      setDetailAssignment(detail);

      if (getAssignmentType(detail) === 'practical_simulation') {
        const baseDiagram = await assignmentsApi.getSimulationBaseDiagram(detail.id);
        setSimulationBaseDiagram(baseDiagram);
        setSimulationCircuitText(formatJson(baseDiagram));
      }
    } catch (err) {
      setDetailError(getErrorMessage(err, 'Không tải được chi tiết bài tập.'));
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeAssignmentDetails = () => {
    setDetailAssignment(null);
    setDetailError(null);
    setSimulationBaseDiagram(null);
    setSimulationCircuitText('');
    setSimulationValidateResult(null);
    setSimulationValidateError(null);
  };

  const handleValidateSimulation = async () => {
    if (!detailAssignment) return;

    const parsedCircuit = parseJsonText(simulationCircuitText);
    if (parsedCircuit.error) {
      setSimulationValidateError(parsedCircuit.error);
      setSimulationValidateResult(null);
      return;
    }

    setIsValidatingSimulation(true);
    setSimulationValidateError(null);
    setSimulationValidateResult(null);

    try {
      const response = await assignmentsApi.validateSimulationCircuit(
        detailAssignment.id,
        parsedCircuit.data
      );
      setSimulationValidateResult(response);
    } catch (err) {
      setSimulationValidateError(getErrorMessage(err, 'Không kiểm tra được mạch mô phỏng.'));
    } finally {
      setIsValidatingSimulation(false);
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

  const detailAssignmentType = detailAssignment ? getAssignmentType(detailAssignment) : null;
  const detailQuizQuestions = Array.isArray(detailAssignment?.quizDetail?.questions)
    ? detailAssignment.quizDetail.questions
    : [];
  const detailSubmissionTypes =
    detailAssignment?.reportDetail?.allowedSubmissionTypes?.join(', ') || 'Chưa cấu hình';
  const detailFileExtensions =
    detailAssignment?.reportDetail?.allowedFileExtensions?.join(', ') || 'Không giới hạn';

  // AssignmentCard was extracted

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {canManageAssignments ? 'Quản lý bài tập' : 'Bài tập của tôi'}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {canManageAssignments
                ? 'Theo dõi bài tập đã giao, bài nộp và tiêu chí đánh giá.'
                : 'Theo dõi các bài tập được giao trong lớp học của bạn.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => fetchAssignments(searchQuery)}
            disabled={isLoading}
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            Làm mới
          </Button>
          {canManageAssignments && (
            <Button
              type="button"
              onClick={openCreateForm}
              className="bg-indigo-500 hover:bg-indigo-600 text-white border-0"
            >
              <Plus className="w-4 h-4" />
              Tạo bài tập mới
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full md:w-auto gap-1 overflow-x-auto no-scrollbar">
          {filterOptions.map((option) => (
            <Button
              key={option.id}
              type="button"
              variant={filter === option.id ? 'outline' : 'ghost'}
              size="sm"
              onClick={() => setFilter(option.id)}
              className={cn(
                'shrink-0',
                filter === option.id
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/10 hover:text-indigo-400'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <div className="flex w-full md:w-auto items-center gap-3">
          <div className="text-sm font-medium text-muted-foreground hidden md:flex items-center gap-2 shrink-0">
            <BarChart3 className="w-4 h-4" />
            {filteredAssignments.length}/{totalCount} bài tập
          </div>
          <div className="w-full md:w-72 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Tìm kiếm bài tập..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="bg-card rounded-xl border border-border p-6 animate-pulse"
            >
              <div className="h-6 w-28 bg-muted rounded-full mb-5" />
              <div className="h-5 w-4/5 bg-muted rounded mb-3" />
              <div className="h-4 w-2/3 bg-muted rounded mb-8" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-20 bg-muted rounded-lg" />
                <div className="h-20 bg-muted rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <div className="w-12 h-12 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="font-semibold text-foreground mb-2">Không tải được bài tập</p>
          <p className="text-sm text-muted-foreground mb-5">{error}</p>
          <Button type="button" variant="outline" onClick={() => fetchAssignments(searchQuery)}>
            <RefreshCw className="w-4 h-4" />
            Thử lại
          </Button>
        </div>
      )}

      {!isLoading && !error && filteredAssignments.length === 0 && (
        <div className="bg-card rounded-xl border border-border p-10 text-center">
          <div className="w-12 h-12 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <p className="font-semibold text-foreground mb-2">Chưa có bài tập phù hợp</p>
          <p className="text-sm text-muted-foreground">
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
          {filteredAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              canManageAssignments={canManageAssignments}
              onEdit={openEditForm}
              onDelete={handleDeleteAssignment}
              onOpenDetails={openAssignmentDetails}
              isDeleting={deletingId === assignment.id}
            />
          ))}
        </motion.div>
      )}

      {formMode === 'create_quiz' && (
        <QuizBuilder
          classOptions={assignmentClassOptions}
          isClassesLoading={isClassesLoading}
          classesError={classesError}
          onRetryClasses={fetchManageableClasses}
          isSaving={isSaving}
          error={formError}
          onCancel={closeForm}
          onSave={handleCreateAssignment}
        />
      )}

      {formMode && formMode !== 'create_quiz' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 overflow-y-auto overflow-x-hidden pt-20 pb-10 custom-scrollbar">
          <div className="relative w-full max-w-4xl max-h-full">
            {formMode === 'create' && (
              <div className="bg-white p-8 rounded-3xl relative">
                <button type="button" onClick={closeForm} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">×</button>
                <AssignmentTypeSelector onSelect={(type) => {
                  if (type === 'quiz') setFormMode('create_quiz');
                  else if (type === 'text_report') setFormMode('create_report');
                  else if (type === 'practical_simulation') setFormMode('create_simulation');
                }} />
              </div>
            )}

            {formMode === 'create_report' && (
              <div className="bg-white p-8 rounded-3xl relative">
                <ReportAssignmentForm
                  classOptions={assignmentClassOptions}
                  isClassesLoading={isClassesLoading}
                  classesError={classesError}
                  onRetryClasses={fetchManageableClasses}
                  isSaving={isSaving}
                  error={formError}
                  onCancel={closeForm}
                  onSave={handleCreateAssignment}
                />
              </div>
            )}

            {formMode === 'create_simulation' && (
              <div className="bg-white p-8 rounded-3xl relative">
                <SimulationAssignmentForm
                  classOptions={assignmentClassOptions}
                  isClassesLoading={isClassesLoading}
                  classesError={classesError}
                  onRetryClasses={fetchManageableClasses}
                  isSaving={isSaving}
                  error={formError}
                  onCancel={closeForm}
                  onSave={handleCreateAssignment}
                />
              </div>
            )}

            {formMode === 'edit' && (
              <form
                onSubmit={handleSaveAssignment}
                className="w-full max-w-md mx-auto rounded-2xl bg-white border border-border shadow-xl p-6"
              >
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-[#0f4c5c]">
                      Cập nhật bài tập
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
                    Lưu thay đổi
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {detailAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 overflow-y-auto overflow-x-hidden pt-20 pb-10 custom-scrollbar">
          <div className="w-full max-w-4xl rounded-3xl bg-white border border-border shadow-xl overflow-hidden">
            <div className="flex items-start justify-between gap-4 border-b border-border p-6">
              <div className="space-y-3">
                <AssignmentTypeBadge type={detailAssignmentType ?? undefined} />
                <div>
                  <h2 className="text-2xl font-bold text-[#0f4c5c]">
                    {detailAssignment.title}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {detailAssignment.classCode || `Lớp #${detailAssignment.classId}`} ·{' '}
                    {detailAssignment.courseTitle || 'Chưa có khóa học'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeAssignmentDetails}
                className="text-2xl leading-none text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {isDetailLoading && (
                <div className="flex items-center justify-center gap-3 rounded-2xl bg-slate-50 p-8 text-slate-600">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Đang tải chi tiết bài tập...
                </div>
              )}

              {!isDetailLoading && detailError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-red-700">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertCircle className="w-5 h-5" />
                    Không tải được chi tiết
                  </div>
                  <p className="text-sm mt-2">{detailError}</p>
                </div>
              )}

              {!isDetailLoading && !detailError && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                      <p className="text-xs text-slate-500 mb-1">Trạng thái</p>
                      <p className="font-bold text-[#0f4c5c]">{detailAssignment.status}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                      <p className="text-xs text-slate-500 mb-1">Hạn nộp</p>
                      <p className="font-bold text-[#0f4c5c]">
                        {formatDate(detailAssignment.dueDate ?? undefined)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                      <p className="text-xs text-slate-500 mb-1">Điểm tối đa</p>
                      <p className="font-bold text-[#0f4c5c]">{detailAssignment.maxScore}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                      <p className="text-xs text-slate-500 mb-1">Bài nộp</p>
                      <p className="font-bold text-[#0f4c5c]">
                        {detailAssignment.submissionCount}
                      </p>
                    </div>
                  </div>

                  {detailAssignment.description && (
                    <div className="rounded-2xl border border-slate-100 bg-white p-5">
                      <h3 className="font-bold text-slate-800 mb-2">Mô tả</h3>
                      <p className="text-sm text-slate-600 whitespace-pre-line">
                        {detailAssignment.description}
                      </p>
                    </div>
                  )}

                  {detailAssignmentType === 'quiz' && (
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
                      <h3 className="font-bold text-blue-900 mb-3">Cấu hình Quiz</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="rounded-xl bg-white border border-blue-100 p-3">
                          <p className="text-blue-500 mb-1">Số câu hỏi</p>
                          <p className="font-bold text-blue-900">{detailQuizQuestions.length}</p>
                        </div>
                        <div className="rounded-xl bg-white border border-blue-100 p-3">
                          <p className="text-blue-500 mb-1">Thời gian</p>
                          <p className="font-bold text-blue-900">
                            {detailAssignment.quizDetail?.timeLimitSeconds
                              ? `${Math.round(
                                  (detailAssignment.quizDetail?.timeLimitSeconds ?? 0) / 60
                                )} phút`
                              : 'Không giới hạn'}
                          </p>
                        </div>
                        <div className="rounded-xl bg-white border border-blue-100 p-3">
                          <p className="text-blue-500 mb-1">Xáo trộn</p>
                          <p className="font-bold text-blue-900">
                            {detailAssignment.quizDetail?.shuffleQuestions ? 'Bật' : 'Tắt'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {detailAssignmentType === 'text_report' && (
                    <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-5">
                      <h3 className="font-bold text-orange-900 mb-3">Cấu hình Báo cáo</h3>
                      <div className="space-y-3 text-sm text-orange-950">
                        <p>
                          <span className="font-semibold">Hình thức nộp:</span>{' '}
                          {detailSubmissionTypes}
                        </p>
                        <p>
                          <span className="font-semibold">Định dạng file:</span>{' '}
                          {detailFileExtensions}
                        </p>
                        <p>
                          <span className="font-semibold">Dung lượng tối đa:</span>{' '}
                          {detailAssignment.reportDetail?.maxFileSizeMb ?? 50} MB
                        </p>
                      </div>
                    </div>
                  )}

                  {detailAssignmentType === 'practical_simulation' && (
                    <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-5 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-purple-950">Cấu hình mô phỏng</h3>
                          <p className="text-sm text-purple-700">
                            Chế độ:{' '}
                            {detailAssignment.simulationDetail?.studentInputMode === 'code_only'
                              ? 'Chỉ viết code'
                              : 'Tự lắp mạch'}
                          </p>
                        </div>
                        <div className="rounded-xl bg-white border border-purple-100 px-4 py-3 text-sm text-purple-900">
                          Auto-grade:{' '}
                          <span className="font-bold">
                            {detailAssignment.simulationDetail?.autoGradingEnabled
                              ? `${Math.round(
                                  (detailAssignment.simulationDetail?.autoGradingWeight ?? 0) *
                                    100
                                )}%`
                              : 'Tắt'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <label className="block">
                          <span className="text-sm font-semibold text-purple-950">
                            Base diagram từ API
                          </span>
                          <textarea
                            readOnly
                            value={formatJson(simulationBaseDiagram)}
                            className="mt-2 h-64 w-full rounded-xl border border-purple-100 bg-slate-950 px-4 py-3 font-mono text-xs text-slate-100 outline-none"
                          />
                        </label>

                        <label className="block">
                          <span className="text-sm font-semibold text-purple-950">
                            Circuit JSON để kiểm tra
                          </span>
                          <textarea
                            value={simulationCircuitText}
                            onChange={(event) => setSimulationCircuitText(event.target.value)}
                            spellCheck={false}
                            className="mt-2 h-64 w-full rounded-xl border border-purple-100 bg-white px-4 py-3 font-mono text-xs text-slate-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                          />
                        </label>
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <Button
                          type="button"
                          onClick={handleValidateSimulation}
                          disabled={isValidatingSimulation}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {isValidatingSimulation && (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          )}
                          Kiểm tra mạch
                        </Button>

                        {simulationValidateResult && (
                          <div
                            className={cn(
                              'flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold',
                              simulationValidateResult.isValid
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-red-50 text-red-700'
                            )}
                          >
                            {simulationValidateResult.isValid ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <AlertCircle className="w-5 h-5" />
                            )}
                            {simulationValidateResult.message}
                          </div>
                        )}
                      </div>

                      {simulationValidateError && (
                        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                          {simulationValidateError}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
