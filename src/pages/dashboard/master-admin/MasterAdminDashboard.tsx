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
  DollarSign,
  GraduationCap,
  UserCheck,
  School,
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
      bgColor: isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      label: 'Duyệt yêu cầu mới',
      path: '/dashboard/requests',
      icon: 'ClipboardCheck',
      description: 'Xử lý các đơn đăng ký trường đang chờ',
      bgColor: isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-100',
    },
    {
      label: 'Thống kê doanh thu',
      path: '/dashboard/revenue',
      icon: 'DollarSign',
      description: 'Xem báo cáo doanh thu theo tháng, trường học',
      bgColor: isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
  ];

  const cardSurface = isDark ? 'border-gray-800' : 'bg-white border-gray-200';
  const sectionSurface = isDark ? 'border-gray-800' : 'bg-white border-gray-200';
  const mutedText = isDark ? 'text-gray-400' : 'text-gray-500';
  const headingText = isDark ? 'text-white' : 'text-gray-900';

  return (
    <div className={`min-h-screen p-6 rounded-3xl border shadow-2xl space-y-6 relative pb-20 font-sans `}>
      {/* Header */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5`}>
        <div>
          <h1 className={`text-3xl font-extrabold tracking-tight font-headline ${headingText}`}>
            Xin chào, {user?.fullName}
          </h1>
          <p className={`text-sm mt-1 ${mutedText}`}>
            Trang quản trị hệ thống STEM — theo dõi hoạt động và xử lý yêu cầu trường học.
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border transition-all ${
            isDark ? 'border-gray-700 hover:bg-gray-800 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-gray-700'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {error && (
        <div className={`rounded-2xl p-4 flex items-center justify-between ${isDark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
          <p className="text-sm font-medium text-red-600">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all"
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
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Tổng trường học</p>
            <h3 className={`text-3xl font-extrabold mt-0.5 ${headingText}`}>
              {loading ? <Loader2 className={`w-5 h-5 animate-spin`} /> : stats?.totalSchools ?? 0}
            </h3>
          </div>
        </motion.div>

        {(stats?.pendingSchoolRequests ?? 0) > 0 && (
          <motion.div
            whileHover={{ y: -2 }}
            className={`p-5 backdrop-blur-md rounded-2xl flex items-center gap-4 shadow-lg border ${cardSurface}`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Yêu cầu chờ duyệt</p>
              <h3 className={`text-3xl font-extrabold mt-0.5 ${headingText}`}>
                {loading ? <Loader2 className={`w-5 h-5 animate-spin`} /> : stats?.pendingSchoolRequests ?? 0}
              </h3>
            </div>
          </motion.div>
        )}

        <motion.div
          whileHover={{ y: -2 }}
          className={`p-5 backdrop-blur-md rounded-2xl flex items-center gap-4 shadow-lg border ${cardSurface}`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${isDark ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-green-50 text-green-600 border-green-100'}`}>
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Tổng người dùng</p>
            <h3 className={`text-3xl font-extrabold mt-0.5 ${headingText}`}>
              {loading ? <Loader2 className={`w-5 h-5 animate-spin`} /> : stats?.totalUsers ?? 0}
            </h3>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className={`p-5 backdrop-blur-md rounded-2xl flex items-center gap-4 shadow-lg border ${cardSurface}`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${isDark ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Khóa học hệ thống</p>
            <h3 className={`text-3xl font-extrabold mt-0.5 ${headingText}`}>
              {loading ? <Loader2 className={`w-5 h-5 animate-spin`} /> : stats?.totalCourses ?? 0}
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
              <div className={`h-full p-4 rounded-xl border transition-all group cursor-pointer ${cardSurface}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${action.bgColor}`}>
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

      {/* Alert for pending items */}
      {Number(stats?.pendingSchoolRequests) > 0 && (
        <div className={`rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 border ${isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
            <AlertCircle className={`w-5 h-5`} />
          </div>
          <div className="flex-1">
            <p className={`font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
              Có {stats?.pendingSchoolRequests} yêu cầu đăng ký đang chờ phê duyệt
            </p>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-amber-400/70' : 'text-amber-600'}`}>
              Vui lòng kiểm tra và thực hiện phê duyệt các đơn đăng ký trường mới để họ có thể hoạt động trên hệ thống.
            </p>
          </div>
          <Link to="/dashboard/requests">
            <Button size="sm" className={`font-bold bg-amber-500 hover:bg-amber-600 text-white border-0`}>
              Xem ngay
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

export default MasterAdminDashboard;
