import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useUIStore } from '@/stores';
import type { UserRole } from '@/types';

interface AppLayoutProps {
  role: UserRole;
}

export function AppLayout({ role }: AppLayoutProps) {
  const sidebarCollapsed = useUIStore(s => s.sidebarCollapsed);

  // In the design, it's 250px
  const sidebarWidth = sidebarCollapsed ? '72px' : '250px';

  return (
    <div className="bg-background text-on-background min-h-screen">
      {/* Sidebar */}
      <Sidebar role={role} />

      {/* Topbar */}
      <Topbar sidebarWidth={sidebarWidth} />

      {/* Main Content */}
      <main 
        className="pt-24 px-8 pb-12 transition-all duration-300"
        style={{ marginLeft: sidebarWidth }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile overlay */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => useUIStore.getState().setSidebarCollapsed(true)}
        />
      )}
    </div>
  );
}
