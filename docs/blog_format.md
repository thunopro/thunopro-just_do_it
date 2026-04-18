# ThunoPro — Hướng dẫn viết Blog

> Cập nhật: 19/04/2026

---

## Cách đẩy bài lên

```bash
node scripts/push_blog.js
```

---

## Cấu trúc object mỗi bài

```js
const newPost = {
    id: 'slug-url-bai-viet',     // URL bài (lowercase, dấu gạch ngang, không dấu)
    title: 'Tiêu đề bài',        // Tiêu đề hiển thị
    category: ['bản thân'],      // 1 category (xem danh sách bên dưới)
    hot: false,                  // true → ghim lên mục 🔥 Nổi bật ở sidebar
    content: contentText,        // Nội dung HTML
};
```

> Không cần `excerpt` — trang danh sách chỉ hiện tiêu đề.

---

## Danh mục (category)

| Giá trị        | Dùng khi nào                            |
|----------------|-----------------------------------------|
| `bản thân`     | Nhật ký ngày, 5 việc hôm nay            |
| `đọc sách`     | Review / ghi chú từ sách đã đọc         |
| `cách học tin` | Tips học lập trình, CP, lộ trình        |

---

## 3 loại bài và template

### 1. Nhật ký ngày — 5 việc hôm nay (`bản thân`)

```js
const NGAY = 'DD/MM/YYYY';
const ID   = 'nhat-ky-DD-MM-YYYY';

const contentText = `<p>Hôm nay, ${NGAY}. Ghi ra 5 việc để không quên.</p>

<ul>
  <li>Việc 1.</li>
  <li>Việc 2.</li>
  <li>Việc 3.</li>
  <li>Việc 4.</li>
  <li>Việc 5.</li>
</ul>

<p><em>Cuối ngày nhìn lại: được mấy việc?</em></p>`;

// object:
id: ID,
title: `Ngày ${NGAY} — 5 việc hôm nay`,
category: ['bản thân'],
hot: false,
```

---

### 2. Review sách (`đọc sách`)

```js
const contentText = `<p>Mở đầu ngắn gọn — tại sao đọc cuốn này.</p>

<h2>Ý tưởng cốt lõi</h2>
<p>...</p>

<blockquote>Câu trích dẫn hay nhất từ sách.</blockquote>

<h2>Điều tâm đắc nhất</h2>
<p>...</p>

<p><strong>Điểm: X/10.</strong> Một câu kết luận.</p>`;

// object:
id: 'doc-sach-ten-cuon-sach',
title: 'Đọc sách: Tên cuốn sách — Tác giả',
category: ['đọc sách'],
hot: false,   // ← đổi true nếu muốn ghim
```

---

### 3. Bài học lập trình (`cách học tin`)

```js
const contentText = `<p>Giới thiệu vấn đề / chủ đề.</p>

<h2>Tại sao quan trọng</h2>
<p>...</p>

<h2>Cách làm / lộ trình</h2>
<ul>
  <li>Bước 1...</li>
  <li>Bước 2...</li>
</ul>

<h2>Kết</h2>
<p>...</p>`;

// object:
id: 'ten-bai-hoc',
title: 'Tiêu đề bài',
category: ['cách học tin'],
hot: false,
```

---

## Quy tắc ID (slug)

- Chỉ dùng: `a-z`, `0-9`, dấu `-`
- ✅ `doc-sach-tu-duy-nhanh-va-cham`
- ❌ `Đọc sách: Tư duy nhanh và chậm`

## HTML được dùng trong `contentText`

`<p>` `<h2>` `<h3>` `<ul>` `<li>` `<ol>` `<blockquote>` `<strong>` `<em>`

Không dùng: `<div>` `<span>` `<br>` `<img>`
