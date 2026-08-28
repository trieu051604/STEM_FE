import React, { useState, useEffect } from 'react';
import { Icon } from '@/components/ui/Icon';
import { schoolsApi } from '@/services/dashboardApi';

const B2B_ADVANTAGES = [
  {
    title: 'Tiết kiệm 100% ngân sách vật tư',
    desc: 'Học sinh được thực hành với đầy đủ linh kiện, cảm biến, vi điều khiển ảo mà không lo cháy nổ, hỏng hóc thiết bị hay hao hụt linh kiện vật lý.',
    icon: 'Sparkles',
    color: 'text-amber-500 bg-amber-500/10'
  },
  {
    title: 'Chấm điểm tự động & giảm tải 90% giáo án',
    desc: 'Hệ thống tự động chấm bài dựa trên hoạt động thực tế của mạch điện và thuật toán viết code. Giáo viên dễ dàng quản lý tiến độ cả lớp học trong nháy mắt.',
    icon: 'TrendingUp',
    color: 'text-emerald-500 bg-emerald-500/10'
  },
  {
    title: 'Triển khai Cloud 0 đồng',
    desc: 'Chỉ cần máy tính kết nối Internet. Không cài đặt phần mềm phức tạp, không đòi hỏi cấu hình phần cứng mạnh, tương thích hoàn toàn Chromebook, Windows, Mac.',
    icon: 'Server',
    color: 'text-brand-500 bg-brand-500/10'
  }
];

const TRUST_LOGOS_FALLBACK = [
  { name: 'Trường THPT Chuyên Lê Hồng Phong', icon: 'School' },
  { name: 'Trường THPT Chuyên Hà Nội - Amsterdam', icon: 'GraduationCap' },
  { name: 'Học viện Sáng tạo STEM Việt Nam', icon: 'Library' },
  { name: 'Đại học Sư phạm Kỹ thuật', icon: 'Building2' }
];

export function B2bSection() {
  const [schools, setSchools] = useState<{ name: string; icon: string }[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await schoolsApi.getAll();
        const approvedSchools = (Array.isArray(response) ? response : (response?.items || []))
          .filter((s: any) => s.status === 1); // 1 = Approved
        
        if (approvedSchools.length > 0) {
          setSchools(approvedSchools.map((s: any) => ({
            name: s.name,
            icon: 'School'
          })));
          setTotalCount(approvedSchools.length);
        } else {
          setSchools(TRUST_LOGOS_FALLBACK);
          setTotalCount(4);
        }
      } catch (error) {
        console.error('Error loading schools for Landing Page:', error);
        setSchools(TRUST_LOGOS_FALLBACK);
        setTotalCount(4);
      }
    };
    fetchSchools();
  }, []);
  return (
    <section id="b2b" className="py-24 bg-muted/30 text-foreground transition-colors duration-300 border-t border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Section Grid (Z-Pattern) */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          
          {/* Left Side: Rich Text Copy */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 text-xs font-bold uppercase tracking-wider">
                Dành cho Trường học & Tổ chức Giáo dục
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
                Giải pháp toàn diện cho <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-brand-600">
                  Nhà trường thời đại số
                </span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed font-medium">
                StemFlow cung cấp hệ quản trị học tập (LMS) được thiết kế chuyên biệt cho môn Công nghệ và STEM. Giúp nhà trường tối ưu hóa chi phí và nâng cao chất lượng thực hành lập trình phần cứng.
              </p>
            </div>

            {/* List of Key Focus Points */}
            <div className="space-y-6">
              {B2B_ADVANTAGES.map((adv, idx) => (
                <div key={idx} className="flex gap-4 items-start group">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-200 ${adv.color}`}>
                    <Icon name={adv.icon} size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-1">{adv.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed font-medium">{adv.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="pt-2">
              <a 
                href="mailto:contact@stemflow.vn" 
                className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-6 py-3.5 rounded-xl font-bold transition-all shadow-md active:scale-95 duration-100"
              >
                <Icon name="Mail" size={18} />
                Liên hệ đăng ký trải nghiệm School Kit
              </a>
            </div>
          </div>

          {/* Right Side: Beautiful HTML Mockup representing Classroom Management Panel */}
          <div className="relative">
            {/* Background glowing decorations */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 dark:bg-brand-600/10 rounded-full blur-[100px] pointer-events-none"></div>
            
            {/* The Dashboard Mockup */}
            <div className="relative bg-card border border-border rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[420px]">
              
              {/* Fake dashboard header */}
              <div className="bg-muted/80 px-5 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Lớp 11A1 - Dự án Hệ thống IoT</h4>
                    <p className="text-[10px] text-muted-foreground">32 học sinh • Lập trình ESP32</p>
                  </div>
                </div>
                
                {/* Simulated action pill */}
                <div className="bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                  Chấm điểm tự động: BẬT
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
          <p className="text-sm font-semibold tracking-wider text-muted-foreground uppercase mb-8">
            Tin dùng bởi các trường THPT và tổ chức giáo dục hàng đầu tại Việt Nam ({totalCount > 0 ? `${totalCount}+` : 'Nhiều'} trường)
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-center max-w-4xl mx-auto">
            {schools.slice(0, 8).map((logo, index) => (
              <div 
                key={index}
                className="flex items-center justify-center gap-2.5 text-muted-foreground hover:text-brand-500 dark:hover:text-brand-400 transition-all duration-200 group cursor-default p-3 bg-card border border-border/50 rounded-xl shadow-sm hover:shadow-md hover:border-brand-500/30"
              >
                <Icon name={logo.icon} className="transition-transform group-hover:scale-110 duration-200 text-brand-500 shrink-0" size={18} />
                <span 
                  className="text-xs font-bold tracking-tight text-left leading-tight text-foreground truncate max-w-[140px]"
                  title={logo.name}
                >
                  {logo.name}
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
