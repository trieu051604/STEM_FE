import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Clock, Users, Star, FlaskConical, Play, CheckCircle, Zap } from 'lucide-react';
import { MOCK_COURSES } from '@/utils/mockData';

export function CourseDetailPage() {
  const { courseId } = useParams();
  const course = MOCK_COURSES.find(c => c.id === courseId) ?? MOCK_COURSES[0];

  const mockLessons = Array.from({ length: course.lessonCount }, (_, i) => ({
    id: `l${i + 1}`, title: `Bài ${i + 1}: ${['Giới thiệu', 'Lý thuyết cơ bản', 'Thí nghiệm', 'Bài tập'][i % 4]}`,
    duration: [15, 30, 45, 20][i % 4], type: ['video', 'reading', 'simulation', 'quiz'][i % 4],
  }));

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="sticky top-0 z-50 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/courses" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={16} /> Quay lại
          </Link>
          <div className="flex gap-3">
            <Link to="/login" className="btn-primary text-sm">Đăng ký học</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="relative h-64 rounded-2xl overflow-hidden mb-6">
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span className="badge-info text-xs">{course.subject}</span>
                </div>
                {course.hasSimulation && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button className="w-16 h-16 rounded-full gradient-brand flex items-center justify-center glow-brand hover:scale-110 transition-transform">
                      <Play size={24} className="text-white ml-1" />
                    </button>
                  </div>
                )}
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">{course.title}</h1>
              <p className="text-slate-400 leading-relaxed">{course.description}</p>
            </motion.div>

            {/* Lessons list */}
            <div className="glass-card p-5">
              <h2 className="section-heading mb-4">Nội dung khóa học</h2>
              <div className="space-y-2">
                {mockLessons.map((lesson, i) => (
                  <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-xs text-slate-400 flex-shrink-0">{i + 1}</div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-200">{lesson.title}</p>
                      <p className="text-xs text-slate-500">{lesson.duration} phút • {lesson.type}</p>
                    </div>
                    {lesson.type === 'simulation' && <FlaskConical size={14} className="text-brand-400" />}
                    {i < 2 ? <CheckCircle size={14} className="text-emerald-400" /> : <Zap size={14} className="text-slate-600" />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar card */}
          <div className="space-y-4">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6 sticky top-24">
              <div className="space-y-3 mb-6">
                {[
                  { icon: <Star size={15} />, label: 'Đánh giá', value: `${course.rating}/5 (${course.studentCount} học sinh)` },
                  { icon: <Clock size={15} />, label: 'Thời lượng', value: `${Math.round(course.duration / 60)} giờ học` },
                  { icon: <BookOpen size={15} />, label: 'Bài học', value: `${course.lessonCount} bài` },
                  { icon: <Users size={15} />, label: 'Học sinh', value: `${course.studentCount} đang học` },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 text-sm">
                    <span className="text-brand-400">{item.icon}</span>
                    <span className="text-slate-400">{item.label}:</span>
                    <span className="text-white font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
              {course.hasSimulation && (
                <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 flex gap-2 text-brand-300 text-xs mb-4">
                  <FlaskConical size={14} className="flex-shrink-0" />
                  Khóa học này có Virtual Lab tương tác thời gian thực
                </div>
              )}
              <Link to="/register" className="btn-primary w-full justify-center py-3">Đăng ký học ngay</Link>
              <Link to="/login" className="btn-ghost w-full justify-center mt-2 text-sm">Đã có tài khoản</Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
