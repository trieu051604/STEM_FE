import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, User, Calendar, MapPin, Clock, Play, CheckCircle, FileText, Cpu, Loader2, FlaskConical, ClipboardCheck, XCircle, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/Icon';
import { WeeklyScheduleGrid } from '@/components/WeeklyScheduleGrid';
import { studentApi, StudentClassDetail, StudentAssignment } from '@/services/teacherStudentApi';
import { labsApi } from '@/services/dashboardApi';
import { scheduleApi, type ScheduleResponse } from '@/services/schoolAdminApi';
import { attendanceApi, type AttendanceRecord, type AttendanceStatus } from '@/services/dashboardApi';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuthStore } from '@/stores/authStore';

export default function StudentClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'assignments' | 'schedule' | 'virtualLabs' | 'attendance'>('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [updatingSlotId, setUpdatingSlotId] = useState<number | null>(null);

  const { data: classDetail, isLoading } = useQuery({
    queryKey: ['student-class-detail', classId],
    queryFn: () => studentApi.getClassDetail(Number(classId)),
    enabled: !!classId,
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
        <Link to="/dashboard/student/classes">
          <Button variant="outline">Quay lại danh sách lớp</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/dashboard/student/classes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{classDetail.className}</h1>
              <p className="text-muted-foreground">{classDetail.courseName}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              classDetail.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
              classDetail.status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
              'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            }`}>
              {classDetail.status === 'active' ? 'Đang học' : classDetail.status === 'completed' ? 'Hoàn thành' : 'Sắp bắt đầu'}
            </span>
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
          <Icon name="BookOpen" className="w-4 h-4 inline mr-2" />
          Tổng quan
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'assignments'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon name="ClipboardList" className="w-4 h-4 inline mr-2" />
          Bài tập
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
          Lịch học
        </button>
        <button
          onClick={() => setActiveTab('virtualLabs')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'virtualLabs'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FlaskConical className="w-4 h-4 inline mr-2" />
          Phòng Lab Ảo
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'attendance'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ClipboardCheck className="w-4 h-4 inline mr-2" />
          Điểm danh
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab classDetail={classDetail} />}
      {activeTab === 'assignments' && <AssignmentsTab classDetail={classDetail} />}
      {activeTab === 'schedule' && <ScheduleTab classId={Number(classId)} classInfo={{ classCode: classDetail.classCode, className: classDetail.className }} refreshKey={refreshKey} />}
      {activeTab === 'virtualLabs' && <VirtualLabsTab classId={Number(classId)} />}
      {activeTab === 'attendance' && <AttendanceTab classId={Number(classId)} user={user || undefined} queryClient={queryClient} />}
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ classDetail }: { classDetail: StudentClassDetail }) {
  const [expandedModuleId, setExpandedModuleId] = useState<number | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);

  // Fetch curriculum data with lessons
  const { data: curriculumData } = useQuery({
    queryKey: ['student-class-curriculum', classDetail.id],
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

  const modulesWithLessons = curriculumData?.modules || [];

  // Helper to get module info from either type
  const getModuleLessonsCount = (module: any) => {
    return module.lessonCount || module.totalLessons || 0;
  };

  const isModuleCompleted = (module: any) => {
    return module.isCompleted || false;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Progress Card */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Tiến độ học tập</h3>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Hoàn thành</span>
              <span className="font-medium">{classDetail.progress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-primary rounded-full h-3 transition-all"
                style={{ width: `${classDetail.progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Modules with Lessons */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Bài học</h3>
          <div className="space-y-3">
            {modulesWithLessons.length > 0 ? (
              modulesWithLessons.map((module) => {
                const lessonCount = getModuleLessonsCount(module);
                const completed = isModuleCompleted(module);
                return (
                  <div key={module.id} className="border border-border rounded-lg overflow-hidden">
                    {/* Module Header */}
                    <div
                      className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => setExpandedModuleId(expandedModuleId === module.id ? null : module.id)}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        completed
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : 'bg-muted'
                      }`}>
                        {completed ? (
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <BookOpen className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{module.title}</p>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedModuleId === module.id ? 'rotate-180' : ''}`} />
                    </div>

                    {/* Lessons List (Expanded) */}
                    {expandedModuleId === module.id && (
                      <div className="border-t border-border bg-muted/20">
                        {(module as any).lessons?.length > 0 ? (
                          <div className="p-4 space-y-2">
                            {(module as any).lessons.map((lesson: any) => (
                              <div key={lesson.id} className="flex items-center gap-3 p-3 bg-card rounded-lg">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                  <span className="text-xs font-medium text-primary">{lesson.displayOrder}</span>
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
                                      <span className="px-2 py-0.5 bg-muted rounded-full">{lesson.lessonType}</span>
                                    )}
                                    {lesson.hasVirtualLab && (
                                      <span className="flex items-center gap-1 text-purple-600">
                                        <FlaskConical className="w-3 h-3" />
                                        Lab
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => setSelectedLessonId(lesson.id)}>
                                  Mở
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
                );
              })
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Chưa có bài học nào
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Class Info */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h3 className="text-lg font-semibold">Thông tin lớp học</h3>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Giáo viên:</span>
              <span className="font-medium">{classDetail.teacherName}</span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Phòng:</span>
              <span className="font-medium">{classDetail.room || '—'}</span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Bắt đầu:</span>
              <span className="font-medium">
                {classDetail.startDate ? format(new Date(classDetail.startDate), 'dd/MM/yyyy') : '—'}
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
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
              <p className="text-2xl font-bold">{modulesWithLessons.length || classDetail.modules?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Chương</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{classDetail.assignments?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Bài tập</p>
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
                onClick={() => setSelectedLessonId(null)}
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

                  {/* Virtual Lab Link */}
                  {lessonDetail.hasVirtualLab && (
                    <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                        <FlaskConical className="w-5 h-5" />
                        <span className="font-medium">Bài thực hành Lab</span>
                      </div>
                      <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                        Bài học này có phòng lab ảo. Vui lòng truy cập qua tab "Phòng Lab Ảo" để thực hành.
                      </p>
                    </div>
                  )}
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
    </div>
  );
}

// Assignments Tab Component
function AssignmentsTab({ classDetail }: { classDetail: StudentClassDetail }) {
  // Use API call directly instead of nested data
  const { data: assignmentsData, isLoading } = useQuery({
    queryKey: ['student-class-assignments', classDetail.id],
    queryFn: () => studentApi.getAssignments({ classId: classDetail.id, pageSize: 50 }),
  });
  
  const assignments = assignmentsData?.items || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Chờ nộp</span>;
      case 'submitted':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Đã nộp</span>;
      case 'graded':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Đã chấm</span>;
      case 'overdue':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Quá hạn</span>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border">
      {assignments.length > 0 ? (
        <div className="divide-y divide-border">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{assignment.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      <Clock className="w-3 h-3 inline mr-1" />
                      Hạn nộp: {formatDistanceToNow(new Date(assignment.dueDate), { addSuffix: true, locale: vi })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(assignment.status)}
                  <Link to={`/dashboard/student/assignments/${assignment.id}`}>
                    <Button size="sm" variant="outline">
                      {assignment.status === 'pending' || assignment.status === 'overdue' ? 'Nộp bài' : 'Xem'}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Chưa có bài tập nào</p>
        </div>
      )}
    </div>
  );
}

// Schedule Tab Component
function ScheduleTab({ classId, classInfo, refreshKey }: { classId: number; classInfo?: { id?: number; classCode: string; className: string }; refreshKey?: number }) {
  return (
    <div className="bg-card rounded-xl border border-border p-6 min-h-[600px]">
      <WeeklyScheduleGrid
        classId={classId}
        classInfo={classInfo as { id: number; classCode: string; className: string } | undefined}
        isAdmin={false}
        isStudentView={false}
        key={`schedule-${classId}-${refreshKey || 0}`}
      />
    </div>
  );
}

// VirtualLabs Tab Component
//
// Trước đây gọi studentApi.getVirtualLabs() -> GET /api/VirtualLabs/student — hệ thống
// Virtual Lab LEGACY, tách biệt hoàn toàn với hệ thống Lab thật (đã xác nhận qua audit:
// response luôn {totalCount:0,items:[]}). Sidebar "Phòng Lab Ảo" (/dashboard/virtual-lab)
// đã được vá sang labsApi (GET /api/labs) từ trước — tab này là consumer legacy còn sót
// lại, giờ đổi sang CÙNG nguồn dữ liệu thật, filter theo classId thay vì gọi lại toàn bộ.
type LabProgressStatus = 'not_started' | 'in_progress' | 'completed';

function VirtualLabsTab({ classId }: { classId: number }) {
  const { data: labsResponse, isLoading: isLabsLoading } = useQuery({
    queryKey: ['student-class-labs', classId],
    queryFn: () => labsApi.getAll({ classId, pageSize: 100 }),
  });

  // Đọc thuần (không mutate) — xem comment ở labsApi.getMyProgress. Không dùng
  // startProgress ở đây vì gọi hàng loạt cho cả danh sách sẽ tự "start" progress
  // cho những lab Student chưa từng mở.
  const { data: progressList, isLoading: isProgressLoading } = useQuery({
    queryKey: ['student-class-lab-progress', classId],
    queryFn: () => labsApi.getMyProgress(classId),
  });

  const isLoading = isLabsLoading || isProgressLoading;

  // Phase 7: filter theo classId thật (ID), không dựa vào classCode/title —
  // phòng trường hợp API sau này không tự scope hết theo query param.
  const labs = (labsResponse?.items ?? []).filter((lab) => lab.classIds.includes(classId));

  const progressByLabId = new Map(progressList?.map((progress) => [progress.labId, progress]) ?? []);

  const getLabStatus = (labId: string): LabProgressStatus => {
    const progress = progressByLabId.get(labId);
    if (!progress) return 'not_started';
    return progress.completedAt ? 'completed' : 'in_progress';
  };

  const getStatusBadge = (status: LabProgressStatus) => {
    switch (status) {
      case 'not_started':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">Chưa làm</span>;
      case 'in_progress':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Đang làm</span>;
      case 'completed':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Hoàn thành</span>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const notStartedCount = labs.filter((lab) => getLabStatus(lab.id) === 'not_started').length;
  const inProgressCount = labs.filter((lab) => getLabStatus(lab.id) === 'in_progress').length;
  const completedCount = labs.filter((lab) => getLabStatus(lab.id) === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{labs.length}</p>
              <p className="text-sm text-muted-foreground">Tổng phòng lab</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{notStartedCount}</p>
              <p className="text-sm text-muted-foreground">Chưa làm</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Play className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{inProgressCount}</p>
              <p className="text-sm text-muted-foreground">Đang làm</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedCount}</p>
              <p className="text-sm text-muted-foreground">Hoàn thành</p>
            </div>
          </div>
        </div>
      </div>

      {/* Labs Grid */}
      {labs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {labs.map((lab) => {
            const status = getLabStatus(lab.id);
            return (
              <div key={lab.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-32 bg-gradient-to-br from-purple-500/10 to-blue-500/10 flex items-center justify-center relative">
                  <FlaskConical className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(status)}
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold line-clamp-1">{lab.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{lab.description}</p>
                  </div>
                  {/* Lab-level entity không có "score" — điểm thuộc về Submission,
                      không phải Lab (xem VIRTUAL_LAB_PLAN Submission workflow). */}
                  <Link to={`/dashboard/virtual-lab/${lab.id}`} className="block">
                    <Button className="w-full gap-2" variant={status === 'completed' ? 'outline' : 'default'}>
                      {status === 'not_started' && <><Cpu className="w-4 h-4" /> Bắt đầu</>}
                      {status === 'in_progress' && <><Play className="w-4 h-4" /> Tiếp tục</>}
                      {status === 'completed' && <><CheckCircle className="w-4 h-4" /> Xem lại</>}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <FlaskConical className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">Chưa có phòng lab nào</h3>
          <p className="text-muted-foreground">Phòng lab sẽ xuất hiện khi được giao bởi giáo viên</p>
        </div>
      )}
    </div>
  );
}

// Attendance Tab Component
function AttendanceTab({ classId, user, queryClient }: { classId: number; user?: { role: string }; queryClient: ReturnType<typeof useQueryClient> }) {
  const [updatingSlotId, setUpdatingSlotId] = useState<number | null>(null);

  // Fetch attendance data for the current student
  // Note: Do NOT pass studentId - backend will use current user's ID from token
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['student-attendance', classId],
    queryFn: () => attendanceApi.getAttendance({
      classId: Number(classId),
      pageSize: 100,
      pageNumber: 1,
    }),
    staleTime: 0,
  });

  // Fetch schedule data
  const { data: scheduleData, isLoading: scheduleLoading } = useQuery({
    queryKey: ['class-schedule', classId],
    queryFn: () => scheduleApi.getByClassId(Number(classId)),
    staleTime: 0,
  });

  // Update attendance mutation
  const updateAttendanceMutation = useMutation({
    mutationFn: async ({ recordId, status }: { recordId: number; status: AttendanceStatus }) => {
      console.log('Updating attendance:', recordId, status);
      await attendanceApi.updateAttendance(recordId, status);
    },
    onSuccess: () => {
      console.log('Update success, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['student-attendance', classId] });
      setUpdatingSlotId(null);
    },
  });

  const attendance = attendanceData?.items || [];
  const schedules = scheduleData || [];

  // Debug logging
  console.log('DEBUG attendance:', attendance);
  console.log('DEBUG schedules:', schedules);

  // Build attendance map by scheduleId (supports multiple slots per day)
  const attendanceByScheduleId = new Map<number, typeof attendance[0]>();
  attendance.forEach(a => {
    if (a.scheduleId) {
      attendanceByScheduleId.set(a.scheduleId, a);
    }
  });

  // Get all scheduled slots
  const scheduledSlots = schedules.map(s => {
    const dateStr = s.startTime.split('T')[0];
    const timeStr = s.startTime.includes('T') ? s.startTime.split('T')[1]?.substring(0, 5) : s.startTime;
    const att = attendanceByScheduleId.get(s.id) || null;
    console.log('DEBUG slot:', s.id, '-> attendance:', att);
    return {
      id: s.id,
      date: dateStr,
      time: timeStr || '--:--',
      startTime: s.startTime,
      attendance: att
    };
  });

  // Sort by startTime
  const sortedSlots = [...scheduledSlots].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  // Get status badge
  const getStatusBadge = (status: AttendanceStatus | null | undefined) => {
    if (!status) return null;
    switch (status) {
      case 'Present':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Có mặt</span>;
      case 'Absent':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Vắng mặt</span>;
      case 'Late':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Đi muộn</span>;
      case 'Excused':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Có phép</span>;
      default:
        return null;
    }
  };

  // Calculate stats
  const totalScheduledDays = sortedSlots.length;
  const totalAttendanceRecords = attendance.length;
  const presentDays = attendance.filter(a => a.status === 'Present').length;
  const absentDays = attendance.filter(a => a.status === 'Absent').length;
  const lateDays = attendance.filter(a => a.status === 'Late').length;
  const excusedDays = attendance.filter(a => a.status === 'Excused').length;
  
  // Attendance rate based on actual attendance records (not scheduled days)
  const attendanceRate = totalAttendanceRecords > 0 
    ? Math.round((presentDays / totalAttendanceRecords) * 100) 
    : 0;

  if (attendanceLoading || scheduleLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">{attendanceRate}%</p>
            <p className="text-sm text-muted-foreground">Tỷ lệ điểm danh</p>
            <p className="text-xs text-muted-foreground mt-1">
              ({totalAttendanceRecords}/{totalScheduledDays} buổi đã điểm danh)
            </p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{presentDays}</p>
              <p className="text-sm text-muted-foreground">Có mặt</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{absentDays}</p>
              <p className="text-sm text-muted-foreground">Vắng mặt</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{lateDays}</p>
              <p className="text-sm text-muted-foreground">Đi muộn</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{excusedDays}</p>
              <p className="text-sm text-muted-foreground">Có phép</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Chi tiết điểm danh</h3>
        </div>
        {sortedSlots.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">STT</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Ngày</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Giờ</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedSlots.map((slot, index) => (
                  <tr key={slot.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {format(new Date(slot.date), 'EEEE, dd/MM/yyyy', { locale: vi })}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {slot.time}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {slot.attendance ? (
                        <div className="flex items-center justify-center gap-2">
                          {slot.attendance.status ? (
                            getStatusBadge(slot.attendance.status)
                          ) : (
                            <span className="text-muted-foreground text-sm italic">Chưa điểm danh</span>
                          )}
                          {/* Teacher can update attendance */}
                          {(user?.role === 'teacher' || user?.role === 'school_admin') && slot.attendance && (
                            <div className="relative">
                              {updatingSlotId === slot.id ? (
                                <div className="flex items-center gap-1">
                                  <select
                                    className="text-xs border rounded px-1 py-0.5 bg-background"
                                    value={slot.attendance.status || ''}
                                    onChange={(e) => {
                                      const newStatus = e.target.value as AttendanceStatus;
                                      updateAttendanceMutation.mutate({
                                        recordId: slot.attendance!.id,
                                        status: newStatus,
                                      });
                                    }}
                                    autoFocus
                                  >
                                    <option value="Present">Có mặt</option>
                                    <option value="Absent">Vắng mặt</option>
                                    <option value="Late">Đi muộn</option>
                                    <option value="Excused">Có phép</option>
                                  </select>
                                  <button
                                    onClick={() => setUpdatingSlotId(null)}
                                    className="text-xs text-muted-foreground hover:text-foreground"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setUpdatingSlotId(slot.id)}
                                  className="text-xs text-muted-foreground hover:text-foreground ml-1"
                                  title="Cập nhật điểm danh"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <ClipboardCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Chưa có lịch học</p>
          </div>
        )}
      </div>
    </div>
  );
}
