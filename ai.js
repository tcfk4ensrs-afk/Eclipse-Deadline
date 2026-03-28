// ai.js の修正
export async function sendToAI(systemPrompt, userText, history = []) {
    // 🟢 修正： /api/chat と書くだけで /.netlify/functions/chat に繋がります
    const response = await fetch('/api/chat', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt, userText, history })
    });
    
    // ...あとの処理は同じ

    const data = await response.json();

    // 🟢 修正点：データの構造をチェックする
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
    } else {
        console.error("Unexpected AI Response:", data);
        // エラーの詳細があればそれを表示、なければ一般的なエラーを出す
        const errorMsg = data.details?.error?.message || data.error || "AIの応答構造が異常です";
        throw new Error(errorMsg);
    }
}
