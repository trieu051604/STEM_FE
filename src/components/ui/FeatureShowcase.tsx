import React, { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { motion, AnimatePresence } from 'framer-motion';

const PATHS_DATA = [
  {
    id: 'robotics',
    title: 'Robotics & Automation',
    desc: 'Chế tạo robot tránh vật cản, robot dò line, và điều khiển từ xa qua Bluetooth.',
    icon: 'Cpu',
    color: 'border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/30',
    accentColor: 'blue',
    glow: 'group-hover:bg-brand-500/10',
    demo: {
      title: 'Mô phỏng Robot Tránh Vật Cản',
      code: `void loop() {
  float distance = readUltrasonic();
  if (distance < 20) {
    stopRobot();
    turnLeft(90);
  } else {
    moveForward(80); // Speed 80%
  }
}`,
      telemetry: [
        { label: 'Trạng thái', value: 'Đang di chuyển', highlight: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Cảm biến siêu âm', value: '42.5 cm', highlight: 'text-brand-600 dark:text-brand-400 font-mono' },
        { label: 'Động cơ trái / phải', value: '80% / 80%', highlight: 'font-mono' },
        { label: 'Điện áp PIN', value: '7.4 V', highlight: 'font-mono' }
      ]
    }
  },
  {
    id: 'iot',
    title: 'IoT & Smart Home',
    desc: 'Hệ thống tưới cây tự động, cảnh báo rò rỉ khí gas, và điều khiển thiết bị qua Wifi.',
    icon: 'Wifi',
    color: 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30',
    accentColor: 'emerald',
    glow: 'group-hover:bg-emerald-500/10',
    demo: {
      title: 'Hệ thống tưới cây tự động',
      code: `void checkMoisture() {
  int moisture = analogRead(SOIL_PIN);
  if (moisture < SOIL_THRESHOLD) {
    digitalWrite(PUMP_PIN, HIGH); // Mở van nước
    isWatering = true;
  } else {
    digitalWrite(PUMP_PIN, LOW); // Đóng van
    isWatering = false;
  }
}`,
      telemetry: [
        { label: 'Độ ẩm đất', value: '38%', highlight: 'text-amber-600 dark:text-amber-400 font-mono' },
        { label: 'Máy bơm nước', value: 'ĐANG MỞ (ON)', highlight: 'text-emerald-600 dark:text-emerald-400 font-semibold' },
        { label: 'Nhiệt độ phòng', value: '29.5 °C', highlight: 'font-mono' },
        { label: 'Kết nối Cloud', value: 'Đã kết nối', highlight: 'text-brand-500 font-mono' }
      ]
    }
  },
  {
    id: 'games',
    title: 'Logic & Retro Games',
    desc: 'Lập trình game rắn săn mồi, flappy bird trên màn hình LCD, OLED, và LED ma trận.',
    icon: 'Gamepad2',
    color: 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/30',
    accentColor: 'purple',
    glow: 'group-hover:bg-purple-500/10',
    demo: {
      title: 'Game Rắn Săn Mồi trên LED Matrix',
      code: `void drawSnake() {
  for(int i = 0; i < snakeLength; i++) {
    matrix.drawPixel(snakeX[i], snakeY[i], LED_ON);
  }
  matrix.drawPixel(foodX, foodY, LED_ON);
  matrix.writeDisplay();
}`,
      telemetry: [
        { label: 'Điểm số (Score)', value: '140', highlight: 'text-purple-600 dark:text-purple-400 font-mono font-bold' },
        { label: 'Tốc độ rắn', value: 'Level 5 (200ms)', highlight: 'font-mono' },
        { label: 'Trạng thái game', value: 'Đang chơi', highlight: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Nút nhấn nhận được', value: 'BUTTON_UP', highlight: 'text-amber-500 font-mono' }
      ]
    }
  }
];

export function FeatureShowcase() {
  const [selectedPath, setSelectedPath] = useState(PATHS_DATA[0]);
  const [virtualLedActive, setVirtualLedActive] = useState(false);
  const [customMoisture, setCustomMoisture] = useState(38);

  return (
    <section id="paths" className="py-24 bg-background text-foreground transition-colors duration-300 relative overflow-hidden">
      
      {/* Dynamic Background Accents */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-brand-50/30 dark:bg-brand-950/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-100/30 dark:bg-purple-950/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-900 text-brand-600 dark:text-brand-400 text-xs font-semibold mb-4 uppercase tracking-widest">
            Học thông qua trải nghiệm thực tế
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
            Bạn muốn chế tạo gì hôm nay?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground font-medium">
            Chọn một lộ trình học tập để khám phá giao diện lập trình trực quan và hệ thống giả lập vô cùng mạnh mẽ.
          </p>
        </div>

        {/* 3-Col Interactive Selection Cards */}
        <div className="grid lg:grid-cols-3 gap-6 mb-12">
          {PATHS_DATA.map((path) => {
            const isSelected = selectedPath.id === path.id;
            return (
              <button
                key={path.id}
                onClick={() => setSelectedPath(path)}
                className={`group text-left p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between h-64 relative overflow-hidden select-none outline-none ${
                  isSelected
                    ? `${path.color} shadow-lg shadow-brand-500/5`
                    : 'border-border bg-card/50 hover:bg-muted/40 hover:border-border/80'
                }`}
              >
                {/* Accent Background Glow */}
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl -mr-10 -mt-10 opacity-30 ${path.glow} transition-all duration-300`}></div>
                
                <div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 ${
                    isSelected ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
                  }`}>
                    <Icon name={path.icon} size={24} />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight mb-2 text-foreground">{path.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{path.desc}</p>
                </div>

                <div className="flex items-center gap-1.5 text-sm font-bold mt-4">
                  <span>Trải nghiệm ngay</span>
                  <Icon name="ChevronRight" size={16} className={`transition-transform duration-300 ${isSelected ? 'translate-x-1' : 'group-hover:translate-x-1'}`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Simulator Micro-UI Workspace depending on select option */}
        <div className="bg-card text-foreground border border-border rounded-3xl overflow-hidden shadow-2xl p-1 mb-24 transition-colors duration-300">
          <div className="bg-muted/80 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-sm font-mono text-muted-foreground">Không gian tương tác mẫu: <strong className="text-foreground">{selectedPath.demo.title}</strong></span>
            </div>
            {selectedPath.id === 'iot' && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">Độ ẩm mẫu:</span>
                <input 
                  type="range" 
                  min="10" 
                  max="90" 
                  value={customMoisture} 
                  onChange={(e) => setCustomMoisture(Number(e.target.value))}
                  className="w-28 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500" 
                />
                <span className="text-xs font-mono text-emerald-400 font-bold">{customMoisture}%</span>
              </div>
            )}
            {selectedPath.id === 'robotics' && (
              <button 
                onClick={() => setVirtualLedActive(!virtualLedActive)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  virtualLedActive 
                    ? 'bg-brand-600 hover:bg-brand-500 text-white' 
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
                }`}
              >
                {virtualLedActive ? 'Tắt Robot' : 'Chạy Robot'}
              </button>
            )}
          </div>

          <div className="grid md:grid-cols-2 min-h-[300px]">
            
            {/* Simulation Code Pane */}
            <div className="p-6 font-mono text-xs md:text-sm bg-slate-950/95 border-r border-border/40 overflow-x-auto flex flex-col justify-between text-slate-300">
              <div>
                <div className="text-slate-600 mb-2 flex items-center justify-between border-b border-slate-900 pb-2">
                  <span>Trình soạn thảo Code</span>
                  <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-brand-400 font-semibold uppercase">Arduino C++</span>
                </div>
                <pre className="text-brand-300 whitespace-pre-wrap leading-relaxed">
                  {selectedPath.id === 'iot' && customMoisture < 50 ? (
                    selectedPath.demo.code.replace('digitalWrite(PUMP_PIN, HIGH); // Mở van nước', '// ĐẤT KHÔ -> KÍCH HOẠT MÁY BƠM\n    digitalWrite(PUMP_PIN, HIGH);')
                  ) : selectedPath.demo.code}
                </pre>
              </div>
              <div className="text-slate-500 text-[11px] mt-4 flex items-center gap-1">
                <Icon name="CheckCircle2" size={14} className="text-emerald-500" />
                <span>Mạch hoạt động hoàn toàn chính xác. Code đã được tối ưu hóa.</span>
              </div>
            </div>

            {/* Simulation Virtual Board Output Display */}
            <div className="p-6 bg-muted/20 flex flex-col justify-between gap-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--border))_1px,transparent_1px)] [background-size:16px_16px] opacity-10"></div>
              
              <div>
                <div className="text-muted-foreground text-xs font-mono mb-4 flex items-center justify-between">
                  <span>Bảng hiển thị thông số mô phỏng</span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary text-[10px] text-emerald-400 font-bold animate-pulse">RUNNING</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {selectedPath.demo.telemetry.map((t, idx) => {
                    let dispVal = t.value;
                    if (selectedPath.id === 'iot') {
                      if (t.label === 'Độ ẩm đất') {
                        dispVal = `${customMoisture}%`;
                      } else if (t.label === 'Máy bơm nước') {
                        dispVal = customMoisture < 50 ? 'ĐANG MỞ (ON)' : 'ĐANG TẮT (OFF)';
                      }
                    } else if (selectedPath.id === 'robotics' && t.label === 'Trạng thái') {
                      dispVal = virtualLedActive ? 'Đang tránh chướng ngại vật' : 'Tạm dừng';
                    }
                    return (
                      <div key={idx} className="bg-card border border-border p-3.5 rounded-xl">
                        <div className="text-xs text-slate-500 font-medium mb-1">{t.label}</div>
                        <div className={`text-sm font-bold ${
                          dispVal === 'ĐANG MỞ (ON)' || dispVal === 'Đang tránh chướng ngại vật' || dispVal === 'Đang di chuyển'
                            ? 'text-emerald-400' 
                            : dispVal === 'ĐANG TẮT (OFF)' || dispVal === 'Tạm dừng'
                            ? 'text-slate-450'
                            : t.highlight
                        }`}>{dispVal}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Graphic Mockup simulation status */}
              <div className="border border-border bg-card/60 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    selectedPath.id === 'robotics' ? 'bg-brand-500/20 text-brand-400' : selectedPath.id === 'iot' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    <Icon name={selectedPath.icon} size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Linh kiện kết nối</div>
                    <div className="text-[10px] text-slate-450 font-mono">
                      {selectedPath.id === 'robotics' ? 'ESP32 + HC-SR04 + 2x DC Motor' : selectedPath.id === 'iot' ? 'ESP32 + Soil Sensor + Mini Pump' : 'Arduino Uno + 8x8 LED Matrix'}
                    </div>
                  </div>
                </div>

                {/* Simulated Wire LED indicator */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">Trạng thái LED:</span>
                  <div className={`w-4 h-4 rounded-full transition-all duration-300 shadow-lg ${
                    selectedPath.id === 'iot' && customMoisture < 50
                      ? 'bg-red-500 shadow-red-500/80 animate-pulse'
                      : selectedPath.id === 'robotics' && virtualLedActive
                      ? 'bg-brand-500 shadow-brand-500/80 animate-pulse'
                      : selectedPath.id === 'games'
                      ? 'bg-purple-500 shadow-purple-500/80 animate-pulse'
                      : 'bg-slate-800 shadow-none'
                  }`}></div>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Bento Grid Features Layout */}
        <div className="mb-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-4 uppercase tracking-widest">
              Đặc quyền công nghệ vượt trội
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">Tính năng bứt phá giới hạn</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed font-medium">
              Không chỉ là giả lập. StemFlow mang đến bộ công cụ toàn diện giúp người học tiến bộ nhanh gấp 3 lần so với phương pháp truyền thống.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Feature 1: Custom Sandbox (Large) */}
          <div className="md:col-span-2 bg-card border border-border rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="relative z-10 max-w-lg">
              <div className="w-12 h-12 bg-brand-600 hover:bg-brand-500 text-white rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-brand-600/35">
                <Icon name="Box" size={20} />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">Môi trường mô phỏng không giới hạn</h3>
              <p className="text-muted-foreground leading-relaxed mb-6 font-medium">
                Tự do kéo thả linh kiện, vẽ đường cáp kết nối và chạy thử code tức thì. Hỗ trợ hàng trăm loại cảm biến, động cơ Servo, màn hình hiển thị OLED, cảm biến độ ẩm đất và các bo mạch như Arduino Uno R3, ESP32 DevKit.
              </p>
              <span className="text-brand-600 dark:text-brand-400 font-bold inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                Khám phá kho linh kiện <Icon name="ArrowRight" size={16} />
              </span>
            </div>
            
            {/* Visual Abstract Wire Simulation Overlay */}
            <div className="absolute right-0 bottom-0 w-1/2 h-1/2 opacity-20 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none hidden md:block select-none">
              <svg viewBox="0 0 200 100" fill="none" className="w-full h-full text-blue-500">
                <path d="M10 20 H60 V80 H120 V50 H190" stroke="currentColor" strokeWidth="2.5" strokeDasharray="5" className="animate-[dash_8s_linear_infinite]" />
                <circle cx="10" cy="20" r="5" fill="currentColor" />
                <circle cx="60" cy="80" r="5" fill="currentColor" />
                <circle cx="120" cy="50" r="5" fill="currentColor" />
                <circle cx="190" cy="50" r="5" fill="currentColor" />
              </svg>
            </div>
          </div>

          {/* Feature 2: Smart Rubric */}
          <div className="bg-card border border-border rounded-3xl p-8 flex flex-col justify-between hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
            <div className="w-12 h-12 bg-pink-500/10 text-pink-600 dark:text-pink-400 rounded-xl flex items-center justify-center mb-6">
              <Icon name="CheckCircle2" size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">Chấm điểm Rubric thông minh</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                Hệ thống tự động phân tích mã nguồn và sơ đồ mạch để kiểm tra tính đúng đắn theo bộ tiêu chuẩn thiết lập sẵn, phản hồi lỗi sai ngay lập tức.
              </p>
            </div>
            <div className="bg-background border border-border p-3.5 rounded-xl font-mono text-[11px]">
              <div className="flex justify-between text-slate-500 mb-1">
                <span>Kiểm tra cú pháp code</span>
                <span className="text-emerald-500 font-bold">✓ PASS</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Nối đất LED_BUILTIN</span>
                <span className="text-rose-500 font-bold">✗ SAI DÂY</span>
              </div>
            </div>
          </div>

          {/* Feature 3: Cloud Storage */}
          <div className="bg-card border border-border rounded-3xl p-8 flex flex-col justify-between hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center mb-6">
              <Icon name="Cloud" size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">Đồng bộ Cloud & Chia sẻ 1-Click</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                Không cần cài đặt phần mềm phức tạp. Mọi dự án được đồng bộ hóa tức thì lên đám mây. Chia sẻ sản phẩm thực hành tới giáo viên chỉ với một đường link.
              </p>
            </div>
            <div className="bg-background border border-border py-2.5 px-4 rounded-xl flex items-center justify-between text-xs">
              <span className="font-mono text-slate-500 truncate mr-2">stemflow.vn/project/x3f9...</span>
              <button className="bg-brand-600 text-white px-2.5 py-1 rounded-md text-[10px] font-bold active:scale-95 transition-all">COPY</button>
            </div>
          </div>

          {/* Feature 4: AI Copilot (Large) */}
          <div className="md:col-span-2 bg-card border border-border rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group overflow-hidden">
            <div className="flex-1">
              <div className="w-12 h-12 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-6">
                <Icon name="Terminal" size={20} />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">Trợ lý AI gỡ lỗi thời gian thực</h3>
              <p className="text-muted-foreground leading-relaxed font-medium">
                Gặp lỗi biên dịch hoặc mạch điện không chạy? Trợ lý AI được tích hợp sẵn sẽ đọc hiểu lỗi sơ đồ phần cứng và mã C++, đưa ra giải thích tường tận và hướng dẫn cách sửa cụ thể.
              </p>
            </div>
            
            <div className="flex-1 w-full bg-slate-950 rounded-2xl border border-border/20 p-4 font-mono text-xs text-slate-400 relative">
              <div className="text-rose-400 mb-2 flex items-center gap-1.5 border-b border-slate-900 pb-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span>Error: &apos;SOIL_PIN&apos; was not declared</span>
              </div>
              <div className="space-y-3 mt-2">
                <div className="bg-slate-900 p-2.5 rounded-lg border border-border/10 text-slate-400">
                  <div className="text-[10px] text-purple-400 font-bold mb-1">💡 AI gợi ý cách sửa:</div>
                  Bạn chưa định nghĩa chân nhận tín hiệu cho cảm biến độ ẩm. Thêm định nghĩa ở dòng đầu tiên:
                  <code className="block mt-1 text-emerald-400">#define SOIL_PIN 34</code>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

export default FeatureShowcase;
