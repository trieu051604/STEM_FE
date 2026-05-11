import { PageHeader, SectionCard } from '@/components/common/UIComponents';

const classes = [
  { id: 'c1', name: '10A1 - Vật lý lượng tử', students: 32, schedule: 'Thứ 2, 4, 6 — 7:30', room: 'P.301' },
  { id: 'c2', name: '10A2 - Hóa học hữu cơ', students: 28, schedule: 'Thứ 3, 5 — 9:00', room: 'Lab 1' },
  { id: 'c3', name: '11B1 - Sinh học tế bào', students: 35, schedule: 'Thứ 2, 5 — 13:30', room: 'P.402' },
];

export function ManageClassesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý lớp học" subtitle="Tất cả lớp đang phụ trách" />
      <div className="grid md:grid-cols-3 gap-5">
        {classes.map((cls, i) => (
          <div key={cls.id} className="glass-card p-5 hover:scale-[1.01] transition-transform cursor-pointer">
            <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center mb-4">
              <span className="text-white font-bold text-lg">{cls.name.charAt(0)}</span>
            </div>
            <h3 className="font-semibold text-white mb-1">{cls.name}</h3>
            <p className="text-xs text-slate-400 mb-3">{cls.schedule} • {cls.room}</p>
            <p className="text-xs text-brand-400 font-medium">{cls.students} học sinh</p>
          </div>
        ))}
      </div>
    </div>
  );
}
