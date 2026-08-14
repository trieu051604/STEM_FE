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

  return (
    <div className="teacher-theme min-h-screen bg-background text-foreground flex flex-col">
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
        className="flex flex-col flex-1 transition-all duration-200"
        style={{ marginLeft: isDesktop && !sidebarCollapsed ? sidebarWidth : '0px' }}
      >
        <TeacherHeader isDesktop={isDesktop} />

        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
        
        <footer className="py-6 px-6 border-t border-border mt-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2026 StemFlow. Nền tảng STEM thực hành.</p>
            <div className="flex items-center gap-4">
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
