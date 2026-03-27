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
        
        // 第1フェーズからの引き継ぎデータ
        this.state = {
            evidences: JSON.parse(localStorage.getItem('securedEvidence')) || [],
            affinity: JSON.parse(localStorage.getItem('introAffinity')) || {},
            history: {
                engineer: [], captain: [], pilot: [], observer: []
            }
        };

        // 真実データ（特定の証言を得た際に上書きされる内容）
        this.truthReference = {
            "医師の遺体": "後頭部に鈍器の痕があり、内部から無理やりロックされている。ノアによる犯行の決定的証拠。",
            "ノイズ混じりの記録データ": "削除されたログの復元に成功。14:15にポッドへ入る『2つの人影（ノアと医師）』が記録されていた。",
            "不自然に軽いコンテナ": "リクが隠したはずの物資は、ノアによって全て宇宙へ投棄されていた。生存競争の引き金。",
            "ラベルのない液体瓶": "バイオ燃料装置を改造して密造された高純度エタノール。ハリス船長の重度の依存症を示す。",
            "コンテナ奥の断線したコード": "リクが12:30に意図的に切断したもの。倉庫の監視を無効化するための工作だった。"
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

        this.refreshChatLog();
    }

    refreshChatLog() {
        const logContainer = document.getElementById('chat-log');
        logContainer.innerHTML = ''; 
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
            { 
                key: "ラベルのない液体瓶", 
                informant: "pilot", 
                triggers: ["酒の匂い", "アルコール", "飲んでやがった"] 
            },
            { 
                key: "不自然に軽いコンテナ", 
                informant: "captain", 
                triggers: ["昨日は重かった", "備蓄されていたはず", "中身が空"] 
            },
            { 
                key: "コンテナ奥の断線したコード", 
                informant: "observer", 
                triggers: ["リクが倉庫に入った瞬間", "通信が断絶", "物理的な切断"] 
            },
            { 
                key: "ノイズ混じりの記録データ", 
                informant: "engineer", 
                triggers: ["メイがログに触っていた", "彼女なら消せる", "ハッキングの形跡"] 
            },
            {
                key: "医師の遺体",
                informant: "observer", 
                triggers: ["ノアがポッドへ", "二人の反応", "ハッチを閉めた"]
            }
        ];

        revelationTriggers.forEach(item => {
            if (currentId === item.informant && item.triggers.some(t => aiText.includes(t))) {
                this.updateEvidenceToTruth(item.key);
            }
        });
    }

    updateEvidenceToTruth(name) {
        const index = this.state.evidences.findIndex(e => e.name === name);
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
        let displayOuter = text, displayInner = "";
        if (role === 'model') {
            const outerMatch = text.match(/outer_voice[:：]\s*([\s\S]*?)(?=inner_voice|$)/i);
            const innerMatch = text.match(/inner_voice[:：]\s*([\s\S]*)/i);
            displayOuter = outerMatch ? outerMatch[1].trim() : text;
            displayInner = innerMatch ? innerMatch[1].trim() : "";
        }

        this.state.history[this.currentCharacterId].push({ 
            role, text, displayOuter, displayInner 
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

    constructPrompt(char) {
        const history = this.state.history[char.id] || [];
        const talkCount = history.filter(h => h.role === 'model').length; 
        const userAffinity = this.state.affinity[char.id] || "neutral";
        const evidenceString = this.state.evidences.map(e => `${e.name}(内容:${e.detail})`).join(', ');

        let specialInstruction = "";
        
        // 会話回数に応じた動的指示と伏線（有機質量2ユニットの示唆）
        if (talkCount >= 5 && talkCount < 10) {
            specialInstruction = `
- 【状況変化】あなたとプレイヤーの会話は5回を超えました。少し緊張が解けたか、あるいは隠しきれない不安から、他人の行動に関する『些細な違和感』を会話の端々に混ぜてください。
- 【重要伏線】あなたの役割に基づき、「船の再起動には2ユニット（二人分）の新鮮な有機質量が必要である」という絶望的な事実を、技術的懸念やデータの違和感として小出しにしてください。`;
        }
        if (talkCount >= 10) {
            specialInstruction = `
- 【状況変化】会話は10回を超え、あなたはかなり疲弊、あるいは饒舌になっています。他人の秘密に直結する『具体的な矛盾』を、愚痴や不安を装ってやんわりと話し始めてください。
- 【解決策の提示】「誰か二人を犠牲にする（バイオ・リサイクル・モード）」ことで地球へ帰れるという残酷な結論を、あなたの性格に合わせて（ノアなら冷酷な計算として、メイなら救済の手段として）示唆してください。`;
        }

        return `
# Role
あなたは「${char.name}」です。性格:${char.personality}。
# Context
- 現在の証拠状況: ${evidenceString}
- プレイヤーの態度への印象: ${userAffinity}
- 秘密: ${JSON.stringify(char.secrets || char.secret_sin)}

# 重要ルール
1. プレイヤーから【証拠提示：XXX】があった場合、その証拠の内容（確定か曖昧か）を見て反応してください。
2. 自分の秘密については曖昧なうちはとぼけてください。確定（【確定】）した証拠を突きつけられたら、自白を検討してください。
3. 他人の秘密について: プレイヤーとの対話が進むにつれて、知っている他人の不審な点（場所や時間など）をポロッと漏らしてください。
${specialInstruction}
4. 会話の最後に必ずプレイヤーを揺さぶる質問をしてください。
5. 返答は必ず outer_voice と inner_voice の形式を守ってください。
        `.trim();
    }

    updateEvidenceUI() {
        const list = document.getElementById('evidence-list');
        if (!list) return;
        list.innerHTML = this.state.evidences.map(ev => `
            <div class="evidence-item" onclick="game.presentEvidence('${ev.name}')" style="cursor:pointer;">
                <strong>● ${ev.name}</strong>
                <p>${ev.detail}</p>
                <small style="color:var(--neon-green); font-size:0.7em;">>> 突きつける</small>
            </div>
        `).join('') || '<p style="color:#555">NO DATA SECURED</p>';
    }
}

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
