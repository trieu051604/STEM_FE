# StemFlow – Virtual Lab: Quy trình thực hiện tuần tự

Cập nhật 2026-07-16 (vòng verify code thật + chốt 4 quyết định). Xem quyết định kiến trúc đầy đủ ở [`VIRTUAL_LAB_ADR.md`](VIRTUAL_LAB_ADR.md). File này là checklist tiến độ theo từng giai đoạn — cập nhật tại đây thay vì paste lại toàn bộ vào chat mỗi phiên.

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
- [x] **1.4 (FE) — ✅ XONG (2026-07-18), verify thật qua UI.** `LabSandboxPage.tsx` giờ gọi đúng `GET api/virtual-lab/projects/{id}` (hydrate) + `PUT api/diagrams/{projectId}` (Guid tất định từ `(labId, studentId)` qua UUIDv5, xem `projectId.ts`) — debounce 1.5s. Verify: dựng instance BE+FE cô lập, mint token thật, kéo 1 linh kiện trên UI thật (giả lập bằng PointerEvent thật, không phải gọi hàm nội bộ), đợi debounce, xác nhận `PUT` 200 + đọc thẳng DB thấy đúng toạ độ mới + 2 wire connection (kèm màu/waypoint) round-trip nguyên vẹn, **reload trang thật → linh kiện vẫn ở đúng vị trí mới** (không phải vị trí cũ/mặc định) — đúng bug "mất khi refresh" đã được vá.
- [~] **1.5 (FE) — một phần.** Header sandbox hiện hiển thị số lượng lỗi mạch (`"X lỗi mạch"`) lấy từ `DiagramValidationResult.errors`/`warnings` trả về sau mỗi lần lưu — xác nhận dữ liệu Validation/Netlist đã chảy tới FE thật (không phải giả). **Chưa làm:** highlight trực quan đúng linh kiện/pin theo từng lỗi (parse string `"led1: ..."` để tô màu đúng part trên canvas) — còn để mở, chưa có yêu cầu làm tiếp.

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

**🔖 BACKLOG MỚI (chưa làm, để dành):** `VirtualLabDiagramService.Analyze()` nên đọc board từ field `"board"` cấp cao nhất của `DiagramJson` (đã có sẵn, đúng ngữ nghĩa — `esp32_devkit_v1`/`arduino_uno`) thay vì bắt buộc phải có 1 entry ESP32 nằm trong `parts[]`. Đây là lý do gốc rễ của toàn bộ chuỗi rắc rối "board part giả" ở mục 5 — cách hiện tại là workaround cho hành vi cứng của validator, trong khi mọi Lab hiện tại đều không có (và không nên có) 1 phần tử "board" giả trong danh sách linh kiện.

## GIAI ĐOẠN 2 — CODE EDITOR + MOCK SIMULATION

**Xác nhận quan trọng:** `RunEsp32Async` chỉ nhận `mode: "mock"`, throw `InvalidOperationException` cho mode khác — compile và run là 2 lời gọi API tách biệt hoàn toàn, không liên kết ở tầng service.

**`VirtualLabMockRunner.cs` đã verify: chỉ là regex scanner từng dòng**, không phải simulator thật:
- Không có control flow — `if`/`for`/`while`/lặp `loop()` không được mô phỏng (thân `loop()` chỉ quét 1 lần, không lặp).
- Không state thật ngoài bảng `#define`/`const int` phẳng; không tính biểu thức/arithmetic.
- `digitalRead` luôn trả cố định `"LOW"`, không đọc trạng thái pin mô phỏng thật.
- Chỉ 2 loại linh kiện có phản ứng mô phỏng: `wokwi-led` (on/off), `wokwi-buzzer` (buzzing/silent), qua `digitalWrite`. **Button/Servo/DHT/Ultrasonic dù được validate ở diagram nhưng không có phản ứng mô phỏng nào ở tầng run.**

- [ ] 2.1 (FE) Audit `CodeEditorPanel.tsx`.
- [ ] 2.2 (BE) Quyết định: chấp nhận giới hạn mock runner hiện tại cho MVP (chỉ LED/Buzzer phản ứng qua digitalWrite, không loop) hay cần nâng cấp parser trước khi coi Giai đoạn 2 là đạt? (Chưa quyết định — cần bạn chốt trước khi ước lượng effort còn lại.)
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

