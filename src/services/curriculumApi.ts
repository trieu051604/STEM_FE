import { api } from './api';

// ==========================================
// CẤU TRÚC ENGINEERING CURRICULUM
// ==========================================
// Hệ thống tập trung nghiên cứu về ENGINEERING (Kỹ thuật)
// Với Virtual Lab - phòng thí nghiệm ảo để mô phỏng
// Mỗi Chương (Module) và Bài (Lesson) đều có:
// - Input: Những gì HS cần biết TRƯỚC KHI học
// - Output: Những gì HS sẽ ĐẠT ĐƯỢC SAU KHI học xong
// ==========================================

// ==========================================
// Upload API
// ==========================================
export const uploadApi = {
  uploadFile: async (file: File, type: string = 'syllabus'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    const response = await api.post('/Upload/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data?.url || response.data;
  },
};

// ==========================================
// Grade Levels API (Khối lớp)
// ==========================================
export interface GradeLevel {
  id: number;
  name: string;
  code: string;
  level: number;
  description: string;
  displayOrder: number;
  syllabusCount: number;
  courseCount: number;
  createdAt: string;
  updatedAt: string;
}

export const gradeLevelsApi = {
  getAll: async (): Promise<GradeLevel[]> => {
    const response = await api.get('/GradeLevels');
    return response.data.data || [];
  },

  getById: async (id: number): Promise<GradeLevel> => {
    const response = await api.get(`/GradeLevels/${id}`);
    return response.data.data;
  },

  create: async (data: {
    name: string;
    code: string;
    level: number;
    description?: string;
    displayOrder?: number;
  }): Promise<number> => {
    const response = await api.post('/GradeLevels', data);
    return response.data.data.id;
  },

  update: async (id: number, data: {
    name: string;
    code: string;
    level: number;
    description?: string;
    displayOrder?: number;
  }): Promise<void> => {
    await api.put(`/GradeLevels/${id}`, data);
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/GradeLevels/${id}`);
  },
};

// ==========================================
// Syllabi API (Khung chương trình Engineering)
// ==========================================
export interface Syllabus {
  id: number;
  title: string;
  description: string;
  thumbnailUrl?: string;
  gradeLevelId?: number;
  gradeLevelName?: string;
  subjectArea: string; // Luôn là "engineering"
  status: 'draft' | 'published' | 'archived';
  displayOrder: number;
  estimatedHours: number;
  isRequired: boolean;
  isSystemOwned: boolean;
  courseCount: number;
  totalModules: number;
  totalLessons: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseInSyllabus {
  id: number;
  title: string;
  description: string;
  displayOrder: number;
  estimatedHours: number;
  isRequired: boolean;
  status: string;
  modules: ModuleInCourse[];
}

export interface ModuleInCourse {
  id: number;
  title: string;
  description: string;
  displayOrder: number;
  estimatedMinutes: number;
  // === INPUT & OUTPUT ===
  input: string;  // Những gì HS cần biết TRƯỚC KHI học chương này
  output: string; // Những gì HS sẽ ĐẠT ĐƯỢC SAU KHI học xong chương này
  // ====================
  lessons: LessonInModule[];
}

export interface LessonInModule {
  id: number;
  title: string;
  displayOrder: number;
  estimatedMinutes: number;
  lessonType: string;
  // === INPUT & OUTPUT ===
  input: string;  // Những gì HS cần biết TRƯỚC KHI học bài này
  output: string; // Những gì HS sẽ ĐẠT ĐƯỢC SAU KHI học xong bài này
  // ====================
  hasVirtualLab: boolean;
  labId?: string;
  labTitle?: string;
}

export interface SyllabusDetail extends Syllabus {
  courses: CourseInSyllabus[];
}

export const syllabiApi = {
  getAll: async (params?: {
    status?: string;
    gradeLevelId?: number;
    subjectArea?: string; // "engineering"
  }): Promise<Syllabus[]> => {
    const response = await api.get('/syllabi', { params });
    return response.data.data || [];
  },

  getById: async (id: number): Promise<SyllabusDetail> => {
    const response = await api.get(`/syllabi/${id}`);
    return response.data.data;
  },

  create: async (data: {
    title: string;
    description?: string;
    thumbnailUrl?: string;
    gradeLevelId?: number;
    subjectArea?: string; // Mặc định "engineering"
    displayOrder?: number;
    estimatedHours?: number;
    isRequired?: boolean;
  }): Promise<number> => {
    const response = await api.post('/syllabi', {
      ...data,
      subjectArea: data.subjectArea || 'engineering', // Luôn là engineering
    });
    return response.data.data.id;
  },

  update: async (id: number, data: {
    title: string;
    description?: string;
    thumbnailUrl?: string;
    gradeLevelId?: number;
    subjectArea?: string;
    displayOrder?: number;
    estimatedHours?: number;
    isRequired?: boolean;
  }): Promise<void> => {
    await api.put(`/syllabi/${id}`, data);
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/syllabi/${id}`);
  },

  publish: async (id: number): Promise<void> => {
    await api.post(`/syllabi/${id}/publish`);
  },

  archive: async (id: number): Promise<void> => {
    await api.post(`/syllabi/${id}/archive`);
  },

  unpublish: async (id: number): Promise<void> => {
    await api.post(`/syllabi/${id}/unpublish`);
  },

  restore: async (id: number): Promise<void> => {
    await api.post(`/syllabi/${id}/restore`);
  },
};

