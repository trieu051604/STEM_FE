import { create } from 'zustand';
import type { Notification } from '@/types';

// Mock notifications
const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', userId: 'any', title: 'Bài tập mới', message: 'Thầy Lê đã giao bài tập Vật lý Chương 3', type: 'assignment', isRead: false, createdAt: new Date(Date.now() - 300000).toISOString() },
  { id: '2', userId: 'any', title: 'Điểm bài kiểm tra', message: 'Bài Quiz Hóa học của bạn đã được chấm: 9.5/10', type: 'grade', isRead: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: '3', userId: 'any', title: 'Phòng Lab mở', message: 'Lab Vật lý - Thí nghiệm sóng âm đã bắt đầu', type: 'simulation', isRead: true, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: '4', userId: 'any', title: 'Huy hiệu mới', message: 'Bạn đã đạt huy hiệu "Nhà Khoa học Xuất sắc"!', type: 'success', isRead: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
];

interface UIStore {
  sidebarCollapsed: boolean;
  notifications: Notification[];
  unreadCount: number;
  theme: 'dark' | 'light';

  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  addNotification: (n: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  notifications: MOCK_NOTIFICATIONS,
  unreadCount: MOCK_NOTIFICATIONS.filter(n => !n.isRead).length,
  theme: 'dark',

  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

  addNotification: (n) => set(s => ({
    notifications: [n, ...s.notifications],
    unreadCount: s.unreadCount + (n.isRead ? 0 : 1),
  })),

  markAsRead: (id) => set(s => ({
    notifications: s.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
    unreadCount: Math.max(0, s.unreadCount - 1),
  })),

  markAllAsRead: () => set(s => ({
    notifications: s.notifications.map(n => ({ ...n, isRead: true })),
    unreadCount: 0,
  })),

  toggleTheme: () => set(s => {
    const newTheme = s.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    return { theme: newTheme };
  }),
}));
