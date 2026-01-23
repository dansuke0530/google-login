// chat.js

// ▼▼▼ ここに新しいキー（sk-...）を貼り付けてください ▼▼▼
const OPENAI_API_KEY = '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'; 
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

// チャットの見た目（HTML/CSS）
const chatHTML = `
    <div id="chat-widget" style="display:none;">
        <div class="chat-header">
            <span>🤖 AI Concierge</span>
            <button onclick="toggleChat()" class="close-btn">×</button>
        </div>
        <div id="chat-messages" class="chat-messages">
            <div class="message ai">
                こんにちは！<br>
                「今週末のイベントある？」<br>
                「デザイン系のイベント教えて」<br>
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
            max-width: 80%; padding: 10px; border-radius: 8px; font-size: 13px; line-height: 1.5;
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

// 画面にHTMLを追加
document.body.insertAdjacentHTML('beforeend', chatHTML);

// 開閉機能
function toggleChat() {
    const widget = document.getElementById('chat-widget');
    if (widget.style.display === 'none') {
        widget.style.display = 'flex';
        setTimeout(() => document.getElementById('chat-input').focus(), 100);
    } else {
        widget.style.display = 'none';
    }
}

// Enterキーで送信
function handleEnter(e) {
    if (e.key === 'Enter') sendMessage();
}

// メッセージ送信のメイン処理
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
        // Supabaseクライアントのチェック
        if (typeof supabaseClient === 'undefined') {
            throw new Error("Supabaseが正しく読み込まれていません。");
        }

        // 3. Supabaseからイベント情報を取得
        const { data: events, error: dbError } = await supabaseClient
            .from('events')
            .select('title, date, category, short_desc');
        
        if (dbError) throw new Error("データベースエラー: " + dbError.message);

        // 4. AIへの命令文（プロンプト）作成
        const systemPrompt = `
            あなたはイベント検索サイトのAIコンシェルジュです。
            以下の【イベントリスト】だけを情報源として、ユーザーの質問に答えてください。
            
            【イベントリスト】
            ${JSON.stringify(events)}
            
            ルール:
            - リストにないイベントは「見つかりませんでした」と答える。
            - 日付や「category（タグ）」を考慮して提案する。
            - 150文字以内で簡潔に答える。
            - 絵文字を使って親しみやすくする。
        `;

        // 5. ChatGPT APIへ送信
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo", // ★一番安定して動きやすいモデル
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: text }
                ]
            })
        });

        const data = await response.json();

        // エラーチェック
        if (!response.ok) {
            const errorMsg = data.error ? data.error.message : response.statusText;
            throw new Error(`OpenAIエラー [${response.status}]: ${errorMsg}`);
        }

        // 6. AIの返事を画面に表示
        const aiResponse = data.choices[0].message.content;
        document.getElementById(loadingId).innerText = aiResponse;

    } catch (error) {
        console.error(error);
        // エラーが起きたら画面に赤文字で表示
        const errorDiv = document.getElementById(loadingId);
        errorDiv.innerText = "⚠️ エラーが発生しました";
        errorDiv.innerHTML += `<br><span style="color:red; font-size:11px;">${error.message}</span>`;
        
        // よくあるエラーのヒント
        if (error.message.includes('429') || error.message.includes('quota')) {
            errorDiv.innerHTML += `<br><br>💡ヒント: クレジット残高不足です。OpenAIで5ドルほどチャージしてください。`;
        }
        if (error.message.includes('401')) {
            errorDiv.innerHTML += `<br><br>💡ヒント: APIキーが間違っています。`;
        }
    }
}

// 画面に吹き出しを追加する関数
function addMessage(text, sender) {
    const div = document.createElement('div');
    div.classList.add('message', sender);
    div.innerText = text;
    div.id = 'msg-' + Date.now(); // IDを付与

    const container = document.getElementById('chat-messages');
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div.id;
}
