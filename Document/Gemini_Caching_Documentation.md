# Tài liệu: Gemini API - Context Caching

Tài liệu này cung cấp thông tin về tính năng Context Caching trong Gemini API, cho phép lưu trữ và tái sử dụng các token đầu vào đã được tính toán trước để tiết kiệm chi phí và tăng tốc độ xử lý.

## Tổng quan
Context Caching cho phép bạn lưu trữ các nội dung đầu vào lớn (ví dụ: tài liệu dài, tệp media) để sử dụng lại trong nhiều yêu cầu khác nhau mà không cần gửi lại toàn bộ nội dung đó mỗi lần.

## Các phương thức chính
- `cachedContents.create`: Tạo tài nguyên `CachedContent`.
- `cachedContents.list`: Liệt kê các nội dung đã cache.
- `cachedContents.get`: Truy xuất thông tin của một `CachedContent`.
- `cachedContents.patch`: Cập nhật thời gian hết hạn (expiration/TTL) của `CachedContent`.
- `cachedContents.delete`: Xóa `CachedContent`.

## Các khái niệm quan trọng
- **CachedContent**: Tài nguyên đại diện cho nội dung đã được tiền xử lý.
- **Expiration/TTL**: Thời gian sống của cache. Bạn có thể thiết lập `expireTime` (thời điểm cụ thể) hoặc `ttl` (thời lượng sống).
- **Model**: Cache chỉ có thể được sử dụng với mô hình mà nó được tạo ra.

## Quy trình làm việc
1. **Tạo Cache**: Gọi `cachedContents.create` với nội dung (`contents`), hướng dẫn hệ thống (`systemInstruction`), và mô hình (`model`).
2. **Sử dụng Cache**: Trong yêu cầu `generateContent`, truyền tên của cache vào trường `cachedContent`.
3. **Quản lý**: Sử dụng `cachedContents.patch` để gia hạn cache hoặc `cachedContents.delete` để dọn dẹp.

## Ví dụ (Node.js)
```javascript
const cache = await ai.caches.create({
  model: "gemini-1.5-flash-001",
  config: {
    contents: [/* ... */],
    systemInstruction: "You are an expert analyzing transcripts.",
  },
});

const response = await ai.models.generateContent({
  model: "gemini-1.5-flash-001",
  contents: "Please summarize this transcript",
  config: { cachedContent: cache.name },
});
```

*Nguồn: Tài liệu chính thức Gemini API (ai.google.dev)*
