import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    const { message, events } = requestData;

    // ★修正ポイント：タイムゾーンを日本に固定！
    const today = new Date().toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Tokyo", // これがないと海外時間になります
    }).replaceAll('/', '-');

    const systemPrompt = `
      あなたはイベント検索サイトのAIコンシェルジュです。
      
      【超重要：現在日時】
      今日は「${today}」です。
      （この日付より後なら「未来」、前なら「過去・終了済み」と判定してください）
      
      【イベントリスト】
      ${JSON.stringify(events)}
      
      【回答のルール】
      1. ユーザーの質問に対し、リストの中から最適なイベントを紹介してください。
      2. 「おすすめは？」と聞かれたら、基本的には「未来のイベント」を紹介してください。
      3. もし未来のイベントがあっても、ユーザーの興味に合わなさそうなら過去のものも検討してください。
      4. ★重要：もし「未来のイベント」があるのに「ありません」と答えるのは禁止です。必ずリストを確認してください。

      【出力フォーマット（JSONのみ）】
      {
        "reply": "回答メッセージ（今日が${today}であることを意識して話してOK）",
        "recommendations": [
          { "id": "...", "title": "...", "short_desc": "...", "image_url": "..." }
        ]
      }
    `;

    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo-0125",
        response_format: { type: "json_object" },
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
    const content = data.choices[0].message.content;
    let parsed;
    try { parsed = JSON.parse(content); } 
    catch (e) { parsed = { reply: content, recommendations: [] }; }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      reply: "エラーが発生しました。", error: error.message 
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});