import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  BookOpen,
  Clock,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ListChecks,
  Loader2,
  Eye,
} from 'lucide-react';
import {
  Modal,
  ConfirmDialog,
} from '@/pages/dashboard/school-admin/components/DataTable';
import { modulesApi, lessonsApi } from '@/services/curriculumApi';
import { coursesApi } from '@/services/schoolAdminApi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

type ToastType = 'success' | 'error' | 'warning';
interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ModuleFormData {
  title: string;
  description?: string;
  displayOrder?: number;
  estimatedMinutes?: number;
  input?: string;
  output?: string;
}

interface LessonFormData {
  title: string;
  description?: string;
  displayOrder?: number;
  estimatedMinutes?: number;
  content?: string;
  input?: string;
  output?: string;
}

export const CourseDetailPage = ({ courseId, onBack }: { courseId: number; onBack: () => void }) => {
  const queryClient = useQueryClient();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [editingCourse, setEditingCourse] = useState(false);

  // Toast
  const showToast = (message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const dismissToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  // Modals
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [editModuleModalOpen, setEditModuleModalOpen] = useState(false);
  const [viewModuleModalOpen, setViewModuleModalOpen] = useState(false);
  const [deleteModuleConfirmOpen, setDeleteModuleConfirmOpen] = useState(false);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [editLessonModalOpen, setEditLessonModalOpen] = useState(false);
  const [viewLessonModalOpen, setViewLessonModalOpen] = useState(false);
  const [deleteLessonConfirmOpen, setDeleteLessonConfirmOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);

  // Errors
  const [moduleError, setModuleError] = useState<string | null>(null);
  const [lessonError, setLessonError] = useState<string | null>(null);

  // Fetch course detail
  const { data: course, isLoading: courseLoading, refetch: refetchCourse } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => coursesApi.getById(courseId),
  });

  // Fetch modules by course
  const { data: modulesData, isLoading: modulesLoading, refetch: refetchModules } = useQuery({
    queryKey: ['modules', courseId],
    queryFn: () => modulesApi.getByCourse(courseId),
  });

  const modules = modulesData || [];

  // Fetch lessons for expanded modules
  const getModuleLessons = (moduleId: number) => {
    const { data: lessons } = useQuery({
      queryKey: ['lessons', moduleId],
      queryFn: () => lessonsApi.getByModule(moduleId),
      enabled: expandedModules.has(moduleId),
    });
    return lessons || [];
  };

  // Toggle module expand
  const toggleModule = (moduleId: number) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  // Create module mutation
  const createModuleMutation = useMutation({
    mutationFn: async (data: ModuleFormData) => {
      return modulesApi.create({ courseId, ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', courseId] });
      setModuleModalOpen(false);
      showToast('Tạo module thành công!');
    },
    onError: (error: any) => {
      setModuleError(error?.message || 'Lỗi khi tạo module');
    },
  });

  // Update module mutation
  const updateModuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ModuleFormData }) => {
      return modulesApi.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', courseId] });
      setEditModuleModalOpen(false);
      setSelectedModule(null);
      showToast('Cập nhật module thành công!');
    },
    onError: (error: any) => {
      setModuleError(error?.message || 'Lỗi khi cập nhật module');
    },
  });

  // Delete module mutation
  const deleteModuleMutation = useMutation({
    mutationFn: (id: number) => modulesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', courseId] });
      setDeleteModuleConfirmOpen(false);
      setSelectedModule(null);
      showToast('Xóa module thành công!');
    },
    onError: (error: any) => {
      showToast(error?.message || 'Lỗi khi xóa module', 'error');
    },
  });

  // Create lesson mutation
  const createLessonMutation = useMutation({
    mutationFn: async ({ moduleId, data }: { moduleId: number; data: LessonFormData }) => {
      return lessonsApi.create({ moduleId, ...data });
    },
    onSuccess: (_, { moduleId }) => {
      queryClient.invalidateQueries({ queryKey: ['lessons', moduleId] });
      queryClient.invalidateQueries({ queryKey: ['modules', courseId] });
      setLessonModalOpen(false);
      showToast('Tạo bài học thành công!');
    },
    onError: (error: any) => {
      setLessonError(error?.message || 'Lỗi khi tạo bài học');
    },
  });

  // Update lesson mutation
  const updateLessonMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: LessonFormData }) => {
      return lessonsApi.update(id, data);
    },
    onSuccess: () => {
      if (selectedLesson) {
        queryClient.invalidateQueries({ queryKey: ['lessons', selectedLesson.moduleId] });
        queryClient.invalidateQueries({ queryKey: ['modules', courseId] });
      }
      setEditLessonModalOpen(false);
      setSelectedLesson(null);
      showToast('Cập nhật bài học thành công!');
    },
    onError: (error: any) => {
      setLessonError(error?.message || 'Lỗi khi cập nhật bài học');
    },
  });

  // Delete lesson mutation
  const deleteLessonMutation = useMutation({
    mutationFn: ({ id, moduleId }: { id: number; moduleId: number }) => lessonsApi.delete(id),
    onSuccess: (_, { moduleId }) => {
      queryClient.invalidateQueries({ queryKey: ['lessons', moduleId] });
      queryClient.invalidateQueries({ queryKey: ['modules', courseId] });
      setDeleteLessonConfirmOpen(false);
      setSelectedLesson(null);
      showToast('Xóa bài học thành công!');
    },
    onError: (error: any) => {
      showToast(error?.message || 'Lỗi khi xóa bài học', 'error');
    },
  });

  if (courseLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{course?.title || 'Course'}</h1>
          <p className="text-muted-foreground">{course?.description || 'Khóa học STEM'}</p>
        </div>
        <Button variant="outline" onClick={() => refetchModules()}>
          <RefreshCw className={`w-4 h-4 ${modulesLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Course Stats */}
      {course && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm">Modules</span>
            </div>
            <p className="text-2xl font-bold">{modules.length}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Giờ học</span>
            </div>
            <p className="text-2xl font-bold">
              {Math.round(modules.reduce((sum, m) => sum + (m.estimatedMinutes || 0), 0) / 60)}h
            </p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm">Syllabus</span>
            </div>
            <p className="text-sm font-medium">{course.syllabusTitle || '—'}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <XCircle className="w-4 h-4" />
              <span className="text-sm">Trường</span>
            </div>
            <p className="text-sm font-medium">{course.schoolName || 'Tất cả'}</p>
          </div>
        </div>
      )}

      {/* Modules Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Danh sách Modules</h2>
        <Button onClick={() => setModuleModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Thêm Module
        </Button>
      </div>

      {/* Modules List */}
      {modulesLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : modules.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Chưa có module nào. Hãy thêm module đầu tiên!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {modules.map((module, index) => (
            <ModuleCard
              key={module.id}
              module={module}
              index={index}
              expanded={expandedModules.has(module.id)}
              onToggle={() => toggleModule(module.id)}
              onEdit={() => {
                setSelectedModule(module);
                setEditModuleModalOpen(true);
              }}
              onView={() => {
                setSelectedModule(module);
                setViewModuleModalOpen(true);
              }}
              onDelete={() => {
                setSelectedModule(module);
                setDeleteModuleConfirmOpen(true);
              }}
              onAddLesson={() => {
                setSelectedModule(module);
                setLessonModalOpen(true);
              }}
              onEditLesson={(lesson) => {
                setSelectedLesson(lesson);
                setEditLessonModalOpen(true);
              }}
              onViewLesson={(lesson) => {
                setSelectedLesson(lesson);
                setViewLessonModalOpen(true);
              }}
              onDeleteLesson={(lesson) => {
                setSelectedLesson(lesson);
                setDeleteLessonConfirmOpen(true);
              }}
              moduleId={module.id}
            />
          ))}
        </div>
      )}

      {/* Create Module Modal */}
      <Modal
        isOpen={moduleModalOpen}
        onClose={() => {
          setModuleModalOpen(false);
          setModuleError(null);
        }}
        title="Thêm Module mới"
        size="lg"
      >
        <ModuleForm
          onSubmit={(data) => createModuleMutation.mutate(data)}
          onCancel={() => {
            setModuleModalOpen(false);
            setModuleError(null);
          }}
          loading={createModuleMutation.isPending}
          error={moduleError}
        />
      </Modal>

      {/* Edit Module Modal */}
      <Modal
        isOpen={editModuleModalOpen}
        onClose={() => {
          setEditModuleModalOpen(false);
          setSelectedModule(null);
          setModuleError(null);
        }}
        title="Chỉnh sửa Module"
        size="lg"
      >
        {selectedModule && (
          <ModuleForm
            defaultValues={{
              title: selectedModule.title,
              description: selectedModule.description,
              estimatedMinutes: selectedModule.estimatedMinutes,
              input: selectedModule.input,
              output: selectedModule.output,
            }}
            onSubmit={(data) => updateModuleMutation.mutate({ id: selectedModule.id, data })}
            onCancel={() => {
              setEditModuleModalOpen(false);
              setSelectedModule(null);
              setModuleError(null);
            }}
            loading={updateModuleMutation.isPending}
            error={moduleError}
          />
        )}
      </Modal>

      {/* Delete Module Confirm */}
      <ConfirmDialog
        isOpen={deleteModuleConfirmOpen}
        onClose={() => {
          setDeleteModuleConfirmOpen(false);
          setSelectedModule(null);
        }}
        onConfirm={() => selectedModule && deleteModuleMutation.mutate(selectedModule.id)}
        title="Xóa Module"
        message={`Bạn có chắc muốn xóa module "${selectedModule?.title}"? Tất cả bài học trong module này cũng sẽ bị xóa.`}
        confirmText="Xóa"
        loading={deleteModuleMutation.isPending}
      />

      {/* View Module Detail Modal */}
      <Modal
        isOpen={viewModuleModalOpen}
        onClose={() => {
          setViewModuleModalOpen(false);
          setSelectedModule(null);
        }}
        title="Chi tiết Module"
        size="lg"
      >
        {selectedModule && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-border">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold">{selectedModule.title}</h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <ListChecks className="w-4 h-4" />
                    {selectedModule.lessonCount || 0} bài
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {selectedModule.estimatedMinutes || 0} phút
                  </span>
                </div>
              </div>
            </div>
            
            {selectedModule.description && (
              <div className="pt-3">
                <p className="text-sm text-muted-foreground mb-1">Mô tả</p>
                <p className="font-medium">{selectedModule.description}</p>
              </div>
            )}

            <div className="pt-3 space-y-4">
              {selectedModule.input && (
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-bold">IN</span>
                    Điều kiện tiên quyết
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg text-sm leading-relaxed">
                    <ul className="list-disc pl-5 space-y-1">
                      {selectedModule.input.split('\n').filter(Boolean).map((item, idx) => (
                        <li key={idx}>{item.trim()}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {selectedModule.output && (
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400 font-semibold mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-green-100 dark:bg-green-900 flex items-center justify-center text-xs font-bold">OUT</span>
                    Kết quả đạt được
                  </p>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg text-sm leading-relaxed">
                    <ul className="list-disc pl-5 space-y-1">
                      {selectedModule.output.split('\n').filter(Boolean).map((item, idx) => (
                        <li key={idx}>{item.trim()}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setViewModuleModalOpen(false)}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Lesson Modal */}
      <Modal
        isOpen={lessonModalOpen}
        onClose={() => {
          setLessonModalOpen(false);
          setLessonError(null);
        }}
        title={`Thêm Bài học - ${selectedModule?.title || ''}`}
        size="lg"
      >
        <LessonForm
          onSubmit={(data) =>
            selectedModule && createLessonMutation.mutate({ moduleId: selectedModule.id, data })
          }
          onCancel={() => {
            setLessonModalOpen(false);
            setLessonError(null);
          }}
          loading={createLessonMutation.isPending}
          error={lessonError}
        />
      </Modal>

      {/* Edit Lesson Modal */}
      <Modal
        isOpen={editLessonModalOpen}
        onClose={() => {
          setEditLessonModalOpen(false);
          setSelectedLesson(null);
          setLessonError(null);
        }}
        title="Chỉnh sửa Bài học"
        size="lg"
      >
        {selectedLesson && (
          <LessonForm
            defaultValues={{
              title: selectedLesson.title,
              description: selectedLesson.description,
              estimatedMinutes: selectedLesson.estimatedMinutes,
              input: selectedLesson.input,
              output: selectedLesson.output,
              content: selectedLesson.content,
            }}
            onSubmit={(data) => updateLessonMutation.mutate({ id: selectedLesson.id, data })}
            onCancel={() => {
              setEditLessonModalOpen(false);
              setSelectedLesson(null);
              setLessonError(null);
            }}
            loading={updateLessonMutation.isPending}
            error={lessonError}
          />
        )}
      </Modal>

      {/* Delete Lesson Confirm */}
      <ConfirmDialog
        isOpen={deleteLessonConfirmOpen}
        onClose={() => {
          setDeleteLessonConfirmOpen(false);
          setSelectedLesson(null);
        }}
        onConfirm={() =>
          selectedLesson && deleteLessonMutation.mutate({ id: selectedLesson.id, moduleId: selectedLesson.moduleId })
        }
        title="Xóa Bài học"
        message={`Bạn có chắc muốn xóa bài học "${selectedLesson?.title}"?`}
        confirmText="Xóa"
        loading={deleteLessonMutation.isPending}
      />

      {/* View Lesson Detail Modal */}
      <Modal
        isOpen={viewLessonModalOpen}
        onClose={() => {
          setViewLessonModalOpen(false);
          setSelectedLesson(null);
        }}
        title="Chi tiết Bài học"
        size="lg"
      >
        {selectedLesson && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-border">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{selectedLesson.title}</h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {selectedLesson.estimatedMinutes || 0} phút
                  </span>
                  {selectedLesson.lessonType && (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                      {selectedLesson.lessonType === 'theory' ? 'Lý thuyết' : 'Thực hành'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {selectedLesson.description && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Mô tả</p>
                <p className="font-medium">{selectedLesson.description}</p>
              </div>
            )}
            
            {selectedLesson.content && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Nội dung bài học</p>
                <div className="bg-muted/50 p-3 rounded-lg text-sm whitespace-pre-wrap">
                  {selectedLesson.content}
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              {selectedLesson.input && (
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-bold">IN</span>
                    Điều kiện tiên quyết
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg text-sm leading-relaxed">
                    <ul className="list-disc pl-5 space-y-1">
                      {selectedLesson.input.split('\n').filter(Boolean).map((item, idx) => (
                        <li key={idx}>{item.trim()}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {selectedLesson.output && (
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400 font-semibold mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-green-100 dark:bg-green-900 flex items-center justify-center text-xs font-bold">OUT</span>
                    Kết quả đạt được
                  </p>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg text-sm leading-relaxed">
                    <ul className="list-disc pl-5 space-y-1">
                      {selectedLesson.output.split('\n').filter(Boolean).map((item, idx) => (
                        <li key={idx}>{item.trim()}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
            
            {selectedLesson.hasVirtualLab && selectedLesson.labId && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Virtual Lab</p>
                <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                  <span className="text-purple-600 dark:text-purple-400">Lab ID: {selectedLesson.labId}</span>
                </div>
              </div>
            )}
            
            <div className="flex justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setViewLessonModalOpen(false)}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
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
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
              {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
              <p className="text-sm font-medium">{toast.message}</p>
              <button onClick={() => dismissToast(toast.id)} className="ml-2 p-1 hover:opacity-70">
                ✕
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Module Card Component
const ModuleCard = ({
  module,
  index,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onView,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onViewLesson,
  moduleId,
}: {
  module: any;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
  onAddLesson: () => void;
  onEditLesson: (lesson: any) => void;
  onDeleteLesson: (lesson: any) => void;
  onViewLesson: (lesson: any) => void;
  moduleId: number;
}) => {
  const { data: lessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ['lessons', moduleId],
    queryFn: () => lessonsApi.getByModule(moduleId),
    enabled: expanded,
  });

  const lessonList = lessons || [];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Module Header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <button className="p-1 hover:bg-muted rounded">
          {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded">
              #{index + 1}
            </span>
            <h3 className="font-semibold">{module.title}</h3>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <ListChecks className="w-3 h-3" />
              {module.lessonCount || 0} bài
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {module.estimatedMinutes || 0} phút
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="size-8" onClick={onView} title="Xem chi tiết">
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8" onClick={onAddLesson} title="Thêm bài học">
            <Plus className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8" onClick={onEdit} title="Sửa">
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={onDelete} title="Xóa">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Lessons List */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="border-t border-border"
          >
            <div className="p-4 space-y-2">
              {lessonsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : lessonList.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">Chưa có bài học nào</p>
                </div>
              ) : (
                lessonList.map((lesson: any, idx: number) => (
                  <div
                    key={lesson.id}
                    className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-xs font-medium text-muted-foreground">#{idx + 1}</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{lesson.title}</p>
                      {lesson.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {lesson.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {lesson.estimatedMinutes || 0}m
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => onViewLesson(lesson)}
                        title="Xem chi tiết"
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => onEditLesson(lesson)}
                        title="Sửa"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive"
                        onClick={() => onDeleteLesson({ ...lesson, moduleId })}
                        title="Xóa"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Module Form Component
const ModuleForm = ({
  defaultValues,
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  defaultValues?: ModuleFormData;
  onSubmit: (data: ModuleFormData) => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}) => {
  const [title, setTitle] = useState(defaultValues?.title || '');
  const [description, setDescription] = useState(defaultValues?.description || '');
  const [estimatedMinutes, setEstimatedMinutes] = useState(defaultValues?.estimatedMinutes || 60);
  const [input, setInput] = useState(defaultValues?.input || '');
  const [output, setOutput] = useState(defaultValues?.output || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ title, description, estimatedMinutes, input, output });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      <div>
        <label className="text-sm font-medium">Tên Module *</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="VD: Giới thiệu về Arduino"
          required
          className="mt-1"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Mô tả</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả ngắn về module..."
          className="mt-1"
          rows={2}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Thời lượng (phút)</label>
          <Input
            type="number"
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
            min={1}
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Input (Điều kiện tiên quyết)</label>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Những gì HS cần biết trước khi học..."
          className="mt-1"
          rows={2}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Output (Kết quả đạt được)</label>
        <Textarea
          value={output}
          onChange={(e) => setOutput(e.target.value)}
          placeholder="Những gì HS sẽ đạt được sau khi học..."
          className="mt-1"
          rows={2}
        />
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Lưu
        </Button>
      </div>
    </form>
  );
};

// Lesson Form Component
const LessonForm = ({
  defaultValues,
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  defaultValues?: LessonFormData;
  onSubmit: (data: LessonFormData) => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}) => {
  const [title, setTitle] = useState(defaultValues?.title || '');
  const [description, setDescription] = useState(defaultValues?.description || '');
  const [estimatedMinutes, setEstimatedMinutes] = useState(defaultValues?.estimatedMinutes || 30);
  const [input, setInput] = useState(defaultValues?.input || '');
  const [output, setOutput] = useState(defaultValues?.output || '');
  const [content, setContent] = useState(defaultValues?.content || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ title, description, estimatedMinutes, input, output, content });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      <div>
        <label className="text-sm font-medium">Tên Bài học *</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="VD: Cài đặt môi trường Arduino"
          required
          className="mt-1"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Mô tả</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả ngắn về bài học..."
          className="mt-1"
          rows={2}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Thời lượng (phút)</label>
        <Input
          type="number"
          value={estimatedMinutes}
          onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
          min={1}
          className="mt-1"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Input (Điều kiện tiên quyết)</label>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Những gì HS cần biết trước..."
          className="mt-1"
          rows={2}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Output (Kết quả đạt được)</label>
        <Textarea
          value={output}
          onChange={(e) => setOutput(e.target.value)}
          placeholder="Những gì HS sẽ đạt được..."
          className="mt-1"
          rows={2}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Nội dung bài học</label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Nội dung chi tiết bài học..."
          className="mt-1"
          rows={4}
        />
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Lưu
        </Button>
      </div>
    </form>
  );
};

export default CourseDetailPage;
