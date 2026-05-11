import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FlaskConical, Play, Pause, Square, Thermometer, Zap, Activity,
  MessageCircle, Users, Send, Mic, MicOff, Video, VideoOff,
  Maximize2, Settings, ChevronRight, ChevronLeft, RefreshCw, Download
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LiveIndicator, AvatarGroup, OnlineCounter } from '@/components/common/UIComponents';
import { useSimulationStore } from '@/stores';
import clsx from 'clsx';

const MOCK_SENSOR_HISTORY = Array.from({ length: 30 }, (_, i) => ({
  t: i,
  temp: 20 + Math.sin(i * 0.3) * 15 + Math.random() * 2,
  pressure: 1.0 + Math.cos(i * 0.2) * 0.3 + Math.random() * 0.05,
  voltage: 3.5 + Math.sin(i * 0.5) * 1.2 + Math.random() * 0.1,
}));

const MOCK_CHAT: { name: string; msg: string; time: string; isSystem?: boolean }[] = [
  { name: 'Hệ thống', msg: 'Lab đã bắt đầu. Chào mừng tất cả học sinh!', time: '14:00', isSystem: true },
  { name: 'GV Lê Văn Giáo', msg: 'Các em hãy quan sát sự thay đổi nhiệt độ khi tăng điện áp', time: '14:01' },
  { name: 'Phạm Thị Học', msg: 'Thầy ơi, nhiệt độ tăng rất nhanh ạ!', time: '14:02' },
  { name: 'Trần Văn An', msg: 'Em thấy áp suất cũng thay đổi theo', time: '14:03' },
];

const TOOLS = [
  { id: 'thermometer', icon: <Thermometer size={18} />, label: 'Nhiệt kế' },
  { id: 'voltmeter', icon: <Zap size={18} />, label: 'Vôn kế' },
  { id: 'oscilloscope', icon: <Activity size={18} />, label: 'Dao động ký' },
];

