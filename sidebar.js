// sidebar.js
// ★全ページ共通のサイドバー（検索・タグ）

// ==========================================
// 1. サイドバーのCSS
// ==========================================
const sidebarCSS = `
<style>
    /* サイドバー全体のレイアウト */
    .common-sidebar {
        width: 100%;
        background: #fff;
        padding: 20px;
        border-radius: 12px;
        border: 1px solid #eee;
        box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        box-sizing: border-box; /* パディングを含める */
        margin-bottom: 30px;
    }

    /* 検索窓 */
    .sidebar-search {
        display: flex;
        gap: 8px;
        margin-bottom: 30px;
    }
    .sidebar-search input {
        flex: 1;
        padding: 10px 15px;
        border: 1px solid #ddd;
        border-radius: 50px;
        font-size: 14px;
        background: #f9f9f9;
        transition: 0.3s;
        outline: none;
    }
    .sidebar-search input:focus {
        border-color: #000;
        background: #fff;
    }
    .sidebar-search button {
        background: #000;
        color: #fff;
        border: none;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: 0.3s;
    }
    .sidebar-search button:hover { opacity: 0.8; transform: scale(1.05); }

    /* カテゴリタグ */
    .sidebar-title {
        font-size: 14px;
        font-weight: 700;
        margin-bottom: 15px;
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .sidebar-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }
    .tag-btn {
        background: #f4f4f4;
        color: #333;
        border: none;
        padding: 6px 14px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: 0.2s;
    }
    .tag-btn:hover {
        background: #000;
        color: #fff;
    }
</style>
`;

// ==========================================
// 2. サイドバーのHTML
// ==========================================
const sidebarHTML = `
    <div class="common-sidebar">
        <div class="sidebar-search">
            <input type="text" id="common-search-input" placeholder="イベントを検索..." onkeypress="handleSidebarSearchEnter(event)">
            <button onclick="executeSearch()">🔍</button>
        </div>

        <div class="sidebar-title">🏷️ CATEGORY</div>
        <div class="sidebar-tags">
            <button class="tag-btn" onclick="filterByTag('Music')">Music</button>
            <button class="tag-btn" onclick="filterByTag('Tech')">Tech</button>
            <button class="tag-btn" onclick="filterByTag('Art')">Art</button>
            <button class="tag-btn" onclick="filterByTag('Business')">Business</button>
            <button class="tag-btn" onclick="filterByTag('Party')">Party</button>
            <button class="tag-btn" onclick="filterByTag('')">All Events</button>
        </div>
    </div>
`;

// HTMLとCSSを注入
document.head.insertAdjacentHTML('beforeend', sidebarCSS);

// ページ読み込み後に、指定のIDの場所にサイドバーを埋め込む
window.addEventListener('load', () => {
    const target = document.getElementById('sidebar-placeholder');
    if (target) {
        target.innerHTML = sidebarHTML;
    }
});

// ==========================================
// 3. 検索・タグクリック時のロジック
// ==========================================

// 検索実行
function executeSearch() {
    const input = document.getElementById('common-search-input');
    const keyword = input.value.trim();
    if (!keyword) return;

    // もしトップページにいないなら、トップページへ移動して検索
    // (URLパラメータ ?q=キーワード をつけて移動)
    window.location.href = `index.html?q=${encodeURIComponent(keyword)}`;
}

// Enterキー対応
function handleSidebarSearchEnter(e) {
    if (e.key === 'Enter') executeSearch();
}

// タグクリック
function filterByTag(category) {
    // もしトップページにいないなら、トップページへ移動してフィルタ
    // (URLパラメータ ?cat=カテゴリ をつけて移動)
    window.location.href = `index.html?cat=${encodeURIComponent(category)}`;
}