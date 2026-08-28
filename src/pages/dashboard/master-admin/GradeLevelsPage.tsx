import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  BookOpen,
  Loader2,
  ChevronRight,
  GraduationCap,
  Archive,
  CheckCircle,
  XCircle,
  MoreVertical,
} from 'lucide-react';
import {
  DataTable,
  ColumnDef,
  SearchInput,
  Modal,
  ConfirmDialog,
  EmptyState,
} from '@/pages/dashboard/school-admin/components/DataTable';
import { gradeLevelsApi, GradeLevel } from '@/services/curriculumApi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const ITEMS_PER_PAGE = 10;

type ToastType = 'success' | 'error' | 'warning';
interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export const GradeLevelsPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<GradeLevel | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const { data: gradeLevels, isLoading, refetch, error: fetchError } = useQuery({
    queryKey: ['grade-levels'],
    queryFn: () => gradeLevelsApi.getAll(),
  });

  useEffect(() => {
    if (fetchError) {
      const err = fetchError as any;
      const message = err?.response?.data?.message || err?.message || 'Lỗi khi tải danh sách khối lớp';
      showToast(message, 'error');
    }
  }, [fetchError]);

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; code: string; level: number; description?: string }) => {
      return gradeLevelsApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grade-levels'] });
      setCreateModalOpen(false);
      setCreateError(null);
      showToast('Tạo khối lớp thành công!', 'success');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Lỗi khi tạo khối lớp';
      setCreateError(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name: string; code: string; level: number; description?: string } }) => {
      return gradeLevelsApi.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grade-levels'] });
      setEditModalOpen(false);
      setSelectedGradeLevel(null);
      setEditError(null);
      showToast('Cập nhật khối lớp thành công!', 'success');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Lỗi khi cập nhật khối lớp';
      setEditError(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => gradeLevelsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grade-levels'] });
      setDeleteConfirmOpen(false);
      setSelectedGradeLevel(null);
      showToast('Xóa khối lớp thành công!', 'success');
    },
    onError: (error: any) => {
      setDeleteConfirmOpen(false);
      const message = error?.response?.data?.message || error?.message || 'Lỗi khi xóa khối lớp';
      showToast(message, 'error');
    },
  });

  const filteredGradeLevels = gradeLevels?.filter((gl) =>
    gl.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gl.code.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const columns: ColumnDef<GradeLevel>[] = [
    {
      key: 'name',
      header: 'Tên khối lớp',
      render: (gl) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{gl.name}</p>
            <p className="text-xs text-muted-foreground">Mã: {gl.code}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'level',
      header: 'Cấp độ',
      render: (gl) => (
        <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
          Lớp {gl.level}
        </span>
      ),
    },
    {
      key: 'syllabusCount',
      header: 'Số Syllabus',
      render: (gl) => (
        <span className="font-medium">{gl.syllabusCount || 0}</span>
      ),
    },
    {
      key: 'courseCount',
      header: 'Số môn học',
      render: (gl) => (
        <span className="font-medium">{gl.courseCount || 0}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (gl) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedGradeLevel(gl);
              setDetailModalOpen(true);
            }}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <Eye className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedGradeLevel(gl);
              setEditModalOpen(true);
            }}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <Edit className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedGradeLevel(gl);
              setDeleteConfirmOpen(true);
            }}
            className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </button>
        </div>
      ),
      className: 'w-28',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Khối lớp</h1>
          <p className="text-muted-foreground">
            Tạo và quản lý các khối lớp cho chương trình STEM
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Thêm khối lớp
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Tìm kiếm khối lớp..."
          className="sm:max-w-sm"
        />
        <button
          onClick={() => refetch()}
          className="p-2 rounded-lg border border-border hover:bg-accent transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <DataTable
        columns={columns}
        data={filteredGradeLevels}
        loading={isLoading}
        emptyMessage="Không có khối lớp nào"
        onRowClick={(gl) => {
          setSelectedGradeLevel(gl);
          setDetailModalOpen(true);
        }}
        rowKey="id"
      />

      {/* Create Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setCreateError(null);
        }}
        title="Thêm khối lớp mới"
        size="lg"
      >
        <GradeLevelForm
          onSubmit={async (data) => {
            await createMutation.mutateAsync(data);
          }}
          onCancel={() => {
            setCreateModalOpen(false);
            setCreateError(null);
          }}
          loading={createMutation.isPending}
          error={createError}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedGradeLevel(null);
          setEditError(null);
        }}
        title="Chỉnh sửa khối lớp"
        size="lg"
      >
        {selectedGradeLevel && (
          <GradeLevelForm
            onSubmit={async (data) => {
              await updateMutation.mutateAsync({ id: selectedGradeLevel.id, data });
            }}
            onCancel={() => {
              setEditModalOpen(false);
              setSelectedGradeLevel(null);
              setEditError(null);
            }}
            loading={updateMutation.isPending}
            error={editError}
            defaultValues={{
              name: selectedGradeLevel.name,
              code: selectedGradeLevel.code,
              level: selectedGradeLevel.level,
              description: selectedGradeLevel.description,
            }}
          />
        )}
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedGradeLevel(null);
        }}
        title="Chi tiết khối lớp"
        size="lg"
      >
        {selectedGradeLevel && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-border">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{selectedGradeLevel.name}</h3>
                <p className="text-muted-foreground">Mã: {selectedGradeLevel.code}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Cấp độ</p>
                <p className="font-medium">Lớp {selectedGradeLevel.level}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Số Syllabus</p>
                <p className="font-medium">{selectedGradeLevel.syllabusCount || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Số môn học</p>
                <p className="font-medium">{selectedGradeLevel.courseCount || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ngày tạo</p>
                <p className="font-medium">
                  {format(new Date(selectedGradeLevel.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                </p>
              </div>
            </div>
            {selectedGradeLevel.description && (
              <div>
                <p className="text-sm text-muted-foreground">Mô tả</p>
                <p className="font-medium">{selectedGradeLevel.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setSelectedGradeLevel(null);
        }}
        onConfirm={() => selectedGradeLevel && deleteMutation.mutate(selectedGradeLevel.id)}
        title="Xóa khối lớp"
        message={`Bạn có chắc chắn muốn xóa khối lớp "${selectedGradeLevel?.name}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        loading={deleteMutation.isPending}
      />

      {/* Toast Notifications */}
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
              {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
              {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
              <span className="text-sm font-medium">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

interface GradeLevelFormProps {
  onSubmit: (data: { name: string; code: string; level: number; description?: string }) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
  defaultValues?: { name: string; code: string; level: number; description?: string };
}

function GradeLevelForm({ onSubmit, onCancel, loading, error, defaultValues }: GradeLevelFormProps) {
  const [name, setName] = useState(defaultValues?.name || '');
  const [code, setCode] = useState(defaultValues?.code || '');
  const [level, setLevel] = useState(defaultValues?.level || 10);
  const [description, setDescription] = useState(defaultValues?.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, code, level, description: description || undefined });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium mb-1.5">Tên khối lớp</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ví dụ: Khối 10"
          className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Mã khối</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="GRADE_10"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Cấp độ lớp</label>
          <select
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value={10}>Lớp 10</option>
            <option value={11}>Lớp 11</option>
            <option value={12}>Lớp 12</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5">Mô tả</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả khối lớp..."
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
        />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang xử lý...
            </span>
          ) : (
            'Lưu'
          )}
        </button>
      </div>
    </form>
  );
}

export default GradeLevelsPage;
