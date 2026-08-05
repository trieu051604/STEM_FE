import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { useAuthStore } from '@/stores/authStore';
import { API_BASE_URL } from './api';
import type { SimulationEventEntity } from './dashboardApi';

class VirtualLabHubService {
  private connection: HubConnection | null = null;
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;
  // Theo dõi riêng chu kỳ tự-reconnect của SignalR (withAutomaticReconnect) —
  // KHÁC connectionPromise (chỉ dùng cho lần connect() ĐẦU TIÊN, không được
  // SignalR tự cập nhật khi tự reconnect sau khi rớt mạng). Không có promise
  // này thì ensureConnected() không có gì để await trong lúc state=Reconnecting.
  private reconnectingPromise: Promise<void> | null = null;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  // Trạng thái "đang theo dõi" — SignalR group membership KHÔNG sống sót qua
  // 1 lần reconnect (server coi là connection mới, Groups.AddToGroupAsync cũ
  // không còn hiệu lực) dù connection object phía client được giữ nguyên
  // (withAutomaticReconnect tái dùng cùng HubConnection, không tạo mới).
  // Không track lại thì sau khi mạng chập chờn/reconnect, Teacher đang xem
  // dashboard lớp/học sinh sẽ lặng lẽ ngừng nhận event dù UI trông như vẫn
  // đang "theo dõi" — không có lỗi nào hiện ra để nhận biết.
  private watchedClassIds: Set<number> = new Set();
  private watchedProjectIds: Set<string> = new Set();
  private joinedSessionProjectId: string | null = null;

  private getHubUrl() {
    return `${API_BASE_URL.replace(/\/api\/?$/i, '')}/hubs/virtual-lab`;
  }

  public async connect(): Promise<void> {
    if (this.connection?.state === HubConnectionState.Connected) {
      return;
    }

    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.isConnecting = true;

    const token = useAuthStore.getState().token;
    
    this.connection = new HubConnectionBuilder()
      .withUrl(this.getHubUrl(), {
        accessTokenFactory: () => token || '',
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    this.setupInternalListeners();
    this.setupReconnectTracking();

    this.connectionPromise = this.connection.start()
      .then(() => {
        console.log('[VirtualLabHub] Connected');
        this.isConnecting = false;
      })
      .catch((err) => {
        console.error('[VirtualLabHub] Connection error:', err);
        this.isConnecting = false;
        throw err;
      });

    return this.connectionPromise;
  }

  // Gắn hook onreconnecting/onreconnected/onclose 1 LẦN cho connection hiện
  // tại (mỗi lần connect() build connection mới thì gọi lại) — resolve/reject
  // reconnectingPromise đúng theo vòng đời tự-reconnect thật của SignalR, để
  // ensureConnected() có cái để await khi state=Reconnecting thay vì bỏ qua.
  private setupReconnectTracking() {
    if (!this.connection) return;

    let resolveReconnect: (() => void) | null = null;
    let rejectReconnect: ((err: unknown) => void) | null = null;

    this.connection.onreconnecting((err) => {
      console.warn('[VirtualLabHub] Reconnecting...', err);
      this.reconnectingPromise = new Promise<void>((resolve, reject) => {
        resolveReconnect = resolve;
        rejectReconnect = reject;
      });
      // Additive — không đổi hành vi reconnect thật, chỉ phát thêm 1 sự kiện
      // nội bộ để UI (Serial Monitor) có thể log lại đúng thời điểm thật, thay
      // vì phải tự đoán qua console.log không hiển thị cho người dùng.
      this.trigger('ConnectionReconnecting', err);
    });

    this.connection.onreconnected(() => {
      console.log('[VirtualLabHub] Reconnected');
      resolveReconnect?.();
      this.reconnectingPromise = null;
      void this.rejoinAfterReconnect();
      this.trigger('ConnectionReconnected');
    });

    this.connection.onclose((err) => {
      console.warn('[VirtualLabHub] Connection closed', err);
      rejectReconnect?.(err ?? new Error('SignalR connection closed'));
      this.reconnectingPromise = null;
      this.trigger('ConnectionClosed', err);
    });
  }

  // Gọi lại đúng những JoinSession/WatchClass/WatchStudent đang "active"
  // TRƯỚC khi mất kết nối — best-effort, lỗi ở 1 mục không được chặn các
  // mục còn lại (Promise.allSettled thay vì để 1 throw dừng cả vòng lặp).
  private async rejoinAfterReconnect(): Promise<void> {
    const tasks: Promise<unknown>[] = [];

    if (this.joinedSessionProjectId) {
      tasks.push(
        this.connection!.invoke('JoinSession', this.joinedSessionProjectId).catch((err) =>
          console.error('[VirtualLabHub] Rejoin JoinSession failed after reconnect', err)
        )
      );
    }
    for (const classId of this.watchedClassIds) {
      tasks.push(
        this.connection!.invoke('WatchClass', classId).catch((err) =>
          console.error('[VirtualLabHub] Rejoin WatchClass failed after reconnect', classId, err)
        )
      );
    }
    for (const projectId of this.watchedProjectIds) {
      tasks.push(
        this.connection!.invoke('WatchStudent', projectId).catch((err) =>
          console.error('[VirtualLabHub] Rejoin WatchStudent failed after reconnect', projectId, err)
        )
      );
    }

    if (tasks.length > 0) {
      console.log(`[VirtualLabHub] Rejoining ${tasks.length} group(s) after reconnect...`);
      await Promise.allSettled(tasks);
    }
  }

  public async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
      console.log('[VirtualLabHub] Disconnected');
    }
    this.watchedClassIds.clear();
    this.watchedProjectIds.clear();
    this.joinedSessionProjectId = null;
  }

