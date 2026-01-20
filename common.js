// common.js

// 1. ヘッダーのHTML（ID="auth-link" のボタンが重要！）
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

// 2. 共通CSS
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
        
        /* ボタンのデザイン */
        .btn-login { 
            border: 1px solid #ddd; padding: 8px 25px; border-radius: 50px; 
            font-size: 12px; font-weight: 600; color: #333; cursor: pointer;
        }
        .btn-login:hover { border-color: #000; background: #000; color: #fff; }
        
        /* マイページボタン用（黒背景） */
        .btn-login.mypage { background: #000; color: #fff; border-color: #000; }
        .btn-login.mypage:hover { opacity: 0.8; }
        
        /* ログアウトボタン用（グレー背景とかにするならここ） */
        .btn-login.logout { background: #666; color: #fff; border-color: #666; }
    </style>
`;

// HTMLとCSSを書き出し
document.write(commonCSS);
document.write(headerHTML);


// 3. ★ここが改良ポイント！状況に合わせてボタンを書き換える機能
async function updateHeaderButton() {
    // Supabaseがまだ読み込まれてない時は何もしない
    if (typeof supabaseClient === 'undefined') return;

    const btn = document.getElementById('auth-link');
    if (!btn) return;

    // 今のページのURLを取得
    const currentPath = window.location.pathname;

    // ★パターンA：ここが「マイページ (mypage.html)」の場合
    if (currentPath.includes('mypage.html')) {
        btn.innerText = "LOGOUT";     // 文字をログアウトに
        btn.href = "#";               // リンクは無効化
        btn.classList.add('logout');  // デザイン変更用クラス
        
        // クリックしたらログアウト処理を実行
        btn.onclick = async (e) => {
            e.preventDefault(); // リンク移動を止める
            const { error } = await supabaseClient.auth.signOut();
            if (!error) {
                window.location.href = "index.html"; // トップへ戻る
            } else {
                alert("ログアウト失敗: " + error.message);
            }
        };
        return; // ここで終了（下の処理はしない）
    }

    // ★パターンB：その他のページ（トップ、詳細、登録画面など）
    // ログインしてるかチェック
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (session) {
        // ログイン中なら「マイページへ」
        btn.innerText = "MY PAGE";
        btn.href = "mypage.html";
        btn.classList.add('mypage');
        btn.onclick = null; // クリックイベントは消しておく
    } else {
        // 未ログインなら「ログイン画面へ」
        btn.innerText = "LOGIN";
        btn.href = "login.html";
        btn.classList.remove('mypage');
        btn.onclick = null;
    }
}

// ページ読み込みが終わったら実行
window.addEventListener('load', updateHeaderButton);
