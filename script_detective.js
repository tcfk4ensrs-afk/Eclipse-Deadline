/**
 * PROJECT: ECLIPSE DEADLINE - Phase 02: Interrogation
 * 尋問フェーズ：対話、証拠提示、及び真実の解明
 */

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
        
        this.state = {
            evidences: [],
            affinity: JSON.parse(localStorage.getItem('introAffinity')) || {},
            history: {
                engineer: [], captain: [], pilot: [], observer: []
            }
        };

        this.truthReference = {
            "医師の遺体": "後頭部に鈍器の痕がある。",
            "ノイズ混じりの記録データ": "削除されたログの復元に成功。14:15にポッドへ入る『2つの人影（ノアと医師）』が記録されていた。",
            "不自然に軽いコンテナ": "リクが隠したはずの物資は、ノアによって全て宇宙へ投棄されていた。生存競争の引き金。",
            "ラベルのない液体瓶": "バイオ燃料装置を改造して密造された高純度エタノール。ハリス船長の重度の依存症を示す。",
            "コンテナ奥の断線したコード": "リクが12:30に意図的に切断したもの。倉庫の監視を無効化するための工作だった。"
        };
    }

    async init() {
        try {
            console.log("System Initializing...");
            await this.loadAllCharacters();
            this.renderCharacterList();
            this.updateEvidenceUI();
            
            // APIキーのインライン設定エリアの制御
            const statusMsg = document.getElementById('api-status-msg');
            const keyInput = document.getElementById('api-key-input');
            const savedKey = sessionStorage.getItem('GEMINI_API_KEY');

            if (savedKey) {
                // キー設定済み
                if (statusMsg) {
                    statusMsg.innerText = ">> APIキー構成済み。通信チャネルは確立されています。";
                    statusMsg.style.color = "var(--neon-green)";
                }
                if (keyInput) keyInput.value = "********"; 
            } else {
                // キー未設定
                if (statusMsg) {
                    statusMsg.innerText = ">> 警告: APIキーが未設定です。対話プロトコルを実行できません。";
                    statusMsg.style.color = "var(--error-red)";
                }
            }

            console.log("System Ready.");
        } catch (e) {
            console.error("Init Error:", e);
        }
    }

    async loadAllCharacters() {
        const promises = Object.entries(this.characterFiles).map(async ([id, path]) => {
            const res = await fetch(path);
            if (!res.ok) throw new Error(`Failed to load ${path}`);
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

    openInterrogation(id) {
        this.currentCharacterId = id;
        const char = this.characters.find(c => c.id === id);
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('interrogation-room').style.display = 'flex';
        const targetNameElem = document.getElementById('target-name');
        const imgSrc = this.charImages[id] || "assets/default.jpg";
        targetNameElem.innerHTML = `
            <div style="display:flex; align-items:center; gap:15px;">
                <img src="${imgSrc}" style="width:40px; height:40px; border-radius:50%; border:1px solid var(--neon-green); object-fit:cover;">
                <span>${char.name}</span>
            </div>
        `;
        this.updateEvidenceUI();
        this.refreshChatLog();
    }

    refreshChatLog() {
        const logContainer = document.getElementById('chat-log');
        if (!logContainer) return;
        logContainer.innerHTML = ''; 
        const history = this.state.history[this.currentCharacterId] || [];
        history.forEach(msg => {
            this.renderSingleMessage(msg.role, msg.displayOuter, "");
        });
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
            this.checkTruthUpdate(responseText);
        } catch (e) {
            this.appendMessage('system', "ERROR: " + e.message);
        } finally {
            this.isAiThinking = false;
        }
    }

    presentEvidence(evidenceName) {
        if (this.isAiThinking || !this.currentCharacterId) return;
        const input = document.getElementById('chat-input');
        input.value = `【証拠提示：${evidenceName}】これについて説明してください。`;
        this.sendMessage();
    }

    checkTruthUpdate(aiText) {
        const currentId = this.currentCharacterId;
        const revelationTriggers = [
            { key: "ラベルのない液体瓶", informant: "pilot", triggers: ["酒", "アルコール", "飲んでいた", "隠れて"] },
            { key: "不自然に軽いコンテナ", informant: "captain", triggers: ["軽い", "空っぽ", "リクが何か", "中身がない"] },
            { key: "コンテナ奥の断線したコード", informant: "observer", triggers: ["リクが倉庫", "コードを切った", "物理的な破壊"] },
            { key: "ノイズ混じりの記録データ", informant: "engineer", triggers: ["メイが操作", "ログを消した", "彼女の仕業"] },
            { key: "医師の遺体", informant: "observer", triggers: ["ノアがポッド", "医師を運んでいた", "二人で入った"] }
        ];

        revelationTriggers.forEach(item => {
            if (currentId === item.informant && item.triggers.some(t => aiText.includes(t))) {
                this.updateEvidenceToTruth(item.key);
            }
        });
    }

    updateEvidenceToTruth(name) {
        const index = this.state.evidences.findIndex(e => (e.name === name || e.item === name));
        if (index !== -1 && this.truthReference[name]) {
            const currentDetail = this.state.evidences[index].detail;
            const newTruth = this.truthReference[name];
            if (!currentDetail.includes("【確定】")) {
                this.state.evidences[index].detail = `【確定】${newTruth}`;
                localStorage.setItem('securedEvidence', JSON.stringify(this.state.evidences));
                this.updateEvidenceUI();
                this.appendMessage('system', `証拠更新: 「${name}」の真相が判明しました。`);
            }
        }
    }

    appendMessage(role, text) {
        let displayOuter = text;
        if (role === 'model') {
            displayOuter = text.replace(/outer_voice[:：]\s*/i, "").replace(/inner_voice[:：][\s\S]*/i, "").trim();
        }
        if (!this.state.history[this.currentCharacterId]) {
            this.state.history[this.currentCharacterId] = [];
        }
        this.state.history[this.currentCharacterId].push({ 
            role, text: displayOuter, displayOuter 
        });
        this.renderSingleMessage(role, displayOuter, "");
    }

    renderSingleMessage(role, outer, inner) {
        const log = document.getElementById('chat-log');
        if (!log) return;
        const div = document.createElement('div');
        div.className = `msg ${role}`;
        div.innerHTML = `<div>${outer}</div>`;
        log.appendChild(div);
        log.scrollTop = log.scrollHeight;
    }

    constructPrompt(char) {
        const history = this.state.history[char.id] || [];
        const evidenceString = this.state.evidences.map(e => `${e.name || e.item}(内容:${e.detail})`).join(', ');

        let gossipBoost = "";
        if (char.id === 'captain') {
            gossipBoost = "\n- 【重要】『不自然に軽いコンテナ』の件は、管理責任を問われないよう「昨日までは重かった」「リクが怪しい」と即座にプレイヤーへ伝えてください。";
        }
        if (char.id === 'pilot') {
            gossipBoost = "\n- 【重要】船長が酒を飲んでいることや、ノアが勝手に備蓄をいじっている疑いを積極的に口にしてください。";
        }

        return `
# Role
あなたは宇宙船の乗組員「${char.name}」です。
# 性格・背景
${char.personality}
# 記憶と知識
- あなたの行動ログ: ${JSON.stringify(char.timeline_memory)}
- あなたが知る他人の不審点: ${JSON.stringify(char.other_char_secrets_known)}
- 現在提示されている証拠: ${evidenceString}

# 応答ルール (厳守)
1. **【inner_voiceの使用禁止】**: すべての思考、動揺、情報はセリフ（outer_voice）内で表現してください。
2. **【他人の秘密は即出し】**: 自分以外の不審な点、他人の秘密、周囲の状況の変化（コンテナが軽い等）は、プレイヤーから聞かれたら（あるいは話の流れで）隠さず即座に喋ってください。
3. **【自分の罪のみ隠匿】**: 自分の致命的な罪だけは、証拠が【確定】になるまでとぼけてください。
4. **【形式】**: 以下の形式で回答してください。
outer_voice: [セリフと描写]
${gossipBoost}
        `.trim();
    }

    updateEvidenceUI() {
        const list = document.getElementById('evidence-list');
        if (!list) return;
        this.state.evidences = JSON.parse(localStorage.getItem('securedEvidence')) || [];
        if (this.state.evidences.length === 0) {
            list.innerHTML = '<p style="color:#444; font-size:0.8em; text-align: center; margin-top: 20px;">NO DATA SECURED</p>';
            return;
        }
        list.innerHTML = this.state.evidences.map(ev => {
            const name = ev.name || ev.item || "不明なアイテム";
            return `
                <div class="evidence-item" onclick="game.presentEvidence('${name}')" style="cursor:pointer; border:1px solid #333; margin-bottom:5px; padding:8px; border-radius:4px; background:rgba(255,255,255,0.05);">
                    <strong style="color:var(--neon-green);">● ${name}</strong>
                    <p style="font-size:0.85em; margin:4px 0;">${ev.detail}</p>
                    <small style="color:#777;">>> 突きつける</small>
                </div>
            `;
        }).join('');
    }
}

const game = new Game();
window.game = game;

window.saveApiKey = function() {
    const input = document.getElementById('api-key-input');
    if (input && input.value.trim() !== "" && input.value.trim() !== "********") {
        sessionStorage.setItem('GEMINI_API_KEY', input.value.trim());
        alert("APIキーを保存しました。");
        location.reload();
    } else {
        alert("有効なキーを入力してください。");
    }
};

document.addEventListener('DOMContentLoaded', () => {
    game.init();
    document.getElementById('send-btn').onclick = () => game.sendMessage();
    document.getElementById('back-btn').onclick = () => {
        document.getElementById('interrogation-room').style.display = 'none';
        document.getElementById('main-menu').style.display = 'block';
    };
});
