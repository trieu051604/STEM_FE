import { api } from './api';
import type { ModuleWithLessons } from './dashboardApi';

// Helper function to determine class status based on dates
function getClassStatus(item: any): 'active' | 'completed' | 'upcoming' {
  const now = new Date();
  const startDate = item.startDate ? new Date(item.startDate) : null;
  const endDate = item.endDate ? new Date(item.endDate) : null;
  
  if (startDate && endDate) {
    if (now < startDate) return 'upcoming';
    if (now > endDate) return 'completed';
    return 'active';
  }
  return 'active';
}

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

export interface TeacherClassDetail {
  id: number;
  name: string;
  courseId: number;
  courseName: string;
  status: string;
  startDate?: string;
  endDate?: string;
  students: {
    id: number;
    fullName: string;
    email: string;
    enrolledAt: string;
  }[];
  // Curriculum from separate API call
  modules?: ModuleWithLessons[];
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

  // Get teacher's class detail
  getClassDetail: async (classId: number): Promise<TeacherClassDetail> => {
    const response = await api.get(`/classes/${classId}/detail`);
    return response.data.data;
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

// Student Class interfaces
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
  courseId?: number;
  classCode?: string;
}

export interface StudentClassDetail {
  id: number;
  classCode: string;
  className: string;
  courseName: string;
  teacherName: string;
  teacherEmail?: string;
  schedule: string;
  room: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: 'active' | 'completed' | 'upcoming';
  modules: StudentModule[];
  assignments: StudentAssignment[];
  scheduleItems: StudentScheduleItem[];
}

export interface StudentModule {
  id: number;
  title: string;
  description: string;
  order: number;
  lessonsCompleted: number;
  totalLessons: number;
  isCompleted: boolean;
}

export interface StudentScheduleItem {
  id: number;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  status: 'upcoming' | 'ongoing' | 'completed';
}

// Student Assignment interfaces
export interface StudentAssignment {
  id: number;
  title: string;
  className: string;
  classId?: number;
  dueDate: string;
  assignmentType?: 'quiz' | 'text_report' | 'practical_simulation';
  status: 'pending' | 'submitted' | 'graded' | 'overdue';
  score?: number;
  maxScore: number;
  description?: string;
  submissionContent?: string;
  submittedAt?: string;
  feedback?: string;
  // Submission tracking
  hasSubmitted?: boolean;
  highestScore?: number;
  lastAttemptNumber?: number;
  canResubmit?: boolean;
  allowResubmit?: boolean;
  resubmitLimit?: number;
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

// Schedule interfaces
export interface StudentScheduleResponse {
  id: number;
  title: string;
  start: string;
  end: string;
  classCode: string;
  className: string;
  color: string;
}

// Virtual Lab interfaces
export interface StudentVirtualLab {
  id: number;
  title: string;
  description: string;
  classId: number;
  className: string;
  status: 'not_started' | 'in_progress' | 'completed';
  score?: number;
  dueDate?: string;
}

// Activity interfaces
export interface StudentActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
}

// Achievement interfaces
export interface StudentAchievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
}

// Quiz interfaces
export interface StudentQuiz {
  id: number;
  title: string;
  className: string;
  classId: number;
  dueDate?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  score?: number;
  maxScore: number;
}

export interface QuizQuestion {
  id: number;
  question: string;
  type: 'multiple_choice' | 'true_false';
  options: string[];
  correctAnswer: number;
  points: number;
}

export interface QuizSubmission {
  answers: { questionId: number; answer: number }[];
}

// Profile interfaces
export interface StudentProfile {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  avatar?: string;
  schoolName?: string;
  enrolledClasses: number;
  averageScore?: number;
  certificatesEarned: number;
}

