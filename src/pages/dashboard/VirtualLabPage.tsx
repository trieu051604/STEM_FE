import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, BookOpen, ChevronDown, Plus, PlusCircle, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { assignmentsApi, classesApi, labsApi, usersApi } from '@/services/dashboardApi';
import { lessonsApi } from '@/services/curriculumApi';
import { schedulesApi } from '@/services/dashboardApi';
import type {
  AssignmentEntity,
  ClassEntity,
  ComponentGlueRegistryEntity,
  CreateLabRequest,
  LabEntity,
  ValidateWokwiProjectResponse,
} from '@/services/dashboardApi';
import { Button } from '@/components/ui/button';
import { LabStatsHeader } from '@/components/Dashboard/VirtualLab/LabStatsHeader';
import type { LabStats } from '@/components/Dashboard/VirtualLab/LabStatsHeader';
import { LabCard } from '@/components/Dashboard/VirtualLab/LabCard';
import {
  CreateLabModal,
  type CreateLabTemplateData,
  type LabAssignmentOption,
  type LabClassOption,
  type LabLessonOption,
} from '@/components/Dashboard/VirtualLab/CreateLabModal';
import { TemplatePickerModal } from '@/components/Dashboard/VirtualLab/TemplatePickerModal';
import type { VirtualLabSampleExercise } from '@/data/virtualLabSampleExercises';
import { TeacherPageHeader } from '@/components/Dashboard/teacher/TeacherPageHeader';
import { componentRegistryApi } from '@/services/componentRegistryApi';
import {
  isRegistryComponentPaletteEnabled,
  mergeWithExistingGlueRegistry,
  toGlueRegistryCandidates,
} from '@/services/componentRegistryPaletteAdapter';

