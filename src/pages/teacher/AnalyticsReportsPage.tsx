import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PageHeader, SectionCard } from '@/components/common/UIComponents';
import { PERFORMANCE_DATA, SUBJECT_DISTRIBUTION, MOCK_STUDENTS } from '@/utils/mockData';

export function AnalyticsReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Báo cáo & Phân tích" subtitle="Tổng quan kết quả giảng dạy" />
      <div className="grid lg:grid-cols-3 gap-6">
        <SectionCard title="Điểm TB theo môn" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={PERFORMANCE_DATA.slice(-6)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis domain={[60, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
        <SectionCard title="Phân bổ môn học">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={SUBJECT_DISTRIBUTION} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name} ${value}%`} labelLine={false} fontSize={10}>
                {SUBJECT_DISTRIBUTION.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      {/* Student ranking */}
      <SectionCard title="Bảng xếp hạng học sinh">
        <div className="space-y-2">
          {MOCK_STUDENTS.sort((a, b) => b.gpa - a.gpa).map((s, i) => (
            <div key={s.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/40">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-slate-400 text-white' : i === 2 ? 'bg-amber-700 text-white' : 'bg-slate-700 text-slate-400'}`}>
                {i + 1}
              </span>
              <img src={s.avatar} className="w-8 h-8 rounded-full" />
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{s.fullName}</p>
                <p className="text-xs text-slate-400">{s.grade}</p>
              </div>
              <span className="text-lg font-bold text-brand-400 font-mono">{s.gpa}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
