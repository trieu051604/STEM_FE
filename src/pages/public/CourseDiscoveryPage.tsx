import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, BookOpen, Clock, Users, Star, FlaskConical, Zap, Dna, Cpu, Microscope } from 'lucide-react';
import { MOCK_COURSES } from '@/utils/mockData';
import type { CourseSubject, CourseLevel } from '@/types';

const SUBJECT_ICONS: Record<CourseSubject, React.ReactNode> = {
  physics: <Zap size={14} />, chemistry: <FlaskConical size={14} />, biology: <Dna size={14} />,
  math: <Microscope size={14} />, technology: <Cpu size={14} />, engineering: <BookOpen size={14} />,
};
const SUBJECT_LABELS: Record<CourseSubject, string> = {
  physics: 'Vật lý', chemistry: 'Hóa học', biology: 'Sinh học',
  math: 'Toán học', technology: 'Công nghệ', engineering: 'Kỹ thuật',
};
const LEVEL_LABELS: Record<CourseLevel, string> = { beginner: 'Cơ bản', intermediate: 'Trung cấp', advanced: 'Nâng cao' };

export function CourseDiscoveryPage() {
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState<CourseSubject | 'all'>('all');

  const filtered = MOCK_COURSES.filter(c =>
    (subject === 'all' || c.subject === subject) &&
    (c.title.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl gradient-brand flex items-center justify-center">
              <FlaskConical size={14} className="text-white" />
            </div>
            <span className="font-bold text-white text-sm">STEM Lab</span>
          </Link>
          <div className="flex gap-3">
            <Link to="/login" className="btn-ghost text-sm">Đăng nhập</Link>
            <Link to="/register" className="btn-primary text-sm">Đăng ký</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Khám phá khóa học</h1>
          <p className="text-slate-400">Tìm kiếm hàng trăm khóa học STEM chất lượng cao</p>
        </motion.div>

        {/* Search + filter */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="relative flex-1 min-w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="input-base pl-10" placeholder="Tìm kiếm khóa học..." />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'physics', 'chemistry', 'biology', 'math', 'technology', 'engineering'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSubject(s)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                  subject === s ? 'border-brand-500 bg-brand-500/10 text-brand-300' : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                }`}
              >
                {s !== 'all' && SUBJECT_ICONS[s as CourseSubject]}
                {s === 'all' ? 'Tất cả' : SUBJECT_LABELS[s as CourseSubject]}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/courses/${course.id}`} className="block glass-card overflow-hidden hover:scale-[1.01] hover:shadow-glow-brand transition-all duration-300 group">
                <div className="relative h-44 overflow-hidden">
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex gap-2">
                    <span className="badge-info flex items-center gap-1">{SUBJECT_ICONS[course.subject]} {SUBJECT_LABELS[course.subject]}</span>
                    <span className="badge-brand">{LEVEL_LABELS[course.level]}</span>
                  </div>
                  {course.hasSimulation && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-brand-500/80 text-white text-[10px] font-bold">
                      <FlaskConical size={10} /> Virtual Lab
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-white mb-1 group-hover:text-brand-300 transition-colors line-clamp-1">{course.title}</h3>
                  <p className="text-xs text-slate-400 mb-3 line-clamp-2">{course.description}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Star size={11} className="text-amber-400" /> {course.rating}</span>
                    <span className="flex items-center gap-1"><Users size={11} /> {course.studentCount}</span>
                    <span className="flex items-center gap-1"><BookOpen size={11} /> {course.lessonCount} bài</span>
                    <span className="flex items-center gap-1"><Clock size={11} /> {Math.round(course.duration / 60)}h</span>
                  </div>
                  <div className="divider" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">GV: {course.teacherName}</span>
                    <span className="text-xs font-medium text-brand-400">Xem chi tiết →</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <BookOpen size={48} className="text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Không tìm thấy khóa học phù hợp</p>
          </div>
        )}
      </div>
    </div>
  );
}
