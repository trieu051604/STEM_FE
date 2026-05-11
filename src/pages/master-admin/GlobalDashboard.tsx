import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Globe, School, Users, FlaskConical, Activity, TrendingUp } from 'lucide-react';
import { KPICard } from '@/components/common/KPICard';
import { PageHeader, SectionCard, StatusBadge, LiveIndicator } from '@/components/common/UIComponents';
import { MOCK_SCHOOLS, PERFORMANCE_DATA } from '@/utils/mockData';

const kpis = [
  { title: 'Tổng trường học', value: 50, change: 3, changeLabel: ' tháng này', icon: <School size={20} />, color: 'brand' as const },
  { title: 'Tổng người dùng', value: '11,500', change: 8.2, changeLabel: ' tăng trưởng', icon: <Users size={20} />, color: 'accent' as const },
  { title: 'Lab sessions hôm nay', value: 234, change: 15, icon: <FlaskConical size={20} />, color: 'success' as const },
  { title: 'Uptime hệ thống', value: '99.9%', icon: <Activity size={20} />, color: 'warning' as const },
];

export function GlobalDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader title="Global Dashboard" subtitle="Tổng quan toàn hệ thống STEM Lab"
        actions={<LiveIndicator label="HỆ THỐNG ONLINE" />} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => <KPICard key={k.title} {...k} index={i} />)}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <SectionCard title="Tăng trưởng người dùng (12 tháng)" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={PERFORMANCE_DATA.map((d, i) => ({ ...d, users: 8000 + i * 300 + Math.random() * 200 }))}>
              <defs>
                <linearGradient id="gg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="users" stroke="#6366f1" fill="url(#gg)" strokeWidth={2} name="Người dùng" />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>
        <SectionCard title="Trường học nổi bật">
          <div className="space-y-3">
            {MOCK_SCHOOLS.map((s, i) => (
              <div key={s.id} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-white">{s.name}</p>
                  <StatusBadge status={s.isActive ? 'active' : 'inactive'} />
                </div>
                <div className="flex gap-3 text-xs text-slate-400">
                  <span>{s.teacherCount} GV</span>
                  <span>•</span>
                  <span>{s.studentCount} HS</span>
                  <span>•</span>
                  <span>{s.courseCount} KH</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
