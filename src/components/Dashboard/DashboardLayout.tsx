import { useEffect, useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
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
  ChevronLeft,
  ChevronRight,
  Bell,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

export const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' && window.innerWidth >= 1024
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('ui:sidebarCollapsed') === 'true';
    } catch (e) {
      return false;
    }
  });

  const sidebarItems = getSidebarItems(user?.role || 'student');
  const isMasterAdmin = user?.role === 'master_admin';

  const roleLabels: Record<string, string> = {
    master_admin: 'Quản trị hệ thống',
    school_admin: 'Quản trị trường học',
    teacher: 'Giáo viên',
    student: 'Học sinh',
  };

  // Get page title from path
  const getPageTitle = () => {
    const path = location.pathname;
    const item = sidebarItems.find((item) => path.startsWith(item.path));
    return item?.label || 'Dashboard';
  };

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const handleChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches);
    };

    setIsDesktop(media.matches);
    media.addEventListener('change', handleChange);

    return () => {
      media.removeEventListener('change', handleChange);
    };
  }, []);

  const sidebarWidth = sidebarCollapsed ? '0px' : '280px';
  const isSidebarVisible = isDesktop ? !sidebarCollapsed : sidebarOpen;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
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
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full bg-card border-r border-border flex flex-col transition-all duration-200',
          isSidebarVisible ? 'w-[280px]' : 'w-0 overflow-hidden border-r-0'
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-border shrink-0">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
              isMasterAdmin ? "bg-blue-600 text-white" : "bg-primary text-primary-foreground"
            )}>
              <span>ST</span>
            </div>
            <span className="font-semibold text-lg text-foreground">STEM</span>
          </Link>
          <button
            onClick={() => {
              const next = !sidebarCollapsed;
              setSidebarCollapsed(next);
              try {
                localStorage.setItem('ui:sidebarCollapsed', String(next));
              } catch (e) {}
            }}
            className="hidden lg:flex p-2 hover:bg-accent rounded-md"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-5 h-5 text-foreground" />
            ) : (
              <PanelLeftClose className="w-5 h-5 text-foreground" />
            )}
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
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-accent'
                    )}
                  >
                    <Icon name={item.icon} className="w-5 h-5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
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
              <p className="text-sm font-medium truncate text-foreground">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground truncate">
                {roleLabels[user?.role || 'student']}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content wrapper */}
      <div
        className="flex flex-col flex-1 transition-all duration-200"
        style={{ marginLeft: isDesktop && !sidebarCollapsed ? sidebarWidth : '0px' }}
      >
        {/* Header */}
        <header className="h-16 sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-accent rounded-md"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>

            {/* Breadcrumb / Back button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 hover:bg-accent rounded-md transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-foreground" />
              </button>

              <Link
                to="/dashboard"
                className="p-1.5 hover:bg-accent rounded-md transition-colors"
              >
                <Home className="w-4 h-4 text-foreground" />
              </Link>

              <span className="text-foreground/50">/</span>
              <span className="text-sm font-medium text-foreground">
                {getPageTitle()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button className="relative p-2 hover:bg-accent rounded-md transition-colors">
              <Bell className="w-5 h-5 text-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* Sidebar toggle (desktop) */}
            <button
              onClick={() => {
                const next = !sidebarCollapsed;
                setSidebarCollapsed(next);
                try {
                  localStorage.setItem('ui:sidebarCollapsed', String(next));
                } catch (e) {}
              }}
              className="hidden lg:flex p-2 hover:bg-accent rounded-md transition-colors"
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-5 h-5 text-foreground" />
              ) : (
                <PanelLeftClose className="w-5 h-5 text-foreground" />
              )}
            </button>

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
                <span className="hidden sm:block text-sm font-medium text-foreground">
                  {user?.fullName}
                </span>
                <ChevronDown className="w-4 h-4 text-foreground" />
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
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-sm font-medium text-foreground">{user?.fullName}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <Link
                      to="/dashboard/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
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
        <main className="flex-1 p-4 lg:p-6 bg-background">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-card border-t border-border px-4 lg:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">ST</span>
              </div>
              <span className="text-sm text-foreground">
                © 2026 StemFlow. Nền tảng STEM thực hành.
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-foreground">
              <Link to="/help" className="hover:text-foreground/70 transition-colors">
                Trợ giúp
              </Link>
              <Link to="/terms" className="hover:text-foreground/70 transition-colors">
                Điều khoản
              </Link>
              <Link to="/privacy" className="hover:text-foreground/70 transition-colors">
                Bảo mật
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
