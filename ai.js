// ai.js の修正例
export async function sendToAI(systemPrompt, userText, history) {
  // 直接APIを叩かず、Netlifyの関数を呼ぶ
  const response = await fetch('/.netlify/functions/chat', {
    method: 'POST',
    body: JSON.stringify({
      prompt: systemPrompt + "\n" + userText,
      history: history
    })
  });
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}I Error:", e);
        return `通信エラー: ${e.message}`;
    }
}
