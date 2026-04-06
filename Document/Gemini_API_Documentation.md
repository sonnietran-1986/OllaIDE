# Tài liệu: Gemini API - Generate Content

Tài liệu này cung cấp thông tin chi tiết về phương thức `models.generateContent` của Gemini API, bao gồm cấu trúc request, response, các tùy chọn cấu hình và ví dụ minh họa.

## Tổng quan
Gemini API hỗ trợ tạo nội dung với văn bản, hình ảnh, âm thanh, mã nguồn, công cụ, v.v.

## Các phương thức chính
- `models.generateContent`: Tạo phản hồi từ mô hình cho một yêu cầu đầu vào.
- `models.streamGenerateContent`: Tạo phản hồi theo dạng luồng (stream) từ mô hình.

## Cấu trúc Request (generateContent)
- **Endpoint**: `POST https://generativelanguage.googleapis.com/v1beta/{model=models/*}:generateContent`
- **Tham số đường dẫn**: `model` (ví dụ: `models/gemini-2.0-flash`)
- **Body**:
    - `contents[]`: Nội dung hội thoại (yêu cầu bắt buộc).
    - `tools[]`: Danh sách các công cụ (Function, codeExecution).
    - `toolConfig`: Cấu hình cho các công cụ.
    - `safetySettings[]`: Cấu hình an toàn.
    - `systemInstruction`: Hướng dẫn hệ thống.
    - `generationConfig`: Cấu hình tạo nội dung (temperature, maxOutputTokens, v.v.).

## Cấu trúc Response
- `candidates[]`: Các phản hồi ứng viên từ mô hình.
- `promptFeedback`: Phản hồi về prompt (ví dụ: bị chặn do lý do an toàn).
- `usageMetadata`: Thông tin sử dụng token.

## Các tính năng nâng cao
- **JSON Mode**: Sử dụng `responseMimeType: "application/json"` và `responseSchema`.
- **Code Execution**: Sử dụng công cụ `codeExecution` để chạy mã.
- **Function Calling**: Sử dụng `tools` để tương tác với các hệ thống bên ngoài.
- **Thinking**: Sử dụng `thinkingConfig` (đối với các mô hình hỗ trợ).

## Ví dụ (Node.js)
```javascript
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: "Write a story about a magic backpack.",
});
console.log(response.text);
```

*Nguồn: Tài liệu chính thức Gemini API (ai.google.dev)*
