import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSimulationStore } from '@/stores';
import type { SimulationEvent } from '@/types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

let socketInstance: Socket | null = null;

export function useSocket(sessionId?: string) {
  const socketRef = useRef<Socket | null>(null);
  const { setConnected, addParticipant, removeParticipant, updateCursor, addChatMessage, addSensorData, updateStatus } = useSimulationStore();

  useEffect(() => {
    if (!sessionId) return;

    // Reuse singleton or create new
    if (!socketInstance) {
      socketInstance = io(SOCKET_URL, {
        transports: ['websocket'],
        autoConnect: false,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
    }
    socketRef.current = socketInstance;
    const socket = socketRef.current;

    socket.connect();

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_session', { sessionId });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('simulation_event', (event: SimulationEvent) => {
      switch (event.type) {
        case 'participant_join':
          addParticipant(event.payload as never);
          break;
        case 'participant_leave':
          removeParticipant(event.payload.userId as string);
          break;
        case 'cursor_move':
          updateCursor(event.userId, event.payload as { x: number; y: number });
          break;
        case 'chat_message':
          addChatMessage(event.payload as never);
          break;
        case 'data_update':
          addSensorData(event.payload as never);
          break;
        case 'session_start':
          updateStatus('running');
          break;
        case 'session_pause':
          updateStatus('paused');
          break;
        case 'session_end':
          updateStatus('completed');
          break;
      }
    });

    return () => {
      socket.emit('leave_session', { sessionId });
      socket.off('connect');
      socket.off('disconnect');
      socket.off('simulation_event');
    };
  }, [sessionId]);

  const emit = (event: string, data: unknown) => {
    socketRef.current?.emit(event, data);
  };

  return { socket: socketRef.current, emit };
}
