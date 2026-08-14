import { useState, useEffect } from 'react';
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
import {
  Activity,
  Users,
  BookOpen,
  GraduationCap,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

// Mock data for demo (sẽ thay bằng API call thực tế)
const mockStatsByRole = {
  master_admin: {
    totalSchools: 12,
    pendingSchoolRequests: 3,
    totalUsers: 248,
    totalCourses: 45,
  },
  school_admin: {
    totalTeachers: 24,
    totalStudents: 520,
    totalClasses: 18,
    activeClasses: 15,
  },
  teacher: {
    myClasses: 5,
    myStudents: 142,
    pendingAssignments: 23,
  },
  student: {
    enrolledClasses: 3,
    completedLessons: 28,
    pendingSubmissions: 2,
  },
};

const mockRecentActivity = [
  {
    id: '1',
    type: 'user_register',
    title: 'Học sinh mới đăng ký',
    description: 'Nguyễn Văn A đã đăng ký tài khoản mới',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    user: { name: 'Nguyễn Văn A' },
  },
  {
    id: '2',
    type: 'course_created',
    title: 'Khóa học mới',
    description: 'Arduino Cơ bản đã được tạo',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    user: { name: 'Trần Thị B' },
  },
  {
    id: '3',
    type: 'class_started',
    title: 'Lớp học bắt đầu',
    description: 'Lớp IoT 101 đã bắt đầu học kỳ mới',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    user: { name: 'Lê Văn C' },
  },
  {
    id: '4',
    type: 'submission',
    title: 'Nộp bài tập',
    description: 'Phạm Thị D đã nộp bài tập Tuần 5',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    user: { name: 'Phạm Thị D' },
  },
  {
    id: '5',
    type: 'school_request',
    title: 'Yêu cầu mới',
    description: 'Trường THPT XYZ gửi yêu cầu đăng ký',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    user: { name: 'Trường THPT XYZ' },
  },
];

const activityIcons: Record<string, string> = {
  user_register: 'UserPlus',
  course_created: 'BookOpen',
  class_started: 'Play',
  submission: 'Upload',
  school_request: 'Building2',
};

export const DashboardPage = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setStats(mockStatsByRole[user?.role || 'student']);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [user?.role]);

  const roleGreeting: Record<string, string> = {
    master_admin: 'Quản trị viên hệ thống',
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
          { label: 'Thêm giáo viên', path: '/dashboard/users?action=add', icon: 'UserPlus' },
          { label: 'Tạo khóa học', path: '/dashboard/courses?action=create', icon: 'Plus' },
          { label: 'Quản lý lớp', path: '/dashboard/classes', icon: 'GraduationCap' },
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

  if (loading) {
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
      <div>
        <h1 className="text-2xl font-bold">
          Xin chào, {user?.fullName} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Chào mừng bạn đến với trang quản lý của {roleGreeting[user?.role || 'student']}
        </p>
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
          <Button variant="ghost" size="sm">
            Xem tất cả
          </Button>
        </div>
        <div className="space-y-4">
          {mockRecentActivity.map((activity) => (
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
                  {formatDistanceToNow(new Date(activity.timestamp), {
                    addSuffix: true,
                    locale: vi,
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts for pending items */}
      {(user?.role === 'master_admin' || user?.role === 'school_admin') && stats?.pendingSchoolRequests > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-yellow-800 dark:text-yellow-200">
              Có {stats.pendingSchoolRequests} yêu cầu đang chờ duyệt
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Vui lòng kiểm tra và phê duyệt các đơn đăng ký trường mới
            </p>
          </div>
          <Link to="/dashboard/requests">
            <Button variant="outline" size="sm" className="border-yellow-300 dark:border-yellow-700">
              Xem ngay
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};
