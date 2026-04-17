require('dotenv').config({ path: __dirname + '/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ROLE_KEY);

// =========================================================
// PHẦN CONTENT - Điền vào đây rồi chạy: node push_blog.js
// =========================================================

// Tóm tắt ngắn hiện trên trang danh sách (plain text, ~2 câu)
const excerptText = `Đây là đoạn mô tả ngắn hiện trên trang danh sách blog. Viết 1-2 câu tóm tắt nội dung bài để người đọc quyết định có vào đọc không.`;

// Nội dung đầy đủ (hỗ trợ HTML cơ bản: <p>, <h2>, <h3>, <ul>, <li>, <code>, <blockquote>)
const contentText = `<p>Đây là nội dung đầy đủ của bài blog. Bạn có thể dùng HTML cơ bản để định dạng.</p>

<h2>Tiêu đề lớn</h2>
<p>Nội dung đoạn văn. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>

<h3>Tiêu đề nhỏ hơn</h3>
<ul>
  <li>Điểm thứ nhất</li>
  <li>Điểm thứ hai</li>
  <li>Điểm thứ ba</li>
</ul>

<blockquote>Một câu trích dẫn hay ho nào đó mà bạn muốn làm nổi bật.</blockquote>

<p>Đoạn kết của bài viết.</p>`;


async function pushBlog() {
  const newPost = {
    // =========================================================
    // VÙNG NÀY TỰ CHỈNH SỬA TRƯỚC KHI CHẠY
    // =========================================================
    id: "blog-001",                         // ID duy nhất cho bài (dùng trong URL)
    title: "Tiêu đề bài blog đầu tiên",    // Tiêu đề
    category: ["cuộc đời"],                 // Mảng danh mục / tags

    excerpt: excerptText,
    content: contentText,
  };

  console.log("Đang đẩy bài blog lên Supabase...");
  const { error } = await supabase.from('blogs').insert([newPost]);
  if (error) {
    console.error("❌ Lỗi:", error.message);
  } else {
    console.log("✅ Đẩy thành công! Bài blog đã lên Supabase.");
  }
}

pushBlog();
