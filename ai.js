export async function sendToAI(systemPrompt, userText, history) {
    // 優先順位: 1.手動入力(SessionStorage) 2.Netlify環境変数
    const apiKey = sessionStorage.getItem('GEMINI_API_KEY') || ""; 
    
    if (!apiKey) {
        throw new Error("APIキーが設定されていません。画面上部から設定してください。");
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const contents = [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "了解しました。私はそのキャラクターとして振る舞い、秘密を守りながら対話に応じます。" }] },
        ...history.map(h => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
        })),
        { role: "user", parts: [{ text: userText }] }
    ];

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    
    return data.candidates[0].content.parts[0].text;
}
