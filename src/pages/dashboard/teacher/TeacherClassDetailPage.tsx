import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, User, Calendar, MapPin, Clock, Users, CheckCircle, FileText, Cpu, Loader2, FlaskConical, ClipboardCheck, ChevronDown, Plus, Settings, X } from 'lucide-react';
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
  const [expandedModuleId, setExpandedModuleId] = useState<number | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);

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
            <Link to={`/dashboard/admin/courses/${classDetail.courseId}/curriculum`}>
              <Button size="sm" variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Quản lý giáo trình
              </Button>
            </Link>
          </div>
          
          <div className="space-y-3">
            {modules.length > 0 ? (
              modules.map((module) => (
                <div key={module.id} className="border border-border rounded-lg overflow-hidden">
                  {/* Module Header */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedModuleId(expandedModuleId === module.id ? null : module.id)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{module.displayOrder}</span>
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
                          {module.lessons.map((lesson) => (
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
                      Bài học này có phòng lab ảo.
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
