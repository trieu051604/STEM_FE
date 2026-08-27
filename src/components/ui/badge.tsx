import * as React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', ...props }, ref) => {
    const variantStyles = {
      default: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary text-secondary-foreground',
      outline: 'border border-border text-foreground',
      destructive: 'bg-destructive text-destructive-foreground',
    };

    return (
      <span
        ref={ref}
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${variantStyles[variant]} ${className}`}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };
