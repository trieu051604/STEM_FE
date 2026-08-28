import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react';
import { revenueApi, RevenueStatsResponse } from '@/services/revenueApi';
import { useUIStore } from '@/stores/uiStore';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('vi-VN').format(num);
};

export default function RevenuePage() {
  const { theme } = useUIStore();
  const isDarkMode = theme === 'dark';
  const [stats, setStats] = useState<RevenueStatsResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bgPrimary = isDarkMode ? 'bg-dark-200' : 'bg-white';
  const bgSecondary = isDarkMode ? 'bg-dark-300' : 'bg-gray-50';
  const textPrimary = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDarkMode ? 'border-dark-400' : 'border-gray-200';

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await revenueApi.getStats();
      if (response.success) {
        setStats(response.data);
      } else {
        setError('Không thể tải dữ liệu thống kê');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`${bgPrimary} rounded-xl p-6 border ${borderColor}`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${textPrimary}`}>Thống kê doanh thu</h1>
            <p className={`text-sm ${textSecondary}`}>Tổng quan về doanh thu hệ thống</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`${bgPrimary} rounded-xl p-5 border ${borderColor}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${textSecondary}`}>Tổng doanh thu</p>
              <p className={`text-2xl font-bold ${textPrimary} mt-1`}>
                {formatCurrency(stats.summary.totalRevenue)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
          </div>
        </div>

        <div className={`${bgPrimary} rounded-xl p-5 border ${borderColor}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${textSecondary}`}>Token đã bán</p>
              <p className={`text-2xl font-bold ${textPrimary} mt-1`}>
                {formatNumber(stats.summary.totalTokensSold)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        </div>

        <div className={`${bgPrimary} rounded-xl p-5 border ${borderColor}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${textSecondary}`}>Tổng giao dịch</p>
              <p className={`text-2xl font-bold ${textPrimary} mt-1`}>
                {formatNumber(stats.summary.totalPayments)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-500" />
            </div>
          </div>
        </div>

        <div className={`${bgPrimary} rounded-xl p-5 border ${borderColor}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${textSecondary}`}>Giá trị TB</p>
              <p className={`text-2xl font-bold ${textPrimary} mt-1`}>
                {formatCurrency(stats.summary.averagePayment)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Month */}
        <div className={`${bgPrimary} rounded-xl p-6 border ${borderColor}`}>
          <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Doanh thu theo tháng</h3>
          <div className="space-y-3">
            {stats.revenueByMonth.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <span className={`text-sm w-10 ${textSecondary}`}>{item.month}</span>
                <div className="flex-1 h-6 bg-gray-200 dark:bg-dark-300 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                    style={{
                      width: `${Math.max(5, (item.revenue / Math.max(...stats.revenueByMonth.map(m => m.revenue))) * 100)}%`,
                    }}
                  />
                </div>
                <span className={`text-sm font-medium ${textPrimary} w-28 text-right`}>
                  {formatCurrency(item.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by Package */}
        <div className={`${bgPrimary} rounded-xl p-6 border ${borderColor}`}>
          <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Doanh thu theo gói</h3>
          <div className="space-y-4">
            {stats.revenueByPackage.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm ${textPrimary}`}>{item.package}</span>
                  <span className={`text-sm font-medium ${textSecondary}`}>
                    {formatCurrency(item.revenue)}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-dark-300 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                    style={{
                      width: `${Math.max(5, (item.revenue / Math.max(...stats.revenueByPackage.map(p => p.revenue))) * 100)}%`,
                    }}
                  />
                </div>
                <p className={`text-xs ${textSecondary} mt-1`}>{item.count} giao dịch</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Schools */}
        <div className={`${bgPrimary} rounded-xl p-6 border ${borderColor}`}>
          <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Top trường doanh thu cao</h3>
          <div className="space-y-3">
            {stats.topSchools.map((school, index) => (
              <div
                key={school.schoolId}
                className={`flex items-center justify-between p-3 rounded-lg ${bgSecondary}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-amber-600 text-white' :
                    'bg-gray-200 dark:bg-dark-400 text-gray-600 dark:text-gray-300'
                  }`}>
                    {index + 1}
                  </span>
                  <span className={`text-sm font-medium ${textPrimary}`}>{school.schoolName}</span>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${textPrimary}`}>{formatCurrency(school.revenue)}</p>
                  <p className={`text-xs ${textSecondary}`}>{school.payments} giao dịch</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payments */}
        <div className={`${bgPrimary} rounded-xl p-6 border ${borderColor}`}>
          <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Giao dịch gần đây</h3>
          <div className="space-y-3">
            {stats.recentPayments.map((payment) => (
              <div
                key={payment.id}
                className={`flex items-center justify-between p-3 rounded-lg ${bgSecondary}`}
              >
                <div>
                  <p className={`text-sm font-medium ${textPrimary}`}>{payment.schoolName}</p>
                  <p className={`text-xs ${textSecondary}`}>{payment.packageName}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold text-green-500`}>+{formatCurrency(payment.amount)}</p>
                  <p className={`text-xs ${textSecondary}`}>
                    {formatNumber(payment.tokens)} tokens
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
