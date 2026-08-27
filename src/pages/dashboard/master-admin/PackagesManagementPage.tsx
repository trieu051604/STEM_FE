import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Star,
  CheckCircle,
  XCircle,
  Coins
} from 'lucide-react';
import { paymentsApi, PaymentPackage } from '@/services/schoolAdminApi';
import { api } from '@/services/api';
import { useToast } from '@/components/ToastProvider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface PackageFormData {
  name: string;
  description: string;
  price: number;
  tokenAmount: number;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
}

const defaultFormData: PackageFormData = {
  name: '',
  description: '',
  price: 0,
  tokenAmount: 0,
  isActive: true,
  isFeatured: false,
  sortOrder: 1,
};

export const PackagesManagementPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PaymentPackage | null>(null);
  const [formData, setFormData] = useState<PackageFormData>(defaultFormData);
  const { showToast } = useToast();

  const queryClient = useQueryClient();

  const { data: packages, isLoading } = useQuery({
    queryKey: ['admin-payment-packages'],
    queryFn: () => paymentsApi.getAllPackagesForAdmin(false),
  });

  const handleOpenModal = (pkg?: PaymentPackage) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData({
        name: pkg.name,
        description: pkg.description || '',
        price: pkg.price,
        tokenAmount: pkg.tokenAmount,
        isActive: pkg.isActive,
        isFeatured: pkg.isFeatured,
        sortOrder: pkg.sortOrder ?? pkg.displayOrder ?? 0,
      });
    } else {
      setEditingPackage(null);
      setFormData(defaultFormData);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPackage(null);
    setFormData(defaultFormData);
  };

  const createMutation = useMutation({
    mutationFn: async (data: PackageFormData) => {
      const response = await api.post('/payments/admin/packages', {
        name: data.name,
        description: data.description,
        price: data.price,
        tokenAmount: data.tokenAmount,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
        sortOrder: data.sortOrder
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payment-packages'] });
      handleCloseModal();
      showToast('Tạo gói thành công!');
    },
    onError: () => {
      showToast('Lỗi khi tạo gói', 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: PackageFormData }) => {
      const response = await api.put(`/payments/admin/packages/${id}`, {
        name: data.name,
        description: data.description,
        price: data.price,
        tokenAmount: data.tokenAmount,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
        sortOrder: data.sortOrder
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payment-packages'] });
      handleCloseModal();
      showToast('Cập nhật gói thành công!');
    },
    onError: () => {
      showToast('Lỗi khi cập nhật gói', 'error');
    }
  });

  const handleSubmit = () => {
    if (editingPackage) {
      updateMutation.mutate({ id: editingPackage.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/payments/admin/packages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payment-packages'] });
      showToast('Xóa gói thành công!');
    },
    onError: () => {
      showToast('Lỗi khi xóa gói', 'error');
    }
  });

  const handleDelete = (pkg: PaymentPackage) => {
    deleteMutation.mutate(pkg.id);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Gói Token</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Quản lý các gói token AI bán cho School Administrators
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm gói
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tổng gói</p>
              <p className="font-bold text-xl">{packages?.length ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Đang hoạt động</p>
              <p className="font-bold text-xl">{packages?.filter(p => p.isActive).length ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Phổ biến</p>
              <p className="font-bold text-xl">{packages?.filter(p => p.isFeatured).length ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Coins className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gói có giá thấp nhất</p>
              <p className="font-bold text-xl">
                {packages && packages.length > 0 
                  ? formatCurrency(Math.min(...packages.map(p => p.price)))
                  : '0 đ'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Packages Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gói</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Nổi bật</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages?.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{pkg.name}</p>
                      <p className="text-xs text-muted-foreground">{pkg.description}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(pkg.price)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Coins className="w-4 h-4 text-brand-500" />
                      <span>{pkg.tokenAmount.toLocaleString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {pkg.isActive ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                        <CheckCircle className="w-3 h-3" />
                        Hoạt động
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                        <XCircle className="w-3 h-3" />
                        Tắt
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {pkg.isFeatured && (
                      <Star className="w-5 h-5 text-amber-500" />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenModal(pkg)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(pkg)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Package Form Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? 'Chỉnh sửa gói' : 'Tạo gói mới'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Tên gói</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: 3 Tháng, 6 Tháng, 1 Năm"
              />
            </div>

            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả ngắn về gói này"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Giá (VND)</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label>Số tokens</Label>
                <Input
                  type="number"
                  value={formData.tokenAmount}
                  onChange={(e) => setFormData({ ...formData, tokenAmount: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Thứ tự hiển thị</Label>
                <Input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Đang hoạt động</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Nổi bật (phổ biến)</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>
              Hủy
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {editingPackage ? 'Lưu thay đổi' : 'Tạo gói'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PackagesManagementPage;
