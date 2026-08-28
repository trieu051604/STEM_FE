import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BookOpen,
  GraduationCap,
  Layers,
  FileText,
  Beaker,
  ChevronRight,
  Loader2,
  RefreshCw,
  Eye,
  FlaskConical,
  ArrowDown,
  ArrowUp,
  Target,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from './components/DataTable';
import { syllabiApi, modulesApi, lessonsApi, Syllabus, CourseInSyllabus, ModuleInCourse, LessonInModule } from '@/services/curriculumApi';

export const SyllabusViewerPage = () => {
  const [selectedSyllabus, setSelectedSyllabus] = useState<Syllabus | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseInSyllabus | null>(null);
  const [selectedModule, setSelectedModule] = useState<ModuleInCourse | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Lấy danh sách Syllabus Engineering được phân phối cho trường
  const { data: syllabi, isLoading: syllabiLoading, refetch } = useQuery({
    queryKey: ['school-engineering-syllabi'],
    queryFn: async () => {
      const allSyllabi = await syllabiApi.getAll({
        status: 'published',
        subjectArea: 'engineering'
      });
      return allSyllabi;
    },
  });

  const { data: syllabusDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['syllabus-detail', selectedSyllabus?.id],
    queryFn: async () => {
      if (!selectedSyllabus?.id) return null;
      return syllabiApi.getById(selectedSyllabus.id);
    },
    enabled: !!selectedSyllabus?.id,
  });

  const handleViewSyllabus = (syllabus: Syllabus) => {
    setSelectedSyllabus(syllabus);
    setSelectedCourse(null);
    setSelectedModule(null);
    setDetailModalOpen(true);
  };

  // Nhóm theo Khối lớp (Grade Level)
  const groupedByGrade = syllabi?.reduce((acc, s) => {
    const grade = s.gradeLevelName || 'Chưa phân loại';
    if (!acc[grade]) acc[grade] = [];
    acc[grade].push(s);
    return acc;
  }, {} as Record<string, Syllabus[]>) || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Khung chương trình</h1>
          <p className="text-muted-foreground">
            Xem chương trình giảng dạy được cấp từ STEM Platform
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className={`w-4 h-4 ${syllabiLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Info Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
        <FlaskConical className="w-5 h-5 text-primary shrink-0" />
        <div>
          <p className="text-sm font-medium">Virtual Lab - Phòng thí nghiệm ảo</p>
          <p className="text-sm text-muted-foreground">
            Chương trình giáo dục STEM theo chuẩn Bộ GD&ĐT Việt Nam. Có tích hợp phòng thí nghiệm ảo (Virtual Lab). Chỉ có quyền xem.
          </p>
        </div>
      </div>

      {/* Syllabus List by Grade */}
      {syllabiLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : !syllabi?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <FlaskConical className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Chưa có chương trình nào được cấp cho trường.</p>
          <p className="text-sm mt-1">Liên hệ STEM Platform để được cấp chương trình giảng dạy.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByGrade).map(([grade, items]) => (
            <div key={grade} className="space-y-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">{grade}</h2>
                <span className="text-sm text-muted-foreground">({items.length} chương trình)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((syllabus) => (
                  <motion.div
                    key={syllabus.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-xl border border-border p-5 hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => handleViewSyllabus(syllabus)}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <BookOpen className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{syllabus.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {syllabus.description || 'Không có mô tả'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Layers className="w-4 h-4" />
                        {syllabus.totalModules} chương
                      </span>
                      <span className="flex items-center gap-1">
                        <Beaker className="w-4 h-4" />
                        {syllabus.totalLessons} bài
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {syllabus.estimatedHours}h ước tính
                      </span>
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4 mr-1" />
                        Xem chi tiết
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Syllabus Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedSyllabus(null);
          setSelectedCourse(null);
          setSelectedModule(null);
        }}
        title={selectedSyllabus?.title || 'Chi tiết Chương trình Science'}
        size="5xl"
      >
        {detailLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : syllabusDetail ? (
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
            {/* Syllabus Info */}
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">{syllabusDetail.title}</h3>
              </div>
              {syllabusDetail.description && (
                <p className="text-sm text-muted-foreground">{syllabusDetail.description}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span>{syllabusDetail.totalModules} chương</span>
                <span>{syllabusDetail.totalLessons} bài học</span>
                <span>{syllabusDetail.estimatedHours}h</span>
              </div>
            </div>

            {/* Breadcrumb */}
            {(selectedCourse || selectedModule) && (
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <button
                  onClick={() => { setSelectedCourse(null); setSelectedModule(null); }}
                  className="text-primary hover:underline"
                >
                  {syllabusDetail.title}
                </button>
                {selectedCourse && (
                  <>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    {selectedModule ? (
                      <button
                        onClick={() => setSelectedModule(null)}
                        className="text-primary hover:underline"
                      >
                        {selectedCourse.title}
                      </button>
                    ) : (
                      <span className="text-foreground">{selectedCourse.title}</span>
                    )}
                  </>
                )}
                {selectedModule && (
                  <>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{selectedModule.title}</span>
                  </>
                )}
              </div>
            )}

            {/* === HIỂN THỊ MODULES (CHƯƠNG) === */}
            {!selectedModule ? (
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Danh sách Chương ({syllabusDetail.courses?.[0]?.modules?.length || 0})
                </h4>

                {/* Lấy modules từ course đầu tiên (vì mỗi syllabus chỉ có 1 môn Science) */}
                {([...(syllabusDetail.courses?.[0]?.modules || [])])
                  .sort((a, b) => {
                    const orderA = a.displayOrder ?? 0;
                    const orderB = b.displayOrder ?? 0;
                    if (orderA !== orderB) return orderA - orderB;
                    return a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
                  })
                  .map((module, index) => (
                  <div
                    key={module.id}
                    className="bg-card rounded-lg border border-border p-4 hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedModule(module)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                          <span className="text-purple-600 dark:text-purple-400 font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <h5 className="font-semibold">{module.title}</h5>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {module.description || 'Không có mô tả'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                    </div>

                    {/* INPUT & OUTPUT cho Module (Chương) */}
                    {module.input && (
                      <div className="mt-2.5 text-xs text-muted-foreground">
                        <strong className="text-foreground/80 font-medium block mb-1">Yêu cầu:</strong>
                        <div className="pl-2.5 border-l border-border/60 space-y-0.5">
                          {module.input.split('\n').filter(Boolean).map((item, idx) => (
                            <span key={idx} className="block text-[11px]">— {item.trim()}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {module.output && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <strong className="text-foreground/80 font-medium block mb-1">Kết quả:</strong>
                        <div className="pl-2.5 border-l border-border/60 space-y-0.5">
                          {module.output.split('\n').filter(Boolean).map((item, idx) => (
                            <span key={idx} className="block text-[11px]">— {item.trim()}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{module.lessons?.length || 0} bài học</span>
                      <span>{module.estimatedMinutes} phút</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* === HIỂN THỊ LESSONS (BÀI) === */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium flex items-center gap-2">
                    <Beaker className="w-4 h-4" />
                    Bài học trong Chương "{selectedModule.title}"
                  </h4>
                  <Button size="sm" variant="outline" onClick={() => setSelectedModule(null)}>
                    ← Quay lại
                  </Button>
                </div>

                {/* INPUT & OUTPUT cho Module (hiển thị lại) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-muted/20 border border-border/40 p-3 rounded-lg text-sm mb-3">
                  {selectedModule.input && (
                    <div>
                      <strong className="text-foreground/80 font-medium block mb-1">Yêu cầu chung:</strong>
                      <div className="pl-2.5 border-l border-border/60 space-y-0.5 text-xs text-muted-foreground">
                        {selectedModule.input.split('\n').filter(Boolean).map((item, idx) => (
                          <span key={idx} className="block">— {item.trim()}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedModule.output && (
                    <div>
                      <strong className="text-foreground/80 font-medium block mb-1">Mục tiêu chương:</strong>
                      <div className="pl-2.5 border-l border-border/60 space-y-0.5 text-xs text-muted-foreground">
                        {selectedModule.output.split('\n').filter(Boolean).map((item, idx) => (
                          <span key={idx} className="block">— {item.trim()}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Danh sách Bài học */}
                <div className="space-y-3 mt-4">
                  {([...(selectedModule.lessons || [])])
                    .sort((a, b) => {
                      const orderA = a.displayOrder ?? 0;
                      const orderB = b.displayOrder ?? 0;
                      if (orderA !== orderB) return orderA - orderB;
                      return a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
                    })
                    .map((lesson, index) => (
                    <div
                      key={lesson.id}
                      className="bg-card rounded-lg border border-border p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-primary font-semibold text-sm">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium">{lesson.title}</h5>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="px-2 py-0.5 bg-muted rounded text-[11px] font-medium">
                              {lesson.lessonType === 'theory' ? 'Lý thuyết' : lesson.lessonType === 'lab' ? 'Thực hành' : lesson.lessonType}
                            </span>
                            <span>{lesson.estimatedMinutes} phút</span>
                            {lesson.hasVirtualLab && (
                              <span className="flex items-center gap-1 text-orange-600">
                                <Beaker className="w-3 h-3" />
                                Lab
                              </span>
                            )}
                          </div>

                          {/* INPUT & OUTPUT cho Lesson (Bài) */}
                          {lesson.input && (
                            <div className="mt-2.5 text-xs text-muted-foreground">
                              <strong className="text-foreground/75 font-semibold block mb-1">Yêu cầu:</strong>
                              <div className="pl-2.5 border-l border-border/50 space-y-0.5">
                                {lesson.input.split('\n').filter(Boolean).map((item: string, idx: number) => (
                                  <span key={idx} className="block text-[11px]">— {item.trim()}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {lesson.output && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              <strong className="text-foreground/75 font-semibold block mb-1">Kết quả:</strong>
                              <div className="pl-2.5 border-l border-border/50 space-y-0.5">
                                {lesson.output.split('\n').filter(Boolean).map((item: string, idx: number) => (
                                  <span key={idx} className="block text-[11px]">— {item.trim()}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default SyllabusViewerPage;
