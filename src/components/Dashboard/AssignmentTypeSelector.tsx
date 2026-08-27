import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Cpu, CheckSquare, Sparkles } from 'lucide-react';
import { AssignmentEntity } from '@/services/dashboardApi';
import { cn } from '@/lib/utils';

interface AssignmentTypeSelectorProps {
  onSelect: (type: NonNullable<AssignmentEntity['assignment_type']>) => void;
}

const types = [
  {
    id: 'quiz' as const,
    title: 'Quiz',
    description: 'Trắc nghiệm',
    features: ['Chấm tự động', 'Hỗ trợ nhiều dạng câu hỏi', 'Xáo trộn ngẫu nhiên'],
    icon: <CheckSquare className="w-10 h-10" />,
    gradient: 'from-blue-500 to-cyan-500',
    glowClass: 'group-hover:shadow-blue-500/30',
    featureDot: 'bg-blue-500',
  },
  {
    id: 'text_report' as const,
    title: 'Báo cáo',
    description: 'Nộp file/video',
    features: ['Giáo viên chấm tay', 'Đính kèm Rubric', 'Hỗ trợ tải lên đa phương tiện'],
    icon: <FileText className="w-10 h-10" />,
    gradient: 'from-orange-500 to-amber-500',
    glowClass: 'group-hover:shadow-orange-500/30',
    featureDot: 'bg-orange-500',
  },
  {
    id: 'practical_simulation' as const,
    title: 'Thực hành',
    description: 'Sandbox linh kiện',
    features: ['Auto-check + chấm tay', 'Tích hợp mạch điện tử', 'Kịch bản kiểm thử linh hoạt'],
    icon: <Cpu className="w-10 h-10" />,
    gradient: 'from-purple-500 to-pink-500',
    glowClass: 'group-hover:shadow-purple-500/30',
    featureDot: 'bg-purple-500',
  },
];

export const AssignmentTypeSelector: React.FC<AssignmentTypeSelectorProps> = ({ onSelect }) => {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 mb-4">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Chọn loại bài tập</span>
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Tạo bài tập mới</h2>
        <p className="text-muted-foreground max-w-md mx-auto">Mỗi loại bài tập mang đến trải nghiệm học tập riêng biệt với công cụ phù hợp.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {types.map((type, index) => (
          <motion.div
            key={type.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
            onClick={() => onSelect(type.id)}
            className={cn(
              'group relative p-8 rounded-3xl cursor-pointer transition-all duration-500',
              'bg-card border border-border/50 hover:border-transparent',
              'hover:shadow-2xl hover:shadow-black/5',
              type.glowClass
            )}
          >
            {/* Gradient Background Overlay */}
            <div className={cn(
              'absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500',
              'bg-gradient-to-br from-white to-transparent dark:from-white/5',
              'pointer-events-none'
            )} />

            {/* Icon Container */}
            <div className={cn(
              'relative w-20 h-20 rounded-2xl mb-6 flex items-center justify-center',
              'bg-gradient-to-br shadow-lg',
              type.gradient
            )}>
              <div className="absolute inset-0 rounded-2xl bg-white/20" />
              <div className="relative text-white">
                {type.icon}
              </div>
              {/* Glow Effect */}
              <div className={cn(
                'absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-500',
                `bg-gradient-to-br ${type.gradient}`
              )} />
            </div>

            {/* Content */}
            <h3 className="relative text-2xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
              {type.title}
            </h3>
            <p className="relative text-sm text-muted-foreground font-medium mb-6">{type.description}</p>

            {/* Features */}
            <ul className="relative space-y-3">
              {type.features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3 text-sm text-muted-foreground/80">
                  <div className={cn('w-2 h-2 rounded-full', type.featureDot, 'shadow-sm')} />
                  {feature}
                </li>
              ))}
            </ul>

            {/* Arrow Indicator */}
            <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                'bg-gradient-to-br shadow-lg',
                type.gradient
              )}>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
