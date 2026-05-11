import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Clock, CheckCircle, AlertCircle, Send } from 'lucide-react';
import { PageHeader, SectionCard } from '@/components/common/UIComponents';

export function AssignmentSubmissionPage() {
  const [submitted, setSubmitted] = useState(false);
  const [answer, setAnswer] = useState('');
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader title="Nộp bài tập" subtitle="Bài tập Vật lý Chương 3 — Dao động điều hòa" />

      <SectionCard>
        <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 mb-6">
          <AlertCircle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-white">Hạn nộp: Thứ 6, 23:59</p>
            <p className="text-xs text-slate-400 mt-1">Bài tập sẽ bị đánh dấu trễ nếu nộp sau thời hạn. Điểm tối đa: 10 điểm.</p>
          </div>
        </div>

        <h2 className="section-heading mb-3">Đề bài</h2>
        <div className="prose prose-invert max-w-none text-sm text-slate-300 leading-relaxed mb-6 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
          <p>Một vật dao động điều hòa với phương trình x = 5cos(2πt + π/3) cm. Hãy:</p>
          <ol className="mt-2 space-y-1 list-decimal list-inside">
            <li>Xác định biên độ, chu kỳ, tần số và pha ban đầu.</li>
            <li>Tính vận tốc và gia tốc tại t = 0.5s.</li>
            <li>Vẽ đồ thị x(t) trong 2 chu kỳ đầu.</li>
          </ol>
        </div>

        <h2 className="section-heading mb-3">Bài làm của bạn</h2>
        <textarea
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder="Nhập bài làm của bạn ở đây..."
          className="input-base min-h-40 resize-y mb-4"
          disabled={submitted}
        />

        {/* File upload */}
        <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-700 hover:border-brand-500/50 hover:bg-brand-500/5'}`}>
          {file ? (
            <div className="flex items-center justify-center gap-2 text-emerald-400">
              <FileText size={20} />
              <span className="text-sm font-medium">{file.name}</span>
            </div>
          ) : (
            <>
              <Upload size={24} className="text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-400 mb-1">Kéo thả file hoặc click để tải lên</p>
              <p className="text-xs text-slate-500">PDF, DOCX, PNG — tối đa 10MB</p>
            </>
          )}
          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setFile(e.target.files?.[0] ?? null)} disabled={submitted} />
        </div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 mt-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
          >
            <CheckCircle size={20} />
            <div>
              <p className="font-semibold">Nộp bài thành công!</p>
              <p className="text-xs text-emerald-500 mt-0.5">Giáo viên sẽ chấm bài trong vòng 24-48 giờ.</p>
            </div>
          </motion.div>
        ) : (
          <button
            onClick={() => setSubmitted(true)}
            disabled={!answer && !file}
            className="btn-primary w-full justify-center py-3 mt-6"
          >
            <Send size={16} /> Nộp bài
          </button>
        )}
      </SectionCard>
    </div>
  );
}
