import React from 'react';
import { Icon } from '@/components/ui/Icon';
import { Sparkles, TrendingUp, Server, ShieldCheck, Mail, ArrowRight } from 'lucide-react';

const B2B_ADVANTAGES = [
  {
    title: 'Tiết kiệm 100% chi phí thiết bị vật lý',
    desc: 'Học sinh thực hành không giới hạn với kho linh kiện vi điều khiển, cảm biến ảo, triệt tiêu hoàn toàn rủi ro hỏng hóc hay chập cháy linh kiện.',
    icon: 'Sparkles',
    color: 'text-amber-500 bg-amber-500/10'
  },
  {
    title: 'Giám sát trực tiếp & Quản lý lớp học',
    desc: 'Giáo viên theo dõi trạng thái mạch điện và tiến trình nạp code C của từng học sinh trong thời gian thực, hỗ trợ kịp thời.',
    icon: 'TrendingUp',
    color: 'text-emerald-500 bg-emerald-500/10'
  },
  {
    title: 'Triển khai linh hoạt trên Cloud',
    desc: 'Chạy trực tiếp trên mọi trình duyệt web máy tính, không cần cài đặt driver hay môi trường biên dịch phức tạp.',
    icon: 'Server',
    color: 'text-brand-500 bg-brand-500/10'
  }
];

const TRUST_PARTNERS = [
  'Trường THPT Chuyên Lê Hồng Phong',
  'Trường THPT Chuyên Hà Nội - Amsterdam',
  'Học viện Sáng tạo STEM Việt Nam',
  'Đại học Sư phạm Kỹ thuật'
];

export function B2bSection() {
  return (
    <section id="b2b" className="py-24 bg-muted/30 text-foreground transition-colors duration-300 border-t border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header */}
        <div className="grid lg:grid-cols-2 gap-12 items-end mb-16">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 text-xs font-semibold uppercase tracking-wider mb-4">
              Dành cho Trường học & Tổ chức Giáo dục
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground">
              Giải pháp toàn diện <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-indigo-400 to-emerald-400">
                Cho phòng thực hành STEM
              </span>
            </h2>
          </div>
          <p className="text-base text-muted-foreground leading-relaxed">
            Giúp nhà trường triển khai các tiết học Robotics, IoT và Lập trình Vi điều khiển ESP32 ngay tại phòng máy tính sẵn có mà không phát sinh chi phí mua sắm thiết bị phần cứng hàng năm.
          </p>
        </div>

        {/* 2-Col Main Showcase Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
          
          {/* Left Side: 3 Advantage Cards */}
          <div className="space-y-6">
            {B2B_ADVANTAGES.map((adv, index) => (
              <div 
                key={index}
                className="bg-card border border-border p-6 rounded-2xl flex items-start gap-4 transition-all duration-200 hover:border-border/80 hover:shadow-lg"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${adv.color}`}>
                  <Icon name={adv.icon} size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground mb-1">{adv.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{adv.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right Side: Beautiful HTML Mockup representing Classroom Management Panel */}
          <div className="relative">
            {/* Background glowing decorations */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 dark:bg-brand-600/10 rounded-full blur-[100px] pointer-events-none"></div>
            
            {/* The Dashboard Mockup */}
            <div className="relative bg-card border border-border rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[420px]">
              
              {/* Dashboard header */}
              <div className="bg-muted/80 px-5 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      Chương trình STEM Khoa học & Lập trình Vi điều khiển
                    </h4>
                    <p className="text-[10px] text-muted-foreground">
                      Mô phỏng trực tuyến & Quản lý lớp học
                    </p>
                  </div>
                </div>
                
                {/* Action pill */}
                <div className="bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                  Giám sát trực tiếp: BẬT
                </div>
              </div>

              {/* Mock Classroom Submissions List */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans select-none">
                
                {/* Student 1 */}
                <div className="border border-border bg-background/55 p-3.5 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs">
                      HA
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-foreground truncate">Hoàng Minh Anh</div>
                      <div className="text-[10px] text-muted-foreground font-mono">Bài 04: Soil moisture pump setup</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-emerald-500 dark:text-emerald-400 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900 px-2 py-0.5 rounded-md">
                      10/10 điểm
                    </span>
                    <span className="text-[10px] text-slate-400 hidden sm:block">2 phút trước</span>
                  </div>
                </div>

                {/* Student 2 */}
                <div className="border border-border bg-background/55 p-3.5 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center text-xs">
                      TD
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-foreground truncate">Trần Tiến Dũng</div>
                      <div className="text-[10px] text-muted-foreground font-mono">Bài 04: Soil moisture pump setup</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-amber-600 dark:text-amber-400 text-xs font-bold bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900 px-2 py-0.5 rounded-md">
                      9/10 điểm
                    </span>
                    <span className="text-[10px] text-slate-400 hidden sm:block">10 phút trước</span>
                  </div>
                </div>

                {/* Student 3 */}
                <div className="border border-border bg-background/55 p-3.5 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-xs">
                      ML
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-foreground truncate">Mai Phương Linh</div>
                      <div className="text-[10px] text-muted-foreground font-mono">Bài 04: Soil moisture pump setup</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-red-500 dark:text-red-400 text-xs font-bold bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900 px-2 py-0.5 rounded-md">
                      Cần hỗ trợ
                    </span>
                    <span className="text-[10px] text-slate-400 hidden sm:block">1 giờ trước</span>
                  </div>
                </div>

              </div>

              {/* Classroom Stats Footer */}
              <div className="bg-muted/80 border-t border-border p-4 grid grid-cols-3 gap-2 text-center text-xs font-sans">
                <div className="border-r border-border">
                  <div className="text-muted-foreground text-[10px]">Tỷ lệ hoàn thành</div>
                  <div className="font-extrabold text-foreground text-base">94.2%</div>
                </div>
                <div className="border-r border-border">
                  <div className="text-muted-foreground text-[10px]">Điểm trung bình</div>
                  <div className="font-extrabold text-blue-600 dark:text-blue-400 text-base">8.6/10</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[10px]">Yêu cầu trợ giúp</div>
                  <div className="font-extrabold text-rose-500 text-base">1 bài</div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Social Proof Strip */}
        <div className="border-t border-border pt-16 text-center">
          <p className="text-xs sm:text-sm font-semibold tracking-wider text-muted-foreground uppercase mb-8">
            Tin dùng bởi các trường THPT và tổ chức giáo dục hàng đầu tại Việt Nam
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center justify-center max-w-5xl mx-auto">
            {TRUST_PARTNERS.map((name, index) => (
              <div 
                key={index}
                className="flex items-center justify-center gap-2.5 text-muted-foreground hover:text-brand-500 transition-all duration-200 p-3 bg-card border border-border/60 rounded-xl shadow-sm hover:shadow-md hover:border-brand-500/30"
              >
                <Icon name="School" className="text-brand-500 shrink-0" size={18} />
                <span 
                  className="text-xs font-bold text-foreground truncate"
                  title={name}
                >
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

export default B2bSection;
