import { useEffect, useRef, useState } from 'react';
import { Play, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CodeEditorPanel } from './Sandbox/CodeEditorPanel';
import { CircuitCanvas, type PartVisualState } from './Sandbox/CircuitCanvas';
import { SerialMonitorPanel } from './Sandbox/SerialMonitorPanel';
import { virtualLabHub } from '@/services/virtualLabHub';
import { virtualLabProjectsApi, gradingApi } from '@/services/dashboardApi';
import type { LabCircuitComponent, MechanicalLink, SimulationEventEntity } from '@/services/dashboardApi';

interface LabSubmissionRunnerProps {
  submissionId: number;
  boardType: string;
  code: string;
  components: LabCircuitComponent[];
  connections: unknown[];
  mechanicalLinks: MechanicalLink[];
}

type RunStage = 'idle' | 'compiling' | 'booting' | 'running';

// Chạy lại ĐÚNG snapshot bài nộp (code + sơ đồ tại thời điểm nộp) để giáo
// viên xác nhận mạch/code có hoạt động thật trước khi chấm điểm — dùng
// project "chấm điểm" riêng (gradingSessionId), tách biệt hoàn toàn khỏi
// VirtualLabProject đang sống của học sinh. Không sửa được code/sơ đồ ở đây
// (chỉ Chạy/Dừng) — đây là bài đã NỘP, không phải workspace để sửa tiếp.
export const LabSubmissionRunner = ({
  submissionId,
  boardType,
  code,
  components,
  connections,
  mechanicalLinks,
}: LabSubmissionRunnerProps) => {
  const [runStage, setRunStage] = useState<RunStage>('idle');
  const [partStates, setPartStates] = useState<Record<string, PartVisualState>>({});
  const [serialOutput, setSerialOutput] = useState('');
  const [compileError, setCompileError] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const isStoppedRef = useRef(true);
  // Resolve LƯỜI lúc bấm Chạy lần đầu (không phải project thật của học sinh
  // — xem GradingSessionService.cs) — giữ nguyên cho các lần Chạy/Dừng tiếp
  // theo trong vòng đời component này.
  const sessionIdRef = useRef<string | null>(null);

  const appendLog = (prefix: string, message: string) => {
    setSerialOutput((prev) => `${prev}[${prefix}] ${message}\n`);
  };

  useEffect(() => {
    const onSimulationEvent = (projectId: string, evt: SimulationEventEntity) => {
      if (projectId !== sessionIdRef.current || isStoppedRef.current) return;
      setRunStage('running');

      if (evt.type === 'serial') {
        const message = typeof evt.payload.message === 'string' ? evt.payload.message : '';
        setSerialOutput((prev) => prev + message + (evt.payload.newline ? '\n' : ''));
        return;
      }

      if (evt.type === 'part-state') {
        const partId = typeof evt.payload.partId === 'string' ? evt.payload.partId : '';
        const partComponent = typeof evt.payload.component === 'string' ? evt.payload.component : '';
        if (!partId) return;

        if (partComponent === 'led') {
          const value = evt.payload.state === 'on' ? '1' : '0';
          setPartStates((prev) => ({ ...prev, [partId]: { ...prev[partId], value } }));
        } else if (partComponent === 'buzzer') {
          const buzzing = evt.payload.state === 'buzzing';
          setPartStates((prev) => ({ ...prev, [partId]: { ...prev[partId], buzzing } }));
        } else if (partComponent === 'l298n') {
          const motor = evt.payload.motor === 'B' ? 'motorB' : 'motorA';
          const state = evt.payload.state as PartVisualState['motorA'];
          setPartStates((prev) => ({ ...prev, [partId]: { ...prev[partId], [motor]: state } }));
        } else if (partComponent === 'rgb-led') {
          const channelKey = evt.payload.channel === 'G' ? 'rgbG' : evt.payload.channel === 'B' ? 'rgbB' : 'rgbR';
          const on = evt.payload.state === 'on';
          setPartStates((prev) => ({ ...prev, [partId]: { ...prev[partId], [channelKey]: on } }));
        } else if (partComponent === 'fan') {
          const on = evt.payload.state === 'on';
          setPartStates((prev) => ({ ...prev, [partId]: { ...prev[partId], fan: on } }));
        } else if (partComponent === 'drone-motor') {
          const on = evt.payload.state === 'on';
          setPartStates((prev) => ({ ...prev, [partId]: { ...prev[partId], droneMotor: on } }));
        } else if (partComponent === 'servo' && evt.payload.state === 'angle') {
          const angle = typeof evt.payload.angle === 'number' ? evt.payload.angle : undefined;
          if (angle !== undefined) {
            setPartStates((prev) => ({ ...prev, [partId]: { ...prev[partId], angle } }));
          }
        }
      }
    };

    const onCompileStarted = (projectId: string) => {
      if (projectId !== sessionIdRef.current) return;
      setRunStage('compiling');
      appendLog('compile', 'Đang biên dịch...');
    };

    const onCompileFinished = (projectId: string, success: boolean, errorSummary?: string) => {
      if (projectId !== sessionIdRef.current) return;
      if (!success) {
        setCompileError(errorSummary || 'Biên dịch thất bại.');
        appendLog('error', `Biên dịch thất bại${errorSummary ? `: ${errorSummary}` : '.'}`);
      }
    };

    const onRunBooting = (projectId: string) => {
      if (projectId !== sessionIdRef.current) return;
      setRunStage('booting');
    };

    const onRunCompleted = (projectId: string, status: string, reason?: string) => {
      if (projectId !== sessionIdRef.current) return;
      isStoppedRef.current = true;
      setRunStage('idle');
      setPartStates({});
      if (status === 'error') {
        appendLog('error', `Mô phỏng dừng do lỗi${reason ? `: ${reason}` : '.'}`);
      } else {
        appendLog('simulation', 'Mô phỏng đã dừng.');
      }
    };

    virtualLabHub.on('StudentSimulationEvent', onSimulationEvent);
    virtualLabHub.on('StudentCompileStarted', onCompileStarted);
    virtualLabHub.on('StudentCompileFinished', onCompileFinished);
    virtualLabHub.on('StudentRunBooting', onRunBooting);
    virtualLabHub.on('StudentRunCompleted', onRunCompleted);

    return () => {
      virtualLabHub.off('StudentSimulationEvent', onSimulationEvent);
      virtualLabHub.off('StudentCompileStarted', onCompileStarted);
      virtualLabHub.off('StudentCompileFinished', onCompileFinished);
      virtualLabHub.off('StudentRunBooting', onRunBooting);
      virtualLabHub.off('StudentRunCompleted', onRunCompleted);
    };
  }, []);

  const handleRun = async () => {
    setCompileError(null);
    setRunError(null);
    setSerialOutput('');
    setPartStates({});
    isStoppedRef.current = false;
    setRunStage('compiling');

    try {
      // Tạo/tái sử dụng project "chấm điểm" riêng, seed đúng code+diagram+board
      // từ snapshot bài nộp — BẮT BUỘC gọi trước JoinSession (project phải tồn
      // tại trước khi join, không tự tạo qua đường join).
      const sessionId = await gradingApi.prepareRun(submissionId);
      sessionIdRef.current = sessionId;

      await virtualLabHub.joinSession(sessionId);
      await virtualLabHub.runStarted(sessionId).catch(() => {});

      const result = await virtualLabProjectsApi.start(sessionId, {
        code,
        diagram: { parts: components, connections: connections as any, mechanicalLinks },
      });

      if (result.status === 'error') {
        isStoppedRef.current = true;
        setRunStage('idle');
        setCompileError(
          result.validation.errors.length
            ? result.validation.errors.join('\n')
            : 'Mạch không hợp lệ, không thể chạy mô phỏng.'
        );
      }
    } catch (error) {
      isStoppedRef.current = true;
      setRunStage('idle');
      const message = (error as { message?: string })?.message;
      setRunError(typeof message === 'string' && message ? message : 'Không chạy được mô phỏng.');
    }
  };

  const handleStop = async () => {
    isStoppedRef.current = true;
    setRunStage('idle');
    setPartStates({});
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;
    try {
      await virtualLabProjectsApi.stop(sessionId);
      virtualLabHub.stopped(sessionId).catch(() => {});
    } catch {
      // Best-effort — trạng thái UI đã reset ở trên rồi.
    }
  };

  const isRunning = runStage !== 'idle';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Chạy lại đúng code + sơ đồ tại thời điểm nộp bài (không phải workspace hiện tại của học sinh).
        </p>
        <Button
          type="button"
          size="sm"
          onClick={() => void (isRunning ? handleStop() : handleRun())}
          className={isRunning ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}
        >
          {runStage === 'compiling' || runStage === 'booting' ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : isRunning ? (
            <Square className="w-4 h-4 mr-2" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          {runStage === 'compiling' ? 'Đang biên dịch...' : runStage === 'booting' ? 'Đang khởi động...' : isRunning ? 'Dừng' : 'Chạy mô phỏng'}
        </Button>
      </div>

      {runError && (
        <p className="text-xs text-destructive">{runError}</p>
      )}
      {compileError && (
        <p className="text-xs text-destructive whitespace-pre-wrap">{compileError}</p>
      )}

      {/*
        KHÔNG dùng pointer-events-none ở đây (khác StudentSandboxViewer —
        nơi đó chặn toàn bộ vì đang xem project SỐNG của học sinh, không ai
        cần cuộn/zoom sâu). Ở đây là xem bài đã NỘP để chấm điểm — giáo viên
        cần cuộn hết code dài + zoom/pan xem hết sơ đồ mạch. "Không sửa được"
        đến từ: Monaco readOnly (code) và không truyền onComponentMove/
        onWireConnect/... (mạch) — CircuitCanvas không có state nội bộ mirror
        vị trí linh kiện nên kéo-thả không có handler chỉ là no-op, không
        làm lệch dữ liệu hiển thị.
      */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-[28rem] rounded-xl overflow-hidden border border-border">
          <CodeEditorPanel
            code={code}
            onChange={() => {}}
            onRun={() => {}}
            onStop={() => {}}
            isRunning={isRunning}
            isCompiling={runStage === 'compiling'}
            compileError={compileError}
            hideRunControls
            readOnly
          />
        </div>
        <div className="h-[28rem] rounded-xl overflow-hidden border border-border bg-[#222]">
          <CircuitCanvas
            engine={null}
            boardType={boardType}
            components={components}
            connections={connections as any}
            mechanicalLinks={mechanicalLinks}
            partStates={partStates}
          />
        </div>
      </div>

      <div className="h-40 rounded-xl overflow-hidden">
        <SerialMonitorPanel output={serialOutput} onClear={() => setSerialOutput('')} />
      </div>
    </div>
  );
};

export default LabSubmissionRunner;
