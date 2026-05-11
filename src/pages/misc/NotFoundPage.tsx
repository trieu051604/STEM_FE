import { Link } from 'react-router-dom';
import { Frown, Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center max-w-md">
        <p className="text-8xl font-black gradient-text mb-4">404</p>
        <Frown className="mx-auto text-slate-500 mb-4" size={48} />
        <h1 className="text-2xl font-bold text-white mb-2">Trang không tồn tại</h1>
        <p className="text-slate-400 mb-8">Trang bạn đang tìm kiếm đã bị xóa hoặc không tồn tại.</p>
        <Link to="/" className="btn-primary">
          <Home size={16} /> Về trang chủ
        </Link>
      </div>
    </div>
  );
}
