/**
 * Gemini API への通信を行うモジュール
 * @param {string} systemPrompt - キャラクター設定やルール
 * @param {string} userText - プレイヤーの入力
 * @param {Array} history - 過去の対話履歴
 */
export async function sendToAI(systemPrompt, userText, history) {
    // 優先順位: 1.手動入力(SessionStorage) 2.Netlify環境変数(もしあれば)
    const apiKey = sessionStorage.getItem('GEMINI_API_KEY') || ""; 
    
    if (!apiKey) {
        throw new Error("APIキーが設定されていません。画面上部の設定から入力してください。");
    }

    // --- 修正箇所：モデル名をフルパス(models/...)で指定 ---
    const modelName = "models/gemini-1.5-flash";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;

    // APIに送るコンテンツの組み立て
    const contents = [
        { 
            role: "user", 
            parts: [{ text: "【システム命令】あなたは物語の登場人物として振る舞います。以下の設定を厳守してください。\n" + systemPrompt }] 
        },
        { 
            role: "model", 
            parts: [{ text: "了解しました。私は指示されたキャラクターとして、設定と秘密を守りながら、outer_voiceとinner_voiceの形式で対話に応じます。" }] 
        },
        // 過去の履歴をGeminiのrole形式（user/model）に変換
        ...history.map(h => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
        })),
        { 
            role: "user", 
            parts: [{ text: userText }] 
        }
    ];

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents })
        });

        const data = await response.json();

        // API側からのエラー返却（キーの間違い、クォータ制限など）
        if (data.error) {
            console.error("Gemini API Error:", data.error);
            throw new Error(data.error.message);
        }

        // 応答が空、あるいは安全フィルターでブロックされた場合
        if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
            // 安全フィルターによるブロックが疑われる場合
            if (data.promptFeedback && data.promptFeedback.blockReason) {
                throw new Error(`AIが応答を拒否しました（理由: ${data.promptFeedback.blockReason}）。表現を変えてみてください。`);
            }
            throw new Error("AIから有効な応答が得られませんでした。");
        }

        return data.candidates[0].content.parts[0].text;

    } catch (err) {
        console.error("Fetch/API Error:", err);
        throw err;
    }
}
