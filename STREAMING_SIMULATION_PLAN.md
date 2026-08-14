# Streaming Simulation — Kế hoạch chuyển đổi batch-sync sang realtime (SignalR)

Cập nhật 2026-07-23. Trạng thái: **Bước 1–7 đã code + verify** (unit test + E2E thật qua instance BE cô lập). **Chưa verify UI trình duyệt thật** (cần tự test qua UI thật, không có credentials đăng nhập để tự làm qua Browser tool). Phạm vi: chủ yếu `STEM_BE`, có 1 phần `STEM_FE` (Bước 5).

Xem thêm: [`VIRTUAL_LAB_PLAN.md`](VIRTUAL_LAB_PLAN.md) (checklist tổng thể Virtual Lab), [`VIRTUAL_LAB_ADR.md`](VIRTUAL_LAB_ADR.md) (quyết định kiến trúc). File này là ADR + checklist riêng cho phần streaming — file kia không cập nhật lại nội dung này, đọc file này khi làm việc trên luồng chạy simulation/Run/Stop.

## Bối cảnh — vấn đề đang giải quyết

Mô hình cũ: `POST /start` tính **toàn bộ** simulation trong 1 request HTTP đồng bộ (kể cả `delay()` được cộng dồn thành "thời gian ảo", không chờ thật), rồi trả về mảng `SimulationEvent[]` đầy đủ; FE phát lại bằng `setTimeout` theo đúng `Time` của từng event để tạo cảm giác chạy thời gian thực.

**Lỗi bản chất:** code Arduino-like luôn có `loop()`/`while(true)` chạy vô hạn theo thiết kế — không có khái niệm "tự dừng". Mô hình cũ không thể "chạy tới khi logic dừng" vì nó sẽ không bao giờ dừng, không thể chờ hết trong 1 request.

**Giải pháp:** BE chạy nền (background task thật), đẩy từng `SimulationEvent` qua SignalR ngay khi tính ra, tôn trọng nhịp thời gian thật của `delay()` (`Task.Delay` thật). Học sinh xem trực tiếp, tự bấm Stop để hủy `CancellationToken` của lần chạy đang diễn ra.

**Không đổi:** toàn bộ logic Interpreter (`EducationalProgramAnalyzer`/`EducationalEventGenerator` — cách tính "lúc nào LED bật/tắt") giữ nguyên 100%, chỉ đổi cách điều phối việc chạy (đồng bộ → nền + đẩy realtime). `ISimulationRunner`/`ISimulationRunnerResolver` (interface) giữ nguyên chữ ký — chỉ đổi implementation bên trong `EducationalSimulationRunner`.

## Kiến trúc

```
POST /start
  → VirtualLabRuntimeService.RunEsp32Async
    → validate diagram+program (đồng bộ, nhanh)
    → [streaming mode] PrepareStreamingRunAsync: reset SimulationEventsJson="[]", Status="running" — TRƯỚC khi kick off
    → EducationalSimulationRunner.RunAsync
      → validate lại (đồng bộ) → nếu lỗi, trả kết quả đầy đủ ngay (không có gì để chạy nền)
      → tạo CancellationTokenSource riêng (KHÔNG link với cancellationToken của HTTP request)
      → IRunningSimulationRegistry.Register(projectId, cts)
      → Task.Run(ExecuteInBackgroundAsync) — KHÔNG await
      → return ngay { Success:true, Events:[] } ("started" stub)
    → [streaming mode + Success] return response ngay, KHÔNG gọi PersistRunAsync (tránh ghi đè event nền vừa/đang ghi)

ExecuteInBackgroundAsync (chạy trong Task.Run, scope DI riêng):
  → EducationalEventGenerator.GenerateAsync(..., onEventEmitted, cancellationToken)
    → mỗi instruction Delay: await Task.Delay(ms, cancellationToken) THẬT
    → mỗi event tính ra: await onEventEmitted(evt) NGAY (không gộp/batch)
      → ISimulationEventStore.AppendEventAsync (atomic JSONB append vào DB)
      → ISimulationEventBroadcaster.BroadcastEventAsync (SignalR → nhóm "project-{id}")
  → khi xong/lỗi/bị hủy: MarkRunFinishedAsync + BroadcastRunCompletedAsync, Remove khỏi registry

POST /stop
  → StopSimulationAsync: IRunningSimulationRegistry.TryCancel(projectId) — Task.Delay đang chờ ném
    OperationCanceledException, ExecuteInBackgroundAsync dừng sạch tại đó → Status="stopped"

POST /submissions/virtual-lab
  → SubmitVirtualLabAsync: IRunningSimulationRegistry.IsRunning(sessionId) == true → chặn (400),
    vì SimulationEventsJson lúc này chỉ là snapshot dở dang
```

