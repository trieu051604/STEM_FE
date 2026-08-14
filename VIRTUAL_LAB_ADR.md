# ADR — Kiến trúc Virtual Lab (StemFlow)

**⚠️ Đọc trước (2026-07-24):** Runner mặc định hiện tại là `QemuEsp32Runner` (`SimulationRunner:DefaultMode = "qemu"`), KHÔNG còn `EducationalSimulationRunner` — xem "Cập nhật 2026-07-24" ở mục 5 (Kiến trúc Simulation Runner) bên dưới. Mọi nội dung phía trên đoạn đó nói "Runner MVP: EducationalSimulationRunner" hoặc "FE gọi compile trước khi Run" đã lỗi thời, chỉ giữ lại để xem lịch sử quyết định.

Trạng thái: **Giai đoạn 0 ĐÓNG HOÀN TOÀN** — 2026-07-16, cập nhật lần 2 sau khi verify code thật (`VirtualLabDiagramService.cs`, `VirtualLabRuntimeService.cs`, `VirtualLabMockRunner.cs`, `SimulationCompileService.cs`, `VirtualLabProjectController.cs`, Socket.IO/SignalR setup). Cập nhật lần 3 (2026-07-17): 0.B1 (Docker sandbox cho compile) **hoàn thành và verify bằng 3 test độc hại thật qua endpoint** — xem chi tiết đầy đủ ở [`VIRTUAL_LAB_PLAN.md`](VIRTUAL_LAB_PLAN.md#giai-đoạn-0). Tóm tắt: 6 bug hạ tầng thật được tìm và vá trong quá trình (tmpfs thiếu `exec`, memory limit 512m→1536m, timeout 15s/60s-clamp→90s/120s-clamp, tmpfs bị teardown khi container exit nên phải đổi output sang bind mount, BOM trong `File.WriteAllTextAsync`, và quy trình test an toàn không đụng vào process debug của người dùng). Cả 3 test độc hại (absolute-path include, timeout, large-file-write) đều PASS với bằng chứng thật. Cập nhật lần 4 (2026-07-18): 0.2 (dọn dual-mode), 0.3 (auth+ownership), 0.4/5.3 (vá compile-giả-mạo), 0.5/3.1 (xóa `SimulationController`/`Esp32SimulationsController`/`GetCompileJob`) đều đã xong và verify thật qua endpoint — xem chi tiết ở `VIRTUAL_LAB_PLAN.md`. **Không còn việc gì chặn Giai đoạn 1 nữa.**
Phạm vi: cross-repo, áp dụng cho cả `STEM_BE` và `STEM_FE`.

## ⚠️ Sự cố merge ngày 18/07/2026

Merge `Tuong/schooladmin` vào `Trieu/role_giao_vien` (`9f281ad`) làm route virtual-lab biến mất khỏi Swagger — nguyên nhân: `git stash --include-untracked` chạy trước merge (đúng thao tác, tránh xung đột) nhưng **chưa pop lại**, không phải merge tự resolve sai hay mất code thật. Toàn bộ 0.B1/0.2/0.3 nằm nguyên trong stash, đã pop lại (1 conflict thật ở `VirtualLabProjectService.cs`, chọn giữ bản WIP vì bản kia phụ thuộc `DiagramValidator` đã bị thay bởi `VirtualLabDiagramService`), re-verify bằng test thật (compile Docker sandbox, 401/403), rồi commit local 3 commit (`67fa580`, `7fce551`, `a0ed0b4`, chưa push). Chi tiết đầy đủ ở [`VIRTUAL_LAB_PLAN.md`](VIRTUAL_LAB_PLAN.md). Các quyết định/checkbox bên dưới vẫn giữ nguyên hiệu lực.

## Cập nhật lần 2 (2026-07-16) — Đã verify từng dòng code, phát hiện thêm 2 rủi ro mới

Đã đọc trực tiếp code thật (không chỉ dựa vào audit trước) để xác nhận các claim trong bản cập nhật trước. Tất cả đều đúng, có 2 điểm mới phát hiện thêm chưa từng nằm trong audit nào trước đó:

1. **[MỚI, NGHIÊM TRỌNG] Compile không hề sandbox hóa.** `SimulationCompileService.cs:116-127` gọi thẳng `arduino-cli` như một process trên host, không Docker, không container, không giới hạn CPU/RAM, chỉ có timeout (1-60s) làm lưới an toàn duy nhất. Code C++ tùy ý của học sinh (kể cả build hook từ custom board package) được compile trực tiếp trên máy chủ thật.
   **Quyết định: CHẶN các bước sau cho tới khi Dockerize xong.** Không tiếp tục Giai đoạn 1 trở đi (kể cả các phần đã coi là "xong") cho tới khi compile được bọc trong container có giới hạn tài nguyên.
2. **[MỚI] Không có bất kỳ hạ tầng realtime nào tồn tại.** Grep toàn repo: không `AddSignalR`, không file `*Hub.cs`, không WebSocket setup trong `Program.cs`. Toàn bộ Giai đoạn 4/6 (event `student:lab:*`/`teacher:lab:*` kiểu Socket.IO) là 0% — chưa bắt đầu, và bản chất chưa đúng công nghệ: đây là backend ASP.NET Core, công nghệ realtime bản địa là **SignalR**, không phải Socket.IO (thư viện gắn với hệ sinh thái Node.js, không có server library chính thức cho .NET).
   **Quyết định: Giai đoạn 4 dùng SignalR**, không dùng Socket.IO. FE đổi từ `socket.io-client` sang `@microsoft/signalr`. Tên event/method giữ nguyên ý nghĩa (`student:lab:join`, `teacher:lab:watch-student`...) nhưng triển khai lại dưới dạng SignalR hub method, không phải Socket.IO room/event.
3. `VirtualLabProjectController` có `[AllowAnonymous]` trên **toàn bộ** action (create/get/update/start/stop), comment rõ `// For MVP`.
   **Quyết định: Sửa ngay**, không để dành sau — yêu cầu xác thực + phân quyền trước khi build tiếp lên các endpoint này.
4. Auto-grade tầng compile tin `request.CompileResult.Success` do client tự gửi, không verify lại (đã xác nhận đúng như audit trước mô tả).
   **Quyết định: (a)** BE tự gọi lại `SimulationCompileService` với `sourceCode` trong request submit, không tin `CompileResult` client gửi lên. Chấp nhận tốn thêm 1 lần compile mỗi lần submit để đổi lấy đơn giản/chắc chắn.
5. Sửa nhỏ so với audit trước: `wokwi-resistor` không có wiring rule (chỉ short-circuit vào netlist, không cảnh báo); LCD1602/2004/GND/5V chỉ nhận cảnh báo "structural only in MVP" chứ không có rule riêng; chỉ 4/5 method trong `VirtualLabRuntimeService` chứa trực tiếp nhánh `Guid.TryParse`/`int.TryParse` (`GetDiagramAsync`/`RunEsp32Async` kế thừa qua gọi hàm khác, không tự branch). `PersistRunAsync` còn im lặng bỏ qua (không throw) khi sessionId không parse được, khác với `SaveDiagramAsync` (throw `ArgumentException`) — cần đồng nhất khi dọn dual-mode.
6. `VirtualLabMockRunner.cs` xác nhận: chỉ là regex scanner từng dòng, không có control flow (`if`/`for`/`while`/lặp `loop()`), không state thật, `digitalRead` luôn trả `LOW` cố định. Chỉ mô phỏng được LED/Buzzer qua `digitalWrite`; Button/Servo/DHT/Ultrasonic dù được validate ở tầng diagram nhưng **không có phản ứng mô phỏng nào** ở tầng run. Cần biết rõ giới hạn này trước khi coi Giai đoạn 2 là "gần xong".

## Bối cảnh

Audit route/controller hiện có (BE) + trace lệnh gọi thực tế (FE) cho thấy:
- Chỉ có `Labs` (catalog/progress/stats) và `SimulationCompileController` (`POST /api/simulation/compile`) là được FE gọi thật, end-to-end.
- `VirtualLabs`, `VirtualLabProject`, `Simulation` (templates/sessions/ai-suggest/python), `Esp32Simulations`, `Diagrams`, `VirtualLabSubmissions` có logic thật ở BE nhưng **chưa có FE nào gọi tới**.
- Một loạt file BE đang **uncommitted** (`VirtualLabProjectController`, `DiagramsController`, `Esp32SimulationsController`, `VirtualLabSubmissionsController`, `VirtualLabRuntimeService`, `VirtualLabDiagramService`, `VirtualLabMockRunner`) và đều dùng chung `IVirtualLabRuntimeService` — đây là hướng consolidation đang làm dở.
- `DiagramValidator.cs` bị xóa trong cùng batch uncommitted này — **cần xác nhận/khôi phục lại logic validate tầng 1** trước khi build tiếp Bước 1.3, vì đây là phần bị mất mà chưa rõ đã chuyển đi đâu.
- "2 flow compile" thực chất là 1 flow duy nhất (`SimulationCompileService`, chạy `arduino-cli` đồng bộ trong request); endpoint polling `compile-jobs/{jobId}` là giả — đọc dict in-memory static, job đã xong trước khi client kịp poll, không sống sót qua restart/nhiều instance.

## Quyết định

### 1. Hướng WIP (`VirtualLabProject` + `VirtualLabRuntimeService`)
**Chấp nhận là hướng đích chính thức.** FE sẽ build hướng tới namespace này, không phải `VirtualLabs` hay `Simulation` (session/template cũ).

### 2. Namespace chính thức
- **`Labs`** (`api/labs/*`) giữ nguyên vai trò: catalog bài lab, progress, stats, wokwi-link validation. Không đổi, không trùng với virtual-lab runtime.
- **`virtual-lab/*`** (họ `VirtualLabProject` + `VirtualLabRuntimeService`) là namespace chính thức duy nhất cho **simulation entity + running session** (diagram, run/stop, submission).
- Template CRUD (`starterDiagram`, `starterCode`, `expectedDiagram`, `expectedBehavior` — cần cho Giai đoạn 6) tiếp tục dùng `VirtualLabsController` (`api/VirtualLabs`) vì controller này đã có role-based auth + lesson linkage đúng đắn, trong khi `SimulationController.CreateTemplateAsync` tự đánh dấu `SimulationId = 0 // placeholder`. **Không dùng `SimulationController` cho việc tạo template nữa.**

### 3. Compile flow
**Giữ đồng bộ (sync).** Bỏ endpoint `GET /api/simulation/compile-jobs/{jobId}` (giả async, không có giá trị thật). Canonical: `POST /api/simulation/compile` — khớp với những gì FE đang gọi, không cần đổi FE.

### 4. Phạm vi MVP
**Loại khỏi MVP, để dành Giai đoạn 8:**
- `POST api/simulations/ai/suggest`
- `GET api/simulations/templates/{id}/python`

### 5. Kiến trúc Simulation Runner — FE Wokwi-like + BE Runner-based (Resolver pattern)

**Bổ sung 2026-07-21.** Thay thế dứt điểm mọi hướng "chạy simulation ở đâu" từng cân nhắc trước đó (service Python riêng, interpreter TypeScript chạy client-side). Xác nhận: 2 hướng đó **chưa từng được triển khai trong code hiện tại** — `VirtualLabMockRunner.cs` đã chạy server-side từ đầu, nên không có "quyết định bỏ behavior khỏi AutoScore" nào cần huỷ trong codebase này; tầng `"behavior"` trong `BuildAutoGradeResultAsync` vẫn hoạt động liên tục, không đứt quãng.

Tách 2 mối quan tâm độc lập:
- **FRONTEND** (Wokwi-inspired): workspace/diagram/editor/serial monitor. Không tự chạy compiler/interpreter — bấm Run gửi `sourceCode` + `diagramJson` lên BE qua route đã có sẵn, nhận về `SimulationEvent[]` để replay. Không cần đổi route.
- **BACKEND**: điều phối qua `ISimulationRunner` + `ISimulationRunnerResolver` (mới, chưa tồn tại trong code trước bổ sung này — xác nhận bằng grep toàn `STEM_BE`). `mode` do BE tự xác định — nguồn là cấu hình hệ thống `SimulationRunner:DefaultMode` (`appsettings.json`), **không** nhận từ client: xác nhận `StartSimulationRequest` (`STEM.Application/Dtos/VirtualLab/StartSimulationRequest.cs`) vốn dĩ đã không có field `Mode`, controller tự hardcode `"mock"` khi gọi `RunEsp32Async` — chỉ cần thay hardcode bằng lựa chọn từ resolver, không phải vá lỗ hổng mới phát sinh.

**Route canonical giữ nguyên, không tạo route mới:** `POST /api/virtual-lab/projects/{id}/start` (`VirtualLabProjectController.StartSimulation` → `IVirtualLabRuntimeService.RunEsp32Async`) đã là route duy nhất kể từ Giai đoạn 0/2 — mở rộng `RunEsp32SimulationRequest`/`RunEsp32SimulationResponse` để mang `SimulationRunResult`, không thêm route song song.

**2 lỗ hổng đã xác nhận có thật trong code hiện tại (không phải giả định), cần vá khi triển khai `EducationalSimulationRunner`:**
1. **Đường ghi:** `PersistRunAsync` (`VirtualLabRuntimeService.cs`) hiện luôn set `SimulationEventsJson = "[]"` sau mỗi `/start`, **không ghi** mảng `events` mà runner vừa sinh ra — dữ liệu event thật chỉ tồn tại trong response HTTP và được FE relay từng cái qua `VirtualLabHub.SimulationEvent`. Phải sửa để `/start` tự ghi thẳng toàn bộ mảng event ngay khi runner chạy xong.
2. **Đường đọc:** `BuildAutoGradeResultAsync` tầng `"behavior"` đọc thẳng `request.SimulationEvents` (client tự gửi trong body Submit), chưa đọc từ `VirtualLabProject.SimulationEventsJson` đã lưu server-side. Cùng loại lỗ hổng đã vá cho `CompileResult` ở mục 4 (quyết định compile-giả-mạo) — chưa áp dụng cho `SimulationEvents`.

**Runner MVP (LỊCH SỬ — xem cập nhật 2026-07-24 ngay dưới, đã bị thay thế):** ~~`EducationalSimulationRunner` (diễn giải mã nguồn theo tập lệnh cố định, tái sử dụng `VirtualLabDiagramService` cho diagram/netlist). `VirtualLabMockRunner` giữ làm fallback/legacy, chuyển vào implement chung interface `ISimulationRunner`, không xoá.~~

**Hướng dài hạn (Giai đoạn 8) — LỊCH SỬ, ĐÃ THÀNH HIỆN TẠI:** ~~`Esp32FirmwareRunner`/`QemuEsp32Runner` — compile firmware thật (tái dùng `SimulationCompileService`/Docker sandbox đã có ở Giai đoạn 0.B1/3), chạy qua QEMU — thay thế `EducationalSimulationRunner` mà không đổi gì ở FE, nhờ `ISimulationRunnerResolver`.~~

**Cập nhật 2026-07-24 — QUYẾT ĐỊNH HIỆN TẠI, thay thế "Runner MVP" ở trên:**
1. Runner mặc định hiện tại là `QemuEsp32Runner` (`SimulationRunner:DefaultMode = "qemu"` trong `appsettings.json`) — không còn `EducationalSimulationRunner`.
2. `EducationalSimulationRunner` và `VirtualLabMockRunner` giữ nguyên trong `ISimulationRunnerResolver` (mode `"educational"`/`"mock"`) chỉ làm **fallback/legacy**, không phải hướng chính cho ESP32 nữa.
3. FE `handleRun()` (`LabSandboxPage.tsx`) **không** gọi `POST /api/simulation/compile` trước nữa — chỉ gọi thẳng `POST /api/virtual-lab/projects/{id}/start` với `code` + `diagramJson` hiện tại (xem cập nhật câu trước ở mục FRONTEND phía trên — đoạn "nhận về `SimulationEvent[]` để replay" cũng đã lỗi thời, xem `STREAMING_SIMULATION_PLAN.md`: giờ là stream SignalR realtime, không phải 1 mảng trả về 1 lần).
4. Khi `mode="qemu"`, `/start` tự làm hết trong `QemuEsp32Runner`: validate diagram (`Analyze()`, đồng bộ, nhanh) → compile firmware thật (bất đồng bộ, nền, có cache theo project — xem 8.7 ở `VIRTUAL_LAB_PLAN.md`) → chạy QEMU → stream `SimulationEvent` qua SignalR. `POST /api/simulation/compile` giờ chỉ còn dùng cho "Kiểm tra biên dịch" (nếu FE có nút riêng — hiện chưa có) và cho `BuildCompileCheckAsync` lúc Submit, **không còn nằm trong luồng Run mặc định của FE**.
5. Event mô phỏng luôn sinh từ firmware/QEMU/GPIO/Serial thật (`ets_printf` → parse → map qua `VirtualLabRuntimeDiagramSnapshot`/netlist thành `part-state`), FE (`CircuitCanvas.tsx`) chỉ render lại đúng theo `SimulationEvent` nhận được qua Hub — không hardcode trạng thái LED/Buzzer nào ở FE.

Checklist triển khai chi tiết: xem `VIRTUAL_LAB_PLAN.md` — mục "KIẾN TRÚC RUNNER (Resolver pattern)" và Giai đoạn 8 (8.1/8.2/8.6/8.7).

## Bảng route chính thức (1 route / hành động)

| Hành động | Route canonical | Ghi chú |
|---|---|---|
| Lab catalog/progress | `GET/POST/PUT/DELETE api/labs*` | Giữ nguyên, đã wire đầy đủ |
| Template CRUD (starter/expected diagram+code) | `api/VirtualLabs*` (`VirtualLabsController`) | Chuyển hẳn về đây, bỏ `POST api/simulations/templates` |
| Save + validate diagram (tầng 1) | `PUT/POST api/diagrams/{projectId}` (`DiagramsController`) | Chỉ nhận `VirtualLabProject` Guid, **bỏ chế độ dual-mode nhận `SimulationSession` id** — validate tầng 1 phải trả về trong response này |
| Compile | `POST api/simulation/compile` (`SimulationCompileController`) | Sync, bỏ `compile-jobs/{jobId}` |
| Run | `POST api/virtual-lab/projects/{id}/start` (`VirtualLabProjectController`) | Gọi `IVirtualLabRuntimeService.RunEsp32Async` → `ISimulationRunnerResolver` (xem mục 5). `mode` không nhận từ client, BE tự chọn qua `SimulationRunner:DefaultMode` |
| Stop | `POST api/virtual-lab/projects/{id}/stop` | **Hiện là stub** (trả hardcode, không đổi state thật) — cần làm thật ở Giai đoạn 4 |
| Session model | `VirtualLabProject` entity | Không dùng song song `SimulationSession`/`simulations/sessions` nữa |
| Submit | `POST api/submissions/virtual-lab` (`VirtualLabSubmissionsController`) | FE hiện đang show placeholder "chưa có endpoint" — thực ra đã có, cần wire lại |
| Grading | `api/Grading/submissions/{id}/grade` | Không đổi, không liên quan tới overlap virtual-lab |

## Route/controller bị loại bỏ — ✅ ĐÃ XÓA THẬT ở Bước 0.5 (2026-07-18), verify thật qua endpoint

- `SimulationController` (`api/simulations`) — **đã xóa hẳn file** (`git rm`): template CRUD (`POST api/simulations/templates` — thay bằng `VirtualLabsController`), sessions (thay bằng `VirtualLabProject`), `ai/suggest` (deferred), `templates/{id}/python` (deferred).
- `Esp32SimulationsController` (`api/simulations/esp32`) — **đã xóa hẳn file** (`git rm`): cả `/run` và `/compile` đều là wrapper trùng lặp của logic đã có chỗ chính thức (`VirtualLabProjectController.start`, `SimulationCompileController.compile`).
- `SimulationCompileController.GetCompileJob` (`compile-jobs/{jobId}`) — **đã xóa method** khỏi file, giữ nguyên controller vì `Compile` vẫn cần. Verify thật: `dotnet build` 0 Error, `POST /api/simulation/compile` vẫn compile thành công qua Docker sandbox sau khi xóa.

## Việc cần làm ngay (chặn Giai đoạn 1) — đã verify code thật, cập nhật danh sách

1. ~~Xác nhận `DiagramValidator.cs` (đã bị xoá)~~ **ĐÃ ĐÓNG.** Logic được viết lại và mở rộng trong `VirtualLabDiagramService.Analyze()` (`STEM.Application/UseCases/Simulation/VirtualLabDiagramService.cs`), wire đầy đủ qua `DiagramsController → IVirtualLabRuntimeService`. Không cần viết lại.
2. ~~Dọn dual-mode `sessionId` (Guid `VirtualLabProject` **hoặc** int `SimulationSession`)~~ **ĐÃ XONG (2026-07-17).** DB xác nhận `SimulationSessions`/`ExperimentLogs` = 0 dòng trước khi xóa, không cần migrate. Đã xóa nhánh `int` ở cả 4 method của `VirtualLabRuntimeService.cs`, chỉ còn nhánh `Guid`/`VirtualLabProject`. `PersistRunAsync` giờ throw giống `SaveDiagramAsync` khi sessionId không hợp lệ.
3. ~~[CHẶN, ưu tiên cao nhất] Dockerize `SimulationCompileService`~~ **ĐÃ XONG (2026-07-17).** Chạy trong container `stem-arduino-cli-sandbox:latest` với `--network none`, `--memory 1536m`, `--cpus 1.0`, `--pids-limit 128`, `--cap-drop ALL`, `--read-only`, user non-root. 3 test độc hại (absolute-path include, timeout, large-file-write) PASS thật qua endpoint — chi tiết ở `VIRTUAL_LAB_PLAN.md`.
4. ~~Sửa `[AllowAnonymous]` trên toàn bộ `VirtualLabProjectController`~~ **ĐÃ XONG (2026-07-17).** `[Authorize]` + ownership check thật ở service layer, sửa cùng lúc `DiagramsController` (cùng entity, gap còn nặng hơn). Verify bằng 2 token thật (401 không token, 403 khác chủ sở hữu).
5. ~~Vá lỗ hổng compile-giả-mạo trong `BuildAutoGradeResult`~~ **ĐÃ XONG (2026-07-18).** BE tự gọi lại `SimulationCompileService` với `sourceCode` của submit qua `Board`/`Language` resolve từ `VirtualLabProject.SessionId`, không tin `request.CompileResult` client gửi. Verify bằng 4 test case thật (spoofed-false, spoofed-true, missing session, invalid session).
6. Giai đoạn 4 (realtime): dùng **SignalR**, không dùng Socket.IO — hiện chưa có hạ tầng nào (0%), cần setup từ đầu (`AddSignalR`, `*Hub.cs`, `MapHub`). FE đổi client sang `@microsoft/signalr`. (Chưa bắt đầu.)
7. Wire FE (`LabSandboxPage.tsx`) đổi từ placeholder "Submit" sang gọi thật `POST api/submissions/virtual-lab` — route đã có logic thật (auto-grade 3 tầng), không phải placeholder như FE tưởng. (Chưa bắt đầu.)
8. `backup_CircuitCanvas.tsx` (root FE) xác nhận an toàn xoá — dọn ở Giai đoạn 7 theo kế hoạch, không xoá vội ở đây.
9. ~~Xóa `SimulationController`, `Esp32SimulationsController`, `SimulationCompileController.GetCompileJob`~~ **ĐÃ XONG (2026-07-18)** — xem mục "Route/controller bị loại bỏ" ở trên.
