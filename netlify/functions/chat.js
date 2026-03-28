// netlify/functions/chat.js

// 🟢 修正：require('node-fetch') は削除します（標準のfetchを使用）

exports.handler = async (event) => {
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: "API Key not configured." }) 
        };
    }

    try {
        const { systemPrompt, userText, history } = JSON.parse(event.body);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
        
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

        // 🟢 標準のfetchを使用
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