**Layering:** `EducationalSimulationRunner` (STEM.Application, Singleton) không được phép biết `StemDbContext` (Infrastructure) hay `VirtualLabHub` (Api) trực tiếp — 2 interface `ISimulationEventStore`/`ISimulationEventBroadcaster` định nghĩa ở Application, implement ở Infrastructure/Api tương ứng, tránh phụ thuộc ngược.

## Bước 1 — BE: `IRunningSimulationRegistry` — ✅ XONG, verify thật

Theo dõi `CancellationTokenSource` của mỗi lần chạy nền, keyed theo `projectId`.

**File:**
- `STEM.Application/UseCases/Simulation/Abstractions/IRunningSimulationRegistry.cs`
- `STEM.Application/UseCases/Simulation/Runtime/RunningSimulationRegistry.cs`
- `STEM.Application/Extensions/ServiceCollectionExtensions.cs` — đăng ký `AddSingleton<IRunningSimulationRegistry, RunningSimulationRegistry>()`

**Thiết kế đáng chú ý:** `Register()` tự hủy + dispose CTS cũ nếu gọi 2 lần cho cùng `projectId` (tránh "mồ côi" CTS cũ khi Run lần 2 trước khi lần 1 kịp `Remove` — không ai còn giữ tham chiếu để hủy nó qua Stop nữa).

**Verify (`RunningSimulationRegistryTests.cs`, xUnit):**
- `TryCancel_CancelsRegisteredToken` — PASS.
- `TryCancel_ReturnsFalse_WhenNothingRegistered` — PASS.
- `TryCancel_ReturnsFalse_AfterRemove` — PASS.
- `Register_CancelsStaleTokenInstead_OfLeakingIt_WhenCalledTwiceForSameProject` — PASS.
- (Bước 7 bổ sung) `IsRunning_ReturnsTrue_WhileRegistered_FalseAfterRemove` — PASS.

## Bước 2 — BE: Executor dùng `Task.Delay` thật + callback đẩy event — ✅ XONG, verify thật

**File:**
- `STEM.Application/UseCases/Simulation/Abstractions/SimulationEventEmittedCallback.cs` — `public delegate Task SimulationEventEmittedCallback(SimulationEventResponse evt);`
- `STEM.Application/UseCases/Simulation/Runners/Educational/EducationalEventGenerator.cs` — viết lại toàn bộ sang async:
  - `Generate(...)` → `GenerateAsync(..., SimulationEventEmittedCallback onEventEmitted, CancellationToken)`.
  - `AdvanceTime` (cộng dồn `state.Time`) → `AdvanceTimeAsync` (`await Task.Delay(durationMs, cancellationToken)` thật; nếu chạm `MaxDurationMs`, chờ đúng phần thời gian còn lại rồi dừng, không cắt ngang).
  - `Add(...)` (chỉ thêm vào `List<Events>`) → `EmitAsync(...)` (thêm vào list **và** `await onEventEmitted(evt)` ngay).

**Verify (`EducationalEventGeneratorTests.cs`):**
- `GenerateAsync_WaitsRealWallClockTime_BetweenDelayedEvents` — đo bằng `Stopwatch` thật giữa 2 lần gọi callback cách nhau `delay(1000)`: khoảng cách đo được nằm trong `[800, 1400]`ms — PASS, xác nhận không còn tính tức thời như code cũ.
- `GenerateAsync_WhileTrue_StopsAtMaxInstructionCount_NoHang` — PASS, không treo.

