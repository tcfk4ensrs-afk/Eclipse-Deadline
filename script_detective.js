class Game {
    constructor() {
        this.characterFiles = {
            engineer: "scenarios/characters/noa.json",
            captain: "scenarios/characters/haris.json",
            pilot: "scenarios/characters/riku.json",
            observer: "scenarios/characters/mei.json"
        };
        this.charImages = {
            engineer: "assets/noa.jpg",
            captain: "assets/haris.jpg",
            pilot: "assets/riku.jpg",
            observer: "assets/mei.jpg"
        };
        this.characters = [];
        this.currentCharacterId = null;
        this.isAiThinking = false;
        
        // 状態管理
        this.state = {
            evidences: JSON.parse(localStorage.getItem('securedEvidence')) || [],
            affinity: JSON.parse(localStorage.getItem('introAffinity')) || {},
            // キャラクターごとに配列を持つように初期化
            history: {
                engineer: [],
                captain: [],
                pilot: [],
                observer: []
            }
        };
    }

    async init() {
        try {
            await this.loadAllCharacters();
            this.renderCharacterList();
            this.updateEvidenceUI();
            
            const modal = document.getElementById('api-modal');
            if (sessionStorage.getItem('GEMINI_API_KEY')) {
                if (modal) modal.style.display = 'none';
            } else {
                if (modal) modal.style.display = 'flex';
            }
        } catch (e) {
            console.error("Init Error:", e);
        }
    }

    async loadAllCharacters() {
        const promises = Object.entries(this.characterFiles).map(async ([id, path]) => {
            const res = await fetch(path);
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
            const imgSrc = this.charImages[char.id] || "assets/default.jpg";
            div.innerHTML = `
                <div class="char-thumb"><img src="${imgSrc}"></div>
                <div class="char-details">
                    <h4>${char.name}</h4>
                    <p>${char.role || char.occupation}</p>
                </div>
            `;
            div.onclick = () => this.openInterrogation(char.id);
            list.appendChild(div);
        });
    }

    /**
     * 尋問画面を開く（ここでログを切り替える）
     */
    openInterrogation(id) {
        this.currentCharacterId = id;
        const char = this.characters.find(c => c.id === id);
        
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('interrogation-room').style.display = 'flex';
        
        // ヘッダー更新
        const targetNameElem = document.getElementById('target-name');
        const imgSrc = this.charImages[id] || "assets/default.jpg";
        targetNameElem.innerHTML = `
            <div style="display:flex; align-items:center; gap:15px;">
                <img src="${imgSrc}" style="width:40px; height:40px; border-radius:50%; border:1px solid var(--neon-green); object-fit:cover;">
                <span>${char.name}</span>
            </div>
        `;

        // 【重要】そのキャラ専用のログを再描画する
        this.refreshChatLog();
    }

    refreshChatLog() {
        const logContainer = document.getElementById('chat-log');
        logContainer.innerHTML = ''; // 一旦空にする
        
        const history = this.state.history[this.currentCharacterId] || [];
        history.forEach(msg => {
            this.renderSingleMessage(msg.role, msg.displayOuter, msg.displayInner);
        });
    }

    async sendMessage() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text || this.isAiThinking) return;

        this.isAiThinking = true;
        this.appendMessage('user', text); // 自分の発言を保存・表示
        input.value = '';

        try {
            const char = this.characters.find(c => c.id === this.currentCharacterId);
            // 今話しているキャラの履歴だけをAIに送る
            const history = this.state.history[this.currentCharacterId] || [];
            
            const responseText = await window.sendToAI(this.constructPrompt(char), text, history);
            this.appendMessage('model', responseText); // AIの発言を保存・表示
        } catch (e) {
            this.appendMessage('system', "ERROR: " + e.message);
        } finally {
            this.isAiThinking = false;
        }
    }

    appendMessage(role, text) {
        let displayOuter = text, displayInner = "";

        if (role === 'model') {
            const outerMatch = text.match(/outer_voice[:：]\s*([\s\S]*?)(?=inner_voice|$)/i);
            const innerMatch = text.match(/inner_voice[:：]\s*([\s\S]*)/i);
            displayOuter = outerMatch ? outerMatch[1].trim() : text;
            displayInner = innerMatch ? innerMatch[1].trim() : "";
        }

        // 現在のキャラクターの履歴に追加
        this.state.history[this.currentCharacterId].push({ 
            role, 
            text, 
            displayOuter, 
            displayInner 
        });

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

    /**
     * プロンプトに「質問し返せ」という命令を追加
     */
    constructPrompt(char) {
        const userAffinity = this.state.affinity[char.id] || "neutral";
        return `
# Role
あなたはSFミステリーの登場人物「${char.name}」です。
# Profile
- 役割: ${char.role}
- 性格: ${char.personality} / 口調: ${char.style}
- 秘密: ${JSON.stringify(char.secrets || char.secret_sin)}
- 嘘をつく条件: ${char.behavior_logic?.lie_condition || "常に保身を優先せよ"}
# Context
- 管制官(プレイヤー)の態度: ${userAffinity}
- 提示された証拠: ${this.state.evidences.join(', ')}

# 重要ルール：逆質問と揺さぶり
1. あなたはただ質問に答えるだけの機械ではありません。
2. 自分が疑われたら、「${char.name}を疑うなんてどうかしている」「他の奴らの方が怪しい」と反論してください。
3. **会話の終わりに、必ず管制官(プレイヤー)に対して、疑いを逸らすための質問や、他のクルーを疑わせるような揺さぶりの質問を投げかけてください。**
4. 例: 「私を疑う前に、あの操縦士の隠し事について調べたらどうだ？」「君は本当に地上の人間なのか？」

# Response Format
outer_voice: [発言]
inner_voice: [内心]
        `.trim();
    }

    updateEvidenceUI() {
        const list = document.getElementById('evidence-list');
        if (!list) return;
        list.innerHTML = this.state.evidences.map(ev => 
            `<div class="evidence-item">● ${ev}</div>`
        ).join('') || '<p style="color:#555">NO DATA SECURED</p>';
    }
}

// 起動処理
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
