class Game {
    constructor() {
        this.characterFiles = {
            engineer: "scenarios/characters/noa.json",
            captain: "scenarios/characters/haris.json",
            pilot: "scenarios/characters/riku.json",
            observer: "scenarios/characters/mei.json"
        };
        this.characters = [];
        this.currentCharacterId = null;
        this.isAiThinking = false;
        this.state = {
            evidences: JSON.parse(localStorage.getItem('securedEvidence')) || [],
            affinity: JSON.parse(localStorage.getItem('introAffinity')) || {},
            history: {}
        };
    }

    async init() {
        console.log("Game.init() started...");
        try {
            // JSONの読み込みを試みる
            await this.loadAllCharacters();
            this.renderCharacterList();
            this.updateEvidenceUI();
            
            console.log("Characters loaded:", this.characters);

            // モーダルの表示制御
            const modal = document.getElementById('api-modal');
            if (sessionStorage.getItem('GEMINI_API_KEY')) {
                console.log("API Key exists. Closing modal.");
                if (modal) modal.style.display = 'none';
            } else {
                console.log("No API Key. Opening modal.");
                if (modal) modal.style.display = 'flex';
            }
        } catch (e) {
            console.error("Init Error (Check if JSON files exist in scenarios/characters/):", e);
            // エラー時もキー入力だけはできるようにする
            const modal = document.getElementById('api-modal');
            if (modal) modal.style.display = 'flex';
        }
    }

    async loadAllCharacters() {
        const promises = Object.entries(this.characterFiles).map(async ([id, path]) => {
            const res = await fetch(path);
            if (!res.ok) throw new Error(`Could not find ${path}`);
            const data = await res.json();
            return { id, ...data };
        });
        this.characters = await Promise.all(promises);
    }

    renderCharacterList() {
        const list = document.getElementById('character-list');
        if (!list) return;
        list.innerHTML = '';
        this.characters.forEach(char => {
            const div = document.createElement('div');
            div.className = 'char-card';
            div.innerHTML = `<h4>${char.name}</h4><p>${char.role || char.occupation}</p>`;
            div.onclick = () => this.openInterrogation(char.id);
            list.appendChild(div);
        });
    }

    updateEvidenceUI() {
        const list = document.getElementById('evidence-list');
        if (!list) return;
        list.innerHTML = this.state.evidences.map(ev => 
            `<div class="evidence-item">● ${ev}</div>`
        ).join('') || '<p style="color:#555">NO DATA SECURED</p>';
    }

    async sendMessage() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text || this.isAiThinking) return;

        this.isAiThinking = true;
        this.appendMessage('user', text);
        input.value = '';

        try {
            const char = this.characters.find(c => c.id === this.currentCharacterId);
            const history = this.state.history[this.currentCharacterId] || [];
            
            // window.sendToAI が ai.js から正しく export/import されている必要があります
            const responseText = await window.sendToAI(this.constructPrompt(char), text, history);
            this.appendMessage('model', responseText);
        } catch (e) {
            console.error("Chat Error:", e);
            this.appendMessage('system', "COMMUNICATION ERROR: " + e.message);
        } finally {
            this.isAiThinking = false;
        }
    }

    appendMessage(role, text) {
        if (!this.state.history[this.currentCharacterId]) this.state.history[this.currentCharacterId] = [];
        let displayOuter = text, displayInner = "";

        if (role === 'model') {
            const outerMatch = text.match(/outer_voice[:：]\s*([\s\S]*?)(?=inner_voice|$)/i);
            const innerMatch = text.match(/inner_voice[:：]\s*([\s\S]*)/i);
            displayOuter = outerMatch ? outerMatch[1].trim() : text;
            displayInner = innerMatch ? innerMatch[1].trim() : "";
        }

        this.state.history[this.currentCharacterId].push({ role, text, displayOuter, displayInner });
        this.renderSingleMessage(role, displayOuter, displayInner);
    }

    renderSingleMessage(role, outer, inner) {
        const log = document.getElementById('chat-log');
        if (!log) return;
        const div = document.createElement('div');
        div.className = `msg ${role}`;
        div.innerHTML = `<div>${outer}</div>`;
        if (inner) div.innerHTML += `<div class="inner-thought">（内心：${inner}）</div>`;
        log.appendChild(div);
        log.scrollTop = log.scrollHeight;
    }

    constructPrompt(char) {
        const userAffinity = this.state.affinity[char.id] || "neutral";
        return `
# Role
あなたはSFミステリーの登場人物「${char.name}」です。
# Profile
- 役割: ${char.role || char.occupation}
- 性格: ${char.personality}
- 口調: ${char.style || char.talk_style}
- あなたの秘密: ${JSON.stringify(char.secrets || char.secret_sin)}
# Context
プレイヤーのあなたへの態度: ${userAffinity}
提示されている証拠: ${this.state.evidences.join(', ')}
# Response Format
outer_voice: [発言]
inner_voice: [内心]
        `.trim();
    }

    openInterrogation(id) {
        this.currentCharacterId = id;
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('interrogation-room').style.display = 'flex';
        document.getElementById('target-name').innerText = this.characters.find(c => c.id === id).name;
    }

    startAccusation() {
        const culprit = prompt("真犯人の名前を入力してください（ハリス/ノア/リク/メイ）");
        if (culprit === "ノア") {
            alert("正解！エンディングへ移行します。");
            location.href = "true-end.html";
        } else if (culprit) {
            alert("誤認逮捕です。船は崩壊しました...");
            location.href = "bad-end.html";
        }
    }
}

// --- 初期化とグローバル登録 ---

// インスタンスを先に作成
const game = new Game();
window.game = game;

// 保存関数をグローバルに登録
window.saveApiKey = () => {
    const keyInput = document.getElementById('api-key-input');
    const key = keyInput ? keyInput.value.trim() : "";
    
    if (key) {
        sessionStorage.setItem('GEMINI_API_KEY', key);
        console.log("API Key saved.");
        
        // モーダルを閉じる
        const modal = document.getElementById('api-modal');
        if (modal) modal.style.display = 'none';
        
        // 再初期化
        game.init(); 
    } else {
        alert("キーを入力してください");
    }
};

document.addEventListener('DOMContentLoaded', () => {
    game.init();
    
    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) sendBtn.onclick = () => game.sendMessage();
    
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.onclick = () => {
            document.getElementById('interrogation-room').style.display = 'none';
            document.getElementById('main-menu').style.display = 'block';
        };
    }
});
