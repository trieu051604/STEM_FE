import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/Icon';
import { Plus, RefreshCw, Edit, Trash2, Eye, GraduationCap, Users, BookOpen, User, Check, X, Calendar, Clock, CalendarDays, LayoutGrid } from 'lucide-react';
import {
  DataTable,
  ColumnDef,
  Pagination,
  SearchInput,
  StatusBadge,
  Modal,
  ConfirmDialog,
} from './components/DataTable';
import { ClassForm, ClassFormData } from './components/Forms';
import { classesApi, coursesApi, teachersApi, ClassEntity, scheduleApi, type ScheduleResponse } from '@/services/schoolAdminApi';
import { gradeLevelsApi } from '@/services/curriculumApi';
import { ScheduleCalendar } from '@/components/ScheduleCalendar';
import { WeeklyScheduleGrid } from '@/components/WeeklyScheduleGrid';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

const ITEMS_PER_PAGE = 10;

type ToastType = 'success' | 'error' | 'warning';
interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// Toast Component
function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
              toast.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200' :
              toast.type === 'error' ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200' :
              'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200'
            }`}
          >
            {toast.type === 'success' && <Check className="w-5 h-5 shrink-0" />}
            {toast.type === 'error' && <X className="w-5 h-5 shrink-0" />}
            <p className="text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => onDismiss(toast.id)}
              className="ml-2 p-1 hover:opacity-70 transition-opacity"
            >
              <Icon name="X" className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export const ClassesPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Toast notification
  const showToast = (message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassEntity | null>(null);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [schedulesMap, setSchedulesMap] = useState<Record<number, ScheduleResponse[]>>({});
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [availableTeachersForEdit, setAvailableTeachersForEdit] = useState<{ id: number; fullName: string }[]>([]);
  const [courseFilter, setCourseFilter] = useState<string>('');
  const [gradeLevelFilter, setGradeLevelFilter] = useState<string>('');

  // Fetch classes
  const { data: classesData, isLoading, refetch, error: fetchError } = useQuery({
    queryKey: ['classes', currentPage, pageSize, searchTerm, courseFilter],
    queryFn: () => classesApi.getAll({
      pageNumber: currentPage,
      pageSize: pageSize,
      searchTerm: searchTerm,
      courseId: courseFilter ? Number(courseFilter) : undefined,
    }),
  });

  // Handle fetch error
  useEffect(() => {
    if (fetchError) {
      const err = fetchError as any;
      const message = err?.response?.data?.message || err?.message || 'Lỗi khi tải danh sách lớp học';
      showToast(message, 'error');
    }
  }, [fetchError]);

  // Fetch courses for filter and form
  const { data: coursesData } = useQuery({
    queryKey: ['courses-list'],
    queryFn: () => coursesApi.getAll({ pageSize: 100 }),
  });

  // Fetch grade levels for filter and form
  const { data: gradeLevelsData } = useQuery({
    queryKey: ['grade-levels'],
    queryFn: async () => {
      const res = await gradeLevelsApi.getAll();
      return res || [];
    },
  });
  const gradeLevels = (gradeLevelsData || []).map((gl: any) => ({ id: gl.id, name: gl.name }));

  // Fetch teachers for form
  const { data: teachersData } = useQuery({
    queryKey: ['teachers-list'],
    queryFn: () => teachersApi.getAll({ pageSize: 100 }),
  });

  // Create class mutation
  const createClassMutation = useMutation({
    mutationFn: async (data: ClassFormData) => {
      setCreateError(null);
      return classesApi.create(data as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setCreateModalOpen(false);
      setCreateError(null);
      showToast('Tạo lớp học thành công!', 'success');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Lỗi khi tạo lớp học';
      const isDuplicate = message.toLowerCase().includes('duplicate') ||
                          message.toLowerCase().includes('trùng') ||
                          message.toLowerCase().includes('exists') ||
                          message.toLowerCase().includes('đã tồn tại');
      if (isDuplicate) {
        setCreateError('Mã lớp đã tồn tại. Vui lòng sử dụng mã lớp khác.');
      } else {
        setCreateError(message);
        showToast(message, 'error');
      }
    },
  });

  // Update class mutation
  const updateClassMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ClassFormData }) => {
      setUpdateError(null);
      return classesApi.update(id, data as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setEditModalOpen(false);
      setSelectedClass(null);
      setUpdateError(null);
      showToast('Cập nhật lớp học thành công!', 'success');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Lỗi khi cập nhật lớp học';
      const isDuplicate = message.toLowerCase().includes('duplicate') ||
                          message.toLowerCase().includes('trùng') ||
                          message.toLowerCase().includes('exists') ||
                          message.toLowerCase().includes('đã tồn tại');
      if (isDuplicate) {
        setUpdateError('Mã lớp đã tồn tại. Vui lòng sử dụng mã lớp khác.');
      } else {
        setUpdateError(message);
        showToast(message, 'error');
      }
    },
  });

  // Delete class mutation
  const deleteClassMutation = useMutation({
    mutationFn: (id: number) => classesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setDeleteConfirmOpen(false);
      setSelectedClass(null);
      showToast('Xóa lớp học thành công!', 'success');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Lỗi khi xóa lớp học';
      setDeleteConfirmOpen(false);
      showToast(message, 'error');
    },
  });

  const fetchSchedulesForClasses = async () => {
    const items = classesData?.items || [];
    if (!items.length) {
      setSchedulesMap({});
      return;
    }

    try {
      setSchedulesLoading(true);
      const results = await Promise.all(
        items.map(async (cls) => {
          try {
            const data = await scheduleApi.getByClassId(cls.id);
            return [cls.id, data] as const;
          } catch {
            return [cls.id, []] as const;
          }
        })
      );

      setSchedulesMap(Object.fromEntries(results));
    } finally {
      setSchedulesLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedulesForClasses();
  }, [classesData?.items?.map((item) => item.id).join(',')]);

  const totalPages = Math.ceil((classesData?.total || 0) / pageSize);
  const courses = coursesData?.items || [];
  const teachers = teachersData?.items || [];

  // Column definitions
  const columns: ColumnDef<ClassEntity>[] = [
    {
      key: 'classCode',
      header: 'Lớp học',
      render: (cls) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{cls.classCode}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'courseName',
      header: 'Khóa học',
      render: (cls) => (
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-muted-foreground" />
          <span>{cls.courseName || '—'}</span>
        </div>
      ),
    },
    {
      key: 'gradeLevelName',
      header: 'Khối',
      render: (cls) => (
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
            {cls.gradeLevelName || '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'teacherName',
      header: 'Giáo viên',
      render: (cls) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className={cls.teacherName ? '' : 'text-muted-foreground'}>
            {cls.teacherName || 'Chưa phân công'}
          </span>
        </div>
      ),
    },
    {
      key: 'studentCount',
      header: 'Học sinh',
      render: (cls) => (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span>{cls.studentCount}</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      render: (cls) => (
        <span className="text-muted-foreground">
          {format(new Date(cls.createdAt), 'dd/MM/yyyy', { locale: vi })}
        </span>
      ),
    },
    {
      key: 'nextSession',
      header: 'Buổi tiếp theo',
      render: (cls) => {
        const next = getNextSchedule(cls);
        return (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-sm truncate">{getNextSessionLabel(cls)}</p>
              {next && (
                <p className="text-xs text-muted-foreground truncate">
                  {format(new Date(next.startTime), 'EEEE', { locale: vi })}
                </p>
              )}
            </div>
          </div>
        );
      },
      className: 'min-w-[160px]',
    },
    {
      key: 'schedule',
      header: 'Lịch học',
      render: (cls) => {
        const schedules = schedulesMap[cls.id] || [];
        if (schedulesLoading) {
          return (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
              <span className="text-xs">Đang tải...</span>
            </div>
          );
        }

        if (!schedules.length) {
          return (
            <span className="text-sm text-muted-foreground">Chưa có lịch</span>
          );
        }

        const visible = schedules.slice(0, 2);
        return (
          <div className="space-y-1">
            {visible.map((item) => (
              <div key={item.id} className="flex items-start gap-2 text-xs">
                <Clock className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {format(new Date(item.startTime), 'dd/MM', { locale: vi })}
                  </p>
                  <p className="text-muted-foreground">
                    {formatTimeRange(item.startTime, item.endTime)}
                  </p>
                </div>
              </div>
            ))}
            {schedules.length > 2 && (
              <p className="text-xs text-muted-foreground">+{schedules.length - 2} buổi</p>
            )}
          </div>
        );
      },
      className: 'min-w-[180px]',
    },
    {
      key: 'actions',
      header: '',
      render: (cls) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedClass(cls);
              setDetailModalOpen(true);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={async (e) => {
              e.stopPropagation();
              setSelectedClass(cls);
              setEditModalOpen(true);
              // Fetch available teachers for this class
              try {
                const res = await classesApi.getAvailableTeachers(cls.id);
                setAvailableTeachersForEdit((res.data || []).map((t: any) => ({ id: t.id, fullName: t.fullName })));
              } catch (err) {
                console.error('Failed to fetch available teachers:', err);
                setAvailableTeachersForEdit(teachers);
              }
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedClass(cls);
              setDeleteConfirmOpen(true);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
      className: 'w-24',
    },
  ];

  const formatDateTime = (value?: string) => {
    if (!value) return '—';
    try {
      // Parse the ISO string and format to dd/MM/yyyy HH:mm
      const date = new Date(value);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes} ${day}/${month}/${year}`;
    } catch {
      return value;
    }
  };

  const formatTimeRange = (start?: string, end?: string) => {
    if (!start && !end) return '—';
    // Parse time directly from string (already local, not UTC)
    const startTime = start ? start.split('T')[1]?.substring(0, 5) : '';
    const endTime = end ? end.split('T')[1]?.substring(0, 5) : '';
    if (startTime && endTime) {
      return `${startTime} - ${endTime}`;
    }
    if (startTime) return startTime;
    if (endTime) return endTime;
    return '—';
  };

  const getNextSchedule = (cls: ClassEntity) => {
    const schedules = schedulesMap[cls.id] || [];
    if (!schedules.length) return null;

    const now = Date.now();
    const future = schedules
      .map((item) => ({
        ...item,
        startTimeMs: new Date(item.startTime).getTime(),
        endTimeMs: new Date(item.endTime).getTime(),
      }))
      .filter((item) => item.startTimeMs > now)
      .sort((a, b) => a.startTimeMs - b.startTimeMs);

    return future[0] || null;
  };

  const getNextSessionLabel = (cls: ClassEntity) => {
    const next = getNextSchedule(cls);
    if (!next) return 'Chưa có lịch';
    return formatDateTime(next.startTime);
  };

  const handleCreateClass = async (data: ClassFormData) => {
    await createClassMutation.mutateAsync(data);
  };

  const handleUpdateClass = async (data: ClassFormData) => {
    if (selectedClass) {
      await updateClassMutation.mutateAsync({ id: selectedClass.id, data });
    }
  };

  const handleDeleteClass = async () => {
    if (selectedClass) {
      await deleteClassMutation.mutateAsync(selectedClass.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý lớp Science</h1>
          <p className="text-muted-foreground">
            Tạo và quản lý các lớp học Science cho trường của bạn
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Thêm lớp học
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Tìm kiếm lớp học..."
          className="sm:max-w-sm"
        />
        <select
          value={gradeLevelFilter}
          onChange={(e) => setGradeLevelFilter(e.target.value)}
          className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Tất cả khối</option>
          {gradeLevels.map((gl) => (
            <option key={gl.id} value={gl.id}>
              {gl.name}
            </option>
          ))}
        </select>
        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Tất cả khóa học</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats Cards */}
      {classesData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{classesData.total}</p>
                <p className="text-sm text-muted-foreground">Tổng lớp học</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {classesData.items?.reduce((acc, cls) => acc + cls.studentCount, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Tổng học sinh</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{courses.length}</p>
                <p className="text-sm text-muted-foreground">Khóa học</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={classesData?.items || []}
        loading={isLoading}
        emptyMessage="Không có lớp học nào"
        onRowClick={(cls) => {
          setSelectedClass(cls);
          setDetailModalOpen(true);
        }}
        rowKey="id"
      />

      {/* Pagination */}
      {classesData && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={classesData.total}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      )}

      {/* Create Class Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setCreateError(null);
        }}
        title="Thêm lớp học mới"
        size="lg"
      >
        <ClassForm
          onSubmit={handleCreateClass}
          onCancel={() => {
            setCreateModalOpen(false);
            setCreateError(null);
          }}
          loading={createClassMutation.isPending}
          gradeLevels={gradeLevels}
          courses={courses}
          teachers={teachers}
          error={createError}
        />
      </Modal>

      {/* Edit Class Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedClass(null);
          setUpdateError(null);
        }}
        title="Chỉnh sửa lớp học"
        size="lg"
      >
        {selectedClass && (
          <ClassForm
            onSubmit={handleUpdateClass}
            onCancel={() => {
              setEditModalOpen(false);
              setSelectedClass(null);
              setUpdateError(null);
            }}
            loading={updateClassMutation.isPending}
            defaultValues={{
              classCode: selectedClass.classCode,
              gradeLevelId: selectedClass.gradeLevelId,
              courseId: selectedClass.courseId,
              teacherId: selectedClass.teacherId,
              startDate: selectedClass.startDate,
              endDate: selectedClass.endDate,
            }}
            gradeLevels={gradeLevels}
            courses={courses}
            teachers={availableTeachersForEdit.length > 0 ? availableTeachersForEdit : teachers}
            error={updateError}
          />
        )}
      </Modal>

      {/* Class Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedClass(null);
        }}
        title="Chi tiết lớp học"
        size="5xl"
      >
        {selectedClass && (
          <ClassDetailContent
            classId={selectedClass.id}
            classCode={selectedClass.classCode}
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setSelectedClass(null);
        }}
        onConfirm={handleDeleteClass}
        title="Xóa lớp học"
        message={`Bạn có chắc chắn muốn xóa lớp học "${selectedClass?.classCode}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        loading={deleteClassMutation.isPending}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

interface ClassDetailContentProps {
  classId: number;
  classCode: string;
}

function ClassDetailContent({ classId, classCode }: ClassDetailContentProps) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'students' | 'schedule'>('students');
  const [scheduleView, setScheduleView] = useState<'calendar' | 'weekly'>('weekly');
  const [confirmRemove, setConfirmRemove] = useState<{ studentId: number; studentName: string } | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch class details
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['class-detail', classId],
    queryFn: async () => {
      const res = await classesApi.getById(classId);
      return res;
    },
  });

  // Fetch available students (filtered by schedule conflict)
  const { data: availableData, refetch: refetchAvailable } = useQuery({
    queryKey: ['available-students', classId],
    queryFn: async () => {
      const res = await classesApi.getAvailableStudents(classId);
      return res;
    },
  });

  const handleConfirmRemove = async () => {
    if (!confirmRemove) return;
    try {
      await classesApi.removeStudent(classId, confirmRemove.studentId);
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['class-detail', classId] });
      queryClient.invalidateQueries({ queryKey: ['available-students', classId] });
      await refetch();
      await refetchAvailable();
    } catch (err: any) {
      console.error('Remove student error:', err);
    } finally {
      setConfirmRemove(null);
    }
  };

  const handleAssign = async () => {
    if (selectedStudentIds.size === 0) return;
    
    try {
      setIsAssigning(true);
      await classesApi.assignStudents(classId, Array.from(selectedStudentIds));
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['class-detail', classId] });
      queryClient.invalidateQueries({ queryKey: ['available-students', classId] });
      await refetch();
      await refetchAvailable();
      setSelectedStudentIds(new Set());
    } catch (err: any) {
      console.error('Assign students error:', err);
    } finally {
      setIsAssigning(false);
    }
  };

  const toggleStudentSelection = (studentId: number) => {
    const newSet = new Set(selectedStudentIds);
    if (newSet.has(studentId)) {
      newSet.delete(studentId);
    } else {
      newSet.add(studentId);
    }
    setSelectedStudentIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.size === availableStudents.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(availableStudents.map(s => s.id)));
    }
  };

  const students = data?.students || [];
  const enrolledStudents = data?.enrolledStudents || 0;
  const availableStudents: { id: number; fullName: string; email: string; phone?: string; gender?: string }[] = availableData?.students || [];

  const filteredStudents = students.filter((s: { fullName?: string; email?: string }) =>
    (s.fullName || '').toLowerCase().includes(query.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(query.toLowerCase())
  );

  const filteredAvailable = availableStudents.filter((s: { fullName?: string; email?: string }) =>
    (s.fullName || '').toLowerCase().includes(query.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(query.toLowerCase())
  );

  const courseName = data?.courseName;
  const teacherName = data?.teacherName;
  const startDate = data?.startDate;
  const endDate = data?.endDate;
  const totalStudents = students.length;

  const formatDate = (d?: string) => {
    if (!d) return '—';
    try {
      return format(new Date(d), 'dd/MM/yyyy', { locale: vi });
    } catch {
      return d;
    }
  };

  return (
    <div className="space-y-5">
      {/* Class Info Header */}
      <div className="bg-muted/30 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold">{classCode}</h3>
            <p className="text-xs text-muted-foreground">ID: #{classId}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {courseName && (
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Khóa học:</span>
              <span className="font-medium truncate">{courseName}</span>
            </div>
          )}
          {teacherName && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Giáo viên:</span>
              <span className="font-medium truncate">{teacherName}</span>
            </div>
          )}
          {startDate && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground pl-4">Từ:</span>
              <span className="font-medium">{formatDate(startDate)}</span>
            </div>
          )}
          {endDate && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground pl-4">Đến:</span>
              <span className="font-medium">{formatDate(endDate)}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Học sinh:</span>
            <span className="font-medium">{totalStudents}</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'students'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-4 h-4" />
          Học sinh
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'schedule'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Lịch học
        </button>
      </div>

  {/* Tab Content */}
      {activeTab === 'students' ? (
        <>
          {/* Search */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Tìm kiếm học sinh</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên hoặc email..."
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Đã thêm */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <p className="text-sm font-semibold">Đã thêm ({students.length})</p>
              </div>
              <div className="max-h-80 overflow-y-auto rounded-lg border border-green-200 dark:border-green-900 divide-y divide-border">
                {isLoading ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">Đang tải...</div>
                ) : filteredStudents.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">Chưa có học sinh nào.</div>
                ) : (
                  filteredStudents.map((student) => (
                    <div key={student.id} className="flex items-center gap-3 p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{student.fullName}</p>
                        <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setConfirmRemove({ studentId: student.id, studentName: student.fullName })}
                        className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-destructive border border-destructive/20 rounded-md px-2 py-1 hover:bg-destructive hover:text-white"
                      >
                        Xóa
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chưa thêm */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <X className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm font-semibold">Chưa thêm ({availableStudents.length})</p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedStudentIds.size > 0 && (
                    <Button
                      size="sm"
                      onClick={handleAssign}
                      disabled={isAssigning}
                    >
                      <Check className="w-4 h-4" />
                      Thêm {selectedStudentIds.size} HS
                    </Button>
                  )}
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                {isLoading ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">Đang tải...</div>
                ) : filteredAvailable.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">Không còn học sinh nào.</div>
                ) : (
                  <>
                    {/* Select All Header */}
                    <div className="sticky top-0 bg-muted/50 px-3 py-2 z-10">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.size === availableStudents.length && availableStudents.length > 0}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-border"
                        />
                        <span className="text-xs font-medium text-muted-foreground">
                          Chọn tất cả
                        </span>
                      </label>
                    </div>
                    {filteredAvailable.map((student) => (
                      <div key={student.id} className="flex items-center gap-3 p-3">
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.has(student.id)}
                          onChange={() => toggleStudentSelection(student.id)}
                          className="w-4 h-4 rounded border-border"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{student.fullName}</p>
                          <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Schedule Section */
        <div className="space-y-4">
          {scheduleView === 'weekly' ? (
            <WeeklyScheduleGrid
              classId={classId}
              schedules={data?.schedules}
              classInfo={{ id: classId, classCode, className: data?.courseName || '' }}
              isAdmin={true}
              onScheduleChange={async () => { await refetch(); await refetchAvailable(); }}
            />
          ) : (
            <ScheduleCalendar
              classId={classId}
              schedules={data?.schedules}
              classInfo={{ id: classId, classCode, className: data?.courseName || '' }}
              isAdmin={true}
              onScheduleChange={async () => { await refetch(); await refetchAvailable(); }}
            />
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        onConfirm={handleConfirmRemove}
        title="Xóa học sinh khỏi lớp?"
        message={`Bạn có chắc muốn xóa học sinh "${confirmRemove?.studentName}" khỏi lớp này?`}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
      />
    </div>
  );
}

export default ClassesPage;
