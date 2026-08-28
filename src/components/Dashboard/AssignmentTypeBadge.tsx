import React from 'react';
import { cn } from '@/lib/utils';
import { AssignmentEntity } from '@/services/dashboardApi';
import { CheckSquare, FileText, Cpu, GraduationCap } from 'lucide-react';

interface AssignmentTypeBadgeProps {
  type?: AssignmentEntity['assignment_type'];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AssignmentTypeBadge: React.FC<AssignmentTypeBadgeProps> = ({ 
  type, 
  className,
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-3 py-1 text-xs gap-1.5',
    lg: 'px-4 py-1.5 text-sm gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  switch (type) {
    case 'quiz':
      return (
        <div
          className={cn(
            'inline-flex items-center rounded-lg font-semibold',
            'bg-gradient-to-r from-blue-500/15 to-cyan-500/15 text-blue-600 dark:text-blue-400',
            'border border-blue-500/25 shadow-sm shadow-blue-500/10',
            'transition-all duration-200 hover:shadow-md hover:shadow-blue-500/20',
            sizeClasses[size],
            className
          )}
        >
          <CheckSquare className={iconSizes[size]} />
          Quiz
        </div>
      );
    case 'text_report':
      return (
        <div
          className={cn(
            'inline-flex items-center rounded-lg font-semibold',
            'bg-gradient-to-r from-orange-500/15 to-amber-500/15 text-orange-600 dark:text-orange-400',
            'border border-orange-500/25 shadow-sm shadow-orange-500/10',
            'transition-all duration-200 hover:shadow-md hover:shadow-orange-500/20',
            sizeClasses[size],
            className
          )}
        >
          <FileText className={iconSizes[size]} />
          Báo cáo
        </div>
      );
    case 'practical_simulation':
      return (
        <div
          className={cn(
            'inline-flex items-center rounded-lg font-semibold',
            'bg-gradient-to-r from-purple-500/15 to-pink-500/15 text-purple-600 dark:text-purple-400',
            'border border-purple-500/25 shadow-sm shadow-purple-500/10',
            'transition-all duration-200 hover:shadow-md hover:shadow-purple-500/20',
            sizeClasses[size],
            className
          )}
        >
          <Cpu className={iconSizes[size]} />
          Thực hành
        </div>
      );
    default:
      return (
        <div
          className={cn(
            'inline-flex items-center rounded-lg font-semibold',
            'bg-muted text-muted-foreground border border-border',
            sizeClasses[size],
            className
          )}
        >
          <GraduationCap className={iconSizes[size]} />
          Bài tập
        </div>
      );
  }
};
