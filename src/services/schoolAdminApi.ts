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
    const response = await api.get('/students', { 
      params: {
        PageNumber: params?.pageNumber,
        PageSize: params?.pageSize,
        Search: params?.search,
      }
    });
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
    const response = await api.get('/teachers', { 
      params: {
        PageNumber: params?.pageNumber,
        PageSize: params?.pageSize,
        SearchTerm: params?.search,
      }
    });
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
    // Map UserId to id if needed
    if (data.userId && !data.id) {
      data.id = data.userId;
    }
    // Map schoolName from response
    if (data.schoolName !== undefined) {
      data.schoolName = data.schoolName;
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
    fullName: string;
    roleId: number; // 3 = Teacher, 4 = Student
    phone: string;
    gender: string;
    dateOfBirth: string;
    address: string;
  }): Promise<void> => {
    await api.post('/auth/create-user', {
      Email: data.email,
      RoleId: data.roleId,
      FullName: data.fullName.trim(),
      Phone: data.phone.trim(),
      Gender: data.gender.trim(),
      DateOfBirth: data.dateOfBirth.trim(),
      Address: data.address.trim(),
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
  enrolledStudents?: number;
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
  enrolledStudents?: number;
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

  getAvailableStudents: async (classId: number, page = 1, pageSize = 20): Promise<any> => {
    const response = await api.get(`/classes/${classId}/available-students`, {
      params: { page, pageSize }
    });
    return response.data.data;
  },

  removeStudent: async (classId: number, studentId: number): Promise<void> => {
    await api.delete(`/classes/${classId}/students/${studentId}`);
  },

  getAvailableTeachers: async (classId: number): Promise<any> => {
    const response = await api.get(`/classes/${classId}/available-teachers`);
    return response.data;
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
  status?: number | string;
  createdAt: string;
  updatedAt?: string;
}

export interface SchoolsListResponse {
  items: School[];
  total: number;
  page: number;
  pageSize: number;
}

export const schoolsApi = {
  getAll: async (params?: {
    pageNumber?: number;
    pageSize?: number;
    search?: string;
    status?: string;
  }): Promise<SchoolsListResponse> => {
    const response = await api.get('/schools', { params });
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
    status?: number;
  }): Promise<void> => {
    await api.put(`/schools/${id}`, data);
  },

  toggleLock: async (id: number): Promise<{ status: number }> => {
    const response = await api.post(`/schools/${id}/toggle-lock`);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/schools/${id}`);
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

// ==========================================
// Schedule API
// ==========================================
export interface ScheduleCalendarItem {
  id: number | string;
  title: string;
  start: string;
  end: string;
  classCode: string;
  className: string;
  color: string;
}

export interface ScheduleConflictInfo {
  studentId: number;
  studentName: string;
  studentEmail: string;
  conflictingClassId: number;
  conflictingClassCode: string;
  conflictingClassName: string;
  conflictingStartTime: string;
  conflictingEndTime: string;
}

export interface TeacherConflictInfo {
  conflictingClassId: number;
  conflictingClassCode: string;
  conflictingStartTime: string;
  conflictingEndTime: string;
}

export interface CreateScheduleResponse {
  success: boolean;
  schedule: ScheduleResponse;
  conflicts: ScheduleConflictInfo[];
  teacherConflicts: TeacherConflictInfo[];
  message: string;
}

export interface ScheduleResponse {
  id: number;
  classId: number;
  classCode: string;
  className: string;
  startTime: string;
  endTime: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateScheduleRequest {
  classId: number;
  startTime: string;
  endTime: string;
}

export interface UpdateScheduleRequest {
  id?: number;
  startTime?: string;
  endTime?: string;
}

export interface Room {
  id: number;
  roomCode: string;
  roomName: string;
  building?: string;
  floor?: number;
  capacity: number;
  hasProjector: boolean;
  hasAirConditioner: boolean;
  status: string;
}

export const scheduleApi = {
  getMySchedule: async (params?: {
    classId?: number;
    fromDate?: string;
    toDate?: string;
  }): Promise<ScheduleCalendarItem[]> => {
    const response = await api.get('/schedules/my-schedule', { params });
    return response.data.data || [];
  },

  getByClassId: async (classId: number, fromDate?: string, toDate?: string): Promise<ScheduleResponse[]> => {
    const params: Record<string, string> = {};
    if (fromDate) params.FromDate = fromDate;
    if (toDate) params.ToDate = toDate;
    const response = await api.get(`/schedules/class/${classId}`, { params });
    const data = response.data.data;
    // Convert to ScheduleResponse format
    return (data || []).map((s: any) => ({
      id: s.id,
      classId: classId,
      startTime: s.start,
      endTime: s.end,
      classCode: s.classCode,
      className: s.className,
      color: s.color,
    }));
  },

  create: async (data: CreateScheduleRequest): Promise<CreateScheduleResponse> => {
    const response = await api.post('/schedules', data);
    return response.data.data;
  },

  update: async (id: number, data: UpdateScheduleRequest): Promise<ScheduleResponse> => {
    const response = await api.put(`/schedules/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/schedules/${id}`);
  },

  getRooms: async (): Promise<Room[]> => {
    const response = await api.get('/rooms');
    return response.data.data || [];
  },
};

// ==========================================
// Payments API
// ==========================================
export interface PaymentPackage {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  tokenAmount: number;
  studentLimit: number;
  isActive: boolean;
  isFeatured: boolean;
  features?: string;
  displayOrder?: number;
  sortOrder?: number;
  expiresAt: string;
}

export interface CreatePaymentResponse {
  success: boolean;
  checkoutUrl?: string;
  paymentLinkId?: string;
  transactionId?: string;
  errorMessage?: string;
}

export interface Payment {
  id: number;
  transactionId: string;
  packageId: number;
  packageName: string;
  tokenAmount: number;
  amount: number;
  currency: string;
  status: string;
  method: string;
  paidAt?: string;
  expiresAt?: string;
  paymentGateway?: string;
  gatewayTransactionId?: string;
  createdAt: string;
}

export interface PaymentListResponse {
  items: Payment[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TokenBalance {
  schoolId: number;
  schoolName: string;
  totalTokensPurchased: number;
  tokensRemaining: number;
  tokensDistributed: number;
  tokensUsed: number;
  expiresAt?: string;
  lastPurchaseAt?: string;
}

export interface TokenTransaction {
  id: number;
  schoolId: number;
  paymentId: number;
  type: string;
  quantity: number;
  balanceAfter: number;
  description?: string;
  createdAt: string;
}

export interface PayOSCheckoutResponse {
  paymentId: number;
  transactionId: string;
  checkoutUrl: string;
  paymentLinkId: string;
  amount: number;
  currency: string;
  status: string;
  expiresAt?: string;
}

export interface TokenAllocation {
  id: number;
  schoolId: number;
  userId: number;
  userName: string;
  userEmail: string;
  userRole: string;
  allocatedTokens: number;
  usedTokens: number;
  remainingTokens: number;
  expiresAt?: string;
  notes?: string;
  allocatedByUserId: number;
  allocatedByUserName: string;
  createdAt: string;
}

export interface UserTokenInfo {
  userId: number;
  userName: string;
  email: string;
  role: string;
  allocatedTokens: number;
  usedTokens: number;
  remainingTokens: number;
  expiresAt?: string;
}

export const paymentsApi = {
  getPackages: async (): Promise<PaymentPackage[]> => {
    const response = await api.get('/payments/packages');
    return response.data.data || [];
  },

  createPayment: async (packageId: number, method: string = 'PayOS'): Promise<CreatePaymentResponse> => {
    const response = await api.post('/payments', { packageId, method });
    return response.data.data;
  },

  getPayments: async (page: number = 1, pageSize: number = 10): Promise<PaymentListResponse> => {
    const response = await api.get('/payments', { params: { page, pageSize } });
    return response.data.data;
  },

  getBalance: async (): Promise<TokenBalance> => {
    const response = await api.get('/payments/balance');
    return response.data.data;
  },

  getTransactions: async (page: number = 1, pageSize: number = 20): Promise<{
    items: TokenTransaction[];
    total: number;
    page: number;
    pageSize: number;
  }> => {
    const response = await api.get('/payments/transactions', { params: { page, pageSize } });
    return response.data.data;
  },

  paymentCallback: async (data: { transactionId: string; status: string; gatewayTransactionId?: string }): Promise<void> => {
    await api.post('/payments/callback', data);
  },

  useTokens: async (amount: number, description: string): Promise<void> => {
    await api.post('/payments/use', { amount, description });
  },

  // Token Allocation APIs
  getAllocations: async (page: number = 1, pageSize: number = 20): Promise<{
    items: TokenAllocation[];
    total: number;
    page: number;
    pageSize: number;
  }> => {
    const response = await api.get('/payments/allocations', { params: { page, pageSize } });
    return response.data.data;
  },

  allocateTokens: async (data: {
    userId: number;
    tokens: number;
    expiresAt?: string;
    notes?: string;
  }): Promise<{
    allocationId: number;
    userId: number;
    userName: string;
    tokensAllocated: number;
    schoolTokensRemaining: number;
    expiresAt?: string;
  }> => {
    const response = await api.post('/payments/allocate', data);
    return response.data.data;
  },

  revokeAllocation: async (allocationId: number): Promise<void> => {
    await api.delete(`/payments/allocations/${allocationId}`);
  },

  getUsersWithTokens: async (): Promise<UserTokenInfo[]> => {
    const response = await api.get('/payments/users-with-tokens');
    return response.data.data || [];
  },

  distributeTokens: async (data: {
    userId: number;
    tokens: number;
    notes?: string;
  }): Promise<{
    success: boolean;
    allocationId: number;
    userId: number;
    userName: string;
    tokensAllocated: number;
    schoolTokensRemaining: number;
    expiresAt?: string;
    errorMessage?: string;
  }> => {
    const response = await api.post('/payments/allocate', data);
    return response.data.data;
  },

  getAllPackagesForAdmin: async (includeInactive: boolean = false): Promise<PaymentPackage[]> => {
    const response = await api.get('/payments/admin/packages', { params: { includeInactive } });
    return response.data.data || [];
  },

  // Bulk Allocation
  bulkAllocate: async (data: {
    studentTokens: number;
    teacherTokens: number;
    expiresAt?: string;
    notes?: string;
  }): Promise<{
    success: boolean;
    totalUsers: number;
    successCount: number;
    failedCount: number;
    totalTokensAllocated: number;
    schoolTokensRemaining: number;
    results: Array<{
      userId: number;
      userName: string;
      role: string;
      success: boolean;
      errorMessage?: string;
      tokensAllocated: number;
    }>;
    errorMessage?: string;
  }> => {
    const response = await api.post('/payments/bulk-allocate', data);
    return response.data.data;
  },
};
