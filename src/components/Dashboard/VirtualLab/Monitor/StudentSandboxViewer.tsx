import { useEffect, useState, useRef } from 'react';
import { X, Send, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { virtualLabHub } from '@/services/virtualLabHub';
import { CodeEditorPanel } from '../Sandbox/CodeEditorPanel';
import { CircuitCanvas, type PartVisualState } from '../Sandbox/CircuitCanvas';
import { SerialMonitorPanel } from '../Sandbox/SerialMonitorPanel';
import { virtualLabProjectsApi } from '@/services/dashboardApi';
import type { LabCircuitComponent, SimulationEventEntity } from '@/services/dashboardApi';

interface StudentSandboxViewerProps {
  projectId: string;
  studentName: string;
  onClose: () => void;
  boardType?: string;
}

type RunPhase = 'idle' | 'compiling' | 'compile_failed' | 'booting' | 'running' | 'completed';

function getErrorMessage(error: unknown, fallback: string): string {
  const status = (error as { response?: { status?: number } })?.response?.status;
  if (status === 403) return 'Bạn không có quyền xem học sinh này (lab không thuộc lớp bạn dạy).';
  if (status === 404) return 'Không tìm thấy project của học sinh này.';
  const message = (error as { message?: string })?.message;
  return typeof message === 'string' && message ? message : fallback;
}

export const StudentSandboxViewer = ({ projectId, studentName, onClose, boardType = 'esp32' }: StudentSandboxViewerProps) => {
  const [code, setCode] = useState('');
  const [components, setComponents] = useState<LabCircuitComponent[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [partStates, setPartStates] = useState<Record<string, PartVisualState>>({});
  const [serialOutput, setSerialOutput] = useState('');
  const [guidanceMessage, setGuidanceMessage] = useState('');
  const [guidanceError, setGuidanceError] = useState<string | null>(null);
  const [isSendingGuidance, setIsSendingGuidance] = useState(false);
  const [runPhase, setRunPhase] = useState<RunPhase>('idle');
  const [compileError, setCompileError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(true);

  const guidanceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoadError(null);
    setIsLoadingSnapshot(true);

    // Snapshot 1 lần qua REST TRƯỚC — nếu học sinh đã join từ trước khi
    // giáo viên mở màn hình này, SignalR sẽ không phát lại code/diagram hiện
    // tại (chỉ phát cho THAY ĐỔI), nên không có bước này thì viewer bắt đầu
    // từ rỗng cho tới lần sửa tiếp theo của học sinh — verify thật xác nhận
    // đây là bug thật (xem VIRTUAL_LAB_PLAN.md 4.6).
    virtualLabProjectsApi.getTeacherView(projectId)
      .then((snapshot) => {
        setCode(snapshot.codeContent);
        setComponents(snapshot.circuitConfig.parts ?? []);
        setConnections(snapshot.circuitConfig.connections ?? []);
      })
      .catch((err) => {
        console.error('[StudentSandboxViewer] Failed to load initial snapshot', err);
        setLoadError(getErrorMessage(err, 'Không tải được dữ liệu ban đầu của học sinh.'));
      })
      .finally(() => setIsLoadingSnapshot(false));

    // Join nhóm để nhận realtime — lỗi ở đây (403 lab không thuộc lớp mình
    // dạy, hoặc Hub error khác) PHẢI hiện rõ cho giáo viên, không được nuốt
    // âm thầm như bản cũ (.catch(console.error) — giáo viên tưởng đang xem
    // live nhưng thực ra không nhận được gì cả, không có gì báo lỗi).
    virtualLabHub.watchStudent(projectId).catch((err) => {
      console.error('[StudentSandboxViewer] watchStudent failed', err);
      setLoadError(getErrorMessage(err, 'Không thể theo dõi trực tiếp học sinh này.'));
    });

    const onDiagramUpdated = (pid: string, diagramJson: string) => {
      if (pid !== projectId) return;
      try {
        const parsed = JSON.parse(diagramJson);
        if (parsed.parts) setComponents(parsed.parts);
        if (parsed.connections) setConnections(parsed.connections);
      } catch (e) {
        console.error('Failed to parse diagram', e);
      }
    };

    const onCodeUpdated = (pid: string, sourceCode: string) => {
      if (pid !== projectId) return;
      setCode(sourceCode);
    };

    const onCompileStarted = (pid: string) => {
      if (pid !== projectId) return;
      setRunPhase('compiling');
      setCompileError(null);
    };

    const onCompileFinished = (pid: string, success: boolean, errorSummary?: string) => {
      if (pid !== projectId) return;
      if (!success) {
        setRunPhase('compile_failed');
        setCompileError(errorSummary || 'Biên dịch thất bại.');
      }
    };

    const onRunBooting = (pid: string) => {
      if (pid !== projectId) return;
      setRunPhase('booting');
    };

    const onRunCompleted = (pid: string) => {
      if (pid !== projectId) return;
      setRunPhase('completed');
    };

    const onStopped = (pid: string) => {
      if (pid !== projectId) return;
      setRunPhase('completed');
    };

    const onSimulationEvent = (pid: string, event: SimulationEventEntity) => {
      if (pid !== projectId) return;
      setRunPhase('running');

      if (event.type === 'serial') {
        const message = typeof event.payload.message === 'string' ? event.payload.message : '';
        setSerialOutput(prev => prev + message + (event.payload.newline ? '\n' : ''));
        return;
      }

      if (event.type === 'part-state') {
        const partId = typeof event.payload.partId === 'string' ? event.payload.partId : '';
        const component = typeof event.payload.component === 'string' ? event.payload.component : '';
        if (!partId) return;

        if (component === 'led') {
          const value = event.payload.state === 'on' ? '1' : '0';
          setPartStates(prev => ({ ...prev, [partId]: { ...prev[partId], value } }));
        } else if (component === 'buzzer') {
          const buzzing = event.payload.state === 'buzzing';
          setPartStates(prev => ({ ...prev, [partId]: { ...prev[partId], buzzing } }));
        } else if (component === 'l298n') {
          const motor = event.payload.motor === 'B' ? 'motorB' : 'motorA';
          const state = event.payload.state as PartVisualState['motorA'];
          setPartStates(prev => ({ ...prev, [partId]: { ...prev[partId], [motor]: state } }));
        } else if (component === 'rgb-led') {
          const channelKey = event.payload.channel === 'G' ? 'rgbG' : event.payload.channel === 'B' ? 'rgbB' : 'rgbR';
          const on = event.payload.state === 'on';
          setPartStates(prev => ({ ...prev, [partId]: { ...prev[partId], [channelKey]: on } }));
        }
      }
    };

    virtualLabHub.on('StudentDiagramUpdated', onDiagramUpdated);
    virtualLabHub.on('StudentCodeUpdated', onCodeUpdated);
    virtualLabHub.on('StudentCompileStarted', onCompileStarted);
    virtualLabHub.on('StudentCompileFinished', onCompileFinished);
    virtualLabHub.on('StudentRunBooting', onRunBooting);
    virtualLabHub.on('StudentRunCompleted', onRunCompleted);
    virtualLabHub.on('StudentStopped', onStopped);
    virtualLabHub.on('StudentSimulationEvent', onSimulationEvent);

    return () => {
      virtualLabHub.off('StudentDiagramUpdated', onDiagramUpdated);
      virtualLabHub.off('StudentCodeUpdated', onCodeUpdated);
      virtualLabHub.off('StudentCompileStarted', onCompileStarted);
      virtualLabHub.off('StudentCompileFinished', onCompileFinished);
      virtualLabHub.off('StudentRunBooting', onRunBooting);
      virtualLabHub.off('StudentRunCompleted', onRunCompleted);
      virtualLabHub.off('StudentStopped', onStopped);
      virtualLabHub.off('StudentSimulationEvent', onSimulationEvent);
      virtualLabHub.unwatchStudent(projectId).catch(console.error);
    };
  }, [projectId]);

  const handleSendGuidance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guidanceMessage.trim() || isSendingGuidance) return;

    setGuidanceError(null);
    setIsSendingGuidance(true);
    try {
      await virtualLabHub.sendGuidance(projectId, guidanceMessage);
      // Chỉ clear input khi THÀNH CÔNG — bản cũ clear ngay bất kể kết quả,
      // gửi lỗi thì mất luôn nội dung học sinh đang gõ dở mà không biết.
      setGuidanceMessage('');
    } catch (err) {
      console.error('[StudentSandboxViewer] sendGuidance failed', err);
      setGuidanceError(getErrorMessage(err, 'Gửi góp ý thất bại, thử lại.'));
    } finally {
      setIsSendingGuidance(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-50 w-full max-w-7xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-border">
        {/* Header */}
        <div className="bg-[#0f4c5c] text-white p-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold">Giám sát học sinh: {studentName}</h2>
            <p className="text-xs text-cyan-200 mt-1 opacity-80 flex items-center gap-2">
              Chế độ xem trực tiếp (Read-only)
              {isLoadingSnapshot && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {runPhase === 'compiling' && <span className="text-amber-300">· Đang biên dịch...</span>}
              {runPhase === 'compile_failed' && <span className="text-red-300">· Biên dịch lỗi</span>}
              {runPhase === 'booting' && <span className="text-cyan-300">· Đang khởi động...</span>}
              {runPhase === 'running' && <span className="text-emerald-300">· Đang chạy</span>}
              {runPhase === 'completed' && <span className="text-slate-300">· Đã dừng</span>}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loadError && (
          <div className="bg-red-50 border-b border-red-200 text-red-700 text-sm px-4 py-2 flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {loadError}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4">
          <div className="col-span-1 lg:col-span-4 flex flex-col h-full min-h-0 pointer-events-none opacity-90 relative">
            <div className="absolute inset-0 z-10 bg-transparent"></div>
            <CodeEditorPanel
              code={code}
              onChange={() => {}}
              onRun={() => {}}
              onStop={() => {}}
              isRunning={runPhase === 'booting' || runPhase === 'running'}
              isCompiling={runPhase === 'compiling'}
              compileError={compileError}
            />
          </div>

          <div className="col-span-1 lg:col-span-8 flex flex-col gap-4 h-full min-h-0">
            <div className="flex-[2] min-h-0 rounded-2xl overflow-hidden border border-border shadow-sm bg-[#222] relative pointer-events-none opacity-90">
              <div className="absolute inset-0 z-10 bg-transparent"></div>
              <CircuitCanvas
                engine={null}
                boardType={boardType}
                components={components}
                connections={connections}
                partStates={partStates}
                onComponentMove={() => {}}
                onWireConnect={() => {}}
                onWireDelete={() => {}}
                onWireWaypointChange={() => {}}
                onWireColorChange={() => {}}
                onComponentDelete={() => {}}
                onComponentAttrChange={() => {}}
                onComponentRotate={() => {}}
              />
            </div>

            <div className="flex-[1] min-h-[150px] rounded-2xl overflow-hidden flex flex-row gap-4">
              <div className="flex-1 pointer-events-none">
                 <SerialMonitorPanel output={serialOutput} onClear={() => setSerialOutput('')} />
              </div>
              <div className="w-80 bg-white rounded-xl border border-border p-4 flex flex-col">
                <h3 className="font-bold text-[#0f4c5c] mb-2 text-sm">Nhận xét nhanh</h3>
                <form onSubmit={handleSendGuidance} className="flex flex-col gap-2 flex-1">
                  <textarea
                    ref={guidanceInputRef as any}
                    value={guidanceMessage}
                    onChange={(e) => setGuidanceMessage(e.target.value)}
                    placeholder="Nhập góp ý cho học sinh này..."
                    className="flex-1 w-full p-3 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                  {guidanceError && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {guidanceError}
                    </p>
                  )}
                  <Button
                    type="submit"
                    disabled={!guidanceMessage.trim() || isSendingGuidance}
                    className="bg-[#0f4c5c] hover:bg-[#0a3540] text-white w-full h-9 rounded-lg pointer-events-auto"
                  >
                    {isSendingGuidance ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Gửi phản hồi
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
