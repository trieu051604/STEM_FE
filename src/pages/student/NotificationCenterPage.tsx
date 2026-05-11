import { motion } from 'framer-motion';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/common/UIComponents';
import { useUIStore } from '@/stores';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import clsx from 'clsx';

const ICONS: Record<string, string> = { assignment: '📋', grade: '⭐', simulation: '🔬', success: '🏆', info: 'ℹ️', warning: '⚠️', error: '❌' };

export function NotificationCenterPage() {
  const { notifications, markAsRead, markAllAsRead } = useUIStore();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="Trung tâm thông báo" subtitle={`${notifications.filter(n=>!n.isRead).length} chưa đọc`}
        actions={<button onClick={markAllAsRead} className="btn-secondary text-sm"><CheckCheck size={14}/> Đọc tất cả</button>} />

      <div className="glass-card overflow-hidden divide-y divide-slate-700/30">
        {notifications.length === 0 && (
          <div className="py-16 text-center">
            <Bell size={40} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Không có thông báo nào</p>
          </div>
        )}
        {notifications.map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => markAsRead(n.id)}
            className={clsx('flex gap-4 px-5 py-4 cursor-pointer hover:bg-white/5 transition-colors', !n.isRead && 'bg-brand-500/5')}
          >
            <span className="text-2xl flex-shrink-0">{ICONS[n.type] ?? '📌'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className={clsx('text-sm font-semibold', n.isRead ? 'text-slate-300' : 'text-white')}>{n.title}</p>
                {!n.isRead && <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />}
              </div>
              <p className="text-xs text-slate-400">{n.message}</p>
              <p className="text-xs text-slate-500 mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: vi })}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
