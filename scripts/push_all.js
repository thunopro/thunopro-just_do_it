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
    const allProblems = Array.isArray(problemData) ? problemData : [problemData];

    if (allProblems.length === 0) {
      console.log("✅ Mảng rỗng. Không có bài tập nào cần push.");
      return;
    }

    const mathProblems = allProblems.filter(p => !p.id.startsWith('cs_'));
    const csProblems = allProblems.filter(p => p.id.startsWith('cs_'));

    console.log(`Đang chuẩn bị đẩy ${allProblems.length} bài tập (${mathProblems.length} Math, ${csProblems.length} CS) lên Supabase...`);

    let success = true;

    if (mathProblems.length > 0) {
      const { error } = await supabase.from('math_problems').insert(mathProblems);
      if (error) {
        console.error("❌ Lỗi khi push Math lên Supabase:", error.message);
        success = false;
      } else {
        console.log(`✅ Đã đẩy thành công ${mathProblems.length} bài Math.`);
      }
    }

    if (csProblems.length > 0) {
      const { error } = await supabase.from('cs_problems').insert(csProblems);
      if (error) {
        console.error("❌ Lỗi khi push CS lên Supabase:", error.message);
        success = false;
      } else {
        console.log(`✅ Đã đẩy thành công ${csProblems.length} bài CS.`);
      }
    }

    if (success) {
      // Xóa nội dung file sau khi push thành công toàn bộ
      fs.writeFileSync(PENDING_FILE, '[]', 'utf-8');
      console.log("✅ Đã dọn dẹp file data/pending_problems.json.");
    } else {
      console.log("⚠️ Có lỗi xảy ra, file data/pending_problems.json vẫn được giữ lại để bạn kiểm tra.");
    }
  } catch (err) {
    console.error(`❌ Lỗi khi xử lý:`, err.message);
  }
}

pushAllProblems();
