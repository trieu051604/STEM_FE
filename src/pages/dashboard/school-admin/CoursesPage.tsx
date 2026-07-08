import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/Icon';
import { Plus, RefreshCw, Edit, Trash2, Eye, BookOpen, Users, GraduationCap } from 'lucide-react';
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

export const CoursesPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Fetch courses
  const { data: coursesData, isLoading, refetch } = useQuery({
    queryKey: ['courses', currentPage, pageSize, searchTerm],
    queryFn: () => coursesApi.getAll({
      searchTerm: searchTerm,
      pageNumber: currentPage,
      pageSize: pageSize,
    }),
  });

  // Create course mutation
  const createCourseMutation = useMutation({
    mutationFn: (data: CourseFormData) => coursesApi.create({ title: data.title, description: data.description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setCreateModalOpen(false);
    },
  });

  // Update course mutation
  const updateCourseMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CourseFormData }) => coursesApi.update(id, { title: data.title, description: data.description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setEditModalOpen(false);
      setSelectedCourse(null);
    },
  });

  // Delete course mutation
  const deleteCourseMutation = useMutation({
    mutationFn: (id: number) => coursesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setDeleteConfirmOpen(false);
      setSelectedCourse(null);
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
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
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
            className="size-8"
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
            className="size-8 text-destructive hover:text-destructive"
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
                <GraduationCap className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{coursesData.items?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Đang hiển thị</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">—</p>
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
        onClose={() => setCreateModalOpen(false)}
        title="Thêm khóa học mới"
        size="lg"
      >
        <CourseForm
          onSubmit={handleCreateCourse}
          onCancel={() => setCreateModalOpen(false)}
          loading={createCourseMutation.isPending}
        />
      </Modal>

      {/* Edit Course Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedCourse(null);
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
            }}
            loading={updateCourseMutation.isPending}
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
    </div>
  );
};

export default CoursesPage;
