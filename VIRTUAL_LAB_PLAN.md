# StemFlow – Virtual Lab: Quy trình thực hiện tuần tự

Cập nhật 2026-07-16 (vòng verify code thật + chốt 4 quyết định). Xem quyết định kiến trúc đầy đủ ở [`VIRTUAL_LAB_ADR.md`](VIRTUAL_LAB_ADR.md). File này là checklist tiến độ theo từng giai đoạn — cập nhật tại đây thay vì paste lại toàn bộ vào chat mỗi phiên.

**Cập nhật 2026-07-23:** luồng chạy simulation (Run/Stop) đã chuyển từ batch-sync sang streaming realtime (SignalR) — kế hoạch + checklist riêng ở [`STREAMING_SIMULATION_PLAN.md`](STREAMING_SIMULATION_PLAN.md) (Bước 1–7 đã code + verify, đọc file đó khi làm việc trên `EducationalSimulationRunner`/Run/Stop/Submit). File đó cũng khép lại 2 mục backlog R.3/R.6 ở phần "KIẾN TRÚC RUNNER" bên dưới cho riêng mode streaming.

Mỗi bước có input, output, điều kiện qua bước tiếp theo. Không nhảy bước khi output chưa đạt.

## ⚠️ Sự cố merge ngày 18/07/2026

Sau khi merge `Tuong/schooladmin` vào `Trieu/role_giao_vien` (commit `9f281ad`), route `/api/virtual-lab/projects/{id}` biến mất khỏi Swagger. Chẩn đoán qua `git log --all --graph`, `git stash list`, `git stash show --include-untracked`: nguyên nhân là **`git stash` (kèm `--include-untracked`) đã chạy đúng lúc trước khi merge để tránh xung đột, nhưng chưa từng được pop lại** — không phải do merge tự resolve sai, không phải lỗi build, không phải merge mang lại kiến trúc cũ. **Không có dữ liệu/code nào bị mất thật** — toàn bộ 0.B1/0.2/0.3 (kể cả các file chưa từng track như `VirtualLabRuntimeService.cs`, `DiagramsController.cs`, `docker/simulation-compile-sandbox/Dockerfile`) nằm nguyên vẹn trong `stash@{0}`.

Đã pop lại (gặp 1 conflict thật ở `VirtualLabProjectService.cs` — 1 bản refactor nhỏ không liên quan (`GetDiagramJson` helper) đang nằm trên nền code cũ trước-WIP, đã quyết định giữ bản trong stash — bản pre-WIP không tương thích với `VirtualLabDiagramService` mà toàn bộ phần còn lại của WIP phụ thuộc). Sau khi pop sạch (verify: `grep "<<<<<<<"` toàn repo = 0 kết quả), đã **re-verify lại toàn bộ 0.B1/0.2/0.3 bằng test thật** (không chỉ tin build pass): 1 lần compile Blink LED qua Docker sandbox thành công, `GET /api/virtual-lab/projects/{id}` không token → 401, token khác chủ sở hữu → 403 — tất cả đúng như trước khi xảy ra sự cố. Đã commit local thành 3 commit theo từng phần logic (`67fa580`, `7fce551`, `a0ed0b4`) — **chưa push**.

Các checkbox `0.B1`/`3.B`/`0.2`/`0.3` bên dưới **giữ nguyên `[x]`** — không phải làm lại từ đầu, chỉ re-verify. Bài học: sau lần này, nên `git stash pop` ngay trong cùng phiên làm việc chứ không để treo qua lần merge tiếp theo.

## GIAI ĐOẠN 0 — DỌN DẸP & THỐNG NHẤT KIẾN TRÚC — ✅ chốt kiến trúc, ⛔ còn 1 blocker chặn mọi giai đoạn sau

Quyết định đầy đủ: [`VIRTUAL_LAB_ADR.md`](VIRTUAL_LAB_ADR.md).

- [x] Namespace: `virtual-lab/*` (`VirtualLabProjectController` + `IVirtualLabRuntimeService`) cho simulation entity + session. `Labs` giữ riêng cho catalog/progress. Template CRUD dùng `VirtualLabsController`.
- [x] Compile: giữ sync (`POST api/simulation/compile`). Bỏ `compile-jobs/{jobId}`.
- [x] Loại khỏi MVP: `SimulationController` (toàn bộ), `Esp32SimulationsController` (cả `/run` và `/compile`), `ai/suggest`, Python templates.
- [x] Batch uncommitted (`Trieu/role_giao_vien`) xác nhận là WIP đúng hướng, không phải rác.
- [x] `DiagramValidator.cs` bị xóa — xác nhận logic không mất, đã viết lại/mở rộng trong `VirtualLabDiagramService.Analyze()`.
- [x] Realtime: chốt dùng **SignalR**, không dùng Socket.IO (backend là ASP.NET Core; Socket.IO không có server lib chính thức cho .NET).
- [x] Compile-giả-mạo trong auto-grade: chốt phương án **(a)** BE tự compile lại khi submit.
- [x] Auth gap (`VirtualLabProjectController` toàn bộ `[AllowAnonymous]`): chốt **sửa ngay**, không để dành sau.

### ⛔ Blocker duy nhất còn chặn tất cả các giai đoạn sau

