let turn = 1;
let selectedCharId = null;
let movedChars = []; 
let usedLocations = []; 
const inventory = new Set();
let engineerLiedAboutPod = false;
let bodyDiscovered = false; 

const MASTER_DATA = {
    chars: {
        engineer: { name: "ノア", lieLoc: "脱出ポッド", lieMsg: "「ポッドに異常はありません。ハッチも閉まっています」", isCulprit: true },
        captain: { name: "ハリス", lieLoc: "寝室", lieMsg: "「何もなかった。完璧に整理されていたよ」" },
        pilot: { name: "リク", lieLoc: "倉庫", lieMsg: "「ネズミか何かが暴れた跡があるが、装置は正常だ」" },
        observer: { name: "メイ", lieLoc: "操縦室", lieMsg: "「システムが不安定でログが見られないわ」" }
    },
    locations: {
        "脱出ポッド": { item: "医師の遺体", truth: "後頭部に鈍器の痕。燃料計は空。このままじゃ燃料がなくて使えない。" },
        "操縦室": { item: "システムログの断片", truth: "燃料投棄ログが削除されている。" },
        "倉庫": { item: "食料の入っていた袋", truth: "倉庫には食べ物も飲み物も何一つない。備蓄されていたはずなのに…。" },
        "寝室": { item: "空の酒瓶", truth: "誰かがここで酒を飲んでいたみたいだ。この船に酒なんて積んでいないのに……" },
        "エンジンルーム": { item: "バイオ・コンバーターの稼働ログ", truth: "直近で大量の『有機燃料』が排出された記録。異様な死臭が漂っている。" }
    }
};

async function executeInvestigate(locName) {
    if (!selectedCharId) {
        alert("要員を選択してください");
        return;
    }

    const log = document.getElementById('log-window');
    const char = MASTER_DATA.chars[selectedCharId];
    const loc = MASTER_DATA.locations[locName];

    toggleAllControls(false);

    const loadingEntry = document.createElement('div');
    loadingEntry.className = "analyzing";
    loadingEntry.innerHTML = `>> [SENDING COMMAND] ${char.name} を ${locName} へ派遣中...`;
    log.prepend(loadingEntry);

    await new Promise(resolve => setTimeout(resolve, 3000));

    loadingEntry.classList.remove('analyzing');
    
    let resultMsg = "";

    // --- ロジック分岐 ---
    
    // 1. エンジンルームの特殊演出（全員共通）
    if (locName === "エンジンルーム") {
        resultMsg = `[REPORT] ${char.name}: 「エンジンルームを調査。……この最新の[バイオ・コンバーター]、様子がおかしいです。有機燃料が完全に空で、ログには強制排出の記録が。……それに、鼻を突くような死臭が漂っています。」`;
        addInventory(loc.item, loc.truth);
    } 
    // 2. エンジニアが脱出ポッドへ行く場合
    else if (char.isCulprit && locName === "脱出ポッド") {
        if (bodyDiscovered) {
            resultMsg = `[REPORT] ${char.name}: 「……報告します。ポッド内に医師の遺体を確認。後頭部に鈍器のような痕があります。燃料計は……ゼロ。完全に空です。」`;
            addInventory(loc.item, loc.truth);
        } else {
            resultMsg = `<span style="color:#fff;">[COMMS] ${char.name}: "${char.lieMsg}"</span>`;
            engineerLiedAboutPod = true;
        }
    }
    // 3. その他のキャラが自分の「嘘の場所」に行く場合
    else if (char.lieLoc === locName) {
        resultMsg = `<span style="color:#fff;">[COMMS] ${char.name}: "${char.lieMsg}"</span>`;
    }
    // 4. 通常の発見
    else {
        resultMsg = `<span style="color:var(--neon-green);">[REPORT] ${char.name}: 「${locName}にて『${loc.item}』を確認。${loc.truth}」</span>`;
        if (locName === "脱出ポッド") bodyDiscovered = true;
        addInventory(loc.item, loc.truth);
    }

    loadingEntry.innerHTML = `<small>T${turn}: ${char.name} 報告</small><br>${resultMsg}`;

    // 状態更新
    movedChars.push(selectedCharId);
    usedLocations.push(locName);
    selectedCharId = null;
    turn++;
    
    if (turn > 5) {
        endFirstPhase();
    } else {
        document.getElementById('turn-count').innerText = turn;
        refreshUI();
    }
}

/* 他の関数（refreshUI, toggleAllControls, addInventory, endFirstPhase）は変更なし */

// refreshUI, toggleAllControls, addInventory, endFirstPhase は前回と同様
// (インベントリに保存する部分を忘れずに)

function refreshUI() {
    if (movedChars.length >= 4 || turn === 5) {
        movedChars = []; 
        if (turn === 5) usedLocations = []; 
    }

    const ids = ['engineer', 'captain', 'pilot', 'observer'];
    ids.forEach(id => {
        const btn = document.getElementById(`btn-${id}`);
        const status = document.getElementById(`status-${id}`);
        if (movedChars.includes(id)) {
            btn.disabled = true;
            status.innerText = "LOCKED";
            status.className = "status-label status-recharging";
        } else {
            btn.disabled = false;
            status.innerText = "AVAILABLE";
            status.className = "status-label status-available";
        }
        btn.classList.remove('active');
    });

    document.querySelectorAll('.loc-btn').forEach(btn => {
        const locName = btn.innerText;
        if (usedLocations.includes(locName)) {
            btn.disabled = true;
        } else {
            btn.disabled = false;
        }
    });
}

function toggleAllControls(enable) {
    document.querySelectorAll('.loc-btn, .char-btn').forEach(btn => btn.disabled = !enable);
}

function addInventory(name, detail) {
    if (inventory.has(name)) return;
    inventory.add(name);
    const list = document.getElementById('evidence-list');
    if (inventory.size === 1) list.innerHTML = "";
    const div = document.createElement('div');
    div.className = "evidence-item";
    div.innerHTML = `<strong>● ${name}</strong><p>${detail}</p>`;
    list.appendChild(div);
}

function endFirstPhase() {
    toggleAllControls(false);
    const log = document.getElementById('log-window');
    let finalHtml = "";

    // 勝利条件判定（死体が見つかっているか、かつノアが逃げていないか）
    if (engineerLiedAboutPod && !bodyDiscovered) {
        finalHtml = "<div style='color:var(--error-red); text-align:center;'><h2>MISSION FAILED</h2><p>ノアがポッドで逃亡。船体構造が崩壊しました。</p></div>";
        setTimeout(() => { location.href = "badend1.html"; }, 5000);
    } else {
        finalHtml = "<div style='color:var(--warning-yellow); text-align:center;'><h2>PHASE 01 COMPLETE</h2><p>重大な矛盾を検出。個別尋問プロトコルを開始します。</p></div>";
        const btn = document.createElement('button');
        btn.className = "char-btn active";
        btn.style.justifyContent = "center";
        btn.innerText = ">> 尋問プロトコルを承認する";
        btn.onclick = () => {
            localStorage.setItem('securedEvidence', JSON.stringify(Array.from(inventory)));
            location.href = "detective.html";
        };
        log.prepend(btn);
    }
    const endContainer = document.createElement('div');
    endContainer.innerHTML = `<hr>${finalHtml}`;
    log.prepend(endContainer);
}

window.onload = refreshUI;
