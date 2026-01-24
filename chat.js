// chat.js
// ★デザインリニューアル版（左右吹き出し＆ローディングアニメーション）★

// あなたのプロジェクトURL
const FUNCTION_URL = 'https://daexakehxcvspmthpzzf.supabase.co/functions/v1/ai-chat'; 

// チャットウィジェットのHTML構造（CSSでアニメーションを追加）
const chatHTML = `
    <div id="chat-widget" style="display:none;">
        <div class="chat-header">
            <span>🤖 AI Concierge</span>
            <div style="display:flex; gap:10px;">
                <button onclick="clearChat()" title="履歴を削除" style="background:none; border:none; color:#ccc; font-size:12px; cursor:pointer;">🗑️</button>
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
        /* --- 基本レイアウト --- */
        #chat-btn { position: fixed; bottom: 30px; right: 30px; width: 60px; height: 60px; border-radius: 50%; background: #000; color: #fff; border: none; font-size: 24px; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.2); z-index: 99999; transition: 0.3s; display: flex; align-items: center; justify-content: center; }
        #chat-btn:hover { transform: scale(1.1); }
        
        #chat-widget { 
            position: fixed; bottom: 100px; right: 30px; width: 360px; height: 550px; 
            background: #fff; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); 
            display: flex; flex-direction: column; overflow: hidden; z-index: 99999; 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            border: 1px solid #f0f0f0;
        }

        .chat-header { background: #000; color: #fff; padding: 16px; display: flex; justify-content: space-between; align-items: center; font-weight: bold; font-size: 15px; letter-spacing: 0.5px; }
        .close-btn { background:none; border:none; color:white; font-size:24px; cursor:pointer; line-height: 1; }

        /* --- メッセージエリア（LINE風デザイン） --- */
        .chat-messages { 
            flex: 1; padding: 20px; overflow-y: auto; background: #f8f9fa; 
            display: flex; flex-direction: column; gap: 16px; 
        }

        .message-row { display: flex; width: 100%; }
        
        /* AI（左側） */
        .message-row.ai { justify-content: flex-start; }
        .message-row.ai .message-bubble { 
            background: #fff; color: #333; 
            border-top-left-radius: 2px; 
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            border: 1px solid #e0e0e0;
        }

        /* ユーザー（右側） */
        .message-row.user { justify-content: flex-end; }
        .message-row.user .message-bubble { 
            background: #000; color: #fff; 
            border-top-right-radius: 2px; 
        }

        .message-bubble {
            max-width: 80%; padding: 12px 16px; border-radius: 14px; 
            font-size: 14px; line-height: 1.6; word-wrap: break-word; position: relative;
        }

        /* --- ローディングアニメーション（3点リーダー） --- */
        .typing-indicator { display: flex; align-items: center; gap: 4px; padding: 4px 2px; }
        .typing-dot {
            width: 6px; height: 6px; background-color: #b0b0b0; border-radius: 50%;
            animation: typing 1.4s infinite ease-in-out both;
        }
        .typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-dot:nth-child(2) { animation-delay: -0.16s; }
        
        @keyframes typing {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
        }

        /* --- イベント提案カード --- */
        .event-suggestion { 
            background: #fff; border: 1px solid #eee; border-radius: 10px; padding: 10px; margin-top: 8px; 
            cursor: pointer; transition: 0.2s; display: flex; gap: 10px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.03); text-decoration: none; color: inherit; 
            max-width: 90%; align-self: flex-start;
        }
        .event-suggestion:hover { background: #fafafa; transform: translateY(-2px); border-color: #000; }
        .suggestion-thumb { width: 60px; height: 60px; object-fit: cover; border-radius: 6px; background: #eee; flex-shrink: 0; }
        .suggestion-info { flex: 1; overflow: hidden; display: flex; flex-direction: column; justify-content: center; }
        .suggestion-title { font-weight: bold; font-size: 13px; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .suggestion-desc { font-size: 11px; color: #777; }

        /* --- 入力エリア --- */
        .chat-input-area { padding: 16px; background: #fff; border-top: 1px solid #eee; display: flex; gap: 10px; }
        #chat-input { flex: 1; border: 1px solid #ddd; padding: 12px; border-radius: 24px; outline: none; font-size: 14px; transition: 0.2s; background: #f8f9fa; }
        #chat-input:focus { border-color: #000; background: #fff; }
        .chat-input-area button { background: #000; color: #fff; border: none; padding: 0 20px; border-radius: 24px; cursor: pointer; font-size: 13px; font-weight: bold; transition: 0.2s; }
        .chat-input-area button:hover { opacity: 0.8; }
    </style>
`;

// HTML注入
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
        document.getElementById('chat-messages').innerHTML = `
            <div class="message-row ai">
                <div class="message-bubble">会話をリセットしました ✨</div>
            </div>`;
    }
}

function handleEnter(e) { if (e.key === 'Enter') sendMessage(); }

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    // 1. ユーザーのメッセージを表示（右側・黒）
    addMessage(text, 'user');
    input.value = '';
    saveHistory();

    // 2. AIのローディングアニメーションを表示（左側・白・・・・）
    const loadingHtml = `
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>`;
    const loadingId = addMessage(loadingHtml, 'ai', true); // true = HTMLとして追加
    const loadingBubble = document.getElementById(loadingId);

    try {
        if (typeof supabaseClient === 'undefined') throw new Error("Supabase読込エラー");

        const { data: events } = await supabaseClient
            .from('events').select('id, title, date, category, short_desc, image_url');

        const response = await fetch(FUNCTION_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, events: events || [] })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Server Error: ${errText}`);
        }

        const data = await response.json();
        
        // 3. ローディングを消して、実際の返答に書き換え
        loadingBubble.innerText = data.reply;

        // おすすめイベントがあればカードを追加
        if (data.recommendations && data.recommendations.length > 0) {
            const container = document.getElementById('chat-messages');
            data.recommendations.forEach(event => {
                const card = document.createElement('div');
                card.className = 'event-suggestion';
                card.onclick = () => location.href = `event.html?id=${event.id}`;
                const img = event.image_url || 'https://placehold.co/60x60/eee/999?text=No';
                card.innerHTML = `
                    <img src="${img}" class="suggestion-thumb">
                    <div class="suggestion-info">
                        <div class="suggestion-title">${event.title}</div>
                        <div class="suggestion-desc">詳細を見る &gt;</div>
                    </div>`;
                container.appendChild(card);
            });
            container.scrollTop = container.scrollHeight;
        }
        saveHistory();

    } catch (error) {
        console.error(error);
        loadingBubble.innerHTML = `<span style="color:red;">⚠️ エラー: ${error.message}</span>`;
    }
}

// メッセージ追加関数（isHtml=trueならHTMLタグを有効にする）
function addMessage(content, sender, isHtml = false) {
    const container = document.getElementById('chat-messages');
    
    // 行（row）を作成
    const row = document.createElement('div');
    row.classList.add('message-row', sender);
    
    // 吹き出し（bubble）を作成
    const bubble = document.createElement('div');
    bubble.classList.add('message-bubble');
    bubble.id = 'msg-' + Date.now(); // 後で書き換えるためにID付与

    if (isHtml) {
        bubble.innerHTML = content;
    } else {
        bubble.innerText = content;
    }

    row.appendChild(bubble);
    container.appendChild(row);
    container.scrollTop = container.scrollHeight;

    return bubble.id; // 吹き出しのIDを返す
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
        // 初回メッセージ
        container.innerHTML = `
            <div class="message-row ai">
                <div class="message-bubble">こんにちは！<br>AIコンシェルジュです🤖</div>
            </div>`;
    }
}