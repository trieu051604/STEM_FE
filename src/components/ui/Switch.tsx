import * as React from 'react';

interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked: controlledChecked, defaultChecked, onCheckedChange, disabled, className = '' }, ref) => {
    const isControlled = controlledChecked !== undefined;
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked || false);
    const isChecked = isControlled ? controlledChecked : internalChecked;

    const handleClick = () => {
      if (!disabled) {
        const newValue = !isChecked;
        if (!isControlled) {
          setInternalChecked(newValue);
        }
        onCheckedChange?.(newValue);
      }
    };

    return (
      <button
        type="button"
        role="switch"
        aria-checked={isChecked}
        disabled={disabled}
        ref={ref}
        onClick={handleClick}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full
          transition-colors duration-200 ease-in-out
          focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-50
          ${isChecked ? 'bg-brand-600' : 'bg-muted'}
          ${className}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white shadow-lg
            transition-transform duration-200 ease-in-out
            ${isChecked ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    );
  }
);

Switch.displayName = 'Switch';
