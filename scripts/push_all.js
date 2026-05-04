require('dotenv').config({ path: __dirname + '/../.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Thiếu SUPABASE_URL hoặc SUPABASE_ROLE_KEY trong file .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const PENDING_FILE = path.join(__dirname, '../data/pending_problems.json');

async function pushAllProblems() {
  if (!fs.existsSync(PENDING_FILE)) {
    console.error(`❌ File không tồn tại: ${PENDING_FILE}`);
    return;
  }

  try {
    const fileContent = fs.readFileSync(PENDING_FILE, 'utf-8');
    if (!fileContent.trim()) {
      console.log("✅ File rỗng. Không có bài tập nào cần push.");
      return;
    }

    const problemData = JSON.parse(fileContent);
    const problemsToInsert = Array.isArray(problemData) ? problemData : [problemData];

    if (problemsToInsert.length === 0) {
      console.log("✅ Mảng rỗng. Không có bài tập nào cần push.");
      return;
    }

    console.log(`Đang chuẩn bị đẩy ${problemsToInsert.length} bài tập lên Supabase...`);

    const { data, error } = await supabase
      .from('math_problems')
      .insert(problemsToInsert);

    if (error) {
      console.error("❌ Lỗi khi push lên Supabase:", error.message, error.details);
    } else {
      console.log(`✅ Đã đẩy thành công ${problemsToInsert.length} bài tập lên database!`);
      // Xóa nội dung file sau khi push thành công
      fs.writeFileSync(PENDING_FILE, '[]', 'utf-8');
      console.log("✅ Đã dọn dẹp file data/pending_problems.json để tránh push trùng lặp.");
    }
  } catch (err) {
    console.error(`❌ Lỗi khi xử lý:`, err.message);
  }
}

pushAllProblems();
