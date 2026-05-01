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
const summaryText = String.raw`Cho đường tròn $(O; R)$ có đường kính $AB$ vuông góc với dây cung $CD$ tại điểm $I$ ($I$ nằm giữa $A$ và $O$). Lấy điểm $E$ bất kỳ trên cung nhỏ $BC$ ($E$ khác $B$ và $C$). Hai đoạn thẳng $AE$ và $CD$ cắt nhau tại $K$.
a) Chứng minh tứ giác $KEBI$ là tứ giác nội tiếp.
b) Chứng minh: $AK \cdot AE = AB \cdot AI$.
c) Gọi $P$ là giao điểm của tia $BE$ và tia $DC, Q$ là giao điểm của hai đường thẳng $AP$ và $BK$. Chứng minh $OQ$ là tiếp tuyến của đường tròn ngoại tiếp $\Delta PQE$.`;

const analysisText = String.raw`Đang cập nhật`;


async function pushToDatabase() {
  const newProblem = {
    // =========================================================
    // VÙNG NÀY LÀ CỦA BẠN: HÃY TỰ CHỈNH SỬA TRƯỚC KHI CHẠY
    // =========================================================
    id: "vao10_math_041",
    title: "Hình học - Đề vào 10 Bạc Liêu 2025",
    subcategory: "vao_10", // Đánh dấu đây là bài tập vào lớp 10
    source: "Đề thi vào 10 Bạc Liêu 2025",
    source_url: "",
    difficulty: "Khó",
    tags: ["Hình học"], // Chỉ được chọn trong 3 tag: "Hình học", "Bất đẳng thức", "Other"

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
