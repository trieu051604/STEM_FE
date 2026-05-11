// ============ COURSE TYPES ============
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseSubject = 'physics' | 'chemistry' | 'biology' | 'math' | 'technology' | 'engineering';

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  subject: CourseSubject;
  level: CourseLevel;
  teacherId: string;
  teacherName: string;
  schoolId: string;
  studentCount: number;
  lessonCount: number;
  duration: number; // minutes
  rating: number;
  tags: string[];
  isPublished: boolean;
  hasSimulation: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  type: 'video' | 'reading' | 'simulation' | 'quiz';
  content?: string;
  videoUrl?: string;
  duration: number;
  isCompleted?: boolean;
}

export interface Assignment {
  id: string;
  courseId: string;
  lessonId?: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  type: 'essay' | 'file_upload' | 'quiz' | 'simulation';
  status?: 'not_started' | 'in_progress' | 'submitted' | 'graded';
  score?: number;
  feedback?: string;
}

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  questions: QuizQuestion[];
  timeLimit: number; // seconds
  maxAttempts: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer: string | number;
  points: number;
  explanation?: string;
}

export interface Enrollment {
  id: string;
  courseId: string;
  studentId: string;
  progress: number; // 0-100
  enrolledAt: string;
  completedAt?: string;
}
