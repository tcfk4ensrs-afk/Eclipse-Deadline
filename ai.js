/**
 * ミステリ/ai.js
 */
export async function sendToAI(systemPrompt, userText, history) {
    // 1. まずブラウザの入力欄（sessionStorage）にキーがあるか確認
    const manualApiKey = sessionStorage.getItem('GEMINI_API_KEY');

    if (manualApiKey) {
        console.log("Using manual API key from session...");
        return await fetchDirectly(systemPrompt, userText, history, manualApiKey);
    }

    // 2. キーがない場合のみ、Netlify Functionsを呼び出す（本番環境用）
    try {
        const response = await fetch('/.netlify/functions/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ systemPrompt, userPrompt: userText, history })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Netlify Function Error");
        return data.text;
    } catch (e) {
        console.error("AI通信エラー:", e);
        return `エラー: APIキーが設定されていないか、通信に失敗しました。(${e.message})`;
    }
}

/**
 * 直接通信用（URLを修正済み）
 */
async function fetchDirectly(systemPrompt, userText, history, apiKey) {
    const modelPath = "models/gemini-1.5-flash";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${apiKey}`;

    const contents = [
        { role: "user", parts: [{ text: "設定:\n" + systemPrompt }] },
        { role: "model", parts: [{ text: "了解。" }] },
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
    if (data.error) {
        // ここで「API key not valid」が出るなら、入力したキー自体が間違っています
        throw new Error(data.error.message);
    }
    return data.candidates[0].content.parts[0].text;
}
