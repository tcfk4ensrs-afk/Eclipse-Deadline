// netlify/functions/chat.js
const fetch = require('node-fetch'); // Netlifyの環境によっては標準fetchが使えるため不要な場合あり

exports.handler = async (event) => {
    // 1. APIキーを環境変数から取得
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ error: "API Key not configured on Netlify." }) };
    }

    try {
        const { systemPrompt, userText, history } = JSON.parse(event.body);

        // 2. Gemini APIへのリクエスト構築
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
