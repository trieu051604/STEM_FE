import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Loader2, ArrowLeft, User, Shield } from 'lucide-react';
import { Icon } from '@/components/ui/Icon';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useAuthStore } from '@/stores';

// Zod Schema for School Admin login
const adminLoginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email không được để trống.' })
    .email({ message: 'Địa chỉ email không đúng định dạng.' }),
  password: z
    .string()
    .min(1, { message: 'Mật khẩu không được để trống.' })
    .min(6, { message: 'Mật khẩu phải chứa ít nhất 6 ký tự.' }),
});

type AdminLoginFormData = z.infer<typeof adminLoginSchema>;

// Google OAuth configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export function LoginPage() {
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loginType, setLoginType] = useState<'student' | 'admin'>('student');
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, isLoading } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
  });

  // Google OAuth login - Native approach
  const initiateGoogleLogin = () => {
    setError('');
    setGoogleLoading(true);
    
    // Redirect to Google OAuth
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    googleAuthUrl.searchParams.set('redirect_uri', `${window.location.origin}/login/google/callback`);
    googleAuthUrl.searchParams.set('response_type', 'id_token');
    googleAuthUrl.searchParams.set('scope', 'email profile');
    googleAuthUrl.searchParams.set('nonce', crypto.randomUUID());
    googleAuthUrl.searchParams.set('prompt', 'select_account');
    
    window.location.href = googleAuthUrl.toString();
  };

  const handleAdminLogin = async (data: AdminLoginFormData) => {
    try {
      setError('');
      await login(data.email, data.password);
      window.location.href = '/dashboard';
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
          
          <a 
            href="/" 
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors mb-2"
          >
            <ArrowLeft size={14} /> Quay lại trang chủ
          </a>

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
              Đăng nhập để tiếp tục hành trình STEM của bạn.
            </p>
          </div>

          {/* Login Type Toggle */}
          <div className="flex rounded-xl bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => setLoginType('student')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
                loginType === 'student'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User size={18} />
              Học sinh / Giáo viên
            </button>
            <button
              type="button"
              onClick={() => setLoginType('admin')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
                loginType === 'admin'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield size={18} />
              Quản trị viên
            </button>
          </div>

          {loginType === 'student' ? (
            /* Student/Teacher Login (Google OAuth) */
            <div className="space-y-4">
              <div className="p-4 bg-blue-950/30 border border-blue-500/30 rounded-xl">
                <p className="text-sm text-blue-300">
                  <strong>Lưu ý:</strong> Tài khoản của bạn cần được Quản trị viên trường tạo trước. 
                  Nếu chưa có tài khoản, vui lòng liên hệ Quản trị viên trường để được cấp.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-950/20 border border-red-500/30 text-red-400 text-sm">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Google Login Button */}
              <button
                type="button"
                onClick={initiateGoogleLogin}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3.5 rounded-xl transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none"
              >
                {googleLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Đang chuyển hướng...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Đăng nhập bằng Google
                  </>
                )}
              </button>

              <p className="text-xs text-slate-500 text-center">
                Bằng việc đăng nhập, bạn đồng ý với{' '}
                <a href="#" className="text-blue-400 hover:underline">Điều khoản sử dụng</a>
                {' '}và{' '}
                <a href="#" className="text-blue-400 hover:underline">Chính sách bảo mật</a>
              </p>
            </div>
          ) : (
            /* Admin Login (Email/Password) */
            <form onSubmit={handleSubmit(handleAdminLogin)} className="space-y-4">
              
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
                    placeholder="admin@school.edu"
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
                  <a
                    href="/forgot-password"
                    className="text-xs text-blue-400 font-medium hover:underline hover:text-blue-300 transition-colors"
                  >
                    Quên mật khẩu?
                  </a>
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
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-400 transition-colors"
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

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-950/20 border border-red-500/30 text-red-400 text-sm">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

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

              {/* Link to Register */}
              <div className="text-center pt-2 border-t border-slate-800/40">
                <p className="text-sm text-slate-400">
                  Chưa có tài khoản?{' '}
                  <a
                    href="/register"
                    className="text-blue-400 font-bold hover:underline hover:text-blue-300 transition-colors"
                  >
                    Đăng ký trường học
                  </a>
                </p>
              </div>
            </form>
          )}

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
