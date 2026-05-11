import { PageHeader, SectionCard, StatusBadge } from '@/components/common/UIComponents';
import { FlaskConical, Plus } from 'lucide-react';

const LABS = [
  { id: '1', name: 'Thí nghiệm Dao động điều hòa', subject: 'Vật lý', level: 'Trung cấp', schools: 32, status: 'active' as const },
  { id: '2', name: 'Phản ứng oxi hóa khử', subject: 'Hóa học', level: 'Nâng cao', schools: 28, status: 'active' as const },
  { id: '3', name: 'Quan sát tế bào dưới kính hiển vi', subject: 'Sinh học', level: 'Cơ bản', schools: 45, status: 'active' as const },
  { id: '4', name: 'Mạch điện RC - LC', subject: 'Vật lý', level: 'Nâng cao', schools: 21, status: 'pending' as const },
  { id: '5', name: 'Nhận biết hợp chất hữu cơ', subject: 'Hóa học', level: 'Trung cấp', schools: 38, status: 'active' as const },
];

export function GlobalSimulationLibraryPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Thư viện Simulation toàn cầu" subtitle={`${LABS.length} bộ lab mô phỏng`}
        actions={<button className="btn-primary"><Plus size={16} /> Tạo Lab mới</button>} />
      <SectionCard>
        <table className="table-base">
          <thead><tr><th>Lab</th><th>Môn học</th><th>Cấp độ</th><th>Số trường dùng</th><th>Trạng thái</th></tr></thead>
          <tbody>
            {LABS.map(lab => (
              <tr key={lab.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-500/20 flex items-center justify-center">
                      <FlaskConical size={16} className="text-brand-400" />
                    </div>
                    <p className="font-medium text-white">{lab.name}</p>
                  </div>
                </td>
                <td><span className="badge-info">{lab.subject}</span></td>
                <td className="text-slate-300">{lab.level}</td>
                <td><span className="font-bold text-white">{lab.schools}</span> trường</td>
                <td><StatusBadge status={lab.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}
