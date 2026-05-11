import { Link } from 'react-router-dom';
import { ShieldOff, ArrowLeft } from 'lucide-react';

export function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6"><ShieldOff className="mx-auto text-red-400" size={80} /></div>
        <h1 className="text-3xl font-bold text-white mb-2">Không có quyền truy cập</h1>
        <p className="text-slate-400 mb-8">Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ quản trị viên.</p>
        <Link to="/dashboard" className="btn-primary">
          <ArrowLeft size={16} /> Về Dashboard
        </Link>
      </div>
    </div>
  );
}
