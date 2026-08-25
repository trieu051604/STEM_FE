import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { BookOpen, Award, Clock, Play, CheckCircle, Calendar, Loader2, ChevronRight, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, parseISO, isBefore } from 'date-fns';
import { vi } from 'date-fns/locale';
import { studentApi, StudentAssignment, StudentClass } from '@/services/teacherStudentApi';
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

  const classes = classesData?.items || [];
  const assignments = assignmentsData?.items || [];

  // Check if any assignment is overdue
  const assignmentsWithOverdue = useMemo(() => {
    return assignments.map(a => {
      if (a.status === 'pending' && a.dueDate) {
        const dueDate = parseISO(a.dueDate);
        if (isBefore(dueDate, new Date())) {
          return { ...a, status: 'overdue' as const };
        }
      }
      return a;
    });
  }, [assignments]);

  // Calculate stats based on actual data
  const stats = useMemo(() => {
    // Pending = not submitted yet
    const pendingCount = assignmentsWithOverdue.filter(a => !a.hasSubmitted).length;
    
    // Submitted but not graded (submitted but no score yet)
    const submittedCount = assignmentsWithOverdue.filter(a => 
      a.hasSubmitted && a.highestScore == null && a.score == null
    ).length;
    
    // Graded = submitted AND has score
    const gradedCount = assignmentsWithOverdue.filter(a => 
      a.hasSubmitted && (a.highestScore != null || a.score != null)
    ).length;

    // Calculate average score
    const gradedWithScore = assignmentsWithOverdue.filter(a => 
      a.hasSubmitted && (a.highestScore != null || a.score != null)
    );
    const totalScore = gradedWithScore.reduce((sum, a) => sum + ((a.highestScore ?? a.score) || 0), 0);
    const totalMaxScore = gradedWithScore.reduce((sum, a) => sum + a.maxScore, 0);
    const avgScore = totalMaxScore > 0 ? (totalScore / totalMaxScore * 100).toFixed(1) : null;

    return {
      enrolledClasses: classes.length,
      pendingAssignments: pendingCount,
      submittedCount: submittedCount,
      gradedAssignments: gradedCount,
      averageScore: avgScore ? parseFloat(avgScore) : null,
    };
  }, [classes, assignmentsWithOverdue]);

  // Get graded assignments (has score)
  const gradedAssignments = useMemo(() => {
    return assignmentsWithOverdue
      .filter(a => (a.highestScore !== undefined || a.score !== undefined) && a.hasSubmitted)
      .slice(0, 3);
  }, [assignmentsWithOverdue]);

  // Loading state
  const isLoading = classesLoading && assignmentsLoading;
  const hasAnyError = classesError || assignmentsError;
  
  // Handle refresh all
  const handleRefresh = () => {
    refetchClasses();
    refetchAssignments();
  };

  // Active tab for assignment types
  const [activeTab, setActiveTab] = useState<'quiz' | 'text_report' | 'practical_simulation'>('quiz');

  // Get assignments by type
  const quizAssignments = useMemo(() => {
    return assignmentsWithOverdue
      .filter(a => a.assignmentType === 'quiz')
      .slice(0, 5);
  }, [assignmentsWithOverdue]);

  const reportAssignments = useMemo(() => {
    return assignmentsWithOverdue
      .filter(a => a.assignmentType === 'text_report')
      .slice(0, 5);
  }, [assignmentsWithOverdue]);

  const simulationAssignments = useMemo(() => {
    return assignmentsWithOverdue
      .filter(a => a.assignmentType === 'practical_simulation')
      .slice(0, 5);
  }, [assignmentsWithOverdue]);

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
          disabled={classesFetching || assignmentsFetching}
          className="gap-2"
        >
          <span className={cn(
            'w-4 h-4 inline-block',
            (classesFetching || assignmentsFetching) && 'animate-spin'
          )}>⟳</span>
          Làm mới
        </Button>
      </div>

      {/* Error Banner */}
      {hasAnyError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-5 h-5 text-red-600 dark:text-red-400">⚠️</span>
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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard
          icon={<BookOpen className="w-5 h-5" />}
          iconBg="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
          value={stats.enrolledClasses}
          label="Lớp học"
          isLoading={classesLoading}
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          iconBg={stats.pendingAssignments > 0 ? "bg-amber-100 dark:bg-amber-900/30" : "bg-gray-100 dark:bg-gray-800"}
          iconColor={stats.pendingAssignments > 0 ? "text-amber-600 dark:text-amber-400" : "text-gray-600 dark:text-gray-400"}
          value={stats.pendingAssignments}
          label="Cần nộp"
          highlight={stats.pendingAssignments > 0}
          isLoading={assignmentsLoading}
        />
        <StatCard
          icon={<FileText className="w-5 h-5" />}
          iconBg="bg-orange-100 dark:bg-orange-900/30"
          iconColor="text-orange-600 dark:text-orange-400"
          value={stats.submittedCount}
          label="Đã nộp"
          isLoading={assignmentsLoading}
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5" />}
          iconBg="bg-green-100 dark:bg-green-900/30"
          iconColor="text-green-600 dark:text-green-400"
          value={stats.gradedAssignments}
          label="Đã chấm"
          isLoading={assignmentsLoading}
        />
        <StatCard
          icon={<Award className="w-5 h-5" />}
          iconBg="bg-purple-100 dark:bg-purple-900/30"
          iconColor="text-purple-600 dark:text-purple-400"
          value={stats.averageScore ? `${stats.averageScore.toFixed(0)}%` : '-'}
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

        {/* Bài tập đã chấm */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Bài tập đã chấm
            </h2>
          </div>
          
          {gradedAssignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Award className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Chưa có bài được chấm điểm</p>
              <p className="text-sm mt-1">Điểm sẽ hiển thị sau khi giáo viên chấm bài</p>
            </div>
          ) : (
            <div className="space-y-3">
              {gradedAssignments.map((assignment: any) => (
                <AssignmentRow key={assignment.id} assignment={assignment} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assignments Section - 3 Types */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Bài tập theo loại
          </h2>
          <Link to="/dashboard/student/assignments">
            <Button size="sm" variant="ghost" className="gap-1">
              Xem tất cả <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-4 border-b">
          <button
            onClick={() => setActiveTab('quiz')}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'quiz' 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            📝 Quiz ({quizAssignments.length})
          </button>
          <button
            onClick={() => setActiveTab('text_report')}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'text_report' 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            📄 Báo cáo ({reportAssignments.length})
          </button>
          <button
            onClick={() => setActiveTab('practical_simulation')}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'practical_simulation' 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            🧪 Mô phỏng ({simulationAssignments.length})
          </button>
        </div>

        {/* Tab Content */}
        {assignmentsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {activeTab === 'quiz' && (
              quizAssignments.length === 0 ? (
                <EmptyState type="quiz" />
              ) : (
                quizAssignments.map((assignment) => (
                  <AssignmentRow key={assignment.id} assignment={assignment} />
                ))
              )
            )}
            {activeTab === 'text_report' && (
              reportAssignments.length === 0 ? (
                <EmptyState type="text_report" />
              ) : (
                reportAssignments.map((assignment) => (
                  <AssignmentRow key={assignment.id} assignment={assignment} />
                ))
              )
            )}
            {activeTab === 'practical_simulation' && (
              simulationAssignments.length === 0 ? (
                <EmptyState type="practical_simulation" />
              ) : (
                simulationAssignments.map((assignment) => (
                  <AssignmentRow key={assignment.id} assignment={assignment} />
                ))
              )
            )}
          </div>
        )}
      </div>

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
          <Link to="/dashboard/virtual-lab">
            <Button variant="outline" className="gap-2">
              <span className="w-4 h-4">🧪</span>
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

// Assignment Row Component
function AssignmentRow({ assignment }: { assignment: StudentAssignment }) {
  const dueDate = assignment.dueDate ? parseISO(assignment.dueDate) : null;
  const now = new Date();
  const isOverdue = dueDate ? isBefore(dueDate, now) : false;
  const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  const displayScore = assignment.highestScore ?? assignment.score;

  const getUrgencyColor = () => {
    if (isOverdue) return 'text-red-600 dark:text-red-400';
    if (daysUntilDue <= 1) return 'text-amber-600 dark:text-amber-400';
    return 'text-muted-foreground';
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium truncate">{assignment.title}</h3>
          {isOverdue && !assignment.hasSubmitted && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 shrink-0">
              Quá hạn
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{assignment.className}</p>
        {dueDate ? (
          <p className={cn("text-xs mt-1", getUrgencyColor())}>
            {isOverdue ? 'Đã quá hạn' : `Còn ${daysUntilDue} ngày`} • {formatDistanceToNow(dueDate, { locale: vi })}
          </p>
        ) : (
          <p className="text-xs mt-1 text-muted-foreground">Không có hạn nộp</p>
        )}
      </div>
      <div className="flex items-center gap-2 ml-4">
        {displayScore !== undefined && (
          <span className="text-sm font-medium px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            {displayScore}/{assignment.maxScore}
          </span>
        )}
        {!assignment.hasSubmitted ? (
          <Link to={`/dashboard/student/assignments/${assignment.id}/submit`}>
            <Button size="sm" className="gap-1">
              Nộp bài
            </Button>
          </Link>
        ) : (
          <Link to={`/dashboard/student/assignments/${assignment.id}/submit?view=true`}>
            <Button size="sm" variant="outline">
              Xem lại
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

export default StudentDashboard;

// Empty State Component
function EmptyState({ type }: { type: 'quiz' | 'text_report' | 'practical_simulation' }) {
  const config = {
    quiz: { emoji: '📝', title: 'Không có bài Quiz nào', subtitle: 'Bài Quiz sẽ xuất hiện khi được giao' },
    text_report: { emoji: '📄', title: 'Không có bài Báo cáo nào', subtitle: 'Bài Báo cáo sẽ xuất hiện khi được giao' },
    practical_simulation: { emoji: '🧪', title: 'Không có bài Mô phỏng nào', subtitle: 'Bài Mô phỏng sẽ xuất hiện khi được giao' },
  };

  const { emoji, title, subtitle } = config[type];

  return (
    <div className="text-center py-8 text-muted-foreground">
      <span className="text-4xl mb-3 block">{emoji}</span>
      <p className="font-medium">{title}</p>
      <p className="text-sm mt-1">{subtitle}</p>
    </div>
  );
}
