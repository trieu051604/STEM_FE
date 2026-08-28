import { api } from './api';

export interface Syllabus {
  id: number;
  title: string;
  description?: string;
  thumbnailUrl?: string | null;
  gradeLevelId?: number | null;
  gradeLevelName?: string | null;
  subjectArea: string;
  status: string;
  displayOrder: number;
  estimatedHours: number;
  isRequired: boolean;
  isSystemOwned: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PagedSyllabusList {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  items: Syllabus[];
}

export interface SyllabusStructureLab {
  id: string;
  title: string;
  status: string;
}

export interface SyllabusStructureLesson {
  id: number;
  title: string;
  displayOrder: number;
  hasVirtualLab: boolean;
  lab?: SyllabusStructureLab | null;
}

export interface SyllabusStructureModule {
  id: number;
  title: string;
  displayOrder: number;
  lessons: SyllabusStructureLesson[];
}

export interface SyllabusStructureCourse {
  id: number;
  title: string;
  schoolId?: number | null;
  displayOrder: number;
  modules: SyllabusStructureModule[];
}

export interface SyllabusStructure {
  id: number;
  title: string;
  status: string;
  courses: SyllabusStructureCourse[];
}

export interface CreateSyllabusPayload {
  title: string;
  description?: string;
  thumbnailUrl?: string | null;
  gradeLevelId?: number | null;
  subjectArea: string;
  displayOrder: number;
  estimatedHours: number;
  isRequired: boolean;
}

export interface UpdateSyllabusPayload extends CreateSyllabusPayload {
  status: string;
}

export const syllabusApi = {
  getAll: async (params?: {
    searchTerm?: string;
    gradeLevelId?: number;
    status?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<PagedSyllabusList> => {
    const response = await api.get('/syllabuses', { params });
    return response.data.data;
  },

  getById: async (id: number): Promise<Syllabus> => {
    const response = await api.get(`/syllabuses/${id}`);
    return response.data.data;
  },

  getStructure: async (id: number): Promise<SyllabusStructure> => {
    const response = await api.get(`/syllabuses/${id}/structure`);
    return response.data.data;
  },

  create: async (data: CreateSyllabusPayload): Promise<number> => {
    const response = await api.post('/syllabuses', data);
    return response.data.data.id;
  },

  update: async (id: number, data: UpdateSyllabusPayload): Promise<void> => {
    await api.put(`/syllabuses/${id}`, data);
  },

  archive: async (id: number): Promise<void> => {
    await api.post(`/syllabuses/${id}/archive`);
  },
};
