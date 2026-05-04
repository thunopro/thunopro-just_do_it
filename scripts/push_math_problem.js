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
const summaryText = String.raw`Cho $a, b, c$ là các số thực không âm và thỏa mãn $a^2 + b^2 + c^2 = 8$. Tìm giá trị lớn nhất của biểu thức
$$P = \frac{2a + c}{1 + bc} + \frac{2b + c}{1 + ca}.$$`;

const analysisText = String.raw`Đang cập nhật`;


async function pushToDatabase() {
  const newProblem = {
    // =========================================================
    // VÙNG NÀY LÀ CỦA BẠN: HÃY TỰ CHỈNH SỬA TRƯỚC KHI CHẠY
    // =========================================================
    id: "vao10chuyen_math_009",
    title: "Bất đẳng thức - Bài tập vào 10 chuyên Bắc Ninh 2024",
    subcategory: "vao_10_chuyen", // "vao_10" (vào 10 thường) hoặc "vao_10_chuyen" (vào 10 chuyên)
    source: "Đề thi vào 10 chuyên Bắc Ninh 2024",
    source_url: "",
    difficulty: "Khó",
    tags: ["Bất đẳng thức"], // Chỉ được chọn trong 4 tag: "Hình học", "Bất đẳng thức", "Tổ hợp", "Other"

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
