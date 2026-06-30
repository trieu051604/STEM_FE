import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  Check,
  X,
  Eye,
  Building2,
  Mail,
  MapPin,
  User,
  Calendar,
  AlertTriangle,
  ExternalLink,
  Filter,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Loader2,
  FileText,
  RefreshCw,
  Info,
  Users,
  Phone,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  schoolsApi,
  schoolRequestsApi,
  School,
  SchoolRequest
} from '@/services/dashboardApi';

// Custom Toast Notification Type
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface SchoolsPageProps {
  defaultTab?: 'list' | 'requests';
}

// Helper functions for checking school status (handles both string and numeric enums)
const isStatusApproved = (status: any) => {
  if (status === undefined || status === null) return false;
  if (typeof status === 'number') return status === 1;
  const str = String(status).toLowerCase();
  return str === 'approved' || str === '1';
};

const isStatusPending = (status: any) => {
  if (status === undefined || status === null) return false;
  if (typeof status === 'number') return status === 0;
  const str = String(status).toLowerCase();
  return str === 'pending' || str === '0';
};

const isStatusRejected = (status: any) => {
  if (status === undefined || status === null) return false;
  if (typeof status === 'number') return status === 2;
  const str = String(status).toLowerCase();
  return str === 'rejected' || str === '2' || str === 'locked';
};

