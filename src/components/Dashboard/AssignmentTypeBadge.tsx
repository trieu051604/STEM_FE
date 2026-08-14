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
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20',
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
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20',
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
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20',
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
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border',
            className
          )}
        >
          Bài tập
        </div>
      );
  }
};
