import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FlaskConical, ArrowRight, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import type { UserRole } from '@/types';

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'student', label: '🎓 Học sinh' },
  { value: 'teacher', label: '👨‍🏫 Giáo viên' },
];

export function RegisterPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm();

  const onSubmit = () => {
    setTimeout(() => navigate('/login'), 500);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="glass-card p-8">
          <Link to="/" className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center">
              <FlaskConical size={16} className="text-white" />
            </div>
            <span className="font-bold text-white text-sm">STEM Lab</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-1">Tạo tài khoản</h1>
          <p className="text-slate-400 text-sm mb-6">Tham gia cộng đồng STEM học tập ngay hôm nay.</p>
          {/* Role picker */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {ROLES.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => setSelectedRole(r.value)}
                className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                  selectedRole === r.value
                    ? 'border-brand-500 bg-brand-500/10 text-white'
                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Họ và tên</label>
              <input {...register('fullName')} className="input-base" placeholder="Nguyễn Văn A" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input {...register('email')} type="email" className="input-base" placeholder="name@stem.edu" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Mật khẩu</label>
              <input {...register('password')} type="password" className="input-base" placeholder="Tối thiểu 8 ký tự" />
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex gap-2 text-amber-300 text-xs">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              Demo: Tài khoản sẽ không lưu thực tế. Dùng tài khoản demo để đăng nhập.
            </div>
            <button type="submit" className="btn-primary w-full justify-center py-3">
              Tạo tài khoản <ArrowRight size={16} />
            </button>
          </form>
          <p className="text-center text-sm text-slate-400 mt-4">
            Đã có tài khoản? <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Đăng nhập</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
