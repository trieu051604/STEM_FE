import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Mail, Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import { Icon } from '@/components/ui/Icon';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { api } from '@/services';

type VerificationStatus = 'none' | 'pending' | 'success' | 'error';

export function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<VerificationStatus>('none');
  const [errorMessage, setErrorMessage] = useState('');
  
  const token = searchParams.get('token');
  const email = searchParams.get('email') || '';
  const hasCalledVerify = useRef(false);

  useEffect(() => {
    if (token && !hasCalledVerify.current) {
      hasCalledVerify.current = true;
      const verifyToken = async () => {
        setStatus('pending');
        try {
          await api.post('/Auth/verify-email', { email, token });
          setStatus('success');
        } catch (error: any) {
          setStatus('error');
          setErrorMessage(
            error.response?.data?.message || 
            'Liên kết xác nhận không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại.'
          );
        }
      };
      verifyToken();
    } else if (!token) {
      setStatus('none');
    }
  }, [token, email]);

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-950 font-sans selection:bg-blue-500/30 relative text-slate-100">
      
      {/* Left Side (Forms & Messages Area) */}
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

          {/* 1. Màn hình mặc định: Hướng dẫn check email */}
          {status === 'none' && (
            <div className="space-y-6 text-center lg:text-left">
              <div className="mx-auto lg:mx-0 w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Mail size={32} className="animate-bounce" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold text-white tracking-tight">
                  Xác nhận Email của bạn
                </h1>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Chúng tôi đã gửi một liên kết xác thực đến hộp thư{email ? <strong className="text-slate-200"> {email}</strong> : ' của bạn'}. 
                  Vui lòng kiểm tra hộp thư (bao gồm cả thư rác/spam) và nhấn vào nút xác nhận để kích hoạt tài khoản.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/60 flex flex-col gap-3">
                <p className="text-xs text-slate-500">
                  Sau khi xác nhận thành công, tài khoản trường học của bạn sẽ chuyển sang trạng thái chờ phê duyệt.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl transition-all text-sm"
                >
                  Quay lại đăng nhập
                </Link>
              </div>
            </div>
          )}

          {/* 2. Màn hình chờ: Đang xác thực Token */}
          {status === 'pending' && (
            <div className="space-y-6 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Loader2 size={32} className="animate-spin" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  Đang xác minh liên kết...
                </h1>
                <p className="text-slate-400 text-sm">
                  Vui lòng giữ nguyên cửa sổ trình duyệt. Chúng tôi đang kiểm tra thông tin kích hoạt tài khoản của bạn.
                </p>
              </div>
            </div>
          )}

          {/* 3. Màn hình thành công: Đã xác thực thành công */}
          {status === 'success' && (
            <div className="space-y-6 text-center lg:text-left">
              <div className="mx-auto lg:mx-0 w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={32} />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold text-white tracking-tight">
                  Xác thực thành công!
                </h1>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Địa chỉ email của bạn đã được xác minh thành công. Đăng ký tài khoản trường học/đối tác đã hoàn thành. 
                  Bạn có thể đăng nhập ngay để theo dõi tiến trình phê duyệt hồ sơ của mình.
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
          )}

          {/* 4. Màn hình lỗi: Token hết hạn/sai */}
          {status === 'error' && (
            <div className="space-y-6 text-center lg:text-left">
              <div className="mx-auto lg:mx-0 w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <XCircle size={32} />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold text-white tracking-tight">
                  Xác minh thất bại
                </h1>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {errorMessage}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/60 flex flex-col gap-3">
                <Link
                  to="/register"
                  className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl transition-all"
                >
                  Đăng ký lại
                </Link>
                <Link
                  to="/login"
                  className="text-center text-sm text-slate-400 hover:text-slate-200 transition-colors font-semibold"
                >
                  Quay lại đăng nhập
                </Link>
              </div>
            </div>
          )}

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

export default EmailVerificationPage;