const studentApi = {
  // ========== CLASSES ==========

  // Get student's enrolled classes - calls /api/classes/my-classes
  getClasses: async (params?: { pageNumber?: number; pageSize?: number; status?: string }): Promise<{
    items: StudentClass[];
    total: number;
    page: number;
    pageSize: number;
  }> => {
    try {
      const response = await api.get('/classes/my-classes', { 
        params: { 
          pageNumber: params?.pageNumber || 1, 
          pageSize: params?.pageSize || 10,
          status: params?.status 
        } 
      });
      
      // Backend returns { success: true, data: { items, totalCount, pageNumber, pageSize } }
      const data = response.data.data;
      
      // Map backend response to frontend interface
      const items: StudentClass[] = (data?.items || []).map((item: any) => ({
        id: item.id,
        name: item.classCode || item.courseName || `Lớp #${item.id}`,
        courseName: item.courseName || '',
        teacherName: item.teacherName || '',
        schedule: '', // Will be fetched from schedule API
        room: '', // Will be fetched from schedule API
        progress: 0, // Will be calculated from assignments
        nextSession: '',
        status: getClassStatus(item),
        courseId: item.courseId,
        classCode: item.classCode,
      }));
      
      return {
        items,
        total: data?.totalCount || 0,
        page: data?.pageNumber || 1,
        pageSize: data?.pageSize || 10,
      };
    } catch (error) {
      console.error('Error fetching student classes:', error);
      return { items: [], total: 0, page: 1, pageSize: 10 };
    }
  },

  // Get class detail
  getClassDetail: async (classId: number): Promise<StudentClassDetail> => {
    const response = await api.get(`/classes/${classId}/detail`);
    return response.data.data;
  },

  // Get my class schedule
  getMyClassSchedule: async (classId: number, fromDate?: string, toDate?: string): Promise<StudentScheduleItem[]> => {
    const response = await api.get(`/classes/${classId}/schedule`, { 
      params: { fromDate, toDate } 
    });
    return response.data.data || [];
  },

  // ========== ASSIGNMENTS ==========

  // Get student's assignments
  getAssignments: async (params?: { pageNumber?: number; pageSize?: number; status?: string; classId?: number }): Promise<{
    items: StudentAssignment[];
    total: number;
    page: number;
    pageSize: number;
  }> => {
    const response = await api.get('/assignments/student', { params });
    const data = response.data.data;
    console.log('[DEBUG] Assignments response:', data);
    
    // Map backend response to frontend interface
    const items: StudentAssignment[] = (data?.items || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      className: item.classCode || item.courseTitle || 'Chưa gán lớp',
      classId: item.classId,
      dueDate: item.dueDate,
      status: item.status?.toLowerCase() || 'pending',
      score: item.score,
      maxScore: item.maxScore,
      description: item.description,
      hasSubmitted: item.hasSubmitted,
      highestScore: item.highestScore,
      lastAttemptNumber: item.lastAttemptNumber,
      canResubmit: item.canResubmit,
      allowResubmit: item.allowResubmit,
      resubmitLimit: item.resubmitLimit,
    }));
    
    return {
      items,
      total: data?.totalCount || 0,
      page: data?.pageNumber || 1,
      pageSize: data?.pageSize || 10,
    };
  },

  // Submit assignment
  submitAssignment: async (assignmentId: number, content: string, fileUrl?: string): Promise<void> => {
    await api.post('/submissions', { assignmentId, content, fileUrl });
  },

  // Get my submissions - calls /api/grading/submissions
  getSubmissions: async (params?: { pageNumber?: number; pageSize?: number }): Promise<{
    items: StudentSubmission[];
    total: number;
    page: number;
    pageSize: number;
  }> => {
    try {
      const response = await api.get('/grading/submissions', { 
        params: { 
          pageNumber: params?.pageNumber || 1, 
          pageSize: params?.pageSize || 20,
        } 
      });
      
      const data = response.data.data;
      
      // Map backend response to frontend interface
      const items: StudentSubmission[] = (data?.items || []).map((item: any) => ({
        id: item.id,
        assignmentTitle: item.assignmentTitle || item.assignment?.title || 'Unknown Assignment',
        className: item.className || item.class?.name || item.class?.classCode || 'Unknown Class',
        submittedAt: item.submittedAt || item.createdAt,
        status: item.gradedAt ? 'graded' as const : 'submitted' as const,
        score: item.score,
        maxScore: item.maxScore || item.assignment?.maxScore || 10,
      }));
      
      return {
        items,
        total: data?.totalCount || 0,
        page: data?.pageNumber || 1,
        pageSize: data?.pageSize || 20,
      };
    } catch (error) {
      console.error('Error fetching submissions:', error);
      return { items: [], total: 0, page: 1, pageSize: 20 };
    }
  },

  // ========== SCHEDULE ==========

  // Get my schedule (calendar view) - calls /api/schedules/my-schedule
  getMySchedule: async (fromDate?: string, toDate?: string): Promise<StudentScheduleResponse[]> => {
    try {
      const response = await api.get('/schedules/my-schedule', { 
        params: { fromDate, toDate } 
      });
      
      // Backend returns { success: true, data: [...] }
      const data = response.data.data || [];
      
      // Map backend response to frontend interface
      const schedules: StudentScheduleResponse[] = data.map((item: any) => ({
        id: item.id,
        title: item.title || 'Lịch học',
        start: item.start || item.dateTime || item.startDateTime,
        end: item.end || item.endDateTime,
        classCode: item.classCode || item.class?.classCode || '',
        className: item.className || item.class?.name || item.class?.courseName || 'Unknown',
        color: item.color || '#3B82F6', // Default blue color
      }));
      
      return schedules;
    } catch (error) {
      console.error('Error fetching schedule:', error);
      return [];
    }
  },

  // ========== VIRTUAL LABS ==========

  // Get virtual labs for student - calls /api/VirtualLabs/student
  getVirtualLabs: async (params?: { pageNumber?: number; pageSize?: number; classId?: number }): Promise<{
    items: StudentVirtualLab[];
    total: number;
    page: number;
    pageSize: number;
  }> => {
    try {
      const response = await api.get('/VirtualLabs/student', { 
        params: { 
          pageNumber: params?.pageNumber || 1, 
          pageSize: params?.pageSize || 20,
          classId: params?.classId 
        } 
      });
      
      // Backend returns { success: true, data: { items, totalCount, pageNumber, pageSize } }
      const data = response.data.data;
      
      // Map backend response to frontend interface
      const items: StudentVirtualLab[] = (data?.items || []).map((item: any) => ({
        id: item.id,
        title: item.title || `Lab #${item.id}`,
        description: item.description || '',
        classId: item.classId || item.class?.id || 0,
        className: item.className || item.class?.name || item.class?.classCode || 'Unknown Class',
        status: item.status || 'not_started',
        score: item.score,
        dueDate: item.dueDate,
      }));
      
      return {
        items,
        total: data?.totalCount || 0,
        page: data?.pageNumber || 1,
        pageSize: data?.pageSize || 20,
      };
    } catch (error) {
      console.error('Error fetching virtual labs:', error);
      return { items: [], total: 0, page: 1, pageSize: 20 };
    }
  },

  // Get virtual lab detail
  getVirtualLabDetail: async (labId: number): Promise<any> => {
    const response = await api.get(`/VirtualLabs/${labId}`);
    return response.data.data;
  },

  // ========== QUIZZES ==========

  // Get quizzes for student
  getQuizzes: async (params?: { pageNumber?: number; pageSize?: number; classId?: number }): Promise<{
    items: StudentQuiz[];
    total: number;
    page: number;
    pageSize: number;
  }> => {
    const response = await api.get('/quizzes/student', { params });
    return response.data.data || { items: [], total: 0, page: 1, pageSize: 10 };
  },

  // Get quiz detail with questions
  getQuizDetail: async (quizId: number): Promise<{ quiz: StudentQuiz; questions: QuizQuestion[] }> => {
    const response = await api.get(`/quizzes/${quizId}`);
    return response.data.data;
  },

  // Submit quiz
  submitQuiz: async (quizId: number, answers: { questionId: number; answer: number }[]): Promise<{ score: number; maxScore: number }> => {
    const response = await api.post(`/quizzes/${quizId}/submit`, { answers });
    return response.data.data;
  },

  // ========== ASSIGNMENT SUBMISSIONS ==========

  // Get assignment detail (full with quiz questions for students)
  getAssignmentDetailWithQuiz: async (assignmentId: number): Promise<any> => {
    const response = await api.get(`/assignments/${assignmentId}`);
    return response.data.data;
  },

  // Submit quiz assignment
  submitQuizAssignment: async (assignmentId: number, answers: { questionId: string; answer: any }[]): Promise<{
    submissionId: number;
    attemptNumber: number;
    score: number;
    maxScore: number;
    correctCount: number;
    totalQuestions: number;
    isAutoGraded: boolean;
    results: { questionId: string; isCorrect: boolean; studentAnswer: any; correctAnswer: any }[];
  }> => {
    const response = await api.post(`/assignments/${assignmentId}/submit-quiz`, { answers });
    return response.data.data;
  },

  // Submit report assignment
  submitReportAssignment: async (assignmentId: number, data: { content?: string; fileId?: number; fileUrl?: string }): Promise<{
    submissionId: number;
    attemptNumber: number;
    status: string;
    submittedAt: string;
  }> => {
    const response = await api.post(`/assignments/${assignmentId}/submit-report`, data);
    return response.data.data;
  },

  // Upload file for assignments
  uploadFile: async (file: File, type: string = 'general'): Promise<{
    success: boolean;
    url: string;
    fileName: string;
    originalName: string;
    fileId?: number;
    message: string;
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    // Use the appropriate endpoint based on type
    const endpoint = type === 'submissions' ? '/upload/assignment' : '/upload';

    const response = await api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Submit simulation assignment
  submitSimulationAssignment: async (assignmentId: number, data: { circuit?: any; code?: string; description?: string }): Promise<{
    submissionId: number;
    attemptNumber: number;
    score: number;
    maxScore: number;
    isCorrect: boolean;
    validationMessage: string;
    isAutoGraded: boolean;
  }> => {
    const response = await api.post(`/assignments/${assignmentId}/submit-simulation`, data);
    return response.data.data;
  },

  // Get my submission for an assignment
  getMySubmission: async (assignmentId: number): Promise<{
    submissionId: number;
    assignmentId: number;
    assignmentTitle: string;
    assignmentType: string;
    status: string;
    attemptNumber: number;
    score?: number;
    maxScore: number;
    contentJson?: string;
    fileId?: number;
    fileUrl?: string;
    feedback?: string;
    gradedAt?: string;
    submittedAt: string;
    canResubmit: boolean;
    remainingAttempts?: number;
  } | null> => {
    try {
      const response = await api.get(`/assignments/${assignmentId}/my-submission`);
      return response.data.data;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Get all my submissions (paged)
  getMySubmissions: async (params?: { pageNumber?: number; pageSize?: number; assignmentId?: number }): Promise<{
    items: {
      submissionId: number;
      assignmentId: number;
      assignmentTitle: string;
      assignmentType: string;
      status: string;
      attemptNumber: number;
      score?: number;
      maxScore: number;
      submittedAt: string;
    }[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
  }> => {
    const response = await api.get('/assignments/my-submissions', { params });
    return response.data.data || { items: [], totalCount: 0, pageNumber: 1, pageSize: 20 };
  },

  // ========== PROFILE ==========

  // Get student profile
  getProfile: async (): Promise<StudentProfile> => {
    const response = await api.get('/students/profile');
    return response.data.data;
  },

  // Update student profile
  updateProfile: async (data: Partial<StudentProfile>): Promise<StudentProfile> => {
    const response = await api.put('/students/profile', data);
    return response.data.data;
  },

  // ========== DASHBOARD ==========

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

  // Get recent activities - combines submissions and graded assignments
  getRecentActivities: async (limit: number = 10): Promise<StudentActivity[]> => {
    try {
      // Fetch both submissions and assignments
      const [submissionsResponse, assignmentsResponse] = await Promise.all([
        api.get('/grading/submissions', { params: { pageNumber: 1, pageSize: limit * 2 } }),
        api.get('/assignments/student', { params: { pageNumber: 1, pageSize: limit * 2 } }),
      ]);

      const submissions = submissionsResponse.data.data?.items || [];
      const assignments = assignmentsResponse.data.data?.items || [];
      
      const activities: StudentActivity[] = [];

      // Add submissions as activities
      submissions.forEach((sub: any) => {
        activities.push({
          id: `submission-${sub.id}`,
          type: 'submission',
          title: `Đã nộp bài: ${sub.assignmentTitle || sub.assignment?.title || 'Bài tập'}`,
          description: sub.className || sub.class?.name || 'Lớp học',
          time: sub.submittedAt || sub.createdAt || new Date().toISOString(),
        });
      });

      // Add graded assignments as activities
      assignments
        .filter((a: any) => a.status === 'graded' && a.score !== undefined)
        .forEach((a: any) => {
          activities.push({
            id: `graded-${a.id}`,
            type: 'grade',
            title: `Điểm: ${a.title}`,
            description: `${a.score}/${a.maxScore} điểm - ${a.className || a.class?.name || ''}`,
            time: a.gradedAt || a.updatedAt || new Date().toISOString(),
          });
        });

      // Sort by time and limit
      return (activities as Array<{
        id: string;
        type: string;
        title: string;
        description: string;
        time: string;
      }>)
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  },

  // Get achievements
  getAchievements: async (): Promise<StudentAchievement[]> => {
    const response = await api.get('/students/achievements');
    return response.data.data || [];
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
};

export { teacherApi, studentApi };
