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
        html += '<div class="cf-problem-title-bar">';
        html += '<a class="cf-prob-title" href="#/problem/' + p.id + '">' + (p.title || p.id) + '</a>';
        if (p.source) html += '<span class="cf-prob-source">' + p.source + '</span>';
        html += '</div>';
        // Statement
        html += '<div class="cf-statement">';
        html += renderLatex(p.summary || '');
        html += '</div>';
        // Footer link
        html += '<div class="cf-prob-footer">';
        html += '<a href="#/problem/' + p.id + '" class="cf-view-analysis">Xem phân tích →</a>';
        html += '</div>';
        html += '</div>';
    });
    html += '</div>';
    appRoot.innerHTML = html;
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
    if (!list.length) return '<tr><td colspan="5" style="padding:20px;color:#888;">Không tìm thấy bài nào.</td></tr>';
    return list.map(function (p) {
        var tagsHtml = (p.tags || []).map(function (t) { return '<span class="cf-tag">' + t + '</span>'; }).join(' ');
        return '<tr>' +
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
    html += '<th style="width:90px">#</th><th>Tên bài</th><th>Tags</th><th style="width:80px">Độ khó</th><th style="width:130px">Nguồn</th>';
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

async function renderBlogList() {
    var appRoot = document.getElementById('app-root');
    appRoot.innerHTML = '<div class="cf-content"><div class="cf-loading">Đang tải...</div></div>';
    var posts = await fetchBlogs();

    if (!posts || posts.length === 0) {
        appRoot.innerHTML = '<div class="cf-content"><p style="color:#888;padding:40px 0;">Chưa có bài nào.</p></div>';
        return;
    }

    var html = '<div class="cf-content">';
    posts.forEach(function (p) {
        var cats = (p.category || []).map(function (c) { return '<span class="cf-tag">' + c + '</span>'; }).join(' ');
        html += '<div class="blog-card">';
        html += '<div class="blog-card-meta">';
        html += '<span class="blog-date">' + formatDate(p.created_at) + '</span>';
        if (cats) html += '<span class="blog-cats">' + cats + '</span>';
        html += '</div>';
        html += '<h2 class="blog-title"><a href="#/blog/' + p.id + '">' + (p.title || '') + '</a></h2>';
        if (p.excerpt) html += '<p class="blog-excerpt">' + p.excerpt + '</p>';
        html += '<a href="#/blog/' + p.id + '" class="blog-read-more">Đọc tiếp →</a>';
        html += '</div>';
    });
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

    var cats = (p.category || []).map(function (c) { return '<span class="cf-tag">' + c + '</span>'; }).join(' ');
    var html = '<div class="cf-content">';
    html += '<div class="blog-detail-header">';
    html += '<a href="#/blog" class="cf-back-link">← Blog</a>';
    html += '<div class="blog-card-meta" style="margin-top:12px;">';
    html += '<span class="blog-date">' + formatDate(p.created_at) + '</span>';
    if (cats) html += '<span class="blog-cats">' + cats + '</span>';
    html += '</div>';
    html += '<h1 class="blog-detail-title">' + (p.title || '') + '</h1>';
    html += '</div>';
    html += '<div class="blog-body">' + (p.content || '') + '</div>';
    html += '</div>';
    appRoot.innerHTML = html;
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
    } else if (path.startsWith('/blog/')) {
        var bid = path.slice('/blog/'.length);
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
