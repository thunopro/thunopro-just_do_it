# Quy định tag cho chuyên đề Toán vào 10

Đối với các bài tập thuộc chuyên đề **Toán vào 10** (`subcategory: "vao_10"`) và **Toán vào 10 chuyên** (`subcategory: "vao_10_chuyen"`), hệ thống hiện tại được thiết kế để phân loại các bài tập theo **đúng 3 thẻ (tags) cố định** sau đây:

1. **Bất đẳng thức** (Inequalities)
2. **Tổ hợp** (Toán rời rạc và tổ hợp, thường xuất hiện ở các câu cuối đề chuyên)
3. **Other** (Tất cả các dạng bài CÒN LẠI: Hình học, Đại số, Số học, Phương trình, v.v.)

## Hướng dẫn sử dụng khi push bài tập
Khi sử dụng script để đẩy một bài toán mới thuộc mục Toán vào 10 lên Supabase, bạn cần đảm bảo biến `tags` chỉ chứa một hoặc nhiều tag trong 3 tag hợp lệ trên.

**Ví dụ hợp lệ:**
```javascript
  tags: ["Bất đẳng thức"]
```
```javascript
  tags: ["Tổ hợp"]
```
```javascript
  tags: ["Other"]
```

## Lưu ý về giao diện web
Giao diện hiển thị danh sách bài tập của Toán vào 10 (`#/math/list/vao_10`) đã được cấu hình sẵn các bộ lọc (filter) chỉ hiển thị 3 tag này để người học dễ dàng phân loại và tìm kiếm bài tập theo trọng tâm ôn thi.

## Lưu ý về định dạng nội dung (Formatting)
1. **Không dùng dấu `**` để in đậm**: Do hệ thống render LaTeX đơn giản (không phải Markdown full), việc dùng `**Câu a**` sẽ hiện nguyên dấu `**` trên web. Hãy dùng chữ thường hoặc định dạng khác phù hợp.
2. **Không tự ý bịa lời giải**: Nếu chưa có lời giải chính thức hoặc phân tích cụ thể, **buộc phải để nội dung là "Đang cập nhật"**, tuyệt đối không tự viết phân tích nếu không chắc chắn hoặc không được yêu cầu.

## Quy định đặt tên (Naming Convention)
Để giao diện bảng danh sách trông gọn gàng và thống nhất, hãy tuân thủ cấu trúc sau:

**1. ID Bài tập:**
- Đề thường: `vao10_math_XXX`
- Đề chuyên / HSG: `vao10chuyen_math_XXX`

**2. Đề vào 10 (Thường)** (`subcategory: "vao_10"`)
- **Tên bài (Title)**: `[Tag] - Đề vào 10 [Tên tỉnh] [Năm]` (Vd: `Hình học - Đề vào 10 Hà Nội 2025`)
- **Nguồn (Source)**: `Đề thi vào 10 [Tên tỉnh] [Năm]` (Vd: `Đề thi vào 10 Hà Nội 2025`)

**3. Đề vào 10 Chuyên** (`subcategory: "vao_10_chuyen"`)
- **Tên bài (Title)**: `[Tag] - Bài tập vào 10 chuyên [Tên tỉnh] [Năm]` (Vd: `Tổ hợp - Bài tập vào 10 chuyên Bắc Ninh 2025`)
- **Nguồn (Source)**: `Đề thi vào 10 chuyên [Tên tỉnh] [Năm]` (Vd: `Đề thi vào 10 chuyên Bắc Ninh 2025`)

**4. Đề thi Học Sinh Giỏi (HSG) Cấp Tỉnh** (Dùng chung `subcategory: "vao_10_chuyen"`)
- **Tên bài (Title)**: `[Tag] - Đề thi HSG Toán 9 [Tên tỉnh] [Năm]` (Vd: `Bất đẳng thức - Đề thi HSG Toán 9 Hà Nội 2025`)
- **Nguồn (Source)**: `Đề thi HSG Toán 9 cấp tỉnh [Tên tỉnh] [Năm]` (Vd: `Đề thi HSG Toán 9 cấp tỉnh Hà Nội 2025`)

*Lưu ý: Nếu không nhắc đến năm cụ thể, mặc định lấy năm **2025**.*

## Quy trình làm việc (Workflow Mới - Batch Processing)
Thay vì push từng file một như trước, quy trình hiện tại tối ưu cho việc nhập liệu số lượng lớn (Batch Processing):
1. **User**: Gửi ảnh đề bài liên tục cho AI (có thể gửi nhiều ảnh của cùng 1 đề).
2. **AI Agent**: Trích xuất nội dung từ ảnh, phân loại và lưu toàn bộ dữ liệu vào duy nhất một file mảng JSON: `data/pending_problems.json`.
3. **User**: Khi đã gửi xong một loạt đề, User chạy lệnh `node scripts/push_all.js` trên máy cá nhân để đẩy toàn bộ dữ liệu từ file JSON lên Supabase.
4. **Hệ thống**: Sau khi đẩy dữ liệu thành công, script sẽ tự động xóa sạch dữ liệu trong `data/pending_problems.json` để chuẩn bị cho lần nhập liệu tiếp theo.
- **AI Agent**: **TUYỆT ĐỐI KHÔNG** tự ý chạy lệnh push trên terminal.
