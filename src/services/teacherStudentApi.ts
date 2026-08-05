import { api } from './api';

// ==========================================
// Teacher API
// ==========================================
export interface TeacherAssignment {
  id: number;
  title: string;
  classId: number;
  className: string;
  dueDate: string;
  submittedCount: number;
  totalStudents: number;
  status: 'pending' | 'graded' | 'overdue';
}

export interface TeacherClass {
  id: number;
  name: string;
  courseName: string;
  studentCount: number;
  schedule: string;
  room: string;
}

export interface TeacherStats {
  totalClasses: number;
  totalStudents: number;
  pendingAssignments: number;
  upcomingSessions: number;
}

export interface TeacherSubmission {
  id: number;
  studentName: string;
  assignmentTitle: string;
  className: string;
  submittedAt: string;
  status: 'submitted' | 'graded';
  score?: number;
}

const teacherApi = {
  // Get teacher's classes
  getClasses: async (params?: { pageNumber?: number; pageSize?: number; search?: string }): Promise<{
    items: TeacherClass[];
    total: number;
    page: number;
    pageSize: number;
  }> => {
    const response = await api.get('/classes/my-classes', { params });
    return response.data.data || { items: [], total: 0, page: 1, pageSize: 10 };
  },

  // Get teacher's assignments
  getAssignments: async (params?: { pageNumber?: number; pageSize?: number; classId?: number }): Promise<{
    items: TeacherAssignment[];
    total: number;
    page: number;
    pageSize: number;
  }> => {
    const response = await api.get('/assignments/teacher', { params });
    return response.data.data || { items: [], total: 0, page: 1, pageSize: 10 };
  },

  // Get submissions to grade
  getSubmissions: async (params?: { pageNumber?: number; pageSize?: number; assignmentId?: number }): Promise<{
    items: TeacherSubmission[];
    total: number;
    page: number;
    pageSize: number;
  }> => {
    const response = await api.get('/submissions/pending', { params });
    return response.data.data || { items: [], total: 0, page: 1, pageSize: 10 };
  },

  // Grade a submission
  gradeSubmission: async (submissionId: number, score: number, feedback?: string): Promise<void> => {
    await api.post(`/submissions/${submissionId}/grade`, { score, feedback });
  },

  // Get teacher's dashboard stats
  getStats: async (): Promise<TeacherStats> => {
    const response = await api.get('/teachers/dashboard-stats');
    return response.data.data || {
      totalClasses: 0,
      totalStudents: 0,
      pendingAssignments: 0,
      upcomingSessions: 0,
    };
  },

  // Get recent activities
  getRecentActivities: async (limit: number = 10): Promise<{
    id: number;
    type: string;
    title: string;
    description: string;
    time: string;
  }[]> => {
    const response = await api.get('/teachers/recent-activities', { params: { limit } });
    return response.data.data || [];
  },
};

// ==========================================
// Student API
// ==========================================
export interface StudentClass {
  id: number;
  name: string;
  courseName: string;
  teacherName: string;
  schedule: string;
  room: string;
  progress: number;
  nextSession: string;
  status: 'active' | 'completed' | 'upcoming';
}

export interface StudentAssignment {
  id: number;
  title: string;
  className: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded' | 'overdue';
  score?: number;
  maxScore: number;
}

export interface StudentCourse {
  id: number;
  name: string;
  description: string;
  instructor: string;
  enrolledAt: string;
  progress: number;
  lessonsCompleted: number;
  totalLessons: number;
}

export interface StudentStats {
  enrolledClasses: number;
  completedLessons: number;
  pendingSubmissions: number;
  averageScore: number;
  achievements: number;
}

export interface StudentSubmission {
  id: number;
  assignmentTitle: string;
  className: string;
  submittedAt: string;
  status: 'submitted' | 'graded';
  score?: number;
  maxScore: number;
}

const studentApi = {
  // Get student's enrolled classes
  getClasses: async (params?: { pageNumber?: number; pageSize?: number; status?: string }): Promise<{
    items: StudentClass[];
    total: number;
    page: number;
    pageSize: number;
  }> => {
    const response = await api.get('/classes/my-classes', { params });
    return response.data.data || { items: [], total: 0, page: 1, pageSize: 10 };
  },

  // Get student's assignments
  getAssignments: async (params?: { pageNumber?: number; pageSize?: number; status?: string }): Promise<{
    items: StudentAssignment[];
    total: number;
    page: number;
    pageSize: number;
  }> => {
    const response = await api.get('/assignments/student', { params });
    return response.data.data || { items: [], total: 0, page: 1, pageSize: 10 };
  },

  // Get student's courses
  getCourses: async (params?: { pageNumber?: number; pageSize?: number }): Promise<{
    items: StudentCourse[];
    total: number;
    page: number;
    pageSize: number;
  }> => {
    const response = await api.get('/courses/my-courses', { params });
    return response.data.data || { items: [], total: 0, page: 1, pageSize: 10 };
  },

  // Get my submissions
  getSubmissions: async (params?: { pageNumber?: number; pageSize?: number }): Promise<{
    items: StudentSubmission[];
    total: number;
    page: number;
    pageSize: number;
  }> => {
    const response = await api.get('/submissions/my-submissions', { params });
    return response.data.data || { items: [], total: 0, page: 1, pageSize: 10 };
  },

  // Submit an assignment
  submitAssignment: async (assignmentId: number, content: string, fileUrl?: string): Promise<void> => {
    await api.post('/submissions', { assignmentId, content, fileUrl });
  },

  // Get student's dashboard stats
  getStats: async (): Promise<StudentStats> => {
    const response = await api.get('/students/dashboard-stats');
    return response.data.data || {
      enrolledClasses: 0,
      completedLessons: 0,
      pendingSubmissions: 0,
      averageScore: 0,
      achievements: 0,
    };
  },

  // Get recent activities
  getRecentActivities: async (limit: number = 10): Promise<{
    id: number;
    type: string;
    title: string;
    description: string;
    time: string;
  }[]> => {
    const response = await api.get('/students/recent-activities', { params: { limit } });
    return response.data.data || [];
  },

  // Get achievements
  getAchievements: async (): Promise<{
    id: number;
    title: string;
    description: string;
    icon: string;
    earnedAt: string;
  }[]> => {
    const response = await api.get('/students/achievements');
    return response.data.data || [];
  },
};

export { teacherApi, studentApi };
