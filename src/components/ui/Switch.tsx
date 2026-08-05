import * as React from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, onCheckedChange, ...props }, ref) => {
    return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          ref={ref}
          className="sr-only peer"
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          {...props}
        />
        <div
          className={cn(
            'peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ring/25 relative w-11 h-6 bg-muted rounded-full transition-colors',
            'peer-checked:bg-primary',
            className
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 left-0.5 bg-background rounded-full h-5 w-5 transition-transform',
              'peer-checked:translate-x-5'
            )}
          />
        </div>
      </label>
    );
  }
);
Switch.displayName = 'Switch';

export { Switch };
