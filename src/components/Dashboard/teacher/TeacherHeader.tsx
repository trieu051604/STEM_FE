import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { getSidebarItems } from '../SidebarItems';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';
import {
  Menu,
  User,
  ChevronDown,
  ChevronLeft,
  Home,
  PanelLeftClose,
} from 'lucide-react';
import { useSidebarStore } from '@/stores/sidebarStore';

export const TeacherHeader = ({ isDesktop }: { isDesktop: boolean }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, setSidebarOpen, toggleSidebar } = useSidebarStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const sidebarItems = getSidebarItems('teacher');
  
  const getPageTitle = () => {
    const path = location.pathname;
    const item = sidebarItems.find((item) => path.startsWith(item.path));
    return item?.label || 'Dashboard';
  };

  return (
    <header className="h-14 sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border flex items-center justify-between px-4 lg:px-6">
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
          className="hover:text-foreground transition-colors p-1 hidden lg:block"
        >
          {sidebarCollapsed ? (
            <Menu className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>
        <div className="flex items-center gap-3 text-muted-foreground">
          <ThemeToggle className="hover:text-foreground transition-colors p-1" />
        </div>

        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-2 rounded-lg transition-colors hover:bg-accent"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-[#eefcf6] text-[#0f4c5c]">
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
                  Đăng xuất
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
