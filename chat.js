// chat.js
// ★エラー原因を徹底的に表示するデバッグ強化版★

// あなたのプロジェクトURL（間違いないか確認！）
const FUNCTION_URL = 'https://daexakehxcvspmthpzzf.supabase.co/functions/v1/ai-chat'; 

const chatHTML = `
    <div id="chat-widget" style="display:none;">
        <div class="chat-header">
            <span>🤖 AI Concierge</span>
            <div style="display:flex; gap:10px;">
                <button onclick="clearChat()" style="background:none; border:none; color:#ccc; font-size:11px; cursor:pointer;">削除</button>
                <button onclick="toggleChat()" class="close-btn">×</button>
            </div>
        </div>
        <div id="chat-messages" class="chat-messages"></div>
        <div class="chat-input-area">
            <input type="text" id="chat-input" placeholder="質問を入力..." onkeypress="handleEnter(event)">
            <button onclick="sendMessage()">送信</button>
        </div>
    </div>
    <button id="chat-btn" onclick="toggleChat()">💬</button>

    <style>
        /* スタイルは変更なし */
        #chat-btn { position: fixed; bottom: 30px; right: 30px; width: 60px; height: 60px; border-radius: 50%; background: #000; color: #fff; border: none; font-size: 24px; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.2); z-index: 99999; transition: 0.3s; display: flex; align-items: center; justify-content: center; }
        #chat-btn:hover { transform: scale(1.1); }
        #chat-widget { position: fixed; bottom: 100px; right: 30px; width: 340px; height: 500px; background: #fff; border-radius: 12px; box-shadow: 0 5px 30px rgba(0,0,0,0.15); display: flex; flex-direction: column; overflow: hidden; z-index: 99999; font-family: 'Helvetica Neue', Arial, sans-serif; border: 1px solid #eee; }
        .chat-header { background: #000; color: #fff; padding: 15px; display: flex; justify-content: space-between; align-items: center; font-weight: bold; }
        .close-btn { background:none; border:none; color:white; font-size:20px; cursor:pointer; }
        .chat-messages { flex: 1; padding: 15px; overflow-y: auto; background: #f9f9f9; display: flex; flex-direction: column; gap: 12px; }
        .message { max-width: 85%; padding: 12px; border-radius: 8px; font-size: 13px; line-height: 1.6; word-wrap: break-word; }
        .message.ai { align-self: flex-start; background: #fff; border: 1px solid #e0e0e0; color: #333; }
        .message.user { align-self: flex-end; background: #000; color: #fff; }
        .event-suggestion { background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 10px; margin-top: 5px; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: flex-start; gap: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.03); text-decoration: none; color: inherit; }
        .event-suggestion:hover { background: #fafafa; transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.08); border-color: #000; }
        .suggestion-thumb { width: 70px; height: 70px; object-fit: cover; border-radius: 6px; background: #eee; flex-shrink: 0; }
        .suggestion-info { flex: 1; display: flex; flex-direction: column; gap: 4px; overflow: hidden; }
        .suggestion-title { font-weight: bold; font-size: 13px; color: #000; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .suggestion-desc { font-size: 11px; color: #777; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .suggestion-link { font-size: 11px; color: #000; font-weight: bold; margin-top: 2px; }
        .chat-input-area { padding: 12px; border-top: 1px solid #eee; display: flex; background: #fff; }
        #chat-input { flex: 1; border: 1px solid #ddd; padding: 10px; border-radius: 6px; outline: none; font-size: 14px; }
        .chat-input-area button { margin-left: 8px; background: #000; color: #fff; border: none; padding: 0 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: bold;}
    </style>
`;

// HTML注入（重複防止）
if (!document.getElementById('chat-widget')) {
    document.body.insertAdjacentHTML('beforeend', chatHTML);
    restoreState();
}

function toggleChat() {
    const widget = document.getElementById('chat-widget');
    const isHidden = widget.style.display === 'none';
    widget.style.display = isHidden ? 'flex' : 'none';
    sessionStorage.setItem('chat_is_open', isHidden);
    if(isHidden) setTimeout(() => document.getElementById('chat-input').focus(), 100);
}

function clearChat() {
    if(confirm('会話履歴を消去しますか？')) {
        sessionStorage.removeItem('chat_history');
        document.getElementById('chat-messages').innerHTML = `<div class="message ai">リセットしました ✨</div>`;
    }
}

function handleEnter(e) { if (e.key === 'Enter') sendMessage(); }

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    saveHistory();
    input.value = '';

    // ローディング表示
    const loadingId = addMessage('考え中...', 'ai');
    const loadingMsg = document.getElementById(loadingId);

    try {
        // 1. Supabaseクライアントの確認
        if (typeof supabaseClient === 'undefined') {
            throw new Error("Supabaseが読み込まれていません。\n<script src='chat.js'>の位置を一番下にしてください。");
        }

        // 2. イベントデータの取得
        const { data: events, error: dbError } = await supabaseClient
            .from('events')
            .select('id, title, date, category, short_desc, image_url');

        if (dbError) throw new Error("DBエラー: " + dbError.message);

        // 3. AIサーバーへ送信
        const response = await fetch(FUNCTION_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, events: events || [] })
        });

        // 4. エラーハンドリング（ここが重要）
        if (!response.ok) {
            // エラー内容をテキストで取得してみる
            const errorText = await response.text();
            throw new Error(`Server Error (${response.status}): ${errorText}`);
        }

        // 5. JSONデータのパース
        const data = await response.json();
        
        // 成功！メッセージ更新
        loadingMsg.innerText = data.reply;

        if (data.recommendations && data.recommendations.length > 0) {
            const container = document.getElementById('chat-messages');
            data.recommendations.forEach(event => {
                const card = document.createElement('div');
                card.className = 'event-suggestion';
                card.onclick = () => location.href = `event.html?id=${event.id}`;
                const img = event.image_url || 'https://placehold.co/70x70/eee/999?text=No';
                card.innerHTML = `
                    <img src="${img}" class="suggestion-thumb">
                    <div class="suggestion-info">
                        <div class="suggestion-title">${event.title}</div>
                        <div class="suggestion-desc">${event.short_desc || '詳細を見る'}</div>
                    </div>`;
                container.appendChild(card);
            });
            container.scrollTop = container.scrollHeight;
        }
        saveHistory();

    } catch (error) {
        console.error(error);
        // ★ここでエラー原因を画面に表示！
        loadingMsg.innerHTML = `<span style="color:red; font-weight:bold;">⚠️ エラー発生</span><br>${error.message}`;
    }
}

function addMessage(text, sender) {
    const div = document.createElement('div');
    div.classList.add('message', sender);
    div.id = 'msg-' + Date.now();
    div.innerText = text;
    const container = document.getElementById('chat-messages');
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div.id;
}

function saveHistory() {
    sessionStorage.setItem('chat_history', document.getElementById('chat-messages').innerHTML);
}

function restoreState() {
    const isOpen = sessionStorage.getItem('chat_is_open') === 'true';
    document.getElementById('chat-widget').style.display = isOpen ? 'flex' : 'none';
    
    const history = sessionStorage.getItem('chat_history');
    const container = document.getElementById('chat-messages');
    if (history) {
        container.innerHTML = history;
        container.scrollTop = container.scrollHeight;
    } else {
        container.innerHTML = '<div class="message ai">こんにちは！<br>AIコンシェルジュです🤖</div>';
    }
}
