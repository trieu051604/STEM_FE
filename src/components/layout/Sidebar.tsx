import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, useUIStore } from '@/stores';
import type { UserRole } from '@/types';
import clsx from 'clsx';

interface NavItem {
  label: string;
  to: string;
  icon: string; // Material symbol name
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  student: [
    { label: 'Dashboard', to: '/student/dashboard', icon: 'dashboard' },
    { label: 'Lớp học', to: '/student/courses', icon: 'school' },
    { label: 'Thư viện', to: '/student/library', icon: 'library_books' },
    { label: 'Phòng Lab', to: '/student/lab/demo', icon: 'science' },
    { label: 'Báo cáo', to: '/student/progress', icon: 'analytics' },
    { label: 'Huy hiệu', to: '/student/badges', icon: 'workspace_premium' },
    { label: 'Thông báo', to: '/student/notifications', icon: 'notifications' },
  ],
  teacher: [
    { label: 'Dashboard', to: '/teacher/dashboard', icon: 'dashboard' },
    { label: 'Quản lý học sinh', to: '/teacher/students', icon: 'groups' },
    { label: 'Quản lý lớp', to: '/teacher/classes', icon: 'class' },
    { label: 'Khóa học', to: '/teacher/courses/create', icon: 'auto_stories' },
    { label: 'Tài liệu', to: '/teacher/materials', icon: 'folder_open' },
    { label: 'Bài tập', to: '/teacher/assignments', icon: 'assignment' },
    { label: 'Chấm điểm', to: '/teacher/grading', icon: 'grading' },
    { label: 'Phòng Lab', to: '/teacher/lab/demo', icon: 'science' },
    { label: 'Báo cáo', to: '/teacher/analytics', icon: 'analytics' },
  ],
  school_admin: [
    { label: 'Dashboard', to: '/school/dashboard', icon: 'dashboard' },
    { label: 'Giáo viên', to: '/school/teachers', icon: 'person_apron' },
    { label: 'Phân quyền', to: '/school/permissions', icon: 'shield_person' },
    { label: 'Khóa học', to: '/school/courses', icon: 'book' },
    { label: 'Báo cáo', to: '/school/reports', icon: 'description' },
    { label: 'Cấu hình', to: '/school/config', icon: 'settings' },
  ],
  master_admin: [
    { label: 'Dashboard', to: '/admin/dashboard', icon: 'dashboard' },
    { label: 'Trường học', to: '/admin/schools', icon: 'account_balance' },
    { label: 'Thư viện Lab', to: '/admin/simulations', icon: 'biotech' },
    { label: 'Giám sát', to: '/admin/monitoring', icon: 'monitor_heart' },
    { label: 'Vai trò', to: '/admin/roles', icon: 'admin_panel_settings' },
    { label: 'Audit Logs', to: '/admin/audit-logs', icon: 'history' },
  ],
};

interface SidebarProps {
  role: UserRole;
}

export function Sidebar({ role }: SidebarProps) {
  const { logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const navigate = useNavigate();
  const navItems = NAV_ITEMS[role];

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 90 : 250 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-full bg-[#f3f4f5] dark:bg-slate-900 flex flex-col py-6 px-4 z-50 border-r border-slate-200 dark:border-slate-800"
    >
      <div className="mb-10 px-2 overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-primary-container flex items-center justify-center cursor-pointer" onClick={toggleSidebar}>
            <span className="material-symbols-outlined text-white" style={{fontVariationSettings: "'FILL' 1"}}>science</span>
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 whitespace-nowrap">
                <h1 className="text-2xl font-black text-[#1A535C] dark:text-teal-400 tracking-tight">StemFlow</h1>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Phòng Thí Nghiệm Tư Duy</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto no-scrollbar overflow-x-hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'py-3 px-4 flex items-center gap-3 font-headline font-semibold transition-all whitespace-nowrap',
                isActive 
                  ? 'bg-white dark:bg-slate-800 text-[#1A535C] dark:text-white border-l-4 border-amber-600 rounded-r-xl' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-800/50 rounded-xl'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className="material-symbols-outlined flex-shrink-0" style={{fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0"}}>{item.icon}</span>
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-2">
        {!sidebarCollapsed ? (
          <button className="w-full bg-secondary text-white py-3 px-4 rounded-full font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-secondary/20">
            <span>Bắt đầu thí nghiệm</span>
            <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>bolt</span>
          </button>
        ) : (
          <button className="w-12 h-12 mx-auto bg-secondary text-white rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-lg shadow-secondary/20">
            <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>bolt</span>
          </button>
        )}
        
        <button 
          onClick={() => { logout(); navigate('/login'); }}
          className={clsx(
            "mt-4 text-slate-500 py-3 flex items-center gap-3 font-headline font-semibold hover:text-error transition-colors",
            sidebarCollapsed ? "justify-center w-full" : "px-4 w-full"
          )}
        >
          <span className="material-symbols-outlined">logout</span>
          {!sidebarCollapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </motion.aside>
  );
}
