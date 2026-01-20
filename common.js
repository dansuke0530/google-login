// common.js
// ヘッダーのHTMLをここに書いておく
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

// CSSもここで配っちゃう（全ページのデザイン統一用）
const commonCSS = `
    <style>
        /* --- 共通フォント & 基本設定 --- */
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Manrope:wght@400;600&display=swap');
        
        body { 
            font-family: 'Manrope', 'Noto Sans JP', sans-serif; 
            margin: 0; background-color: #ffffff; color: #1a1a1a; 
            font-size: 14px; line-height: 1.8; letter-spacing: 0.05em;
        }
        a { text-decoration: none; color: inherit; transition: 0.3s; }
        
        /* --- 共通ヘッダー --- */
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
        .btn-login { 
            border: 1px solid #ddd; padding: 8px 25px; border-radius: 50px; 
            font-size: 12px; font-weight: 600; color: #333;
        }
        .btn-login:hover { border-color: #000; background: #000; color: #fff; }
        .btn-login.mypage { background: #000; color: #fff; border-color: #000; }
    </style>
`;

// ページに書き出す処理
document.write(commonCSS);
document.write(headerHTML);

// ログイン状態判定もここでやれば一括管理できる！
async function updateAuthButton() {
    // Supabaseクライアントが必要なので、各ページで定義されている前提
    if (typeof supabaseClient === 'undefined') return;

    const { data: { session } } = await supabaseClient.auth.getSession();
    const btn = document.getElementById('auth-link');
    if (btn) {
        if (session) { 
            btn.innerText = "MY PAGE"; 
            btn.href = "mypage.html"; 
            btn.classList.add('mypage'); 
        } else { 
            btn.innerText = "LOGIN"; 
            btn.href = "login.html"; 
        }
    }
}

// ページ読み込み完了後にボタン判定を実行
window.addEventListener('load', updateAuthButton);
