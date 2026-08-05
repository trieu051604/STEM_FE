import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, LoginResponse } from '@/services/authApi';
import { encodeData, decodeData } from '@/utils/crypto';

export type UserRole = 'master_admin' | 'school_admin' | 'teacher' | 'student';

export interface User {
  id: number;
  email: string;
  fullName: string;
  avatar?: string;
  role: UserRole;
  schoolId?: number;
  isOnline?: boolean;
  createdAt: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Email/Password login (School Admin)
  login: (email: string, password: string) => Promise<void>;

  // Google OAuth login (Student, Teacher)
  googleLogin: (idToken: string) => Promise<void>;

  // Auto-login from stored session
  autoLogin: () => Promise<void>;

  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

// Map role từ BE sang FE (theo RoleNames)
const mapRole = (role: string): UserRole => {
  const roleMap: Record<string, UserRole> = {
    'Master Administrator': 'master_admin',
    'School Administrator': 'school_admin',
    'Teacher': 'teacher',
    'Student': 'student',
  };
  return roleMap[role] || 'student';
};

const mapResponseToUser = (data: LoginResponse): User => {
  return {
    id: data.id,
    email: data.email,
    fullName: data.fullName,
    role: mapRole(data.role),
    schoolId: data.schoolId,
    createdAt: new Date().toISOString(),
  };
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const data = await authApi.login(email, password);
          const user = mapResponseToUser(data);
          set({
            user,
            token: data.token,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (err: any) {
          set({ isLoading: false });
          const message = err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.';
          throw new Error(message);
        }
      },

      googleLogin: async (idToken: string) => {
        set({ isLoading: true });
        try {
          const data = await authApi.googleLogin(idToken);
          const user = mapResponseToUser(data);
          set({
            user,
            token: data.token,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (err: any) {
          set({ isLoading: false });
          const message = err.response?.data?.message ||
            err.message ||
            'Đăng nhập Google thất bại. Vui lòng thử lại.';
          throw new Error(message);
        }
      },

      autoLogin: async () => {
        const { token, refreshToken } = get();
        if (!token) return;

        set({ isLoading: true });
        try {
          const data = await authApi.refreshToken(refreshToken || token);
          const updatedUser = mapResponseToUser(data);
          set({
            user: updatedUser,
            token: data.token,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false
          });
        } catch {
          get().logout();
        }
      },

      logout: () => {
        // Clear all sensitive data
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false
        });
      },

      updateUser: (partial) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...partial } });
      },
    }),
    {
      name: 'stem-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      // Add storage transformation for extra security
      storage: {
        getItem: (name) => {
          const value = localStorage.getItem(name);
          if (!value) return null;

          try {
            const parsed = JSON.parse(value);
            // Decode stored tokens if encoded
            if (parsed.state?.token && typeof parsed.state.token === 'string') {
              parsed.state.token = decodeData(parsed.state.token);
            }
            if (parsed.state?.refreshToken && typeof parsed.state.refreshToken === 'string') {
              parsed.state.refreshToken = decodeData(parsed.state.refreshToken);
            }
            return parsed;
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            const toStore = JSON.parse(JSON.stringify(value));
            // Encode tokens before storing to prevent casual viewing
            if (toStore.state?.token) {
              toStore.state.token = encodeData(toStore.state.token);
            }
            if (toStore.state?.refreshToken) {
              toStore.state.refreshToken = encodeData(toStore.state.refreshToken);
            }
            localStorage.setItem(name, JSON.stringify(toStore));
          } catch {
            localStorage.setItem(name, JSON.stringify(value));
          }
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);

// Helper hooks
export const useCurrentRole = (): UserRole | null => {
  return useAuthStore(s => s.user?.role ?? null);
};

export const useCurrentUser = (): User | null => {
  return useAuthStore(s => s.user);
};

export const useIsAuthenticated = (): boolean => {
  return useAuthStore(s => s.isAuthenticated);
};

export const useIsTeacher = (): boolean => {
  return useAuthStore(s => s.user?.role === 'teacher');
};

export const useIsStudent = (): boolean => {
  return useAuthStore(s => s.user?.role === 'student');
};

export const useIsSchoolAdmin = (): boolean => {
  return useAuthStore(s => s.user?.role === 'school_admin');
};

export const useIsMasterAdmin = (): boolean => {
  return useAuthStore(s => s.user?.role === 'master_admin');
};