- [ ] 4.1 (BE) `stop` (`VirtualLabProjectController.StopSimulation`) hiện là **stub hoàn toàn** — trả hardcode `{status:"stopped", events:[]}`, không chạm DB/service nào. Cần làm thật: đổi state `VirtualLabProject`, không dùng `SimulationSession` nữa (sau 0.2).
- [ ] 4.2 (BE) Setup SignalR: `AddSignalR()` trong `Program.cs`, tạo `VirtualLabHub` (hoặc tên tương đương), `MapHub<VirtualLabHub>()`. Room theo `classId`/`assignmentId` dùng SignalR Groups.
- [ ] 4.3 (BE) Lưu `simulationEvents[]` vào `VirtualLabProject` (không phải `ExperimentLogs`/`SimulationSession`).
- [ ] 4.4 (FE) Đổi từ kế hoạch `socket.io-client` sang `@microsoft/signalr`. Student gửi event khi thao tác (tên method giữ ý nghĩa cũ: join/diagram-updated/code-updated/compile-started/finished/run-started/simulation-event/stopped/submitted, nhưng là SignalR hub invocation, không phải Socket.IO emit).
- [ ] 4.5 (FE) Teacher Dashboard: danh sách học sinh + trạng thái realtime.
- [ ] 4.6 (FE) Teacher xem live diagram/code/log/event của 1 học sinh (`watch-student` qua SignalR).
- [ ] 4.7 (FE+BE) Teacher gửi góp ý realtime (`send-guidance` qua SignalR).

**Output:** Giáo viên xem realtime qua SignalR, `stop` đổi state thật. Test: 2 tab (student/teacher) — thao tác bên student phản ánh bên teacher <2s.

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
  - **Phát hiện phụ, không liên quan trực tiếp 5.3 (đã tách task riêng, không sửa ở đây):** bảng `Submissions` có unique constraint trên `(AssignmentId, StudentId)` — nộp lần 2 cho cùng assignment bị lỗi DB 500 (`duplicate key`), mặc dù `Assignment` đã có field `AllowResubmit`/`ResubmitLimit` và `SubmitVirtualLabAsync` đã tính sẵn `AttemptNumber` — ngụ ý resubmit lẽ ra phải được hỗ trợ nhưng constraint hiện tại chặn cứng. Không sửa trong phạm vi 0.4/5.3.
- [x] **5.3b (BE) — Bước 4a: vá lỗ hổng auth `VirtualLabSubmissionsController` — ✅ XONG (2026-07-19), verify thật (4 case, cả 4 PASS).** Phát hiện khi đọc lại contract cho Bước 4: controller **không có `[Authorize]`** (khác `DiagramsController`/`VirtualLabProjectController` đã vá ở 0.3) + tin `request.StudentId` client tự khai khi ẩn danh (`currentUserId ?? request.StudentId`) — cùng mức nghiêm trọng như gap đã vá ở 0.3, không phải quyết định chấp nhận trước đó. **Đã sửa:** thêm `[Authorize]` cho controller; `GetCurrentUserId()` đổi từ `TryGetCurrentUserId()` (nullable, không throw) sang non-nullable throw `UnauthorizedAccessException` giống hệt pattern `VirtualLabProjectController`; `IVirtualLabRuntimeService.SubmitVirtualLabAsync` đổi `int? currentUserId` → `int currentUserId` (khớp `GetDiagramAsync`/`SaveDiagramAsync`, không còn nhánh ẩn danh); `SubmitVirtualLabAsync` giờ luôn dùng `studentId = currentUserId` — nếu `request.StudentId` có giá trị và khác `currentUserId` thì throw `UnauthorizedAccessException` ("You cannot submit on behalf of another student.") → map `Forbid()` (403), không còn khái niệm "nộp hộ" (không có tiền lệ nào trong toàn bộ codebase cho use case giáo viên nộp hộ học sinh). `catch (UnauthorizedAccessException)` đổi từ `Unauthorized()` sang `Forbid()` — khớp ý nghĩa mới: đã xác thực nhưng không được phép, không phải chưa xác thực. Field `request.StudentId` giữ nguyên trong DTO (không xoá, chỉ đổi cách dùng) — cho phép FE gửi tường minh nếu muốn nhưng server luôn tự xác định qua token, không tin giá trị client gửi khi khác token.
  - `dotnet build STEM.Infrastructure`/`STEM.Api` — 0 Error.
  - **Verify thật qua endpoint** (instance riêng port 58080, 2 token thật user 11/12): không token → **401**; token user 11 + `studentId:12` trong body (nộp hộ) → **403**; token user 11 + `studentId` bỏ trống + `assignmentId` giả → qua đúng lớp auth, chạm business logic thật (**404 "Assignment not found."**, không phải 401/403); token user 11 + `studentId:11` (khớp chính mình) → cùng kết quả 404 như trên — xác nhận không chặn nhầm submit hợp lệ.
