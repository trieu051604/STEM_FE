import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, XCircle, ArrowRight, AlertCircle, Trophy } from 'lucide-react';
import { PageHeader } from '@/components/common/UIComponents';

const QUESTIONS = [
  { id: 1, question: 'Phương trình nào mô tả dao động điều hòa?', options: ['x = A.cos(ωt + φ)', 'x = A.sin(ωt) + B', 'x = At² + Bt + C', 'x = A.e^(ωt)'], correct: 0 },
  { id: 2, question: 'Đơn vị của tần số góc ω là:', options: ['Hz', 'rad/s', 'm/s', 'N/m'], correct: 1 },
  { id: 3, question: 'Chu kỳ T và tần số f có quan hệ:', options: ['T = f', 'T = 2πf', 'T = 1/f', 'T = f²'], correct: 2 },
  { id: 4, question: 'Biên độ dao động là:', options: ['Giá trị cực đại của li độ', 'Vận tốc cực đại', 'Gia tốc cực đại', 'Năng lượng cực đại'], correct: 0 },
  { id: 5, question: 'Trong dao động điều hòa, tại vị trí cân bằng, vận tốc có giá trị:', options: ['Bằng 0', 'Cực đại', 'Cực tiểu', 'Bằng biên độ'], correct: 1 },
];

export function QuizPage() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft] = useState(300); // 5 mins

  const q = QUESTIONS[current];
  const score = submitted ? QUESTIONS.filter((q, i) => answers[i] === q.correct).length : 0;
  const percent = Math.round((score / QUESTIONS.length) * 100);

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-10 text-center">
          <div className="w-24 h-24 rounded-full gradient-brand flex items-center justify-center mx-auto mb-6 glow-brand">
            <Trophy size={40} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">{score}/{QUESTIONS.length} câu đúng</h2>
          <p className={`text-5xl font-black mb-4 ${percent >= 80 ? 'text-emerald-400' : percent >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{percent}%</p>
          <p className="text-slate-400 mb-8">{percent >= 80 ? 'Xuất sắc! Bạn đã nắm vững kiến thức.' : 'Hãy ôn lại và thử lại nhé!'}</p>
          <div className="space-y-2 text-left mb-6">
            {QUESTIONS.map((q, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl text-sm ${answers[i] === q.correct ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                {answers[i] === q.correct ? <CheckCircle size={14} className="text-emerald-400" /> : <XCircle size={14} className="text-red-400" />}
                <span className="text-slate-300 flex-1 truncate">{q.question}</span>
                {answers[i] !== q.correct && <span className="text-xs text-emerald-400">→ {q.options[q.correct]}</span>}
              </div>
            ))}
          </div>
          <button onClick={() => { setSubmitted(false); setAnswers({}); setCurrent(0); }} className="btn-primary px-8">Làm lại</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Quiz Vật lý — Chương 3" />
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
          <Clock size={14} />
          <span className="font-mono font-bold">{Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1">
        {QUESTIONS.map((_, i) => (
          <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i < current ? 'bg-brand-500' : i === current ? 'bg-brand-400 animate-pulse' : 'bg-slate-700'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="glass-card p-8"
        >
          <div className="flex items-start gap-3 mb-6">
            <span className="badge-brand text-sm px-3">{current + 1}/{QUESTIONS.length}</span>
          </div>
          <h2 className="text-lg font-semibold text-white mb-6">{q.question}</h2>
          <div className="space-y-3">
            {q.options.map((opt, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setAnswers(a => ({ ...a, [current]: i }))}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                  answers[current] === i
                    ? 'border-brand-500 bg-brand-500/10 text-white'
                    : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-500'
                }`}
              >
                <div className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0 ${answers[current] === i ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-600 text-slate-400'}`}>
                  {String.fromCharCode(65 + i)}
                </div>
                {opt}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between">
        <button onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0} className="btn-secondary disabled:opacity-40">← Câu trước</button>
        {current < QUESTIONS.length - 1 ? (
          <button onClick={() => setCurrent(current + 1)} disabled={answers[current] === undefined} className="btn-primary disabled:opacity-40">Câu tiếp → </button>
        ) : (
          <button onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length < QUESTIONS.length} className="btn-primary disabled:opacity-40">
            <CheckCircle size={16} /> Nộp bài
          </button>
        )}
      </div>
    </div>
  );
}
