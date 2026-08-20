import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  Coins, 
  History, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Star,
  Zap,
  Shield,
  Users,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { paymentsApi, PaymentPackage, Payment, TokenBalance, TokenTransaction, CreatePaymentResponse } from '@/services/schoolAdminApi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useSearchParams } from 'react-router-dom';

const ITEMS_PER_PAGE = 10;

export const PaymentsPage = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPackage, setSelectedPackage] = useState<PaymentPackage | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [activeTab, setActiveTab] = useState<'packages' | 'history'>('packages');
  
  // Check for PayOS callback
  const successParam = searchParams.get('success');
  const cancelledParam = searchParams.get('cancelled');
  const transactionIdParam = searchParams.get('transactionId');

  // Fetch packages
  const { data: packages, isLoading: loadingPackages } = useQuery({
    queryKey: ['payment-packages'],
    queryFn: () => paymentsApi.getPackages(),
  });

  // Fetch token balance
  const { data: balance, isLoading: loadingBalance, refetch: refetchBalance } = useQuery({
    queryKey: ['token-balance'],
    queryFn: () => paymentsApi.getBalance(),
  });

  // Fetch payment history
  const { data: paymentsData, isLoading: loadingPayments, refetch: refetchPayments } = useQuery({
    queryKey: ['payment-history'],
    queryFn: () => paymentsApi.getPayments(1, ITEMS_PER_PAGE),
  });

  // Fetch transactions
  const { data: transactionsData, refetch: refetchTransactions } = useQuery({
    queryKey: ['token-transactions'],
    queryFn: () => paymentsApi.getTransactions(1, 20),
  });

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    
    setPurchasing(true);
    try {
      const result: CreatePaymentResponse = await paymentsApi.createPayment(selectedPackage.id);
      
      if (result.success && result.checkoutUrl) {
        // Redirect to PayOS checkout
        window.location.href = result.checkoutUrl;
      } else {
        console.error('Failed to create payment:', result.errorMessage);
        alert(result.errorMessage || 'Không thể tạo thanh toán');
      }
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setPurchasing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Thành công</span>;
      case 'pending':
      case 'processing':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Đang xử lý</span>;
      case 'failed':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Thất bại</span>;
      case 'cancelled':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Đã hủy</span>;
      case 'expired':
        return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Hết hạn</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  const getTransactionTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'purchase':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Mua</span>;
      case 'usage':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Sử dụng</span>;
      case 'distribution':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Phân bổ</span>;
      case 'refund':
        return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Hoàn tiền</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{type}</span>;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'VND') => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ' + currency;
  };

  return (
    <div className="space-y-6">
      {/* PayOS Callback Notifications */}
      {successParam === 'true' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <div>
            <p className="font-medium text-green-800">Thanh toán thành công!</p>
            <p className="text-sm text-green-700">Tokens đã được cộng vào tài khoản của bạn.</p>
          </div>
        </div>
      )}
      {cancelledParam === 'true' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-600" />
          <div>
            <p className="font-medium text-yellow-800">Thanh toán đã bị hủy</p>
            <p className="text-sm text-yellow-700">Bạn có thể thử lại sau.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Token AI</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Mua token và phân bổ cho giáo viên, học sinh trong trường
          </p>
        </div>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['token-balance'] })} disabled={loadingBalance}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loadingBalance ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Token Balance Card */}
      <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <Coins className="w-8 h-8" />
            </div>
            <div>
              <p className="text-white/80 text-sm">Số dư token của trường</p>
              <p className="text-4xl font-bold">{loadingBalance ? '...' : (balance?.tokensRemaining ?? 0).toLocaleString()}</p>
              <p className="text-white/70 text-sm mt-1">
                {balance?.expiresAt && (() => {
                  const date = new Date(balance.expiresAt!);
                  return !isNaN(date.getTime()) ? (
                    <>Hết hạn: {format(date, 'dd/MM/yyyy', { locale: vi })}</>
                  ) : null;
                })()}
              </p>
            </div>
          </div>
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-white/80 text-sm">Đã phân bổ</p>
              <p className="text-2xl font-bold">{balance?.tokensDistributed ?? 0}</p>
            </div>
            <div className="text-center">
              <p className="text-white/80 text-sm">Đã sử dụng</p>
              <p className="text-2xl font-bold">{balance?.tokensUsed ?? 0}</p>
            </div>
            <div className="text-center">
              <p className="text-white/80 text-sm">Tổng mua</p>
              <p className="text-2xl font-bold">{balance?.totalTokensPurchased ?? 0}</p>
            </div>
          </div>
        </div>
      </div>          
      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('packages')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'packages'
              ? 'text-brand-600 border-b-2 border-brand-600'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <CreditCard className="w-4 h-4 inline mr-2" />
          Mua Token
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'history'
              ? 'text-brand-600 border-b-2 border-brand-600'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <History className="w-4 h-4 inline mr-2" />
          Lịch sử
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'packages' && (
        <>
          {/* Pricing Cards */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Chọn gói Token</h2>
            {loadingPackages ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {packages?.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`relative bg-card rounded-2xl border-2 p-6 transition-all cursor-pointer hover:shadow-lg ${
                      selectedPackage?.id === pkg.id
                        ? 'border-brand-500 shadow-lg scale-[1.02]'
                        : 'border-border hover:border-brand-300'
                    }`}
                    onClick={() => setSelectedPackage(pkg)}
                  >
                    {pkg.isFeatured && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-gradient-to-r from-amber-400 to-amber-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3" /> Phổ biến
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center mb-4">
                      <h3 className="font-bold text-lg mb-1">{pkg.name}</h3>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-3xl font-bold text-brand-600">{formatCurrency(pkg.price)}</span>
                        <span className="text-sm text-muted-foreground">/ tháng</span>
                      </div>
                    </div>

                    <div className="bg-brand-50 rounded-lg p-3 mb-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Users className="w-5 h-5 text-brand-600" />
                        <span className="text-2xl font-bold text-brand-700">
                          {pkg.studentLimit >= 999999 ? '∞' : pkg.studentLimit}
                        </span>
                      </div>
                      <p className="text-sm text-brand-600">học sinh tối đa</p>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Coins className="w-4 h-4 text-amber-500" />
                        <span>{pkg.tokenAmount.toLocaleString()} tokens</span>
                      </div>
                      {pkg.features && (
                        <div className="mt-2 space-y-1">
                          {JSON.parse(pkg.features).map((feature: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {selectedPackage?.id === pkg.id && (
                      <div className="absolute inset-0 bg-brand-500/10 rounded-2xl flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-brand-500" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Purchase Button */}
          {selectedPackage && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-brand-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Gói {selectedPackage.name}</h3>
                    <p className="text-muted-foreground">
                      {selectedPackage.tokenAmount.toLocaleString()} tokens • {formatCurrency(selectedPackage.price)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Thành tiền</p>
                    <p className="text-2xl font-bold text-brand-600">{formatCurrency(selectedPackage.price)}</p>
                  </div>
                  <Button
                    size="lg"
                    onClick={handlePurchase}
                    disabled={purchasing}
                    className="min-w-[160px]"
                  >
                    {purchasing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Đang tạo...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Thanh toán PayOS
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="mt-4 p-4 bg-muted/50 rounded-xl">
                <p className="text-sm text-muted-foreground">
                  Bạn sẽ được chuyển hướng đến cổng thanh toán PayOS để hoàn tất thanh toán.
                  Sau khi thanh toán thành công, tokens sẽ được cộng vào tài khoản của trường.
                </p>
              </div>
            </div>
          )}

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Giá tốt nhất</h4>
                <p className="text-xs text-muted-foreground">Tiết kiệm đến 22% khi mua gói dài hạn</p>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Thanh toán an toàn</h4>
                <p className="text-xs text-muted-foreground">Bảo mật bởi PayOS</p>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Mua thêm token</h4>
                <p className="text-xs text-muted-foreground">Nạp thêm token bất kỳ lúc nào</p>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'history' && (
        <HistorySection
          payments={paymentsData?.items || []}
          transactions={transactionsData?.items || []}
          loadingPayments={loadingPayments}
        />
      )}
    </div>
  );
};
// History Component
interface HistorySectionProps {
  payments: Payment[];
  transactions: TokenTransaction[];
  loadingPayments: boolean;
}

const HistorySection = ({ payments, transactions, loadingPayments }: HistorySectionProps) => {
  const [historyTab, setHistoryTab] = useState<'payments' | 'transactions'>('payments');

  return (
    <div className="space-y-4">
      {/* History Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setHistoryTab('payments')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            historyTab === 'payments'
              ? 'bg-brand-100 text-brand-700'
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          Thanh toán ({payments.length})
        </button>
        <button
          onClick={() => setHistoryTab('transactions')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            historyTab === 'transactions'
              ? 'bg-brand-100 text-brand-700'
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          Giao dịch Token ({transactions.length})
        </button>
      </div>

      {historyTab === 'payments' && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {loadingPayments ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Chưa có lịch sử thanh toán</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium">Mã GD</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Gói</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Tokens</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Số tiền</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Trạng thái</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Ngày</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm font-mono">{payment.transactionId}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{payment.packageName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Coins className="w-4 h-4 text-brand-500" />
                        <span>{payment.tokenAmount.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {new Intl.NumberFormat('vi-VN').format(payment.amount)} VND
                    </td>
                    <td className="px-4 py-3">{payment.status}</td>
                    <td className="px-4 py-3 text-muted-foreground text-sm">
                      {format(new Date(payment.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {historyTab === 'transactions' && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Chưa có giao dịch nào</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium">Loại</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Số lượng</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Số dư</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Mô tả</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Ngày</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3">{tx.type}</td>
                    <td className={`px-4 py-3 font-medium ${tx.quantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.quantity >= 0 ? '+' : ''}{tx.quantity.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{tx.balanceAfter.toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground text-sm">{tx.description || '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground text-sm">
                      {format(new Date(tx.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
