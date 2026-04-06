# Tài liệu: Gemini API - Models Endpoint

Tài liệu này cung cấp thông tin về các phương thức API liên quan đến việc quản lý và truy vấn thông tin các mô hình ngôn ngữ (Generative Language Models) có sẵn thông qua Gemini API.

## Tổng quan
Endpoint `models` cho phép bạn liệt kê các mô hình khả dụng theo chương trình và truy xuất siêu dữ liệu mở rộng như chức năng được hỗ trợ và kích thước cửa sổ ngữ cảnh.

## Các phương thức chính
- `models.get`: Lấy thông tin về một mô hình cụ thể (phiên bản, giới hạn token, tham số, v.v.).
- `models.list`: Liệt kê tất cả các mô hình khả dụng.
- `models.predict`: Thực hiện yêu cầu dự đoán (prediction).
- `models.predictLongRunning`: Tương tự `models.predict` nhưng trả về một LRO (Long Running Operation).

## Chi tiết phương thức

### 1. models.get
- **Endpoint**: `GET https://generativelanguage.googleapis.com/v1beta/{name=models/*}`
- **Tham số**: `name` (Ví dụ: `models/gemini-2.0-flash`)
- **Mô tả**: Trả về thông tin chi tiết của mô hình (input/output token limit, supported methods, v.v.).

### 2. models.list
- **Endpoint**: `GET https://generativelanguage.googleapis.com/v1beta/models`
- **Tham số**: `pageSize`, `pageToken` (hỗ trợ phân trang).
- **Mô tả**: Trả về danh sách các mô hình khả dụng.

## Resource: Model
Thông tin chi tiết về một mô hình bao gồm:
- `name`: Tên tài nguyên (ví dụ: `models/gemini-1.5-flash-001`).
- `baseModelId`: ID mô hình cơ sở.
- `inputTokenLimit` / `outputTokenLimit`: Giới hạn token.
- `supportedGenerationMethods`: Các phương thức được hỗ trợ (ví dụ: `generateContent`, `embedContent`).
- `thinking`: Hỗ trợ suy luận (thinking) hay không.

*Nguồn: Tài liệu chính thức Gemini API (ai.google.dev)*
