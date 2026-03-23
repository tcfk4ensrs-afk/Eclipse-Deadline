let turn = 1;
let selectedCharId = null;
let lastCharId = null; // 連続使用制限用フラグ
const inventory = new Set();
let engineerLiedAboutPod = false;

// 罪と嘘のマスターデータ
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
 * キャラクター選択処理
 */
function selectChar(id) {
    // 休息中のキャラはクリック無効（ボタン側でも制御しているが念のため）
    if (id === lastCharId) return;

    selectedCharId = id;
    
    // UI反映
    document.querySelectorAll('.char-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${id}`).classList.add('active');
}

/**
 * UIの更新（休息中ラベルやボタン無効化の切り替え）
 */
function updateCharUI() {
    const ids = ['engineer', 'captain', 'pilot', 'observer'];
    ids.forEach(id => {
        const btn = document.getElementById(`btn-${id}`);
        const status = document.getElementById(`status-${id}`);
        
        if (id === lastCharId) {
            btn.disabled = true;
            btn.classList.remove('active');
            status.innerText = "RECHARGING";
            status.className = "status-label status-recharging";
        } else {
            btn.disabled = false;
            status.innerText = "AVAILABLE";
            status.className = "status-label status-available";
        }
    });
}

/**
 * 探索実行（修正版：特定の一人のみ休息、他は復帰）
 */
async function executeInvestigate(locName) {
    if (!selectedCharId) {
        alert("要員を選択してください");
        return;
    }

    const log = document.getElementById('log-window');
    const char = MASTER_DATA.chars[selectedCharId];
    const loc = MASTER_DATA.locations[locName];

    // --- 通信開始演出：すべての操作を一旦ロック ---
    toggleAllControls(false);

    const loadingEntry = document.createElement('div');
    loadingEntry.className = "analyzing";
    loadingEntry.innerHTML = `>> [SENDING COMMAND] ${char.name} を ${locName} へ派遣中...`;
    log.prepend(loadingEntry);

    // 3秒待機
    await new Promise(resolve => setTimeout(resolve, 3000));

    loadingEntry.classList.remove('analyzing');
    
    // --- 結果判定 ---
    let resultMsg = "";
    if (char.lieLoc === locName) {
        resultMsg = `<span style="color:#fff;">[COMMS] ${char.name}: "${char.lieMsg}"</span>`;
        if (char.isCulprit) engineerLiedAboutPod = true;
    } else {
        resultMsg = `<span style="color:var(--neon-green);">[REPORT] ${char.name}: 「${locName}にて『${loc.item}』を確保。${loc.truth}」</span>`;
        addInventory(loc.item, loc.truth);
    }
    loadingEntry.innerHTML = `<small>T${turn}: ${char.name} 報告</small><br>${resultMsg}`;

    // --- 状態更新 ---
    lastCharId = selectedCharId; // 今回派遣した人を記録
    selectedCharId = null;       // 選択状態を解除
    turn++;
    
    if (turn > 5) {
        endFirstPhase();
    } else {
        document.getElementById('turn-count').innerText = turn;
        
        // --- ここでロックを解除 ---
        updateCharUI(); // キャラクターボタンの状態を更新（前回の人のみDisabledにする）
        document.querySelectorAll('.loc-btn').forEach(btn => btn.disabled = false); // 場所ボタンをすべて有効化
    }
}

/**
 * キャラクターUIの更新（派遣した1人のみRECHARGINGにする）
 */
function updateCharUI() {
    const ids = ['engineer', 'captain', 'pilot', 'observer'];
    ids.forEach(id => {
        const btn = document.getElementById(`btn-${id}`);
        const status = document.getElementById(`status-${id}`);
        
        if (id === lastCharId) {
            // 直前に動いたキャラだけをロック
            btn.disabled = true;
            btn.classList.remove('active');
            status.innerText = "RECHARGING";
            status.className = "status-label status-recharging";
        } else {
            // それ以外のキャラは解放
            btn.disabled = false;
            status.innerText = "AVAILABLE";
            status.className = "status-label status-available";
        }
    });
}

/**
 * すべてのボタンを一時的にロック/解除する
 */
function toggleAllControls(enable) {
    // 全場所ボタンと全キャラボタンを制御
    document.querySelectorAll('.loc-btn, .char-btn').forEach(btn => btn.disabled = !enable);
}

/**
 * インベントリへの追加
 */
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

/**
 * 第一フェーズ終了判定
 */
function endFirstPhase() {
    toggleAllControls(false); // 全操作終了
    const log = document.getElementById('log-window');
    let finalHtml = "";

    // 失敗判定：犯人にポッドで嘘をつかせ、かつ誰も死体を見つけていない
    if (engineerLiedAboutPod && !inventory.has("医師の遺体")) {
        finalHtml = "<div style='color:var(--error-red); text-align:center;'><h2>MISSION FAILED</h2><p>エンジニア：ノアによる「脱出ポッド」での逃亡を確認。<br>外部ハッチの爆破により船体構造が崩壊しました。</p></div>";
        setTimeout(() => { location.href = "badend1.html"; }, 5000);
    } else {
        finalHtml = "<div style='color:var(--warning-yellow); text-align:center;'><h2>PHASE 01 COMPLETE</h2><p>全要員の報告を完了。船内ログに重大な矛盾が検出されました。<br>これより「第ニフェーズ：個別尋問」を開始します。</p></div>";
        const btn = document.createElement('button');
        btn.className = "char-btn active";
        btn.style.justifyContent = "center";
        btn.innerText = ">> 尋問プロトコルを承認する";
        btn.onclick = () => location.href = "detective.html";
        log.prepend(btn);
    }
    
    const endContainer = document.createElement('div');
    endContainer.innerHTML = `<hr>${finalHtml}`;
    log.prepend(endContainer);
}
