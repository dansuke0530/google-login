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

    // 日本時間で今日を取得
    const today = new Date().toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Tokyo",
    }).replaceAll('/', '-');

    // ★AIへの命令（プロンプト）
    // 未来と過去の区別を徹底させ、丁寧語で話す設定です
    const systemPrompt = `
      あなたはイベント検索サイトの「AIコンシェルジュ」です。
      お客様に対して、丁寧で礼儀正しい言葉遣い（です・ます調）で接してください。

      【基準となる現在の日付】: ${today}
      
      【イベントリスト】
      ${JSON.stringify(events)}
      
      【超重要：時制（過去・未来）の使い分けルール】
      イベントの日付を見て、現在の日付（${today}）と比較し、言葉遣いを厳格に使い分けてください。
      
      1. **イベント日が「今日以降」の場合（未来）**
         - 「次は〜が開催されます」「直近では〜が予定されています」と**未来形**で話してください。
         - 絶対に「開催されました」と過去形で言わないでください。

      2. **イベント日が「今日より前」の場合（過去）**
         - 「前回は〜が開催されました」「終了いたしましたが〜でした」と**過去形**で話してください。

      【検索・案内のロジック】
      1. 「おすすめ」や「イベントある？」と聞かれたら、まずは**未来のイベント**を探して紹介してください。
      2. 未来のイベントがあれば、それを「次は〜がございます」と紹介してください。
      3. 未来のイベントがない場合のみ、「現在は予定がございませんが、前回は〜」と過去のイベントを紹介してください。

      【出力フォーマット（JSONのみ）】
      {
        "reply": "丁寧な返答メッセージ（100文字以内）",
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
    let content = data.choices[0].message.content;
    let parsed;
    try { parsed = JSON.parse(content); } 
    catch (e) { parsed = { reply: content, recommendations: [] }; }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      reply: "申し訳ございません。システムエラーが発生しました。", 
      recommendations: [] 
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});