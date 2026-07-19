import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, RefreshCw, Send, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { labsApi, simulationCompileApi, virtualLabProjectsApi, diagramsApi, submissionsApi } from '@/services/dashboardApi';
import type { LabCircuitComponent, LabEntity, DiagramValidationResult, SimulationEventEntity, AutoGradeResultEntity } from '@/services/dashboardApi';
import { CodeEditorPanel } from '@/components/Dashboard/VirtualLab/Sandbox/CodeEditorPanel';
import { CircuitCanvas, type PartVisualState } from '@/components/Dashboard/VirtualLab/Sandbox/CircuitCanvas';
import { SerialMonitorPanel } from '@/components/Dashboard/VirtualLab/Sandbox/SerialMonitorPanel';
import { getSandboxProjectId } from '@/components/Dashboard/VirtualLab/Sandbox/projectId';

const DIAGRAM_SAVE_DEBOUNCE_MS = 1500;

const defaultStarterCode =
  'void setup() {\n  pinMode(13, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(13, HIGH);\n  delay(1000);\n  digitalWrite(13, LOW);\n  delay(1000);\n}';

const defaultComponents: LabCircuitComponent[] = [
  { id: 'led1', type: 'led', x: 100, y: 100, pinMapping: {}, attrs: { color: 'red' } },
];

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'response' in error) {
    const data = (error as { response?: { data?: { message?: string; error?: string } } })
      .response?.data;
    return data?.message ?? data?.error ?? fallback;
  }

  if (error instanceof Error && error.message) return error.message;

  return fallback;
}

function getBoardDisplayName(boardType?: string) {
  if (boardType === 'esp32_devkit_v1') return 'ESP32 DevKit V1';
  return 'Arduino Uno';
}

function formatCompileErrors(errors: Array<{ line?: number | null; message: string }>, output?: string | null) {
  if (errors.length) {
    return errors
      .map((error) => (error.line ? `Dòng ${error.line}: ${error.message}` : error.message))
      .join('\n');
  }

  return output || 'Biên dịch thất bại.';
}