**Phát hiện + vá kèm theo (Bước 2, sau này bị Bước 3 làm lại toàn bộ nên không còn tồn tại trong code hiện tại, ghi lại để hiểu tại sao code từng có `TimeoutSafetyMarginMs`):** khi đổi sang `Task.Delay` thật, `timeoutCts.CancelAfter(MaxDurationMs)` (lưới an toàn cũ, thiết kế cho model đồng bộ) đua sát nút với chính đường hoàn tất bình thường (giờ cũng tốn đúng ~`MaxDurationMs` thời gian thực) → false positive "Simulation timed out." Bước 3 xóa hẳn cơ chế `timeoutCts` này vì không còn cần thiết (background task không còn bị ràng buộc bởi thời gian sống của request HTTP).

## Bước 3 — BE: `EducationalSimulationRunner` chạy nền, đẩy qua Hub — ✅ XONG, verify thật (thay đổi lớn nhất)

**File mới:**
- `STEM.Application/UseCases/Simulation/Abstractions/ISimulationEventBroadcaster.cs`
- `STEM.Application/UseCases/Simulation/Abstractions/ISimulationEventStore.cs`
- `STEM.Infrastructure/Services/Simulation/SimulationEventStore.cs` — atomic JSONB append (`"SimulationEventsJson" || @eventBatch`, cùng pattern đã có từ Giai đoạn 4).
- `STEM.Api/Hubs/SignalRSimulationEventBroadcaster.cs` — wrap `IHubContext<VirtualLabHub>`, gửi `StudentSimulationEvent`/`StudentRunCompleted` tới nhóm `project-{id}` (tự tính lại `ProjectGroup`/`NormalizeProjectId` — **phải khớp chính xác** với `VirtualLabHub.ProjectGroup`, 2 nơi định nghĩa độc lập vì khác project/layer).

**File sửa:**
- `STEM.Application/UseCases/Simulation/Runners/Educational/EducationalSimulationRunner.cs` — viết lại toàn bộ. `RunAsync`: validate đồng bộ → nếu lỗi trả ngay (như cũ) → nếu hợp lệ: tạo CTS độc lập, `Register` vào registry, `Task.Run(ExecuteInBackgroundAsync)` không await, trả `{Success:true, Events:[]}` ngay. `ExecuteInBackgroundAsync`: tạo `IServiceScopeFactory.CreateScope()` riêng (StemDbContext của request HTTP đã kết thúc từ lâu, không tái dùng được), chạy `GenerateAsync` với callback ghi DB + broadcast, `finally` luôn `Remove` khỏi registry rồi `MarkRunFinishedAsync`/`BroadcastRunCompletedAsync`.
- `STEM.Infrastructure/Services/VirtualLabRuntimeService.cs` — `RunEsp32Async` thêm nhánh `isStreamingMode` (mode == "educational"): gọi `PrepareStreamingRunAsync` (reset events+status) **trước** `runner.RunAsync`, và **không gọi `PersistRunAsync`** nếu kick-off thành công (tránh ghi đè `Events:[]` của response "started" lên events mà background task đang/đã ghi — nhánh Mock runner giữ nguyên hành vi cũ 100%).
- DI: `STEM.Infrastructure/Extensions/ServiceCollectionExtensions.cs` (`ISimulationEventStore`, Scoped), `STEM.Api/Program.cs` (`ISimulationEventBroadcaster`, Singleton).

