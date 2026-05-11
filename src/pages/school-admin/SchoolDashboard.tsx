import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Users, BookOpen, GraduationCap, TrendingUp } from 'lucide-react';
import { KPICard } from '@/components/common/KPICard';
import { PageHeader, SectionCard, StatusBadge, ProgressBar } from '@/components/common/UIComponents';
import { MOCK_TEACHERS, MOCK_COURSES, PERFORMANCE_DATA } from '@/utils/mockData';

const kpis = [
  { title: 'Tổng giáo viên', value: 45, change: 3, changeLabel: ' mới tháng này', icon: <Users size={20} />, color: 'brand' as const },
  { title: 'Học sinh đang học', value: 1200, change: 5.2, changeLabel: ' so với kỳ trước', icon: <GraduationCap size={20} />, color: 'accent' as const },
  { title: 'Khóa học hoạt động', value: 38, change: 2, changeLabel: ' mới', icon: <BookOpen size={20} />, color: 'success' as const },
  { title: 'Điểm TB toàn trường', value: '8.4', change: 0.3, icon: <TrendingUp size={20} />, color: 'warning' as const },
];

export function SchoolDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader title="Tổng quan trường học" subtitle="THPT Khoa học Tự nhiên — Hà Nội" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => <KPICard key={k.title} {...k} index={i} />)}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <SectionCard title="Điểm TB toàn trường (12 tháng)" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={PERFORMANCE_DATA}>
              <defs>
                <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis domain={[60, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="value" stroke="#10b981" fill="url(#gs)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>
        <SectionCard title="Giáo viên nổi bật">
          <div className="space-y-3">
            {MOCK_TEACHERS.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5">
                <div className="relative">
                  <img src={t.avatar} className="w-9 h-9 rounded-full" />
                  {t.isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-slate-900" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{t.fullName}</p>
                  <p className="text-xs text-slate-400">{t.classCount} lớp • {t.studentCount} HS</p>
                </div>
                <StatusBadge status={t.isOnline ? 'active' : 'inactive'} />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
      <SectionCard title="Khóa học theo tiến độ">
        <div className="space-y-3">
          {MOCK_COURSES.slice(0, 5).map((c, i) => (
            <div key={c.id} className="flex items-center gap-4">
              <img src={c.thumbnail} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-1">
                  <p className="text-sm font-medium text-white truncate">{c.title}</p>
                  <span className="text-xs text-slate-400 ml-2">{c.studentCount} HS</span>
                </div>
                <ProgressBar value={[68,45,90,30,72][i]} showLabel size="sm" />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
