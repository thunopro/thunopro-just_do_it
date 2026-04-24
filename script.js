// THUNOPRO Dynamic SPA Router

const SUPABASE_URL = "https://jtjmeqlrcwfbewmxqsxy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0am1lcWxyY3dmYmV3bXhxc3h5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQzMDU4NSwiZXhwIjoyMDkyMDA2NTg1fQ.TTEQRXKorjHwf1LaJt4CF8qr4Et_j4mQ2ljgdhAhqd0";

async function fetchProblems() {
    try {
        const res = await fetch(SUPABASE_URL + '/rest/v1/problems?select=*&order=created_at.desc', {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return await res.json();
    } catch (e) {
        console.error('fetchProblems error:', e);
        return [];
    }
}

async function fetchProblemById(id) {
    try {
        const res = await fetch(SUPABASE_URL + '/rest/v1/problems?id=eq.' + encodeURIComponent(id) + '&select=*', {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
        });
        const data = await res.json();
        return data[0] || null;
    } catch (e) { return null; }
}

// LaTeX: render $...$ with KaTeX, text vẫn copyable nhờ title attribute
function renderLatex(raw) {
    if (!raw) return '';
    var html = '';
    var lines = raw.split('\n');
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        // Replace $$...$$ first (display math)
        line = line.replace(/\$\$([^$]+)\$\$/g, function (_, m) {
            try { return '<span class="math-display">' + katex.renderToString(m, { displayMode: true, throwOnError: false }) + '</span>'; }
            catch (e) { return '<code>$$' + m + '$$</code>'; }
        });
        // Then $...$
        line = line.replace(/\$([^$\n]+)\$/g, function (_, m) {
            try { return '<span class="math-inline" title="' + m + '">' + katex.renderToString(m, { throwOnError: false }) + '</span>'; }
            catch (e) { return '<code>$' + m + '$</code>'; }
        });
        html += line;
        if (i < lines.length - 1) html += '<br>';
    }
    return html;
}

// ===== TODAY PAGE =====
async function renderTodayPage() {
    const appRoot = document.getElementById('app-root');
    appRoot.innerHTML = '<div class="cf-content"><div class="cf-loading">Đang tải bài tập...</div></div>';

    const problems = await fetchProblems();
    if (!problems.length) {
        appRoot.innerHTML = '<div class="cf-content"><p class="cf-empty">Chưa có bài nào. Dùng push_problem.js để thêm!</p></div>';
        return;
    }

    var html = '<div class="cf-content">';
    problems.forEach(function (p) {
        html += '<div class="cf-problem-block">';
        // Header
        html += '<div class="cf-problem-title-bar" data-pid="' + p.id + '">';
        html += '<a class="cf-prob-title" href="#/problem/' + p.id + '">' + (p.title || p.id) + '</a>';
        if (p.source) html += '<span class="cf-prob-source">' + p.source + '</span>';
        html += '</div>';
        // Statement
        html += '<div class="cf-statement">';
        html += renderLatex(p.summary || '');
        html += '</div>';
        // Footer link
        html += '<div class="cf-prob-footer" style="display: flex; gap: 12px; margin-top: 12px;">';
        if (p.source_url) {
            html += '<a href="' + p.source_url + '" target="_blank" class="btn-outline">Link bài tập</a>';
        }
        html += '<a href="#/problem/' + p.id + '" class="btn-primary">Xem phân tích</a>';
        html += '</div>';
        html += '</div>';
    });
    html += '</div>';
    appRoot.innerHTML = html;

    // Gắn nút "Hoàn thành" vào mỗi title-bar
    document.querySelectorAll('.cf-problem-title-bar[data-pid]').forEach(function(bar) {
        bar.appendChild(makeDoneBtn(bar.dataset.pid));
    });
}

// ===== PROBLEM DETAIL PAGE =====
async function renderProblemDetail(id) {
    const appRoot = document.getElementById('app-root');
    appRoot.innerHTML = '<div class="cf-content"><div class="cf-loading">Đang tải bài ' + id + '...</div></div>';

    var p = await fetchProblemById(id);
    if (!p) {
        appRoot.innerHTML = '<div class="cf-content"><div class="cf-problem-block"><p>Không tìm thấy bài <strong>' + id + '</strong>.</p><a href="#/" class="cf-back-link">← Quay lại</a></div></div>';
        return;
    }

    var html = '<div class="cf-content">';
    html += '<div class="cf-problem-block">';
    // Title bar
    html += '<div class="cf-problem-title-bar">';
    html += '<a class="cf-back-link" href="#/">←</a>';
    html += '<span class="cf-prob-title cf-prob-title-large">' + (p.title || p.id) + '</span>';
    if (p.source_url) {
        html += '<a class="cf-prob-source" href="' + p.source_url + '" target="_blank">' + (p.source || 'Source') + ' ↗</a>';
    } else if (p.source) {
        html += '<span class="cf-prob-source">' + p.source + '</span>';
    }
    html += '</div>';

    // Summary section
    html += '<div class="cf-section-label">Tóm tắt đề bài</div>';
    html += '<div class="cf-statement">';
    html += renderLatex(p.summary || '');
    html += '</div>';

    // Analysis section
    html += '<div class="cf-section-label cf-section-analysis">Phân tích & Giải thuật</div>';
    html += '<div class="cf-statement cf-analysis-body">';
    html += renderLatex(p.analysis_and_solution || '');
    html += '</div>';

    html += '</div></div>';
    appRoot.innerHTML = html;
}

// Keep all problems in memory for client-side search
var _allProblemsCache = [];

function buildProblemsTable(list) {
    if (!list.length) return '<tr><td colspan="6" style="padding:20px;color:#888;">Không tìm thấy bài nào.</td></tr>';
    return list.map(function (p) {
        var tagsHtml = (p.tags || []).map(function (t) { return '<span class="cf-tag">' + t + '</span>'; }).join(' ');
        var isDone = completedProblems.has(p.id);
        var doneCell = isDone
            ? '<td style="text-align:center;"><span style="color:#22c55e;font-size:16px;font-weight:700;">✓</span></td>'
            : '<td style="text-align:center;"><span style="color:var(--border);font-size:14px;">○</span></td>';
        return '<tr>' +
            doneCell +
            '<td class="cf-td-id">' + (p.id || '') + '</td>' +
            '<td><a href="#/problem/' + p.id + '" class="cf-table-link">' + (p.title || '') + '</a></td>' +
            '<td><div class="cf-tags">' + (tagsHtml || '<span style="color:#ccc">—</span>') + '</div></td>' +
            '<td class="cf-td-diff">' + (p.difficulty || '—') + '</td>' +
            '<td class="cf-td-src">' + (p.source || '–') + '</td>' +
            '</tr>';
    }).join('');
}

async function renderAllProblems() {
    const appRoot = document.getElementById('app-root');
    appRoot.innerHTML = '<div class="cf-problems-layout"><div class="cf-loading">Đang tải...</div></div>';
    _allProblemsCache = await fetchProblems();

    // Collect all unique tags
    var allTags = [];
    _allProblemsCache.forEach(function (p) {
        (p.tags || []).forEach(function (t) {
            if (!allTags.includes(t)) allTags.push(t);
        });
    });

    // Build sidebar HTML
    var sidebarTags = allTags.map(function (t) {
        return '<label class="cf-filter-tag"><input type="checkbox" value="' + t + '" class="prob-tag-cb"> ' + t + '</label>';
    }).join('');

    var html = '<div class="cf-problems-layout">';

    // LEFT: table
    html += '<div class="cf-problems-main">';
    html += '<div class="cf-inline-search">';
    html += '<input type="text" id="prob-search" placeholder="Tìm bài..." autocomplete="off">';
    html += '</div>';
    html += '<table class="cf-table"><thead><tr>';
    html += '<th style="width:36px;text-align:center;">✓</th><th style="width:90px">#</th><th>Tên bài</th><th>Tags</th><th style="width:80px">Độ khó</th><th style="width:130px">Nguồn</th>';
    html += '</tr></thead><tbody id="prob-tbody">';
    html += buildProblemsTable(_allProblemsCache);
    html += '</tbody></table>';
    html += '</div>'; // end main

    // RIGHT: sidebar filter
    html += '<div class="cf-problems-sidebar">';
    html += '<div class="cf-filter-box">';
    html += '<div class="cf-filter-title">Độ khó</div>';
    html += '<select id="prob-diff-filter" class="cf-filter-select">';
    html += '<option value="">Tất cả</option>';
    html += '<option value="easy">≤ 1600</option>';
    html += '<option value="mid">1601 – 2199</option>';
    html += '<option value="hard">≥ 2200</option>';
    html += '</select>';
    html += '</div>';
    if (sidebarTags) {
        html += '<div class="cf-filter-box">';
        html += '<div class="cf-filter-title">Tags</div>';
        html += '<div class="cf-filter-tags">' + sidebarTags + '</div>';
        html += '</div>';
    }
    html += '</div>'; // end sidebar

    html += '</div>'; // end layout
    appRoot.innerHTML = html;

    function applyFilter() {
        var q = (document.getElementById('prob-search').value || '').toLowerCase();
        var diff = document.getElementById('prob-diff-filter').value;
        var checkedTags = Array.from(document.querySelectorAll('.prob-tag-cb:checked')).map(function (el) { return el.value; });
        var filtered = _allProblemsCache.filter(function (p) {
            var matchQ = !q ||
                (p.title || '').toLowerCase().includes(q) ||
                (p.id || '').toLowerCase().includes(q) ||
                (p.source || '').toLowerCase().includes(q);
            var d = parseInt(p.difficulty) || 0;
            var matchD = !diff ||
                (diff === 'easy' && d <= 1600) ||
                (diff === 'mid' && d > 1600 && d < 2200) ||
                (diff === 'hard' && d >= 2200);
            var matchT = !checkedTags.length || checkedTags.every(function (t) { return (p.tags || []).includes(t); });
            return matchQ && matchD && matchT;
        });
        document.getElementById('prob-tbody').innerHTML = buildProblemsTable(filtered);
    }
    document.getElementById('prob-search').addEventListener('input', applyFilter);
    document.getElementById('prob-diff-filter').addEventListener('change', applyFilter);
    document.querySelectorAll('.prob-tag-cb').forEach(function (cb) { cb.addEventListener('change', applyFilter); });
}

var categoriesHTML = '<div class="cf-content">' +
    '<p style="font-size:13px;color:#888;margin-bottom:12px;">Thuật toán theo chủ đề</p>' +
    '<div class="cf-cat-grid">' +
    '<a href="#/problems" class="cf-cat-card"><div class="cf-cat-lbl">DP</div><div><strong>Dynamic Programming</strong><small>Knapsack, LCS, Bitmask, Tree DP</small></div></a>' +
    '<a href="#/problems" class="cf-cat-card"><div class="cf-cat-lbl">GR</div><div><strong>Graph Theory</strong><small>BFS/DFS, Dijkstra, Topo Sort, SCC</small></div></a>' +
    '<a href="#/problems" class="cf-cat-card"><div class="cf-cat-lbl">ST</div><div><strong>Strings</strong><small>KMP, Z-function, Suffix Array</small></div></a>' +
    '<a href="#/problems" class="cf-cat-card"><div class="cf-cat-lbl">DS</div><div><strong>Data Structures</strong><small>Segment Tree, BIT, DSU</small></div></a>' +
    '<a href="#/problems" class="cf-cat-card"><div class="cf-cat-lbl">NT</div><div><strong>Number Theory</strong><small>Sieve, GCD, Modular Inverse</small></div></a>' +
    '<a href="#/problems" class="cf-cat-card"><div class="cf-cat-lbl">TR</div><div><strong>Trees</strong><small>LCA, HLD, Centroid Decomp.</small></div></a>' +
    '<a href="#/problems" class="cf-cat-card"><div class="cf-cat-lbl">GE</div><div><strong>Geometry</strong><small>Convex Hull, Line Intersection</small></div></a>' +
    '<a href="#/problems" class="cf-cat-card"><div class="cf-cat-lbl">FL</div><div><strong>Flows</strong><small>Max Flow, Bipartite Matching</small></div></a>' +
    '</div></div>';

// ===== BLOG =====
async function fetchBlogs() {
    try {
        var res = await fetch(SUPABASE_URL + '/rest/v1/blogs?select=*&order=created_at.desc', {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
        });
        return await res.json();
    } catch (e) { return []; }
}

async function fetchBlogById(id) {
    try {
        var res = await fetch(SUPABASE_URL + '/rest/v1/blogs?id=eq.' + encodeURIComponent(id) + '&select=*', {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
        });
        var data = await res.json();
        return data[0] || null;
    } catch (e) { return null; }
}

function formatDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

var _activeBlogCat = '';

function buildBlogCards(list) {
    if (!list.length) return '<p class="blog-empty">Chưa có bài nào trong mục này.</p>';
    return list.map(function(p) {
        return '<div class="blog-card">' +
            '<h2 class="blog-title"><a href="#/blog/' + p.id + '">' + (p.title || '') + '</a></h2>' +
            '</div>';
    }).join('');
}

async function renderBlogList() {
    var appRoot = document.getElementById('app-root');
    appRoot.innerHTML = '<div class="cf-content"><div class="cf-loading">Đang tải...</div></div>';
    var posts = await fetchBlogs();

    if (!posts || posts.length === 0) {
        appRoot.innerHTML = '<div class="cf-content"><p style="color:#888;padding:40px 0;">Chưa có bài nào.</p></div>';
        return;
    }

    var hotPosts = posts.filter(function(p) { return p.hot; });
    var mainPosts = posts;

    // Sidebar HTML
    var sidebarHtml = '<div class="blog-sidebar">';
    
    sidebarHtml += '<div class="blog-sidebar-section">';
    sidebarHtml += '<a href="#/blog/new" class="btn-primary" style="width:100%; text-align:center; display:block; padding:8px; font-size:14px;"><i class="fas fa-plus"></i> Viết bài mới</a>';
    sidebarHtml += '</div>';

    if (hotPosts.length) {
        sidebarHtml += '<div class="blog-sidebar-section">';
        sidebarHtml += '<div class="blog-sidebar-title">🔥 Nổi bật</div>';
        hotPosts.forEach(function(p) {
            sidebarHtml += '<a href="#/blog/' + p.id + '" class="blog-sidebar-link">' + (p.title || '') + '</a>';
        });
        sidebarHtml += '</div>';
    }
    sidebarHtml += '</div>';

    var html = '<div class="blog-layout">';
    html += '<div class="blog-main">';
    html += '<div class="blog-list">' + buildBlogCards(mainPosts) + '</div>';
    html += '</div>';
    html += sidebarHtml;
    html += '</div>';
    appRoot.innerHTML = html;

}

async function renderBlogDetail(id) {
    var appRoot = document.getElementById('app-root');
    appRoot.innerHTML = '<div class="cf-content"><div class="cf-loading">Đang tải...</div></div>';
    var p = await fetchBlogById(id);

    if (!p) {
        appRoot.innerHTML = '<div class="cf-content"><p>Không tìm thấy bài.</p><a href="#/blog">← Quay lại</a></div>';
        return;
    }

    var html = '<div class="blog-article-wrap">';
    html += '<div class="blog-article">';
    html += '<a href="#/blog" class="blog-back">← Blog</a>';
    html += '<p class="blog-article-date">' + formatDate(p.created_at) + '</p>';
    html += '<h1 class="blog-article-title">' + (p.title || '') + '</h1>';
    html += '<div class="blog-article-divider"></div>';
    html += '<div class="blog-body">' + (p.content || '') + '</div>';
    html += '</div>';
    html += '</div>';
    appRoot.innerHTML = html;
}

async function renderNewBlogForm() {
    var appRoot = document.getElementById('app-root');
    var html = '<div class="blog-article-wrap"><div class="blog-article">';
    html += '<a href="#/blog" class="blog-back">← Quay lại Blog</a>';
    html += '<h1 class="blog-article-title">Viết bài mới</h1>';
    
    html += '<form id="new-blog-form" style="display:flex; flex-direction:column; gap:16px;">';
    
    html += '<div>';
    html += '<label style="font-weight:600; margin-bottom:8px; display:block;">Tiêu đề</label>';
    html += '<input type="text" id="nb-title" required class="modal-input" placeholder="Ví dụ: Kỷ luật bản thân là chìa khóa...">';
    html += '</div>';



    html += '<div>';
    html += '<label style="font-weight:600; margin-bottom:8px; display:block;">Nội dung</label>';
    html += '<div id="nb-editor-container" style="background: var(--bg); font-family: inherit;"></div>';
    html += '</div>';

    html += '<div style="display:flex; align-items:center; gap: 16px; margin-top: 10px;">';
    html += '<button type="submit" id="nb-submit" class="btn-primary" style="padding: 10px 24px;">Đăng bài</button>';
    if (!currentUser) {
        html += '<span style="color:#ef4444; font-size:13px;">Bạn cần đăng nhập để có thể đăng bài.</span>';
    }
    html += '</div>';
    html += '<p id="nb-msg" style="color:red; font-size:13px;"></p>';

    html += '</form>';
    html += '</div></div>';
    
    appRoot.innerHTML = html;

    // Khởi tạo Quill Editor
    var quill = new Quill('#nb-editor-container', {
        theme: 'snow',
        placeholder: 'Bắt đầu viết nội dung bài blog...',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link', 'image', 'video'],
                ['clean']
            ]
        }
    });

    document.getElementById('new-blog-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!currentUser) {
            alert("Bạn cần đăng nhập để đăng bài!");
            return;
        }

        var title = document.getElementById('nb-title').value.trim();

        var content = quill.root.innerHTML.trim();
        if (content === '<p><br></p>') content = '';
        var msg = document.getElementById('nb-msg');
        var btn = document.getElementById('nb-submit');

        if (!title) { msg.textContent = "Vui lòng nhập tiêu đề."; return; }
        if (!content) { msg.textContent = "Vui lòng nhập nội dung."; return; }

        btn.disabled = true;
        btn.textContent = 'Đang đăng...';

        // Tạo id ngẫu nhiên nhưng có chứa title để đẹp link
        var id = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);
        
        var newPost = {
            id: id,
            title: title,
            content: content,
            hot: false
        };

        try {
            var res = await fetch(SUPABASE_URL + '/rest/v1/blogs', {
                method: 'POST',
                headers: { 
                    'apikey': SUPABASE_KEY, 
                    'Authorization': 'Bearer ' + SUPABASE_KEY,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(newPost)
            });

            if (!res.ok) {
                var err = await res.json();
                msg.textContent = 'Lỗi: ' + (err.message || res.status);
            } else {
                window.location.hash = '#/blog/' + id;
            }
        } catch (err) {
            msg.textContent = 'Lỗi mạng: ' + err.message;
        } finally {
            btn.disabled = false;
            btn.textContent = 'Đăng bài';
        }
    });
}

