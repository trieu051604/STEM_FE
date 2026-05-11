import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Server, Cpu, HardDrive, Wifi, AlertTriangle } from 'lucide-react';
import { PageHeader, SectionCard, LiveIndicator } from '@/components/common/UIComponents';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

function useRealtime(base: number, range: number) {
  const [val, setVal] = useState(base);
  useEffect(() => {
    const i = setInterval(() => setVal(base + (Math.random() - 0.5) * range * 2), 1500);
    return () => clearInterval(i);
  }, [base, range]);
  return parseFloat(val.toFixed(1));
}

const HISTORY = Array.from({ length: 20 }, (_, i) => ({ t: i, cpu: 40 + Math.random() * 30, mem: 55 + Math.random() * 20, req: 100 + Math.random() * 80 }));

export function SystemMonitoringPage() {
  const cpu = useRealtime(52, 10);
  const mem = useRealtime(68, 8);
  const req = useRealtime(145, 40);
  const uptime = '99.9%';

  return (
    <div className="space-y-6">
      <PageHeader title="Giám sát hệ thống" subtitle="Trạng thái máy chủ realtime"
        actions={<LiveIndicator label="MONITORING ACTIVE" />} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'CPU Usage', value: `${cpu}%`, icon: <Cpu size={20} />, color: cpu > 80 ? 'text-red-400' : 'text-brand-400', bg: 'bg-brand-500/10' },
          { label: 'Memory', value: `${mem}%`, icon: <HardDrive size={20} />, color: mem > 85 ? 'text-red-400' : 'text-accent-400', bg: 'bg-accent-500/10' },
          { label: 'Requests/min', value: req, icon: <Wifi size={20} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Uptime', value: uptime, icon: <Server size={20} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        ].map(s => (
          <motion.div key={s.label} animate={{ borderColor: s.color.includes('red') ? 'rgba(239,68,68,0.4)' : 'rgba(51,65,85,0.5)' }} className="glass-card p-5 border">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 mb-1">{s.label}</p>
                <p className={`text-3xl font-bold font-mono ${s.color}`}>{s.value}</p>
              </div>
              <div className={`p-2 rounded-xl ${s.bg}`}><span className={s.color}>{s.icon}</span></div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard title="CPU & Memory (realtime)">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={HISTORY}>
              <XAxis dataKey="t" hide />
              <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', fontSize: 11, borderRadius: 8 }} />
              <Line type="monotone" dataKey="cpu" stroke="#6366f1" strokeWidth={1.5} dot={false} name="CPU %" />
              <Line type="monotone" dataKey="mem" stroke="#0ea5e9" strokeWidth={1.5} dot={false} name="MEM %" />
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Trạng thái dịch vụ">
          <div className="space-y-3">
            {[
              { name: 'API Gateway', status: 'online', latency: '12ms' },
              { name: 'Socket.IO Server', status: 'online', latency: '8ms' },
              { name: 'PostgreSQL', status: 'online', latency: '3ms' },
              { name: 'Redis Cache', status: 'online', latency: '1ms' },
              { name: 'File Storage', status: 'warning', latency: '245ms' },
            ].map(s => (
              <div key={s.name} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${s.status === 'online' ? 'bg-emerald-400' : 'bg-amber-400'} ${s.status === 'online' ? 'animate-pulse' : ''}`} />
                  <span className="text-sm text-slate-300">{s.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-slate-400">{s.latency}</span>
                  {s.status === 'warning' && <AlertTriangle size={12} className="text-amber-400" />}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