**Verify unit test** (`SimulationRunnerResolverTests.cs`, viết lại 3 test cũ theo contract mới — `RunAsync` giờ trả nhanh, verify qua `FakeSimulationEventStore`/`FakeSimulationEventBroadcaster` + chờ tín hiệu hoàn tất):
- `EducationalRunner_GeneratesLedOnOffEvents_ForBlinkProgram` — PASS, xác nhận `RunAsync` trả về trong <1s.
- `EducationalRunner_ForLoopBare_ProducesSixAlternatingEvents` — PASS.
- `EducationalRunner_ForLoopWithTrailingStatement_ProducesCorrectSequence` — **FAIL** (đã biết trước, không liên quan streaming — gap for/while parsing trong `EducationalProgramAnalyzer`, xem mục "Backlog/gap đã biết" bên dưới).
- `EducationalRunner_TryCancelMidRun_StopsCleanly_NoMoreEventsAfterCancel` (mới) — PASS: chạy `Blink` 60s, đợi 2.5s thật, `TryCancel`, xác nhận không còn event nào tới sau đó.

**Verify E2E thật** (instance BE cô lập port 58080, JWT thật mint cho user 11, Lab[132213] project `f4122996-a6f1-5c8b-9cda-298f910a3aee`):
- `POST /start` trả `HTTP 200`, `events:[]`, **2.17s** (lần đầu — JIT/kết nối Supabase pooler nguội) rồi **0.207s** (lần sau) — so với model cũ (chờ hết `MaxDurationMs`, 5-60s) là cải thiện thật, dù không phải tức thời tuyệt đối (độ trễ còn lại là round-trip DB tới Supabase, không phải do chờ interpreter).

## Bước 4 — BE: `POST /stop` hủy thật qua registry — ✅ XONG, verify thật qua DB trực tiếp

**File sửa:** `STEM.Infrastructure/Services/VirtualLabRuntimeService.cs` — `StopSimulationAsync` thêm `_runningSimulationRegistry.TryCancel(projectId.ToString("N"))` trước khi set `Status="stopped"` (constructor thêm dependency `IRunningSimulationRegistry`).

**Verify E2E thật (quan trọng — số liệu thật từ DB, không suy đoán):**
```
[t=0s]      Status=running EventCount=12
[t=2s]      Status=running EventCount=18   <- tăng thật theo thời gian thực (Blink 500ms)
[STOP] HTTP 200 {"status":"stopped",...}
[t=stop+0s] Status=stopped EventCount=18
[t=stop+3s] Status=stopped EventCount=18   <- KHÔNG tăng thêm, UpdatedAt gần như không đổi
```
Xác nhận: event thật sự ngừng sinh ra sau Stop, không phải chỉ đổi label UI.

## Bước 5 — FE: lắng nghe realtime thay vì chờ+replay — ✅ XONG (code), `tsc` sạch — ⏳ CHƯA verify qua trình duyệt thật

**File sửa:**
- `src/services/virtualLabHub.ts` — thêm `'StudentRunCompleted'` vào `eventsToProxy` (danh sách event pre-registered với SignalR connection lúc `connect()`, đảm bảo hoạt động đúng kể cả khi `.on()` được gọi trước khi kết nối xong).
- `src/pages/dashboard/LabSandboxPage.tsx`:
  - `useEffect` mới: đăng ký `virtualLabHub.on('StudentSimulationEvent', ...)` gọi thẳng `applySimulationEvent` (không qua `setTimeout`), và `virtualLabHub.on('StudentRunCompleted', ...)` set `isRunning(false)`.
  - `applySimulationEvent`: **xóa** lệnh `virtualLabHub.simulationEvent(projectId, event)` (relay cũ) — BE giờ tự ghi DB + broadcast, relay lại sẽ tạo **vòng lặp vô hạn** (nhận event từ Hub → relay lại qua Hub method → Hub broadcast lại → nhận lại...). Đổi sang tích lũy `setLastSimulationEvents((prev) => [...prev, event])` (dùng cho Submit).
  - `handleRun`: không còn gọi `replaySimulationEvents(runResult.events)` (giờ luôn rỗng với mode streaming) — chỉ reset state rồi `setIsRunning(true)`, event thật đến qua Hub listener ở trên.
  - `handleStop`: đổi từ chỉ xóa timer local (`clearReplayTimers` — trước đây KHÔNG hề gọi BE) sang gọi thật `virtualLabProjectsApi.stop(projectId)`.
  - `replaySimulationEvents`/`clearReplayTimers`/`replayTimersRef` **giữ nguyên, không xóa** — không còn được gọi từ luồng live nữa nhưng để dành cho tính năng "xem lại lịch sử" (chưa có) sau này.

