import { useAuthStore } from '@/stores/authStore';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export const StatCard = ({ title, value, icon, description, trend, className }: StatCardProps) => {
  return (
    <div className={cn('bg-card rounded-xl border border-border p-6', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-2 text-foreground">{value ?? '-'}</p>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  'text-sm font-medium',
                  trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                )}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">so với tháng trước</span>
            </div>
          )}
        </div>
        <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
          <Icon name={icon} className="w-6 h-6 text-primary" />
        </div>
      </div>
    </div>
  );
};

interface MasterAdminStatsProps {
  stats: {
    totalSchools?: number;
    pendingSchoolRequests?: number;
    totalUsers?: number;
    totalCourses?: number;
  };
}

export const MasterAdminStats = ({ stats }: MasterAdminStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      <StatCard
        title="Tổng số trường"
        value={stats.totalSchools ?? 0}
        icon="Building2"
        description="Trường đang hoạt động"
      />
      <StatCard
        title="Yêu cầu chờ duyệt"
        value={stats.pendingSchoolRequests ?? 0}
        icon="ClipboardCheck"
        description="Đơn đăng ký mới"
        className={(stats.pendingSchoolRequests ?? 0) > 0 ? 'border-yellow-500/50' : ''}
      />
      <StatCard
        title="Tổng người dùng"
        value={stats.totalUsers ?? 0}
        icon="Users"
        description="Tài khoản đã đăng ký"
      />
      <StatCard
        title="Khóa học"
        value={stats.totalCourses ?? 0}
        icon="BookOpen"
        description="Đang triển khai"
      />
    </div>
  );
};

interface SchoolAdminStatsProps {
  stats: {
    totalTeachers?: number;
    totalStudents?: number;
    totalClasses?: number;
    activeClasses?: number;
  };
}

export const SchoolAdminStats = ({ stats }: SchoolAdminStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      <StatCard
        title="Giáo viên"
        value={stats.totalTeachers ?? 0}
        icon="GraduationCap"
        description="Đang giảng dạy"
      />
      <StatCard
        title="Học sinh"
        value={stats.totalStudents ?? 0}
        icon="UserCheck"
        description="Đã đăng ký"
      />
      <StatCard
        title="Lớp học"
        value={stats.totalClasses ?? 0}
        icon="Users"
        description="Tổng số lớp"
      />
      <StatCard
        title="Lớp đang hoạt động"
        value={stats.activeClasses ?? 0}
        icon="Play"
        description="Đang diễn ra"
      />
    </div>
  );
};

interface TeacherStatsProps {
  stats: {
    myClasses?: number;
    myStudents?: number;
    pendingAssignments?: number;
  };
}

export const TeacherStats = ({ stats }: TeacherStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
      <StatCard
        title="Lớp học của tôi"
        value={stats.myClasses ?? 0}
        icon="GraduationCap"
        description="Được phân công"
      />
      <StatCard
        title="Học sinh"
        value={stats.myStudents ?? 0}
        icon="Users"
        description="Trong các lớp"
      />
      <StatCard
        title="Bài tập chấm"
        value={stats.pendingAssignments ?? 0}
        icon="ClipboardList"
        description="Đang chờ chấm"
        className={(stats.pendingAssignments ?? 0) > 0 ? 'border-yellow-500/50' : ''}
      />
    </div>
  );
};

interface StudentStatsProps {
  stats: {
    enrolledClasses?: number;
    completedLessons?: number;
    pendingSubmissions?: number;
  };
}

export const StudentStats = ({ stats }: StudentStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
      <StatCard
        title="Lớp học đã tham gia"
        value={stats.enrolledClasses ?? 0}
        icon="BookOpen"
        description="Đang theo học"
      />
      <StatCard
        title="Bài học hoàn thành"
        value={stats.completedLessons ?? 0}
        icon="CheckCircle"
        description="Tổng cộng"
      />
      <StatCard
        title="Bài tập cần nộp"
        value={stats.pendingSubmissions ?? 0}
        icon="Clock"
        description="Hạn chót sắp tới"
        className={(stats.pendingSubmissions ?? 0) > 0 ? 'border-yellow-500/50' : ''}
      />
    </div>
  );
};
