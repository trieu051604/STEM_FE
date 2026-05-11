// ============ AUTH TYPES ============
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

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  schoolId?: string;
}
