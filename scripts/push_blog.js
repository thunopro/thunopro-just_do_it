require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ROLE_KEY);

// =========================================================
// NHẬT KÝ NGÀY — 5 việc hôm nay
// Chạy: node scripts/push_blog.js
// =========================================================

// Ngày hôm nay (đổi mỗi ngày)
const NGAY = '19/04/2026';
const ID   = 'nhat-ky-19-04-2026'; // ← đổi ngày theo format: nhat-ky-DD-MM-YYYY

const contentText = `<p>Hôm nay, ${NGAY}. Ghi ra 5 việc để không quên và để có thứ nhìn lại cuối ngày.</p>

<ul>
  <li>Ôn lại bài CF hôm qua — hiểu kỹ phần binary search trên đáp án.</li>
  <li>Đọc thêm 20 trang "Nhà lãnh đạo không chức danh".</li>
  <li>Viết 1 bài phân tích vào ThunoPro.</li>
  <li>Tập thể dục ít nhất 20 phút.</li>
  <li>Không dùng điện thoại sau 10 giờ tối.</li>
</ul>

<p><em>Cuối ngày nhìn lại: được mấy việc?</em></p>`;


async function pushBlog() {
  const newPost = {
    id: ID,
    title: `Ngày ${NGAY} — 5 việc hôm nay`,
    category: ['bản thân'],
    hot: false,

    content: contentText,
  };

  console.log('Đang đẩy nhật ký lên Supabase...');
  const { error } = await supabase.from('blogs').insert([newPost]);
  if (error) {
    console.error('❌ Lỗi:', error.message);
  } else {
    console.log('✅ Đẩy thành công!', newPost.title);
  }
}

pushBlog();
