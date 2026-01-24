import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // 1. CORS（ブラウザからのアクセス許可）の処理
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 2. データの受け取り
    const requestData = await req.json();
    const { message, events } = requestData;

    console.log("受信メッセージ:", message); // ログ確認用

    // 3. AIへの命令文作成
    const systemPrompt = `
      あなたはイベント検索サイトのAIコンシェルジュです。
      以下のイベントリストから、ユーザーの要望に合うものを探してください。
      
      【イベントリスト】
      ${JSON.stringify(events)}
      
      【重要】回答は必ず以下のJSON形式のみで出力してください。余計な文章は不要です。
      
      {
        "reply": "ユーザーへの返信メッセージ（親しみやすく、100文字以内）",
        "recommendations": [
          { 
            "id": "イベントID", 
            "title": "タイトル", 
            "short_desc": "短い説明", 
            "image_url": "画像URL" 
          }
        ]
      }
      
      ルール:
      - 該当なしなら "recommendations": []
      - 最大3件まで提案。
    `;

    // 4. OpenAIへの問い合わせ
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

    // 5. OpenAIからのエラーチェック
    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error("OpenAI Error:", errorText);
      throw new Error(`OpenAI API Error: ${openAIResponse.statusText}`);
    }

    // 6. 結果の整形
    const data = await openAIResponse.json();
    const aiContent = data.choices[0].message.content;
    
    // JSONとして正しいかパースしてみる
    let parsedContent;
    try {
      parsedContent = JSON.parse(aiContent);
    } catch (e) {
      console.error("JSON Parse Error:", aiContent);
      // 万が一JSONじゃない場合も無理やり修正
      parsedContent = { reply: aiContent, recommendations: [] };
    }

    // 7. Frontendに返す
    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Server Error:", error.message);
    
    // エラーが起きても、Frontendに「エラーだよ」とJSONで返す（これで考え中が終わる）
    return new Response(JSON.stringify({ 
      reply: "申し訳ありません。サーバー側でエラーが発生しました。", 
      error: error.message,
      recommendations: [] 
    }), {
      status: 200, // あえて200で返してFrontendにメッセージを表示させる
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});