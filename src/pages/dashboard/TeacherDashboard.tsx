import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { classesApi, usersApi } from '@/services/dashboardApi';
import type { ClassEntity } from '@/services/dashboardApi';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { RefreshCw, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock Data
const mockStats = {
  totalClasses: 0,
  newClasses: 0,
  pendingSubmissions: 12,
  activeLabs: 4,
  performanceScore: 4.2,
  performancePercent: 88,
};

const mockTodayClasses = [
  {
    id: 1,
    time: '08:30',
    session: 'Sáng',
    subjectBadge: 'VẬT LÝ 11',
    room: 'Phòng Lab A2',
    title: 'Thí nghiệm Quang hình học & Thấu kính',
    studentsCount: 42,
    status: 'Vào Lớp',
    statusColor: 'bg-[#b45309] text-white hover:bg-[#92400e]',
  },
  {
    id: 2,
    time: '14:00',
    session: 'Chiều',
    subjectBadge: 'HÓA HỌC 10',
    room: 'Virtual Lab 03',
    title: 'Phản ứng Oxy hóa khử trong môi trường Acid',
    requirements: 'Yêu cầu chuẩn bị linh kiện ảo: Zinc, Copper, HCl.',
    status: 'Sắp diễn ra',
    statusColor: 'text-muted-foreground italic text-sm',
  },
];

const mockActiveLabs = [
  {
    id: 1,
    title: 'Lab Điện xoay chiều',
    classCode: 'Lớp 12A1',
    progress: 'Đang thực hiện Bước 4/6',
    activeUsers: 18,
    isDark: true,
  },
  {
    id: 2,
    title: 'Lab Tế bào thực vật',
    classCode: 'Lớp 10B5',
    progress: 'Đang quan sát tiêu bản...',
    activeUsers: 12,
    isDark: false,
  },
];

const mockLatestSubmissions = [
  {
    id: 1,
    name: 'Nguyễn Hoàng Nam',
    avatar: 'NN',
    title: 'Báo cáo: Động lực học chất lỏng',
    time: 'Vừa xong',
  },
  {
    id: 2,
    name: 'Trần Thu Hà',
    avatar: 'TH',
    title: 'Lab: Mô phỏng mạch điện song song',
    time: '15 phút trước',
  },
  {
    id: 3,
    name: 'Lý Minh Nhật',
    avatar: 'LM',
    title: 'Lý thuyết: Định luật Ohm',
    time: '42 phút trước',
  },
];

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
  const { user, token, updateUser } = useAuthStore();
  const currentDate = format(new Date(), 'dd MMMM, yyyy', { locale: vi });
  const [stats, setStats] = useState(mockStats);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

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
      const myClasses = await classesApi.getMyClasses(userId);

      setStats((current) => ({
        ...current,
        totalClasses: myClasses.total,
        newClasses: myClasses.items.length
          ? countNewClasses(myClasses.items)
          : current.newClasses,
      }));
    } catch {
      setStatsError('Không tải được số lớp học');
    } finally {
      setIsStatsLoading(false);
    }
  }, [resolveUserId]);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0f4c5c]">
            Chào buổi sáng, {user?.fullName || 'thầy Tương'}!
          </h1>
          <p className="text-muted-foreground mt-2 text-base">
            Hôm nay thầy có 3 lớp học và 12 bài nộp mới đang chờ chấm điểm.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-xl border border-border flex items-center gap-2 text-sm font-medium">
            <Icon name="Calendar" className="w-5 h-5 text-muted-foreground" />
            {currentDate}
          </div>
          <Button
            onClick={fetchDashboardStats}
            disabled={isStatsLoading}
            className="bg-[#0f4c5c] hover:bg-[#0a3540] text-white rounded-xl px-4 py-2 h-auto flex items-center gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", isStatsLoading && "animate-spin")} />
            Làm mới dữ liệu
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center">
              <Icon name="GraduationCap" className="w-6 h-6 text-cyan-600" />
            </div>
            <span
              className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full",
                statsError
                  ? "text-red-600 bg-red-50"
                  : "text-emerald-600 bg-emerald-50"
              )}
            >
              <span>
                {isStatsLoading
                  ? 'Đang tải'
                  : statsError
                    ? 'Lỗi tải'
                    : `+${stats.newClasses} mới`}
              </span>
            </span>
          </div>
          <p className="text-sm font-medium text-muted-foreground">Tổng số lớp học</p>
          <p className="text-4xl font-bold mt-1 text-[#0f4c5c]">
            {isStatsLoading ? '--' : String(stats.totalClasses).padStart(2, '0')}
          </p>
          {statsError && (
            <p className="text-xs text-red-500 mt-2">{statsError}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <Icon name="ClipboardList" className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
              Cần xử lý
            </span>
          </div>
          <p className="text-sm font-medium text-muted-foreground">Bài nộp chờ chấm</p>
          <p className="text-4xl font-bold mt-1 text-[#0f4c5c]">
            {mockStats.pendingSubmissions}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Icon name="FlaskConical" className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
              Đang chạy
            </span>
          </div>
          <p className="text-sm font-medium text-muted-foreground">Virtual Labs hoạt động</p>
          <p className="text-4xl font-bold mt-1 text-[#0f4c5c]">
            {String(mockStats.activeLabs).padStart(2, '0')}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Icon name="TrendingUp" className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              {mockStats.performancePercent}% trung bình
            </span>
          </div>
          <p className="text-sm font-medium text-muted-foreground">Hiệu suất sinh viên</p>
          <p className="text-4xl font-bold mt-1 text-[#0f4c5c]">
            {mockStats.performanceScore}/5
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Lớp học hôm nay */}
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Icon name="Clock" className="w-5 h-5 text-orange-600" />
                <h2 className="text-xl font-bold text-[#0f4c5c]">Lớp học hôm nay</h2>
              </div>
              <Button variant="ghost" className="text-sm font-medium">
                Xem tất cả
              </Button>
            </div>
            
            <div className="space-y-4">
              {mockTodayClasses.map((cls) => (
                <div key={cls.id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className="flex flex-col items-center justify-center min-w-[80px]">
                    <span className="text-lg font-bold text-[#0f4c5c]">{cls.time}</span>
                    <span className="text-sm font-medium text-muted-foreground">{cls.session}</span>
                  </div>
                  <div className="w-px bg-slate-200 hidden sm:block"></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {cls.subjectBadge}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-slate-400 inline-block"></span>
                        {cls.room}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#0f4c5c] mb-1">
                      {cls.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {cls.studentsCount ? `${cls.studentsCount} học sinh đã tham gia phòng chờ trực tuyến.` : cls.requirements}
                    </p>
                  </div>
                  <div className="flex items-center sm:items-start justify-end sm:pt-2">
                    {cls.status === 'Vào Lớp' ? (
                      <Button className={cn("px-6 rounded-full font-medium h-9 text-sm", cls.statusColor)}>
                        {cls.status}
                      </Button>
                    ) : (
                      <span className={cls.statusColor}>{cls.status}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Giám sát Virtual Lab trực tiếp */}
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Icon name="Target" className="w-5 h-5 text-[#0f4c5c]" />
                <h2 className="text-xl font-bold text-[#0f4c5c]">Giám sát Virtual Lab trực tiếp</h2>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {mockActiveLabs.length} Lab Online
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockActiveLabs.map((lab) => (
                <div 
                  key={lab.id} 
                  className={cn(
                    "p-5 rounded-2xl relative overflow-hidden",
                    lab.isDark ? "bg-[#1e293b] text-white" : "bg-slate-50 text-[#0f4c5c]"
                  )}
                >
                  {lab.isDark && (
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                      <Icon name="Zap" className="w-24 h-24" />
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-8 relative z-10">
                    <h3 className="font-bold text-base w-3/4">{lab.title}</h3>
                    <span className={cn(
                      "text-xs font-semibold px-2.5 py-1 rounded-full",
                      lab.isDark ? "bg-white/10 text-white" : "bg-slate-200 text-slate-600"
                    )}>
                      {lab.classCode}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex -space-x-2">
                      {[1, 2].map((i) => (
                        <div key={i} className={cn(
                          "w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-medium",
                          lab.isDark ? "border-[#1e293b] bg-slate-400 text-transparent" : "border-slate-50 bg-emerald-400 text-transparent"
                        )}>
                        </div>
                      ))}
                      <div className={cn(
                        "w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-medium z-10",
                        lab.isDark ? "border-[#1e293b] bg-slate-500 text-white" : "border-slate-50 bg-emerald-500 text-white"
                      )}>
                        +{lab.activeUsers}
                      </div>
                    </div>
                    <span className={cn(
                      "text-xs font-medium",
                      lab.isDark ? "text-slate-300" : "text-muted-foreground"
                    )}>
                      {lab.progress}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bài nộp mới nhất */}
        <div className="bg-slate-50/50 rounded-2xl border border-border p-6 h-full flex flex-col relative">
          <div className="flex items-center gap-2 mb-6">
            <Icon name="Inbox" className="w-5 h-5 text-[#b45309]" />
            <h2 className="text-xl font-bold text-[#0f4c5c]">Bài nộp mới nhất</h2>
          </div>
          
          <div className="space-y-4 flex-1">
            {mockLatestSubmissions.map((sub, index) => (
              <div key={sub.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
                  index === 0 ? "bg-slate-100 text-slate-700" :
                  index === 1 ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"
                )}>
                  {/* Using an image or just initials, simulating an image for the first one as in design */}
                  {index === 0 ? (
                     <img src="https://i.pravatar.cc/150?img=11" alt="avatar" className="w-full h-full rounded-full object-cover" />
                  ) : sub.avatar}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-[#0f4c5c]">{sub.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-3 line-clamp-2">
                    {sub.title}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium bg-slate-100 text-slate-500 px-2 py-1 rounded">
                      {sub.time}
                    </span>
                    <button className="text-[11px] font-bold text-[#0f4c5c] hover:text-[#b45309] transition-colors">
                      Chấm điểm ngay
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="absolute -bottom-5 right-6 md:-right-4 lg:-right-6 lg:bottom-10 md:bottom-10 z-20">
             {/* FAB button as per design, positioned bottom right */}
            <button className="w-12 h-12 bg-[#b45309] hover:bg-[#92400e] text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105">
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
