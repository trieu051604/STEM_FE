import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import clsx from 'clsx';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color?: 'brand' | 'accent' | 'success' | 'warning' | 'danger';
  index?: number;
}

const COLOR_MAP = {
  brand:   { bg: 'bg-brand-500/10',   icon: 'text-brand-400',   glow: 'glow-brand',   border: 'border-brand-500/20' },
  accent:  { bg: 'bg-accent-500/10',  icon: 'text-accent-400',  glow: 'glow-accent',  border: 'border-accent-500/20' },
  success: { bg: 'bg-emerald-500/10', icon: 'text-emerald-400', glow: '',             border: 'border-emerald-500/20' },
  warning: { bg: 'bg-amber-500/10',   icon: 'text-amber-400',   glow: '',             border: 'border-amber-500/20' },
  danger:  { bg: 'bg-red-500/10',     icon: 'text-red-400',     glow: '',             border: 'border-red-500/20' },
};

export function KPICard({ title, value, change, changeLabel, icon, color = 'brand', index = 0 }: KPICardProps) {
  const colors = COLOR_MAP[color];
  const isPositive = change !== undefined && change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.07 }}
      whileHover={{ scale: 1.015, transition: { duration: 0.15 } }}
      className={clsx('kpi-card border', colors.border)}
    >
      {/* Background glow */}
      <div className={clsx('absolute inset-0 rounded-2xl opacity-30', colors.bg)} />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 mb-1">{title}</p>
          <motion.p
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.07 + 0.1, type: 'spring', stiffness: 200 }}
            className="stat-number text-2xl"
          >
            {value}
          </motion.p>
          {change !== undefined && (
            <div className={clsx('flex items-center gap-1 mt-2 text-xs font-medium', isPositive ? 'text-emerald-400' : 'text-red-400')}>
              {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{isPositive ? '+' : ''}{change}%</span>
              {changeLabel && <span className="text-slate-500 font-normal">{changeLabel}</span>}
            </div>
          )}
        </div>
        <div className={clsx('p-2.5 rounded-xl', colors.bg)}>
          <span className={colors.icon}>{icon}</span>
        </div>
      </div>
    </motion.div>
  );
}
