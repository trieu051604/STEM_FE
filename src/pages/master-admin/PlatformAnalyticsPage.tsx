import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PageHeader, SectionCard } from '@/components/common/UIComponents';
import { PERFORMANCE_DATA, SUBJECT_DISTRIBUTION, MOCK_SCHOOLS } from '@/utils/mockData';

export function PlatformAnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Platform Analytics" subtitle="Phân tích toàn nền tảng STEM Lab"
        actions={<button className="btn-secondary">Xuất báo cáo</button>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ l: 'DAU', v: '3,245' }, { l: 'MAU', v: '11,500' }, { l: 'Sessions', v: '8,932' }, { l: 'Avg. time', v: '42 phút' }].map(s => (
          <div key={s.l} className="glass-card p-4 text-center">
            <p className="text-2xl font-bold gradient-text">{s.v}</p>
            <p className="text-xs text-slate-400">{s.l}</p>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <SectionCard title="Hoạt động người dùng (12 tháng)" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={PERFORMANCE_DATA.map((d, i) => ({ ...d, sessions: 5000 + i * 250 + Math.random() * 400 }))}>
              <defs>
                <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="sessions" stroke="#0ea5e9" fill="url(#ga)" strokeWidth={2} name="Sessions" />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>
        <SectionCard title="Phân bổ môn học">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={SUBJECT_DISTRIBUTION} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                {SUBJECT_DISTRIBUTION.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {SUBJECT_DISTRIBUTION.map(s => (
              <span key={s.name} className="flex items-center gap-1 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                {s.name}
              </span>
            ))}
          </div>
        </SectionCard>
      </div>
      <SectionCard title="Hiệu suất theo trường">
        <div className="space-y-3">
          {MOCK_SCHOOLS.map((s, i) => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40">
              <div>
                <p className="text-sm font-medium text-white">{s.name}</p>
                <p className="text-xs text-slate-400">{s.address}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-brand-400">{[89, 85, 78][i]}%</p>
                <p className="text-xs text-slate-500">Performance</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
