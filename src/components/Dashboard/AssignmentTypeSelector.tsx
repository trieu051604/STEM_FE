import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Cpu, CheckSquare } from 'lucide-react';
import { AssignmentEntity } from '@/services/dashboardApi';
import { cn } from '@/lib/utils';

interface AssignmentTypeSelectorProps {
  onSelect: (type: NonNullable<AssignmentEntity['assignment_type']>) => void;
}

const types = [
  {
    id: 'quiz' as const,
    title: '📝 Quiz',
    description: 'Trắc nghiệm',
    features: ['Chấm tự động', 'Hỗ trợ nhiều dạng câu hỏi', 'Xáo trộn ngẫu nhiên'],
    icon: <CheckSquare className="w-8 h-8 text-blue-500 mb-4" />,
    colorClass: 'hover:border-blue-300 hover:ring-4 hover:ring-blue-50',
    bgClass: 'bg-blue-50/50',
  },
  {
    id: 'text_report' as const,
    title: '📄 Báo cáo',
    description: 'Nộp file/video',
    features: ['Giáo viên chấm tay', 'Đính kèm Rubric', 'Hỗ trợ tải lên đa phương tiện'],
    icon: <FileText className="w-8 h-8 text-orange-500 mb-4" />,
    colorClass: 'hover:border-orange-300 hover:ring-4 hover:ring-orange-50',
    bgClass: 'bg-orange-50/50',
  },
  {
    id: 'practical_simulation' as const,
    title: '🔬 Thực hành mô phỏng',
    description: 'Sandbox linh kiện',
    features: ['Auto-check + chấm tay', 'Tích hợp mạch điện tử', 'Kịch bản kiểm thử linh hoạt'],
    icon: <Cpu className="w-8 h-8 text-purple-500 mb-4" />,
    colorClass: 'hover:border-purple-300 hover:ring-4 hover:ring-purple-50',
    bgClass: 'bg-purple-50/50',
  },
];

export const AssignmentTypeSelector: React.FC<AssignmentTypeSelectorProps> = ({ onSelect }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[#0f4c5c] mb-2">Chọn loại bài tập</h2>
        <p className="text-slate-500">Mỗi loại bài tập sẽ có một giao diện thiết lập riêng phù hợp.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {types.map((type, index) => (
          <motion.div
            key={type.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSelect(type.id)}
            className={cn(
              'relative p-6 rounded-3xl border border-slate-200 cursor-pointer transition-all bg-white shadow-sm',
              type.colorClass
            )}
          >
            <div className={cn('p-4 rounded-2xl w-fit mb-4', type.bgClass)}>
              {type.icon}
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 mb-1">{type.title}</h3>
            <p className="text-slate-500 text-sm font-medium mb-4">{type.description}</p>
            
            <ul className="space-y-2">
              {type.features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  {feature}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
