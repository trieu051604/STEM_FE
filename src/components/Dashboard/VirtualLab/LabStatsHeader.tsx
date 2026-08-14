import { Icon } from '@/components/ui/Icon';

export interface LabStats {
  activeLabs: number;
  totalStudents: number;
  // null = chưa có nguồn dữ liệu thật (BE chưa có endpoint submission/progress) — hiện "--"
  // thay vì số 0 giả.
  completionRate: number | null;
  avgTimeMins: number | null;
}

interface LabStatsHeaderProps {
  stats?: LabStats;
  loading?: boolean;
  error?: string | null;
}

const defaultStats: LabStats = {
  activeLabs: 0,
  totalStudents: 0,
  completionRate: null,
  avgTimeMins: null,
};

export const LabStatsHeader = ({
  stats = defaultStats,
  loading,
  error,
}: LabStatsHeaderProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="bg-card rounded-xl border border-border p-5 h-24"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-500">
        {error}
      </div>
    );
  }

  const safeStats = {
    activeLabs: stats.activeLabs || 0,
    totalStudents: stats.totalStudents || 0,
    completionRate: Number.isFinite(stats.completionRate) ? stats.completionRate : null,
    avgTimeMins: Number.isFinite(stats.avgTimeMins) ? stats.avgTimeMins : null,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
          <Icon name="FlaskConical" className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{safeStats.activeLabs}</p>
          <p className="text-sm text-muted-foreground">Labs Đang Chạy</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
          <Icon name="Users" className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{safeStats.totalStudents}</p>
          <p className="text-sm text-muted-foreground">Tổng Học Sinh</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
          <Icon name="CheckSquare" className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">
            {safeStats.completionRate == null ? '--' : `${Math.round(safeStats.completionRate)}%`}
          </p>
          <p className="text-sm text-muted-foreground">Tỷ lệ Hoàn Thành</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
          <Icon name="Clock" className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">
            {safeStats.avgTimeMins == null ? '--' : `${Math.round(safeStats.avgTimeMins)}m`}
          </p>
          <p className="text-sm text-muted-foreground">Thời Gian TB</p>
        </div>
      </div>
    </div>
  );
};
