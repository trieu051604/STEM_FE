import { api } from './api';

export interface LoginResponse {
  id: number;
  token: string;
  refreshToken: string;
  email: string;
  fullName: string;
  role: string;
  schoolId?: number;
}

export interface GoogleLoginRequest {
  idToken: string;
}

export interface AuthResponse {
  success: boolean;
  data?: LoginResponse;
  message?: string;
}

export const authApi = {
  // Đăng nhập bằng email/password (chỉ School Admin)
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post('/Auth/login', { email, password });
    return response.data;
  },

  // Đăng nhập bằng Google (Student, Teacher)
  googleLogin: async (idToken: string): Promise<LoginResponse> => {
    const response = await api.post('/Auth/google-login', { idToken });
    return response.data;
  },

  // Refresh token
  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await api.post('/Auth/refresh', { refreshToken });
    return response.data;
  },

  // Đổi mật khẩu
  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    await api.put('/Auth/change-password', { oldPassword, newPassword });
  },

  // Quên mật khẩu
  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/Auth/forgot-password', { email });
  },

  // Verify email
  verifyEmail: async (email: string, token: string): Promise<void> => {
    await api.post('/auth/verify-email', { email, token });
  },

  // Đăng ký user mới (School Admin tạo)
  createUser: async (data: {
    email: string;
    fullName: string;
    role: 'teacher' | 'student';
  }): Promise<void> => {
    await api.post('/Auth/create-user', data);
  },
};