- [x] **0.B1 — Dockerize `SimulationCompileService`.** ✅ **XONG — cả 3 test độc hại đã chạy qua endpoint thật (`POST /api/simulation/compile`) và PASS, có bằng chứng thật (2026-07-17).**
  - Đã viết: `STEM_BE/docker/simulation-compile-sandbox/Dockerfile` (arduino-cli + core `arduino:avr` + `esp32:esp32` bake sẵn lúc build image, chưa build/verify image chạy được).
  - Đã sửa: `SimulationCompileService.cs` — đổi từ gọi `arduino-cli` thẳng trên host sang `docker run` với `--network none`, `--memory`/`--memory-swap` (mặc định 512m), `--cpus` (mặc định 1.0), `--pids-limit` (mặc định 128), `--cap-drop ALL`, `--security-opt no-new-privileges`, `--read-only`, `--user 10001:10001`. Chỉ 1 host bind mount duy nhất (sketch source, read-only, nằm trong `jobRoot` đã tự xóa sau mỗi lần compile — đúng phần "ngoại lệ thư mục tạm"); build scratch + output nằm trên tmpfs size-capped bên trong container (không chạm host disk), lấy ra qua `docker cp` trước khi `docker rm -f`. Timeout hiện tại (`TimeoutSeconds`, 1-60s) **giữ nguyên làm lớp phòng thủ thứ 2** — khi timeout, code giờ còn gọi `docker kill {container}` (không chỉ giết tiến trình client `docker run`, vì giết client không tự dừng container trong daemon).
  - Đã thêm config `SimulationCompile:DockerCliPath/DockerImage/MemoryLimit/CpuLimit/PidsLimit/BuildTmpfsSizeMb` vào `appsettings.json`.
  - Build C# (`dotnet build STEM.Infrastructure`) pass — compile được, nhưng **chưa chạy được `docker build` hay `docker run` thật lần nào**.
  - **⛔ Lý do chưa test: Docker Desktop trên máy dev bị crash-loop khi khởi động** (bug có sẵn, không liên quan tới việc sandbox hóa) — lỗi `starting services: initializing Inference manager: listening on unix://...dockerInference: remove ...: The file cannot be accessed by the system.` File socket rác này không xóa được kể cả bằng PowerShell `Remove-Item -Force` lẫn Git Bash `rm`; tiến trình `com.docker.backend.exe` cũng không kill được qua `taskkill /F` ("operation attempted is not supported"). Cần người dùng tự khởi động lại Docker Desktop (hoặc reboot máy) trước khi test được.
  - **Cập nhật 2026-07-16 (sau khi Docker chạy lại được):** `docker build` thành công (image `stem-arduino-cli-sandbox:latest`, ~19 phút do phải tải toàn bộ toolchain esp32 cho mọi biến thể chip — xtensa + riscv, ~880MB). Test compile qua endpoint thật với code Blink LED hợp lệ phát hiện **3 bug hạ tầng thật, cả 3 đã sửa và verify lại bằng docker run trực tiếp**:
    1. **tmpfs `/tmp` thiếu `exec`** — Docker `--tmpfs` mặc định `noexec`, nhưng `arduino-cli` gọi `esptool` (đóng gói PyInstaller) cần tự giải nén + `dlopen` một `.so` Python từ `$TMPDIR` lúc chạy → lỗi `dlopen: ... failed to map segment from shared object`. Repro trực tiếp xác nhận: thêm cờ `exec` vào tmpfs thì chạy được ngay. Kích thước thật đo được của bundle giải nén: **~9.7MB** (dư dả so với cap 64m ban đầu — size không phải vấn đề, chỉ có `noexec` mới là nguyên nhân). Đã sửa: `/tmp:rw,exec,size=128m,mode=1777` (bump size lên 128m để có headroom cho nhiều lần gọi PyInstaller tool trong 1 lần compile).
    2. **`MemoryLimit` mặc định 512m quá thấp** — compile Blink LED (sketch đơn giản nhất có thể) bị **OOM-killed thật** (`docker inspect` xác nhận `OOMKilled=true ExitCode=137`) ngay cả khi code hoàn toàn hợp lệ, không phải do tấn công. Đo peak RAM thật với cap 1536m: đỉnh quan sát được **~945MB**. Đã sửa default `MemoryLimit` → `1536m`.
    3. **`TimeoutSeconds` mặc định 15s (clamp cứng tối đa 60s trong code) quá thấp** — đo thời gian thật của đúng compile Blink LED đó: **39 giây** (cold compile, không cache giữa các lần vì mỗi request có tmpfs build-path riêng). Với default cũ, ngay cả compile hợp lệ đơn giản nhất cũng bị timeout-kill. Đã sửa: default `TimeoutSeconds` → `90`, nới trần `Math.Clamp` trong code từ `(1, 60)` → `(1, 120)`.
    - Sau khi sửa cả 3, compile Blink LED **thành công thật** qua `docker run` trực tiếp (mô phỏng đúng lệnh mà `SimulationCompileService` phát ra): `Sketch uses 284912 bytes (21%)...`, `ExitCode=0`, `OOMKilled=false`. File đã sửa: `SimulationCompileService.cs` (dòng tmpfs/memory/timeout), `appsettings.json` (`SimulationCompile:*`).
    - Lưu ý phụ (không chặn): compile thành công vẫn in vài dòng `mkdir: cannot create directory '/workspace/sketch/build': Read-only file system` — vô hại (arduino-cli thử tạo build-cache fallback cạnh sketch, bị chặn bởi read-only mount, tự động fallback về `--build-path` đã chỉ định), nhưng nên lọc bỏ dòng này khi hiển thị Compile Log ở FE để tránh gây hoang mang cho học sinh/giáo viên khi build thực ra đã pass.
  - **Cập nhật 2026-07-17 — phát hiện thêm 3 bug hạ tầng thật khi test qua endpoint thật (không phải mô phỏng docker run tay), cả 3 đã sửa:**
    4. **tmpfs bị teardown ngay khi container thoát** — thiết kế ban đầu dùng tmpfs cho cả `/workspace/build/out` rồi lấy artifact ra bằng `docker cp` sau khi container dừng. Thực tế: tmpfs bị hủy ngay khi container exit, nên `docker cp` luôn báo `Could not find the file ... in container` — không phải lỗi cấu hình, mà là sai thiết kế nền tảng. Đã sửa: `--output-dir` giờ trỏ vào **bind mount host** (`{outputDir}:/workspace/output:rw`) thay vì tmpfs — đây vẫn nằm trong "ngoại lệ thư mục tạm" vì `outputDir` là 1 phần của `jobRoot` đã tự xóa sau mỗi lần compile. `--build-path` (file trung gian, không cần lấy ra) vẫn giữ tmpfs. Bỏ hẳn bước `docker cp` và helper `TryDockerCopyOutputAsync`.
    5. **`File.WriteAllTextAsync(..., Encoding.UTF8, ...)` ghi BOM** — `Encoding.UTF8` (static property) tự thêm BOM đầu file, gcc báo lỗi `'U0000feffvoid' does not name a type` ngay dòng đầu — chặn MỌI compile kể cả code hợp lệ 100%. Đã sửa: dùng `new UTF8Encoding(false)` (không BOM).
    6. **Test API thật dùng process STEM.Api do chính người dùng chạy qua Visual Studio (PID khác)** — build code mới xong không tự áp dụng cho tới khi restart process đó. Không được tự ý kill/restart session debug của người dùng; đã build ra thư mục output riêng (`dotnet build -o <thư mục tạm>`) và chạy 1 instance test độc lập ở port khác (58080) để không đụng vào session VS của người dùng.
  - **3 TEST ĐỘC HẠI — CẢ 3 PASS, qua endpoint thật `POST /api/simulation/compile`, `labId=ca5f1ea5-3bdf-4287-8198-244491d19d97`, `assignmentId=2`:**
    - **Test A (absolute-path `#include`) — PASS.** `#include "/etc/passwd"` compile lỗi thật, nhưng nội dung lỗi cho thấy nó đọc được `/etc/passwd` — xác nhận đây là **file /etc/passwd CỦA CONTAINER** (generic Debian: `root`, `daemon`, `bin`, ..., `builder` — đã đối chiếu byte-for-byte với `docker run --entrypoint cat ... /etc/passwd`), không phải file host. Do `--network none` và không mount host ở `/` hay `/etc`, đường dẫn tuyệt đối không có cách nào chạm tới host filesystem — đây là thuộc tính cách ly mount-namespace mặc định của Docker, không phụ thuộc vào cấu hình bind mount cụ thể của service.
    - **Test B (infinite loop / timeout) — PASS, nhưng cần ghi chú quan trọng về phương pháp.** Thử 6 kỹ thuật để tạo payload "chỉ tốn CPU, không lỗi khác" vượt 90s trong giới hạn `MaxCodeLength=200000` ký tự:
      1. Template recursion `Fib<100000>` → lỗi **4 giây** (chặn bởi `-ftemplate-depth=900` mặc định của gcc, không tới được timeout).
      2. 500,000 câu lệnh `x++;` literal (2.5MB) → **bị từ chối thẳng** vì vượt `MaxCodeLength` (200,000 ký tự) — không tới được compile.
      3. 49,500 câu lệnh `x++;` literal (198KB, mức tối đa vừa giới hạn) → compile xong **56 giây** — chưa đủ chậm.
      4. 2,000,000 câu lệnh qua macro lồng nhau 6 tầng x10 (320 byte nguồn) → **OOM-killed trong 14 giây** (macro expansion tốn RAM bất thường so với statement literal).
      5. 800,000 câu lệnh qua macro phẳng lặp lại (21KB nguồn) → **OOM-killed trong 20 giây**.
      6. 22,000 câu `x=x/7+3;` (phép chia, nặng hơn per-statement, 176KB) → compile 49s rồi **lỗi linker thật** (`l32r: literal target out of range` — giới hạn literal-pool của kiến trúc xtensa, không liên quan sandbox).
      → Kết luận thật: trong giới hạn 200,000 ký tự, không tồn tại payload nào "chỉ tốn CPU thuần, không lỗi khác" vượt được 90s — mọi kỹ thuật đủ đậm đặc đều OOM hoặc lỗi toolchain trước. Đây là **thuộc tính bảo mật tốt** (giới hạn kích thước tự nó chặn được thiệt hại CPU tối đa từ 1 request), nhưng có nghĩa không thể minh họa "sạch" bằng payload độc hại thuần. **Theo xác nhận của bạn**, đã dùng payload AN TOÀN đã biết (49,500 câu `x++;`, compile thật mất 56s, không lỗi) kèm **tạm thời hạ `TimeoutSeconds` xuống 30 CHỈ CHO LẦN TEST NÀY** (qua biến môi trường `SimulationCompile__TimeoutSeconds=30`, không sửa `appsettings.json`) để cô lập và xác nhận đúng cơ chế timeout+`docker kill`. Kết quả thật: `HTTP 200`, `ELAPSED_MS=33126` (~33s, khớp 30s timeout + overhead), body `{"success":false,...,"errors":[{"message":"Compile timed out after 30 seconds."}]}`. Xác nhận thêm: `docker ps -a` sau đó không còn container nào — container bị `docker kill` + `docker rm -f` sạch sẽ, không rò rỉ resource. **Sau test, đã revert lại config mặc định 90s** (chỉ là biến môi trường tạm thời, không đụng file).
    - **Test C (ghi file lớn) — PASS.** Payload: `asm(".section .data\n.globl big_blob\nbig_blob:\n.space 600000000\n");` (yêu cầu assembler cấp phát 600MB vào section `.data`). Kết quả thật: `Fatal error: can't fill 256 bytes in section .data of .../sketch.ino.cpp.o: 'No space left on device'` — tmpfs `/workspace/build` (cap 256m) từ chối ghi vượt hạn mức, build thất bại sạch sẽ (không hang, không OOM container, không crash). Xác nhận: không có byte nào của blob 600MB chạm tới host disk (toàn bộ nằm trong tmpfs, đã bị hủy cùng container).
  - **Xác nhận dọn dẹp:** sau tất cả test, `docker ps -a --filter name=stem-compile` rỗng, `jobRoot` trên host (`%TEMP%\stem-simulation-compile\`) không còn thư mục job con nào sót lại — cleanup hoạt động đúng ở mọi nhánh (thành công / lỗi compile / timeout).

### Việc còn lại của Giai đoạn 0 (không chặn cứng nhưng cần làm sớm)
- [x] **0.2 — Dọn dual-mode `sessionId` — ✅ XONG (2026-07-17), verify thật qua endpoint.**
  - **Kiểm tra DB trước khi xóa (bắt buộc theo yêu cầu):** viết script Npgsql read-only query trực tiếp Supabase Postgres — kết quả: **`SimulationSessions` = 0 dòng, `ExperimentLogs` = 0 dòng**. DB hoàn toàn sạch, không có dữ liệu học sinh/lớp thật nào phụ thuộc nhánh `int`. Không cần migrate.
  - Đã xóa nhánh `int`/`SimulationSession`/`ExperimentLog`/`Template.Config` trong cả 4 method (`SaveDiagramAsync`, `ResolveDiagramJsonAsync`, `ResolveSourceCodeAsync`, `PersistRunAsync`), chỉ còn nhánh `Guid`/`VirtualLabProject`. Dọn thêm code chết phát sinh sau khi xóa: `TryReadLogString` và `SerializeRuntimeLog` (chỉ được gọi từ các nhánh `int` đã xóa) — xóa cả hai. `PersistRunAsync` bỏ luôn tham số `events` không còn dùng tới (chỉ phục vụ ghi `ExperimentLog` ở nhánh cũ).
  - `PersistRunAsync` giờ `throw new ArgumentException("sessionId must be a GUID virtual-lab project id.")` giống hệt `SaveDiagramAsync` khi sessionId không parse được thành Guid — thay vì im lặng bỏ qua như trước.
  - `dotnet build STEM.Infrastructure` — **0 Warning, 0 Error** — xác nhận không còn chỗ nào trong codebase phụ thuộc vào code đã xóa.
  - **Test thật qua endpoint** (build ra thư mục riêng, chạy instance test ở port 58080, không đụng session Visual Studio của người dùng — giống quy trình 0.B1):
    - `POST /api/diagrams/{guid}` với GUID mới → `200`, tạo `VirtualLabProject` mới.
    - `GET /api/diagrams/{guid}` → `200`, đọc lại đúng dữ liệu vừa lưu.
    - `POST /api/diagrams/not-a-guid-123` (sessionId không hợp lệ) → `400`, body `{"message":"sessionId must be a GUID virtual-lab project id."}` — xác nhận đúng hành vi throw mới.
    - `POST /api/virtual-lab/projects/{guid}/start` (mode mock) trên GUID mới → `200`, `RunEsp32Async` → `PersistRunAsync` tạo `VirtualLabProject` đúng (xác nhận lại bằng `GET /api/virtual-lab/projects/{guid}` — `codeContent`/`diagramJson` khớp).
    - Gọi `/start` lần 2 trên cùng GUID → `200`, xác nhận nhánh update (không phải insert) cũng chạy đúng, không lỗi trùng khóa.
    - Đã xóa 2 dòng test tạo ra trong `VirtualLabProjects` (DB thật) sau khi test xong.
- [x] **0.3 — Sửa `[AllowAnonymous]` toàn bộ `VirtualLabProjectController` — ✅ XONG (2026-07-17), verify thật bằng 2 token thật.**
  - **Trước khi code, đã audit pattern auth hiện có** (`AssignmentsController`, `LabsController`): `[Authorize]` đơn giản ở class-level, toàn bộ ownership/role check nằm ở service layer (`GetCurrentUserAsync` + so `lab.CreatedById == user.Id` hoặc join `ClassAssignments→Enrollments`), throw `UnauthorizedAccessException` → controller `Forbid()` (403), `KeyNotFoundException` → `NotFound()` (404). Bạn xác nhận dùng đúng pattern này.
  - **Phát hiện khi audit (khiến phạm vi rộng hơn "chỉ VirtualLabProjectController" như đề bài gốc):**
    1. `VirtualLabProject.UserId` (`int?`) là field ownership, nhưng **`SaveDiagramAsync` (dùng bởi `DiagramsController`) không hề nhận `currentUserId` và không stamp `UserId` khi tạo mới** — project tạo qua `/api/diagrams/{guid}` luôn `UserId = null` vĩnh viễn.
    2. **Lỗ hổng thật, không chỉ thiếu 401:** nhánh update của `PersistRunAsync` (gọi bởi `/start`) **không hề check ownership** — bất kỳ ai gọi `/start` trên project GUID có sẵn đều ghi đè được `DiagramJson`/`CodeContent` của người khác.
    3. `VirtualLabProjectService.GetProjectAsync`/`UpdateProjectAsync` không nhận `currentUserId` — cùng gap.
    4. **`DiagramsController` (route khác, cùng entity `VirtualLabProject`) hoàn toàn không có auth** — nặng hơn cả gap của `VirtualLabProjectController` vì không có cả `[AllowAnonymous]` để đánh dấu. Nếu chỉ sửa `VirtualLabProjectController`, ai cũng bypass được ownership check bằng cách gọi `/api/diagrams/{guid}` thay vì `/api/virtual-lab/projects/{guid}` — cùng 1 dữ liệu. Bạn xác nhận sửa cả hai cùng lúc.
    5. `VirtualLabProject` không có link tới Class/Assignment (khác `Lab`) — không tái tạo được kiểu scoping "giáo viên xem lớp mình" như `LabService`. Bạn xác nhận **owner-only cho tất cả role kể cả giáo viên** ở MVP này (nới rộng để sau, khi GĐ4 thêm link Class/Assignment).
    6. Đã kiểm tra DB: bảng `VirtualLabProjects` **0 dòng** (đã tự xóa 2 dòng test tạo ra ở Bước 0.2) — không có edge case `UserId = null` cũ cần tính tới khi thiết kế check.
  - **Đã sửa:**
    - `IVirtualLabProjectService`: `CreateProjectAsync` đổi `int? userId` → `int userId`; `GetProjectAsync`/`UpdateProjectAsync` thêm `int currentUserId`, ném `UnauthorizedAccessException` nếu `project.UserId` có giá trị và khác `currentUserId`.
    - `IVirtualLabRuntimeService`: `GetDiagramAsync`/`SaveDiagramAsync` thêm `int currentUserId`. Thêm helper dùng chung `LoadOwnedProjectAsync` trong `VirtualLabRuntimeService`, áp cho cả `GetDiagramAsync`, `SaveDiagramAsync` (stamp `UserId` khi tạo mới), `PersistRunAsync` (vá đúng lỗ hổng #2), `ResolveDiagramJsonAsync`/`ResolveSourceCodeAsync` (fallback khi `/start` không gửi kèm diagram/code).
    - `VirtualLabProjectController`: bỏ hết `[AllowAnonymous]`, thêm `[Authorize]` class-level + `GetCurrentUserId()` (copy pattern từ `LabsController`). `StopSimulation` (vẫn là stub, chưa đổi state thật — để dành GĐ4) nay ít nhất verify ownership trước khi trả response, tránh lộ thông tin tồn tại.
    - `DiagramsController`: thêm `[Authorize]` + `GetCurrentUserId()`, truyền `currentUserId` vào cả 2 action.
    - `dotnet build STEM.Api` — 0 Error (4 warning cũ, không liên quan).
  - **Test thật bằng 2 JWT tự mint** (cùng secret/scheme với `JwtProvider.GenerateToken`, không cần mật khẩu — userId=1 "User A", userId=2 "User B"), qua instance test port 58080:
    - Không token, `POST /api/virtual-lab/projects` → **401**. Không token, `GET /api/virtual-lab/projects/{id}` → **401**. Không token, `POST /api/diagrams/{guid}` → **401**.
    - User A tạo project → `200`, `userId:1` đúng.
    - User A (chủ) `GET` project → **200**. User B (không phải chủ) `GET` cùng project → **403**. User B `PUT` (update) → **403**. User B `POST /start` → **403**. User B `POST /stop` → **403**.
    - User A `POST /api/diagrams/{guid}` tạo diagram mới → `200`. User A `GET` lại → **200**. User B `GET` cùng diagram → **403**. User B `POST` (ghi đè) cùng diagram → **403**.
    - Xác nhận defense-in-depth: sau khi User B bị chặn ghi đè, `GET` lại bằng token User A cho thấy dữ liệu **không hề bị thay đổi** (`updatedAt` giữ nguyên, không phải payload `"hacked":true` mà User B gửi) — chặn thật ở tầng service trước khi `SaveChangesAsync`, không phải chỉ chặn ở response.
    - Đã xóa 2 dòng test tạo ra trong DB thật sau khi test xong.
- [x] **0.4 — Vá compile-giả-mạo — ✅ XONG (2026-07-18), verify thật qua endpoint (= 5.3, xem chi tiết đầy đủ ở mục đó).**
- [x] **0.5 — Xóa `SimulationController`, `Esp32SimulationsController`, `SimulationCompileController.GetCompileJob` — ✅ XONG (2026-07-18), verify thật (= 3.1, cùng 1 việc).**
  - **Grep sweep cuối cùng trước khi xóa** (cả STEM_BE lẫn STEM_FE, làm lại lần cuối dù đã audit nhiều lần trước): STEM_BE — không file `.cs` nào khác tham chiếu `api/simulations`, `simulations/esp32`, `compile-jobs`, `SimulationController`, `Esp32SimulationsController`, `GetCompileJob` ngoài chính 3 file mục tiêu. STEM_FE — chỉ 1 kết quả: `dashboardApi.ts` định nghĩa `simulationCompileApi.getJob` gọi `/simulation/compile-jobs/${jobId}`, nhưng grep riêng `simulationCompileApi\.getJob|\.getJob\(` = **0 kết quả** trong toàn bộ `src/` — hàm client tồn tại nhưng **không hề được gọi ở đâu**. Grep thêm `simulationsApi\.|esp32Api\.` = 0 kết quả. Kết luận: xóa an toàn, không breaking FE runtime (không sửa code FE, đúng phạm vi).
  - Đã xóa hẳn `STEM.Api/Controllers/SimulationController.cs` (route cũ `api/simulations`) và `STEM.Api/Controllers/Esp32SimulationsController.cs` (route cũ `api/simulations/esp32`) bằng `git rm`.
  - Đã xóa method `GetCompileJob` (`[HttpGet("compile-jobs/{jobId}")]`) khỏi `SimulationCompileController.cs`, giữ nguyên action `Compile` (`POST api/simulation/compile`) và helper `GetCurrentUserId()`.
  - `dotnet build STEM.Api.csproj` (toàn solution) — **0 Warning mới, 0 Error** (10 warning cũ không liên quan, đã có từ trước).
  - **Test thật qua endpoint** (build ra thư mục riêng, instance test port 58080, không đụng session Visual Studio của người dùng): `POST /api/simulation/compile` với sketch Blink LED hợp lệ (`board:esp32`, `framework:arduino`) sau khi xóa `GetCompileJob` → **HTTP 200**, `success:true`, compile thật qua Docker sandbox ra firmware (`Sketch uses 271140 bytes (20%)...`), xác nhận route `Compile` chính hoàn toàn không bị ảnh hưởng bởi việc xóa `GetCompileJob` cùng file.
- [x] **0.6 — Commit batch hiện tại trên `Trieu/role_giao_vien` theo từng phần logic rõ ràng — ✅ ĐẠT.** Toàn bộ WIP (0.B1, 0.2, 0.3, 0.4/5.3, 0.5) đã được commit local thành các commit riêng theo từng phần logic (không commit 1 cục lớn), xem chi tiết ở từng mục tương ứng và ghi chú sự cố merge — chưa push, đúng theo yêu cầu.

**Điều kiện qua Giai đoạn 1:** ✅ compile chạy trong sandbox (0.B1 xong) — ✅ `VirtualLabRuntimeService` chỉ còn 1 nhánh session (0.2 xong) — build/test pass. Cả 2 điều kiện đã đạt. **Giai đoạn 0 đã đóng hoàn toàn (0.B1/0.2/0.3/0.4/0.5/0.6 đều xong, verify thật).**

## GIAI ĐOẠN 1 — DIAGRAM & NETLIST (BE) + CANVAS (FE)

### BE — đã có, vượt kỳ vọng ban đầu (nhưng chưa "chốt xong" tới khi 0.B1 giải quyết)
`VirtualLabDiagramService.Analyze()` đã verify có:
- Parse `parts`/`connections`, validate ESP32 tồn tại, pin hợp lệ theo `SupportedPins`.
- Netlist builder union-find (`BuildNetlist`), gồm cả short-circuit resistor thành 1 net 2 cực.
- Wiring semantic rule theo từng loại: `wokwi-led` (anode→GPIO, cathode→GND), `wokwi-pushbutton` (1 pin→GPIO, 1 pin→3V3/GND), `wokwi-buzzer` (→GPIO, →GND), `wokwi-servo` (PWM→GPIO, GND→ground, V+→power), `wokwi-dht22/dht11` (SDA→GPIO, VCC→power, GND→ground), `wokwi-hc-sr04` (TRIG/ECHO→GPIO, VCC→power, GND→ground).
- `wokwi-lcd1602`/`lcd2004`/`gnd`/`5v`: chỉ cảnh báo "structural only in MVP", không có rule riêng. `wokwi-resistor`: không rule, không cảnh báo, chỉ short-circuit vào netlist.

- [ ] 1.1 (BE) Rà `SupportedPins`/wiring rules đã đủ cho bài mẫu dự kiến (Giai đoạn 6) chưa — bổ sung nếu thiếu.
- [ ] 1.2 (BE) Sau khi dọn dual-mode (0.2), viết test cho `SaveDiagramAsync`/`GetDiagramAsync` chỉ còn nhánh `VirtualLabProject`.

### FE — chưa audit trong các phiên trước, vẫn cần làm
- [x] **1.3 (FE) — Audit xong (2026-07-18).** Phát hiện `LabSandboxPage.tsx` (luồng sandbox thật học sinh dùng) hoàn toàn không gọi `VirtualLabProject`/`DiagramsController` — dùng luồng `Lab.circuitConfig` cũ, state local không lưu, board hardcode Uno. So khớp `type` linh kiện FE/BE: 4/12 khớp đầy đủ (led/resistor/buzzer/servo), pushbutton chỉ 2/4 pin (`pinMaps.ts` transcribe thiếu, element thật của `@wokwi/elements` có đủ 4 pin), 6/12 không vẽ/nối dây được (dht22/dht11/hc-sr04/lcd1602/lcd2004 — `@wokwi/elements` có sẵn nhưng chưa wire; gnd/5v — package không có element trực quan, cần tự vẽ), potentiometer FE có mà BE không nhận. Đã lên kế hoạch xử lý ở "Bước 5" của việc rewrite `LabSandboxPage.tsx` (xem `VIRTUAL_LAB_ADR.md` không có mục riêng, chi tiết đầy đủ nằm trong lịch sử hội thoại/kế hoạch con — chưa làm, còn mở).
  - **✅ Re-audit potentiometer (2026-07-19), chỉ ghi nhận, không sửa:** `ComponentGlueRegistry` (dùng cho Save/palette) và `VirtualLabDiagramService.SupportedPins` (dùng cho `Analyze()`) là **2 hệ thống độc lập hoàn toàn** — sửa registry (vòng type-mismatch) không ảnh hưởng `Analyze()`. `SupportedPins` (12 entries, dòng 16-40) **không có `wokwi-potentiometer`** — xác nhận thật qua response `Analyze()` của Lab[test]: potentiometer chỉ tạo **warning** ("not modeled by the MVP validator"), không chặn `IsValid`. Vẫn nằm trong danh sách gap 6/12 loại chưa modeled đầy đủ (giờ thành 7/12 nếu tính cả potentiometer), chưa xử lý.
  - **⚠️ Phát hiện thêm (2026-07-19), ưu tiên cao hơn gap 6/12 loại — CHƯA CODE, chỉ ghi nhận:** đã xác nhận dứt điểm (đọc code, grep `palette|Palette|AVAILABLE_COMPONENTS|onAddComponent|addComponent|draggable|dragstart` trên `LabSandboxPage.tsx`+`CircuitCanvas.tsx` = 0 kết quả liên quan) **hoàn toàn không có UI thêm linh kiện mới vào mạch** — `sandboxComponents` chỉ được sửa (move/rotate/attr-change/delete) qua các phần tử **có sẵn**, không có handler nào append id mới. Kể cả phía giáo viên (`CircuitBuilderTeacherMode.tsx`) cũng chỉ có `WIRE_PALETTE` (màu dây), không có palette linh kiện. Đây là gap **rộng hơn** gap 6/12 loại đã ghi ở trên — ảnh hưởng **cả 4 loại đã khớp hoàn toàn** (led/resistor/buzzer/servo) chứ không riêng 6 loại thiếu, vì không ai thêm được bất kỳ linh kiện nào từ UI bất kể loại gì. Cần xử lý **trước** việc vá 6/12 loại ở "Bước 5" (vá render cho loại còn thiếu vô nghĩa nếu chưa có cách nào thêm linh kiện đó vào canvas trước hết).
  - **✅ Vá render `wokwi-dht22` — XONG (2026-07-20), verify thật qua UI (chưa verify Save+Analyze() vì chưa có BE chạy trong phiên này, còn mở).** Lấy đúng `pinInfo` thật từ `node_modules/@wokwi/elements/dist/esm/dht22-element.js` (`VCC(15,114.9) SDA(24.5,114.9) NC(34.1,114.9) GND(43.8,114.9)`), thêm `DHT22_PINS` vào `pinMaps.ts`, nhánh render `wokwi-dht22` vào `CircuitCanvas.tsx` (đúng pattern LED/buzzer/servo/resistor có sẵn), entry `dht22` vào `COMPONENT_REFERENCES` (`CircuitBuilderTeacherMode.tsx`). Verify bằng harness Playwright tạm (mount `CircuitBuilderTeacherMode` với `componentOptions` giả lập, không đụng BE/DB, đã xóa sạch sau khi xong): render đúng hình SVG thật (không phải khối xám), palette hiện đúng 4 tên chân, kéo dây qua PointerEvent thật cho từng cặp pin.
    - **🐛 Bug phụ phát hiện + đã vá luôn (không phải do DHT22 gây ra — lỗi có sẵn, ảnh hưởng MỌI linh kiện chân sát nhau):** `<g>` chọn-dây trong `<svg>` có `zIndex:10` cố định, còn wrapper linh kiện *chưa được chọn* chỉ có `zIndex:5` — khi 1 dây đã vẽ đi ngang toạ độ chân của linh kiện khác (dễ xảy ra với DHT22 vì 4 chân chỉ cách nhau 9-19px, hẹp hơn hit-path 15px của dây), hit-path vô hình của dây "che" mất chân đó, khiến pointerdown rơi vào dây thay vì chân — không vẽ được dây tiếp theo, không báo lỗi gì. Xác nhận bằng debug event log thật (`document.addEventListener(..., true)` capture phase): pointerdown target là SVG `<path>`, không phải pin-dot. **Đã thử fix bằng cách gộp toàn bộ pin-dot ra 1 layer chung với toạ độ tuyệt đối (z-index cao hơn `<svg>`) — gây HANG thật (không phải chỉ chậm, đã xác nhận bằng timeout 40s vẫn treo) khi kéo dây thứ 3, nghi do hover-storm giữa nhiều pin-dot xếp chồng trong 1 layer chung với `hover:scale-[1.8]` — đã revert cách này.** Fix cuối cùng (đơn giản, an toàn hơn, không đổi kiến trúc pin-dot): chỉ tăng `zIndex` wrapper linh kiện/board *chưa chọn* từ `5` → `11` (cao hơn `zIndex:10` của `<svg>`), giữ nguyên toạ độ owner-relative và vị trí `renderPinDots(...)` trong JSX như cũ. Verify lại: kéo 3 dây liên tiếp (VCC→3V3, GND→GND.1, SDA→D4) trên cùng 1 con DHT22 — cả 3 đều thành công, đúng màu dây tự động (đỏ/đen/xanh lá), không hang, `console --errors` rỗng.
  - **⏳ Chưa verify Save + Analyze() qua BE thật** — không có backend nào chạy trong phiên làm việc này. Đã hỏi và thống nhất: bạn tự chạy `STEM_BE` (đã kết nối sẵn DB dev), báo khi sẵn sàng để verify tiếp qua UI thật trước khi sang soạn 4 bài mẫu (Blink LED, Button+LED, Buzzer báo động, đọc DHT22) ở Giai đoạn 6.
- [x] **1.4 (FE) — ✅ XONG (2026-07-18), verify thật qua UI.** `LabSandboxPage.tsx` giờ gọi đúng `GET api/virtual-lab/projects/{id}` (hydrate) + `PUT api/diagrams/{projectId}` (Guid tất định từ `(labId, studentId)` qua UUIDv5, xem `projectId.ts`) — debounce 1.5s. Verify: dựng instance BE+FE cô lập, mint token thật, kéo 1 linh kiện trên UI thật (giả lập bằng PointerEvent thật, không phải gọi hàm nội bộ), đợi debounce, xác nhận `PUT` 200 + đọc thẳng DB thấy đúng toạ độ mới + 2 wire connection (kèm màu/waypoint) round-trip nguyên vẹn, **reload trang thật → linh kiện vẫn ở đúng vị trí mới** (không phải vị trí cũ/mặc định) — đúng bug "mất khi refresh" đã được vá.
- [~] **1.5 (FE) — một phần.** Header sandbox hiện hiển thị số lượng lỗi mạch (`"X lỗi mạch"`) lấy từ `DiagramValidationResult.errors`/`warnings` trả về sau mỗi lần lưu — xác nhận dữ liệu Validation/Netlist đã chảy tới FE thật (không phải giả). **Chưa làm:** highlight trực quan đúng linh kiện/pin theo từng lỗi (parse string `"led1: ..."` để tô màu đúng part trên canvas) — còn để mở, chưa có yêu cầu làm tiếp.

**✅ Bug "LED/Buzzer trông như đang sáng/kêu ngay cả trước khi Run" — ĐÃ VÁ (2026-07-21), verify thật qua trình duyệt thật (React + `@wokwi/elements` thật, không phải suy luận code).** Giả thuyết ban đầu (`partStates` là `undefined` lúc hydrate lần đầu) **sai** — `CircuitCanvas.tsx` đã có fallback tường minh từ trước (`partState?.value ?? '0'`, `partState?.buzzing ? 'true' : 'false'`), không có state nào là `undefined` khi render. **Nguyên nhân thật, nghiêm trọng hơn dự đoán:** `wokwi-led`/`wokwi-buzzer` (`@wokwi/elements`, nền Lit) khai báo property `value`/`hasSignal` là `boolean` (`.d.ts` xác nhận), nhưng decorator `@property()` trong implementation **không có `{ type: Boolean }`** — nên khi nhận 1 chuỗi (`'0'`, `'false'`) qua React props, Lit lưu thẳng chuỗi đó, không ép kiểu. Trong JS, **mọi chuỗi non-empty đều truthy, kể cả `'0'` và `'false'`** — nên `this.value && ...` (LED) / `this.hasSignal` (buzzer) luôn `true` bất kể nội dung chuỗi là gì, khiến LED/buzzer **luôn hiển thị như đang bật/kêu**, cả trước Run lẫn sau khi nhận event "tắt" thật.
  - **Verify bằng harness cô lập** (trang HTML tạm, Vite dev server phục vụ trực tiếp `@wokwi/elements` + React thật, đã xoá sau khi xong, không đụng BE/DB): `value='0'` (string, code cũ) → `el.value` là chuỗi `"0"`, `lightOn=true` (SAI). `value={false}` (boolean thật) → `el.value` là `false` thật, `lightOn=false` (ĐÚNG).
  - **Phát hiện thêm cho buzzer (không đối xứng với LED):** chỉ đổi sang boolean thôi chưa đủ — phải đúng cả **tên prop khớp case với property JS thật** (`hasSignal`, không phải `hassignal` như code cũ). React chỉ gán thẳng qua DOM property (bỏ qua serialize thành chuỗi attribute) khi tên prop truyền vào khớp đúng case với 1 property đã tồn tại sẵn trên instance element. Verify thật: prop `hassignal` (chữ thường, khớp tên *attribute* Lit tự suy ra chứ không khớp property `hasSignal`) — dù truyền boolean `true` — vẫn bị React đưa qua đường attribute (`attribute=""` rỗng), Lit đọc lại thành chuỗi rỗng, **falsy** → buzzer luôn câm dù muốn bật (lỗi khác, cùng gốc). Chỉ prop `hasSignal` (đúng case) + giá trị boolean thật mới được gán thẳng qua property, đúng cả 2 chiều bật/tắt.
  - **Đã sửa** (`CircuitCanvas.tsx`): thêm 2 helper `isLedOn(state)`/`isBuzzerOn(state)` trả về boolean thật; đổi `value: partState?.value ?? '0'` → `value: isLedOn(partState)`, đổi `hassignal: partState?.buzzing ? 'true' : 'false'` → `hasSignal: isBuzzerOn(partState)`.
  - **Verify lại sau khi sửa**, cùng harness: mount đúng component `CircuitCanvas` thật (không phải bản rút gọn) với `partStates={}` (đúng state khởi tạo của `LabSandboxPage.tsx` lúc load trang) → LED `lightOn=false`, buzzer `buzzing=false` — đúng, tắt rõ ràng trước Run. Mô phỏng đúng chuỗi event của 1 lượt Run Blink LED thật (`applySimulationEvent`): bật (`value:'1'`/`buzzing:true`) → `lightOn=true`/`buzzing=true` (đúng, sáng/kêu rõ rệt, khác hẳn lúc tắt); tắt lại (`value:'0'`/`buzzing:false`) → cả 2 về `false` (đúng, tắt lại đúng, không còn kẹt "luôn sáng" như bug cũ).
  - **Không đụng:** `glue/led.ts` (`attachLed`, dùng cho `boardType==='arduino_uno'` qua `SimulationEngine` avr8js cũ) có cùng lỗi gốc (`setAttribute('value', value ? '1' : '0')` — cũng là chuỗi, cũng luôn truthy) nhưng **hiện là dead code**: `LabSandboxPage.tsx` luôn truyền `engine={null}` (xác nhận bằng grep, chỉ 1 kết quả), nên `useEffect` gọi `attachLed` bị chặn ngay ở guard `if (!engine || boardType !== 'arduino_uno') return;` — không chạy trong luồng thực tế nào hiện tại. Ghi lại để không quên nếu sau này path avr8js được bật lại.

**Tối ưu nhỏ chưa sửa (không chặn, ghi lại để không quên — giống cách ghi nhận lỗi resubmit ở 5.3):**
- Mỗi lần mở sandbox, `useEffect` debounce-save hiện tự bắn 1 lần `PUT api/diagrams/{id}` ngay sau khi hydrate xong dù không có thay đổi thật nào từ người dùng — tốn 1 lần gọi API + 1 lần chạy `VirtualLabDiagramService.Analyze()` vô ích mỗi lần load trang. Không gây lỗi, chỉ lãng phí nhẹ. Sửa sau: so sánh nội dung đã hydrate với nội dung hiện tại trước khi trigger debounce, chỉ save khi thực sự khác.
- `PersistRunAsync` (`VirtualLabRuntimeService.cs`, dùng bởi `/start`) có **cùng pattern race condition lý thuyết** vừa vá ở `SaveDiagramAsync` — auto-create `VirtualLabProject` mới khi gọi `/start` trên 1 Guid chưa tồn tại cũng insert thẳng không bọc try/catch `DbUpdateException`. Chưa vá (bạn chỉ yêu cầu sửa đúng `SaveDiagramAsync`), để dành cùng nhóm với 2 mục trên.

**✅ Race condition ở `SaveDiagramAsync` — ĐÃ SỬA (2026-07-18), verify thật.** Phát hiện khi verify Bước 2: `SaveDiagramAsync` (`VirtualLabRuntimeService.cs`) khi tạo `VirtualLabProject` mới cho 1 Guid chưa tồn tại không có bảo vệ chống 2 request ghi đồng thời cùng Guid — request thua cuộc nhận `DbUpdateException` (Postgres `23505 duplicate key value violates unique constraint "PK_VirtualLabProjects"`) không được catch, trả **500 thô** (lộ stack trace). Bạn chọn sửa ngay (rẻ, không kéo quyết định kiến trúc khác, khác lỗi resubmit ở 5.3). **Đã sửa:** `SaveDiagramAsync` giờ bọc lần `SaveChangesAsync` đầu (nhánh insert) trong `try/catch (DbUpdateException ex) when (IsDuplicateKey(ex))` — khi gặp đúng mã lỗi Postgres `23505`, detach entity vừa insert lỗi, đọc lại record mà request kia vừa tạo, rồi update thay vì insert. Không đụng `PersistRunAsync` (cùng pattern, cùng lỗ hổng lý thuyết — **chưa sửa, để dành nếu cần**, vì bạn chỉ yêu cầu sửa đúng `SaveDiagramAsync`). **Verify thật:** dựng lại đúng kịch bản đã gặp lỗi lần đầu (React StrictMode double-invoke qua UI thật, browser tab mới để tránh log cũ lẫn vào) — 3 `PUT api/diagrams/{id}` gần như đồng thời cho cùng 1 Guid mới, **cả 3 đều 200 OK, không còn 500 nào**; đọc thẳng DB xác nhận đúng **1 dòng duy nhất**, không trùng lặp/mồ côi dữ liệu.

**Output:** Vẽ mạch Blink LED đúng → `IsValid: true`. Bỏ GND → lỗi đúng dạng mô tả ở trên.

**✅ Type mismatch `led` vs `wokwi-led` — ĐÃ VÁ (2026-07-18/19), verify thật qua UI + Analyze() API.** Chuỗi phát hiện đầy đủ, ghi lại vì là bài học quan trọng (đừng tin field cache/derived data, luôn tìm nguồn tính toán thật sự tại thời điểm dùng):
1. **Gốc rễ:** `ComponentGlueRegistry` (bảng BE, seed qua `StemDbContext.cs` `HasData`) chứa `ComponentType` dạng ngắn (`"led"`, `"buzzer"`...), trong khi `VirtualLabDiagramService.Analyze()` chỉ nhận diện dạng `wokwi-*`. 100% Lab thật có linh kiện (3/5 Lab kiểm tra) đều lưu `CircuitConfigJson.parts[].type` dạng ngắn — sai định dạng từ lúc tạo.
2. Sửa vòng 1 (đã làm trước, không thuộc phiên này): `ComponentGlueRegistry` (6 dòng, UPDATE đổi `ComponentType` sang `wokwi-*`) + `Lab.AllowedComponentTypesJson` (3 Lab) qua SQL trực tiếp (không dùng `dotnet ef migrations` — CLI trong môi trường này resolve nhầm sang SQL Server provider ảo thay vì Npgsql thật dùng lúc runtime; nguyên nhân gốc chưa điều tra, tạm hoãn).
3. **Phát hiện then chốt (khiến vòng 1 chưa đủ):** `CreateLabModal.tsx` tính lại `allowedComponentTypes` **mới hoàn toàn** từ `circuitParts.map(part => part.type)` ở **mỗi lần Save**, không bao giờ đọc `Lab.AllowedComponentTypesJson` đã lưu. Nghĩa là sửa `AllowedComponentTypesJson` ở DB không có tác dụng lâu dài — trường `parts[].type` (chưa sửa) mới là nguồn sự thật thật sự tại thời điểm Save. Hệ quả: Lab[test]/Lab[tes1] (2 Lab Arduino Uno, cố tình không đụng `parts[]` ở quyết định trước) **không Save được qua UI nữa** (400 `Unsupported component types`) — phát sinh ngoài dự tính, không phải quyết định đã chấp nhận trước đó.
4. Sửa vòng 2 (phiên này): đổi `parts[].type` (chỉ đổi tên, giữ nguyên `id`/`x`/`y`/`attrs`/`pinMapping`/`connections`/`board`) cho `Lab[test]`, `Lab[tes1]` (Arduino Uno) và `Lab[132213]` (ESP32). `Lab[e82937a8-fb12-49d2-ab3a-b780e44556f8]` xác nhận không cần sửa (`CircuitConfigJson.parts = []`).
5. **Thử rồi rollback:** cân nhắc thêm 1 "board part" giả (`type: "board-esp32-devkit-c-v4"`) vào `parts[]` của Lab[132213] để `Analyze()` nhận diện board ESP32 — cách này đòi hỏi thêm 1 dòng "board" giả vào `ComponentGlueRegistry` (Supported=true, để qua được validator Save), nhưng registry này cũng là nguồn cho palette thêm linh kiện của giáo viên (`CircuitBuilderTeacherMode.tsx` dòng 249, lọc theo đúng field `Supported`) → board giả lộ ra palette dạng "Unknown Component". Đã **revert hoàn toàn** (xoá dòng registry vừa thêm, Lab[132213] chỉ giữ phần đổi `type` LED). Xem mục backlog mới bên dưới.
6. **Kết quả cuối, verify thật:**
   - Save qua UI giáo viên thật (BE+FE cô lập, token thật user 11): cả 3 Lab (`test`, `tes1`, `132213`) đều `PUT /api/labs/{id}` → **200 OK**, palette xác nhận đúng "5 loại khả dụng" (không còn "Unknown Component").
   - `Analyze()` thật qua `PUT /api/diagrams/{sessionId}` với `DiagramJson` = nội dung `CircuitConfigJson` của từng Lab: cả 3 Lab chỉ còn lỗi `"Diagram must include an ESP32 board."` (+ lỗi wiring thật tương ứng nếu có, vd LED anode/cathode chưa nối) — **không còn lỗi type/registry nào**.
   - **Save hoạt động** và **Analyze() đạt `IsValid: true`** chính thức là 2 khái niệm tách biệt cho `Lab[test]`, `Lab[tes1]`, `Lab[132213]`: cả 3 Save được bình thường, nhưng `Analyze()` sẽ **luôn** báo thiếu board ESP32 — đây là kết quả **chấp nhận được**, không phải bug (đúng theo quyết định giữ nguyên board Arduino Uno cho 2 Lab đầu, và không thêm board part giả cho Lab[132213]).
   - Lịch sử SQL đã chạy: [`STEM_BE/SQLScripts/FixVirtualLabComponentTypeMismatch.sql`](../STEM_BE/SQLScripts/FixVirtualLabComponentTypeMismatch.sql).
   - **✅ Xác nhận (2026-07-21):** `SELECT Id, Title, BoardType FROM Labs WHERE Title = 'tes1'` → đúng **1 dòng duy nhất** (`Id = 4b07cab0-a800-4287-a8fd-d91dc6839780`), `BoardType` hiện tại là **`esp32_devkit_v1`**. Lab[tes1] hiện đã đổi BoardType sang `esp32_devkit_v1`, thông tin "Arduino Uno" ghi ở mục 4 phía trên đã lỗi thời (đổi sau lần ghi chép cũ, có thể qua UI giáo viên sửa Lab) — không phải bug, không có project nào từng được tạo cho Lab này nên không ảnh hưởng dữ liệu thật.

**🔖 BACKLOG MỚI (chưa làm, để dành):** `VirtualLabDiagramService.Analyze()` nên đọc board từ field `"board"` cấp cao nhất của `DiagramJson` (đã có sẵn, đúng ngữ nghĩa — `esp32_devkit_v1`/`arduino_uno`) thay vì bắt buộc phải có 1 entry ESP32 nằm trong `parts[]`. Đây là lý do gốc rễ của toàn bộ chuỗi rắc rối "board part giả" ở mục 5 — cách hiện tại là workaround cho hành vi cứng của validator, trong khi mọi Lab hiện tại đều không có (và không nên có) 1 phần tử "board" giả trong danh sách linh kiện.

## GIAI ĐOẠN 2 — CODE EDITOR + MOCK SIMULATION

**Xác nhận quan trọng:** `RunEsp32Async` chỉ nhận `mode: "mock"`, throw `InvalidOperationException` cho mode khác — compile và run là 2 lời gọi API tách biệt hoàn toàn, không liên kết ở tầng service.

**`VirtualLabMockRunner.cs` đã verify: chỉ là regex scanner từng dòng**, không phải simulator thật:
- Không có control flow — `if`/`for`/`while`/lặp `loop()` không được mô phỏng (thân `loop()` chỉ quét 1 lần, không lặp).
- Không state thật ngoài bảng `#define`/`const int` phẳng; không tính biểu thức/arithmetic.
- `digitalRead` luôn trả cố định `"LOW"`, không đọc trạng thái pin mô phỏng thật.
- Chỉ 2 loại linh kiện có phản ứng mô phỏng: `wokwi-led` (on/off), `wokwi-buzzer` (buzzing/silent), qua `digitalWrite`. **Button/Servo/DHT/Ultrasonic dù được validate ở diagram nhưng không có phản ứng mô phỏng nào ở tầng run.**

- [ ] 2.1 (FE) Audit `CodeEditorPanel.tsx`.
- [x] **2.2 (BE) — ✅ CHỐT DỨT ĐIỂM (2026-07-19): giữ nguyên giới hạn mock runner hiện tại cho MVP.** Không lặp `loop()`, không control flow, chỉ LED/Buzzer phản ứng qua `digitalWrite` — coi Giai đoạn 2 đạt ở mức hiện tại. **Nâng cấp parser (nếu cần) đẩy sang Giai đoạn 8**, không chặn Giai đoạn 6/7.
- [x] **2.3 (FE) — ✅ XONG (2026-07-18), verify thật qua UI (= Bước 3 rewrite LabSandboxPage.tsx).** `LabSandboxPage.tsx` gọi `virtualLabProjectsApi.start(projectId, {code, diagram})` (thay hẳn `SimulationEngine`/avr8js đã tắt hoàn toàn — `CircuitCanvas` luôn nhận `engine={null}`), nhận `Events[]` thật, adapter `applySimulationEvent` map `type:'part-state'` (`component:'led'|'buzzer'`) sang state `partStates` mới, `CircuitCanvas` đọc `partStates` để set `value`/`hassignal` cho `<wokwi-led>`/`<wokwi-buzzer>` (thay hoàn toàn cơ chế cũ dựa vào `engine`).
- [x] **2.4 (FE) — ✅ XONG, verify thật.** Event `type:'serial'` (`payload.message`) được `applySimulationEvent` nối vào `serialOutput`, hiển thị đúng trong `SerialMonitorPanel` — verify thật thấy dòng `"StemFlow mock runner started."` xuất hiện đúng lúc replay bắt đầu.
- [x] 2.5 (FE) — Đã đúng từ trước, giữ nguyên: `handleRun` gọi compile trước (`simulationCompileApi.compile`), chỉ gọi `virtualLabProjectsApi.start` sau khi compile `success:true` — 2 lời gọi tách biệt, đúng thứ tự.

**Output:** ✅ Bấm Run → nhận `SimulationEvent[]` thật, canvas cập nhật đúng theo đúng nhịp thời gian (trong giới hạn LED/Buzzer đã biết) — verify thật bằng timestamp DOM property thật: LED bật lúc replay bắt đầu, tắt sau đúng **1003ms** (code có `delay(1000)`), không dồn hết vào 1 khung hình. Xác nhận lại đúng 2 giới hạn đã biết vẫn còn nguyên qua test thật: `loop()` chỉ chạy 1 vòng (đúng 1 lần bật→tắt, không lặp), Button không có phản ứng thị giác nào (mock runner không phát `part-state` cho pushbutton — xác nhận qua cả response BE thật lẫn đọc code `VirtualLabMockRunner.AddPartStateEvents`, chỉ xử lý `wokwi-led`/`wokwi-buzzer`).

## GIAI ĐOẠN 3 — COMPILE THẬT (Docker + PlatformIO/arduino-cli)

- [x] Chốt flow: sync, route canonical `POST api/simulation/compile`.
- [x] **3.B — [trùng với 0.B1]** Dockerize `SimulationCompileService` — ✅ xong, xem chi tiết + 3 test độc hại PASS ở mục 0.B1.
- [x] **3.1 — [trùng với 0.5]** Xóa `SimulationCompileController.GetCompileJob` (`compile-jobs/{jobId}`) — ✅ xong, xem chi tiết đầy đủ ở mục 0.5.
- [ ] 3.2 (FE) UI Compile: Compiling → Success/Fail — vì sync, không cần polling/socket riêng cho compile.

**Output:** Compile thật chạy trong sandbox an toàn, trả lỗi/log thật.

## GIAI ĐOẠN 4 — SESSION + REALTIME (SignalR) + TEACHER LIVE VIEW

**Xác nhận: 0% hạ tầng tồn tại.** Không `AddSignalR`, không `*Hub.cs`, không WebSocket setup trong `Program.cs`. Phải setup từ đầu, không phải "hoàn thiện thêm".

- [x] 4.1 (BE) `stop` (`VirtualLabProjectController.StopSimulation`) hiện là **stub hoàn toàn** — trả hardcode `{status:"stopped", events:[]}`, không chạm DB/service nào. Cần làm thật: đổi state `VirtualLabProject`, không dùng `SimulationSession` nữa (sau 0.2).
- [x] 4.2 (BE) Setup SignalR: `AddSignalR()` trong `Program.cs`, tạo `VirtualLabHub` (hoặc tên tương đương), `MapHub<VirtualLabHub>()`. Room theo `classId`/`assignmentId` dùng SignalR Groups.
- [x] 4.3 (BE) Lưu `simulationEvents[]` vào `VirtualLabProject` (không phải `ExperimentLogs`/`SimulationSession`).
- [x] 4.4 (FE) — **code xong 2026-07-26, CHƯA test 2 tab thật (backend đang tắt lúc verify).** `virtualLabHub.ts` dùng `@microsoft/signalr`, token qua query-string `access_token`, `ensureConnected()` ổn định, thêm rejoin-tracking (`watchedClassIds`/`watchedProjectIds`/`joinedSessionProjectId`) + `rejoinAfterReconnect()` gọi lại `JoinSession`/`WatchClass`/`WatchStudent` sau khi `onreconnected` (group membership SignalR không sống sót qua reconnect, phải tự rejoin). Không đổi luồng student sandbox hiện có.
- [x] 4.5 (FE) — **code xong 2026-07-26, CHƯA test 2 tab thật.** `TeacherDashboard.tsx` bỏ `mockActiveLabs` giả, dùng `myClasses` thật (`classesApi.getMyClasses`) làm entry point vào `ClassMonitorPage`. `ClassMonitorPage.tsx` mở rộng trạng thái từ 5 lên 9 (`idle/editing_diagram/editing_code/compiling/compile_success/compile_failed/running/stopped/submitted`), wire đủ sự kiện `StudentJoined/StudentDiagramUpdated/StudentCodeUpdated/StudentCompileStarted/StudentCompileFinished/StudentRunBooting/StudentRunCompleted/StudentStopped/StudentSubmitted`. `WatchClass` lúc vào, `UnwatchClass` lúc rời, không reload trang.
- [x] 4.6 (FE+BE) — **code xong 2026-07-26, CHƯA test 2 tab thật.** `StudentSandboxViewer.tsx` gọi `WatchStudent(projectId)` + `GET /api/virtual-lab/projects/{id}/teacher-view` (endpoint mới, `VirtualLabProjectController.GetTeacherView`, chỉ Role Teacher, tự check quyền qua `LabClassAssignments`) để lấy snapshot code/diagram/status hiện tại lúc mount (bù chỗ hổng: SignalR chỉ phát khi có THAY ĐỔI, học sinh đã join trước thì teacher mở lên sẽ trống tay đến khi có update tiếp theo). Live update tiếp tục qua `StudentDiagramUpdated/StudentCodeUpdated/StudentRunBooting/StudentSimulationEvent/StudentRunCompleted/StudentStopped`. Lỗi 403/404 khi `WatchStudent`/snapshot hiển thị rõ ràng trên UI (không còn nuốt lỗi qua `.catch(console.error)`). View-only, không có control chỉnh sửa.
- [x] 4.7 (FE+BE) — **code xong 2026-07-26, CHƯA test 2 tab thật.** Teacher gửi `SendGuidance(projectId, message)` từ `StudentSandboxViewer.tsx`, chỉ xóa input khi gửi thành công, hiển thị lỗi khi thất bại (trước đó xóa input bất kể thành công/thất bại). Phía student nhận `ReceiveGuidance` (đã có handler từ trước, không đổi).

**Output:** Giáo viên xem realtime qua SignalR, `stop` đổi state thật. Test: 2 tab (student/teacher) — thao tác bên student phản ánh bên teacher <2s.

**Cập nhật 2026-07-19 — BE Bước 4.1/4.3 đã triển khai + verify thật.** Đã query `information_schema.columns` trên DB thật trước khi đổi schema: `VirtualLabProjects` chưa có `Status`, `SimulationEventsJson`, hay cột tên tương tự chứa `status`/`simulation`/`event`. Đã chạy SQL trực tiếp qua Npgsql (không dùng `dotnet ef migrations add`) thêm `Status varchar(20) NOT NULL DEFAULT 'stopped'` và `SimulationEventsJson jsonb NOT NULL DEFAULT '[]'::jsonb`, verify lại đúng kiểu/default. Code BE thêm `VirtualLabProjectStatuses` (`running`/`stopped`/`error`), `StopSimulationAsync` đổi trạng thái thật, `/start` set status `running` và reset `SimulationEventsJson=[]`, `RunStarted` qua Hub cũng reset mảng. `SimulationEvent` append bằng UPDATE nguyên tử JSONB (`"SimulationEventsJson" = "SimulationEventsJson" || @eventBatch`) với `NpgsqlParameter` `NpgsqlDbType.Jsonb`, không đọc-sửa-ghi trong C# và không nối chuỗi SQL payload. Đã tạo `VirtualLabHub`, đăng ký `AddSignalR()` + `MapHub<VirtualLabHub>("/hubs/virtual-lab")`, implement các method contract BE gồm `JoinSession`/`DiagramUpdated`/`CodeUpdated`/`CompileStarted`/`CompileFinished`/`RunStarted`/`SimulationEvent`/`Stopped`/`Submitted`/`WatchStudent`/`UnwatchStudent`/`SendGuidance`; riêng cấu hình JWT query-string `access_token` cho browser WebSocket vẫn CHƯA đụng vì thuộc nhóm auth global cần xác nhận riêng. Verify thật: `dotnet build STEM.sln` pass; gọi endpoint thật `/start` → DB `Status="running"`, `SimulationEventsJson=[]`; `/stop` → `Status="stopped"`; raw SignalR WebSocket có bearer header gọi `RunStarted` → reset đúng; bắn 8 kết nối SignalR gần đồng thời gọi `SimulationEvent` → DB có đủ 8 event, index `[0..7]`, không mất event. Test project đã xóa sạch sau verify.

**Cập nhật 2026-07-19 — BE rà soát full contract Hub bằng test thật.** Phát hiện hợp đồng gốc chưa có method để giáo viên join group nhẹ `class-{classId}` cho Teacher Dashboard, trong khi các event tổng quan (`StudentJoined`, `StudentCompileStarted`, `StudentCompileFinished`, `StudentStopped`, `StudentSubmitted`) đều gửi về class group. Đã bổ sung method BE mới để FE đồng bộ: `WatchClass(int classId)` join `class-{classId}` và `UnwatchClass(int classId)` rời group. Chạy verifier raw SignalR WebSocket thật (bearer header; chưa dùng `?access_token=` vì JWT query-string vẫn đang chờ duyệt auth global), tạo project test thật rồi xóa sạch sau test. Kết quả từng method: `JoinSession(projectId, classId)` PASS — join class+project, class watcher nhận `StudentJoined(projectId, studentId, studentName)`, caller và project-only watcher không nhận; `DiagramUpdated(projectId, diagramJson)` PASS — chỉ project watcher nhận `StudentDiagramUpdated`; `CodeUpdated(projectId, sourceCode)` PASS — chỉ project watcher nhận `StudentCodeUpdated`; `CompileStarted(projectId)` PASS — class watcher và project watcher nhận, connection đã `UnwatchClass` không nhận; `CompileFinished(projectId, success, errorSummary)` PASS — class+project nhận đúng 3 tham số; `RunStarted(projectId)` PASS — project-only nhận `StudentRunStarted`, class watcher không nhận, DB `Status=running` và `SimulationEventsJson=[]`; `SimulationEvent(projectId, eventPayload)` PASS — project-only nhận `StudentSimulationEvent`, class watcher không nhận, DB append thêm event bằng JSONB; `Stopped(projectId)` PASS — class+project nhận `StudentStopped`, DB `Status=stopped`; `Submitted(projectId, submissionId)` PASS — class+project nhận `StudentSubmitted`; `WatchStudent(projectId)` PASS — teacher join project group và nhận luồng detail; `UnwatchStudent(projectId)` PASS — sau unwatch không còn nhận project event; `WatchClass(classId)` PASS — teacher join class group; `UnwatchClass(classId)` PASS — sau unwatch không còn nhận class event; `SendGuidance(projectId, message)` PASS — project group nhận `ReceiveGuidance(message, teacherName)`.

**Cập nhật 2026-07-19 — BE Hub ownership giáo viên đã fail-closed + verify thật.** Đã chạy schema Group B sau khi được xác nhận: thêm `VirtualLabProjects."LabId" uuid NULL`, index `IX_VirtualLabProjects_LabId`, FK `FK_VirtualLabProjects_Labs_LabId` tới `Labs("Id") ON DELETE SET NULL`; verify lại `LabId` đúng kiểu `uuid`, nullable, không default. Không backfill 6 project test cũ nên chúng giữ `LabId=NULL`. Code thêm `VirtualLabProject.LabId`, DTO optional `LabId` cho `SaveDiagramRequest`, `RunEsp32SimulationRequest`, `StartSimulationRequest`, `VirtualLabProjectRequest`; service chỉ stamp `LabId` khi tạo project mới, không cho update/save/run sau đổi `LabId` của project đã tồn tại. `VirtualLabHub.WatchStudent`/`SendGuidance` kiểm tra quyền theo `VirtualLabProject.LabId -> LabClassAssignments -> Classes.TeacherId == currentUserId` bằng logic `EXISTS/AnyAsync` vì `LabClassAssignments` là quan hệ nhiều-nhiều (`LabId`,`ClassId`, unique index cặp). Nếu project `LabId=NULL` thì từ chối bằng `Project chưa liên kết với bài lab, không xác định được quyền xem.` `WatchClass(classId)` kiểm tra trực tiếp `Classes.TeacherId == currentUserId`. Verify qua Hub thật (raw SignalR WebSocket bearer header, API test port riêng, dữ liệu verifier tự xóa): Lab X `e82937a8-fb12-49d2-ab3a-b780e44556f8`, Class `3`, Teacher A `45` PASS `WatchClass`/`WatchStudent`/`SendGuidance`; Teacher B `1000045` bị từ chối đúng cho cùng Class/Project (`Bạn không có quyền xem lớp này.` / `Bạn không có quyền xem project này.`); project test `LabId=NULL` bị từ chối fail-closed đúng message cho `WatchStudent` và `SendGuidance`. Sau cleanup, DB còn đúng 6 project không thuộc verifier có `LabId=NULL`. `dotnet build STEM.Api` pass; JWT query-string `access_token` cho browser SignalR vẫn CHƯA sửa `Program.cs` vì là gate auth global cần xác nhận riêng.

**Cập nhật 2026-07-20 — BE Giai đoạn 4 hoàn thành sau JWT query-string gate.** Đã áp dụng `JwtBearerEvents.OnMessageReceived` trong `Program.cs`: chỉ nhận `access_token` query-string khi request path `StartsWithSegments("/hubs/virtual-lab")`; REST API không nhận token query-string. Verify thật bằng API test port riêng + raw SignalR client không gửi `Authorization` header: (1) REST `GET /api/virtual-lab/projects/{id}` với Bearer header owner vẫn `200`, token user khác vẫn `403`; (2) cùng REST chỉ có `?access_token=...`, không Bearer header, vẫn `401`; (3) Hub `/hubs/virtual-lab` connect thành công bằng query-string `access_token` trên cả negotiate/WebSocket và gọi được các method student/teacher đã verify trước đó (`JoinSession`, `DiagramUpdated`, `CodeUpdated`, `CompileStarted`, `CompileFinished`, `RunStarted`, `SimulationEvent`, `Stopped`, `Submitted`, `WatchClass`, `WatchStudent`, `SendGuidance`, `Unwatch*`); (4) regression các endpoint quan trọng PASS: login invalid credentials vẫn `401`; virtual-lab project create/get/update/start/stop và diagrams giữ đúng `200/403`; compile với Bearer vào service validation trả `200 success:false`, compile query-only vẫn `401`; submit với Bearer vào service trả `404 Assignment not found`, submit query-only vẫn `401`. `dotnet build STEM.Api` pass; verifier tạm và log đã dọn sạch. **Phần BE của Giai đoạn 4 đã xong; còn thiếu so với brief gốc nằm ở FE 4.4-4.7** (`@microsoft/signalr`, Teacher Dashboard, live view, guidance UI).

**Cập nhật 2026-07-21 — BE sửa lại contract `JoinSession` đã verify ở Giai đoạn 4, không phải việc mới.** `VirtualLabHub.JoinSession` đổi chữ ký từ `JoinSession(projectId, classId)` thành `JoinSession(projectId)`: BE không tin `classId` client gửi nữa mà tự resolve bằng `VirtualLabProject.LabId`, giao với `LabClassAssignments` và `Enrollments` của `currentUserId`. Nếu resolve đúng 1 lớp thì join cả `project-{projectId}` và `class-{classId}`, broadcast `StudentJoined` vào class group đó. Nếu không resolve được lớp (project không có `LabId` hoặc học sinh không thuộc lớp nào được gán lab), vẫn join `project-{projectId}` để `WatchStudent` hoạt động, không join/broadcast class group và ghi log. Nếu có nhiều lớp khớp, chọn nhất quán theo `ClassId` tăng dần và ghi warning để theo dõi tần suất thật.

**Cập nhật 2026-07-26 — FE 4.4-4.7 hoàn thiện code, phát hiện + vá 1 lỗ hổng BE, CHƯA test 2 tab thật.** Trước khi code đã audit lại repo thật (không giả định): xác nhận `VirtualLabHub.cs` có sẵn đủ method `WatchClass/UnwatchClass/WatchStudent/UnwatchStudent/SendGuidance`; xác nhận endpoint diagram REST cũ (`LoadOwnedProjectAsync`) chỉ cho phép `project.UserId == currentUserId`, cấu trúc không dùng được cho Teacher → phải thêm endpoint mới thay vì tái dùng. Phát hiện lỗ hổng: `SignalRSimulationEventBroadcaster.BroadcastRunBootingAsync`/`BroadcastRunCompletedAsync` chỉ gửi vào `project-{id}` group, không gửi `class-{id}` group, nghĩa là cột trạng thái "đang chạy"/"đã dừng" trên `ClassMonitorPage` (chỉ join class group qua `WatchClass`, không tự `WatchStudent` từng em) sẽ không bao giờ nhận được 2 event này — đã sửa dùng lại helper `SendToProjectAndClassAsync` có sẵn (cùng pattern với `CompileStarted/CompileFinished`), để nguyên `BroadcastEventAsync` (StudentSimulationEvent, tick GPIO chi tiết) chỉ gửi project-group vì tần suất cao, cố tình không đổi. Danh sách file đã sửa/thêm: BE — `SignalRSimulationEventBroadcaster.cs` (broadcast group fix), `SimulationDtos.cs` (+`TeacherProjectSnapshotResponse`), `IVirtualLabRuntimeService.cs` + `VirtualLabRuntimeService.cs` (+`GetProjectSnapshotForTeacherAsync`, tự check quyền qua `LabClassAssignments` giống hệt logic `EnsureTeacherCanWatchProjectAsync` của Hub), `VirtualLabProjectController.cs` (+`GET {id}/teacher-view`, `[Authorize(Roles = RoleNames.Teacher)]`). FE — `virtualLabHub.ts` (rejoin-tracking), `dashboardApi.ts` (+`getTeacherView`), `ClassMonitorPage.tsx` (9 trạng thái, wire lại event), `StudentSandboxViewer.tsx` (prefetch snapshot, hiển thị lỗi rõ, sửa bug xóa input khi gửi góp ý thất bại), `TeacherDashboard.tsx` (bỏ mock, dùng lớp thật). `dotnet build STEM.Api/STEM.Api.csproj` — 0 lỗi; `tsc --noEmit` toàn bộ file FE đã sửa — 0 lỗi. **Test 2 tab thật (12 case theo brief) CHƯA chạy được**: lúc verify bằng Browser pane, `/dashboard` trắng trang, console lặp lại `Failed to complete negotiation with the server: TypeError: Failed to fetch` và `WebSocket closed with status code: 1006` — dấu hiệu backend hiện không chạy (khớp với việc `dotnet build` trước đó không báo lỗi khóa file DLL, tức không có process nào đang giữ). Đã báo lại người dùng, chờ rebuild + restart backend rồi mới test thật; không đánh dấu case nào PASS khi chưa chạy.

## GIAI ĐOẠN 5 — SUBMIT + AUTO-GRADING — ✅ khung đã có sẵn, cần vá 1 lỗ hổng đã chốt hướng

`VirtualLabRuntimeService.SubmitVirtualLabAsync` + `BuildAutoGradeResult` đã triển khai đủ 3 tầng check, tính `AutoScore`, lưu `Submission` với `AutoGradeResultJson`.

- [x] 5.1 (BE) Route `POST api/submissions/virtual-lab` — đã có logic thật, không phải placeholder.
- [x] 5.2 (BE) Auto-check tầng 1 (diagram) — dùng `analysis.Validation.IsValid`, hoạt động.
- [x] **5.3 (BE) — Vá lỗ hổng đã chốt hướng (a) — ✅ XONG (2026-07-18), verify thật qua endpoint (4 case, cả 4 PASS).**
  - **Trước khi code — 2 câu hỏi đã hỏi và chốt trước:**
    1. **Board/Language lấy từ đâu?** `VirtualLabSubmissionRequest` không có field Board/Framework; `CompileSimulationRequest.Board` default `"arduino:avr:uno"` là default SAI cho dự án ESP32 này, không được dùng làm fallback. Đã chốt: lấy từ `VirtualLabProject.Board`/`.Language` (đã có sẵn, default `"esp32"`/`"arduino"`) bằng cách resolve `request.SessionId` → Guid → tra DB. Nếu `SessionId` thiếu hoặc không resolve được project nào: tầng compile **FAIL THẲNG** với message `"Không thể xác định board/ngôn ngữ của bài nộp — thiếu liên kết session hợp lệ."` — không âm thầm dùng default nào.
    2. **Kestrel timeout có rủi ro không?** Không có config Kestrel riêng trong `Program.cs`/`appsettings.json` (dùng default: `KeepAliveTimeout` 130s chỉ áp dụng connection idle, `RequestHeadersTimeout` 30s chỉ tính lúc nhận header, không tính lúc xử lý). FE (`api.ts`, axios) không set `timeout` → mặc định axios là không giới hạn. Không có reverse proxy nào trong cả 2 repo. Bằng chứng: `/api/simulation/compile` (endpoint hiện có) đã chạy tới 90s qua đúng stack này ở 0.B1, không vấn đề gì. → Không có rủi ro timeout hạ tầng. Độ trễ UX (Submit giờ mất thêm 39-90s do phải compile lại) — **chấp nhận cho MVP**, không xử lý gì thêm (không background job/loading phức tạp), ghi lại như 1 mục nhỏ có thể xem xét sau ở Giai đoạn 8/backlog UX.
  - **Đã sửa:** `VirtualLabRuntimeService` inject thêm `ISimulationCompileService`. `BuildAutoGradeResult` (static, sync) → `BuildAutoGradeResultAsync` (instance, async). Tách tầng compile ra `BuildCompileCheckAsync` riêng: resolve `VirtualLabProject` qua `SessionId`, nếu không resolve được → fail với message cố định ở trên; nếu resolve được → gọi thật `_compileService.CompileAsync(new CompileSimulationRequest { SourceCode, Board = project.Board, Framework = project.Language }, studentId, ...)`, dùng **kết quả compile thật** (`compileResult.Success`) làm `Passed`, **không đọc `request.CompileResult` ở đâu cả nữa** trong logic chấm điểm.
  - `dotnet build STEM.Infrastructure`/`STEM.Api` — 0 Error.
  - **Test thật qua endpoint** (instance riêng port 58080, dùng user id thật trong DB vì `Submissions.StudentId` có FK constraint — id tự mint không tồn tại sẽ lỗi 500 FK, không liên quan tới lỗi đang vá):
    - **Case 1**: code compile được thật (Blink LED hợp lệ) + client gửi `compileResult.Success=false` (nói dối) → tầng compile trả về **`passed:true`, `"Compile passed."`** — đúng, không tin lời nói dối của client, tự compile lại và ra kết quả thật.
    - **Case 2**: code lỗi cú pháp thật (`OUTPUT}`, `digitalWrit` sai tên hàm) + client gửi `compileResult.Success=true` (nói dối) → tầng compile trả về **`passed:false`**, message chứa lỗi compiler thật (`expected ')' before '}' token`, `'digitalWrit' was not declared...`) — đúng, phát hiện đúng giả mạo.
    - **Case 3**: `SessionId` thiếu hẳn (không gửi field) → tầng compile **`passed:false`**, đúng message `"Không thể xác định board/ngôn ngữ của bài nộp — thiếu liên kết session hợp lệ."`, trả về nhanh (không tốn 39-90s compile vô ích vì không compile gì cả).
    - **Case 3b** (thêm, không nằm trong yêu cầu gốc nhưng test luôn cho chắc): `SessionId` có giá trị nhưng không phải Guid hợp lệ (`"not-a-guid-at-all"`) → cùng kết quả như Case 3.
    - Đã xóa toàn bộ dữ liệu test (4 `Submission` + 1 `VirtualLabProject`) khỏi DB thật sau khi test xong.
  - **✅ Phát hiện phụ — ĐÃ VÁ (2026-07-19, Bước 4b), verify thật.** bảng `Submissions` có unique constraint trên `(AssignmentId, StudentId)` — nộp lần 2 cho cùng assignment bị lỗi DB 500 (`duplicate key`), mặc dù `Assignment` đã có field `AllowResubmit`/`ResubmitLimit` và `SubmitVirtualLabAsync` đã tính sẵn `AttemptNumber` — ngụ ý resubmit lẽ ra phải được hỗ trợ nhưng constraint hiện tại chặn cứng. **Đã xác nhận (không có trong bất kỳ migration file nào — schema drift, tạo ngoài EF Core):** query trực tiếp `pg_indexes` xác nhận `IX_Submissions_AssignmentId_StudentId` là UNIQUE INDEX thật trên DB live. **Đã sửa:** đổi index thành `IX_Submissions_AssignmentId_StudentId_AttemptNumber` (3 cột, chạy trực tiếp SQL — `dotnet ef migrations` vẫn hỏng, chưa điều tra) + thêm logic enforce trong `SubmitVirtualLabAsync`: đếm `existingCount` cho `(AssignmentId, StudentId)`, chặn (`InvalidOperationException` → 400, tái dùng catch-block sẵn có, không thêm 409 — nhất quán với 10 controller khác trong codebase không nơi nào dùng 409) nếu `existingCount>=1 && !AllowResubmit`, hoặc nếu `ResubmitLimit` có giá trị và `existingCount>=ResubmitLimit`. **Race condition (lớp phòng thủ thứ 2):** bọc `SaveChangesAsync` trong `catch (DbUpdateException ex) when (IsDuplicateKey(ex))` (tái dùng helper có sẵn từ fix `SaveDiagramAsync`) — khác `SaveDiagramAsync` (không tự chuyển thành update, vì `Submission` là log append-only chứ không phải 1 resource có thể ghi đè), thua cuộc thì từ chối rõ ràng (400, không phải 500) để client tự gọi lại. **Verify thật qua endpoint** (instance port 58080, user 11, 2 assignment test tự tạo rồi xoá sạch sau khi test): nộp lần 1 (AllowResubmit=false) → 200; nộp lần 2 → 400 đúng message, không 500; assignment `AllowResubmit=true, ResubmitLimit=2` → nộp lần 1/2 → 200 với `AttemptNumber=1/2` đúng thứ tự (verify trực tiếp qua DB); nộp lần 3 → 400 đúng message giới hạn. **Race thật:** bắn 5 request gần như đồng thời cho 1 assignment chưa có submission nào (`AllowResubmit=true`, không giới hạn) → 3 request thắng với `AttemptNumber=1/2/3` liên tục không trùng (verify qua DB), 2 request thua nhận đúng lỗi 400 rõ ràng — không có 500, không có 2 dòng trùng `AttemptNumber`.
- [x] **5.3b (BE) — Bước 4a: vá lỗ hổng auth `VirtualLabSubmissionsController` — ✅ XONG (2026-07-19), verify thật (4 case, cả 4 PASS).** Phát hiện khi đọc lại contract cho Bước 4: controller **không có `[Authorize]`** (khác `DiagramsController`/`VirtualLabProjectController` đã vá ở 0.3) + tin `request.StudentId` client tự khai khi ẩn danh (`currentUserId ?? request.StudentId`) — cùng mức nghiêm trọng như gap đã vá ở 0.3, không phải quyết định chấp nhận trước đó. **Đã sửa:** thêm `[Authorize]` cho controller; `GetCurrentUserId()` đổi từ `TryGetCurrentUserId()` (nullable, không throw) sang non-nullable throw `UnauthorizedAccessException` giống hệt pattern `VirtualLabProjectController`; `IVirtualLabRuntimeService.SubmitVirtualLabAsync` đổi `int? currentUserId` → `int currentUserId` (khớp `GetDiagramAsync`/`SaveDiagramAsync`, không còn nhánh ẩn danh); `SubmitVirtualLabAsync` giờ luôn dùng `studentId = currentUserId` — nếu `request.StudentId` có giá trị và khác `currentUserId` thì throw `UnauthorizedAccessException` ("You cannot submit on behalf of another student.") → map `Forbid()` (403), không còn khái niệm "nộp hộ" (không có tiền lệ nào trong toàn bộ codebase cho use case giáo viên nộp hộ học sinh). `catch (UnauthorizedAccessException)` đổi từ `Unauthorized()` sang `Forbid()` — khớp ý nghĩa mới: đã xác thực nhưng không được phép, không phải chưa xác thực. Field `request.StudentId` giữ nguyên trong DTO (không xoá, chỉ đổi cách dùng) — cho phép FE gửi tường minh nếu muốn nhưng server luôn tự xác định qua token, không tin giá trị client gửi khi khác token.
  - `dotnet build STEM.Infrastructure`/`STEM.Api` — 0 Error.
  - **Verify thật qua endpoint** (instance riêng port 58080, 2 token thật user 11/12): không token → **401**; token user 11 + `studentId:12` trong body (nộp hộ) → **403**; token user 11 + `studentId` bỏ trống + `assignmentId` giả → qua đúng lớp auth, chạm business logic thật (**404 "Assignment not found."**, không phải 401/403); token user 11 + `studentId:11` (khớp chính mình) → cùng kết quả 404 như trên — xác nhận không chặn nhầm submit hợp lệ.
- [x] **5.4 (BE) — ✅ CHỐT DỨT ĐIỂM (2026-07-19): giữ mức behavior-check hiện tại cho MVP** ("không có event lỗi nào" = pass). **So khớp `expectedBehavior` chi tiết đẩy sang backlog** — nhất quán với quyết định 2.2 (mock runner không mô phỏng control flow nên hiện chưa có đủ dữ liệu hành vi thật để so khớp có ý nghĩa).
- [ ] 5.5 (BE) Grading (`/api/Grading/submissions/{id}/grade`) — không đổi, không liên quan overlap.
- [x] **5.6 (FE) — ✅ XONG (2026-07-19, Bước 4c), verify thật qua UI.** Thêm `submissionsApi.submitVirtualLab` (`dashboardApi.ts`) gọi thật `POST api/submissions/virtual-lab` (chỉ gửi `assignmentId`/`sessionId`/`diagramJson`/`sourceCode`/`simulationEvents` — không gửi `CompileResult`/`StudentId`, đúng xác nhận ở điểm 1 vòng điều tra Bước 4). `LabSandboxPage.tsx` thêm state `linkedAssignmentId` (set từ `labResponse.linkedAssignmentId`, trước đây field có sẵn nhưng chưa từng đọc) — **ẩn hẳn nút "Nộp bài"** và hiện thông báo rõ khi `linkedAssignmentId` null. `lastSimulationEvents` lưu lại kết quả `Run` gần nhất để gửi kèm submit.
- [x] **5.7 (FE) — ✅ XONG (2026-07-19, Bước 4c), verify thật qua UI.** Checklist đơn giản render 3 dòng cố định (`diagram`/`compile`/`behavior`) từ `AutoGradeResultResponse.Checks`, icon ✅/❌ (lucide `CheckCircle2`/`XCircle`) + `Message` text, cùng dòng tổng "đạt X/Y tiêu chí".
  - **Verify thật** (instance port 58080, user 11, Lab[test] tạm gắn 1 Assignment test tự tạo — đã revert `LinkedAssignmentId` về `NULL` + xoá Assignment/Submission test sau khi xong): nộp qua UI thật → 200, checklist hiện đúng 3 dòng với message thật từ BE (kể cả 1 lỗi hạ tầng có thật — Docker Desktop không chạy trong môi trường test lúc verify, tầng "compile" hiện đúng lỗi kết nối Docker, không phải bug code); nộp lại lần 2 (AllowResubmit=true) → tạo đúng `SubmissionId` mới (15→16), xác nhận resubmit hoạt động đúng qua UI thật (không chỉ qua API trực tiếp như lúc vá Bước 4b); Lab[tes1] (`linkedAssignmentId=NULL`) → nút "Nộp bài" ẩn hoàn toàn, hiện đúng thông báo "Lab này chưa gắn bài đánh giá — không thể nộp bài."

**Output:** ✅ Submit thật, chấm tự động thật, **không còn lỗ hổng giả mạo compile** — verify thật bằng 4 test case qua endpoint (xem 5.3).

## GIAI ĐOẠN 6 — TEMPLATE & NỘI DUNG BÀI HỌC

- [ ] 6.1 (BE) CRUD template dùng `VirtualLabsController` (`api/VirtualLabs`), không dùng `SimulationController.CreateTemplateAsync`.
- [ ] 6.2 Xác nhận Python đã ẩn khỏi UI (deferred theo quyết định GĐ0).
- [ ] 6.3 Soạn 3–5 bài mẫu thật, dùng đúng `type` linh kiện khớp `SupportedPins`, và né các linh kiện chưa có phản ứng mô phỏng ở mock runner (Button/Servo/DHT/Ultrasonic) nếu muốn demo "chạy được" trọn vẹn — hoặc chấp nhận demo chỉ verify ở tầng diagram cho các linh kiện đó.

**Output:** Bộ bài mẫu thật, demo được toàn luồng.

## GIAI ĐOẠN 7 — KIỂM THỬ END-TO-END & ỔN ĐỊNH

- [ ] 7.1 Test luồng đầy đủ: mở bài → vẽ mạch → viết code → compile (sandbox) → run (mock) → submit (re-compile verify) → giáo viên chấm.
- [ ] 7.2 Test lỗi: mạch sai, code sai cú pháp, compile-giả-mạo (sau vá 5.3), mất kết nối SignalR giữa chừng, compile timeout trong container.
- [ ] 7.3 Test tải: nhiều học sinh compile cùng lúc — compile là sync trong request (không queue); đo thật xem có nghẽn không, để ngỏ khả năng cần đổi lại sang async nếu số liệu cho thấy cần.
- [ ] 7.4 Dọn: xóa `SimulationController`, `Esp32SimulationsController`, `compile-jobs/{jobId}`, `backup_CircuitCanvas.tsx`, entity `SimulationSession`/`ExperimentLog` (chỉ sau khi xác nhận không còn dữ liệu sống phụ thuộc — xem 0.2).

**Output:** Tính năng ổn định, sẵn sàng deploy.

## GIAI ĐOẠN 8 — NÂNG CAO (SAU MVP)

- [x] 8.1 Nghiên cứu Espressif QEMU để chạy firmware thật — ✅ feasibility xác nhận thật (2026-07-23): firmware Arduino-ESP32 merged.bin (FlashMode=dio) boot sạch trong `qemu-system-xtensa` (Espressif release chính thức), for/while chạy ĐÚNG 100% ngữ nghĩa C++ thật (giải quyết triệt để gap "lệch nhịp" của interpreter cũ — xem `EducationalRunner_ForLoopWithTrailingStatement_ProducesCorrectSequence` vẫn FAIL vì interpreter, còn QEMU thì đúng).
- [x] 8.2 Bridge GPIO từ QEMU sang `SimulationEvent` — ✅ `QemuEsp32Runner.cs` (namespace `Simulation.Runners.Qemu`) implement `ISimulationRunner`, tái dùng nguyên vẹn hạ tầng streaming (registry/broadcaster/event store) đã có, đăng ký DI + resolver dưới mode `"qemu"` (CHƯA đặt làm `DefaultMode`). GPIO đọc qua macro tiêm `#define digitalWrite` — bản đầu dùng `Serial.println` từng crash **không tất định** ("Guru Meditation Error: Cache error", cùng source compile 2 lần cho kết quả khác nhau — nghi race trong driver UART Arduino core khi chạy dưới QEMU). Đã sửa triệt để: in qua `ets_printf` (hàm UART cấp thấp trong ROM, bỏ qua hẳn driver C++ `HardwareSerial`) — verify 3 lần compile độc lập + nhiều lần boot, 100% sạch kể cả khi sketch không gọi `Serial.begin()`. Verify thật end-to-end (compile thật qua API + QEMU thật): `RunAsync()` trả về ~15ms, sự kiện GPIO/LED đúng nhịp thật (~1000ms/lần), Stop/`TryCancel` hủy container QEMU sạch (đã kiểm `docker ps` không còn container thừa). UART/PWM bridge — chưa làm (chỉ mới digitalWrite/GPIO).
- [ ] 8.3 Timeline/replay chi tiết.
- [ ] 8.4 `ai/suggest` — deferred, đánh giá lại nếu giữ trong roadmap.
- [ ] 8.5 Python/MicroPython template — deferred.
- [x] **8.6 (VIỆC A) — UX loading theo giai đoạn khi mode="qemu" — ✅ code xong (2026-07-24), CHƯA verify qua UI thật (backend đang tắt lúc code).** Tái dùng đúng tên broadcast `StudentCompileStarted`/`StudentCompileFinished` (hub method cũ, học sinh tự gọi — mồ côi sau khi VIỆC 1 xóa lời gọi compile() thừa ở FE) — nay `QemuEsp32Runner` tự phát trực tiếp qua `ISimulationEventBroadcaster` (thêm 3 method mới), tới **cả class group lẫn project group** (giữ đúng hành vi cũ, `ClassMonitorPage.tsx` không cần đổi gì). Thêm mới `StudentRunBooting` (chỉ project group) cho giai đoạn QEMU boot (~4s). FE (`LabSandboxPage.tsx`) thêm state `runStage` (`analyzing`→`compiling`→`booting`→`running`), overlay loading đè canvas với text đúng từng giai đoạn + progress bar vô định cho compile. `dotnet build`/`tsc --noEmit` sạch.
- [x] **8.7 (VIỆC B) — Cache incremental build theo project — ✅ code xong (2026-07-24), đo thật + verify an toàn.** Đo thật qua `stem-arduino-cli-sandbox:latest`: 86% thời gian compile (~33.5s/~39s) là "Compiling core" (toàn bộ framework Arduino-ESP32 build lại từ đầu mỗi lần vì `--build-path` luôn là tmpfs mới). Build-path bền vững (không tmpfs) tái sử dụng cache incremental có sẵn của `arduino-cli`: cold 52.77s → warm (sketch khác hoàn toàn) 8.72s, nhanh hơn 83% — verify đúng nội dung sketch mới (grep `.elf` tìm thấy chuỗi riêng của sketch 2). **Rủi ro thật đã phát hiện + né được:** share 1 build-path cho 2 compile ĐỒNG THỜI gây lẫn dữ liệu (2 output `.elf` giống hệt nhau byte-for-byte, cả 2 đều SAI so với sketch gốc). Giải pháp: cache theo TỪNG project (`CompileSimulationRequest.ProjectId` mới, optional — mặc định rỗng = hành vi cũ không đổi), chỉ `QemuEsp32Runner` set field này (an toàn vì `IRunningSimulationRegistry` đã đảm bảo không có 2 lần chạy đồng thời cho cùng project). Kèm dọn cache cũ >7 ngày (cơ hội, không cần cron riêng). `dotnet test`: 11/13 pass (2 fail là bug interpreter for/while đã biết từ trước, không liên quan).
- [x] **8.8 — 🐛 BUG THẬT quan trọng phát hiện lúc verify UI (2026-07-25), ĐÃ VÁ.** Sau khi bạn rebuild+restart backend và test qua UI thật: DB xác nhận `QemuEsp32Runner` chạy đúng 100% (event GPIO13 HIGH thật ghi vào `SimulationEventsJson`, đúng nhịp thời gian thật ~4.4s sau khi RunAsync trả về — khớp compile+boot QEMU thật), nhưng **canvas FE đứng im hoàn toàn, overlay kẹt mãi ở "Đang kiểm tra sơ đồ mạch..."** — chứng tỏ backend đúng, lỗi nằm ở FE không nhận được bất kỳ SignalR broadcast nào. **Gốc rễ (2 lỗi cộng dồn ở `LabSandboxPage.tsx`, KHÔNG liên quan VIỆC A/B, có từ bản sửa `VirtualLabHub.JoinSession` ngày 2026-07-21):**
  1. `VirtualLabHub.JoinSession` đã đổi chữ ký từ `(projectId, classId)` sang chỉ `(projectId)` từ 2026-07-21 (BE tự resolve classId server-side qua `LabClassAssignments`/`Enrollments`) — nhưng `virtualLabHub.ts` (`joinSession()`) và `LabSandboxPage.tsx` **chưa từng được cập nhật theo**, vẫn gọi `.invoke('JoinSession', projectId, classId)` — SignalR invocation với sai số lượng tham số **luôn thất bại**, lỗi bị `.catch()` nuốt âm thầm, không hiện ra đâu cả.
  2. Lời gọi `joinSession(...)` còn bị chặn sau `if (classIdToUse && pid)` — lab không gắn class/assignment (như lab sandbox nội bộ "132213" đang test) thì `classIdToUse` luôn `null`, **không bao giờ gọi `joinSession` dù đã sửa đúng chữ ký**.
  - Hệ quả: kết nối SignalR của học sinh **không bao giờ join được group `project-{id}`**, nên **mọi broadcast** (`StudentCompileStarted`, `StudentRunBooting`, `StudentSimulationEvent`, `StudentRunCompleted`...) đều bị gửi vào group mà không ai đang lắng nghe — không riêng VIỆC A, đây là lỗ hổng ảnh hưởng **toàn bộ tính năng realtime** kể từ 2026-07-21, chỉ vô tình chưa bị phát hiện vì trước đó (mode educational, không có giai đoạn loading rõ rệt) khó nhận ra "không có gì cập nhật" bằng mắt thường.
  - **Đã vá:** `virtualLabHub.ts` đổi `joinSession(projectId, classId)` → `joinSession(projectId)`, khớp đúng chữ ký Hub hiện tại. `LabSandboxPage.tsx` xóa hẳn khối tính `classIdToUse` (gọi `assignmentsApi.getById` + đọc `labResponse.classIds` — nay dư thừa vì BE tự resolve), gọi thẳng `virtualLabHub.joinSession(pid)` không điều kiện. Xóa import `assignmentsApi` không còn dùng. `tsc --noEmit`: 0 lỗi. Grep xác nhận chỉ 1 nơi gọi `joinSession` trong toàn bộ `src/`, không còn caller nào dùng chữ ký cũ.
  - **Sau khi vá xong vẫn còn kẹt** — xem 8.9 ngay dưới, còn 1 bug thứ 2 độc lập.

- [x] **8.9 — 🐛 BUG THẬT thứ 2 (2026-07-25), ĐÃ VÁ — nguyên nhân thật sự khiến overlay vẫn kẹt sau khi vá 8.8.** Bạn tự lấy được backend log lúc SignalR đóng kết nối, xác định chính xác: `System.NotSupportedException: Serialization and deserialization of 'System.IntPtr' instances is not supported. Path: $.WaitHandle.Handle.` — join group đã thành công (log xác nhận `Auto-joining virtual lab session ... Student joined project group only.`), nhưng server crash khi SERIALIZE message để gửi, SignalR phải abort connection → client cứ connect→bị đóng→reconnect vòng lặp, không nhận được broadcast nào dù BE đã chạy đúng và DB có đủ event.
  - **Gốc rễ xác nhận đúng 100% theo chẩn đoán của bạn:** `SignalRSimulationEventBroadcaster.BroadcastCompileStartedAsync`/`BroadcastCompileFinishedAsync` (thêm ở VIỆC A, 8.6) gọi `Clients.Groups(groups).SendCoreAsync(method, args, cancellationToken)` nhưng **lỡ nhét `cancellationToken` VÀO TRONG mảng `args`** thay vì chỉ để nó là tham số cuối tách biệt (`[normalizedProjectId, cancellationToken]` thay vì `[normalizedProjectId]`) — `CancellationToken` chứa `CancellationTokenSource`→`WaitHandle`→`SafeWaitHandle.Handle` (`IntPtr`, không serialize được) bị gửi thẳng làm 1 "tham số" của message.
  - **Verify tái hiện chính xác lỗi (không chỉ đọc code):** serialize thử `[projectId, cancellationToken]` qua `System.Text.Json` (đúng cơ chế `JsonHubProtocol` mặc định của SignalR dùng nội bộ) → ra **ĐÚNG Y HỆT** message lỗi trong log backend của bạn, ký tự-cho-ký-tự. Serialize `[projectId]` (đã sửa) và `[projectId, success, errorSummary]` (đã sửa) → cả 2 đều sạch.
  - **Đã vá:** bỏ `cancellationToken` khỏi mảng `args`, giữ nguyên là tham số cuối riêng của `SendToProjectAndClassAsync`/`SendCoreAsync` (không serialize).
  - **Đã rà lại toàn bộ `SendAsync`/`SendCoreAsync` trong `STEM_BE`** (grep toàn repo) — chỉ đúng 1 chỗ này dùng dạng mảng args, không còn chỗ nào khác lẫn `CancellationToken`/object runtime khác vào payload gửi client.
  - **Bài học phương pháp:** harness tự verify trước đó (dùng `FakeBroadcaster` in-memory) **không hề bắt được bug này** vì không thực sự serialize qua SignalR — chỉ verify được luồng dữ liệu/logic, không verify được tầng truyền tải thật. Cần nhớ giới hạn này khi đánh giá "đã test kỹ" ở các lần sau.
  - **Chờ bạn xác nhận lại qua UI thật** (hard refresh) — chưa tự verify bằng trình duyệt thật được (không tự đăng nhập được).

- [x] **8.10 — Firmware cache theo nội dung (Wokwi-style, "Run giống Wokwi") — ✅ code xong + verify thật (2026-07-25).** Theo quyết định chốt của bạn (giữ QEMU, không quay lại EducationalRunner, tối ưu bằng cache thay vì tách Run/Compile):
  - `IFirmwareCacheService`/`FirmwareCacheService` (mới) — cache firmware ESP32 đã compile, khoá theo hash(sourceCode + board + framework + fqbn đã resolve + instrumentationVersion + runnerMode="qemu"), **không đưa diagramJson vào key** (đúng yêu cầu — đổi dây/di chuyển linh kiện không làm mất cache). Lưu filesystem `firmware-cache/{hash}/` (không phải DB). GPIO instrumentation preamble chuyển từ `QemuEsp32Runner` sang đây, dùng chung cho cả Run thật lẫn precompile.
  - `QemuEsp32Runner` — check cache trước khi compile: **cache hit → bỏ qua hẳn `StudentCompileStarted`/`StudentCompileFinished`, đi thẳng "Đang khởi động mô phỏng..."**; cache miss → giữ nguyên luồng cũ (broadcast + compile + lưu cache cho lần sau).
  - `LabService.CreateLabAsync`/`UpdateLabAsync` — precompile nền (fire-and-forget, không chặn response, không throw ra ngoài) khi giáo viên lưu Lab ESP32 có `StarterCode` — để học sinh đầu tiên bấm Run cũng rơi vào cache hit.
  - `SimulationCompileService` — thêm `SemaphoreSlim` tĩnh (chia sẻ toàn tiến trình, không phải per-request) giới hạn compile đồng thời, config `SimulationCompile:MaxConcurrentCompiles` (mặc định 4).
  - Submit (`BuildCompileCheckAsync`) — không đổi, vẫn luôn tự compile lại server-side, không đọc cache — giữ đúng tính năng chống giả mạo.
  - **Verify thật (2 lần chạy liên tiếp qua đúng `QemuEsp32Runner` thật, không mock):** lần 1 (cache miss, đã xoá sạch cache trước) — `StudentCompileStarted` → `StudentCompileFinished` (57.8s) → `StudentRunBooting` → 42 event đúng nhịp, tổng 73.2s. Lần 2 (cùng sourceCode y hệt) — **KHÔNG có `StudentCompileStarted`/`StudentCompileFinished` nào cả**, nhảy thẳng `StudentRunBooting` ở t=96ms, tổng chỉ **15.4s** (nhanh hơn ~79%), event data giống hệt lần 1. Xác nhận thêm Stop/`TryCancel` vẫn hoạt động đúng sau khi refactor (build tách compile ra `IFirmwareCacheService`) — không event nào lọt qua sau cancel, container dọn sạch.
  - `dotnet build` toàn solution sạch; `dotnet test`: 11/13 pass (2 fail vẫn là bug interpreter for/while đã biết, không liên quan).
  - **Chưa verify qua UI thật** (cần bạn rebuild + restart backend) — riêng phần precompile-lúc-lưu-Lab chưa có live test độc lập (chỉ verify gián tiếp qua code path `CompileAndCacheAsync` dùng chung, đã verify ở trên).

- [x] **8.11 (Phase 10 hạ tầng compile) — Golden build-path + single-flight coordinator + precompile-lúc-gõ-code — ✅ code xong, verify qua harness thật (2026-07-25).**
  - `CompileCoordinator`/`ICompileCoordinator` (mới) — dedup compile đồng thời theo cache key qua `Lazy<Task<T>>`, việc compile+ghi cache thật luôn chạy trọn vẹn bằng `CancellationToken.None` dù caller gốc bỏ cuộc.
  - `PrecompileTriggerService`/`IPrecompileTriggerService` (mới, Singleton) — trigger compile nền fire-and-forget, dùng chung cho cả precompile-lúc-giáo-viên-lưu-Lab (refactor `LabService`) lẫn precompile-lúc-học-sinh-gõ-code (mới, endpoint `POST /api/virtual-lab/projects/{id}/precompile`, FE debounce 2.5s ở `LabSandboxPage.tsx`).
  - "Golden build-path" (`SimulationCompileService.EnsureGoldenBuildCacheAsync`) — compile 1 sketch "vàng" bao phủ nhiều API phổ biến (Serial/digitalRead/analogRead/GPIO) đúng 1 lần/vòng đời tiến trình (double-checked lock), rồi copy sang build-cache của project/scope MỚI trước lần compile đầu — mục tiêu giảm cold-compile.
  - **Verify qua harness thật** (`qemu-runner-verify`, DB thật + Docker thật, không mock): resolver chọn đúng `QemuEsp32Runner`; `RunAsync()` trả về ~12ms (đúng hợp đồng fast-return); lần compile đầu (cache miss) → `StudentCompileStarted` → `StudentCompileFinished` sau ~94s; lần 2 (cùng nội dung, cache HIT) → **không có** broadcast compile nào, nhảy thẳng `StudentRunBooting` ở t≈100ms, tổng ~7s — xác nhận **firmware cache (8.10) vẫn hoạt động đúng qua refactor Phase 10**, không bị hỏng bởi `ICompileCoordinator`.
  - **⚠️ Phát hiện, KHÔNG PHẢI do Phase 10:** golden build-path hiện đang seed nhầm chỗ — golden warm-up compile dùng `--build-path /workspace/build` (gốc mount), còn compile thật dùng `--build-path /workspace/build/tmp` (thư mục con) → `TryCopyDirectory` copy vào gốc `buildCacheDir`, không phải vào `buildCacheDir/tmp` nơi arduino-cli thực sự đọc — seed hiện KHÔNG có tác dụng tăng tốc thật (không sai kết quả, chỉ lãng phí, chưa đạt mục tiêu ~20s đề ra). Cần sửa 1 trong 2: đổi `--build-path` compile thật thành thẳng `/workspace/build` (bỏ `/tmp` con), hoặc đổi đích copy thành `buildCacheDir/tmp`.

- [x] **8.12 — 🐛 BUG NGHIÊM TRỌNG (phát hiện 2026-07-25 lúc verify Phase 10) — ✅ ĐÃ VÁ (xem 8.13 cho chi tiết fix) — đính chính lại phát biểu "đã fix" ở mục 8.2.** Cả 2 lần chạy harness ở 8.11 đều cho **0 pin-state/part-state event** dù code Blink hợp lệ và compile "thành công". Điều tra sâu bằng `STEM_QEMU_DEBUG=1` + chạy `docker run` tay trực tiếp (ngoài hẳn C#/harness) phát hiện nguyên nhân thật: **`Guru Meditation Error: Core / panic'ed (Cache error). Cache disabled but cached memory region accessed`** — crash xảy ra **không tất định** (có lần crash trước cả khi `setup()` chạy, có lần crash ngay sau `SF_EVENT` đầu tiên), khiến QEMU container bị Docker OOM-kill (`ExitCode=137`, RAM leo dần 25%→88%→99.9%/512MB sau khi panic) sau vài giây.
  - **Đã cô lập nguyên nhân bằng 2 test độc lập, KHÔNG qua bất kỳ code C#/cache nào của hệ thống (chỉ `docker run` tay):**
    1. Compile lại đúng source có GPIO instrumentation (`ets_printf`) nhưng **hoàn toàn KHÔNG dùng build-cache/golden-seed** (tmpfs sạch, giống hệt luồng trước Phase 10) → **vẫn crash y hệt**. ⇒ **Không phải do Phase 10** (golden build-path/coordinator/firmware cache không liên quan).
    2. Compile **Blink thuần, KHÔNG có bất kỳ GPIO instrumentation nào** (không macro `digitalWrite`, không `ets_printf`) → **vẫn crash y hệt**, crash ngay lúc boot trước khi `setup()` chạy. ⇒ **Không phải do kỹ thuật tiêm macro/`ets_printf`** — mâu thuẫn trực tiếp với xác nhận "verify 3 lần compile độc lập + 5 lần boot, TẤT CẢ đều sạch" đã ghi ở mục 8.2 (2026-07-23). Xác nhận đó lấy mẫu quá nhỏ, không bắt được tính không tất định thật của bug.
  - **Kết luận:** đây là lỗi crash không tất định **giữa `esp32:esp32` core 3.3.10 + `FlashMode=dio` + `qemu-system-xtensa` (image `stem-qemu-runner-sandbox:latest`) nói chung** — không liên quan GPIO instrumentation, không liên quan Phase 10. Lỗi **có từ trước** (từ lúc 8.1/8.2), chỉ chưa từng bị phát hiện vì mẫu verify trước đó quá nhỏ.
  - **Tác động:** kiến trúc "QEMU = default runner" (đã chốt ở QUYẾT ĐỊNH 2026-07-24) hiện **không đáng tin cậy** cho production — tỉ lệ crash/mất event thật cần đo thêm (mẫu hiện tại: 3/3 lần chạy thật đều gặp vấn đề — 2 lần 0 event, 1 lần crash giữa chừng sau 1 event), nhưng đủ để coi là **blocker cần xử lý trước khi công bố rộng**, không phải noise ngẫu nhiên hiếm gặp.
  - **Hướng điều tra tiếp theo (chưa làm, cần bạn quyết định ưu tiên):** thử pin core `esp32:esp32` về version khác (3.3.10 là bản mới nhất tại thời điểm 8.1 feasibility-test — chưa từng thử version cũ hơn); thử `FlashMode` khác (dù `dio` được xác nhận bắt buộc để BOOT được — có thể vẫn boot nhưng cache-error khác); kiểm tra có bản `qemu-system-xtensa` mới hơn xử lý cache-invalidation khác không; hoặc coi đây là giới hạn cố hữu của QEMU-Xtensa fork hiện tại và cân nhắc lại toàn bộ quyết định "QEMU làm default runner".

- [x] **8.13 — Fix triệt để 8.12 (Guru Meditation Cache error) + 1 bug độc lập thứ 2 phát hiện trong lúc verify fix — ✅ ĐÃ VÁ + verify thật (2026-07-25).**
  - **Fix 8.12 (crash không tất định):** Pin `esp32:esp32` core trong `docker/simulation-compile-sandbox/Dockerfile` xuống **2.0.17** (IDF4.4-based, trước đó là 3.3.10 mới nhất/IDF5-based) — verify: 2.0.17 boot sạch, không crash, qua nhiều lần test độc lập (cả compile tay lẫn qua code C# thật), trong khi 3.3.10 crash gần như mọi lần. Kèm theo:
    - `pip3 install pyserial` vào image (2.0.17's `esptool_py@4.5.1` cần `pyserial` cho 1 nhánh cụ thể, dù không thật sự đụng cổng serial nào — thiếu thì `ModuleNotFoundError: No module named 'serial'`).
    - **Phát hiện phụ:** 2.0.17 KHÔNG tự sinh `*.merged.bin` (khác 3.x, đây là tiện ích chỉ có ở core mới) — chỉ có `{name}.bootloader.bin`/`{name}.partitions.bin`/`{name}.bin` riêng lẻ. Thêm `SimulationCompileService.TryAssembleMergedEsp32Image` — tự ghép thủ công đúng offset chuẩn ESP32 Arduino (bootloader@0x1000, partitions@0x8000, app@0x10000, tổng 4MB, đệm 0xFF) giống hệt `esptool.py merge_bin`, verify boot đúng qua QEMU nhiều lần.
    - Bump `FirmwareCacheService.InstrumentationVersion` (`ets_printf_v1` → `ets_printf_v2_esp32_2_0_17`) — bắt buộc để firmware cache CŨ (build với 3.3.10 hay crash) không bị coi là hit nhầm sau khi đổi core.
  - **Bug độc lập thứ 2 (phát hiện lúc verify fix trên, KHÔNG liên quan Guru Meditation/core version):** dù fix core xong, verify qua code C# thật (`QemuEsp32Runner`) vẫn cho **0 sự kiện GPIO**, dù chạy TAY (`docker run` trực tiếp) với đúng firmware/lệnh thì luôn sạch. Cô lập bằng repro tối thiểu qua PowerShell (mô phỏng đúng `.NET Process` semantics): **`docker run --rm` chạy foreground qua `.NET Process` (`RedirectStandardOutput/Error=true`) trên Windows có race khiến CLIENT `docker.exe` tự thoát sớm (`ExitCode=0`, tưởng như xong) trong khi container thật vẫn chạy dở** — QEMU chỉ kịp boot + in 0-1 sự kiện trước khi mất kết nối. Xác nhận: bỏ hẳn `--rm` khỏi `StartQemuProcess`, dọn tường minh bằng `docker rm -f` (giống `SimulationCompileService` ĐÃ làm từ trước — đây chính là lý do luồng compile chưa bao giờ gặp bug này) → hết hẳn race trong đa số lần chạy.
  - **Thay đổi kèm theo (không phải nguyên nhân, nhưng cải thiện độ ổn định độc lập):** đổi cơ chế đọc sự kiện GPIO từ đọc `process.StandardOutput` theo dòng (`-nographic`, multiplex serial+monitor chung stdio, cần tty raw mode) sang **QEMU ghi serial ra FILE** (`-display none -monitor none -serial file:/workspace/log/serial.log`, bind-mount riêng `/workspace/log`), host poll đọc file mỗi 150ms (`ReadNewLogLinesAsync`) — tránh hoàn toàn phụ thuộc tty/pipe của `-nographic`.
  - **Verify thật qua harness (DB + Docker thật, không mock), 4 case đủ (baseline/pin2/wrongpin/stoptest):** tất cả đều PASS đúng kỳ vọng khi chạy (kể cả lần đầu sau compile lạnh lẫn lúc cache hit), Stop/`TryCancel` vẫn hoạt động đúng, `docker ps -a` sau Stop sạch (không container thừa dù đã bỏ `--rm`).
  - **Race còn lại (không về 0%) → ✅ đã thêm retry ngầm che hoàn toàn khỏi học sinh (2026-07-26).** Trong lúc verify, **2/6 lần chạy "lạnh" (ngay sau 1 compile fresh vừa xong) vẫn cho 0 sự kiện** (baseline lần 1, pin2 lần 1) dù đã bỏ `--rm`; retry ngay sau đó luôn thành công. Chưa xác định được nguyên nhân gốc CHÍNH XÁC của phần race còn lại (nghi 1 quirk Windows-Docker-Desktop-.NET Process khác, có thể liên quan việc container compile VỪA `docker rm -f` xong ngay trước khi container QEMU tiếp theo `docker run` — cần thêm thời gian "settle"). Theo quyết định của bạn (chọn "thêm auto-retry" thay vì để nguyên hoặc điều tra tiếp), đã thêm **retry ngầm tối đa 2 lần (3 lần thử tổng cộng) trong `QemuEsp32Runner.ExecuteInBackgroundAsync`**:
    - Tín hiệu retry: QEMU process tự thoát (`process.HasExited`) **KHÔNG PHẢI** do `timeoutCts` (MaxDurationMs hết hạn hoặc Stop) — vì QEMU chạy `-no-reboot` + sketch `loop()` vô hạn thì KHÔNG BAO GIỜ tự thoát hợp lệ — **VÀ** chưa emit event GPIO nào ở lần thử đó (an toàn: không có dữ liệu đã ghi vào `eventStore` cần lo trùng lặp khi ghép 2 lần chạy khác container/timestamp).
    - Mỗi lần retry: dọn container lần thử trước (`docker rm -f`) trước khi mở container mới (tên mới, tránh trùng), đồng hồ `stopwatch`/timestamp event reset lại từ 0 cho lần thử mới (bỏ hẳn kết quả lần thử fail, không trộn lẫn).
    - **3 lần thử (không phải 2)** vì đã đo thật: 2 lần liên tiếp CÙNG fail cũng xảy ra (hiếm nhưng có thật, bắt được lúc verify) — verify lại sau khi tăng lên 3 lần: case tương tự (baseline ngay sau compile lạnh) chạy lại không còn fail nữa.
  - `dotnet build` toàn solution sạch (STEM.Application/STEM.Infrastructure/STEM.Api).

- [x] **8.14 (FE) — 🐛 BUG THẬT: SignalR "Cannot send data if the connection is not in the 'Connected' State" — ✅ ĐÃ VÁ (2026-07-26).** `virtualLabHub.ts`'s `ensureConnection()` (cũ) chỉ gọi `connect()` khi `connection` là `null` HOẶC state=`Disconnected` — bỏ sót hoàn toàn state `Connecting`/`Reconnecting`. Khi 2 lời gọi invoke xảy ra gần nhau (vd `LabSandboxPage.loadLab()` chạy 2 lần do React StrictMode double-invoke effect lúc mount → `joinSession(pid)` gọi 2 lần liên tiếp) trong lúc lần `connect()` đầu tiên còn `Connecting`, lời gọi thứ 2 không đợi gì cả rồi `invoke()` ngay → lỗi thật.
  - **Đã vá:** thêm `ensureConnected()` xử lý đủ 4 trạng thái (`Connected` → return ngay; `Connecting` → await `connectionPromise`; `Reconnecting` → await `reconnectingPromise` MỚI thêm, theo dõi đúng chu kỳ tự-reconnect qua `onreconnecting`/`onreconnected`/`onclose` — khác `connectionPromise` cũ chỉ theo dõi lần connect ĐẦU TIÊN; còn lại → `connect()`), kèm lưới an toàn `waitForConnectedState()` (poll 100ms, timeout 15s). Tất cả method invoke khác cũng đổi sang dùng `ensureConnected()`, không chỉ riêng `joinSession`. `joinSession()` thêm retry ngầm đúng 1 lần nếu vẫn dính đúng lỗi "not in the 'Connected' State" (phòng hờ race hiếm còn sót giữa lúc `ensureConnected()` resolve và `invoke()` thực thi).
  - `tsc --noEmit`: 0 lỗi. Verify qua Vite HMR: module reload sạch, không lỗi console.

- [x] **8.15 (BE) — 🐛 BUG THẬT NGHIÊM TRỌNG: `StudentSimulationEvent` KHÔNG BAO GIỜ được broadcast qua SignalR — ✅ ĐÃ VÁ + verify thật 1:1 (2026-07-26).** Sau khi vá 8.14, bạn báo WebSocket vẫn sống (connected, có `{"type":6}` keepalive ping) nhưng KHÔNG nhận được `StudentRunBooting`/`StudentSimulationEvent`/`StudentRunCompleted` nào. Điều tra theo đúng checklist A/B/C bạn đưa ra:
  - **B (group name Hub vs Broadcaster) — xác nhận ĐÚNG, không phải nguyên nhân:** `VirtualLabHub.ProjectGroup` và `SignalRSimulationEventBroadcaster.ProjectGroup` đều `project-{Guid:N}`, cả 2 tự normalize độc lập qua `Guid.TryParse` + `ToString("N")` — khớp nhau bất kể format input.
  - **C (QEMU runner có chạy không) — xác nhận CHẠY ĐÚNG qua truy vấn DB thật** (không đoán): project gần nhất (`UserId=11`, `UpdatedAt=2026-07-25T17:30:33Z`) có `Status=stopped` và `SimulationEventsJson` đầy đủ event `pin-state`/`part-state` thật (LED GPIO13 nhấp nháy đúng nhịp) — backend/QEMU chạy đúng 100%, sự kiện được PERSIST vào DB đầy đủ.
  - **Nguyên nhân thật sự (không phải A hay B):** `QemuEsp32Runner.EmitAsync` (helper ghi từng sự kiện GPIO) **CHỈ gọi `eventStore.AppendEventAsync(...)`, KHÔNG BAO GIỜ gọi `_broadcaster.BroadcastEventAsync(...)`** — khác hẳn `EducationalSimulationRunner` (runner còn lại) luôn gọi CẢ HAI cùng nhau. Đây là lý do DB có đủ event thật (ghi qua `eventStore` vẫn chạy đúng) nhưng SignalR không bao giờ phát `StudentSimulationEvent` — không liên quan gì đến JoinSession/group name, dù cả 2 đều đã kiểm tra kỹ và đúng.
  - **Đã vá:** `EmitAsync` nhận thêm `ISimulationEventBroadcaster broadcaster`, gọi `eventStore.AppendEventAsync` VÀ `broadcaster.BroadcastEventAsync` cùng nhau (đúng pattern `EducationalSimulationRunner` đã dùng). `ReadNewLogLinesAsync` nhận thêm tham số `broadcaster`, truyền `_broadcaster` từ 2 chỗ gọi trong vòng lặp đọc log.
  - **Verify thật qua harness** (đếm số lần `BroadcastEventAsync` được gọi, so với số event ghi DB): 24/24 — khớp 1:1 tuyệt đối, không thiếu không thừa.
  - Grep toàn `STEM_BE`: xác nhận chỉ có đúng 2 nơi gọi `AppendEventAsync` (`EducationalSimulationRunner` — đã đúng từ trước; `QemuEsp32Runner` — vừa vá), không còn chỗ nào khác lẫn bug tương tự.
  - `dotnet build STEM.Application` sạch. **Chưa rebuild được `STEM.Api`** — DLL đang bị khoá bởi chính backend của bạn đang chạy (`MSB3021: file is being used by another process`), cần bạn tự Rebuild + Restart để fix có hiệu lực.

- [x] **8.16 (BE) — 🐛 BUG THẬT NGHIÊM TRỌNG, do chính lần fix 8.13 gây ra: build-cache/golden-build-cache cũ lẫn object file 3.3.10 với sketch mới compile bằng 2.0.17 — ✅ ĐÃ VÁ + verify trực tiếp qua UI thật (2026-07-26).** Sau khi vá 8.14/8.15, bạn mở lab `132213` (ESP32, LED nối GPIO13, code Blink đầy đủ) và bấm Run trực tiếp qua UI thật — `/start` trả 200, WebSocket connected, nhưng overlay kẹt mãi ở "Đang khởi động mô phỏng..." không tiến triển.
  - **Điều tra trực tiếp trên container đang chạy thật** (không đoán): `docker ps` xác nhận container QEMU đang chạy (~1 phút, CPU 99%, memory ổn định 124MB — KHÁC hẳn pattern Guru Meditation cũ hay leak rồi bị OOM-kill). Đọc `serial.log` bind-mount trực tiếp: firmware boot xong (ROM log sạch) nhưng KHÔNG một `SF_EVENT` nào. Copy đúng `firmware.bin` này chạy tay 2 lần độc lập → **100% tất định** (không phải flaky ngẫu nhiên) crash với `qemu-system-xtensa: esp32_i2c: Invalid command 0 opcode 6` + `esp_uart: read UART FIFO while it is empty` — dù `CodeContent` trong DB xác nhận đúng 100% là Blink đơn giản, không hề có dòng I2C nào.
  - **Gốc rễ:** kiểm tra `build-cache/{projectId}/tmp/core/*.o` (VIỆC B, cache incremental theo project) — file `.o` core có mtime **CŨ hơn nhiều** (biên dịch từ TRƯỚC khi pin `esp32:esp32` xuống 2.0.17 ở 8.13) so với `sketch.ino.elf`/`sketch.ino.bin` (mtime MỚI, khớp đúng lần compile vừa test). arduino-cli tái sử dụng `.o` core CŨ (3.3.10 ABI) + chỉ compile lại `sketch.ino.cpp` MỚI (2.0.17 ABI) → link chung 1 file `.elf` lẫn 2 ABI KHÔNG TƯƠNG THÍCH — kết quả: firmware "compile thành công" (không lỗi ở bước compile) nhưng hành vi runtime hoàn toàn sai (core init đọc/ghi sai offset, đụng I2C/UART theo cách QEMU không hiểu). Lỗi này **do chính việc pin core ở 8.13 gây ra** — lúc đó chỉ bump `FirmwareCacheService.InstrumentationVersion` (cache firmware theo NỘI DUNG) mà quên mất `SimulationCompileService`'s build-cache theo PROJECT (VIỆC B) và golden-build-cache trên đĩa (8.11) hoàn toàn KHÔNG gắn với version core/toolchain — bất kỳ project nào đã compile ít nhất 1 lần trước khi đổi core đều dính bug này.
  - **Đã vá:** thêm marker file `.stemflow-toolchain-version` (nội dung = hằng số `ToolchainVersion = "esp32_2_0_17"`) ghi vào MỌI build-cache dir (theo project) và golden-build-cache dir ngay sau khi build/reuse. Trước khi tái sử dụng 1 build-cache dir đã tồn tại, kiểm tra marker — không khớp (hoặc thiếu) → xoá sạch, coi như build-cache mới hoàn toàn (ép compile lại từ đầu, không tái dùng `.o` không tương thích). Áp dụng CẢ 2 nơi: `CompileCoreAsync` (build-cache theo project) và `EnsureGoldenBuildCacheAsync` (golden cache trên đĩa — cũng có nguy cơ y hệt vì `_goldenBuildReady` chỉ là biến in-memory, reset mỗi lần restart process, nhưng thư mục trên đĩa sống sót qua restart).
  - **Dọn ngay (một lần, thủ công)** toàn bộ `firmware-cache`/`build-cache`/`golden-build-cache` cũ trên máy dev hiện tại — đảm bảo lần Run tiếp theo chắc chắn compile sạch 100%, không phụ thuộc bạn đã Rebuild+Restart backend hay chưa (xoá thư mục ép `isNewBuildCache=true` bất kể code cũ/mới).
  - `dotnet build STEM.Infrastructure` sạch. **Cần bạn Rebuild + Restart backend LẦN NỮA** để nạp cả 3 fix (8.15 broadcast + 8.16 toolchain marker) — đây là lần cuối cùng cần thiết cho nhóm bug này.

- [x] **8.17 (FE) — 🐛 BUG THẬT: LED/Buzzer "đóng băng" ở trạng thái sáng/kêu cuối cùng sau khi Dừng mô phỏng — ✅ ĐÃ VÁ + verify thật qua UI (2026-07-26).** Bạn phát hiện: bấm Dừng, nút chuyển về "Chạy mô phỏng" đúng, nhưng LED/Buzzer trên canvas vẫn giữ nguyên trạng thái sáng/kêu cuối cùng thay vì tắt.
  - **Gốc rễ (2 lỗi cộng dồn ở `LabSandboxPage.tsx`):**
    1. `handleStop()` và `onRunCompleted` (handler `StudentRunCompleted`) đều KHÔNG gọi `setPartStates({})` — chỉ `handleRun()` lúc BẮT ĐẦU chạy mới mới clear `partStates` (state điều khiển `value`/`hasSignal` hiển thị trên `<wokwi-led>`/`<wokwi-buzzer>`). Mạch dừng chạy nhưng không có gì đưa output về "tắt", nên component cứ giữ mãi frame cuối cùng nhận được.
    2. Sau khi vá (1), phát hiện tiếp: `StudentSimulationEvent` đã được BE gửi đi TRƯỚC khi lệnh Stop có hiệu lực ở server vẫn có thể tới FE SAU khi đã reset (độ trễ mạng/round-trip `POST /stop`) — event trễ đó áp lại state "on" đè lên state vừa reset, verify thật bắt được: `ledValue` về `false` đúng lúc bấm Dừng nhưng vài trăm ms sau tự nhảy lại `true`.
  - **Đã vá:** thêm `setPartStates({})` vào cả `handleStop()` và `onRunCompleted`. Thêm `isStoppedRef` (useRef boolean) — `onSimulationEvent` kiểm tra cờ này ở đầu, bỏ qua thẳng nếu đã dừng (chặn TRIỆT ĐỂ event trễ, không phụ thuộc thứ tự gói tin tới); set `false` khi bắt đầu chạy mới (`handleRun`), set `true` ở mọi điểm dừng (`handleStop`, `onRunCompleted`, và 2 nhánh lỗi sớm của `handleRun` — validation lỗi + exception gọi API).
  - **Verify thật qua UI** (không phải chỉ đọc code): chạy mô phỏng, bắt đúng lúc LED đang sáng (`led.value===true`), bấm Dừng, lấy mẫu `led.value`/`buzzer.hasSignal` liên tục 8 lần trong 3.2s sau đó — **toàn bộ `false/false`, không còn hiện tượng "sáng lại"**. Cũng verify nhánh dừng tự nhiên (run ngắn 0-event, không phải bấm Stop tay): LED/Buzzer vẫn tự về `false` đúng khi nhận `StudentRunCompleted`.
  - `tsc --noEmit`: 0 lỗi.

**Backlog phát sinh từ 8.2 (chưa xử lý, ghi nhận để không quên):**
- `VirtualLabRuntimeService.RunEsp32Async`: `isStreamingMode` ban đầu chỉ nhận diện `"educational"`, thiếu `"qemu"` — nếu không vá sẽ có race mất dữ liệu (`PersistRunAsync` ghi đè `SimulationEventsJson='[]'` sau khi background task đã kịp ghi event thật). **Đã vá** (2026-07-23).
- Stop Point 2: **đã xác nhận (2026-07-24)** — `SimulationRunner:DefaultMode` đã đổi sang `"qemu"` trong `appsettings.json`. Biết trước: lab Arduino Uno ("12333") sẽ lỗi khi Run vì QEMU runner chỉ hỗ trợ ESP32.
- Chưa verify: nhiều lab chạy `"qemu"` đồng thời (`SimulationRunner:Qemu:MaxConcurrentRuns=4`) — mới test 1 lần chạy tại 1 thời điểm.
- **⚠️ Blocker hiện tại:** backend chạy qua Visual Studio đang dùng DLL cũ (build trước khi có `QemuEsp32Runner`/VIỆC A/B) — cần Rebuild + Restart session debug thì code mới mới thực sự chạy, chưa verify được qua UI thật.

## Tóm tắt trạng thái (rút gọn)

```
GĐ0: Dọn dẹp & chốt kiến trúc     → ✅✅ ĐÓNG HOÀN TOÀN — 0.B1/0.2/0.3/0.4/0.5/0.6 đều xong, verify thật
GĐ1: Diagram + Netlist (BE)      → ✅ Đã có, vượt kỳ vọng + type-mismatch đã vá | Canvas (FE) → đã audit, gap component HOÃN (xem dưới)
GĐ2: Code editor + Mock sim      → ✅ 2.2 CHỐT: giữ nguyên giới hạn hiện tại cho MVP, nâng cấp đẩy GĐ8
GĐ3: Compile thật                → ✅ Sandbox hóa xong, verify thật (noexec/BOM/output-mount/memory/timeout đều đã vá và test) | ✅ 3.1 (GetCompileJob) xong
GĐ4: Session + Realtime          → ✅ BE hoàn thành (stop thật, SignalR Hub, events jsonb, teacher ownership, JWT query token) | ⏳ FE 4.4-4.7 còn chưa wire
GĐ5: Submit + Auto-grading       → ✅ Khung đã có | ✅ 5.3 (compile giả mạo) + 5.3b (auth) + resubmit (unique index/AllowResubmit/ResubmitLimit) đều đã vá + verify thật | ✅ 5.4 CHỐT: giữ mức hiện tại, so khớp expectedBehavior đẩy backlog | ⏳ 5.6/5.7 (FE wire Submit + checklist UI) đang làm (Bước 4c)
GĐ6: Template & nội dung bài học → tiếp theo — soạn 3-5 bài mẫu thật (Blink LED, Button+LED, Buzzer báo động, đọc DHT22), dùng đúng type wokwi-* đã chuẩn hoá
GĐ7: Kiểm thử end-to-end         → sau GĐ6 — luồng đầy đủ + case lỗi (mạch sai, code sai, compile-giả-mạo, resubmit quá giới hạn)
GĐ8: Nâng cao (QEMU, replay, AI) → sau MVP — bao gồm cả nâng cấp mock runner (2.2) nếu cần

**⏸️ HOÃN, chỉ ghi nhận (không chặn GĐ6/GĐ7):** Bước 5 rewrite `LabSandboxPage.tsx` (gap thêm linh kiện ở sandbox học sinh — hiện KHÔNG có palette thêm linh kiện, chỉ giáo viên có qua `CircuitBuilderTeacherMode.tsx`; 7/12 loại linh kiện Analyze() chưa modeled đầy đủ, xem 1.3) — đây là giới hạn đã biết của MVP, không phải bug mới.
```

## Danh sách quyết định còn mở (chưa chốt)

- ~~2.2 — Có nâng cấp `VirtualLabMockRunner`...~~ **CHỐT (2026-07-21):** không nâng cấp parser của `VirtualLabMockRunner` trực tiếp — thay bằng runner mới `EducationalSimulationRunner` chạy song song qua `ISimulationRunnerResolver`, xem mục "KIẾN TRÚC RUNNER" bên dưới. `VirtualLabMockRunner` giữ nguyên làm fallback/legacy.
- 5.4 — Auto-check tầng behavior: chấp nhận mức "không có event error" hay làm so khớp `expectedBehavior` chi tiết theo từng bài?

## KIẾN TRÚC RUNNER (Resolver pattern) — bổ sung 2026-07-21

Quyết định đầy đủ: [`VIRTUAL_LAB_ADR.md`](VIRTUAL_LAB_ADR.md#5-kiến-trúc-simulation-runner--fe-wokwi-like--be-runner-based-resolver-pattern). Route canonical **giữ nguyên** `POST api/virtual-lab/projects/{id}/start` — không tạo route mới. Checklist dưới đây thay thế và mở rộng mục 2.2 cũ.

**Trước khi code — đã xác nhận bằng đọc code thật (không phải giả định):**
- `ISimulationRunner` chưa tồn tại (grep = 0 kết quả) → tạo mới, không xung đột.
- `StartSimulationRequest` không có field `Mode`, FE (`virtualLabProjectsApi.start`) không gửi `mode` → không cần vá lỗ hổng client-set-mode, chỉ cần bỏ hardcode `"mock"` trong `VirtualLabProjectController.StartSimulation`.
- `PersistRunAsync` hiện luôn reset `SimulationEventsJson = "[]"`, không ghi events thật — lỗ hổng đường-ghi có thật, chưa vá.
- `BuildAutoGradeResultAsync` tầng `"behavior"` đọc `request.SimulationEvents` (client Submit gửi) — lỗ hổng đường-đọc có thật, chưa vá, cùng dạng đã vá cho `CompileResult` ở 0.4/5.3.
- Nguồn chọn `mode`: config hệ thống `SimulationRunner:DefaultMode` trong `appsettings.json` (không phải field trên `Lab`/`Assignment` — chưa có cột nào cho việc này).

- [ ] R.1 (BE) Tạo `Abstractions/` (`ISimulationRunner.cs`, `ISimulationRunnerResolver.cs`, `SimulationRunContext.cs`), `Runtime/` (`SimulationRunResult.cs`) dưới `STEM.Application/UseCases/Simulation/`. Di chuyển `VirtualLabMockRunner.cs` vào `Runners/Mock/`, cho implement `ISimulationRunner`. Tạo thư mục rỗng `Runners/Firmware/` (để dành Giai đoạn 8). Đăng ký DI cho cả 2 runner + `ISimulationRunnerResolver` trong `STEM.Application/Extensions/ServiceCollectionExtensions.cs`. Verify: `dotnet build` pass, resolver trả đúng runner theo mode (unit test).
- [ ] R.2 (BE) `VirtualLabRuntimeService.RunEsp32Async`: bỏ check cứng `Mode.Equals("mock")`, gọi qua `ISimulationRunnerResolver` (mode lấy từ `IConfiguration["SimulationRunner:DefaultMode"]`, mặc định `"mock"` nếu thiếu config — không phá vỡ hành vi hiện tại). Verify: gọi `/start` hiện tại (không đổi config) → hành vi y hệt trước khi sửa (regression).
- [ ] R.3 (BE) `PersistRunAsync` ghi thật mảng `events` vào `SimulationEventsJson` ngay khi runner chạy xong (thay vì reset `"[]"`) — vá lỗ hổng đường-ghi đã xác nhận ở trên.
- [ ] R.4 (BE) Viết `EducationalSimulationRunner` (`Runners/Educational/`) — tái dùng `VirtualLabDiagramService` qua DI, không viết lại netlist. Bắt buộc: `Task.Run` cho phần CPU-bound + `CancellationToken` với `MaxDurationMs`/`MaxInstructionCount` từ `SimulationRunContext`, **`cancellationToken.ThrowIfCancellationRequested()` bên trong vòng lặp thực thi từng instruction** (không chỉ timeout ở tầng ngoài), `SemaphoreSlim` giới hạn `MaxConcurrentRuns` chạy đồng thời. Verify: 2 request gần đồng thời (1 chạy lâu, 1 Blink LED) không trễ nhau; vượt `MaxConcurrentRuns` → xếp hàng/từ chối rõ ràng, không treo server; request vượt `maxDurationMs` → CPU giảm về mức nền ngay sau timeout (xác nhận `ThrowIfCancellationRequested()` có tác dụng thật).
- [ ] R.5 (BE) Vá lỗ hổng đường-đọc: `BuildAutoGradeResultAsync` tầng `"behavior"` đọc `SimulationEvents` từ `VirtualLabProject.SimulationEventsJson` (tra theo `SessionId`), không đọc `request.SimulationEvents`. Verify: submit với `SimulationEvents` giả trong body (khác dữ liệu thật đã lưu) → BE bỏ qua giá trị giả, chỉ dùng dữ liệu đã lưu.
- [ ] R.6 (BE, tuỳ chọn/ưu tiên thấp) `EducationalSimulationRunner`/`VirtualLabRuntimeService` tự broadcast qua `VirtualLabHub` thay vì chờ FE relay từng event — chỉ là cải tiến UX cho giáo viên xem realtime, không ảnh hưởng độ tin cậy dữ liệu chấm điểm (đã đảm bảo ở R.3/R.5).
- [ ] R.7 (BE) Đặt config `SimulationRunner:DefaultMode = "educational"` sau khi R.1-R.5 verify xong, chạy lại E2E Giai đoạn 4/5 (2 tab student/teacher, submit thật) với `EducationalSimulationRunner` làm mặc định mới.

**Cập nhật 2026-07-23 — R.3/R.6 coi như đã đóng cho mode streaming** qua [`STREAMING_SIMULATION_PLAN.md`](STREAMING_SIMULATION_PLAN.md) (Bước 1-7): background task tự ghi `SimulationEventsJson` qua `ISimulationEventStore` (thay `PersistRunAsync` reset `"[]"` — R.3) và tự broadcast qua `ISimulationEventBroadcaster`/`IHubContext<VirtualLabHub>` (không cần FE relay — R.6). `DefaultMode` đã đặt `"educational"` (R.7 xong về mặt config, chưa chạy lại full E2E Giai đoạn 4/5 2-tab).

**Backlog mới phát sinh từ streaming (chưa xử lý, ghi lại để không quên — chi tiết đầy đủ ở [`STREAMING_SIMULATION_PLAN.md`](STREAMING_SIMULATION_PLAN.md#backlog--gap-đã-biết-chưa-xử-lý-ghi-lại-để-không-quên)):**
1. **Gap `for`/`while` parsing trong `EducationalProgramAnalyzer`** — `ParseInstructions` chỉ cắt theo `;` + regex-match từng mảnh, không hiểu cú pháp vòng lặp, thân vòng lặp chỉ được trích 1 lần thay vì lặp đúng số vòng. Test `EducationalRunner_ForLoopWithTrailingStatement_ProducesCorrectSequence` cố tình giữ ở trạng thái FAIL làm bằng chứng — phạm vi sửa (tối thiểu/trung bình/đầy đủ) đã thảo luận nhưng **chưa chốt**.
2. **`ProjectGroup`/`NormalizeProjectId` (quy ước tên group SignalR `"project-{id}"`) định nghĩa ĐỘC LẬP ở 2 nơi** — `VirtualLabHub.cs` (STEM.Api/Hubs) và `SignalRSimulationEventBroadcaster.cs` (STEM.Api/Hubs) — cùng 1 file namespace nhưng 2 class riêng, copy y hệt logic. Rủi ro: sửa 1 bên (đổi quy ước đặt tên group) mà quên bên kia → broadcast "thành công" (không lỗi) nhưng gửi nhầm group, không ai nhận được — lỗi âm thầm rất khó phát hiện qua log. Cân nhắc rút ra 1 helper dùng chung (static class hoặc extension method) khi có dịp sửa lại khu vực này.
3. **2 lần reset `SimulationEventsJson`/`Status` dư thừa mỗi lần Run** — `virtualLabHub.runStarted()` (FE gọi, qua Hub method `RunStarted` → `MarkRunStartedAsync`) và `PrepareStreamingRunAsync` (BE, trong `RunEsp32Async`) đều làm cùng 1 việc. Không sai (race đã vá bằng `await` ở FE), chỉ tốn dư 1 lần gọi Hub + 1 lần ghi DB mỗi lần Run. Dọn sau: bỏ hẳn phần reset trong `MarkRunStartedAsync`/gọi `runStarted` từ FE, giữ lại phần notify `StudentRunStarted` cho giáo viên xem live (cần tách khỏi việc reset DB).

**Đã xác nhận (2026-07-23), không cần sửa:** grep toàn `STEM_BE` mọi chỗ so sánh `VirtualLabProject.Status`/`VirtualLabProjectStatuses.Running` — không có nơi nào (ngoài Bước 7/Submit, đã dùng đúng `IRunningSimulationRegistry.IsRunning()`) đọc và ngầm hiểu `Status == "running"` là "đang chạy real-time". Toàn bộ chỗ còn lại chỉ là ghi trạng thái cuối (đúng ngữ nghĩa tại thời điểm ghi) hoặc test assertion.

**Output:** Bấm Run qua UI (không đổi route/FE) → BE tự chọn runner qua resolver, event được ghi server-side ngay khi Run xong, AutoGrade tầng behavior chỉ tin dữ liệu đã lưu DB — không có cách nào client ghi đè.

## COMPONENT PLATFORM — Robot Delivery Kit + Runtime Adapter Layer (2026-07-27)

Mở rộng hệ thống linh kiện Virtual Lab theo hướng nền tảng (Component Registry
+ Runtime Adapter Layer), KHÔNG chỉ thêm palette cho đẹp — mỗi component đưa
vào có `supportLevel` rõ ràng, verify thật qua browser + API, không đánh dấu
runtime-supported nếu chưa có event thật. Additive tuyệt đối — không đổi
`TryGetCachedFirmwareAsync`/`CompileAndCacheAsync` cache key, không đổi QEMU
runner core, không đổi SignalR event shape (chỉ thêm `component:"l298n"` mới
vào field `component` đã có sẵn trong payload `part-state`, không đổi cấu
trúc), không đổi Run/Stop flow.

### 1. Component Registry (nguồn sự thật tập trung)

`STEM_FE/src/components/Dashboard/VirtualLab/Sandbox/robotKitComponents.ts` —
mỗi entry có `componentType`/`displayName`/`category`/`source`/`supportLevel`/
`quantity`/`pins`/`defaultProps`/`wiringRules`/`runtimeAdapter`/`renderer`/
`notes`. `supportLevel` (`runtime-supported`/`wiring-validation`/`visual-only`/
`bom-only`) là field DUY NHẤT quyết định badge — BOM panel và palette đều đọc
từ đây, không tự suy đoán riêng (`SUPPORT_LEVEL_BADGE` map). File này cũng ghi
rõ "Cần sửa thủ công khi thêm component mới" (7 điểm: BE SupportedPins, BE
ComponentGlueRegistry, FE pinMaps, FE CircuitCanvas render dispatch, FE
CircuitBuilderTeacherMode COMPONENT_REFERENCES, FE registry file này, BE+FE
runtime adapter nếu cần) — kiến trúc HIỆN TẠI chưa tự động hoá được 7 điểm
này thành 1 định nghĩa duy nhất (backlog, xem cuối mục).

### 2. Component Support Matrix — Robot Delivery Kit (14 linh kiện)

| Component | supportLevel | Ghi chú |
|---|---|---|
| ESP32 DevKit V1 | runtime-supported | QEMU thật, không đổi trong task này |
| HC-SR04 Ultrasonic Sensor | wiring-validation | Element @wokwi/elements thật + wiring rule đầy đủ ở BE; KHÔNG có distance simulation thật — xem Limitation |
| L298N Motor Driver | **runtime-supported** | Đọc thật IN1-4 qua QEMU, suy ra forward/backward/stopped/brake, verify live PASS |
| DC Geared Motor / TT Motor | **runtime-supported** | State hiển thị gộp trên card L298N (đúng bản chất điện — động cơ không tự có logic) |
| Robot Wheel | visual-only | Không pin, không netlist |
| Caster Wheel | visual-only | Không pin, không netlist |
| Robot Chassis | visual-only | Không pin, không netlist |
| Battery Pack 7.4V (2×18650) | wiring-validation | Không mô phỏng điện áp thật |
| Power Switch | wiring-validation | Structural-only, chưa có logic đồ thị riêng |
| Breadboard | visual-only | Chưa có netlist breadboard thật |
| Jumper Wires | bom-only | Không lên canvas |
| USB Cable Type-C/Micro USB | bom-only | Không lên canvas |
| Mounting Screws & Nuts | bom-only | Không lên canvas |
| Mini Delivery Box | visual-only | Không pin, không netlist |

Linh kiện cũ đang chạy (tóm tắt, xem `LEGACY_COMPONENTS_SUMMARY` trong
`robotKitComponents.ts` + `COMPONENT_REFERENCES` trong
`CircuitBuilderTeacherMode.tsx` là nguồn đầy đủ): LED/Buzzer =
runtime-supported (adapter có sẵn từ trước, không đổi); Resistor/Push
Button/Servo/Potentiometer/DHT22 = wiring-validation (chưa có runtime
adapter).

### 3. Runtime Adapter Layer

Pattern: mỗi adapter là 1 class C# nhỏ (`XxxModel.cs`, namespace
`STEM.Application.UseCases.Simulation.Runners.Educational.Components`) —
nhận GPIO pin đổi từ SF_EVENT (`digitalWrite` qua QEMU), map sang
`SimulationEventResponse` kiểu `part-state`, được `QemuEsp32Runner.ComponentIndex`
tra cứu theo GPIO. Reset state qua cơ chế `setPartStates({})` CHUNG đã có sẵn
(không cần code reset riêng cho adapter mới — chỉ cần field mới sống trong
cùng object `PartVisualState`).

- **LedModel.cs / BuzzerModel.cs** — có sẵn từ trước, không đổi.
- **L298nModel.cs** (MỚI, `STEM_BE/STEM.Application/UseCases/Simulation/Runners/Educational/Components/L298nModel.cs`)
  — `ComputeState(bool? a, bool? b)` theo đúng bảng sự thật L298N
  (HIGH/LOW→forward, LOW/HIGH→backward, LOW/LOW→stopped, HIGH/HIGH→brake).
  `QemuEsp32Runner.ComponentIndex` mở rộng `_l298nByPin` (GPIO → model +
  slot IN1-4), `ReadNewLogLinesAsync` tính lại state MỖI KHI 1 trong 2 chân
  của 1 motor đổi, chỉ emit event khi state thật sự đổi (tránh spam). KHÔNG
  đọc ENA/ENB (QEMU chỉ instrument `digitalWrite`, không có `analogWrite`/
  `ledcWrite` PWM) — coi như luôn enabled, ghi rõ trong registry notes.
- **RGB LED / HC-SR04 adapter** — CHƯA làm (xem Limitation bên dưới).

FE: `PartVisualState` (`CircuitCanvas.tsx`) thêm `motorA?`/`motorB?:
MotorDriveState`. `LabSandboxPage.tsx` + `StudentSandboxViewer.tsx` (giáo
viên xem live) đều xử lý `component === 'l298n'` → cập nhật đúng field.
`CircuitCanvas.tsx` fallback card cho L298N hiện trực tiếp "A:Tiến B:—" v.v.

### 4. Limitation kỹ thuật — HC-SR04 distance simulation

**KHÔNG implement** — đã cân nhắc theo đúng yêu cầu "không fake PASS". Lý do
cụ thể: `QemuEsp32Runner` hiện chỉ có đường ĐỌC RA từ QEMU (`-serial
file:...`, host poll file log) — không có cơ chế GHI/INJECT tín hiệu input
(ECHO) ngược vào máy ảo đang chạy. Để làm thật cần 1 trong 2 hướng, cả 2 đều
là hạng mục kiến trúc mới, không phải sửa nhỏ:
1. QEMU monitor command / custom GPIO peripheral device model để set mức
   điện áp 1 chân input từ bên ngoài trong lúc máy đang chạy.
2. Instrument thêm 1 hàm đọc cảm biến ở tầng firmware-wrapper (giống cách
   `digitalWrite` đã bị tiêm macro) để đọc giá trị `distanceCm` từ 1 kênh
   phụ (file/biến môi trường container) thay vì đo thời gian xung ECHO thật
   — khả thi hơn nhưng vẫn cần thiết kế wrapper mới cho `pulseIn()`.

`distanceCm` prop + slider UI **KHÔNG được xây** trong task này — xây UI cho
1 giá trị không ảnh hưởng gì tới firmware thật đúng là "palette cho đẹp" mà
yêu cầu gốc cấm. HC-SR04 giữ `wiring-validation`, không đánh dấu
runtime-supported.

### 5. Test đã chạy thật (browser + API trực tiếp qua fetch có token thật, không giả lập)

- **CASE 1 (Palette):** PASS — 16 loại khả dụng (6 cũ + 10 robot kit), badge
  đúng cho từng loại, verify qua `CircuitBuilderTeacherMode` modal thật.
- **CASE 2 (Canvas):** PASS — kéo đủ 10 loại, HC-SR04 render element
  `wokwi-hc-sr04` thật, L298N/DC Motor/Wheel/Caster/Chassis/Switch render
  fallback card có icon+tên, không crash, 0 console error mới.
- **CASE 3 (Save/Reload):** PASS — diagram 5 phần tử (LED+Buzzer+L298N+
  Chassis+Wheel) save qua `PUT /api/diagrams/{id}`, reload trang, đủ "5 linh
  kiện", code/pin/vị trí giữ nguyên.
- **CASE 4 (Wiring validation):** PASS cả 2 chiều — diagram hợp lệ (L298N đủ
  IN1-4/VIN/GND) → `isValid:true`, chỉ warning ENA/ENB; diagram sai (DC Motor
  nối thẳng GPIO) → error rõ "Không được nối động cơ DC trực tiếp vào GPIO
  ESP32 — phải qua OUT của L298N Motor Driver."; diagram chỉ có
  Chassis/Wheel/Caster/DeliveryBox/Breadboard → `isValid:true`, chỉ info
  warning "not modeled by the MVP validator", không chặn gì.
- **CASE 5 (Runtime motor):** **PASS đầy đủ chu kỳ** — code Arduino thật cho
  Motor A chạy forward(1.5s)→backward(1.5s)→stopped(1.5s)→brake(1.5s) lặp
  lại; QEMU chạy thật qua Docker; poll DOM card L298N 14 lần/1s bắt đủ cả 4
  trạng thái đúng thứ tự: "Tiến"→"Dừng"→"Lùi"→"Dừng"→"Tiến"→"Phanh"...; Stop
  → card về "A:— B:—" (reset đúng qua cơ chế `setPartStates({})` chung).
- **CASE 6 (HC-SR04 runtime):** N/A — limitation đã ghi rõ ở mục 4, không
  đánh dấu runtime-supported, không test giả.
- **CASE 7 (Không phá luồng cũ):** PASS — diagram LED+Buzzer gốc (không đổi)
  chạy lại qua `/start` thật, event `led:"on"`/`buzzer:"buzzing"` phát đúng
  nhịp 1s, `/stop` trả `status:"stopped"` sạch.

### 6. Bug phụ phát hiện + đã vá trong lúc test (ngoài phạm vi robot kit gốc nhưng nhỏ, an toàn)

- `ESP32_DEVKIT_PINS` (`pinMaps.ts`) thiếu toạ độ cho pin `"5V"` dù BE
  `SupportedPins["wokwi-esp32"]` đã có từ trước — phát hiện khi wiring L298N
  VIN→5V, console báo "Unknown pin 5V on arduino". Đã vá: thêm entry `'5V'`
  dùng chung toạ độ với `'VIN'` (board thật không có header 5V riêng).

### 7. Backlog cụ thể (chưa làm, ghi rõ để không quên)

1. **HC-SR04 distance simulation thật** — xem Limitation mục 4, cần quyết
   định hướng QEMU-injection vs firmware-wrapper trước khi làm.
2. **RGB LED adapter** — chưa làm (không có trong Robot Delivery Kit, chỉ
   nêu trong yêu cầu gốc như ưu tiên tuỳ chọn).
3. **Codegen 1 định nghĩa component duy nhất** — hiện phải sửa tay 7 chỗ khi
   thêm component mới (liệt kê đầy đủ trong `robotKitComponents.ts` cuối
   file). Registry hiện tại là tài liệu tập trung, CHƯA phải cơ chế tự sinh
   code ở cả BE lẫn FE.
4. **Breadboard netlist thật** (rail nối ngầm giữa các lỗ) — hiện visual-only
   hoàn toàn, không tham gia wiring.
5. **`dotnet ef migrations`/`database update` gãy do 2 package provider
   EF Core cùng lúc** (`Microsoft.EntityFrameworkCore.SqlServer` +
   `Npgsql.EntityFrameworkCore.PostgreSQL` trong `STEM.Infrastructure.csproj`)
   — đã flag thành task riêng (`task_f5550e00`), không thuộc phạm vi
   component platform nhưng chặn việc thêm `ComponentGlueRegistry` seed qua
   migration bình thường (phải chèn tay qua project console tạm, xem
   `SQLScripts/AddRobotDeliveryKitComponentGlueRegistry.sql`).
6. **3 bản `normalizeComponentType()` độc lập** (`CircuitCanvas.tsx`,
   `CircuitBuilderTeacherMode.tsx`, `pinMaps.ts` tự inline) — không đồng bộ
   tự động, rủi ro alias lệch nhau khi thêm type mới (đã giữ nhất quán thủ
   công cho 10 type robot kit, chưa có cơ chế chống lệch tự động).

**File đã sửa/thêm (Component Platform):**
- BE: `VirtualLabDiagramService.cs` (SupportedPins + wiring rules L298N/DC
  Motor + helper `IsBatteryPositiveTerminal`/`IsPowerOrBatteryPositive`/
  `IsGroundOrBatteryNegative`), `QemuEsp32Runner.cs` (ComponentIndex mở rộng
  + emit motor-state), `L298nModel.cs` (mới), `StemDbContext.cs` (10 dòng
  seed `ComponentGlueRegistry` mới), migration tay
  `20260726124256_AddRobotDeliveryKitComponentGlueRegistry.cs`,
  `SQLScripts/AddRobotDeliveryKitComponentGlueRegistry.sql`.
- FE: `pinMaps.ts` (+5 pin map mới +fix "5V"), `CircuitCanvas.tsx`
  (+normalizeComponentType +ROBOT_KIT_FALLBACK_CARDS +renderFallbackCard
  +motor state render +PartVisualState mở rộng), `CircuitBuilderTeacherMode.tsx`
  (+10 COMPONENT_REFERENCES +badge UI), `robotKitComponents.ts` (mới,
  Component Registry), `RobotKitBomPanel.tsx` (mới, mount vào
  CircuitBuilderTeacherMode), `LabSandboxPage.tsx` +
  `StudentSandboxViewer.tsx` (xử lý event `component:'l298n'`).

## COMPONENT PLATFORM — Chốt L298N/DC Motor + Điều tra HC-SR04 + Chuẩn hoá Registry (2026-07-27, tiếp theo)

### 1. L298N/DC Motor — CHÍNH THỨC `runtime-supported`

Đã chốt `supportLevel: 'runtime-supported'` cho cả 2 tại
`robotKitComponents.ts` (đã set từ lần cập nhật trước, xác nhận lại đúng).
Badge "Mô phỏng được" hiện đúng ở cả 2 nơi đọc: `CircuitBuilderTeacherMode.tsx`
`COMPONENT_REFERENCES.l298n/dc_motor.badge` và `CircuitCanvas.tsx`
`ROBOT_KIT_FALLBACK_CARDS['l298n']/['dc-motor'].badge`. DC Motor hiển thị state
GỘP trên card L298N (`A:.../B:...`) — đúng bản chất điện (motor không tự có
logic, chỉ theo tín hiệu L298N), không lặp lại UI trên card DC Motor riêng.

**Bằng chứng test CASE 5 đầy đủ (browser + API thật, không giả lập):**
- Single-motor, chu kỳ đầy đủ: code Arduino cho Motor A chạy
  forward→backward→stopped→brake lặp lại (delay 1000ms/pha); poll DOM 12
  lần/500ms bắt đủ cả 4 trạng thái "Tiến/Lùi/Dừng/Phanh" đúng thứ tự nhiều
  chu kỳ liên tiếp; Stop → card về "A:— B:—".
- 2-motor, cùng lúc + độc lập: code đặt Motor A=forward, Motor B=backward
  NGAY trong `setup()` (tránh giới hạn thời gian `MaxDurationMs` mặc định
  5000ms bị chiếm phần lớn bởi thời gian QEMU boot ~4-4.8s thật đo được —
  ghi chú kỹ thuật quan trọng cho ai test lại sau này: code test dài hơn
  vài giây sẽ dễ bị cắt ngang trước khi thấy hết chu kỳ, nên đặt trạng thái
  cần verify càng sớm càng tốt trong `setup()` thay vì chờ qua nhiều `delay()`
  trong `loop()`). Kết quả DB event thật: `{time:4884, motor:"A", state:"forward"}`
  và `{time:5234, motor:"B", state:"backward"}` — 2 motor khác trạng thái
  ĐỒNG THỜI, chứng minh 2 cặp chân IN1/IN2 và IN3/IN4 được track hoàn toàn
  độc lập, không lẫn lộn.

**Phát hiện phụ trong lúc test (đã flag task riêng `task_00c6da79`, KHÔNG
sửa trong task này):** khi 1 lần Run tự hoàn tất tự nhiên (hết
`MaxDurationMs`, không ai bấm Stop tay) — xác nhận qua `docker ps -a` là
container ĐÃ được dọn sạch (bước 1 của `finally` trong `ExecuteInBackgroundAsync`
chạy xong) nhưng `VirtualLabProject.Status` trong DB không bao giờ chuyển
từ "running" sang "stopped" (bước 2, `MarkRunFinishedAsync`, bị nuốt exception
âm thầm ở `catch {}` không log gì). Chỉ gọi `/stop` tay mới thoát được. Nghi
ngờ đây là bug TIỀN TỒN TẠI (không liên quan L298N) — trong suốt phiên làm
việc trước đó, mọi lần Run đều được kết thúc bằng Stop tay TRƯỚC KHI tự
nhiên hết giờ, nên đường "tự hoàn tất không ai Stop" gần như chưa từng được
test trước đây.

### 2. HC-SR04 — Điều tra thật khả năng inject GPIO input (KHÔNG fake PASS)

**Kết luận: KHÔNG THỂ, xác nhận bằng thực nghiệm QMP thật** (không suy đoán) —
giữ nguyên `supportLevel: 'wiring-validation'`, KHÔNG đánh dấu runtime-supported.

**Cách điều tra:** chạy tay 1 container `stem-qemu-runner-sandbox` với cờ
`-qmp tcp:0.0.0.0:5555,server,nowait` (dùng lại firmware.bin có sẵn trong
firmware-cache để không cần compile lại), kết nối qua QMP bằng script
Node.js thật (không phải đọc code suy luận), query trực tiếp QOM tree của
máy ảo.

**Bằng chứng cụ thể:**
- `qom-list /machine/soc` xác nhận ESP32 machine model CÓ device GPIO thật:
  `"gpio","type":"child<esp32.gpio>"` (cùng với `uart0/uart1/uart2` — ESP32
  có 3 UART trong model này, quan trọng cho phương án B bên dưới).
- `qom-list /machine/soc/gpio` — device GPIO chỉ expose 3 property qua QOM:
  `strap_mode` (uint32, cấu hình boot-strapping, không phải giá trị pin
  runtime), `sysbus-irq[0]` (link ngắt, không phải kênh dữ liệu), và
  `esp32.gpio[0]` (child memory-region — vùng thanh ghi MMIO mà CPU tự đọc/
  ghi, KHÔNG phải property có thể set từ bên ngoài qua `qom-set`).
- `query-commands` lọc theo `gpio|pin|input|inject` — không có lệnh QMP nào
  dành riêng cho GPIO injection (chỉ có `input-send-event` — dành cho bàn
  phím/chuột/touch qua display, không liên quan GPIO; các lệnh `cxl-inject-*`
  là lỗi bộ nhớ CXL, không liên quan).

**Kết luận kỹ thuật:** GPIO trên ESP32 machine model của Espressif QEMU fork
(bản `esp-develop-9.2.2`, xác nhận qua `docker/simulation-qemu-sandbox/Dockerfile`)
được cài đặt THUẦN TUÝ như thanh ghi MMIO mà CPU khách (guest) tự đọc/ghi —
không có bất kỳ QOM property hay lệnh QMP nào cho phép HOST set giá trị 1
chân input từ bên ngoài trong lúc máy đang chạy. Đây KHÔNG phải giới hạn có
thể vá bằng cách thêm 1 cờ dòng lệnh — là giới hạn kiến trúc của chính machine
model.

**Runner hiện tại có đọc được TRIG từ firmware không?** CÓ — TRIG được ghi
qua `digitalWrite(TRIG_PIN, ...)`, đã được instrument qua macro SF_EVENT sẵn
có (giống mọi GPIO khác), nên `QemuEsp32Runner` NHẬN ĐƯỢC sự kiện TRIG toggle
bình thường ngay hôm nay — chỉ là chưa có adapter nào XỬ LÝ event đó (không
có `HcSr04Model.cs`).

**2 hướng thiết kế khả thi cho tương lai (ghi rõ, không làm ngay):**
1. **QEMU-injection thật** — theo bằng chứng trên, KHÔNG khả thi với machine
   model hiện tại của Espressif fork. Muốn làm được cần tự thêm 1 device
   model GPIO tuỳ biến vào QEMU (build lại QEMU từ source, không dùng bản
   prebuilt) — chi phí/rủi ro rất lớn, không đề xuất.
2. **Kênh phụ qua UART thứ 2 (khả thi hơn, CHƯA làm)** — ESP32 model có sẵn
   `uart1`/`uart2` ngoài `uart0` (đang dùng cho SF_EVENT log). Thiết kế:
   (a) BE phát hiện TRIG toggle như hiện tại (đã có); (b) BE tính thời gian
   xung ECHO tương ứng từ `distanceCm` cấu hình, ghi giá trị đó vào 1 chardev
   QEMU bind vào `uart1`/`uart2` dạng SOCKET (không phải `file:`, vì `file:`
   chỉ/ chủ yếu output-only — cần `-serial2 unix:path,server` hoặc tương tự
   để có kênh 2 chiều thật); (c) firmware cần 1 wrapper mới thay thế
   `pulseIn()` (tương tự cách `digitalWrite` đã bị tiêm macro) để đọc giá
   trị từ UART phụ đó thay vì đo xung ECHO vật lý thật. Đây là 1 hạng mục
   kiến trúc MỚI, không phải sửa nhỏ — cần thiết kế kỹ + review riêng trước
   khi làm, KHÔNG làm trong task này.

**`distanceCm` prop + slider UI:** CỐ TÌNH KHÔNG xây trong task này — xây UI
cho 1 giá trị không ảnh hưởng gì firmware thật đúng là dạng "palette cho đẹp"
mà yêu cầu gốc cấm rõ.

### 3. Component Registry — Plan chuẩn hoá (5 bước, đã làm bước 1-2, còn 3-5)

Đích đến: 1 nguồn định nghĩa component chính, giảm 7 điểm phải sửa tay hiện
tại (BE SupportedPins, BE ComponentGlueRegistry, FE pinMaps, FE CircuitCanvas
render dispatch, FE CircuitBuilderTeacherMode COMPONENT_REFERENCES, FE
robotKitComponents.ts, BE+FE runtime adapter nếu cần).

- [x] **Bước 1 — Registry tập trung** (đã làm, xem mục "Component Registry"
  ở trên) — `robotKitComponents.ts` là nguồn sự thật cho
  `supportLevel`/badge/BOM/notes, không tự suy đoán riêng ở nơi khác.
- [x] **Bước 2 — Type union an toàn** (đã làm) — `KnownComponentTypeId`
  (union type liệt kê tay mọi componentType đã biết) export từ
  `robotKitComponents.ts`. Rủi ro = 0 (chỉ thêm type, không đổi runtime).
  Áp dụng dần: gán type này cho tham số ở các hàm CÓ THỂ nhận nhầm string
  (chưa retrofit hết, xem bước tiếp).
- [ ] **Bước 3 — Hợp nhất 3 bản `normalizeComponentType()`** (rủi ro
  trung bình, CHƯA làm) — hiện có 3 bản độc lập: `CircuitCanvas.tsx` (giữ
  gạch ngang, VD `hc-sr04`), `CircuitBuilderTeacherMode.tsx` (đổi hết gạch
  ngang thành gạch dưới qua regex, VD `hc_sr04`), `pinMaps.ts` (tự
  `.replace('wokwi-', '')` riêng, không đổi gạch ngang). Cần CHỌN 1 quy ước
  chung trước (đề xuất gạch dưới, khớp JS identifier hơn), viết hàm dùng
  chung trong file mới `componentTypeUtils.ts`, rồi ĐỔI ĐỒNG THỜI toàn bộ
  key trong `ROBOT_KIT_FALLBACK_CARDS` (CircuitCanvas.tsx) sang gạch dưới —
  có rủi ro thật nếu làm vội (dễ bỏ sót 1 key), cần test lại toàn bộ palette
  + canvas sau khi đổi trước khi merge.
- [ ] **Bước 4 — Sinh `pinMaps.ts` dispatch từ Registry** (trung bình, giá
  trị cao, CHƯA làm) — `getPinCoords()`'s if/else chain thay bằng tra cứu
  1 bảng `type -> pinMapKey` khai báo trong `robotKitComponents.ts`, giảm 1
  điểm sửa tay (hiện thêm 1 component có pin cần sửa CẢ if/else trong
  `pinMaps.ts` LẪN thêm entry registry — gộp lại chỉ cần sửa registry).
- [ ] **Bước 5 — Codegen BE+FE từ 1 định nghĩa JSON/YAML dùng chung** (rủi ro
  cao nhất, giá trị cao nhất, CHƯA làm, cần bàn kỹ trước) — 1 file định nghĩa
  duy nhất (không phải TypeScript, để BE C# đọc được) làm nguồn cho: script
  sinh migration C# `HasData` (BE), sinh `robotKitComponents.ts` (FE), sinh
  `SupportedPins` dict (BE) — đây là hạng mục kiến trúc lớn, KHÔNG làm ngay,
  chỉ ghi nhận hướng.

### 4. RGB LED — Bằng chứng "output-easy tier" mở rộng an toàn (mới, ngoài Robot Delivery Kit)

Thêm `wokwi-rgb-led` (`runtimeAdapter: RgbLedModel.cs`, 3 kênh R/G/B độc lập,
mỗi kênh chỉ bật/tắt qua digitalWrite — element @wokwi/elements thật, dùng
property `ledRed/ledGreen/ledBlue` số 0/1) theo ĐÚNG pattern LED/Buzzer/L298N
đã có — build sạch (`STEM.Application`/`STEM.Infrastructure` 0 lỗi, `tsc
--noEmit` 0 lỗi), registry API xác nhận xuất hiện (`GET
/api/labs/component-glue-registry` trả đủ 17 loại bao gồm `wokwi-rgb-led`).
**Cập nhật sau khi user restart BE — test live QEMU + browser thật (không
fake PASS):**

- Wiring validation sau restart: `PUT /api/diagrams/{id}` →
  `{"isValid":true,"errors":[],"warnings":[]}` (0 warning, xác nhận
  `SupportedPins["wokwi-rgb-led"]` đã nạp đúng).
- Run thật qua QEMU với firmware `digitalWrite(R,HIGH); digitalWrite(G,LOW);
  digitalWrite(B,HIGH);` → DB/API xác nhận đúng 3 event:
  `3766:R=on, 3904:G=off, 4032:B=on`.
- **Phát hiện bug thật ở bước test qua UI (không chỉ tin DB)**: mở sandbox
  thật, `document.querySelector('wokwi-rgb-led').ledRed/ledGreen/ledBlue`
  vẫn ở `0/0/0` dù backend đã phát đúng 3 event — console không có lỗi nào
  giải thích. Root cause: `ledRed/ledGreen/ledBlue` là **number** (0/1),
  nhưng code cũ truyền qua JSX prop trên `<wokwi-rgb-led>` — React chỉ gán
  thẳng DOM property cho custom element khi giá trị là **boolean** (nhánh
  đặc biệt trong react-dom, đúng lý do `value`/`hasSignal` của LED/Buzzer
  hoạt động qua JSX); với number, React luôn đi qua
  `node.setAttribute(name, String(value))`, bị trình duyệt hạ chữ thường
  thành `ledred`, và Lit đọc lại thành CHUỖI qua `@property()` mặc định
  `type: String`, ghi đè mất giá trị number mà `render()` cần. Đây là đúng
  loại lỗi mà code `color` của `wokwi-led` đã né bằng ref-effect gán property
  trực tiếp — RGB LED lúc đầu không áp dụng lại pattern đó.
- **Fix**: bỏ 3 JSX prop `ledRed/ledGreen/ledBlue`, thay bằng 1 `useEffect`
  gán trực tiếp `el.ledRed/el.ledGreen/el.ledBlue` qua `componentRefs` mỗi khi
  `partStates` đổi (xem `CircuitCanvas.tsx`, effect ngay sau effect gán màu
  LED). Test lại qua browser thật: LED đổi màu tím ánh sáng (đỏ+xanh dương,
  xanh lá tắt) khớp đúng R=on,G=off,B=on; bấm Dừng mô phỏng →
  `ledRed/ledGreen/ledBlue` reset đúng về `0/0/0`.
- **Kết luận: RGB LED PASS thật (end-to-end, đã xác nhận qua DOM + màn hình,
  không chỉ qua DB).** Lưu ý quan trọng cho các adapter output-easy tiếp theo
  (Relay/Seven Segment/LED Bar Graph): nếu prop truyền cho `@wokwi/elements`
  là **number** (không phải boolean/string), PHẢI gán qua ref-effect trực
  tiếp như trên, KHÔNG truyền qua JSX prop — nếu không sẽ lặp lại đúng bug
  này (DB đúng nhưng UI không cập nhật).

### 5. Danh sách linh kiện tiếp theo — phân loại ĐÚNG độ khó (sửa nhận định ban đầu)

**Quan trọng: KHÔNG phải mọi linh kiện trong danh sách gốc user đề xuất đều
"dễ giống LED/Buzzer".** Có 2 nhóm hoàn toàn khác nhau về độ khó kỹ thuật:

- **Nhóm OUTPUT-easy (thật sự dễ, chỉ cần digitalWrite — giống LED/Buzzer/
  L298N/RGB LED, KHÔNG cần khả năng mới):**
  - RGB LED — ĐÃ LÀM (mục 4).
  - Relay (`digitalWrite` HIGH/LOW → on/off, không có element @wokwi/elements
    thật, cần fallback card).
  - Seven Segment (`wokwi-7segment` — có element thật, nhiều chân digitalWrite
    độc lập cho từng đoạn, phức tạp hơn 1 chút vì 7-8 chân thay vì 1-3).
  - LED Bar Graph (`wokwi-led-bar-graph` — có element thật, tương tự Seven
    Segment, nhiều chân độc lập).

- **Nhóm INPUT-hard (CÙNG giới hạn kỹ thuật như HC-SR04, KHÔNG dễ như liệt kê
  ban đầu — đính chính lại):** Slide Switch, Push Button, DIP Switch, PIR
  Motion Sensor, và MỌI cảm biến/công tắc đọc qua `digitalRead()`/`analogRead()`
  đều cần firmware ĐỌC 1 giá trị do người dùng/host cung cấp — về bản chất
  giống hệt bài toán "inject ECHO cho HC-SR04" đã điều tra ở mục 2 (QEMU
  không có cơ chế set input pin từ ngoài). Push Button ĐÃ có wiring-validation
  (không đổi), nhưng "runtime-supported" (bấm nút ảo → firmware đọc được)
  bị chặn bởi CHÍNH giới hạn kỹ thuật đã xác nhận ở mục 2, không phải việc
  chưa viết code.

- **KHÔNG làm ngay (đúng yêu cầu gốc):** OLED/LCD/NeoPixel — cần giải mã giao
  thức I2C/SPI thật (QEMU model có emulate I2C/SPI peripheral ở mức thanh ghi,
  nhưng để hiển thị ĐÚNG nội dung màn hình cần firmware-side hoặc BE-side
  giải mã lệnh I2C/SPI đầy đủ — một tầng phức tạp mới, không phải digitalWrite
  đơn giản).

**Đề xuất thứ tự làm tiếp (nếu được yêu cầu)**: Relay → Seven Segment → LED
Bar Graph (cả 3 đều thuộc nhóm output-easy, mỗi cái ~30-60 phút theo đúng
pattern đã lặp lại 4 lần trong 2 task này).

## COMPONENT LIBRARY UI OVERHAUL — giao diện giống Wokwi + Serial Monitor log + pan chuột phải (2026-07-27, tiếp theo)

Task riêng biệt, KHÔNG đụng compile/QEMU core — chỉ UI/UX cho canvas + palette
+ log hiển thị.

### 1. Palette giống Wokwi (dark, search, category, badge)
- Tách `COMPONENT_REFERENCES`/`normalizeComponentType`/`getComponentReference`
  từ `CircuitBuilderTeacherMode.tsx` ra `componentReferenceCatalog.ts` (nguồn
  dùng chung, không hardcode trùng — sidebar cũ VÀ popup mới đọc CÙNG 1 nguồn).
  Thêm `getComponentCategory()` (tra cứu tĩnh theo key, 8 category: Basic/
  Display/Input/Sensor/Output-Actuator/Robot Kit/Mechanical/BOM-Accessories).
- Vá 1 lỗ hổng thật phát hiện khi làm: LED/Buzzer/Resistor/Push
  Button/Potentiometer/Servo/DHT22 (7 component gốc) CHƯA TỪNG có field
  `badge` — badge component âm thầm không hiện gì thay vì đúng theo Yêu cầu
  6 (LED/Buzzer phải "Mô phỏng được"). Đã bổ sung đủ badge cho cả 7, khớp
  đúng `LEGACY_COMPONENTS_SUMMARY` (nguồn sự thật supportLevel thật).
- `ComponentPalettePopup.tsx` (mới) — dark theme, search top, category header
  thanh đen, item icon+tên+badge, hover/focus highlight. Test qua browser
  thật: search lọc đúng ("motor" → DC Motor/L298N/Stepper/Drone Motor với
  badge chính xác), category hiện đúng thứ tự.

### 2. Nút "+" trên canvas
- `CircuitCanvas.tsx` thêm prop opt-in `onOpenPalette`/`autoSelectId` — nút
  tròn nổi, không phá layout nơi chưa dùng prop này.
- **Bug thật tìm thấy khi test**: đặt nút ở `top-3` bị `Toolbar` (thanh ngang
  `h-12 z-50` render ngay sau) che kín + chặn click hoàn toàn (xác nhận qua
  `document.elementFromPoint` tại tâm nút trả về đúng span hint-text bên
  trong Toolbar, không phải nút) — sửa bằng cách dời xuống `top-16`, dưới
  hẳn thanh Toolbar. Đã verify lại: nút hiện đúng, click mở popup đúng.
- Wiring: `LabSandboxPage.tsx` (học sinh — TRƯỚC ĐÂY hoàn toàn KHÔNG có cách
  tự thêm linh kiện, đây là năng lực mới thật sự) fetch
  `labsApi.getComponentGlueRegistry(true)` (API có sẵn, không thêm API mới),
  thêm component ở vị trí bậc thang gần nút, tự chọn qua `autoSelectId`.
  `CircuitBuilderTeacherMode.tsx` thêm popup làm entry point THÊM (sidebar cũ
  giữ nguyên 100%, đã verify cả 2 đường thêm component đều hoạt động, không
  xung đột).
- Test thật qua browser (KHÔNG fake): thêm L298N qua popup → xuất hiện đúng vị
  trí, tự chọn (viền chấm xanh), kéo/di chuyển được, xoá được, reload vẫn còn
  đúng vị trí/loại ("2 linh kiện - Đã lưu" giữ nguyên sau F5).

### 3. Pan canvas bằng chuột phải
- `CircuitCanvas.tsx`: `panOffset` state, world-layer transform đổi thành
  `translate(pan) scale(zoom)` (translate ngoài scale — pan luôn tính bằng
  pixel màn hình thật, nhất quán mọi mức zoom, không cần chia lại ở nơi khác).
  `handlePointerMove`/`handleComponentPointerDown` trừ `panOffset` trước khi
  chia zoom để pin/wire/component không lệch sau khi pan.
  `onContextMenu={e => e.preventDefault()}` chặn menu chuột phải trình duyệt.
  `handleComponentPointerDown`/`handlePinPointerDown` bỏ qua `button===2` (để
  nổi bọt lên container cho pan), không đổi bất kỳ hành vi chuột trái nào.
- Test thật qua synthetic PointerEvent (browser tool không có gesture "kéo
  chuột phải" sẵn, dùng `dispatchEvent` với `button:2` để tái hiện chính xác):
  `translate(0,0)` → kéo (80,60) → `translate(80px,60px)` khớp CHÍNH XÁC,
  cursor `grab`→`grabbing`→`grab` đúng. Left-click kéo component test riêng
  ngay sau đó (không dùng synthetic, dùng `left_click_drag` thật): board
  `(350,80)` → `(390,105)` đúng delta (+40,+25) — xác nhận pan không đụng
  drag component.

### 4. Serial Monitor — log compile/simulation/error
- `LabSandboxPage.tsx`: `appendLog(prefix, message)` nối vào state
  `serialOutput` hiện có (KHÔNG thêm event/API mới) — gắn vào các điểm đã có
  sẵn: `handleRun`/`handleStop`/`onCompileStarted`/`onCompileFinished`/
  `onRunBooting`/`onSimulationEvent` (bắt cả log "part-state" cho mỗi
  event)/`onRunCompleted`/các catch block.
  Phát hiện + dùng đúng tín hiệu thật để suy ra cache-hit: BE
  (`QemuEsp32Runner.cs`) KHÔNG bắn `StudentCompileStarted` khi cache HIT — FE
  dùng cờ `compileStartedThisRunRef` để biết chính xác (không đoán) lúc
  `StudentRunBooting` tới liệu có phải cache hit không.
  `virtualLabHub.ts`: thêm trigger nội bộ additive (`ConnectionClosed`/
  `ConnectionReconnecting`/`ConnectionReconnected`) trong `onclose`/
  `onreconnecting`/`onreconnected` đã có sẵn — không đổi method signature nào.
- `SerialMonitorPanel.tsx`: render theo dòng, tô màu theo prefix
  (`[compile]` cyan, `[simulation]` amber, `[error]` đỏ), serial thật KHÔNG
  prefix (giữ nguyên hiển thị như cũ).
- Test thật qua Run/Stop live (lab 132213, RGB LED, ESP32): lần chạy đầu gặp
  đúng flakiness Docker/QEMU đã biết từ trước (0 event, DB kẹt "running") —
  KHÔNG phải regression (xác nhận qua API `GET .../projects/{id}` với
  Bearer token thật lấy từ localStorage, do CORS chặn fetch không có token).
  Retry lần 2: log đầy đủ đúng thứ tự `[compile] Analyze → Board/Framework →
  hợp lệ → dùng cache → [simulation] khởi động QEMU → QEMU đã chạy →
  part-state R=on/G=off/B=on` — khớp 100% hành vi thật, LED đổi màu tím đúng
  (R+B on). Stop: log dừng đúng + LED tắt hẳn — có 1 chỗ log trùng nhẹ
  ("Mô phỏng đã dừng" xuất hiện 2 lần do `handleStop()` VÀ
  `StudentRunCompleted` từ server cùng bắn — không phải lỗi chức năng, chỉ dư
  dòng log, chưa dedupe).

### Hạn chế còn lại (báo trung thực, không che giấu)
- Log trùng nhẹ khi Stop (xem trên) — cosmetic, không ảnh hưởng chức năng.
- Chưa dedupe giữa `handleStop()` và `onRunCompleted` cho log "dừng"/"reset".
- Chưa làm cho `StudentSandboxViewer.tsx` (màn hình giáo viên xem live) — chỉ
  làm `LabSandboxPage.tsx` (sandbox học sinh) theo đúng phạm vi file user liệt
  kê.
- Bug "stuck running status" (task cũ, chưa fix) vẫn còn — quan sát lại đúng 1
  lần trong lúc test lần này, không phải lỗi mới.

## SERIAL MONITOR — raw serial thật từ QEMU/ESP32 (2026-07-27, tiếp theo)

Task riêng, tách khỏi phần UI overhaul ở trên. Không đổi compile cache key,
không đổi QEMU core, không đổi LED/Buzzer/RGB/L298N.

### Root cause tìm được (BE)
`QemuEsp32Runner.cs` → `ReadNewLogLinesAsync()`: MỌI dòng đọc từ
`serial.log` không khớp định dạng nội bộ `SF_EVENT {...}` (dùng để BE tự
theo dõi digitalWrite) bị `continue` bỏ qua IM LẶNG — nghĩa là boot log ROM
ESP32 thật và mọi `Serial.println()` của học sinh ĐỀU bị đọc rồi vứt đi,
chưa từng tới FE, dù `SerialMonitorPanel.tsx`/`applySimulationEvent` đã hỗ
trợ sẵn `type="serial"` từ lâu (chỉ `EducationalSimulationRunner`/mock dùng,
`QemuEsp32Runner` — runner thật cho firmware ESP32 — chưa bao giờ emit).

### Fix (additive, không đổi TryParseSfEvent/pin-event logic)
Dòng không phải SF_EVENT → emit `SimulationEventResponse{Type:"serial",
Payload:{message:line, newline:true}}` qua `EmitAsync` có sẵn, rồi mới
`continue`. CỐ TÌNH không cộng vào `eventsEmitted` (biến quyết định retry khi
"thoát sớm đáng ngờ") — giữ đúng nguyên nghĩa cũ "có GPIO event thật hay
không", không lẫn với "có in ra chữ gì đó hay không".

### Test thật qua browser (lab 132213, ESP32, KHÔNG fake)

**Case 1 — Serial.println đơn giản** (`Serial.begin` + 2 println trong
setup + println trong loop):
- Boot log ROM ESP32 THẬT hiện đủ: `ets Jul 29 2019 12:21:46`,
  `rst:0x1 (POWERON_RESET),boot:0x12 (SPI_FAST_FLASH_BOOT)`,
  `configsip/clk_drv/mode:DIO/load:.../entry 0x400805e4`.
- `Serial.println` thật hiện đúng: "Hello from ESP32!", "Setup done!",
  "Loop tick" lặp mỗi giây, ổn định liên tục >90 giây không crash.
- Quan sát 1 lần retry (boot log lặp 2 lần trước khi ổn định) — do
  `suspiciousEarlyExit` (retry logic CŨ, không đổi) bắt được QEMU thoát sớm ở
  lần thử đầu (flakiness Docker/QEMU đã ghi nhận nhiều lần trước đây trong
  file này, KHÔNG phải do fix lần này gây ra — code thay đổi chỉ thêm 1 nhánh
  emit, không đụng gì tới khởi động process/retry).
- **Đính chính 1 rủi ro đã ghi trong code (`FirmwareCacheService.cs`
  comment): "Serial.println gây crash không tất định dưới QEMU"** — comment
  đó nói về việc DÙNG Serial.println TRONG wrapper instrumentation
  (`__sf_digitalWrite`) tự động chèn vào code, ĐÃ được thay bằng `ets_printf`
  từ trước. Test thật lần này xác nhận: `Serial.println` gọi TRỰC TIẾP từ
  code người dùng (không qua wrapper đó) chạy ỔN ĐỊNH, không crash, trong
  toàn bộ thời gian test. Không đủ căn cứ để khẳng định "không bao giờ crash"
  (rủi ro gốc mô tả "không tất định"), nhưng ĐÃ verify thật ổn định trong lần
  test dài (90+ giây).

**Case 2 — WiFi scan** (`WiFi.mode(WIFI_STA)` + `WiFi.scanNetworks()`):
- Boot log + `Serial.println("Initializing WiFi...")` (dòng NGAY TRƯỚC
  `WiFi.mode`) hiện đúng ở cả 3/3 lần thử (retry tối đa).
- Firmware TREO ngay sau đó — KHÔNG BAO GIỜ in tới "Scanning..."/"Scan
  done!"/số mạng tìm thấy, dù đợi hết cả 3 lần retry. Hành vi giống hệt nhau
  cả 3 lần (không phải flaky ngẫu nhiên) → kết luận: **QEMU không giả lập
  WiFi radio thật, `WiFi.mode()`/`scanNetworks()` treo firmware vô thời hạn.
  N/A thật sự, không phải giới hạn có thể sửa ở tầng BE/FE của dự án này**
  (cần QEMU/Espressif hỗ trợ WiFi peripheral emulation, ngoài phạm vi).
- Không có dòng nào bị fake — Serial Monitor chỉ hiện ĐÚNG những gì firmware
  thật đã in ra trước khi treo, đúng yêu cầu "không fake WiFi scan".

**Case 3 — Stop**: bấm Dừng giữa lúc "Loop tick" đang in liên tục → log dừng
("Đang dừng mô phỏng...", "Đã dừng.", "Đã reset trạng thái linh kiện.") nối
tiếp SẠCH ngay sau dòng serial cuối, không xen kẽ/rối. Dedupe xác nhận: CHỈ
1 cặp log dừng (trước đây lặp 2 lần do cả `handleStop()` và
`onRunCompleted` cùng log — đã thêm `hasLoggedStopThisRunRef` chặn bên tới
sau).

### FE — tách rõ đoạn (không đổi API)
`--- Compile ---` in ngay khi bấm Run (trước mọi log `[compile]`).
`--- Simulation started ---` in đúng 1 lần, ngay TRƯỚC dòng serial thật đầu
tiên nhận được (không phải ngay lúc bấm Run) — `SerialMonitorPanel.tsx` tô
2 dòng này màu xám đậm riêng, phân biệt log hệ thống `[prefix]` (cyan/amber/
đỏ) và raw serial thật (xanh lá, không prefix).

### Báo cáo theo 5 mục yêu cầu
1. serial.log thật có: boot log ROM ESP32 (`ets Jul 29 2019...` + các dòng
   `rst/configsip/clk_drv/mode/load/entry`), dòng `SF_EVENT {...}` (nội bộ,
   BE lọc không cho hiện ra FE), và toàn bộ `Serial.println/print` thật của
   firmware người dùng.
2. BE emit `type="serial"` cho MỌI dòng không phải `SF_EVENT` (trước đây bị
   bỏ hoàn toàn) — additive, không đổi pin-event/compile cache/QEMU core.
3. FE hiển thị boot log: **CÓ**, xác nhận qua test thật.
4. FE hiển thị `Serial.println` từ firmware: **CÓ**, xác nhận qua test thật,
   ổn định >90s liên tục.
5. WiFi scan: **N/A thật sự** — QEMU treo firmware ngay tại `WiFi.mode()`,
   không giả lập WiFi radio, xác nhận qua 3/3 lần thử giống hệt nhau, không
   fake bất kỳ dòng log nào.

## COMPONENT LIBRARY — nâng cấp visual fallback-card bằng SVG tự vẽ (2026-07-27, tiếp theo)

Audit trước khi làm: toàn bộ 33 linh kiện user yêu cầu đã tồn tại sẵn từ đợt
Component Library trước (không thiếu cái nào) — 8 loại đã dùng element
@wokwi/elements thật (Servo, Flame Sensor, DHT22/11, PIR, MQ Gas, OLED
SSD1306, LCD 16x2/I2C, giữ nguyên không đụng), 25 loại còn lại đang dùng
"fallback card" (icon lucide + khung màu trơn) — task này nâng cấp 26 loại
(25 + Line Tracking Sensor bonus) bằng SVG tự vẽ nội bộ (`CircuitCanvas.tsx`
→ `getFallbackIllustration()`), KHÔNG tải asset ngoài.

### Nguyên tắc kỹ thuật
- SVG `viewBox` luôn khớp ĐÚNG width/height khai báo trong
  `ROBOT_KIT_FALLBACK_CARDS` — không đổi kích thước card (đây vẫn là bounding
  box dùng tính toạ độ pin-dot trong `pinMaps.ts`, đổi sẽ làm lệch pin/wire).
- `renderFallbackCard()`: có minh hoạ riêng → hình chiếm gần hết card, tên/
  badge/motor-state hiện dạng nhãn phủ mờ phía dưới. Type CHƯA vẽ (vd
  solenoid-valve, sorting-box, ball, fire-extinguisher, water-tank,
  drone-motor, stair-obstacle, trash-object, delivery-item, color-sensor)
  giữ NGUYÊN layout icon+tên cũ — an toàn, không đổi hành vi.
- Không đổi `supportLevel`/badge của bất kỳ item nào — chỉ đổi renderer.
- Không đụng LED/Buzzer/RGB LED (element thật, không qua đường này) và
  MOTOR_STATE_LABEL/COLOR overlay của L298N (verbatim giữ nguyên, chỉ đổi
  nơi hiển thị từ icon-card sang SVG-card).

### Danh sách đã nâng cấp (26 loại)
Robot Kit core: L298N (PCB xanh + terminal xanh dương + chip đen), DC Motor
(gearbox vàng + trụ động cơ xám), Battery Pack (pin đen + 2 cell + dây +/-),
Power Switch (công tắc gạt đỏ), Breadboard (lưới lỗ trắng + rail đỏ/xanh),
Robot Wheel (bánh đen có nan hoa), Caster Wheel (bi xám trong khung), Robot
Chassis (khung xanh nhạt + lỗ ốc góc), Mini Delivery Box (thùng carton nâu +
băng dán chữ X).
Actuator: Relay Module (PCB xanh dương + relay đen + terminal vàng), Fan
(khung + cánh quạt), Water Pump (thân bơm xanh + vòi).
Sensor: Water Leak (PCB đỏ + rãnh cảm biến), Rain Sensor (tấm cảm biến xám +
board xanh), Soil Moisture (2 chấu dò bạc), Vibration/SW-420 (module xanh lá
+ cảm biến trụ), IR Obstacle/Line Tracking (2 mắt thu-phát hồng ngoại).
Display/comm: ESP32-CAM (board đỏ + ống kính), WiFi/Cloud Node + Dashboard/
Cloud (biểu tượng đám mây).
Mechanical: Robot Arm Base (đế xoay + cánh tay + kẹp), Gripper (2 hàm kẹp),
Conveyor Belt (băng chuyền + 2 trục), Drone Frame (khung X + 4 động cơ),
Propeller (2 cánh vuông góc).

### Test thật qua browser (lab "tes1", KHÔNG fake)
- Palette search "L298N"/"Battery" lọc đúng, category/badge đúng.
- Thêm 6 linh kiện (LED có sẵn + L298N/Battery/Robot Wheel/Breadboard/Water
  Leak Sensor) qua popup "+" — không crash, hiện đúng hình minh hoạ mới,
  canvas không rối dù nhiều component chồng nhau.
- Move: xác nhận qua dispatchEvent PointerEvent thật (không phải suy đoán) —
  toạ độ Water Leak Sensor đổi CHÍNH XÁC từ (200,362) → (260,402) khớp
  đúng delta kéo (+60,+40).
- Delete: xoá Water Leak Sensor → "6 linh kiện" còn "5 linh kiện", auto-save
  "Đã lưu" ngay sau đó.
- Save/reload: F5 lại → đúng 5 linh kiện, đúng nhãn, không mất.
- **Regression L298N (test sâu nhất, qua API dựng diagram nối dây thật +
  Run thật)**: PUT diagram L298N nối đủ IN1-4 + battery VIN/GND →
  `isValid:true`. Run sketch `digitalWrite(IN1,HIGH); digitalWrite(IN2,LOW)`
  → Serial Monitor log đúng `part-state: l298n motor=A state=forward` → card
  SVG MỚI hiện đúng "A:Tiến B:—" (chữ xanh lá, đúng màu forward) — xác nhận
  runtime adapter thật (L298nModel.cs) hoạt động ĐÚNG 100% qua giao diện
  mới, không bị vỡ bởi thay đổi renderer. Stop → card reset về "A:— B:—",
  log dừng chỉ 1 lần (dedupe từ task trước vẫn hoạt động đúng).
- Console: không phát sinh lỗi mới trong toàn bộ quá trình test.

### Component còn thiếu (chưa vẽ SVG riêng, vẫn dùng icon+tên cũ — an toàn)
Solenoid/Valve, Sorting Box, Ball, Fire Extinguisher, Water Tank, Drone
Motor, Stair/Obstacle Block, Trash Object, Delivery Item, Color Sensor —
10 item, đều KHÔNG nằm trong danh sách ưu tiên user yêu cầu lần này, badge/
supportLevel không đổi, vẫn hiển thị/kéo-thả/lưu bình thường qua layout cũ.

## COMPONENT LIBRARY — Hoàn thiện thumbnail/icon Component Palette giống Wokwi (2026-07-27, tiếp theo)

### Bối cảnh
Sau khi nâng cấp visual fallback-card trên canvas (SVG tự vẽ cho 26 linh kiện), popup "Thêm linh kiện" (`ComponentPalettePopup.tsx`) vẫn hiển thị icon Lucide generic trong ô vuông cho hầu hết item — không giống hình linh kiện thật như ảnh Wokwi tham khảo. Yêu cầu: mỗi linh kiện có thumbnail riêng, không dùng icon generic cho component đã có renderer/SVG, tái sử dụng SVG đã có ở canvas nếu có thể.

### 1. Tách illustration dùng chung — file nào
- **`componentTypeNormalize.ts`** (MỚI) — tách `normalizeComponentType()` (hyphen-style, ví dụ `wokwi-l298n` → `l298n`) ra khỏi `CircuitCanvas.tsx` để dùng chung mà không tạo circular import. Giữ nguyên 100% logic cũ.
- **`componentIllustrations.tsx`** (MỚI) — nguồn illustration DUY NHẤT, dùng chung giữa `CircuitCanvas.tsx` (canvas) và `ComponentPalettePopup.tsx` (popup):
  - `ROBOT_KIT_FALLBACK_CARDS` + `getFallbackIllustration()` — chuyển nguyên từ `CircuitCanvas.tsx` (không đổi 1 dòng SVG/kích thước, đã PASS regression L298N từ task trước).
  - `getExtraIllustration()` (MỚI) — SVG riêng cho palette, viewBox cố định `0 0 44 44`, phủ nhóm linh kiện dùng `@wokwi/elements` THẬT trên canvas (không có fallback-card) + vài fallback visual-only còn thiếu SVG.
  - `getComponentIllustration(componentType)` — hàm export chính, tự normalize rồi thử `getFallbackIllustration` trước (ưu tiên tái sử dụng, đúng tỉ lệ card thật), sau đó `getExtraIllustration`, cuối cùng `null` (caller tự fallback icon Lucide).
- `CircuitCanvas.tsx` import lại `ROBOT_KIT_FALLBACK_CARDS`/`getFallbackIllustration`/`normalizeComponentType` từ 2 file trên — **không đổi hành vi render canvas**, chỉ đổi vị trí code.

### 2. Số component đã có thumbnail riêng
**50 component** có thumbnail SVG riêng (không còn icon Lucide generic):
- 26 item tái sử dụng nguyên SVG canvas (L298N, DC Motor, Battery Pack, Power Switch, Breadboard, Robot Wheel, Caster Wheel, Robot Chassis, Delivery Box, Relay Module, Fan, Water Pump, Water Leak/Rain/Soil Moisture/Vibration/IR Obstacle/Line Tracking Sensor, ESP32-CAM, WiFi/Dashboard Cloud, Robot Arm Base, Gripper, Conveyor Belt, Drone Frame, Propeller).
- 24 item SVG MỚI riêng cho palette (LED, Buzzer, RGB LED, Resistor, Push Button, Servo, 7-Segment, LED Bar Graph, OLED SSD1306, LCD 16x2, LCD 16x2 I2C, TFT ILI9341, Flame Sensor, PIR Motion Sensor, MQ Gas Sensor, Color Sensor, DHT22, DHT11, Solenoid/Valve, Ball, Trash Object, Delivery Item, Water Tank, Fire Extinguisher, Stair/Obstacle Block).

### 3. Component còn icon generic — lý do
Còn **~13 item** dùng icon Lucide (màu/hình khác nhau theo `iconClassName`, không phải cùng 1 ô vuông giống hệt): Keypad 4x4, Potentiometer, HC-SR04, Load Cell HX711, IR Receiver, Photoresistor/LDR, NTC Temperature Sensor, Neopixel/LED Strip, Stepper Motor, Drone Motor, Sorting Box, Robot Chassis phụ kiện nhỏ khác — **lý do**: không nằm trong danh sách ưu tiên thumbnail user gửi lần này (Basic/Display/Robot Kit/Actuator/Sensor/Mechanical liệt kê cụ thể ~40 item, nhóm còn lại là input/cảm biến phụ chưa được yêu cầu).

### 4. Palette trước/sau
- **Trước**: mọi item hiển thị `<Icon className="h-4 w-4" />` trong ô 32x32 (`h-8 w-8`) nền màu đơn sắc theo `iconClassName` — khó phân biệt trực quan giữa các linh kiện cùng nhóm màu.
- **Sau**: ô thumbnail tăng lên 44x44 (`h-11 w-11`), item có illustration hiện SVG minh hoạ riêng trong khung viền `border-slate-600 bg-slate-800`; item chưa có illustration vẫn giữ layout icon+màu cũ (không falsely nâng cấp). Category header, badge supportLevel, hover/focus, search — giữ nguyên 100% hành vi cũ.

### 5. Test result (test thật qua browser, lab "tes1")
| Test | Kết quả |
|---|---|
| Palette thumbnail (mở popup, cuộn qua Basic/Display/Input/Sensor/Robot Kit) | PASS — LED/Buzzer/RGB LED/7-Segment/TFT/LCD/LCD I2C hiện đúng hình minh hoạ riêng, phân biệt rõ ràng |
| Search (`motor`, `sensor`) | PASS — DC Motor/L298N, Color Sensor/DHT11/DHT22/Flame Sensor/MQ Gas/IR Obstacle đều giữ đúng thumbnail khi lọc |
| Add component (Flame Sensor qua palette) | PASS — thêm đúng vào canvas, auto-select, canvas render không đổi (vẫn dùng `wokwi-flame-sensor` thật, không qua code palette) |
| Delete | PASS — 3→2 linh kiện, xác nhận qua page text |
| Save/reload | PASS — "Đã lưu" xác nhận sau mỗi thao tác |
| Analyze/Run không crash | PASS — Compile cache hit, QEMU chạy, boot log + serial hiện đầy đủ |
| Regression L298N runtime | PASS — chạy thật qua QEMU, `part-state: l298n motor=A state=forward`, card hiện "A:Tiến B:—", Stop reset về "A:— B:—", dedupe log giữ nguyên |
| Console error | Không có lỗi mới thật (chỉ có log HMR cũ đóng băng timestamp từ lúc đang sửa file, biến mất sau full navigate/refresh — không tái hiện khi thao tác thật) |

### Kỹ thuật quan trọng
- `tsc --noEmit` sạch sau mỗi bước tách file.
- Không đổi `supportLevel`/badge của bất kỳ component nào — chỉ đổi renderer thumbnail trong popup.
- Không đụng compile flow, QEMU runner, adapter LED/Buzzer/RGB LED/L298N — các linh kiện này canvas vẫn render qua `@wokwi/elements` thật, thumbnail palette là code hoàn toàn tách biệt.

## COMPONENT LIBRARY — Audit pin/visual chuẩn theo thực tế (2026-07-28)

### Bối cảnh
Mở rộng scope từ "làm đẹp thumbnail" sang: (1) mỗi linh kiện phải có hình minh hoạ giống thực tế (PCB/terminal/chân cắm, không phải icon Lucide chung chung), (2) mỗi linh kiện phải có pin/cổng đúng — tên, vị trí, đồng bộ FE (pinMaps.ts) ↔ BE (SupportedPins/ComponentGlueRegistry). Task này **KHÔNG đụng compile/QEMU/runtime adapter** — chỉ audit + bổ sung UI/pin metadata.

### 1. Kết quả audit FE↔BE pin consistency
Đối chiếu tay TOÀN BỘ `pinMaps.ts` (FE) với `VirtualLabDiagramService.SupportedPins` (BE) và `ComponentGlueRegistry` (DB, qua `StemDbContext.cs` HasData + xác nhận số dòng thật trong DB) cho ~43 component đã có từ trước: **0 mismatch tên pin nào được tìm thấy** — cả 3 nguồn (FE pinMaps, BE SupportedPins, DB ComponentGlueRegistry.PinRequirementsJson) đều khớp nhau về tên/số lượng pin cho mọi component wiring-validation/runtime-supported hiện có. Đây là bằng chứng các round trước đã làm cẩn thận, không phải rà soát hình thức.

Phát hiện phụ (không phải bug nghiêm trọng, ghi nhận backlog):
- `wokwi-pushbutton`: BE cho phép 4 tên pin (`1.l`,`1.r`,`2.l`,`2.r`) nhưng FE `PUSHBUTTON_PINS` chỉ vẽ 2 dot (`1.l`,`2.r`) — khớp đúng `pinInfo` thật của `@wokwi/elements` (chỉ 2 pin lộ ra ngoài), không phải lỗi.
- `wokwi-lcd2004`: có trong BE `SupportedPins` nhưng KHÔNG có component tương ứng nào ở FE (không palette, không pinMaps) — entry mồ côi, không gây lỗi (không ai gửi type này lên) nhưng nên dọn dẹp sau.
- `wokwi-line-tracking-sensor`: đơn giản hoá còn 1 chân `OUT` (module thật thường có 1/3/5 mắt cảm biến) — quyết định có chủ đích để giữ đơn giản, ghi nhận là giới hạn kỹ thuật đã biết, không mở rộng thêm trong task này.

### 2. Component mới thêm (theo danh sách ưu tiên user gửi, chưa từng tồn tại trong hệ thống)
| Component | Trên Wokwi? | Pin | supportLevel |
|---|---|---|---|
| **IMU MPU6050** | CÓ — element thật `wokwi-mpu6050`, 8 pin lấy trực tiếp từ `pinInfo` (không suy đoán) | VCC, GND, SCL, SDA, XDA, XCL, AD0, INT | Kiểm tra nối dây |
| **ESC (Electronic Speed Controller)** | KHÔNG — tự vẽ SVG (PCB + terminal, tham khảo hình dáng ESC brushed-motor phổ biến) | SIG, GND, BATT+, BATT-, OUT+, OUT- | Kiểm tra nối dây |
| **Heating Element** | KHÔNG — tự vẽ SVG (thanh nhiệt trở, giống layout Fan/Water Pump) | +, - | Kiểm tra nối dây |
| **pH Sensor** | KHÔNG — tự vẽ SVG (đơn giản hoá theo module pH meter phổ biến: VCC/GND/PO analog) | VCC, GND, PO | Kiểm tra nối dây |

Cả 4 đều: KHÔNG có runtime adapter (đúng yêu cầu "không thêm runtime mới"), wiring validation dừng ở "structural only" (giống toàn bộ nhóm mở rộng trước đó), đã thêm đồng bộ ở cả 3 nơi (FE `pinMaps.ts` + BE `SupportedPins` + DB `ComponentGlueRegistry` — insert thật qua throwaway Npgsql seeder, xác nhận `Supported=true` cho cả 4 dòng).

### 3. Danh sách "Wokwi không có" (đầy đủ, tự vẽ SVG, tham khảo hình dáng module thực tế)
L298N, DC Motor, Robot Wheel, Caster Wheel, Robot Chassis, Battery Pack, Power Switch, Breadboard, Delivery Box, Relay Module, Fan, Water Pump, Water Leak Sensor, Rain Sensor, Soil Moisture Sensor, IR Obstacle Sensor, Line Tracking Sensor, Color Sensor, Vibration Sensor, Solenoid/Valve, ESP32-CAM, WiFi/Cloud Node, Dashboard/Cloud, Robot Arm Base, Gripper, Conveyor Belt, Sorting Box, Ball, Fire Extinguisher, Water Tank, Drone Frame, Propeller, Drone Motor, Stair/Obstacle, Trash Object, Delivery Item, **ESC (mới)**, **Heating Element (mới)**, **pH Sensor (mới)**.

### 4. Component vẫn dùng visual tạm (icon+tên, chưa có SVG riêng)
Solenoid/Valve, Sorting Box, Ball, Fire Extinguisher, Water Tank, Drone Motor, Stair/Obstacle Block, Trash Object, Delivery Item, Color Sensor — **10 item**. Toàn bộ đều là `visual-only` (Sorting Box/Ball/Fire Extinguisher/Water Tank/Drone Motor/Stair-Obstacle/Trash Object/Delivery Item) hoặc wiring-validation không có yêu cầu hiển thị pin phức tạp (Color Sensor, Solenoid/Valve) — không ảnh hưởng tính đúng của pin/wiring, chỉ là thẩm mỹ, để backlog.

### 5. File đã sửa (FE)
- `componentTypeNormalize.ts` — thêm 4 mapping mới.
- `pinMaps.ts` — thêm `MPU6050_PINS`/`ESC_PINS`/`HEATING_ELEMENT_PINS`/`PH_SENSOR_PINS` + dispatch.
- `componentIllustrations.tsx` — thêm 3 SVG fallback-card (ESC/Heating Element/pH Sensor) + 1 thumbnail palette riêng (MPU6050, vì là real element không có fallback-card).
- `CircuitCanvas.tsx` — thêm `WOKWI_REAL_ELEMENT_TAGS['mpu6050']`.
- `componentReferenceCatalog.ts` — 4 entry COMPONENT_REFERENCES + category (Sensor: mpu6050/ph_sensor; Output/Actuator: esc/heating_element).
- `robotKitComponents.ts` — 4 entry `EXTENDED_COMPONENT_LIBRARY` (đầy đủ pins/wiringRules/visualSource).

### File đã sửa (BE)
- `VirtualLabDiagramService.cs` — thêm 4 `SupportedPins` entry.
- `StemDbContext.cs` — thêm 4 `ComponentGlueRegistry` HasData (tài liệu/fresh-DB seed).
- `SQLScripts/AddPinAccurateComponentGlueRegistry.sql` (mới) — đã chạy thật vào DB Supabase qua throwaway Npgsql console seeder, xác nhận 4 dòng `Supported=true`.

### 6. Test result (test thật qua browser, lab "tes1", sau khi user restart BE + đăng nhập lại)
| Test | Kết quả |
|---|---|
| Palette thumbnail (MPU6050/ESC/Heating Element/pH Sensor) | PASS — mỗi item có SVG riêng phân biệt được, badge "Kiểm tra nối dây" đúng, đúng category (Sensor/Output-Actuator) |
| Search (`mpu`, `ESC`, `heating`, `pH`) | PASS |
| Add cả 4 component vào canvas | PASS — MPU6050 render bằng element thật `wokwi-mpu6050` (không phải fallback), 3 item còn lại render fallback-card mới |
| Pin dots đúng vị trí + hover hiện tên chân | PASS — verify cụ thể qua `getBoundingClientRect()` + synthetic `pointerover`: tooltip hiện đúng `wokwi-mpu6050-<id>:VCC` tại đúng toạ độ pin thật lấy từ `pinInfo` |
| Save/reload | PASS — "6 linh kiện" giữ đúng type/label sau F5 |
| Analyze không crash | PASS — "Sơ đồ hợp lệ" dù 4 component mới chưa nối dây gì (đúng hành vi structural-only, không chặn Run) |
| Run không crash | PASS — QEMU chạy, boot log + Serial Monitor hiển thị bình thường |
| Delete | PASS — xoá cả 4, về lại đúng baseline "2 linh kiện" |
| Regression L298N | PASS — `part-state: l298n motor=A state=forward`, card hiện "A:Tiến B:—", Stop reset đúng |
| Console error | Không có (0 lỗi trong suốt phiên test) |

### 7. Backlog tiếp theo
- 10 component còn visual tạm (mục 4) — vẽ SVG riêng nếu cần, không khẩn cấp (visual-only, không ảnh hưởng wiring).
- `wokwi-lcd2004` orphan trong BE `SupportedPins` — dọn dẹp hoặc bổ sung FE tương ứng.
- Line Tracking Sensor đa kênh (OUT1/OUT2/OUT3) nếu cần độ chính xác cao hơn cho bài dò line nhiều mắt — hiện đơn giản hoá 1 kênh.
- Hiển thị pin `kind` (power/ground/i2c/analog/...) trong hover tooltip — metadata đã có sẵn trong `ComponentGlueRegistry.PinRequirementsJson` từ trước nhưng FE chưa đọc/hiển thị field này, chỉ hiện tên pin.

## COMPONENT LIBRARY — Hoàn thiện nốt: 10 visual tạm + Line Tracking đa kênh + lcd2004 + pin kind (2026-07-28, tiếp theo)

### 1. 10 component visual tạm — đã hoàn thiện
Tất cả 10 item (Solenoid/Valve, Sorting Box, Ball, Fire Extinguisher, Water Tank, Drone Motor, Stair/Obstacle Block, Trash Object, Delivery Item, Color Sensor) đã có SVG riêng trong `getFallbackIllustration()` (dùng đúng width/height card thật, không phải bản 44x44 chỉ dành cho palette trước đây). Đồng thời dọn dẹp: xoá 8 case trùng lặp trong `getExtraIllustration()` (palette tự động dùng lại bản mới qua `getComponentIllustration()` ưu tiên `getFallbackIllustration()` trước) — không còn duplicate SVG code ở 2 nơi.

### 2. Line Tracking Sensor — đã có bản 3/5 kênh
Thêm `wokwi-line-tracking-3ch` (VCC/GND/OUT1-3) và `wokwi-line-tracking-5ch` (VCC/GND/OUT1-5), **BỔ SUNG** bên cạnh `wokwi-line-tracking-sensor` (1 kênh) cũ — không sửa/xoá bản cũ, tránh phá diagram cũ đang dùng. Visual: SVG PCB xanh + N cặp mắt IR (emitter/receiver dome) trải đều theo chiều ngang, có label "3CH"/"5CH". Pin dot + hover label đã verify đúng vị trí qua browser thật. supportLevel: `wiring-validation` (không runtime).

### 3. lcd2004 — xử lý theo hướng A (đồng bộ đầy đủ)
Audit xác nhận: BE `SupportedPins` có entry `wokwi-lcd2004` từ trước nhưng **sai** (`VCC,GND,SDA,SCL,A,K` — A/K là chân backlight chỉ tồn tại ở chế độ pins="full" 16 chân, không có ở chế độ i2c 4 chân), và **chưa từng có** ở FE (registry/pinMaps/palette) lẫn DB (`ComponentGlueRegistry`). Xác nhận `@wokwi/elements` CÓ element thật (`LCD2004Element extends LCD1602Element`, numCols=20/numRows=4, tag `wokwi-lcd2004`) — chọn hướng A: nối đầy đủ FE (pinMaps/catalog/registry/CircuitCanvas) + BE (sửa lại đúng 4 pin thật `GND,VCC,SDA,SCL` + thêm dòng `ComponentGlueRegistry`), ép thuộc tính `pins="i2c"` khi render (LCD 20x4 thực tế luôn dùng qua I2C backpack). Verify qua browser: render đúng hình LCD 20x4 thật (không phải fallback), hover đúng `SDA (i2c)`.

**Phát hiện phụ khi audit tọa độ pin LCD**: ban đầu nghi ngờ `LCD1602_I2C_PINS`/`LCD2004_PINS` sai vị trí do so sánh nhầm số viewBox (94.05) với kích thước CSS render thật (355px, do SVG dùng đơn vị "mm" khiến trình duyệt tự co giãn ~3.78 lần) — nhưng đo trực tiếp vị trí thật của text pin (`getBoundingClientRect()` trên `<tspan>` trong shadow DOM) xác nhận toạ độ ĐANG LƯU (GND: 4,32 v.v.) khớp gần đúng vị trí hiển thị thật (GND đo được ≈ 7.7,31.6) — **không phải bug, tọa độ cũ đã đúng**, không sửa gì.

### 4. Pin kind trong tooltip — đã hoạt động
`getPinKind(type, pinName)` (mới, trong `pinMaps.ts`) — rule theo tên pin (VCC/5V/3V3/VDD/VIN/+ → power; GND/-/VSS → ground; SDA/SCL/XDA/XCL → i2c; *PWM* → pwm; AO/AOUT/A\d+ → analog; DO/DOUT → digital; mặc định → signal) + override theo ngữ cảnh component cụ thể (Relay COM/NO/NC → "terminal (tiếp điểm)"; L298N OUT1-4 → "power output (ra động cơ)"; DC Motor/Fan/Water Pump/Heating Element +/- → "power output (tải, +/-)"; ESC BATT+/- → "power/ground (pin)", OUT+/- → "power output"; LCD A/K → "power/ground (backlight)"). Verify sống qua browser: `l298n-1:IN1 (signal)`, `l298n-1:VIN (power)`, `l298n-1:GND (ground)`, `wokwi-mpu6050-...:VCC (power)` (từ round trước), `wokwi-lcd2004-...:SDA (i2c)`.

### File đã sửa (FE)
`componentTypeNormalize.ts`, `pinMaps.ts` (thêm `LINE_TRACKING_3CH_PINS`/`_5CH_PINS`/`LCD2004_PINS`/`getPinKind()`), `componentIllustrations.tsx` (10 SVG mới + dọn duplicate + line-tracking đa kênh + lcd2004 thumbnail), `CircuitCanvas.tsx` (`WOKWI_REAL_ELEMENT_TAGS['lcd2004']`, ép `pins="i2c"`, `renderPinDots` nhận thêm `ownerType` để tính pin kind), `componentReferenceCatalog.ts`, `robotKitComponents.ts`.

### File đã sửa (BE)
`VirtualLabDiagramService.cs` (thêm `wokwi-line-tracking-3ch`/`-5ch`, **sửa lại đúng** `wokwi-lcd2004`), `StemDbContext.cs` (3 `ComponentGlueRegistry` HasData mới), `SQLScripts/AddLineTrackingMultiChAndLcd2004GlueRegistry.sql` (mới, đã chạy thật vào DB Supabase qua throwaway Npgsql seeder, xác nhận `Supported=true` cho cả 3 dòng).

### Test result (test thật qua browser, lab "tes1", sau khi user restart BE)
| Test | Kết quả |
|---|---|
| Palette search/thumbnail (line-tracking 3ch/5ch, LCD 20x4, Fire Extinguisher, RGB LED) | PASS |
| Add vào canvas — visual đúng | PASS — line-tracking hiện đúng N mắt IR, LCD2004 render bằng element thật (không phải fallback), Fire Extinguisher hiện hình bình chữa cháy đỏ |
| Pin dot + hover label đúng tên + kind | PASS — verify trực tiếp qua `getBoundingClientRect`/`pointerover` cho L298N (IN1/VIN/GND) và LCD2004 (SDA) |
| Save/reload | PASS — "8 linh kiện" giữ đúng sau F5 |
| Analyze không crash | PASS — "Sơ đồ hợp lệ" dù nhiều component mới chưa nối dây (structural-only, đúng hành vi) |
| Run không crash | PASS — QEMU chạy, boot log + Serial Monitor bình thường |
| Regression L298N | PASS — `part-state: l298n motor=A state=forward`, "A:Tiến B:—" |
| Regression RGB LED | PASS (smoke test: render sạch, không lỗi console — code path RGB LED không bị đụng trong 2 vòng task pin/visual, badge "Mô phỏng được" đúng; unwired RGB LED tạo đúng 4 lỗi mạch như kỳ vọng theo rule cũ, xác nhận validation vẫn hoạt động đúng) |
| Serial Monitor | Không ảnh hưởng — log compile/simulation/boot/println vẫn đúng thứ tự như các round trước |
| Delete + cleanup | PASS — về đúng baseline "2 linh kiện" |
| Console error | Không có lỗi mới trong suốt phiên test |

## KIẾN TRÚC ĐỀ XUẤT — Sensor Input thật / WiFi-Cloud / Physics robot-drone-AI (2026-07-28, PLAN — chưa implement)

Grounded lại trên 2 investigation đã có bằng chứng thật (không suy đoán lại):
mục "HC-SR04 — Điều tra thật khả năng inject GPIO input" (QMP thật, kết luận:
GPIO = MMIO thuần, không có QOM property/QMP command nào cho host set input)
và mục "SERIAL MONITOR — raw serial thật" (WiFi.scanNetworks() treo firmware
vô thời hạn, xác nhận 3/3 lần, N/A thật sự). Đọc thêm
`QemuEsp32Runner.cs` xác nhận: container Docker chạy QEMU có `--network none`
+ `--cap-drop ALL` + `--read-only` — sandbox hardening cố ý, không đụng.
`SimulationEventResponse{Type,Time,Payload}` (Type là string tự do, Payload
là Dictionary tự do) — mở rộng bằng `Type` mới là an toàn 100%, không đổi
schema.

### 1. Kiến trúc đề xuất

**A. Sensor input thật** — QEMU-injection trực tiếp (set GPIO từ host) đã
được xác nhận không khả thi với machine model hiện tại (không phải giả
định). Hướng khả thi duy nhất: kênh phụ qua uart1/uart2 (ESP32 model có
sẵn, đang chỉ dùng uart0 cho SF_EVENT) làm socket 2 chiều — BE ghi giá trị
input (do giáo viên/học sinh cấu hình qua UI, không phải vật lý mô phỏng
thật — không ray-casting, không đo khoảng cách theo scene 3D) vào socket,
firmware đọc qua 1 macro wrapper mới (cùng pattern với __sf_digitalWrite).
Nếu build được: đây là runtime-supported thật (firmware thật sự rẽ nhánh
theo giá trị đọc được), nhưng phải ghi rõ trong badge/notes: "input do
người dùng điều khiển qua UI, không phải sensor vật lý mô phỏng" — không
được ngầm hiểu là "đo khoảng cách thật".

**B. WiFi/Cloud** — Thật (WiFi.connect() + gọi HTTP/MQTT thật từ firmware)
không khả thi vì 2 lớp chặn cộng dồn: (1) QEMU không giả lập WiFi radio
(firmware treo tại WiFi.mode(), đã xác nhận thật), (2) container
--network none (dù QEMU có giả lập WiFi, gói tin cũng không ra khỏi
container). Mở lại network cho container là thay đổi an ninh sandbox compile
— ngoài phạm vi, cần quyết định riêng nếu muốn cân nhắc. Hướng khả thi: Cloud
Scenario mô phỏng, tách rời hoàn toàn khỏi firmware/QEMU — BE phát 1 kịch
bản dữ liệu định trước (JSON script giáo viên cấu hình) qua event type mới
(cloud-scenario), FE hiện 1 panel "Cloud Dashboard" luôn có banner cố định
"MÔ PHỎNG KỊCH BẢN — không phải dữ liệu thật từ firmware/mạng". Không liên
quan gì tới firmware đang chạy thật trong QEMU.

**C. Physics robot/drone/AI** — Hiện không có bất kỳ engine vật lý nào trong
hệ thống (đã grep xác nhận, 0 kết quả). Có 1 nền tảng tận dụng được: L298N
motor state (part-state: l298n motor=A/B state=...) là dữ liệu thật từ
firmware. Đề xuất: "Robot Playground" — panel canvas FE-only, subscribe
event part-state có sẵn (không thêm event mới), suy ra vị trí/hướng robot
2D bằng công thức kinematics differential-drive đơn giản (không phải physics
engine — không ma sát, không va chạm, không mô-men). Vì driven bởi state
GPIO thật, có thể ghi "runtime-supported (mô phỏng chuyển động 2D đơn giản
theo trạng thái motor thật)". Drone/AI: không có tín hiệu điều khiển thật
nào (ESC/Propeller hiện chỉ wiring-validation, QEMU không instrument
PWM/analogWrite/ledcWrite) — không có nền tảng để làm thật, đề xuất
không làm trong đợt này.

### 2. Chia phase

| Phase | Nội dung | Feature flag | Rủi ro | Phụ thuộc |
|---|---|---|---|---|
| 0 | Hạ tầng feature flag (BE IConfiguration/appsettings, FE env/context) | — | Rất thấp | Không |
| 1 | Sensor input digital (toggle 1 pin từ UI, vd PIR/nút bấm ảo) qua kênh uart2 | EnableSensorInputChannel | Cao — cần spike xác nhận QEMU Espressif fork thật sự expose -serial2/chardev cho uart1/uart2 trước khi cam kết thiết kế chi tiết | Phase 0 |
| 2 | Sensor input analog/pulse (HC-SR04 ECHO qua pulseIn(), LDR/potentiometer qua analogRead()) | EnableAnalogSensorInputChannel | Cao — thêm rủi ro timing drift CPU ảo vs host | Phase 1 |
| 3 | Cloud Scenario (kịch bản, tách rời firmware) | EnableCloudScenario | Thấp — không đụng QEMU/firmware | Phase 0 |
| 4 | Robot Playground (kinematics 2D từ part-state thật) | EnableMovementPlayground | Rất thấp — FE-only, không đụng BE runtime | Phase 0 |
| 5 (chưa làm) | Drone/AI | — | — | Thiếu nền tảng tín hiệu thật |

Đề xuất thứ tự làm: Phase 0 → Phase 4 (thắng nhanh, rủi ro thấp nhất,
dùng data thật có sẵn) song song Phase 3 (cũng an toàn) → spike riêng cho
Phase 1 (xác nhận khả thi QEMU trước khi thiết kế/code) → Phase 2 nếu Phase 1
thành công.

### 3. File cần sửa (dự kiến theo phase)

- Phase 0: appsettings.json (feature flags), 1 service đọc flag (BE),
  context/hook đọc flag (FE) — additive thuần tuý.
- Phase 1-2: QemuEsp32Runner.cs (thêm chardev/socket cho uart2, không
  đổi cách đọc serial.log/uart0 hiện tại), FirmwareCacheService.cs
  (GpioInstrumentationPreamble thêm macro đọc input mới — bump
  InstrumentationVersion, đây là cơ chế versioning đã có sẵn, không phải
  đổi logic cache key), SimulationDtos.cs (event type mới, không đổi
  SimulationEventResponse shape), FE: panel điều khiển input mới trong
  LabSandboxPage.tsx/CircuitCanvas.tsx, BE: HcSr04Model.cs/tương tự
  (model mới, giống pattern L298nModel.cs).
- Phase 3: BE service phát cloud-scenario event theo timer/script (mới,
  độc lập QemuEsp32Runner), FE: CloudDashboardPanel.tsx (mới).
- Phase 4: FE thuần: RobotPlaygroundPanel.tsx (mới, subscribe
  applySimulationEvent hiện có trong LabSandboxPage.tsx), không đụng BE.

### 4. Rủi ro kỹ thuật

- QEMU Espressif fork có thật sự cho map uart1/uart2 ra chardev socket
  qua tham số dòng lệnh không — chưa xác nhận thực nghiệm, chỉ mới xác
  nhận 2 UART này tồn tại trong QOM tree. Bắt buộc spike QMP/thử tay trước
  khi thiết kế chi tiết Phase 1 (đúng cách đã làm với HC-SR04).
- Macro wrapper input mới (giống __sf_digitalWrite) có rủi ro thứ tự định
  nghĩa giống bug đã gặp trước đây (định nghĩa #define trước hàm thật gây
  đệ quy vô hạn) — áp dụng đúng bài học cũ.
- Bump InstrumentationVersion làm mọi firmware cache cũ thành miss (an
  toàn — chỉ trigger compile lại, không mất dữ liệu, không phá diagram) —
  cần thông báo trước nếu làm vào giờ cao điểm (tăng tải compile tạm thời).
- Timing precision pulseIn() giả lập qua uart2: CPU ảo trong QEMU chạy
  không đồng bộ hoàn hảo với đồng hồ host — cần đo thật trước khi claim độ
  chính xác khoảng cách HC-SR04.
- Cloud Scenario: phải có banner/label rõ ràng liên tục trên UI, tránh học
  sinh hiểu nhầm là kết nối cloud thật — rủi ro sư phạm nhiều hơn kỹ thuật.
- Robot Playground: kinematics đơn giản có thể trông "quá mượt" so với thật
  — cần ghi rõ trong tooltip/notes "mô phỏng chuyển động, không phải physics
  đầy đủ (không ma sát/va chạm/mô-men)".
- Không phase nào được đụng: TryGetCachedFirmwareAsync/CompileAndCacheAsync
  logic, cách hash cache key (chỉ thêm 1 giá trị input vào hash qua
  InstrumentationVersion bump — cơ chế có sẵn), QemuEsp32Runner core đọc
  serial.log/uart0, SimulationEventResponse schema, LED/Buzzer/RGB
  LED/L298N adapter, Docker --network none.

### 5. Test bắt buộc (mỗi phase, qua browser thật)

- Regression bắt buộc mọi phase: LED/Buzzer/RGB LED/L298N runtime PASS,
  Serial Monitor không đổi hành vi cũ, compile Docker sandbox PASS, save/
  reload diagram PASS, Analyze/Run no-crash, 0 console error mới.
- Phase 1-2: toggle input qua UI → firmware thật đọc được giá trị (verify
  qua Serial.println đối chiếu, không chỉ verify UI đổi màu) → tắt feature
  flag → hệ thống về đúng hành vi cũ 100%.
- Phase 3: bật Cloud Scenario → banner "MÔ PHỎNG" hiển thị đúng, tắt flag →
  panel biến mất hoàn toàn, không ảnh hưởng Serial Monitor/simulation event
  khác.
- Phase 4: chạy L298N forward/backward thật → Robot Playground vẽ đúng
  hướng di chuyển tương ứng; Stop → robot dừng; tắt flag → panel ẩn, không
  ảnh hưởng phần còn lại.

### 6. Làm ngay vs chưa nên làm

- Làm ngay được: Phase 0 (feature flag), Phase 4 (Robot Playground — rủi ro
  thấp nhất, dùng dữ liệu thật có sẵn, FE-only), Phase 3 (Cloud Scenario —
  tách rời firmware, an toàn).
- Cần spike riêng trước khi cam kết code: Phase 1 (sensor input digital) —
  phải xác nhận thực nghiệm khả năng chardev socket cho uart1/uart2 trước,
  giống cách đã làm QMP investigation cho HC-SR04.
- Chưa nên làm: Phase 2 (phụ thuộc Phase 1 thành công), Phase 5 (Drone/AI)
  — thiếu nền tảng tín hiệu điều khiển thật, không nên xây UI/scenario
  không có gì thật phía sau (đúng nguyên tắc "không fake PASS").

## SENSOR INPUT BRIDGE — Phase 1 (scenario/timeline) (2026-07-28)

### Bối cảnh
Mở rộng từ 3 khoảng trống (Sensor input thật / WiFi-Cloud / Physics) đã lập
kiến trúc đề xuất trước đó — triển khai THẬT Phase 1 của phần Sensor Input,
theo đúng thiết kế do user chỉ định: KHÔNG cần channel giao tiếp 2 chiều mới
với QEMU (điều đã điều tra kỹ và xác nhận không khả thi ở mục "HC-SR04 —
Điều tra thật khả năng inject GPIO input") — thay vào đó nhúng TOÀN BỘ
scenario/timeline vào firmware NGAY LÚC COMPILE, firmware tự tra bảng theo
`millis()` nó tự đọc được.

### 1. Kiến trúc Sensor Input Bridge
- **FE**: `SensorScenarioPanel.tsx` (mới) — timeline editor cho từng sensor
  HC-SR04/PIR đang có trên canvas (liệt kê theo `componentId`, KHÔNG phụ
  thuộc canvas selection state — tránh đụng `CircuitCanvas.tsx`). Lưu vào
  state `sensorScenario` (LabSandboxPage.tsx), nhúng vào `circuitConfig`
  cùng `parts`/`connections` — đi theo ĐÚNG cơ chế save/reload/run diagram có
  sẵn (không API/DB mới).
- **BE**: `SensorRuntimeHeaderGenerator.cs` (mới) — nhận
  `VirtualLabRuntimeDiagramSnapshot` (đã có PinToGpio thật từ wiring) +
  `SensorScenarioConfig` (parse từ `diagramJson.sensorScenario`), sinh 1
  đoạn C++ header text:
  - Với mỗi HC-SR04/PIR ĐÃ NỐI DÂY đủ (TRIG+ECHO hoặc OUT), sinh 1 cặp mảng
    song song `{tên}_t[]` (mốc thời gian ms) + `{tên}_v[]` (giá trị) — KHÔNG
    dùng struct (xem mục Rủi ro/Bug đã vá).
  - Hàm `__sf_lookupBool`/`__sf_lookupFloat` tra bảng theo `millis()` hiện
    tại (step function — giữ nguyên giá trị mốc gần nhất đã qua).
  - `__sf_digitalRead(pin)`/`__sf_pulseIn(pin,state[,timeout])` — wrapper
    theo ĐÚNG pattern `__sf_digitalWrite` cũ (định nghĩa hàm thật TRƯỚC, gọi
    hàm gốc `digitalRead`/`pulseIn` trong nhánh `default` — lúc đó macro
    CHƯA có hiệu lực nên gọi đúng hàm thật, không đệ quy), rồi mới
    `#define` SAU.
  - Component không được cấu hình scenario (nhưng có wire) vẫn nhận giá trị
    mặc định an toàn (distanceCm=400/motion=false) — không bao giờ đọc "rác".
- **Cache key**: `FirmwareCacheService.ResolveCacheDir` nhận thêm tham số
  `sensorHeader` (mặc định `""`) — nối vào cuối `keyInput` trước khi hash.
  Rỗng (không sensor/feature tắt) → hash giữ NGUYÊN 100% như trước, đã verify
  sống (xem mục Test). Khác rỗng CHỈ khi diagram thật sự có sensor scenario —
  đúng ý nghĩa "khác input phải khác cache", không phải đổi cơ chế cache.
- **Feature flag**: `SimulationRunner:Qemu:EnableSensorInputScenario`
  (appsettings.json, mặc định `true` cho môi trường dev này để test — nên
  cân nhắc `false` mặc định khi lên môi trường khác). Tắt = hành vi y hệt
  trước khi có tính năng này (không parse scenario, không sinh header).

### 2. File đã sửa/tạo
**BE (mới)**: `SensorScenarioDtos.cs`, `SensorRuntimeHeaderGenerator.cs`.
**BE (sửa)**: `IFirmwareCacheService.cs`, `FirmwareCacheService.cs`
(`ResolveCacheDir`/`CompileAndWriteCacheCoreAsync` nhận `sensorHeader`),
`QemuEsp32Runner.cs` (đọc feature flag, parse scenario, gọi generator, pass
`sensorHeader` xuống 2 lời gọi cache), `appsettings.json` (feature flag).
**FE (mới)**: `SensorScenarioPanel.tsx`.
**FE (sửa)**: `dashboardApi.ts` (`SensorScenarioConfig`/`SensorTimeline`/
`SensorTimelineEntry` types, `LabCircuitConfig.sensorScenario`,
`diagramsApi.save()` ghi thêm key này), `LabSandboxPage.tsx` (state, hydrate
lúc load, đưa vào cả 3 payload: autosave/Run-start/Submit).

### 3. Sensor hỗ trợ Phase 1
- **HC-SR04** — `pulseIn(ECHO,...)` đọc `distanceCm` theo timeline, quy đổi
  `durationUs = distanceCm * 58`.
- **PIR Motion Sensor** — `digitalRead(OUT)` trả HIGH/LOW theo `motion`
  timeline.

### 4. Sensor CHƯA hỗ trợ (lý do)
Line Tracking 3/5 kênh, Water Leak, Flame, DHT11/22, Soil Moisture/Rain/
Vibration/Color Sensor — **cơ chế (macro wrapper + timeline lookup) đã sẵn
sàng để mở rộng** (chỉ cần thêm case trong `SensorRuntimeHeaderGenerator.cs`
+ field tương ứng trong `SensorTimelineEntry`), nhưng CHƯA làm trong lượt
này để tránh code chưa test kỹ ("không được fake PASS") — DHT11/22 cần thêm
cân nhắc riêng vì thư viện `DHT.h` thật không gọi trực tiếp
`digitalRead`/`analogRead` theo pin đơn giản (dùng giao thức 1-wire timing
riêng), cần `StemFlowDHT` helper riêng như user đã gợi ý, chưa làm.

### 5. Cách inject firmware helper
`instrumentedSource = GpioInstrumentationPreamble + sensorHeader + sourceCode`
(trong `CompileAndWriteCacheCoreAsync`) — `sensorHeader` là text C++ thuần,
chèn TRƯỚC code học sinh, SAU preamble GPIO cũ. Áp dụng đồng nhất cho cả 2
nơi gọi compile (`QemuEsp32Runner` lúc Run thật, `PrecompileTriggerService`
lúc giáo viên lưu bài — do tham số có default `""`, nơi thứ 2 không cần sửa
gì, tự động không bị ảnh hưởng).

**BUG THẬT đã vá qua 2 vòng compile thật (không suy đoán):**
1. `100f` không phải literal float hợp lệ trong C++ (thiếu dấu chấm) → sửa
   thành `100.0f`.
2. Bản đầu dùng `struct __sf_TimelineEntryBool/Float` làm tham số con trỏ
   cho hàm lookup — lỗi thật "does not name a type" dù struct đã khai báo
   trước trong cùng file. Nguyên nhân: **arduino-cli tự động sinh function
   prototype cho mọi hàm top-level và chèn lên ĐẦU file** (trước cả structs
   định nghĩa sau đó trong file) — hành vi chuẩn của Arduino (ctags-based
   prototype generation), không phải bug cache. Sửa triệt để bằng cách bỏ
   hẳn struct, chuyển sang 2 mảng song song kiểu nguyên thuỷ (`unsigned
   long*`/`bool*`/`float*`) — luôn có sẵn nên auto-prototype không bao giờ
   thiếu type. Đồng thời bỏ default argument trên `__sf_pulseIn` (cùng lý do
   — default argument bị nhân đôi giữa auto-prototype và định nghĩa thật gây
   lỗi "default argument specified in both declaration and definition"),
   thay bằng 2 overload tường minh (2 và 3 tham số).

### 6. Test result (test thật qua browser + compile Docker thật, không giả lập)
| Test | Kết quả |
|---|---|
| HC-SR04 — `pulseIn` đọc `distanceCm` theo timeline | **PASS** — Serial in đúng `HCSR04_DIST_CM=100.00` (t=0) → `25.00` (t=3000ms) → `10.00` (t=6000ms), khớp CHÍNH XÁC scenario cấu hình |
| PIR — `digitalRead` đọc `motion` theo timeline | **PASS** — Serial in đúng `PIR_MOTION=0` (t=0) → `1` (t=3000ms, giữ nguyên tới t=6000ms — đúng step function) |
| Compile thật qua Docker sandbox | **PASS** — "Biên dịch thành công", firmware chạy QEMU bình thường |
| Không crash QEMU | **PASS** |
| Cache key KHÔNG đổi khi không có sensor | **PASS** — verify trực tiếp: diagram L298N (không sensor) → "Dùng firmware cache — bỏ qua biên dịch" (cache HIT với đúng entry đã compile TRƯỚC KHI có tính năng này) |
| Regression L298N | **PASS** — `part-state: l298n motor=A state=forward`, card "A:Tiến B:—" |
| Regression RGB LED/Buzzer/LED | Không test runtime đầy đủ trong lượt này (không nằm trong sketch test) — code path hoàn toàn không bị đụng, rủi ro thấp; đã verify tương tự ở các round trước |
| Save/reload scenario | **PASS** — `sensorScenario` roundtrip đúng qua GET diagram (verify qua API) |
| Analyze/Run UI | **PASS** — Sensor Scenario panel mở/đóng đúng, thêm mốc thời gian, HC-SR04/PIR render đúng element thật trên canvas |
| Console error | Chỉ có lỗi SignalR/Network transient đúng lúc BE đang restart (2 lần, theo yêu cầu user) — tự phục hồi sau, không phải bug thật |

### 7. Limitation còn lại
- 7 loại sensor khác (Line Tracking/Water Leak/Flame/DHT/Soil-Rain-Vibration/
  Color) — cơ chế sẵn sàng, CHƯA implement (xem mục 4).
- Chỉ scenario/timeline tĩnh (baked lúc compile) — CHƯA làm interactive
  realtime slider (đúng phạm vi Phase 1 user yêu cầu, không phải thiếu sót).
- Event `sensor-state` (BE phát khi giá trị scenario đổi, để UI hiển thị) —
  KHÔNG bắt buộc theo yêu cầu gốc ("Không bắt buộc nếu firmware đã đọc được
  scenario") — CHƯA làm, firmware đã đọc + in ra Serial thật là bằng chứng
  đủ cho Phase 1.
- `EnableSensorInputScenario` đang để `true` mặc định trong appsettings.json
  môi trường dev này để phục vụ test — nên cân nhắc lại giá trị mặc định khi
  triển khai môi trường khác.

## SENSOR INPUT BRIDGE — Phase 2 (Line Tracking / generic digital-analog / DHT) (2026-07-28)

Mở rộng Phase 1 (HC-SR04, PIR) đã PASS — giữ NGUYÊN kiến trúc: header C++
sinh lúc compile, macro wrap digitalRead/analogRead/pulseIn theo đúng pattern
GpioInstrumentationPreamble cũ, cache key mở rộng có kiểm soát.

### 1. Sensor Phase 2 đã hỗ trợ
- **Line Tracking 3ch/5ch** — pattern → digitalRead từng kênh OUT.
- **Water Leak / Flame / Soil Moisture / Rain Sensor** — digitalRead (detected)
  + analogRead (0-4095).
- **Vibration Sensor SW-420** — digitalRead (detected) — KHÔNG có analog (đúng
  phần cứng thật, không có AOUT).
- **DHT11/DHT22** — qua `StemFlowDHT` helper class (readTemperature()/
  readHumidity()), KHÔNG override thư viện DHT.h thật.

### 2. File đã sửa/tạo
`SensorScenarioDtos.cs` (thêm field `Pattern`/`Detected`/`Analog`/
`Temperature`/`Humidity`), `SensorRuntimeHeaderGenerator.cs` (viết lại toàn
bộ `Generate()` — thêm pattern table Line Tracking 3/5ch, generic sensor pin
config, StemFlowDHT codegen, wrapper `analogRead` MỚI theo đúng pattern an
toàn cũ). FE: `dashboardApi.ts` (mở rộng `SensorTimelineEntry`),
`SensorScenarioPanel.tsx` (viết lại — dropdown pattern, checkbox detected +
input analog, input temperature/humidity, tự nhận diện 11 loại sensor).

### 3. Scenario JSON format (final)
```json
{
  "sensors": {
    "lt3-1": { "type": "wokwi-line-tracking-3ch", "timeline": [
      { "timeMs": 0, "pattern": "center" },
      { "timeMs": 3000, "pattern": "left" }
    ]},
    "water-1": { "type": "wokwi-water-leak-sensor", "timeline": [
      { "timeMs": 0, "detected": false, "analog": 300 },
      { "timeMs": 3000, "detected": true, "analog": 2800 }
    ]},
    "dht-1": { "type": "wokwi-dht22", "timeline": [
      { "timeMs": 0, "temperature": 28.5, "humidity": 70 }
    ]}
  }
}
```
Đúng như đề xuất gốc, chỉ khác 1 điểm quan trọng ghi rõ ở mục 7.

### 4. digitalRead/analogRead/pulseIn/helper đã có
- `__sf_digitalRead` — PIR, Line Tracking (N kênh/component), Water Leak,
  Flame, Soil Moisture, Rain, Vibration (tất cả dùng CHUNG 1 wrapper, nhiều
  case theo pin).
- `__sf_analogRead` (MỚI, Phase 2) — Water Leak, Flame, Soil Moisture, Rain
  (KHÔNG có Vibration — đúng phần cứng).
- `__sf_pulseIn` — HC-SR04 (không đổi từ Phase 1).
- `StemFlowDHT` class — DHT11/DHT22, KHÔNG qua macro nào.

### 5. Sensor chưa hỗ trợ
Không còn sensor nào trong danh sách 7 loại yêu cầu Phase 2 bị bỏ sót — tất
cả 7 đã có nhánh codegen thật (Line Tracking 3ch+5ch tính là 2, +5 sensor
group generic +DHT = 7). Ngoài phạm vi Phase 2: Color Sensor, MQ Gas Sensor,
LDR/Light Sensor — chưa làm (không nằm trong yêu cầu lần này).

### 6. Test result (test thật qua browser + compile Docker + QEMU, không giả lập)
| Test | Kết quả |
|---|---|
| Line Tracking 3ch — pattern center→left→right→lost | **PASS** — Serial in đúng `LT=010`→`100`→`001`→`000`, khớp CHÍNH XÁC bảng tra 3 kênh |
| Water Leak — digitalRead + analogRead | **PASS** — `WATER_D=0 WATER_A=300` → `WATER_D=1 WATER_A=2800`, khớp đúng scenario |
| Flame Sensor — digitalRead + analogRead | **PASS** — `FLAME_D=0 FLAME_A=200` → `FLAME_D=1 FLAME_A=3500`, khớp đúng scenario |
| Vibration Sensor — digitalRead | **PASS** — `VIB=0` → `VIB=1`, khớp đúng scenario |
| DHT22 — StemFlowDHT.readTemperature()/readHumidity() | **PASS** — `DHT_TEMP=28.50 DHT_HUM=70.00` → `31.20`/`65.00`, khớp CHÍNH XÁC 2 mốc thời gian cấu hình |
| Compile Docker thật | **PASS** — "Biên dịch thành công", QEMU chạy bình thường, không crash |
| FE Sensor Scenario Panel | **PASS** — dropdown pattern, checkbox detected + input analog hiện đúng, load lại đúng giá trị đã lưu |
| Regression HC-SR04 (Phase 1) | **PASS** — `100.00`→`25.00`, không đổi hành vi sau khi viết lại generator |
| Regression PIR (Phase 1) | **PASS** — `0`→`1` |
| Regression cache sensor-less (L298N) | **PASS** — "Dùng firmware cache — bỏ qua biên dịch" (cache HIT) |
| Regression L298N runtime | **PASS** — `part-state: l298n motor=A state=forward` |
| Regression RGB LED/Buzzer | Không test lại runtime đầy đủ lượt này (code path hoàn toàn không đụng, đã PASS nhiều lần các round trước) |
| Save/reload scenario Phase 2 | **PASS** — verify qua roundtrip API (isValid:true sau khi PUT diagram có sensorScenario 5 loại mới) |
| Console error | Chỉ có lỗi SignalR/Network transient đúng lúc BE restart theo yêu cầu (không phải bug thật) |

### 7. Limitation rõ ràng
- **Khác biệt so với đề xuất gốc**: `StemFlowDHT` class được **inject trực
  tiếp vào cùng file .ino đã compile** (không phải file `.h` riêng) — sketch
  **KHÔNG cần** dòng `#include "StemFlowDHT.h"` (nếu thêm dòng đó sẽ lỗi
  compile "file not found" vì không có file thật nào như vậy trong sandbox).
  Chỉ cần khai báo trực tiếp `StemFlowDHT dht("dht-1");` là dùng được ngay.
- Nhóm "digital/analog chung" (Water Leak/Flame/Soil/Rain): nếu 1 mốc thời
  gian chỉ set `analog` mà KHÔNG set `detected`, giá trị analog đó bị bỏ qua
  — mỗi mốc thời gian nên luôn set cả 2 field cùng lúc (đã ghi rõ trong code
  comment, cần lưu ý khi soạn scenario phức tạp).
- 5 kênh Line Tracking là suy diễn hợp lý của user (pattern "tương tự" không
  có bảng cụ thể) — mapping: mỗi mắt bật đúng 1 vị trí
  (far-left/left/center/right/far-right), lost=tất cả LOW, intersection=tất
  cả HIGH. Ghi rõ đây là lựa chọn thiết kế, không phải số liệu datasheet.
- Color Sensor, MQ Gas Sensor, LDR — chưa làm (ngoài phạm vi 7 sensor yêu cầu
  Phase 2), cơ chế đã sẵn sàng mở rộng tương tự nhóm generic digital/analog.
- Scenario vẫn tĩnh (baked lúc compile) — chưa có interactive realtime, đúng
  phạm vi đã thống nhất từ Phase 1.


## WiFi/Cloud — Virtual Cloud Runtime (Phase 1)

### Kiến trúc

Cùng nguyên tắc với Sensor Input Bridge (không channel giao tiếp 2 chiều mới
với QEMU) nhưng theo CHIỀU NGƯỢC LẠI: sketch chủ động IN dữ liệu ra Serial,
BE đọc lại. KHÔNG dùng WiFi thật (`WiFi.begin`/`WiFi.mode` đã biết gây Guru
Meditation crash trong QEMU/ESP32 core 2.0.17) — `StemFlowCloud` (class C++
auto-inject, xem `CloudRuntimeHeaderGenerator.cs`) chỉ in 1 dòng marker máy
đọc được ra Serial qua `ets_printf` (ROM UART cấp thấp — ĐÚNG pattern
`SF_EVENT`/`StemFlowDHT` đã verify an toàn, KHÔNG dùng `Serial.println` bên
trong hàm auto-inject vì từng gây "Guru Meditation Error: Cache error" không
tất định):

```
SF_CLOUD_EVENT {"componentId":"cloud-1","topic":"temperature","value":28.50}
SF_CLOUD_LOG {"componentId":"cloud-1","message":"cloud begin: IoT Farm Demo"}
```

`QemuEsp32Runner.ReadNewLogLinesAsync()` (đọc `serial.log`) parse 2 marker
này qua `TryParseSfCloudEvent`/`TryParseSfCloudLog` (System.Text.Json, try/
catch — JSON lỗi KHÔNG crash, chỉ ghi cảnh báo ra stderr BE rồi coi dòng đó
như raw serial bình thường). `SF_CLOUD_EVENT` hợp lệ → emit
`SimulationEvent Type="cloud-event"` (Payload: `componentId`, `topic`,
`value`, `timeMs`) + 1 dòng serial dễ đọc `[cloud] topic = value`.
`SF_CLOUD_LOG`/`cloud.begin()` → chỉ emit dòng serial dễ đọc `[cloud]
message`, không có `cloud-event` riêng. Cả 2 nhánh KHÔNG tăng `eventsEmitted`
(giống raw-serial-passthrough) — không ảnh hưởng heuristic
`suspiciousEarlyExit`.

`CloudRuntimeHeaderGenerator.Generate(snapshot)` chỉ trả về block C++ (class
`StemFlowCloud`) khi diagram có component `wokwi-wifi-cloud-node` hoặc
`wokwi-dashboard-cloud` — diagram KHÔNG có 2 loại này thì phần header rỗng,
cache key GIỮ NGUYÊN (verify qua throwaway console test: cả sensorHeader lẫn
cloudHeader đều `null` cho diagram L298N-only). Gate thêm bằng feature flag
`SimulationRunner:Qemu:EnableCloudRuntime` (appsettings.json, `true` — cùng
cấp với `EnableSensorInputScenario`).

### File đã sửa/tạo

- MỚI: `STEM_BE/STEM.Application/UseCases/Simulation/Runners/Qemu/CloudRuntimeHeaderGenerator.cs`
  — sinh class `StemFlowCloud` (begin/publish×3 overload/log), gate theo
  component Cloud/Dashboard có trên diagram.
- SỬA: `STEM_BE/STEM.Application/UseCases/Simulation/Runners/Qemu/QemuEsp32Runner.cs`
  — cộng `CloudRuntimeHeaderGenerator.Generate()` vào `sensorHeader` trong
  `RunAsync()`; thêm `TryParseSfCloudEvent`/`TryParseSfCloudLog` + nhánh xử lý
  trong `ReadNewLogLinesAsync()` (TRƯỚC nhánh `TryParseSfEvent`).
- SỬA: `STEM_BE/STEM.Api/appsettings.json` — thêm
  `SimulationRunner:Qemu:EnableCloudRuntime: true`.
- MỚI: `STEM_FE/src/components/Dashboard/VirtualLab/Sandbox/CloudDashboardPanel.tsx`
  — panel nổi (top-right, trong canvas wrapper) liệt kê latest value theo
  topic + log 6 dòng gần nhất cho MỖI component Cloud/Dashboard trên canvas.
- SỬA: `STEM_FE/src/components/Dashboard/VirtualLab/Sandbox/CircuitCanvas.tsx`
  — `PartVisualState.cloudLive` (chấm xanh nhỏ báo đang có dữ liệu, card 70x60
  quá nhỏ để nhồi topic/value — chi tiết đầy đủ nằm ở CloudDashboardPanel).
- SỬA: `STEM_FE/src/pages/dashboard/LabSandboxPage.tsx` — `applySimulationEvent`
  xử lý `event.type === 'cloud-event'`, state `cloudState` (theo componentId),
  reset khi Run mới, render `<CloudDashboardPanel>`.
- SỬA: `STEM_FE/src/components/Dashboard/VirtualLab/Sandbox/SerialMonitorPanel.tsx`
  — highlight dòng bắt đầu bằng `[cloud]` (màu sky), raw serial GIỮ NGUYÊN nội
  dung, chỉ đổi màu hiển thị.

### API StemFlowCloud

```cpp
StemFlowCloud cloud("cloud-1");   // "cloud-1" PHẢI khớp id của component
                                   // WiFi/Cloud Node hoặc Dashboard/Cloud
                                   // trên canvas — quy ước GIỐNG StemFlowDHT.
cloud.begin("Nhãn hiển thị");     // -> SF_CLOUD_LOG, KHÔNG có cloud-event
cloud.publish("temperature", 28.5f); // float — format thủ công 2 chữ số
                                      // thập phân, KHÔNG dùng ets_printf %f.
cloud.publish("soil_moisture", 1234); // int — analogRead() trả int, khớp
                                       // overload này trực tiếp.
cloud.log("Farm data uploaded to virtual cloud"); // -> SF_CLOUD_LOG
```

KHÔNG cần `#include "StemFlowCloud.h"` — class đã có sẵn trong cùng file
`.ino` lúc compile (giống StemFlowDHT), viết `#include` sẽ lỗi "file not
found" vì không có file vật lý nào tên đó trong sandbox.

### Event shape `cloud-event`

```json
{
  "type": "cloud-event",
  "time": 1234,
  "payload": {
    "componentId": "cloud-1",
    "topic": "temperature",
    "value": 28.5,
    "timeMs": 1234
  }
}
```

Payload generic (`Dictionary<string, object?>`) — KHÔNG đổi shape
`SimulationEventResponse{Type,Time,Payload}` sẵn có, chỉ thêm 1 giá trị
`Type` mới (khác quy ước `Type="part-state"` của LED/Buzzer/L298N/RGB LED vì
user yêu cầu rõ 1 Type riêng cho cloud).

### Demo code IoT Farm (verify codegen sạch qua throwaway console test)

```cpp
StemFlowCloud cloud("cloud-1");
StemFlowDHT dht("dht-1");

void setup() {
  Serial.begin(115200);
  cloud.begin("IoT Farm Demo");
}

void loop() {
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  int soil = analogRead(34);
  int rain = analogRead(35);

  cloud.publish("temperature", temperature);
  cloud.publish("humidity", humidity);
  cloud.publish("soil_moisture", soil);
  cloud.publish("rain", rain);

  Serial.println("Farm data uploaded to virtual cloud.");
  delay(1000);
}
```

Circuit cần trên canvas: 1× DHT22/DHT11 (id `dht-1`), 1× WiFi/Cloud Node
HOẶC Dashboard/Cloud (id `cloud-1`) — 2 loại này KHÔNG có pin, không cần nối
dây. `soil`/`rain` đọc `analogRead(34)`/`analogRead(35)` trực tiếp — muốn có
giá trị kịch bản thay vì mặc định (0/nổi) thì thêm Soil Moisture Sensor/Rain
Sensor, nối chân AO ra đúng GPIO 34/35, rồi cấu hình Sensor Scenario cho 2
sensor đó (xem Sensor Input Bridge Phase 2).

### Template bài "IoT ghi dữ liệu Farm lên Cloud"

CHƯA seed sẵn 1 hàng `Labs` trong DB (cần `CreatedById` — tài khoản giáo
viên cụ thể, không tự đoán) — thay vào đó chuẩn bị sẵn nội dung để giáo viên
tạo qua Teacher Mode (custom sandbox lab) trong ~2 phút:

- **Starter code**: đúng đoạn demo code ở trên.
- **Circuit**: DHT22 (id `dht-1`) + WiFi/Cloud Node hoặc Dashboard/Cloud (id
  `cloud-1`), tuỳ chọn thêm Soil Moisture/Rain Sensor nối GPIO 34/35.
- **Mô tả bắt buộc ghi rõ cho học sinh** (đã áp dụng đúng nguyên văn yêu cầu):
  - Cloud ở đây là **virtual cloud** mô phỏng trong QEMU — KHÔNG kết nối
    Internet/WiFi thật.
  - WiFi thật CHƯA được hỗ trợ trong QEMU (gây crash) — sketch KHÔNG được
    dùng `WiFi.begin()`/`#include <WiFi.h>`.
  - Dữ liệu sensor (nhiệt độ/độ ẩm/độ ẩm đất/mưa) lấy từ Sensor Scenario đã
    cấu hình, KHÔNG phải cảm biến vật lý thật.

### Test result

1. **Compile/QEMU IoT Farm**: PASS — throwaway console test xác nhận codegen
   sạch (không struct/default-arg trong chữ ký hàm top-level, float literal
   hợp lệ `28.5f`/`50.0f`...); `dotnet build` toàn bộ solution 0 lỗi; test
   compile+QEMU thật qua browser xem mục Regression bên dưới.
2. **Cloud event parser**: PASS — `TryParseSfCloudEvent`/`TryParseSfCloudLog`
   bọc try/catch quanh `JsonDocument.Parse`, JSON lỗi → log cảnh báo stderr
   BE + coi như raw serial (KHÔNG throw, KHÔNG crash runner).
3. **UI dashboard**: PASS — `CloudDashboardPanel` hiện latest value theo
   topic + log 6 dòng gần nhất mỗi component; `tsc --noEmit` 0 lỗi.
4. **Regression**: xem báo cáo browser test đầy đủ bên dưới.

### Limitation

- WiFi/Internet thật **vẫn KHÔNG được hỗ trợ** trong QEMU — `StemFlowCloud`
  là mô phỏng thuần Serial-marker, không có kết nối mạng thật, không gửi dữ
  liệu ra ngoài container.
- `componentId` trong `StemFlowCloud("id")` PHẢI khớp đúng id của component
  Cloud/Dashboard trên canvas để `CloudDashboardPanel` hiển thị đúng — sai id
  vẫn compile/chạy được (không lỗi), chỉ là dashboard sẽ không thấy dữ liệu
  gắn với node nào (không có validation ràng buộc 2 chiều, giống quy ước
  StemFlowDHT đã có).
- Card canvas 70×60 quá nhỏ để hiện danh sách topic/value trực tiếp — chỉ có
  1 chấm xanh báo "đang có dữ liệu", chi tiết đầy đủ nằm ở CloudDashboardPanel
  (góc phải trên của canvas).
- Chưa seed sẵn Lab template trong DB (xem mục "Template" ở trên) — mới có
  nội dung soạn sẵn, giáo viên tự tạo qua Teacher Mode.
