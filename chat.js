// chat.js

// ★ここにChatGPTのAPIキーを入れてね！
const OPENAI_API_KEY = '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'; 

// チャットのHTML（右下に固定表示）
const chatHTML = `
    <div id="chat-widget" style="display:none;">
        <div class="chat-header">
            <span>🤖 AI Concierge</span>
            <button onclick="toggleChat()" style="background:none; border:none; color:white; cursor:pointer;">✕</button>
        </div>
        <div id="chat-messages" class="chat-messages">
            <div class="message ai">
                こんにちは！<br>
                「今週末のイベントはある？」<br>
                「デザイン系のイベントを教えて」<br>
                など、なんでも聞いてください！
            </div>
        </div>
        <div class="chat-input-area">
            <input type="text" id="chat-input" placeholder="Ask me anything..." onkeypress="handleEnter(event)">
            <button onclick="sendMessage()">→</button>
        </div>
    </div>
    
    <button id="chat-btn" onclick="toggleChat()">💬</button>

    <style>
        /* チャットボタン */
        #chat-btn {
            position: fixed; bottom: 30px; right: 30px;
            width: 60px; height: 60px; border-radius: 50%;
            background: #000; color: #fff; border: none;
            font-size: 24px; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 9999; transition: 0.3s;
        }
        #chat-btn:hover { transform: scale(1.1); }

        /* チャットウィンドウ */
        #chat-widget {
            position: fixed; bottom: 100px; right: 30px;
            width: 350px; height: 500px;
            background: #fff; border-radius: 12px;
            box-shadow: 0 5px 30px rgba(0,0,0,0.15);
            display: flex; flex-direction: column;
            overflow: hidden; z-index: 9999;
            font-family: 'Manrope', sans-serif;
            border: 1px solid #eee;
        }

        /* ヘッダー */
        .chat-header {
            background: #000; color: #fff; padding: 15px;
            display: flex; justify-content: space-between; align-items: center;
            font-weight: bold; letter-spacing: 0.05em;
        }

        /* メッセージエリア */
        .chat-messages {
            flex: 1; padding: 20px; overflow-y: auto; background: #f9f9f9;
            display: flex; flex-direction: column; gap: 15px;
        }

        /* 吹き出し */
        .message {
            max-width: 80%; padding: 10px 15px; border-radius: 12px; font-size: 13px; line-height: 1.6;
        }
        .message.ai {
            align-self: flex-start; background: #fff; border: 1px solid #eee; color: #333;
            border-bottom-left-radius: 2px;
        }
        .message.user {
            align-self: flex-end; background: #000; color: #fff;
            border-bottom-right-radius: 2px;
        }

        /* 入力エリア */
        .chat-input-area {
            padding: 10px; background: #fff; border-top: 1px solid #eee; display: flex;
        }
        #chat-input {
            flex: 1; border: none; padding: 10px; font-size: 14px; outline: none;
        }
        .chat-input-area button {
            background: transparent; border: none; color: #000; font-weight: bold; cursor: pointer; padding: 0 10px;
        }
    </style>
`;

// HTMLを画面に注入
document.body.insertAdjacentHTML('beforeend', chatHTML);

// 開閉切り替え
function toggleChat() {
    const widget = document.getElementById('chat-widget');
    widget.style.display = widget.style.display === 'none' ? 'flex' : 'none';
}

// Enterキー対応
function handleEnter(e) {
    if (e.key === 'Enter') sendMessage();
}

// メッセージ送信処理
async function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    // 1. ユーザーのメッセージを表示
    addMessage(text, 'user');
    input.value = '';

    // 2. ローディング表示
    const loadingId = addMessage('考え中...', 'ai');

    try {
        // ★ここがミソ！Supabaseから全イベントデータを取ってくる
        const { data: events } = await supabaseClient
            .from('events')
            .select('title, date, category, short_desc');

        // AIへの命令文（システムプロンプト）を作る
        // 「あなたはコンシェルジュです。以下のイベントデータをもとに回答して」という指示
        const systemPrompt = `
            あなたはイベント検索サイトのAIコンシェルジュです。
            以下のイベントリストをもとに、ユーザーの質問に親切に答えてください。
            
            【イベントリスト】
            ${JSON.stringify(events)}
            
            ルール:
            - リストにないイベントは「見つかりませんでした」と答えること。
            - 日付やジャンルを考慮して提案すること。
            - フレンドリーな口調で、絵文字を少し使うこと。
            - 回答は150文字以内で簡潔に。
        `;

        // 3. ChatGPT APIに送信
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo", // gpt-4o も使えるよ
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: text }
                ]
            })
        });

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        // 4. AIの回答を表示（ローディングを消して上書き）
        document.getElementById(loadingId).innerText = aiResponse;

    } catch (error) {
        document.getElementById(loadingId).innerText = "ごめんなさい、エラーが発生しました💦";
        console.error(error);
    }
}

// 画面にメッセージを追加する関数
function addMessage(text, sender) {
    const div = document.createElement('div');
    div.classList.add('message', sender);
    div.innerText = text;
    
    // IDをつけて返す（あとで書き換えるため）
    const id = 'msg-' + Date.now();
    div.id = id;

    const container = document.getElementById('chat-messages');
    container.appendChild(div);
    container.scrollTop = container.scrollHeight; // 一番下にスクロール
    return id;
}
