// THUNOPRO Dynamic SPA Router

async function fetchProblems() {
    try {
        const res = await fetch(SUPABASE_URL + '/rest/v1/cs_problems?select=*&order=created_at.desc', {
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
        const res = await fetch(SUPABASE_URL + '/rest/v1/cs_problems?id=eq.' + encodeURIComponent(id) + '&select=*', {
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
    if (!list.length) return '<tr><td colspan="4" style="padding:20px;color:#888;">Không tìm thấy bài nào.</td></tr>';
    return list.map(function (p) {
        var isDone = completedProblems.has(p.id);
        var doneCell = isDone
            ? '<td style="text-align:center;"><span style="color:#22c55e;font-size:16px;font-weight:700;">✓</span></td>'
            : '<td style="text-align:center;"><span style="color:var(--border);font-size:14px;">○</span></td>';
        return '<tr>' +
            doneCell +
            '<td class="cf-td-id">' + (p.id || '') + '</td>' +
            '<td><a href="#/problem/' + p.id + '" class="cf-table-link">' + (p.title || '') + '</a></td>' +
            '<td class="cf-td-src">' + (p.source || '–') + '</td>' +
            '</tr>';
    }).join('');
}

async function renderAllProblems() {
    const appRoot = document.getElementById('app-root');
    appRoot.innerHTML = '<div class="cf-problems-layout"><div class="cf-loading">Đang tải...</div></div>';
    _allProblemsCache = await fetchProblems();

    var html = '<div class="cf-problems-layout">';

    // LEFT: table
    html += '<div class="cf-problems-main">';
    html += '<div class="cf-inline-search">';
    html += '<input type="text" id="prob-search" placeholder="Tìm bài..." autocomplete="off">';
    html += '</div>';
    html += '<table class="cf-table"><thead><tr>';
    html += '<th style="width:36px;text-align:center;">✓</th><th style="width:90px">#</th><th>Tên bài</th><th style="width:130px">Nguồn</th>';
    html += '</tr></thead><tbody id="prob-tbody">';
    html += buildProblemsTable(_allProblemsCache);
    html += '</tbody></table>';
    html += '</div>'; // end main

    html += '</div>'; // end layout
    appRoot.innerHTML = html;

    function applyFilter() {
        var q = (document.getElementById('prob-search').value || '').toLowerCase();
        var filtered = _allProblemsCache.filter(function (p) {
            var matchQ = !q ||
                (p.title || '').toLowerCase().includes(q) ||
                (p.id || '').toLowerCase().includes(q) ||
                (p.source || '').toLowerCase().includes(q);
            return matchQ;
        });
        document.getElementById('prob-tbody').innerHTML = buildProblemsTable(filtered);
    }
    document.getElementById('prob-search').addEventListener('input', applyFilter);
}



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
    var tickedBlogs = JSON.parse(localStorage.getItem('ticked_blogs') || '[]');
    return list.map(function(p) {
        var isTicked = tickedBlogs.includes(p.id);
        var cardClass = isTicked ? 'blog-card ticked' : 'blog-card';
        return '<div class="' + cardClass + '" data-bid="' + p.id + '" style="cursor: pointer;" title="Bấm để đánh dấu">' +
            '<h2 class="blog-title" style="margin-bottom:0;"><a href="#/blog/' + p.id + '">' + (p.title || '') + '</a></h2>' +
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


    var mainPosts = posts;

    // Sidebar HTML
    var sidebarHtml = '<div class="blog-sidebar">';
    
    sidebarHtml += '<div class="blog-sidebar-section">';
    sidebarHtml += '<a href="#/blog/new" class="btn-primary" style="width:100%; text-align:center; display:block; padding:8px; font-size:14px;"><i class="fas fa-plus"></i> Viết bài mới</a>';
    sidebarHtml += '</div>';


    sidebarHtml += '</div>';

    var html = '<div class="blog-layout">';
    html += '<div class="blog-main">';
    html += '<div class="blog-list">' + buildBlogCards(mainPosts) + '</div>';
    html += '</div>';
    html += sidebarHtml;
    html += '</div>';
    appRoot.innerHTML = html;

    document.querySelectorAll('.blog-card').forEach(function(card) {
        card.addEventListener('click', function(e) {
            // Không đổi màu nếu bấm vào link (để chuyển trang)
            if (e.target.tagName.toLowerCase() === 'a') return;

            var bid = this.dataset.bid;
            var isChecked = !this.classList.contains('ticked');
            
            var tickedBlogs = JSON.parse(localStorage.getItem('ticked_blogs') || '[]');
            
            if (isChecked) {
                this.classList.add('ticked');
                if (!tickedBlogs.includes(bid)) tickedBlogs.push(bid);
            } else {
                this.classList.remove('ticked');
                tickedBlogs = tickedBlogs.filter(function(id) { return id !== bid; });
            }
            localStorage.setItem('ticked_blogs', JSON.stringify(tickedBlogs));
        });
    });

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
    html += '<a href="#/blog/edit/' + p.id + '" style="font-size:13px; color:#3b82f6; text-decoration:none; margin-bottom:16px; display:inline-block;"><i class="fas fa-edit"></i> Sửa bài viết</a>';
    html += '<h1 class="blog-article-title">' + (p.title || '') + '</h1>';
    html += '<div class="blog-article-divider"></div>';
    html += '<div class="blog-body">' + (p.content || '') + '</div>';
    html += '</div>';
    html += '</div>';
    appRoot.innerHTML = html;

    // Interactive Checkboxes Auto-Save
    var blogBody = document.querySelector('.blog-body');
    if (blogBody) {
        var checkboxes = blogBody.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(function(cb) {
            cb.addEventListener('change', async function() {
                // Update attribute for serialization
                if (this.checked) {
                    this.setAttribute('checked', 'checked');
                } else {
                    this.removeAttribute('checked');
                }
                
                var newContent = blogBody.innerHTML;
                try {
                    await fetch(SUPABASE_URL + '/rest/v1/blogs?id=eq.' + p.id, {
                        method: 'PATCH',
                        headers: { 
                            'apikey': SUPABASE_KEY, 
                            'Authorization': 'Bearer ' + SUPABASE_KEY,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=minimal'
                        },
                        body: JSON.stringify({ content: newContent })
                    });
                } catch(e) {
                    console.error("Auto-save failed", e);
                }
            });
        });
    }
}

// Custom Quill Checkbox Blot
var Embed = Quill.import('blots/embed');
class CheckboxBlot extends Embed {
    static create(value) {
        let node = super.create();
        node.setAttribute('type', 'checkbox');
        node.style.width = '18px';
        node.style.height = '18px';
        node.style.marginRight = '8px';
        node.style.verticalAlign = 'middle';
        node.style.cursor = 'pointer';
        
        // Sync attribute for innerHTML serialization
        node.addEventListener('change', function() {
            if (this.checked) {
                this.setAttribute('checked', 'checked');
            } else {
                this.removeAttribute('checked');
            }
        });
        return node;
    }
}
CheckboxBlot.blotName = 'checkbox';
CheckboxBlot.tagName = 'input';
Quill.register(CheckboxBlot);

if (typeof window.quillMagicUrl !== 'undefined') {
    Quill.register('modules/magicUrl', window.quillMagicUrl.default || window.quillMagicUrl);
}

async function renderNewBlogForm() {
    var appRoot = document.getElementById('app-root');
    var html = '<div class="blog-article-wrap"><div class="blog-article">';
    html += '<a href="#/blog" class="blog-back">← Quay lại Blog</a>';
    html += '<h1 class="blog-article-title">Viết bài mới</h1>';
    
    html += '<form id="new-blog-form" style="display:flex; flex-direction:column; gap:16px;">';
    
    html += '<div>';
    html += '<label style="font-weight:600; margin-bottom:8px; display:block;">Tiêu đề</label>';
    html += '<input type="text" id="nb-title" required class="modal-input" placeholder="không có việc gì khó">';
    html += '</div>';



    html += '<div>';
    html += '<label style="font-weight:600; margin-bottom:8px; display:block;">Nội dung</label>';
    html += '<div id="nb-editor-container" style="background: var(--bg); font-family: inherit;"></div>';
    html += '</div>';

    html += '<div style="display:flex; align-items:center; gap: 16px; margin-top: 10px;">';
    html += '<button type="submit" id="nb-submit" class="btn-primary" style="padding: 10px 24px;">Đăng bài</button>';
    html += '</div>';
    html += '<p id="nb-msg" style="color:red; font-size:13px;"></p>';

    html += '</form>';
    html += '</div></div>';
    
    appRoot.innerHTML = html;

    // Khởi tạo Quill Editor
    var quill = new Quill('#nb-editor-container', {
        theme: 'snow',
        placeholder: 'chỉ sợ lòng không bền',
        modules: {
            magicUrl: true,
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link', 'image', 'video'],
                ['clean']
            ]
        }
    });

    quill.on('text-change', function(delta, oldDelta, source) {
        if (source === 'user') {
            var range = quill.getSelection();
            if (range && range.index >= 6) {
                var textBefore = quill.getText(range.index - 6, 6);
                if (textBefore === '!check') {
                    var cursorIdx = range.index;
                    setTimeout(function() {
                        quill.deleteText(cursorIdx - 6, 6, 'api');
                        quill.insertEmbed(cursorIdx - 6, 'checkbox', true, 'api');
                        quill.insertText(cursorIdx - 5, ' ', 'api');
                        quill.setSelection(cursorIdx - 4, 'api');
                    }, 10);
                }
            }
        }
    });

    document.getElementById('new-blog-form').addEventListener('submit', async function(e) {
        e.preventDefault();

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

async function renderEditBlogForm(id) {
    var appRoot = document.getElementById('app-root');
    appRoot.innerHTML = '<div class="cf-content"><div class="cf-loading">Đang tải...</div></div>';
    var p = await fetchBlogById(id);

    if (!p) {
        appRoot.innerHTML = '<div class="cf-content"><p>Không tìm thấy bài.</p><a href="#/blog">← Quay lại</a></div>';
        return;
    }

    var html = '<div class="blog-article-wrap"><div class="blog-article">';
    html += '<a href="#/blog/' + p.id + '" class="blog-back">← Hủy</a>';
    html += '<h1 class="blog-article-title">Sửa bài viết</h1>';
    
    html += '<form id="edit-blog-form" style="display:flex; flex-direction:column; gap:16px;">';
    
    html += '<div>';
    html += '<label style="font-weight:600; margin-bottom:8px; display:block;">Tiêu đề</label>';
    var safeTitle = (p.title || '').replace(/"/g, '&quot;');
    html += '<input type="text" id="eb-title" required class="modal-input" value="' + safeTitle + '">';
    html += '</div>';

    html += '<div>';
    html += '<label style="font-weight:600; margin-bottom:8px; display:block;">Nội dung</label>';
    html += '<div id="eb-editor-container" style="background: var(--bg); font-family: inherit;">' + (p.content || '') + '</div>';
    html += '</div>';

    html += '<div style="display:flex; align-items:center; gap: 16px; margin-top: 10px;">';
    html += '<button type="submit" id="eb-submit" class="btn-primary" style="padding: 10px 24px;">Lưu thay đổi</button>';
    html += '</div>';
    html += '<p id="eb-msg" style="color:red; font-size:13px;"></p>';

    html += '</form>';
    html += '</div></div>';
    
    appRoot.innerHTML = html;

    var quill = new Quill('#eb-editor-container', {
        theme: 'snow',
        placeholder: 'chỉ sợ lòng không bền',
        modules: {
            magicUrl: true,
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link', 'image', 'video'],
                ['clean']
            ]
        }
    });

    quill.on('text-change', function(delta, oldDelta, source) {
        if (source === 'user') {
            var range = quill.getSelection();
            if (range && range.index >= 6) {
                var textBefore = quill.getText(range.index - 6, 6);
                if (textBefore === '!check') {
                    var cursorIdx = range.index;
                    setTimeout(function() {
                        quill.deleteText(cursorIdx - 6, 6, 'api');
                        quill.insertEmbed(cursorIdx - 6, 'checkbox', true, 'api');
                        quill.insertText(cursorIdx - 5, ' ', 'api');
                        quill.setSelection(cursorIdx - 4, 'api');
                    }, 10);
                }
            }
        }
    });

    document.getElementById('edit-blog-form').addEventListener('submit', async function(e) {
        e.preventDefault();

        var title = document.getElementById('eb-title').value.trim();
        var content = quill.root.innerHTML.trim();
        if (content === '<p><br></p>') content = '';
        var msg = document.getElementById('eb-msg');
        var btn = document.getElementById('eb-submit');

        if (!title) { msg.textContent = "Vui lòng nhập tiêu đề."; return; }
        if (!content) { msg.textContent = "Vui lòng nhập nội dung."; return; }

        btn.disabled = true;
        btn.textContent = 'Đang lưu...';

        var updateData = {
            title: title,
            content: content
        };

        try {
            var res = await fetch(SUPABASE_URL + '/rest/v1/blogs?id=eq.' + p.id, {
                method: 'PATCH',
                headers: { 
                    'apikey': SUPABASE_KEY, 
                    'Authorization': 'Bearer ' + SUPABASE_KEY,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(updateData)
            });

            if (!res.ok) {
                var err = await res.json();
                msg.textContent = 'Lỗi: ' + (err.message || res.status);
                btn.disabled = false;
                btn.textContent = 'Lưu thay đổi';
            } else {
                window.location.hash = '#/blog/' + p.id;
                setTimeout(function() { window.location.reload(); }, 100);
            }
        } catch (err) {
            msg.textContent = 'Lỗi mạng: ' + err.message;
            btn.disabled = false;
            btn.textContent = 'Lưu thay đổi';
        }
    });
}

// ===== MATH =====
async function fetchMathProblems(subcategory) {
    try {
        let url = SUPABASE_URL + '/rest/v1/math_problems?select=*&order=created_at.desc';
        if (subcategory) {
            url += '&subcategory=eq.' + encodeURIComponent(subcategory);
        }
        const res = await fetch(url, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return await res.json();
    } catch (e) {
        console.error('fetchMathProblems error:', e);
        return [];
    }
}

async function fetchMathProblemById(id) {
    try {
        const res = await fetch(SUPABASE_URL + '/rest/v1/math_problems?id=eq.' + encodeURIComponent(id) + '&select=*', {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
        });
        const data = await res.json();
        return data[0] || null;
    } catch (e) { return null; }
}

async function renderMathCategories() {
    const appRoot = document.getElementById('app-root');
    let html = '<div class="cf-content" style="max-width: 1000px; margin: 0 auto; padding-top: 40px;">';
    html += '<h2 style="margin-bottom: 24px; font-size: 28px; font-weight: 800;">Chuyên đề Toán học</h2>';
    html += '<div class="cf-cat-grid" style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; background: transparent; border: none;">';
    
    html += '<a href="#/math/list/vao_10" class="cf-cat-card" style="border: 1px solid var(--border); border-radius: var(--radius); padding: 24px;">';
    html += '<div class="cf-cat-lbl" style="width: 48px; height: 48px; font-size: 20px;"><i class="fas fa-graduation-cap"></i></div>';
    html += '<div><strong style="font-size: 18px;">Bài tập vào 10</strong><small>Tuyển tập đề thi môn Toán vào lớp 10</small></div>';
    html += '</a>';

    html += '</div></div>';
    appRoot.innerHTML = html;
}

function buildMathProblemsTable(list) {
    if (!list || !list.length) {
        return '<p style="color: var(--text-muted);">Chưa có bài tập nào thỏa mãn.</p>';
    }
    var html = '<table class="cf-table"><thead><tr>';
    html += '<th style="width:36px;text-align:center;">✓</th><th style="width:120px">Mã bài</th><th>Tên bài</th><th style="width:150px">Nguồn</th>';
    html += '</tr></thead><tbody>';
    html += list.map(function(p) {
        var isDone = completedProblems.has(p.id);
        var checkIcon = isDone 
            ? '<i class="fas fa-check-circle" style="color:#22c55e; font-size:16px;" title="Đã nộp bài"></i>' 
            : '<i class="far fa-circle" style="color:var(--border); font-size:16px;" title="Chưa nộp bài"></i>';

        return '<tr>' +
            '<td style="text-align:center;">' + checkIcon + '</td>' +
            '<td class="cf-td-id">' + (p.id || '') + '</td>' +
            '<td><a href="#/math/problem/' + p.id + '" class="cf-table-link' + (isDone ? ' math-done-link' : '') + '">' + (p.title || '') + '</a></td>' +
            '<td class="cf-td-src">' + (p.source || '–') + '</td>' +
            '</tr>';
    }).join('');
    html += '</tbody></table>';
    return html;
}

async function renderMathProblemList(subcategory) {
    const appRoot = document.getElementById('app-root');
    appRoot.innerHTML = '<div class="cf-problems-layout"><div class="cf-loading">Đang tải...</div></div>';
    
    const problems = await fetchMathProblems(subcategory);
    
    let title = "Danh sách bài tập";
    if (subcategory === 'vao_10') title = "Tuyển tập Bài tập vào 10";

    var html = '<div class="cf-problems-layout">';
    html += '<div style="margin-bottom: 20px;">';
    html += '<a href="#/math" class="cf-back-link">← Quay lại Chuyên đề</a>';
    
    html += '<div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; margin-top: 12px;">';
    html += '<h2 style="margin: 0; font-size: 24px; font-weight: 800;">' + title + '</h2>';
    
    if (subcategory === 'vao_10') {
        html += '<a href="https://drive.google.com/drive/u/1/folders/1DGzsGCoMViKSu7OK9usoS2u-tuwVwEwd" target="_blank" style="background: linear-gradient(135deg, #0ea5e9, #3b82f6); color: white; text-decoration: none; font-weight: 700; font-size: 14px; padding: 6px 16px; border-radius: 20px; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4); border: 2px solid rgba(255,255,255,0.2);"><i class="fas fa-folder-open" style="font-size: 15px;"></i> Xem lời giải chi tiết</a>';
    }
    html += '</div>';
    
    if (subcategory === 'vao_10') {
        html += '<div style="margin-top: 12px; display: flex; gap: 8px;" id="math-tags-filter">';
        html += '<button class="btn-outline math-filter-btn" style="border-color: var(--text);" data-tag="all">Tất cả</button>';
        html += '<button class="btn-outline math-filter-btn" data-tag="Hình học">Hình học</button>';
        html += '<button class="btn-outline math-filter-btn" data-tag="Bất đẳng thức">Bất đẳng thức</button>';
        html += '<button class="btn-outline math-filter-btn" data-tag="Other">Other</button>';
        html += '</div>';
    }
    html += '</div>';

    html += '<div class="cf-problems-main" id="math-prob-list-container">';
    html += buildMathProblemsTable(problems);
    html += '</div></div>';
    appRoot.innerHTML = html;

    if (subcategory === 'vao_10') {
        const filterBtns = document.querySelectorAll('.math-filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                filterBtns.forEach(b => b.style.borderColor = 'var(--border)');
                this.style.borderColor = 'var(--text)';
                const tag = this.dataset.tag;
                if (tag === 'all') {
                    document.getElementById('math-prob-list-container').innerHTML = buildMathProblemsTable(problems);
                } else {
                    const filtered = problems.filter(p => p.tags && p.tags.includes(tag));
                    document.getElementById('math-prob-list-container').innerHTML = buildMathProblemsTable(filtered);
                }
            });
        });
    }
}

function compressImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width, h = img.height;
                const maxW = 800; // Độ phân giải đủ để đọc chữ khi phóng to
                if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', 0.5)); // Chất lượng nén
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

async function renderMathProblemDetail(id) {
    const appRoot = document.getElementById('app-root');
    appRoot.innerHTML = '<div class="cf-content"><div class="cf-loading">Đang tải bài ' + id + '...</div></div>';

    var p = await fetchMathProblemById(id);
    if (!p) {
        appRoot.innerHTML = '<div class="cf-content"><div class="cf-problem-block"><p>Không tìm thấy bài <strong>' + id + '</strong>.</p><a href="#/math" class="cf-back-link">← Quay lại</a></div></div>';
        return;
    }

    var isSolved = completedProblems.has(id);
    var statusHtml = isSolved 
        ? '<span id="math-status-badge" style="background:#22c55e; color:white; padding:4px 8px; border-radius:4px; font-size:12px; font-weight:bold; margin-left:12px; display:inline-block; vertical-align:middle;">SOLVED</span>' 
        : '<span id="math-status-badge" style="background:#ef4444; color:white; padding:4px 8px; border-radius:4px; font-size:12px; font-weight:bold; margin-left:12px; display:inline-block; vertical-align:middle;">NOT SOLVED</span>';

    var html = '<div class="cf-content">';
    html += '<div class="cf-problem-block">';
    // Title bar
    html += '<div class="cf-problem-title-bar">';
    html += '<a class="cf-back-link" href="#/math/list/' + (p.subcategory || 'vao_10') + '">←</a>';
    html += '<span class="cf-prob-title cf-prob-title-large" style="display:flex; align-items:center;">' + (p.title || p.id) + statusHtml + '</span>';
    
    if (p.source_url) {
        html += '<a class="cf-prob-source" style="margin-left:auto;" href="' + p.source_url + '" target="_blank">' + (p.source || 'Source') + ' ↗</a>';
    } else if (p.source) {
        html += '<span class="cf-prob-source" style="margin-left:auto;">' + p.source + '</span>';
    }
    html += '</div>';

    // Summary section
    html += '<div class="cf-section-label">Tóm tắt đề bài</div>';
    html += '<div class="cf-statement">';
    html += renderLatex(p.summary || '');
    html += '</div>';

    // Submit section
    html += '<div class="cf-section-label" style="background: var(--surface); color: var(--text);">Nộp bài làm</div>';
    html += '<div class="cf-statement" style="background: var(--bg); border-top: 1px solid var(--border); padding-bottom: 30px;">';
    
    html += '<div id="submit-area" style="text-align: left; max-width: 400px; padding: 16px; border: 2px dashed var(--border); border-radius: var(--radius);">';
    html += '  <input type="file" id="solution-files" multiple accept="image/*" style="display:none;">';
    html += '  <button id="btn-select-files" class="btn-outline" style="margin-bottom: 12px; padding: 6px 12px; font-size: 13px;"><i class="fas fa-image" style="margin-right:6px;"></i> Tải ảnh lên</button>';
    html += '  <div id="preview-area" style="display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-start; margin-bottom: 12px;"></div>';
    html += '  <button id="btn-submit-solution" class="btn-primary" style="display:none; padding: 6px 16px; font-size: 13px;"><i class="fas fa-paper-plane" style="margin-right:6px;"></i> Gửi bài</button>';
    html += '  <p id="submit-msg" style="margin-top: 8px; font-size: 13px; font-weight: 500;"></p>';
    html += '</div>';

    html += '</div>';

    html += '</div></div>';
    appRoot.innerHTML = html;

    // Logic for submitting
    var fileInput = document.getElementById('solution-files');
    var btnSelect = document.getElementById('btn-select-files');
    var btnSubmit = document.getElementById('btn-submit-solution');
    var previewArea = document.getElementById('preview-area');
    var submitMsg = document.getElementById('submit-msg');
    var currentImagesBase64 = [];
    
    // Khởi tạo Modal xem ảnh
    let imgModal = document.getElementById('img-viewer-modal');
    if (!imgModal) {
        let m = document.createElement('div');
        m.id = 'img-viewer-modal';
        m.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:9999; justify-content:center; align-items:center; padding: 10px; box-sizing: border-box;';
        m.innerHTML = '<img id="img-viewer-content" style="width:100%; height:100%; object-fit:contain; border-radius:4px; box-shadow:0 0 20px rgba(0,0,0,0.8);"><div style="position:absolute; top:15px; right:25px; color:white; font-size:40px; cursor:pointer; text-shadow: 0 0 10px black;" onclick="document.getElementById(\'img-viewer-modal\').style.display=\'none\'">&times;</div>';
        
        // Bấm ra ngoài ảnh để đóng
        m.addEventListener('click', function(e) {
            if(e.target === m) m.style.display = 'none';
        });
        
        document.body.appendChild(m);
        imgModal = m;
    }

    function renderPreviews() {
        previewArea.innerHTML = '';
        currentImagesBase64.forEach((src, index) => {
            let wrap = document.createElement('div');
            wrap.style.cssText = 'position:relative; display:inline-block;';

            let img = document.createElement('img');
            img.src = src;
            img.style.cssText = 'height:120px; width:120px; object-fit:cover; border-radius:8px; border:1px solid var(--border); box-shadow:var(--shadow-sm); cursor:pointer;';
            img.onclick = () => {
                document.getElementById('img-viewer-content').src = src;
                document.getElementById('img-viewer-modal').style.display = 'flex';
            };

            let delBtn = document.createElement('button');
            delBtn.innerHTML = '&times;';
            delBtn.title = "Xóa ảnh";
            delBtn.style.cssText = 'position:absolute; top:-6px; right:-6px; background:#ef4444; color:white; border:none; border-radius:50%; width:22px; height:22px; font-size:16px; font-weight:bold; line-height:1; cursor:pointer; display:flex; align-items:center; justify-content:center; padding-bottom:2px; box-shadow:0 2px 4px rgba(0,0,0,0.2);';
            delBtn.onclick = () => {
                currentImagesBase64.splice(index, 1);
                renderPreviews();
                btnSubmit.style.display = 'inline-flex';
                btnSubmit.innerHTML = '<i class="fas fa-save" style="margin-right:6px;"></i> Lưu thay đổi';
                submitMsg.textContent = 'Có thay đổi chưa lưu.';
                submitMsg.style.color = '#eab308'; // Vàng warning
            };

            wrap.appendChild(img);
            wrap.appendChild(delBtn);
            previewArea.appendChild(wrap);
        });

        if (currentImagesBase64.length === 0) {
            btnSelect.innerHTML = '<i class="fas fa-image" style="margin-right:6px;"></i> Tải ảnh bài làm lên';
        } else {
            btnSelect.innerHTML = '<i class="fas fa-plus" style="margin-right:6px;"></i> Thêm ảnh';
        }
    }

    // Tải ảnh cũ từ Supabase nếu đã nộp
    if (currentUser && isSolved) {
        try {
            const sb = getSupabase();
            const { data, error } = await sb.from('user_problems')
                .select('solution_images')
                .eq('user_id', currentUser.id)
                .eq('problem_id', id)
                .single();
            
            if (data && data.solution_images && data.solution_images.length > 0) {
                currentImagesBase64 = data.solution_images;
                renderPreviews();
            }
        } catch(e) {
            console.error('Lỗi khi tải ảnh cũ từ Supabase', e);
        }
    }

    btnSelect.addEventListener('click', function() {
        if (!currentUser) {
            openAuthModal(false);
            return;
        }
        fileInput.click();
    });

    fileInput.addEventListener('change', async function() {
        var files = fileInput.files;
        var MAX_IMAGES = 3; // Giới hạn số lượng ảnh
        
        if (files.length > 0) {
            // Kiểm tra tổng số ảnh sau khi thêm có vượt quá giới hạn không
            if (currentImagesBase64.length + files.length > MAX_IMAGES) {
                alert(`Bạn chỉ được nộp tối đa ${MAX_IMAGES} ảnh cho mỗi bài! Vui lòng xóa bớt ảnh cũ hoặc chọn ít file hơn.`);
                fileInput.value = ''; // Reset input
                return;
            }

            for(var i=0; i<files.length; i++) {
                var file = files[i];
                var compressedUrl = await compressImage(file);
                currentImagesBase64.push(compressedUrl);
            }
            renderPreviews();
            btnSubmit.style.display = 'inline-flex';
            btnSubmit.innerHTML = '<i class="fas fa-save" style="margin-right:6px;"></i> Lưu thay đổi';
            submitMsg.textContent = '';
        }
        fileInput.value = ''; // Reset để có thể chọn lại file cũ
    });

    btnSubmit.addEventListener('click', async function() {
        if (!currentUser) {
            openAuthModal(false);
            return;
        }
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:6px;"></i> Đang lưu...';
        
        try {
            var sb = getSupabase();
            
            if (currentImagesBase64.length === 0) {
                // Nếu xóa hết ảnh, coi như chưa làm
                await sb.from('user_problems').delete().eq('user_id', currentUser.id).eq('problem_id', id);
                completedProblems.delete(id);
                var badge = document.getElementById('math-status-badge');
                if (badge) {
                    badge.textContent = 'NOT SOLVED';
                    badge.style.background = '#ef4444';
                }
            } else {
                // Lưu trạng thái và ảnh lên Supabase
                await sb.from('user_problems').upsert({ 
                    user_id: currentUser.id, 
                    problem_id: id, 
                    completed: true,
                    solution_images: currentImagesBase64
                });
                completedProblems.add(id);
                var badge = document.getElementById('math-status-badge');
                if (badge) {
                    badge.textContent = 'SOLVED';
                    badge.style.background = '#22c55e';
                }
            }
            
            btnSubmit.style.display = 'none';
            submitMsg.textContent = '🎉 Đã lưu bài thành công!';
            submitMsg.style.color = '#22c55e';
            
        } catch(e) {
            console.error(e);
            submitMsg.textContent = '❌ Có lỗi xảy ra khi lưu bài.';
            submitMsg.style.color = '#ef4444';
        } finally {
            btnSubmit.disabled = false;
        }
    });
}

// ===== ROUTER =====
async function router() {
    var path = window.location.hash.slice(1) || '/';
    
    // Bỏ qua hash của Supabase Auth Callback để tránh bị lỗi 404
    if (path.includes('access_token=') || path.includes('type=recovery') || path.includes('error=')) {
        path = '/';
    }

    var appRoot = document.getElementById('app-root');
    appRoot.className = '';
    appRoot.style = '';

    if (path === '/') {
        await renderTodayPage();
    } else if (path === '/problems') {
        await renderAllProblems();

    } else if (path === '/blog') {
        await renderBlogList();
    } else if (path === '/blog/new') {
        await renderNewBlogForm();
    } else if (path.startsWith('/blog/edit/')) {
        var bid = path.slice('/blog/edit/'.length);
        await renderEditBlogForm(bid);
    } else if (path.startsWith('/blog/')) {
        var bid = path.slice('/blog/'.length);
        await renderBlogDetail(bid);
    } else if (path.startsWith('/problem/')) {
        var id = path.slice('/problem/'.length);
        await renderProblemDetail(id);
    } else if (path === '/math') {
        await renderMathCategories();
    } else if (path.startsWith('/math/list/')) {
        var subcategory = path.slice('/math/list/'.length);
        await renderMathProblemList(subcategory);
    } else if (path.startsWith('/math/problem/')) {
        var id = path.slice('/math/problem/'.length);
        await renderMathProblemDetail(id);
    } else {
        appRoot.innerHTML = '<div class="cf-page"><h1 style="font-size:60px;color:#ddd;text-align:center;padding:80px 0;">404</h1></div>';
    }

    document.querySelectorAll('.menu-list a').forEach(function (el) { el.classList.remove('active'); });
    if (path === '/') { var n = document.getElementById('nav-today'); if (n) n.classList.add('active'); }
    if (path === '/problems') { var n = document.getElementById('nav-problems'); if (n) n.classList.add('active'); }
    if (path.startsWith('/math')) { var n = document.getElementById('nav-math'); if (n) n.classList.add('active'); }

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
            result = await sb.auth.signUp({ 
                email: email, 
                password: pass,
                options: {
                    emailRedirectTo: window.location.origin + '/'
                }
            });
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
            var { data, error } = await sb.auth.signInWithOAuth({ 
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/'
                }
            });
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
