import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, FlaskConical, Clock, CheckCircle } from 'lucide-react';
import { PageHeader, ProgressBar, SectionCard } from '@/components/common/UIComponents';
import { MOCK_COURSES } from '@/utils/mockData';

export function MyCoursesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Khóa học của tôi" subtitle="Tất cả khóa học bạn đang theo học" />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {MOCK_COURSES.map((course, i) => (
          <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Link to={`/student/courses/${course.id}/lesson/l1`} className="block glass-card overflow-hidden hover:scale-[1.01] transition-transform group">
              <div className="relative h-36 overflow-hidden">
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                {course.hasSimulation && (
                  <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-500/80 text-white text-[10px] font-bold">
                    <FlaskConical size={10} /> Lab
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white mb-1 truncate group-hover:text-brand-300 transition-colors">{course.title}</h3>
                <p className="text-xs text-slate-400 mb-3">GV: {course.teacherName} • {course.lessonCount} bài</p>
                <ProgressBar value={[35, 68, 90, 20, 55, 75][i % 6]} showLabel />
                <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Clock size={11} />{Math.round(course.duration / 60)}h</span>
                  <span className="flex items-center gap-1 text-emerald-400"><CheckCircle size={11} />{[4, 10, 18, 3, 8, 12][i % 6]}/{course.lessonCount} bài</span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
