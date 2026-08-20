import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, RefreshCw, Send, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { labsApi, virtualLabProjectsApi, diagramsApi, submissionsApi, assignmentsApi, gradingApi, resubmitRequestsApi } from '@/services/dashboardApi';
import type { ResubmitRequestEntity } from '@/services/dashboardApi';
import { Textarea } from '@/components/ui/textarea';
import { virtualLabHub } from '@/services/virtualLabHub';
import type { LabCircuitComponent, LabEntity, DiagramValidationResult, SimulationEventEntity, AutoGradeResultEntity, ComponentGlueRegistryEntity, SensorScenarioConfig } from '@/services/dashboardApi';
import { CodeEditorPanel } from '@/components/Dashboard/VirtualLab/Sandbox/CodeEditorPanel';
import { CircuitCanvas, type PartVisualState } from '@/components/Dashboard/VirtualLab/Sandbox/CircuitCanvas';
import { SerialMonitorPanel } from '@/components/Dashboard/VirtualLab/Sandbox/SerialMonitorPanel';
import { ComponentPalettePopup } from '@/components/Dashboard/VirtualLab/Sandbox/ComponentPalettePopup';
import { SensorScenarioPanel } from '@/components/Dashboard/VirtualLab/Sandbox/SensorScenarioPanel';
import { CloudDashboardPanel, type CloudComponentState } from '@/components/Dashboard/VirtualLab/Sandbox/CloudDashboardPanel';
import { getSandboxProjectId } from '@/components/Dashboard/VirtualLab/Sandbox/projectId';
import { AiAssistantPanel } from '@/components/Dashboard/VirtualLab/Sandbox/AiAssistantPanel';
import type { ProposedChange } from '@/services/aiAssistantApi';
import { componentRegistryApi } from '@/services/componentRegistryApi';
import {
  isRegistryComponentPaletteEnabled,
  mergeWithExistingGlueRegistry,
  toGlueRegistryCandidates,
} from '@/services/componentRegistryPaletteAdapter';

const DIAGRAM_SAVE_DEBOUNCE_MS = 1500;
// Riêng biệt với debounce lưu diagram (1.5s) — dài hơn 1 chút vì đây chỉ là
// "làm ấm" firmware cache chạy nền, không cần phản hồi ngay như lưu diagram.
const PRECOMPILE_DEBOUNCE_MS = 2500;

const defaultStarterCode =
  'void setup() {\n  pinMode(13, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(13, HIGH);\n  delay(1000);\n  digitalWrite(13, LOW);\n  delay(1000);\n}';

const defaultComponents: LabCircuitComponent[] = [
  { id: 'led1', type: 'led', x: 100, y: 100, pinMapping: {}, attrs: { color: 'red' } },
];

// Giai đoạn chạy mô phỏng thật (mode="qemu"): "analyzing" (Analyze() ở BE, rất
// nhanh — set ngay lúc bấm nút, không chờ tín hiệu BE) → "compiling" (compile
// thật ~40-90s, tín hiệu StudentCompileStarted/Finished) → "booting" (QEMU
// boot ~4s, tín hiệu StudentRunBooting) → "running" (event mô phỏng đầu tiên
// tới). Mode "educational" (interpreter) không có bước compile/boot — nhảy
// thẳng "analyzing" → "running" khi event đầu tiên tới, không hề gì.
type RunStage = 'idle' | 'analyzing' | 'compiling' | 'booting' | 'running';