**Phát hiện + vá race condition trong lúc code (không phải yêu cầu gốc, tự phát hiện):** `virtualLabHub.runStarted(projectId)` (gọi Hub method `RunStarted` → `MarkRunStartedAsync`, reset `SimulationEventsJson="[]"`) trước đây là **fire-and-forget** (`.catch(() => {})`, không `await`). Nếu nó resolve **sau** khi `/start` đã kick off background task và background task đã kịp ghi vài event đầu — reset này sẽ xóa mất chúng. Đã sửa: thêm `await` trước lệnh gọi, đảm bảo reset (nếu có tác dụng gì) luôn hoàn tất trước khi `/start` được gọi. (Reset này giờ dư thừa với `PrepareStreamingRunAsync` ở Bước 3 — 2 lần reset liên tiếp vô hại nhưng lãng phí nhẹ, xem mục backlog.)

**Verify:** `npx tsc --noEmit -p .` → exit code 0, không lỗi. **Chưa** verify qua UI thật (bấm Run → LED nháy đúng nhịp trên canvas, bấm Stop → dừng ngay) — cần credentials đăng nhập thật, không tự làm được qua Browser tool. **→ Bạn cần tự test bước này.**

## Bước 6 — Cấu hình lại `MaxDurationMs`/`MaxConcurrentRuns` — ✅ XONG (config), verify bằng lý luận không phải load test thật

**File sửa:** `STEM.Api/appsettings.json` — `SimulationRunner.MaxDurationMs`: `5000` → `600000` (10 phút, lưới an toàn cuối — không còn là giới hạn chính, Stop thật + học sinh tự kiểm soát mới là cơ chế chính). `MaxConcurrentRuns` giữ nguyên `10` — **không giảm**, vì `Task.Delay` không chiếm CPU/thread trong lúc chờ (threadpool timer, không `Thread.Sleep`/blocking).

**Chưa làm:** test tải thật (nhiều request `delay()` dài đồng thời, đo CPU server) — độ tin cậy của "CPU không tăng" dựa trên hành vi đã được document rõ của `Task.Delay`/`await` trong .NET (không phải logic tự viết có rủi ro), không phải bằng chứng đo đạc trực tiếp trong phiên này.

## Bước 7 — Chặn Submit khi đang chạy dở — ✅ XONG, verify thật (đã hỏi + chờ xác nhận trước khi code, đúng quy trình)

**Quyết định đã hỏi và chốt:** chặn Submit khi simulation đang chạy nền, yêu cầu Stop trước — đúng đề xuất ADR gốc.

**Phát hiện quan trọng trước khi code (khiến cách làm khác giả định ban đầu):** không thể dùng `VirtualLabProject.Status == "running"` để chặn — giá trị này **vừa** có nghĩa "đang chạy nền thật" **vừa** có nghĩa "lần chạy trước đã hoàn tất không lỗi" (`VirtualLabProjectStatuses` chỉ có `Running`/`Stopped`/`Error`, không có `Completed` riêng — xem `ExecuteInBackgroundAsync`: `finalStatus = result.Success ? Running : Error`). Dùng DB Status sẽ chặn nhầm Submit **vĩnh viễn** sau mọi lần Run thành công. Đã dùng `IRunningSimulationRegistry` (nguồn sự thật chính xác cho "có đang thực sự chạy hay không") thay vì DB Status.

**File sửa:**
- `IRunningSimulationRegistry`/`RunningSimulationRegistry` — thêm `bool IsRunning(string projectId)` (kiểm tra không phá hủy trạng thái, khác `TryCancel` có side-effect hủy).
- `VirtualLabRuntimeService.SubmitVirtualLabAsync` — thêm check `_runningSimulationRegistry.IsRunning(request.SessionId)` → `throw new InvalidOperationException("Mô phỏng đang chạy — vui lòng bấm Dừng trước khi nộp bài.")`.

