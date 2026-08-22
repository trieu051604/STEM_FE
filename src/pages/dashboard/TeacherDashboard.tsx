import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { classesApi, usersApi, dashboardApi, schedulesApi, gradingApi } from '@/services/dashboardApi';
import type { ClassEntity, SubmissionEntity } from '@/services/dashboardApi';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/button';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { RefreshCw, Monitor, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

// Dashboard chỉ hiện một số bài nộp gần nhất — không phải trang chấm bài đầy đủ.
// API không hỗ trợ tham số "limit" riêng, dùng PageSize sẵn có của GetSubmissionsRequest.
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
  const currentDate = format(new Date(), 'dd MMMM, yyyy', { locale: vi });
  const [stats, setStats] = useState(defaultStats);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
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
      const userId = await resolveUserId();

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
      setStatsError('Không tải được số lớp học');
    } finally {
      setIsStatsLoading(false);
    }
  }, [resolveUserId]);

  // "Bài tập nộp mới nhất" — submission thật từ GetSubmissionsHandler (đã tự scope theo
  // Teacher trong JWT + đã sort CreatedAt desc), tách riêng loading/error khỏi
  // fetchDashboardStats để một request lỗi không kéo sập cả phần stats phía trên.
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

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Chào buổi sáng, {user?.fullName}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Hôm nay thầy có {todayClassCount} lớp học và {stats.pendingSubmissions} bài nộp mới đang chờ chấm điểm.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-card px-4 py-2 rounded-lg border border-border flex items-center gap-2 text-sm font-medium text-foreground">
            <Icon name="Calendar" className="w-4 h-4 text-muted-foreground" />
            {currentDate}
          </div>
          <Button
            onClick={handleRefreshAll}
            disabled={isStatsLoading || isSubmissionsLoading}
            className="bg-indigo-500 hover:bg-indigo-600 text-white border-0"
          >
            <RefreshCw className={cn('w-4 h-4', (isStatsLoading || isSubmissionsLoading) && 'animate-spin')} />
            Làm mới dữ liệu
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <Icon name="GraduationCap" className="w-5 h-5 text-indigo-400" />
            </div>
            <span
              className={cn(
                'text-xs font-medium px-2.5 py-1 rounded-full',
                statsError
                  ? 'text-destructive bg-destructive/10'
                  : 'text-emerald-400 bg-emerald-500/10'
              )}
            >
              {isStatsLoading
                ? 'Đang tải'
                : statsError
                  ? 'Lỗi tải'
                  : `+${stats.newClasses} mới`}
            </span>
          </div>
          <p className="text-sm font-medium text-muted-foreground">Tổng số lớp học</p>
          <p className="text-3xl font-bold mt-1 text-foreground">
            {isStatsLoading ? '--' : String(stats.totalClasses).padStart(2, '0')}
          </p>
          {statsError && (
            <p className="text-xs text-destructive mt-2">{statsError}</p>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Icon name="ClipboardList" className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-xs font-medium text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full">
              Cần xử lý
            </span>
          </div>
          <p className="text-sm font-medium text-muted-foreground">Bài nộp chờ chấm</p>
          <p className="text-3xl font-bold mt-1 text-foreground">
            {isStatsLoading ? '--' : stats.pendingSubmissions}
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Icon name="FlaskConical" className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full">
              Đang chạy
            </span>
          </div>
          <p className="text-sm font-medium text-muted-foreground">Virtual Labs hoạt động</p>
          <p className="text-3xl font-bold mt-1 text-foreground">
            {isStatsLoading ? '--' : String(stats.activeLabs).padStart(2, '0')}
          </p>
        </div>

      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Bài tập nộp mới nhất */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Icon name="CheckCircle" className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-foreground">Bài tập nộp mới nhất</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard/teacher/submissions')}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Lịch sử
            </Button>
          </div>

          {isSubmissionsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-[92px] rounded-lg bg-muted/30 border border-border animate-pulse" />
              ))}
            </div>
          ) : submissionsError ? (
            <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
              <AlertCircle className="w-6 h-6 text-destructive" />
              <p className="text-sm text-destructive">{submissionsError}</p>
              <Button variant="outline" size="sm" onClick={fetchRecentSubmissions}>
                <RefreshCw className="w-4 h-4" />
                Thử lại
              </Button>
            </div>
          ) : recentSubmissions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Chưa có bài nộp mới.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentSubmissions.map((sub) => (
                <div key={sub.id} className="bg-muted/30 p-4 rounded-lg border border-border flex gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 bg-indigo-500/10 text-indigo-300">
                    {sub.studentName ? sub.studentName.slice(0, 2).toUpperCase() : 'HS'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground mb-1 truncate">{sub.studentName || 'Học sinh'}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {sub.assignmentTitle}
                      {sub.classCode ? ` · ${sub.classCode}` : ''}
                    </div>
                    <div className="flex items-center justify-between mt-2 gap-2">
                      <span className="text-[10px] font-medium bg-muted text-muted-foreground px-2 py-1 rounded shrink-0">
                        {formatDistanceToNow(new Date(sub.createdAt), { addSuffix: true, locale: vi })}
                      </span>
                      {sub.status === 'graded' ? (
                        <span className="text-[11px] font-semibold text-emerald-400 shrink-0">Đã chấm</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate(`/dashboard/teacher/submissions?submissionId=${sub.id}`)}
                          className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors shrink-0"
                        >
                          Chấm điểm ngay
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Giám sát Virtual Lab trực tiếp */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Icon name="Target" className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-foreground">Giám sát Virtual Lab trực tiếp</h2>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {myClasses.length} lớp học
            </div>
          </div>

          {isStatsLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải danh sách lớp...</p>
          ) : myClasses.length === 0 ? (
            <p className="text-sm text-muted-foreground">Bạn chưa có lớp học nào.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myClasses.map((cls) => (
                <div key={cls.id} className="p-5 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-start justify-between mb-8 gap-2">
                    <h3 className="font-semibold text-base text-foreground min-w-0 truncate">{cls.name}</h3>
                    {cls.classCode && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground shrink-0">
                        {cls.classCode}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      {cls.studentCount} học sinh
                    </span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/dashboard/virtual-lab/monitor/${cls.id}`)}
                      className="h-8 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300"
                    >
                      <Monitor className="w-3.5 h-3.5 mr-1.5" />
                      Giám sát lớp học
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
