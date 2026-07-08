import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/Icon';
import { Plus, RefreshCw, Edit, Trash2, Eye, GraduationCap, Users, BookOpen, User } from 'lucide-react';
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
import { classesApi, coursesApi, teachersApi, ClassEntity, Course, TeacherProfile } from '@/services/schoolAdminApi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const ITEMS_PER_PAGE = 10;

export const ClassesPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [courseFilter, setCourseFilter] = useState<string>('');

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassEntity | null>(null);

  // Fetch classes
  const { data: classesData, isLoading, refetch } = useQuery({
    queryKey: ['classes', currentPage, pageSize, searchTerm, courseFilter],
    queryFn: () => classesApi.getAll({
      pageNumber: currentPage,
      pageSize: pageSize,
      searchTerm: searchTerm,
      courseId: courseFilter ? Number(courseFilter) : undefined,
    }),
  });

  // Fetch courses for filter and form
  const { data: coursesData } = useQuery({
    queryKey: ['courses-list'],
    queryFn: () => coursesApi.getAll({ pageSize: 100 }),
  });

  // Fetch teachers for form
  const { data: teachersData } = useQuery({
    queryKey: ['teachers-list'],
    queryFn: () => teachersApi.getAll({ pageSize: 100 }),
  });

  // Create class mutation
  const createClassMutation = useMutation({
    mutationFn: (data: ClassFormData) => classesApi.create(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setCreateModalOpen(false);
    },
  });

  // Update class mutation
  const updateClassMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ClassFormData }) => classesApi.update(id, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setEditModalOpen(false);
      setSelectedClass(null);
    },
  });

  // Delete class mutation
  const deleteClassMutation = useMutation({
    mutationFn: (id: number) => classesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setDeleteConfirmOpen(false);
      setSelectedClass(null);
    },
  });

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
            onClick={(e) => {
              e.stopPropagation();
              setSelectedClass(cls);
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
              setSelectedClass(cls);
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
          <h1 className="text-2xl font-bold">Quản lý lớp học</h1>
          <p className="text-muted-foreground">
            Tạo và quản lý các lớp học cho khóa học STEM
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
        onClose={() => setCreateModalOpen(false)}
        title="Thêm lớp học mới"
        size="lg"
      >
        <ClassForm
          onSubmit={handleCreateClass}
          onCancel={() => setCreateModalOpen(false)}
          loading={createClassMutation.isPending}
          courses={courses}
          teachers={teachers}
        />
      </Modal>

      {/* Edit Class Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedClass(null);
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
            }}
            loading={updateClassMutation.isPending}
            defaultValues={{
              classCode: selectedClass.classCode,
              courseId: selectedClass.courseId,
              teacherId: selectedClass.teacherId,
              startDate: selectedClass.startDate,
              endDate: selectedClass.endDate,
            }}
            courses={courses}
            teachers={teachers}
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
        size="lg"
      >
        {selectedClass && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-border">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{selectedClass.classCode}</h3>
                <p className="text-muted-foreground">ID: #{selectedClass.id}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Khóa học</p>
                <p className="font-medium flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  {selectedClass.courseName || '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Giáo viên</p>
                <p className="font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {selectedClass.teacherName || 'Chưa phân công'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Số học sinh</p>
                <p className="font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {selectedClass.studentCount}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ngày tạo</p>
                <p className="font-medium">
                  {format(new Date(selectedClass.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                </p>
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
          setSelectedClass(null);
        }}
        onConfirm={handleDeleteClass}
        title="Xóa lớp học"
        message={`Bạn có chắc chắn muốn xóa lớp học "${selectedClass?.classCode}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        loading={deleteClassMutation.isPending}
      />
    </div>
  );
};

export default ClassesPage;
