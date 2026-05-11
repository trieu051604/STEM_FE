import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FlaskConical, Mail, ArrowLeft, Send } from 'lucide-react';
import { useForm } from 'react-hook-form';

export function ForgotPasswordPage() {
  const { register, handleSubmit } = useForm<{ email: string }>();
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8">
          <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center mb-6"><FlaskConical size={24} className="text-white" /></div>
          <h1 className="text-2xl font-bold text-white mb-1">Quên mật khẩu</h1>
          <p className="text-slate-400 text-sm mb-6">Nhập email của bạn để nhận link đặt lại mật khẩu.</p>
          <form className="space-y-4" onSubmit={handleSubmit(d => console.log(d))}>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input {...register('email')} type="email" className="input-base pl-10" placeholder="name@stem.edu" />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full justify-center py-3">
              <Send size={16} /> Gửi link đặt lại
            </button>
          </form>
          <Link to="/login" className="flex items-center justify-center gap-2 mt-4 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={14} /> Quay lại đăng nhập
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
