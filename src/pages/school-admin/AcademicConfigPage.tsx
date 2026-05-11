import { PageHeader, SectionCard } from '@/components/common/UIComponents';
import { Settings, Save } from 'lucide-react';

export function AcademicConfigPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="Cấu hình học thuật" subtitle="Thiết lập quy định học tập và đánh giá" />
      <SectionCard title="Thang điểm">
        <div className="space-y-4">
          {[['Điểm tối đa', '10'], ['Điểm đạt tối thiểu', '5'], ['Hệ số bài kiểm tra', '2'], ['Hệ số bài tập', '1']].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between">
              <span className="text-sm text-slate-300">{k}</span>
              <input defaultValue={v} className="input-base w-24 text-center" />
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Quy định khác">
        <div className="space-y-3">
          {['Cho phép nộp bài muộn', 'Hiển thị điểm công khai', 'Tự động nhắc nhở bài tập'].map(s => (
            <div key={s} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50">
              <span className="text-sm text-slate-300">{s}</span>
              <input type="checkbox" className="w-4 h-4 accent-brand-500" defaultChecked />
            </div>
          ))}
        </div>
      </SectionCard>
      <button className="btn-primary"><Save size={16} /> Lưu cấu hình</button>
    </div>
  );
}
