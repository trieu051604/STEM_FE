import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { PageHeader, SectionCard, ProgressBar } from '@/components/common/UIComponents';
import { KPICard as KPICardComp } from '@/components/common/KPICard';
import { BookOpen, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { PERFORMANCE_DATA, MOCK_COURSES } from '@/utils/mockData';

const RADAR_DATA = [
  { subject: 'Vật lý', A: 85 }, { subject: 'Hóa học', A: 78 }, { subject: 'Sinh học', A: 92 },
  { subject: 'Toán học', A: 88 }, { subject: 'Công nghệ', A: 70 }, { subject: 'Kỹ thuật', A: 75 },
];

const kpis = [
  { title: 'Tiến độ tổng', value: '68%', change: 5, changeLabel: ' tháng này', icon: <TrendingUp size={20} />, color: 'brand' as const },
  { title: 'Bài hoàn thành', value: 42, change: 8, changeLabel: ' tuần này', icon: <CheckCircle size={20} />, color: 'success' as const },
  { title: 'Giờ học', value: '124h', change: 12, changeLabel: ' tháng này', icon: <Clock size={20} />, color: 'accent' as const },
  { title: 'Khóa hoàn thành', value: 3, change: 1, changeLabel: ' mới', icon: <BookOpen size={20} />, color: 'warning' as const },
];

export function ProgressTrackingPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Tiến độ học tập" subtitle="Tổng quan kết quả học tập của bạn" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => <KPICardComp key={k.title} {...k} index={i} />)}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard title="Điểm trung bình theo tháng">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={PERFORMANCE_DATA}>
              <defs>
                <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis domain={[60, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="value" stroke="#6366f1" fill="url(#gp)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>
        <SectionCard title="Năng lực theo môn">
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={RADAR_DATA}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Radar dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>
      <SectionCard title="Tiến độ từng khóa học">
        <div className="space-y-4">
          {MOCK_COURSES.map((c, i) => (
            <div key={c.id} className="flex items-center gap-4">
              <img src={c.thumbnail} alt={c.title} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-white truncate">{c.title}</p>
                  <span className="text-xs font-bold text-brand-400 ml-2">{[35,68,90,20,55,75][i%6]}%</span>
                </div>
                <ProgressBar value={[35,68,90,20,55,75][i%6]} color={['brand','success','accent','warning','brand','success'][i%6] as never} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