// ===== ROUTER =====
async function router() {
    var path = window.location.hash.slice(1) || '/';
    var appRoot = document.getElementById('app-root');
    appRoot.className = '';
    appRoot.style = '';

    if (path === '/') {
        await renderTodayPage();
    } else if (path === '/problems') {
        await renderAllProblems();
    } else if (path === '/categories') {
        appRoot.innerHTML = categoriesHTML;
    } else if (path === '/blog') {
        await renderBlogList();
    } else if (path === '/blog/new') {
        await renderNewBlogForm();
    } else if (path.startsWith('/blog/')) {
        var bid = path.slice('/blog/new'.length === path.length ? 0 : '/blog/'.length); // Safe check
        await renderBlogDetail(bid);
    } else if (path.startsWith('/problem/')) {
        var id = path.slice('/problem/'.length);
        await renderProblemDetail(id);
    } else {
        appRoot.innerHTML = '<div class="cf-page"><h1 style="font-size:60px;color:#ddd;text-align:center;padding:80px 0;">404</h1></div>';
    }

    document.querySelectorAll('.menu-list a').forEach(function (el) { el.classList.remove('active'); });
    if (path === '/') { var n = document.getElementById('nav-today'); if (n) n.classList.add('active'); }
    if (path === '/problems') { var n = document.getElementById('nav-problems'); if (n) n.classList.add('active'); }
    if (path === '/categories') { var n = document.getElementById('nav-categories'); if (n) n.classList.add('active'); }
    if (path === '/blog' || path.startsWith('/blog/')) { var n = document.getElementById('nav-blog'); if (n) n.classList.add('active'); }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);

