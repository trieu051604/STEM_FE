import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, PlayCircle } from 'lucide-react';

const VIRTUAL_LAB_IMAGE_URL = 'https://xvookhjvebxszqfdfuen.supabase.co/storage/v1/object/public/avatars/dashboard/1.jpg';

const HIGHLIGHT_METRICS = [
  { value: '100%', label: 'Mô phỏng Trực tuyến', desc: 'Không cần phần cứng vật lý' },
  { value: 'ESP32 DevKit', label: 'Vi điều khiển chuẩn', desc: 'WiFi, Bluetooth & Lập trình C' },
  { value: 'Thời gian thực', label: 'Biên dịch tức thì', desc: 'Trợ lý AI phân tích & hướng dẫn sửa lỗi' },
];

export function HeroSection() {
  return (
    <section className="relative pt-20 pb-24 overflow-hidden bg-background border-b border-border transition-colors duration-300">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(hsl(var(--border))_1px,transparent_1px)] [background-size:24px_24px] opacity-30"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Content (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 text-xs sm:text-sm font-semibold tracking-wide">
              <Sparkles className="w-4 h-4 text-brand-500" />
              Nền tảng Thực hành STEM IoT & Vi điều khiển ESP32
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-foreground tracking-tight leading-[1.2]">
              Lập trình STEM & IoT{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-indigo-400 to-emerald-400">
                Thực hành mô phỏng ESP32
              </span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Hệ sinh thái mô phỏng phần cứng ESP32 chuyên sâu cho học sinh. Tự do nối dây cảm biến, lập trình Smart Home, điều khiển Robot và biên dịch code C an toàn 100% trên trình duyệt.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link 
                to="/register" 
                className="inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-7 py-3.5 rounded-xl font-semibold text-base shadow-lg shadow-brand-600/20 hover:shadow-brand-600/30 transition-all active:scale-[0.98]"
              >
                Đăng ký Dành cho Trường học
                <ArrowRight size={18} />
              </Link>
              <Link 
                to="/login" 
                className="inline-flex items-center justify-center gap-2 bg-secondary hover:bg-muted text-foreground border border-border px-7 py-3.5 rounded-xl font-semibold text-base transition-all"
              >
                <PlayCircle size={18} className="text-brand-500" />
                Vào Phòng Học Lab
              </Link>
            </div>

            {/* Feature Metrics */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
              {HIGHLIGHT_METRICS.map((item, idx) => (
                <div key={idx}>
                  <div className="text-xl sm:text-2xl font-black text-foreground tracking-tight">{item.value}</div>
                  <div className="text-xs sm:text-sm font-semibold text-brand-500 mt-0.5">{item.label}</div>
                  <div className="text-xs text-muted-foreground hidden sm:block mt-0.5">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Hero Virtual Lab Actual Screenshot (7 cols) */}
          <div className="lg:col-span-7 relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-500/20 via-indigo-500/20 to-emerald-500/20 rounded-3xl blur-xl opacity-60"></div>
            
            <div className="relative bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
              {/* Window Bar */}
              <div className="bg-muted/90 px-4 py-3 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                  </div>
                  <div className="text-xs font-mono text-muted-foreground bg-background px-3 py-0.5 rounded border border-border">
                    sketch.ino • StemFlow Virtual Lab
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  ĐANG MÔ PHỎNG
                </span>
              </div>

              {/* Lab Interface Image */}
              <div className="relative bg-[#121214] overflow-hidden group">
                <img 
                  src={VIRTUAL_LAB_IMAGE_URL} 
                  alt="StemFlow Virtual Lab Interface" 
                  className="w-full h-auto object-cover rounded-b-2xl shadow-inner transition-transform duration-500 group-hover:scale-[1.015]"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default HeroSection;