// ==========================================
// Modules API (Chương trong Engineering)
// ==========================================
export interface Module {
  id: number;
  courseId: number;
  title: string;
  description: string;
  displayOrder: number;
  estimatedMinutes: number;
  // === INPUT & OUTPUT ===
  input: string;
  output: string;
  // ====================
  lessonCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleDetail extends Module {
  lessons: LessonInModule[];
}

export interface ModuleWithClass extends Module {
  classId: number;
  className: string;
}

export const modulesApi = {
  getByCourse: async (courseId: number): Promise<Module[]> => {
    const response = await api.get(`/modules/by-course/${courseId}`);
    return response.data.data || [];
  },

  getByClass: async (classId: number): Promise<ModuleWithClass[]> => {
    const response = await api.get(`/modules/by-class/${classId}`);
    return response.data.data || [];
  },

  getById: async (id: number): Promise<ModuleDetail> => {
    const response = await api.get(`/modules/${id}`);
    return response.data.data;
  },

  create: async (data: {
    courseId: number;
    title: string;
    description?: string;
    displayOrder?: number;
    estimatedMinutes?: number;
    // === INPUT & OUTPUT ===
    input?: string;
    output?: string;
    // ====================
  }): Promise<number> => {
    const response = await api.post('/modules', data);
    return response.data.data.id;
  },

  update: async (id: number, data: {
    title: string;
    description?: string;
    displayOrder?: number;
    estimatedMinutes?: number;
    // === INPUT & OUTPUT ===
    input?: string;
    output?: string;
    // ====================
  }): Promise<void> => {
    await api.put(`/modules/${id}`, data);
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/modules/${id}`);
  },

  reorder: async (courseId: number, modules: { moduleId: number; newOrder: number }[]): Promise<void> => {
    await api.post('/modules/reorder', { courseId, modules });
  },
};

// ==========================================
// Lessons API (Bài học trong Chương)
// ==========================================
export interface Lesson {
  id: number;
  moduleId: number;
  courseId: number;
  title: string;
  content: string;
  displayOrder: number;
  estimatedMinutes: number;
  lessonType: string;
  // === INPUT & OUTPUT ===
  input: string;
  output: string;
  // ====================
  hasVirtualLab: boolean;
  labId?: string;
  labTitle?: string;
  createdAt: string;
  updatedAt: string;
}

export const lessonsApi = {
  getByModule: async (moduleId: number): Promise<Lesson[]> => {
    const response = await api.get(`/lessons/by-module/${moduleId}`);
    return response.data.data || [];
  },

  getByClass: async (classId: number): Promise<Lesson[]> => {
    const response = await api.get(`/lessons/by-class/${classId}`);
    return response.data.data || [];
  },

  getById: async (id: number): Promise<Lesson> => {
    const response = await api.get(`/lessons/${id}`);
    const data = response.data.data;
    // Transform PascalCase to camelCase
    return {
      id: data.id,
      moduleId: data.moduleId,
      courseId: data.courseId,
      title: data.title,
      content: data.content,
      input: data.input,
      output: data.output,
      displayOrder: data.displayOrder,
      estimatedMinutes: data.estimatedMinutes,
      lessonType: data.lessonType,
      hasVirtualLab: data.hasVirtualLab,
      labId: data.labId,
      labTitle: data.labTitle,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  },

  create: async (data: {
    moduleId: number;
    courseId: number;
    title: string;
    content?: string;
    displayOrder?: number;
    estimatedMinutes?: number;
    lessonType?: string;
    hasVirtualLab?: boolean;
    labId?: string;
    // === INPUT & OUTPUT ===
    input?: string;
    output?: string;
    // ====================
  }): Promise<number> => {
    const response = await api.post('/lessons', data);
    return response.data.data.id;
  },

  update: async (id: number, data: {
    title: string;
    content?: string;
    displayOrder?: number;
    estimatedMinutes?: number;
    lessonType?: string;
    hasVirtualLab?: boolean;
    labId?: string;
    // === INPUT & OUTPUT ===
    input?: string;
    output?: string;
    // ====================
  }): Promise<void> => {
    await api.put(`/lessons/${id}`, data);
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/lessons/${id}`);
  },

  reorder: async (moduleId: number, lessons: { lessonId: number; newOrder: number }[]): Promise<void> => {
    await api.post('/lessons/reorder', { moduleId, lessons });
  },
};
