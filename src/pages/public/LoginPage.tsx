import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FlaskConical, Eye, EyeOff, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores';

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

type FormData = z.infer<typeof schema>;

const DEMO_ACCOUNTS = [
  { label: 'Master Admin', email: 'master@stem.edu', color: 'border-brand-500/50 hover:border-brand-500' },
  { label: 'School Admin', email: 'admin@stem.edu', color: 'border-amber-500/50 hover:border-amber-500' },
  { label: 'Teacher', email: 'teacher@stem.edu', color: 'border-emerald-500/50 hover:border-emerald-500' },
  { label: 'Student', email: 'student@stem.edu', color: 'border-accent-500/50 hover:border-accent-500' },
];

export function LoginPage() {
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Đăng nhập thất bại');
    }
  };

  const fillDemo = (email: string) => {
    setValue('email', email);
    setValue('password', 'password');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-950 via-brand-950/50 to-slate-950 p-12">
        <div className="absolute inset-0 sim-canvas-wrapper opacity-30" />
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-brand-500/40"
            animate={{ y: [-20, 20], x: [-10, 10], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
            style={{ left: `${15 + i * 14}%`, top: `${20 + (i % 3) * 20}%` }}
          />
        ))}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-3xl gradient-brand flex items-center justify-center mx-auto mb-8 glow-brand">
            <FlaskConical size={40} className="text-white" />
          </div>
          <h2 className="text-4xl font-black text-white mb-4">
            Chào mừng đến với{' '}
            <span className="gradient-text">STEM Lab</span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Nền tảng học tập STEM tích hợp mô phỏng thí nghiệm thời gian thực — Khám phá, Thực hành, Sáng tạo.
          </p>
          <div className="grid grid-cols-3 gap-4 mt-8">
            {[
              { label: 'Trường học', value: '50+' },
              { label: 'Học sinh', value: '10K+' },
              { label: 'Lab mô phỏng', value: '200+' },
            ].map(stat => (
              <div key={stat.label} className="glass rounded-xl p-3 text-center">
                <p className="text-xl font-bold gradient-text">{stat.value}</p>
                <p className="text-xs text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:max-w-md xl:max-w-lg">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
              <FlaskConical size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white">STEM Lab</span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">Đăng nhập</h1>
          <p className="text-slate-400 text-sm mb-6">Chào mừng trở lại! Vui lòng nhập thông tin đăng nhập.</p>

          {/* Demo accounts */}
          <div className="mb-6">
            <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">Tài khoản demo</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  onClick={() => fillDemo(acc.email)}
                  className={`text-xs px-3 py-2 rounded-lg border bg-slate-800 text-slate-300 hover:text-white transition-colors ${acc.color}`}
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input
                {...register('email')}
                type="email"
                className="input-base"
                placeholder="name@stem.edu"
                id="login-email"
              />
              {errors.email && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-slate-300">Mật khẩu</label>
                <Link to="/forgot-password" className="text-xs text-brand-400 hover:text-brand-300">Quên mật khẩu?</Link>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  className="input-base pr-10"
                  placeholder="••••••••"
                  id="login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.password.message}
                </p>
              )}
            </div>

            {/* Server error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
              >
                <AlertCircle size={14} />
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full justify-center py-3 text-base"
              id="login-submit"
            >
              {isLoading ? (
                <><Loader2 size={16} className="animate-spin" /> Đang đăng nhập...</>
              ) : (
                <>Đăng nhập <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">Đăng ký ngay</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
