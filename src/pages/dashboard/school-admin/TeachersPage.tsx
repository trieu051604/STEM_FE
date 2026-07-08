import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/Icon';
import { Plus, RefreshCw, Edit, Trash2, Eye, User, Mail, Phone, MapPin, GraduationCap, BookOpen, History } from 'lucide-react';
import {
  DataTable,
  ColumnDef,
  Pagination,
  SearchInput,
  StatusBadge,
  Modal,
  ConfirmDialog,
} from './components/DataTable';
import { TeacherForm, TeacherFormData } from './components/Forms';
import { teachersApi, schoolAuthApi, TeacherProfile } from '@/services/schoolAdminApi';
import { useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const ITEMS_PER_PAGE = 10;

export const TeachersPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherProfile | null>(null);
  const [teacherUpdateError, setTeacherUpdateError] = useState<string | null>(null);

  // Fetch teachers
  const { data: teachersData, isLoading, refetch } = useQuery({
    queryKey: ['teachers', currentPage, pageSize, searchTerm],
    queryFn: () => teachersApi.getAll({
      pageNumber: currentPage,
      pageSize: pageSize,
      search: searchTerm,
    }),
  });

  // Fetch teacher detail when editing
  const { data: teacherDetail, refetch: refetchTeacherDetail } = useQuery({
    queryKey: ['teacher', selectedTeacher?.id],
    queryFn: () => teachersApi.getById(selectedTeacher!.id),
    enabled: !!selectedTeacher?.id && editModalOpen,
  });

  // Create teacher mutation (via usersApi with role=teacher)
  const createTeacherMutation = useMutation({
    mutationFn: async (data: TeacherFormData) => {
      return schoolAuthApi.createUser({
        email: data.email,
        password: 'TempPassword123',
        fullName: data.fullName,
        roleId: 3, // Teacher
        phone: data.phone,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        address: data.address,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setCreateModalOpen(false);
    },
  });

  // Update teacher mutation
  const updateTeacherMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TeacherProfile> }) => 
      teachersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setEditModalOpen(false);
      setSelectedTeacher(null);
      setTeacherUpdateError(null);
    },
    onError: (error: any) => {
      setTeacherUpdateError(error?.response?.data?.message || 'Cập nhật giáo viên thất bại');
    },
  });

  // Delete teacher mutation
  const deleteTeacherMutation = useMutation({
    mutationFn: (id: number) => teachersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setDeleteConfirmOpen(false);
      setSelectedTeacher(null);
    },
  });

  // Toggle teacher active status mutation
  const toggleTeacherStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      teachersApi.update(id, { isActive: !isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setSelectedTeacher(null);
    },
  });

  const totalPages = Math.ceil((teachersData?.total || 0) / pageSize);

  // Column definitions
  const columns: ColumnDef<TeacherProfile>[] = [
    {
      key: 'avatar',
      header: '',
      render: (teacher) => (
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
          {teacher.avatar ? (
            <img src={teacher.avatar} alt={teacher.fullName} className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-primary" />
          )}
        </div>
      ),
      className: 'w-14',
    },
    {
      key: 'fullName',
      header: 'Họ và tên',
      render: (teacher) => (
        <div>
          <p className="font-medium">{teacher.fullName}</p>
          <p className="text-xs text-muted-foreground">{teacher.email}</p>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Liên hệ',
      render: (teacher) => (
        <div className="space-y-1">
          <p className="text-sm flex items-center gap-1.5">
            <Phone className="w-3 h-3 text-muted-foreground" />
            {teacher.phone || '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Trạng thái',
      render: (teacher) => (
        <StatusBadge 
          status={teacher.isActive ? 'Hoạt động' : 'Không hoạt động'} 
          variant={teacher.isActive ? 'success' : 'danger'} 
        />
      ),
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      render: (teacher) => (
        <span className="text-muted-foreground">
          {format(new Date(teacher.createdAt), 'dd/MM/yyyy', { locale: vi })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (teacher) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTeacher(teacher);
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
              setSelectedTeacher(teacher);
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
              setSelectedTeacher(teacher);
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

  const handleCreateTeacher = async (data: TeacherFormData) => {
    await createTeacherMutation.mutateAsync(data);
  };

  const handleUpdateTeacher = async (data: TeacherFormData) => {
    const teacher = teacherDetail || selectedTeacher;
    if (teacher) {
      await updateTeacherMutation.mutateAsync({ 
        id: teacher.id, 
        data: {
          fullName: data.fullName,
          phone: data.phone,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth,
          address: data.address,
          isActive: data.isActive,
        }
      });
    }
  };

  const handleDeleteTeacher = async () => {
    if (selectedTeacher) {
      await deleteTeacherMutation.mutateAsync(selectedTeacher.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý giáo viên</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Quản lý tài khoản và thông tin giáo viên trong trường
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Thêm giáo viên
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Tìm kiếm giáo viên..."
          className="sm:max-w-sm"
        />
        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats Cards */}
      {teachersData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{teachersData.total}</p>
                <p className="text-sm text-muted-foreground">Tổng giáo viên</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <User className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {teachersData.items?.filter((t) => t.isActive).length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Đang hoạt động</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">—</p>
                <p className="text-sm text-muted-foreground">Lớp đang dạy</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={teachersData?.items || []}
        loading={isLoading}
        emptyMessage="Không có giáo viên nào"
        onRowClick={(teacher) => {
          setSelectedTeacher(teacher);
          setDetailModalOpen(true);
        }}
        rowKey="id"
      />

      {/* Pagination */}
      {teachersData && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={teachersData.total}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      )}

      {/* Create Teacher Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Thêm giáo viên mới"
        size="lg"
      >
        <TeacherForm
          onSubmit={handleCreateTeacher}
          onCancel={() => setCreateModalOpen(false)}
          loading={createTeacherMutation.isPending}
          hidePassword
        />
      </Modal>

      {/* Edit Teacher Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedTeacher(null);
          setTeacherUpdateError(null);
        }}
        title="Chỉnh sửa giáo viên"
        size="lg"
      >
        {(teacherDetail || selectedTeacher) && (
          <div className="space-y-4">
            <TeacherForm
              onSubmit={handleUpdateTeacher}
              onCancel={() => {
                setEditModalOpen(false);
                setSelectedTeacher(null);
                setTeacherUpdateError(null);
              }}
              loading={updateTeacherMutation.isPending}
              defaultValues={{
                fullName: (teacherDetail || selectedTeacher)!.fullName,
                email: (teacherDetail || selectedTeacher)!.email,
                phone: (teacherDetail || selectedTeacher)!.phone || '',
                gender: (teacherDetail || selectedTeacher)!.gender || '',
                dateOfBirth: (teacherDetail || selectedTeacher)!.dateOfBirth || '',
                address: (teacherDetail || selectedTeacher)!.address || '',
                isActive: (teacherDetail || selectedTeacher)!.isActive,
              }}
              error={teacherUpdateError}
              hidePassword
            />
          </div>
        )}
      </Modal>

      {/* Teacher Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedTeacher(null);
        }}
        title="Chi tiết giáo viên"
        size="lg"
      >
        {selectedTeacher && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-border">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {selectedTeacher.avatar ? (
                  <img src={selectedTeacher.avatar} alt={selectedTeacher.fullName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-primary" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{selectedTeacher.fullName}</h3>
                <p className="text-muted-foreground">ID: #{selectedTeacher.id}</p>
                <StatusBadge 
                  status={selectedTeacher.isActive ? 'Hoạt động' : 'Không hoạt động'} 
                  variant={selectedTeacher.isActive ? 'success' : 'danger'} 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  Email
                </p>
                <p className="font-medium">{selectedTeacher.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  Số điện thoại
                </p>
                <p className="font-medium">{selectedTeacher.phone || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Giới tính</p>
                <p className="font-medium">
                  {selectedTeacher.gender === 'Male' ? 'Nam' : selectedTeacher.gender === 'Female' ? 'Nữ' : selectedTeacher.gender || '—'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Ngày sinh</p>
                <p className="font-medium">
                  {selectedTeacher.dateOfBirth ? format(new Date(selectedTeacher.dateOfBirth), 'dd/MM/yyyy', { locale: vi }) : '—'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Địa chỉ
                </p>
                <p className="font-medium">{selectedTeacher.address || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Trường học</p>
                <p className="font-medium">{selectedTeacher.schoolName || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Email xác thực</p>
                <p className="font-medium">
                  {selectedTeacher.isEmailVerified ? (
                    <span className="text-success">Đã xác thực</span>
                  ) : (
                    <span className="text-destructive">Chưa xác thực</span>
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Ngày tạo</p>
                <p className="font-medium">
                  {format(new Date(selectedTeacher.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Cập nhật lần cuối</p>
                <p className="font-medium">
                  {selectedTeacher.updatedAt ? format(new Date(selectedTeacher.updatedAt), 'dd/MM/yyyy HH:mm', { locale: vi }) : '—'}
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
          setSelectedTeacher(null);
        }}
        onConfirm={handleDeleteTeacher}
        title="Xóa giáo viên"
        message={`Bạn có chắc chắn muốn xóa giáo viên "${selectedTeacher?.fullName}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        loading={deleteTeacherMutation.isPending}
      />
    </div>
  );
};

export default TeachersPage;
