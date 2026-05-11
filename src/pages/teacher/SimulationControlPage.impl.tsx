import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Square, Mic, Radio, Users, Thermometer, Zap, Activity, Send, Settings, Eye } from 'lucide-react';
import { LiveIndicator, SectionCard, PageHeader, AvatarGroup, OnlineCounter } from '@/components/common/UIComponents';
import { MOCK_STUDENTS } from '@/utils/mockData';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import clsx from 'clsx';

const SENSOR_DATA = Array.from({ length: 20 }, (_, i) => ({ t: i, v: 20 + Math.sin(i*0.5)*8 }));

export function SimulationControlPage() {
  const [status, setStatus] = useState<'idle' | 'running' | 'paused'>('idle');
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcast, setBroadcast] = useState('');
  const [voltage, setVoltage] = useState(5);
  const [temp, setTemp] = useState(25);

  return (
    <div className="flex gap-0 h-[calc(100vh-5rem)] -m-6">
      {/* Left Control Panel */}
      <div className="w-72 flex-shrink-0 bg-slate-950 border-r border-slate-700/50 flex flex-col overflow-y-auto no-scrollbar">
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-2 mb-3">
            <LiveIndicator label={status === 'running' ? 'ĐANG CHẠY' : 'CHỜ'} />
            <span className="text-xs font-bold text-white">Lab Control Panel</span>
          </div>

          {/* Session controls */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button onClick={() => setStatus('running')} disabled={status === 'running'} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-40 transition-colors text-xs">
              <Play size={16} /> Bắt đầu
            </button>
            <button onClick={() => setStatus('paused')} disabled={status !== 'running'} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 disabled:opacity-40 transition-colors text-xs">
              <Pause size={16} /> Tạm dừng
            </button>
            <button onClick={() => setStatus('idle')} disabled={status === 'idle'} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 disabled:opacity-40 transition-colors text-xs">
              <Square size={16} /> Kết thúc
            </button>
          </div>

          {/* Broadcast */}
          <div className="mb-4">
            <label className="block text-xs text-slate-400 mb-1">Phát thông báo cho học sinh</label>
            <div className="flex gap-1">
              <input value={broadcast} onChange={e => setBroadcast(e.target.value)} placeholder="Nhập hướng dẫn..." className="input-base flex-1 py-1.5 text-xs" />
              <button onClick={() => { setBroadcasting(true); setTimeout(() => setBroadcasting(false), 3000); }}
                className="btn-primary px-2 py-1.5 text-xs flex-shrink-0"><Radio size={12} /></button>
            </div>
          </div>

          {/* Experiment params */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span className="flex items-center gap-1"><Zap size={10} /> Điện áp</span>
                <span className="font-mono text-brand-400">{voltage}V</span>
              </div>
              <input type="range" min={0} max={12} value={voltage} onChange={e => setVoltage(+e.target.value)} className="w-full accent-brand-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span className="flex items-center gap-1"><Thermometer size={10} /> Nhiệt độ</span>
                <span className="font-mono text-red-400">{temp}°C</span>
              </div>
              <input type="range" min={0} max={100} value={temp} onChange={e => setTemp(+e.target.value)} className="w-full accent-red-500" />
            </div>
          </div>
        </div>

        {/* Sensor mini chart */}
        <div className="p-4 border-b border-slate-700/50">
          <p className="text-xs text-slate-400 mb-2 flex items-center gap-1"><Activity size={10} /> Dữ liệu realtime</p>
          <ResponsiveContainer width="100%" height={70}>
            <LineChart data={SENSOR_DATA}>
              <Line type="monotone" dataKey="v" stroke="#6366f1" strokeWidth={1.5} dot={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', fontSize: 10, borderRadius: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Student list */}
        <div className="p-4 flex-1 overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-300 flex items-center gap-1"><Users size={12} /> Học sinh</p>
            <OnlineCounter count={MOCK_STUDENTS.filter(s=>s.isOnline).length} />
          </div>
          <div className="space-y-2">
            {MOCK_STUDENTS.map(s => (
              <div key={s.id} className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/5">
                <div className="relative">
                  <img src={s.avatar} className="w-7 h-7 rounded-full" />
                  {s.isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-slate-950" />}
                </div>
                <p className="text-xs text-slate-300 flex-1 truncate">{s.fullName}</p>
                <button className="text-slate-500 hover:text-brand-400"><Eye size={12} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main view - same as student lab but with teacher perspective */}
      <div className="flex-1 bg-slate-950 relative">
        <div className="absolute inset-0 sim-canvas-wrapper flex items-center justify-center">
          <motion.div className="text-center">
            <div className="w-32 h-32 rounded-full gradient-brand flex items-center justify-center mx-auto mb-6 glow-brand">
              <span className="text-6xl">⚗️</span>
            </div>
            <p className="text-white text-lg font-bold">Thí nghiệm Nhiệt động lực học</p>
            <p className="text-slate-400 text-sm mt-1">Trạng thái: {status === 'running' ? '🟢 Đang chạy' : status === 'paused' ? '🟡 Tạm dừng' : '⚪ Chờ'}</p>
            {status === 'idle' && (
              <button onClick={() => setStatus('running')} className="btn-primary mt-6 px-10 py-3 text-base glow-brand">
                <Play size={20} /> Bắt đầu Lab
              </button>
            )}
          </motion.div>
        </div>

        {/* Top HUD */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <LiveIndicator label={status === 'running' ? 'LAB ĐANG CHẠY' : 'TEACHER VIEW'} />
          <AvatarGroup users={MOCK_STUDENTS.map(s => ({ name: s.fullName, avatar: s.avatar }))} />
        </div>

        {/* Broadcast overlay */}
        {broadcasting && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 px-6 py-3 glass border border-brand-500/50 rounded-full text-sm text-white flex items-center gap-2 z-10"
          >
            <Radio size={14} className="text-brand-400 animate-pulse" />
            <span>📢 {broadcast || 'Thông báo đang gửi...'}</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
