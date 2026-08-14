import { api, API_BASE_URL } from './api';

export interface DashboardStats {
  // Master Admin
  totalSchools?: number;
  pendingSchoolRequests?: number;
  totalUsers?: number;
  totalCourses?: number;
  lockedSchools?: number;

  // School Admin
  totalTeachers?: number;
  totalStudents?: number;
  totalClasses?: number;
  activeClasses?: number;

  // Teacher
  myClasses?: number;
  myStudents?: number;
  pendingAssignments?: number;
  totalSubmissions?: number;
  gradedSubmissions?: number;

  // Student
  enrolledClasses?: number;
  completedLessons?: number;
  pendingSubmissions?: number;
  averageScore?: number;
  completedAssignments?: number;

  // Chart data - monthly enrollment trends (last 6 months)
  monthlyEnrollments?: { month: string; students: number }[];
  monthlyAssignments?: { month: string; assignments: number }[];
  studentPerformance?: { grade: string; count: number }[];

  // Role distribution
  roleDistribution?: { role: string; count: number }[];
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

export interface ChartData {
  enrollmentTrend?: { name: string; students: number }[];
  schoolsGrowth?: { name: string; schools: number }[];
  usersByRole?: { name: string; value: number }[];
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

  // Lấy dữ liệu biểu đồ
  getChartData: async (): Promise<ChartData> => {
    const response = await api.get('/dashboard/chart');
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
  status: 'Pending' | 'Approved' | 'Rejected' | 1 | 2;
  createdAt: string;
  representativePosition?: string;
  studentScale?: string;
  website?: string;
  notes?: string;
  phone?: string;
  usersCount?: number;
  membersCount?: number;
  users?: any[];
  attachmentUrl?: string;
  attachmentFileName?: string;
  originalAttachmentFileName?: string;
}

export interface SchoolsListResponse {
  items: School[];
  total: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export const schoolsApi = {
  getAll: async (params?: { pageNumber?: number; pageSize?: number; search?: string }): Promise<SchoolsListResponse> => {
    const response = await api.get('/schools', { params });
    return response.data.data;
  },
  getById: async (id: number): Promise<School> => {
    const response = await api.get(`/schools/${id}`);
    return response.data.data;
  },
  update: async (id: number, data: Partial<School>): Promise<void> => {
    await api.put(`/schools/${id}`, data);
  },
  toggleLock: async (id: number): Promise<{ status: number }> => {
    const response = await api.put(`/schools/${id}/toggle-lock`);
    return response.data;
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
  delete: async (id: number): Promise<void> => {
    await api.delete(`/Users/${id}`);
  },
};

// Courses API
export interface Course {
  id: number;
  name: string;
  title?: string; // alias for name
  description?: string;
  teacherId?: number;
  teacherName?: string;
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
    const raw = response.data.data as {
      totalCount: number;
      pageNumber: number;
      pageSize: number;
      totalPages: number;
      items: Course[];
    };

    return {
      items: raw.items.map((item) => ({ ...item, title: item.name })),
      total: raw.totalCount,
      page: raw.pageNumber,
      pageSize: raw.pageSize,
    };
  },
  getById: async (id: number): Promise<Course> => {
    const response = await api.get(`/courses/${id}`);
    return response.data.data;
  },
  create: async (data: { name: string; description?: string }): Promise<number> => {
    const response = await api.post('/courses', data);
    return response.data.data.id;
  },
  update: async (id: number, data: { name: string; description?: string }): Promise<void> => {
    await api.put(`/courses/${id}`, data);
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/courses/${id}`);
  },
};

// Classes API
export interface ClassStudentEntry {
  id: number;
  fullName: string;
  email: string;
  enrolledAt: string;
}

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
  startDate?: string;
  endDate?: string;
  createdAt: string;
  virtualLabs?: any[];
  // Chỉ có trong response của getById (GetClassDetailHandler), không có trong getMyClasses.
  students?: ClassStudentEntry[];
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
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
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

// Schedules API
export interface ScheduleCalendarItem {
  id: number;
  scheduleId?: number;
  classId: number;
  title: string;
  start: string;
  end: string;
  classCode: string;
  className: string;
  color: string;
}

export interface GetMyScheduleParams {
  classId?: number;
  fromDate?: string;
  toDate?: string;
}

function normalizeScheduleItem(source: Record<string, unknown>): ScheduleCalendarItem {
  return {
    id: toNumberValue(pick(source, 'id', 'Id')),
    scheduleId: toNumberValue(pick(source, 'scheduleId', 'ScheduleId')),
    classId: toNumberValue(pick(source, 'classId', 'ClassId')),
    title: (pick<string>(source, 'title', 'Title')) ?? '',
    start: (pick<string>(source, 'start', 'Start')) ?? '',
    end: (pick<string>(source, 'end', 'End')) ?? '',
    classCode: (pick<string>(source, 'classCode', 'ClassCode')) ?? '',
    className: (pick<string>(source, 'className', 'ClassName')) ?? '',
    color: (pick<string>(source, 'color', 'Color')) ?? '#3b82f6',
  };
}

export const schedulesApi = {
  getMySchedule: async (params?: GetMyScheduleParams): Promise<ScheduleCalendarItem[]> => {
    const queryParams: Record<string, string | number> = {};

    if (params?.classId) queryParams.ClassId = params.classId;
    if (params?.fromDate) queryParams.FromDate = params.fromDate.includes('T') ? params.fromDate : `${params.fromDate}T00:00:00Z`;
    if (params?.toDate) queryParams.ToDate = params.toDate.includes('T') ? params.toDate : `${params.toDate}T23:59:59Z`;

    const response = await api.get('/Schedules/my-schedule', {
      params: queryParams,
    });

    const data = unwrapApiData<unknown>(response.data);
    const items = Array.isArray(data) ? data : [];
    return items.map((item) => normalizeScheduleItem(item as Record<string, unknown>));
  },
};

// Attendance API
export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

export interface AttendanceRecord {
  id: number;
  classId: number;
  scheduleId?: number;
  classCode: string;
  studentId: number;
  studentName: string;
  studentEmail: string;
  attendanceDate: string;
  status: AttendanceStatus;
  note?: string;
  markedById: number;
  markedByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetAttendanceParams {
  classId?: number;
  studentId?: number;
  attendanceDate?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface PagedAttendanceResult {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  items: AttendanceRecord[];
}

export interface CreateAttendanceRecordInput {
  studentId: number;
  status: AttendanceStatus;
  note?: string;
}

export interface CreateAttendanceRequestPayload {
  classId: number;
  scheduleId?: number;
  attendanceDate: string;
  records: CreateAttendanceRecordInput[];
}

function normalizeAttendanceRecord(source: Record<string, unknown>): AttendanceRecord {
  return {
    id: toNumberValue(pick(source, 'id', 'Id')),
    classId: toNumberValue(pick(source, 'classId', 'ClassId')),
    scheduleId: toNumberValue(pick(source, 'scheduleId', 'ScheduleId')),
    classCode: (pick<string>(source, 'classCode', 'ClassCode')) ?? '',
    studentId: toNumberValue(pick(source, 'studentId', 'StudentId')),
    studentName: (pick<string>(source, 'studentName', 'StudentName')) ?? '',
    studentEmail: (pick<string>(source, 'studentEmail', 'StudentEmail')) ?? '',
    attendanceDate: (pick<string>(source, 'attendanceDate', 'AttendanceDate')) ?? '',
    status: (pick<string>(source, 'status', 'Status') as AttendanceStatus | undefined) ?? 'Present',
    note: pick<string>(source, 'note', 'Note'),
    markedById: toNumberValue(pick(source, 'markedById', 'MarkedById')),
    markedByName: (pick<string>(source, 'markedByName', 'MarkedByName')) ?? '',
    createdAt: (pick<string>(source, 'createdAt', 'CreatedAt')) ?? '',
    updatedAt: (pick<string>(source, 'updatedAt', 'UpdatedAt')) ?? '',
  };
}

export const attendanceApi = {
  getAttendance: async (params?: GetAttendanceParams): Promise<PagedAttendanceResult> => {
    const queryParams: Record<string, string | number> = {};

    if (params?.classId) queryParams.ClassId = params.classId;
    if (params?.studentId) queryParams.StudentId = params.studentId;
    if (params?.attendanceDate) {
      queryParams.AttendanceDate = params.attendanceDate.includes('T') ? params.attendanceDate.split('T')[0] : params.attendanceDate;
    }
    queryParams.PageNumber = params?.pageNumber ?? 1;
    queryParams.PageSize = params?.pageSize ?? 100;

    const response = await api.get('/Attendance', { params: queryParams });
    const data = unwrapApiData<Record<string, unknown>>(response.data) ?? {};
    const items = pick<unknown[]>(data, 'items', 'Items') ?? [];

    return {
      totalCount: toNumberValue(pick(data, 'totalCount', 'TotalCount')),
      pageNumber: toNumberValue(pick(data, 'pageNumber', 'PageNumber')),
      pageSize: toNumberValue(pick(data, 'pageSize', 'PageSize')),
      totalPages: toNumberValue(pick(data, 'totalPages', 'TotalPages')),
      items: items.map((item) => normalizeAttendanceRecord(item as Record<string, unknown>)),
    };
  },
  createAttendance: async (
    payload: CreateAttendanceRequestPayload
  ): Promise<AttendanceRecord[]> => {
    const dateStr = payload.attendanceDate.includes('T') ? payload.attendanceDate.split('T')[0] : payload.attendanceDate;
    const requestBody: Record<string, unknown> = {
      classId: payload.classId,
      attendanceDate: dateStr,
      records: payload.records,
    };
    if (payload.scheduleId) {
      requestBody.scheduleId = payload.scheduleId;
    }
    const response = await api.post('/Attendance', requestBody);
    const data = unwrapApiData<Record<string, unknown>>(response.data) ?? {};
    const items = pick<unknown[]>(data, 'items', 'Items') ?? [];
    return items.map((item) => normalizeAttendanceRecord(item as Record<string, unknown>));
  },
  updateAttendance: async (
    id: number,
    status: AttendanceStatus,
    note?: string
  ): Promise<AttendanceRecord> => {
    const response = await api.put(`/Attendance/${id}`, { status, note });
    return normalizeAttendanceRecord(unwrapApiData<Record<string, unknown>>(response.data) ?? {});
  },
};

// Assignments API
export type AssignmentType = 'quiz' | 'text_report' | 'practical_simulation';
export type AssignmentStatus = 'draft' | 'published' | 'closed';

export interface AssignmentQuizDetail {
  questions: unknown;
  timeLimitSeconds?: number | null;
  shuffleQuestions: boolean;
}

export interface AssignmentReportDetail {
  instructions: string;
  allowedSubmissionTypes: string[];
  allowedFileExtensions: string[];
  maxFileSizeMb: number;
}

export interface AssignmentSimulationDetail {
  environmentSource: string;
  baseDiagram: unknown;
  allowedComponentTypes: string[];
  studentInputMode: 'code_only' | 'circuit_build' | string;
  starterCode?: string | null;
  answerKey: unknown;
  autoGradingEnabled: boolean;
  autoGradingWeight: number;
}

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
  description: string;
  assignmentType?: AssignmentType;
  assignment_type?: AssignmentType;
  dueDate?: string | null;
  maxScore: number;
  rubricId?: number | null;
  rubricCriteria?: { name: string; maxPoints: number; description?: string }[];
  allowResubmit: boolean;
  resubmitLimit?: number | null;
  status: AssignmentStatus | string;
  createdById?: number | null;
  quizDetail?: AssignmentQuizDetail | null;
  reportDetail?: AssignmentReportDetail | null;
  simulationDetail?: AssignmentSimulationDetail | null;
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

export interface AssignmentQuizDetailRequest {
  questions: unknown;
  timeLimitSeconds?: number | null;
  shuffleQuestions: boolean;
}

export interface AssignmentReportDetailRequest {
  instructions: string;
  allowedSubmissionTypes: string[];
  allowedFileExtensions: string[];
  maxFileSizeMb: number;
}

export interface AssignmentSimulationDetailRequest {
  environmentSource: string;
  baseDiagram: unknown;
  allowedComponentTypes: string[];
  studentInputMode: 'code_only' | 'circuit_build';
  starterCode?: string | null;
  answerKey: unknown;
  autoGradingEnabled: boolean;
  autoGradingWeight: number;
}

export interface CreateAssignmentRequest {
  classId: number;
  title: string;
  description?: string;
  assignmentType: AssignmentType;
  dueDate?: string | null;
  maxScore?: number;
  rubricId?: number | null;
  rubricCriteria?: { name: string; maxPoints: number; description?: string }[];
  allowResubmit?: boolean;
  resubmitLimit?: number | null;
  status?: AssignmentStatus;
  quizDetail?: AssignmentQuizDetailRequest | null;
  reportDetail?: AssignmentReportDetailRequest | null;
  simulationDetail?: AssignmentSimulationDetailRequest | null;
}

export type UpdateAssignmentRequest = CreateAssignmentRequest;

function normalizeAssignmentResponse(payload: unknown): AssignmentEntity {
  return normalizeAssignment(unwrapApiData<unknown>(payload));
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function pick<T = unknown>(source: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const key of keys) {
    if (key in source) return source[key] as T;
  }

  return undefined;
}

function toNumberValue(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function toNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = toNumberValue(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

function toStringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function toBooleanValue(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function toStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  return [];
}

function normalizeAssignmentType(value: unknown): AssignmentType | undefined {
  if (value === 'quiz' || value === 'text_report' || value === 'practical_simulation') {
    return value;
  }

  return undefined;
}

function normalizeQuizDetail(value: unknown): AssignmentQuizDetail | null {
  const detail = toRecord(value);
  if (!detail) return null;

  return {
    questions: pick(detail, 'questions', 'Questions') ?? [],
    timeLimitSeconds: toNullableNumber(pick(detail, 'timeLimitSeconds', 'TimeLimitSeconds')),
    shuffleQuestions: toBooleanValue(pick(detail, 'shuffleQuestions', 'ShuffleQuestions')),
  };
}

function normalizeReportDetail(value: unknown): AssignmentReportDetail | null {
  const detail = toRecord(value);
  if (!detail) return null;

  return {
    instructions: toStringValue(pick(detail, 'instructions', 'Instructions')),
    allowedSubmissionTypes: toStringArray(
      pick(detail, 'allowedSubmissionTypes', 'AllowedSubmissionTypes')
    ),
    allowedFileExtensions: toStringArray(
      pick(detail, 'allowedFileExtensions', 'AllowedFileExtensions')
    ),
    maxFileSizeMb: toNumberValue(pick(detail, 'maxFileSizeMb', 'MaxFileSizeMb'), 50),
  };
}

function normalizeSimulationDetail(value: unknown): AssignmentSimulationDetail | null {
  const detail = toRecord(value);
  if (!detail) return null;

  return {
    environmentSource: toStringValue(
      pick(detail, 'environmentSource', 'EnvironmentSource'),
      'internal_sandbox'
    ),
    baseDiagram: pick(detail, 'baseDiagram', 'BaseDiagram') ?? {},
    allowedComponentTypes: toStringArray(
      pick(detail, 'allowedComponentTypes', 'AllowedComponentTypes')
    ),
    studentInputMode: toStringValue(
      pick(detail, 'studentInputMode', 'StudentInputMode'),
      'circuit_build'
    ),
    starterCode: toStringValue(pick(detail, 'starterCode', 'StarterCode'), '') || null,
    answerKey: pick(detail, 'answerKey', 'AnswerKey') ?? {},
    autoGradingEnabled: toBooleanValue(
      pick(detail, 'autoGradingEnabled', 'AutoGradingEnabled')
    ),
    autoGradingWeight: toNumberValue(
      pick(detail, 'autoGradingWeight', 'AutoGradingWeight'),
      1
    ),
  };
}

function normalizeRubricCriteria(value: unknown): { name: string; maxPoints: number; description?: string }[] | undefined {
  if (!value || !Array.isArray(value)) {
    return undefined;
  }
  return value
    .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
    .map((item) => ({
      name: toStringValue(pick(item, 'name', 'Name'), ''),
      maxPoints: toNumberValue(pick(item, 'maxPoints', 'max_points', 'MaxPoints'), 0),
      description: toStringValue(pick(item, 'description', 'Description')) || undefined,
    }));
}

function normalizeAssignment(value: unknown): AssignmentEntity {
  const source = toRecord(value) ?? {};
  const assignmentType = normalizeAssignmentType(
    pick(source, 'assignment_type', 'assignmentType', 'AssignmentType')
  );

  return {
    id: toNumberValue(pick(source, 'id', 'Id')),
    classId: toNumberValue(pick(source, 'classId', 'ClassId')),
    classCode: toStringValue(pick(source, 'classCode', 'ClassCode')),
    courseId: toNumberValue(pick(source, 'courseId', 'CourseId')),
    courseTitle: toStringValue(pick(source, 'courseTitle', 'CourseTitle')),
    teacherId: toNumberValue(pick(source, 'teacherId', 'TeacherId')),
    teacherName: toStringValue(pick(source, 'teacherName', 'TeacherName')),
    schoolId: toNumberValue(pick(source, 'schoolId', 'SchoolId')),
    schoolName: toStringValue(pick(source, 'schoolName', 'SchoolName')),
    title: toStringValue(pick(source, 'title', 'Title')),
    description: toStringValue(pick(source, 'description', 'Description')),
    assignmentType,
    assignment_type: assignmentType,
    dueDate: (pick(source, 'dueDate', 'DueDate') as string | null | undefined) ?? null,
    maxScore: toNumberValue(pick(source, 'maxScore', 'MaxScore'), 100),
    rubricId: toNullableNumber(pick(source, 'rubricId', 'RubricId')),
    rubricCriteria: normalizeRubricCriteria(pick(source, 'rubricCriteria', 'RubricCriteria')),
    allowResubmit: toBooleanValue(pick(source, 'allowResubmit', 'AllowResubmit')),
    resubmitLimit: toNullableNumber(pick(source, 'resubmitLimit', 'ResubmitLimit')),
    status: toStringValue(pick(source, 'status', 'Status'), 'draft'),
    createdById: toNullableNumber(pick(source, 'createdById', 'CreatedById')),
    quizDetail: normalizeQuizDetail(pick(source, 'quizDetail', 'QuizDetail')),
    reportDetail: normalizeReportDetail(pick(source, 'reportDetail', 'ReportDetail')),
    simulationDetail: normalizeSimulationDetail(
      pick(source, 'simulationDetail', 'SimulationDetail')
    ),
    submissionCount: toNumberValue(pick(source, 'submissionCount', 'SubmissionCount')),
    metricCount: toNumberValue(pick(source, 'metricCount', 'MetricCount')),
    createdAt: toStringValue(pick(source, 'createdAt', 'CreatedAt')),
    updatedAt: toStringValue(pick(source, 'updatedAt', 'UpdatedAt')),
  };
}

function normalizeAssignmentsResponse(payload: unknown): AssignmentsListResponse {
  const data = unwrapApiData<unknown>(payload);

  if (Array.isArray(data)) {
    const items = data.map(normalizeAssignment);

    return {
      items,
      total: items.length,
      pageNumber: 1,
      pageSize: items.length,
      totalPages: items.length ? 1 : 0,
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
    const items = (response.items ?? response.Items ?? []).map(normalizeAssignment);
    const total =
      response.total ??
      response.Total ??
      response.totalCount ??
      response.TotalCount ??
      items.length;
    const pageSize = response.pageSize ?? response.PageSize ?? items.length;

    return {
      items,
      total,
      pageNumber: response.pageNumber ?? response.PageNumber ?? 1,
      pageSize,
      totalPages:
        response.totalPages ??
        response.TotalPages ??
        (pageSize ? Math.ceil(total / pageSize) : 0),
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

export interface SimulationValidateResponse {
  isValid: boolean;
  message: string;
}

function normalizeSimulationValidateResponse(payload: unknown): SimulationValidateResponse {
  const data = unwrapApiData<unknown>(payload);
  const source = toRecord(data) ?? {};

  return {
    isValid: toBooleanValue(pick(source, 'isValid', 'IsValid')),
    message: toStringValue(pick(source, 'message', 'Message')),
  };
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
  getSimulationBaseDiagram: async (id: number): Promise<unknown> => {
    const response = await api.get(`/Assignments/${id}/simulation/base-diagram`);
    return unwrapApiData<unknown>(response.data);
  },
  validateSimulationCircuit: async (
    id: number,
    circuit: unknown
  ): Promise<SimulationValidateResponse> => {
    const response = await api.post(`/Assignments/${id}/simulation/validate`, {
      circuit,
    });
    return normalizeSimulationValidateResponse(response.data);
  },
};

// Labs API
export type LabCategory = 'physics' | 'chemistry' | 'biology' | 'robotics';
export type LabStatus = 'draft' | 'published';
export type LabSimulationMode = 'wokwi_iframe' | 'custom_sandbox';
export type LabBoardType = 'arduino_uno' | 'esp32_devkit_v1';
export type SimulationCompileBoard = 'arduino:avr:uno';

export interface LabCircuitComponent {
  id: string;
  type: string;
  x: number;
  y: number;
  rotate?: number;
  attrs?: Record<string, string>;
  pinMapping: Record<string, number>;
}

// Sensor Input Bridge — Phase 1 (scenario/timeline). Khớp đúng shape BE
// SensorScenarioDtos.cs (SensorScenarioConfig/SensorTimeline/SensorTimelineEntry)
// — key trong `sensors` là componentId (part.id), KHÔNG phải componentType.
export interface SensorTimelineEntry {
  timeMs: number;
  distanceCm?: number;
  motion?: boolean;
  // Phase 2.1 — Line Tracking 3ch/5ch: 'center'|'left'|'right'|'lost'|'intersection'
  // (3ch) hoặc thêm 'far-left'|'far-right' (5ch). Khớp đúng
  // LineTracking{3,5}ChPatterns trong BE SensorRuntimeHeaderGenerator.cs.
  pattern?: string;
  // Phase 2.2 — Water Leak/Flame/Soil Moisture/Rain/Vibration.
  detected?: boolean;
  analog?: number;
  // Phase 2.3 — DHT11/DHT22 (đọc qua StemFlowDHT helper).
  temperature?: number;
  humidity?: number;
}

export interface SensorTimeline {
  type: string;
  timeline: SensorTimelineEntry[];
}

export interface SensorScenarioConfig {
  sensors: Record<string, SensorTimeline>;
}

export interface LabCircuitConfig {
  board?: LabBoardType | string;
  parts?: LabCircuitComponent[];
  connections?: unknown[];
  sensorScenario?: SensorScenarioConfig;
  [key: string]: unknown;
}

export interface LabClassEntity {
  id: number;
  classCode: string;
  courseId: number;
  courseTitle: string;
  schoolId: number;
  teacherId: number;
}

export interface LabStatsEntity {
  labId: string;
  studentCount: number;
  startedCount: number;
  completedCount: number;
  completionRate: number;
  averageDurationSeconds?: number | null;
  completionSource: 'manual' | 'linked_assignment' | string;
}

export interface LabEntity {
  id: string;
  title: string;
  description: string;
  category: LabCategory | string;
  thumbnailUrl: string;
  simulationMode: LabSimulationMode | string;
  boardType: LabBoardType | string;
  starterCode?: string | null;
  circuitConfig: LabCircuitConfig;
  allowedComponentTypes: string[];
  wokwiProjectId: string;
  wokwiProjectUrl: string;
  wokwiEmbedUrl: string;
  createdById: number;
  createdByName: string;
  classes: LabClassEntity[];
  classIds: number[];
  status: LabStatus | string;
  linkedAssignmentId?: number | null;
  linkedAssignmentTitle?: string | null;
  stats: LabStatsEntity;
  isWokwiBroken?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LabsListResponse {
  items: LabEntity[];
  total: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface LabsListParams {
  searchTerm?: string;
  category?: LabCategory | string;
  classId?: number;
  status?: LabStatus | string;
  simulationMode?: LabSimulationMode | string;
  pageNumber?: number;
  pageSize?: number;
}

export interface CreateLabRequest {
  title: string;
  description: string;
  category: LabCategory;
  thumbnailUrl: string;
  simulationMode: LabSimulationMode;
  boardType?: LabBoardType;
  starterCode?: string | null;
  circuitConfig?: LabCircuitConfig;
  allowedComponentTypes?: string[];
  wokwiProjectId?: string | null;
  wokwiProjectUrl?: string | null;
  classIds: number[];
  status: LabStatus;
  linkedAssignmentId?: number | null;
}

export type UpdateLabRequest = CreateLabRequest;

export interface ValidateWokwiProjectRequest {
  wokwiProjectId?: string | null;
  wokwiProjectUrl?: string | null;
}

export interface ValidateWokwiProjectResponse {
  isValid: boolean;
  message: string;
  wokwiProjectId?: string | null;
  wokwiProjectUrl?: string | null;
  statusCode?: number | null;
}

export interface LabProgressResponse {
  labId: string;
  studentId: number;
  startedAt: string;
  lastOpenedAt: string;
  openCount: number;
  completedAt?: string | null;
  durationSeconds?: number | null;
}

export interface ComponentGlueRegistryEntity {
  componentType: string;
  label: string;
  supported: boolean;
  pinRequirements: unknown;
  updatedAt: string;
}

export interface VirtualLabProjectRequest {
  name: string;
  board?: string;
  language?: string;
  code: string;
  diagram: unknown;
}

export interface VirtualLabProjectEntity {
  id: string;
  userId?: number | null;
  name: string;
  board: string;
  language: string;
  codeContent: string;
  diagramJson: string;
  circuitConfig: LabCircuitConfig;
  librariesJson: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherProjectSnapshot {
  projectId: string;
  studentId: number | null;
  board: string;
  language: string;
  codeContent: string;
  diagramJson: string;
  circuitConfig: LabCircuitConfig;
  status: string;
  updatedAt: string;
}

function normalizeTeacherProjectSnapshot(value: unknown): TeacherProjectSnapshot {
  const source = toRecord(unwrapApiData<unknown>(value)) ?? {};
  const diagramJson = toStringValue(pick(source, 'diagramJson', 'DiagramJson'), '{}');

  return {
    projectId: toStringValue(pick(source, 'projectId', 'ProjectId')),
    studentId: toNullableNumber(pick(source, 'studentId', 'StudentId')),
    board: toStringValue(pick(source, 'board', 'Board'), 'esp32'),
    language: toStringValue(pick(source, 'language', 'Language'), 'arduino'),
    codeContent: toStringValue(pick(source, 'codeContent', 'CodeContent')),
    diagramJson,
    circuitConfig: normalizeCircuitConfig(diagramJson),
    status: toStringValue(pick(source, 'status', 'Status')),
    updatedAt: toStringValue(pick(source, 'updatedAt', 'UpdatedAt')),
  };
}

export interface StartVirtualLabProjectSimulationRequest {
  code: string;
  diagram: unknown;
}

export interface SimulationEventEntity {
  type: string;
  time: number;
  payload: Record<string, unknown>;
}

export interface VirtualLabProjectSimulationResponse {
  sessionId: string;
  status: string;
  validation: DiagramValidationResult;
  netlist: DiagramNetlist;
  events: SimulationEventEntity[];
}

export interface SimulationComponentMeta {
  type: string;
  label: string;
  description: string;
  pins: string[];
  gpioPins: string[];
  defaultAttrs: Record<string, string>;
}

export interface CreateSimulationTemplateRequest {
  simulationName: string;
  description: string;
  diagramJson: string;
}

export interface UpdateSimulationDiagramRequest {
  diagramJson: string;
}

export interface SimulationTemplateEntity {
  id: number;
  simulationName: string;
  description: string;
  diagramJson: string;
  createdAt: string;
}

export interface CreateSimulationSessionRequest {
  studentId: number;
  templateId: number;
}

export interface SimulationSessionEntity {
  id: number;
  studentId: number;
  templateId: number;
  startTime: string;
  status: string;
}

export interface AiSuggestRequest {
  prompt: string;
}

export interface AiSuggestResponse {
  summary: string;
  componentTypes: string[];
  diagramJson: string;
  pythonCode: string;
  tip: string;
}

export interface CompileSimulationRequest {
  assignmentId?: number | null;
  labId?: string | null;
  code: string;
  board?: SimulationCompileBoard | string;
  framework?: string;
}

export interface CompileSimulationError {
  line?: number | null;
  message: string;
}

export interface CompileSimulationResponse {
  success: boolean;
  jobId?: string | null;
  hexBase64?: string | null;
  errors: CompileSimulationError[];
  compilerOutput?: string | null;
}

export interface CompileJobResponse {
  jobId: string;
  status: string;
  result?: CompileSimulationResponse | null;
  createdAt: string;
  updatedAt: string;
}

export interface LegacyVirtualLabEntity {
  id: number;
  simulationId: number;
  lessonId: number;
  lessonTitle: string;
  courseId: number;
  courseTitle: string;
  teacherId: number;
  teacherName: string;
  schoolId?: number | null;
  schoolName?: string | null;
  simulationName: string;
  description: string;
  diagramJson: string;
  sessionsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LegacyVirtualLabsListResponse {
  items: LegacyVirtualLabEntity[];
  total: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface LegacyVirtualLabsListParams {
  searchTerm?: string;
  lessonId?: number;
  courseId?: number;
  pageNumber?: number;
  pageSize?: number;
}

export interface CreateLegacyVirtualLabRequest {
  lessonId: number;
  simulationName: string;
  description: string;
  diagramJson: string;
}

function toNumberArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => toNumberValue(item, Number.NaN))
    .filter((item) => Number.isFinite(item));
}

function toUnknownArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function parseJsonValue<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined || value === '') return fallback;

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  return value as T;
}

function toStringRecord(value: unknown) {
  const source = toRecord(value);
  if (!source) return {};

  return Object.fromEntries(
    Object.entries(source)
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
  );
}

function normalizePinMapping(value: unknown) {
  const source = toRecord(value) ?? {};

  return Object.fromEntries(
    Object.entries(source)
      .map(([key, item]) => [key, toNumberValue(item, Number.NaN)] as const)
      .filter((entry) => Number.isFinite(entry[1]))
  );
}

function normalizeCircuitComponent(value: unknown): LabCircuitComponent {
  const source = toRecord(value) ?? {};
  const position = toRecord(pick(source, 'position', 'Position')) ?? {};

  return {
    id:
      toStringValue(pick(source, 'id', 'Id')) ||
      `part-${Math.random().toString(36).slice(2, 9)}`,
    type: toStringValue(
      pick(source, 'type', 'Type', 'componentType', 'ComponentType'),
      'led'
    ),
    x: toNumberValue(pick(source, 'x', 'X') ?? pick(position, 'x', 'X'), 120),
    y: toNumberValue(pick(source, 'y', 'Y') ?? pick(position, 'y', 'Y'), 80),
    attrs: toStringRecord(pick(source, 'attrs', 'Attrs', 'attributes', 'Attributes')),
    pinMapping: normalizePinMapping(
      pick(source, 'pinMapping', 'PinMapping', 'pins', 'Pins')
    ),
  };
}

function normalizeCircuitConfig(value: unknown): LabCircuitConfig {
  const parsed = parseJsonValue<Record<string, unknown>>(value, {});
  const source = toRecord(parsed) ?? {};
  const parts = toUnknownArray(
    pick(source, 'parts', 'Parts', 'components', 'Components')
  ).map(normalizeCircuitComponent);

  return {
    ...source,
    parts,
  };
}

function normalizeLabClass(value: unknown): LabClassEntity {
  const source = toRecord(value) ?? {};

  return {
    id: toNumberValue(pick(source, 'id', 'Id')),
    classCode: toStringValue(pick(source, 'classCode', 'ClassCode')),
    courseId: toNumberValue(pick(source, 'courseId', 'CourseId')),
    courseTitle: toStringValue(pick(source, 'courseTitle', 'CourseTitle')),
    schoolId: toNumberValue(pick(source, 'schoolId', 'SchoolId')),
    teacherId: toNumberValue(pick(source, 'teacherId', 'TeacherId')),
  };
}

function normalizeLabStats(value: unknown): LabStatsEntity {
  const source = toRecord(value) ?? {};

  return {
    labId: toStringValue(pick(source, 'labId', 'LabId')),
    studentCount: toNumberValue(pick(source, 'studentCount', 'StudentCount')),
    startedCount: toNumberValue(pick(source, 'startedCount', 'StartedCount')),
    completedCount: toNumberValue(pick(source, 'completedCount', 'CompletedCount')),
    completionRate: toNumberValue(pick(source, 'completionRate', 'CompletionRate')),
    averageDurationSeconds: toNullableNumber(
      pick(source, 'averageDurationSeconds', 'AverageDurationSeconds')
    ),
    completionSource: toStringValue(
      pick(source, 'completionSource', 'CompletionSource'),
      'manual'
    ),
  };
}

function normalizeLab(value: unknown): LabEntity {
  const source = toRecord(value) ?? {};
  const stats = normalizeLabStats(pick(source, 'stats', 'Stats'));
  const id = toStringValue(pick(source, 'id', 'Id'));
  const classes = toUnknownArray(pick(source, 'classes', 'Classes')).map(normalizeLabClass);
  const classIds = toNumberArray(pick(source, 'classIds', 'ClassIds'));

  return {
    id,
    title: toStringValue(pick(source, 'title', 'Title')),
    description: toStringValue(pick(source, 'description', 'Description')),
    category: toStringValue(pick(source, 'category', 'Category')),
    thumbnailUrl: toStringValue(pick(source, 'thumbnailUrl', 'ThumbnailUrl')),
    simulationMode: toStringValue(
      pick(source, 'simulationMode', 'SimulationMode'),
      'wokwi_iframe'
    ),
    boardType: toStringValue(pick(source, 'boardType', 'BoardType'), 'arduino_uno'),
    starterCode:
      toStringValue(pick(source, 'starterCode', 'StarterCode'), '') || null,
    circuitConfig: normalizeCircuitConfig(pick(source, 'circuitConfig', 'CircuitConfig')),
    allowedComponentTypes: toStringArray(
      pick(source, 'allowedComponentTypes', 'AllowedComponentTypes')
    ),
    wokwiProjectId: toStringValue(pick(source, 'wokwiProjectId', 'WokwiProjectId')),
    wokwiProjectUrl: toStringValue(pick(source, 'wokwiProjectUrl', 'WokwiProjectUrl')),
    wokwiEmbedUrl: toStringValue(pick(source, 'wokwiEmbedUrl', 'WokwiEmbedUrl')),
    createdById: toNumberValue(pick(source, 'createdById', 'CreatedById')),
    createdByName: toStringValue(pick(source, 'createdByName', 'CreatedByName')),
    classes,
    classIds: classIds.length ? classIds : classes.map((classItem) => classItem.id),
    status: toStringValue(pick(source, 'status', 'Status'), 'draft'),
    linkedAssignmentId: toNullableNumber(
      pick(source, 'linkedAssignmentId', 'LinkedAssignmentId')
    ),
    linkedAssignmentTitle:
      toStringValue(pick(source, 'linkedAssignmentTitle', 'LinkedAssignmentTitle'), '') ||
      null,
    stats: {
      ...stats,
      labId: stats.labId || id,
    },
    isWokwiBroken: toBooleanValue(
      pick(
        source,
        'isWokwiBroken',
        'IsWokwiBroken',
        'wokwiProjectBroken',
        'WokwiProjectBroken',
        'hasWokwiError',
        'HasWokwiError'
      )
    ),
    createdAt: toStringValue(pick(source, 'createdAt', 'CreatedAt')),
    updatedAt: toStringValue(pick(source, 'updatedAt', 'UpdatedAt')),
  };
}

function normalizeLabsResponse(payload: unknown): LabsListResponse {
  const data = unwrapApiData<unknown>(payload);

  if (Array.isArray(data)) {
    const items = data.map(normalizeLab);

    return {
      items,
      total: items.length,
      pageNumber: 1,
      pageSize: items.length,
      totalPages: items.length ? 1 : 0,
    };
  }

  if (data && typeof data === 'object') {
    const response = data as {
      items?: unknown[];
      Items?: unknown[];
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
    const items = (response.items ?? response.Items ?? []).map(normalizeLab);
    const total =
      response.total ??
      response.Total ??
      response.totalCount ??
      response.TotalCount ??
      items.length;
    const pageSize = response.pageSize ?? response.PageSize ?? items.length;

    return {
      items,
      total,
      pageNumber: response.pageNumber ?? response.PageNumber ?? 1,
      pageSize,
      totalPages:
        response.totalPages ??
        response.TotalPages ??
        (pageSize ? Math.ceil(total / pageSize) : 0),
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

function buildLabsParams(params?: LabsListParams) {
  if (!params) return undefined;

  const queryParams: Record<string, string | number> = {};

  if (params.searchTerm?.trim()) {
    queryParams.SearchTerm = params.searchTerm.trim();
  }

  if (params.category) {
    queryParams.Category = params.category;
  }

  if (params.classId) {
    queryParams.ClassId = params.classId;
  }

  if (params.status) {
    queryParams.Status = params.status;
  }

  if (params.simulationMode) {
    queryParams.SimulationMode = params.simulationMode;
  }

  if (params.pageNumber) {
    queryParams.PageNumber = params.pageNumber;
  }

  if (params.pageSize) {
    queryParams.PageSize = params.pageSize;
  }

  return Object.keys(queryParams).length ? queryParams : undefined;
}

function normalizeWokwiValidation(payload: unknown): ValidateWokwiProjectResponse {
  const data = unwrapApiData<unknown>(payload);
  const source = toRecord(data) ?? {};

  return {
    isValid: toBooleanValue(pick(source, 'isValid', 'IsValid')),
    message: toStringValue(pick(source, 'message', 'Message')),
    wokwiProjectId:
      toStringValue(pick(source, 'wokwiProjectId', 'WokwiProjectId'), '') || null,
    wokwiProjectUrl:
      toStringValue(pick(source, 'wokwiProjectUrl', 'WokwiProjectUrl'), '') || null,
    statusCode: toNullableNumber(pick(source, 'statusCode', 'StatusCode')),
  };
}

function normalizeLabProgress(payload: unknown): LabProgressResponse {
  const data = unwrapApiData<unknown>(payload);
  const source = toRecord(data) ?? {};

  return {
    labId: toStringValue(pick(source, 'labId', 'LabId')),
    studentId: toNumberValue(pick(source, 'studentId', 'StudentId')),
    startedAt: toStringValue(pick(source, 'startedAt', 'StartedAt')),
    lastOpenedAt: toStringValue(pick(source, 'lastOpenedAt', 'LastOpenedAt')),
    openCount: toNumberValue(pick(source, 'openCount', 'OpenCount')),
    completedAt: (pick(source, 'completedAt', 'CompletedAt') as string | null | undefined) ?? null,
    durationSeconds: toNullableNumber(pick(source, 'durationSeconds', 'DurationSeconds')),
  };
}

function normalizeComponentGlueRegistry(value: unknown): ComponentGlueRegistryEntity {
  const source = toRecord(value) ?? {};

  return {
    componentType: toStringValue(
      pick(source, 'componentType', 'ComponentType', 'type', 'Type')
    ),
    label: toStringValue(pick(source, 'label', 'Label')),
    supported: toBooleanValue(pick(source, 'supported', 'Supported'), true),
    pinRequirements: parseJsonValue(
      pick(source, 'pinRequirements', 'PinRequirements'),
      {}
    ),
    updatedAt: toStringValue(pick(source, 'updatedAt', 'UpdatedAt')),
  };
}

function normalizeVirtualLabProject(value: unknown): VirtualLabProjectEntity {
  const source = toRecord(unwrapApiData<unknown>(value)) ?? {};
  const diagramJson = toStringValue(
    pick(source, 'diagramJson', 'DiagramJson', 'diagram', 'Diagram'),
    '{}'
  );

  return {
    id: toStringValue(pick(source, 'id', 'Id')),
    userId: toNullableNumber(pick(source, 'userId', 'UserId')),
    name: toStringValue(pick(source, 'name', 'Name')),
    board: toStringValue(pick(source, 'board', 'Board'), 'arduino_uno'),
    language: toStringValue(pick(source, 'language', 'Language'), 'arduino'),
    codeContent: toStringValue(
      pick(source, 'codeContent', 'CodeContent', 'code', 'Code')
    ),
    diagramJson,
    circuitConfig: normalizeCircuitConfig(diagramJson),
    librariesJson: toStringValue(
      pick(source, 'librariesJson', 'LibrariesJson'),
      '{}'
    ),
    createdAt: toStringValue(pick(source, 'createdAt', 'CreatedAt')),
    updatedAt: toStringValue(pick(source, 'updatedAt', 'UpdatedAt')),
  };
}

function normalizeSimulationEvent(value: unknown): SimulationEventEntity {
  const source = toRecord(value) ?? {};
  return {
    type: toStringValue(pick(source, 'type', 'Type')),
    time: toNumberValue(pick(source, 'time', 'Time')),
    payload: toRecord(pick(source, 'payload', 'Payload')) ?? {},
  };
}

function normalizeVirtualLabProjectSimulation(
  payload: unknown
): VirtualLabProjectSimulationResponse {
  const data = unwrapApiData<unknown>(payload);
  const source = toRecord(data) ?? {};

  return {
    sessionId: toStringValue(pick(source, 'sessionId', 'SessionId')),
    status: toStringValue(pick(source, 'status', 'Status'), 'stopped'),
    validation: normalizeDiagramValidation(pick(source, 'validation', 'Validation')),
    netlist: normalizeDiagramNetlist(pick(source, 'netlist', 'Netlist')),
    events: toUnknownArray(pick(source, 'events', 'Events')).map(normalizeSimulationEvent),
  };
}

function normalizeSimulationComponent(value: unknown): SimulationComponentMeta {
  const source = toRecord(value) ?? {};

  return {
    type: toStringValue(pick(source, 'type', 'Type')),
    label: toStringValue(pick(source, 'label', 'Label')),
    description: toStringValue(pick(source, 'description', 'Description')),
    pins: toStringArray(pick(source, 'pins', 'Pins')),
    gpioPins: toStringArray(pick(source, 'gpioPins', 'GpioPins')),
    defaultAttrs: toStringRecord(pick(source, 'defaultAttrs', 'DefaultAttrs')),
  };
}

function normalizeSimulationTemplate(value: unknown): SimulationTemplateEntity {
  const source = toRecord(unwrapApiData<unknown>(value)) ?? {};

  return {
    id: toNumberValue(pick(source, 'id', 'Id')),
    simulationName: toStringValue(
      pick(source, 'simulationName', 'SimulationName')
    ),
    description: toStringValue(pick(source, 'description', 'Description')),
    diagramJson: toStringValue(pick(source, 'diagramJson', 'DiagramJson'), '{}'),
    createdAt: toStringValue(pick(source, 'createdAt', 'CreatedAt')),
  };
}

function normalizeSimulationSession(value: unknown): SimulationSessionEntity {
  const source = toRecord(unwrapApiData<unknown>(value)) ?? {};

  return {
    id: toNumberValue(pick(source, 'id', 'Id')),
    studentId: toNumberValue(pick(source, 'studentId', 'StudentId')),
    templateId: toNumberValue(pick(source, 'templateId', 'TemplateId')),
    startTime: toStringValue(pick(source, 'startTime', 'StartTime')),
    status: toStringValue(pick(source, 'status', 'Status')),
  };
}

function normalizeAiSuggest(value: unknown): AiSuggestResponse {
  const source = toRecord(unwrapApiData<unknown>(value)) ?? {};

  return {
    summary: toStringValue(pick(source, 'summary', 'Summary')),
    componentTypes: toStringArray(pick(source, 'componentTypes', 'ComponentTypes')),
    diagramJson: toStringValue(pick(source, 'diagramJson', 'DiagramJson'), '{}'),
    pythonCode: toStringValue(pick(source, 'pythonCode', 'PythonCode')),
    tip: toStringValue(pick(source, 'tip', 'Tip')),
  };
}

function normalizeCompileError(value: unknown): CompileSimulationError {
  const source = toRecord(value) ?? {};

  return {
    line: toNullableNumber(pick(source, 'line', 'Line')),
    message: toStringValue(pick(source, 'message', 'Message')),
  };
}

function normalizeCompileResponse(payload: unknown): CompileSimulationResponse {
  const data = unwrapApiData<unknown>(payload);
  const source = toRecord(data) ?? {};
  const errors = toUnknownArray(pick(source, 'errors', 'Errors')).map(normalizeCompileError);

  return {
    success: toBooleanValue(pick(source, 'success', 'Success')),
    jobId: toStringValue(pick(source, 'jobId', 'JobId'), '') || null,
    hexBase64: toStringValue(pick(source, 'hexBase64', 'HexBase64'), '') || null,
    errors,
    compilerOutput:
      toStringValue(pick(source, 'compilerOutput', 'CompilerOutput'), '') || null,
  };
}

function normalizeCompileJob(payload: unknown): CompileJobResponse {
  const data = unwrapApiData<unknown>(payload);
  const source = toRecord(data) ?? {};
  const result = pick(source, 'result', 'Result');

  return {
    jobId: toStringValue(pick(source, 'jobId', 'JobId')),
    status: toStringValue(pick(source, 'status', 'Status')),
    result: result ? normalizeCompileResponse(result) : null,
    createdAt: toStringValue(pick(source, 'createdAt', 'CreatedAt')),
    updatedAt: toStringValue(pick(source, 'updatedAt', 'UpdatedAt')),
  };
}

function normalizeLegacyVirtualLab(value: unknown): LegacyVirtualLabEntity {
  const source = toRecord(value) ?? {};

  return {
    id: toNumberValue(pick(source, 'id', 'Id')),
    simulationId: toNumberValue(pick(source, 'simulationId', 'SimulationId')),
    lessonId: toNumberValue(pick(source, 'lessonId', 'LessonId')),
    lessonTitle: toStringValue(pick(source, 'lessonTitle', 'LessonTitle')),
    courseId: toNumberValue(pick(source, 'courseId', 'CourseId')),
    courseTitle: toStringValue(pick(source, 'courseTitle', 'CourseTitle')),
    teacherId: toNumberValue(pick(source, 'teacherId', 'TeacherId')),
    teacherName: toStringValue(pick(source, 'teacherName', 'TeacherName')),
    schoolId: toNullableNumber(pick(source, 'schoolId', 'SchoolId')),
    schoolName: toStringValue(pick(source, 'schoolName', 'SchoolName'), '') || null,
    simulationName: toStringValue(
      pick(source, 'simulationName', 'SimulationName')
    ),
    description: toStringValue(pick(source, 'description', 'Description')),
    diagramJson: toStringValue(pick(source, 'diagramJson', 'DiagramJson'), '{}'),
    sessionsCount: toNumberValue(pick(source, 'sessionsCount', 'SessionsCount')),
    createdAt: toStringValue(pick(source, 'createdAt', 'CreatedAt')),
    updatedAt: toStringValue(pick(source, 'updatedAt', 'UpdatedAt')),
  };
}

function normalizeLegacyVirtualLabsResponse(payload: unknown): LegacyVirtualLabsListResponse {
  const data = unwrapApiData<unknown>(payload);
  const source = toRecord(data) ?? {};
  const items = toUnknownArray(pick(source, 'items', 'Items')).map(normalizeLegacyVirtualLab);
  const total =
    toNumberValue(pick(source, 'totalCount', 'TotalCount'), Number.NaN) ||
    toNumberValue(pick(source, 'total', 'Total'), items.length);
  const pageSize = toNumberValue(pick(source, 'pageSize', 'PageSize'), items.length);

  return {
    items,
    total,
    pageNumber: toNumberValue(pick(source, 'pageNumber', 'PageNumber'), 1),
    pageSize,
    totalPages:
      toNumberValue(pick(source, 'totalPages', 'TotalPages'), Number.NaN) ||
      (pageSize ? Math.ceil(total / pageSize) : 0),
  };
}

function buildLegacyVirtualLabsParams(params?: LegacyVirtualLabsListParams) {
  if (!params) return undefined;

  const queryParams: Record<string, string | number> = {};

  if (params.searchTerm?.trim()) queryParams.SearchTerm = params.searchTerm.trim();
  if (params.lessonId) queryParams.LessonId = params.lessonId;
  if (params.courseId) queryParams.CourseId = params.courseId;
  if (params.pageNumber) queryParams.PageNumber = params.pageNumber;
  if (params.pageSize) queryParams.PageSize = params.pageSize;

  return Object.keys(queryParams).length ? queryParams : undefined;
}

export const labsApi = {
  getAll: async (params?: LabsListParams): Promise<LabsListResponse> => {
    const queryParams = buildLabsParams(params);
    const response = await api.get('/labs', queryParams ? { params: queryParams } : undefined);
    return normalizeLabsResponse(response.data);
  },
  getById: async (id: string): Promise<LabEntity> => {
    const response = await api.get(`/labs/${id}`);
    return normalizeLab(unwrapApiData<unknown>(response.data));
  },
  create: async (data: CreateLabRequest): Promise<LabEntity> => {
    const response = await api.post('/labs', data);
    return normalizeLab(unwrapApiData<unknown>(response.data));
  },
  update: async (id: string, data: UpdateLabRequest): Promise<LabEntity> => {
    const response = await api.put(`/labs/${id}`, data);
    return normalizeLab(unwrapApiData<unknown>(response.data));
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/labs/${id}`);
  },
  validateWokwiProject: async (
    data: ValidateWokwiProjectRequest
  ): Promise<ValidateWokwiProjectResponse> => {
    const response = await api.post('/labs/validate-wokwi', data);
    return normalizeWokwiValidation(response.data);
  },
  validateExistingWokwiProject: async (
    id: string
  ): Promise<ValidateWokwiProjectResponse> => {
    const response = await api.post(`/labs/${id}/validate-wokwi`);
    return normalizeWokwiValidation(response.data);
  },
  startProgress: async (id: string): Promise<LabProgressResponse> => {
    const response = await api.post(`/labs/${id}/progress/start`);
    return normalizeLabProgress(response.data);
  },
  completeProgress: async (id: string): Promise<LabProgressResponse> => {
    const response = await api.post(`/labs/${id}/progress/complete`);
    return normalizeLabProgress(response.data);
  },
  getStats: async (id: string): Promise<LabStatsEntity> => {
    const response = await api.get(`/labs/${id}/stats`);
    return normalizeLabStats(unwrapApiData<unknown>(response.data));
  },
  getComponentGlueRegistry: async (
    supportedOnly = true
  ): Promise<ComponentGlueRegistryEntity[]> => {
    const response = await api.get('/labs/component-glue-registry', {
      params: { supportedOnly },
    });
    return toUnknownArray(unwrapApiData<unknown>(response.data)).map(
      normalizeComponentGlueRegistry
    );
  },
};

export const virtualLabProjectsApi = {
  create: async (data: VirtualLabProjectRequest): Promise<VirtualLabProjectEntity> => {
    const response = await api.post('/virtual-lab/projects', {
      name: data.name,
      board: data.board ?? 'arduino_uno',
      language: data.language ?? 'arduino',
      code: data.code,
      diagram: data.diagram,
    });
    return normalizeVirtualLabProject(response.data);
  },
  getById: async (id: string): Promise<VirtualLabProjectEntity> => {
    const response = await api.get(`/virtual-lab/projects/${id}`);
    return normalizeVirtualLabProject(response.data);
  },
  update: async (
    id: string,
    data: VirtualLabProjectRequest
  ): Promise<VirtualLabProjectEntity> => {
    const response = await api.put(`/virtual-lab/projects/${id}`, {
      name: data.name,
      board: data.board ?? 'arduino_uno',
      language: data.language ?? 'arduino',
      code: data.code,
      diagram: data.diagram,
    });
    return normalizeVirtualLabProject(response.data);
  },
  start: async (
    id: string,
    data: StartVirtualLabProjectSimulationRequest
  ): Promise<VirtualLabProjectSimulationResponse> => {
    const response = await api.post(`/virtual-lab/projects/${id}/start`, data);
    return normalizeVirtualLabProjectSimulation(response.data);
  },
  stop: async (id: string): Promise<VirtualLabProjectSimulationResponse> => {
    const response = await api.post(`/virtual-lab/projects/${id}/stop`);
    return normalizeVirtualLabProjectSimulation(response.data);
  },
  // Kích hoạt compile nền để làm ấm firmware cache TRƯỚC khi bấm Run — gọi
  // sau debounce 2-3s lúc học sinh ngừng gõ code (LabSandboxPage.tsx). BE trả
  // về ngay (202), không đợi compile ~40-90s thật xong.
  precompile: async (id: string, code: string): Promise<void> => {
    await api.post(`/virtual-lab/projects/${id}/precompile`, { code });
  },
  // Snapshot 1 lần (không realtime) cho Teacher "Xem live" — StudentSandboxViewer.tsx
  // gọi lúc mount để không bắt đầu từ rỗng nếu học sinh đã join TRƯỚC khi
  // giáo viên mở màn hình (SignalR chỉ phát cho THAY ĐỔI, không phát lại
  // state hiện tại lúc join nhóm). 403 nếu lab không thuộc lớp giáo viên
  // này dạy — throw để caller tự hiện message rõ (không nuốt silently).
  getTeacherView: async (id: string): Promise<TeacherProjectSnapshot> => {
    const response = await api.get(`/virtual-lab/projects/${id}/teacher-view`);
    return normalizeTeacherProjectSnapshot(response.data);
  },
};

export interface DiagramValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DiagramNetResponse {
  id: string;
  pins: string[];
}

export interface DiagramNetlist {
  nets: DiagramNetResponse[];
  pinToNet: Record<string, string>;
}

export interface DiagramSessionEntity {
  sessionId: string;
  circuitConfig: LabCircuitConfig;
  validation: DiagramValidationResult;
  netlist: DiagramNetlist;
  updatedAt: string;
}

export interface SaveDiagramPayload {
  circuitConfig: LabCircuitConfig;
  sourceCode?: string;
  labId?: string;
}

function normalizeDiagramValidation(value: unknown): DiagramValidationResult {
  const source = toRecord(value) ?? {};
  return {
    isValid: toBooleanValue(pick(source, 'isValid', 'IsValid')),
    errors: toStringArray(pick(source, 'errors', 'Errors')),
    warnings: toStringArray(pick(source, 'warnings', 'Warnings')),
  };
}

function normalizeDiagramNetlist(value: unknown): DiagramNetlist {
  const source = toRecord(value) ?? {};
  const nets = toUnknownArray(pick(source, 'nets', 'Nets')).map((item) => {
    const netSource = toRecord(item) ?? {};
    return {
      id: toStringValue(pick(netSource, 'id', 'Id')),
      pins: toStringArray(pick(netSource, 'pins', 'Pins')),
    };
  });

  const pinToNetSource = toRecord(pick(source, 'pinToNet', 'PinToNet')) ?? {};
  const pinToNet: Record<string, string> = {};
  for (const [pin, netId] of Object.entries(pinToNetSource)) {
    pinToNet[pin] = toStringValue(netId);
  }

  return { nets, pinToNet };
}

function normalizeDiagramSession(value: unknown): DiagramSessionEntity {
  const source = toRecord(unwrapApiData<unknown>(value)) ?? {};

  return {
    sessionId: toStringValue(pick(source, 'sessionId', 'SessionId')),
    circuitConfig: normalizeCircuitConfig(pick(source, 'diagramJson', 'DiagramJson')),
    validation: normalizeDiagramValidation(pick(source, 'validation', 'Validation')),
    netlist: normalizeDiagramNetlist(pick(source, 'netlist', 'Netlist')),
    updatedAt: toStringValue(pick(source, 'updatedAt', 'UpdatedAt')),
  };
}

// PUT/POST api/diagrams/{projectId} — projectId là VirtualLabProject.Id (Guid).
// BE chỉ đọc parts[].id/parts[].type và connections[][0..1] (xem
// VirtualLabDiagramService.ParseParts/ParseConnections), mọi field khác
// (x/y/rotate/attrs/pinMapping, màu dây, waypoint...) được giữ nguyên qua
// GetRawText() round-trip — không cần strip/convert gì thêm trước khi gửi.
export const diagramsApi = {
  get: async (projectId: string): Promise<DiagramSessionEntity> => {
    const response = await api.get(`/diagrams/${projectId}`);
    return normalizeDiagramSession(response.data);
  },
  save: async (
    projectId: string,
    data: SaveDiagramPayload
  ): Promise<DiagramSessionEntity> => {
    const response = await api.put(`/diagrams/${projectId}`, {
      diagramJson: JSON.stringify({
        parts: data.circuitConfig.parts ?? [],
        connections: data.circuitConfig.connections ?? [],
        // Sensor Input Bridge — Phase 1: chỉ ghi key này khi thật sự có dữ
        // liệu, giữ diagramJson cho lab không dùng sensor scenario y hệt như
        // trước (không key thừa) — BE TryParseScenario() coi thiếu key này là
        // "không có scenario", không phải lỗi.
        ...(data.circuitConfig.sensorScenario ? { sensorScenario: data.circuitConfig.sensorScenario } : {}),
      }),
      sourceCode: data.sourceCode,
      labId: data.labId,
    });
    return normalizeDiagramSession(response.data);
  },
};

export interface VirtualLabSubmissionPayload {
  assignmentId: number;
  sessionId: string;
  circuitConfig: LabCircuitConfig;
  sourceCode: string;
  simulationEvents: SimulationEventEntity[];
}

export interface AutoGradeCheckEntity {
  name: string;
  passed: boolean;
  message: string;
}

export interface AutoGradeResultEntity {
  passed: boolean;
  passedChecks: number;
  totalChecks: number;
  checks: AutoGradeCheckEntity[];
}

export interface VirtualLabSubmissionResult {
  submissionId: number;
  status: string;
  autoScore: number | null;
  autoCheck: AutoGradeResultEntity;
}

function normalizeAutoGradeCheck(value: unknown): AutoGradeCheckEntity {
  const source = toRecord(value) ?? {};
  return {
    name: toStringValue(pick(source, 'name', 'Name')),
    passed: toBooleanValue(pick(source, 'passed', 'Passed')),
    message: toStringValue(pick(source, 'message', 'Message')),
  };
}

function normalizeAutoGradeResult(value: unknown): AutoGradeResultEntity {
  const source = toRecord(value) ?? {};
  return {
    passed: toBooleanValue(pick(source, 'passed', 'Passed')),
    passedChecks: toNumberValue(pick(source, 'passedChecks', 'PassedChecks')),
    totalChecks: toNumberValue(pick(source, 'totalChecks', 'TotalChecks')),
    checks: toUnknownArray(pick(source, 'checks', 'Checks')).map(normalizeAutoGradeCheck),
  };
}

function normalizeVirtualLabSubmission(value: unknown): VirtualLabSubmissionResult {
  const source = toRecord(unwrapApiData<unknown>(value)) ?? {};
  return {
    submissionId: toNumberValue(pick(source, 'submissionId', 'SubmissionId')),
    status: toStringValue(pick(source, 'status', 'Status')),
    autoScore: toNullableNumber(pick(source, 'autoScore', 'AutoScore')),
    autoCheck: normalizeAutoGradeResult(pick(source, 'autoCheck', 'AutoCheck')),
  };
}

export type SubmissionStatus = 'draft' | 'submitted' | 'graded';

export interface SubmissionEntity {
  id: number;
  assignmentId: number;
  assignmentTitle: string;
  assignmentType: string; // 'quiz' | 'text_report' | 'practical_simulation'
  classId: number;
  classCode: string;
  studentId: number | null;
  studentName: string;
  studentEmail: string;
  fileId: number | null;
  fileUrl: string;
  status: SubmissionStatus;
  score: number | null;
  finalScore: number | null;
  attemptNumber: number;
  gradedById: number | null;
  gradedByName: string;
  gradedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetSubmissionsParams {
  assignmentId?: number;
  classId?: number;
  studentId?: number;
  pageNumber?: number;
  pageSize?: number;
}

export interface PagedSubmissionsResult {
  items: SubmissionEntity[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// GetSubmissionsHandler.cs — enum thật chỉ có 3 giá trị này (SubmissionStatuses.All).
function normalizeSubmissionStatus(value: unknown): SubmissionStatus {
  const normalized = typeof value === 'string' ? value.toLowerCase() : '';
  if (normalized === 'graded') return 'graded';
  if (normalized === 'draft') return 'draft';
  return 'submitted';
}

function normalizeSubmissionEntity(value: unknown): SubmissionEntity {
  const source = toRecord(value) ?? {};
  return {
    id: toNumberValue(pick(source, 'id', 'Id')),
    assignmentId: toNumberValue(pick(source, 'assignmentId', 'AssignmentId')),
    assignmentTitle: toStringValue(pick(source, 'assignmentTitle', 'AssignmentTitle')),
    assignmentType: toStringValue(pick(source, 'assignmentType', 'AssignmentType', 'assignmenttype')),
    classId: toNumberValue(pick(source, 'classId', 'ClassId')),
    classCode: toStringValue(pick(source, 'classCode', 'ClassCode')),
    studentId: toNullableNumber(pick(source, 'studentId', 'StudentId')),
    studentName: toStringValue(pick(source, 'studentName', 'StudentName')),
    studentEmail: toStringValue(pick(source, 'studentEmail', 'StudentEmail')),
    fileId: toNullableNumber(pick(source, 'fileId', 'FileId')),
    fileUrl: toStringValue(pick(source, 'fileUrl', 'FileUrl')),
    status: normalizeSubmissionStatus(pick(source, 'status', 'Status')),
    score: toNullableNumber(pick(source, 'score', 'Score')),
    finalScore: toNullableNumber(pick(source, 'finalScore', 'FinalScore')),
    attemptNumber: toNumberValue(pick(source, 'attemptNumber', 'AttemptNumber')),
    gradedById: toNullableNumber(pick(source, 'gradedById', 'GradedById')),
    gradedByName: toStringValue(pick(source, 'gradedByName', 'GradedByName')),
    gradedAt: (pick(source, 'gradedAt', 'GradedAt') as string | null | undefined) ?? null,
    createdAt: toStringValue(pick(source, 'createdAt', 'CreatedAt')),
    updatedAt: toStringValue(pick(source, 'updatedAt', 'UpdatedAt')),
  };
}

function normalizeSubmissionsResponse(payload: unknown): PagedSubmissionsResult {
  const data = toRecord(unwrapApiData<unknown>(payload)) ?? {};
  const items = toUnknownArray(pick(data, 'items', 'Items')).map(normalizeSubmissionEntity);

  return {
    items,
    totalCount: toNumberValue(pick(data, 'totalCount', 'TotalCount')),
    pageNumber: toNumberValue(pick(data, 'pageNumber', 'PageNumber'), 1),
    pageSize: toNumberValue(pick(data, 'pageSize', 'PageSize'), items.length),
    totalPages: toNumberValue(pick(data, 'totalPages', 'TotalPages')),
  };
}

export interface SubmissionDetailResponse {
  id: number;
  assignmentId: number;
  assignmentTitle: string;
  classId: number;
  classCode: string;
  studentId: number | null;
  studentName: string;
  studentEmail: string;
  fileId: number | null;
  fileUrl: string;
  status: string;
  contentJson: string;
  autoGradeResultJson?: string;
  autoScore?: number;
  finalScore?: number;
  attemptNumber: number;
  score?: number;
  feedback?: string;
  gradedById?: number;
  gradedByName: string;
  gradedAt?: string;
  createdAt: string;
  updatedAt: string;
  assignmentType?: string;
  maxScore?: number;
  rubricCriteria?: { name: string; maxPoints: number; description?: string }[];
}

function normalizeSubmissionDetailResponse(payload: unknown): SubmissionDetailResponse {
  const source = toRecord(unwrapApiData<unknown>(payload)) ?? {};
  return {
    id: toNumberValue(pick(source, 'id', 'Id')),
    assignmentId: toNumberValue(pick(source, 'assignmentId', 'AssignmentId')),
    assignmentTitle: toStringValue(pick(source, 'assignmentTitle', 'AssignmentTitle')),
    classId: toNumberValue(pick(source, 'classId', 'ClassId')),
    classCode: toStringValue(pick(source, 'classCode', 'ClassCode')),
    studentId: toNullableNumber(pick(source, 'studentId', 'StudentId')),
    studentName: toStringValue(pick(source, 'studentName', 'StudentName')),
    studentEmail: toStringValue(pick(source, 'studentEmail', 'StudentEmail')),
    fileId: toNullableNumber(pick(source, 'fileId', 'FileId')),
    fileUrl: toStringValue(pick(source, 'fileUrl', 'FileUrl')),
    status: toStringValue(pick(source, 'status', 'Status')),
    contentJson: toStringValue(pick(source, 'contentJson', 'ContentJson'), '{}'),
    autoGradeResultJson: toStringValue(pick(source, 'autoGradeResultJson', 'AutoGradeResultJson')),
    autoScore: toNullableNumber(pick(source, 'autoScore', 'AutoScore')) ?? undefined,
    finalScore: toNullableNumber(pick(source, 'finalScore', 'FinalScore')) ?? undefined,
    attemptNumber: toNumberValue(pick(source, 'attemptNumber', 'AttemptNumber')),
    score: toNullableNumber(pick(source, 'score', 'Score')) ?? undefined,
    feedback: toStringValue(pick(source, 'feedback', 'Feedback')),
    gradedById: toNullableNumber(pick(source, 'gradedById', 'GradedById')) ?? undefined,
    gradedByName: toStringValue(pick(source, 'gradedByName', 'GradedByName')),
    gradedAt: (pick(source, 'gradedAt', 'GradedAt') as string | null | undefined) ?? undefined,
    createdAt: toStringValue(pick(source, 'createdAt', 'CreatedAt')),
    updatedAt: toStringValue(pick(source, 'updatedAt', 'UpdatedAt')),
    assignmentType: toStringValue(pick(source, 'assignmentType', 'AssignmentType')),
    maxScore: toNumberValue(pick(source, 'maxScore', 'MaxScore')),
    rubricCriteria: normalizeRubricCriteria(pick(source, 'rubricCriteria', 'RubricCriteria')),
  };
}

// GET /Grading/submissions — GetSubmissionsHandler.cs tự scope theo role trong JWT hiện tại
// (Teacher chỉ thấy submission của lớp mình dạy, không cần/không được gửi TeacherId thủ
// công) và đã OrderByDescending(CreatedAt) sẵn ở SubmissionRepository — không cần FE sort lại.
export const gradingApi = {
  getSubmissions: async (params?: GetSubmissionsParams): Promise<PagedSubmissionsResult> => {
    const queryParams: Record<string, number> = {};
    if (params?.assignmentId) queryParams.AssignmentId = params.assignmentId;
    if (params?.classId) queryParams.ClassId = params.classId;
    if (params?.studentId) queryParams.StudentId = params.studentId;
    if (params?.pageNumber) queryParams.PageNumber = params.pageNumber;
    if (params?.pageSize) queryParams.PageSize = params.pageSize;

    const response = await api.get('/Grading/submissions', {
      params: Object.keys(queryParams).length ? queryParams : undefined,
    });
    return normalizeSubmissionsResponse(response.data);
  },

  getSubmissionDetail: async (submissionId: number): Promise<SubmissionDetailResponse> => {
    const response = await api.get(`/Grading/submissions/${submissionId}`);
    return normalizeSubmissionDetailResponse(response.data);
  },

  gradeSubmission: async (submissionId: number, score: number, feedback?: string): Promise<any> => {
    const response = await api.post(`/Grading/submissions/${submissionId}/grade`, {
      score,
      feedback,
    });
    return response.data;
  },
};

// POST api/submissions/virtual-lab — BE tự resolve studentId từ JWT (không còn
// tin StudentId client gửi, xem 5.3b), tự re-compile server-side (không đọc
// CompileResult client gửi, xem 5.3) — không cần gửi CompileResult/StudentId.
export const submissionsApi = {
  submitVirtualLab: async (
    payload: VirtualLabSubmissionPayload
  ): Promise<VirtualLabSubmissionResult> => {
    const response = await api.post('/submissions/virtual-lab', {
      assignmentId: payload.assignmentId,
      sessionId: payload.sessionId,
      diagramJson: JSON.stringify({
        parts: payload.circuitConfig.parts ?? [],
        connections: payload.circuitConfig.connections ?? [],
      }),
      sourceCode: payload.sourceCode,
      simulationEvents: payload.simulationEvents,
    });
    return normalizeVirtualLabSubmission(response.data);
  },
};

export const simulationsApi = {
  getComponents: async (): Promise<SimulationComponentMeta[]> => {
    const response = await api.get('/simulations/components');
    return toUnknownArray(unwrapApiData<unknown>(response.data)).map(
      normalizeSimulationComponent
    );
  },
  createTemplate: async (
    data: CreateSimulationTemplateRequest
  ): Promise<SimulationTemplateEntity> => {
    const response = await api.post('/simulations/templates', data);
    return normalizeSimulationTemplate(response.data);
  },
  getTemplate: async (id: number): Promise<SimulationTemplateEntity> => {
    const response = await api.get(`/simulations/templates/${id}`);
    return normalizeSimulationTemplate(response.data);
  },
  updateDiagram: async (
    id: number,
    data: UpdateSimulationDiagramRequest
  ): Promise<SimulationTemplateEntity> => {
    const response = await api.patch(`/simulations/templates/${id}/diagram`, data);
    return normalizeSimulationTemplate(response.data);
  },
  getPythonCode: async (id: number): Promise<{ templateId: number; pythonCode: string }> => {
    const response = await api.get(`/simulations/templates/${id}/python`);
    const source = toRecord(unwrapApiData<unknown>(response.data)) ?? {};
    return {
      templateId: toNumberValue(pick(source, 'templateId', 'TemplateId'), id),
      pythonCode: toStringValue(pick(source, 'pythonCode', 'PythonCode')),
    };
  },
  createSession: async (
    data: CreateSimulationSessionRequest
  ): Promise<SimulationSessionEntity> => {
    const response = await api.post('/simulations/sessions', data);
    return normalizeSimulationSession(response.data);
  },
  suggestWithAi: async (data: AiSuggestRequest): Promise<AiSuggestResponse> => {
    const response = await api.post('/simulations/ai/suggest', data);
    return normalizeAiSuggest(response.data);
  },
};

export const simulationCompileApi = {
  compile: async (data: CompileSimulationRequest): Promise<CompileSimulationResponse> => {
    const response = await api.post('/simulation/compile', {
      assignmentId: data.assignmentId ?? null,
      labId: data.labId ?? null,
      code: data.code,
      board: data.board ?? 'arduino:avr:uno',
      framework: data.framework,
    });
    return normalizeCompileResponse(response.data);
  },
  getJob: async (jobId: string): Promise<CompileJobResponse> => {
    const response = await api.get(`/simulation/compile-jobs/${jobId}`);
    return normalizeCompileJob(response.data);
  },
};

export const virtualLabsApi = {
  getAll: async (
    params?: LegacyVirtualLabsListParams
  ): Promise<LegacyVirtualLabsListResponse> => {
    const queryParams = buildLegacyVirtualLabsParams(params);
    const response = await api.get(
      '/VirtualLabs',
      queryParams ? { params: queryParams } : undefined
    );
    return normalizeLegacyVirtualLabsResponse(response.data);
  },
  getById: async (id: number): Promise<LegacyVirtualLabEntity> => {
    const response = await api.get(`/VirtualLabs/${id}`);
    return normalizeLegacyVirtualLab(unwrapApiData<unknown>(response.data));
  },
  create: async (
    data: CreateLegacyVirtualLabRequest
  ): Promise<LegacyVirtualLabEntity> => {
    const response = await api.post('/VirtualLabs', data);
    return normalizeLegacyVirtualLab(unwrapApiData<unknown>(response.data));
  },
  update: async (
    id: number,
    data: CreateLegacyVirtualLabRequest
  ): Promise<LegacyVirtualLabEntity> => {
    const response = await api.put(`/VirtualLabs/${id}`, data);
    return normalizeLegacyVirtualLab(unwrapApiData<unknown>(response.data));
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/VirtualLabs/${id}`);
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
  representativePosition?: string;
  studentScale?: string;
  website?: string;
  notes?: string;
  phone?: string;
  usersCount?: number;
  membersCount?: number;
  users?: any[];
  adminUser?: {
    id: number;
    email: string;
    fullName: string;
    phone?: string;
    isEmailVerified?: boolean;
  };
  attachmentUrl?: string;
  attachmentFileName?: string;
  originalAttachmentFileName?: string;
  rejectionReason?: string;
}

export const schoolRequestsApi = {
  getPending: async (): Promise<SchoolRequest[]> => {
    const response = await api.get('/school-requests/pending');
    return response.data.data;
  },
  approve: async (schoolId: number): Promise<void> => {
    await api.post(`/school-requests/${schoolId}/approve`);
  },
  reject: async (schoolId: number, reason: string): Promise<void> => {
    await api.post(`/school-requests/${schoolId}/reject`, { reason });
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
