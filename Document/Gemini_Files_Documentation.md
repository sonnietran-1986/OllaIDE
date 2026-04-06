# Tài liệu: Gemini API - Files Endpoint

Tài liệu này cung cấp thông tin về các phương thức API liên quan đến việc quản lý tệp tin (Files) trong Gemini API, cho phép tải lên, liệt kê, truy xuất siêu dữ liệu và xóa tệp tin để sử dụng trong các yêu cầu tạo nội dung.

## Tổng quan
Gemini API hỗ trợ tải lên các tệp tin media (hình ảnh, âm thanh, video, PDF, văn bản) riêng biệt với prompt đầu vào, giúp tái sử dụng tệp tin trên nhiều yêu cầu.

## Các phương thức chính
- `media.upload`: Tạo một `File` mới bằng cách tải lên.
- `files.get`: Truy xuất siêu dữ liệu của một `File` cụ thể.
- `files.list`: Liệt kê danh sách các `File` thuộc dự án.
- `files.delete`: Xóa một `File`.
- `files.register`: Đăng ký tệp tin từ Google Cloud Storage (không sao chép tệp).

## Resource: File
Mỗi tệp tin được đại diện bởi tài nguyên `File` với các thông tin:
- `name`: Định danh tài nguyên (ví dụ: `files/123-456`).
- `mimeType`: Loại tệp tin.
- `sizeBytes`: Kích thước tệp (bytes).
- `state`: Trạng thái xử lý (`PROCESSING`, `ACTIVE`, `FAILED`).
- `uri`: URI của tệp tin.

## Quy trình sử dụng tệp tin media
1. **Tải lên**: Sử dụng `media.upload` để tải tệp lên Gemini API.
2. **Kiểm tra trạng thái**: Đối với tệp video, cần kiểm tra trạng thái cho đến khi `state` là `ACTIVE`.
3. **Sử dụng**: Truyền URI của tệp vào trường `contents` trong yêu cầu `generateContent`.
4. **Quản lý**: Sử dụng `files.list` để xem danh sách và `files.delete` để dọn dẹp khi không còn cần thiết.

## Ví dụ (Node.js - Tải lên và sử dụng)
```javascript
const myfile = await ai.files.upload({
  file: path.join(media, "Cajun_instruments.jpg"),
  config: { mimeType: "image/jpeg" },
});

const result = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: createUserContent([
    createPartFromUri(myfile.uri, myfile.mimeType),
    "Can you tell me about the instruments in this photo?",
  ]),
});
```

*Nguồn: Tài liệu chính thức Gemini API (ai.google.dev)*
