# Quy định tag cho chuyên đề Toán vào 10

Đối với các bài tập thuộc chuyên đề **Toán vào 10** (`subcategory: "vao_10"`), hệ thống hiện tại được thiết kế để phân loại các bài tập theo **đúng 3 thẻ (tags) cố định** sau đây:

1. **Hình học** (Geometry)
2. **Bất đẳng thức** (Inequalities)
3. **Other** (Các dạng bài khác: Đại số, Số học, Phương trình, v.v.)

## Hướng dẫn sử dụng khi push bài tập
Khi sử dụng script `push_math_problem.js` để đẩy một bài toán mới thuộc mục Toán vào 10 lên Supabase, bạn cần đảm bảo biến `tags` chỉ chứa một hoặc nhiều tag trong 3 tag hợp lệ trên.

**Ví dụ hợp lệ:**
```javascript
  tags: ["Hình học"]
```
```javascript
  tags: ["Bất đẳng thức"]
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
- **Tên bài (Title)**: `(Loại bài tập) - Đề vào 10 (Tên tỉnh) (Năm)`
  - Nếu không nhắc đến năm cụ thể, mặc định lấy năm **2025**.
  - Ví dụ: `Hình học - Đề vào 10 Hà Nội 2025`, `Bất đẳng thức - Đề vào 10 Vĩnh Phúc 2025`
- **Nguồn (Source)**: `Đề thi vào 10 (Tên tỉnh) (Năm)`
  - Mặc định năm **2025**.
  - Ví dụ: `Đề thi vào 10 Hà Nội 2025`

## Quy trình làm việc (Workflow)
- **AI Agent**: Chỉ chịu trách nhiệm trích xuất nội dung từ ảnh, biên soạn vào file `scripts/push_math_problem.js` theo đúng định dạng và quy định.
- **AI Agent**: **TUYỆT ĐỐI KHÔNG** tự ý chạy lệnh push trên terminal. 
- **User**: Sẽ là người trực tiếp chạy lệnh `node scripts/push_math_problem.js` trên máy cá nhân để đẩy dữ liệu.
