import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, RefreshCw, Send, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { labsApi, virtualLabProjectsApi, diagramsApi, submissionsApi } from '@/services/dashboardApi';
import { virtualLabHub } from '@/services/virtualLabHub';
import type { LabCircuitComponent, LabEntity, DiagramValidationResult, SimulationEventEntity, AutoGradeResultEntity } from '@/services/dashboardApi';
import { CodeEditorPanel } from '@/components/Dashboard/VirtualLab/Sandbox/CodeEditorPanel';
import { CircuitCanvas, type PartVisualState } from '@/components/Dashboard/VirtualLab/Sandbox/CircuitCanvas';
import { SerialMonitorPanel } from '@/components/Dashboard/VirtualLab/Sandbox/SerialMonitorPanel';
import { getSandboxProjectId } from '@/components/Dashboard/VirtualLab/Sandbox/projectId';

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
  const [guidance, setGuidance] = useState<{ message: string, teacherName?: string, timestamp: number } | null>(null);
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
                labId: labResponse.id,
              });
              setDiagramValidation(created.validation);
            } catch (createError) {
              console.error('[LabSandboxPage] Failed to create initial VirtualLabProject', createError);
            }
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
        virtualLabHub.joinSession(pid).catch(e => console.error('[LabSandboxPage] SignalR join failed', e));
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

      // Event mô phỏng đầu tiên tới = tín hiệu chuyển sang canvas thật, bất
      // kể mode (educational nhảy thẳng từ "analyzing", qemu đi qua đủ
      // "compiling"→"booting" trước khi tới đây).
      setRunStage('running');
      applySimulationEvent(evt);
    };
    const onRunCompleted = (_projectId: string, _status: string, _reason?: string) => {
      setIsRunning(false);
      setRunStage('idle');
      // BUG THẬT vừa vá: mô phỏng dừng (tự nhiên hết MaxDurationMs, hay lỗi)
      // nhưng LED/Buzzer vẫn "đóng băng" ở trạng thái sáng/kêu cuối cùng —
      // vì không có gì reset partStates khi run kết thúc (chỉ handleRun() lúc
      // BẮT ĐẦU chạy mới mới clear). Mạch đã ngừng chạy thì output phải về
      // trạng thái tắt, giống hành vi thật (ngắt điện thì LED tắt).
      isStoppedRef.current = true;
      setPartStates({});
    };
    const onCompileStarted = (_projectId: string) => {
      setRunStage('compiling');
    };
    const onCompileFinished = (_projectId: string, success: boolean, errorSummary?: string) => {
      // Nếu compile thất bại, StudentRunCompleted (status=error) cũng sẽ tới
      // ngay sau đó và tự set isRunning/runStage về idle — ở đây chỉ cần hiện
      // lỗi sớm hơn 1 nhịp cho học sinh thấy ngay, không phải chờ vòng dọn
      // dẹp cuối của background task.
      if (!success) {
        setCompileError(errorSummary || 'Biên dịch thất bại.');
      }
    };
    const onRunBooting = (_projectId: string) => {
      setRunStage('booting');
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
          if (projectId) {
            virtualLabHub.diagramUpdated(projectId, JSON.stringify({ parts: sandboxComponents, connections: sandboxConnections })).catch(() => {});
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
  }, [projectId, sandboxComponents, sandboxConnections, code]);

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
    // Mở lại cổng nhận event — phải đặt SAU setPartStates({}) ở trên, TRƯỚC
    // khi có event nào của lần chạy MỚI này có thể tới (xem isStoppedRef).
    isStoppedRef.current = false;
    // Set ngay lúc bấm, không chờ tín hiệu BE — Analyze() rất nhanh (đo thật
    // ~ms), không cần round-trip riêng cho giai đoạn này.
    setRunStage('analyzing');

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
      setSerialOutput('');

      const runResult = await virtualLabProjectsApi.start(projectId, {
        code,
        diagram: { parts: sandboxComponents, connections: sandboxConnections },
      });

      if (runResult.status === 'error') {
        isStoppedRef.current = true;
        setCompileError(
          runResult.validation.errors.length
            ? runResult.validation.errors.join('\n')
            : 'Mạch không hợp lệ, không thể chạy mô phỏng.'
        );
        setRunStage('idle');
        return;
      }

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
      setCompileError(getErrorMessage(error, 'Không gọi được API chạy mô phỏng.'));
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

    if (!projectId) return;
    try {
      await virtualLabProjectsApi.stop(projectId);
      if (projectId) {
        virtualLabHub.stopped(projectId).catch(() => {});
      }
    } catch (error) {
      console.error('[LabSandboxPage] Failed to stop simulation', error);
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
        circuitConfig: { parts: sandboxComponents, connections: sandboxConnections },
        sourceCode: code,
        simulationEvents: lastSimulationEvents,
      });

      setAutoCheck(result.autoCheck);
      setSubmitMessage(
        `Đã nộp bài — đạt ${result.autoCheck.passedChecks}/${result.autoCheck.totalChecks} tiêu chí` +
          (result.autoScore != null ? `, điểm tự động: ${result.autoScore}.` : '.')
      );
      if (projectId) {
        virtualLabHub.submitted(projectId, result.submissionId || 0).catch(() => {});
      }
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
    <div className="flex flex-col h-[calc(100vh-2rem)] space-y-4 relative">
      {guidance && (
        <div className="absolute top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-[#0f4c5c] text-white p-4 rounded-xl shadow-lg border border-[#0a3540] max-w-sm flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 shrink-0 text-cyan-400 mt-0.5" />
            <div>
              <p className="text-xs text-cyan-400 font-bold uppercase mb-1">
                Giáo viên {guidance.teacherName || ''} nhắc nhở
              </p>
              <p className="text-sm font-medium">{guidance.message}</p>
            </div>
            <button onClick={() => setGuidance(null)} className="text-slate-400 hover:text-white shrink-0">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
