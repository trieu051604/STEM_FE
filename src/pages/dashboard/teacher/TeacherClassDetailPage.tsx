import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, User, Calendar, MapPin, Clock, Users, CheckCircle, FileText, Cpu, Loader2, FlaskConical, ClipboardCheck, ChevronDown, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WeeklyScheduleGrid } from '@/components/WeeklyScheduleGrid';
import { teacherApi, TeacherClassDetail } from '@/services/teacherStudentApi';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function TeacherClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'schedule'>('overview');

  const { data: classDetail, isLoading } = useQuery({
    queryKey: ['teacher-class-detail', id],
    queryFn: () => teacherApi.getClassDetail(Number(id)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!classDetail) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Không tìm thấy lớp học</h2>
        <Link to="/dashboard/teacher/classes">
          <Button variant="outline">Quay lại danh sách lớp</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/dashboard/teacher/classes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{classDetail.name}</h1>
              <p className="text-muted-foreground">{classDetail.courseName}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                classDetail.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                classDetail.status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              }`}>
                {classDetail.status === 'active' ? 'Đang dạy' : classDetail.status === 'completed' ? 'Hoàn thành' : 'Sắp bắt đầu'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <BookOpen className="w-4 h-4 inline mr-2" />
          Giáo trình
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'students'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Học sinh ({classDetail.students?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'schedule'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-2" />
          Lịch dạy
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab classDetail={classDetail} />}
      {activeTab === 'students' && <StudentsTab classDetail={classDetail} />}
      {activeTab === 'schedule' && (
        <div className="bg-card rounded-xl border border-border p-6 min-h-[600px]">
          <WeeklyScheduleGrid
            classId={Number(id)}
            classInfo={{ id: classDetail.id, classCode: classDetail.name, className: classDetail.courseName }}
            isAdmin={false}
            isStudentView={false}
          />
        </div>
      )}
    </div>
  );
}

// Overview Tab - Shows Modules and Lessons
function OverviewTab({ classDetail }: { classDetail: TeacherClassDetail }) {
  const queryClient = useQueryClient();
  const [expandedModuleId, setExpandedModuleId] = useState<number | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [isAssigningLab, setIsAssigningLab] = useState(false);
  const [labIdToAssign, setLabIdToAssign] = useState('');
  const [assignLabError, setAssignLabError] = useState<string | null>(null);

  // Fetch curriculum data with lessons
  const { data: curriculumData, isLoading, error } = useQuery({
    queryKey: ['teacher-class-curriculum', classDetail.id],
    queryFn: async () => {
      const { classesApi } = await import('@/services/dashboardApi');
      return classesApi.getCurriculum(classDetail.id);
    },
    enabled: !!classDetail.id,
  });

  // Fetch lesson detail when selected
  const { data: lessonDetail } = useQuery({
    queryKey: ['lesson-detail', selectedLessonId],
    queryFn: async () => {
      if (!selectedLessonId) return null;
      const { lessonsApi } = await import('@/services/curriculumApi');
      return lessonsApi.getById(selectedLessonId);
    },
    enabled: !!selectedLessonId,
  });

  // Toàn bộ buổi dạy (Schedule) của lớp này — Lesson không tự lưu "lab của
  // mình", việc gán lab -> bài học đi qua Schedule.lessonId (mỗi buổi dạy đã
  // trỏ sẵn về 1 bài học). Lấy cả danh sách (không chỉ buổi dạy của bài đang
  // xem) để suy ra TÊN bài học mà 1 lab đang bị chiếm chỗ, phục vụ cảnh báo
  // "lab đã được gán ở bài khác".
  const { data: classSchedules } = useQuery({
    queryKey: ['teacher-class-schedules', classDetail.id],
    queryFn: async () => {
      const { schedulesApi } = await import('@/services/dashboardApi');
      return schedulesApi.getByClass(classDetail.id);
    },
    enabled: !!selectedLessonId,
  });

  const lessonSchedule = selectedLessonId
    ? classSchedules?.find((s) => s.lessonId === selectedLessonId) ?? null
    : null;

  // Labs của lớp này — dùng để: (1) tìm lab nào đang gắn sẵn với buổi dạy của
  // bài học đang xem (qua lab.classes[].scheduleId), (2) làm danh sách chọn
  // khi gán/đổi lab.
  const { data: classLabs } = useQuery({
    queryKey: ['teacher-class-labs', classDetail.id],
    queryFn: async () => {
      const { labsApi } = await import('@/services/dashboardApi');
      const result = await labsApi.getAll({ classId: classDetail.id, pageSize: 100 });
      return result.items;
    },
    enabled: !!selectedLessonId,
  });

  const currentLab = lessonSchedule
    ? classLabs?.find((lab) =>
        lab.classes.some((c) => c.id === classDetail.id && c.scheduleId === lessonSchedule.id)
      ) ?? null
    : null;

  // Mỗi lab chỉ được gán cho đúng 1 bài học — nếu lab đang được chọn đã bị
  // chiếm bởi 1 buổi dạy khác (ở lớp này hoặc lớp khác), KHÔNG tự âm thầm gỡ
  // chỗ cũ; báo cho giáo viên biết để họ tự quyết định (qua bài học đang giữ
  // lab đó), thay vì tự động hoán đổi.
  const getLabConflict = (lab: NonNullable<typeof classLabs>[number]): string | null => {
    const heldAssignment = lab.classes.find((c) => c.scheduleId);
    if (!heldAssignment || !heldAssignment.scheduleId) return null;
    if (lessonSchedule && heldAssignment.scheduleId === lessonSchedule.id) return null;

    if (heldAssignment.id === classDetail.id) {
      const schedule = classSchedules?.find((s) => s.id === heldAssignment.scheduleId);
      return schedule?.lessonTitle
        ? `đã gán cho bài "${schedule.lessonTitle}"`
        : 'đã gán cho một bài học khác';
    }
    return 'đã gán cho một bài học ở lớp khác';
  };

  const assignLabMutation = useMutation({
    mutationFn: async (labId: string | null) => {
      if (!lessonSchedule) return;
      const { labsApi } = await import('@/services/dashboardApi');

      // Gỡ lab đang gắn cho CHÍNH bài học này (nếu có) trước — đây là thao
      // tác "Đổi lab" giáo viên chủ động làm cho bài học đang xem, khác với
      // việc tự động gỡ lab khỏi MỘT BÀI HỌC KHÁC (bị chặn ở getLabConflict).
      if (currentLab && currentLab.id !== labId) {
        await labsApi.update(currentLab.id, {
          title: currentLab.title,
          description: currentLab.description,
          category: currentLab.category as any,
          thumbnailUrl: currentLab.thumbnailUrl,
          simulationMode: currentLab.simulationMode as any,
          boardType: currentLab.boardType as any,
          starterCode: currentLab.starterCode,
          circuitConfig: currentLab.circuitConfig,
          allowedComponentTypes: currentLab.allowedComponentTypes,
          wokwiProjectId: currentLab.wokwiProjectId,
          wokwiProjectUrl: currentLab.wokwiProjectUrl,
          classIds: currentLab.classIds,
          status: currentLab.status as any,
          linkedAssignmentId: currentLab.linkedAssignmentId,
          scheduleId: null,
        });
      }

      if (labId) {
        const lab = classLabs?.find((l) => l.id === labId);
        if (!lab) return;
        await labsApi.update(lab.id, {
          title: lab.title,
          description: lab.description,
          category: lab.category as any,
          thumbnailUrl: lab.thumbnailUrl,
          simulationMode: lab.simulationMode as any,
          boardType: lab.boardType as any,
          starterCode: lab.starterCode,
          circuitConfig: lab.circuitConfig,
          allowedComponentTypes: lab.allowedComponentTypes,
          wokwiProjectId: lab.wokwiProjectId,
          wokwiProjectUrl: lab.wokwiProjectUrl,
          // Chỉ 1 lớp — mỗi lab chỉ được gán cho đúng 1 bài học tại một thời
          // điểm, nên không giữ lại các lớp khác lab này từng gán trước đó
          // (tránh vô tình áp scheduleId của bài học này lên buổi dạy của
          // một lớp/bài học không liên quan).
          classIds: [classDetail.id],
          status: lab.status as any,
          linkedAssignmentId: lab.linkedAssignmentId,
          scheduleId: lessonSchedule.id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-class-labs', classDetail.id] });
      setIsAssigningLab(false);
      setLabIdToAssign('');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-2">Lỗi khi tải giáo trình</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  const modules = curriculumData?.modules || [];

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Modules with Lessons */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Giáo trình khóa học</h3>
          </div>
          
          <div className="space-y-3">
            {modules.length > 0 ? (
              [...modules]
                .sort((a, b) => {
                  const orderA = a.displayOrder ?? 0;
                  const orderB = b.displayOrder ?? 0;
                  if (orderA !== orderB) return orderA - orderB;
                  return a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
                })
                .map((module, mIdx) => (
                <div key={module.id} className="border border-border rounded-lg overflow-hidden">
                  {/* Module Header */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedModuleId(expandedModuleId === module.id ? null : module.id)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                        {module.displayOrder || (mIdx + 1)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{module.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {module.lessonCount} bài học
                        {module.estimatedMinutes && ` • ${module.estimatedMinutes} phút`}
                      </p>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedModuleId === module.id ? 'rotate-180' : ''}`} />
                  </div>

                  {/* Lessons List (Expanded) */}
                  {expandedModuleId === module.id && (
                    <div className="border-t border-border bg-muted/20">
                      {module.lessons?.length > 0 ? (
                        <div className="p-4 space-y-2">
                          {[...(module.lessons || [])]
                            .sort((a, b) => {
                              const orderA = a.displayOrder ?? 0;
                              const orderB = b.displayOrder ?? 0;
                              if (orderA !== orderB) return orderA - orderB;
                              return a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
                            })
                            .map((lesson, lIdx) => (
                            <div key={lesson.id} className="flex items-center gap-3 p-3 bg-card rounded-lg">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <span className="text-xs font-medium text-primary">
                                  {lesson.displayOrder || (lIdx + 1)}
                                </span>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{lesson.title}</p>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  {lesson.estimatedMinutes && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {lesson.estimatedMinutes} phút
                                    </span>
                                  )}
                                  {lesson.lessonType && (
                                    <span className="px-2 py-0.5 bg-muted rounded-full">
                                      {lesson.lessonType === 'theory' ? 'Lý thuyết' : lesson.lessonType === 'lab' ? 'Thực hành' : lesson.lessonType}
                                    </span>
                                  )}
                                  {lesson.hasVirtualLab && (
                                    <span className="flex items-center gap-1 text-purple-600">
                                      <FlaskConical className="w-3 h-3" />
                                      Lab
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedLessonId(lesson.id);
                                  setIsAssigningLab(false);
                                  setLabIdToAssign('');
                                  setAssignLabError(null);
                                }}
                              >
                                Xem
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                          Chưa có bài học nào trong chương này
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">Chưa có giáo trình</h3>
                <p className="text-muted-foreground mb-4">Khóa học này chưa có giáo trình được thiết lập</p>
                <Link to={`/dashboard/admin/courses/${classDetail.courseId}/curriculum`}>
                  <Button>Thiết lập giáo trình</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Class Info */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h3 className="text-lg font-semibold">Thông tin lớp học</h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Mã lớp:</span>
              <span className="font-medium">{classDetail.name}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Bắt đầu:</span>
              <span className="font-medium">
                {classDetail.startDate ? format(new Date(classDetail.startDate), 'dd/MM/yyyy') : '—'}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Kết thúc:</span>
              <span className="font-medium">
                {classDetail.endDate ? format(new Date(classDetail.endDate), 'dd/MM/yyyy') : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h3 className="text-lg font-semibold">Thống kê</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{modules.length}</p>
              <p className="text-xs text-muted-foreground">Chương</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{classDetail.students?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Học sinh</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Lesson Detail Modal */}
    {selectedLessonId && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-card rounded-xl border border-border w-full max-w-2xl max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">{lessonDetail?.title || 'Đang tải...'}</h2>
            <button
              onClick={() => {
                setSelectedLessonId(null);
                setIsAssigningLab(false);
                setLabIdToAssign('');
                setAssignLabError(null);
              }}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
            {lessonDetail ? (
              <>
                {/* Lesson Info */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">#{lessonDetail.displayOrder}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {lessonDetail.estimatedMinutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {lessonDetail.estimatedMinutes} phút
                      </span>
                    )}
                    {lessonDetail.lessonType && (
                      <span className="px-2 py-0.5 bg-muted rounded-full">{lessonDetail.lessonType}</span>
                    )}
                  </div>
                </div>

                {/* Input - Đầu vào */}
                {lessonDetail.input && (
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Đầu vào (Input)
                    </h3>
                    <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                      {lessonDetail.input}
                    </p>
                  </div>
                )}

                {/* Output - Đầu ra */}
                {lessonDetail.output && (
                  <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h3 className="font-semibold text-green-700 dark:text-green-300 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Đầu ra (Output)
                    </h3>
                    <p className="text-sm text-green-800 dark:text-green-200 whitespace-pre-wrap">
                      {lessonDetail.output}
                    </p>
                  </div>
                )}

                {/* Content */}
                {lessonDetail.content && (
                  <div className="prose prose-sm max-w-none">
                    <h3 className="font-semibold mb-2">Nội dung bài học</h3>
                    <div dangerouslySetInnerHTML={{ __html: lessonDetail.content }} />
                  </div>
                )}

                {/* Virtual Lab Assignment — gán qua buổi dạy (Schedule) đã trỏ tới
                    bài học này, vì Lesson không lưu lab của riêng nó. */}
                <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                      <FlaskConical className="w-5 h-5" />
                      <span className="font-medium">Bài thực hành Lab ảo</span>
                    </div>
                    {!isAssigningLab && lessonSchedule && (
                      <button
                        type="button"
                        onClick={() => {
                          setLabIdToAssign(currentLab?.id || '');
                          setIsAssigningLab(true);
                        }}
                        className="text-xs font-semibold text-purple-700 dark:text-purple-300 hover:underline shrink-0"
                      >
                        {currentLab ? 'Đổi lab' : '+ Gán lab'}
                      </button>
                    )}
                  </div>

                  {!isAssigningLab && !lessonSchedule && (
                    <p className="text-sm text-purple-600 dark:text-purple-400">
                      Bài học này chưa có buổi dạy trong Lịch dạy hàng tuần, nên chưa thể gán lab. Hãy tạo lịch dạy cho bài học này trước.
                    </p>
                  )}

                  {!isAssigningLab && lessonSchedule && (
                    <p className="text-sm text-purple-600 dark:text-purple-400">
                      {currentLab ? `Đã gán: ${currentLab.title}` : 'Bài học này chưa có phòng lab ảo.'}
                    </p>
                  )}

                  {isAssigningLab && (
                    <div className="space-y-2">
                      <select
                        value={labIdToAssign}
                        onChange={(e) => {
                          setLabIdToAssign(e.target.value);
                          setAssignLabError(null);
                        }}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Chọn phòng lab ảo...</option>
                        {(classLabs || []).map((lab) => {
                          const conflict = getLabConflict(lab);
                          return (
                            <option key={lab.id} value={lab.id}>
                              {lab.title}
                              {conflict ? ` (${conflict})` : ''}
                            </option>
                          );
                        })}
                      </select>
                      {classLabs && classLabs.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          Lớp này chưa có phòng lab ảo nào. Tạo lab mới ở mục "Phòng lab ảo".
                        </p>
                      )}
                      {assignLabError && (
                        <p className="text-xs text-destructive">{assignLabError}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          disabled={!labIdToAssign || assignLabMutation.isPending}
                          onClick={() => {
                            const lab = classLabs?.find((l) => l.id === labIdToAssign);
                            const conflict = lab ? getLabConflict(lab) : null;
                            if (conflict) {
                              setAssignLabError(
                                `Lab "${lab?.title}" ${conflict}. Vui lòng bỏ gán ở bài học đó trước khi gán cho bài học này.`
                              );
                              return;
                            }
                            setAssignLabError(null);
                            assignLabMutation.mutate(labIdToAssign);
                          }}
                        >
                          Lưu
                        </Button>
                        {currentLab && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={assignLabMutation.isPending}
                            onClick={() => assignLabMutation.mutate(null)}
                          >
                            Bỏ gán
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={assignLabMutation.isPending}
                          onClick={() => {
                            setIsAssigningLab(false);
                            setLabIdToAssign('');
                            setAssignLabError(null);
                          }}
                        >
                          Hủy
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
          </div>
        </div>
      </div>
    )}
  </>
  );
}

// Students Tab
function StudentsTab({ classDetail }: { classDetail: TeacherClassDetail }) {
  const students = classDetail.students || [];

  if (students.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-medium mb-2">Chưa có học sinh</h3>
        <p className="text-muted-foreground">Lớp học này chưa có học sinh đăng ký</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold">Danh sách học sinh ({students.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">STT</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Họ tên</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Ngày đăng ký</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {students.map((student, index) => (
              <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-sm">{index + 1}</td>
                <td className="px-4 py-3 text-sm font-medium">{student.fullName}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{student.email}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {student.enrolledAt ? format(new Date(student.enrolledAt), 'dd/MM/yyyy') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
