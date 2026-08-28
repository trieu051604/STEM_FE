import React from 'react';
import { Icon } from '@/components/ui/Icon';

export function Footer() {
  return (
    <footer className="bg-background text-muted-foreground py-12 border-t border-border transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* StemFlow Branding */}
          <div className="flex items-center gap-3 select-none">
            <div className="font-bold text-xl tracking-tight text-foreground flex items-center gap-2">
              <Icon name="Cpu" className="text-brand-500 animate-pulse w-6 h-6" />
              <span>Stem<span className="text-brand-500">Flow</span></span>
            </div>
            <span className="hidden sm:inline-block text-border">|</span>
            <span className="text-xs text-muted-foreground hidden sm:inline-block">
              Nền tảng thực hành STEM & Mô phỏng Vi điều khiển ESP32
            </span>
          </div>

          {/* Copyright & Status */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-xs font-mono text-muted-foreground">
            <span>© {new Date().getFullYear()} StemFlow. Bảo lưu mọi quyền.</span>
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Hệ thống hoạt động ổn định
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
