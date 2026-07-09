import { api } from './api';

// ==========================================
// Students API (dành cho SchoolAdmin)
// ==========================================
export interface StudentProfile {
  id: number;
  email: string;
  fullName: string;
  avatar?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  role: string;
  roleId?: number;
  schoolId?: number;
  schoolName?: string;
  isActive: boolean;
  isEmailVerified?: boolean;
  totalEnrolledClasses?: number;
  certificatesEarned?: number;
  averageScore?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface StudentsListResponse {
  items: StudentProfile[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LearningProgress {
  studentId: number;
  studentName: string;
  totalEnrolledClasses: number;
  completedClasses: number;
  inProgressClasses: number;
  totalAssignments: number;
  completedAssignments: number;
  assignmentsCompletionRate: number;
  averageScore: number | null;
  certificatesEarned: number;
}

export const studentsApi = {
  getAll: async (params?: {
    pageNumber?: number;
    pageSize?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<StudentsListResponse> => {
    const response = await api.get('/students', { params });
    // Handle nested data structure: response.data.data.data or response.data.data.items
    const nestedData = response.data.data;
    const result = nestedData?.data || nestedData?.items || nestedData || response.data;
    const items = Array.isArray(result) ? result : [];
    const total = nestedData?.total ?? nestedData?.totalCount ?? items.length;

    return {
      items,
      total,
      page: nestedData?.pageNumber || 1,
      pageSize: nestedData?.pageSize || 10,
    };
  },

  getById: async (id: number): Promise<StudentProfile> => {
    const response = await api.get(`/students/${id}`);
    const data = response.data.data || response.data;
    // Map userId to id if needed
    if (data.userId && !data.id) {
      data.id = data.userId;
    }
    return data;
  },

  create: async (data: {
    email: string;
    password: string;
    fullName?: string;
    phone?: string;
    gender?: string;
    dateOfBirth?: string;
    address?: string;
    isActive?: boolean;
  }): Promise<number> => {
    const response = await api.post('/students', data);
    return response.data.data.id;
  },

  createBulk: async (students: Array<{
    email: string;
    fullName: string;
    phone?: string;
    gender?: string;
    dateOfBirth?: string;
    address?: string;
  }>) => {
    return api.post('/students/bulk', { students });
  },

  update: async (id: number, data: {
    fullName?: string;
    phone?: string;
    avatar?: string;
    gender?: string;
    dateOfBirth?: string;
    address?: string;
    isActive?: boolean;
  }): Promise<void> => {
    console.log('Update student payload:', { id, data });
    await api.put(`/students/${id}`, {
      id,
      fullName: data.fullName,
      phone: data.phone || undefined,
      avatar: data.avatar || undefined,
      gender: data.gender || undefined,
      dateOfBirth: data.dateOfBirth || undefined,
      address: data.address || undefined,
      isActive: data.isActive,
    });
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/students/${id}`);
  },

  getLearningProgress: async (studentId: number): Promise<LearningProgress> => {
    const response = await api.get(`/students/${studentId}/learning-progress`);
    return response.data.data;
  },
};

// ==========================================
// Teachers API (dành cho SchoolAdmin)
// ==========================================
export interface TeacherProfile {
  id: number;
  email: string;
  fullName: string;
  avatar?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  role: string;
  roleId?: number;
  roleName?: string;
  schoolId?: number;
  schoolName?: string;
  isActive: boolean;
  isEmailVerified?: boolean;
  assignedClassesCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface TeachersListResponse {
  items: TeacherProfile[];
  total: number;
  page: number;
  pageSize: number;
}

export const teachersApi = {
  getAll: async (params?: {
    pageNumber?: number;
    pageSize?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<TeachersListResponse> => {
    const response = await api.get('/teachers', { params });
    const nestedData = response.data.data;
    const result = nestedData?.data || nestedData?.items || nestedData || response.data;
    const items = Array.isArray(result) ? result : [];
    const total = nestedData?.total ?? nestedData?.totalCount ?? items.length;

    return {
      items,
      total,
      page: nestedData?.pageNumber || 1,
      pageSize: nestedData?.pageSize || 10,
    };
  },

  getById: async (id: number): Promise<TeacherProfile> => {
    const response = await api.get(`/teachers/${id}`);
    const data = response.data.data || response.data;
    // Map userId to id if needed
    if (data.userId && !data.id) {
      data.id = data.userId;
    }
    return data;
  },

  update: async (id: number, data: {
    fullName?: string;
    phone?: string;
    avatar?: string;
    gender?: string;
    dateOfBirth?: string;
    address?: string;
    isActive?: boolean;
  }): Promise<void> => {
    await api.put(`/teachers/${id}`, { ...data, id });
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/teachers/${id}`);
  },
};

// ==========================================
// Login History API (dành cho SchoolAdmin)
// ==========================================
export interface LoginHistory {
  id: number;
  userId: number;
  userName?: string;
  userEmail?: string;
  loginTime: string;
  logoutTime?: string;
  ipAddress?: string;
  location?: string;
  userAgent?: string;
  loginStatus?: 'Success' | 'Failed';
  failureReason?: string;
}

export interface LoginHistoryResponse {
  items: LoginHistory[];
  total: number;
  page: number;
  pageSize: number;
}

export const loginHistoryApi = {
  getByUserId: async (params?: {
    pageNumber?: number;
    pageSize?: number;
    userId?: number | null;
    startDate?: string;
    endDate?: string;
  }): Promise<LoginHistoryResponse> => {
    const response = await api.post('/login-history/get-histories', params || {});
    const data = response.data.data as {
      data: LoginHistory[];
      total: number;
    };

    return {
      items: data.data || [],
      total: data.total,
      page: params?.pageNumber || 1,
      pageSize: params?.pageSize || 20,
    };
  },
};

// ==========================================
// Auth API cho SchoolAdmin (Tạo User)
// ==========================================
export const schoolAuthApi = {
  createUser: async (data: {
    email: string;
    password?: string;
    fullName?: string;
    roleId: number; // 3 = Teacher, 4 = Student
    phone?: string;
    gender?: string;
    dateOfBirth?: string;
    address?: string;
  }): Promise<void> => {
    await api.post('/auth/create-user', {
      email: data.email,
      password: data.password || 'TempPassword123',
      roleId: data.roleId,
      fullName: data.fullName?.trim() || undefined,
      phone: data.phone?.trim() || undefined,
    });
  },
};

// ==========================================
// Courses API (dành cho SchoolAdmin)
// ==========================================
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
    searchTerm?: string;
    schoolId?: number;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<CoursesListResponse> => {
    const response = await api.get('/courses', { params });
    const nestedData = response.data.data;
    const result = nestedData?.data || nestedData?.items || nestedData || response.data;
    const rawItems = Array.isArray(result) ? result : [];
    const total = nestedData?.total ?? nestedData?.totalCount ?? rawItems.length;

    return {
      items: rawItems.map((item: any) => ({
        ...item,
        title: item.title || item.name,
      })),
      total,
      page: nestedData?.pageNumber || 1,
      pageSize: nestedData?.pageSize || 10,
    };
  },

  getById: async (id: number): Promise<Course> => {
    const response = await api.get(`/courses/${id}`);
    const data = response.data.data;
    return {
      ...data,
      title: data.title || data.name,
    };
  },

  create: async (data: { title: string; description?: string }): Promise<number> => {
    const response = await api.post('/courses', { title: data.title, description: data.description });
    return response.data.data.id;
  },

  update: async (id: number, data: { title: string; description?: string }): Promise<void> => {
    await api.put(`/courses/${id}`, { title: data.title, description: data.description });
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/courses/${id}`);
  },
};

// ==========================================
// Classes API (dành cho SchoolAdmin)
// ==========================================
export interface ClassEntity {
  id: number;
  classCode: string;
  schoolId: number;
  schoolName?: string;
  courseId: number;
  courseName?: string;
  teacherId?: number;
  teacherName?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  studentCount: number;
  students?: { id: number; fullName: string; email: string; enrolledAt: string }[];
  availableStudents?: { id: number; fullName: string; email: string; phone?: string; gender?: string }[];
  schedules?: any[];
  announcements?: any[];
}

export interface ClassesListResponse {
  items: ClassEntity[];
  total: number;
  page: number;
  pageSize: number;
}

export const classesApi = {
  getAll: async (params?: {
    searchTerm?: string;
    courseId?: number;
    teacherId?: number;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<ClassesListResponse> => {
    const response = await api.get('/classes', { params });
    const nestedData = response.data.data;
    const result = nestedData?.data || nestedData?.items || nestedData || response.data;
    const items = Array.isArray(result) ? result : [];
    const total = nestedData?.total ?? nestedData?.totalCount ?? items.length;

    return {
      items,
      total,
      page: nestedData?.pageNumber || 1,
      pageSize: nestedData?.pageSize || 10,
    };
  },

  getById: async (id: number): Promise<ClassEntity> => {
    const response = await api.get(`/classes/${id}`);
    return response.data.data;
  },

  create: async (data: {
    classCode: string;
    courseId: number;
    teacherId: number;
    startDate: string;
    endDate: string;
  }): Promise<number> => {
    const response = await api.post('/classes', data);
    return response.data.data.id;
  },

  update: async (id: number, data: {
    classCode?: string;
    courseId?: number;
    teacherId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<void> => {
    await api.put(`/classes/${id}`, data);
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/classes/${id}`);
  },

  assignStudents: async (classId: number, studentIds: number[]): Promise<void> => {
    await api.post(`/classes/${classId}/assign-students`, { studentIds });
  },

  removeStudent: async (classId: number, studentId: number): Promise<void> => {
    await api.delete(`/classes/${classId}/students/${studentId}`);
  },
};

// ==========================================
// Schools API
// ==========================================
export interface School {
  id: number;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export const schoolsApi = {
  getById: async (id: number): Promise<School> => {
    const response = await api.get(`/schools/${id}`);
    return response.data.data;
  },

  update: async (id: number, data: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    description?: string;
  }): Promise<void> => {
    await api.put(`/schools/${id}`, data);
  },
};

// ==========================================
// Users API (Lấy danh sách users)
// ==========================================
export const usersApi = {
  getList: async (params?: {
    pageNumber?: number;
    pageSize?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  }): Promise<{
    items: Array<{
      id: number;
      email: string;
      fullName: string;
      role: string;
      isActive: boolean;
      createdAt: string;
    }>;
    total: number;
    page: number;
    pageSize: number;
  }> => {
    const response = await api.post('/users/get-list', params || {});
    return response.data.data;
  },
};
