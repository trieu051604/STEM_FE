import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { Menu, X } from 'lucide-react';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full z-50 bg-background/80 border-b border-border/60 backdrop-blur-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link to="/" className="font-bold text-2xl tracking-tight text-foreground flex items-center gap-2 select-none">
            <Icon name="Cpu" className="text-brand-500 animate-pulse w-7 h-7" />
            <span>Stem<span className="text-brand-500">Flow</span></span>
          </Link>
          
          {/* Middle Navigation Links */}
          <nav className="hidden md:flex gap-8 items-center text-sm font-semibold text-muted-foreground">
            <a href="#features" className="hover:text-brand-500 hover:scale-105 transition-all duration-250">Phòng Lab ảo</a>
            <a href="#ai-lab" className="hover:text-brand-500 hover:scale-105 transition-all duration-250">Trợ lý AI</a>
            <a href="#pricing" className="hover:text-brand-500 hover:scale-105 transition-all duration-250">Gói AI Token</a>
          </nav>
          
          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            <div className="hidden md:flex items-center gap-4">
              <Link 
                to="/login" 
                className="text-muted-foreground hover:text-foreground text-sm font-semibold transition-colors"
              >
                Đăng nhập
              </Link>
              <Link 
                to="/register" 
                className="bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-brand-600/20 hover:shadow-brand-500/35 active:scale-95 duration-150"
              >
                Đăng ký
              </Link>
            </div>

            {/* Mobile hamburger menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border/80 bg-background/95 backdrop-blur-lg animate-in slide-in-from-top duration-250">
          <div className="px-4 pt-2 pb-6 space-y-2 font-semibold">
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-base text-muted-foreground hover:text-brand-500 hover:bg-muted/50 transition-colors"
            >
              Phòng Lab ảo
            </a>
            <a 
              href="#ai-lab" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-base text-muted-foreground hover:text-brand-500 hover:bg-muted/50 transition-colors"
            >
              Trợ lý AI
            </a>
            <a 
              href="#pricing" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-base text-muted-foreground hover:text-brand-500 hover:bg-muted/50 transition-colors"
            >
              Gói AI Token
            </a>
            <div className="border-t border-border/50 pt-4 flex flex-col gap-3">
              <Link 
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full py-3 rounded-xl text-base text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                Đăng nhập
              </Link>
              <Link 
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full bg-brand-600 hover:bg-brand-500 text-white py-3 rounded-xl text-base font-bold shadow-md transition-all active:scale-[0.98]"
              >
                Đăng ký
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