  // Helper for adding/removing listeners
  public on(eventName: string, callback: (...args: any[]) => void) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)?.add(callback);
    
    // Register with SignalR connection if not already registered
    if (this.connection && this.listeners.get(eventName)?.size === 1) {
      this.connection.on(eventName, (...args) => this.trigger(eventName, ...args));
    }
  }

  public off(eventName: string, callback: (...args: any[]) => void) {
    this.listeners.get(eventName)?.delete(callback);
    
    if (this.connection && this.listeners.get(eventName)?.size === 0) {
      this.connection.off(eventName);
    }
  }

  private trigger(eventName: string, ...args: any[]) {
    this.listeners.get(eventName)?.forEach(callback => callback(...args));
  }

  private setupInternalListeners() {
    if (!this.connection) return;

    const eventsToProxy = [
      'StudentJoined',
      'StudentDiagramUpdated',
      'StudentCodeUpdated',
      'StudentCompileStarted',
      'StudentCompileFinished',
      'StudentRunStarted',
      'StudentRunBooting',
      'StudentSimulationEvent',
      'StudentRunCompleted',
      'StudentStopped',
      'StudentSubmitted',
      'ReceiveGuidance'
    ];

    eventsToProxy.forEach(eventName => {
      this.connection!.on(eventName, (...args) => this.trigger(eventName, ...args));
    });
  }

  // Đảm bảo connection ở state Connected trước khi invoke bất kỳ Hub method
  // nào — BUG THẬT vừa vá: bản cũ (ensureConnection) chỉ gọi connect() khi
  // connection null HOẶC state=Disconnected, bỏ qua hẳn state=Connecting/
  // Reconnecting (không làm gì, return ngay) — nếu 2 lời gọi invoke xảy ra
  // gần nhau (vd JoinSession gọi 2 lần do effect chạy lại/StrictMode) trong
  // lúc lần connect() ĐẦU TIÊN còn đang chạy dở (state=Connecting), lời gọi
  // thứ 2 KHÔNG đợi gì cả rồi invoke ngay trên connection chưa Connected →
  // lỗi thật "Cannot send data if the connection is not in the 'Connected'
  // State." (xác nhận đúng từ console lỗi thật của bạn).
  public async ensureConnected(): Promise<void> {
    const state = this.connection?.state;

    if (state === HubConnectionState.Connected) {
      return;
    }

    if (state === HubConnectionState.Connecting) {
      await (this.connectionPromise ?? this.waitForConnectedState());
      return;
    }

    if (state === HubConnectionState.Reconnecting) {
      await (this.reconnectingPromise ?? this.waitForConnectedState());
      return;
    }

    // null (chưa từng connect), Disconnected, hoặc Disconnecting.
    await this.connect();
  }

  // Lưới an toàn — chỉ dùng khi state là Connecting/Reconnecting nhưng
  // KHÔNG có promise tương ứng để await (không nên xảy ra theo logic hiện
  // tại, nhưng an toàn hơn là treo vô hạn hoặc invoke() ngay lập tức như bug
  // cũ). Poll mỗi 100ms, timeout 15s thì throw rõ ràng thay vì lỗi SignalR
  // khó hiểu.
  private async waitForConnectedState(timeoutMs = 15000): Promise<void> {
    const start = Date.now();
    while (this.connection?.state !== HubConnectionState.Connected) {
      if (this.connection?.state === HubConnectionState.Disconnected || !this.connection) {
        await this.connect();
        return;
      }
      if (Date.now() - start > timeoutMs) {
        throw new Error('Timed out waiting for SignalR connection to become Connected.');
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  private isConnectionNotReadyError(err: unknown): boolean {
    const message = err instanceof Error ? err.message : String(err);
    return message.includes("connection is not in the 'Connected' State");
  }

  // === STUDENT METHODS ===

  public async joinSession(projectId: string) {
    await this.ensureConnected();
    try {
      await this.connection!.invoke('JoinSession', projectId);
      this.joinedSessionProjectId = projectId;
    } catch (err) {
      // Retry NGẦM đúng 1 lần nếu lỗi thật sự do connection chưa Connected
      // (race hiếm: state đổi đúng lúc giữa ensureConnected() resolve và
      // invoke() thực thi) — các lỗi khác (server từ chối, network thật sự
      // mất...) ném thẳng ra ngoài, không nuốt.
      if (this.isConnectionNotReadyError(err)) {
        console.warn('[VirtualLabHub] JoinSession failed (connection not ready), retrying once...', err);
        await this.ensureConnected();
        await this.connection!.invoke('JoinSession', projectId);
        this.joinedSessionProjectId = projectId;
        return;
      }
      throw err;
    }
  }

  public async diagramUpdated(projectId: string, diagramJson: string) {
    await this.ensureConnected();
    await this.connection!.invoke('DiagramUpdated', projectId, diagramJson);
  }

  public async codeUpdated(projectId: string, sourceCode: string) {
    await this.ensureConnected();
    await this.connection!.invoke('CodeUpdated', projectId, sourceCode);
  }

  public async compileStarted(projectId: string) {
    await this.ensureConnected();
    await this.connection!.invoke('CompileStarted', projectId);
  }

  public async compileFinished(projectId: string, success: boolean, errorSummary?: string) {
    await this.ensureConnected();
    await this.connection!.invoke('CompileFinished', projectId, success, errorSummary || null);
  }

  public async runStarted(projectId: string) {
    await this.ensureConnected();
    await this.connection!.invoke('RunStarted', projectId);
  }

  public async simulationEvent(projectId: string, eventPayload: SimulationEventEntity) {
    await this.ensureConnected();
    await this.connection!.invoke('SimulationEvent', projectId, eventPayload);
  }

  public async stopped(projectId: string) {
    await this.ensureConnected();
    await this.connection!.invoke('Stopped', projectId);
  }

  public async submitted(projectId: string, submissionId: number) {
    await this.ensureConnected();
    await this.connection!.invoke('Submitted', projectId, submissionId);
  }

  // === TEACHER METHODS ===

  public async watchClass(classId: number) {
    await this.ensureConnected();
    await this.connection!.invoke('WatchClass', classId);
    this.watchedClassIds.add(classId);
  }

  public async unwatchClass(classId: number) {
    // Bỏ khỏi tracking TRƯỚC khi invoke — nếu invoke lỗi/timeout, vẫn không
    // nên rejoin lại 1 group mà caller đã chủ động rời (vd component unmount).
    this.watchedClassIds.delete(classId);
    await this.ensureConnected();
    await this.connection!.invoke('UnwatchClass', classId);
  }

  public async watchStudent(projectId: string) {
    await this.ensureConnected();
    await this.connection!.invoke('WatchStudent', projectId);
    this.watchedProjectIds.add(projectId);
  }

  public async unwatchStudent(projectId: string) {
    this.watchedProjectIds.delete(projectId);
    await this.ensureConnected();
    await this.connection!.invoke('UnwatchStudent', projectId);
  }

  public async sendGuidance(projectId: string, message: string) {
    await this.ensureConnected();
    await this.connection!.invoke('SendGuidance', projectId, message);
  }
}

export const virtualLabHub = new VirtualLabHubService();
