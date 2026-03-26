/**
 * ミステリ/ai.js
 * Netlify Functionsを経由してGemini APIと通信します。
 * (未設定時は手動入力のAPIキーを使用して直接通信を試みます)
 */
export async function sendToAI(systemPrompt, userText, history) {
    try {
        // --- 1. Netlify Functions (/.netlify/functions/gemini) へのリクエストを試行 ---
        const response = await fetch('/.netlify/functions/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                systemPrompt, 
                userPrompt: userText, 
                history 
            })
        });

        // Netlify Functions が存在し、正常に動作した場合はその結果を返す
        if (response.ok) {
            const data = await response.json();
            return data.text || "応答がありませんでした。";
        }

        // --- 2. Netlify Functions がエラー、または存在しない場合のフォールバック ---
        // (テストプレイ用に手動入力されたAPIキーを使用して直接通信)
        const manualApiKey = sessionStorage.getItem('GEMINI_API_KEY');
        if (!manualApiKey) {
            throw new Error("Netlify Functionsが未設定、かつAPIキーも入力されていません。");
        }

        console.log("Netlify Functions not available. Falling back to direct API call...");
        return await fetchDirectly(systemPrompt, userText, history, manualApiKey);

    } catch (e) {
        console.error("AI通信エラー:", e);
        return `通信エラー: ${e.message}`;
    }
}

/**
 * 手動入力されたAPIキーを使用して直接Gemini APIを叩く（テスト用）
 */
async function fetchDirectly(systemPrompt, userText, history, apiKey) {
    const modelPath = "models/gemini-1.5-flash";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${apiKey}`;

    const contents = [
        { role: "user", parts: [{ text: "【システム命令】設定を厳守せよ。\n" + systemPrompt }] },
        { role: "model", parts: [{ text: "了解しました。" }] },
        ...history.map(h => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
        })),
        { role: "user", parts: [{ text: userText }] }
    ];

    const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.candidates[0].content.parts[0].text;
}
