import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS（ブラウザからのアクセス許可）の処理
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    const { message, events } = requestData;

    // ★重要：日本時間で今日の日付を取得
    const today = new Date().toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Tokyo",
    }).replaceAll('/', '-');

    // AIへの命令（プロンプト）
    const systemPrompt = `
      あなたはイベント検索サイトの「気が利く」AIコンシェルジュです。
      ユーザーのチャットに対し、以下のイベントリストを使って返答してください。

      【現在の日付（日本時間）】: ${today}
      
      【イベントリスト】
      ${JSON.stringify(events)}
      
      【回答のルール】
      1. 基本は「未来のイベント（日付が今日以降）」を優先して紹介してください。
      
      2. ★重要：もし「未来のイベント」が1件もない場合★
         絶対に「イベントはありません」だけで終わらせないでください。
         「現在は予定されているイベントはありませんが、直近ではこんなイベントを開催しました！」
         と前置きして、リストの中で一番日付が新しい「過去のイベント」を1つ紹介してください。

      3. 「次のイベントは？」と聞かれた時も同様に、未来の予定がなければ
         「次回の開催は未定ですが、前回は〜」と過去のものを紹介してください。

      4. 雑談（挨拶など）には短くフレンドリーに答えてください。

      【出力フォーマット（必ずこのJSON形式のみで出力）】
      {
        "reply": "ユーザーへの返信メッセージ（100文字以内）",
        "recommendations": [
          { 
            "id": "イベントID", 
            "title": "タイトル", 
            "short_desc": "短い説明", 
            "image_url": "画像URL" 
          }
        ]
      }
      ※該当イベントがない場合は "recommendations": [] にしてください。
    `;

    // OpenAI APIを叩く
    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo-0125",
        response_format: { type: "json_object" }, // JSONモードを強制
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      throw new Error(`OpenAI API Error: ${openAIResponse.statusText}`);
    }

    const data = await openAIResponse.json();
    const aiContent = data.choices[0].message.content;
    
    // AIの返答をパース（解析）する
    let parsedContent;
    try {
      parsedContent = JSON.parse(aiContent);
    } catch (e) {
      // 万が一JSONじゃない形式で返ってきた場合の保険
      console.error("JSON Parse Error:", e);
      parsedContent = { 
        reply: aiContent, 
        recommendations: [] 
      };
    }

    // クライアント（画面）に返す
    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Server Error:", error.message);
    return new Response(JSON.stringify({ 
      reply: "申し訳ありません。現在サーバーが混み合っており、応答できませんでした。", 
      error: error.message,
      recommendations: [] 
    }), {
      status: 200, // フロントエンドがエラー画面にならないよう200で返して、メッセージで伝える
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});