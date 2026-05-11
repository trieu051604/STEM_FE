import { PageHeader, SectionCard } from '@/components/common/UIComponents';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { PERFORMANCE_DATA } from '@/utils/mockData';

const RADAR = [{ s: 'Vật lý', v: 85 },{ s: 'Hóa học', v: 78 },{ s: 'Sinh học', v: 92 },{ s: 'Toán', v: 88 },{ s: 'CN', v: 70 },{ s: 'KT', v: 75 }];

export function PerformanceAnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Phân tích hiệu suất" subtitle="Đánh giá kết quả học tập toàn trường" />
      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard title="Xu hướng học tập">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={PERFORMANCE_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis domain={[60, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>
        <SectionCard title="Năng lực theo môn">
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={RADAR}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="s" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Radar dataKey="v" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>
    </div>
  );
}
