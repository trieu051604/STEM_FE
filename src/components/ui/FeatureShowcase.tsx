import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { paymentsApi, PaymentPackage } from '@/services/schoolAdminApi';
import { 
  Bot, 
  Cpu, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Coins,
  Loader2
} from 'lucide-react';

const AI_IMAGE_URL = 'https://xvookhjvebxszqfdfuen.supabase.co/storage/v1/object/public/avatars/dashboard/Screenshot%202026-08-28%20231110.png';

const AI_CAPABILITIES = [
  {
    id: 'ai-debugger',
    title: 'AI Soát Lỗi & Gợi Ý Sửa Code C',
    desc: 'Tự động phát hiện lỗi cú pháp, quên khai báo pinMode(), xung đột chân GPIO hoặc sai cấu hình chân vi điều khiển ESP32.',
    badge: 'Code Assistant',
    icon: Bot,
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
  },
  {
    id: 'ai-tutor',
    title: 'AI Hướng Dẫn & Giải Thích Cảm Biến',
    desc: 'Hỗ trợ giải đáp nguyên lý hoạt động của cảm biến siêu âm, cảm biến độ ẩm, động cơ servo và các chân kết nối trên ESP32.',
    badge: 'STEM Tutor',
    icon: Sparkles,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  }
];

export function FeatureShowcase() {
  const [activeCapability, setActiveCapability] = useState(AI_CAPABILITIES[0]);

  const { data: packagesData, isLoading: packagesLoading } = useQuery({
    queryKey: ['public-packages'],
    queryFn: () => paymentsApi.getPackages(),
    staleTime: 5 * 60 * 1000,
  });

  const displayPackages = (packagesData && packagesData.length > 0)
    ? packagesData.filter((p) => p.isActive !== false)
    : [];

  return (
    <section id="ai-lab" className="py-24 bg-background text-foreground transition-colors duration-300 relative overflow-hidden border-t border-border">
      {/* Glow Effects */}
      <div className="absolute top-1/3 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 text-xs sm:text-sm font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Trợ lý AI Thông minh & Phòng Lab Tối ưu
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-snug">
            Trợ lý AI Đắc lực{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-indigo-400 to-emerald-400">
              Đồng hành cùng Giáo viên & Học sinh
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Hỗ trợ từng học sinh tự sửa lỗi lập trình code C, hiểu rõ nguyên lý mạch điện tử và cảm biến ngay trong khi thực hành phòng Lab.
          </p>
        </div>

        {/* AI Capabilities Interactive Showcase */}
        <div className="grid lg:grid-cols-12 gap-10 mb-20 items-center">
          
          {/* Left Feature Selector (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            {AI_CAPABILITIES.map((cap) => {
              const isSelected = activeCapability.id === cap.id;
              const IconComp = cap.icon;
              return (
                <div
                  key={cap.id}
                  onClick={() => setActiveCapability(cap)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-card border-brand-500 shadow-lg shadow-brand-500/10'
                      : 'bg-card/50 border-border hover:bg-card hover:border-border/80'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${cap.color}`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-foreground">{cap.title}</h3>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{cap.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right AI Compact Screenshot (6 cols) */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative max-w-lg w-full">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-brand-500/20 to-emerald-500/20 rounded-3xl blur-xl opacity-60"></div>
              
              <div className="relative bg-[#18181b] border border-border/80 rounded-2xl overflow-hidden shadow-xl">
                {/* Window Header Bar */}
                <div className="bg-zinc-900 px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                      <Bot className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Trợ lý AI STEM</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    AI ASSISTANT
                  </span>
                </div>

                {/* Compact AI Screenshot */}
                <div className="relative bg-[#121214] overflow-hidden group max-h-[340px]">
                  <img 
                    src={AI_IMAGE_URL} 
                    alt="StemFlow AI Assistant in Virtual Lab" 
                    className="w-full h-auto max-h-[340px] object-cover object-top rounded-b-2xl shadow-inner transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* AI Packages Section for Schools */}
        <div id="pricing" className="pt-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-500 bg-brand-500/10 px-3 py-1 rounded-full mb-3">
              <Coins className="w-3.5 h-3.5" />
              Gói AI Quota Dành Cho Nhà Trường
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Bảng Gói AI Token Linh Hoạt Theo Quy Mô
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Nhà trường chỉ cần đăng ký 1 gói Token duy nhất cho toàn bộ giáo viên và học sinh trong trường sử dụng.
            </p>
          </div>

          {packagesLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
              <p className="text-sm font-medium">Đang tải bảng gói AI từ hệ thống...</p>
            </div>
          ) : displayPackages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">Hiện chưa có gói công khai nào.</p>
            </div>
          ) : (
            <div className="relative overflow-hidden py-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 group">
              <style>{`
                @keyframes packageMarquee {
                  0% { transform: translateX(0); }
                  100% { transform: translateX(-50%); }
                }
                .animate-package-marquee {
                  display: flex;
                  width: max-content;
                  animation: packageMarquee 35s linear infinite;
                }
                .animate-package-marquee:hover {
                  animation-play-state: paused;
                }
              `}</style>

              {/* Edge Gradient Fades */}
              <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

              {/* Horizontal 1-Row Auto-Scrolling Marquee */}
              <div className="animate-package-marquee flex gap-6 items-stretch">
                {[...displayPackages, ...displayPackages].map((pkg, idx) => {
                  const formattedPrice = new Intl.NumberFormat('vi-VN').format(pkg.price);
                  const formattedTokens = new Intl.NumberFormat('vi-VN').format(pkg.tokenAmount);
                  const studentLimitText = pkg.studentLimit > 0 ? `Tối đa ${pkg.studentLimit} học sinh` : 'Không giới hạn học sinh';

                  return (
                    <div
                      key={`${pkg.id}-${idx}`}
                      className={`w-[300px] sm:w-[320px] shrink-0 bg-card rounded-2xl border flex flex-col justify-between p-6 relative transition-all duration-300 hover:shadow-xl ${
                        pkg.isFeatured
                          ? 'border-brand-500 shadow-lg shadow-brand-500/10'
                          : 'border-border hover:border-border/80'
                      }`}
                    >
                      {pkg.isFeatured && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-500 to-indigo-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md">
                          Nổi bật nhất
                        </div>
                      )}

                      <div className="space-y-4">
                        <div>
                          <h4 className="text-lg font-bold text-foreground">{pkg.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {pkg.description || 'Dành cho trường học'}
                          </p>
                        </div>

                        <div className="p-3 bg-muted/40 rounded-xl space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-brand-500">
                            <Coins className="w-3.5 h-3.5 shrink-0" />
                            <span>{formattedTokens} Tokens AI</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {studentLimitText}
                          </div>
                        </div>

                        <div className="pt-2">
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{formattedPrice}</span>
                            <span className="text-xs font-semibold text-muted-foreground">đ / trường</span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-border space-y-2.5">
                          <div className="flex items-start gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>Gợi ý sửa lỗi code C & cấu hình ESP32</span>
                          </div>
                          <div className="flex items-start gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>Trợ lý AI hỏi đáp cảm biến & STEM 24/7</span>
                          </div>
                          <div className="flex items-start gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>Quản trị viên phân bổ token cho từng lớp</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6">
                        <Link
                          to="/register"
                          className={`w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
                            pkg.isFeatured
                              ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-md'
                              : 'bg-secondary hover:bg-muted text-foreground border border-border'
                          }`}
                        >
                          Đăng ký Gói cho Trường
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}

export default FeatureShowcase;
