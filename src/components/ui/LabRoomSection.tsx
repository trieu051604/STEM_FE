import React from 'react';
import { Icon } from '@/components/ui/Icon';

const VIRTUAL_LAB_IMAGE_URL = 'https://xvookhjvebxszqfdfuen.supabase.co/storage/v1/object/public/avatars/dashboard/1.jpg';

const LAB_HIGHLIGHTS = [
  {
    icon: 'MousePointerClick',
    title: 'Kéo thả linh kiện, nối dây trực quan',
    desc: 'Dựng mạch trên breadboard ảo bằng thao tác kéo thả, với thư viện cảm biến, động cơ, màn hình OLED và vi điều khiển chuẩn ESP32 DevKit V1.',
  },
  {
    icon: 'PlayCircle',
    title: 'Biên dịch & chạy mô phỏng tức thì',
    desc: 'Viết code C và nhấn Chạy để xem mạch phản ứng theo thời gian thực ngay trên trình duyệt, không cần cài đặt phần mềm hay phần cứng vật lý.',
  },
];

export function LabRoomSection() {
  return (
    <section id="features" className="py-24 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 relative overflow-hidden border-t border-b border-slate-200 dark:border-slate-900">
      {/* Ambient background accents */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.08] dark:opacity-25"></div>
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left: Copy + Highlights */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Icon name="FlaskConical" size={14} />
                Phòng Lab ảo
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-snug">
                Một phòng thực hành đầy đủ,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-brand-600 dark:from-emerald-400 dark:to-brand-400">
                  ngay trên trình duyệt
                </span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Không cần phòng máy, không cần bộ Kit vật lý. Học sinh có thể dựng mạch, viết code và quan sát kết quả mô phỏng như đang thực hành trên bàn Lab thật.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {LAB_HIGHLIGHTS.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-slate-900 border border-emerald-200 dark:border-slate-800 flex items-center justify-center flex-shrink-0 text-emerald-600 dark:text-emerald-400">
                    <Icon name={item.icon} size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-950 dark:text-white mb-1">{item.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Virtual Lab Interface Representation */}
          <div className="relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="relative bg-zinc-950 border border-border rounded-2xl overflow-hidden shadow-2xl">
              {/* Lab Workspace Top Bar */}
              <div className="bg-zinc-900 px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                  </div>
                  <span className="text-xs font-semibold text-zinc-300">
                    Phòng Lab Trực Tuyến • ESP32 & L298N Robot Car
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-[11px] font-bold flex items-center gap-1.5 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Đang chạy mô phỏng
                  </span>
                </div>
              </div>

              {/* Real Virtual Lab Screenshot */}
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

export default LabRoomSection;
