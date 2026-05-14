import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores';

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

type FormData = z.infer<typeof schema>;

const DEMO_ACCOUNTS = [
  { label: 'Master Admin', email: 'master@stem.edu', color: 'border-brand-500/50 hover:border-brand-500 text-brand-500' },
  { label: 'School Admin', email: 'admin@stem.edu', color: 'border-amber-500/50 hover:border-amber-500 text-amber-500' },
  { label: 'Teacher', email: 'teacher@stem.edu', color: 'border-emerald-500/50 hover:border-emerald-500 text-emerald-500' },
  { label: 'Student', email: 'student@stem.edu', color: 'border-accent-500/50 hover:border-accent-500 text-accent-500' },
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
    <div className="min-h-screen flex flex-col font-body bg-surface text-on-surface">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 w-full flex justify-between items-center px-8 h-20 z-50 bg-surface-container-low/80 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Link to="/" className="font-headline font-black text-2xl tracking-tighter text-primary">StemFlow</Link>
        </div>
        <div className="hidden md:flex gap-4">
          <span className="text-on-surface-variant font-body text-label-md">Chưa có tài khoản?</span>
          <Link className="text-primary font-bold hover:underline transition-all" to="/register">Đăng ký ngay</Link>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center pt-20 px-4 md:px-0">
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm">
          {/* Left Side: Login Form */}
          <div className="p-8 md:p-16 flex flex-col justify-center">
            <div className="mb-10">
              <h1 className="text-headline-sm font-headline font-extrabold text-primary text-3xl mb-2">Chào mừng trở lại</h1>
              <p className="text-on-surface-variant font-body leading-relaxed">Truy cập vào phòng thí nghiệm tư duy của bạn và tiếp tục hành trình khám phá tri thức.</p>
            </div>

            {/* Demo accounts */}
            <div className="mb-6">
              <p className="text-xs text-on-surface-variant mb-2 font-medium uppercase tracking-wider">Tài khoản demo</p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map(acc => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => fillDemo(acc.email)}
                    className={`text-xs px-3 py-2 rounded-lg border bg-surface-container-low hover:bg-surface-container transition-colors ${acc.color}`}
                  >
                    {acc.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-label-md font-medium text-on-surface-variant mb-2" htmlFor="identifier">Email</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">mail</span>
                  <input 
                    {...register('email')}
                    className="w-full pl-12 pr-4 py-3 bg-surface-container rounded-lg border-none focus:ring-2 focus:ring-primary transition-all text-on-surface" 
                    id="identifier" 
                    placeholder="name@stem.edu" 
                    type="email"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-error mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-label-md font-medium text-on-surface-variant mb-2" htmlFor="password">Mật khẩu</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">lock</span>
                  <input 
                    {...register('password')}
                    className="w-full pl-12 pr-12 py-3 bg-surface-container rounded-lg border-none focus:ring-2 focus:ring-primary transition-all text-on-surface" 
                    id="password" 
                    placeholder="••••••••" 
                    type={showPass ? 'text' : 'password'}
                  />
                  <button 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors" 
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                  >
                    <span className="material-symbols-outlined">{showPass ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-error mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.password.message}
                  </p>
                )}
              </div>

              {/* Server error */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-error-container border border-error/30 text-on-error-container text-sm">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary" type="checkbox"/>
                  <span className="text-label-md text-on-surface-variant group-hover:text-on-surface transition-colors">Ghi nhớ đăng nhập</span>
                </label>
                <Link className="text-label-md font-semibold text-secondary hover:text-on-secondary-fixed-variant transition-colors" to="/forgot-password">Quên mật khẩu?</Link>
              </div>

              <button 
                className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary font-headline font-bold py-4 rounded-full hover:shadow-lg transform active:scale-95 transition-all duration-200 disabled:opacity-50" 
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? <><Loader2 size={20} className="animate-spin" /> Đang đăng nhập...</> : 'Đăng nhập'}
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-outline-variant/20">
              <p className="text-center text-label-md text-on-surface-variant mb-4">Hoặc đăng nhập với</p>
              <div className="grid grid-cols-2 gap-4">
                <button type="button" className="flex items-center justify-center gap-2 py-3 px-4 bg-surface-container-low rounded-lg hover:bg-surface-container transition-all">
                  <img alt="Google" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDretTC-6O9xZFlcRiICZ3Boiie74ltH-5u4dzzC69jkWx57AlYuLQwRsRS-Zr5fENFWqQfWLwUpzMBcUq9Wg-wkCBeqgrSBfoypTWB8OEIOZy5Iq25hZz0DsgTZ1aUOUVJ1Rb9Bx0ScFfgzH6qCML6HwZ_Ep1l_OmF5hqsWkF4ANt5Z-gq5q58uBysVEzxvtw39xby8Y1yaCDz7VFP3iH_LEVKQoQ3zbDhAKFMSLb3WoKuqvxFyffY7QIiVTOGyDp5eQI3VtyE0Po"/>
                  <span className="font-medium text-on-surface">Google</span>
                </button>
                <button type="button" className="flex items-center justify-center gap-2 py-3 px-4 bg-surface-container-low rounded-lg hover:bg-surface-container transition-all">
                  <span className="material-symbols-outlined text-on-surface">account_circle</span>
                  <span className="font-medium text-on-surface">Tổ chức</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Side: Visual Illustration */}
          <div className="hidden md:block relative bg-primary-container overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary-container z-10 opacity-60"></div>
            <img className="absolute inset-0 w-full h-full object-cover" data-alt="A sophisticated digital rendering of a modern laboratory space with translucent glass panels and floating holographic scientific equations." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBlYeoaEbAleM9k3jqNqI78YnBUFVYqRFnO7DNBNKFYzW6vBuUFY6edxFHX5_65HAcx7AP2cq6vfodUG1f8SrmqXOqHbdK54KfFA_8KI8QnwOkIuM6cafmN_qgFVIxYN1viWyGp1NwQqVe6SWHiPiHkJQeKhcfjtuHiRa7aLYeNZBgMikq5vBwpy3EI_mS7_JCtPRUIOMPz6yKBl8cE_6dnK0cJrRUdYJlQjcyZWlGvzBxciDNLCe01ib4iD1gdpQplSk7tvzR4Ru4"/>
            <div className="relative z-20 h-full flex flex-col justify-end p-16 text-on-primary">
              <div className="p-8 backdrop-blur-md bg-surface-container-low/10 rounded-xl border border-white/10 shadow-2xl">
                <span className="material-symbols-outlined text-secondary-fixed-dim text-4xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>science</span>
                <h2 className="text-headline-sm font-headline font-bold mb-4">Hành trình từ lý thuyết đến thực tiễn</h2>
                <p className="font-body opacity-90 leading-relaxed italic">
                    "Khoa học không chỉ là những công thức, đó là cách chúng ta đặt câu hỏi và tìm kiếm câu trả lời về thế giới xung quanh."
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary"></div>
                  <div>
                    <p className="text-sm font-bold">Ban Cố vấn Học thuật</p>
                    <p className="text-xs opacity-70">Dự án StemFlow</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Abstract decorative elements */}
            <div className="absolute top-10 right-10 z-20 w-32 h-32 border-t-2 border-r-2 border-white/20 rounded-tr-3xl"></div>
            <div className="absolute bottom-10 left-10 z-20 w-32 h-32 border-b-2 border-l-2 border-white/20 rounded-bl-3xl"></div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex flex-col md:flex-row justify-between items-center px-12 py-10 w-full mt-auto bg-surface-container-low rounded-t-xl">
        <div className="flex flex-col mb-6 md:mb-0">
          <span className="font-headline font-bold text-lg text-primary mb-2">StemFlow</span>
          <p className="font-body text-label-md text-on-surface-variant max-w-sm">© 2024 StemFlow. Môi trường nuôi dưỡng những nhà khoa học tương lai.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-8">
          <a className="font-body text-label-md text-on-surface-variant hover:text-secondary transition-colors" href="#">Điều khoản sử dụng</a>
          <a className="font-body text-label-md text-on-surface-variant hover:text-secondary transition-colors" href="#">Chính sách bảo mật</a>
          <a className="font-body text-label-md text-on-surface-variant hover:text-secondary transition-colors" href="#">Liên hệ hỗ trợ</a>
          <a className="font-body text-label-md text-on-surface-variant hover:text-secondary transition-colors" href="#">Tài liệu API</a>
        </div>
      </footer>
    </div>
  );
}
