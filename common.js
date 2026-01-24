// common.js
// ★改善版：高速化対応 & Googleアイコン表示 & スマートな戻るボタン

// 1. 共通CSS (D4C風デザイン + アイコン用スタイル追加)
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
        max-width: 1200px; margin: 0 auto; padding: 15px 30px; /* 少しスリムに */
        display: flex; justify-content: space-between; align-items: center;
    }
    .logo { font-size: 20px; font-weight: 800; letter-spacing: 0.05em; color: #000; }
    
    /* ボタン共通スタイル */
    .btn-login { 
        border: 1px solid #ddd; padding: 8px 25px; border-radius: 50px; 
        font-size: 12px; font-weight: 700; color: #333; cursor: pointer;
        display: inline-flex; align-items: center; gap: 8px; /* アイコンと文字の間隔 */
        height: 40px; box-sizing: border-box;
    }
    .btn-login:hover { border-color: #000; transform: translateY(-2px); }
    
    /* 状態別スタイル */
    .btn-login.mypage { background: #000; color: #fff; border-color: #000; padding-left: 6px; /* アイコン入る分調整 */ }
    .btn-login.logout { background: #f5f5f5; color: #333; border-color: #eee; }
    .btn-login.logout:hover { background: #ffebeb; color: #d32f2f; border-color: #d32f2f; }
    .btn-login.back   { background: transparent; border-color: #ccc; color: #666; }
    
    /* Googleアイコン画像 */
    .user-avatar {
        width: 28px; height: 28px; border-radius: 50%; object-fit: cover;
        border: 2px solid #fff;
    }
</style>
`;

// 2. ヘッダーHTML
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

// ★ここが修正点：document.writeを使わず、安全に挿入する
document.head.insertAdjacentHTML('beforeend', commonCSS);
document.body.insertAdjacentHTML('afterbegin', headerHTML);

// 3. ボタン自動切り替えロジック（強化版）
async function updateHeaderButton() {
    // ボタン要素取得
    const btn = document.getElementById('auth-link');
    if (!btn) return;

    // Supabaseがまだ読み込まれていない場合のガード
    if (typeof supabaseClient === 'undefined') {
        // 少し待って再トライ（読み込み順序対策）
        setTimeout(updateHeaderButton, 100);
        return;
    }

    const currentPath = window.location.pathname;

    // --- セッション確認 ---
    const { data: { session } } = await supabaseClient.auth.getSession();

    // デザイン適用のため一度opacityを戻す
    btn.style.opacity = "1";

    // 1. 未ログインの場合
    if (!session) {
        btn.innerText = "LOGIN";
        btn.href = "login.html";
        return;
    }

    // 2. ログイン済みユーザー情報の取得
    const user = session.user;
    const avatarUrl = user.user_metadata.avatar_url; // GoogleのアイコンURL
    
    // アイコン画像のHTMLタグを作成
    const iconHtml = avatarUrl 
        ? `<img src="${avatarUrl}" class="user-avatar" alt="icon">` 
        : '';

    // --- ページごとの分岐 ---

    // パターンA：マイページにいる時 → LOGOUTボタン
    if (currentPath.includes('mypage.html') || currentPath.includes('super_admin.html')) {
        btn.innerHTML = "LOGOUT"; // アイコンなし
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

    // パターンB：作業画面にいる時 → BACKボタン
    // admin.html や edit.html の場合はマイページに戻す
    if (currentPath.includes('admin.html') || currentPath.includes('edit.html')) {
        btn.innerHTML = "← BACK";
        btn.href = "mypage.html";
        btn.classList.add('back');
        return;
    }

    // パターンC：その他のページ（トップなど） → MY PAGEボタン（アイコン付き！）
    btn.innerHTML = `${iconHtml} MY PAGE`;
    btn.href = "mypage.html";
    btn.classList.add('mypage');
}

// 読み込み完了時に実行
window.addEventListener('load', updateHeaderButton);