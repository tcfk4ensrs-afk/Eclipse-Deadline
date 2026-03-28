// netlify/functions/chat.js
exports.handler = async (event) => {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) return { statusCode: 500, body: JSON.stringify({ error: "API Key Missing" }) };

    try {
        const { systemPrompt, userText, history } = JSON.parse(event.body);
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
        
        const payload = {
            contents: [
                { role: "user", parts: [{ text: `System Instruction: ${systemPrompt}` }] },
                ...history.map(h => ({
                    role: h.role === 'model' ? 'model' : 'user',
                    parts: [{ text: h.text }]
                })),
                { role: "user", parts: [{ text: userText }] }
            ]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        // 🟢 修正点：エラーレスポンスが返ってきた場合、そのまま詳細を返す
        if (!response.ok) {
            console.error("Gemini API Error:", data);
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: "Gemini API Error", details: data })
            };
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
