import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, MoreVertical, Mail, Phone } from 'lucide-react';
import { PageHeader, SectionCard, StatusBadge, EmptyState } from '@/components/common/UIComponents';
import { MOCK_TEACHERS } from '@/utils/mockData';

export function TeacherManagementPage() {
  const [search, setSearch] = useState('');
  const filtered = MOCK_TEACHERS.filter(t => t.fullName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý giáo viên" subtitle={`${MOCK_TEACHERS.length} giáo viên`}
        actions={<button className="btn-primary"><Plus size={16} /> Thêm giáo viên</button>} />
      <SectionCard>
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm giáo viên..." className="input-base pl-9" />
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {filtered.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="glass-card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="relative">
                  <img src={t.avatar} className="w-12 h-12 rounded-full" />
                  {t.isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-800" />}
                </div>
                <button className="text-slate-500 hover:text-white"><MoreVertical size={14} /></button>
              </div>
              <h3 className="font-semibold text-white">{t.fullName}</h3>
              <p className="text-xs text-slate-400 mb-2">{t.subjects.join(', ')}</p>
              <div className="flex gap-3 text-xs text-slate-400 mb-3">
                <span>{t.classCount} lớp</span>
                <span>•</span>
                <span>{t.studentCount} học sinh</span>
              </div>
              <div className="flex items-center justify-between">
                <StatusBadge status={t.isOnline ? 'active' : 'inactive'} />
                <div className="flex gap-2">
                  <button className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"><Mail size={13} /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
