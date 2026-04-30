require('dotenv').config({ path: __dirname + '/.env' });
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
const summaryText = String.raw`Cho $t$ test cases, mỗi case gồm số nguyên $n$ ($n \le 10$) và $3$ mảng $A, B, C$ có kích thước $3^n$. Các phần tử $A_i, B_i$ được sinh ngẫu nhiên độc lập trong khoảng $[0, p)$ với $p = 998244353$. Mối liên hệ: $C_i = \left(\sum_{j \oplus k = i} A_j \times B_k\right) \pmod p$. Trong đó phép toán $\oplus$ thao tác trên từng chữ số ở hệ cơ số $3$, được định nghĩa bởi một ma trận $op$ kích thước $3 \times 3$ chưa biết (gồm các phần tử $0, 1, 2$). Yêu cầu: Tìm và in ra $9$ phần tử của ma trận $op$.`;

const analysisText = String.raw`1. Phân tích bài toán:
Bài toán yêu cầu ta tìm hàm $op$ (có $3^9 = 19683$ trường hợp). Nếu duyệt qua toàn bộ $19683$ ma trận và với mỗi ma trận tính lại mảng $C$ theo công thức chập (convolution) thì độ phức tạp sẽ lên tới $O(19683 \times 3^{2n})$, chắc chắn sẽ quá thời gian (TLE) vì $n$ có thể lên tới $10$. Điểm mấu chốt (The Trick): Đề bài nhấn mạnh $A$ và $B$ được sinh ngẫu nhiên. Điều này gợi ý rằng ta không cần tính toàn bộ mảng $C$ để đối chiếu. Ta có thể dùng kỹ thuật chiếu (tính tổng biên - marginal sums) trên từng cột chữ số. Do tính ngẫu nhiên của tập dữ liệu, một ma trận sai gần như không có xác suất tạo ra tổng biên giống với ma trận đúng.

2. Cô lập từng chữ số (Marginal Sums):
Thay vì xét cả cấu trúc $n$ chữ số, ta chỉ xét một vị trí chữ số $l$ bất kỳ ($0 \le l < n$). Gọi $SA_{l,x}$ là tổng tất cả các $A_j$ mà chữ số thứ $l$ của $j$ bằng $x$ ($x \in \{0,1,2\}$). Tương tự cho $SB_{l,y}$ và $SC_{l,c}$.

3. Phương trình độc lập:
Nhờ tính phân phối của phép nhân qua phép cộng, tổng biên của $C$ được tính cực kỳ nhanh:
$$SC_{l,c} = \sum_{x,y \text{ s.t. } op(x,y)=c} (SA_{l,x} \times SB_{l,y}) \pmod p$$
Ta tính trước mảng tích: $M_{l,x,y} = (SA_{l,x} \times SB_{l,y}) \pmod p$.

4. Duyệt tìm ma trận (Brute-force):
Có $3^9 = 19683$ cách điền các giá trị vào ma trận $op$. Với mỗi ma trận, ta kiểm tra xem nó có thỏa mãn phương trình tổng biên ở trên cho mọi vị trí chữ số $l$ hay không. Chỉ cần tổng $3$ nhóm tương ứng đúng bằng $SC_{l,0}, SC_{l,1}, SC_{l,2}$ với mọi $l$ là ta có thể tự tin in ra kết quả. Xác suất "dương tính giả" là cực kỳ thấp do các hệ số là các số ngẫu nhiên lớn sinh từ $p$.

Độ phức tạp: Thời gian $O(n \cdot 3^n + 19683 \cdot 9n)$, Bộ nhớ $O(3^n)$.`;


async function pushToDatabase() {
  const newProblem = {
    // =========================================================
    // VÙNG NÀY LÀ CỦA BẠN: HÃY TỰ CHỈNH SỬA TRƯỚC KHI CHẠY
    // =========================================================
    id: "CTT_2025_6",
    title: "miracle",
    source: "CTT 2025",
    source_url: "https://qoj.ac/contest/2670/problem/15506",
    difficulty: "2800",
    tags: ["convolution"],

    summary: summaryText,
    analysis_and_solution: analysisText
  };

  console.log("Đang đẩy bài toán lên Supabase...");
  const { data, error } = await supabase
    .from('cs_problems')
    .insert([newProblem]);

  if (error) {
    console.error("❌ Lỗi:", error.message, error.details);
  } else {
    console.log("✅ Đẩy thành công!");
  }
}

pushToDatabase();
