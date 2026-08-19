import { api } from './api';

// AI Assistant trong phòng Lab — workflow đề xuất-rồi-xác-nhận (Codex/Cursor-style).
// AI KHÔNG bao giờ tự áp dụng thay đổi; BE chỉ trả về proposedChanges, FE hiển thị
// preview và chỉ áp dụng khi người dùng bấm "Áp dụng". Xem STEM_BE
// LabAiAssistHandler.cs / VirtualLabProjectController.cs (POST .../ai-assist).

export type ProposedChangeType =
  | 'replace_file'
  | 'replace_range'
  | 'insert_code'
  | 'add_component'
  | 'update_wire'
  | 'update_diagram_json'
  | 'explanation_only';

export interface AiComponentSuggestion {
  type: string;
  id?: string | null;
  x?: number | null;
  y?: number | null;
}

export interface AiWireSuggestion {
  from: string;
  to: string;
  color?: string | null;
}

export interface ProposedChange {
  id: string;
  type: ProposedChangeType | string;
  title: string;
  description: string;
  before?: string | null;
  after?: string | null;
  startLine?: number | null;
  endLine?: number | null;
  insertAtLine?: number | null;
  component?: AiComponentSuggestion | null;
  wire?: AiWireSuggestion | null;
  diagramJson?: string | null;
}

export interface AiUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  dailyUsedTokens: number;
  dailyLimitTokens: number;
  remainingDailyTokens: number;
  isEstimated: boolean;
}

export interface LabAiAssistResponse {
  success: boolean;
  answer: string;
  requiresConfirmation: boolean;
  confirmationMessage?: string | null;
  proposedChanges: ProposedChange[];
  usage?: AiUsage | null;
  errorMessage?: string | null;
}

export interface LabAiAssistRequest {
  prompt: string;
  currentCode: string;
  currentDiagramJson?: string;
}

function normalizeResponse(data: unknown): LabAiAssistResponse {
  const raw = (data ?? {}) as Partial<LabAiAssistResponse>;
  return {
    success: raw.success ?? false,
    answer: raw.answer ?? '',
    requiresConfirmation: raw.requiresConfirmation ?? false,
    confirmationMessage: raw.confirmationMessage ?? null,
    proposedChanges: Array.isArray(raw.proposedChanges) ? raw.proposedChanges : [],
    usage: raw.usage ?? null,
    errorMessage: raw.errorMessage ?? null,
  };
}

export const aiAssistantApi = {
  assist: async (
    projectId: string,
    request: LabAiAssistRequest
  ): Promise<LabAiAssistResponse> => {
    const response = await api.post(`/virtual-lab/projects/${projectId}/ai-assist`, request);
    return normalizeResponse(response.data);
  },

  // Lấy thông tin AI quota của user hiện tại
  getAiQuota: async (): Promise<UserAiQuotaResponse> => {
    const response = await api.get('/virtual-lab/projects/ai-quota');
    return response.data;
  },
};

// User AI Quota Response
export interface UserAiQuotaResponse {
  success: boolean;
  userId: number;
  userName?: string;
  totalAllocated: number;
  totalUsed: number;
  todayUsed: number;
  remaining: number;
  expiresAt?: string | null;
  hasIndividualAllocation: boolean;
  errorMessage?: string | null;
};
