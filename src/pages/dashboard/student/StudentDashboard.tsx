import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { BookOpen, Award, Clock, Play, CheckCircle, Calendar, Loader2, TrendingUp, AlertCircle, RefreshCw, FileText, GraduationCap, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, parseISO, isBefore, isAfter, startOfDay, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { studentApi, StudentAssignment, StudentClass, StudentSubmission, StudentActivity } from '@/services/teacherStudentApi';
import { cn } from '@/lib/utils';

export function StudentDashboard() {
  const { user } = useAuthStore();

  // Fetch student's classes
  const { 
    data: classesData, 
    isLoading: classesLoading, 
    isError: classesError,
    refetch: refetchClasses,
    isFetching: classesFetching
  } = useQuery({
    queryKey: ['student-classes'],
    queryFn: () => studentApi.getClasses({ pageSize: 6 }),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch pending assignments
  const { 
    data: assignmentsData, 
    isLoading: assignmentsLoading, 
    isError: assignmentsError,
    refetch: refetchAssignments,
    isFetching: assignmentsFetching
  } = useQuery({
    queryKey: ['student-assignments'],
    queryFn: () => studentApi.getAssignments({ pageSize: 10 }),
    staleTime: 2 * 60 * 1000,
  });

  // Fetch submissions
  const { 
    data: submissionsData, 
    isLoading: submissionsLoading,
    isError: submissionsError,
    refetch: refetchSubmissions,
    isFetching: submissionsFetching
  } = useQuery({
    queryKey: ['student-submissions'],
    queryFn: () => studentApi.getSubmissions({ pageSize: 10 }),
    staleTime: 2 * 60 * 1000,
  });

  // Fetch recent activities
  const { 
    data: activitiesData, 
    isLoading: activitiesLoading,
    isError: activitiesError,
    refetch: refetchActivities,
    isFetching: activitiesFetching
  } = useQuery({
    queryKey: ['student-activities'],
    queryFn: () => studentApi.getRecentActivities(8),
    staleTime: 2 * 60 * 1000,
  });

  const classes = classesData?.items || [];
  const assignments = assignmentsData?.items || [];
  const submissions = submissionsData?.items || [];
  const activities = activitiesData || [];

  // Check if any assignment is overdue
  const assignmentsWithOverdue = useMemo(() => {
    return assignments.map(a => {
      if (a.status === 'pending') {
        const dueDate = parseISO(a.dueDate);
        if (isBefore(dueDate, new Date())) {
          return { ...a, status: 'overdue' as const };
        }
      }
      return a;
    });
  }, [assignments]);

  // Calculate stats
  const stats = useMemo(() => {
    const pendingCount = assignmentsWithOverdue.filter(a => a.status === 'pending').length;
    const overdueCount = assignmentsWithOverdue.filter(a => a.status === 'overdue').length;
    const gradedCount = assignmentsWithOverdue.filter(a => a.status === 'graded').length;
    
    // Calculate average score from graded assignments
    const gradedWithScore = assignmentsWithOverdue.filter(a => a.score !== undefined && a.score !== null);
    const totalScore = gradedWithScore.reduce((sum, a) => sum + (a.score || 0), 0);
    const totalMaxScore = gradedWithScore.reduce((sum, a) => sum + a.maxScore, 0);
    const avgScore = totalMaxScore > 0 ? (totalScore / totalMaxScore * 10).toFixed(1) : null;

    return {
      enrolledClasses: classes.length,
      pendingAssignments: pendingCount + overdueCount,
      gradedAssignments: gradedCount,
      averageScore: avgScore ? parseFloat(avgScore) : null,
    };
  }, [classes, assignmentsWithOverdue]);

  // Get upcoming assignments (due soon - within 7 days)
  const upcomingAssignments = useMemo(() => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return assignmentsWithOverdue
      .filter(a => a.status === 'pending' || a.status === 'overdue')
      .sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime())
      .slice(0, 5);
  }, [assignmentsWithOverdue]);

  // Get recently graded assignments
  const recentlyGraded = useMemo(() => {
    return assignmentsWithOverdue
      .filter(a => a.status === 'graded' && a.score !== undefined)
      .slice(0, 3);
  }, [assignmentsWithOverdue]);

  // Loading state
  const isLoading = classesLoading && assignmentsLoading && submissionsLoading && activitiesLoading;
  const hasAnyError = classesError || assignmentsError || submissionsError || activitiesError;
  
  // Handle refresh all
  const handleRefresh = () => {
    refetchClasses();
    refetchAssignments();
    refetchSubmissions();
    refetchActivities();
  };

  // Get user greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const userName = user?.fullName?.split(' ').pop() || 'bạn';

  if (isLoading && !classesData && !assignmentsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{getGreeting()}, {userName} 👋</h1>
          <p className="text-muted-foreground">Có gì mới hôm nay?</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={classesFetching || assignmentsFetching || submissionsFetching || activitiesFetching}
          className="gap-2"
        >
          <RefreshCw className={cn(
            'w-4 h-4', 
            (classesFetching || assignmentsFetching || submissionsFetching || activitiesFetching) && 'animate-spin'
          )} />
          Làm mới
        </Button>
      </div>

      {/* Error Banner */}
      {hasAnyError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-sm text-red-700 dark:text-red-300">
              Không thể tải một số dữ liệu. Vui lòng thử lại.
            </span>
          </div>
          <Button size="sm" variant="outline" onClick={handleRefresh}>
            Thử lại
          </Button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<BookOpen className="w-6 h-6" />}
          iconBg="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
          value={stats.enrolledClasses}
          label="Lớp học"
          isLoading={classesLoading}
        />
        <StatCard
          icon={<CheckCircle className="w-6 h-6" />}
          iconBg="bg-green-100 dark:bg-green-900/30"
          iconColor="text-green-600 dark:text-green-400"
          value={stats.gradedAssignments}
          label="Bài đã chấm"
          isLoading={assignmentsLoading}
        />
        <StatCard
          icon={<Clock className="w-6 h-6" />}
          iconBg={stats.pendingAssignments > 0 ? "bg-amber-100 dark:bg-amber-900/30" : "bg-gray-100 dark:bg-gray-800"}
          iconColor={stats.pendingAssignments > 0 ? "text-amber-600 dark:text-amber-400" : "text-gray-600 dark:text-gray-400"}
          value={stats.pendingAssignments}
          label="Cần nộp"
          highlight={stats.pendingAssignments > 0}
          isLoading={assignmentsLoading}
        />
        <StatCard
          icon={<Award className="w-6 h-6" />}
          iconBg="bg-purple-100 dark:bg-purple-900/30"
          iconColor="text-purple-600 dark:text-purple-400"
          value={stats.averageScore ? stats.averageScore.toFixed(1) : '-'}
          label="Điểm TB"
          isLoading={assignmentsLoading}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Classes */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Lớp học của tôi
            </h2>
            <Link to="/dashboard/student/classes">
              <Button size="sm" variant="ghost" className="gap-1">
                Xem tất cả <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          {classesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Chưa tham gia lớp học nào</p>
              <p className="text-sm mt-1">Liên hệ quản trị viên để được thêm vào lớp</p>
            </div>
          ) : (
            <div className="space-y-3">
              {classes.slice(0, 4).map((cls) => (
                <ClassCard key={cls.id} cls={cls} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Activities */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Hoạt động gần đây
            </h2>
          </div>
          
          {activitiesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Chưa có hoạt động nào</p>
              <p className="text-sm mt-1">Các hoạt động của bạn sẽ hiển thị ở đây</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
              {activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assignments Section */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Bài tập cần làm
          </h2>
          <Link to="/dashboard/student/assignments">
            <Button size="sm" variant="ghost" className="gap-1">
              Xem tất cả <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {assignmentsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : upcomingAssignments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-500" />
            <p className="font-medium">Tuyệt vời! Không có bài tập nào cần làm</p>
            <p className="text-sm mt-1">Tất cả bài tập đã được nộp và chấm điểm</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingAssignments.map((assignment) => (
              <AssignmentRow key={assignment.id} assignment={assignment} />
            ))}
          </div>
        )}
      </div>

      {/* Recently Graded */}
      {recentlyGraded.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Bài tập đã chấm
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentlyGraded.map((assignment) => (
              <GradedCard key={assignment.id} assignment={assignment} />
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Thao tác nhanh</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/dashboard/student/classes">
            <Button variant="outline" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Vào lớp học
            </Button>
          </Link>
          <Link to="/dashboard/student/assignments">
            <Button variant="outline" className="gap-2">
              <Clock className="w-4 h-4" />
              Bài tập
            </Button>
          </Link>
          <Link to="/dashboard/student/schedule">
            <Button variant="outline" className="gap-2">
              <Calendar className="w-4 h-4" />
              Lịch học
            </Button>
          </Link>
          <Link to="/dashboard/student/virtual-labs">
            <Button variant="outline" className="gap-2">
              <GraduationCap className="w-4 h-4" />
              Virtual Labs
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  icon, 
  iconBg, 
  iconColor, 
  value, 
  label, 
  isLoading, 
  highlight 
}: { 
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  value: number | string;
  label: string;
  isLoading?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={cn(
      "bg-card rounded-xl border border-border p-4 md:p-6",
      highlight && "border-amber-300 dark:border-amber-700"
    )}>
      <div className="flex items-center gap-3 md:gap-4">
        <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
          <span className={iconColor}>{icon}</span>
        </div>
        <div>
          <p className="text-2xl md:text-3xl font-bold">
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              value
            )}
          </p>
          <p className="text-xs md:text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

// Class Card Component
function ClassCard({ cls }: { cls: StudentClass }) {
  const statusColors = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    upcoming: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };

  const statusLabels = {
    active: 'Đang học',
    completed: 'Đã kết thúc',
    upcoming: 'Sắp bắt đầu',
  };

  return (
    <div className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{cls.name || cls.courseName}</h3>
          <p className="text-sm text-muted-foreground truncate">{cls.teacherName}</p>
        </div>
        <span className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ml-2",
          statusColors[cls.status]
        )}>
          {statusLabels[cls.status]}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{cls.classCode}</span>
        <Link to={`/dashboard/student/classes/${cls.id}`}>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
            <Play className="w-3 h-3" />
            Vào học
          </Button>
        </Link>
      </div>
    </div>
  );
}

// Activity Item Component
function ActivityItem({ activity }: { 
  activity: {
    id: string;
    type: string;
    title: string;
    description: string;
    time: string;
  }
}) {
  const getActivityIcon = () => {
    switch (activity.type) {
      case 'submission':
        return <FileText className="w-4 h-4" />;
      case 'grade':
        return <Award className="w-4 h-4" />;
      default:
        return <TrendingUp className="w-4 h-4" />;
    }
  };

  const getActivityBg = () => {
    switch (activity.type) {
      case 'submission':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      case 'grade':
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      default:
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
    }
  };

  const formatTime = (timeStr: string) => {
    try {
      const time = parseISO(timeStr);
      return formatDistanceToNow(time, { addSuffix: true, locale: vi });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0", getActivityBg())}>
        {getActivityIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm line-clamp-1">{activity.title}</p>
        <p className="text-xs text-muted-foreground line-clamp-1">{activity.description}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatTime(activity.time)}
        </p>
      </div>
    </div>
  );
}

// Assignment Row Component
function AssignmentRow({ assignment }: { assignment: StudentAssignment }) {
  const dueDate = parseISO(assignment.dueDate);
  const now = new Date();
  const isOverdue = isBefore(dueDate, now);
  const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const getUrgencyColor = () => {
    if (isOverdue || assignment.status === 'overdue') return 'text-red-600 dark:text-red-400';
    if (daysUntilDue <= 1) return 'text-amber-600 dark:text-amber-400';
    return 'text-muted-foreground';
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium truncate">{assignment.title}</h3>
          {assignment.status === 'overdue' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 shrink-0">
              Quá hạn
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{assignment.className}</p>
        <p className={cn("text-xs mt-1", getUrgencyColor())}>
          {isOverdue ? 'Đã quá hạn' : `Còn ${daysUntilDue} ngày`} • {formatDistanceToNow(dueDate, { locale: vi })}
        </p>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <span className={cn(
          "text-sm font-medium px-2 py-1 rounded",
          assignment.score !== undefined 
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : "text-muted-foreground"
        )}>
          {assignment.score !== undefined ? `${assignment.score}/${assignment.maxScore}` : '-/-'}
        </span>
        {assignment.status === 'pending' || assignment.status === 'overdue' ? (
          <Link to={`/dashboard/student/assignments/${assignment.id}/submit`}>
            <Button size="sm" className="gap-1">
              Nộp bài
            </Button>
          </Link>
        ) : (
          <Link to={`/dashboard/student/assignments/${assignment.id}`}>
            <Button size="sm" variant="outline">
              Chi tiết
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

// Graded Card Component
function GradedCard({ assignment }: { assignment: StudentAssignment }) {
  const scorePercentage = (assignment.score! / assignment.maxScore) * 100;
  
  const getScoreColor = () => {
    if (scorePercentage >= 80) return 'text-green-600 dark:text-green-400';
    if (scorePercentage >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="p-4 rounded-lg bg-muted/50 border border-border">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-sm line-clamp-1">{assignment.title}</h3>
        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
      </div>
      <p className="text-xs text-muted-foreground mb-3">{assignment.className}</p>
      <div className="flex items-center justify-between">
        <span className={cn("text-xl font-bold", getScoreColor())}>
          {assignment.score}/{assignment.maxScore}
        </span>
        <span className="text-xs text-muted-foreground">
          {scorePercentage.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

export default StudentDashboard;
