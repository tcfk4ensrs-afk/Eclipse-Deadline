let turn = 1;
let selectedCharId = null;
let movedChars = []; // そのラウンドで動いた人を記録
let usedLocations = []; // 探索済みの場所を記録
const inventory = new Set();
let engineerLiedAboutPod = false;

// マスターデータ
const MASTER_DATA = {
    chars: {
        engineer: { name: "ノア", lieLoc: "脱出ポッド", lieMsg: "「ポッドに異常はありません。ハッチも閉まっています」", isCulprit: true },
        captain: { name: "ハリス", lieLoc: "寝室", lieMsg: "「何もなかった。完璧に整理されていたよ」" },
        pilot: { name: "リク", lieLoc: "倉庫", lieMsg: "「ネズミか何かが暴れた跡があるが、装置は正常だ」" },
        observer: { name: "メイ", lieLoc: "操縦室", lieMsg: "「システムが不安定でログが見られないわ」" }
    },
    locations: {
        "脱出ポッド": { item: "医師の遺体", truth: "後頭部に鈍器の痕。燃料計は空。" },
        "操縦室": { item: "システムログの断片", truth: "燃料投棄ログが削除されている。" },
        "倉庫": { item: "異星の希少鉱石", truth: "操縦士が横流し用に隠していたもの。" },
        "寝室": { item: "空の酒瓶", truth: "船長が事件時に泥酔していた証拠。" },
        "トイレ": { item: "特殊グリスの汚れ", truth: "殺害現場。エンジニア用の油が残っている。" }
    }
};

/**
 * キャラクター選択
 */
function selectChar(id) {
    // 休息中（すでにこのラウンドで動いた）なら無視
    if (movedChars.includes(id)) return;

    selectedCharId = id;
    document.querySelectorAll('.char-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${id}`).classList.add('active');
}

/**
 * 探索実行
 */
async function executeInvestigate(locName) {
    if (!selectedCharId) {
        alert("要員を選択してください");
        return;
    }

    const log = document.getElementById('log-window');
    const char = MASTER_DATA.chars[selectedCharId];
    const loc = MASTER_DATA.locations[locName];

    // --- 通信演出：全ロック ---
    toggleAllControls(false);

    const loadingEntry = document.createElement('div');
    loadingEntry.className = "analyzing";
    loadingEntry.innerHTML = `>> [SENDING COMMAND] ${char.name} を ${locName} へ派遣中...`;
    log.prepend(loadingEntry);

    await new Promise(resolve => setTimeout(resolve, 3000));

    loadingEntry.classList.remove('analyzing');
    
    // --- 結果判定 ---
    let resultMsg = "";
    if (char.lieLoc === locName) {
        resultMsg = `<span style="color:#fff;">[COMMS] ${char.name}: "${char.lieMsg}"</span>`;
        if (char.isCulprit) engineerLiedAboutPod = true;
    } else {
        resultMsg = `<span style="color:var(--neon-green);">[REPORT] ${char.name}: 「${locName}にて『${loc.item}』を確認。${loc.truth}」</span>`;
        addInventory(loc.item, loc.truth);
    }
    loadingEntry.innerHTML = `<small>T${turn}: ${char.name} 報告</small><br>${resultMsg}`;

    // --- 状態更新 ---
    movedChars.push(selectedCharId); // 動いた人を追加
    usedLocations.push(locName);     // 使った場所を追加
    selectedCharId = null;
    turn++;
    
    if (turn > 5) {
        endFirstPhase();
    } else {
        document.getElementById('turn-count').innerText = turn;
        refreshUI(); // ボタンの有効・無効を再計算
    }
}

/**
 * UIの再構築（ロック判定）
 */
function refreshUI() {
    // 1. 全員動いたか、または5ターン目（最終ターン）ならロック解除
    if (movedChars.length >= 4 || turn === 5) {
        movedChars = []; 
        // 5ターン目なら場所のロックも解除する特別な演出
        if (turn === 5) usedLocations = []; 
    }

    // 2. キャラクターボタンの更新
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

    // 3. 場所ボタンの更新
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

    if (engineerLiedAboutPod && !inventory.has("医師の遺体")) {
        finalHtml = "<div style='color:var(--error-red); text-align:center;'><h2>MISSION FAILED</h2><p>ノアがポッドで逃亡。船体構造が崩壊しました。</p></div>";
        setTimeout(() => { location.href = "badend1.html"; }, 5000);
    } else {
        finalHtml = "<div style='color:var(--warning-yellow); text-align:center;'><h2>PHASE 01 COMPLETE</h2><p>重大な矛盾を検出。個別尋問を開始します。</p></div>";
        const btn = document.createElement('button');
        btn.className = "char-btn active";
        btn.style.justifyContent = "center";
        btn.innerText = ">> 尋問プロトコルを承認する";
        btn.onclick = () => {
            // インベントリを保存して次へ
            localStorage.setItem('securedEvidence', JSON.stringify(Array.from(inventory)));
            location.href = "detective.html";
        };
        log.prepend(btn);
    }
    const endContainer = document.createElement('div');
    endContainer.innerHTML = `<hr>${finalHtml}`;
    log.prepend(endContainer);
}

// 初期化（初回ロード時）
window.onload = refreshUI;
