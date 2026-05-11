import { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Save, User, Mail, School, Lock } from 'lucide-react';
import { PageHeader, SectionCard } from '@/components/common/UIComponents';
import { useAuthStore } from '@/stores';

export function StudentProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.fullName ?? '');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader title="Hồ sơ cá nhân" subtitle="Quản lý thông tin tài khoản của bạn" />
      <div className="grid md:grid-cols-3 gap-6">
        {/* Avatar */}
        <SectionCard className="text-center">
          <div className="relative inline-block mb-4">
            <img src={user?.avatar} alt={user?.fullName} className="w-24 h-24 rounded-full mx-auto ring-4 ring-brand-500/30" />
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white hover:scale-110 transition-transform">
              <Camera size={14} />
            </button>
          </div>
          <h3 className="font-bold text-white">{user?.fullName}</h3>
          <p className="text-sm text-slate-400">Học sinh</p>
          <div className="mt-4 space-y-2 text-xs text-slate-400">
            <p>Lớp: 10A1</p>
            <p>Trường: THPT Khoa học Tự nhiên</p>
            <p className="text-emerald-400 flex items-center justify-center gap-1">● Đang trực tuyến</p>
          </div>
        </SectionCard>

        {/* Info form */}
        <SectionCard className="md:col-span-2" title="Thông tin cá nhân" actions={
          <button onClick={() => { setEditing(!editing); if (editing) updateUser({ fullName: name }); }} className={editing ? 'btn-primary text-sm py-1.5' : 'btn-secondary text-sm py-1.5'}>
            {editing ? <><Save size={14} /> Lưu</> : 'Chỉnh sửa'}
          </button>
        }>
          <div className="space-y-4">
            {[
              { label: 'Họ và tên', icon: <User size={15} />, value: name, key: 'name', type: 'text' },
              { label: 'Email', icon: <Mail size={15} />, value: user?.email ?? '', key: 'email', type: 'email' },
              { label: 'Trường học', icon: <School size={15} />, value: 'THPT Khoa học Tự nhiên', key: 'school', type: 'text' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">{field.label}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{field.icon}</span>
                  <input
                    type={field.type}
                    value={field.key === 'name' ? name : field.value}
                    onChange={field.key === 'name' ? e => setName(e.target.value) : undefined}
                    disabled={!editing || field.key !== 'name'}
                    className="input-base pl-10 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Bảo mật" subtitle="Quản lý mật khẩu và bảo mật tài khoản">
        <button className="btn-secondary flex items-center gap-2">
          <Lock size={16} /> Đổi mật khẩu
        </button>
      </SectionCard>
    </div>
  );
}
