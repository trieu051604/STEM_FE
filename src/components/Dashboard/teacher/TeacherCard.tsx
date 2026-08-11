import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TeacherCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
  noPadding?: boolean;
}

export const TeacherCard = ({ title, children, className, headerAction, noPadding = false }: TeacherCardProps) => {
  return (
    <div className={cn("bg-card rounded-xl border border-border overflow-hidden", className)}>
      {(title || headerAction) && (
        <div className="flex items-center justify-between p-6 border-b border-border">
          {title && <h3 className="font-semibold text-foreground">{title}</h3>}
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={cn(noPadding ? "" : "p-6")}>
        {children}
      </div>
    </div>
  );
};
