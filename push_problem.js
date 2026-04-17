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
const summaryText = String.raw`Bạn được cho hai chuỗi nhị phân $s$ và $t$ có cùng độ dài $n$. Có một công cụ gọi là "luân chuyển" (rotator) cho phép chọn một chuỗi con có độ dài chính xác bằng $3$ và dịch vòng nó (tức là biến $xyz$ thành $yzx$ hoặc $zxy$).
Bạn cần trả lời $q$ truy vấn, mỗi truy vấn gồm một đoạn $[l, r]$. Với mỗi truy vấn, bạn cần tìm số lần sử dụng "luân chuyển" ít nhất để biến chuỗi con $s[l \dots r]$ thành $t[l \dots r]$. Nếu không thể biến đổi, in ra $-1$.`;

const analysisText = String.raw`1. Quan sát cơ bản:
Phép luân chuyển độ dài $3$ bản chất là phép hoán vị vị trí của một phần tử trong chuỗi đi qua $2$ phần tử kề cạnh nó (di chuyển sang trái hoặc phải $2$ vị trí).
Gọi $P_s[i]$ và $P_t[i]$ lần lượt là mảng tổng tiền tố của chuỗi $s$ và $t$. Đặt mảng chênh lệch $E_i = P_t[i] - P_s[i]$.
Đối với truy vấn $[l, r]$, chênh lệch tương đối sẽ là $D_i = E_i - E_{l-1}$ với mọi $l \le i \le r$.

2. Điều kiện bất khả thi:
Nếu $E_r \ne E_{l-1}$, tức là số lượng số $1$ trong $s[l \dots r]$ và $t[l \dots r]$ khác nhau, ta không thể biến đổi → kết quả là $-1$.
Nếu độ dài của đoạn nhỏ hơn $3$ (tức $r - l + 1 < 3$), ta không thể áp dụng rotator. Nếu $s[l \dots r]$ đã giống $t[l \dots r]$ thì tốn $0$ bước, ngược lại là $-1$.

3. Quy về bài toán ghép cặp tham lam:
Với các trường hợp hợp lệ, số thao tác tối thiểu tương đương với chi phí để làm mảng $D_i$ trở về toàn $0$. Chi phí này độc lập giữa phần dương ($D_i > 0$) và phần âm ($D_i < 0$), và có thể tính được bằng bài toán "ghép cặp tham lam" (greedy matching) trên mảng $D_i$.

4. Tối ưu hóa đa truy vấn bằng Segment Tree:
Để giải quyết đa truy vấn trong thời gian $O((N + Q) \log N)$, ta sử dụng Segment Tree để duy trì sự thay đổi của hàm ghép cặp. Bằng cách lưu trữ các hàm chuyển đổi trạng thái tuyến tính theo đoạn (piecewise linear functions), ta dễ dàng kết hợp trạng thái của node con trái và node con phải trong $O(1)$.
Khởi tạo mảng $E_i = P_t[i] - P_s[i]$ với mọi $1 \le i \le n$. Mỗi thao tác biến đổi $xyz \to yzx$ hoặc $zxy$ làm thay đổi $D_i$ tương đương với việc tăng/giảm $D_i$ hoặc cặp $(D_i, D_{i+1})$ đi $1$ đơn vị.
Với truy vấn $[l, r]$, ta truy xuất node tương ứng trên Segment Tree, áp dụng tham số ranh giới $E_{l-1}$ và thu được kết quả tức thời trong $O(\log N)$.

Độ phức tạp: Thời gian $O((N + Q) \log N)$, Bộ nhớ $O(N \log N)$.`;


async function pushToDatabase() {
  const newProblem = {
    // =========================================================
    // VÙNG NÀY LÀ CỦA BẠN: HÃY TỰ CHỈNH SỬA TRƯỚC KHI CHẠY
    // =========================================================
    id: "CTT_2025_1",
    title: "shapez",
    source: "CTT 2025",
    source_url: "https://qoj.ac/contest/2667/problem/15501",
    difficulty: "2500",
    tags: ["segment tree"],

    summary: summaryText,
    analysis_and_solution: analysisText
  };

  console.log("Đang đẩy bài toán lên Supabase...");
  const { data, error } = await supabase
    .from('problems')
    .insert([newProblem]);

  if (error) {
    console.error("❌ Lỗi:", error.message, error.details);
  } else {
    console.log("✅ Đẩy thành công!");
  }
}

pushToDatabase();
