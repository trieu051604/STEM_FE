import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, BookOpen, Layers, FileText, FlaskConical, Loader2 } from 'lucide-react';
import { syllabusApi } from '@/services/syllabusApi';
import { Button } from '@/components/ui/button';

export const SyllabusDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const syllabusId = Number(id);

  const { data: syllabus, isLoading: loadingDetail } = useQuery({
    queryKey: ['standard-syllabus', syllabusId],
    queryFn: () => syllabusApi.getById(syllabusId),
    enabled: !!syllabusId,
  });

  const { data: structure, isLoading: loadingStructure } = useQuery({
    queryKey: ['standard-syllabus-structure', syllabusId],
    queryFn: () => syllabusApi.getStructure(syllabusId),
    enabled: !!syllabusId,
  });

  if (loadingDetail || loadingStructure) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!syllabus || !structure) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Không tìm thấy chương trình khung.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/dashboard/syllabuses" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="w-4 h-4" />
        Quay lại danh sách
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{syllabus.title}</h1>
        <p className="text-gray-500 dark:text-gray-400">{syllabus.description || 'Chưa có mô tả.'}</p>
        <div className="flex flex-wrap gap-2 mt-3 text-xs">
          <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700">{syllabus.subjectArea || 'Chưa phân loại'}</span>
          {syllabus.gradeLevelName && (
            <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700">{syllabus.gradeLevelName}</span>
          )}
          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">{syllabus.estimatedHours}h</span>
          {syllabus.isSystemOwned && (
            <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700">Chương trình hệ thống</span>
          )}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Cấu trúc chương trình
        </h2>

        {structure.courses.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Chưa có Course nào được gắn với chương trình khung này.
          </p>
        ) : (
          <div className="space-y-6">
            {structure.courses.map((course) => (
              <div key={course.id} className="border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 font-semibold text-sm mb-3">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  {course.title}
                  {course.schoolId == null ? (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Course hệ thống</span>
                  ) : (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">School #{course.schoolId}</span>
                  )}
                </div>

                <div className="space-y-3 pl-4 border-l-2 border-border">
                  {[...course.modules]
                    .sort((a, b) => {
                      const orderA = a.displayOrder ?? 0;
                      const orderB = b.displayOrder ?? 0;
                      if (orderA !== orderB) return orderA - orderB;
                      return a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
                    })
                    .map((module) => {
                      const sortedLessons = [...(module.lessons || [])].sort((a, b) => {
                        const orderA = a.displayOrder ?? 0;
                        const orderB = b.displayOrder ?? 0;
                        if (orderA !== orderB) return orderA - orderB;
                        return a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
                      });

                      return (
                        <div key={module.id}>
                          <div className="flex items-center gap-2 text-sm font-medium mb-2">
                            <Layers className="w-4 h-4 text-purple-500" />
                            {module.title}
                          </div>
                          <div className="space-y-1.5 pl-4 border-l-2 border-border/60">
                            {sortedLessons.map((lesson) => (
                              <div key={lesson.id} className="flex items-center justify-between gap-2 text-sm py-1">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-3.5 h-3.5 text-gray-400" />
                                  <span>{lesson.title}</span>
                                </div>
                                {lesson.hasVirtualLab && lesson.lab && (
                                  <Link to={`/dashboard/virtual-lab/${lesson.lab.id}`}>
                                    <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs">
                                      <FlaskConical className="w-3.5 h-3.5" />
                                      Mở Virtual Lab
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            ))}
                            {sortedLessons.length === 0 && (
                              <p className="text-xs text-muted-foreground py-1">Chưa có Lesson nào.</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  {course.modules.length === 0 && (
                    <p className="text-xs text-muted-foreground">Chưa có Module nào.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SyllabusDetailPage;
