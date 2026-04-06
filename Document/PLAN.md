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