type ManagedClassOption = {
  id: number;
  classCode?: string;
  name?: string;
  courseName?: string;
  studentCount?: number;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'response' in error) {
    const data = (error as { response?: { data?: { message?: string; error?: string } } })
      .response?.data;
    return data?.message ?? data?.error ?? fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
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

function getAssignmentType(assignment: AssignmentEntity) {
  return assignment.assignment_type ?? assignment.assignmentType ?? 'text_report';
}

function toLabClassOption(classItem: ManagedClassOption): LabClassOption {
  return {
    id: classItem.id,
    label: getClassLabel(classItem),
  };
}

function isWokwiUrl(value: string) {
  return /^https?:\/\//i.test(value) || value.includes('wokwi.com');
}

// /api/labs (LIVE) trả sẵn `stats` (studentCount/startedCount/completedCount/
// averageDurationSeconds) nhúng trong từng lab của response GET /api/labs — không cần gọi
// thêm /labs/{id}/stats cho từng lab (N+1). `classes` (đối số 2) chỉ dùng làm phương án dự
// phòng nếu 1 lab nào đó thiếu stats.studentCount thật.
function buildStats(labs: LabEntity[]): LabStats {
  const activeLabs = labs.filter((lab) => lab.status === 'published').length;
  const totalStudents = labs.reduce(
    (total, lab) => total + (lab.stats?.studentCount ?? 0),
    0
  );
  const startedCount = labs.reduce(
    (total, lab) => total + (lab.stats?.startedCount ?? 0),
    0
  );
  const completedCount = labs.reduce(
    (total, lab) => total + (lab.stats?.completedCount ?? 0),
    0
  );
  const completionRate = startedCount ? Math.round((completedCount / startedCount) * 100) : null;
  const averageDurations = labs
    .map((lab) => lab.stats?.averageDurationSeconds)
    .filter((value): value is number => typeof value === 'number' && value > 0);
  const avgTimeMins = averageDurations.length
    ? Math.round(
        averageDurations.reduce((total, value) => total + value, 0) /
          averageDurations.length /
          60
      )
    : null;

  return {
    activeLabs,
    totalStudents,
    completionRate,
    avgTimeMins,
  };
}

export const VirtualLabPage = () => {
  const { token, user } = useAuthStore();
  const [labs, setLabs] = useState<LabEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<LabEntity | null>(null);
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<VirtualLabSampleExercise | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [managedClasses, setManagedClasses] = useState<ManagedClassOption[]>([]);
  const [assignmentOptions, setAssignmentOptions] = useState<LabAssignmentOption[]>([]);
  const [lessonOptions, setLessonOptions] = useState<LabLessonOption[]>([]);
  const [scheduleOptions, setScheduleOptions] = useState<LabLessonOption[]>([]);
  const [componentOptions, setComponentOptions] = useState<ComponentGlueRegistryEntity[]>([]);
  const [isMetaLoading, setIsMetaLoading] = useState(false);
  const [isComponentsLoading, setIsComponentsLoading] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [componentsError, setComponentsError] = useState<string | null>(null);

  const canManageLabs = user?.role === 'teacher' || user?.role === 'school_admin';
  const [teacherFilterId, setTeacherFilterId] = useState<number | null>(null);

  const resolveUserId = useCallback(async () => {
    const storeUserId = getIdentityId(user as unknown as Record<string, unknown> | null);
    const tokenUserId = getIdentityId(parseJwtPayload(token));

    if (storeUserId) return storeUserId;
    if (tokenUserId) return tokenUserId;

    const profile = await usersApi.getProfile();
    return getIdentityId(profile as unknown as Record<string, unknown>);
  }, [token, user]);

  const fetchLabs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await labsApi.getAll({ pageNumber: 1, pageSize: 100 });

      setLabs(response.items);
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Không tải được danh sách phòng lab.'));
      setLabs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Chỉ lọc theo giáo viên khi response THẬT SỰ có field định danh người tạo (createdById) —
  // nếu không có, hiển thị toàn bộ thay vì làm danh sách rỗng giả.
  useEffect(() => {
    let cancelled = false;

    if (user?.role !== 'teacher') {
      setTeacherFilterId(null);
      return;
    }

    void resolveUserId().then((id) => {
      if (!cancelled) setTeacherFilterId(id);
    });

    return () => {
      cancelled = true;
    };
  }, [user?.role, resolveUserId]);

  const teacherFilteredLabs = useMemo(() => {
    if (!teacherFilterId) return labs;

    const hasCreatorField = labs.some((lab) => toPositiveNumber(lab.createdById));
    if (!hasCreatorField) return labs;

    return labs.filter((lab) => lab.createdById === teacherFilterId);
  }, [labs, teacherFilterId]);

  const visibleLabs = teacherFilteredLabs;

  const aggregateStats = useMemo(
    () => buildStats(teacherFilteredLabs),
    [teacherFilteredLabs]
  );

  const fetchMetadata = useCallback(async () => {
    if (!canManageLabs) return;

    setIsMetaLoading(true);
    setMetaError(null);

    try {
      const teacherId = user?.role === 'teacher' ? await resolveUserId() : null;

      if (user?.role === 'teacher' && !teacherId) {
        throw new Error('Không xác định được tài khoản giáo viên để tải danh sách lớp.');
      }

      const classResponse =
        user?.role === 'teacher' && teacherId
          ? await classesApi.getMyClasses()
          : await classesApi.getAll({ pageNumber: 1, pageSize: 100 });
      const classes = classResponse.items.map(toClassOption);
      setManagedClasses(classes);

      const assignmentsResponse = await assignmentsApi.getAll({
        pageNumber: 1,
        pageSize: 100,
      });
      const allowedClassIds = new Set(classes.map((classItem) => classItem.id));
      const options = assignmentsResponse.items
        .filter((assignment) => {
          const type = getAssignmentType(assignment);
          const classAllowed =
            user?.role === 'teacher' ? allowedClassIds.has(assignment.classId) : true;
          return classAllowed && (type === 'quiz' || type === 'text_report');
        })
        .map((assignment) => ({
          id: assignment.id,
          label: `${assignment.title} - ${assignment.classCode || `Lớp #${assignment.classId}`}`,
          classId: assignment.classId,
        }));

      setAssignmentOptions(options);

      // Fetch schedules for each class
      const allSchedules: LabLessonOption[] = [];
      for (const classItem of classes) {
        try {
          const schedules = await schedulesApi.getByClass(classItem.id);
          for (const schedule of schedules) {
            if (!allSchedules.some(s => s.id === schedule.id)) {
              const date = new Date(schedule.startTime).toLocaleDateString('vi-VN');
              allSchedules.push({
                id: schedule.id,
                label: `${schedule.lessonTitle || `Buổi #${schedule.id}`} - ${classItem.name || classItem.classCode || `Lớp #${classItem.id}`} (${date})`,
              });
            }
          }
        } catch {
          // Skip if schedules can't be fetched for this class
        }
      }
      setScheduleOptions(allSchedules);
    } catch (metadataError) {
      setMetaError(
        getErrorMessage(
          metadataError,
          'Không tải được lớp hoặc bài đánh giá để cấu hình phòng lab.'
        )
      );
      setManagedClasses([]);
      setAssignmentOptions([]);
      setScheduleOptions([]);
    } finally {
      setIsMetaLoading(false);
    }
  }, [canManageLabs, resolveUserId, user?.role]);

  const fetchComponentRegistry = useCallback(async () => {
    if (!canManageLabs) return;

    setIsComponentsLoading(true);
    setComponentsError(null);

    try {
      const registry = await labsApi.getComponentGlueRegistry(true);

      if (isRegistryComponentPaletteEnabled()) {
        try {
          const registryComponents = await componentRegistryApi.list();
          setComponentOptions(
            mergeWithExistingGlueRegistry(registry, toGlueRegistryCandidates(registryComponents))
          );
        } catch {
          // Registry bridge failing must never break the existing palette —
          // fall back to the baseline glue registry unchanged.
          setComponentOptions(registry);
        }
      } else {
        setComponentOptions(registry);
      }
    } catch (componentError) {
      setComponentsError(
        getErrorMessage(componentError, 'Không tải được registry linh kiện sandbox.')
      );
      setComponentOptions([]);
    } finally {
      setIsComponentsLoading(false);
    }
  }, [canManageLabs]);

  useEffect(() => {
    void fetchLabs();
  }, [fetchLabs]);

  useEffect(() => {
    void fetchMetadata();
  }, [fetchMetadata]);

  useEffect(() => {
    void fetchComponentRegistry();
  }, [fetchComponentRegistry]);

  const classOptions = useMemo(
    () => managedClasses.map(toLabClassOption),
    [managedClasses]
  );

  const validateWokwiProject = useCallback(
    (value: string): Promise<ValidateWokwiProjectResponse> => {
      const trimmed = value.trim();
      const isUrl = isWokwiUrl(trimmed);

      return labsApi.validateWokwiProject({
        wokwiProjectId: isUrl ? null : trimmed,
        wokwiProjectUrl: isUrl ? trimmed : null,
      });
    },
    []
  );

  const openCreateModal = () => {
    setEditingLab(null);
    setSelectedTemplate(null);
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (lab: LabEntity) => {
    setEditingLab(lab);
    setSelectedTemplate(null);
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const handleSelectTemplate = (exercise: VirtualLabSampleExercise) => {
    setEditingLab(null);
    setSelectedTemplate(exercise);
    setFormError(null);
    setIsTemplatePickerOpen(false);
    setIsCreateModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsCreateModalOpen(false);
    setEditingLab(null);
    setSelectedTemplate(null);
    setFormError(null);
  };

  const templateData: CreateLabTemplateData | null = selectedTemplate
    ? {
        title: selectedTemplate.title,
        description: selectedTemplate.description,
        category: selectedTemplate.category,
        starterCode: selectedTemplate.starterCode,
        circuitConfig: selectedTemplate.circuitConfig,
      }
    : null;

  const handleSaveLab = async (data: CreateLabRequest, lab?: LabEntity) => {
    setIsSaving(true);
    setFormError(null);

    try {
      if (lab) {
        await labsApi.update(lab.id, data);
      } else {
        await labsApi.create(data);
      }

      setIsCreateModalOpen(false);
      setEditingLab(null);
      await fetchLabs();
    } catch (saveError) {
      setFormError(getErrorMessage(saveError, 'Không lưu được phòng lab.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLab = async (lab: LabEntity) => {
    const confirmed = window.confirm(`Xóa phòng lab "${lab.title}"?`);
    if (!confirmed) return;

    try {
      await labsApi.delete(lab.id);
      await fetchLabs();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, 'Không xóa được phòng lab.'));
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <TeacherPageHeader
        title={canManageLabs ? 'Quản lý Phòng Thí Nghiệm' : 'Phòng Lab Ảo'}
        description={
          canManageLabs
            ? 'Kiến tạo và điều phối các không gian thực hành STEM chuyên sâu dành cho học sinh.'
            : 'Các phòng lab ảo đã được giáo viên giao cho lớp của bạn.'
        }
        action={
          canManageLabs && (
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <Button type="button" variant="outline" onClick={() => setIsTemplatePickerOpen(true)}>
                <BookOpen className="w-4 h-4" />
                Chọn bài tập mẫu
              </Button>
              <Button
                type="button"
                onClick={openCreateModal}
                className="bg-indigo-500 hover:bg-indigo-600 text-white border-0"
              >
                <PlusCircle className="w-4 h-4" />
                Tạo phòng thí nghiệm mới
              </Button>
            </div>
          )
        }
      />

      {canManageLabs && (
        <LabStatsHeader stats={aggregateStats} loading={isLoading} error={error} />
      )}

      <div className="flex items-center justify-end gap-2 text-sm font-semibold text-muted-foreground">
        Sắp xếp theo:
        <button
          type="button"
          className="flex items-center gap-1 text-foreground font-medium hover:bg-accent px-2 py-1 rounded transition-colors"
        >
          Mới nhất
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {metaError && canManageLabs && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-500 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {metaError}
        </div>
      )}

      {error && !isLoading && (
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-destructive" />
            <div>
              <p className="font-semibold text-foreground">Không tải được phòng lab</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
          <Button type="button" variant="outline" onClick={() => void fetchLabs()}>
            <RefreshCw className="w-4 h-4" />
            Tải lại
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-[420px] rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
            >
              <div className="h-48 bg-muted animate-pulse" />
              <div className="p-6 space-y-4">
                <div className="h-5 w-2/3 rounded bg-muted animate-pulse" />
                <div className="h-4 w-full rounded bg-muted animate-pulse" />
                <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
                <div className="h-10 w-full rounded-full bg-muted animate-pulse mt-12" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleLabs.map((lab) => (
            <LabCard
              key={lab.id}
              lab={lab}
              canManage={canManageLabs}
              onEdit={openEditModal}
              onDelete={handleDeleteLab}
            />
          ))}

          {canManageLabs && (
            <button
              type="button"
              onClick={openCreateModal}
              disabled={isMetaLoading}
              className="bg-card rounded-2xl border border-dashed border-border flex flex-col items-center justify-center p-8 text-center min-h-[380px] hover:bg-accent transition-all cursor-pointer group disabled:opacity-60"
            >
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-muted-foreground mb-6 group-hover:scale-110 group-hover:text-indigo-500 transition-all">
                <Plus className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Tạo Lab Mới</h3>
              <p className="text-sm text-muted-foreground max-w-[220px]">
                Thiết kế một không gian học tập mới từ project Wokwi.
              </p>
            </button>
          )}
        </div>
      )}

      {!isLoading && !error && visibleLabs.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <h3 className="text-xl font-bold text-foreground mb-2">
            Chưa có phòng lab phù hợp
          </h3>
          <p className="text-sm text-muted-foreground">
            Đổi bộ lọc hoặc tạo phòng lab mới để bắt đầu.
          </p>
        </div>
      )}

      <CreateLabModal
        isOpen={isCreateModalOpen}
        onClose={closeModal}
        onSave={handleSaveLab}
        onValidateWokwi={validateWokwiProject}
        classOptions={classOptions}
        assignmentOptions={assignmentOptions}
        scheduleOptions={scheduleOptions}
        componentOptions={componentOptions}
        isComponentsLoading={isComponentsLoading}
        componentsError={componentsError}
        onRetryComponents={() => void fetchComponentRegistry()}
        initialLab={editingLab}
        templateData={templateData}
        isSaving={isSaving}
        error={formError}
        onRequestTemplatePicker={() => setIsTemplatePickerOpen(true)}
      />

      <TemplatePickerModal
        isOpen={isTemplatePickerOpen}
        onClose={() => setIsTemplatePickerOpen(false)}
        onSelect={handleSelectTemplate}
      />
    </div>
  );
};