// Theme logic
var toggleBtn = document.getElementById('theme-toggle');
if (toggleBtn) {
    if (document.documentElement.classList.contains('dark-mode')) {
        toggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }
    toggleBtn.addEventListener('click', function() {
        document.documentElement.classList.toggle('dark-mode');
        var theme = document.documentElement.classList.contains('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
        toggleBtn.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });
}

// Background logic
var bgToggleBtn = document.getElementById('bg-toggle');
if (bgToggleBtn) {
    bgToggleBtn.addEventListener('click', function() {
        document.documentElement.classList.toggle('with-bg');
        var mode = document.documentElement.classList.contains('with-bg') ? 'image' : 'none';
        localStorage.setItem('bg-mode', mode);
    });
}

// ===== SUPABASE AUTH =====
var _supabase = null;
function getSupabase() {
    if (!_supabase) {
        _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
    return _supabase;
}

var currentUser = null;
var completedProblems = new Set();

// Cập nhật nút Auth trên header
function updateAuthBtn(user) {
    var btn = document.getElementById('auth-btn');
    if (!btn) return;
    if (user) {
        var email = user.email || '';
        var display = email.split('@')[0];
        btn.textContent = display;
        btn.title = 'Đăng xuất';
        btn.onclick = function(e) {
            e.preventDefault();
            getSupabase().auth.signOut().then(function() {
                currentUser = null;
                completedProblems.clear();
                updateAuthBtn(null);
                // Refresh checkboxes nếu đang ở trang có bài tập
                document.querySelectorAll('.prob-done-btn').forEach(function(b) {
                    b.classList.remove('done');
                    b.textContent = '';
                    b.title = 'Đăng nhập để theo dõi';
                });
            });
        };
    } else {
        btn.textContent = 'Login';
        btn.title = 'Đăng nhập';
        btn.onclick = function(e) {
            e.preventDefault();
            openAuthModal(false);
        };
    }
}

// Tải danh sách bài đã hoàn thành
async function loadCompletedProblems(userId) {
    try {
        var sb = getSupabase();
        var { data } = await sb.from('user_problems').select('problem_id').eq('user_id', userId).eq('completed', true);
        completedProblems.clear();
        if (data) data.forEach(function(r) { completedProblems.add(r.problem_id); });
        // Refresh các nút trên trang
        document.querySelectorAll('.prob-done-btn').forEach(function(btn) {
            var pid = btn.dataset.pid;
            if (completedProblems.has(pid)) { btn.classList.add('done'); btn.textContent = '✓'; }
            else { btn.classList.remove('done'); btn.textContent = ''; }
        });
    } catch(e) { console.error('loadCompletedProblems', e); }
}

// Toggle hoàn thành bài tập
async function toggleProblemDone(problemId, btn) {
    if (!currentUser) { openAuthModal(false); return; }
    var sb = getSupabase();
    var isDone = completedProblems.has(problemId);
    try {
        if (isDone) {
            await sb.from('user_problems').delete().eq('user_id', currentUser.id).eq('problem_id', problemId);
            completedProblems.delete(problemId);
            btn.classList.remove('done'); btn.textContent = '';
        } else {
            await sb.from('user_problems').upsert({ user_id: currentUser.id, problem_id: problemId, completed: true });
            completedProblems.add(problemId);
            btn.classList.add('done'); btn.textContent = '✓';
        }
    } catch(e) { console.error('toggleProblemDone', e); }
}

// Tạo nút tick hoàn thành
function makeDoneBtn(problemId) {
    var wrap = document.createElement('div');
    wrap.className = 'prob-done-wrap';
    var btn = document.createElement('button');
    btn.className = 'prob-done-btn' + (completedProblems.has(problemId) ? ' done' : '');
    btn.dataset.pid = problemId;
    btn.textContent = completedProblems.has(problemId) ? '✓' : '';
    btn.title = currentUser ? 'Đánh dấu hoàn thành' : 'Đăng nhập để theo dõi';
    btn.addEventListener('click', function(e) { e.preventDefault(); toggleProblemDone(problemId, btn); });
    var lbl = document.createElement('span');
    lbl.className = 'prob-done-label';
    lbl.textContent = 'Hoàn thành';
    lbl.addEventListener('click', function(e) { e.preventDefault(); toggleProblemDone(problemId, btn); });
    wrap.appendChild(btn); wrap.appendChild(lbl);
    return wrap;
}

// Modal Auth
var authIsRegister = false;
function openAuthModal(isRegister) {
    authIsRegister = isRegister;
    document.getElementById('auth-modal').style.display = 'flex';
    document.getElementById('auth-title').textContent = isRegister ? 'Đăng ký' : 'Đăng nhập';
    document.getElementById('btn-submit-auth').textContent = isRegister ? 'Đăng ký' : 'Đăng nhập';
    document.getElementById('btn-submit-auth').type = isRegister ? 'submit' : 'submit';
    document.getElementById('auth-toggle-mode').textContent = isRegister ? 'Đã có tài khoản? Đăng nhập' : 'Đăng ký tài khoản';
    
    // Ẩn/Hiện phần Ghi nhớ & Quên mật khẩu
    var authOptions = document.getElementById('auth-options');
    if (authOptions) authOptions.style.display = isRegister ? 'none' : 'flex';
    
    // Cập nhật autocomplete cho phù hợp mode
    document.getElementById('auth-pass').autocomplete = isRegister ? 'new-password' : 'current-password';
    document.getElementById('auth-msg').textContent = '';
    // Không xóa value để browser autofill hoạt động
    document.getElementById('auth-email').focus();
}

document.getElementById('auth-modal').addEventListener('click', function(e) {
    if (e.target === this) this.style.display = 'none';
});
document.getElementById('auth-toggle-mode').addEventListener('click', function(e) {
    e.preventDefault();
    openAuthModal(!authIsRegister);
});

async function handleAuthSubmit(e) {
    e.preventDefault();
    var email = document.getElementById('auth-email').value.trim();
    var pass = document.getElementById('auth-pass').value;
    var msg = document.getElementById('auth-msg');
    var btn = document.getElementById('btn-submit-auth');
    if (!email || !pass) { msg.textContent = 'Vui lòng nhập đủ thông tin.'; return; }
    msg.textContent = '';
    btn.disabled = true; btn.textContent = '...';
    var sb = getSupabase();
    try {
        var result;
        if (authIsRegister) {
            result = await sb.auth.signUp({ email: email, password: pass });
        } else {
            result = await sb.auth.signInWithPassword({ email: email, password: pass });
        }
        if (result.error) {
            msg.textContent = result.error.message;
        } else {
            document.getElementById('auth-modal').style.display = 'none';
            if (authIsRegister && result.data && !result.data.session) {
                alert('Kiểm tra email để xác nhận tài khoản!');
            }
        }
    } catch(err) { msg.textContent = 'Có lỗi. Thử lại sau.'; }
    finally { btn.disabled = false; btn.textContent = authIsRegister ? 'Đăng ký' : 'Đăng nhập'; }
}

document.getElementById('auth-form').addEventListener('submit', handleAuthSubmit);

// Quên mật khẩu
var btnForgot = document.getElementById('auth-forgot');
if (btnForgot) {
    btnForgot.addEventListener('click', async function(e) {
        e.preventDefault();
        var email = document.getElementById('auth-email').value.trim();
        var msg = document.getElementById('auth-msg');
        if (!email) {
            msg.style.color = '#ef4444';
            msg.textContent = 'Vui lòng nhập email để đặt lại mật khẩu.';
            return;
        }
        var sb = getSupabase();
        msg.style.color = 'var(--text-muted)';
        msg.textContent = 'Đang gửi email...';
        try {
            var { data, error } = await sb.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password.html',
            });
            if (error) {
                msg.style.color = '#ef4444';
                msg.textContent = error.message;
            } else {
                msg.style.color = '#22c55e';
                msg.textContent = 'Đã gửi link! Vui lòng kiểm tra email của bạn.';
                setTimeout(() => { msg.textContent = ''; }, 5000);
            }
        } catch(err) {
            msg.style.color = '#ef4444';
            msg.textContent = 'Có lỗi xảy ra.';
        }
    });
}

// Đăng nhập bằng Google
var btnGoogle = document.getElementById('btn-google-login');
if (btnGoogle) {
    btnGoogle.addEventListener('click', async function(e) {
        e.preventDefault();
        var sb = getSupabase();
        try {
            var { data, error } = await sb.auth.signInWithOAuth({ provider: 'google' });
            if (error) {
                var msg = document.getElementById('auth-msg');
                msg.style.color = '#ef4444';
                msg.textContent = error.message;
            }
        } catch(err) {
            var msg = document.getElementById('auth-msg');
            msg.style.color = '#ef4444';
            msg.textContent = 'Có lỗi xảy ra.';
        }
    });
}

// Listen trạng thái đăng nhập thay đổi
getSupabase().auth.onAuthStateChange(function(event, session) {
    currentUser = session ? session.user : null;
    updateAuthBtn(currentUser);
    if (currentUser) loadCompletedProblems(currentUser.id);
    else completedProblems.clear();
});

// Lấy session hiện tại khi load trang
getSupabase().auth.getSession().then(function(res) {
    if (res.data && res.data.session) {
        currentUser = res.data.session.user;
        updateAuthBtn(currentUser);
        loadCompletedProblems(currentUser.id);
    } else {
        updateAuthBtn(null);
    }
});
