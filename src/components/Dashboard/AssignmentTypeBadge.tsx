import React from 'react';
import { cn } from '@/lib/utils';
import { AssignmentEntity } from '@/services/dashboardApi';

interface AssignmentTypeBadgeProps {
  type?: AssignmentEntity['assignment_type'];
  className?: string;
}

export const AssignmentTypeBadge: React.FC<AssignmentTypeBadgeProps> = ({ type, className }) => {
  switch (type) {
    case 'quiz':
      return (
        <div
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/50',
            className
          )}
        >
          <span>📝</span> Quiz
        </div>
      );
    case 'text_report':
      return (
        <div
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200/50',
            className
          )}
        >
          <span>📄</span> Báo cáo
        </div>
      );
    case 'practical_simulation':
      return (
        <div
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/50',
            className
          )}
        >
          <span>🔬</span> Thực hành mô phỏng
        </div>
      );
    default:
      return (
        <div
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/50',
            className
          )}
        >
          Bài tập
        </div>
      );
  }
};
