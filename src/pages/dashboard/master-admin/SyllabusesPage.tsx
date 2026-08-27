import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Plus,
  Edit,
  Archive,
  Loader2,
  CheckCircle,
  FileEdit,
  ArrowRight,
} from 'lucide-react';
import { syllabusApi, Syllabus, CreateSyllabusPayload } from '@/services/syllabusApi';
import { api } from '@/services/api';
import { useToast } from '@/components/ToastProvider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface GradeLevel {
  id: number;
  name: string;
}

interface SyllabusFormData {
  title: string;
  description: string;
  subjectArea: string;
  gradeLevelId: number | '';
  displayOrder: number;
  estimatedHours: number;
  isRequired: boolean;
  status: string;
}

const defaultFormData: SyllabusFormData = {
  title: '',
  description: '',
  subjectArea: '',
  gradeLevelId: '',
  displayOrder: 1,
  estimatedHours: 0,
  isRequired: false,
  status: 'draft',
};

const statusLabel: Record<string, { label: string; className: string }> = {
  draft: { label: 'Nháp', className: 'bg-gray-100 text-gray-700' },
  published: { label: 'Đã xuất bản', className: 'bg-green-100 text-green-700' },
  archived: { label: 'Lưu trữ', className: 'bg-amber-100 text-amber-700' },
};

export const SyllabusesPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Syllabus | null>(null);
  const [formData, setFormData] = useState<SyllabusFormData>(defaultFormData);
  const { showToast } = useToast();

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['standard-syllabuses'],
    queryFn: () => syllabusApi.getAll({ pageSize: 100 }),
  });

  const { data: gradeLevels } = useQuery({
    queryKey: ['grade-levels'],
    queryFn: async () => (await api.get('/grade-levels')).data.data as GradeLevel[],
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateSyllabusPayload) => syllabusApi.create(payload),
    onSuccess: () => {
      showToast('Đã tạo chương trình khung mới.');
      queryClient.invalidateQueries({ queryKey: ['standard-syllabuses'] });
      handleCloseModal();
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || 'Không thể tạo chương trình khung.', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SyllabusFormData }) =>
      syllabusApi.update(id, {
        title: payload.title,
        description: payload.description,
        subjectArea: payload.subjectArea,
        gradeLevelId: payload.gradeLevelId === '' ? null : Number(payload.gradeLevelId),
        displayOrder: payload.displayOrder,
        estimatedHours: payload.estimatedHours,
        isRequired: payload.isRequired,
        status: payload.status,
      }),
    onSuccess: () => {
      showToast('Đã cập nhật chương trình khung.');
      queryClient.invalidateQueries({ queryKey: ['standard-syllabuses'] });
      handleCloseModal();
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || 'Không thể cập nhật chương trình khung.', 'error');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: number) => syllabusApi.archive(id),
    onSuccess: () => {
      showToast('Đã lưu trữ chương trình khung.');
      queryClient.invalidateQueries({ queryKey: ['standard-syllabuses'] });
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || 'Không thể lưu trữ chương trình khung.', 'error');
    },
  });

  const handleOpenModal = (syllabus?: Syllabus) => {
    if (syllabus) {
      setEditing(syllabus);
      setFormData({
        title: syllabus.title,
        description: syllabus.description || '',
        subjectArea: syllabus.subjectArea,
        gradeLevelId: syllabus.gradeLevelId ?? '',
        displayOrder: syllabus.displayOrder,
        estimatedHours: syllabus.estimatedHours,
        isRequired: syllabus.isRequired,
        status: syllabus.status,
      });
    } else {
      setEditing(null);
      setFormData(defaultFormData);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditing(null);
    setFormData(defaultFormData);
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      showToast('Vui lòng nhập tên chương trình.', 'error');
      return;
    }

    if (editing) {
      updateMutation.mutate({ id: editing.id, payload: formData });
    } else {
      createMutation.mutate({
        title: formData.title,
        description: formData.description,
        subjectArea: formData.subjectArea,
        gradeLevelId: formData.gradeLevelId === '' ? null : Number(formData.gradeLevelId),
        displayOrder: formData.displayOrder,
        estimatedHours: formData.estimatedHours,
        isRequired: formData.isRequired,
      });
    }
  };

  const syllabuses = data?.items ?? [];
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Standard Syllabus</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Quản lý chương trình khung hệ thống (Master Admin sở hữu)
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus className="w-4 h-4" />
          Tạo chương trình khung
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tổng chương trình</p>
              <p className="font-bold text-xl">{data?.totalCount ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Đã xuất bản</p>
              <p className="font-bold text-xl">{syllabuses.filter(s => s.status === 'published').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <FileEdit className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Bản nháp</p>
              <p className="font-bold text-xl">{syllabuses.filter(s => s.status === 'draft').length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        ) : syllabuses.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-25" />
            <p className="text-sm">Chưa có chương trình khung nào.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chương trình</TableHead>
                <TableHead>Khối</TableHead>
                <TableHead>Lĩnh vực</TableHead>
                <TableHead>Số giờ</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {syllabuses.map((s) => {
                const st = statusLabel[s.status] || { label: s.status, className: 'bg-gray-100 text-gray-700' };
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Link to={`/dashboard/syllabuses/${s.id}`} className="font-medium hover:underline flex items-center gap-1">
                        {s.title}
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                      {s.isRequired && <p className="text-xs text-muted-foreground">Bắt buộc</p>}
                    </TableCell>
                    <TableCell>{s.gradeLevelName || '—'}</TableCell>
                    <TableCell>{s.subjectArea || '—'}</TableCell>
                    <TableCell>{s.estimatedHours}h</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${st.className}`}>
                        {st.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleOpenModal(s)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        {s.status !== 'archived' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => archiveMutation.mutate(s.id)}
                            disabled={archiveMutation.isPending}
                          >
                            <Archive className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Chỉnh sửa chương trình khung' : 'Tạo chương trình khung mới'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Tên chương trình</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="VD: Chương trình khối 12"
              />
            </div>

            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả ngắn về chương trình"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Khối lớp</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                  value={formData.gradeLevelId}
                  onChange={(e) => setFormData({ ...formData, gradeLevelId: e.target.value === '' ? '' : Number(e.target.value) })}
                >
                  <option value="">— Chưa chọn —</option>
                  {gradeLevels?.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Lĩnh vực</Label>
                <Input
                  value={formData.subjectArea}
                  onChange={(e) => setFormData({ ...formData, subjectArea: e.target.value })}
                  placeholder="VD: engineering"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Số giờ ước tính</Label>
                <Input
                  type="number"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Thứ tự hiển thị</Label>
                <Input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            {editing && (
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="draft">Nháp</option>
                  <option value="published">Đã xuất bản</option>
                  <option value="archived">Lưu trữ</option>
                </select>
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRequired}
                onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                className="w-4 h-4"
              />
              <span>Bắt buộc</span>
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? 'Lưu thay đổi' : 'Tạo chương trình'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SyllabusesPage;
