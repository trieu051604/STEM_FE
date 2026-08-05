import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/Switch';
import { api, usersApi, authApi } from '@/services';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Camera, Save, Key, Bell, Shield, Loader2, Check } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const profileFormSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  phone: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, 'Mật khẩu hiện tại không được để trống'),
  newPassword: z.string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .regex(/[A-Z]/, 'Phải chứa ít nhất 1 chữ hoa')
    .regex(/[a-z]/, 'Phải chứa ít nhất 1 chữ thường')
    .regex(/\d/, 'Phải chứa ít nhất 1 số')
    .regex(/[@$!%*?&]/, 'Phải chứa ít nhất 1 ký tự đặc biệt'),
  confirmPassword: z.string().min(1, 'Xác nhận mật khẩu không được để trống'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

type PasswordFormData = z.infer<typeof passwordFormSchema>;

export function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Fetch profile data
  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => usersApi.getProfile(),
  });

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: profile?.fullName || user?.fullName || '',
      phone: '',
      gender: '',
      dateOfBirth: '',
      address: '',
    },
    values: profile ? {
      fullName: profile.fullName || user?.fullName || '',
      phone: profile.phone || '',
      gender: profile.gender || '',
      dateOfBirth: profile.dateOfBirth || '',
      address: profile.address || '',
    } : undefined,
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordFormSchema),
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileFormData) => usersApi.updateProfile(data),
    onSuccess: (data) => {
      updateUser({ fullName: data.fullName });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      setProfileSuccess(true);
      setProfileError(null);
      setTimeout(() => setProfileSuccess(false), 3000);
    },
    onError: (error: any) => {
      setProfileError(error?.response?.data?.message || 'Cập nhật thất bại');
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: PasswordFormData) =>
      authApi.changePassword(data.currentPassword, data.newPassword),
    onSuccess: () => {
      passwordForm.reset();
      setPasswordSuccess(true);
      setPasswordError(null);
      setTimeout(() => setPasswordSuccess(false), 3000);
    },
    onError: (error: any) => {
      setPasswordError(error?.response?.data?.message || 'Đổi mật khẩu thất bại');
    },
  });

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => usersApi.uploadAvatar(file),
    onSuccess: (avatarUrl) => {
      updateUser({ avatar: avatarUrl });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      setAvatarFile(null);
      setAvatarPreview(null);
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = () => {
    if (avatarFile) {
      uploadAvatarMutation.mutate(avatarFile);
    }
  };

  const roleLabels: Record<string, string> = {
    master_admin: 'Quản trị hệ thống',
    school_admin: 'Quản trị trường',
    teacher: 'Giáo viên',
    student: 'Học sinh',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Hồ sơ cá nhân</h1>
        <p className="text-muted-foreground">
          Quản lý thông tin tài khoản và cài đặt bảo mật
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'profile'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Shield className="w-4 h-4" />
          Thông tin cá nhân
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'security'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Key className="w-4 h-4" />
          Bảo mật
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'notifications'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Bell className="w-4 h-4" />
          Thông báo
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Avatar & Basic Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold mb-4">Thông tin cá nhân</h3>
              
              <form onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-4">
                {profileError && (
                  <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                    {profileError}
                  </div>
                )}
                
                {profileSuccess && (
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Cập nhật thông tin thành công!
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Họ và tên</label>
                    <Input
                      {...profileForm.register('fullName')}
                      placeholder="Nguyễn Văn A"
                    />
                    {profileForm.formState.errors.fullName && (
                      <p className="text-xs text-destructive mt-1">
                        {profileForm.formState.errors.fullName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Số điện thoại</label>
                    <Input
                      {...profileForm.register('phone')}
                      placeholder="0xxx xxx xxx"
                      type="tel"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Giới tính</label>
                    <select
                      {...profileForm.register('gender')}
                      className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="Male">Nam</option>
                      <option value="Female">Nữ</option>
                      <option value="Other">Khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Ngày sinh</label>
                    <Input
                      {...profileForm.register('dateOfBirth')}
                      type="date"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Địa chỉ</label>
                  <Textarea
                    {...profileForm.register('address')}
                    placeholder="Địa chỉ của bạn"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Lưu thay đổi
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Avatar Card */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold mb-4">Ảnh đại diện</h3>
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {avatarPreview || profile?.avatar || user?.avatar ? (
                      <img
                        src={avatarPreview || profile?.avatar || user?.avatar}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl font-bold text-primary">
                        {user?.fullName?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                    <Camera className="w-4 h-4 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
                {avatarFile && (
                  <Button size="sm" onClick={handleAvatarUpload} disabled={uploadAvatarMutation.isPending}>
                    {uploadAvatarMutation.isPending ? 'Đang tải...' : 'Cập nhật ảnh'}
                  </Button>
                )}
              </div>
            </div>

            {/* Account Info Card */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold mb-4">Thông tin tài khoản</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium truncate max-w-[180px]">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vai trò</span>
                  <span className="font-medium">{roleLabels[user?.role || 'student']}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ngày tham gia</span>
                  <span className="font-medium">
                    {profile?.createdAt
                      ? format(new Date(profile.createdAt), 'dd/MM/yyyy', { locale: vi })
                      : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="max-w-xl">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold mb-4">Đổi mật khẩu</h3>
            
            {passwordError && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm mb-4">
                {passwordError}
              </div>
            )}
            
            {passwordSuccess && (
              <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm mb-4 flex items-center gap-2">
                <Check className="w-4 h-4" />
                Đổi mật khẩu thành công!
              </div>
            )}

            <form onSubmit={passwordForm.handleSubmit((data) => changePasswordMutation.mutate(data))} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Mật khẩu hiện tại</label>
                <Input
                  {...passwordForm.register('currentPassword')}
                  type="password"
                  placeholder="Nhập mật khẩu hiện tại"
                />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-xs text-destructive mt-1">
                    {passwordForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Mật khẩu mới</label>
                <Input
                  {...passwordForm.register('newPassword')}
                  type="password"
                  placeholder="Ít nhất 8 ký tự: 1 hoa, 1 thường, 1 số, 1 đặc biệt"
                />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-xs text-destructive mt-1">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Xác nhận mật khẩu mới</label>
                <Input
                  {...passwordForm.register('confirmPassword')}
                  type="password"
                  placeholder="Nhập lại mật khẩu mới"
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-destructive mt-1">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={changePasswordMutation.isPending}>
                  {changePasswordMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4 mr-2" />
                      Đổi mật khẩu
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="max-w-xl">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold mb-4">Cài đặt thông báo</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium">Thông báo email</p>
                  <p className="text-sm text-muted-foreground">Nhận thông báo qua email</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium">Thông báo hệ thống</p>
                  <p className="text-sm text-muted-foreground">Nhận thông báo từ hệ thống</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium">Nhắc nhở bài tập</p>
                  <p className="text-sm text-muted-foreground">Thông báo khi có bài tập mới</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">Thông báo lớp học</p>
                  <p className="text-sm text-muted-foreground">Cập nhật về lớp học</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
