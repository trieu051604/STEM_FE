import { Icon } from '@/components/ui/Icon';

export interface LabStats {
  activeLabs: number;
  totalStudents: number;
  completionRate: number;
  avgTimeMins: number;
}

interface LabStatsHeaderProps {
  stats?: LabStats;
  loading?: boolean;
  error?: string | null;
}

const defaultStats: LabStats = {
  activeLabs: 0,
  totalStudents: 0,
  completionRate: 0,
  avgTimeMins: 0,
};

export const LabStatsHeader = ({
  stats = defaultStats,
  loading,
  error,
}: LabStatsHeaderProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 animate-pulse">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="bg-white rounded-2xl border border-border p-6 shadow-sm h-28"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm text-amber-700">
        {error}
      </div>
    );
  }

  const safeStats = {
    activeLabs: stats.activeLabs || 0,
    totalStudents: stats.totalStudents || 0,
    completionRate: Number.isFinite(stats.completionRate) ? stats.completionRate : 0,
    avgTimeMins: Number.isFinite(stats.avgTimeMins) ? stats.avgTimeMins : 0,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm flex items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-cyan-50 flex items-center justify-center shrink-0">
          <Icon name="FlaskConical" className="w-6 h-6 text-cyan-700" />
        </div>
        <div>
          <p className="text-2xl font-bold text-[#0f4c5c]">{safeStats.activeLabs}</p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
            Labs Đang Chạy
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm flex items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
          <Icon name="Users" className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-[#0f4c5c]">{safeStats.totalStudents}</p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
            Tổng Học Sinh
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm flex items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
          <Icon name="CheckSquare" className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-[#0f4c5c]">
            {Math.round(safeStats.completionRate)}%
          </p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
            Tỷ lệ Hoàn Thành
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm flex items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
          <Icon name="Clock" className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-[#0f4c5c]">
            {Math.round(safeStats.avgTimeMins)}m
          </p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
            Thời Gian TB
          </p>
        </div>
      </div>
    </div>
  );
};