const PARTICIPANTS = [
  { name: 'GV Lê Văn Giáo', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher' },
  { name: 'Phạm Thị Học', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student' },
  { name: 'Trần Văn An', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=an' },
  { name: 'Lê Thị Bình', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=binh' },
  { name: 'Nguyễn Khoa', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=khoa' },
];

export function SimulationLabPage() {
  const [status, setStatus] = useState<'idle' | 'running' | 'paused'>('idle');
  const [activeTool, setActiveTool] = useState('thermometer');
  const [chatOpen, setChatOpen] = useState(true);
  const [msg, setMsg] = useState('');
  const [chat, setChat] = useState(MOCK_CHAT);
  const [muted, setMuted] = useState(false);
  const [camOn, setCamOn] = useState(true);
  const [voltage, setVoltage] = useState(3.5);
  const [temperature, setTemperature] = useState(24.5);
  const [pressure, setPressure] = useState(1.2);
  const [sensorData, setSensorData] = useState(MOCK_SENSOR_HISTORY);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Simulate realtime sensor updates when running
  useEffect(() => {
    if (status !== 'running') return;
    const interval = setInterval(() => {
      const newTemp = temperature + (Math.random() - 0.4) * 2;
      const newPressure = pressure + (Math.random() - 0.5) * 0.05;
      setTemperature(parseFloat(newTemp.toFixed(1)));
      setPressure(parseFloat(newPressure.toFixed(2)));
      setSensorData(prev => [...prev.slice(-29), {
        t: prev.length,
        temp: newTemp,
        pressure: newPressure,
        voltage,
      }]);
    }, 1000);
    return () => clearInterval(interval);
  }, [status, temperature, pressure, voltage]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const sendMsg = () => {
    if (!msg.trim()) return;
    setChat(c => [...c, { name: 'Phạm Thị Học', msg: msg.trim(), time: new Date().toLocaleTimeString('vi', { hour: '2-digit', minute: '2-digit' }) }]);
    setMsg('');
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-0 -m-6">
      {/* ── Tool Panel (left) ── */}
      <div className="w-16 flex-shrink-0 bg-slate-950 border-r border-slate-700/50 flex flex-col items-center py-4 gap-2">
        {TOOLS.map(tool => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            title={tool.label}
            className={clsx(
              'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
              activeTool === tool.id
                ? 'gradient-brand text-white glow-brand'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            )}
          >
            {tool.icon}
          </button>
        ))}
        <div className="h-px bg-slate-700 w-8 my-2" />
        <button title="Làm mới" className="w-10 h-10 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center" onClick={() => setSensorData(MOCK_SENSOR_HISTORY)}>
          <RefreshCw size={16} />
        </button>
        <button title="Tải xuống dữ liệu" className="w-10 h-10 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center">
          <Download size={16} />
        </button>
      </div>

      {/* ── Main Canvas ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
        {/* Top bar */}
        <div className="h-12 flex items-center justify-between px-4 bg-slate-900/80 border-b border-slate-700/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <LiveIndicator />
            <span className="text-sm font-semibold text-white">Lab Vật lý — Thí nghiệm Nhiệt động lực học</span>
          </div>
          <div className="flex items-center gap-3">
            <AvatarGroup users={PARTICIPANTS} max={4} />
            <OnlineCounter count={PARTICIPANTS.length} />
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 relative sim-canvas-wrapper">
          {/* Simulated experiment visualization */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="relative"
              animate={status === 'running' ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {/* Flask visual */}
              <div className="relative w-40 h-48">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-36 rounded-b-3xl border-2 border-brand-500/60 bg-brand-500/10 overflow-hidden">
                  {/* Liquid level */}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 bg-accent-500/30"
                    animate={{ height: status === 'running' ? ['40%', '55%', '40%'] : '40%' }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  {/* Bubbles */}
                  {status === 'running' && [...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 rounded-full bg-accent-400/60"
                      animate={{ y: [0, -80], opacity: [0, 1, 0] }}
                      transition={{ duration: 1.5, delay: i * 0.4, repeat: Infinity }}
                      style={{ left: `${20 + i * 18}%`, bottom: '10%' }}
                    />
                  ))}
                </div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-16 border-2 border-brand-500/60 bg-slate-900 rounded-t-lg" />
              </div>
              {/* Heating element */}
              <motion.div
                className="w-36 h-4 rounded-lg mx-auto mt-1"
                animate={{ backgroundColor: status === 'running' ? ['#1e293b', '#ef4444', '#f97316', '#ef4444'] : '#1e293b' }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
          </div>

          {/* Multi-user cursors (simulated) */}
          {status === 'running' && (
            <motion.div
              className="absolute pointer-events-none"
              animate={{ x: [200, 350, 250, 200], y: [150, 200, 180, 150] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            >
              <div className="w-4 h-4 border-2 border-accent-400 rounded-full relative">
                <span className="absolute top-5 left-0 bg-accent-500 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap">Trần Văn An</span>
              </div>
            </motion.div>
          )}

          {/* Control buttons overlay */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
            {status === 'idle' && (
              <button onClick={() => setStatus('running')} className="btn-primary px-8 py-3 text-base shadow-glow-brand">
                <Play size={20} /> Bắt đầu thí nghiệm
              </button>
            )}
            {status === 'running' && (
              <>
                <button onClick={() => setStatus('paused')} className="btn-secondary px-6 py-2.5">
                  <Pause size={18} /> Tạm dừng
                </button>
                <button onClick={() => setStatus('idle')} className="btn-danger px-6 py-2.5">
                  <Square size={18} /> Kết thúc
                </button>
              </>
            )}
            {status === 'paused' && (
              <>
                <button onClick={() => setStatus('running')} className="btn-primary px-6 py-2.5">
                  <Play size={18} /> Tiếp tục
                </button>
                <button onClick={() => setStatus('idle')} className="btn-secondary px-6 py-2.5">
                  <Square size={18} /> Kết thúc
                </button>
              </>
            )}
          </div>

          {/* Teacher broadcast banner */}
          <AnimatePresence>
            {status === 'running' && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 glass border border-brand-500/30 rounded-full text-xs text-brand-300 flex items-center gap-2"
              >
                <span className="live-dot" /> GV đang phát: "Quan sát bong bóng khí thoát ra khi đun nóng"
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom: Media controls */}
        <div className="h-12 bg-slate-900/80 border-t border-slate-700/50 flex items-center justify-center gap-4 flex-shrink-0">
          <button onClick={() => setMuted(!muted)} className={clsx('btn-ghost p-2 rounded-xl', muted && 'text-red-400')}>
            {muted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button onClick={() => setCamOn(!camOn)} className={clsx('btn-ghost p-2 rounded-xl', !camOn && 'text-red-400')}>
            {camOn ? <Video size={18} /> : <VideoOff size={18} />}
          </button>
          <button className="btn-ghost p-2 rounded-xl"><Settings size={18} /></button>
          <button className="btn-ghost p-2 rounded-xl"><Maximize2 size={18} /></button>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="w-80 flex-shrink-0 bg-slate-900 border-l border-slate-700/50 flex flex-col">
        {/* Sensor data */}
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Dữ liệu cảm biến</h3>
            {status === 'running' && <span className="live-dot" />}
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: 'Nhiệt độ', value: temperature, unit: '°C', color: 'text-red-400' },
              { label: 'Áp suất', value: pressure, unit: 'atm', color: 'text-accent-400' },
              { label: 'Điện áp', value: voltage, unit: 'V', color: 'text-brand-400' },
            ].map(s => (
              <div key={s.label} className="glass rounded-xl p-2 text-center">
                <p className={`text-base font-bold ${s.color} font-mono`}>{s.value}</p>
                <p className="text-[9px] text-slate-500">{s.label} ({s.unit})</p>
              </div>
            ))}
          </div>
          {/* Mini chart */}
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={sensorData.slice(-20)}>
              <Line type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="pressure" stroke="#0ea5e9" strokeWidth={1.5} dot={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', fontSize: 10, borderRadius: 8 }} />
            </LineChart>
          </ResponsiveContainer>
          {/* Voltage slider */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Điện áp</span>
              <span className="font-mono text-brand-400">{voltage}V</span>
            </div>
            <input
              type="range" min={0} max={12} step={0.1} value={voltage}
              onChange={e => setVoltage(parseFloat(e.target.value))}
              className="w-full accent-brand-500"
            />
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <MessageCircle size={14} className="text-slate-400" />
              <span className="text-sm font-medium text-white">Thảo luận</span>
            </div>
            <OnlineCounter count={PARTICIPANTS.length} />
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
            {chat.map((m, i) => (
              <div key={i} className={clsx('text-xs', m.isSystem && 'text-center')}>
                {m.isSystem ? (
                  <span className="text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{m.msg}</span>
                ) : (
                  <div>
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="font-semibold text-brand-300">{m.name}</span>
                      <span className="text-slate-600">{m.time}</span>
                    </div>
                    <p className="text-slate-300 bg-slate-800/60 rounded-xl px-3 py-1.5 inline-block max-w-full">{m.msg}</p>
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="p-3 border-t border-slate-700/50 flex gap-2">
            <input
              value={msg}
              onChange={e => setMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMsg()}
              placeholder="Nhắn tin..."
              className="input-base flex-1 py-2 text-xs"
            />
            <button onClick={sendMsg} className="btn-primary p-2 rounded-xl flex-shrink-0">
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
