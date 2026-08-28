import React from 'react';
import { Icon } from '@/components/ui/Icon';

const LAB_HIGHLIGHTS = [
  {
    icon: 'MousePointerClick',
    title: 'Kéo thả linh kiện, nối dây trực quan',
    desc: 'Dựng mạch trên breadboard ảo bằng thao tác kéo thả, với thư viện cảm biến, động cơ, màn hình OLED và các board Arduino Uno R3, ESP32 DevKit V1.',
  },
  {
    icon: 'PlayCircle',
    title: 'Biên dịch & chạy mô phỏng tức thì',
    desc: 'Viết code C++ và nhấn Chạy để xem mạch phản ứng theo thời gian thực ngay trên trình duyệt, không cần cài đặt phần mềm hay phần cứng vật lý.',
  },
  {
    icon: 'Save',
    title: 'Tự động lưu & phục hồi tiến độ',
    desc: 'Sơ đồ mạch và mã nguồn được lưu lại theo từng học sinh, cho phép dừng và tiếp tục thực hành bất cứ lúc nào.',
  },
  {
    icon: 'RadioTower',
    title: 'Giáo viên giám sát trực tiếp',
    desc: 'Theo dõi trạng thái mạch và tiến trình chạy code của cả lớp trong thời gian thực, phát hiện lỗi và hỗ trợ học sinh kịp thời.',
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
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-950 dark:text-white leading-tight">
                Một phòng thực hành đầy đủ, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-brand-600 dark:from-emerald-400 dark:to-brand-400">
                  ngay trên trình duyệt
                </span>
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
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

          {/* Right: Virtual Lab Mockup */}
          <div className="relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              {/* Fake toolbar */}
              <div className="bg-slate-950/80 px-5 py-3.5 border-b border-slate-850 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/70"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70"></span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">lab_04_soil_moisture.json</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  RUNNING
                </span>
              </div>

              {/* Fake breadboard canvas */}
              <div className="relative h-72 bg-slate-950/60 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:18px_18px] opacity-20"></div>

                <svg viewBox="0 0 260 140" className="w-4/5 h-4/5 relative z-10">
                  <path d="M20 100 H90 V40 H160" stroke="#34d399" strokeWidth="2" strokeDasharray="4" fill="none" className="animate-[dash_6s_linear_infinite]" />
                  <path d="M160 40 H230" stroke="#818cf8" strokeWidth="2" strokeDasharray="4" fill="none" className="animate-[dash_6s_linear_infinite]" />

                  <rect x="0" y="90" width="40" height="20" rx="4" fill="#1e293b" stroke="#475569" />
                  <text x="20" y="103" fontSize="7" fill="#94a3b8" textAnchor="middle">Soil</text>

                  <rect x="150" y="20" width="40" height="40" rx="6" fill="#1e293b" stroke="#475569" />
                  <text x="170" y="43" fontSize="7" fill="#94a3b8" textAnchor="middle">ESP32</text>

                  <rect x="220" y="30" width="30" height="20" rx="4" fill="#1e293b" stroke="#475569" />
                  <text x="235" y="43" fontSize="7" fill="#94a3b8" textAnchor="middle">Pump</text>

                  <circle cx="20" cy="100" r="3" fill="#34d399" />
                  <circle cx="160" cy="40" r="3" fill="#818cf8" />
                  <circle cx="230" cy="40" r="3" fill="#818cf8" />
                </svg>
              </div>

              {/* Fake telemetry footer */}
              <div className="grid grid-cols-3 divide-x divide-slate-850 border-t border-slate-850">
                <div className="p-4 text-center">
                  <p className="text-[10px] text-slate-500 mb-1">Độ ẩm đất</p>
                  <p className="text-lg font-bold text-amber-400 font-mono">38%</p>
                </div>
                <div className="p-4 text-center">
                  <p className="text-[10px] text-slate-500 mb-1">Máy bơm</p>
                  <p className="text-lg font-bold text-emerald-400">BẬT</p>
                </div>
                <div className="p-4 text-center">
                  <p className="text-[10px] text-slate-500 mb-1">Học sinh online</p>
                  <p className="text-lg font-bold text-white font-mono">24/28</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default LabRoomSection;
