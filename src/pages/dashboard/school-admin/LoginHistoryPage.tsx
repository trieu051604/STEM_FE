import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/Icon';
import { RefreshCw, Filter, LogIn, LogOut, AlertCircle, Monitor, Globe, Calendar } from 'lucide-react';
import {
  Pagination,
  SearchInput,
  StatusBadge,
  Modal,
} from './components/DataTable';
import { usersApi, loginHistoryApi, LoginHistory } from '@/services/schoolAdminApi';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';

const ITEMS_PER_PAGE = 15;

export const LoginHistoryPage = () => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectUserModalOpen, setSelectUserModalOpen] = useState(false);

  // Fetch users for selection
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users-select'],
    queryFn: () => usersApi.getList({ pageSize: 100, role: 'teacher' }),
  });

  // Fetch login history
  const { data: historyData, isLoading: historyLoading, refetch } = useQuery({
    queryKey: ['login-history-detail', selectedUserId, currentPage, pageSize, dateFilter, statusFilter],
    queryFn: () => {
      if (!selectedUserId) return null;
      
      const params: any = {
        pageNumber: currentPage,
        pageSize: pageSize,
        userId: selectedUserId,
      };

      // Date filter
      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate: Date;
        switch (dateFilter) {
          case 'today':
            startDate = startOfDay(now);
            break;
          case 'yesterday':
            startDate = startOfDay(subDays(now, 1));
            break;
          case '7days':
            startDate = startOfDay(subDays(now, 7));
            break;
          case '30days':
            startDate = startOfDay(subDays(now, 30));
            break;
          default:
            startDate = startOfDay(subDays(now, 365));
        }
        params.startDate = startDate.toISOString();
        params.endDate = endOfDay(now).toISOString();
      }

      return loginHistoryApi.getByUserId(params);
    },
    enabled: !!selectedUserId,
  });

  // Filter users by search
  const filteredUsers = useMemo(() => {
    if (!usersData?.items) return [];
    return usersData.items.filter(user => 
      user.fullName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
    );
  }, [usersData?.items, userSearchTerm]);

  // Filter history by status (client-side)
  const filteredHistory = useMemo(() => {
    if (!historyData?.items) return [];
    if (!statusFilter) return historyData.items;
    return historyData.items.filter(h => 
      statusFilter === 'success' ? h.loginStatus === 'Success' : h.loginStatus === 'Failed'
    );
  }, [historyData?.items, statusFilter]);

  const totalPages = historyData ? Math.ceil(historyData.total / pageSize) : 0;

  const handleSelectUser = (userId: number, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setSelectUserModalOpen(false);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Lịch sử đăng nhập</h1>
          <p className="text-muted-foreground">
            Theo dõi hoạt động đăng nhập của giáo viên trong trường
          </p>
        </div>
        <Button onClick={() => setSelectUserModalOpen(true)}>
          <Icon name="UserSearch" className="w-4 h-4" />
          {selectedUserId ? 'Đổi người dùng' : 'Chọn người dùng'}
        </Button>
      </div>

      {/* Selected User Info */}
      {selectedUserId && (
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon name="User" className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{selectedUserName}</p>
                <p className="text-sm text-muted-foreground">ID: #{selectedUserId}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      {selectedUserId && (
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">Tất cả thời gian</option>
            <option value="today">Hôm nay</option>
            <option value="yesterday">Hôm qua</option>
            <option value="7days">7 ngày gần đây</option>
            <option value="30days">30 ngày gần đây</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="success">Thành công</option>
            <option value="failed">Thất bại</option>
          </select>
        </div>
      )}

      {/* History List */}
      {!selectedUserId ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <Icon name="History" className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Chọn người dùng</h3>
          <p className="text-muted-foreground mb-4">
            Vui lòng chọn một giáo viên để xem lịch sử đăng nhập
          </p>
          <Button onClick={() => setSelectUserModalOpen(true)}>
            <Icon name="UserSearch" className="w-4 h-4" />
            Chọn người dùng
          </Button>
        </div>
      ) : historyLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-card animate-pulse rounded-xl border border-border" />
          ))}
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <Icon name="Inbox" className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Không có dữ liệu</h3>
          <p className="text-muted-foreground">
            Không tìm thấy lịch sử đăng nhập nào cho người dùng này
          </p>
        </div>
      ) : (
        <>
          {/* Stats */}
          {historyData && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <LogIn className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {historyData.items.filter((h) => h.loginStatus === 'Success').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Đăng nhập thành công</p>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {historyData.items.filter((h) => h.loginStatus === 'Failed').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Đăng nhập thất bại</p>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{historyData.total}</p>
                    <p className="text-sm text-muted-foreground">Tổng lần đăng nhập</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* History Items */}
          <div className="space-y-3">
            {filteredHistory.map((history) => (
              <div
                key={history.id}
                className="bg-card rounded-xl border border-border p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      history.loginStatus === 'Success' 
                        ? 'bg-green-100 dark:bg-green-900/30' 
                        : 'bg-destructive/10'
                    }`}>
                      {history.loginStatus === 'Success' ? (
                        <LogIn className={`w-6 h-6 text-green-600 dark:text-green-400`} />
                      ) : (
                        <AlertCircle className={`w-6 h-6 text-destructive`} />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">
                          {history.loginStatus === 'Success' ? 'Đăng nhập thành công' : 'Đăng nhập thất bại'}
                        </h4>
                        <StatusBadge 
                          status={history.loginStatus === 'Success' ? 'Thành công' : 'Thất bại'} 
                          variant={history.loginStatus === 'Success' ? 'success' : 'danger'} 
                        />
                      </div>
                      {history.failureReason && (
                        <p className="text-sm text-destructive">{history.failureReason}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {history.deviceName && (
                        <span className="flex items-center gap-1">
                          <Monitor className="w-3.5 h-3.5" />
                          {history.deviceName}
                        </span>
                      )}
                        {history.location && (
                          <span className="flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5" />
                            {history.location}
                          </span>
                        )}
                        {history.ipAddress && (
                          <span className="font-mono text-xs">
                            IP: {history.ipAddress}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium">
                      {format(new Date(history.loginTime), 'dd/MM/yyyy', { locale: vi })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(history.loginTime), 'HH:mm:ss', { locale: vi })}
                    </p>
                    {history.logoutTime && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Logout: {format(new Date(history.logoutTime), 'HH:mm:ss', { locale: vi })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={historyData?.total || 0}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          )}
        </>
      )}

      {/* User Selection Modal */}
      <Modal
        isOpen={selectUserModalOpen}
        onClose={() => setSelectUserModalOpen(false)}
        title="Chọn người dùng"
        size="lg"
      >
        <div className="space-y-4">
          <SearchInput
            value={userSearchTerm}
            onChange={setUserSearchTerm}
            placeholder="Tìm kiếm theo tên, email..."
          />
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {usersLoading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
              ))
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Không tìm thấy người dùng nào
              </div>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user.id, user.fullName)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    selectedUserId === user.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon name="User" className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{user.fullName}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  {selectedUserId === user.id && (
                    <Icon name="Check" className="w-5 h-5 text-primary" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LoginHistoryPage;
