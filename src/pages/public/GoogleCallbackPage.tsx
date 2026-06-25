import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Loader2, AlertCircle } from 'lucide-react';

export const GoogleCallbackPage = () => {
  const navigate = useNavigate();
  const { googleLogin } = useAuthStore();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Parse hash fragment (implicit flow) or query params
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      
      // Check for error in hash
      const errorParam = params.get('error');
      const errorDescription = params.get('error_description');
      
      if (errorParam) {
        setError(errorDescription || 'Đăng nhập Google bị hủy hoặc thất bại.');
        return;
      }

      // Get id_token from hash
      const idToken = params.get('id_token');
      
      if (!idToken) {
        // Try query params
        const queryParams = new URLSearchParams(window.location.search);
        const queryError = queryParams.get('error');
        if (queryError) {
          setError('Đăng nhập Google bị hủy hoặc thất bại.');
          return;
        }
        
        setError('Không nhận được thông tin từ Google.');
        return;
      }

      try {
        await googleLogin(idToken);
        setSuccess(true);
        setTimeout(() => navigate('/dashboard'), 1000);
      } catch (err: any) {
        setError(err.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.');
      }
    };

    handleCallback();
  }, [googleLogin, navigate]);

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-green-400 text-lg font-medium">Đăng nhập thành công!</p>
          <p className="text-slate-400">Đang chuyển hướng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-red-400 text-lg font-medium">Đăng nhập thất bại</p>
          <p className="text-slate-400 text-sm">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Quay lại trang đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
        <p className="text-slate-400">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  );
};
