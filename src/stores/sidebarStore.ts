import { create } from 'zustand';

interface SidebarStore {
  sidebarCollapsed: boolean;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  sidebarCollapsed: localStorage.getItem('ui:sidebarCollapsed') === 'true',
  sidebarOpen: false,
  
  toggleSidebar: () => set(s => {
    const newState = !s.sidebarCollapsed;
    try { localStorage.setItem('ui:sidebarCollapsed', String(newState)); } catch (e) {}
    return { sidebarCollapsed: newState };
  }),
  
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
}));
