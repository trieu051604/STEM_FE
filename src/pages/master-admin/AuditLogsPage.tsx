import { PageHeader, SectionCard } from '@/components/common/UIComponents';
import { Download, Filter, Search } from 'lucide-react';

const LOGS = Array.from({ length: 15 }, (_, i) => ({
  id: `log-${i+1}`,
  action: ['LOGIN', 'CREATE_COURSE', 'DELETE_USER', 'UPDATE_PERMISSION', 'EXPORT_DATA', 'START_LAB', 'END_LAB', 'GRADE_SUBMISSION'][i % 8],
  user: ['master@stem.edu', 'admin@stem.edu', 'teacher@stem.edu'][i % 3],
  resource: ['User #' + (100 + i), 'Course: Vật lý', 'Lab Session #' + i, 'Role: teacher'][i % 4],
  ip: `192.168.1.${100 + i}`,
  time: new Date(Date.now() - i * 600000).toLocaleString('vi'),
  severity: (['info', 'warning', 'error', 'info', 'info'] as const)[i % 5],
}));

const SEV_COLOR = { info: 'text-slate-400', warning: 'text-amber-400', error: 'text-red-400' };
const SEV_BADGE = { info: 'badge-info', warning: 'badge-warning', error: 'badge-danger' };

export function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" subtitle="Nhật ký hoạt động hệ thống"
        actions={<button className="btn-secondary"><Download size={14} /> Xuất logs</button>} />
      <SectionCard>
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input placeholder="Tìm kiếm logs..." className="input-base pl-9" />
          </div>
          <button className="btn-secondary"><Filter size={14} /> Lọc</button>
        </div>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>Thời gian</th><th>Action</th><th>User</th><th>Resource</th><th>IP</th><th>Mức độ</th></tr></thead>
            <tbody>
              {LOGS.map(log => (
                <tr key={log.id}>
                  <td className="font-mono text-xs text-slate-400">{log.time}</td>
                  <td><code className="text-xs bg-slate-700 px-2 py-0.5 rounded text-brand-300">{log.action}</code></td>
                  <td className="text-slate-300 text-sm">{log.user}</td>
                  <td className="text-slate-400 text-xs">{log.resource}</td>
                  <td className="font-mono text-xs text-slate-500">{log.ip}</td>
                  <td><span className={SEV_BADGE[log.severity]}>{log.severity}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
