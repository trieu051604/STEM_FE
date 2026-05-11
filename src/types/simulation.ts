// ============ SIMULATION TYPES ============
export type SimulationStatus = 'idle' | 'running' | 'paused' | 'completed';
export type SimulationSubject = 'physics' | 'chemistry' | 'biology';

export interface SimulationSession {
  id: string;
  name: string;
  subject: SimulationSubject;
  teacherId: string;
  courseId: string;
  status: SimulationStatus;
  participants: SimParticipant[];
  startedAt?: string;
  endedAt?: string;
  recordingUrl?: string;
  experimentData?: ExperimentData[];
}

export interface SimParticipant {
  userId: string;
  fullName: string;
  avatar?: string;
  role: 'teacher' | 'student';
  isOnline: boolean;
  cursor?: { x: number; y: number };
  color: string; // cursor color
}

export interface ExperimentData {
  timestamp: number;
  sensor: string;
  value: number;
  unit: string;
}

export interface SimulationTool {
  id: string;
  name: string;
  icon: string;
  type: 'measure' | 'manipulate' | 'observe';
  isActive: boolean;
}

export interface SimulationEvent {
  type:
    | 'session_start'
    | 'session_pause'
    | 'session_resume'
    | 'session_end'
    | 'data_update'
    | 'participant_join'
    | 'participant_leave'
    | 'teacher_broadcast'
    | 'cursor_move'
    | 'tool_use'
    | 'chat_message';
  payload: Record<string, unknown>;
  userId: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  fullName: string;
  avatar?: string;
  message: string;
  timestamp: number;
  type: 'text' | 'system';
}
