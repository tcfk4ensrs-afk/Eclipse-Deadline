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

        // 真実データ：確定時にUIに表示される内容（新アイテム2つを追加）
        this.truthReference = {
            "医師の遺体": "後頭部に鈍器の痕があり、ノアが『質量』として再利用するためにポッドへ隠した決定的な証拠。",
            "ノイズ混じりの記録データ": "削除ログの復元に成功。14:15にノアと医師がポッドへ入る映像が記録されていた。",
            "不自然に軽いコンテナ": "備蓄物資はリクが盗む前に、ノアによってエンジンの『バイオ・リサイクル』に転用・廃棄されていた。",
            "ラベルのない液体瓶": "密造された酒。ハリス船長が依存症で、医師に解雇を突きつけられていた動機を示す証拠。",
            "コンテナ奥の断線したコード": "リクが12:30に切断。多額の借金があり、医師から密輸を強要されていた彼が監視を逃れるための工作跡。",
            "バイオ・リサイクル・モード": "船を地球へ帰すには、人間2人分の新鮮な有機質量をエネルギーに変えねばならないという残酷な仕様。"
        };
    }

    async init() {
        try {
            console.log("System Initializing...");
            await this.loadAllCharacters();
            this.renderCharacterList();
            this.updateEvidenceUI();
            
            const statusMsg = document.getElementById('api-status-msg');
            const keyInput = document.getElementById('api-key-input');
            const savedKey = sessionStorage.getItem('GEMINI_API_KEY');

            if (savedKey) {
                if (statusMsg) {
                    statusMsg.innerText = ">> APIキー構成済み。通信チャネルは確立されています。";
                    statusMsg.style.color = "var(--neon-green)";
                }
                if (keyInput) keyInput.value = "********"; 
            } else {
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

    /**
     * AIの回答テキストをスキャンし、特定のキーワードが含まれていれば証拠を更新する
     */
    checkTruthUpdate(aiText) {
        const currentId = this.currentCharacterId;
        const revelationTriggers = [
            { key: "ラベルのない液体瓶", informant: "pilot", triggers: ["酒", "依存症", "事故", "船長", "飲んで"] },
            { key: "不自然に軽いコンテナ", informant: "captain", triggers: ["軽い", "空", "リク", "エンジン", "質量", "パージ"] },
            { key: "コンテナ奥の断線したコード", informant: "observer", triggers: ["借金", "脅迫", "金", "リク", "コード", "切断"] },
            { key: "ノイズ混じりの記録データ", informant: "pilot", triggers: ["メイ", "ログ", "操作", "消去"] },
            { key: "医師の遺体", informant: "observer", triggers: ["ノア", "質量", "二人分", "リサイクル", "ポッド", "運び込"] },
            { key: "バイオ・リサイクル・モード", informant: "engineer", triggers: ["質量", "二人分", "2ユニット", "犠牲", "生贄", "計算"] }
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
                this.appendMessage('system', `[DATA UPDATED] 証拠更新: 「${name}」の真相が判明しました。`);
                this.flashEffect();
            }
        }
    }

    flashEffect() {
        const main = document.querySelector('.main-panel');
        if (main) {
            main.style.transition = "background-color 0.2s";
            main.style.backgroundColor = "rgba(0, 255, 65, 0.15)";
            setTimeout(() => { main.style.backgroundColor = "rgba(0, 5, 0, 0.9)"; }, 200);
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
        const evidenceString = this.state.evidences.map(e => `${e.name || e.item}(状態:${e.detail.includes('【確定】') ? '【確定】済み' : '未確定'})`).join(', ');

        const gossipDatabase = {
            captain: { 
                others: "リクは借金まみれで医師から密輸の協力を強要されていた。メイは政府に追われている過激な逃亡犯らしい。",
                deep: "コンテナが軽いのは、ノアがエンジンの再起動に備蓄を転用したからだ。あいつは狂っている。"
            },
            pilot: { 
                others: "船長は重度のアルコール依存症で、前回の航海で事故を起こしかけた。メイがシステムログを弄っているのを見た。",
                deep: "医師は俺の借金をネタに「密輸」をバラされたくなければ言うことを聞けと迫ってきた。あいつさえいなければ……。"
            },
            observer: { 
                others: "リクの銀行口座は空よ。ハリス船長はアルコール依存を医師に診断され、解雇の危機にあった。二人とも医師を殺す動機があるわ。",
                deep: "この船を加速させるには2人分の『新鮮な有機質量』が必要。ノアは最初から誰かを犠牲にするつもりよ。"
            },
            engineer: { 
                others: "ハリスは酒浸りの無能。リクは借金まみれの小悪党。メイはただの狂信者。医師？ 彼は論理的でないから排除された、それだけです。",
                deep: "エンジンには『燃料』が必要です。適合するのは人間2ユニット分。計算は完璧ですよ。"
            }
        };

        const mySecret = gossipDatabase[char.id] || {};

        return `
# Role
あなたは「${char.name}」です。
# ミッション
- 自分の罪は【確定】証拠が出るまでとぼけ、他人を犯人に仕立てるよう誘導してください。
- 証拠の「状態」を確認し、未確定ならとぼけ、確定済みなら観念したように詳細を話してください。

# 応答ロジック
1. **未確定の証拠**を提示された時：
   否定しつつ、代わりに「${mySecret.others}」から情報を出し、他人の不審な点を強調してください。
2. **【確定】済みの証拠**を提示された時：
   言い逃れを諦め、その背景（医師との因縁や「${mySecret.deep}」）を具体的に白状してください。
3. **エンジンの真実**：
   会話が進めば、生還には「人間2人分の生贄」が必要という冷酷な仕様について触れてください。

# 状況
- 現在の証拠: ${evidenceString}
- あなたの知識: ${JSON.stringify(char.timeline_memory)}
- 他人の秘密: ${mySecret.others}

# 形式
outer_voice: [セリフと描写]
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
            const isConfirmed = ev.detail.includes("【確定】");
            return `
                <div class="evidence-item" onclick="game.presentEvidence('${name}')" 
                     style="cursor:pointer; border:1px solid ${isConfirmed ? 'var(--neon-green)' : '#333'}; 
                            margin-bottom:5px; padding:8px; border-radius:4px; 
                            background:${isConfirmed ? 'rgba(0, 255, 65, 0.1)' : 'rgba(255,255,255,0.05)'};">
                    <strong style="color:${isConfirmed ? 'var(--neon-green)' : '#888'};">● ${name}</strong>
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
