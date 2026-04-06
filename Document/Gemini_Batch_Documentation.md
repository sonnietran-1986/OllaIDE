# Tài liệu: Gemini API - Batch API

Tài liệu này cung cấp thông tin về các phương thức API liên quan đến Batch API trong Gemini API, cho phép xử lý nhiều yêu cầu cùng một lúc một cách hiệu quả.

## Tổng quan
Batch API cho phép bạn gửi một loạt các yêu cầu (GenerateContent hoặc EmbedContent) trong một lần gọi duy nhất để xử lý bất đồng bộ.

## Các phương thức chính
- `models.batchGenerateContent`: Enqueue một loạt các yêu cầu `generateContent` để xử lý theo lô.
- `models.asyncBatchEmbedContent`: Enqueue một loạt các yêu cầu `embedContent` để xử lý theo lô.
- `batches.get`: Lấy trạng thái mới nhất của một operation (long-running operation).
- `batches.list`: Liệt kê các operation.
- `batches.cancel`: Hủy một operation đang chạy.
- `batches.delete`: Xóa một operation.

## Các khái niệm quan trọng
- **Operation**: Đại diện cho một tác vụ chạy dài (long-running operation). Bạn cần polling (thăm dò) trạng thái của operation để biết khi nào nó hoàn thành.
- **BatchState**: Trạng thái của lô (PENDING, RUNNING, SUCCEEDED, FAILED, CANCELLED, EXPIRED).
- **InputConfig**: Cấu hình đầu vào cho lô (có thể là tên tệp chứa yêu cầu hoặc danh sách yêu cầu nội tuyến - InlinedRequests).
- **Output**: Kết quả trả về của lô (có thể là tệp chứa phản hồi hoặc danh sách phản hồi nội tuyến - InlinedResponses).

## Quy trình làm việc
1. **Tạo lô**: Gọi `batchGenerateContent` hoặc `asyncBatchEmbedContent` để bắt đầu xử lý.
2. **Polling**: Sử dụng `batches.get` để kiểm tra trạng thái (`done` field).
3. **Kết quả**: Khi `done` là `true`, kiểm tra `error` hoặc `response` để lấy kết quả.

*Nguồn: Tài liệu chính thức Gemini API (ai.google.dev)*
