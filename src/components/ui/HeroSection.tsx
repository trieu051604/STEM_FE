import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';

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
  return (
    <section className="relative pt-24 pb-32 overflow-hidden bg-slate-950 border-b border-slate-900">
      
      {/* CSS Dot Grid Background */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-35"></div>
      
      {/* Glowing Ambient Blurs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side Copy */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-blue-400 text-xs font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
              v2.0 Simulation Engine
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
              Biến ý tưởng thành hiện thực. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                Không lo cháy nổ.
              </span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-lg">
              Hệ sinh thái thực hành STEM trực tuyến kết hợp lập trình và mô phỏng phần cứng. Viết code, nối dây và chạy thử mạch điện tử y như thật ngay trên trình duyệt.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link 
                to="/register" 
                className="inline-flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-semibold shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all active:scale-[0.98]"
              >
                Mở Lab Miễn phí
                <Icon name="ArrowRight" size={18} />
              </Link>
              <a 
                href="#b2b" 
                className="inline-flex justify-center items-center gap-2 bg-transparent hover:bg-slate-900 text-slate-350 border border-slate-800 px-8 py-3.5 rounded-xl font-semibold transition-all"
              >
                Dành cho Nhà trường
              </a>
            </div>
          </div>

          {/* Right Side Interactive Mockup (No Image Tag) */}
          <div className="relative">
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-850 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[400px]">
              
              {/* Window Bar */}
              <div className="bg-slate-950 px-4 py-3 flex items-center gap-2 border-b border-slate-850">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                </div>
                <div className="mx-auto bg-slate-900 text-slate-500 text-xs font-mono px-3 py-1 rounded-md">main.cpp - ESP32</div>
              </div>
              
              {/* Split Pane Editor/Simulator */}
              <div className="flex flex-1 overflow-hidden">
                
                {/* Fake VS Code syntax highlighted editor */}
                <div className="w-1/2 bg-slate-950 p-4 font-mono text-xs overflow-hidden border-r border-slate-900 select-none">
                  <div className="text-slate-500 flex gap-4">
                    <div className="text-slate-800 text-right select-none space-y-1 w-4">
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
                <div className="w-1/2 bg-slate-900 relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:12px_12px] opacity-15"></div>
                  
                  {/* Board layout */}
                  <div className="relative z-10 bg-zinc-950 border-2 border-zinc-800 rounded-xl w-28 h-40 md:w-32 md:h-48 shadow-xl flex flex-col items-center py-2">
                    
                    {/* ESP32 Core module */}
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col items-center justify-center mb-4 p-1">
                      <Icon name="Cpu" className="text-zinc-650 animate-pulse w-8 h-8" />
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
