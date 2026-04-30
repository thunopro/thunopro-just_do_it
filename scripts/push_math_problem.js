require('dotenv').config({ path: __dirname + '/../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Thiếu SUPABASE_URL hoặc SUPABASE_ROLE_KEY trong file .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// =========================================================
// PHẦN CONTENT (dùng String.raw để giữ nguyên LaTeX)
// =========================================================
const summaryText = String.raw`Cho các số thực dương $a, b, c$ thỏa mãn $4(ab+bc+ca)=5c^2$. Tìm giá trị lớn nhất của biểu thức $S = \sqrt{\frac{2(a+b)}{c}} - \frac{a^2+b^2}{c^2}$.`;

const analysisText = String.raw`Đang cập nhật`;


async function pushToDatabase() {
  const newProblem = {
    // =========================================================
    // VÙNG NÀY LÀ CỦA BẠN: HÃY TỰ CHỈNH SỬA TRƯỚC KHI CHẠY
    // =========================================================
    id: "vao10_math_030",
    title: "Bất đẳng thức - Đề vào 10 Ninh Bình 2025",
    subcategory: "vao_10", // Đánh dấu đây là bài tập vào lớp 10
    source: "Đề thi vào 10 Ninh Bình 2025",
    source_url: "",
    difficulty: "Khó",
    tags: ["Bất đẳng thức"], // Chỉ được chọn trong 3 tag: "Hình học", "Bất đẳng thức", "Other"

    summary: summaryText,
    analysis_and_solution: analysisText
  };

  console.log("Đang đẩy bài tập toán lên Supabase...");
  const { data, error } = await supabase
    .from('math_problems')
    .insert([newProblem]);

  if (error) {
    console.error("❌ Lỗi:", error.message, error.details);
  } else {
    console.log("✅ Đẩy thành công!");
  }
}

pushToDatabase();
