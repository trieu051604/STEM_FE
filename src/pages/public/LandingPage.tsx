import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FlaskConical, Zap, Globe, Users, ChevronRight, ArrowRight,
  Star, BookOpen, Activity, Shield, Play, Microscope, Cpu, Dna
} from 'lucide-react';

const FEATURES = [
  { icon: <FlaskConical size={24} />, title: 'Virtual Lab', description: 'Thí nghiệm mô phỏng 3D thời gian thực với Socket.IO', color: 'text-brand-400' },
  { icon: <Zap size={24} />, title: 'Realtime Collaboration', description: 'Học nhóm trực tiếp — giáo viên điều khiển, học sinh tham gia', color: 'text-accent-400' },
  { icon: <Activity size={24} />, title: 'Progress Tracking', description: 'Theo dõi tiến độ học tập chi tiết với biểu đồ trực quan', color: 'text-emerald-400' },
  { icon: <Shield size={24} />, title: 'Multi-Role System', description: 'Hệ thống phân quyền 4 cấp: Admin, School, Teacher, Student', color: 'text-amber-400' },
];

const SUBJECTS = [
  { icon: <Zap size={20} />, label: 'Vật lý', count: '48 khóa', color: 'from-brand-500/20 to-brand-600/20 border-brand-500/30' },
  { icon: <FlaskConical size={20} />, label: 'Hóa học', count: '35 khóa', color: 'from-accent-500/20 to-accent-600/20 border-accent-500/30' },
  { icon: <Dna size={20} />, label: 'Sinh học', count: '29 khóa', color: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30' },
  { icon: <Cpu size={20} />, label: 'Công nghệ', count: '52 khóa', color: 'from-amber-500/20 to-amber-600/20 border-amber-500/30' },
  { icon: <Microscope size={20} />, label: 'Khoa học', count: '41 khóa', color: 'from-violet-500/20 to-violet-600/20 border-violet-500/30' },
  { icon: <BookOpen size={20} />, label: 'Toán học', count: '33 khóa', color: 'from-pink-500/20 to-pink-600/20 border-pink-500/30' },
];

const STATS = [
  { value: '50+', label: 'Trường học' },
  { value: '10,000+', label: 'Học sinh' },
  { value: '500+', label: 'Giáo viên' },
  { value: '200+', label: 'Lab mô phỏng' },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center">
              <FlaskConical size={16} className="text-white" />
            </div>
            <span className="font-bold text-white">STEM Lab</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <Link to="/courses" className="hover:text-white transition-colors">Khóa học</Link>
            <a href="#features" className="hover:text-white transition-colors">Tính năng</a>
            <a href="#about" className="hover:text-white transition-colors">Giới thiệu</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-sm">Đăng nhập</Link>
            <Link to="/register" className="btn-primary text-sm">Bắt đầu miễn phí</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 sim-canvas-wrapper opacity-20" />
        {/* Gradient blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full filter blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full filter blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-brand-500/30 text-brand-400 text-xs font-medium mb-6">
                <span className="live-dot" />
                Nền tảng STEM giáo dục thế hệ mới
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6">
                Học STEM qua{' '}
                <span className="gradient-text">Virtual Lab</span>{' '}
                thời gian thực
              </h1>
              <p className="text-xl text-slate-400 leading-relaxed mb-8">
                Nền tảng mô phỏng thí nghiệm STEM với công nghệ realtime — cho phép học sinh, giáo viên và trường học cùng nhau xây dựng tương lai khoa học.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="btn-primary py-3 px-8 text-base">
                  Bắt đầu miễn phí <ArrowRight size={18} />
                </Link>
                <Link to="/courses" className="btn-secondary py-3 px-8 text-base">
                  <Play size={18} /> Khám phá khóa học
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Hero card mockup */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden xl:block absolute right-12 top-1/2 -translate-y-1/2 w-96"
          >
            <div className="glass-card p-5 shadow-glass">
              <div className="flex items-center gap-2 mb-4">
                <div className="live-dot" />
                <span className="text-xs font-bold text-emerald-400">LAB ĐANG HOẠT ĐỘNG</span>
                <span className="ml-auto text-xs text-slate-500">12 học sinh</span>
              </div>
              <div className="sim-canvas-wrapper h-40 rounded-xl mb-4 flex items-center justify-center">
                <div className="text-center">
                  <FlaskConical size={32} className="text-brand-400 mx-auto mb-2 animate-bounce-soft" />
                  <p className="text-xs text-slate-400">Mô phỏng Vật lý lượng tử</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['Nhiệt độ', 'Áp suất', 'Điện áp'].map((s, i) => (
                  <div key={s} className="glass rounded-xl p-2 text-center">
                    <p className="text-sm font-bold text-brand-400">{[24.5, 1.2, 3.7][i]}</p>
                    <p className="text-[10px] text-slate-500">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-slate-700/50 bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <p className="text-3xl font-black gradient-text">{s.value}</p>
                <p className="text-sm text-slate-400 mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Tính năng nổi bật</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Hệ thống tích hợp đầy đủ mọi công cụ cần thiết cho học tập STEM hiện đại</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-6 group hover:scale-[1.02] transition-transform duration-300"
              >
                <div className={`${f.color} mb-4 group-hover:scale-110 transition-transform`}>{f.icon}</div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Subjects */}
      <section className="py-16 bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">Lĩnh vực học tập</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {SUBJECTS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`p-4 rounded-2xl bg-gradient-to-br border text-center cursor-pointer hover:scale-105 transition-transform ${s.color}`}
              >
                <div className="text-slate-300 mb-2 mx-auto w-fit">{s.icon}</div>
                <p className="text-sm font-semibold text-white">{s.label}</p>
                <p className="text-xs text-slate-400">{s.count}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-12"
          >
            <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-6 glow-brand">
              <Globe size={32} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Bắt đầu hành trình STEM ngay hôm nay</h2>
            <p className="text-slate-400 mb-8 max-w-lg mx-auto">Tham gia cùng hơn 10,000 học sinh và 500 giáo viên đang học tập, nghiên cứu và sáng tạo trên STEM Lab.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/register" className="btn-primary py-3 px-10 text-base">
                Đăng ký miễn phí <ChevronRight size={18} />
              </Link>
              <Link to="/login" className="btn-secondary py-3 px-10 text-base">
                Xem demo
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 py-8 text-center text-sm text-slate-500">
        <div className="flex items-center justify-center gap-2 mb-2">
          <FlaskConical size={16} className="text-brand-400" />
          <span className="font-medium text-slate-300">STEM Lab</span>
        </div>
        <p>© 2024 STEM Classroom Simulation & Management System. All rights reserved.</p>
      </footer>
    </div>
  );
}
