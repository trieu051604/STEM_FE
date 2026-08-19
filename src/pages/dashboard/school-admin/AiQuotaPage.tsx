import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Coins, 
  Users, 
  TrendingUp, 
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Sparkles,
  Calendar,
  Activity,
  Zap,
  UsersRound,
  AlertCircle,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { paymentsApi, teachersApi, studentsApi } from '@/services/schoolAdminApi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export const AiQuotaPage = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'bulk' | 'history'>('overview');
  const [selectedUser, setSelectedUser] = useState<{ id: number; name: string; email: string; role: string } | null>(null);
  const [allocationAmount, setAllocationAmount] = useState('');
  const [allocationNotes, setAllocationNotes] = useState('');
  const [allocating, setAllocating] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: number; name: string; email: string; role: string }>>([]);

  const { data: balance, isLoading: loadingBalance, refetch: refetchBalance } = useQuery({
    queryKey: ['ai-quota-balance'],
    queryFn: () => paymentsApi.getBalance(),
  });

  const { data: allocationsData, isLoading: loadingAllocations, refetch: refetchAllocations } = useQuery({
    queryKey: ['ai-quota-allocations'],
    queryFn: () => paymentsApi.getAllocations(1, 100),
  });

  const searchUsers = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      const [teachers, students] = await Promise.all([
        teachersApi.getAll({ search: query, pageSize: 5 }).catch(() => ({ items: [] })),
        studentsApi.getAll({ search: query, pageSize: 5 }).catch(() => ({ items: [] }))
      ]);
      
      const results: Array<{ id: number; name: string; email: string; role: string }> = [
        ...(teachers.items || []).map((t: any) => ({ id: t.id, name: t.fullName, email: t.email, role: 'Teacher' })),
        ...(students.items || []).map((s: any) => ({ id: s.id, name: s.fullName, email: s.email, role: 'Student' }))
      ];
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleAllocate = async () => {
    if (!selectedUser || !allocationAmount || parseInt(allocationAmount) <= 0) return;
    
    setAllocating(true);
    try {
      const result = await paymentsApi.distributeTokens({
        userId: selectedUser.id,
        tokens: parseInt(allocationAmount),
        notes: allocationNotes || undefined
      });
      
      if (result.success) {
        refetchAllocations();
        refetchBalance();
        setSelectedUser(null);
        setAllocationAmount('');
        setAllocationNotes('');
        alert('Phân bổ AI quota thành công!');
      } else {
        alert(result.errorMessage || 'Không thể phân bổ AI quota');
      }
    } catch (error) {
      console.error('Allocate failed:', error);
      alert('Có lỗi xảy ra');
    } finally {
      setAllocating(false);
    }
  };

  const totalAllocated = allocationsData?.items?.reduce((sum, a) => sum + a.allocatedTokens, 0) || 0;
  const totalUsed = allocationsData?.items?.reduce((sum, a) => sum + a.usedTokens, 0) || 0;
  const usagePercentage = balance?.totalTokensPurchased 
    ? Math.min((totalUsed / balance.totalTokensPurchased) * 100, 100) 
    : 0;

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Chưa có';
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: vi });
  };

  const formatDateTime = (dateStr: string) => {
    return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: vi });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-amber-500" />
            Quản lý AI Quota
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Quản lý và phân bổ quota AI cho giáo viên, học sinh trong trường
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => { refetchBalance(); refetchAllocations(); }} 
          disabled={loadingBalance}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loadingBalance ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title="Tổng quota mua" 
          value={(balance?.totalTokensPurchased || 0).toLocaleString()} 
          icon={<Coins className="w-6 h-6" />}
          gradient="from-amber-500 to-orange-600"
        />
        <StatCard 
          title="Còn lại" 
          value={(balance?.tokensRemaining || 0).toLocaleString()} 
          icon={<Activity className="w-6 h-6" />}
          gradient="from-emerald-500 to-green-600"
        />
        <StatCard 
          title="Đã phân bổ" 
          value={totalAllocated.toLocaleString()} 
          icon={<Users className="w-6 h-6" />}
          gradient="from-blue-500 to-indigo-600"
        />
        <StatCard 
          title="Đã sử dụng" 
          value={totalUsed.toLocaleString()} 
          icon={<TrendingUp className="w-6 h-6" />}
          gradient="from-purple-500 to-pink-600"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <TabButton 
          active={activeTab === 'overview'} 
          onClick={() => setActiveTab('overview')}
          icon={<Sparkles className="w-4 h-4 inline mr-2" />}
        >
          Tổng quan
        </TabButton>
        <TabButton 
          active={activeTab === 'users'} 
          onClick={() => setActiveTab('users')}
          icon={<Users className="w-4 h-4 inline mr-2" />}
        >
          Phân bổ cho User
        </TabButton>
        <TabButton 
          active={activeTab === 'bulk'} 
          onClick={() => setActiveTab('bulk')}
          icon={<UsersRound className="w-4 h-4 inline mr-2" />}
        >
          Phân bổ hàng loạt
        </TabButton>
        <TabButton 
          active={activeTab === 'history'} 
          onClick={() => setActiveTab('history')}
          icon={<Clock className="w-4 h-4 inline mr-2" />}
        >
          Lịch sử phân bổ
        </TabButton>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab 
          balance={balance}
          allocationsData={allocationsData}
          loadingAllocations={loadingAllocations}
          totalUsed={totalUsed}
          usagePercentage={usagePercentage}
          formatDate={formatDate}
        />
      )}

      {activeTab === 'users' && (
        <UsersTab
          balance={balance}
          allocationsData={allocationsData}
          loadingAllocations={loadingAllocations}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          allocationAmount={allocationAmount}
          setAllocationAmount={setAllocationAmount}
          allocationNotes={allocationNotes}
          setAllocationNotes={setAllocationNotes}
          allocating={allocating}
          handleAllocate={handleAllocate}
          userSearch={userSearch}
          setUserSearch={setUserSearch}
          searchResults={searchResults}
          setSearchResults={setSearchResults}
          searchUsers={searchUsers}
          formatDate={formatDate}
        />
      )}

      {activeTab === 'bulk' && (
        <BulkAllocateSection balance={balance} onSuccess={() => { refetchBalance(); refetchAllocations(); }} />
      )}

      {activeTab === 'history' && (
        <HistoryTab
          allocationsData={allocationsData}
          loadingAllocations={loadingAllocations}
          formatDateTime={formatDateTime}
        />
      )}
    </div>
  );
};

