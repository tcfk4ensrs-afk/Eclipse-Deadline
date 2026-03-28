// ai.js
export async function sendToAI(systemPrompt, userText, history = []) {
    try {
        // Netlify Functions のエンドポイントを叩く
        const response = await fetch('/.netlify/functions/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemPrompt: systemPrompt,
                userText: userText,
                history: history // 過去の会話ログ
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '通信エラーが発生しました');
        }

        const data = await response.json();
        // Geminiのレスポンス構造に合わせて抽出
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("AI Service Error:", error);
        throw error;
    }
}
