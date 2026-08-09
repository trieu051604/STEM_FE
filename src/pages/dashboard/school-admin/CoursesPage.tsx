import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/Icon';
import { Plus, RefreshCw, Edit, Trash2, Eye, BookOpen, Users, TrendingUp, Loader2 } from 'lucide-react';
import {
  DataTable,
  ColumnDef,
  Pagination,
  SearchInput,
  StatusBadge,
  Modal,
  ConfirmDialog,
  EmptyState,
} from './components/DataTable';
import { CourseForm, CourseFormData } from './components/Forms';
import { coursesApi, Course } from '@/services/schoolAdminApi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const ITEMS_PER_PAGE = 10;

type ToastType = 'success' | 'error' | 'warning';
interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export const CoursesPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Toast notification
  const showToast = (message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Fetch courses
  const { data: coursesData, isLoading, refetch, error: fetchError } = useQuery({
    queryKey: ['courses', currentPage, pageSize, searchTerm],
    queryFn: () => coursesApi.getAll({
      searchTerm: searchTerm,
      pageNumber: currentPage,
      pageSize: pageSize,
    }),
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Lỗi khi tải danh sách khóa học';
      showToast(message, 'error');
    },
  });

  // Create course mutation
  const [createError, setCreateError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const createCourseMutation = useMutation({
    mutationFn: async (data: CourseFormData) => {
      setCreateError(null);
      return coursesApi.create({ title: data.title, description: data.description });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setCreateModalOpen(false);
      setCreateError(null);
      showToast('Tạo khóa học thành công!', 'success');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Lỗi khi tạo khóa học';
      const isDuplicate = message.toLowerCase().includes('duplicate') || 
                          message.toLowerCase().includes('trùng') ||
                          message.toLowerCase().includes('exists') ||
                          message.toLowerCase().includes('đã tồn tại');
      if (isDuplicate) {
        setCreateError('Mã khóa học đã tồn tại. Vui lòng sử dụng mã khác.');
      } else {
        setCreateError(message);
        showToast(message, 'error');
      }
    },
  });

  // Update course mutation
  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CourseFormData }) => {
      setUpdateError(null);
      return coursesApi.update(id, { title: data.title, description: data.description });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setEditModalOpen(false);
      setSelectedCourse(null);
      setUpdateError(null);
      showToast('Cập nhật khóa học thành công!', 'success');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Lỗi khi cập nhật khóa học';
      const isDuplicate = message.toLowerCase().includes('duplicate') || 
                          message.toLowerCase().includes('trùng') ||
                          message.toLowerCase().includes('exists') ||
                          message.toLowerCase().includes('đã tồn tại');
      if (isDuplicate) {
        setUpdateError('Mã khóa học đã tồn tại. Vui lòng sử dụng mã khác.');
      } else {
        setUpdateError(message);
        showToast(message, 'error');
      }
    },
  });

  // Delete course mutation
  const deleteCourseMutation = useMutation({
    mutationFn: (id: number) => coursesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setDeleteConfirmOpen(false);
      setSelectedCourse(null);
      showToast('Xóa khóa học thành công!', 'success');
    },
    onError: (error: any) => {
      setDeleteConfirmOpen(false);
      const message = error?.response?.data?.message || error?.message || 'Lỗi khi xóa khóa học';
      showToast(message, 'error');
    },
  });

  const totalPages = Math.ceil((coursesData?.total || 0) / pageSize);

  // Column definitions
  const columns: ColumnDef<Course>[] = [
    {
      key: 'title',
      header: 'Tên khóa học',
      render: (course) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{course.title}</p>
            {course.description && (
              <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                {course.description}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'schoolName',
      header: 'Trường',
      render: (course) => (
        <span className="text-muted-foreground">
          {course.schoolName || '—'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      render: (course) => (
        <span className="text-muted-foreground">
          {format(new Date(course.createdAt), 'dd/MM/yyyy', { locale: vi })}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Cập nhật',
      render: (course) => (
        <span className="text-muted-foreground">
          {course.updatedAt
            ? format(new Date(course.updatedAt), 'dd/MM/yyyy', { locale: vi })
            : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (course) => (
        <div className="flex items-center gap-1 opacity-100 group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground hover:bg-accent"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCourse(course);
              setDetailModalOpen(true);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground hover:bg-accent"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCourse(course);
              setEditModalOpen(true);
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCourse(course);
              setDeleteConfirmOpen(true);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
      className: 'w-28',
    },
  ];

  const handleCreateCourse = async (data: CourseFormData) => {
    await createCourseMutation.mutateAsync(data);
  };

  const handleUpdateCourse = async (data: CourseFormData) => {
    if (selectedCourse) {
      await updateCourseMutation.mutateAsync({ id: selectedCourse.id, data });
    }
  };

  const handleDeleteCourse = async () => {
    if (selectedCourse) {
      await deleteCourseMutation.mutateAsync(selectedCourse.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý khóa học</h1>
          <p className="text-muted-foreground">
            Tạo và quản lý các khóa học STEM cho trường của bạn
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Thêm khóa học
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Tìm kiếm khóa học..."
          className="sm:max-w-sm"
        />
        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats Cards */}
      {coursesData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{coursesData.total}</p>
                <p className="text-sm text-muted-foreground">Tổng khóa học</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{coursesData.total}</p>
                <p className="text-sm text-muted-foreground">Đang hoạt động</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                <Users className="w-6 h-6 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {coursesData.items?.reduce((sum, course) => sum + (course.enrolledStudents || 0), 0) || 0}
                </p>
                <p className="text-sm text-muted-foreground">Học viên đăng ký</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={coursesData?.items || []}
        loading={isLoading}
        emptyMessage="Không có khóa học nào"
        onRowClick={(course) => {
          setSelectedCourse(course);
          setDetailModalOpen(true);
        }}
        rowKey="id"
      />

      {/* Pagination */}
      {coursesData && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={coursesData.total}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      )}

      {/* Create Course Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setCreateError(null);
        }}
        title="Thêm khóa học mới"
        size="lg"
      >
        <CourseForm
          onSubmit={handleCreateCourse}
          onCancel={() => {
            setCreateModalOpen(false);
            setCreateError(null);
          }}
          loading={createCourseMutation.isPending}
          error={createError}
        />
      </Modal>

      {/* Edit Course Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedCourse(null);
          setUpdateError(null);
        }}
        title="Chỉnh sửa khóa học"
        size="lg"
      >
        {selectedCourse && (
          <CourseForm
            onSubmit={handleUpdateCourse}
            onCancel={() => {
              setEditModalOpen(false);
              setSelectedCourse(null);
              setUpdateError(null);
            }}
            loading={updateCourseMutation.isPending}
            error={updateError}
            defaultValues={{
              title: selectedCourse.title,
              description: selectedCourse.description,
            }}
          />
        )}
      </Modal>

      {/* Course Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedCourse(null);
        }}
        title="Chi tiết khóa học"
        size="lg"
      >
        {selectedCourse && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-border">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{selectedCourse.title}</h3>
                <p className="text-muted-foreground">ID: #{selectedCourse.id}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Mô tả</p>
                <p className="font-medium">
                  {selectedCourse.description || 'Không có mô tả'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Trường</p>
                  <p className="font-medium">{selectedCourse.schoolName || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ngày tạo</p>
                  <p className="font-medium">
                    {format(new Date(selectedCourse.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cập nhật lần cuối</p>
                  <p className="font-medium">
                    {selectedCourse.updatedAt
                      ? format(new Date(selectedCourse.updatedAt), 'dd/MM/yyyy HH:mm', { locale: vi })
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setSelectedCourse(null);
        }}
        onConfirm={handleDeleteCourse}
        title="Xóa khóa học"
        message={`Bạn có chắc chắn muốn xóa khóa học "${selectedCourse?.title}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        loading={deleteCourseMutation.isPending}
      />

      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
                toast.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200' :
                toast.type === 'error' ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200' :
                'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200'
              }`}
            >
              {toast.type === 'success' && <span className="text-green-500">✓</span>}
              {toast.type === 'error' && <span className="text-red-500">✕</span>}
              {toast.type === 'warning' && <span className="text-yellow-500">⚠</span>}
              <span className="text-sm font-medium">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CoursesPage;
