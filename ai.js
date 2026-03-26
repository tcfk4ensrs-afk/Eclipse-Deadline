/**
 * ai.js
 * 手動入力されたAPIキーを使用してGemini APIと通信します。
 */
export async function sendToAI(systemPrompt, userText, history) {
    // 1. セッションストレージからキーを取得
    const apiKey = sessionStorage.getItem('GEMINI_API_KEY');

    if (!apiKey || apiKey.trim() === "") {
        return "エラー: APIキーが入力されていません。画面上部の設定から入力してください。";
    }

    try {
        console.log("Starting AI communication...");
        
        // --- 修正ポイント：URLの組み立てを最も標準的な形に ---
        // v1beta のエンドポイント。モデル名は models/gemini-1.5-flash
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;

        // リクエストボディの作成
        const requestBody = {
            contents: [
                {
                    role: "user",
                    parts: [{ text: "【システム設定】以下のキャラクター設定を守り、内心(inner_voice)と発言(outer_voice)を分けて回答せよ。\n\n" + systemPrompt }]
                },
                {
                    role: "model",
                    parts: [{ text: "了解しました。私はそのキャラクターになりきり、指示された形式で回答します。" }]
                },
                // 過去の会話履歴を追加
                ...history.map(h => ({
                    role: h.role === 'user' ? 'user' : 'model',
                    parts: [{ text: h.text }]
                })),
                // 今回のユーザー入力
                {
                    role: "user",
                    parts: [{ text: userText }]
                }
            ],
            // 安全設定をオフ（または最小）にする（ミステリーの「死体」などでブロックされないため）
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ]
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        // エラーレスポンスの処理
        if (!response.ok) {
            console.error("Gemini API Error Response:", data);
            if (data.error && data.error.message.includes("API key not valid")) {
                return "エラー: APIキーが無効です。コピーミスがないか確認してください。";
            }
            return `エラー: ${data.error ? data.error.message : "通信失敗"}`;
        }

        // 応答の抽出
        if (data.candidates && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            // 安全フィルターで消された場合など
            console.warn("No candidates found. Full data:", data);
            return "AIからの応答が空です（安全フィルターに抵触した可能性があります）。";
        }

    } catch (e) {
        console.error("Fatal AI Error:", e);
        return `通信エラー: ${e.message}`;
    }
}
