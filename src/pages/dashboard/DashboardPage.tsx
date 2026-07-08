import { useAuthStore } from '@/stores/authStore';
import {
  MasterAdminStats,
  SchoolAdminStats,
  TeacherStats,
  StudentStats,
} from '@/components/Dashboard/StatsCards';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi, DashboardStats, RecentActivity } from '@/services/dashboardApi';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

const activityIcons: Record<string, string> = {
  user_register: 'UserPlus',
  course_created: 'BookOpen',
  class_started: 'Play',
  submission: 'Upload',
  school_request: 'Building2',
  login: 'LogIn',
  logout: 'LogOut',
  student_joined: 'UserCheck',
  assignment_submitted: 'ClipboardList',
};

export const DashboardPage = () => {
  const { user } = useAuthStore();

  // Fetch stats from API
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch recent activity from API
  const { data: recentActivity, isLoading: activityLoading, refetch: refetchActivity } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: () => dashboardApi.getRecentActivity(10),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const roleGreeting: Record<string, string> = {
    master_admin: 'Quản trị hệ thống',
    school_admin: 'Quản trị trường học',
    teacher: 'Giáo viên',
    student: 'Học sinh',
  };

  const renderStats = () => {
    if (!stats) return null;

    switch (user?.role) {
      case 'master_admin':
        return <MasterAdminStats stats={stats} />;
      case 'school_admin':
        return <SchoolAdminStats stats={stats} />;
      case 'teacher':
        return <TeacherStats stats={stats} />;
      case 'student':
        return <StudentStats stats={stats} />;
      default:
        return <StudentStats stats={stats} />;
    }
  };

  const getQuickActions = () => {
    switch (user?.role) {
      case 'master_admin':
        return [
          { label: 'Duyệt trường mới', path: '/dashboard/requests', icon: 'Building2' },
          { label: 'Quản lý người dùng', path: '/dashboard/users', icon: 'Users' },
          { label: 'Xem khóa học', path: '/dashboard/courses', icon: 'BookOpen' },
        ];
      case 'school_admin':
        return [
          { label: 'Quản lý học sinh', path: '/dashboard/students', icon: 'GraduationCap' },
          { label: 'Quản lý giáo viên', path: '/dashboard/teachers', icon: 'UserCheck' },
          { label: 'Quản lý lớp', path: '/dashboard/classes', icon: 'School' },
          { label: 'Tạo khóa học', path: '/dashboard/courses?action=create', icon: 'BookOpen' },
        ];
      case 'teacher':
        return [
          { label: 'Xem lớp học', path: '/dashboard/my-classes', icon: 'BookOpen' },
          { label: 'Tạo bài tập', path: '/dashboard/assignments?action=create', icon: 'ClipboardList' },
          { label: 'Chấm bài', path: '/dashboard/assignments', icon: 'Check' },
        ];
      case 'student':
        return [
          { label: 'Vào lớp học', path: '/dashboard/my-classes', icon: 'Play' },
          { label: 'Xem bài tập', path: '/dashboard/assignments', icon: 'ClipboardList' },
          { label: 'Mô phỏng', path: '/dashboard/simulations', icon: 'Cpu' },
        ];
      default:
        return [];
    }
  };

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-card animate-pulse rounded-xl border" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Xin chào, {user?.fullName} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Chào mừng bạn đến với trang quản lý của {roleGreeting[user?.role || 'student']}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            refetchStats();
            refetchActivity();
          }}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${activityLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Stats */}
      {renderStats()}

      {/* Quick Actions */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Thao tác nhanh</h2>
        <div className="flex flex-wrap gap-3">
          {getQuickActions().map((action) => (
            <Link key={action.path} to={action.path}>
              <Button variant="outline" className="gap-2">
                <Icon name={action.icon} className="w-4 h-4" />
                {action.label}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Hoạt động gần đây</h2>
          {activityLoading ? (
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : null}
        </div>
        
        {activityLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-4 p-3 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
                  <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : recentActivity && recentActivity.length > 0 ? (
          <div className="space-y-4">
            {recentActivity.map((activity: RecentActivity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-3 rounded-lg hover:bg-accent transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon
                    name={activityIcons[activity.type] || 'Activity'}
                    className="w-5 h-5 text-primary"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.user?.name && `${activity.user.name} • `}
                    {formatDistanceToNow(new Date(activity.timestamp), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Icon name="Inbox" className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Chưa có hoạt động nào gần đây</p>
          </div>
        )}
      </div>

      {/* Alerts for pending items */}
      {user?.role === 'master_admin' && stats?.pendingSchoolRequests ? (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700/50 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-yellow-200 dark:bg-yellow-800/50 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-yellow-700 dark:text-yellow-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-yellow-900 dark:text-yellow-200">
              Có {stats.pendingSchoolRequests} yêu cầu đang chờ duyệt
            </p>
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              Vui lòng kiểm tra và phê duyệt các đơn đăng ký trường mới
            </p>
          </div>
          <Link to="/dashboard/requests">
            <Button variant="outline" size="sm" className="border-yellow-400 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-900/50">
              Xem ngay
            </Button>
          </Link>
        </div>
      ) : null}
    </div>
  );
};
