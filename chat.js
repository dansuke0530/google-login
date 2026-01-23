// chat.js
// ★リッチなカード表示バージョン★

const FUNCTION_URL = 'https://daexakehxcvspmthpzzf.supabase.co/functions/v1/ai-chat'; 

const chatHTML = `
    <div id="chat-widget" style="display:none;">
        <div class="chat-header">
            <span>🤖 AI Concierge</span>
            <button onclick="toggleChat()" class="close-btn">×</button>
        </div>
        
        <div id="chat-messages" class="chat-messages">
            <div class="message ai">
                こんにちは！<br>
                気になるイベントがあれば探しますよ🔍<br>
                「デザイン」「交流会」など教えてください！
            </div>
        </div>

        <div class="chat-input-area">
            <input type="text" id="chat-input" placeholder="質問を入力..." onkeypress="handleEnter(event)">
            <button onclick="sendMessage()">送信</button>
        </div>
    </div>
    
    <button id="chat-btn" onclick="toggleChat()">💬</button>

    <style>
        /* 基本レイアウト */
        #chat-btn { position: fixed; bottom: 30px; right: 30px; width: 60px; height: 60px; border-radius: 50%; background: #000; color: #fff; border: none; font-size: 24px; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.2); z-index: 9999; transition: 0.3s; display: flex; align-items: center; justify-content: center; }
        #chat-btn:hover { transform: scale(1.1); }
        
        #chat-widget { 
            position: fixed; bottom: 100px; right: 30px; width: 340px; height: 500px; /* 少し横幅広げました */
            background: #fff; border-radius: 12px; box-shadow: 0 5px 30px rgba(0,0,0,0.15); 
            display: flex; flex-direction: column; overflow: hidden; z-index: 9999; 
            font-family: 'Helvetica Neue', Arial, sans-serif; border: 1px solid #eee; 
        }
        
        .chat-header { background: #000; color: #fff; padding: 15px; display: flex; justify-content: space-between; align-items: center; font-weight: bold; }
        .close-btn { background:none; border:none; color:white; font-size:20px; cursor:pointer; }
        
        .chat-messages { flex: 1; padding: 15px; overflow-y: auto; background: #f9f9f9; display: flex; flex-direction: column; gap: 12px; }
        
        .message { max-width: 85%; padding: 12px; border-radius: 8px; font-size: 13px; line-height: 1.6; word-wrap: break-word; }
        .message.ai { align-self: flex-start; background: #fff; border: 1px solid #e0e0e0; color: #333; }
        .message.user { align-self: flex-end; background: #000; color: #fff; }

        /* ★新・カードデザイン（横長レイアウト） */
        .event-suggestion {
            background: #fff; 
            border: 1px solid #eee;
            border-radius: 8px; 
            padding: 10px; 
            margin-top: 5px;
            cursor: pointer; 
            transition: all 0.2s ease;
            display: flex; 
            align-items: flex-start; /* 上揃え */
            gap: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.03);
            text-decoration: none; /* リンクの下線消し */
            color: inherit;
        }
        
        .event-suggestion:hover { 
            background: #fafafa; 
            transform: translateY(-2px); 
            box-shadow: 0 4px 10px rgba(0,0,0,0.08);
            border-color: #000;
        }

        /* 左側の画像 */
        .suggestion-thumb {
            width: 70px; 
            height: 70px; 
            object-fit: cover; 
            border-radius: 6px;
            background: #eee;
            flex-shrink: 0; /* 画像が潰れないように */
        }

        /* 右側のテキスト情報 */
        .suggestion-info {
            flex: 1; 
            display: flex; 
            flex-direction: column; 
            gap: 4px; 
            overflow: hidden; /* はみ出し対策 */
        }

        .suggestion-title {
            font-weight: bold; 
            font-size: 13px; 
            color: #000; 
            line-height: 1.4;
            display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; /* 2行で切る */
        }

        .suggestion-desc {
            font-size: 11px; 
            color: #777; 
            line-height: 1.4;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis; /* 1行で切る */
        }
        
        .suggestion-link {
            font-size: 11px;
            color: #000;
            font-weight: bold;
            margin-top: 2px;
        }

        .chat-input-area { padding: 12px; border-top: 1px solid #eee; display: flex; background: #fff; }
        #chat-input { flex: 1; border: 1px solid #ddd; padding: 10px; border-radius: 6px; outline: none; font-size: 14px; }
        .chat-input-area button { margin-left: 8px; background: #000; color: #fff; border: none; padding: 0 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: bold;}
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

    addMessage(text, 'user');
    input.value = '';
    const loadingId = addMessage('考え中...', 'ai');

    try {
        if (typeof supabaseClient === 'undefined') throw new Error("Supabase読込エラー");

        // ★画像URL(image_url)も含めて取得する
        const { data: events } = await supabaseClient
            .from('events')
            .select('id, title, date, category, short_desc, image_url');

        const response = await fetch(FUNCTION_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, events: events })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Server Error");

        // メッセージ表示
        document.getElementById(loadingId).innerText = data.reply;

        // ★リッチなカードを表示
        if (data.recommendations && data.recommendations.length > 0) {
            const container = document.getElementById('chat-messages');
            
            data.recommendations.forEach(event => {
                const card = document.createElement('div');
                card.className = 'event-suggestion';
                card.onclick = () => location.href = `event.html?id=${event.id}`;
                
                // 画像がない場合のダミー画像対応
                const imgUrl = event.image_url || 'https://via.placeholder.com/70x70/eee/999?text=No+Img';

                card.innerHTML = `
                    <img src="${imgUrl}" class="suggestion-thumb">
                    <div class="suggestion-info">
                        <div class="suggestion-title">${event.title}</div>
                        <div class="suggestion-desc">${event.short_desc || '詳細をご覧ください'}</div>
                        <div class="suggestion-link">詳細を見る →</div>
                    </div>
                `;
                container.appendChild(card);
            });
            
            container.scrollTop = container.scrollHeight;
        }

    } catch (error) {
        console.error(error);
        document.getElementById(loadingId).innerText = "⚠️ エラー: " + error.message;
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
