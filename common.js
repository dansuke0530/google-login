// common.js
// ★デザイン干渉を防ぎ、マイページボタンを確実に表示する修正版

// ==========================================
// 1. ヘッダー専用のCSS（ページ全体には影響させない）
// ==========================================
const headerCSS = `
<style>
    /* ヘッダーのスタイルだけを定義 */
    #global-header { 
        position: sticky; 
        top: 0; 
        z-index: 9999;
        background: rgba(255, 255, 255, 0.85); 
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-bottom: 1px solid rgba(0,0,0,0.05);
        height: 70px;
        display: flex;
        align-items: center;
        width: 100%;
    }

    .header-inner {
        width: 100%;
        max-width: 1200px; 
        margin: 0 auto; 
        padding: 0 20px;
        display: flex; 
        justify-content: space-between; 
        align-items: center;
    }

    .site-logo { 
        font-family: 'Manrope', sans-serif;
        font-size: 20px; 
        font-weight: 800; 
        letter-spacing: 0.05em; 
        color: #000; 
        text-decoration: none;
    }

    /* ボタンのデザイン */
    .btn-header-auth { 
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border: 1px solid #e0e0e0; 
        padding: 8px 20px; 
        border-radius: 50px; 
        font-size: 12px; 
        font-weight: 700; 
        color: #333; 
        text-decoration: none;
        background: #fff;
        transition: all 0.2s ease;
        opacity: 0; /* 判定が終わるまで隠す */
    }
    .btn-header-auth:hover { 
        border-color: #000; 
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    
    /* マイページ用（黒背景） */
    .btn-header-auth.is-mypage { 
        background: #000; 
        color: #fff; 
        border-color: #000;
        padding-left: 15px; 
    }
    
    .user-avatar-small {
        width: 20px; height: 20px; border-radius: 50%; object-fit: cover; border: 1px solid #fff;
    }
</style>
`;

// ==========================================
// 2. ヘッダーHTMLの注入
// ==========================================
const headerHTML = `
    <header id="global-header">
        <div class="header-inner">
            <a href="index.html" class="site-logo">EventSite</a>
            <nav>
                <a id="auth-link" href="login.html" class="btn-header-auth">LOGIN</a>
            </nav>
        </div>
    </header>
`;

// CSSとHTMLを追加
document.head.insertAdjacentHTML('beforeend', headerCSS);
document.body.insertAdjacentHTML('afterbegin', headerHTML); // bodyの一番最初に追加

// ==========================================
// 3. ロジック（マイページ判定）
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // ボタン要素を取得
    const btn = document.getElementById('auth-link');
    if (!btn) return;

    // Supabaseの読み込み待ち（config.jsが遅れる場合への対策）
    const waitForSupabase = () => {
        return new Promise(resolve => {
            if (typeof supabaseClient !== 'undefined') return resolve();
            const interval = setInterval(() => {
                if (typeof supabaseClient !== 'undefined') {
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });
    };

    await waitForSupabase();

    // セッションチェック
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    // 現在のページURL
    const currentPath = window.location.pathname;

    if (session) {
        // --- ログイン中 ---
        
        // マイページにいる時は「ログアウト」にする
        if (currentPath.includes('mypage.html') || currentPath.includes('admin') || currentPath.includes('edit')) {
            btn.innerText = "LOGOUT";
            btn.href = "#";
            btn.onclick = async (e) => {
                e.preventDefault();
                if(confirm("ログアウトしますか？")){
                    await supabaseClient.auth.signOut();
                    window.location.href = "index.html";
                }
            };
        } else {
            // それ以外は「マイページ」ボタンにする
            btn.classList.add('is-mypage');
            btn.href = "mypage.html";
            
            // アイコンがあれば表示
            const avatar = session.user.user_metadata.avatar_url;
            if(avatar) {
                btn.innerHTML = `<img src="${avatar}" class="user-avatar-small"> MY PAGE`;
            } else {
                btn.innerText = "MY PAGE";
            }
        }
    } else {
        // --- 未ログイン ---
        btn.innerText = "LOGIN";
        btn.href = "login.html";
    }

    // 判定が終わったらボタンを表示
    btn.style.opacity = "1";
});