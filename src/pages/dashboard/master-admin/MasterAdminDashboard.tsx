import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2,
  Users,
  BookOpen,
  ClipboardCheck,
  ArrowRight,
  AlertCircle,
  Loader2,
  RefreshCw,
  Activity,
  Shield,
  UserCog,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/Icon';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { dashboardApi, DashboardStats, RecentActivity } from '@/services/dashboardApi';
import { MasterAdminCharts } from '@/components/Dashboard/DashboardCharts';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

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

export function MasterAdminDashboard() {
  const { user } = useAuthStore();
  const { theme } = useUIStore();
  const isDark = theme === 'dark';
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, activitiesData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getRecentActivity(8),
      ]);
      setStats(statsData);
      setActivities(activitiesData || []);
    } catch (err: any) {
      console.error('Error loading master admin dashboard:', err);
      setError('Không thể tải dữ liệu tổng quan từ hệ thống.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const quickActions = [
    {
      label: 'Quản lý trường học',
      path: '/dashboard/schools',
      icon: 'Building2',
      description: 'Phê duyệt, cập nhật và khóa/mở khóa trường',
    },
    {
      label: 'Duyệt yêu cầu mới',
      path: '/dashboard/requests',
      icon: 'ClipboardCheck',
      description: 'Xử lý các đơn đăng ký trường đang chờ',
    },
    {
      label: 'Quản lý người dùng',
      path: '/dashboard/users',
      icon: 'Users',
      description: 'Xem và quản lý tài khoản trên hệ thống',
    },
  ];

  const cardSurface = isDark ? 'border-gray-800' : 'bg-white border-gray-200';
  const sectionSurface = isDark ? 'border-gray-800' : 'bg-white border-gray-200';
  const mutedText = isDark ? 'text-gray-400' : 'text-gray-600';
  const headingText = isDark ? 'text-white' : 'text-gray-900';
  const inputClasses = isDark
    ? 'bg-gray-950 border-gray-800 text-gray-100 placeholder-gray-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';

  return (
    <div className={`min-h-screen p-6 rounded-3xl border shadow-2xl space-y-6 relative pb-20 font-sans `}>
      {/* Header */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5`}>
        <div>
          <h1 className={`text-3xl font-extrabold tracking-tight font-headline ${headingText}`}>
            Xin chào, {user?.fullName} 👋
          </h1>
          <p className={`text-sm mt-1 ${mutedText}`}>
            Trang quản trị hệ thống STEM — theo dõi hoạt động và xử lý yêu cầu trường học.
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border transition-all`}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {error && (
        <div className={`rounded-2xl p-4 flex items-center justify-betwee`}>
          <p className="text-sm font-medium">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-all"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ y: -2 }}
          className={`p-5 backdrop-blur-md rounded-2xl flex items-center gap-4 shadow-lg border ${cardSurface}`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border`}>
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Tổng trường học</p>
            <h3 className={`text-3xl font-extrabold mt-0.5 ${headingText}`}>
              {loading ? <Loader2 className={`w-5 h-5 animate-spin`} /> : stats?.totalSchools ?? 0}
            </h3>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className={`p-5 backdrop-blur-md rounded-2xl flex items-center gap-4 shadow-lg border ${cardSurface}`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${isDark ? 'bg-gray-500/10 text-gray-400 border-gray-500/25' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Yêu cầu chờ duyệt</p>
            <h3 className={`text-3xl font-extrabold mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {loading ? <Loader2 className={`w-5 h-5 animate-spin ${isDark ? 'text-gray-400' : 'text-gray-600'}`} /> : stats?.pendingSchoolRequests ?? 0}
            </h3>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className={`p-5 backdrop-blur-md rounded-2xl flex items-center gap-4 shadow-lg border ${cardSurface}`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${isDark ? 'bg-gray-500/15 text-gray-400 border-gray-500/30' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Tổng người dùng</p>
            <h3 className={`text-3xl font-extrabold mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {loading ? <Loader2 className={`w-5 h-5 animate-spin ${isDark ? 'text-gray-400' : 'text-gray-600'}`} /> : stats?.totalUsers ?? 0}
            </h3>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className={`p-5 backdrop-blur-md rounded-2xl flex items-center gap-4 shadow-lg border ${cardSurface}`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${isDark ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Khóa học hệ thống</p>
            <h3 className={`text-3xl font-extrabold mt-0.5 ${headingText}`}>
              {loading ? <Loader2 className={`w-5 h-5 animate-spin ${isDark ? 'text-gray-400' : 'text-gray-600'}`} /> : stats?.totalCourses ?? 0}
            </h3>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      {!loading && stats && <MasterAdminCharts stats={stats} role="master_admin" />}

      {/* Quick Actions */}
      <div className={`backdrop-blur-md rounded-2xl p-6 shadow-xl space-y-4 border ${sectionSurface}`}>
        <h2 className={`text-lg font-bold font-headline ${headingText}`}>Thao tác nhanh</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <Link key={action.path} to={action.path}>
              <div className={`h-full p-4 rounded-xl border transition-all group cursor-pointer`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${isDark ? 'bg-gray-500/10 text-gray-400 border-gray-500/20 group-hover:border-gray-500/40' : 'bg-gray-50 text-gray-600 border-gray-200 group-hover:border-gray-300'}`}>
                    <Icon name={action.icon} className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${headingText}`}>{action.label}</p>
                    <p className={`text-xs mt-1 leading-relaxed ${mutedText}`}>{action.description}</p>
                  </div>
                  <ArrowRight className={`w-4 h-4 shrink-0 mt-1 transition-colors ${isDark ? 'text-gray-500 group-hover:text-gray-400' : 'text-gray-400 group-hover:text-gray-600'}`} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className={`backdrop-blur-md rounded-2xl p-6 shadow-xl space-y-4 border ${sectionSurface}`}>
        <div className="flex items-center justify-between">
          <h2 className={`text-lg font-bold font-headline ${headingText}`}>Hoạt động gần đây</h2>
          <div className={`flex items-center gap-2 text-xs ${mutedText}`}>
            <Shield className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-600'}`} />
            Nhật ký hệ thống
          </div>
        </div>
        <div className="space-y-3">
          {activities.length === 0 ? (
            <div className={`py-10 text-center border border-dashed rounded-xl ${isDark ? 'text-gray-500 border-gray-850' : 'text-gray-500 border-gray-300'}`}>
              <Activity className={`w-8 h-8 mx-auto mb-2 opacity-25 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              <p className="text-sm">Chưa có hoạt động nào được ghi nhận.</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className={`flex items-start gap-4 p-4 rounded-xl border border-transparent hover:border transition-all ${isDark ? 'hover:bg-gray-500/[0.01] hover:border-gray-800/40' : 'hover:bg-gray-50 hover:border-gray-200'}`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 ${isDark ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                  <Icon
                    name={activityIcons[activity.type] || 'Activity'}
                    className="w-5 h-5"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${headingText}`}>{activity.title}</p>
                  <p className={`text-xs mt-0.5 ${mutedText}`}>{activity.description}</p>
                  <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {activity.user?.name && `${activity.user.name} • `}
                    {formatDistanceToNow(new Date(activity.timestamp), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </p>
                  {activity.user?.avatar && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full border overflow-hidden}`}>
                        <img src={activity.user.avatar} alt={activity.user.name} className="w-full h-full object-cover" />
                      </div>
                      <span className={`text-[10px] ${mutedText}`}>{activity.user.name}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Alert for pending items */}
      {stats && stats.pendingSchoolRequests && stats.pendingSchoolRequests > 0 && (
        <div className={`rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 `}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border`}>
            <AlertCircle className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
          </div>
          <div className="flex-1">
            <p className={`font-bold ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
              Có {stats.pendingSchoolRequests} yêu cầu đăng ký đang chờ phê duyệt
            </p>
            <p className={`text-xs mt-0.5 ${mutedText}`}>
              Vui lòng kiểm tra và thực hiện phê duyệt các đơn đăng ký trường mới để họ có thể hoạt động trên hệ thống.
            </p>
          </div>
          <Link to="/dashboard/requests">
            <Button size="sm" className={`font-bold`}>
              Xem ngay
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

export default MasterAdminDashboard;
