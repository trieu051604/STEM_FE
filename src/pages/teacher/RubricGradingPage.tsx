import { PageHeader, SectionCard } from '@/components/common/UIComponents';

const CRITERIA = [
  { name: 'Kiến thức lý thuyết', weight: 30, desc: 'Nắm vững các khái niệm cơ bản' },
  { name: 'Kỹ năng thực hành', weight: 40, desc: 'Thực hiện thí nghiệm đúng quy trình' },
  { name: 'Báo cáo kết quả', weight: 20, desc: 'Phân tích và trình bày kết quả' },
  { name: 'Sáng tạo & Tư duy phản biện', weight: 10, desc: 'Đề xuất cải tiến thí nghiệm' },
];

const LEVELS = ['Chưa đạt', 'Đạt', 'Khá', 'Tốt', 'Xuất sắc'];

export function RubricGradingPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Rubric chấm điểm" subtitle="Thiết lập tiêu chí đánh giá" />
      <SectionCard title="Ma trận đánh giá" subtitle="Vật lý lượng tử — Lab Report">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-3 text-slate-400 text-xs uppercase w-48">Tiêu chí</th>
                {LEVELS.map(l => (
                  <th key={l} className="text-center p-3 text-slate-400 text-xs uppercase">{l}</th>
                ))}
                <th className="text-center p-3 text-slate-400 text-xs uppercase w-20">Trọng số</th>
              </tr>
            </thead>
            <tbody>
              {CRITERIA.map((c, i) => (
                <tr key={i} className="border-t border-slate-700/50">
                  <td className="p-3">
                    <p className="font-medium text-white">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.desc}</p>
                  </td>
                  {LEVELS.map((_, li) => (
                    <td key={li} className="p-2">
                      <div className={`text-center py-2 px-1 rounded-xl text-xs border ${li === 3 ? 'border-brand-500/50 bg-brand-500/10 text-brand-300' : 'border-slate-700 text-slate-500'}`}>
                        {li * 2.5}/10
                      </div>
                    </td>
                  ))}
                  <td className="p-3 text-center">
                    <span className="badge-brand">{c.weight}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-3 mt-4">
          <button className="btn-primary">Lưu Rubric</button>
          <button className="btn-secondary">Xuất PDF</button>
        </div>
      </SectionCard>
    </div>
  );
}
