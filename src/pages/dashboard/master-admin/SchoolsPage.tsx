import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Edit2,
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
  Globe,
  File,
  Download,
  Image as ImageIcon,
  ZoomIn
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  schoolsApi,
  schoolRequestsApi,
  usersApi,
  School,
  SchoolRequest
} from '@/services/dashboardApi';
import { Pagination } from '@/components/ui/pagination';
import { useAuthStore } from '@/stores';
import FilePreviewModal from '@/components/ui/FilePreviewModal';

const ITEMS_PER_PAGE = 10;

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
  // Get current user role
  const userRole = useAuthStore((state) => state.user?.role);
  const isMasterAdmin = userRole === 'master_admin';
  
  // Determine default view based on role:
  // - master_admin: sees all schools + requests
  // - school_admin: sees only their school's details
  const defaultView = defaultTab === 'requests' ? 'requests' : 'schools';
  const [activeView, setActiveView] = useState<'schools' | 'requests'>(
    isMasterAdmin ? defaultView : 'schools'
  );

  useEffect(() => {
    setActiveView(isMasterAdmin ? defaultView : 'schools');
  }, [defaultTab, isMasterAdmin]);
  
  const [schools, setSchools] = useState<School[]>([]);
  const [totalSchools, setTotalSchools] = useState(0);
  const [pendingRequests, setPendingRequests] = useState<SchoolRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);

  // Modal states
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<SchoolRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isConfirmLockOpen, setIsConfirmLockOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionReasonError, setRejectionReasonError] = useState('');

  // File Preview Modal state
  const [isFilePreviewOpen, setIsFilePreviewOpen] = useState(false);
  const [previewFileUrl, setPreviewFileUrl] = useState('');
  const [previewFileName, setPreviewFileName] = useState('');

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
        schoolsApi.getAll({ pageNumber: currentPage, pageSize: pageSize, search: searchQuery }),
        schoolRequestsApi.getPending(),
      ]);
      // Handle both array and object response formats
      const schoolsArray = Array.isArray(schoolsData) 
        ? schoolsData 
        : schoolsData?.items || [];
      setSchools(schoolsArray);
      setTotalSchools(schoolsData?.total || schoolsArray.length || 0);
      setPendingRequests(pendingData || []);
    } catch (err: any) {
      console.error('Error fetching school data:', err);
      setError('Không thể tải dữ liệu từ máy chủ. Vui lòng kiểm tra kết nối mạng hoặc thử lại.');
      showToast('Lỗi tải dữ liệu từ backend.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Reload data when pagination or search changes
  useEffect(() => {
    loadData();
  }, [currentPage, pageSize]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // --- Handlers ---

  const handleApprove = async (request: SchoolRequest) => {
    setActionLoading(true);
    try {
      await schoolRequestsApi.approve(request.id);
      showToast(`Đã phê duyệt trường "${request.name}" thành công!`, 'success');
      setIsDetailOpen(false);

      // Reload all data to update stats and lists
      await loadData();
    } catch (err: any) {
      console.error('Error approving school:', err);
      showToast('Lỗi phê duyệt trường học. Vui lòng thử lại.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    if (!rejectionReason.trim()) {
      setRejectionReasonError('Vui lòng nhập lý do từ chối.');
      return;
    }

    setActionLoading(true);
    try {
      await schoolRequestsApi.reject(selectedRequest.id, rejectionReason.trim());
      showToast(`Đã từ chối yêu cầu đăng ký của trường "${selectedRequest.name}".`, 'warning');
      setIsRejectModalOpen(false);
      setRejectionReason('');
      setIsDetailOpen(false);

      // Reload all data to update stats and lists
      await loadData();
    } catch (err: any) {
      console.error('Error rejecting school:', err);
      showToast('Lỗi từ chối yêu cầu. Vui lòng thử lại.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenRejectModal = (request: SchoolRequest) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setRejectionReasonError('');
    setIsRejectModalOpen(true);
  };

  // Handle file preview
  const handleOpenFilePreview = (fileUrl: string, fileName: string) => {
    setPreviewFileUrl(fileUrl);
    // Ensure fileName has extension, otherwise derive from URL
    const fileUrlObj = new URL(fileUrl);
    const urlPath = fileUrlObj.pathname;
    const urlFileName = urlPath.split('/').pop() || 'document';
    setPreviewFileName(fileName && !fileName.includes('.') ? `${fileName}.pdf` : fileName || urlFileName);
    setIsFilePreviewOpen(true);
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

    try {
      const result = await schoolsApi.toggleLock(selectedSchool.id);
      const newStatus = result.status as 1 | 2;

      setSchools((prev) =>
        prev.map((s) =>
          s.id === selectedSchool.id ? { ...s, status: newStatus } : s
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
  const totalSchoolsCount = totalSchools || schools.length;
  const activeSchoolsCount = schools.filter((s) => isStatusApproved(s.status)).length;
  const lockedSchoolsCount = schools.filter((s) => isStatusRejected(s.status)).length;
  const pendingRequestsCount = pendingRequests.length;

  return (
    <div className={`min-h-screen space-y-6 relative pb-20 font-sans`}>
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border min-w-[300px] ${
                toast.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : toast.type === 'error'
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  : toast.type === 'warning'
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
              }`}
            >
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0 text-green-600 dark:text-green-400" />}
              {toast.type === 'error' && <XCircle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400" />}
              {toast.type === 'warning' && <ShieldAlert className="w-5 h-5 shrink-0 text-yellow-600 dark:text-yellow-400" />}
              {toast.type === 'info' && <Info className="w-5 h-5 shrink-0 text-blue-600 dark:text-blue-400" />}
              <div className="flex-1 text-sm font-medium">{toast.message}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Trường học</h1>
          <p className="text-muted-foreground">
            Phê duyệt, quản lý hoạt động, cập nhật và khóa/mở khóa các cơ sở trường học trên hệ thống.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-colors"
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
          className="bg-destructive/10 border border-border rounded-2xl p-4 flex items-center justify-between text-destructive"
        >
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button
            onClick={loadData}
            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-destructive hover:bg-destructive/90 text-white transition-all shrink-0"
          >
            Tải lại dữ liệu
          </button>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-xl border bg-card p-4 flex items-center gap-4 shadow-sm"
        >
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tổng trường học</p>
            <h3 className="text-3xl font-extrabold mt-0.5 text-foreground">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : totalSchoolsCount}
            </h3>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-xl border bg-card p-4 flex items-center gap-4 shadow-sm"
        >
          <div className="w-12 h-12 rounded-lg  flex items-center justify-center text-yellow-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Chờ phê duyệt</p>
            <h3 className="text-3xl font-extrabold mt-0.5 text-yellow-600">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-yellow-600" /> : pendingRequestsCount}
            </h3>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-xl border bg-card p-4 flex items-center gap-4 shadow-sm"
        >
          <div className="w-12 h-12 rounded-lg bg flex items-center justify-center text-green-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Đang hoạt động</p>
            <h3 className="text-3xl font-extrabold mt-0.5 text-green-600">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-green-600" /> : activeSchoolsCount}
            </h3>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-xl border bg-card p-4 flex items-center gap-4 shadow-sm"
        >
          <div className="w-12 h-12 rounded-lg flex items-center justify-center text-red-600">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Đã khóa</p>
            <h3 className="text-3xl font-extrabold mt-0.5 text-red-600">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-red-600" /> : lockedSchoolsCount}
            </h3>
          </div>
        </motion.div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="rounded-xl border bg-card p-6 space-y-6 shadow-sm">
        {/* Tab Navigation - Role-based */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 border-b border-border pb-5">
          {/* Tab System - Only show tabs for Master Admin */}
          <div className="flex p-1 rounded-xl w-fit border bg-muted/50 border-border">
            {isMasterAdmin && (
              <>
                <button
                  onClick={() => setActiveView('schools')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    activeView === 'schools'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Trường học ({schools.length})
                </button>
                <button
                  onClick={() => setActiveView('requests')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all relative ${
                    activeView === 'requests'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Yêu cầu phê duyệt
                  {pendingRequests.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 text-[10px] font-extrabold rounded-full border bg-yellow-500 text-white border-yellow-600">
                      {pendingRequests.length}
                    </span>
                  )}
                </button>
              </>
            )}
            {/* School Admin: Show school info badge */}
            {!isMasterAdmin && (
              <div className="px-5 py-2.5 bg-primary/10 text-primary rounded-lg text-sm font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Quản lý Trường học của bạn
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl justify-end">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={
                  activeView === 'schools'
                    ? 'Tìm trường học, người đại diện, email...'
                    : 'Tìm kiếm yêu cầu đăng ký...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm bg-background border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-150"
              />
            </div>

            {/* Filter (Only in schools list tab) */}
            {activeView === 'schools' && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-150 text-foreground"
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
            <Loader2 className="w-10 h-10 text-brand animate-spin" />
            <p className="text-sm text-muted-foreground">Đang tải dữ liệu từ backend...</p>
          </div>
        ) : activeView === 'schools' ? (
          <>
          {/* School List Tab */}
          <div className="overflow-x-auto rounded-xl border border-border">
          {filteredSchools.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground border border-dashed border-border rounded-2xl">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20 text-brand" />
                <p className="text-sm">Không tìm thấy trường học nào phù hợp.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/50">
                    <th className="px-4 py-3">Tên trường</th>
                    <th className="px-4 py-3">Đại diện</th>
                    <th className="px-4 py-3">Địa chỉ</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Ngày tham gia</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredSchools.map((school) => {
                    const isLocked = isStatusRejected(school.status);
                    const isPending = isStatusPending(school.status);
                    return (
                      <tr key={school.id} className="transition-colors hover:bg-accent">
                        <td className="px-4 py-3 font-semibold max-w-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold border border-border shrink-0">
                              {school.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="truncate">
                              <p className="font-semibold text-foreground truncate">{school.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Mã ID: #{school.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-foreground">{school.representativeName || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{school.representativeEmail || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-[200px] truncate text-muted-foreground" title={school.address}>
                          {school.address}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              isLocked
                                ? 'bg-destructive/10 text-destructive border border-border'
                                : isPending
                                ? 'bg-accent/10 text-accent border border-border'
                                : 'bg-success/10 text-success border border-border'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isLocked ? 'bg-destructive' : isPending ? 'bg-accent' : 'bg-success'}`} />
                            {isLocked ? 'Đã khóa' : isPending ? 'Chờ duyệt' : 'Hoạt động'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {school.createdAt ? new Date(school.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSchool(school);
                                setIsDetailOpen(true);
                              }}
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit(school);
                              }}
                              title="Chỉnh sửa thông tin"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenLock(school);
                              }}
                              title={isLocked ? 'Mở khóa' : 'Khóa trường'}
                            >
                              {isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            </div>

            {/* Pagination */}
            {filteredSchools.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(totalSchools / pageSize) || 1}
                totalItems={totalSchools}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size: number) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
              />
            )}
          </>
        ) : (
          // School Requests Tab
          <div className="overflow-x-auto rounded-xl border border-border">
            {filteredRequests.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground border border-dashed border-border rounded-2xl">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-20 text-brand" />
                <p className="text-sm">Không có yêu cầu phê duyệt nào cần xử lý.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/50">
                    <th className="px-4 py-3">Tên trường đề xuất</th>
                    <th className="px-4 py-3">Đại diện pháp lý</th>
                    <th className="px-4 py-3">Địa chỉ đăng ký</th>
                    <th className="px-4 py-3">Tài khoản Admin tạo kèm</th>
                    <th className="px-4 py-3">Ngày gửi</th>
                    <th className="px-4 py-3 text-right">Phê duyệt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRequests.map((request) => (
                      <tr key={request.id} className="transition-colors hover:bg-accent">
                      <td className="px-4 py-3 font-semibold">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent font-bold border border-border shrink-0">
                            {request.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{request.name}</p>
                            {request.attachmentUrl && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenFilePreview(request.attachmentUrl!, request.originalAttachmentFileName || request.attachmentFileName || 'document');
                                }}
                                className="inline-flex items-center gap-1 text-xs text-brand hover:underline mt-1 font-medium"
                              >
                                <File className="w-3 h-3" /> Xem tài liệu đính kèm
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{request.representativeName}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{request.representativeEmail}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[180px] truncate text-muted-foreground" title={request.address}>
                        {request.address}
                      </td>
                      <td className="px-4 py-3">
                        {request.adminUser ? (
                          <div>
                            <p className="font-medium text-foreground">{request.adminUser.fullName}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{request.adminUser.email}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Chưa đăng ký</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {request.createdAt ? new Date(request.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRequest(request);
                              setIsDetailOpen(true);
                            }}
                            title="Xem chi tiết đơn đăng ký"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            className="gap-1.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(request);
                            }}
                          >
                            <Check className="w-3.5 h-3.5" /> Duyệt
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-destructive border-destructive/20 hover:bg-destructive hover:text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenRejectModal(request);
                            }}
                          >
                            <X className="w-3.5 h-3.5" /> Từ chối
                          </Button>
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
              className="absolute inset-0 bg-black/50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-xl border shadow-xl bg-card border-border text-foreground"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="text-lg font-semibold">Chi tiết thông tin trường học</h2>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-6 py-4 max-h-[80vh] overflow-y-auto">
                {activeView === 'schools' && selectedSchool && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-3 p-4 bg-muted/50 border border-border rounded-xl">
                      <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center text-primary font-extrabold text-xl border border-border">
                        {selectedSchool.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-foreground">{selectedSchool.name}</h4>
                        <p className="text-xs text-muted-foreground">Mã Trường: #{selectedSchool.id}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3 text-sm">
                        <MapPin className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">Địa chỉ</p>
                          <p className="font-semibold text-foreground mt-0.5">{selectedSchool.address}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 text-sm">
                        <User className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">Người đại diện pháp lý</p>
                          <p className="font-semibold text-foreground mt-0.5">
                            {selectedSchool.representativeName || 'N/A'}
                            {selectedSchool.representativePosition && ` (${selectedSchool.representativePosition})`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 text-sm">
                        <Mail className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">Email liên hệ</p>
                          <p className="font-semibold text-foreground mt-0.5">{selectedSchool.representativeEmail || 'N/A'}</p>
                        </div>
                      </div>
                      {(selectedSchool.phone || selectedSchool.representativeEmail) && (
                        <div className="flex items-start gap-3 text-sm">
                          <Phone className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">Số điện thoại</p>
                            <p className="font-semibold text-foreground mt-0.5">{selectedSchool.phone || 'N/A'}</p>
                          </div>
                        </div>
                      )}

                      {selectedSchool.studentScale && (
                        <div className="flex items-start gap-3 text-sm">
                          <Building2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">Quy mô học sinh</p>
                            <p className="font-semibold text-foreground mt-0.5">{selectedSchool.studentScale}</p>
                          </div>
                        </div>
                      )}
                      {selectedSchool.website && (
                        <div className="flex items-start gap-3 text-sm">
                          <Globe className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">Website / Fanpage</p>
                            <a 
                              href={selectedSchool.website.startsWith('http') ? selectedSchool.website : `https://${selectedSchool.website}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-brand hover:underline mt-0.5 flex items-center gap-1"
                            >
                              {selectedSchool.website} <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      )}
                      {selectedSchool.notes && (
                        <div className="flex items-start gap-3 text-sm">
                          <FileText className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">Ghi chú / Nhu cầu thêm</p>
                            <p className="text-muted-foreground mt-0.5 text-xs italic bg-muted p-2.5 rounded-lg border border-border leading-relaxed">{selectedSchool.notes}</p>
                          </div>
                        </div>
                      )}

                      {/* Attachment Document - Certificate */}
                      {selectedSchool.attachmentUrl && (
                        <div className="flex items-start gap-3 text-sm">
                          <File className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground font-medium">Giấy chứng nhận / Tài liệu đính kèm</p>

                            {/* File Preview */}
                            <div className="mt-2 border border-border rounded-xl overflow-hidden bg-muted/30">
                              <div className="max-h-[200px] overflow-auto flex items-center justify-center p-4">
                                {(() => {
                                  const ext = selectedSchool.originalAttachmentFileName?.split('.').pop()?.toLowerCase() ||
                                              selectedSchool.attachmentFileName?.split('.').pop()?.toLowerCase() || '';
                                  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);

                                  if (isImage) {
                                    return (
                                      <img
                                        src={selectedSchool.attachmentUrl}
                                        alt="Chứng chỉ"
                                        className="max-w-full max-h-[150px] object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => handleOpenFilePreview(selectedSchool.attachmentUrl!, selectedSchool.originalAttachmentFileName || 'certificate')}
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                    );
                                  }

                                  return (
                                    <div className="text-center py-4">
                                      <FileText className="w-10 h-10 mx-auto text-brand/50 mb-2" />
                                      <p className="text-xs text-muted-foreground">{ext.toUpperCase()} Document</p>
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-2 px-4 py-2 border-t border-border bg-card/50">
                                <button
                                  onClick={() => handleOpenFilePreview(selectedSchool.attachmentUrl!, selectedSchool.originalAttachmentFileName || selectedSchool.attachmentFileName || 'document')}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-brand/10 hover:bg-brand/20 text-brand rounded-lg text-xs font-medium transition-colors"
                                >
                                  <ZoomIn className="w-3 h-3" />
                                  Xem phóng to
                                </button>
                                <a
                                  href={selectedSchool.attachmentUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-muted/50 hover:bg-muted text-muted-foreground rounded-lg text-xs font-medium transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Mở tab mới
                                </a>
                                <a
                                  href={selectedSchool.attachmentUrl}
                                  download={selectedSchool.originalAttachmentFileName || 'document'}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-muted/50 hover:bg-muted text-muted-foreground rounded-lg text-xs font-medium transition-colors"
                                >
                                  <Download className="w-3 h-3" />
                                  Tải xuống
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-3 text-sm">
                        <Calendar className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">Ngày đăng ký hệ thống</p>
                          <p className="font-semibold text-foreground mt-0.5">
                            {selectedSchool.createdAt ? new Date(selectedSchool.createdAt).toLocaleString('vi-VN') : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 text-sm">
                        <ShieldAlert className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">Trạng thái hoạt động</p>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1.5 ${
                              isStatusRejected(selectedSchool.status)
                                ? 'bg-destructive/10 text-destructive border border-border'
                                : isStatusPending(selectedSchool.status)
                                ? 'bg-accent/10 text-accent border border-border'
                                : 'bg-success/10 text-success border border-border'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isStatusRejected(selectedSchool.status) ? 'bg-destructive' : isStatusPending(selectedSchool.status) ? 'bg-accent' : 'bg-success'}`} />
                            {isStatusRejected(selectedSchool.status) ? 'Đã khóa' : isStatusPending(selectedSchool.status) ? 'Chờ duyệt' : 'Đang hoạt động'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeView === 'requests' && selectedRequest && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-3 p-4 bg-muted/50 border border-border rounded-xl">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent font-extrabold text-xl border border-border">
                        {selectedRequest.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-foreground">{selectedRequest.name}</h4>
                        <p className="text-xs text-muted-foreground">Đơn ứng tuyển gửi từ trường học</p>
                      </div>
                    </div>

                      <div className="space-y-4">
                      <div className="flex items-start gap-3 text-sm">
                        <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">Địa chỉ</p>
                          <p className="font-semibold text-foreground mt-0.5">{selectedRequest.address}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 text-sm">
                        <User className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">Người liên hệ đại diện</p>
                          <p className="font-semibold text-foreground mt-0.5">
                            {selectedRequest.representativeName}
                            {selectedRequest.representativePosition && ` (${selectedRequest.representativePosition})`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 text-sm">
                        <Mail className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">Email đại diện</p>
                          <p className="font-semibold text-foreground mt-0.5">{selectedRequest.representativeEmail}</p>
                        </div>
                      </div>
                      {(selectedRequest.phone || selectedRequest.adminUser?.phone) && (
                        <div className="flex items-start gap-3 text-sm">
                          <Phone className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">Số điện thoại</p>
                            <p className="font-semibold text-foreground mt-0.5">{selectedRequest.phone || selectedRequest.adminUser?.phone || 'N/A'}</p>
                          </div>
                        </div>
                      )}

                      {selectedRequest.studentScale && (
                        <div className="flex items-start gap-3 text-sm">
                          <Building2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">Quy mô học sinh</p>
                            <p className="font-semibold text-foreground mt-0.5">{selectedRequest.studentScale}</p>
                          </div>
                        </div>
                      )}
                      {selectedRequest.website && (
                        <div className="flex items-start gap-3 text-sm">
                          <Globe className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">Website / Fanpage</p>
                            <a 
                              href={selectedRequest.website.startsWith('http') ? selectedRequest.website : `https://${selectedRequest.website}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-brand hover:underline mt-0.5 flex items-center gap-1"
                            >
                              {selectedRequest.website} <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      )}
                      {selectedRequest.notes && (
                        <div className="flex items-start gap-3 text-sm">
                          <FileText className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">Ghi chú / Nhu cầu thêm</p>
                            <p className="text-muted-foreground mt-0.5 text-xs italic bg-muted p-2.5 rounded-lg border border-border leading-relaxed">{selectedRequest.notes}</p>
                          </div>
                        </div>
                      )}

                      {selectedRequest.rejectionReason && (
                        <div className="flex items-start gap-3 text-sm">
                          <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">Lý do từ chối</p>
                            <p className="text-destructive mt-0.5 text-xs bg-destructive/10 p-2.5 rounded-lg border border-destructive/20 leading-relaxed">{selectedRequest.rejectionReason}</p>
                          </div>
                        </div>
                      )}

                      {/* Attachment Document - Enhanced with Preview */}
                      {selectedRequest.attachmentUrl && (
                        <div className="flex items-start gap-3 text-sm">
                          <File className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground font-medium">Giấy chứng nhận / Tài liệu đính kèm</p>

                            {/* File Preview with Zoom */}
                            <div className="mt-2 border border-border rounded-xl overflow-hidden bg-muted/30">
                              <div className="max-h-[300px] overflow-auto flex items-center justify-center p-4">
                                {(() => {
                                  const ext = selectedRequest.originalAttachmentFileName?.split('.').pop()?.toLowerCase() ||
                                              selectedRequest.attachmentFileName?.split('.').pop()?.toLowerCase() || '';
                                  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);

                                  if (isImage) {
                                    return (
                                      <img
                                        src={selectedRequest.attachmentUrl}
                                        alt="Chứng chỉ"
                                        className="max-w-full max-h-[250px] object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => handleOpenFilePreview(selectedRequest.attachmentUrl!, selectedRequest.originalAttachmentFileName || 'certificate')}
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                    );
                                  }

                                  return (
                                    <div className="text-center py-6">
                                      <FileText className="w-12 h-12 mx-auto text-brand/50 mb-2" />
                                      <p className="text-xs text-muted-foreground">{ext.toUpperCase()} Document</p>
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-card/50">
                                <button
                                  onClick={() => handleOpenFilePreview(selectedRequest.attachmentUrl!, selectedRequest.originalAttachmentFileName || selectedRequest.attachmentFileName || 'document')}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand/10 hover:bg-brand/20 text-brand rounded-lg text-xs font-semibold transition-colors"
                                >
                                  <ZoomIn className="w-3.5 h-3.5" />
                                  Xem phóng to
                                </button>
                                <a
                                  href={selectedRequest.attachmentUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 hover:bg-muted text-muted-foreground rounded-lg text-xs font-semibold transition-colors"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  Mở tab mới
                                </a>
                                <a
                                  href={selectedRequest.attachmentUrl}
                                  download={selectedRequest.originalAttachmentFileName || 'document'}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 hover:bg-muted text-muted-foreground rounded-lg text-xs font-semibold transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  Tải xuống
                                </a>
                              </div>
                            </div>

                            {selectedRequest.originalAttachmentFileName && (
                              <p className="text-xs text-muted-foreground mt-2">
                                {selectedRequest.originalAttachmentFileName}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-3 text-sm">
                        <Calendar className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">Ngày gửi yêu cầu</p>
                          <p className="font-semibold text-foreground mt-0.5">
                            {selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleString('vi-VN') : 'N/A'}
                          </p>
                        </div>
                      </div>
                      {selectedRequest.adminUser && (
                        <div className="p-4 bg-muted/50 rounded-xl border border-border">
                          <p className="text-xs font-bold text-foreground mb-2 uppercase tracking-wider">Tài khoản Quản trị trường:</p>
                          <div className="space-y-1.5 text-xs text-foreground">
                            <p><strong>Họ tên:</strong> {selectedRequest.adminUser.fullName}</p>
                            <p><strong>Email đăng nhập:</strong> {selectedRequest.adminUser.email}</p>
                            <p>
                              <strong>Email:</strong>
                              {selectedRequest.adminUser.isEmailVerified ? (
                                <span className="inline-flex items-center gap-1 ml-1 text-green-600">
                                  <CheckCircle2 className="w-3 h-3" /> Đã xác thực
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 ml-1 text-yellow-600">
                                  <AlertTriangle className="w-3 h-3" /> Chưa xác thực
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                      {selectedRequest.proofOfActivity && (
                        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl border border-border">
                          <FileText className="w-4 h-4 text-brand" />
                          <a
                            href={selectedRequest.proofOfActivity}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-brand hover:underline font-semibold flex items-center gap-1"
                          >
                            Tải xuống tài liệu minh chứng hoạt động <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end gap-3">
                {activeView === 'schools' && selectedSchool && (
                  <>
                    <Button
                      variant="default"
                      onClick={() => {
                        setIsDetailOpen(false);
                        handleOpenEdit(selectedSchool);
                      }}
                    >
                      Chỉnh sửa
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsDetailOpen(false)}
                    >
                      Đóng
                    </Button>
                  </>
                )}
                {activeView === 'requests' && selectedRequest && (
                  <>
                    <Button
                      variant="default"
                      onClick={() => handleApprove(selectedRequest)}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Đang duyệt...' : 'Duyệt hồ sơ'}
                    </Button>
                    <Button
                      variant="outline"
                      className="text-destructive border-destructive/20 hover:bg-destructive hover:text-white"
                      onClick={() => handleOpenRejectModal(selectedRequest)}
                      disabled={actionLoading}
                    >
                      Từ chối đơn
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsDetailOpen(false)}
                    >
                      Đóng
                    </Button>
                  </>
                )}
              </div>
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
              className="absolute inset-0 bg-black/50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-xl border shadow-xl bg-card border-border text-foreground"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="text-lg font-semibold">Cập nhật Thông tin Trường học</h2>
                <button
                  onClick={() => setIsEditOpen(false)}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleUpdate} className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Tên trường học *</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-border rounded-lg p-2.5 bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Địa chỉ *</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-border rounded-lg p-2.5 bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Người đại diện</label>
                    <input
                      type="text"
                      className="w-full border border-border rounded-lg p-2.5 bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                      value={formData.representativeName || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, representativeName: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Email đại diện</label>
                    <input
                      type="email"
                      className="w-full border border-border rounded-lg p-2.5 bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                      value={formData.representativeEmail || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, representativeEmail: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    variant="default"
                    type="submit"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Đang lưu...' : 'Cập nhật'}
                  </Button>
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
              className="absolute inset-0 bg-black/50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-xl border shadow-xl bg-card border-border text-foreground"
            >
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="w-6 h-6 shrink-0 text-accent" />
                <h3 className="text-lg font-semibold">
                  {isStatusRejected(selectedSchool.status) ? 'Mở khóa trường học?' : 'Khóa trường học?'}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isStatusRejected(selectedSchool.status) ? (
                  `Bạn chuẩn bị mở khóa hoạt động cho trường "${selectedSchool.name}". Tất cả quản trị viên, giáo viên và học sinh thuộc trường này sẽ có thể đăng nhập trở lại.`
                ) : (
                  `Bạn đang thực hiện khóa trường "${selectedSchool.name}". Toàn bộ tài khoản người dùng thuộc trường này (bao gồm Quản trị trường, Giáo viên và Học sinh) sẽ BỊ VÔ HIỆU HÓA đăng nhập ngay lập tức.`
                )}
              </p>
              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setIsConfirmLockOpen(false)}
                >
                  Hủy bỏ
                </Button>
                <Button
                  variant="default"
                  className={isStatusRejected(selectedSchool.status) ? '' : 'bg-destructive hover:bg-destructive/90'}
                  onClick={handleToggleLock}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Đang xử lý...' : isStatusRejected(selectedSchool.status) ? 'Xác nhận Mở' : 'Xác nhận Khóa'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 4. Rejection Reason Modal */}
        {isRejectModalOpen && selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRejectModalOpen(false)}
              className="absolute inset-0 bg-black/50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-xl border shadow-xl bg-card border-border text-foreground"
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 shrink-0 text-destructive" />
                <h3 className="text-lg font-semibold">Từ chối yêu cầu đăng ký</h3>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Bạn đang từ chối yêu cầu đăng ký của trường <strong>"{selectedRequest.name}"</strong>.
                Trường và tài khoản quản trị sẽ bị xóa vĩnh viễn khỏi hệ thống.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Lý do từ chối <span className="text-destructive">*</span>
                </label>
                <textarea
                  className="w-full border border-border rounded-lg p-3 bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all resize-none"
                  rows={4}
                  placeholder="Nhập lý do từ chối..."
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    if (e.target.value.trim()) {
                      setRejectionReasonError('');
                    }
                  }}
                />
                {rejectionReasonError && (
                  <p className="text-xs text-destructive mt-1">{rejectionReasonError}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setIsRejectModalOpen(false)}
                >
                  Hủy bỏ
                </Button>
                <Button
                  variant="default"
                  className="bg-destructive hover:bg-destructive/90"
                  onClick={handleReject}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 5. File Preview Modal */}
        <FilePreviewModal
          isOpen={isFilePreviewOpen}
          onClose={() => setIsFilePreviewOpen(false)}
          fileUrl={previewFileUrl}
          fileName={previewFileName}
          title="Xem tài liệu đính kèm"
        />
      </AnimatePresence>
    </div>
  );
}

export default SchoolsPage;
