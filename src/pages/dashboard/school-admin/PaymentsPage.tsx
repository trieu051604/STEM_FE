import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/Icon';
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
  Clock
} from 'lucide-react';
import { paymentsApi, PaymentPackage, Payment, TokenBalance } from '@/services/schoolAdminApi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const ITEMS_PER_PAGE = 10;

export const PaymentsPage = () => {
  const [selectedPackage, setSelectedPackage] = useState<PaymentPackage | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

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

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    
    setPurchasing(true);
    try {
      await paymentsApi.createPayment(selectedPackage.id, 'Manual');
      setPurchaseSuccess(true);
      refetchBalance();
      refetchPayments();
      setTimeout(() => {
        setPurchaseSuccess(false);
        setSelectedPackage(null);
      }, 3000);
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
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Đang xử lý</span>;
      case 'failed':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Thất bại</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mua Token Virtual Lab</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Nạp token để sử dụng các tính năng Virtual Lab trong trường của bạn
          </p>
        </div>
      </div>

      {/* Token Balance Card */}
      <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <Coins className="w-8 h-8" />
            </div>
            <div>
              <p className="text-white/80 text-sm">Số dư token của bạn</p>
              <p className="text-4xl font-bold">{loadingBalance ? '...' : (balance?.tokensRemaining ?? 0)}</p>
              <p className="text-white/70 text-sm mt-1">
                {balance?.expiresAt && (
                  <>Hết hạn: {format(new Date(balance.expiresAt), 'dd/MM/yyyy', { locale: vi })}</>
                )}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-sm">Đã sử dụng</p>
            <p className="text-2xl font-bold">{loadingBalance ? '...' : (balance?.tokensUsed ?? 0)}</p>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Chọn gói Token</h2>
        {loadingPackages ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {packages?.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative bg-card rounded-2xl border-2 p-6 transition-all cursor-pointer hover:shadow-lg ${
                  selectedPackage?.id === pkg.id
                    ? 'border-brand-500 shadow-lg scale-105'
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
                    <span className="text-3xl font-bold text-brand-600">${pkg.price}</span>
                    <span className="text-muted-foreground">/tháng</span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Coins className="w-4 h-4 text-brand-500" />
                    <span>{pkg.tokenAmount} tokens</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{pkg.durationMonths} tháng</span>
                  </div>
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
                  {selectedPackage.tokenAmount} tokens • ${selectedPackage.price}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Thành tiền</p>
                <p className="text-2xl font-bold text-brand-600">${selectedPackage.price}</p>
              </div>
              <Button
                size="lg"
                onClick={handlePurchase}
                disabled={purchasing || purchaseSuccess}
                className="min-w-[140px]"
              >
                {purchasing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Đang xử lý...
                  </>
                ) : purchaseSuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Thành công!
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Mua ngay
                  </>
                )}
              </Button>
            </div>
          </div>

          {purchaseSuccess && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800">Thanh toán thành công! Tokens đã được cộng vào tài khoản của bạn.</p>
            </div>
          )}
        </div>
      )}

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-sm">Tokens không giới hạn</h4>
            <p className="text-xs text-muted-foreground">Sử dụng cho tất cả Virtual Labs</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h4 className="font-medium text-sm">Thanh toán an toàn</h4>
            <p className="text-xs text-muted-foreground">Bảo mật 100%</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h4 className="font-medium text-sm">Hỗ trợ 24/7</h4>
            <p className="text-xs text-muted-foreground">Luôn sẵn sàng giúp đỡ</p>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <History className="w-5 h-5" />
          Lịch sử thanh toán
        </h2>
        {loadingPayments ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        ) : paymentsData?.items.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Chưa có lịch sử thanh toán</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium">Gói</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Tokens</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Số tiền</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Trạng thái</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Ngày</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paymentsData?.items.map((payment) => (
                  <tr key={payment.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{payment.packageName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Coins className="w-4 h-4 text-brand-500" />
                        <span>{payment.tokenAmount}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">${payment.amount}</td>
                    <td className="px-4 py-3">{getStatusBadge(payment.status)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-sm">
                      {format(new Date(payment.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
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
};

export default PaymentsPage;
