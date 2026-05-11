import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Plus, MoreVertical, Star, FlaskConical, BookOpen } from 'lucide-react';
import { PageHeader, SectionCard, StatusBadge, EmptyState, ProgressBar } from '@/components/common/UIComponents';
import { MOCK_STUDENTS } from '@/utils/mockData';

export function ManageStudentsPage() {
  const [search, setSearch] = useState('');
  const filtered = MOCK_STUDENTS.filter(s => s.fullName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý học sinh" subtitle={`${MOCK_STUDENTS.length} học sinh trong lớp`}
        actions={<button className="btn-primary"><Plus size={16} /> Thêm học sinh</button>} />
      <SectionCard>
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm học sinh..." className="input-base pl-9" />
          </div>
          <button className="btn-secondary"><Filter size={15} /> Lọc</button>
        </div>
        {filtered.length === 0 ? <EmptyState icon="🔍" title="Không tìm thấy học sinh" /> : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead><tr>
                <th>Học sinh</th><th>Lớp</th><th>GPA</th><th>Tiến độ</th><th>Trạng thái</th><th>Huy hiệu</th><th></th>
              </tr></thead>
              <tbody>
                {filtered.map((s, i) => (
                  <motion.tr key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img src={s.avatar} className="w-9 h-9 rounded-full" />
                          {s.isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />}
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">{s.fullName}</p>
                          <p className="text-xs text-slate-400">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge-info">{s.grade}</span></td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-amber-400" />
                        <span className="font-mono font-bold text-white">{s.gpa}</span>
                      </div>
                    </td>
                    <td className="w-32"><ProgressBar value={s.completedCourses * 25} showLabel size="sm" /></td>
                    <td><StatusBadge status={s.isOnline ? 'active' : 'inactive'} /></td>
                    <td><div className="flex gap-1">{s.badges.slice(0, 3).map(b => <span key={b.id} title={b.name} className="text-lg">{b.icon}</span>)}</div></td>
                    <td><button className="btn-ghost p-1"><MoreVertical size={14} /></button></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
