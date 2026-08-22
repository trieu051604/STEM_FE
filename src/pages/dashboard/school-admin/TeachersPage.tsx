import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Edit, Eye, User, Mail, Phone, MapPin, GraduationCap, BookOpen, Lock, Unlock, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
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
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

// Toast notification types
type ToastType = 'success' | 'error' | 'warning' | 'info';
interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

const ITEMS_PER_PAGE = 10;

export const TeachersPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
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

  // Debounce search term (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to page 1 when searching
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [lockConfirmOpen, setLockConfirmOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherProfile | null>(null);
  const [teacherUpdateError, setTeacherUpdateError] = useState<string | null>(null);
  const [teacherCreateError, setTeacherCreateError] = useState<string | null>(null);

  // Fetch teachers - sử dụng debounced search
  const { data: teachersData, isLoading, refetch } = useQuery({
    queryKey: ['teachers', currentPage, pageSize, debouncedSearch],
    queryFn: () => teachersApi.getAll({
      pageNumber: currentPage,
      pageSize: pageSize,
      search: debouncedSearch,
    }),
  });

  // Fetch teacher detail when editing or viewing
  const { data: teacherDetail, refetch: refetchTeacherDetail } = useQuery({
    queryKey: ['teacher', selectedTeacher?.id],
    queryFn: () => teachersApi.getById(selectedTeacher!.id),
    enabled: !!selectedTeacher?.id && (editModalOpen || detailModalOpen),
  });

  // Create teacher mutation (via usersApi with role=teacher)
  const createTeacherMutation = useMutation({
    mutationFn: async (data: TeacherFormData) => {
      return schoolAuthApi.createUser({
        email: data.email,
        fullName: data.fullName,
        roleId: 3, // Teacher
        phone: data.phone || '',
        gender: data.gender || '',
        dateOfBirth: data.dateOfBirth || '',
        address: data.address || '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setCreateModalOpen(false);
      setTeacherCreateError(null);
      showToast('Tạo giáo viên thành công!', 'success');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Tạo giáo viên thất bại!';
      setTeacherCreateError(errorMessage);
      showToast(errorMessage, 'error');
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
      showToast('Cập nhật giáo viên thành công!', 'success');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Cập nhật giáo viên thất bại!';
      setTeacherUpdateError(errorMessage);
      showToast(errorMessage, 'error');
    },
  });

  // Toggle teacher active status mutation (Khóa/Mở khóa tài khoản)
  const toggleTeacherStatusMutation = useMutation({
    mutationFn: ({ id, isActive, fullName }: { id: number; isActive: boolean; fullName: string }) =>
      teachersApi.update(id, { isActive, fullName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setSelectedTeacher(null);
      showToast('Cập nhật trạng thái tài khoản thành công!', 'success');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Cập nhật trạng thái thất bại!';
      showToast(errorMessage, 'error');
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
      key: 'assignedClassesCount',
      header: 'Số lớp',
      render: (teacher) => (
        <span className="text-sm">
          {teacher.assignedClassesCount || 0}
        </span>
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
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTeacher(teacher);
              setDetailModalOpen(true);
            }}
            title="Xem chi tiết"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTeacher(teacher);
              setEditModalOpen(true);
            }}
            title="Chỉnh sửa"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`size-8 ${teacher.isActive ? 'text-orange-500 hover:text-orange-600' : 'text-green-500 hover:text-green-600'}`}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTeacher(teacher);
              toggleTeacherStatusMutation.mutate({ id: teacher.id, isActive: !teacher.isActive, fullName: teacher.fullName });
            }}
            title={teacher.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
          >
            {teacher.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </Button>
        </div>
      ),
      className: 'w-24',
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý giáo viên Science</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Quản lý tài khoản và thông tin giáo viên Science trong trường
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
                <p className="text-2xl font-bold">
                  {teachersData.items?.reduce((sum, t) => sum + (t.assignedClassesCount || 0), 0) || 0}
                </p>
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
          error={teacherCreateError || undefined}
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
        {(teacherDetail || selectedTeacher) && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-border">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {(teacherDetail || selectedTeacher)!.avatar ? (
                  <img src={(teacherDetail || selectedTeacher)!.avatar} alt={(teacherDetail || selectedTeacher)!.fullName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-primary" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{(teacherDetail || selectedTeacher)!.fullName}</h3>
                <p className="text-muted-foreground">ID: #{(teacherDetail || selectedTeacher)!.id}</p>
                <StatusBadge 
                  status={(teacherDetail || selectedTeacher)!.isActive ? 'Hoạt động' : 'Không hoạt động'} 
                  variant={(teacherDetail || selectedTeacher)!.isActive ? 'success' : 'danger'} 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  Email
                </p>
                <p className="font-medium">{(teacherDetail || selectedTeacher)!.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  Số điện thoại
                </p>
                <p className="font-medium">{(teacherDetail || selectedTeacher)!.phone || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Giới tính</p>
                <p className="font-medium">
                  {(teacherDetail || selectedTeacher)!.gender === 'Male' ? 'Nam' : (teacherDetail || selectedTeacher)!.gender === 'Female' ? 'Nữ' : (teacherDetail || selectedTeacher)!.gender || '—'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Ngày sinh</p>
                <p className="font-medium">
                  {(teacherDetail || selectedTeacher)!.dateOfBirth ? format(new Date((teacherDetail || selectedTeacher)!.dateOfBirth!), 'dd/MM/yyyy', { locale: vi }) : '—'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Địa chỉ
                </p>
                <p className="font-medium">{(teacherDetail || selectedTeacher)!.address || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Trường học</p>
                <p className="font-medium">{(teacherDetail || selectedTeacher)!.schoolName || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Email xác thực</p>
                <p className="font-medium">
                  {(teacherDetail || selectedTeacher)!.isEmailVerified ? (
                    <span className="text-success">Đã xác thực</span>
                  ) : (
                    <span className="text-destructive">Chưa xác thực</span>
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Ngày tạo</p>
                <p className="font-medium">
                  {format(new Date((teacherDetail || selectedTeacher)!.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Cập nhật lần cuối</p>
                <p className="font-medium">
                  {(teacherDetail || selectedTeacher)!.updatedAt ? format(new Date((teacherDetail || selectedTeacher)!.updatedAt!), 'dd/MM/yyyy HH:mm', { locale: vi }) : '—'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border min-w-[300px] ${
                toast.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : toast.type === 'error'
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  : toast.type === 'warning'
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
              }`}
            >
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0 text-green-600 dark:text-green-400" />}
              {toast.type === 'error' && <XCircle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400" />}
              {toast.type === 'warning' && <AlertCircle className="w-5 h-5 shrink-0 text-yellow-600 dark:text-yellow-400" />}
              {toast.type === 'info' && <CheckCircle2 className="w-5 h-5 shrink-0 text-blue-600 dark:text-blue-400" />}
              <div className="flex-1 text-sm font-medium">{toast.message}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TeachersPage;
