import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TeacherPageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const TeacherPageHeader = ({ title, description, action, className }: TeacherPageHeaderProps) => {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6", className)}>
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex shrink-0">
          {action}
        </div>
      )}
    </div>
  );
};
