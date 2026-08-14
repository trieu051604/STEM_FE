import { create } from 'zustand';

interface UIStore {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  theme: (localStorage.getItem('ui:theme') as 'dark' | 'light') || 'dark',

  toggleTheme: () => set(s => {
    const newTheme = s.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    try { localStorage.setItem('ui:theme', newTheme); } catch (e) {}
    return { theme: newTheme };
  }),
}));

// Initialize persisted values on load
(() => {
  try {
    const theme = (localStorage.getItem('ui:theme') as 'dark' | 'light') || 'dark';
    document.documentElement.classList.toggle('dark', theme === 'dark');
  } catch (e) {
    // ignore
  }
})();

