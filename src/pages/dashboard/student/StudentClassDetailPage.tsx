import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, User, Calendar, MapPin, Clock, Play, CheckCircle, FileText, Cpu, Loader2, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/Icon';
import { WeeklyScheduleGrid } from '@/components/WeeklyScheduleGrid';
import { studentApi, StudentClassDetail, StudentAssignment, StudentVirtualLab } from '@/services/teacherStudentApi';
import { scheduleApi, type ScheduleResponse } from '@/services/schoolAdminApi';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function StudentClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'assignments' | 'schedule' | 'virtualLabs'>('overview');
  const [refreshKey, setRefreshKey] = useState(0);

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
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab classDetail={classDetail} />}
      {activeTab === 'assignments' && <AssignmentsTab classDetail={classDetail} />}
      {activeTab === 'schedule' && <ScheduleTab classId={Number(classId)} classInfo={{ classCode: classDetail.classCode, className: classDetail.className }} refreshKey={refreshKey} />}
      {activeTab === 'virtualLabs' && <VirtualLabsTab classId={Number(classId)} />}
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ classDetail }: { classDetail: StudentClassDetail }) {
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

        {/* Modules */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Bài học</h3>
          <div className="space-y-3">
            {classDetail.modules?.length > 0 ? (
              classDetail.modules.map((module) => (
                <div key={module.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    module.isCompleted 
                      ? 'bg-green-100 dark:bg-green-900/30' 
                      : 'bg-muted'
                  }`}>
                    {module.isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <BookOpen className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{module.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {module.lessonsCompleted}/{module.totalLessons} bài học
                    </p>
                  </div>
                  <Button size="sm" variant={module.isCompleted ? 'outline' : 'default'}>
                    {module.isCompleted ? 'Ôn tập' : 'Học ngay'}
                  </Button>
                </div>
              ))
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
              <p className="text-2xl font-bold">{classDetail.modules?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Bài học</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{classDetail.assignments?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Bài tập</p>
            </div>
          </div>
        </div>
      </div>
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
function ScheduleTab({ classId, classInfo, refreshKey }: { classId: number; classInfo?: { classCode: string; className: string }; refreshKey?: number }) {
  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <WeeklyScheduleGrid
        classId={classId}
        classInfo={classInfo}
        isAdmin={false}
        isStudentView={false}
        key={`schedule-${classId}-${refreshKey || 0}`}
      />
    </div>
  );
}

// VirtualLabs Tab Component
function VirtualLabsTab({ classId }: { classId: number }) {
  const { data: virtualLabs, isLoading } = useQuery({
    queryKey: ['student-class-virtual-labs', classId],
    queryFn: () => studentApi.getVirtualLabs({ pageSize: 50, classId }),
  });

  const labs = virtualLabs?.items || [];

  const getStatusBadge = (status: string) => {
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
              <p className="text-2xl font-bold">{labs.filter(l => l.status === 'not_started').length}</p>
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
              <p className="text-2xl font-bold">{labs.filter(l => l.status === 'in_progress').length}</p>
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
              <p className="text-2xl font-bold">{labs.filter(l => l.status === 'completed').length}</p>
              <p className="text-sm text-muted-foreground">Hoàn thành</p>
            </div>
          </div>
        </div>
      </div>

      {/* Labs Grid */}
      {labs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {labs.map((lab) => (
            <div key={lab.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-32 bg-gradient-to-br from-purple-500/10 to-blue-500/10 flex items-center justify-center relative">
                <FlaskConical className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                <div className="absolute top-3 right-3">
                  {getStatusBadge(lab.status)}
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold line-clamp-1">{lab.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{lab.description}</p>
                </div>
                <div className="flex items-center justify-between">
                  {lab.score !== undefined && (
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      Điểm: {lab.score}/100
                    </span>
                  )}
                  {lab.dueDate && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(lab.dueDate), { addSuffix: true, locale: vi })}
                    </span>
                  )}
                </div>
                <Link to={`/dashboard/student/simulations/${lab.id}`} className="block">
                  <Button className="w-full gap-2" variant={lab.status === 'completed' ? 'outline' : 'default'}>
                    {lab.status === 'not_started' && <><Cpu className="w-4 h-4" /> Bắt đầu</>}
                    {lab.status === 'in_progress' && <><Play className="w-4 h-4" /> Tiếp tục</>}
                    {lab.status === 'completed' && <><CheckCircle className="w-4 h-4" /> Xem lại</>}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
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
