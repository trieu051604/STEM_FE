// ============ COMMON / SHARED TYPES ============
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'assignment' | 'grade' | 'simulation';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt?: string;
  progress?: number;
  maxProgress?: number;
}

export interface School {
  id: string;
  name: string;
  address: string;
  logo?: string;
  adminId: string;
  teacherCount: number;
  studentCount: number;
  courseCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface Teacher {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  avatar?: string;
  schoolId: string;
  subjects: string[];
  classCount: number;
  studentCount: number;
  isOnline: boolean;
}

export interface Student {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  avatar?: string;
  schoolId: string;
  grade: string;
  gpa: number;
  completedCourses: number;
  badges: Badge[];
  isOnline: boolean;
}

export type SortOrder = 'asc' | 'desc';

export interface TableSort {
  field: string;
  order: SortOrder;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface KPICard {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: string;
  color: 'brand' | 'accent' | 'success' | 'warning' | 'danger';
}
