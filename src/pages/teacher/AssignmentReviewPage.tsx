import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Star, MessageSquare, Eye } from 'lucide-react';
import { PageHeader, SectionCard, StatusBadge } from '@/components/common/UIComponents';
import { MOCK_STUDENTS } from '@/utils/mockData';

const SUBMISSIONS = MOCK_STUDENTS.map((s, i) => ({
  ...s,
  assignment: 'Bài tập Vật lý Chương 3',
  submittedAt: `${[30, 120, 180, 60][i % 4]} phút trước`,
  status: ['pending', 'pending', 'graded', 'pending'][i % 4] as 'pending' | 'graded',
  score: i === 2 ? 8.5 : undefined,
}));

export function AssignmentReviewPage() {
  const [selected, setSelected] = useState<typeof SUBMISSIONS[0] | null>(null);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* Submission list */}
      <div className="lg:col-span-2 space-y-3">
        <PageHeader title="Chấm bài tập" subtitle={`${SUBMISSIONS.filter(s=>s.status==='pending').length} chờ chấm`} />
        {SUBMISSIONS.map((sub, i) => (
          <motion.div
            key={sub.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => { setSelected(sub); setScore(sub.score?.toString() ?? ''); setFeedback(''); }}
            className={`glass-card p-4 cursor-pointer transition-all ${selected?.id === sub.id ? 'border-brand-500/50 bg-brand-500/5' : 'hover:border-slate-600'}`}
          >
            <div className="flex items-center gap-3">
              <img src={sub.avatar} className="w-9 h-9 rounded-full flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{sub.fullName}</p>
                <p className="text-xs text-slate-400">{sub.assignment}</p>
                <p className="text-xs text-slate-500"><Clock size={10} className="inline" /> {sub.submittedAt}</p>
              </div>
              {sub.status === 'graded' ? (
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-400">{sub.score}</p>
                  <p className="text-xs text-slate-500">/ 10</p>
                </div>
              ) : (
                <span className="badge-warning text-xs">Chờ chấm</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Grading panel */}
      <div className="lg:col-span-3">
        {selected ? (
          <SectionCard title={`Bài làm của ${selected.fullName}`} subtitle={selected.assignment}>
            {/* Student answer mockup */}
            <div className="bg-slate-800/50 rounded-xl p-4 mb-4 min-h-40">
              <p className="text-sm text-slate-300 leading-relaxed">
                Một vật dao động điều hòa với phương trình x = 5cos(2πt + π/3) cm.
                Biên độ A = 5 cm. Chu kỳ T = 1s. Tần số f = 1 Hz. Pha ban đầu φ = π/3 rad.
                <br/><br/>
                Tại t = 0.5s: v = -Aω.sin(ωt + φ) = -5×2π×sin(π + π/3) = 27.2 cm/s...
              </p>
            </div>

            {/* Score input */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Điểm (/ 10)</label>
                <input value={score} onChange={e => setScore(e.target.value)} type="number" min={0} max={10} step={0.5} className="input-base text-center text-lg font-bold" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Điểm nhanh</label>
                <div className="flex gap-1 flex-wrap">
                  {[5, 6, 7, 7.5, 8, 8.5, 9, 9.5, 10].map(v => (
                    <button key={v} onClick={() => setScore(v.toString())} className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${parseFloat(score) === v ? 'bg-brand-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>{v}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Nhận xét</label>
              <textarea value={feedback} onChange={e => setFeedback(e.target.value)} className="input-base min-h-24 resize-y" placeholder="Nhập nhận xét, góp ý cho học sinh..." />
            </div>
            <div className="flex gap-3">
              <button className="btn-primary flex-1 justify-center py-2.5">
                <CheckCircle size={16} /> Xác nhận điểm
              </button>
              <button className="btn-secondary px-4"><MessageSquare size={16} /></button>
            </div>
          </SectionCard>
        ) : (
          <div className="glass-card p-16 text-center h-full flex items-center justify-center">
            <div>
              <Eye size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Chọn một bài nộp để chấm điểm</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
