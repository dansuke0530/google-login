// common.js
// ★メンテナンス性重視：デザイン変数管理 & 共通ヘッダー

// ==========================================
// 1. デザイン設定（ここを変えれば全ページ変わる！）
// ==========================================
const SITE_CONFIG = {
    colors: {
        main: '#000000',       // メインカラー（ボタン、ヘッダーなど）
        text: '#1a1a1a',       // 文字色
        bg: '#ffffff',         // 背景色
        gray: '#f4f4f4',       // 薄いグレー（背景など）
        accent: '#FF3366'      // アクセント（強調したい時用、現在は未使用）
    },
    fonts: "'Manrope', 'Noto Sans JP', sans-serif"
};

// ==========================================
// 2. 共通CSS (CSS変数を定義)
// ==========================================
const commonCSS = `
<style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Manrope:wght@400;600;800&display=swap');
    
    :root {
        --main-color: ${SITE_CONFIG.colors.main};
        --text-color: ${SITE_CONFIG.colors.text};
        --bg-color: ${SITE_CONFIG.colors.bg};
        --gray-color: ${SITE_CONFIG.colors.gray};
        --font-base: ${SITE_CONFIG.fonts};
    }

    body { 
        font-family: var(--font-base);
        margin: 0; 
        background-color: var(--bg-color); 
        color: var(--text-color); 
        font-size: 14px; 
        line-height: 1.8; 
        letter-spacing: 0.05em;
    }

    a { text-decoration: none; color: inherit; transition: 0.3s; }
    
    header { 
        position: sticky; top: 0; z-index: 1000;
        background: rgba(255, 255, 255, 0.9); 
        border-bottom: 1px solid #eee;
        backdrop-filter: blur(10px);
    }

    .header-inner {
        max-width: 1200px; margin: 0 auto; padding: 15px 30px;
        display: flex; justify-content: space-between; align-items: center;
    }

    .logo { 
        font-size: 22px; font-weight: 800; letter-spacing: 0.02em; color: var(--main-color); 
    }
    
    /* ボタン共通スタイル */
    .btn-login { 
        border: 1px solid #ddd; padding: 8px 24px; border-radius: 50px; 
        font-size: 12px; font-weight: 700; color: var(--text-color); cursor: pointer;
        display: inline-flex; align-items: center; gap: 8px; height: 40px; box-sizing: border-box;
    }
    .btn-login:hover { border-color: var(--main-color); transform: translateY(-1px); }
    
    /* 状態別スタイル */
    .btn-login.mypage { background: var(--main-color); color: var(--bg-color); border-color: var(--main-color); padding-left: 6px; }
    .btn-login.logout { background: var(--gray-color); color: var(--text-color); border-color: transparent; }
    .btn-login.back   { background: transparent; border-color: #ccc; color: #666; }
    
    .user-avatar {
        width: 26px; height: 26px; border-radius: 50%; object-fit: cover;
        border: 2px solid rgba(255,255,255,0.2);
    }
</style>
`;

// ==========================================
// 3. ヘッダーHTML
// ==========================================
const headerHTML = `
    <header>
        <div class="header-inner">
            <a href="index.html" class="logo">EventSite</a>
            <nav class="nav-links">
                <a id="auth-link" href="login.html" class="btn-login" style="opacity:0">LOGIN</a>
            </nav>
        </div>
    </header>
`;

// HTML注入（安全なメソッドを使用）
document.head.insertAdjacentHTML('beforeend', commonCSS);
document.body.insertAdjacentHTML('afterbegin', headerHTML);

// ==========================================
// 4. ロジック（ボタン切り替え）
// ==========================================
async function updateHeaderButton() {
    const btn = document.getElementById('auth-link');
    if (!btn) return;

    if (typeof supabaseClient === 'undefined') {
        setTimeout(updateHeaderButton, 100);
        return;
    }

    const currentPath = window.location.pathname;
    const { data: { session } } = await supabaseClient.auth.getSession();

    btn.style.opacity = "1";

    if (!session) {
        btn.innerText = "LOGIN";
        btn.href = "login.html";
        return;
    }

    // ユーザー情報
    const avatarUrl = session.user.user_metadata.avatar_url;
    const iconHtml = avatarUrl ? `<img src="${avatarUrl}" class="user-avatar" alt="icon">` : '';

    // マイページ系
    if (currentPath.includes('mypage.html') || currentPath.includes('super_admin.html')) {
        btn.innerHTML = "LOGOUT";
        btn.href = "#";
        btn.classList.add('logout');
        btn.onclick = async (e) => {
            e.preventDefault();
            if(confirm('ログアウトしますか？')){
                await supabaseClient.auth.signOut();
                window.location.href = "index.html";
            }
        };
        return;
    }

    // 編集・管理画面系
    if (currentPath.includes('admin.html') || currentPath.includes('edit.html')) {
        btn.innerHTML = "← BACK";
        btn.href = "mypage.html";
        btn.classList.add('back');
        return;
    }

    // その他（トップページなど）
    btn.innerHTML = `${iconHtml} MY PAGE`;
    btn.href = "mypage.html";
    btn.classList.add('mypage');
}

window.addEventListener('load', updateHeaderButton);