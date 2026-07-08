import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useAuthStore, type User } from '@/stores/authStore';
import { usersApi } from '@/services/dashboardApi';
import type { UpdateProfileRequest, UserProfile } from '@/services/dashboardApi';
import { Icon } from '@/components/ui/Icon';
import {
  AlertCircle,
  Calendar,
  Camera,
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Save,
  Shield,
  User as UserIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ProfileFormData = {
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  avatar?: string;
};

type StatusMessage = {
  type: 'success' | 'error';
  text: string;
};

const emptyFormData: ProfileFormData = {
  fullName: '',
  email: '',
  phone: '',
  gender: '',
  dateOfBirth: '',
  address: '',
};

const roleLabels: Record<string, string> = {
  master_admin: 'Quản trị viên hệ thống',
  school_admin: 'Quản trị trường',
  teacher: 'Giáo viên',
  student: 'Học sinh',
  'Master Administrator': 'Quản trị viên hệ thống',
  'School Administrator': 'Quản trị trường',
  Teacher: 'Giáo viên',
  Student: 'Học sinh',
};

function toDateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : '';
}

function buildFormData(
  profile?: Partial<UserProfile> | null,
  fallbackUser?: User | null
): ProfileFormData {
  return {
    fullName: profile?.fullName ?? fallbackUser?.fullName ?? '',
    email: profile?.email ?? fallbackUser?.email ?? '',
    phone: profile?.phone ?? '',
    gender: profile?.gender ?? '',
    dateOfBirth: toDateInputValue(profile?.dateOfBirth),
    address: profile?.address ?? '',
    avatar: profile?.avatar ?? fallbackUser?.avatar,
  };
}

function normalizeRole(role?: string): User['role'] | undefined {
  if (!role) return undefined;

  const normalized = role.toLowerCase().replace(/\s+/g, '_');

  if (normalized.includes('master')) return 'master_admin';
  if (normalized.includes('school')) return 'school_admin';
  if (normalized.includes('teacher')) return 'teacher';
  if (normalized.includes('student')) return 'student';

  return undefined;
}

function getErrorMessage(error: unknown, fallback: string) {
  const maybeError = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };

  return maybeError.response?.data?.message ?? maybeError.message ?? fallback;
}

