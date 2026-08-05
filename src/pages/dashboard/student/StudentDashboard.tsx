import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/Icon';
import { BookOpen, Award, Clock, Play, CheckCircle, Cpu, Calendar, Loader2, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { studentApi } from '@/services/teacherStudentApi';

// Mock data for fallback
const mockData = {
  enrolledClasses: 2,
  completedLessons: 15,
  pendingSubmissions: 3,
  averageScore: 8.5,
  achievements: [
    { id: 1, title: 'Học sinh xuất sắc', description: 'Hoàn thành 10 bài học', icon: 'Award' },
    { id: 2, title: 'Người bạn đồng hành', description: 'Đăng nhập 7 ngày liên tiếp', icon: 'Calendar' },
  ],
};

export function StudentDashboard() {
  const { user } = useAuthStore();

  // Fetch student's classes
  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ['student-classes'],
    queryFn: () => studentApi.getClasses({ pageSize: 5 }),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch pending assignments
  const { data: assignmentsData, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['student-assignments'],
    queryFn: () => studentApi.getAssignments({ pageSize: 5 }),
    staleTime: 2 * 60 * 1000,
  });

  // Fetch achievements
  const { data: achievementsData, isLoading: achievementsLoading } = useQuery({
    queryKey: ['student-achievements'],
    queryFn: () => studentApi.getAchievements(),
    staleTime: 10 * 60 * 1000,
  });

  // Fetch recent activities
  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ['student-activities'],
    queryFn: () => studentApi.getRecentActivities(5),
    staleTime: 1 * 60 * 1000,
  });

  // Use real data or mock data fallback
  const classes = classesData?.items || [];
  const assignments = assignmentsData?.items || [];
  const achievements = achievementsData || mockData.achievements;
  const activities = activitiesData || [];

  // Calculate stats from real data
  const pendingAssignments = assignments.filter(a => a.status === 'pending' || a.status === 'overdue').length;
  const averageScore = assignments.length > 0
    ? assignments.reduce((sum, a) => sum + (a.score || 0), 0) / assignments.filter(a => a.score).length
    : mockData.averageScore;

  const isLoading = classesLoading || assignmentsLoading || achievementsLoading || activitiesLoading;

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Xin chào, {user?.fullName} 👋</h1>
          <p className="text-muted-foreground">Chào mừng bạn đến với trang học tập của mình</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-3xl font-bold">{classes.length || mockData.enrolledClasses}</p>
              <p className="text-sm text-muted-foreground">Lớp học đã tham gia</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-3xl font-bold">{mockData.completedLessons}</p>
              <p className="text-sm text-muted-foreground">Bài học hoàn thành</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-3xl font-bold">{pendingAssignments || mockData.pendingSubmissions}</p>
              <p className="text-sm text-muted-foreground">Bài tập cần nộp</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-3xl font-bold">{averageScore.toFixed(1) || '0.0'}</p>
              <p className="text-sm text-muted-foreground">Điểm trung bình</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Classes */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Lớp học của tôi</h2>
          {classes.length > 0 ? (
            <div className="space-y-4">
              {classes.slice(0, 5).map((cls) => (
                <div key={cls.id} className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{cls.name}</h3>
                      <p className="text-sm text-muted-foreground">{cls.teacherName}</p>
                    </div>
                    <Link to={`/dashboard/student/classes/${cls.id}`}>
                      <Button size="sm" variant="outline">
                        <Play className="w-4 h-4 mr-1" />
                        Vào học
                      </Button>
                    </Link>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tiến độ</span>
                      <span className="font-medium">{cls.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ width: `${cls.progress}%` }}
                      />
                    </div>
                  </div>
                  {cls.nextSession && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Buổi tiếp theo: {formatDistanceToNow(new Date(cls.nextSession), { addSuffix: true, locale: vi })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Chưa tham gia lớp học nào</p>
              <p className="text-sm mt-1">Liên hệ quản trị viên để được thêm vào lớp</p>
            </div>
          )}
          <Link to="/dashboard/student/classes">
            <Button variant="outline" className="w-full mt-4">
              Xem tất cả lớp học
            </Button>
          </Link>
        </div>

        {/* Recent Activities */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Hoạt động gần đây</h2>
          {activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.time), { addSuffix: true, locale: vi })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Chưa có hoạt động nào gần đây</p>
            </div>
          )}
        </div>
      </div>

      {/* Assignments */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Bài tập</h2>
        {assignments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium">Tên bài tập</th>
                  <th className="text-left py-3 px-4 font-medium">Lớp</th>
                  <th className="text-left py-3 px-4 font-medium">Hạn nộp</th>
                  <th className="text-center py-3 px-4 font-medium">Điểm</th>
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
                      {assignment.score !== undefined ? `${assignment.score}/${assignment.maxScore}` : '-/-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        assignment.status === 'submitted' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        assignment.status === 'graded' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        assignment.status === 'overdue' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {assignment.status === 'submitted' ? 'Đã nộp' :
                         assignment.status === 'graded' ? 'Đã chấm' :
                         assignment.status === 'overdue' ? 'Quá hạn' : 'Chờ nộp'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Không có bài tập nào</p>
          </div>
        )}
        <Link to="/dashboard/student/assignments">
          <Button variant="outline" className="w-full mt-4">
            Xem tất cả bài tập
          </Button>
        </Link>
      </div>

      {/* Achievements */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Thành tích của tôi</h2>
        {achievements.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">{achievement.title}</p>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Chưa có thành tích nào</p>
            <p className="text-sm mt-1">Hoàn thành bài học và bài tập để nhận thành tích</p>
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
              <Icon name="ClipboardList" className="w-4 h-4" />
              Bài tập
            </Button>
          </Link>
          <Link to="/dashboard/student/simulations">
            <Button variant="outline" className="gap-2">
              <Cpu className="w-4 h-4" />
              Mô phỏng
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

export default StudentDashboard;
