import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, BookOpen, FlaskConical, CheckCircle, Play } from 'lucide-react';
import { PageHeader, ProgressBar, SectionCard } from '@/components/common/UIComponents';
import { MOCK_COURSES } from '@/utils/mockData';

export function LessonViewerPage() {
  const { courseId, lessonId } = useParams();
  const course = MOCK_COURSES.find(c => c.id === courseId) ?? MOCK_COURSES[0];
  const [completed, setCompleted] = useState(false);

  const lessons = Array.from({ length: course.lessonCount }, (_, i) => ({
    id: `l${i + 1}`, title: `Bài ${i + 1}: ${['Giới thiệu & Tổng quan', 'Lý thuyết nền tảng', 'Thí nghiệm thực hành', 'Bài tập ứng dụng', 'Kiểm tra kiến thức'][i % 5]}`,
    isDone: i < 2,
  }));
  const currentIdx = lessons.findIndex(l => l.id === lessonId) ?? 0;
  const currentLesson = lessons[Math.max(0, currentIdx)];

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Sidebar - lesson list */}
      <div className="w-72 flex-shrink-0 glass-card overflow-y-auto no-scrollbar">
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="font-semibold text-white text-sm line-clamp-1">{course.title}</h3>
          <div className="mt-2"><ProgressBar value={33} showLabel /></div>
        </div>
        <div className="p-2">
          {lessons.map((lesson, i) => (
            <button
              key={lesson.id}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left text-xs transition-colors mb-1 ${
                lesson.id === currentLesson.id ? 'bg-brand-500/20 border border-brand-500/30 text-white' : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 ${
                lesson.isDone ? 'border-emerald-500 bg-emerald-500/20' : lesson.id === currentLesson.id ? 'border-brand-500 bg-brand-500/20' : 'border-slate-600'
              }`}>
                {lesson.isDone ? <CheckCircle size={12} className="text-emerald-400" /> : <span className="text-[10px]">{i + 1}</span>}
              </div>
              <span className="line-clamp-2">{lesson.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main viewer */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="glass-card p-5 mb-4">
          <h1 className="text-xl font-bold text-white mb-1">{currentLesson.title}</h1>
          <p className="text-sm text-slate-400">{course.title}</p>
        </div>

        {/* Video/content area */}
        <div className="flex-1 glass-card overflow-hidden relative">
          <div className="absolute inset-0 sim-canvas-wrapper flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
              <div className="w-20 h-20 rounded-full gradient-brand flex items-center justify-center mx-auto mb-4 glow-brand cursor-pointer hover:scale-105 transition-transform">
                <Play size={32} className="text-white ml-1" />
              </div>
              <p className="text-white font-medium">{currentLesson.title}</p>
              <p className="text-sm text-slate-400 mt-1">{course.title}</p>
            </motion.div>
          </div>
        </div>

        {/* Navigation */}
        <div className="glass-card p-4 mt-4 flex items-center justify-between">
          <button className="btn-secondary flex items-center gap-2">
            <ChevronLeft size={16} /> Bài trước
          </button>
          <button
            onClick={() => setCompleted(true)}
            className={`btn-primary ${completed ? 'opacity-60' : ''}`}
          >
            {completed ? <><CheckCircle size={16} /> Đã hoàn thành</> : 'Đánh dấu hoàn thành'}
          </button>
          <button className="btn-primary flex items-center gap-2">
            Bài tiếp theo <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
