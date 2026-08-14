import { useEffect, useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { getSidebarItems } from './SidebarItems';
import { TeacherLayout } from './teacher/TeacherLayout';
import { Icon } from '@/components/ui/Icon';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';
import {
  Menu,
  LogOut,
  User,
  ChevronDown,
  Bell,
  Settings,
  Plus,
  ChevronLeft,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useSidebarStore } from '@/stores/sidebarStore';

export const StandardDashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, toggleSidebar } = useSidebarStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' && window.innerWidth >= 1024
  );

  const sidebarItems = getSidebarItems(user?.role || 'student');
  const isMasterAdmin = user?.role === 'master_admin';

  const roleLabels: Record<string, string> = {
    master_admin: 'Quản trị hệ thống',
    school_admin: 'Quản trị trường học',
    teacher: 'Giáo viên',
    student: 'Học sinh',
  };

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

  const handleSidebarToggle = () => {
    if (isDesktop) {
      toggleSidebar();
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
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
              isMasterAdmin ? "bg-brand text-brand-foreground" : "bg-primary text-primary-foreground"
            )}>
              <span>ST</span>
            </div>
            <span className="font-semibold text-lg text-foreground">STEM</span>
          </Link>
          <button
            onClick={handleSidebarToggle}
            className="hidden lg:flex p-2 hover:bg-accent rounded-md"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-5 h-5 text-foreground" />
            ) : (
              <PanelLeftClose className="w-5 h-5 text-foreground" />
            )}
          </button>
        </div>

        <nav className="flex-1 py-6 overflow-y-auto">
          <ul className="space-y-2 px-3">
            {sidebarItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors relative rounded-lg',
                      isActive
                        ? 'bg-[#eefcf6] text-[#0f4c5c]'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0f4c5c] rounded-r-md"></div>
                    )}
                    <Icon name={item.icon} className="w-5 h-5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-6">
          <button className="w-full bg-[#0f4c5c] hover:bg-[#0a3540] text-white rounded-full py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors shadow-md">
            <Plus className="w-5 h-5" />
            Start Experiment
          </button>
        </div>

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

      <div
        className="flex flex-col flex-1 transition-all duration-200"
        style={{ marginLeft: isDesktop && !sidebarCollapsed ? sidebarWidth : '0px' }}
      >
        <header className="h-16 sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-accent rounded-md"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>

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

          <div className="flex items-center gap-4 md:gap-6">
            <button
              onClick={toggleSidebar}
              className="hover:text-foreground transition-colors p-1"
            >
              {sidebarCollapsed ? (
                <Menu className="w-5 h-5" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </button>
            <div className="flex items-center gap-3 text-muted-foreground">
              <ThemeToggle className="hover:text-foreground transition-colors p-1" />
              <button className="hover:text-foreground transition-colors p-1 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full border border-background"></span>
              </button>
              <button className="hover:text-foreground transition-colors p-1">
                <Settings className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg transition-colors",
                  isMasterAdmin 
                    ? "hover:bg-primary/10" 
                    : "hover:bg-accent"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full overflow-hidden shrink-0",
                  isMasterAdmin ? "bg-primary/10 text-primary" : "bg-primary/10 text-primary"
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
                    className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg border py-1 transition-colors duration-200 bg-card border-border"
                  >
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-medium text-foreground">{user?.fullName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
                    </div>
                    <Link
                      to="/dashboard/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Hồ sơ cá nhân
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        window.location.href = '/login';
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
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

        <main className="flex-1 p-4 lg:p-6 bg-background">
          <Outlet />
        </main>

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

export const DashboardLayout = () => {
  const { user } = useAuthStore();
  if (user?.role === 'teacher') {
    return <TeacherLayout />;
  }
  return <StandardDashboardLayout />;
};
