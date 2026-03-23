let turn = 1;
let selectedCharId = null;
const inventory = new Set();
let engineerLiedAboutPod = false;

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

function selectChar(id, btn) {
    selectedCharId = id;
    document.querySelectorAll('.char-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

async function executeInvestigate(locName) {
    if (!selectedCharId) return alert("要員を選択してください");
    if (turn > 5) return;

    const log = document.getElementById('log-window');
    const char = MASTER_DATA.chars[selectedCharId];
    const loc = MASTER_DATA.locations[locName];
    let resultMsg = "";

    // 1. 嘘の判定
    if (char.lieLoc === locName) {
        resultMsg = `[通信] ${char.name}: ${char.lieMsg}`;
        if (char.isCulprit) engineerLiedAboutPod = true;
    } 
    // 2. 真実の発見
    else {
        resultMsg = `[報告] ${char.name}: 「${locName}にて『${loc.item}』を確保。${loc.truth}」`;
        addInventory(loc.item, loc.truth);
    }

    // ログ更新
    const entry = document.createElement('div');
    entry.innerHTML = `<hr><small>T${turn}: ${char.name} → ${locName}</small><br>${resultMsg}`;
    log.prepend(entry);

    // ターン進行
    turn++;
    if (turn > 5) {
        endFirstPhase();
    } else {
        document.getElementById('turn-count').innerText = turn;
    }
}

function addInventory(name, detail) {
    inventory.add(name);
    const list = document.getElementById('evidence-list');
    if (inventory.size === 1) list.innerHTML = "";
    
    const div = document.createElement('div');
    div.className = "evidence-item";
    div.innerHTML = `<strong>${name}</strong><br><small>${detail}</small>`;
    list.appendChild(div);
}

function endFirstPhase() {
    const log = document.getElementById('log-window');
    let finalMsg = "";

    if (engineerLiedAboutPod && !inventory.has("医師の遺体")) {
        finalMsg = "<h2 style='color:red;'>GAME OVER</h2>エンジニアがポッドで脱出。船は崩壊しました。";
        setTimeout(() => { location.href = "badend1.html"; }, 3000);
    } else {
        finalMsg = "<h2 style='color:#ffff00;'>PHASE 01 COMPLETE</h2>死体または矛盾を発見しました。第二フェーズ（尋問）へ移行します。";
        const btn = document.createElement('button');
        btn.innerText = ">> 第二フェーズを開始する";
        btn.className = "start-link";
        btn.onclick = () => { location.href = "detective.html"; };
        log.prepend(btn);
    }
    const endLog = document.createElement('div');
    endLog.innerHTML = finalMsg;
    log.prepend(endLog);
}
