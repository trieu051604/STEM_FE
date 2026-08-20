import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/Icon';
import { getSidebarItems } from '../SidebarItems';
import { useAuthStore } from '@/stores/authStore';
import { useSidebarStore } from '@/stores/sidebarStore';
import { PanelLeftClose, PanelLeftOpen, User, X } from 'lucide-react';

export const TeacherSidebar = ({ isDesktop }: { isDesktop: boolean }) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, toggleSidebar } = useSidebarStore();
  
  const sidebarItems = getSidebarItems('teacher');
  
  const isSidebarVisible = isDesktop ? !sidebarCollapsed : sidebarOpen;
  
  const handleSidebarToggle = () => {
    if (isDesktop) {
      toggleSidebar();
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };
  
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 h-full bg-card border-r border-border flex flex-col transition-all duration-200',
        isSidebarVisible ? 'w-[280px]' : 'w-0 overflow-hidden border-r-0'
      )}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-border shrink-0">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm bg-indigo-500 text-white">
            <span>ST</span>
          </div>
          <span className="font-semibold text-lg text-foreground">STEM</span>
        </Link>
        <button
          onClick={handleSidebarToggle}
          className="hidden lg:flex p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>
        <button
          onClick={() => setSidebarOpen(false)}
          aria-label="Đóng menu"
          className="flex lg:hidden p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 py-6 overflow-y-auto">
        <div className="px-6 mb-6">
          <p className="text-sm font-semibold text-foreground">Quản lý giảng dạy</p>
        </div>
        
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
                      ? 'bg-indigo-500/10 text-indigo-400'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-md"></div>
                  )}
                  <Icon name={item.icon} className="w-5 h-5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>


      <div className="p-4 border-t border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 text-indigo-400">
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
              Giáo viên
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
