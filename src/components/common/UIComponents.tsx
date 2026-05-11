import clsx from 'clsx';

// ===== PageHeader =====
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

// ===== SectionCard =====
interface SectionCardProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function SectionCard({ title, subtitle, actions, children, className, noPadding }: SectionCardProps) {
  return (
    <div className={clsx('glass-card', !noPadding && 'p-5', className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && <h2 className="section-heading">{title}</h2>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

// ===== StatusBadge =====
interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'running' | 'paused' | 'error';
}

const STATUS_CONFIG = {
  active:    { label: 'Hoạt động',  cls: 'badge-success' },
  inactive:  { label: 'Không hoạt động', cls: 'badge-danger' },
  pending:   { label: 'Chờ duyệt', cls: 'badge-warning' },
  completed: { label: 'Hoàn thành', cls: 'badge-info' },
  running:   { label: 'Đang chạy', cls: 'badge-success' },
  paused:    { label: 'Tạm dừng',  cls: 'badge-warning' },
  error:     { label: 'Lỗi',       cls: 'badge-danger' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return <span className={config.cls}>{config.label}</span>;
}

// ===== LiveIndicator =====
export function LiveIndicator({ label = 'LIVE' }: { label?: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/20 border border-red-500/30">
      <span className="live-dot" />
      <span className="text-[11px] font-bold text-red-400 tracking-wider">{label}</span>
    </div>
  );
}

// ===== OnlineCounter =====
export function OnlineCounter({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-emerald-400">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      <span>{count} trực tuyến</span>
    </div>
  );
}

// ===== EmptyState =====
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-5xl mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-400 mb-4 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

// ===== SkeletonBlock =====
export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={clsx('skeleton', className)} />;
}

export function SkeletonCard() {
  return (
    <div className="glass-card p-5 space-y-3">
      <SkeletonBlock className="h-4 w-1/3" />
      <SkeletonBlock className="h-8 w-1/2" />
      <SkeletonBlock className="h-3 w-full" />
      <SkeletonBlock className="h-3 w-2/3" />
    </div>
  );
}

// ===== ProgressBar =====
interface ProgressBarProps {
  value: number;
  max?: number;
  color?: 'brand' | 'accent' | 'success' | 'warning';
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

const PROGRESS_COLOR = {
  brand:   'bg-brand-500',
  accent:  'bg-accent-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
};

export function ProgressBar({ value, max = 100, color = 'brand', showLabel = false, size = 'md' }: ProgressBarProps) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className={clsx('flex-1 bg-slate-700 rounded-full overflow-hidden', size === 'sm' ? 'h-1.5' : 'h-2')}>
        <div
          className={clsx('h-full rounded-full transition-all duration-700', PROGRESS_COLOR[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && <span className="text-xs text-slate-400 w-8 text-right">{Math.round(pct)}%</span>}
    </div>
  );
}

// ===== Avatar =====
export function Avatar({ src, name, size = 8 }: { src?: string; name: string; size?: number }) {
  const fallback = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
  return (
    <img
      src={src || fallback}
      alt={name}
      className={clsx(`w-${size} h-${size} rounded-full bg-slate-700 flex-shrink-0`)}
    />
  );
}

// ===== AvatarGroup =====
export function AvatarGroup({ users, max = 5 }: { users: { name: string; avatar?: string }[]; max?: number }) {
  const visible = users.slice(0, max);
  const extra = users.length - max;
  return (
    <div className="flex -space-x-2">
      {visible.map((u, i) => (
        <img
          key={i}
          src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`}
          alt={u.name}
          title={u.name}
          className="w-7 h-7 rounded-full border-2 border-slate-800 bg-slate-700"
        />
      ))}
      {extra > 0 && (
        <div className="w-7 h-7 rounded-full border-2 border-slate-800 bg-slate-700 flex items-center justify-center text-[10px] text-slate-300 font-medium">
          +{extra}
        </div>
      )}
    </div>
  );
}
