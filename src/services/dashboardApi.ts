import { api, API_BASE_URL } from './api';

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
  phone?: string;
  avatar?: string;
  role: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  schoolId?: number;
  isActive: boolean;
  isEmailVerified?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
}

export interface UsersListResponse {
  items: UserProfile[];
  total: number;
  page: number;
  pageSize: number;
}

function unwrapApiData<T>(payload: unknown): T {
  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    (payload as { data?: unknown }).data !== undefined
  ) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}

function resolveFileUrl(value?: string | null) {
  if (!value) return undefined;

  if (/^(https?:|data:|blob:)/i.test(value)) {
    return value;
  }

  const assetBaseUrl = API_BASE_URL.replace(/\/api\/?$/i, '/');
  return new URL(value, assetBaseUrl).toString();
}

function normalizeUserProfile<T extends Partial<UserProfile> | undefined>(profile: T): T {
  if (!profile) return profile;

  return {
    ...profile,
    avatar: resolveFileUrl(profile.avatar),
  } as T;
}

export const usersApi = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get('/Users/profile');
    return normalizeUserProfile(unwrapApiData<UserProfile>(response.data));
  },
  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    const response = await api.put('/Users/profile', data);
    return normalizeUserProfile(unwrapApiData<UserProfile>(response.data));
  },
  uploadAvatar: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/Users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const data = unwrapApiData<
      | string
      | {
          avatarUrl?: string;
          avatar?: string;
          url?: string;
        }
      | undefined
    >(response.data);

    const avatarUrl =
      typeof data === 'string' ? data : data?.avatarUrl ?? data?.avatar ?? data?.url;

    return resolveFileUrl(avatarUrl) ?? '';
  },
  getList: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    role?: string;
  }): Promise<UsersListResponse> => {
    const response = await api.get('/Users', {
      params: {
        PageNumber: params?.page,
        PageSize: params?.pageSize,
        SearchTerm: params?.search,
        RoleId: params?.role,
      },
    });
    return unwrapApiData<UsersListResponse>(response.data);
  },
  getById: async (id: number): Promise<UserProfile> => {
    const response = await api.get(`/Users/${id}`);
    return normalizeUserProfile(unwrapApiData<UserProfile>(response.data));
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
  classCode?: string;
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

export interface MyClassesResponse {
  items: ClassEntity[];
  total: number;
}

export interface MyClassesParams {
  searchTerm?: string;
  courseId?: number;
}

function normalizeClassesResponse(payload: unknown): MyClassesResponse {
  const data = unwrapApiData<unknown>(payload);

  if (Array.isArray(data)) {
    return {
      items: data as ClassEntity[],
      total: data.length,
    };
  }

  if (data && typeof data === 'object') {
    const response = data as {
      items?: ClassEntity[];
      Items?: ClassEntity[];
      data?: ClassEntity[];
      Data?: ClassEntity[];
      classes?: ClassEntity[];
      Classes?: ClassEntity[];
      total?: number;
      Total?: number;
      totalCount?: number;
      TotalCount?: number;
    };
    const items =
      response.items ??
      response.Items ??
      response.data ??
      response.Data ??
      response.classes ??
      response.Classes ??
      [];

    return {
      items,
      total:
        response.total ??
        response.Total ??
        response.totalCount ??
        response.TotalCount ??
        items.length,
    };
  }

  return {
    items: [],
    total: 0,
  };
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
  getMyClasses: async (
    userId: number,
    params?: MyClassesParams
  ): Promise<MyClassesResponse> => {
    const numericUserId = Number(userId);

    if (!Number.isFinite(numericUserId) || numericUserId <= 0) {
      throw new Error('Missing user id for my classes request');
    }

    const queryParams: Record<string, string | number> = {};

    if (params?.searchTerm) {
      queryParams.SearchTerm = params.searchTerm;
    }

    if (params?.courseId) {
      queryParams.CourseId = params.courseId;
    }

    const response = await api.get(
      `/Classes/my-classes/${numericUserId}`,
      Object.keys(queryParams).length ? { params: queryParams } : undefined
    );

    return normalizeClassesResponse(response.data);
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

// Assignments API
export interface AssignmentEntity {
  id: number;
  classId: number;
  classCode: string;
  courseId: number;
  courseTitle: string;
  teacherId: number;
  teacherName: string;
  schoolId: number;
  schoolName: string;
  title: string;
  submissionCount: number;
  metricCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentsListResponse {
  items: AssignmentEntity[];
  total: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface AssignmentsListParams {
  searchTerm?: string;
  classId?: number;
  courseId?: number;
  studentId?: number;
  pageNumber?: number;
  pageSize?: number;
}

export interface CreateAssignmentRequest {
  classId: number;
  title: string;
}

export type UpdateAssignmentRequest = CreateAssignmentRequest;

function normalizeAssignmentResponse(payload: unknown): AssignmentEntity {
  return unwrapApiData<AssignmentEntity>(payload);
}

function normalizeAssignmentsResponse(payload: unknown): AssignmentsListResponse {
  const data = unwrapApiData<unknown>(payload);

  if (Array.isArray(data)) {
    return {
      items: data as AssignmentEntity[],
      total: data.length,
      pageNumber: 1,
      pageSize: data.length,
      totalPages: data.length ? 1 : 0,
    };
  }

  if (data && typeof data === 'object') {
    const response = data as {
      items?: AssignmentEntity[];
      Items?: AssignmentEntity[];
      total?: number;
      Total?: number;
      totalCount?: number;
      TotalCount?: number;
      pageNumber?: number;
      PageNumber?: number;
      pageSize?: number;
      PageSize?: number;
      totalPages?: number;
      TotalPages?: number;
    };
    const items = response.items ?? response.Items ?? [];

    return {
      items,
      total:
        response.total ??
        response.Total ??
        response.totalCount ??
        response.TotalCount ??
        items.length,
      pageNumber: response.pageNumber ?? response.PageNumber ?? 1,
      pageSize: response.pageSize ?? response.PageSize ?? items.length,
      totalPages: response.totalPages ?? response.TotalPages ?? 0,
    };
  }

  return {
    items: [],
    total: 0,
    pageNumber: 1,
    pageSize: 0,
    totalPages: 0,
  };
}

function buildAssignmentsParams(params?: AssignmentsListParams) {
  if (!params) return undefined;

  const queryParams: Record<string, string | number> = {};

  if (params.searchTerm?.trim()) {
    queryParams.SearchTerm = params.searchTerm.trim();
  }

  if (params.classId) {
    queryParams.ClassId = params.classId;
  }

  if (params.courseId) {
    queryParams.CourseId = params.courseId;
  }

  if (params.studentId) {
    queryParams.StudentId = params.studentId;
  }

  if (params.pageNumber) {
    queryParams.PageNumber = params.pageNumber;
  }

  if (params.pageSize) {
    queryParams.PageSize = params.pageSize;
  }

  return Object.keys(queryParams).length ? queryParams : undefined;
}

export const assignmentsApi = {
  getAll: async (params?: AssignmentsListParams): Promise<AssignmentsListResponse> => {
    const queryParams = buildAssignmentsParams(params);
    const response = await api.get(
      '/Assignments',
      queryParams ? { params: queryParams } : undefined
    );
    return normalizeAssignmentsResponse(response.data);
  },
  getById: async (id: number): Promise<AssignmentEntity> => {
    const response = await api.get(`/Assignments/${id}`);
    return normalizeAssignmentResponse(response.data);
  },
  create: async (data: CreateAssignmentRequest): Promise<AssignmentEntity> => {
    const response = await api.post('/Assignments', data);
    return normalizeAssignmentResponse(response.data);
  },
  update: async (
    id: number,
    data: UpdateAssignmentRequest
  ): Promise<AssignmentEntity> => {
    const response = await api.put(`/Assignments/${id}`, data);
    return normalizeAssignmentResponse(response.data);
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/Assignments/${id}`);
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
