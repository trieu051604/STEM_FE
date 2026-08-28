import { api } from './api';

export interface SystemLogItem {
  id: number;
  level: string;
  action: string;
  actorUserId?: number | null;
  actorName?: string | null;
  actorRole?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  description: string;
  metadata?: string | null;
  createdAt: string;
}

export interface PagedSystemLogList {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  items: SystemLogItem[];
}

export interface GetSystemLogsParams {
  pageNumber?: number;
  pageSize?: number;
  action?: string;
  level?: string;
  actorUserId?: number;
  entityType?: string;
  entityId?: string;
  from?: string;
  to?: string;
}

export const systemLogApi = {
  getAll: async (params?: GetSystemLogsParams): Promise<PagedSystemLogList> => {
    const response = await api.get('/system-logs', { params });
    return response.data.data;
  },
};
