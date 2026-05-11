import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, MoreVertical, School } from 'lucide-react';
import { PageHeader, SectionCard, StatusBadge } from '@/components/common/UIComponents';
import { MOCK_SCHOOLS } from '@/utils/mockData';

export function SchoolManagementPage() {
  const [search, setSearch] = useState('');
  const filtered = MOCK_SCHOOLS.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý trường học" subtitle={`${MOCK_SCHOOLS.length} trường đang hoạt động`}
        actions={<button className="btn-primary"><Plus size={16} /> Thêm trường</button>} />
      <SectionCard>
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm trường học..." className="input-base pl-9" />
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {filtered.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="glass-card p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
                  <School size={24} className="text-brand-400" />
                </div>
                <button className="text-slate-500 hover:text-white"><MoreVertical size={14} /></button>
              </div>
              <h3 className="font-semibold text-white mb-1">{s.name}</h3>
              <p className="text-xs text-slate-400 mb-3">{s.address}</p>
              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                {[['GV', s.teacherCount], ['HS', s.studentCount], ['KH', s.courseCount]].map(([k, v]) => (
                  <div key={k as string} className="glass rounded-lg p-1.5">
                    <p className="text-sm font-bold text-white">{v}</p>
                    <p className="text-[10px] text-slate-400">{k}</p>
                  </div>
                ))}
              </div>
              <StatusBadge status={s.isActive ? 'active' : 'inactive'} />
            </motion.div>
          ))}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5 border-dashed border-2 border-slate-700 flex items-center justify-center cursor-pointer hover:border-brand-500/50 transition-colors">
            <div className="text-center">
              <Plus size={24} className="text-slate-500 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Thêm trường mới</p>
            </div>
          </motion.div>
        </div>
      </SectionCard>
    </div>
  );
}
