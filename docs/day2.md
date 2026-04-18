# ThunoPro — Day 2 Summary

> Ngày 18/04/2026 — Tổng hợp toàn bộ trạng thái hiện tại của dự án.

---

## 1. Cấu trúc Project

```
clone/
├── index.html          # Khung HTML chính của SPA, chứa Header, Nav, Footer, Auth Modal
├── script.js           # Toàn bộ logic frontend: Router, Render, Supabase Auth, LaTeX
├── style.css           # Toàn bộ CSS: Design system, Dark Mode, Components, Modal
├── background.jpg      # Ảnh nền tùy chỉnh (bật/tắt được)
│
├── push_problem.js     # Script Node.js: đẩy bài tập lên Supabase database
├── push_blog.js        # Script Node.js: đẩy bài blog lên Supabase database
├── push_prompt.md      # System Prompt chuẩn: hướng dẫn AI format bài tập đúng chuẩn
│
├── f.js                # Utility script phụ trợ
├── .env                # Biến môi trường (SUPABASE_URL, SUPABASE_ROLE_KEY) — KHÔNG commit
├── .gitignore          # Bỏ qua .env và node_modules
├── package.json        # Dependencies: dotenv, @supabase/supabase-js
└── node_modules/       # Dependencies đã cài
```

---

## 2. Tech Stack

| Thành phần | Công nghệ |
|---|---|
| **Frontend** | Vanilla HTML + CSS + JavaScript (SPA) |
| **Backend / Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (Email/Password) |
| **Math Rendering** | KaTeX (LaTeX → HTML) |
| **Icons** | Font Awesome 6 |
| **Fonts** | Google Fonts — Ubuntu, Ubuntu Mono |
| **Hosting** | Vercel (auto-deploy từ GitHub) |
| **Repo** | GitHub — `thunopro/thunopro-just_do_it` |

---

## 3. Database Schema (Supabase)

### Bảng `problems`
Lưu trữ toàn bộ bài tập Competitive Programming.

| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | text (PK) | Mã bài duy nhất (VD: `CTT_2025_5`) |
| `title` | text | Tên bài tập |
| `source` | text | Nguồn bài (VD: `CTT 2025`) |
| `source_url` | text | Link bài gốc |
| `difficulty` | text | Độ khó (VD: `2800`) |
| `tags` | text[] | Mảng tag thuật toán |
| `summary` | text | Tóm tắt đề bài (có LaTeX) |
| `analysis_and_solution` | text | Phân tích & giải thuật (có LaTeX) |
| `created_at` | timestamp | Thời điểm thêm vào |

### Bảng `user_problems`
Theo dõi tiến độ làm bài của từng user.

| Cột | Kiểu | Mô tả |
|---|---|---|
| `user_id` | uuid (FK) | Liên kết với `auth.users` |
| `problem_id` | text (FK) | Liên kết với `problems.id` |
| `completed` | boolean | Đã hoàn thành hay chưa |

> **Bảo mật**: RLS (Row Level Security) đã được bật. User chỉ đọc/ghi được dữ liệu của chính họ.

---

## 4. Tính năng đã hoàn thiện

### 🗂️ SPA Router
- Điều hướng không reload trang bằng URL hash (`#/`, `#/problems`, `#/blog`, ...)
- Các trang: **Today**, **All Problems**, **Categories**, **Blog**, **Problem Detail**, **Blog Detail**

### 📚 Quản lý Bài tập
- Render bài tập từ Supabase lên trang web tự động
- Hiển thị **LaTeX** chuẩn web qua KaTeX (cả inline `$...$` và display `$$...$$`)
- Mỗi bài tập có: Tiêu đề, Nguồn, Tóm tắt đề, nút **"Xem phân tích"**, nút **"Link bài tập"**
- Thêm bài mới bằng `node push_problem.js` (theo format chuẩn trong `push_prompt.md`)

### 🎨 Giao diện (UI/UX)
- **Dark Mode / Light Mode**: Tự động theo hệ thống, lưu vào localStorage
- **Background Image**: Bật/tắt ảnh nền mờ `background.jpg` bằng nút icon hình bức tranh, lưu vào localStorage
- **Glassmorphism**: Header, Nav, các khối bài tập có hiệu ứng kính mờ `backdrop-filter: blur`
- **Color Accent**: Xanh dương chuyên nghiệp (`#2563eb` / `#3b82f6` dark)
- **Buttons**: `.btn-primary` (nền xanh) và `.btn-outline` (viền xanh) — chuẩn Design System
- **Section Labels**: Có vệt màu bên trái để phân biệt các phân vùng
- **Responsive**: Tương thích thiết bị di động

### 👤 Hệ thống Tài khoản
- **Đăng ký / Đăng nhập** bằng Email & Password qua Supabase Auth
- Modal popup đẹp, có chuyển đổi giữa form Đăng nhập / Đăng ký
- Sau khi đăng nhập: nút Login đổi thành tên email, bấm vào để Đăng xuất
- Session được lưu tự động, refresh trang vẫn giữ đăng nhập

### ✅ Tracking Bài tập
- Mỗi bài tập có nút **tick xanh "Hoàn thành"** ở góc tiêu đề
- Bấm tick → lưu ngay vào `user_problems` trên Supabase
- Tải trang lại → tự động load và hiển thị lại các bài đã tích
- Chưa đăng nhập bấm tick → tự động mở modal đăng nhập

### 📝 Blog
- Trang danh sách Blog với card layout đẹp
- Trang chi tiết bài Blog với định dạng Markdown-like

---

## 5. Workflow Thêm Bài Tập Mới

```
1. Nhận đề bài + phân tích → gửi cho AI với system prompt từ push_prompt.md
2. AI tự động update file push_problem.js theo đúng format chuẩn
3. Bạn review nội dung trong push_problem.js
4. Chạy: node push_problem.js
5. Bài tập xuất hiện trên web ngay lập tức
```

**Chuẩn format (push_prompt.md)**:
- `summaryText`: Văn xuôi gọn, chỉ dùng inline `$...$` (không dùng `$$`)
- `analysisText`: Đánh số 1, 2, 3... Dùng `$$...$$` cho công thức phức tạp
- Kết thúc bằng: "Độ phức tạp: Thời gian $O(...)$, Bộ nhớ $O(...)$"

---

## 6. Các bước Deploy

```bash
git add .
git commit -m "message"
git push origin main
# Vercel tự động deploy trong ~30 giây
```

---

## 7. Kế hoạch tương lai (Next Steps)

- [ ] Tính năng **Comment** trên từng bài tập
- [ ] **Bảng xếp hạng** (số bài đã hoàn thành)
- [ ] Trang **Profile** cá nhân của user
- [ ] Tính năng đăng nhập bằng **Google OAuth**
- [ ] **Phân quyền Admin** — chỉ admin mới có thể thêm/xóa bài
- [ ] Trang **Categories** hoàn thiện hơn với filter theo tag
