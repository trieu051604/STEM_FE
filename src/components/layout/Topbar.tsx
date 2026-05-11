import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, useUIStore } from '@/stores';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import clsx from 'clsx';

const NOTIF_ICONS: Record<string, string> = {
  assignment: 'assignment', grade: 'star', simulation: 'science', success: 'workspace_premium', info: 'info', warning: 'warning', error: 'error',
};

interface TopbarProps {
  sidebarWidth?: string;
}

export function Topbar({ sidebarWidth = '250px' }: TopbarProps) {
  const { user } = useAuthStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead, toggleTheme, theme } = useUIStore();
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header 
      className="fixed top-0 right-0 h-16 bg-[#f3f4f5]/80 dark:bg-slate-900/80 backdrop-blur-md flex justify-between items-center px-8 z-40 transition-all duration-300"
      style={{ left: sidebarWidth }}
    >
      {/* Left: Breadcrumb / Search */}
      <div className="flex items-center gap-8">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{fontSize: '20px'}}>search</span>
          <input 
            className="bg-white/50 dark:bg-slate-800/50 border-none rounded-full pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-primary/20 transition-all text-on-surface" 
            placeholder="Tìm kiếm bài học, phòng thí nghiệm..." 
            type="text"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-6">
        <button
          onClick={toggleTheme}
          className="relative p-2 text-slate-500 hover:bg-white/50 dark:hover:bg-slate-800 rounded-full transition-colors"
          title="Đổi theme"
        >
          <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 text-slate-500 hover:bg-white/50 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full"></span>
            )}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 bg-surface-container-lowest dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold text-on-surface text-sm">Thông báo</h3>
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary-container"
                  >
                    <span className="material-symbols-outlined" style={{fontSize: '14px'}}>done_all</span>
                    Đọc tất cả
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-sm">Không có thông báo</div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={clsx(
                          'flex gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-700',
                          !n.isRead && 'bg-primary/5'
                        )}
                      >
                        <span className="material-symbols-outlined text-primary text-xl flex-shrink-0" style={{fontVariationSettings: "'FILL' 1"}}>{NOTIF_ICONS[n.type] ?? 'push_pin'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={clsx('text-xs font-semibold', n.isRead ? 'text-slate-500' : 'text-on-surface')}>
                              {n.title}
                            </p>
                            {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1" />}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-slate-500 mt-1">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: vi })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => { setShowNotifs(false); navigate('notifications', { relative: 'path' }); }}
                    className="text-xs text-primary font-bold hover:underline w-full text-center"
                  >
                    Xem tất cả thông báo →
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-3 border-l pl-6 border-slate-200 dark:border-slate-700">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-primary dark:text-primary-fixed">{user?.fullName}</p>
            <p className="text-[10px] text-slate-500 font-medium capitalize">{user?.role.replace('_', ' ')}</p>
          </div>
          <img 
            alt="User avatar" 
            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" 
            src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} 
          />
        </div>
      </div>
    </header>
  );
}
