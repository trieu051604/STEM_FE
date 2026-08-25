import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/Icon';
import { UserPlus, RefreshCw, Eye, Trash2, User, Mail, Phone, MapPin, BookOpen, GraduationCap, TrendingUp, Award, Clock, CheckCircle, Pencil, Calendar, Upload, Ban, Lock, Unlock, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
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
import { StudentForm, StudentFormData } from './components/Forms';
import { BulkImportModal } from './components/BulkImportModal';
import { studentsApi, schoolAuthApi, StudentProfile, LearningProgress } from '@/services/schoolAdminApi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

type ToastType = 'success' | 'error' | 'warning' | 'info';
interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

const ITEMS_PER_PAGE = 10;

export const StudentsPage = () => {
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
  const [bulkImportModalOpen, setBulkImportModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [lockConfirmOpen, setLockConfirmOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [studentUpdateError, setStudentUpdateError] = useState<string | null>(null);
  const [studentCreateError, setStudentCreateError] = useState<string | null>(null);

  // Fetch students
  const { data: studentsData, isLoading, isRefetching, refetch, error: studentsError } = useQuery({
    queryKey: ['students', currentPage, pageSize, searchTerm],
    queryFn: () => studentsApi.getAll({
      pageNumber: currentPage,
      pageSize: pageSize,
      search: searchTerm,
    }),
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  // Fetch learning progress
  const { data: progressData, isLoading: progressLoading, error: progressError } = useQuery({
    queryKey: ['student-progress', selectedStudent?.id],
    queryFn: () => studentsApi.getLearningProgress(selectedStudent!.id),
    enabled: !!selectedStudent?.id && progressModalOpen,
  });

  // Fetch student detail when editing
  const { data: studentDetail, refetch: refetchStudentDetail } = useQuery({
    queryKey: ['student', selectedStudent?.id],
    queryFn: () => studentsApi.getById(selectedStudent!.id),
    enabled: !!selectedStudent?.id && editModalOpen,
  });

  // Create student mutation
  const createStudentMutation = useMutation({
    mutationFn: (data: StudentFormData) => schoolAuthApi.createUser({
      email: data.email,
      fullName: data.fullName,
      roleId: 4, // Student
      phone: data.phone || '',
      gender: data.gender || '',
      dateOfBirth: data.dateOfBirth || '',
      address: data.address || '',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setCreateModalOpen(false);
      setStudentCreateError(null);
      showToast('Tạo học sinh thành công!', 'success');
    },
    onError: (error: any) => {
      const errors = error?.response?.data?.errors;
      const message = error?.response?.data?.message;
      if (errors && Array.isArray(errors)) {
        setStudentCreateError(errors.join('\n'));
      } else if (message) {
        setStudentCreateError(message);
      } else {
        setStudentCreateError('Tạo học sinh thất bại. Vui lòng thử lại.');
      }
      showToast('Tạo học sinh thất bại!', 'error');
    },
  });

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<StudentProfile> }) =>
      studentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setEditModalOpen(false);
      setSelectedStudent(null);
      setStudentUpdateError(null);
      showToast('Cập nhật học sinh thành công!', 'success');
    },
    onError: (error: any) => {
      setStudentUpdateError(error?.response?.data?.message || 'Cập nhật học sinh thất bại');
      showToast('Cập nhật học sinh thất bại!', 'error');
    },
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: (id: number) => studentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setDeleteConfirmOpen(false);
      setSelectedStudent(null);
      showToast('Xóa học sinh thành công!', 'success');
    },
    onError: () => {
      setDeleteConfirmOpen(false);
      showToast('Xóa học sinh thất bại!', 'error');
    },
  });

  // Toggle student active status mutation
  const toggleStudentStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      studentsApi.update(id, { isActive: !isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setLockConfirmOpen(false);
      setSelectedStudent(null);
      showToast('Cập nhật trạng thái tài khoản thành công!', 'success');
    },
    onError: () => {
      setLockConfirmOpen(false);
      showToast('Cập nhật trạng thái thất bại!', 'error');
    },
  });

  const handleToggleLock = async () => {
    if (selectedStudent) {
      await toggleStudentStatusMutation.mutateAsync({
        id: selectedStudent.id,
        isActive: selectedStudent.isActive,
      });
    }
  };

  const totalPages = Math.ceil((studentsData?.total || 0) / pageSize);

  // Column definitions
  const columns: ColumnDef<StudentProfile>[] = [
    {
      key: 'avatar',
      header: '',
      render: (student) => (
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
          {student.avatar ? (
            <img src={student.avatar} alt={student.fullName} className="w-full h-full object-cover" />
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
      render: (student) => (
        <div>
          <p className="font-medium">{student.fullName}</p>
          <p className="text-xs text-muted-foreground">{student.email}</p>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Liên hệ',
      render: (student) => (
        <span className="flex items-center gap-1.5 text-sm">
          <Phone className="w-3.5 h-3.5 text-muted-foreground" />
          {student.phone || '—'}
        </span>
      ),
    },
    {
      key: 'enrolledClasses',
      header: 'Lớp học',
      render: (student) => (
        <span className="flex items-center gap-1.5 text-sm">
          <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
          {student.totalEnrolledClasses || 0}
        </span>
      ),
    },
    {
      key: 'averageScore',
      header: 'Điểm TB',
      render: (student) => {
        const score = student.averageScore;
        return (
          <span className="flex items-center gap-1.5 text-sm">
            <CheckCircle className="w-3.5 h-3.5 text-success" />
            {score != null && score > 0 ? score.toFixed(1) : '—'}
          </span>
        );
      },
    },
    {
      key: 'isActive',
      header: 'Trạng thái',
      render: (student) => (
        <StatusBadge
          status={student.isActive ? 'Hoạt động' : 'Không hoạt động'}
          variant={student.isActive ? 'success' : 'danger'}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (student) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedStudent(student);
              setDetailModalOpen(true);
            }}
            title="Xem chi tiết"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`size-8 ${student.isActive ? 'text-orange-500 hover:text-orange-600' : 'text-green-500 hover:text-green-600'}`}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedStudent(student);
              setLockConfirmOpen(true);
            }}
            title={student.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
          >
            {student.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedStudent(student);
              setEditModalOpen(true);
            }}
            title="Chỉnh sửa"
          >
            <Pencil className="w-4 h-4" />
          </Button>
        </div>
      ),
      className: 'w-28',
    },
  ];

  const handleCreateStudent = async (data: StudentFormData) => {
    await createStudentMutation.mutateAsync({
      email: data.email,
      fullName: data.fullName,
      phone: data.phone,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth,
      address: data.address,
    });
  };

  const handleDeleteStudent = async () => {
    if (selectedStudent) {
      await deleteStudentMutation.mutateAsync(selectedStudent.id);
    }
  };

  return (
    <div className="space-y-6">
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý học sinh</h1>
          <p className="text-muted-foreground">
            Quản lý tài khoản và thông tin học sinh học Science trong trường
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setBulkImportModalOpen(true)}>
            <Upload className="w-4 h-4" />
            Nhập Excel
          </Button>
          <Button onClick={() => setCreateModalOpen(true)}>
            <UserPlus className="w-4 h-4" />
            Thêm học sinh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Tìm kiếm học sinh..."
          className="sm:max-w-sm"
        />
        <Button variant="outline" size="icon" onClick={() => refetch({ throwOnError: false })} disabled={isRefetching}>
          <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Error State */}
      {studentsError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-3" />
          <h3 className="font-semibold text-destructive mb-2">Không thể tải dữ liệu học sinh</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {studentsError instanceof Error ? studentsError.message : 'Đã xảy ra lỗi khi tải dữ liệu'}
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Thử lại
          </Button>
        </div>
      )}

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-muted" />
                <div className="space-y-2">
                  <div className="h-8 w-16 bg-muted rounded" />
                  <div className="h-4 w-20 bg-muted rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : studentsData && !studentsError ? (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{studentsData.total}</p>
                <p className="text-sm text-muted-foreground">Tổng học sinh</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {studentsData.totalEnrolledClasses}
                </p>
                <p className="text-sm text-muted-foreground">Tổng lớp ĐK</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {studentsData.totalWithoutScores}
                </p>
                <p className="text-sm text-muted-foreground">Chưa có điểm</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {studentsData.totalActiveStudents}
                </p>
                <p className="text-sm text-muted-foreground">Đang học</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {studentsData.totalWithScores}
                </p>
                <p className="text-sm text-muted-foreground">Có điểm TB</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={studentsData?.items || []}
        loading={isLoading}
        emptyMessage="Không có học sinh nào"
        onRowClick={(student) => {
          setSelectedStudent(student);
          setDetailModalOpen(true);
        }}
        rowKey="id"
      />

      {/* Pagination */}
      {studentsData && studentsData.total > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={studentsData.total}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      )}

      {/* Create Student Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setStudentCreateError(null);
        }}
        title="Thêm học sinh mới"
        size="lg"
      >
        <StudentForm
          onSubmit={handleCreateStudent}
          onCancel={() => {
            setCreateModalOpen(false);
            setStudentCreateError(null);
          }}
          loading={createStudentMutation.isPending}
          hidePassword
          error={studentCreateError}
        />
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedStudent(null);
          setStudentUpdateError(null);
        }}
        title="Chỉnh sửa thông tin học sinh"
        size="lg"
      >
        {(studentDetail || selectedStudent) && (
          <div className="space-y-4">
            <StudentForm
              onSubmit={async (data) => {
                setStudentUpdateError(null);
                await updateStudentMutation.mutateAsync({
                  id: (studentDetail || selectedStudent)!.id,
                  data: {
                    fullName: data.fullName,
                    phone: data.phone,
                    gender: data.gender,
                    dateOfBirth: data.dateOfBirth,
                    address: data.address,
                    isActive: data.isActive,
                  },
                });
              }}
              onCancel={() => {
                setEditModalOpen(false);
                setSelectedStudent(null);
                setStudentUpdateError(null);
              }}
              loading={updateStudentMutation.isPending}
              defaultValues={{
                email: (studentDetail || selectedStudent)!.email,
                fullName: (studentDetail || selectedStudent)!.fullName,
                phone: (studentDetail || selectedStudent)!.phone || '',
                gender: (studentDetail || selectedStudent)!.gender || '',
                dateOfBirth: (studentDetail || selectedStudent)!.dateOfBirth || '',
                address: (studentDetail || selectedStudent)!.address || '',
                isActive: (studentDetail || selectedStudent)!.isActive ?? true,
              }}
              error={studentUpdateError}
              hidePassword
            />
          </div>
        )}
      </Modal>

      {/* Student Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedStudent(null);
        }}
        title="Chi tiết học sinh"
        size="lg"
      >
        {selectedStudent && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-border">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {selectedStudent.avatar ? (
                  <img src={selectedStudent.avatar} alt={selectedStudent.fullName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-primary" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{selectedStudent.fullName}</h3>
                <p className="text-muted-foreground">ID: #{selectedStudent.id}</p>
                <StatusBadge
                  status={selectedStudent.isActive ? 'Hoạt động' : 'Không hoạt động'}
                  variant={selectedStudent.isActive ? 'success' : 'danger'}
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    Email
                  </p>
                  <p className="font-medium">{selectedStudent.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    Số điện thoại
                  </p>
                  <p className="font-medium">{selectedStudent.phone || '—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Ngày sinh
                  </p>
                  <p className="font-medium">{selectedStudent.dateOfBirth ? format(new Date(selectedStudent.dateOfBirth), 'dd/MM/yyyy') : '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Giới tính
                  </p>
                  <p className="font-medium">
                    {selectedStudent.gender === 'Male' ? 'Nam' : selectedStudent.gender === 'Female' ? 'Nữ' : selectedStudent.gender === 'Other' ? 'Khác' : '—'}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Địa chỉ
                </p>
                <p className="font-medium">{selectedStudent.address || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Trường học</p>
                <p className="font-medium">{selectedStudent.schoolName || '—'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-accent/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <BookOpen className="w-4 h-4" />
                    Lớp đã đăng ký
                  </div>
                  <p className="text-2xl font-bold">{selectedStudent.totalEnrolledClasses || 0}</p>
                </div>
                <div className="bg-accent/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <CheckCircle className="w-4 h-4" />
                    Điểm TB
                  </div>
                  <p className="text-2xl font-bold">{selectedStudent.averageScore?.toFixed(1) || '—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email xác thực</p>
                  <p className="font-medium">
                    {selectedStudent.isEmailVerified ? (
                      <span className="text-success">Đã xác thực</span>
                    ) : (
                      <span className="text-destructive">Chưa xác thực</span>
                    )}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Ngày tạo</p>
                  <p className="font-medium">
                    {format(new Date(selectedStudent.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                  </p>
                </div>
              </div>
              <div className="space-y-1 pt-2">
                <p className="text-sm text-muted-foreground">Cập nhật lần cuối</p>
                <p className="font-medium">
                  {selectedStudent.updatedAt ? format(new Date(selectedStudent.updatedAt), 'dd/MM/yyyy HH:mm', { locale: vi }) : '—'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Learning Progress Modal */}
      <Modal
        isOpen={progressModalOpen}
        onClose={() => {
          setProgressModalOpen(false);
          setSelectedStudent(null);
        }}
        title={`Tiến độ học tập - ${selectedStudent?.fullName}`}
        size="xl"
      >
        {progressLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : progressData ? (
          <div className="space-y-6">
            {/* Overall Progress */}
            <div className="bg-gradient-to-r from-accent/10 to-accent/5 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Tiến độ tổng thể</h3>
                <span className="text-3xl font-bold text-accent">{progressData.assignmentsCompletionRate.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-accent rounded-full h-3 transition-all duration-500"
                  style={{ width: `${progressData.assignmentsCompletionRate}%` }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-card rounded-xl border border-border p-4 text-center">
                <BookOpen className="w-6 h-6 text-brand-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{progressData.totalEnrolledClasses}</p>
                <p className="text-sm text-muted-foreground">Lớp đã tham gia</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4 text-center">
                <CheckCircle className="w-6 h-6 text-success mx-auto mb-2" />
                <p className="text-2xl font-bold">{progressData.completedClasses}</p>
                <p className="text-sm text-muted-foreground">Lớp hoàn thành</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4 text-center">
                <Award className="w-6 h-6 text-accent-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{progressData.completedAssignments}/{progressData.totalAssignments}</p>
                <p className="text-sm text-muted-foreground">Bài tập</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4 text-center">
                <TrendingUp className="w-6 h-6 text-accent mx-auto mb-2" />
                <p className="text-2xl font-bold">
                  {progressData.averageScore != null ? progressData.averageScore.toFixed(1) : '—'}
                </p>
                <p className="text-sm text-muted-foreground">Điểm trung bình</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="font-semibold mb-3">Tiến độ học tập</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-card rounded-xl border border-border">
                  <p className="text-2xl font-bold text-brand-500">{progressData.inProgressClasses}</p>
                  <p className="text-sm text-muted-foreground">Đang học</p>
                </div>
                <div className="text-center p-4 bg-card rounded-xl border border-border">
                  <p className="text-2xl font-bold text-success">{progressData.certificatesEarned}</p>
                  <p className="text-sm text-muted-foreground">Chứng chỉ</p>
                </div>
                <div className="text-center p-4 bg-card rounded-xl border border-border">
                  <p className="text-2xl font-bold text-accent">{progressData.assignmentsCompletionRate.toFixed(0)}%</p>
                  <p className="text-sm text-muted-foreground">Hoàn thành BT</p>
                </div>
              </div>
            </div>
          </div>
        ) : progressError ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-3" />
            <p className="text-destructive font-medium">Không thể tải tiến độ học tập</p>
            <p className="text-sm text-muted-foreground mt-1">
              {progressError instanceof Error ? progressError.message : 'Đã xảy ra lỗi'}
            </p>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Không có dữ liệu tiến độ học tập</p>
          </div>
        )}
      </Modal>

      {/* Lock/Unlock Confirmation */}
      <ConfirmDialog
        isOpen={lockConfirmOpen}
        onClose={() => {
          setLockConfirmOpen(false);
          setSelectedStudent(null);
        }}
        onConfirm={handleToggleLock}
        title={selectedStudent?.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
        message={
          selectedStudent?.isActive
            ? `Bạn có chắc muốn khóa tài khoản của "${selectedStudent?.fullName}"? Học sinh sẽ không thể đăng nhập cho đến khi được mở khóa.`
            : `Bạn có chắc muốn mở khóa tài khoản của "${selectedStudent?.fullName}"?`
        }
        confirmText={selectedStudent?.isActive ? "Khóa" : "Mở khóa"}
        loading={toggleStudentStatusMutation.isPending}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setSelectedStudent(null);
        }}
        onConfirm={handleDeleteStudent}
        title="Xóa học sinh"
        message={`Bạn có chắc chắn muốn xóa học sinh "${selectedStudent?.fullName}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        loading={deleteStudentMutation.isPending}
      />

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={bulkImportModalOpen}
        onClose={() => setBulkImportModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
};

export default StudentsPage;
