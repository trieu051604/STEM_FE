import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Icon } from '@/components/ui/Icon';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useAuthStore } from '@/stores';

// Zod Schema with Vietnamese messages
const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email không được để trống.' })
    .email({ message: 'Địa chỉ email không đúng định dạng.' }),
  password: z
    .string()
    .min(1, { message: 'Mật khẩu không được để trống.' })
    .min(6, { message: 'Mật khẩu phải chứa ít nhất 6 ký tự.' }),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError('');
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Đăng nhập thất bại. Vui lòng kiểm tra lại.');
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-950 font-sans selection:bg-blue-500/30 relative text-slate-100">
      
      {/* Left Side (Forms Area) */}
      <main className="flex items-center justify-center p-8 sm:p-12 md:p-16 lg:p-20 bg-slate-900 transition-colors duration-300 relative">
        
        {/* Top-Right Theme Toggle */}
        <div className="absolute top-6 right-6 z-50">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md space-y-8">
          
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors mb-2"
          >
            <ArrowLeft size={14} /> Quay lại trang chủ
          </Link>

          {/* Logo (Visible on mobile/tablet) */}
          <div className="flex lg:hidden items-center gap-2 mb-8 select-none">
            <Icon name="Cpu" className="text-blue-500 w-8 h-8 animate-pulse" />
            <span className="font-extrabold text-2xl tracking-tight text-white">
              Stem<span className="text-blue-500">Flow</span>
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Chào mừng quay trở lại
            </h1>
            <p className="text-slate-400 text-sm">
              Nhập thông tin đăng nhập của bạn để tiếp tục hành trình STEM.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2" htmlFor="email">
                Địa chỉ Email
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Icon name="Mail" size={16} />
                </div>
                <input
                  {...register('email')}
                  className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all text-white placeholder-slate-600 outline-none text-sm"
                  id="email"
                  placeholder="name@example.com"
                  type="email"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-slate-300" htmlFor="password">
                  Mật khẩu
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-blue-400 font-medium hover:underline hover:text-blue-300 transition-colors"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Icon name="Lock" size={16} />
                </div>
                <input
                  {...register('password')}
                  className="w-full pl-12 pr-12 py-3 bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all text-white placeholder-slate-600 outline-none text-sm"
                  id="password"
                  placeholder="••••••••"
                  type={showPass ? 'text' : 'password'}
                  disabled={isLoading}
                />
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-400 transition-colors"
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  disabled={isLoading}
                >
                  <Icon name={showPass ? 'EyeOff' : 'Eye'} />
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.password.message}
                </p>
              )}
            </div>

            {/* Error alerts from Server */}
            {error && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-950/20 border border-red-500/30 text-red-400 text-sm">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-between py-1">
              <label className="flex items-center gap-2 cursor-pointer group select-none">
                <input
                  className="w-4 h-4 rounded border-slate-800 text-blue-600 bg-slate-950 focus:ring-blue-500 focus:ring-offset-slate-900"
                  type="checkbox"
                  disabled={isLoading}
                />
                <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">
                  Ghi nhớ đăng nhập
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          {/* Link to Register */}
          <div className="text-center pt-2 border-t border-slate-800/40">
            <p className="text-sm text-slate-400">
              Chưa có tài khoản?{' '}
              <Link
                to="/register"
                className="text-blue-400 font-bold hover:underline hover:text-blue-300 transition-colors"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>

        </div>
      </main>

      {/* Right Side (Branding & Showcase Area) */}
      <section className="hidden lg:flex relative bg-slate-950 border-l border-slate-800 text-white flex-col justify-between p-16 overflow-hidden select-none">
        
        {/* Wokwi-style Engineering dot grid background */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-25"></div>
        
        {/* Soft Radial Ambient Glows */}
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-2.5">
          <Icon name="Cpu" className="text-blue-500 w-8 h-8 animate-pulse" />
          <span className="font-extrabold text-2xl tracking-tight text-white">
            Stem<span className="text-blue-500">Flow</span>
          </span>
        </div>

        {/* Main Branding copy */}
        <div className="relative z-10 space-y-8 max-w-lg">
          <h2 className="text-4xl font-extrabold text-white leading-tight">
            Nền tảng thực hành <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              STEM không giới hạn.
            </span>
          </h2>
          <p className="text-slate-400 leading-relaxed text-lg">
            Viết code, nối mạch điện tử và chạy mô phỏng cảm biến trực tuyến y như thật ngay trên trình duyệt mà không lo cháy nổ hay hao tổn thiết bị.
          </p>

          {/* Simulation diagram showcase */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px] opacity-25"></div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
              <span className="text-xs text-slate-500 font-mono ml-2">esp32_wlan_node.json</span>
            </div>

            <div className="border border-slate-800 bg-slate-950/40 rounded-xl p-4 flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-2 w-20 bg-slate-800 rounded"></div>
                <div className="h-2 w-32 bg-slate-800 rounded"></div>
                <div className="h-2 w-16 bg-slate-800 rounded"></div>
              </div>
              <div className="relative flex items-center justify-center mr-4">
                <div className="w-8 h-8 rounded bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                  <Icon name="Cpu" className="w-4 h-4 text-blue-500 animate-pulse" />
                </div>
                <div className="absolute -right-6 w-6 h-0.5 bg-rose-500/50"></div>
                <div className="absolute -right-8 w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer testimonial */}
        <div className="relative z-10 border-t border-slate-800/60 pt-8 max-w-lg">
          <blockquote className="text-slate-400 text-sm italic leading-relaxed">
            &ldquo;StemFlow giúp học sinh của chúng tôi tiếp cận với lập trình nhúng và thiết kế mạch điện tử chỉ trong vài phút, loại bỏ hoàn toàn chi phí phần cứng vật lý đắt đỏ.&rdquo;
          </blockquote>
          <div className="mt-4">
            <cite className="not-italic text-sm font-semibold text-white block">
              Thầy Nguyễn Văn An
            </cite>
            <span className="text-xs text-slate-500">
              Giám đốc Trung tâm STEM EduTech
            </span>
          </div>
        </div>

      </section>

    </div>
  );
}
