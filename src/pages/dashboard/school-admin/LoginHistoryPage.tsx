import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable, ColumnDef, SearchInput, Pagination } from './components/DataTable';
import { loginHistoryApi } from '@/services/schoolAdminApi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Loader2, Monitor, Smartphone, MonitorSmartphone } from 'lucide-react';

interface LoginHistory {
  id: number;
  userId: number;
  userEmail: string;
  userFullName: string;
  loginTime: string;
  logoutTime: string | null;
  ipAddress: string;
  deviceType: string;
  browser: string;
  os: string;
  isSuccessful: boolean;
  failureReason: string | null;
}

const ITEMS_PER_PAGE = 10;

export const LoginHistoryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);

  const { data, isLoading } = useQuery({
    queryKey: ['login-history'],
    queryFn: () => loginHistoryApi.getLoginHistory(),
  });

  const filteredData = data?.filter(
    (item: LoginHistory) =>
      item.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.userFullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ipAddress?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const columns: ColumnDef<LoginHistory>[] = [
    {
      key: 'user',
      header: 'Người dùng',
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-medium">{item.userFullName}</span>
          <span className="text-xs text-muted-foreground">{item.userEmail}</span>
        </div>
      ),
    },
    {
      key: 'loginTime',
      header: 'Thời gian đăng nhập',
      render: (item) => (
        <span className="text-sm">
          {format(new Date(item.loginTime), 'HH:mm dd/MM/yyyy', { locale: vi })}
        </span>
      ),
    },
    {
      key: 'deviceType',
      header: 'Thiết bị',
      render: (item) => {
        const icon = item.deviceType === 'Mobile' ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />;
        return (
          <div className="flex items-center gap-2">
            {icon}
            <div className="flex flex-col">
              <span className="text-sm">{item.deviceType}</span>
              <span className="text-xs text-muted-foreground">{item.browser}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'ipAddress',
      header: 'IP',
      render: (item) => <span className="font-mono text-sm">{item.ipAddress}</span>,
    },
    {
      key: 'isSuccessful',
      header: 'Trạng thái',
      render: (item) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            item.isSuccessful
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}
        >
          {item.isSuccessful ? 'Thành công' : 'Thất bại'}
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
        <h1 className="text-2xl font-bold">Lịch sử đăng nhập</h1>
        <p className="text-muted-foreground">Xem lịch sử đăng nhập của tất cả người dùng</p>
      </div>

      <div className="flex items-center gap-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Tìm kiếm email, tên, IP..."
        />
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
