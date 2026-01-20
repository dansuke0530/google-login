// common.js

// 1. ヘッダーHTML
const headerHTML = `
    <header>
        <div class="header-inner">
            <a href="index.html" class="logo">EventSite</a>
            <nav class="nav-links">
                <a id="auth-link" href="login.html" class="btn-login">LOGIN</a>
            </nav>
        </div>
    </header>
`;

// 2. 共通CSS (D4C風デザイン)
const commonCSS = `
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Manrope:wght@400;600&display=swap');
        
        body { 
            font-family: 'Manrope', 'Noto Sans JP', sans-serif; 
            margin: 0; background-color: #ffffff; color: #1a1a1a; 
            font-size: 14px; line-height: 1.8; letter-spacing: 0.05em;
        }
        a { text-decoration: none; color: inherit; transition: 0.3s; }
        
        header { 
            position: sticky; top: 0; z-index: 1000;
            background: rgba(255, 255, 255, 0.95); border-bottom: 1px solid #f0f0f0;
            backdrop-filter: blur(10px);
        }
        .header-inner {
            max-width: 1200px; margin: 0 auto; padding: 20px 30px;
            display: flex; justify-content: space-between; align-items: center;
        }
        .logo { font-size: 20px; font-weight: 700; letter-spacing: 0.05em; color: #000; }
        
        /* ボタン共通スタイル */
        .btn-login { 
            border: 1px solid #ddd; padding: 8px 25px; border-radius: 50px; 
            font-size: 12px; font-weight: 600; color: #333; cursor: pointer;
        }
        .btn-login:hover { border-color: #000; background: #000; color: #fff; }
        
        /* 状態別スタイル */
        .btn-login.mypage { background: #000; color: #fff; border-color: #000; }
        .btn-login.logout { background: #eee; color: #333; border-color: #eee; }
        .btn-login.back   { background: transparent; border-color: #ccc; color: #666; } /* 戻るボタン */
    </style>
`;

document.write(commonCSS);
document.write(headerHTML);

// 3. ボタン自動切り替えロジック
async function updateHeaderButton() {
    if (typeof supabaseClient === 'undefined') return;

    const btn = document.getElementById('auth-link');
    if (!btn) return;

    const currentPath = window.location.pathname;

    // ★パターンA：マイページにいる時 → LOGOUT
    if (currentPath.includes('mypage.html')) {
        btn.innerText = "LOGOUT";
        btn.href = "#";
        btn.classList.add('logout');
        btn.onclick = async (e) => {
            e.preventDefault();
            const { error } = await supabaseClient.auth.signOut();
            if (!error) window.location.href = "index.html";
        };
        return;
    }

    // ★パターンB：登録画面 (admin.html) にいる時 → BACK (マイページへ戻る)
    if (currentPath.includes('admin.html')) {
        btn.innerText = "BACK";     // ボタン名をBACKに
        btn.href = "mypage.html";   // リンク先はマイページ
        btn.classList.add('back');  // デザイン変更用
        return;
    }

    // ★パターンC：その他のページ（トップ、詳細）
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        btn.innerText = "MY PAGE";
        btn.href = "mypage.html";
        btn.classList.add('mypage');
    } else {
        btn.innerText = "LOGIN";
        btn.href = "login.html";
        btn.classList.remove('mypage');
    }
}

window.addEventListener('load', updateHeaderButton);
