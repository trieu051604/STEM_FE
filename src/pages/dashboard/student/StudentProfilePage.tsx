import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Mail, Phone, MapPin, Calendar, Award, BookOpen, GraduationCap, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { studentApi, StudentProfile } from '@/services/teacherStudentApi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function StudentProfilePage() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<StudentProfile>>({});

  const { data: profile, isLoading } = useQuery({
    queryKey: ['student-profile'],
    queryFn: () => studentApi.getProfile(),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<StudentProfile>) => studentApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-profile'] });
      setIsEditing(false);
    },
  });

  const handleSave = () => {
    updateMutation.mutate(editData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  const startEditing = () => {
    if (profile) {
      setEditData({
        fullName: profile.fullName,
        phone: profile.phone,
        gender: profile.gender,
        dateOfBirth: profile.dateOfBirth,
        address: profile.address,
      });
      setIsEditing(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Không tìm thấy thông tin hồ sơ</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hồ sơ cá nhân</h1>
          <p className="text-muted-foreground">Quản lý thông tin cá nhân của bạn</p>
        </div>
        {!isEditing ? (
          <Button onClick={startEditing}>
            <User className="w-4 h-4 mr-2" />
            Chỉnh sửa
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={updateMutation.isPending}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Lưu
            </Button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar & Basic Info */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl border border-border p-6 text-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-primary">
                {profile.fullName?.charAt(0).toUpperCase()}
              </span>
            </div>
            {isEditing ? (
              <Input
                value={editData.fullName || ''}
                onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                className="text-center font-semibold"
                placeholder="Họ và tên"
              />
            ) : (
              <h2 className="text-xl font-semibold">{profile.fullName}</h2>
            )}
            <p className="text-muted-foreground mt-1">{profile.email}</p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{profile.enrolledClasses}</p>
                <p className="text-xs text-muted-foreground">Lớp học</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{profile.certificatesEarned}</p>
                <p className="text-xs text-muted-foreground">Chứng chỉ</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold mb-4">Thông tin cá nhân</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{profile.email}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số điện thoại</p>
                  {isEditing ? (
                    <Input
                      value={editData.phone || ''}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className="mt-1"
                      placeholder="Số điện thoại"
                    />
                  ) : (
                    <p className="font-medium">{profile.phone || '—'}</p>
                  )}
                </div>
              </div>

              {/* Gender */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Giới tính</p>
                  {isEditing ? (
                    <select
                      value={editData.gender || ''}
                      onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                      className="mt-1 h-10 px-3 rounded-lg border border-border bg-background text-sm w-full"
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="Male">Nam</option>
                      <option value="Female">Nữ</option>
                      <option value="Other">Khác</option>
                    </select>
                  ) : (
                    <p className="font-medium">
                      {profile.gender === 'Male' ? 'Nam' : profile.gender === 'Female' ? 'Nữ' : profile.gender === 'Other' ? 'Khác' : '—'}
                    </p>
                  )}
                </div>
              </div>

              {/* Date of Birth */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ngày sinh</p>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editData.dateOfBirth || ''}
                      onChange={(e) => setEditData({ ...editData, dateOfBirth: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium">
                      {profile.dateOfBirth ? format(new Date(profile.dateOfBirth), 'dd/MM/yyyy', { locale: vi }) : '—'}
                    </p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-3 md:col-span-2">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Địa chỉ</p>
                  {isEditing ? (
                    <Textarea
                      value={editData.address || ''}
                      onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                      className="mt-1"
                      placeholder="Địa chỉ"
                      rows={2}
                    />
                  ) : (
                    <p className="font-medium">{profile.address || '—'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* School Info */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold mb-4">Thông tin trường học</h3>
            
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trường học</p>
                <p className="font-medium">{profile.schoolName || '—'}</p>
              </div>
            </div>
          </div>

          {/* Academic Info */}
          {profile.averageScore !== undefined && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold mb-4">Thành tích học tập</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                    <Award className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{profile.averageScore?.toFixed(1) || '—'}</p>
                    <p className="text-sm text-muted-foreground">Điểm trung bình</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{profile.enrolledClasses}</p>
                    <p className="text-sm text-muted-foreground">Lớp đã tham gia</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{profile.certificatesEarned}</p>
                    <p className="text-sm text-muted-foreground">Chứng chỉ đạt được</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
