// ai.js の中身を以下に差し替え（モデル名をURLに直接埋め込みます）

export async function sendToAI(systemPrompt, userText, history) {
    const apiKey = sessionStorage.getItem('GEMINI_API_KEY');

    if (!apiKey) {
        return "エラー: APIキーが設定されていません。";
    }

    try {
        // --- 修正の要：モデル名をURLのパスの一部として正しく配置 ---
        // models/ の後に gemini-1.5-flash を続け、その後に :generateContent を置く
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;

        const requestBody = {
            contents: [
                {
                    role: "user",
                    parts: [{ text: "【重要設定】あなたはSFミステリーの登場人物として振る舞い、秘密を守りつつ対話してください。\n" + systemPrompt }]
                },
                {
                    role: "model",
                    parts: [{ text: "了解しました。設定に従い、キャラクターとして回答します。" }]
                },
                ...history.map(h => ({
                    role: h.role === 'user' ? 'user' : 'model',
                    parts: [{ text: h.text }]
                })),
                {
                    role: "user",
                    parts: [{ text: userText }]
                }
            ],
            // 殺人事件の描写でブロックされないための設定
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

        if (!response.ok) {
            console.error("API Error Detail:", data);
            return `エラー: ${data.error ? data.error.message : "API通信に失敗しました"}`;
        }

        if (data.candidates && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            return "AIからの応答が空です（安全フィルター等で制限された可能性があります）";
        }

    } catch (e) {
        console.error("Fatal Error:", e);
        return `通信エラー: ${e.message}`;
    }
}
