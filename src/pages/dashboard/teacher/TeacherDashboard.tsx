import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/Icon';
import { BookOpen, Users, ClipboardList, CheckCircle, Clock, Award, Calendar, Play, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { teacherApi } from '@/services/teacherStudentApi';
import { cn } from '@/lib/utils';

export function TeacherDashboard() {
  const { user } = useAuthStore();

  // Fetch teacher's classes
  const { data: classesData, isLoading: classesLoading, isError: classesError, refetch: refetchClasses, isFetching: classesFetching } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: () => teacherApi.getClasses({ pageSize: 5 }),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch pending assignments
  const { data: assignmentsData, isLoading: assignmentsLoading, isError: assignmentsError, refetch: refetchAssignments, isFetching: assignmentsFetching } = useQuery({
    queryKey: ['teacher-assignments'],
    queryFn: () => teacherApi.getAssignments({ pageSize: 5 }),
    staleTime: 2 * 60 * 1000,
  });

  // Fetch pending submissions to grade
  const { data: submissionsData, isLoading: submissionsLoading, isError: submissionsError, refetch: refetchSubmissions, isFetching: submissionsFetching } = useQuery({
    queryKey: ['teacher-submissions'],
    queryFn: () => teacherApi.getSubmissions({ pageSize: 5 }),
    staleTime: 1 * 60 * 1000,
  });

  // Use real data only
  const classes = classesData?.items || [];
  const assignments = assignmentsData?.items || [];
  const submissions = submissionsData?.items || [];

  // Calculate stats from real data
  const totalStudents = classes.reduce((sum, cls) => sum + (cls.studentCount || 0), 0);
  const pendingToGrade = submissions.filter(s => s.status === 'submitted').length;

  const isLoading = classesLoading || assignmentsLoading || submissionsLoading;
  const hasAnyError = classesError || assignmentsError || submissionsError;

  const handleRefresh = () => {
    refetchClasses();
    refetchAssignments();
    refetchSubmissions();
  };

  if (isLoading) {
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
          <h1 className="text-2xl font-bold">Xin chào, {user?.fullName} 👋</h1>
          <p className="text-muted-foreground">Chào mừng bạn đến với trang quản lý giáo viên</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={classesFetching || assignmentsFetching || submissionsFetching}
          className="gap-2"
        >
          <RefreshCw className={cn('w-4 h-4', (classesFetching || assignmentsFetching || submissionsFetching) && 'animate-spin')} />
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-3xl font-bold">{classes.length}</p>
              <p className="text-sm text-muted-foreground">Lớp học của tôi</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-3xl font-bold">{totalStudents}</p>
              <p className="text-sm text-muted-foreground">Học sinh</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-3xl font-bold">{pendingToGrade}</p>
              <p className="text-sm text-muted-foreground">Bài tập cần chấm</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Sessions */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Lớp học của tôi</h2>
          {classes.length > 0 ? (
            <div className="space-y-4">
              {classes.slice(0, 5).map((cls) => (
                <div key={cls.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{cls.name}</p>
                    <p className="text-sm text-muted-foreground">{cls.courseName}</p>
                    <p className="text-xs text-muted-foreground">
                      {cls.schedule && `${cls.schedule} • `}{cls.studentCount || 0} học sinh
                    </p>
                  </div>
                  <Link to={`/dashboard/teacher/classes/${cls.id}`}>
                    <Button size="sm" variant="outline">
                      <Play className="w-4 h-4 mr-1" />
                      Vào lớp
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Chưa có lớp học nào</p>
            </div>
          )}
          <Link to="/dashboard/teacher/classes">
            <Button variant="outline" className="w-full mt-4">
              Xem tất cả lớp học
            </Button>
          </Link>
        </div>

        {/* Recent Activities / Submissions */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Bài nộp cần chấm</h2>
          {submissions.length > 0 ? (
            <div className="space-y-4">
              {submissions.slice(0, 5).map((submission) => (
                <div key={submission.id} className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{submission.studentName}</p>
                    <p className="text-sm text-muted-foreground">{submission.assignmentTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {submission.className} • {formatDistanceToNow(new Date(submission.submittedAt), { addSuffix: true, locale: vi })}
                    </p>
                  </div>
                  <Link to={`/dashboard/teacher/assignments/${submission.id}/grade`}>
                    <Button size="sm" variant="outline">
                      Chấm điểm
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Không có bài nộp nào cần chấm</p>
            </div>
          )}
          <Link to="/dashboard/teacher/submissions">
            <Button variant="outline" className="w-full mt-4">
              Xem tất cả bài nộp
            </Button>
          </Link>
        </div>
      </div>

      {/* Assignments Overview */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Bài tập đã giao gần đây</h2>
        {assignments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium">Tên bài tập</th>
                  <th className="text-left py-3 px-4 font-medium">Lớp</th>
                  <th className="text-left py-3 px-4 font-medium">Hạn nộp</th>
                  <th className="text-center py-3 px-4 font-medium">Đã nộp</th>
                  <th className="text-left py-3 px-4 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {assignments.slice(0, 5).map((assignment) => (
                  <tr key={assignment.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 px-4">{assignment.title}</td>
                    <td className="py-3 px-4 text-muted-foreground">{assignment.className}</td>
                    <td className="py-3 px-4">
                      {formatDistanceToNow(new Date(assignment.dueDate), { addSuffix: true, locale: vi })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {assignment.submittedCount}/{assignment.totalStudents}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        assignment.status === 'pending' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        assignment.status === 'graded' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {assignment.status === 'pending' ? 'Chờ nộp' :
                         assignment.status === 'graded' ? 'Đã chấm' : 'Quá hạn'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Chưa có bài tập nào được giao</p>
          </div>
        )}
        <Link to="/dashboard/teacher/assignments">
          <Button variant="outline" className="w-full mt-4">
            Xem tất cả bài tập
          </Button>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Thao tác nhanh</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/dashboard/teacher/classes">
            <Button variant="outline" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Lớp học
            </Button>
          </Link>
          <Link to="/dashboard/teacher/assignments">
            <Button variant="outline" className="gap-2">
              <ClipboardList className="w-4 h-4" />
              Bài tập
            </Button>
          </Link>
          <Link to="/dashboard/teacher/submissions">
            <Button variant="outline" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Chấm bài
            </Button>
          </Link>
          <Link to="/dashboard/profile">
            <Button variant="outline" className="gap-2">
              <Icon name="User" className="w-4 h-4" />
              Hồ sơ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;
