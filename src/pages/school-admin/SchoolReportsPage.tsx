import { PageHeader, SectionCard } from '@/components/common/UIComponents';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PERFORMANCE_DATA } from '@/utils/mockData';

export function SchoolReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Báo cáo trường học" subtitle="Tổng hợp kết quả học tập" actions={<button className="btn-secondary">Xuất PDF</button>} />
      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard title="Kết quả học tập theo tháng">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={PERFORMANCE_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis domain={[60, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="value" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
        <SectionCard title="Tóm tắt học kỳ">
          <div className="space-y-3 text-sm">
            {[['Tổng học sinh', '1,200'], ['Tỷ lệ lên lớp', '98.5%'], ['Điểm TB toàn trường', '8.4/10'], ['Khóa học hoàn thành', '312'], ['Lab sessions tổ chức', '87'], ['Huy hiệu trao', '1,432']].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-slate-700/30">
                <span className="text-slate-400">{k}</span>
                <span className="font-bold text-white">{v}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
