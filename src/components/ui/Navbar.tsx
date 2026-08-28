import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import ThemeToggle from '@/components/ui/ThemeToggle';

export function Navbar() {
  return (
    <header className="fixed top-0 w-full z-50 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/80 backdrop-blur-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <div className="font-bold text-2xl tracking-tight text-slate-950 dark:text-white flex items-center gap-2 select-none">
            <Icon name="Cpu" className="text-brand-500 animate-pulse" />
            <span>Stem<span className="text-brand-500">Flow</span></span>
          </div>

          {/* Middle Navigation Links */}
          <nav className="hidden md:flex gap-8 items-center text-sm font-medium text-slate-600 dark:text-slate-350">
            <a href="#paths" className="hover:text-slate-950 dark:hover:text-white transition-colors">Chương trình</a>
            <a href="#features" className="hover:text-slate-950 dark:hover:text-white transition-colors">Phòng Lab</a>
            <a href="#b2b" className="hover:text-slate-950 dark:hover:text-white transition-colors">Giải pháp</a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              to="/login"
              className="hidden md:block text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white text-sm font-medium transition-colors"
            >
              Đăng nhập
            </Link>
            <Link 
              to="/register" 
              className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-600/10 active:scale-95 duration-100"
            >
              Đăng ký
            </Link>
          </div>

        </div>
      </div>
    </header>
  );
}

export default Navbar;
