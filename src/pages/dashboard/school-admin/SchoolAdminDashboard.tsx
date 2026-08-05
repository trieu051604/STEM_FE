import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Users,
  BookOpen,
  GraduationCap,
  ClipboardCheck,
  RefreshCw,
  Activity,
  Clock,
  TrendingUp,
  UserCheck,
  School,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { dashboardApi, DashboardStats } from '@/services/dashboardApi';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { SchoolAdminCharts } from '@/components/Dashboard/DashboardCharts';
import { Loader2 } from 'lucide-react';

export function SchoolAdminDashboard() {
  const { user } = useAuthStore();
  const { theme } = useUIStore();
  const isDark = theme === 'dark';
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const statsData = await dashboardApi.getStats();
      setStats(statsData);
    } catch (err: any) {
      console.error('Error loading school admin dashboard:', err);
      setError('Không thể tải dữ liệu từ hệ thống.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const cardSurface = isDark ? 'border-gray-800' : 'bg-white border-gray-200';
  const mutedText = isDark ? 'text-gray-400' : 'text-gray-500';
  const headingText = isDark ? 'text-white' : 'text-gray-900';

  return (
    <div className={`min-h-screen p-6 space-y-6 relative pb-20 font-sans`}>
      {/* Header */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5`}>
        <div>
          <h1 className={`text-3xl font-extrabold tracking-tight font-headline ${headingText}`}>
            Xin chào, {user?.fullName} 👋
          </h1>
          <p className={`text-sm mt-1 ${mutedText}`}>
            Trang quản trị trường học — theo dõi thông tin tổng quan về {user?.schoolName || 'trường của bạn'}.
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

      {/* Stats Grid - Chỉ thống kê, không chỉnh sửa */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ y: -2 }}
          className={`p-5 backdrop-blur-md rounded-2xl flex items-center gap-4 shadow-lg border ${cardSurface}`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
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
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${isDark ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-green-50 text-green-600 border-green-100'}`}>
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Tổng học sinh</p>
            <h3 className={`text-3xl font-extrabold mt-0.5 ${headingText}`}>
              {loading ? <Loader2 className={`w-5 h-5 animate-spin`} /> : stats?.totalStudents ?? 0}
            </h3>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className={`p-5 backdrop-blur-md rounded-2xl flex items-center gap-4 shadow-lg border ${cardSurface}`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${isDark ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Tổng giáo viên</p>
            <h3 className={`text-3xl font-extrabold mt-0.5 ${headingText}`}>
              {loading ? <Loader2 className={`w-5 h-5 animate-spin`} /> : stats?.totalTeachers ?? 0}
            </h3>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className={`p-5 backdrop-blur-md rounded-2xl flex items-center gap-4 shadow-lg border ${cardSurface}`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${isDark ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
            <School className="w-6 h-6" />
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Tổng lớp học</p>
            <h3 className={`text-3xl font-extrabold mt-0.5 ${headingText}`}>
              {loading ? <Loader2 className={`w-5 h-5 animate-spin`} /> : stats?.totalClasses ?? 0}
            </h3>
          </div>
        </motion.div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.div
          whileHover={{ y: -2 }}
          className={`p-5 backdrop-blur-md rounded-2xl flex items-center gap-4 shadow-lg border ${cardSurface}`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${isDark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Khóa học</p>
            <h3 className={`text-3xl font-extrabold mt-0.5 ${headingText}`}>
              {loading ? <Loader2 className={`w-5 h-5 animate-spin`} /> : stats?.totalCourses ?? 0}
            </h3>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className={`p-5 backdrop-blur-md rounded-2xl flex items-center gap-4 shadow-lg border ${cardSurface}`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${isDark ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 'bg-teal-50 text-teal-600 border-teal-100'}`}>
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Bài tập</p>
            <h3 className={`text-3xl font-extrabold mt-0.5 ${headingText}`}>
              {loading ? <Loader2 className={`w-5 h-5 animate-spin`} /> : stats?.totalAssignments ?? 0}
            </h3>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className={`p-5 backdrop-blur-md rounded-2xl flex items-center gap-4 shadow-lg border ${cardSurface}`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${isDark ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' : 'bg-pink-50 text-pink-600 border-pink-100'}`}>
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Tổng submissions</p>
            <h3 className={`text-3xl font-extrabold mt-0.5 ${headingText}`}>
              {loading ? <Loader2 className={`w-5 h-5 animate-spin`} /> : stats?.totalSubmissions ?? 0}
            </h3>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      {!loading && stats && <SchoolAdminCharts stats={stats} role="school_admin" />}

      {/* Info Card */}
      <div className={`rounded-2xl p-6 border ${cardSurface}`}>
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-bold text-lg ${headingText}`}>Trường: {user?.schoolName || 'Không xác định'}</h3>
            <p className={`text-sm mt-1 ${mutedText}`}>
              Bạn đang xem thông tin tổng quan của trường. Để quản lý chi tiết, vui lòng liên hệ Quản trị viên hệ thống.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SchoolAdminDashboard;
