import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ChevronDown, Plus, PlusCircle, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { assignmentsApi, classesApi, labsApi, usersApi } from '@/services/dashboardApi';
import type {
  AssignmentEntity,
  ClassEntity,
  ComponentGlueRegistryEntity,
  CreateLabRequest,
  LabCategory,
  LabEntity,
  LabStatsEntity,
  ValidateWokwiProjectResponse,
} from '@/services/dashboardApi';
import { cn } from '@/lib/utils';
import { LabStatsHeader } from '@/components/Dashboard/VirtualLab/LabStatsHeader';
import type { LabStats } from '@/components/Dashboard/VirtualLab/LabStatsHeader';
import { LabCard } from '@/components/Dashboard/VirtualLab/LabCard';
import {
  CreateLabModal,
  type LabAssignmentOption,
  type LabClassOption,
} from '@/components/Dashboard/VirtualLab/CreateLabModal';

type LabFilter = 'all' | LabCategory;

type ManagedClassOption = {
  id: number;
  classCode?: string;
  name?: string;
  courseName?: string;
  studentCount?: number;
};

const tabs: Array<{ id: LabFilter; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'physics', label: 'Vật lý' },
  { id: 'chemistry', label: 'Hóa học' },
  { id: 'biology', label: 'Sinh học' },
  { id: 'robotics', label: 'Robot' },
];

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
  const denominator = startedCount || totalStudents;
  const completionRate = denominator ? Math.round((completedCount / denominator) * 100) : 0;
  const averageDurations = labs
    .map((lab) => lab.stats?.averageDurationSeconds)
    .filter((value): value is number => typeof value === 'number' && value > 0);
  const avgTimeMins = averageDurations.length
    ? Math.round(
        averageDurations.reduce((total, value) => total + value, 0) /
          averageDurations.length /
          60
      )
    : 0;

  return {
    activeLabs,
    totalStudents,
    completionRate,
    avgTimeMins,
  };
}

export const VirtualLabPage = () => {
  const { token, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<LabFilter>('all');
  const [labs, setLabs] = useState<LabEntity[]>([]);
  const [statsByLabId, setStatsByLabId] = useState<Record<string, LabStatsEntity>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<LabEntity | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [managedClasses, setManagedClasses] = useState<ManagedClassOption[]>([]);
  const [assignmentOptions, setAssignmentOptions] = useState<LabAssignmentOption[]>([]);
  const [componentOptions, setComponentOptions] = useState<ComponentGlueRegistryEntity[]>([]);
  const [isMetaLoading, setIsMetaLoading] = useState(false);
  const [isComponentsLoading, setIsComponentsLoading] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [componentsError, setComponentsError] = useState<string | null>(null);

  const canManageLabs = user?.role === 'teacher' || user?.role === 'school_admin';

  const displayedLabs = useMemo(
    () =>
      labs.map((lab) => ({
        ...lab,
        stats: statsByLabId[lab.id] ?? lab.stats,
      })),
    [labs, statsByLabId]
  );

  const aggregateStats = useMemo(() => buildStats(displayedLabs), [displayedLabs]);

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
      const response = await labsApi.getAll({
        category: activeTab === 'all' ? undefined : activeTab,
        pageNumber: 1,
        pageSize: 100,
      });

      setLabs(response.items);

      if (canManageLabs && response.items.length) {
        const statsEntries = await Promise.all(
          response.items.map(async (lab) => {
            try {
              return [lab.id, await labsApi.getStats(lab.id)] as const;
            } catch {
              return [lab.id, lab.stats] as const;
            }
          })
        );
        setStatsByLabId(Object.fromEntries(statsEntries));
      } else {
        setStatsByLabId({});
      }
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Không tải được danh sách phòng lab.'));
      setLabs([]);
      setStatsByLabId({});
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, canManageLabs]);

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
          ? await classesApi.getMyClasses(teacherId)
          : await classesApi.getAll({ page: 1, pageSize: 100 });
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
    } catch (metadataError) {
      setMetaError(
        getErrorMessage(
          metadataError,
          'Không tải được lớp hoặc bài đánh giá để cấu hình phòng lab.'
        )
      );
      setManagedClasses([]);
      setAssignmentOptions([]);
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
      setComponentOptions(registry);
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
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (lab: LabEntity) => {
    setEditingLab(lab);
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsCreateModalOpen(false);
    setEditingLab(null);
    setFormError(null);
  };

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
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0f4c5c]">
            Quản lý Phòng Thí Nghiệm
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl text-base">
            Kiến tạo và điều phối các không gian thực hành STEM chuyên sâu dành cho học sinh.
          </p>
        </div>
        {canManageLabs && (
          <button
            type="button"
            onClick={openCreateModal}
            className="bg-[#b45309] hover:bg-[#92400e] text-white rounded-full px-6 py-3 h-auto flex items-center gap-2 shadow-sm font-semibold transition-colors shrink-0"
          >
            <PlusCircle className="w-5 h-5" />
            Tạo phòng thí nghiệm mới
          </button>
        )}
      </div>

      <LabStatsHeader stats={aggregateStats} loading={isLoading} error={error} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-5 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-[#0f4c5c] text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 shrink-0">
          Sắp xếp theo:
          <button
            type="button"
            className="flex items-center gap-1 text-[#0f4c5c] font-bold hover:bg-slate-100 px-2 py-1 rounded transition-colors"
          >
            Mới nhất
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {metaError && canManageLabs && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {metaError}
        </div>
      )}

      {error && !isLoading && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">Không tải được phòng lab</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void fetchLabs()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
          >
            <RefreshCw className="w-4 h-4" />
            Tải lại
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-[420px] rounded-3xl border border-border bg-white shadow-sm overflow-hidden"
            >
              <div className="h-48 bg-slate-100 animate-pulse" />
              <div className="p-6 space-y-4">
                <div className="h-5 w-2/3 rounded bg-slate-100 animate-pulse" />
                <div className="h-4 w-full rounded bg-slate-100 animate-pulse" />
                <div className="h-4 w-5/6 rounded bg-slate-100 animate-pulse" />
                <div className="h-10 w-full rounded-full bg-slate-100 animate-pulse mt-12" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedLabs.map((lab) => (
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
              className="bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-8 text-center min-h-[380px] hover:bg-slate-100 hover:border-slate-400 transition-all cursor-pointer group disabled:opacity-60"
            >
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 mb-6 group-hover:scale-110 group-hover:bg-slate-300 group-hover:text-[#0f4c5c] transition-all">
                <Plus className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[#0f4c5c] mb-2">Tạo Lab Mới</h3>
              <p className="text-sm text-muted-foreground max-w-[220px]">
                Thiết kế một không gian học tập mới từ project Wokwi.
              </p>
            </button>
          )}
        </div>
      )}

      {!isLoading && !error && displayedLabs.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-10 text-center">
          <h3 className="text-xl font-bold text-[#0f4c5c] mb-2">
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
        componentOptions={componentOptions}
        isComponentsLoading={isComponentsLoading}
        componentsError={componentsError}
        onRetryComponents={() => void fetchComponentRegistry()}
        initialLab={editingLab}
        isSaving={isSaving}
        error={formError}
      />
    </div>
  );
};
