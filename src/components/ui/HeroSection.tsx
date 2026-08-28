import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { schoolsApi, coursesApi } from '@/services/dashboardApi';

const MOCK_CODE_LINES = [
  { text: '#include <Arduino.h>', highlight: 'text-pink-500 font-semibold' },
  { text: '', highlight: '' },
  { text: 'void setup() {', highlight: 'text-blue-400 font-semibold' },
  { text: '  pinMode(LED_BUILTIN, OUTPUT);', highlight: 'text-blue-300 pl-4' },
  { text: '}', highlight: 'text-blue-400' },
  { text: '', highlight: '' },
  { text: 'void loop() {', highlight: 'text-blue-400 font-semibold' },
  { text: '  digitalWrite(LED_BUILTIN, HIGH);', highlight: 'text-blue-300 pl-4' },
  { text: '  delay(1000);', highlight: 'text-blue-300 pl-4' },
  { text: '}', highlight: 'text-blue-400' }
];

export function HeroSection() {
  const [partnerSchoolsCount, setPartnerSchoolsCount] = useState<number | null>(null);
  const [coursesCount, setCoursesCount] = useState<number | null>(null);

  useEffect(() => {
    schoolsApi.getAll()
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.items || []);
        const approved = list.filter((s: any) => s.status === 1 || String(s.status).toLowerCase() === 'approved');
        if (approved.length > 0) {
          setPartnerSchoolsCount(approved.length);
        }
      })
      .catch(() => {});

    coursesApi.getAll({ pageSize: 1 })
      .then((res: any) => {
        const total = res?.totalItems ?? res?.totalCount ?? (Array.isArray(res) ? res.length : null);
        if (total !== null && total > 0) {
          setCoursesCount(total);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="relative pt-24 pb-32 overflow-hidden bg-background border-b border-border transition-colors duration-300">
      
      {/* CSS Dot Grid Background */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(hsl(var(--border))_1px,transparent_1px)] [background-size:24px_24px] opacity-35"></div>
      
      {/* Glowing Ambient Blurs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side Copy */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-brand-500 dark:text-brand-400 text-xs font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse"></span>
              v2.0 Simulation Engine
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-foreground leading-[1.1] tracking-tight">
              Biến ý tưởng thành hiện thực. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-500">
                Không lo cháy nổ.
              </span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
              Hệ sinh thái thực hành STEM trực tuyến kết hợp lập trình và mô phỏng phần cứng. Viết code, nối dây và chạy thử mạch điện tử y như thật ngay trên trình duyệt.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link 
                to="/register" 
                className="inline-flex justify-center items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-8 py-3.5 rounded-xl font-semibold shadow-glow-brand transition-all active:scale-[0.98]"
              >
                Mở Lab Miễn phí
                <Icon name="ArrowRight" size={18} />
              </Link>
              <a 
                href="#b2b" 
                className="inline-flex justify-center items-center gap-2 bg-transparent hover:bg-secondary text-muted-foreground hover:text-foreground border border-border px-8 py-3.5 rounded-xl font-semibold transition-all"
              >
                Dành cho Nhà trường
              </a>
            </div>

            {/* Platform Stats */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-border/65 max-w-lg">
              <div>
                <div className="text-2xl font-extrabold text-foreground tracking-tight">
                  {partnerSchoolsCount !== null ? `${partnerSchoolsCount}+` : '15+'}
                </div>
                <div className="text-[10px] md:text-xs text-muted-foreground font-bold uppercase tracking-wider">Trường đối tác</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-foreground tracking-tight">
                  {coursesCount !== null ? `${coursesCount}+` : '10+'}
                </div>
                <div className="text-[10px] md:text-xs text-muted-foreground font-bold uppercase tracking-wider">Khóa học STEM</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-foreground tracking-tight">100%</div>
                <div className="text-[10px] md:text-xs text-muted-foreground font-bold uppercase tracking-wider">Mô phỏng Cloud</div>
              </div>
            </div>
          </div>

          {/* Right Side Interactive Mockup (No Image Tag) */}
          <div className="relative">
            <div className="bg-card/85 backdrop-blur-xl border border-border rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[400px]">
              
              {/* Window Bar */}
              <div className="bg-muted/80 px-4 py-3 flex items-center gap-2 border-b border-border">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                </div>
                <div className="mx-auto bg-card text-muted-foreground text-xs font-mono px-3 py-1 rounded-md">main.cpp - ESP32</div>
              </div>
              
              {/* Split Pane Editor/Simulator */}
              <div className="flex flex-1 overflow-hidden">
                
                {/* Fake VS Code syntax highlighted editor */}
                <div className="w-1/2 bg-slate-950 p-4 font-mono text-xs overflow-hidden border-r border-border/40 select-none">
                  <div className="text-slate-500 flex gap-4">
                    <div className="text-slate-850 text-right select-none space-y-1 w-4">
                      {MOCK_CODE_LINES.map((_, i) => <div key={i}>{i + 1}</div>)}
                    </div>
                    <div className="space-y-1 overflow-x-auto no-scrollbar w-full">
                      {MOCK_CODE_LINES.map((line, i) => (
                        <div key={i} className={line.highlight || 'text-slate-500'}>{line.text}</div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Abstract ESP32 hardware simulator block */}
                <div className="w-1/2 bg-muted/20 relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--border))_1px,transparent_1px)] [background-size:12px_12px] opacity-15"></div>
                  
                  {/* Board layout */}
                  <div className="relative z-10 bg-zinc-950 border-2 border-zinc-800 rounded-xl w-28 h-40 md:w-32 md:h-48 shadow-xl flex flex-col items-center py-2">
                    
                    {/* ESP32 Core module */}
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col items-center justify-center mb-4 p-1">
                      <Icon name="Cpu" className="text-zinc-700 animate-pulse w-8 h-8" />
                      <span className="text-zinc-600 text-[8px] md:text-[9px] font-mono">ESP32</span>
                    </div>
                    
                    {/* GPIO Pins representation */}
                    <div className="flex gap-1 w-full px-2 justify-between">
                      <div className="flex flex-col gap-1">
                        {[...Array(6)].map((_, i) => <div key={`l-${i}`} className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-zinc-800"></div>)}
                      </div>
                      <div className="flex flex-col gap-1">
                        {[...Array(6)].map((_, i) => <div key={`r-${i}`} className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-zinc-800"></div>)}
                      </div>
                    </div>
                    
                    {/* Glowing synthetic LED connection wire */}
                    <div className="absolute -right-6 md:-right-8 top-12 flex items-center">
                      <div className="w-6 md:w-8 h-0.5 bg-red-500/50"></div>
                      <div className="w-3.5 h-3.5 md:w-4.5 md:h-4.5 rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse"></div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          </div>

        </div>
      </div>

    </section>
  );
}

export default HeroSection;
