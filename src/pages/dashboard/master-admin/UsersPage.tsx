import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable, ColumnDef, SearchInput, Pagination, StatusBadge } from '../school-admin/components/DataTable';
import { usersApi } from '@/services/schoolAdminApi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Loader2, User, Mail, Shield, Building2 } from 'lucide-react';

interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  role: string;
  phone: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  address: string | null;
  isActive: boolean;
  isLocked: boolean;
  createdAt: string;
  schoolName: string | null;
}

const ITEMS_PER_PAGE = 10;

export const UsersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  });

  const filteredData = data?.filter((item: UserProfile) => {
    const matchesSearch =
      item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || item.role === roleFilter;
    return matchesSearch && matchesRole;
  }) || [];

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'MasterAdmin':
        return 'danger';
      case 'SchoolAdmin':
        return 'warning';
      case 'Teacher':
        return 'success';
      case 'Student':
        return 'default';
      default:
        return 'default';
    }
  };

  const columns: ColumnDef<UserProfile>[] = [
    {
      key: 'user',
      header: 'Người dùng',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium">{item.fullName}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {item.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Vai trò',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <StatusBadge status={item.role} variant={getRoleBadgeVariant(item.role) as any} />
        </div>
      ),
    },
    {
      key: 'school',
      header: 'Trường học',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{item.schoolName || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Trạng thái',
      render: (item) => (
        <div className="flex gap-2">
          {item.isActive ? (
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
              Hoạt động
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-400">
              Không hoạt động
            </span>
          )}
          {item.isLocked && (
            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
              Bị khóa
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      render: (item) => (
        <span className="text-sm">
          {format(new Date(item.createdAt), 'dd/MM/yyyy', { locale: vi })}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
        <p className="text-muted-foreground">Xem và quản lý tất cả người dùng trong hệ thống</p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Tìm kiếm email, tên..."
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">Tất cả vai trò</option>
          <option value="MasterAdmin">Master Admin</option>
          <option value="SchoolAdmin">School Admin</option>
          <option value="Teacher">Giáo viên</option>
          <option value="Student">Học sinh</option>
        </select>
      </div>

      <DataTable columns={columns} data={paginatedData} loading={isLoading} />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
};
