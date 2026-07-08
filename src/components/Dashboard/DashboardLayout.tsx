import { useState } from 'react';
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
  Bell,
  Settings,
  Plus,
  Sun,
} from 'lucide-react';

export const DashboardLayout = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const sidebarItems = getSidebarItems(user?.role || 'student');

  const roleLabels: Record<string, string> = {
    master_admin: 'Quản trị viên hệ thống',
    school_admin: 'Quản trị trường',
    teacher: 'Giáo viên',
    student: 'Học sinh',
  };

  return (
    <div className="min-h-screen bg-background">
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
          "fixed left-0 top-0 z-50 h-full w-[280px] bg-card border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6">
          <Link to="/dashboard" className="flex items-center">
            <span className="font-bold text-xl text-[#0f4c5c]">STEM</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden ml-auto p-2 hover:bg-accent rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 overflow-y-auto">
          {user?.role === 'teacher' && (
            <div className="px-6 mb-6">
              <h3 className="font-bold text-[#0f4c5c] text-sm tracking-wider uppercase mb-1">
                INTELLECTUAL
                <br />
                ATELIER
              </h3>
              <p className="text-xs text-muted-foreground">Quản lý giảng dạy</p>
            </div>
          )}
          
          <ul className="space-y-2 px-3">
            {sidebarItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors relative',
                      isActive
                        ? 'bg-[#eefcf6] text-[#0f4c5c] rounded-r-full'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg'
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0f4c5c] rounded-r-md"></div>
                    )}
                    <Icon name={item.icon} className="w-5 h-5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Action */}
        <div className="p-6">
          <button className="w-full bg-[#0f4c5c] hover:bg-[#0a3540] text-white rounded-full py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors shadow-md">
            <Plus className="w-5 h-5" />
            Start Experiment
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-[280px]">
        {/* Header */}
        <header className="h-16 sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border flex items-center justify-between px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-accent rounded-md"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4 md:gap-6 ml-auto">
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

            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 overflow-hidden">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
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
                    className="absolute right-0 mt-2 w-56 bg-card rounded-lg shadow-lg border border-border py-1"
                  >
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-sm font-medium">{user?.fullName}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <Link
                      to="/dashboard/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Hồ sơ cá nhân
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        window.location.href = '/login';
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-accent transition-colors"
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
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
