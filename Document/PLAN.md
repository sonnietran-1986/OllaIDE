# Kế hoạch Phát triển OllaIDE (Local-First Architecture)

Dự án đã được chuyển hướng sang kiến trúc **Local-First**, chạy hoàn toàn trên trình duyệt kết hợp với File System Access API để thao tác trực tiếp với ổ cứng của người dùng. Không sử dụng Backend hay Database đám mây.

## Phase 1: Chuyển đổi Local-First (Refactoring)
- [ ] Gỡ bỏ hoàn toàn Firebase (Auth, Firestore).
- [ ] Xóa các file cấu hình Firebase (`firebase-applet-config.json`, `firestore.rules`, v.v.).
- [ ] Chuyển đổi logic lưu trữ (Lịch sử chat, Cài đặt API Key, System Prompt) sang `localStorage` hoặc `IndexedDB`.
- [ ] Cập nhật UI: Bỏ nút Login, cho phép sử dụng app ngay lập tức.

## Phase 2: Tích hợp File System Access API (Workspace)
- [ ] Xây dựng module `FileSystem.ts` để quản lý quyền truy cập thư mục local.
- [ ] Cập nhật UI Trang chủ / New Session: Khi gõ prompt đầu tiên hoặc bấm "New Project", gọi hàm `window.showDirectoryPicker()` để user chọn folder dự án.
- [ ] Lưu trữ `FileSystemDirectoryHandle` vào IndexedDB để giữ quyền truy cập cho các lần reload sau (yêu cầu user cấp quyền lại khi mở lại app).
- [ ] Xây dựng các hàm tiện ích: `readFile`, `writeFile`, `listDirectory`.

## Phase 3: Xây dựng Execution Engine (Agent Tools)
- [ ] Cập nhật `gemini.ts`: Khai báo các `FunctionDeclarations` (`view_file`, `edit_file`, `create_file`).
- [ ] Kết nối Tools với `FileSystem.ts`: Khi Gemini gọi `edit_file`, thực thi việc ghi đè trực tiếp lên file trong folder local đã chọn.
- [ ] Triển khai Lớp phòng ngự 1: Tự động chèn câu lệnh ép buộc (Recency Bias) vào cuối mỗi prompt của user.

## Phase 4: Giao diện Task Log (Invisible Execution)
- [ ] Cập nhật `Terminal.tsx`: Chặn không render các đoạn JSON FunctionCall.
- [ ] Xây dựng component `ActionCard.tsx` để hiển thị trạng thái thao tác file (Ví dụ: `[EDITED] src/App.tsx` với icon tick xanh).
- [ ] Triển khai Lớp phòng ngự 2: Chặn hiển thị các code block dài quá 20 dòng nếu AI lỡ vi phạm luật.

## Phase 5: Tự động hóa Ngữ cảnh (Auto-Sync Context)
- [ ] Xây dựng hàm `generateWorkspaceMap()`: Đệ quy đọc cấu trúc folder local được chọn để tạo ra cây thư mục.
- [ ] Tự động ghi kết quả vào file `.vibe/skeleton.md` và `.vibe/project_graph.md` ngay trong folder local đó.
- [ ] Trigger: Tự động chạy hàm này mỗi khi AI thực thi xong một tool làm thay đổi file.

---

# CẬP NHẬT: KẾ HOẠCH TRIỂN KHAI "TOOL-DRIVEN AGENT" (CÓ LOCAL SERVER)

## Giai đoạn 1: Xây dựng Hệ thống Tool & Local Companion Server
*Mục tiêu: Cấp cho AI khả năng thao tác file và chạy lệnh terminal thông qua Local Server.*
1. **Khởi tạo Local Server:** Tạo một server Node.js nhỏ (ví dụ: Express chạy ở `localhost:3001`) đi kèm với OllaIDE. Server này có các API endpoint để: Đọc/Ghi file và Chạy lệnh Shell (`exec`).
2. **Định nghĩa Tools cho Gemini:** Khai báo các `FunctionDeclarations` bao gồm: `view_file`, `edit_file`, `multi_edit_file`, `create_file`, và đặc biệt là `shell_exec` (để chạy npm, lint, grep).
3. **Vòng lặp Tool Execution:** Cập nhật `gemini.ts`. Khi AI trả về FunctionCall, OllaIDE Frontend sẽ gọi xuống Local Server để thực thi lệnh thực tế trên ổ cứng, sau đó lấy kết quả trả ngược lại cho AI.

## Giai đoạn 2: Triển khai 3 Lớp Phòng Ngự (Defense Layers)
*Mục tiêu: Ép AI tuân thủ kỷ luật, tuyệt đối không in code ra màn hình chat.*
1. **Lớp 1 (Recency Bias):** Tự động nối thêm dòng text ẩn `[SYSTEM NOTE: TUYỆT ĐỐI TUÂN THỦ <QUY TẮC BẮT BUỘC> TRONG SYSTEM PROMPT]` vào cuối mỗi prompt của user.
2. **Lớp 3 (ToolConfig Enforcement):** Khi phát hiện user yêu cầu sửa code, cấu hình `toolConfig: { functionCallingConfig: { mode: "ANY" } }` để ép Gemini BẮT BUỘC phải gọi tool thay vì trả lời bằng chữ.
3. **Lớp 2 (Client Interception):** Cập nhật `Terminal.tsx`. Nếu AI bị "ảo giác" và trả về block code dài quá 20 dòng, tự động chặn hiển thị và thay bằng UI cảnh báo để bảo vệ trải nghiệm người dùng.

