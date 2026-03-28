// netlify/functions/chat.js
exports.handler = async (event) => {
  // Netlifyの管理画面で設定したキーをここで読み込む（ブラウザには見えない）
  const API_KEY = process.env.GEMINI_API_KEY; 
  const { prompt, history } = JSON.parse(event.body);

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [...history, { role: "user", parts: [{ text: prompt }] }]
      })
    });
    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  }
};
