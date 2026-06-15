import { motion } from 'framer-motion';
import { useUIStore } from '@/stores';
import { Icon } from './Icon';
import clsx from 'clsx';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useUIStore();
  const isDark = theme === 'dark';

  return (
    <button
      aria-label="Toggle theme"
      aria-pressed={isDark}
      onClick={toggleTheme}
      className={clsx('p-2 rounded-full hover:bg-white/5 transition-colors', className)}
    >
      <motion.div animate={{ rotate: isDark ? 40 : 0 }} transition={{ type: 'spring', stiffness: 300 }}>
        <Icon name={isDark ? 'Sun' : 'Moon'} />
      </motion.div>
    </button>
  );
}

export default ThemeToggle;
