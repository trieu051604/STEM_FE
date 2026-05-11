import { motion } from 'framer-motion';
import { Trophy, Lock, CheckCircle } from 'lucide-react';
import { PageHeader, SectionCard, ProgressBar } from '@/components/common/UIComponents';
import { MOCK_BADGES } from '@/utils/mockData';

export function BadgeAchievementPage() {
  const earned = MOCK_BADGES.filter(b => b.earnedAt);
  const inProgress = MOCK_BADGES.filter(b => !b.earnedAt);

  return (
    <div className="space-y-6">
      <PageHeader title="Huy hiệu & Thành tích" subtitle={`Đạt được ${earned.length}/${MOCK_BADGES.length} huy hiệu`} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[{ label: 'Huy hiệu đạt được', value: earned.length, icon: '🏆' },
          { label: 'Đang tiến hành', value: inProgress.length, icon: '⚡' },
          { label: 'Điểm thưởng', value: '2,450', icon: '⭐' },
          { label: 'Xếp hạng lớp', value: '#3', icon: '📊' }].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card p-4 text-center">
            <p className="text-3xl mb-1">{s.icon}</p>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <SectionCard title="Huy hiệu đã đạt" actions={<span className="badge-success">{earned.length} huy hiệu</span>}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {earned.map((badge, i) => (
            <motion.div key={badge.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07, type: 'spring' }} whileHover={{ scale: 1.05 }}
              className="glass-card p-4 text-center cursor-pointer border border-slate-600/50 hover:border-brand-500/30">
              <div className="text-5xl mb-3">{badge.icon}</div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle size={12} className="text-emerald-400" />
                <p className="text-sm font-semibold text-white">{badge.name}</p>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2">{badge.description}</p>
            </motion.div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Đang tiến hành" subtitle="Hoàn thành để mở khóa">
        <div className="space-y-4">
          {inProgress.map((badge, i) => (
            <motion.div key={badge.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4 p-4 glass rounded-xl border border-slate-700/50">
              <div className="text-3xl opacity-50">{badge.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Lock size={12} className="text-slate-500" />
                  <p className="text-sm font-semibold text-slate-300">{badge.name}</p>
                </div>
                <p className="text-xs text-slate-400 mb-2">{badge.description}</p>
                <ProgressBar value={badge.progress ?? 0} max={badge.maxProgress ?? 100} color="brand" showLabel />
              </div>
            </motion.div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
