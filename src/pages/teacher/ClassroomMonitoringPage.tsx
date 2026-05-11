import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Activity, Eye, Zap, MessageCircle } from 'lucide-react';
import { PageHeader, SectionCard, LiveIndicator, OnlineCounter, ProgressBar } from '@/components/common/UIComponents';
import { MOCK_STUDENTS } from '@/utils/mockData';

export function ClassroomMonitoringPage() {
  const [activeStudents, setActiveStudents] = useState(MOCK_STUDENTS);
  const [tick, setTick] = useState(0);

  // Simulate activity updates
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 2000);
    return () => clearInterval(interval);
  }, []);

  const ACTIVITIES = ['Đang xem bài giảng', 'Làm bài tập', 'Tham gia lab', 'Đọc tài liệu', 'Offline'];

  return (
    <div className="space-y-6">
      <PageHeader title="Giám sát lớp học" subtitle="Theo dõi hoạt động học sinh realtime"
        actions={<div className="flex items-center gap-3"><LiveIndicator /><OnlineCounter count={MOCK_STUDENTS.filter(s=>s.isOnline).length} /></div>} />

      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Đang học', value: 3, color: 'text-emerald-400' },
          { label: 'Trong lab', value: 1, color: 'text-brand-400' },
          { label: 'Làm bài tập', value: 2, color: 'text-accent-400' },
          { label: 'Offline', value: 2, color: 'text-slate-500' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 text-center">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Student cards grid */}
      <SectionCard title="Hoạt động học sinh" subtitle="Cập nhật mỗi 5 giây">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {MOCK_STUDENTS.map((s, i) => {
            const activity = ACTIVITIES[(i + tick) % (ACTIVITIES.length - 1)];
            const isOnline = s.isOnline;
            return (
              <motion.div
                key={s.id}
                animate={{ borderColor: isOnline ? 'rgba(99,102,241,0.3)' : 'rgba(51,65,85,0.5)' }}
                className="glass rounded-xl p-4 border"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="relative">
                    <img src={s.avatar} className="w-10 h-10 rounded-full" />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${isOnline ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  </div>
                  <button className="text-slate-500 hover:text-brand-400"><Eye size={14} /></button>
                </div>
                <p className="text-sm font-semibold text-white">{s.fullName}</p>
                {isOnline ? (
                  <>
                    <p className="text-xs text-brand-400 mt-0.5 flex items-center gap-1"><Activity size={10} /> {activity}</p>
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Tiến độ hôm nay</span>
                        <span>{(i * 17 + tick * 2) % 100}%</span>
                      </div>
                      <ProgressBar value={(i * 17 + tick * 2) % 100} size="sm" />
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-500 mt-0.5">Ngoại tuyến</p>
                )}
              </motion.div>
            );
          })}
        </div>
      </SectionCard>

      {/* Activity feed */}
      <SectionCard title="Nhật ký hoạt động">
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {Array.from({ length: 8 }, (_, i) => ({
            student: MOCK_STUDENTS[i % MOCK_STUDENTS.length].fullName,
            action: ['hoàn thành bài học', 'nộp bài tập', 'tham gia lab', 'đặt câu hỏi', 'đạt huy hiệu'][i % 5],
            time: `${i * 3 + 1} phút trước`,
          })).map((log, i) => (
            <div key={i} className="flex gap-3 text-xs py-2 border-b border-slate-700/30">
              <span className="text-slate-500 w-24 flex-shrink-0">{log.time}</span>
              <p className="text-slate-300"><span className="text-brand-400 font-medium">{log.student}</span> đã {log.action}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
