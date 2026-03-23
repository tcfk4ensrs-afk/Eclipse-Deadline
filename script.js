let turn = 1;
let selectedCharId = null;
let lastCharId = null; // 連続制限用
const inventory = new Set();
let engineerLiedAboutPod = false;

// 固定データ
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

// キャラクター選択
function selectChar(id) {
    selectedCharId = id;
    document.querySelectorAll('.char-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${id}`).classList.add('active');
}

// 探索実行（メインロジック）
async function executeInvestigate(locName) {
    if (!selectedCharId) return alert("要員を選択してください");
    if (selectedCharId === lastCharId) return alert("この要員は休息中です。別の要員を選択してください。");
    if (turn > 5) return;

    const log = document.getElementById('log-window');
    const char = MASTER_DATA.chars[selectedCharId];
    const loc = MASTER_DATA.locations[locName];

    // ボタン無効化（連打防止）
    toggleUI(false);

    // 通信待機演出
    const loadingEntry = document.createElement('div');
    loadingEntry.className = "analyzing";
    loadingEntry.innerHTML = `<hr>>> [SENDING COMMAND] ${char.name} を ${locName} へ派遣中...`;
    log.prepend(loadingEntry);

    // 3秒間のウェイト
    await new Promise(resolve => setTimeout(resolve, 3000));

    loadingEntry.classList.remove('analyzing');
    
    let resultMsg = "";
    if (char.lieLoc === locName) {
        // 嘘をつく場合
        resultMsg = `<span style="color:#fff;">[COMMS] ${char.name}: "${char.lieMsg}"</span>`;
        if (char.isCulprit) engineerLiedAboutPod = true;
    } else {
        // 真実を発見した場合
        resultMsg = `<span style="color:var(--neon-green);">[REPORT] ${char.name}: 「${locName}にて『${loc.item}』を確認。${loc.truth}」</span>`;
        addInventory(loc.item, loc.truth);
    }

    loadingEntry.innerHTML = `<hr><small>TURN ${turn}: ${char.name} → ${locName}</small><br>${resultMsg}`;

    // 状態更新
    lastCharId = selectedCharId;
    turn++;
    
    if (turn > 5) {
        endFirstPhase();
    } else {
        document.getElementById('turn-count').innerText = turn;
        selectedCharId = null; // 選択解除
        toggleUI(true);
    }
}

// UIの有効/無効切り替え
function toggleUI(enable) {
    document.querySelectorAll('.loc-btn').forEach(btn => btn.disabled = !enable);
    document.querySelectorAll('.char-btn').forEach(btn => {
        const id = btn.id.replace('btn-', '');
        if (enable) {
            btn.disabled = (id === lastCharId); // 前回の人は無効のまま
        } else {
            btn.disabled = true;
        }
        btn.classList.remove('active');
    });
}

function addInventory(name, detail) {
    if (inventory.has(name)) return;
    inventory.add(name);
    
    const list = document.getElementById('evidence-list');
    if (inventory.size === 1) list.innerHTML = "";
    
    const item = document.createElement('div');
    item.className = "evidence-item";
    item.innerHTML = `<strong>● ${name}</strong><p>${detail}</p>`;
    list.appendChild(item);
}

function endFirstPhase() {
    const log = document.getElementById('log-window');
    let finalHtml = "";

    // バッドエンド判定
    if (engineerLiedAboutPod && !inventory.has("医師の遺体")) {
        finalHtml = "<h2 style='color:red; text-align:center;'>CRITICAL ERROR</h2><p>エンジニアがポッドで脱出しました。船体は大破し、ミッションは失敗しました。</p>";
        setTimeout(() => { location.href = "badend1.html"; }, 4000);
    } else {
        finalHtml = "<h2 style='color:var(--warning-yellow); text-align:center;'>PHASE 01 COMPLETE</h2><p>捜査エリアに重大な矛盾を確認。第二フェーズ：個別尋問へ移行します。</p>";
        const nextBtn = document.createElement('button');
        nextBtn.className = "char-btn active";
        nextBtn.style.textAlign = "center";
        nextBtn.innerText = ">> 尋問プロトコルを開始する";
        nextBtn.onclick = () => location.href = "detective.html";
        log.prepend(nextBtn);
    }
    
    const endDiv = document.createElement('div');
    endDiv.innerHTML = `<hr>${finalHtml}`;
    log.prepend(endDiv);
}