// Sub-components
function StatCard({ title, value, icon, gradient }: { title: string; value: string; icon: React.ReactNode; gradient: string }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 text-white`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, children }: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-medium transition-colors ${
        active
          ? 'text-brand-600 border-b-2 border-brand-600'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function OverviewTab({ balance, allocationsData, loadingAllocations, totalUsed, usagePercentage, formatDate }: any) {
  const totalAllocated = allocationsData?.items?.reduce((sum: number, a: any) => sum + a.allocatedTokens, 0) || 0;
  
  const roleStats = ['Teacher', 'Student'].map(role => ({
    role,
    total: allocationsData?.items?.filter((a: any) => a.userRole === role).reduce((sum: number, a: any) => sum + a.allocatedTokens, 0) || 0,
    count: allocationsData?.items?.filter((a: any) => a.userRole === role).length || 0
  }));

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-brand-500" />
          Tổng quan sử dụng AI
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Đã sử dụng</span>
                <span className="font-medium">{totalUsed.toLocaleString()} / {(balance?.totalTokensPurchased || 0).toLocaleString()}</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span>Đã sử dụng</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-muted" />
                <span>Còn lại</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Phân bổ theo vai trò</h4>
            {roleStats.map(stat => (
              <div key={stat.role} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    stat.role === 'Teacher' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    <Users className={`w-4 h-4 ${stat.role === 'Teacher' ? 'text-blue-600' : 'text-green-600'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{stat.role === 'Teacher' ? 'Giáo viên' : 'Học sinh'}</p>
                    <p className="text-xs text-muted-foreground">{stat.count} người</p>
                  </div>
                </div>
                <p className="font-semibold">{stat.total.toLocaleString()} tokens</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Thông tin gói</h4>
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Ngày mua gần nhất:</span>
                <span className="font-medium">{formatDate(balance?.lastPurchaseAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Hết hạn:</span>
                <span className={`font-medium ${balance?.expiresAt && new Date(balance.expiresAt) < new Date() ? 'text-red-500' : ''}`}>
                  {formatDate(balance?.expiresAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Top người dùng AI nhiều nhất
          </h3>
        </div>
        {loadingAllocations ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        ) : !allocationsData?.items?.length ? (
          <div className="p-8 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Chưa có ai được phân bổ quota AI</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {allocationsData.items
              .sort((a: any, b: any) => b.usedTokens - a.usedTokens)
              .slice(0, 5)
              .map((alloc: any, idx: number) => (
                <div key={alloc.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      idx === 0 ? 'bg-amber-100 text-amber-700' :
                      idx === 1 ? 'bg-gray-100 text-gray-700' :
                      idx === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium">{alloc.userName}</p>
                      <p className="text-sm text-muted-foreground">{alloc.userEmail}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-amber-600">{alloc.usedTokens.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      / {alloc.allocatedTokens.toLocaleString()} tokens
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UsersTab({ balance, allocationsData, loadingAllocations, selectedUser, setSelectedUser, allocationAmount, setAllocationAmount, allocationNotes, setAllocationNotes, allocating, handleAllocate, userSearch, setUserSearch, searchResults, setSearchResults, searchUsers, formatDate }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Coins className="w-5 h-5 text-brand-500" />
          Phân bổ AI Quota cho User
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="relative">
            <label className="block text-sm font-medium mb-1">Chọn User</label>
            {selectedUser ? (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{selectedUser.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email} • {selectedUser.role}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                  ×
                </Button>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    searchUsers(e.target.value);
                  }}
                  placeholder="Tìm kiếm giáo viên hoặc học sinh..."
                  className="w-full p-3 border border-border rounded-lg"
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
                    {searchResults.map((user: any) => (
                      <div
                        key={user.id}
                        className="p-3 hover:bg-muted cursor-pointer border-b border-border last:border-0"
                        onClick={() => {
                          setSelectedUser(user);
                          setUserSearch('');
                          setSearchResults([]);
                        }}
                      >
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email} • {user.role}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Số tokens cần phân bổ</label>
            <input
              type="number"
              value={allocationAmount}
              onChange={(e) => setAllocationAmount(e.target.value)}
              placeholder="Nhập số tokens..."
              min="1"
              className="w-full p-3 border border-border rounded-lg"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Tối đa khả dụng: {(balance?.tokensRemaining || 0).toLocaleString()} tokens
            </p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Ghi chú (tùy chọn)</label>
          <textarea
            value={allocationNotes}
            onChange={(e) => setAllocationNotes(e.target.value)}
            placeholder="Nhập ghi chú..."
            rows={2}
            className="w-full p-3 border border-border rounded-lg"
          />
        </div>

        <Button
          onClick={handleAllocate}
          disabled={!selectedUser || !allocationAmount || parseInt(allocationAmount) <= 0 || allocating}
          className="w-full md:w-auto"
        >
          {allocating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Đang phân bổ...
            </>
          ) : (
            <>
              <Coins className="w-4 h-4 mr-2" />
              Phân bổ AI Quota
            </>
          )}
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Danh sách phân bổ hiện tại</h3>
        </div>
        {loadingAllocations ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        ) : !allocationsData?.items?.length ? (
          <div className="p-8 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Chưa có phân bổ nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium">User</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Vai trò</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Đã phân bổ</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Đã sử dụng</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Còn lại</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Tiến độ</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Hết hạn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allocationsData.items.map((alloc: any) => (
                  <tr key={alloc.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{alloc.userName}</p>
                      <p className="text-sm text-muted-foreground">{alloc.userEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        alloc.userRole === 'Teacher' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {alloc.userRole === 'Teacher' ? 'Giáo viên' : 'Học sinh'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Coins className="w-4 h-4 text-brand-500" />
                        <span className="font-medium">{alloc.allocatedTokens.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-red-600">
                      {alloc.usedTokens.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-green-600">
                      {alloc.remainingTokens.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-24">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-brand-500 rounded-full"
                            style={{ width: `${alloc.allocatedTokens > 0 ? (alloc.usedTokens / alloc.allocatedTokens) * 100 : 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {alloc.allocatedTokens > 0 ? Math.round((alloc.usedTokens / alloc.allocatedTokens) * 100) : 0}%
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-sm">
                      {formatDate(alloc.expiresAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryTab({ allocationsData, loadingAllocations, formatDateTime }: any) {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-brand-500" />
          Lịch sử phân bổ AI Quota
        </h3>
      </div>
      {loadingAllocations ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : !allocationsData?.items?.length ? (
        <div className="p-8 text-center text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Chưa có lịch sử phân bổ</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {allocationsData.items.map((alloc: any) => (
            <div key={alloc.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  alloc.allocatedTokens > 0 ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {alloc.allocatedTokens > 0 ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{alloc.userName}</p>
                  <p className="text-sm text-muted-foreground">
                    {alloc.userRole === 'Teacher' ? 'Giáo viên' : 'Học sinh'} • {alloc.userEmail}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${alloc.allocatedTokens > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {alloc.allocatedTokens > 0 ? '+' : ''}{alloc.allocatedTokens.toLocaleString()} tokens
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(alloc.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Bulk Allocate Component
interface BulkAllocateSectionProps {
  balance?: {
    tokensRemaining: number;
    totalTokensPurchased: number;
  };
  onSuccess: () => void;
}

function BulkAllocateSection({ balance, onSuccess }: BulkAllocateSectionProps) {
  const queryClient = useQueryClient();
  const [studentTokens, setStudentTokens] = useState('10000');
  const [teacherTokens, setTeacherTokens] = useState('50000');
  const [expiresAt, setExpiresAt] = useState('');
  const [notes, setNotes] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const bulkAllocateMutation = useMutation({
    mutationFn: (data: { studentTokens: number; teacherTokens: number; expiresAt?: string; notes?: string }) =>
      paymentsApi.bulkAllocate(data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['ai-quota-balance'] });
        queryClient.invalidateQueries({ queryKey: ['ai-quota-allocations'] });
        setShowConfirm(false);
        setShowResults(true);
      }
    }
  });

  const handleSubmit = () => {
    bulkAllocateMutation.mutate({
      studentTokens: parseInt(studentTokens) || 0,
      teacherTokens: parseInt(teacherTokens) || 0,
      expiresAt: expiresAt || undefined,
      notes: notes || undefined
    });
  };

  const totalNeeded = (parseInt(studentTokens) || 0) + (parseInt(teacherTokens) || 0);
  const hasEnoughTokens = balance ? balance.tokensRemaining >= totalNeeded : false;

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex gap-3">
          <UsersRound className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800">Phân bổ token hàng loạt</p>
            <p className="text-sm text-blue-700 mt-1">
              Phân bổ số lượng token cố định cho tất cả học sinh và giáo viên trong trường.
              Token sẽ được cộng dồn nếu đã có allocation trước đó.
            </p>
          </div>
        </div>
      </div>

      {/* Allocation Form */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          Cấu hình phân bổ
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Student Tokens */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-green-600" />
              </div>
              Token cho học sinh
            </label>
            <input
              type="number"
              min="0"
              value={studentTokens}
              onChange={(e) => setStudentTokens(e.target.value)}
              placeholder="10000"
              className="w-full p-3 border border-border rounded-lg"
            />
            <p className="text-xs text-muted-foreground">Mỗi học sinh sẽ nhận được số token này</p>
          </div>

          {/* Teacher Tokens */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              Token cho giáo viên
            </label>
            <input
              type="number"
              min="0"
              value={teacherTokens}
              onChange={(e) => setTeacherTokens(e.target.value)}
              placeholder="50000"
              className="w-full p-3 border border-border rounded-lg"
            />
            <p className="text-xs text-muted-foreground">Mỗi giáo viên sẽ nhận được số token này</p>
          </div>

          {/* Expires At */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Ngày hết hạn (tùy chọn)</label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full p-3 border border-border rounded-lg"
            />
            <p className="text-xs text-muted-foreground">Để trống nếu muốn sử dụng expiry mặc định</p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Ghi chú</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Phân bổ định kỳ tháng 8"
              className="w-full p-3 border border-border rounded-lg"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-muted rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tổng token cần:</span>
            <span className="font-bold text-lg">{totalNeeded.toLocaleString()} tokens</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Số dư hiện tại:</span>
            <span className={`font-medium ${hasEnoughTokens ? 'text-green-600' : 'text-red-600'}`}>
              {(balance?.tokensRemaining || 0).toLocaleString()} tokens
            </span>
          </div>
          {!hasEnoughTokens && balance && (
            <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
              <AlertCircle className="w-4 h-4" />
              Số dư không đủ để thực hiện phân bổ
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="mt-6 flex justify-end">
          <Button
            onClick={() => setShowConfirm(true)}
            disabled={!hasEnoughTokens || totalNeeded === 0}
            className="gap-2"
          >
            <Zap className="w-4 h-4" />
            Phân bổ Token
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Xác nhận phân bổ</h3>
                <p className="text-sm text-muted-foreground">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <div className="bg-muted rounded-xl p-4 mb-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Học sinh:</span>
                <span className="font-medium">{(parseInt(studentTokens) || 0).toLocaleString()} tokens/người</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Giáo viên:</span>
                <span className="font-medium">{(parseInt(teacherTokens) || 0).toLocaleString()} tokens/người</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tổng:</span>
                <span className="font-bold">{totalNeeded.toLocaleString()} tokens</span>
              </div>
            </div>

            {bulkAllocateMutation.isError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {bulkAllocateMutation.error?.message || 'Đã xảy ra lỗi'}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirm(false);
                  bulkAllocateMutation.reset();
                }}
                className="flex-1"
                disabled={bulkAllocateMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1"
                disabled={bulkAllocateMutation.isPending}
              >
                {bulkAllocateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Xác nhận
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResults && bulkAllocateMutation.data && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl max-h-[80vh] overflow-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Phân bổ thành công!</h3>
                <p className="text-sm text-muted-foreground">Kết quả phân bổ token</p>
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-4 mb-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-green-800">Tổng người dùng:</span>
                <span className="font-medium text-green-800">{bulkAllocateMutation.data.totalUsers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-green-800">Thành công:</span>
                <span className="font-medium text-green-800">{bulkAllocateMutation.data.successCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-green-800">Thất bại:</span>
                <span className="font-medium text-red-600">{bulkAllocateMutation.data.failedCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-green-800">Tổng token đã phân bổ:</span>
                <span className="font-bold text-green-800">{bulkAllocateMutation.data.totalTokensAllocated.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-green-800">Số dư còn lại:</span>
                <span className="font-medium text-green-800">{bulkAllocateMutation.data.schoolTokensRemaining.toLocaleString()}</span>
              </div>
            </div>

            {/* Results List */}
            {bulkAllocateMutation.data.results.length > 0 && (
              <div className="max-h-60 overflow-auto border border-border rounded-lg">
                <div className="sticky top-0 bg-muted p-2 font-medium text-sm">
                  Chi tiết
                </div>
                <div className="divide-y divide-border">
                  {bulkAllocateMutation.data.results.map((r, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{r.userName}</p>
                        <p className="text-xs text-muted-foreground">{r.role}</p>
                      </div>
                      <div className="text-right">
                        {r.success ? (
                          <>
                            <p className="text-green-600 font-medium text-sm">+{r.tokensAllocated.toLocaleString()}</p>
                          </>
                        ) : (
                          <p className="text-red-600 text-sm">{r.errorMessage}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => {
                  setShowResults(false);
                  bulkAllocateMutation.reset();
                  onSuccess();
                }}
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AiQuotaPage;