## Giai đoạn 3: Xây dựng UI Task Log (Invisible Execution)
*Mục tiêu: Biến các lệnh gọi hàm khô khan thành giao diện trực quan, gọn gàng.*
1. **Cập nhật State Message:** Mở rộng interface `Message` để lưu trữ thêm trạng thái của các Tool Calls.
2. **Chặn JSON Raw:** Đảm bảo `Terminal.tsx` không bao giờ in các chuỗi JSON gọi hàm ra màn hình.
3. **Component ActionCard:** Xây dựng UI Card hiển thị tiến trình:
   - Header: Icon + "Đang chỉnh sửa X file..." hoặc "Đang chạy lệnh npm..."
   - Body: Danh sách các file hoặc lệnh đang chạy.
   - Status: Icon Spinner (đang xử lý) -> Tick xanh (thành công) hoặc X đỏ (lỗi).

## Giai đoạn 4: Vòng lặp Xác thực (Verification Loop) & Auto-Sync
*Mục tiêu: Đảm bảo code luôn chạy được và AI luôn nắm được ngữ cảnh mới nhất.*
1. **Cơ chế Auto-Sync (Background):** Sau khi AI sửa code xong, OllaIDE tự động gọi Local Server quét lại cây thư mục và ghi đè vào `.vibe/skeleton.md` và `.vibe/project_graph.md`.
2. **Vòng lặp Xác thực (Verification):** 
   - Ngay sau khi Auto-Sync, OllaIDE tự động gọi tool `shell_exec` để chạy lệnh `npm run lint` hoặc `npm run build` thông qua Local Server.
   - **Tự động sửa lỗi (Self-Healing):** Nếu Local Server trả về log có lỗi (Exit code != 0), OllaIDE sẽ tự động đóng gói log lỗi này gửi lại cho AI với prompt ẩn: *"Phát hiện lỗi khi compile, hãy phân tích và sửa lại"*.
   - AI được phép tự sửa tối đa 3 lần. Nếu vẫn lỗi, mới dừng lại và báo cáo cho người dùng.

---

# [CẬP NHẬT MỚI] CHI TIẾT TRIỂN KHAI: GIAI ĐOẠN 1 (HỆ THỐNG TOOL & LOCAL SERVER)

Giai đoạn này là nền tảng quan trọng nhất để biến OllaIDE thành một Agent thực thụ. Chúng ta sẽ chia làm 4 bước nhỏ:

### Bước 1.1: Khởi tạo Local Companion Server (Node.js/Express)
- **Vị trí:** Tạo thư mục `server/` chứa mã nguồn backend (hoặc file `server.ts` ở thư mục gốc).
- **Dependencies:** Cài đặt `express`, `cors` (để frontend gọi được API), và sử dụng các module có sẵn của Node.js như `fs/promises` (thao tác file), `child_process` (chạy lệnh terminal).
- **API Endpoints cần xây dựng:**
  1. `POST /api/fs/read`: Nhận đường dẫn tuyệt đối, số dòng bắt đầu/kết thúc -> Trả về nội dung file.
  2. `POST /api/fs/write`: Nhận đường dẫn, nội dung cần ghi (hoặc ghi đè) -> Thực hiện ghi file và trả về trạng thái.
  3. `POST /api/shell/exec`: Nhận chuỗi lệnh (VD: `npm run lint`) -> Chạy qua `exec` hoặc `spawn` -> Trả về `stdout`, `stderr` và `exitCode`.
- **Cập nhật `package.json`:** Thêm script `dev:all` sử dụng `concurrently` để chạy song song cả Vite (Frontend) và Express (Backend) chỉ với 1 lệnh.

### Bước 1.2: Định nghĩa Function Declarations (Tools Schema)
- **Vị trí:** Tạo file mới `src/lib/tools.ts` để quản lý schema gọn gàng.
- **Nội dung:** 
  - Định nghĩa `type ToolName = 'view_file' | 'create_file' | 'edit_file' | 'multi_edit_file' | 'shell_exec';`
  - Khai báo mảng `tools` chứa các `FunctionDeclaration`.
  - **Áp dụng `satisfies ToolName`** cho thuộc tính `name` của từng tool để TypeScript bảo vệ (safety net) chống sai sót tên hàm.

### Bước 1.3: Xây dựng Client API (Frontend gọi Backend)
- **Vị trí:** Tạo file `src/lib/apiClient.ts`.
- **Nội dung:** Viết các hàm wrapper dùng `fetch` để gọi đến `http://localhost:3001/api/...`.
- **Xử lý lỗi:** Bắt các trường hợp Local Server chưa bật, file không tồn tại, hoặc lệnh shell bị lỗi (timeout, permission denied) để trả về thông báo lỗi rõ ràng (Error Message) cho AI hiểu và tự sửa sai.

### Bước 1.4: Tích hợp Vòng lặp Function Calling vào `gemini.ts`
- **Cập nhật `generateChatResponse`:** Truyền danh sách `tools` (từ Bước 1.2) vào `config` của Gemini.
- **Xử lý Response (The Agent Loop):** 
  - Khi Gemini trả về mảng `response.functionCalls`, Frontend sẽ tạm dừng việc hiển thị tin nhắn.
  - **Áp dụng `Promise.all`:** Map mảng `functionCalls` thành các Promise gọi API (từ Bước 1.3) và chạy song song (parallel) để tối ưu tốc độ. *(Ghi chú trong code: có thể đổi sang `for...of` nếu sau này có logic phụ thuộc tuần tự).*
  - Đóng gói kết quả từ Local Server thành mảng `functionResponses`.
  - Gửi tiếp mảng `functionResponses` này ngược lại cho Gemini (bằng cách nối vào lịch sử chat) để AI đánh giá kết quả.
  - Nếu AI thấy cần sửa tiếp -> Trả về `functionCalls` mới -> Lặp lại vòng lặp.
  - Nếu AI thấy đã xong -> Trả về text giải thích -> Kết thúc vòng lặp và hiển thị ra UI.
