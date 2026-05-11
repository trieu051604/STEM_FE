import { PageHeader, SectionCard, StatusBadge } from '@/components/common/UIComponents';
import { MOCK_COURSES } from '@/utils/mockData';
import { BookOpen, FlaskConical, Plus } from 'lucide-react';

export function CourseManagementPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý khóa học" subtitle="Tất cả khóa học của trường"
        actions={<button className="btn-primary"><Plus size={16} /> Thêm khóa học</button>} />
      <SectionCard>
        <table className="table-base">
          <thead><tr><th>Khóa học</th><th>Giáo viên</th><th>Học sinh</th><th>Lab</th><th>Trạng thái</th></tr></thead>
          <tbody>
            {MOCK_COURSES.map(c => (
              <tr key={c.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <img src={c.thumbnail} className="w-10 h-10 rounded-xl object-cover" />
                    <div>
                      <p className="font-medium text-white">{c.title}</p>
                      <p className="text-xs text-slate-400">{c.subject} • {c.level}</p>
                    </div>
                  </div>
                </td>
                <td className="text-slate-300">{c.teacherName}</td>
                <td><span className="font-bold text-white">{c.studentCount}</span></td>
                <td>{c.hasSimulation ? <FlaskConical size={14} className="text-brand-400" /> : <span className="text-slate-600">—</span>}</td>
                <td><StatusBadge status={c.isPublished ? 'active' : 'inactive'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}
