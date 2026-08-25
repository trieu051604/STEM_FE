import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  ClipboardCheck,
  FlaskConical,
  RefreshCw,
  AlertCircle,
  Loader2,
  BookOpen,
  Clock,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { classesApi, usersApi, dashboardApi, schedulesApi, gradingApi } from '@/services/dashboardApi';
import type { ClassEntity, SubmissionEntity } from '@/services/dashboardApi';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const RECENT_SUBMISSIONS_PAGE_SIZE = 4;

const defaultStats = {
  totalClasses: 0,
  newClasses: 0,
  pendingSubmissions: 0,
  activeLabs: 0,
};

function countNewClasses(classes: ClassEntity[]) {
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  return classes.filter((item) => {
    if (!item.createdAt) return false;
    const createdAt = new Date(item.createdAt).getTime();
    return Number.isFinite(createdAt) && now - createdAt <= thirtyDays;
  }).length;
}

function toPositiveNumber(value: unknown) {
  const numberValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
}

function getIdentityId(source?: Record<string, unknown> | null) {
  if (!source) return null;

  return (
    toPositiveNumber(source.id) ??
    toPositiveNumber(source.Id) ??
    toPositiveNumber(source.userId) ??
    toPositiveNumber(source.UserId) ??
    toPositiveNumber(source.teacherId) ??
    toPositiveNumber(source.TeacherId) ??
    toPositiveNumber(source.sub) ??
    toPositiveNumber(source.nameid) ??
    toPositiveNumber(
      source['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
    )
  );
}

function parseJwtPayload(token?: string | null) {
  if (!token) return null;

  const payload = token.split('.')[1];
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '='
    );
    const decoded = globalThis.atob(padded);
    const json = decodeURIComponent(
      Array.from(decoded)
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    );

    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user, token, updateUser } = useAuthStore();
  const { theme } = useUIStore();
  const isDark = theme === 'dark';

  const currentDate = format(new Date(), 'EEEE, dd MMMM yyyy', { locale: vi });
  const [stats, setStats] = useState(defaultStats);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [myClasses, setMyClasses] = useState<ClassEntity[]>([]);
  const [todayClassCount, setTodayClassCount] = useState(0);
  const [recentSubmissions, setRecentSubmissions] = useState<SubmissionEntity[]>([]);
  const [isSubmissionsLoading, setIsSubmissionsLoading] = useState(false);
  const [submissionsError, setSubmissionsError] = useState<string | null>(null);

  const resolveUserId = useCallback(async () => {
    const storeUserId = getIdentityId(user as unknown as Record<string, unknown> | null);

    if (storeUserId) {
      return storeUserId;
    }

    const tokenUserId = getIdentityId(parseJwtPayload(token));

    if (tokenUserId) {
      updateUser({ id: tokenUserId });
      return tokenUserId;
    }

    const profile = await usersApi.getProfile();
    const profileRecord = profile as typeof profile & Record<string, unknown>;
    const profileUserId = getIdentityId(profileRecord);

    if (!profileUserId) {
      throw new Error('Missing user id');
    }

    updateUser({
      id: profileUserId,
      email: profile.email,
      fullName: profile.fullName,
      avatar: profile.avatar,
      schoolId: profile.schoolId,
      createdAt: profile.createdAt,
    });

    return profileUserId;
  }, [token, updateUser, user]);

  const fetchDashboardStats = useCallback(async () => {
    setIsStatsLoading(true);
    setStatsError(null);

    try {
      const [myClassesRes, dbStats, schedule] = await Promise.all([
        classesApi.getMyClasses(),
        dashboardApi.getStats().catch(() => null),
        schedulesApi.getMySchedule({
          fromDate: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
          toDate: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
        }).catch(() => []),
      ]);

      const activeLabsCount = myClassesRes.items.reduce((acc, c) => acc + (c.virtualLabs?.length || 0), 0);
      const pendingSubmissionsCount = dbStats?.pendingAssignments ?? 0;

      setStats({
        totalClasses: myClassesRes.total,
        newClasses: myClassesRes.items.length ? countNewClasses(myClassesRes.items) : 0,
        pendingSubmissions: pendingSubmissionsCount,
        activeLabs: activeLabsCount,
      });

      setTodayClassCount(schedule.length);
      setMyClasses(myClassesRes.items);
    } catch {
      setStatsError('Không tải được số liệu từ hệ thống.');
    } finally {
      setIsStatsLoading(false);
    }
  }, [resolveUserId]);

  const fetchRecentSubmissions = useCallback(async () => {
    setIsSubmissionsLoading(true);
    setSubmissionsError(null);

    try {
      const result = await gradingApi.getSubmissions({ pageSize: RECENT_SUBMISSIONS_PAGE_SIZE });
      setRecentSubmissions(result.items);
    } catch {
      setSubmissionsError('Không thể tải bài nộp.');
    } finally {
      setIsSubmissionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  useEffect(() => {
    fetchRecentSubmissions();
  }, [fetchRecentSubmissions]);

  const handleRefreshAll = () => {
    fetchDashboardStats();
    fetchRecentSubmissions();
  };

  const cardSurface = isDark ? 'border-gray-800' : 'bg-white border-gray-200';
  const mutedText = isDark ? 'text-gray-400' : 'text-gray-500';
  const headingText = isDark ? 'text-white' : 'text-gray-900';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div>
          <h1 className={`text-3xl font-extrabold tracking-tight font-headline ${headingText}`}>
            Xin chào, {user?.fullName} 👋
          </h1>
          <p className={`text-sm mt-1 ${mutedText}`}>
            Hôm nay thầy/cô có {todayClassCount} lớp học và {stats.pendingSubmissions} bài nộp mới đang chờ chấm điểm.
          </p>
        </div>
        <button
          onClick={handleRefreshAll}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border transition-all ${
            isDark ? 'border-gray-700 hover:bg-gray-800 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-gray-700'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${(isStatsLoading || isSubmissionsLoading) ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {statsError && (
        <div className={`rounded-xl p-4 flex items-center justify-between ${isDark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
          <p className="text-sm font-medium text-red-600">{statsError}</p>
          <button
            onClick={fetchDashboardStats}
            className="px-3 py-1 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.div
          whileHover={{ y: -2 }}
          className={`p-5 rounded-xl flex items-center gap-4 shadow-sm border ${cardSurface}`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Tổng số lớp học</p>
            <h3 className={`text-3xl font-extrabold mt-0.5 ${headingText}`}>
              {isStatsLoading ? <Loader2 className={`w-5 h-5 animate-spin`} /> : stats.totalClasses}
            </h3>
            {!isStatsLoading && stats.newClasses > 0 && (
              <span className={`text-xs font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>+{stats.newClasses} mới</span>
            )}
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className={`p-5 rounded-xl flex items-center gap-4 shadow-sm border ${cardSurface}`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Bài nộp chờ chấm</p>
            <h3 className={`text-3xl font-extrabold mt-0.5 ${headingText}`}>
              {isStatsLoading ? <Loader2 className={`w-5 h-5 animate-spin`} /> : stats.pendingSubmissions}
            </h3>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className={`p-5 rounded-xl flex items-center gap-4 shadow-sm border ${cardSurface}`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${isDark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Virtual Labs hoạt động</p>
            <h3 className={`text-3xl font-extrabold mt-0.5 ${headingText}`}>
              {isStatsLoading ? <Loader2 className={`w-5 h-5 animate-spin`} /> : stats.activeLabs}
            </h3>
          </div>
        </motion.div>
      </div>

      {/* Bài tập nộp mới nhất */}
      <div className={`rounded-xl p-6 border shadow-sm ${cardSurface}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <h2 className={`text-lg font-bold font-headline ${headingText}`}>Bài tập nộp mới nhất</h2>
          </div>
          <button
            onClick={() => navigate('/dashboard/teacher/submissions')}
            className={`text-sm font-medium ${mutedText} hover:text-foreground transition-colors`}
          >
            Xem tất cả
          </button>
        </div>

        {isSubmissionsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-[80px] rounded-lg bg-muted/30 border animate-pulse" />
            ))}
          </div>
        ) : submissionsError ? (
          <div className={`flex flex-col items-center justify-center gap-3 py-8 rounded-lg ${isDark ? 'bg-red-900/10' : 'bg-red-50'}`}>
            <AlertCircle className={`w-6 h-6 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
            <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{submissionsError}</p>
            <button
              onClick={fetchRecentSubmissions}
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-all"
            >
              Thử lại
            </button>
          </div>
        ) : recentSubmissions.length === 0 ? (
          <div className={`text-center py-8 ${mutedText}`}>
            <Clock className={`w-10 h-10 mx-auto mb-2 opacity-50`} />
            <p>Chưa có bài nộp mới.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentSubmissions.map((sub) => (
              <div key={sub.id} className={`p-4 rounded-lg border transition-all hover:shadow-md ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                    {sub.studentName ? sub.studentName.slice(0, 2).toUpperCase() : 'HS'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold text-sm truncate ${headingText}`}>{sub.studentName || 'Học sinh'}</div>
                    <div className={`text-xs truncate ${mutedText}`}>
                      {sub.assignmentTitle}
                      {sub.classCode ? ` · ${sub.classCode}` : ''}
                    </div>
                    <div className="flex items-center justify-between mt-2 gap-2">
                      <span className={`text-[10px] font-medium px-2 py-1 rounded ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
                        {formatDistanceToNow(new Date(sub.createdAt), { addSuffix: true, locale: vi })}
                      </span>
                      {sub.status === 'graded' ? (
                        <span className={`text-[11px] font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Đã chấm</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate(`/dashboard/teacher/submissions?submissionId=${sub.id}`)}
                          className="text-[11px] font-bold text-indigo-500 hover:text-indigo-400 transition-colors"
                        >
                          Chấm điểm ngay
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lịch học hôm nay */}
      {todayClassCount > 0 && (
        <div className={`rounded-xl p-6 border shadow-sm ${cardSurface}`}>
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-teal-500/10 text-teal-400' : 'bg-teal-50 text-teal-600'}`}>
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className={`text-lg font-bold font-headline ${headingText}`}>Lịch học hôm nay</h2>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${isDark ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-100 text-teal-600'}`}>
              {todayClassCount} lớp
            </span>
          </div>
          <p className={`text-sm ${mutedText}`}>
            Thầy/cô có {todayClassCount} lớp học được lên lịch trong ngày hôm nay.
          </p>
        </div>
      )}
    </div>
  );
};
