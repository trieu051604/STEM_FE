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
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/Icon';
import { useAuthStore } from '@/stores/authStore';
import { dashboardApi, DashboardStats, RecentActivity } from '@/services/dashboardApi';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const activityIcons: Record<string, string> = {
  user_register: 'UserPlus',
  course_created: 'BookOpen',
  class_started: 'Play',
  submission: 'Upload',
  school_request: 'Building2',
};

export function MasterAdminDashboard() {
  const { user } = useAuthStore();
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
        dashboardApi.getRecentActivity(5),
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

  if (loading) {
    return (
      <div className="bg-brand-950 text-brand-100 min-h-screen p-6 rounded-3xl border border-brand-900 shadow-2xl flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-brand-500 animate-spin mb-4" />
        <p className="text-sm text-brand-400">Đang tải dữ liệu tổng quan...</p>
      </div>
    );
  }

  return (
    <div className="bg-brand-950 text-brand-100 min-h-screen p-6 rounded-3xl border border-brand-900 shadow-2xl space-y-6 relative pb-20 font-sans selection:bg-brand-500/30">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-800/60 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-headline">
            Xin chào, {user?.fullName} 👋
          </h1>
          <p className="text-brand-400 text-sm mt-1">
            Chào mừng bạn quay trở lại trang quản trị hệ thống STEM.
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-brand-800 text-brand-300 hover:text-white transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center justify-between text-rose-400">
          <p className="text-sm font-medium">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-rose-600  text-white transition-all"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 bg-brand-900/50 backdrop-blur-md border border-brand-800 rounded-2xl flex items-center gap-4 shadow-lg"
        >
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400 border border-brand-500/20">
            <Building2 className="w-6 h-6 text-brand-400" />
          </div>
          <div>
            <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider">Tổng trường học</p>
            <h3 className="text-3xl font-extrabold mt-0.5 text-white">
              {stats?.totalSchools ?? 0}
            </h3>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 bg-brand-900/50 backdrop-blur-md border border-brand-800 rounded-2xl flex items-center gap-4 shadow-lg"
        >
          <div className="w-12 h-12 rounded-xl bg-accent-500/10 flex items-center justify-center text-accent-400 border border-accent-500/25">
            <ClipboardCheck className="w-6 h-6 text-accent-400" />
          </div>
          <div>
            <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider">Yêu cầu chờ duyệt</p>
            <h3 className="text-3xl font-extrabold mt-0.5 text-accent-400">
              {stats?.pendingSchoolRequests ?? 0}
            </h3>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 bg-brand-900/50 backdrop-blur-md border border-brand-800 rounded-2xl flex items-center gap-4 shadow-lg"
        >
          <div className="w-12 h-12 rounded-xl bg-brand-500/15 flex items-center justify-center text-brand-400 border border-brand-500/30">
            <Users className="w-6 h-6 text-brand-400" />
          </div>
          <div>
            <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider">Tổng người dùng</p>
            <h3 className="text-3xl font-extrabold mt-0.5 text-brand-400">
              {stats?.totalUsers ?? 0}
            </h3>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 bg-brand-900/50 backdrop-blur-md border border-brand-800 rounded-2xl flex items-center gap-4 shadow-lg"
        >
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400 border border-brand-500/20">
            <BookOpen className="w-6 h-6 text-brand-400" />
          </div>
          <div>
            <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider">Khóa học hệ thống</p>
            <h3 className="text-3xl font-extrabold mt-0.5 text-white">
              {stats?.totalCourses ?? 0}
            </h3>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="bg-brand-900/30 backdrop-blur-md border border-brand-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-white font-headline">Thao tác nhanh</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/dashboard/schools">
            <Button variant="outline" className="gap-2 border-brand-800 bg-brand-950 text-brand-300  hover:text-white">
              <Building2 className="w-4 h-4 text-brand-400" />
              Quản lý trường học
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/dashboard/requests">
            <Button variant="outline" className="gap-2 border-brand-800 bg-brand-950 text-brand-300 hover:text-white">
              <ClipboardCheck className="w-4 h-4 text-accent-400" />
              Duyệt trường mới
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/dashboard/users">
            <Button variant="outline" className="gap-2 border-brand-800 bg-brand-950 text-brand-300 over:text-white">
              <Users className="w-4 h-4 text-brand-400" />
              Quản lý người dùng
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-brand-900/30 backdrop-blur-md border border-brand-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white font-headline">Hoạt động gần đây</h2>
        </div>
        <div className="space-y-3">
          {activities.length === 0 ? (
            <div className="py-8 text-center text-brand-500 border border-dashed border-brand-850 rounded-xl">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-25 text-brand-400" />
              <p className="text-sm">Chưa có hoạt động nào được ghi nhận.</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-4 rounded-xl hover:bg-brand-500/[0.01] border border-transparent hover:border-brand-800/40 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400 border border-brand-500/20 shrink-0">
                  <Icon
                    name={activityIcons[activity.type] || 'Activity'}
                    className="w-5 h-5 text-brand-400"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-white">{activity.title}</p>
                  <p className="text-xs text-brand-400 mt-0.5">{activity.description}</p>
                  <p className="text-[10px] text-brand-500 mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Alert for pending items */}
      {stats && stats.pendingSchoolRequests && stats.pendingSchoolRequests > 0 && (
        <div className="bg-accent-500/10 border border-accent-500/25 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-accent-500/15 flex items-center justify-center shrink-0 border border-accent-500/20">
            <AlertCircle className="w-5 h-5 text-accent-400" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-accent-400">
              Có {stats.pendingSchoolRequests} yêu cầu đăng ký đang chờ phê duyệt
            </p>
            <p className="text-xs text-brand-400 mt-0.5">
              Vui lòng kiểm tra và thực hiện phê duyệt các đơn đăng ký trường mới để họ có thể hoạt động.
            </p>
          </div>
          <Link to="/dashboard/schools">
            <Button size="sm" className="bg-accent-500 hover:bg-accent-600 text-brand-950 font-bold">
              Xem ngay
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

export default MasterAdminDashboard;
