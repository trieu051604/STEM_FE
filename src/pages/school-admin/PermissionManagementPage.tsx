import { PageHeader, SectionCard } from '@/components/common/UIComponents';

const PERMISSIONS = [
  { resource: 'Quản lý học sinh', teacher: true, schoolAdmin: true, masterAdmin: true },
  { resource: 'Tạo khóa học', teacher: true, schoolAdmin: true, masterAdmin: true },
  { resource: 'Chấm điểm', teacher: true, schoolAdmin: false, masterAdmin: true },
  { resource: 'Quản lý giáo viên', teacher: false, schoolAdmin: true, masterAdmin: true },
  { resource: 'Xem báo cáo toàn trường', teacher: false, schoolAdmin: true, masterAdmin: true },
  { resource: 'Cấu hình hệ thống', teacher: false, schoolAdmin: false, masterAdmin: true },
  { resource: 'Điều khiển Lab', teacher: true, schoolAdmin: true, masterAdmin: true },
  { resource: 'Quản lý trường học', teacher: false, schoolAdmin: false, masterAdmin: true },
];

const Check = ({ ok }: { ok: boolean }) => (
  <span className={`text-lg ${ok ? 'text-emerald-400' : 'text-slate-700'}`}>{ok ? '✓' : '✗'}</span>
);

export function PermissionManagementPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Ma trận phân quyền" subtitle="Quản lý quyền truy cập theo vai trò" />
      <SectionCard>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead><tr>
              <th>Tính năng / Quyền</th>
              <th className="text-center">Giáo viên</th>
              <th className="text-center">Quản trị trường</th>
              <th className="text-center">Master Admin</th>
            </tr></thead>
            <tbody>
              {PERMISSIONS.map((p, i) => (
                <tr key={i}>
                  <td className="font-medium text-white">{p.resource}</td>
                  <td className="text-center"><Check ok={p.teacher} /></td>
                  <td className="text-center"><Check ok={p.schoolAdmin} /></td>
                  <td className="text-center"><Check ok={p.masterAdmin} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mt-4">* Học sinh chỉ có quyền xem và nộp bài, không có quyền quản lý</p>
      </SectionCard>
    </div>
  );
}
