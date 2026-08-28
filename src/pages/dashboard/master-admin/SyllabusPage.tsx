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
  CheckCircle,
  XCircle,
  Archive,
  Send,
  Loader2,
  ChevronRight,
  FolderOpen,
  FileText,
  Beaker,
  Layers,
  Info,
  Lock,
  Hash,
  RotateCcw,
  CornerDownLeft,
} from 'lucide-react';
import {
  DataTable,
  ColumnDef,
  SearchInput,
  Modal,
  ConfirmDialog,
  StatusBadge,
} from '@/pages/dashboard/school-admin/components/DataTable';
import { syllabiApi, gradeLevelsApi, uploadApi, Syllabus, GradeLevel } from '@/services/curriculumApi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

type ToastType = 'success' | 'error' | 'warning';
interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

const statusColors: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  published: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const statusLabels: Record<string, string> = {
  draft: 'Bản nháp',
  published: 'Đã xuất bản',
  archived: 'Đã lưu trữ',
};

export const SyllabusPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [gradeFilter, setGradeFilter] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedSyllabus, setSelectedSyllabus] = useState<Syllabus | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const { data: syllabi, isLoading, refetch, error: fetchError } = useQuery({
    queryKey: ['syllabi', statusFilter, gradeFilter],
    queryFn: () => syllabiApi.getAll({
      status: statusFilter || undefined,
      gradeLevelId: gradeFilter || undefined,
    }),
  });

  const { data: gradeLevels } = useQuery({
    queryKey: ['grade-levels'],
    queryFn: () => gradeLevelsApi.getAll(),
  });

  useEffect(() => {
    if (fetchError) {
      const err = fetchError as any;
      showToast('Lỗi khi tải danh sách chương trình', 'error');
    }
  }, [fetchError]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => syllabiApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syllabi'] });
      setCreateModalOpen(false);
      setCreateError(null);
      showToast('Tạo chương trình thành công!');
    },
    onError: (error: any) => {
      setCreateError(error?.response?.data?.message || error?.message || 'Lỗi khi tạo chương trình');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => syllabiApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syllabi'] });
      setEditModalOpen(false);
      setSelectedSyllabus(null);
      setEditError(null);
      showToast('Cập nhật chương trình thành công!');
    },
    onError: (error: any) => {
      setEditError(error?.response?.data?.message || error?.message || 'Lỗi khi cập nhật chương trình');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => syllabiApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syllabi'] });
      setDeleteConfirmOpen(false);
      setSelectedSyllabus(null);
      showToast('Xóa chương trình thành công!');
    },
    onError: (error: any) => {
      setDeleteConfirmOpen(false);
      showToast(error?.response?.data?.message || error?.message || 'Lỗi khi xóa chương trình', 'error');
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: number) => syllabiApi.publish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syllabi'] });
      showToast('Xuất bản chương trình thành công!');
    },
    onError: (error: any) => {
      showToast(error?.response?.data?.message || error?.message || 'Lỗi khi xuất bản chương trình', 'error');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: number) => syllabiApi.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syllabi'] });
      showToast('Lưu trữ chương trình thành công!');
    },
    onError: (error: any) => {
      showToast(error?.response?.data?.message || error?.message || 'Lỗi khi lưu trữ chương trình', 'error');
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: (id: number) => syllabiApi.unpublish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syllabi'] });
      showToast('Hủy xuất bản chương trình thành công!');
    },
    onError: (error: any) => {
      showToast(error?.response?.data?.message || error?.message || 'Lỗi khi hủy xuất bản chương trình', 'error');
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) => syllabiApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syllabi'] });
      showToast('Khôi phục chương trình thành công!');
    },
    onError: (error: any) => {
      showToast(error?.response?.data?.message || error?.message || 'Lỗi khi khôi phục chương trình', 'error');
    },
  });

  const filteredSyllabi = syllabi?.filter((s) =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const columns: ColumnDef<Syllabus>[] = [
    {
      key: 'title',
      header: 'Tên Chương trình',
      render: (s) => (
        <div className="flex items-center gap-3">
          {s.thumbnailUrl ? (
            <img
              src={s.thumbnailUrl}
              alt={s.title}
              className="w-10 h-10 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
          )}
          <div>
            <p className="font-medium">{s.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
              {s.description || 'Không có mô tả'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'gradeLevelName',
      header: 'Khối lớp',
      render: (s) => (
        <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
          {s.gradeLevelName || 'Chưa phân loại'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (s) => (
        <span className={`px-2 py-1 rounded-full text-sm font-medium ${statusColors[s.status]}`}>
          {statusLabels[s.status]}
        </span>
      ),
    },
    {
      key: 'stats',
      header: 'Thống kê',
      render: (s) => (
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3" />
            {s.courseCount}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            {s.totalModules}
          </span>
          <span className="flex items-center gap-1">
            <Beaker className="w-3 h-3" />
            {s.totalLessons}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (s) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedSyllabus(s); setDetailModalOpen(true); }}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <Eye className="w-4 h-4 text-muted-foreground" />
          </button>
          {s.status === 'draft' && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedSyllabus(s); setEditModalOpen(true); }}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <Edit className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedSyllabus(s); setDeleteConfirmOpen(true); }}
                className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); publishMutation.mutate(s.id); }}
                className="p-2 rounded-lg hover:bg-green-500/10 transition-colors"
                title="Xuất bản"
              >
                <Send className="w-4 h-4 text-green-500" />
              </button>
            </>
          )}
          {s.status === 'published' && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); unpublishMutation.mutate(s.id); }}
                className="p-2 rounded-lg hover:bg-orange-500/10 transition-colors"
                title="Hủy xuất bản"
              >
                <CornerDownLeft className="w-4 h-4 text-orange-500" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); archiveMutation.mutate(s.id); }}
                className="p-2 rounded-lg hover:bg-gray-500/10 transition-colors"
                title="Lưu trữ"
              >
                <Archive className="w-4 h-4 text-gray-500" />
              </button>
            </>
          )}
          {s.status === 'archived' && (
            <button
              onClick={(e) => { e.stopPropagation(); restoreMutation.mutate(s.id); }}
              className="p-2 rounded-lg hover:bg-blue-500/10 transition-colors"
              title="Khôi phục"
            >
              <RotateCcw className="w-4 h-4 text-blue-500" />
            </button>
          )}
        </div>
      ),
      className: 'w-36',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Khung chương trình</h1>
          <p className="text-muted-foreground">
            Tạo và quản lý khung chương trình cho các khối lớp
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tạo Chương trình mới
        </button>
      </div>

      <div className="flex flex-wrap gap-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Tìm kiếm chương trình..."
          className="sm:max-w-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="draft">Bản nháp</option>
          <option value="published">Đã xuất bản</option>
          <option value="archived">Đã lưu trữ</option>
        </select>
        <select
          value={gradeFilter || ''}
          onChange={(e) => setGradeFilter(e.target.value ? Number(e.target.value) : null)}
          className="px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Tất cả khối lớp</option>
          {gradeLevels?.map((gl) => (
            <option key={gl.id} value={gl.id}>{gl.name}</option>
          ))}
        </select>
        <button
          onClick={() => refetch()}
          className="p-2 rounded-lg border border-border hover:bg-accent transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <DataTable
        columns={columns}
        data={filteredSyllabi}
        loading={isLoading}
        emptyMessage="Không có chương trình nào"
        onRowClick={(s) => { setSelectedSyllabus(s); setDetailModalOpen(true); }}
        rowKey="id"
      />

      {/* Create Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => { setCreateModalOpen(false); setCreateError(null); }}
        title="Tạo Chương trình mới"
        size="xl"
      >
        <SyllabusForm
          gradeLevels={gradeLevels || []}
          onSubmit={async (data) => { await createMutation.mutateAsync(data); }}
          onCancel={() => { setCreateModalOpen(false); setCreateError(null); }}
          loading={createMutation.isPending}
          error={createError}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => { setEditModalOpen(false); setSelectedSyllabus(null); setEditError(null); }}
        title="Chỉnh sửa Chương trình"
        size="xl"
      >
        {selectedSyllabus && (
          <SyllabusForm
            gradeLevels={gradeLevels || []}
            onSubmit={async (data) => updateMutation.mutateAsync({ id: selectedSyllabus.id, data })}
            onCancel={() => { setEditModalOpen(false); setSelectedSyllabus(null); setEditError(null); }}
            loading={updateMutation.isPending}
            error={editError}
            defaultValues={{
              title: selectedSyllabus.title,
              description: selectedSyllabus.description,
              thumbnailUrl: selectedSyllabus.thumbnailUrl,
              gradeLevelId: selectedSyllabus.gradeLevelId,
              subjectArea: selectedSyllabus.subjectArea,
              estimatedHours: selectedSyllabus.estimatedHours,
              isRequired: selectedSyllabus.isRequired,
              displayOrder: selectedSyllabus.displayOrder,
            }}
          />
        )}
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => { setDetailModalOpen(false); setSelectedSyllabus(null); }}
        title="Chi tiết Chương trình"
        size="lg"
      >
        {selectedSyllabus && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-border">
              {selectedSyllabus.thumbnailUrl ? (
                <img
                  src={selectedSyllabus.thumbnailUrl}
                  alt={selectedSyllabus.title}
                  className="w-16 h-16 rounded-xl object-cover shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold">{selectedSyllabus.title}</h3>
                <span className={`px-2 py-0.5 rounded-full text-sm font-medium ${statusColors[selectedSyllabus.status]}`}>
                  {statusLabels[selectedSyllabus.status]}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Khối lớp</p>
                <p className="font-medium">{selectedSyllabus.gradeLevelName || 'Chưa phân loại'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lĩnh vực</p>
                <p className="font-medium">{selectedSyllabus.subjectArea || 'Engineering'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Số khóa học</p>
                <p className="font-medium">{selectedSyllabus.courseCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng số chương</p>
                <p className="font-medium">{selectedSyllabus.totalModules}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng số bài</p>
                <p className="font-medium">{selectedSyllabus.totalLessons}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Giờ ước tính</p>
                <p className="font-medium">{selectedSyllabus.estimatedHours}h</p>
              </div>
            </div>
            {selectedSyllabus.description && (
              <div>
                <p className="text-sm text-muted-foreground">Mô tả</p>
                <p className="font-medium">{selectedSyllabus.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => { setDeleteConfirmOpen(false); setSelectedSyllabus(null); }}
        onConfirm={() => selectedSyllabus && deleteMutation.mutate(selectedSyllabus.id)}
        title="Xóa Chương trình"
        message={`Bạn có chắc chắn muốn xóa chương trình "${selectedSyllabus?.title}"? Chỉ có thể xóa chương trình ở trạng thái bản nháp.`}
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
                toast.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800' :
                toast.type === 'error' ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800' :
                'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800'
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

interface SyllabusFormProps {
  gradeLevels: GradeLevel[];
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
  defaultValues?: {
    title: string;
    description: string;
    thumbnailUrl?: string;
    gradeLevelId?: number;
    subjectArea: string;
    estimatedHours: number;
    isRequired: boolean;
    displayOrder?: number;
  };
}

function SyllabusForm({ gradeLevels, onSubmit, onCancel, loading, error, defaultValues }: SyllabusFormProps) {
  const [title, setTitle] = useState(defaultValues?.title || '');
  const [description, setDescription] = useState(defaultValues?.description || '');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(defaultValues?.thumbnailUrl || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(defaultValues?.thumbnailUrl || '');
  const [gradeLevelId, setGradeLevelId] = useState<number | undefined>(defaultValues?.gradeLevelId);
  const [subjectArea, setSubjectArea] = useState(defaultValues?.subjectArea || 'engineering');
  const [estimatedHours, setEstimatedHours] = useState(defaultValues?.estimatedHours || 0);
  const [isRequired, setIsRequired] = useState(defaultValues?.isRequired ?? true);
  const [displayOrder, setDisplayOrder] = useState(defaultValues?.displayOrder || 0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, thumbnail: 'Kích thước file tối đa 2MB' }));
        return;
      }
      // Preview local file
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setThumbnailFile(file);
      setErrors(prev => ({ ...prev, thumbnail: '' }));
    }
  };

  const removeThumbnail = () => {
    setThumbnailPreview('');
    setThumbnailFile(null);
    setThumbnailUrl('');
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Tên chương trình là bắt buộc';
    if (title.length > 200) newErrors.title = 'Tên chương trình không quá 200 ký tự';
    if (estimatedHours < 0) newErrors.estimatedHours = 'Giờ ước tính phải lớn hơn 0';
    if (displayOrder < 0) newErrors.displayOrder = 'Thứ tự hiển thị phải lớn hơn 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Upload thumbnail if new file selected
    let finalThumbnailUrl = thumbnailUrl;
    if (thumbnailFile) {
      setUploadingThumbnail(true);
      try {
        finalThumbnailUrl = await uploadApi.uploadFile(thumbnailFile, 'syllabus');
      } catch (uploadError) {
        setErrors(prev => ({ ...prev, thumbnail: 'Lỗi khi upload hình ảnh' }));
        setUploadingThumbnail(false);
        return;
      }
      setUploadingThumbnail(false);
    }

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      thumbnailUrl: finalThumbnailUrl || undefined,
      gradeLevelId,
      subjectArea: 'engineering',
      estimatedHours,
      isRequired,
      displayOrder,
    });
  };

  const isSubmitting = loading || uploadingThumbnail;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Lỗi</p>
            <p className="text-sm opacity-80">{error}</p>
          </div>
        </div>
      )}

      {/* Thumbnail Upload */}
      <div>
        <label className="block text-sm font-medium mb-2">Hình ảnh đại diện</label>
        <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
          {thumbnailPreview ? (
            <div className="relative inline-block">
              <img
                src={thumbnailPreview}
                alt="Preview"
                className="max-h-40 rounded-lg mx-auto"
              />
              <button
                type="button"
                onClick={removeThumbnail}
                disabled={uploadingThumbnail}
                className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          ) : uploadingThumbnail ? (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
              <p className="text-sm text-muted-foreground">Đang upload...</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-muted mx-auto flex items-center justify-center">
                <Plus className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Kéo thả hình ảnh hoặc <span className="text-primary cursor-pointer">chọn file</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG (tối đa 2MB)</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="hidden"
                id="thumbnail-upload"
              />
              <label
                htmlFor="thumbnail-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg cursor-pointer transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Chọn hình ảnh
              </label>
            </div>
          )}
        </div>
        {errors.thumbnail && (
          <p className="text-xs text-destructive mt-1">{errors.thumbnail}</p>
        )}
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Tên Chương trình <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
          }}
          placeholder="Ví dụ: Chương trình Engineering Khối 6"
          className={`w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
            errors.title ? 'border-destructive focus:ring-destructive/20' : 'border-border'
          }`}
        />
        <div className="flex justify-between mt-1">
          {errors.title ? (
            <p className="text-xs text-destructive">{errors.title}</p>
          ) : (
            <span />
          )}
          <p className="text-xs text-muted-foreground">{title.length}/200</p>
        </div>
      </div>

      {/* Grade Level & Subject Area */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Khối lớp <span className="text-destructive">*</span>
          </label>
          <select
            value={gradeLevelId || ''}
            onChange={(e) => setGradeLevelId(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          >
            <option value="">Chọn khối lớp</option>
            {gradeLevels.map((gl) => (
              <option key={gl.id} value={gl.id}>{gl.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Lĩnh vực</label>
          <div className="relative">
            <select
              value={subjectArea}
              disabled
              className="w-full px-4 py-3 rounded-xl border border-border bg-muted cursor-not-allowed opacity-60"
            >
              <option value="engineering">Engineering (Kỹ thuật)</option>
            </select>
            <Lock className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">Hệ thống chỉ hỗ trợ Engineering</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Giờ ước tính</label>
          <div className="relative">
            <input
              type="number"
              value={estimatedHours}
              onChange={(e) => {
                setEstimatedHours(Number(e.target.value));
                if (errors.estimatedHours) setErrors(prev => ({ ...prev, estimatedHours: '' }));
              }}
              min={0}
              className={`w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                errors.estimatedHours ? 'border-destructive focus:ring-destructive/20' : 'border-border'
              }`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">h</span>
          </div>
          {errors.estimatedHours && (
            <p className="text-xs text-destructive">{errors.estimatedHours}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Thứ tự hiển thị</label>
          <div className="relative">
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => {
                setDisplayOrder(Number(e.target.value));
                if (errors.displayOrder) setErrors(prev => ({ ...prev, displayOrder: '' }));
              }}
              min={0}
              className={`w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                errors.displayOrder ? 'border-destructive focus:ring-destructive/20' : 'border-border'
              }`}
            />
            <Hash className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
          {errors.displayOrder && (
            <p className="text-xs text-destructive">{errors.displayOrder}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Bắt buộc</label>
          <div className="flex items-center justify-center h-[50px]">
            <button
              type="button"
              onClick={() => setIsRequired(!isRequired)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                isRequired ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-sm ${
                  isRequired ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Mô tả</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả chi tiết về chương trình học, mục tiêu, nội dung..."
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
        />
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 dark:text-blue-300">
          <p className="font-medium">Sau khi tạo</p>
          <p className="opacity-80 mt-1">
            Bạn có thể thêm khóa học, chương và bài học vào chương trình này.
            Chương trình sẽ tự động hiển thị cho School Admin khi đã xuất bản.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-6 py-3 rounded-xl border border-border hover:bg-accent transition-colors font-medium disabled:opacity-50"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {uploadingThumbnail ? 'Đang upload ảnh...' : 'Đang xử lý...'}
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              {defaultValues ? 'Cập nhật' : 'Tạo mới'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default SyllabusPage;
