import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { getSidebarItems } from './SidebarItems';
import { Icon } from '@/components/ui/Icon';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';
import {
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
} from 'lucide-react';

export const DashboardLayout = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sidebarItems = getSidebarItems(user?.role || 'student');
  const isMasterAdmin = user?.role === 'master_admin';

  const roleLabels: Record<string, string> = {
    master_admin: 'Quản trị viên hệ thống',
    school_admin: 'Quản trị trường',
    teacher: 'Giáo viên',
    student: 'Học sinh',
  };

  return (
    <div className={cn("min-h-screen transition-colors duration-200", isMasterAdmin ? "bg-slate-950 text-slate-100" : "bg-background")}>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isMobile ? (sidebarOpen ? 0 : -280) : 0,
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-[280px] flex flex-col lg:translate-x-0 transition-colors duration-200",
          isMasterAdmin 
            ? "bg-slate-900 border-r border-slate-800 text-slate-300" 
            : "bg-card border-r border-border"
        )}
      >
        {/* Logo */}
        <div className={cn("h-16 flex items-center justify-between px-4 border-b", isMasterAdmin ? "border-slate-800" : "border-border")}>
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
              isMasterAdmin ? "bg-blue-600 text-white" : "bg-primary text-primary-foreground"
            )}>
              <span>ST</span>
            </div>
            <span className={cn("font-semibold text-lg", isMasterAdmin ? "text-white" : "text-foreground")}>STEM</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-accent rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {sidebarItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? isMasterAdmin 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'bg-primary text-primary-foreground'
                        : isMasterAdmin
                          ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon name={item.icon} className="w-5 h-5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className={cn("p-4 border-t", isMasterAdmin ? "border-slate-800" : "border-border")}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
              isMasterAdmin ? "bg-blue-500/10 text-blue-400" : "bg-primary/10 text-primary"
            )}>
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.fullName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium truncate", isMasterAdmin ? "text-white" : "text-foreground")}>{user?.fullName}</p>
              <p className="text-xs text-muted-foreground truncate">
                {roleLabels[user?.role || 'student']}
              </p>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="lg:pl-[280px]">
        {/* Header */}
        <header className={cn(
          "h-16 sticky top-0 z-30 backdrop-blur border-b flex items-center justify-between px-4 lg:px-6 transition-colors duration-200",
          isMasterAdmin 
            ? "bg-slate-950/95 border-slate-800 text-white" 
            : "bg-background/95 border-border"
        )}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-accent rounded-md"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <ThemeToggle />

            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg transition-colors",
                  isMasterAdmin 
                    ? "hover:bg-slate-900 text-slate-350 hover:text-white" 
                    : "hover:bg-accent"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full overflow-hidden shrink-0",
                  isMasterAdmin ? "bg-blue-500/10 text-blue-400" : "bg-primary/10 text-primary"
                )}>
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <span className="hidden sm:block text-sm font-medium">
                  {user?.fullName}
                </span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn(
                      "absolute right-0 mt-2 w-56 rounded-lg shadow-lg border py-1 transition-colors duration-200",
                      isMasterAdmin 
                        ? "bg-slate-900 border-slate-800 text-slate-200" 
                        : "bg-card border-border"
                    )}
                  >
                    <div className={cn("px-4 py-2 border-b", isMasterAdmin ? "border-slate-800" : "border-border")}>
                      <p className={cn("text-sm font-medium", isMasterAdmin ? "text-white" : "text-foreground")}>{user?.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                    <Link
                      to="/dashboard/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 text-sm transition-colors",
                        isMasterAdmin ? "hover:bg-slate-800 text-slate-300 hover:text-white" : "hover:bg-accent"
                      )}
                    >
                      <User className="w-4 h-4" />
                      Hồ sơ cá nhân
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        window.location.href = '/login';
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive transition-colors",
                        isMasterAdmin ? "hover:bg-slate-800" : "hover:bg-accent"
                      )}
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className={cn("p-4 lg:p-6", isMasterAdmin ? "bg-slate-950" : "bg-background")}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
