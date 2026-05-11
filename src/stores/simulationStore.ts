import { create } from 'zustand';
import type { SimulationSession, SimParticipant, ChatMessage, ExperimentData, SimulationStatus } from '@/types';

interface SimulationStore {
  session: SimulationSession | null;
  participants: SimParticipant[];
  chatMessages: ChatMessage[];
  sensorData: ExperimentData[];
  isConnected: boolean;
  isBroadcasting: boolean;
  activeTool: string | null;

  setSession: (session: SimulationSession | null) => void;
  updateStatus: (status: SimulationStatus) => void;
  addParticipant: (p: SimParticipant) => void;
  removeParticipant: (userId: string) => void;
  updateCursor: (userId: string, cursor: { x: number; y: number }) => void;
  addChatMessage: (msg: ChatMessage) => void;
  addSensorData: (data: ExperimentData) => void;
  setConnected: (v: boolean) => void;
  setBroadcasting: (v: boolean) => void;
  setActiveTool: (tool: string | null) => void;
  reset: () => void;
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  session: null,
  participants: [],
  chatMessages: [],
  sensorData: [],
  isConnected: false,
  isBroadcasting: false,
  activeTool: null,

  setSession: (session) => set({ session }),
  updateStatus: (status) => set(s => s.session ? { session: { ...s.session, status } } : {}),
  addParticipant: (p) => set(s => ({ participants: [...s.participants.filter(x => x.userId !== p.userId), p] })),
  removeParticipant: (userId) => set(s => ({ participants: s.participants.filter(x => x.userId !== userId) })),
  updateCursor: (userId, cursor) => set(s => ({
    participants: s.participants.map(p => p.userId === userId ? { ...p, cursor } : p),
  })),
  addChatMessage: (msg) => set(s => ({ chatMessages: [...s.chatMessages, msg] })),
  addSensorData: (data) => set(s => ({ sensorData: [...s.sensorData.slice(-200), data] })),
  setConnected: (v) => set({ isConnected: v }),
  setBroadcasting: (v) => set({ isBroadcasting: v }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  reset: () => set({ session: null, participants: [], chatMessages: [], sensorData: [], isConnected: false }),
}));
