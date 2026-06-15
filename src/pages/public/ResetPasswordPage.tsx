import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Loader2, Lock, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Icon } from '@/components/ui/Icon';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { api } from '@/services';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, { message: 'Mật khẩu mới không được để trống.' })
      .min(6, { message: 'Mật khẩu phải chứa ít nhất 6 ký tự.' }),
    confirmPassword: z
      .string()
      .min(1, { message: 'Xác nhận mật khẩu không được để trống.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp.',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(3);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Countdown timer redirect after successful submission
  useEffect(() => {
    let timer: any;
    if (isSubmitted && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isSubmitted && countdown === 0) {
      navigate('/login');
    }
    return () => clearTimeout(timer);
  }, [isSubmitted, countdown, navigate]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;
    setIsLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, password: data.password });
      setIsSubmitted(true);
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      setError(
        err.response?.data?.message || 
        'Không thể đặt lại mật khẩu. Liên kết có thể đã hết hạn hoặc không hợp lệ.'
      );
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
            to="/login" 
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors mb-2"
          >
            <ArrowLeft size={14} /> Quay lại đăng nhập
          </Link>

          {/* Logo (Visible on mobile/tablet) */}
          <div className="flex lg:hidden items-center gap-2 mb-8 select-none">
            <Icon name="Cpu" className="text-blue-500 w-8 h-8 animate-pulse" />
            <span className="font-extrabold text-2xl tracking-tight text-white">
              Stem<span className="text-blue-500">Flow</span>
            </span>
          </div>

          <div className="space-y-6">
            {!token ? (
              // Màn hình lỗi nếu không có Token
              <div className="space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <AlertCircle size={32} />
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-extrabold text-white tracking-tight">
                    Liên kết không hợp lệ
                  </h1>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Đường dẫn đặt lại mật khẩu của bạn thiếu mã token xác thực hoặc đã hết hạn. 
                    Vui lòng yêu cầu lại liên kết mới từ trang quên mật khẩu.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-800/60 flex flex-col gap-3">
                  <Link
                    to="/forgot-password"
                    className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl transition-all text-sm"
                  >
                    Yêu cầu liên kết mới
                  </Link>
                  <Link
                    to="/login"
                    className="text-center text-sm text-slate-400 hover:text-slate-200 transition-colors font-semibold"
                  >
                    Quay lại đăng nhập
                  </Link>
                </div>
              </div>
            ) : isSubmitted ? (
              // Màn hình đặt lại thành công
              <div className="space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 size={32} />
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-extrabold text-white tracking-tight">
                    Đặt lại thành công!
                  </h1>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Mật khẩu mới của bạn đã được cập nhật thành công. 
                    Hệ thống sẽ tự động chuyển bạn về trang Đăng nhập sau {countdown} giây...
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-800/60">
                  <Link
                    to="/login"
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all duration-150"
                  >
                    Đăng nhập ngay
                  </Link>
                </div>
              </div>
            ) : (
              // Form nhập mật khẩu mới
              <div className="space-y-8">
                <div className="space-y-2">
                  <h1 className="text-3xl font-extrabold text-white tracking-tight">
                    Đặt lại mật khẩu
                  </h1>
                  <p className="text-slate-400 text-sm">
                    Tạo mật khẩu mới cho tài khoản của bạn. Mật khẩu phải chứa ít nhất 6 ký tự.
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  
                  {/* Password Field */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2" htmlFor="password">
                      Mật khẩu mới
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        <Lock size={16} />
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

                  {/* Confirm Password Field */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2" htmlFor="confirmPassword">
                      Xác nhận mật khẩu mới
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        <Lock size={16} />
                      </div>
                      <input
                        {...register('confirmPassword')}
                        className="w-full pl-12 pr-12 py-3 bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all text-white placeholder-slate-600 outline-none text-sm"
                        id="confirmPassword"
                        placeholder="••••••••"
                        type={showConfirmPass ? 'text' : 'password'}
                        disabled={isLoading}
                      />
                      <button
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-400 transition-colors"
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        disabled={isLoading}
                      >
                        <Icon name={showConfirmPass ? 'EyeOff' : 'Eye'} />
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0" /> {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  {/* Server errors */}
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
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95 transition-all duration-150 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Đang cập nhật...
                      </>
                    ) : (
                      'Xác nhận mật khẩu mới'
                    )}
                  </button>

                </form>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Right Side (Branding & Showcase Area) */}
      <section className="hidden lg:flex relative bg-slate-950 border-l border-slate-800 text-white flex-col justify-between p-16 overflow-hidden select-none">
        
        {/* Wokwi dot grid */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-25"></div>
        
        {/* Glowing blurs */}
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Top Branding logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <Icon name="Cpu" className="text-blue-500 w-8 h-8 animate-pulse" />
          <span className="font-extrabold text-2xl tracking-tight text-white">
            Stem<span className="text-blue-500">Flow</span>
          </span>
        </div>

        {/* Tagline */}
        <div className="relative z-10 space-y-8 max-w-lg">
          <h2 className="text-4xl font-extrabold text-white leading-tight">
            Khởi tạo không gian <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              giáo dục STEM của riêng bạn.
            </span>
          </h2>
          <p className="text-slate-400 leading-relaxed text-lg">
            Học tập lập trình cảm biến, lắp ráp mạch điện IoT thực tế ảo an toàn, tiết kiệm trên trình duyệt mà không cần mua thiết bị vật lý đắt đỏ.
          </p>

          {/* Graphic mockup */}
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

        {/* Testimonial */}
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

export default ResetPasswordPage;