export function SchoolsPage({ defaultTab = 'list' }: SchoolsPageProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'requests'>(defaultTab);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);
  const [schools, setSchools] = useState<School[]>([]);
  const [pendingRequests, setPendingRequests] = useState<SchoolRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal states
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<SchoolRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isConfirmLockOpen, setIsConfirmLockOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState<Partial<School>>({
    name: '',
    address: '',
    representativeName: '',
    representativeEmail: '',
  });

  // Action loading state
  const [actionLoading, setActionLoading] = useState(false);

  // Toast notifications state
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [schoolsData, pendingData] = await Promise.all([
        schoolsApi.getAll(),
        schoolRequestsApi.getPending(),
      ]);
      setSchools(schoolsData || []);
      setPendingRequests(pendingData || []);
    } catch (err: any) {
      console.error('Error fetching school data:', err);
      setError('Không thể tải dữ liệu từ máy chủ. Vui lòng kiểm tra kết nối mạng hoặc thử lại.');
      showToast('Lỗi tải dữ liệu từ backend.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Handlers ---

  const handleApprove = async (request: SchoolRequest) => {
    setActionLoading(true);
    try {
      await schoolRequestsApi.approve(request.id);
      setPendingRequests((prev) => prev.filter((r) => r.id !== request.id));
      showToast(`Đã phê duyệt trường "${request.name}" thành công!`, 'success');
      setIsDetailOpen(false);
      
      const schoolsData = await schoolsApi.getAll();
      setSchools(schoolsData || []);
    } catch (err: any) {
      console.error('Error approving school:', err);
      showToast('Lỗi phê duyệt trường học. Vui lòng thử lại.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (request: SchoolRequest) => {
    setActionLoading(true);
    try {
      await schoolRequestsApi.reject(request.id);
      setPendingRequests((prev) => prev.filter((r) => r.id !== request.id));
      showToast(`Đã từ chối yêu cầu của trường "${request.name}".`, 'warning');
      setIsDetailOpen(false);
      
      const schoolsData = await schoolsApi.getAll();
      setSchools(schoolsData || []);
    } catch (err: any) {
      console.error('Error rejecting school:', err);
      showToast('Lỗi từ chối yêu cầu. Vui lòng thử lại.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEdit = (school: School) => {
    setSelectedSchool(school);
    setFormData({
      name: school.name,
      address: school.address,
      representativeName: school.representativeName || '',
      representativeEmail: school.representativeEmail || '',
      status: school.status,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;
    setActionLoading(true);
    try {
      await schoolsApi.update(selectedSchool.id, formData);
      setSchools((prev) =>
        prev.map((s) => (s.id === selectedSchool.id ? { ...s, ...formData } : s))
      );
      showToast(`Đã cập nhật thông tin trường "${formData.name}" thành công!`, 'success');
      setIsEditOpen(false);
    } catch (err: any) {
      console.error('Error updating school:', err);
      showToast('Lỗi cập nhật thông tin. Vui lòng thử lại.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenLock = (school: School) => {
    setSelectedSchool(school);
    setIsConfirmLockOpen(true);
  };

  const handleToggleLock = async () => {
    if (!selectedSchool) return;
    setActionLoading(true);
    const isCurrentlyLocked = isStatusRejected(selectedSchool.status);
    const nextStatus = typeof selectedSchool.status === 'number'
      ? (isCurrentlyLocked ? 1 : 2)
      : (isCurrentlyLocked ? 'Approved' : 'Rejected');

    try {
      await schoolsApi.update(selectedSchool.id, { status: nextStatus });
      setSchools((prev) =>
        prev.map((s) =>
          s.id === selectedSchool.id ? { ...s, status: nextStatus } : s
        )
      );
      showToast(
        isCurrentlyLocked
          ? `Đã mở khóa trường "${selectedSchool.name}"`
          : `Đã khóa trường "${selectedSchool.name}". Tất cả tài khoản thuộc trường này tạm thời bị vô hiệu hóa.`,
        isCurrentlyLocked ? 'success' : 'warning'
      );
      setIsConfirmLockOpen(false);
    } catch (err: any) {
      console.error('Error toggling school lock status:', err);
      showToast('Lỗi thay đổi trạng thái khóa/mở khóa. Vui lòng thử lại.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDelete = (school: School) => {
    setSelectedSchool(school);
    setIsConfirmDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedSchool) return;
    setActionLoading(true);
    try {
      await schoolsApi.delete(selectedSchool.id);
      setSchools((prev) => prev.filter((s) => s.id !== selectedSchool.id));
      showToast(`Đã xóa vĩnh viễn trường "${selectedSchool.name}" khỏi hệ thống.`, 'success');
      setIsConfirmDeleteOpen(false);
    } catch (err: any) {
      console.error('Error deleting school:', err);
      showToast('Lỗi xóa trường học. Vui lòng thử lại.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Filter and Search Logic ---
  const filteredSchools = schools.filter((school) => {
    const matchesSearch =
      school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (school.representativeEmail &&
        school.representativeEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (school.representativeName &&
        school.representativeName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'approved' && isStatusApproved(school.status)) ||
      (statusFilter === 'locked' && isStatusRejected(school.status)) ||
      (statusFilter === 'rejected' && isStatusRejected(school.status)) ||
      (statusFilter === 'pending' && isStatusPending(school.status));

    return matchesSearch && matchesStatus;
  });

  const filteredRequests = pendingRequests.filter((req) =>
    req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.representativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.representativeEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Statistics
  const totalSchoolsCount = schools.length;
  const activeSchoolsCount = schools.filter((s) => isStatusApproved(s.status)).length;
  const lockedSchoolsCount = schools.filter((s) => isStatusRejected(s.status)).length;
  const pendingRequestsCount = pendingRequests.length + schools.filter((s) => isStatusPending(s.status)).length;

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen p-6 rounded-3xl border border-slate-900 shadow-2xl space-y-6 relative pb-20 font-sans selection:bg-blue-500/30">
      {/* Toast Notification Container */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-2 w-96 max-w-full">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className={`p-4 rounded-xl shadow-lg border flex items-start gap-3 backdrop-blur-md ${
                toast.type === 'success'
                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                  : toast.type === 'error'
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  : toast.type === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
              }`}
            >
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0 text-blue-400" />}
              {toast.type === 'error' && <XCircle className="w-5 h-5 shrink-0 text-rose-400" />}
              {toast.type === 'warning' && <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400" />}
              {toast.type === 'info' && <Info className="w-5 h-5 shrink-0 text-slate-400" />}
              <div className="flex-1 text-sm font-medium">{toast.message}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-headline">
            Quản lý Trường học
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Phê duyệt, quản lý hoạt động, cập nhật và khóa/mở khóa các cơ sở trường học trên hệ thống.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-150"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center justify-between text-rose-400"
        >
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button
            onClick={loadData}
            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-all shrink-0"
          >
            Tải lại dữ liệu
          </button>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl flex items-center gap-4 shadow-lg"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Tổng trường học</p>
            <h3 className="text-3xl font-extrabold mt-0.5 text-white">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-blue-400" /> : totalSchoolsCount}
            </h3>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl flex items-center gap-4 shadow-lg"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-450 border border-amber-500/25">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Chờ phê duyệt</p>
            <h3 className="text-3xl font-extrabold mt-0.5 text-amber-450 text-amber-400">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-amber-450" /> : pendingRequestsCount}
            </h3>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl flex items-center gap-4 shadow-lg"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-450 border border-blue-500/30">
            <CheckCircle2 className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Đang hoạt động</p>
            <h3 className="text-3xl font-extrabold mt-0.5 text-blue-400">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-blue-400" /> : activeSchoolsCount}
            </h3>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl flex items-center gap-4 shadow-lg"
        >
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-450 border border-rose-500/25">
            <Lock className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Đã khóa</p>
            <h3 className="text-3xl font-extrabold mt-0.5 text-rose-400">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-rose-400" /> : lockedSchoolsCount}
            </h3>
          </div>
        </motion.div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
          {/* Custom Tab System */}
          <div className="flex bg-slate-950 p-1 rounded-xl w-fit border border-slate-800/80">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'list'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Trường học ({schools.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all relative ${
                activeTab === 'requests'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Yêu cầu phê duyệt
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 text-[10px] font-extrabold bg-amber-500 text-white rounded-full border border-slate-900">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl justify-end">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-550 text-slate-450" />
              <input
                type="text"
                placeholder={
                  activeTab === 'list'
                    ? 'Tìm trường học, người đại diện, email...'
                    : 'Tìm kiếm yêu cầu đăng ký...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-800 rounded-xl bg-slate-950 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all duration-150"
              />
            </div>

            {/* Filter (Only in schools list tab) */}
            {activeTab === 'list' && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-950 text-sm border border-slate-800 text-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all duration-150"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="approved">Đang hoạt động</option>
                  <option value="locked">Đã khóa</option>
                  <option value="rejected">Bị từ chối</option>
                  <option value="pending">Chờ duyệt</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Content Table / List */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-sm text-slate-400">Đang tải dữ liệu từ backend...</p>
          </div>
        ) : activeTab === 'list' ? (
          // School List Tab
          <div className="overflow-x-auto">
            {filteredSchools.length === 0 ? (
              <div className="py-20 text-center text-slate-500 border border-dashed border-slate-850 rounded-2xl">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20 text-blue-400" />
                <p className="text-sm">Không tìm thấy trường học nào phù hợp.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-4">Tên trường</th>
                    <th className="py-4 px-4">Đại diện</th>
                    <th className="py-4 px-4">Địa chỉ</th>
                    <th className="py-4 px-4">Trạng thái</th>
                    <th className="py-4 px-4">Ngày tham gia</th>
                    <th className="py-4 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-sm">
                  {filteredSchools.map((school) => {
                    const isLocked = isStatusRejected(school.status);
                    const isPending = isStatusPending(school.status);
                    return (
                      <tr key={school.id} className="hover:bg-blue-500/[0.02] transition-colors">
                        <td className="py-4 px-4 font-semibold max-w-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold border border-blue-500/25 shrink-0">
                              {school.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="truncate">
                              <p className="font-semibold text-white truncate">{school.name}</p>
                              <p className="text-xs text-slate-500 mt-0.5">Mã ID: #{school.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-slate-200">{school.representativeName || 'N/A'}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{school.representativeEmail || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 max-w-[200px] truncate text-slate-300" title={school.address}>
                          {school.address}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              isLocked
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : isPending
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isLocked ? 'bg-rose-500' : isPending ? 'bg-amber-500' : 'bg-blue-500'}`} />
                            {isLocked ? 'Đã khóa' : isPending ? 'Chờ duyệt' : 'Hoạt động'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-400">
                          {school.createdAt ? new Date(school.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setSelectedSchool(school);
                                setIsDetailOpen(true);
                              }}
                              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4.5 h-4.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(school)}
                              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-450 transition-colors"
                              title="Chỉnh sửa thông tin"
                            >
                              <Edit2 className="w-4.5 h-4.5 text-slate-400 hover:text-blue-400" />
                            </button>
                            <button
                              onClick={() => handleOpenLock(school)}
                              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-amber-450 transition-colors"
                              title={isLocked ? 'Mở khóa' : 'Khóa trường'}
                            >
                              {isLocked ? (
                                <Unlock className="w-4.5 h-4.5 text-amber-400" />
                              ) : (
                                <Lock className="w-4.5 h-4.5 hover:text-amber-450" />
                              )}
                            </button>
                            <button
                              onClick={() => handleOpenDelete(school)}
                              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-450 transition-colors"
                              title="Xóa trường"
                            >
                              <Trash2 className="w-4.5 h-4.5 hover:text-rose-450" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          // School Requests Tab
          <div className="overflow-x-auto">
            {filteredRequests.length === 0 ? (
              <div className="py-20 text-center text-slate-550 border border-dashed border-slate-850 rounded-2xl">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-20 text-blue-400" />
                <p className="text-sm">Không có yêu cầu phê duyệt nào cần xử lý.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/85 text-slate-450 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-4">Tên trường đề xuất</th>
                    <th className="py-4 px-4">Đại diện pháp lý</th>
                    <th className="py-4 px-4">Địa chỉ đăng ký</th>
                    <th className="py-4 px-4">Tài khoản Admin tạo kèm</th>
                    <th className="py-4 px-4">Ngày gửi</th>
                    <th className="py-4 px-4 text-right">Phê duyệt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-sm">
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-blue-500/[0.02] transition-colors">
                      <td className="py-4.5 px-4 font-semibold">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 font-bold border border-amber-500/20 shrink-0">
                            {request.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{request.name}</p>
                            {request.proofOfActivity && (
                              <a
                                href={request.proofOfActivity}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline mt-1 font-medium"
                              >
                                <FileText className="w-3 h-3" /> Tài liệu xác minh
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4.5 px-4">
                        <div>
                          <p className="font-medium text-slate-200">{request.representativeName}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{request.representativeEmail}</p>
                        </div>
                      </td>
                      <td className="py-4.5 px-4 max-w-[180px] truncate text-slate-300" title={request.address}>
                        {request.address}
                      </td>
                      <td className="py-4.5 px-4">
                        {request.adminUser ? (
                          <div>
                            <p className="font-medium text-slate-200">{request.adminUser.fullName}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{request.adminUser.email}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Chưa đăng ký</span>
                        )}
                      </td>
                      <td className="py-4.5 px-4 text-slate-450">
                        {request.createdAt ? new Date(request.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                      </td>
                      <td className="py-4.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setIsDetailOpen(true);
                            }}
                            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                            title="Xem chi tiết đơn đăng ký"
                          >
                            <Eye className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => handleApprove(request)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 transition-all duration-155"
                          >
                            <Check className="w-3.5 h-3.5" /> Duyệt
                          </button>
                          <button
                            onClick={() => handleReject(request)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/25 transition-all duration-155"
                          >
                            <X className="w-3.5 h-3.5" /> Từ chối
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* --- MODALS --- */}
      <AnimatePresence>
        {/* 1. View Detail Modal */}
        {isDetailOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-2xl overflow-hidden z-10 text-slate-200"
            >
              <h3 className="text-xl font-extrabold mb-4 text-white font-headline">Chi tiết thông tin trường học</h3>

              {activeTab === 'list' && selectedSchool && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 p-4 bg-slate-950/50 border border-slate-800 rounded-2xl">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-extrabold text-xl">
                      {selectedSchool.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-white">{selectedSchool.name}</h4>
                      <p className="text-xs text-slate-555 text-slate-450">Mã Trường: #{selectedSchool.id}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Địa chỉ</p>
                        <p className="font-semibold text-slate-200 mt-0.5">{selectedSchool.address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <User className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Người đại diện pháp lý</p>
                        <p className="font-semibold text-slate-200 mt-0.5">
                          {selectedSchool.representativeName || 'N/A'}
                          {selectedSchool.representativePosition && ` (${selectedSchool.representativePosition})`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <Mail className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Email liên hệ</p>
                        <p className="font-semibold text-slate-200 mt-0.5">{selectedSchool.representativeEmail || 'N/A'}</p>
                      </div>
                    </div>
                    {(selectedSchool.phone || selectedSchool.representativeEmail) && (
                      <div className="flex items-start gap-3 text-sm">
                        <Phone className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Số điện thoại</p>
                          <p className="font-semibold text-slate-200 mt-0.5">{selectedSchool.phone || 'N/A'}</p>
                        </div>
                      </div>
                    )}

                    {selectedSchool.studentScale && (
                      <div className="flex items-start gap-3 text-sm">
                        <Building2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Quy mô học sinh</p>
                          <p className="font-semibold text-slate-200 mt-0.5">{selectedSchool.studentScale}</p>
                        </div>
                      </div>
                    )}
                    {selectedSchool.website && (
                      <div className="flex items-start gap-3 text-sm">
                        <Globe className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Website / Fanpage</p>
                          <a 
                            href={selectedSchool.website.startsWith('http') ? selectedSchool.website : `https://${selectedSchool.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-blue-400 hover:underline mt-0.5 flex items-center gap-1"
                          >
                            {selectedSchool.website} <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}
                    {selectedSchool.notes && (
                      <div className="flex items-start gap-3 text-sm">
                        <FileText className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Ghi chú / Nhu cầu thêm</p>
                          <p className="text-slate-300 mt-0.5 text-xs italic bg-slate-950/30 p-2.5 rounded-lg border border-slate-800/60 leading-relaxed">{selectedSchool.notes}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Ngày đăng ký hệ thống</p>
                        <p className="font-semibold text-slate-200 mt-0.5">
                          {selectedSchool.createdAt ? new Date(selectedSchool.createdAt).toLocaleString('vi-VN') : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <ShieldAlert className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Trạng thái hoạt động</p>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1.5 ${
                            isStatusRejected(selectedSchool.status)
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                              : isStatusPending(selectedSchool.status)
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {isStatusRejected(selectedSchool.status) ? 'Đã khóa' : isStatusPending(selectedSchool.status) ? 'Chờ duyệt' : 'Đang hoạt động'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setIsDetailOpen(false);
                        handleOpenEdit(selectedSchool);
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-750 text-white transition-colors"
                    >
                      <Edit2 className="w-4 h-4" /> Chỉnh sửa
                    </button>
                    <button
                      onClick={() => setIsDetailOpen(false)}
                      className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'requests' && selectedRequest && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 p-4 bg-slate-950/50 border border-slate-800 rounded-2xl">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-450 font-extrabold text-xl">
                      {selectedRequest.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-white">{selectedRequest.name}</h4>
                      <p className="text-xs text-slate-500">Đơn ứng tuyển gửi từ trường học</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Địa chỉ</p>
                        <p className="font-semibold text-slate-200 mt-0.5">{selectedRequest.address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <User className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Người liên hệ đại diện</p>
                        <p className="font-semibold text-slate-200 mt-0.5">
                          {selectedRequest.representativeName}
                          {selectedRequest.representativePosition && ` (${selectedRequest.representativePosition})`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <Mail className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Email đại diện</p>
                        <p className="font-semibold text-slate-200 mt-0.5">{selectedRequest.representativeEmail}</p>
                      </div>
                    </div>
                    {(selectedRequest.phone || selectedRequest.adminUser?.phone) && (
                      <div className="flex items-start gap-3 text-sm">
                        <Phone className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Số điện thoại</p>
                          <p className="font-semibold text-slate-200 mt-0.5">{selectedRequest.phone || selectedRequest.adminUser?.phone || 'N/A'}</p>
                        </div>
                      </div>
                    )}

                    {selectedRequest.studentScale && (
                      <div className="flex items-start gap-3 text-sm">
                        <Building2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Quy mô học sinh</p>
                          <p className="font-semibold text-slate-200 mt-0.5">{selectedRequest.studentScale}</p>
                        </div>
                      </div>
                    )}
                    {selectedRequest.website && (
                      <div className="flex items-start gap-3 text-sm">
                        <Globe className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Website / Fanpage</p>
                          <a 
                            href={selectedRequest.website.startsWith('http') ? selectedRequest.website : `https://${selectedRequest.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-blue-400 hover:underline mt-0.5 flex items-center gap-1"
                          >
                            {selectedRequest.website} <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}
                    {selectedRequest.notes && (
                      <div className="flex items-start gap-3 text-sm">
                        <FileText className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Ghi chú / Nhu cầu thêm</p>
                          <p className="text-slate-300 mt-0.5 text-xs italic bg-slate-950/30 p-2.5 rounded-lg border border-slate-800/60 leading-relaxed">{selectedRequest.notes}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Ngày gửi yêu cầu</p>
                        <p className="font-semibold text-slate-200 mt-0.5">
                          {selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleString('vi-VN') : 'N/A'}
                        </p>
                      </div>
                    </div>
                    {selectedRequest.adminUser && (
                      <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-850">
                        <p className="text-xs font-bold text-white mb-2 uppercase tracking-wider">Tài khoản Quản trị trường:</p>
                        <div className="space-y-1.5 text-xs text-slate-300">
                          <p><strong>Họ tên:</strong> {selectedRequest.adminUser.fullName}</p>
                          <p><strong>Email đăng nhập:</strong> {selectedRequest.adminUser.email}</p>
                        </div>
                      </div>
                    )}
                    {selectedRequest.proofOfActivity && (
                      <div className="flex items-center gap-2 p-3 bg-slate-950/20 rounded-xl border border-slate-850">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <a
                          href={selectedRequest.proofOfActivity}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-blue-450 hover:underline font-semibold flex items-center gap-1 text-blue-400"
                        >
                          Tải xuống tài liệu minh chứng hoạt động <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                    <button
                      onClick={() => handleApprove(selectedRequest)}
                      className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Đang duyệt...' : 'Duyệt hồ sơ'}
                    </button>
                    <button
                      onClick={() => handleReject(selectedRequest)}
                      className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-rose-650 hover:bg-rose-750 text-white bg-rose-600"
                      disabled={actionLoading}
                    >
                      Từ chối đơn
                    </button>
                    <button
                      onClick={() => setIsDetailOpen(false)}
                      className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* 2. Edit Modal */}
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-2xl z-10 text-slate-200"
            >
              <h3 className="text-xl font-extrabold mb-4 text-white font-headline">Cập nhật Thông tin Trường học</h3>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Tên trường học *</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-slate-800 rounded-xl p-2.5 bg-slate-950 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Địa chỉ *</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-slate-800 rounded-xl p-2.5 bg-slate-950 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Người đại diện</label>
                    <input
                      type="text"
                      className="w-full border border-slate-800 rounded-xl p-2.5 bg-slate-950 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                      value={formData.representativeName || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, representativeName: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email đại diện</label>
                    <input
                      type="email"
                      className="w-full border border-slate-800 rounded-xl p-2.5 bg-slate-950 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                      value={formData.representativeEmail || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, representativeEmail: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Đang lưu...' : 'Cập nhật'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* 3. Confirm Lock/Unlock Modal */}
        {isConfirmLockOpen && selectedSchool && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfirmLockOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-2xl z-10 text-slate-200"
            >
              <div className="flex items-center gap-3 mb-3 text-amber-500">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="text-lg font-extrabold text-white font-headline">
                  {isStatusRejected(selectedSchool.status) ? 'Mở khóa trường học?' : 'Khóa trường học?'}
                </h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mt-2">
                {isStatusRejected(selectedSchool.status) ? (
                  `Bạn chuẩn bị mở khóa hoạt động cho trường "${selectedSchool.name}". Tất cả quản trị viên, giáo viên và học sinh thuộc trường này sẽ có thể đăng nhập trở lại.`
                ) : (
                  `Bạn đang thực hiện khóa trường "${selectedSchool.name}". Toàn bộ tài khoản người dùng thuộc trường này (bao gồm Quản trị trường, Giáo viên và Học sinh) sẽ BỊ VÔ HIỆU HÓA đăng nhập ngay lập tức.`
                )}
              </p>
              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setIsConfirmLockOpen(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleToggleLock}
                  className={`px-5 py-2.5 text-sm font-semibold rounded-xl text-white transition-colors ${
                    isStatusRejected(selectedSchool.status)
                      ? 'bg-amber-555 hover:bg-amber-600 bg-amber-500'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Đang xử lý...' : isStatusRejected(selectedSchool.status) ? 'Xác nhận Mở' : 'Xác nhận Khóa'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 4. Confirm Delete Modal */}
        {isConfirmDeleteOpen && selectedSchool && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfirmDeleteOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-2xl z-10 text-slate-200"
            >
              <div className="flex items-center gap-3 mb-3 text-rose-500">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="text-lg font-extrabold text-white font-headline">Xóa vĩnh viễn trường học?</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mt-2">
                Hành động này <strong className="text-rose-500">KHÔNG THỂ HOÀN TÁC</strong>. Bạn đang chuẩn bị xóa trường{' '}
                <strong>"{selectedSchool.name}"</strong> khỏi hệ thống. Tất cả dữ liệu lớp học, bài tập, và điểm số liên kết với trường này cũng sẽ bị xóa vĩnh viễn.
              </p>
              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setIsConfirmDeleteOpen(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleDelete}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Đang xóa...' : 'Xác nhận Xóa vĩnh viễn'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SchoolsPage;
