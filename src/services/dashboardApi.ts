import { api } from './api';

export interface DashboardStats {
  // Master Admin
  totalSchools?: number;
  pendingSchoolRequests?: number;
  totalUsers?: number;
  totalCourses?: number;
  
  // School Admin
  totalTeachers?: number;
  totalStudents?: number;
  totalClasses?: number;
  activeClasses?: number;
  
  // Teacher
  myClasses?: number;
  myStudents?: number;
  pendingAssignments?: number;
  
  // Student
  enrolledClasses?: number;
  completedLessons?: number;
  pendingSubmissions?: number;
}

export interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  user?: {
    name: string;
    avatar?: string;
  };
}

export const dashboardApi = {
  // Lấy thống kê dashboard
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats');
    return response.data.data;
  },

  // Lấy hoạt động gần đây
  getRecentActivity: async (limit = 10): Promise<RecentActivity[]> => {
    const response = await api.get('/dashboard/activity', {
      params: { limit },
    });
    return response.data.data;
  },
};

// Schools API
export interface School {
  id: number;
  name: string;
  address: string;
  representativeName?: string;
  representativeEmail?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

export const schoolsApi = {
  getAll: async (): Promise<School[]> => {
    const response = await api.get('/schools');
    return response.data.data;
  },
  getById: async (id: number): Promise<School> => {
    const response = await api.get(`/schools/${id}`);
    return response.data.data;
  },
  update: async (id: number, data: Partial<School>): Promise<void> => {
    await api.put(`/schools/${id}`, data);
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/schools/${id}`);
  },
};

// Users API
export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  avatar?: string;
  role: string;
  schoolId?: number;
  isActive: boolean;
  createdAt: string;
}

export interface UsersListResponse {
  items: UserProfile[];
  total: number;
  page: number;
  pageSize: number;
}

export const usersApi = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get('/users/profile');
    return response.data.data;
  },
  updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
    const response = await api.put('/users/profile', data);
    return response.data.data;
  },
  uploadAvatar: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data.avatarUrl;
  },
  getList: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    role?: string;
  }): Promise<UsersListResponse> => {
    const response = await api.get('/users', { params });
    return response.data.data;
  },
  getById: async (id: number): Promise<UserProfile> => {
    const response = await api.get(`/users/${id}`);
    return response.data.data;
  },
};

// Courses API
export interface Course {
  id: number;
  title: string;
  description?: string;
  schoolId: number;
  schoolName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CoursesListResponse {
  items: Course[];
  total: number;
  page: number;
  pageSize: number;
}

export const coursesApi = {
  getAll: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<CoursesListResponse> => {
    const response = await api.get('/courses', { params });
    return response.data.data;
  },
  getById: async (id: number): Promise<Course> => {
    const response = await api.get(`/courses/${id}`);
    return response.data.data;
  },
  create: async (data: Partial<Course>): Promise<number> => {
    const response = await api.post('/courses', data);
    return response.data.data.id;
  },
  update: async (id: number, data: Partial<Course>): Promise<void> => {
    await api.put(`/courses/${id}`, data);
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/courses/${id}`);
  },
};

// Classes API
export interface ClassEntity {
  id: number;
  name: string;
  description?: string;
  courseId: number;
  courseName?: string;
  teacherId?: number;
  teacherName?: string;
  schoolId: number;
  studentCount: number;
  createdAt: string;
}

export interface ClassesListResponse {
  items: ClassEntity[];
  total: number;
  page: number;
  pageSize: number;
}

export const classesApi = {
  getAll: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    courseId?: number;
  }): Promise<ClassesListResponse> => {
    const response = await api.get('/classes', { params });
    return response.data.data;
  },
  getById: async (id: number): Promise<ClassEntity> => {
    const response = await api.get(`/classes/${id}`);
    return response.data.data;
  },
  create: async (data: Partial<ClassEntity>): Promise<number> => {
    const response = await api.post('/classes', data);
    return response.data.data.id;
  },
  update: async (id: number, data: Partial<ClassEntity>): Promise<void> => {
    await api.put(`/classes/${id}`, data);
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/classes/${id}`);
  },
};

// School Requests API
export interface SchoolRequest {
  id: number;
  name: string;
  address: string;
  representativeName: string;
  representativeEmail: string;
  proofOfActivity?: string;
  createdAt: string;
  adminUser?: {
    id: number;
    email: string;
    fullName: string;
  };
}

export const schoolRequestsApi = {
  getPending: async (): Promise<SchoolRequest[]> => {
    const response = await api.get('/school-requests/pending');
    return response.data.data;
  },
  approve: async (schoolId: number): Promise<void> => {
    await api.post(`/school-requests/${schoolId}/approve`);
  },
  reject: async (schoolId: number): Promise<void> => {
    await api.post(`/school-requests/${schoolId}/reject`);
  },
};

// Notifications API
export interface Notification {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  items: Notification[];
  total: number;
  unreadCount: number;
}

export const notificationsApi = {
  getAll: async (params?: { page?: number; pageSize?: number }): Promise<NotificationsResponse> => {
    const response = await api.get('/notifications', { params });
    return response.data.data;
  },
  markAsRead: async (id: number): Promise<void> => {
    await api.put(`/notifications/${id}/read`);
  },
  markAllAsRead: async (): Promise<void> => {
    await api.put('/notifications/read-all');
  },
};