- [ ] 5.4 (BE) Auto-check tầng 3 (behavior) hiện chỉ check "có event nào type error không" — quyết định: chấp nhận mức này cho MVP hay làm so khớp `expectedBehavior` chi tiết hơn? (Chưa chốt — cần bạn quyết định.)
- [ ] 5.5 (BE) Grading (`/api/Grading/submissions/{id}/grade`) — không đổi, không liên quan overlap.
- [ ] 5.6 (FE) Sửa nút Submit trong `LabSandboxPage.tsx`: gọi thật `POST api/submissions/virtual-lab` thay vì hiển thị placeholder "chưa có endpoint".
- [ ] 5.7 (FE) Hiển thị checklist ✅/❌ theo `AutoGradeResultResponse.Checks` (đã có field `Name`/`Passed`/`Message`).

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

- [ ] 8.1 Nghiên cứu Espressif QEMU để chạy firmware thật (giải quyết luôn giới hạn mock runner ở Giai đoạn 2).
- [ ] 8.2 Bridge GPIO/UART/PWM từ QEMU sang `SimulationEvent`.
- [ ] 8.3 Timeline/replay chi tiết.
- [ ] 8.4 `ai/suggest` — deferred, đánh giá lại nếu giữ trong roadmap.
- [ ] 8.5 Python/MicroPython template — deferred.

## Tóm tắt trạng thái (rút gọn)

```
GĐ0: Dọn dẹp & chốt kiến trúc     → ✅✅ ĐÓNG HOÀN TOÀN — 0.B1/0.2/0.3/0.4/0.5/0.6 đều xong, verify thật
GĐ1: Diagram + Netlist (BE)      → ✅ Đã có, vượt kỳ vọng | Canvas (FE) → chưa audit
GĐ2: Code editor + Mock sim      → ⏳ Mock runner xác nhận: chỉ LED/Buzzer, không loop — cần quyết định có nâng cấp không
GĐ3: Compile thật                → ✅ Sandbox hóa xong, verify thật (noexec/BOM/output-mount/memory/timeout đều đã vá và test) | ✅ 3.1 (GetCompileJob) xong
GĐ4: Session + Realtime          → ⏳ 0% hạ tầng — chốt dùng SignalR, cần setup từ đầu; stop() còn stub
GĐ5: Submit + Auto-grading       → ✅ Khung đã có | ✅ 5.3 (compile giả mạo) đã vá + verify thật | ⏳ quyết định 5.4 (behavior sâu tới đâu)
GĐ6: Template & nội dung bài học → chưa bắt đầu
GĐ7: Kiểm thử end-to-end         → chưa bắt đầu
GĐ8: Nâng cao (QEMU, replay, AI) → sau MVP
```

## Danh sách quyết định còn mở (chưa chốt)

- 2.2 — Có nâng cấp `VirtualLabMockRunner` (parser sâu hơn, hỗ trợ loop/Button/Servo/DHT/Ultrasonic) trong MVP hay chấp nhận giới hạn hiện tại?
- 5.4 — Auto-check tầng behavior: chấp nhận mức "không có event error" hay làm so khớp `expectedBehavior` chi tiết theo từng bài?