**Verify:** unit test `IsRunning_ReturnsTrue_WhileRegistered_FalseAfterRemove` PASS. Xác nhận `VirtualLabSubmissionsController` đã có sẵn `catch (InvalidOperationException) → BadRequest` (cùng pattern với check `AllowResubmit`/`ResubmitLimit` đã có) — map đúng 400, không phải 500.

## Kết quả build/test tổng thể

- `dotnet build STEM.Api.csproj` (toàn solution) — **0 Error**, 10 warning cũ không liên quan.
- `dotnet test` (toàn bộ `STEM.Application.Tests`) — **11/12 pass**. 1 fail là `EducationalRunner_ForLoopWithTrailingStatement_ProducesCorrectSequence` (gap for/while, xem bên dưới — không phải regression của streaming).
- FE: `npx tsc --noEmit -p .` — **0 lỗi**.

## Backlog / gap đã biết (chưa xử lý, ghi lại để không quên)

1. **`for`/`while`/`if` chưa được parse trong `EducationalProgramAnalyzer`** — phát hiện độc lập với streaming (trong lúc điều tra bug "lệch nhịp Blink LED 30 vòng" trước khi bắt đầu kế hoạch streaming này). `ParseInstructions` chỉ cắt theo `;` rồi regex-match từng mảnh — không hiểu `for(...)`/`while(...)`, thân vòng lặp chỉ được trích ra **đúng 1 lần** thay vì lặp lại đúng số vòng. Đã thảo luận phạm vi sửa (tối thiểu/trung bình/đầy đủ) nhưng **chưa chốt** — bạn nói "cần suy nghĩ thêm". Test `EducationalRunner_ForLoopWithTrailingStatement_ProducesCorrectSequence` cố tình giữ lại ở trạng thái FAIL làm bằng chứng gap này còn tồn tại, không phải bug mới.
2. **`VirtualLabProjectStatuses` thiếu trạng thái "Completed" riêng** (chỉ có `Running`/`Stopped`/`Error`) — gây ra quyết định thiết kế ở Bước 7 (dùng registry thay vì DB Status). Nên cân nhắc thêm trạng thái `Completed` cho rõ nghĩa, nhưng chưa cấp thiết vì registry đã giải quyết đúng vấn đề thực tế (chặn Submit).
3. **`virtualLabHub.runStarted()` (FE) giờ dư thừa với `PrepareStreamingRunAsync` (BE)** — cả 2 đều reset `SimulationEventsJson="[]"`/`Status="running"`, chỉ 1 trong 2 là đủ. Không sai (đã vá race bằng `await`), chỉ lãng phí nhẹ 1 lần gọi Hub + 1 lần ghi DB không cần thiết mỗi lần Run. Có thể dọn sau: bỏ hẳn lệnh gọi `runStarted` ở FE (giữ lại phần notify `StudentRunStarted` cho giáo viên xem live thì cần tách riêng khỏi `MarkRunStartedAsync`).
4. **Bước 6 (MaxConcurrentRuns không cần giảm) mới verify bằng lý luận, chưa test tải thật.**
5. **Bước 5 chưa verify qua trình duyệt thật** — cần bạn tự test: Run → LED nháy đúng nhịp trên canvas → Stop giữa chừng → LED dừng ngay → Submit lúc đang chạy → bị chặn đúng message.
6. **Đã đóng backlog cũ (R.3/R.6) của `VIRTUAL_LAB_PLAN.md` mục "KIẾN TRÚC RUNNER":** R.3 ("`PersistRunAsync` không ghi events thật") và R.6 ("tự broadcast qua Hub thay vì chờ FE relay") — cả 2 coi như đã giải quyết cho mode streaming qua kiến trúc Bước 3 (background task tự ghi qua `ISimulationEventStore`, tự broadcast qua `ISimulationEventBroadcaster`, không cần `PersistRunAsync`/FE relay nữa cho luồng này). Chưa cập nhật lại checkbox R.3/R.6 trong `VIRTUAL_LAB_PLAN.md` — nên làm khi quay lại file đó.
