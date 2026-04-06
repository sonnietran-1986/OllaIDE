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
