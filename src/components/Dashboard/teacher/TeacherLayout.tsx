import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebarStore } from '@/stores/sidebarStore';
import { TeacherSidebar } from './TeacherSidebar';
import { TeacherHeader } from './TeacherHeader';

export const TeacherLayout = () => {
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed } = useSidebarStore();
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' && window.innerWidth >= 1024
  );

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

  useEffect(() => {
    if (sidebarOpen && !isDesktop) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [sidebarOpen, isDesktop]);

  const sidebarWidth = sidebarCollapsed ? '0px' : '280px';
  const effectiveMargin = isDesktop ? sidebarWidth : '0px';

  return (
    <div className="min-h-screen bg-background text-foreground">
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

      <TeacherSidebar isDesktop={isDesktop} />

      <div
        className="flex flex-col min-h-screen transition-all duration-200"
        style={{ marginLeft: effectiveMargin }}
      >
        <TeacherHeader isDesktop={isDesktop} />

        <main className="flex-1 overflow-auto p-4 lg:p-6 bg-background">
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
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Trợ giúp</a>
              <a href="#" className="hover:text-foreground transition-colors">Điều khoản</a>
              <a href="#" className="hover:text-foreground transition-colors">Bảo mật</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
