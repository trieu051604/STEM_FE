import { PageHeader, SectionCard } from '@/components/common/UIComponents';

const ROLES = ['master_admin', 'school_admin', 'teacher', 'student'];
const PERMISSIONS = [
  'Quản lý trường học', 'Quản lý giáo viên', 'Quản lý học sinh',
  'Tạo khóa học', 'Chỉnh sửa khóa học', 'Xóa khóa học',
  'Điều khiển Lab', 'Tham gia Lab', 'Tạo Simulation',
  'Xem báo cáo', 'Xuất báo cáo', 'Xem analytics toàn cầu',
  'Quản lý vai trò', 'Xem audit logs', 'Cấu hình hệ thống',
];

const MATRIX: Record<string, Record<string, boolean>> = {
  'Quản lý trường học':      { master_admin: true,  school_admin: false, teacher: false, student: false },
  'Quản lý giáo viên':       { master_admin: true,  school_admin: true,  teacher: false, student: false },
  'Quản lý học sinh':        { master_admin: true,  school_admin: true,  teacher: true,  student: false },
  'Tạo khóa học':            { master_admin: true,  school_admin: true,  teacher: true,  student: false },
  'Chỉnh sửa khóa học':      { master_admin: true,  school_admin: true,  teacher: true,  student: false },
  'Xóa khóa học':            { master_admin: true,  school_admin: true,  teacher: false, student: false },
  'Điều khiển Lab':          { master_admin: true,  school_admin: false, teacher: true,  student: false },
  'Tham gia Lab':            { master_admin: true,  school_admin: true,  teacher: true,  student: true  },
  'Tạo Simulation':          { master_admin: true,  school_admin: false, teacher: false, student: false },
  'Xem báo cáo':             { master_admin: true,  school_admin: true,  teacher: true,  student: false },
  'Xuất báo cáo':            { master_admin: true,  school_admin: true,  teacher: false, student: false },
  'Xem analytics toàn cầu': { master_admin: true,  school_admin: false, teacher: false, student: false },
  'Quản lý vai trò':         { master_admin: true,  school_admin: false, teacher: false, student: false },
  'Xem audit logs':          { master_admin: true,  school_admin: false, teacher: false, student: false },
  'Cấu hình hệ thống':       { master_admin: true,  school_admin: false, teacher: false, student: false },
};

const ROLE_LABELS: Record<string, string> = {
  master_admin: 'Master Admin', school_admin: 'School Admin', teacher: 'Teacher', student: 'Student',
};

export function RolePermissionMatrixPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Ma trận vai trò & Quyền" subtitle="Phân quyền toàn hệ thống" />
      <SectionCard>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th className="min-w-48">Quyền</th>
                {ROLES.map(r => (
                  <th key={r} className="text-center min-w-32">
                    <span className={`badge ${r === 'master_admin' ? 'badge-brand' : r === 'school_admin' ? 'badge-warning' : r === 'teacher' ? 'badge-success' : 'badge-info'}`}>
                      {ROLE_LABELS[r]}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map(perm => (
                <tr key={perm}>
                  <td className="font-medium text-slate-200">{perm}</td>
                  {ROLES.map(role => (
                    <td key={role} className="text-center">
                      <span className={`text-lg ${MATRIX[perm]?.[role] ? 'text-emerald-400' : 'text-slate-700'}`}>
                        {MATRIX[perm]?.[role] ? '✓' : '✗'}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
