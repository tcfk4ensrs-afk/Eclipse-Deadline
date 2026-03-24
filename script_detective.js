class Game {
    constructor() {
        // IDとファイル名の紐付け
        this.characterFiles = {
            engineer: "scenarios/characters/noa.json",
            captain: "scenarios/characters/haris.json",
            pilot: "scenarios/characters/riku.json",
            observer: "scenarios/characters/mei.json"
        };
        this.characters = []; // ここにJSONの中身が入る
        this.currentCharacterId = null;
        this.isAiThinking = false;
        this.state = {
            evidences: JSON.parse(localStorage.getItem('securedEvidence')) || [],
            affinity: JSON.parse(localStorage.getItem('introAffinity')) || {},
            history: {}
        };
    }

    // script_detective.js の init 部分を差し替え
async init() {
    try {
        console.log("Loading characters...");
        await this.loadAllCharacters();
        this.renderCharacterList();
        this.updateEvidenceUI();
        
        // 保存済みのキーがあれば表示
        if (sessionStorage.getItem('GEMINI_API_KEY')) {
            console.log("API Key found in session.");
            document.getElementById('api-modal').style.display = 'none';
        } else {
            document.getElementById('api-modal').style.display = 'flex';
        }
    } catch (e) {
        console.error("Critical Init Error:", e);
        // JSONがなくてもチャット枠だけは出せるようにする（テスト用）
        document.getElementById('api-modal').style.display = 'flex';
    }
}

// 保存ボタンの関数（確実に保存されるように修正）
window.saveApiKey = () => {
    const key = document.getElementById('api-key-input').value.trim();
    if (key) {
        sessionStorage.setItem('GEMINI_API_KEY', key);
        console.log("API Key saved to sessionStorage.");
        document.getElementById('api-modal').style.display = 'none';
        // 保存後に再初期化を試みる
        game.init(); 
    } else {
        alert("キーを入力してください");
    }
};

    // JSONファイルをすべて読み込む
    async loadAllCharacters() {
        const promises = Object.entries(this.characterFiles).map(async ([id, path]) => {
            const res = await fetch(path);
            if (!res.ok) throw new Error(`Fetch error: ${path}`);
            const data = await res.json();
            return { id, ...data };
        });
        this.characters = await Promise.all(promises);
    }

    // --- 以下、描画・通信ロジック（前回のものと同じ） ---
    renderCharacterList() {
        const list = document.getElementById('character-list');
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
        list.innerHTML = this.state.evidences.map(ev => 
            `<div class="evidence-item">● ${ev}</div>`
        ).join('') || '<p style="color:#555">NO DATA</p>';
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
            const responseText = await window.sendToAI(this.constructPrompt(char), text, history);
            this.appendMessage('model', responseText);
        } catch (e) {
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
- あなたの秘密: ${JSON.stringify(char.secrets)}
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
        const culprit = prompt("真犯人の名前を入力してください（テスト用）");
        if (culprit === "ノア") {
            alert("正解！エンディングへ移行します。");
            location.href = "true-end.html";
        } else if (culprit) {
            alert("誤認逮捕です...");
            location.href = "bad-end.html";
        }
    }
}

// 起動
const game = new Game();
window.game = game;
document.addEventListener('DOMContentLoaded', () => {
    game.init();
    document.getElementById('send-btn').onclick = () => game.sendMessage();
    document.getElementById('back-btn').onclick = () => {
        document.getElementById('interrogation-room').style.display = 'none';
        document.getElementById('main-menu').style.display = 'block';
    };
});