export const ProfilePage = () => {
  const { user, updateUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>(() =>
    buildFormData(null, user)
  );
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const currentRole = profile?.role ?? user?.role ?? '';
  const isBusy = isLoading || isSaving || isUploading;

  const syncAuthUser = (nextProfile: Partial<UserProfile>) => {
    const nextRole = normalizeRole(nextProfile.role);
    const patch: Partial<User> = {};

    if (nextProfile.id !== undefined) patch.id = nextProfile.id;
    if (nextProfile.email) patch.email = nextProfile.email;
    if (nextProfile.fullName) patch.fullName = nextProfile.fullName;
    if (nextProfile.avatar !== undefined) patch.avatar = nextProfile.avatar;
    if (nextProfile.schoolId !== undefined) patch.schoolId = nextProfile.schoolId;
    if (nextProfile.createdAt) patch.createdAt = nextProfile.createdAt;
    if (nextRole) patch.role = nextRole;

    updateUser(patch);
  };

  const resetForm = (nextProfile = profile) => {
    setFormData(buildFormData(nextProfile, user));
  };

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setIsLoading(true);
      setStatus(null);

      try {
        const nextProfile = await usersApi.getProfile();

        if (!isMounted) return;

        setProfile(nextProfile);
        setFormData(buildFormData(nextProfile, user));
        syncAuthUser(nextProfile);
      } catch (error) {
        if (!isMounted) return;

        setStatus({
          type: 'error',
          text: getErrorMessage(error, 'Không thể tải hồ sơ người dùng.'),
        });
        setFormData(buildFormData(null, user));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatus(null);

    const payload: UpdateProfileRequest = {
      fullName: formData.fullName.trim(),
      phone: formData.phone.trim() || undefined,
      gender: formData.gender || undefined,
      dateOfBirth: formData.dateOfBirth || undefined,
      address: formData.address.trim() || undefined,
    };

    try {
      const updatedProfile = await usersApi.updateProfile(payload);
      const nextProfile = {
        ...profile,
        ...payload,
        ...updatedProfile,
        email: updatedProfile.email ?? profile?.email ?? formData.email,
        avatar: updatedProfile.avatar ?? profile?.avatar ?? formData.avatar,
      };

      setProfile(nextProfile);
      setFormData(buildFormData(nextProfile, user));
      syncAuthUser(nextProfile);
      setStatus({ type: 'success', text: 'Đã cập nhật hồ sơ.' });
    } catch (error) {
      setStatus({
        type: 'error',
        text: getErrorMessage(error, 'Cập nhật hồ sơ thất bại.'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatus({ type: 'error', text: 'Vui lòng chọn một file ảnh.' });
      return;
    }

    setIsUploading(true);
    setStatus(null);

    try {
      const avatarUrl = await usersApi.uploadAvatar(file);
      const nextProfile =
        avatarUrl
          ? { ...profile, avatar: avatarUrl }
          : await usersApi.getProfile();

      setProfile(nextProfile);
      setFormData(buildFormData(nextProfile, user));
      syncAuthUser(nextProfile);
      setStatus({ type: 'success', text: 'Đã cập nhật ảnh đại diện.' });
    } catch (error) {
      setStatus({
        type: 'error',
        text: getErrorMessage(error, 'Upload ảnh đại diện thất bại.'),
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="relative bg-white rounded-3xl overflow-hidden border border-border shadow-sm">
        <div className="h-48 md:h-64 bg-gradient-to-r from-[#0f4c5c] via-[#247c94] to-[#4ab9d1] relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        </div>

        <div className="px-6 md:px-12 pb-8 flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 relative z-10">
          <div className="relative group">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white bg-slate-100 overflow-hidden shadow-md flex items-center justify-center">
              {formData.avatar ? (
                <img
                  src={formData.avatar}
                  alt={formData.fullName || 'Avatar'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-16 h-16 text-slate-300" />
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
              className="absolute bottom-2 right-2 p-2.5 bg-[#0f4c5c] text-white rounded-full shadow-lg hover:bg-[#0a3540] hover:scale-105 transition-all disabled:cursor-not-allowed disabled:opacity-60"
              title="Đổi ảnh đại diện"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="flex-1 text-center md:text-left mb-2 md:mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-[#0f4c5c]">
              {formData.fullName || 'Người dùng'}
            </h1>
            <p className="text-muted-foreground font-medium flex items-center justify-center md:justify-start gap-2 mt-1">
              <Shield className="w-4 h-4 text-emerald-500" />
              {roleLabels[currentRole] ?? currentRole ?? 'Người dùng'}
            </p>
          </div>

          <div className="mb-2 md:mb-4 flex gap-3">
            <button
              type="button"
              onClick={() => resetForm()}
              disabled={isBusy}
              className="px-5 py-2.5 rounded-full border border-border text-slate-600 hover:bg-slate-50 font-semibold transition-colors text-sm flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCcw className="w-4 h-4" />
              Hủy thay đổi
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isBusy}
              className="px-5 py-2.5 rounded-full bg-[#0f4c5c] hover:bg-[#0a3540] text-white font-semibold transition-colors shadow-md flex items-center gap-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Lưu cập nhật
            </button>
          </div>
        </div>
      </div>

      {status && (
        <div
          className={cn(
            'rounded-2xl border px-4 py-3 text-sm font-medium flex items-center gap-2',
            status.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          )}
        >
          {status.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {status.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-border shadow-sm">
            <h2 className="text-xl font-bold text-[#0f4c5c] mb-6 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-cyan-600" />
              Thông tin cá nhân
            </h2>

            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang tải hồ sơ...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">
                    Họ và tên
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f4c5c]/20 focus:border-[#0f4c5c] transition-all bg-slate-50/50 hover:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f4c5c]/20 focus:border-[#0f4c5c] transition-all bg-slate-50/50 hover:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">
                    Giới tính
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f4c5c]/20 focus:border-[#0f4c5c] transition-all bg-slate-50/50 hover:bg-white text-slate-600"
                  >
                    <option value="">Chưa cập nhật</option>
                    <option value="Male">Nam</option>
                    <option value="Female">Nữ</option>
                    <option value="Other">Khác</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">
                    Ngày sinh
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f4c5c]/20 focus:border-[#0f4c5c] transition-all bg-slate-50/50 hover:bg-white text-slate-600"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-600">
                    Địa chỉ
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f4c5c]/20 focus:border-[#0f4c5c] transition-all bg-slate-50/50 hover:bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-border shadow-sm">
            <h2 className="text-xl font-bold text-[#0f4c5c] mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              Bảo mật tài khoản
            </h2>

            <div className="space-y-4">
              <button className="w-full text-left p-4 rounded-2xl border border-border hover:border-[#0f4c5c] hover:bg-slate-50 transition-all flex items-center justify-between group">
                <div>
                  <p className="font-bold text-[#0f4c5c]">Xác thực 2 bước</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Bảo vệ lớp thứ 2 cho tài khoản (Chưa bật)
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-[#0f4c5c] group-hover:text-white transition-colors">
                  <Icon name="ChevronRight" className="w-4 h-4" />
                </div>
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0f4c5c] to-[#1a667b] rounded-3xl p-6 md:p-8 shadow-sm text-white">
            <h2 className="text-lg font-bold mb-2">Trung tâm trợ giúp</h2>
            <p className="text-sm text-white/80 mb-6 leading-relaxed">
              Nếu bạn gặp vấn đề với tài khoản hoặc cần hỗ trợ về hệ thống,
              hãy liên hệ với quản trị viên nhà trường.
            </p>
            <button className="w-full bg-white text-[#0f4c5c] hover:bg-slate-100 py-2.5 rounded-xl font-bold transition-colors">
              Liên hệ hỗ trợ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
