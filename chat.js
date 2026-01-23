// chat.js
// 完成版：Supabase Edge Functions経由でAIと話す

// ★ここがあなたのAIの「窓口」です！
const FUNCTION_URL = 'https://daexakehxcvspmthpzzf.supabase.co/functions/v1/ai-chat'; 

// チャットの見た目（HTML）
const chatHTML = `
    <div id="chat-widget" style="display:none;">
        <div class="chat-header">
            <span>🤖 AI Concierge</span>
            <button onclick="toggleChat()" class="close-btn">×</button>
        </div>
        
        <div id="chat-messages" class="chat-messages">
            <div class="message ai">
                こんにちは！<br>
                誰でも無料で利用できます✨<br>
                「今週末のイベントある？」<br>
                「学ぶ系のイベント教えて」<br>
                など、お気軽にどうぞ！
            </div>
        </div>

        <div class="chat-input-area">
            <input type="text" id="chat-input" placeholder="質問を入力..." onkeypress="handleEnter(event)">
            <button onclick="sendMessage()">送信</button>
        </div>
    </div>
    
    <button id="chat-btn" onclick="toggleChat()">💬</button>

    <style>
        /* スタイル設定 */
        #chat-btn {
            position: fixed; bottom: 30px; right: 30px;
            width: 60px; height: 60px; border-radius: 50%;
            background: #000; color: #fff; border: none;
            font-size: 24px; cursor: pointer; 
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 9999; transition: 0.3s; display: flex; align-items: center; justify-content: center;
        }
        #chat-btn:hover { transform: scale(1.1); }

        #chat-widget {
            position: fixed; bottom: 100px; right: 30px;
            width: 320px; height: 450px;
            background: #fff; border-radius: 12px;
            box-shadow: 0 5px 30px rgba(0,0,0,0.15);
            display: flex; flex-direction: column;
            overflow: hidden; z-index: 9999;
            font-family: sans-serif; border: 1px solid #eee;
        }

        .chat-header {
            background: #000; color: #fff; padding: 15px;
            display: flex; justify-content: space-between; align-items: center;
            font-weight: bold;
        }
        .close-btn { background:none; border:none; color:white; font-size:20px; cursor:pointer; }

        .chat-messages {
            flex: 1; padding: 15px; overflow-y: auto; background: #f9f9f9;
            display: flex; flex-direction: column; gap: 10px;
        }

        .message {
            max-width: 80%; padding: 10px; border-radius: 8px; font-size: 13px; line-height: 1.5; word-wrap: break-word;
        }
        .message.ai { align-self: flex-start; background: #fff; border: 1px solid #ddd; color: #333; }
        .message.user { align-self: flex-end; background: #000; color: #fff; }

        .chat-input-area {
            padding: 10px; border-top: 1px solid #eee; display: flex; background: #fff;
        }
        #chat-input {
            flex: 1; border: 1px solid #ddd; padding: 8px; border-radius: 4px; outline: none;
        }
        .chat-input-area button {
            margin-left: 8px; background: #000; color: #fff; border: none;
            padding: 8px 15px; border-radius: 4px; cursor: pointer; font-size: 12px;
        }
    </style>
`;

document.body.insertAdjacentHTML('beforeend', chatHTML);

function toggleChat() {
    const widget = document.getElementById('chat-widget');
    if (widget.style.display === 'none') {
        widget.style.display = 'flex';
        setTimeout(() => document.getElementById('chat-input').focus(), 100);
    } else {
        widget.style.display = 'none';
    }
}

function handleEnter(e) {
    if (e.key === 'Enter') sendMessage();
}

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    // 1. ユーザーのメッセージを表示
    addMessage(text, 'user');
    input.value = '';

    // 2. 「考え中...」を表示
    const loadingId = addMessage('考え中...', 'ai');

    try {
        if (typeof supabaseClient === 'undefined') {
            throw new Error("Supabaseが読み込まれていません。");
        }

        // 3. Supabaseから現在のイベント一覧を取得
        const { data: events, error: dbError } = await supabaseClient
            .from('events')
            .select('title, date, category, short_desc');
        
        if (dbError) throw new Error("データ取得エラー");

        // 4. あなたのSupabaseサーバー(Edge Function)に送信！
        // ※APIキーは送りません。メッセージとデータだけ送ります。
        const response = await fetch(FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: text,
                events: events 
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "サーバーエラーが発生しました");
        }

        // 5. AIの返事を表示
        document.getElementById(loadingId).innerText = data.reply;

    } catch (error) {
        console.error(error);
        const errorDiv = document.getElementById(loadingId);
        errorDiv.innerText = "⚠️ エラーが発生しました";
        errorDiv.innerHTML += `<br><span style="color:red; font-size:11px;">${error.message}</span>`;
    }
}

function addMessage(text, sender) {
    const div = document.createElement('div');
    div.classList.add('message', sender);
    div.innerText = text;
    div.id = 'msg-' + Date.now();

    const container = document.getElementById('chat-messages');
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div.id;
}
