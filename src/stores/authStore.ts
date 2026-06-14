import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/services';

export type UserRole = 'master_admin' | 'school_admin' | 'teacher' | 'student';

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
  role: UserRole;
  schoolId?: string;
  isOnline?: boolean;
  createdAt: string;
}

// Mock users for demo
const MOCK_USERS: Record<string, User & { password: string }> = {
  'master@stem.edu': {
    id: '1', email: 'master@stem.edu', password: 'password',
    fullName: 'Nguyễn Văn Master', role: 'master_admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=master',
    isOnline: true, createdAt: '2024-01-01T00:00:00Z',
  },
  'admin@stem.edu': {
    id: '2', email: 'admin@stem.edu', password: 'password',
    fullName: 'Trần Thị Admin', role: 'school_admin', schoolId: 'school-1',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    isOnline: true, createdAt: '2024-01-01T00:00:00Z',
  },
  'teacher@stem.edu': {
    id: '3', email: 'teacher@stem.edu', password: 'password',
    fullName: 'Lê Văn Giáo', role: 'teacher', schoolId: 'school-1',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher',
    isOnline: true, createdAt: '2024-01-01T00:00:00Z',
  },
  'student@stem.edu': {
    id: '4', email: 'student@stem.edu', password: 'password',
    fullName: 'Phạm Thị Học', role: 'student', schoolId: 'school-1',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student',
    isOnline: true, createdAt: '2024-01-01T00:00:00Z',
  },
};

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { user, token } = response.data.data || response.data;
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (err: any) {
          set({ isLoading: false });
          throw new Error(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.');
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (partial) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...partial } });
      },
    }),
    { name: 'stem-auth' }
  )
);

export const useCurrentRole = (): UserRole | null => {
  return useAuthStore(s => s.user?.role ?? null);
};

export const useCurrentUser = (): User | null => {
  return useAuthStore(s => s.user);
};