export const LabSandboxPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [lab, setLab] = useState<LabEntity | null>(null);
  const [code, setCode] = useState(defaultStarterCode);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [serialOutput, setSerialOutput] = useState('');
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [sandboxComponents, setSandboxComponents] = useState<LabCircuitComponent[]>(defaultComponents);
  const [sandboxConnections, setSandboxConnections] = useState<any[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectBoard, setProjectBoard] = useState('esp32');
  const [projectLanguage, setProjectLanguage] = useState('arduino');
  const [diagramValidation, setDiagramValidation] = useState<DiagramValidationResult | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [partStates, setPartStates] = useState<Record<string, PartVisualState>>({});
  const [linkedAssignmentId, setLinkedAssignmentId] = useState<number | null>(null);
  const [lastSimulationEvents, setLastSimulationEvents] = useState<SimulationEventEntity[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [autoCheck, setAutoCheck] = useState<AutoGradeResultEntity | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasHydratedRef = useRef(false);
  const replayTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const loadLab = useCallback(async () => {
    if (!id) {
      setLoadError('Không tìm thấy mã phòng lab.');
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    hasHydratedRef.current = false;

    try {
      const labResponse = await labsApi.getById(id);
      setLab(labResponse);
      setLinkedAssignmentId(labResponse.linkedAssignmentId ?? null);

      // Xóa pinMapping để học sinh tự cắm dây (các linh kiện sinh ra không tự động nối dây vào chip)
      const starterComponents = labResponse.circuitConfig?.parts?.length
        ? labResponse.circuitConfig.parts.map((p: any) => ({ ...p, pinMapping: {} }))
        : defaultComponents;
      const starterConnections = labResponse.circuitConfig?.connections || [];
      let resolvedCode = labResponse.starterCode || defaultStarterCode;
      let resolvedComponents = starterComponents;
      let resolvedConnections = starterConnections;

      // Lab (catalog) và VirtualLabProject (Guid, nơi lưu diagram/code thật)
      // không có liên kết nào ở BE — suy ra Guid tất định từ (labId, studentId)
      // thay vì lưu ánh xạ riêng (xem projectId.ts).
      if (user?.id) {
        const pid = await getSandboxProjectId(labResponse.id, user.id);
        setProjectId(pid);

        try {
          const project = await virtualLabProjectsApi.getById(pid);
          resolvedCode = project.codeContent || resolvedCode;
          if (project.circuitConfig.parts?.length) {
            resolvedComponents = project.circuitConfig.parts;
          }
          resolvedConnections = (project.circuitConfig.connections as any[]) ?? resolvedConnections;
          // Board/Language của compile phải theo đúng VirtualLabProject (nguồn
          // sự thật duy nhất từ giờ), không còn hardcode Uno như luồng cũ.
          setProjectBoard(project.board || 'esp32');
          setProjectLanguage(project.language || 'arduino');
        } catch (projectError) {
          const status = (projectError as { response?: { status?: number } })?.response?.status;
          if (status === 404) {
            // Chưa có VirtualLabProject cho cặp (lab, student) này — tạo ngay
            // bằng nội dung starter của Lab, đúng hành vi auto-create của
            // PUT api/diagrams/{id} đã xác nhận ở BE (không chờ tới lần sửa
            // đầu tiên của học sinh).
            try {
              const created = await diagramsApi.save(pid, {
                circuitConfig: { parts: starterComponents, connections: starterConnections },
                sourceCode: resolvedCode,
              });
              setDiagramValidation(created.validation);
            } catch (createError) {
              console.error('[LabSandboxPage] Failed to create initial VirtualLabProject', createError);
            }
          } else {
            throw projectError;
          }
        }
      }

      setCode(resolvedCode);
      setSandboxComponents(resolvedComponents);
      setSandboxConnections(resolvedConnections);

      if (user?.role === 'student') {
        try {
          await labsApi.startProgress(id);
        } catch {
          // Progress is helpful but should not block the sandbox workspace.
        }
      }
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Không tải được phòng lab sandbox.'));
    } finally {
      setIsLoading(false);
      hasHydratedRef.current = true;
    }
  }, [id, user?.id, user?.role]);

  // Dọn timer replay khi rời trang — tránh setState trên component đã unmount
  // nếu học sinh bấm Run rồi điều hướng đi trước khi replay chạy xong.
  useEffect(() => {
    return () => {
      replayTimersRef.current.forEach(clearTimeout);
      replayTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    void loadLab();
  }, [loadLab]);

  // Lưu diagram/code debounce ~1.5s sau khi ngừng thao tác — tránh gọi PUT
  // theo từng pixel khi kéo linh kiện (onComponentMove bắn liên tục lúc kéo).
  useEffect(() => {
    if (!projectId || !hasHydratedRef.current) return;

    setSaveStatus('saving');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void diagramsApi
        .save(projectId, {
          circuitConfig: { parts: sandboxComponents, connections: sandboxConnections },
          sourceCode: code,
        })
        .then((session) => {
          setDiagramValidation(session.validation);
          setSaveStatus('saved');
        })
        .catch((error) => {
          console.error('[LabSandboxPage] Failed to save diagram', error);
          setSaveStatus('error');
        });
    }, DIAGRAM_SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [projectId, sandboxComponents, sandboxConnections, code]);

  const clearReplayTimers = () => {
    replayTimersRef.current.forEach(clearTimeout);
    replayTimersRef.current = [];
  };

  const applySimulationEvent = (event: SimulationEventEntity) => {
    if (event.type === 'serial') {
      const message = typeof event.payload.message === 'string' ? event.payload.message : '';
      setSerialOutput((prev) => prev + message + (event.payload.newline ? '\n' : ''));
      return;
    }

    if (event.type === 'part-state') {
      const partId = typeof event.payload.partId === 'string' ? event.payload.partId : '';
      const component = typeof event.payload.component === 'string' ? event.payload.component : '';
      if (!partId) return;

      if (component === 'led') {
        const value = event.payload.state === 'on' ? '1' : '0';
        setPartStates((prev) => ({ ...prev, [partId]: { ...prev[partId], value } }));
      } else if (component === 'buzzer') {
        const buzzing = event.payload.state === 'buzzing';
        setPartStates((prev) => ({ ...prev, [partId]: { ...prev[partId], buzzing } }));
      }
      // Button/Servo/DHT/Ultrasonic: VirtualLabMockRunner không phát
      // part-state cho các loại này — không có gì để ánh xạ (giới hạn đã
      // biết của mock runner, không phải thiếu sót ở adapter này).
    }
  };

  // Mock runner trả toàn bộ danh sách event tính sẵn cùng lúc (không phải
  // stream trực tiếp) — phát lại bằng timer theo đúng Time (ms tích lũy qua
  // delay() trong code) để giữ cảm giác chạy thời gian thực.
  const replaySimulationEvents = (events: SimulationEventEntity[]) => {
    clearReplayTimers();
    setPartStates({});
    setLastSimulationEvents(events);

    if (events.length === 0) {
      setIsRunning(false);
      return;
    }

    setIsRunning(true);
    events.forEach((event) => {
      replayTimersRef.current.push(setTimeout(() => applySimulationEvent(event), event.time));
    });

    const maxTime = Math.max(...events.map((event) => event.time));
    replayTimersRef.current.push(setTimeout(() => setIsRunning(false), maxTime + 50));
  };

  const handleRun = async () => {
    if (!id || !lab || !projectId) return;

    setIsCompiling(true);
    setCompileError(null);
    setSubmitMessage(null);
    setSubmitError(null);
    setAutoCheck(null);
    setSerialOutput('');
    clearReplayTimers();
    setPartStates({});
    setIsRunning(false);

    try {
      const result = await simulationCompileApi.compile({
        labId: lab.id,
        code,
        board: projectBoard,
        framework: projectLanguage,
      });

      if (!result.success) {
        setCompileError(formatCompileErrors(result.errors, result.compilerOutput));
        return;
      }

      const runResult = await virtualLabProjectsApi.start(projectId, {
        code,
        diagram: { parts: sandboxComponents, connections: sandboxConnections },
      });

      if (runResult.status === 'error') {
        setCompileError(
          runResult.validation.errors.length
            ? runResult.validation.errors.join('\n')
            : 'Mạch không hợp lệ, không thể chạy mô phỏng.'
        );
        return;
      }

      replaySimulationEvents(runResult.events);
    } catch (error) {
      setCompileError(getErrorMessage(error, 'Không gọi được API biên dịch/chạy mô phỏng.'));
    } finally {
      setIsCompiling(false);
    }
  };

  const handleStop = () => {
    clearReplayTimers();
    setIsRunning(false);
  };

  const handleSubmit = async () => {
    if (!projectId || !linkedAssignmentId) return;

    handleStop();
    setSubmitMessage(null);
    setSubmitError(null);
    setAutoCheck(null);
    setIsSubmitting(true);

    try {
      const result = await submissionsApi.submitVirtualLab({
        assignmentId: linkedAssignmentId,
        sessionId: projectId,
        circuitConfig: { parts: sandboxComponents, connections: sandboxConnections },
        sourceCode: code,
        simulationEvents: lastSimulationEvents,
      });

      setAutoCheck(result.autoCheck);
      setSubmitMessage(
        `Đã nộp bài — đạt ${result.autoCheck.passedChecks}/${result.autoCheck.totalChecks} tiêu chí` +
          (result.autoScore != null ? `, điểm tự động: ${result.autoScore}.` : '.')
      );
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Không nộp được bài — vui lòng thử lại.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComponentMove = (id: string, x: number, y: number) => {
    setSandboxComponents(prev => prev.map(p => {
      if (p.id !== id) return p;
      return { ...p, x, y };
    }));
  };

  const handleWireConnect = (
    sourceId: string,
    sourcePin: string,
    targetId: string,
    targetPin: string,
    color: string
  ) => {
    const newConnection = [`${sourceId}:${sourcePin}`, `${targetId}:${targetPin}`, color, []];
    setSandboxConnections((prev) => [...prev, newConnection]);
  };

  const handleWireDelete = (index: number) => {
    setSandboxConnections((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  const handleWireWaypointChange = (index: number, waypoints: { x: number; y: number }[]) => {
    setSandboxConnections((prev) => {
      const next = [...prev];
      const [source, target, color] = next[index];
      next[index] = [source, target, color, waypoints];
      return next;
    });
  };

  const handleWireColorChange = (index: number, color: string) => {
    setSandboxConnections((prev) => {
      const next = [...prev];
      const [source, target, , waypoints] = next[index];
      next[index] = [source, target, color, waypoints];
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-20 rounded-2xl border border-border bg-white animate-pulse" />
        <div className="h-[calc(100vh-8rem)] rounded-2xl border border-border bg-white animate-pulse" />
      </div>
    );
  }

  if (loadError || !lab) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <button
          type="button"
          onClick={() => navigate('/dashboard/virtual-lab')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#0f4c5c]"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách lab
        </button>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 mt-0.5 shrink-0" />
            <div>
              <h1 className="text-xl font-bold">Không mở được Sandbox</h1>
              <p className="text-sm mt-1">{loadError || 'Phòng lab không tồn tại.'}</p>
              <Button
                onClick={() => void loadLab()}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tải lại
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (lab.simulationMode !== 'custom_sandbox') {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <button
          type="button"
          onClick={() => navigate(`/dashboard/virtual-lab/${lab.id}`)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#0f4c5c]"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại chi tiết lab
        </button>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
          Lab này không dùng Sandbox nội bộ. Vui lòng mở bằng màn hình Wokwi iframe.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] space-y-4">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-border shadow-sm shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={() => navigate(`/dashboard/virtual-lab/${lab.id}`)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors shrink-0"
            aria-label="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-[#0f4c5c] truncate">{lab.title}</h1>
            <p className="text-xs text-muted-foreground">
              Sandbox nội bộ - {getBoardDisplayName(lab.boardType)} - {sandboxComponents.length} linh kiện
              {saveStatus === 'saving' && ' - Đang lưu...'}
              {saveStatus === 'saved' && ' - Đã lưu'}
              {saveStatus === 'error' && ' - Lỗi khi lưu, thử lại sau'}
              {diagramValidation && !diagramValidation.isValid &&
                ` - ${diagramValidation.errors.length} lỗi mạch`}
            </p>
          </div>
        </div>

        {linkedAssignmentId ? (
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={() => void handleSubmit()}
            className="bg-[#b45309] hover:bg-[#92400e] text-white rounded-full font-bold shadow-sm px-6 disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground max-w-[220px] text-right">
            Lab này chưa gắn bài đánh giá — không thể nộp bài.
          </p>
        )}
      </div>

      {submitMessage && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
          {submitMessage}
        </div>
      )}

      {submitError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {submitError}
        </div>
      )}

      {autoCheck && (
        <div className="rounded-2xl border border-border bg-white p-4 shrink-0 space-y-2">
          <p className="text-sm font-bold text-[#0f4c5c]">
            Kết quả chấm tự động — {autoCheck.passedChecks}/{autoCheck.totalChecks} tiêu chí
          </p>
          {autoCheck.checks.map((check) => (
            <div key={check.name} className="flex items-start gap-2 text-sm">
              {check.passed ? (
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
              ) : (
                <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
              )}
              <div>
                <span className="font-semibold capitalize">{check.name}</span>
                <span className="text-muted-foreground"> — {check.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        <div className="col-span-1 lg:col-span-5 flex flex-col h-full min-h-0">
          <CodeEditorPanel
            code={code}
            onChange={(value) => setCode(value || '')}
            onRun={handleRun}
            onStop={handleStop}
            isRunning={isRunning}
            isCompiling={isCompiling}
            compileError={compileError}
          />
        </div>

        <div className="col-span-1 lg:col-span-7 flex flex-col gap-4 h-full min-h-0">
          <div className="flex-[2] min-h-0 rounded-2xl overflow-hidden border border-border shadow-sm bg-[#222] relative">
            <CircuitCanvas
              engine={null}
              boardType={lab?.boardType}
              components={sandboxComponents}
              connections={sandboxConnections}
              partStates={partStates}
              onComponentMove={handleComponentMove}
              onWireConnect={handleWireConnect}
              onWireDelete={handleWireDelete}
              onWireWaypointChange={handleWireWaypointChange}
              onWireColorChange={handleWireColorChange}
              onComponentDelete={(id) => {
                setSandboxComponents(prev => prev.filter(p => p.id !== id));
              }}
              onComponentAttrChange={(id, attrs) => {
                setSandboxComponents(prev => prev.map(p => {
                  if (p.id !== id) return p;
                  return { ...p, attrs: { ...p.attrs, ...attrs } };
                }));
              }}
              onComponentRotate={(id, rotate) => {
                setSandboxComponents(prev => prev.map(p => {
                  if (p.id !== id) return p;
                  return { ...p, rotate };
                }));
              }}
            />
          </div>

          <div className="flex-[1] min-h-[150px] rounded-2xl overflow-hidden">
            <SerialMonitorPanel output={serialOutput} onClear={() => setSerialOutput('')} />
          </div>
        </div>
      </div>
    </div>
  );
};