const RUN_STAGE_LABELS: Record<Exclude<RunStage, 'idle' | 'running'>, string> = {
  analyzing: 'Đang kiểm tra sơ đồ mạch...',
  compiling: 'Đang biên dịch code... (có thể mất tới 90 giây)',
  booting: 'Đang khởi động mô phỏng...',
};

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
  const [runStage, setRunStage] = useState<RunStage>('idle');
  const [serialOutput, setSerialOutput] = useState('');
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [sandboxComponents, setSandboxComponents] = useState<LabCircuitComponent[]>(defaultComponents);
  const [sandboxConnections, setSandboxConnections] = useState<any[]>([]);
  // Sensor Input Bridge — Phase 1 (scenario/timeline, xem SensorScenarioPanel.tsx
  // + BE SensorRuntimeHeaderGenerator.cs) — lưu/tải theo đúng cơ chế diagram
  // save/reload có sẵn (nhúng trong circuitConfig, KHÔNG API/DB riêng).
  const [sensorScenario, setSensorScenario] = useState<SensorScenarioConfig>({ sensors: {} });
  const [isSensorPanelOpen, setIsSensorPanelOpen] = useState(false);
  // WiFi/Cloud — Virtual Cloud Runtime Phase 1 (xem CloudDashboardPanel.tsx +
  // BE CloudRuntimeHeaderGenerator.cs/QemuEsp32Runner.cs). key=componentId
  // (Cloud/Dashboard node trên canvas) -> topics theo tên (latest value) + log
  // gần nhất. Reset mỗi lần Run mới, giống partStates.
  const [cloudState, setCloudState] = useState<Record<string, CloudComponentState>>({});
  const [projectId, setProjectId] = useState<string | null>(null);
  // Nút "+" trên canvas (Wokwi-style) — danh sách linh kiện lấy qua ĐÚNG API
  // component-glue-registry đã có sẵn (labsApi.getComponentGlueRegistry),
  // cùng nguồn CircuitBuilderTeacherMode.tsx đang dùng, không gọi API mới.
  const [componentGlueRegistry, setComponentGlueRegistry] = useState<ComponentGlueRegistryEntity[]>([]);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [autoSelectPartId, setAutoSelectPartId] = useState<string | null>(null);
  const [projectBoard, setProjectBoard] = useState('esp32');
  const [projectLanguage, setProjectLanguage] = useState('arduino');
  const [diagramValidation, setDiagramValidation] = useState<DiagramValidationResult | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [partStates, setPartStates] = useState<Record<string, PartVisualState>>({});
  const [linkedAssignmentId, setLinkedAssignmentId] = useState<number | null>(null);
  const [assignmentDueDate, setAssignmentDueDate] = useState<string | null>(null);
  const [submissionAttempts, setSubmissionAttempts] = useState<{
    count: number;
    allowResubmit: boolean;
    resubmitLimit: number | null;
  } | null>(null);
  const [latestResubmitRequest, setLatestResubmitRequest] = useState<ResubmitRequestEntity | null>(null);
  const [resubmitReasonInput, setResubmitReasonInput] = useState('');
  const [isRequestingResubmit, setIsRequestingResubmit] = useState(false);
  const [resubmitRequestError, setResubmitRequestError] = useState<string | null>(null);
  const [lastSimulationEvents, setLastSimulationEvents] = useState<SimulationEventEntity[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [autoCheck, setAutoCheck] = useState<AutoGradeResultEntity | null>(null);
  const [guidance, setGuidance] = useState<{ message: string, teacherName?: string, timestamp: number } | null>(null);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [canUndoAiChange, setCanUndoAiChange] = useState(false);
  // Snapshot 1 bước TRƯỚC lần Apply gần nhất — dùng cho nút "Hoàn tác" trong
  // AiAssistantPanel. Dùng ref (không phải state) vì chỉ cần đọc lúc Undo,
  // không cần re-render khi snapshot thay đổi.
  const aiUndoSnapshotRef = useRef<{ code: string; components: LabCircuitComponent[]; connections: any[] } | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const precompileTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasHydratedRef = useRef(false);
  const replayTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  // BUG THẬT vừa vá: sau khi bấm Dừng, LED/Buzzer vẫn "đóng băng" ở trạng
  // thái cuối — nguyên nhân KÉP: (1) không có gì reset partStates lúc dừng
  // (đã vá bằng setPartStates({}) ở handleStop/onRunCompleted), NHƯNG (2)
  // StudentSimulationEvent đã được BE gửi đi TRƯỚC khi Stop có hiệu lực vẫn
  // có thể tới SAU khi FE đã reset (độ trễ mạng/round-trip Stop API) — event
  // trễ đó áp lại state cũ ("on") đè lên state vừa reset. Cờ này chặn MỌI
  // onSimulationEvent tới sau khi đã dừng, không phụ thuộc thứ tự tới của
  // gói tin.
  const isStoppedRef = useRef(true);
  // Log hệ thống — chỉ dùng đúng data/event ĐÃ CÓ sẵn (không gọi thêm API/đổi
  // event shape nào). true nếu StudentCompileStarted đã bắn cho lần Run hiện
  // tại (cache MISS thật — xem QemuEsp32Runner.cs: cache HIT thì hàm này
  // KHÔNG bắn) — nhờ đó lúc StudentRunBooting tới, biết chắc lần chạy này có
  // dùng cache hay không mà không cần đoán/thêm field mới từ BE.
  const compileStartedThisRunRef = useRef(false);
  const hasReceivedFirstEventThisRunRef = useRef(false);
  // "--- Simulation started ---" chỉ in 1 lần, ngay TRƯỚC dòng serial thật đầu
  // tiên của lần Run hiện tại (không phải ngay khi bấm Run — phải đợi tới khi
  // có serial thật để tách đúng ranh giới "trước đó toàn log hệ thống, từ đây
  // là output thật của firmware").
  const hasPrintedSimulationSeparatorRef = useRef(false);
  // Dedupe "Mô phỏng đã dừng"/"Đã reset trạng thái linh kiện" — BUG THẬT tìm
  // thấy khi test: bấm Dừng khiến CẢ handleStop() (log ngay, local) LẪN
  // onRunCompleted (log lại khi StudentRunCompleted từ server tới sau đó) đều
  // in cặp dòng này, dư 1 lần. Bên nào tới trước (luôn là handleStop() vì
  // không cần round-trip) thắng, bên còn lại tự bỏ qua qua cờ này.
  const hasLoggedStopThisRunRef = useRef(false);

  const appendLog = useCallback((prefix: 'compile' | 'simulation' | 'error', message: string) => {
    setSerialOutput((prev) => (prev.length > 0 && !prev.endsWith('\n') ? `${prev}\n` : prev) + `[${prefix}] ${message}\n`);
  }, []);

  // Dòng phân cách trần (không có prefix [xxx]) — dùng cho "--- Compile ---"/
  // "--- Simulation started ---", tách rõ log hệ thống khỏi raw serial thật
  // của firmware (yêu cầu "tách rõ" — SerialMonitorPanel.tsx tô riêng 1 màu).
  const appendRawLine = useCallback((text: string) => {
    setSerialOutput((prev) => (prev.length > 0 && !prev.endsWith('\n') ? `${prev}\n` : prev) + `${text}\n`);
  }, []);

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
      let resolvedSensorScenario: SensorScenarioConfig = labResponse.circuitConfig?.sensorScenario ?? { sensors: {} };

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
          resolvedSensorScenario = project.circuitConfig.sensorScenario ?? resolvedSensorScenario;
          // Board/Language của compile phải theo đúng VirtualLabProject (nguồn
          // sự thật duy nhất từ giờ), không còn hardcode Uno như luồng cũ.
          // Fallback về boardType của Lab (thay vì hardcode 'esp32' trần —
          // xem bug đã vá ở nhánh auto-create bên dưới) cho project cũ lỡ
          // chưa có board lưu sẵn.
          setProjectBoard(project.board || labResponse.boardType || 'esp32_devkit_v1');
          setProjectLanguage(project.language || 'arduino');
        } catch (projectError) {
          const status = (projectError as { response?: { status?: number } })?.response?.status;
          if (status === 404) {
            // Chưa có VirtualLabProject cho cặp (lab, student) này — tạo ngay
            // bằng nội dung starter của Lab, đúng hành vi auto-create của
            // PUT api/diagrams/{id} đã xác nhận ở BE (không chờ tới lần sửa
            // đầu tiên của học sinh).
            // BUG THẬT vừa vá: nhánh auto-create này không gửi "board" trong
            // circuitConfig, nên VirtualLabProject mới luôn rơi về mặc định
            // 'esp32' (khác setProjectBoard bên dưới cũng bị bỏ qua ở nhánh
            // này) — BE map chuỗi "esp32" trần sang FQBN
            // "esp32:esp32:esp32:FlashMode=dio", KHÔNG nằm trong danh sách
            // board hỗ trợ thật (compile fail ngay "Unsupported board", xác
            // nhận qua test Run thật). Gửi đúng boardType của Lab (VD:
            // "esp32_devkit_v1", nằm trong danh sách hỗ trợ) để tránh lỗi này.
            try {
              const created = await diagramsApi.save(pid, {
                circuitConfig: {
                  board: labResponse.boardType,
                  parts: starterComponents,
                  connections: starterConnections,
                },
                sourceCode: resolvedCode,
                labId: labResponse.id,
              });
              setDiagramValidation(created.validation);
            } catch (createError) {
              console.error('[LabSandboxPage] Failed to create initial VirtualLabProject', createError);
            }
            setProjectBoard(labResponse.boardType || 'esp32_devkit_v1');
          } else {
            throw projectError;
          }
        }
        
        // JoinSession(projectId) — BE tự resolve classId server-side (qua
        // VirtualLabProject.LabId + LabClassAssignments/Enrollments của
        // currentUserId, xem VirtualLabHub.cs), không cần FE tính/gửi classId
        // nữa. BUG THẬT vừa vá: bản cũ gọi joinSession(pid, classIdToUse) —
        // (1) Hub method đã đổi chữ ký từ lâu (2026-07-21) sang chỉ nhận
        // projectId, gọi kèm classId thừa khiến SignalR invocation LUÔN lỗi
        // (nuốt âm thầm qua .catch); (2) lời gọi còn bị chặn đứng sau
        // `if (classIdToUse && pid)` — lab không gắn assignment/class (như
        // lab sandbox nội bộ) thì KHÔNG BAO GIỜ join được group, nên
        // KHÔNG BAO GIỜ nhận được bất kỳ SignalR broadcast nào
        // (StudentCompileStarted/StudentSimulationEvent/...) dù BE chạy đúng
        // 100% — verify thật: DB có event GPIO thật nhưng canvas đứng im.
        virtualLabHub
          .joinSession(pid)
          .then(() => appendLog('simulation', 'SignalR đã kết nối, đang lắng nghe sự kiện mô phỏng.'))
          .catch(e => {
            console.error('[LabSandboxPage] SignalR join failed', e);
            appendLog('error', 'SignalR kết nối thất bại — sự kiện mô phỏng realtime có thể không hiển thị.');
          });
      }

      setCode(resolvedCode);
      setSandboxComponents(resolvedComponents);
      setSandboxConnections(resolvedConnections);
      setSensorScenario(resolvedSensorScenario);

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
      if (projectId) {
        virtualLabHub.stopped(projectId).catch(() => {});
      }
    };
  }, [projectId]);

  useEffect(() => {
    const onReceiveGuidance = (message: string, teacherName?: string) => {
      setGuidance({ message, teacherName, timestamp: Date.now() });
      setTimeout(() => setGuidance(null), 8000);
    };
    virtualLabHub.on('ReceiveGuidance', onReceiveGuidance);
    return () => {
      virtualLabHub.off('ReceiveGuidance', onReceiveGuidance);
    };
  }, []);

  // Sự kiện nội bộ additive (virtualLabHub.ts) — không có trước task này,
  // không đổi shape/API SignalR thật nào, chỉ expose lại đúng thời điểm
  // onclose/onreconnecting/onreconnected thật của SignalR client cho Serial
  // Monitor log ([error]/[simulation] SignalR ...).
  useEffect(() => {
    const onConnectionClosed = () => appendLog('error', 'SignalR đã ngắt kết nối.');
    const onConnectionReconnecting = () => appendLog('error', 'SignalR mất kết nối — đang thử kết nối lại...');
    const onConnectionReconnected = () => appendLog('simulation', 'SignalR đã kết nối lại.');
    virtualLabHub.on('ConnectionClosed', onConnectionClosed);
    virtualLabHub.on('ConnectionReconnecting', onConnectionReconnecting);
    virtualLabHub.on('ConnectionReconnected', onConnectionReconnected);
    return () => {
      virtualLabHub.off('ConnectionClosed', onConnectionClosed);
      virtualLabHub.off('ConnectionReconnecting', onConnectionReconnecting);
      virtualLabHub.off('ConnectionReconnected', onConnectionReconnected);
    };
  }, [appendLog]);

  // BE giờ tự chạy nền + đẩy từng SimulationEvent qua Hub ngay khi tính ra
  // (xem VirtualLabRuntimeService/EducationalSimulationRunner) — không còn
  // FE tự relay lại (virtualLabHub.simulationEvent) như trước, và không còn
  // nhận nguyên mảng event đầy đủ từ response /start để phát lại bằng
  // setTimeout. Đăng ký 1 lần khi mount (giống pattern ReceiveGuidance ở
  // trên) — lọc đúng project đã dựa vào SignalR group "project-{id}" phía
  // server (JoinSession), không cần lọc lại projectId ở đây.
  useEffect(() => {
    const onSimulationEvent = (_projectId: string, evt: SimulationEventEntity) => {
      // Bỏ qua event đến TRỄ sau khi đã dừng (đã gửi từ BE trước khi Stop có
      // hiệu lực, tới sau do độ trễ mạng) — không thì đè lại state vừa reset
      // của handleStop/onRunCompleted, làm LED/Buzzer "tự sáng lại" dù đã tắt.
      if (isStoppedRef.current) return;

      if (!hasReceivedFirstEventThisRunRef.current) {
        hasReceivedFirstEventThisRunRef.current = true;
        appendLog('simulation', 'QEMU đã chạy — bắt đầu nhận dữ liệu mô phỏng.');
      }

      // Event mô phỏng đầu tiên tới = tín hiệu chuyển sang canvas thật, bất
      // kể mode (educational nhảy thẳng từ "analyzing", qemu đi qua đủ
      // "compiling"→"booting" trước khi tới đây).
      setRunStage('running');
      applySimulationEvent(evt);
    };
    const onRunCompleted = (_projectId: string, status: string, reason?: string) => {
      setIsRunning(false);
      setRunStage('idle');
      // BUG THẬT vừa vá: mô phỏng dừng (tự nhiên hết MaxDurationMs, hay lỗi)
      // nhưng LED/Buzzer vẫn "đóng băng" ở trạng thái sáng/kêu cuối cùng —
      // vì không có gì reset partStates khi run kết thúc (chỉ handleRun() lúc
      // BẮT ĐẦU chạy mới mới clear). Mạch đã ngừng chạy thì output phải về
      // trạng thái tắt, giống hành vi thật (ngắt điện thì LED tắt).
      isStoppedRef.current = true;
      setPartStates({});
      if (status === 'error') {
        appendLog('error', `Mô phỏng dừng do lỗi${reason ? `: ${reason}` : '.'}`);
      } else if (!hasLoggedStopThisRunRef.current) {
        hasLoggedStopThisRunRef.current = true;
        appendLog('simulation', 'Mô phỏng đã dừng.');
        appendLog('simulation', 'Đã reset trạng thái linh kiện.');
      }
    };
    const onCompileStarted = (_projectId: string) => {
      setRunStage('compiling');
      compileStartedThisRunRef.current = true;
      appendLog('compile', 'Không có firmware cache khớp — bắt đầu biên dịch thật (có thể mất tới 90 giây)...');
    };
    const onCompileFinished = (_projectId: string, success: boolean, errorSummary?: string) => {
      // Nếu compile thất bại, StudentRunCompleted (status=error) cũng sẽ tới
      // ngay sau đó và tự set isRunning/runStage về idle — ở đây chỉ cần hiện
      // lỗi sớm hơn 1 nhịp cho học sinh thấy ngay, không phải chờ vòng dọn
      // dẹp cuối của background task.
      if (!success) {
        setCompileError(errorSummary || 'Biên dịch thất bại.');
        appendLog('error', `Biên dịch thất bại${errorSummary ? `:\n${errorSummary}` : '.'}`);
      } else {
        appendLog('compile', 'Biên dịch thành công.');
      }
    };
    const onRunBooting = (_projectId: string) => {
      setRunStage('booting');
      // StudentCompileStarted KHÔNG bắn khi cache HIT (xem QemuEsp32Runner.cs)
      // — nếu tới đây mà cờ đó vẫn false, đúng nghĩa lần chạy này đã dùng
      // cache, không phải suy đoán.
      if (!compileStartedThisRunRef.current) {
        appendLog('compile', 'Dùng firmware cache — bỏ qua biên dịch.');
      }
      appendLog('simulation', 'Đang khởi động QEMU...');
    };
    virtualLabHub.on('StudentSimulationEvent', onSimulationEvent);
    virtualLabHub.on('StudentRunCompleted', onRunCompleted);
    virtualLabHub.on('StudentCompileStarted', onCompileStarted);
    virtualLabHub.on('StudentCompileFinished', onCompileFinished);
    virtualLabHub.on('StudentRunBooting', onRunBooting);
    return () => {
      virtualLabHub.off('StudentSimulationEvent', onSimulationEvent);
      virtualLabHub.off('StudentRunCompleted', onRunCompleted);
      virtualLabHub.off('StudentCompileStarted', onCompileStarted);
      virtualLabHub.off('StudentCompileFinished', onCompileFinished);
      virtualLabHub.off('StudentRunBooting', onRunBooting);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadLab();
  }, [loadLab]);

  useEffect(() => {
    labsApi
      .getComponentGlueRegistry(true)
      .then(async (registry) => {
        if (!isRegistryComponentPaletteEnabled()) {
          setComponentGlueRegistry(registry);
          return;
        }
        try {
          const registryComponents = await componentRegistryApi.list();
          setComponentGlueRegistry(
            mergeWithExistingGlueRegistry(registry, toGlueRegistryCandidates(registryComponents))
          );
        } catch {
          setComponentGlueRegistry(registry);
        }
      })
      .catch((error) => console.error('[LabSandboxPage] Failed to load component glue registry', error));
  }, []);

  // Lưu diagram/code debounce ~1.5s sau khi ngừng thao tác — tránh gọi PUT
  // theo từng pixel khi kéo linh kiện (onComponentMove bắn liên tục lúc kéo).
  useEffect(() => {
    if (!projectId || !hasHydratedRef.current) return;

    setSaveStatus('saving');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void diagramsApi
        .save(projectId, {
          circuitConfig: { parts: sandboxComponents, connections: sandboxConnections, sensorScenario },
          sourceCode: code,
        })
        .then((session) => {
          setDiagramValidation(session.validation);
          setSaveStatus('saved');
          if (projectId) {
            virtualLabHub.diagramUpdated(projectId, JSON.stringify({ parts: sandboxComponents, connections: sandboxConnections, sensorScenario })).catch(() => {});
            virtualLabHub.codeUpdated(projectId, code).catch(() => {});
          }
        })
        .catch((error) => {
          console.error('[LabSandboxPage] Failed to save diagram', error);
          setSaveStatus('error');
        });
    }, DIAGRAM_SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [projectId, sandboxComponents, sandboxConnections, sensorScenario, code]);

  // Precompile nền (Wokwi-like): 2.5s sau khi ngừng gõ code, "làm ấm" firmware
  // cache trước khi học sinh bấm Run — để lúc Run thật, QemuEsp32Runner rơi
  // đúng cache hit thay vì phải compile ~40-90s ngay trong lúc chờ. Chỉ theo
  // dõi `code` (không phải diagram — đổi dây/di chuyển linh kiện không ảnh
  // hưởng firmware). Không bắn khi đang chạy mô phỏng (không cần thiết, học
  // sinh chưa chắc sửa code khác trong lúc đang xem Run). BE tự kiểm tra cache
  // trước khi compile thật (FirmwareCacheService) và dedupe qua
  // ICompileCoordinator nếu 2 lần debounce trùng đúng nội dung — gọi thừa ở
  // đây không lãng phí compile thật.
  useEffect(() => {
    if (!projectId || !hasHydratedRef.current || isRunning) return;

    if (precompileTimerRef.current) clearTimeout(precompileTimerRef.current);
    precompileTimerRef.current = setTimeout(() => {
      virtualLabProjectsApi.precompile(projectId, code).catch((error) => {
        // Chỉ là tối ưu tốc độ — lỗi ở đây không cần hiện cho học sinh, Run
        // vẫn hoạt động đúng (sẽ tự compile khi cache miss).
        console.error('[LabSandboxPage] Precompile trigger failed', error);
      });
    }, PRECOMPILE_DEBOUNCE_MS);

    return () => {
      if (precompileTimerRef.current) clearTimeout(precompileTimerRef.current);
    };
  }, [projectId, code, isRunning]);

  const clearReplayTimers = () => {
    replayTimersRef.current.forEach(clearTimeout);
    replayTimersRef.current = [];
  };

  const applySimulationEvent = (event: SimulationEventEntity) => {
    // BE (EducationalSimulationRunner chạy nền) đã tự ghi DB + broadcast
    // event này rồi — KHÔNG relay lại qua virtualLabHub.simulationEvent()
    // nữa. Làm vậy sẽ tạo vòng lặp: nhận event từ Hub -> gọi lại Hub method
    // SimulationEvent -> Hub method broadcast lại -> nhận lại lần nữa...
    setLastSimulationEvents((prev) => [...prev, event]);

    if (event.type === 'serial') {
      if (!hasPrintedSimulationSeparatorRef.current) {
        hasPrintedSimulationSeparatorRef.current = true;
        appendRawLine('--- Simulation started ---');
      }
      const message = typeof event.payload.message === 'string' ? event.payload.message : '';
      setSerialOutput((prev) => prev + message + (event.payload.newline ? '\n' : ''));
      return;
    }

    if (event.type === 'part-state') {
      const partId = typeof event.payload.partId === 'string' ? event.payload.partId : '';
      const component = typeof event.payload.component === 'string' ? event.payload.component : '';
      if (!partId) return;

      const stateDescription = Object.entries(event.payload)
        .filter(([key]) => key !== 'partId' && key !== 'component')
        .map(([key, value]) => `${key}=${value}`)
        .join(' ');
      appendLog('simulation', `part-state: ${component || partId} ${stateDescription}`.trim());

      if (component === 'led') {
        const value = event.payload.state === 'on' ? '1' : '0';
        setPartStates((prev) => ({ ...prev, [partId]: { ...prev[partId], value } }));
      } else if (component === 'buzzer') {
        const buzzing = event.payload.state === 'buzzing';
        setPartStates((prev) => ({ ...prev, [partId]: { ...prev[partId], buzzing } }));
      } else if (component === 'l298n') {
        // Runtime adapter thật (L298nModel.cs) — suy ra state từ cặp chân IN
        // qua QEMU, không phải giả lập. motor: "A" | "B".
        const motor = event.payload.motor === 'B' ? 'motorB' : 'motorA';
        const state = event.payload.state as PartVisualState['motorA'];
        setPartStates((prev) => ({ ...prev, [partId]: { ...prev[partId], [motor]: state } }));
      } else if (component === 'rgb-led') {
        const channelKey = event.payload.channel === 'G' ? 'rgbG' : event.payload.channel === 'B' ? 'rgbB' : 'rgbR';
        const on = event.payload.state === 'on';
        setPartStates((prev) => ({ ...prev, [partId]: { ...prev[partId], [channelKey]: on } }));
      }
      // Button/Servo/DHT/Ultrasonic: chưa có adapter runtime — không có gì để
      // ánh xạ (giới hạn kỹ thuật đã ghi trong Component Support Matrix, xem
      // robotKitComponents.ts, không phải thiếu sót ở nơi này).
      return;
    }

    // WiFi/Cloud Phase 1 — StemFlowCloud.publish() (xem CloudDashboardPanel.tsx
    // + BE QemuEsp32Runner.cs TryParseSfCloudEvent). componentId trong Payload,
    // KHÔNG phải partId — giữ đúng đặc tả cloud-event của tính năng này (khác
    // quy ước "part-state" cũ), xem CloudRuntimeHeaderGenerator.cs.
    if (event.type === 'cloud-event') {
      const componentId = typeof event.payload.componentId === 'string' ? event.payload.componentId : '';
      const topic = typeof event.payload.topic === 'string' ? event.payload.topic : '';
      const value = event.payload.value;
      if (!componentId || !topic) return;
      if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') return;

      const timeMs = typeof event.payload.timeMs === 'number' ? event.payload.timeMs : event.time;
      appendLog('simulation', `cloud: ${componentId} ${topic} = ${value}`);
      setPartStates((prev) => ({ ...prev, [componentId]: { ...prev[componentId], cloudLive: true } }));

      setCloudState((prev) => {
        const existing = prev[componentId] ?? { topics: {}, log: [] };
        return {
          ...prev,
          [componentId]: {
            topics: { ...existing.topics, [topic]: { value, timeMs } },
            log: [...existing.log, `${topic} = ${value}`].slice(-20),
          },
        };
      });
    }
  };

  // Mock runner trả toàn bộ danh sách event tính sẵn cùng lúc (không phải
  // stream trực tiếp) — phát lại bằng timer theo đúng Time (ms tích lũy qua
  // delay() trong code) để giữ cảm giác chạy thời gian thực.
  const replaySimulationEvents = (events: SimulationEventEntity[]) => {
    clearReplayTimers();
    setPartStates({});
    setCloudState({});
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
    setCloudState({});
    setIsRunning(false);
    // Mở lại cổng nhận event — phải đặt SAU setPartStates({}) ở trên, TRƯỚC
    // khi có event nào của lần chạy MỚI này có thể tới (xem isStoppedRef).
    isStoppedRef.current = false;
    compileStartedThisRunRef.current = false;
    hasReceivedFirstEventThisRunRef.current = false;
    hasPrintedSimulationSeparatorRef.current = false;
    hasLoggedStopThisRunRef.current = false;
    // Set ngay lúc bấm, không chờ tín hiệu BE — Analyze() rất nhanh (đo thật
    // ~ms), không cần round-trip riêng cho giai đoạn này.
    setRunStage('analyzing');
    appendRawLine('--- Compile ---');
    appendLog('compile', 'Bắt đầu kiểm tra sơ đồ mạch (Analyze)...');
    appendLog('compile', `Board: ${projectBoard}, Framework: ${projectLanguage}`);

    try {
      if (projectId) {
        // PHẢI await — RunStarted() phía Hub reset SimulationEventsJson="[]"
        // (MarkRunStartedAsync). Nếu để fire-and-forget như trước, nó có
        // thể resolve SAU khi /start đã kick off background task và
        // background task đã kịp ghi vài event đầu tiên — reset chạy sau sẽ
        // xoá mất chúng. await ở đây đảm bảo reset này (nếu có tác dụng gì)
        // luôn hoàn tất TRƯỚC khi /start được gọi. Compile thật giờ chỉ còn
        // 1 lần, xảy ra bên trong QemuEsp32Runner (BE) khi background task
        // chạy — không còn gọi simulationCompileApi.compile() thừa ở đây
        // (kết quả của nó trước kia không được dùng vào đâu cả).
        await virtualLabHub.runStarted(projectId).catch(() => {});
      }

      setLastSimulationEvents([]);
      setPartStates({});

      const runResult = await virtualLabProjectsApi.start(projectId, {
        code,
        diagram: { parts: sandboxComponents, connections: sandboxConnections, sensorScenario },
      });

      if (runResult.status === 'error') {
        isStoppedRef.current = true;
        const message = runResult.validation.errors.length
          ? runResult.validation.errors.join('\n')
          : 'Mạch không hợp lệ, không thể chạy mô phỏng.';
        setCompileError(message);
        appendLog('error', `Compile failed — ${message}`);
        setRunStage('idle');
        return;
      }

      appendLog('compile', 'Sơ đồ hợp lệ — đang chờ biên dịch/khởi động mô phỏng...');

      // BE đã kick off chạy nền và sẽ đẩy từng event qua Hub
      // (StudentSimulationEvent) — không còn events[] đầy đủ để phát lại
      // ngay ở đây nữa (xem useEffect đăng ký onSimulationEvent/onRunCompleted
      // ở trên). setIsRunning(true) ngay, tắt lại khi nhận StudentRunCompleted.
      // runStage giữ nguyên "analyzing" — StudentCompileStarted/StudentRunBooting
      // (mode qemu) hoặc thẳng StudentSimulationEvent (mode educational) sẽ tự
      // đẩy tiếp từ đây qua useEffect ở trên.
      setIsRunning(true);
    } catch (error) {
      isStoppedRef.current = true;
      const message = getErrorMessage(error, 'Không gọi được API chạy mô phỏng.');
      setCompileError(message);
      appendLog('error', `Start API failed — ${message}`);
      setRunStage('idle');
    } finally {
      setIsCompiling(false);
    }
  };

  const handleStop = async () => {
    isStoppedRef.current = true;
    clearReplayTimers();
    setIsRunning(false);
    setRunStage('idle');
    // Reset ngay khi bấm Dừng — không đợi StudentRunCompleted từ server mới
    // tắt LED/Buzzer (round-trip qua BE/SignalR có độ trễ, học sinh bấm Dừng
    // phải thấy mạch tắt ngay lập tức, giống ngắt điện thật).
    setPartStates({});
    appendLog('simulation', 'Đang dừng mô phỏng...');

    if (!projectId) return;
    try {
      await virtualLabProjectsApi.stop(projectId);
      if (!hasLoggedStopThisRunRef.current) {
        hasLoggedStopThisRunRef.current = true;
        appendLog('simulation', 'Đã dừng.');
        appendLog('simulation', 'Đã reset trạng thái linh kiện.');
      }
      if (projectId) {
        virtualLabHub.stopped(projectId).catch(() => {});
      }
    } catch (error) {
      console.error('[LabSandboxPage] Failed to stop simulation', error);
      appendLog('error', `Simulation failed — không dừng được: ${getErrorMessage(error, 'lỗi không rõ')}`);
    }
  };

  // Deadline + số lần nộp — chỉ để hiển thị/disable nút cho UX, BE
  // (SubmitVirtualLabAsync) vẫn là source of truth thật sự enforce cả 2 rule
  // này (xem VirtualLabRuntimeService.cs) — FE không tự quyết định gì cả.
  const [approvedResubmitRequests, setApprovedResubmitRequests] = useState<ResubmitRequestEntity[]>([]);

  const reloadResubmitRequests = useCallback(() => {
    if (!linkedAssignmentId) return;
    void resubmitRequestsApi.list({ assignmentId: linkedAssignmentId }).then((requests) => {
      setApprovedResubmitRequests(requests.filter((item) => item.status === 'approved'));
      const pending = requests.find((item) => item.status === 'pending');
      const mostRecent = requests
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      setLatestResubmitRequest(pending ?? mostRecent ?? null);
    }).catch(() => {});
  }, [linkedAssignmentId]);

  useEffect(() => {
    if (!linkedAssignmentId) {
      setAssignmentDueDate(null);
      setSubmissionAttempts(null);
      setApprovedResubmitRequests([]);
      setLatestResubmitRequest(null);
      return;
    }

    let cancelled = false;
    void assignmentsApi.getById(linkedAssignmentId).then((assignment) => {
      if (!cancelled) setAssignmentDueDate(assignment.dueDate ?? null);
    }).catch(() => {});

    void gradingApi.getSubmissions({ assignmentId: linkedAssignmentId }).then((result) => {
      if (cancelled) return;
      // count từ list submission của chính Student (BE tự scope theo JWT) —
      // đủ để hiển thị "Lần nộp: N", không cần attemptNumber riêng ở đây.
      setSubmissionAttempts((prev) => ({
        count: result.totalCount,
        allowResubmit: prev?.allowResubmit ?? true,
        resubmitLimit: prev?.resubmitLimit ?? null,
      }));
    }).catch(() => {});

    void assignmentsApi.getById(linkedAssignmentId).then((assignment) => {
      if (cancelled) return;
      setSubmissionAttempts((prev) => ({
        count: prev?.count ?? 0,
        allowResubmit: assignment.allowResubmit,
        resubmitLimit: assignment.resubmitLimit ?? null,
      }));
    }).catch(() => {});

    reloadResubmitRequests();

    return () => {
      cancelled = true;
    };
  }, [linkedAssignmentId, reloadResubmitRequests]);

  // Cộng dồn approved ResubmitRequest lên trên cấu hình gốc — PHẢI khớp chính xác
  // công thức ResubmitEligibility.cs bên BE (BE vẫn là source of truth thật sự
  // enforce; tính lại ở đây chỉ để UI không hiện "bị chặn" sai khi đã được duyệt).
  const effectiveDueDateMs = (() => {
    const base = assignmentDueDate ? new Date(assignmentDueDate).getTime() : null;
    const granted = approvedResubmitRequests
      .map((item) => (item.grantedNewDueDate ? new Date(item.grantedNewDueDate).getTime() : null))
      .filter((value): value is number => value != null);
    const all = [base, ...granted].filter((value): value is number => value != null);
    return all.length > 0 ? Math.max(...all) : null;
  })();
  const isPastDeadline = effectiveDueDateMs != null && Date.now() > effectiveDueDateMs;

  const isResubmitBlocked = (() => {
    if (!submissionAttempts) return false;
    const extraAttempts = approvedResubmitRequests.reduce((sum, item) => sum + (item.grantedExtraAttempts ?? 0), 0);
    const effectiveMax = !submissionAttempts.allowResubmit
      ? 1 + extraAttempts
      : submissionAttempts.resubmitLimit == null
        ? Infinity
        : submissionAttempts.resubmitLimit + extraAttempts;
    return submissionAttempts.count >= effectiveMax;
  })();

  const handleRequestResubmit = async () => {
    if (!linkedAssignmentId) return;
    setIsRequestingResubmit(true);
    setResubmitRequestError(null);
    try {
      const created = await resubmitRequestsApi.create(linkedAssignmentId, resubmitReasonInput.trim() || undefined);
      setLatestResubmitRequest(created);
      setResubmitReasonInput('');
    } catch (error) {
      setResubmitRequestError(getErrorMessage(error, 'Không gửi được yêu cầu — vui lòng thử lại.'));
    } finally {
      setIsRequestingResubmit(false);
    }
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
        circuitConfig: { parts: sandboxComponents, connections: sandboxConnections, sensorScenario },
        sourceCode: code,
        simulationEvents: lastSimulationEvents,
      });

      setAutoCheck(result.autoCheck);
      setSubmitMessage(
        `Đã nộp bài — đạt ${result.autoCheck.passedChecks}/${result.autoCheck.totalChecks} tiêu chí` +
          (result.autoScore != null ? `, điểm tự động: ${result.autoScore}.` : '.')
      );
      setSubmissionAttempts((prev) => (prev ? { ...prev, count: prev.count + 1 } : prev));
      reloadResubmitRequests();
      if (projectId) {
        virtualLabHub.submitted(projectId, result.submissionId || 0).catch(() => {});
      }
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Không nộp được bài — vui lòng thử lại.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Thêm linh kiện qua popup "+" — vị trí mặc định rải theo bậc thang gần góc
  // nút (top-left), giống pattern createPart() đã có trong
  // CircuitBuilderTeacherMode.tsx (không phá cách thêm linh kiện hiện tại ở
  // đó, đây là đường thêm MỚI dành cho Sandbox học sinh — trước đây học sinh
  // KHÔNG có cách nào tự thêm linh kiện, chỉ có sẵn từ diagram giáo viên soạn).
  const handleAddComponent = (componentType: string) => {
    const index = sandboxComponents.length;
    const newPart: LabCircuitComponent = {
      id: `${componentType}-${Date.now()}-${index}`,
      type: componentType,
      x: 60 + (index % 5) * 90,
      y: 220 + Math.floor(index / 5) * 90,
      attrs: {},
      pinMapping: {},
    };
    setSandboxComponents((prev) => [...prev, newPart]);
    setAutoSelectPartId(newPart.id);
    setIsPaletteOpen(false);
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

  // Áp dụng 1 proposedChange từ AI Assistant — CHỈ được gọi sau khi người dùng
  // tự bấm "Áp dụng" trên AiAssistantPanel (không bao giờ tự động). Tái dùng
  // đúng các setter/handler đã có (setCode/setSandboxComponents/handleWireConnect-
  // style) để autosave debounce hiện tại tự bắt được thay đổi, không cần gọi
  // diagramsApi.save() riêng ở đây.
  const handleApplyAiChange = useCallback((change: ProposedChange) => {
    aiUndoSnapshotRef.current = { code, components: sandboxComponents, connections: sandboxConnections };
    setCanUndoAiChange(true);

    switch (change.type) {
      case 'replace_file': {
        if (typeof change.after === 'string') setCode(change.after);
        break;
      }
      case 'replace_range': {
        if (typeof change.after === 'string' && change.startLine && change.endLine) {
          const lines = code.split('\n');
          const head = lines.slice(0, Math.max(change.startLine - 1, 0));
          const tail = lines.slice(change.endLine);
          setCode([...head, change.after, ...tail].join('\n'));
        } else if (typeof change.after === 'string') {
          setCode(change.after);
        }
        break;
      }
      case 'insert_code': {
        if (typeof change.after === 'string') {
          const lines = code.split('\n');
          const at = change.insertAtLine
            ? Math.min(Math.max(change.insertAtLine - 1, 0), lines.length)
            : lines.length;
          lines.splice(at, 0, change.after);
          setCode(lines.join('\n'));
        }
        break;
      }
      case 'add_component': {
        const isSupportedComponentType = change.component?.type
          ? componentGlueRegistry.some((entry) => entry.componentType === change.component!.type)
          : false;
        if (change.component?.type && isSupportedComponentType) {
          const newPart: LabCircuitComponent = {
            id: change.component.id || `${change.component.type}-${Date.now()}`,
            type: change.component.type,
            x: change.component.x ?? 60,
            y: change.component.y ?? 220,
            attrs: {},
            pinMapping: {},
          };
          setSandboxComponents((prev) => [...prev, newPart]);
          setAutoSelectPartId(newPart.id);
        }
        break;
      }
      case 'update_wire': {
        if (change.wire?.from && change.wire?.to) {
          const newConnection = [change.wire.from, change.wire.to, change.wire.color || '#00ff00', []];
          setSandboxConnections((prev) => [...prev, newConnection]);
        }
        break;
      }
      case 'update_diagram_json': {
        if (change.diagramJson) {
          try {
            const parsed = JSON.parse(change.diagramJson);
            if (Array.isArray(parsed.parts)) setSandboxComponents(parsed.parts);
            if (Array.isArray(parsed.connections)) setSandboxConnections(parsed.connections);
          } catch (error) {
            console.error('[LabSandboxPage] AI đề xuất diagramJson không hợp lệ', error);
          }
        }
        break;
      }
      default:
        break;
    }
  }, [code, sandboxComponents, sandboxConnections, componentGlueRegistry]);

  const handleUndoAiChange = useCallback(() => {
    const snapshot = aiUndoSnapshotRef.current;
    if (!snapshot) return;
    setCode(snapshot.code);
    setSandboxComponents(snapshot.components);
    setSandboxConnections(snapshot.connections);
    aiUndoSnapshotRef.current = null;
    setCanUndoAiChange(false);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-20 rounded-xl border border-border bg-card animate-pulse" />
        <div className="h-[calc(100vh-8rem)] rounded-xl border border-border bg-card animate-pulse" />
      </div>
    );
  }

  if (loadError || !lab) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <button
          type="button"
          onClick={() => navigate('/dashboard/virtual-lab')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách lab
        </button>
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-destructive">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 mt-0.5 shrink-0" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Không mở được Sandbox</h1>
              <p className="text-sm mt-1 text-destructive">{loadError || 'Phòng lab không tồn tại.'}</p>
              <Button
                onClick={() => void loadLab()}
                className="mt-4 bg-destructive text-white hover:bg-destructive/90"
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
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại chi tiết lab
        </button>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-6 text-amber-500">
          Lab này không dùng Sandbox nội bộ. Vui lòng mở bằng màn hình Wokwi iframe.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] space-y-4 relative">
      {guidance && (
        <div className="absolute top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-indigo-500 text-white p-4 rounded-xl shadow-lg border border-indigo-600 max-w-sm flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 shrink-0 text-indigo-200 mt-0.5" />
            <div>
              <p className="text-xs text-indigo-200 font-bold uppercase mb-1">
                Giáo viên {guidance.teacherName || ''} nhắc nhở
              </p>
              <p className="text-sm font-medium">{guidance.message}</p>
            </div>
            <button onClick={() => setGuidance(null)} aria-label="Đóng thông báo" className="text-indigo-200 hover:text-white shrink-0">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={() => navigate(`/dashboard/virtual-lab/${lab.id}`)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label="Quay lại chi tiết lab"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">{lab.title}</h1>
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

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsAiPanelOpen(true)}
            className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300"
            title="AI Assistant — đề xuất thay đổi code/sơ đồ, cần bạn xác nhận mới áp dụng"
          >
            AI Assistant
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsSensorPanelOpen(true)}
            className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300"
            title="Cấu hình kịch bản sensor (Phase 1 — scenario/timeline)"
          >
            Sensor Scenario
          </Button>
          {linkedAssignmentId ? (
          <div className="flex flex-col items-end gap-1">
            <Button
              type="button"
              disabled={isSubmitting || isPastDeadline || isResubmitBlocked}
              onClick={() => void handleSubmit()}
              className="bg-amber-500 hover:bg-amber-600 text-white border-0 font-semibold px-6 disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
            </Button>
            <p className="text-[11px] text-muted-foreground text-right">
              {assignmentDueDate && (
                <span className={isPastDeadline ? 'text-destructive font-medium' : ''}>
                  {isPastDeadline ? 'Đã hết hạn nộp' : `Hạn: ${new Date(assignmentDueDate).toLocaleString('vi-VN')}`}
                </span>
              )}
              {submissionAttempts && submissionAttempts.count > 0 && (
                <span className="ml-1">
                  · Lần nộp: {submissionAttempts.count}
                  {submissionAttempts.resubmitLimit != null ? `/${submissionAttempts.resubmitLimit}` : ''}
                </span>
              )}
            </p>
            {isResubmitBlocked && !isPastDeadline && (
              <p className="text-[11px] text-destructive">Đã hết lượt nộp lại cho bài này.</p>
            )}
            {(isPastDeadline || isResubmitBlocked) && (
              <div className="mt-1 w-64 rounded-lg border border-border/60 bg-muted/30 p-2">
                {latestResubmitRequest?.status === 'pending' ? (
                  <p className="text-[11px] text-amber-500 font-medium">
                    Yêu cầu nộp lại đang chờ giáo viên duyệt.
                  </p>
                ) : latestResubmitRequest?.status === 'approved' ? (
                  <p className="text-[11px] text-emerald-500 font-medium">
                    Yêu cầu đã được duyệt — bạn có thể nộp lại.
                  </p>
                ) : (
                  <>
                    {latestResubmitRequest?.status === 'rejected' && (
                      <p className="text-[11px] text-destructive mb-1">
                        Yêu cầu trước đã bị từ chối
                        {latestResubmitRequest.reviewNote ? `: ${latestResubmitRequest.reviewNote}` : '.'}
                      </p>
                    )}
                    <Textarea
                      value={resubmitReasonInput}
                      onChange={(e) => setResubmitReasonInput(e.target.value)}
                      placeholder="Lý do xin nộp lại (không bắt buộc)"
                      className="min-h-[50px] text-xs"
                      disabled={isRequestingResubmit}
                    />
                    {resubmitRequestError && (
                      <p className="text-[11px] text-destructive mt-1">{resubmitRequestError}</p>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isRequestingResubmit}
                      onClick={() => void handleRequestResubmit()}
                      className="mt-1 w-full text-xs"
                    >
                      {isRequestingResubmit ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : null}
                      Yêu cầu nộp lại
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground max-w-[220px] text-right">
            Lab này chưa gắn bài đánh giá — không thể nộp bài.
          </p>
        )}
        </div>
      </div>

      {submitMessage && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm font-medium text-blue-300">
          {submitMessage}
        </div>
      )}

      {submitError && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {submitError}
        </div>
      )}

      {autoCheck && (
        <div className="rounded-xl border border-border bg-card p-4 shrink-0 space-y-2">
          <p className="text-sm font-bold text-foreground">
            Kết quả chấm tự động — {autoCheck.passedChecks}/{autoCheck.totalChecks} tiêu chí
          </p>
          {autoCheck.checks.map((check) => (
            <div key={check.name} className="flex items-start gap-2 text-sm">
              {check.passed ? (
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-destructive" />
              )}
              <div>
                <span className="font-semibold capitalize">{check.name}</span>
                <span className="text-muted-foreground"> — {check.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <AiAssistantPanel
        open={isAiPanelOpen}
        onClose={() => setIsAiPanelOpen(false)}
        projectId={projectId}
        currentCode={code}
        currentDiagramJson={JSON.stringify({
          board: lab?.boardType,
          parts: sandboxComponents,
          connections: sandboxConnections,
          sensorScenario,
        })}
        onApplyChange={handleApplyAiChange}
        onUndo={handleUndoAiChange}
        canUndo={canUndoAiChange}
      />

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
              onOpenPalette={() => setIsPaletteOpen(true)}
              autoSelectId={autoSelectPartId}
              onButtonInput={(componentId, pressed) => {
                // Only meaningful while a simulation is actually running —
                // matches ACCEPTANCE CRITERIA "no restart, no recompile":
                // this never triggers a new Run, it only reaches a session
                // ISimulationInputChannel already has registered.
                if (!isRunning || !projectId) return;
                virtualLabHub.setSimulationInput(projectId, componentId, pressed).catch((error) => {
                  console.error('[LabSandboxPage] setSimulationInput failed', error);
                });
              }}
              onAnalogInput={(componentId, value) => {
                if (!isRunning || !projectId) return;
                virtualLabHub.setAnalogInput(projectId, componentId, value).catch((error) => {
                  console.error('[LabSandboxPage] setAnalogInput failed', error);
                });
              }}
              onSensorInput={(componentId, sensorKind, value) => {
                if (!isRunning || !projectId) return;
                virtualLabHub.setSensorInput(projectId, componentId, sensorKind, value).catch((error) => {
                  console.error('[LabSandboxPage] setSensorInput failed', error);
                });
              }}
            />

            <ComponentPalettePopup
              open={isPaletteOpen}
              onClose={() => setIsPaletteOpen(false)}
              componentOptions={componentGlueRegistry}
              onSelect={handleAddComponent}
            />

            <SensorScenarioPanel
              open={isSensorPanelOpen}
              onClose={() => setIsSensorPanelOpen(false)}
              components={sandboxComponents}
              scenario={sensorScenario}
              onChange={setSensorScenario}
            />

            <CloudDashboardPanel components={sandboxComponents} cloudState={cloudState} />

            {(runStage === 'analyzing' || runStage === 'compiling' || runStage === 'booting') && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#222]/90 text-white">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-sm font-medium">{RUN_STAGE_LABELS[runStage]}</p>
                {runStage === 'compiling' && (
                  <div className="w-48 h-1.5 rounded-full bg-white/20 overflow-hidden">
                    <div className="h-full w-1/3 rounded-full bg-white/80 animate-[compile-progress_1.6s_ease-in-out_infinite]" />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex-[1] min-h-[150px] rounded-2xl overflow-hidden">
            <SerialMonitorPanel output={serialOutput} onClear={() => setSerialOutput('')} />
          </div>
        </div>
      </div>
    </div>
  );
};
