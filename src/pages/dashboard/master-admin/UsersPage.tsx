import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Shield, Loader2, RefreshCw, Search } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

export function UsersPage() {
  const [loading, setLoading] = useState(false);
  const { theme } = useUIStore();
  const isDark = theme === 'dark';

  const mutedText = isDark ? 'text-brand-400' : 'text-gray-500';
  const headingText = isDark ? 'text-white' : 'text-gray-900';
  const inputClasses = isDark
    ? 'bg-brand-950 border-brand-800 text-brand-100 placeholder-brand-500 focus:border-brand-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-brand-500';

  return (
    <div className={`min-h-screen p-6 rounded-3xl border shadow-2xl space-y-6 font-sans ${isDark ? 'bg-brand-950 text-brand-100 border-brand-900' : 'bg-white text-gray-900 border-gray-200'}`}>
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5 ${isDark ? 'border-brand-800/60' : 'border-gray-200'}`}>
        <div>
          <h1 className={`text-3xl font-extrabold tracking-tight font-headline ${headingText}`}>
            Quản lý người dùng
          </h1>
          <p className={`text-sm mt-1 ${mutedText}`}>
            Xem danh sách tài khoản trên hệ thống STEM.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className={`gap-2 transition-colors ${isDark ? 'border-brand-800 bg-brand-900 text-brand-300 hover:bg-brand-800 hover:text-white' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100'}`}
            onClick={() => setLoading((v) => !v)}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      <div className={`backdrop-blur-md rounded-2xl p-6 shadow-xl space-y-4 border ${isDark ? 'bg-brand-900/30 border-brand-800' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-brand-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder="Tìm kiếm người dùng theo tên hoặc email..."
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${inputClasses} ${isDark ? 'focus:ring-brand-500/40' : 'focus:ring-brand-500/30'}`}
            />
          </div>
        </div>

        <div className={`py-16 flex flex-col items-center justify-center gap-3 ${isDark ? 'text-brand-400' : 'text-gray-500'}`}>
          {loading ? (
            <>
              <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-brand-400' : 'text-brand-600'}`} />
              <p className="text-sm">Đang tải danh sách người dùng...</p>
            </>
          ) : (
            <>
              <Shield className={`w-10 h-10 ${isDark ? 'text-brand-500' : 'text-gray-400'}`} />
              <p className="text-sm">Tính năng quản lý người dùng đang được phát triển.</p>
              <p className={`text-xs ${isDark ? 'text-brand-500' : 'text-gray-400'}`}>Bạn vẫn có thể truy cập trang quản lý trường và yêu cầu phê duyệt.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default UsersPage;
