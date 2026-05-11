import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, FlaskConical, Plus, Trash2, GripVertical, Upload, Save } from 'lucide-react';
import { PageHeader, SectionCard } from '@/components/common/UIComponents';

const STEPS = ['Thông tin cơ bản', 'Nội dung & Bài học', 'Cài đặt', 'Xuất bản'];

export function CreateCoursePage() {
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [hasLab, setHasLab] = useState(false);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader title="Tạo khóa học mới" />

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className="flex flex-col items-center" style={{ minWidth: 0 }}>
              <button
                onClick={() => setStep(i)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i < step ? 'gradient-brand text-white' : i === step ? 'border-2 border-brand-500 text-brand-400' : 'border-2 border-slate-600 text-slate-500'
                }`}
              >
                {i < step ? '✓' : i + 1}
              </button>
              <span className="text-[10px] text-slate-400 mt-1 text-center hidden sm:block">{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-brand-500' : 'bg-slate-700'}`} />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
        {step === 0 && (
          <SectionCard title="Thông tin cơ bản">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Tên khóa học *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} className="input-base" placeholder="VD: Vật lý lượng tử nâng cao" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Mô tả</label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)} className="input-base min-h-28 resize-y" placeholder="Mô tả nội dung và mục tiêu khóa học..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Môn học</label>
                  <select className="input-base">
                    <option>Vật lý</option><option>Hóa học</option><option>Sinh học</option><option>Toán học</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Cấp độ</label>
                  <select className="input-base">
                    <option>Cơ bản</option><option>Trung cấp</option><option>Nâng cao</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-500/5 border border-brand-500/20">
                <input type="checkbox" id="hasLab" checked={hasLab} onChange={e => setHasLab(e.target.checked)} className="w-4 h-4 accent-brand-500" />
                <label htmlFor="hasLab" className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <FlaskConical size={16} className="text-brand-400" /> Tích hợp Virtual Lab mô phỏng
                </label>
              </div>
              {/* Thumbnail */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Ảnh bìa</label>
                <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-brand-500/50 transition-colors cursor-pointer">
                  <Upload size={24} className="text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Kéo thả hoặc click để tải ảnh</p>
                </div>
              </div>
            </div>
          </SectionCard>
        )}

        {step === 1 && (
          <SectionCard title="Bài học" subtitle="Thêm và sắp xếp nội dung khóa học">
            {['Giới thiệu khóa học', 'Lý thuyết nền tảng', 'Thí nghiệm thực hành 1'].map((l, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/30 mb-2">
                <GripVertical size={16} className="text-slate-500 cursor-grab" />
                <span className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 text-xs flex items-center justify-center">{i+1}</span>
                <p className="flex-1 text-sm text-white">{l}</p>
                <button className="text-slate-500 hover:text-red-400"><Trash2 size={14} /></button>
              </div>
            ))}
            <button className="btn-ghost mt-3 w-full justify-center border border-dashed border-slate-700 hover:border-brand-500/50 py-3">
              <Plus size={16} /> Thêm bài học
            </button>
          </SectionCard>
        )}

        {step === 2 && (
          <SectionCard title="Cài đặt khóa học">
            <div className="space-y-4">
              {[['Cho phép học sinh đăng ký', true], ['Hiển thị công khai', false], ['Yêu cầu duyệt đăng ký', true]].map(([label, def], i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50">
                  <span className="text-sm text-slate-300">{label as string}</span>
                  <input type="checkbox" defaultChecked={def as boolean} className="w-4 h-4 accent-brand-500" />
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {step === 3 && (
          <SectionCard>
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-4 glow-brand">
                <BookOpen size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Sẵn sàng xuất bản!</h3>
              <p className="text-slate-400 mb-6">Khóa học của bạn sẽ được hiển thị cho học sinh sau khi xuất bản.</p>
              <div className="flex gap-3 justify-center">
                <button className="btn-secondary"><Save size={16} /> Lưu nháp</button>
                <button className="btn-primary px-8">Xuất bản khóa học</button>
              </div>
            </div>
          </SectionCard>
        )}
      </motion.div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="btn-secondary disabled:opacity-40">← Quay lại</button>
        <button onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))} disabled={step === STEPS.length - 1} className="btn-primary disabled:opacity-40">Tiếp theo →</button>
      </div>
    </div>
  );
}
