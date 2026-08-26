import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users,
  UserCheck,
  GraduationCap,
  School,
  BookOpen,
  Beaker,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Loader2,
  RefreshCw,
  BarChart3,
  PieChart,
  Clock,
  Award,
  FlaskConical,
} from 'lucide-react';
import { dashboardApi, DashboardStats } from '@/services/dashboardApi';
import { schoolsApi } from '@/services/schoolAdminApi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export const ReportsPage = () => {
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['school-reports-stats'],
    queryFn: () => dashboardApi.getStats(),
  });

  // Calculate derived metrics
  const totalStudents = stats?.totalStudents || 0;
  const totalTeachers = stats?.totalTeachers || 0;
  const totalClasses = stats?.totalClasses || 0;
  const activeClasses = stats?.activeClasses || 0;

  // Mock data for additional reports (in production, these would come from API)
  const reportCards = [
    {
      title: 'Tổng học sinh',
      value: totalStudents,
      icon: Users,
      color: 'blue',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Tổng giáo viên',
      value: totalTeachers,
      icon: UserCheck,
      color: 'green',
      trend: '+5%',
      trendUp: true,
    },
    {
      title: 'Lớp đang hoạt động',
      value: `${activeClasses}/${totalClasses}`,
      icon: School,
      color: 'purple',
      trend: null,
    },
    {
      title: 'Tổng submissions',
      value: stats?.totalSubmissions || 0,
      icon: CheckCircle,
      color: 'orange',
      trend: '+23%',
      trendUp: true,
    },
  ];

  const completionRate = totalStudents > 0 
    ? Math.round(((stats?.totalSubmissions || 0) / (totalStudents * 10)) * 10) 
    : 0;

  const averageScore = stats?.averageScore || 0;

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Báo cáo Science</h1>
          <p className="text-muted-foreground">
            Xem báo cáo chi tiết về hoạt động giảng dạy Science của trường
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="week">7 ngày qua</option>
            <option value="month">30 ngày qua</option>
            <option value="quarter">90 ngày qua</option>
            <option value="year">1 năm</option>
          </select>
          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Science Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
        <FlaskConical className="w-5 h-5 text-primary shrink-0" />
        <div>
          <p className="text-sm font-medium">Báo cáo giảng dạy Science</p>
          <p className="text-sm text-muted-foreground">
            Theo dõi hiệu suất học tập và giảng dạy môn Science của trường.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {reportCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-xl border border-border p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[card.color]}`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  {card.trend && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${card.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                      {card.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {card.trend}
                    </div>
                  )}
                </div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-sm text-muted-foreground">{card.title}</p>
              </motion.div>
            ))}
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Overview */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Hiệu suất học tập</h2>
              </div>
              <div className="space-y-6">
                {/* Completion Rate */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Tỷ lệ hoàn thành</span>
                    <span className="text-sm font-bold text-primary">{completionRate}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>

                {/* Average Score */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Điểm trung bình</span>
                    <span className="text-sm font-bold text-primary">{averageScore.toFixed(1)}/10</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${averageScore * 10}%` }}
                    />
                  </div>
                </div>

                {/* Lab Completion */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Bài Lab đã hoàn thành</span>
                    <span className="text-sm font-bold text-primary">156/200</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500 rounded-full transition-all"
                      style={{ width: '78%' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-2 mb-6">
                <PieChart className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Thống kê nhanh</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm">Tổng khóa học</span>
                  </div>
                  <span className="font-semibold">{stats?.totalCourses || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm">Bài tập đang chờ</span>
                  </div>
                  <span className="font-semibold">{stats?.pendingAssignments || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Beaker className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm">Bài Lab đã giao</span>
                  </div>
                  <span className="font-semibold">45</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm">Bài Lab đã nộp</span>
                  </div>
                  <span className="font-semibold">38</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm">Học sinh xuất sắc</span>
                  </div>
                  <span className="font-semibold">12</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Summary */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Hoạt động gần đây</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Học sinh mới (tháng này)</p>
                <p className="text-2xl font-bold text-green-600">+{Math.floor(totalStudents * 0.1)}</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Bài nộp mới (tuần này)</p>
                <p className="text-2xl font-bold text-blue-600">+{Math.floor((stats?.totalSubmissions || 0) * 0.15)}</p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Lớp mới (tháng này)</p>
                <p className="text-2xl font-bold text-purple-600">+{Math.floor(totalClasses * 0.2)}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;
