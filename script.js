// --- グローバル変数の定義 ---
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
        "脱出ポッド": { 
            item: "医師の遺体", 
            observation: "医師の遺体が隠されていた",
            truth: "医師の遺体が隠されていた。後頭部に鈍器の痕があり、内部から無理やりロックされている。"
        },
        "操縦室": { 
            item: "ノイズ混じりの記録データ", 
            observation: "14:15前後の記録に、意図的な電磁パルスを受けたような激しいノイズが走っている。",
            truth: "削除されたログの復元に成功。14:15にポッドへ入る『2つの人影』が記録されていた。"
        },
        "倉庫": { 
            item: "不自然に軽いコンテナ", 
            observation: "リクが『重い荷物を隠した』と言っていた場所だが、中身は空っぽに見える。微かな金属音だけが響く。",
            truth: "リクが隠したはずの鉱石と食料が全て消えている。ノアによって宇宙へ廃棄された形跡がある。"
        },
        "寝室": { 
            item: "ラベルのない液体瓶", 
            observation: "ベッドの下に転がっていた瓶。中には無色透明の液体が僅かに残っている。",
            truth: "バイオ燃料装置を改造して密造された高純度エタノール。ハリスの指紋が検出された。"
        },
        "エンジンルーム": { 
            item: "不整合なエネルギーログ", 
            observation: "12:30頃、メインエンジンとは別の経路で一時的に大量の質量が排出された記録がある。",
            truth: "12:30に倉庫の全物資を『燃料パージ』として宇宙へ強制投棄した確定ログ。"
        }
    };

/**
 * 【重要】windowオブジェクトに登録することでHTMLから呼べるようにする
 */
window.selectChar = function(id) {
    console.log("--- 要員選択: " + id + " ---");

    // 派遣済み（LOCKED）なら何もしない
    if (movedChars.includes(id)) {
        console.warn(id + " はロック中。");
        return;
    }

    selectedCharId = id;

    // UIの選択表示をリセットして、選んだものだけ光らせる
    const allButtons = document.querySelectorAll('.char-btn');
    allButtons.forEach(btn => btn.classList.remove('active'));

    const targetBtn = document.getElementById('btn-' + id);
    if (targetBtn) {
        targetBtn.classList.add('active');
    }
    
    document.getElementById('log-window').innerHTML += `<br>>> 要員 [${id.toUpperCase()}] が待機中。`;
};

/**
 * 探索実行
 */
window.executeInvestigate = async function(locName) {
    if (!selectedCharId) {
        alert("まず左パネルから要員を選択してください。");
        return;
    }

    const log = document.getElementById('log-window');
    const char = MASTER_DATA.chars[selectedCharId];
    const loc = MASTER_DATA.locations[locName];

    // 全ボタンを操作不能にする（二重送信防止）
    toggleAllControls(false);

    const loadingEntry = document.createElement('div');
    loadingEntry.className = "analyzing";
    loadingEntry.innerHTML = `>> [派遣中] ${char.name} が ${locName} をスキャン中...`;
    log.prepend(loadingEntry);

    // 演出用の待ち時間
    await new Promise(resolve => setTimeout(resolve, 2500));
    loadingEntry.classList.remove('analyzing');
    
    let resultMsg = "";

    // シナリオ分岐ロジック
    if (locName === "エンジンルーム") {
        resultMsg = `[報告] ${char.name}: 「エンジンルームを確認。バイオ・コンバーターが強制排出されています。中身は……空です。」`;
        addInventory(loc.item, loc.truth);
    } 
    else if (char.isCulprit && locName === "脱出ポッド") {
        if (bodyDiscovered) {
            resultMsg = `[報告] ${char.name}: 「……遺体を確認。燃料も抜かれています。逃げ場はありません。」`;
            addInventory(loc.item, loc.truth);
        } else {
            resultMsg = `<span style="color:#fff;">[報告] ${char.name}: "${char.lieMsg}"</span>`;
            engineerLiedAboutPod = true;
        }
    }
    else if (char.lieLoc === locName) {
        resultMsg = `<span style="color:#fff;">[報告] ${char.name}: "${char.lieMsg}"</span>`;
    }
    else {
        resultMsg = `<span style="color:var(--neon-green);">[報告] ${char.name}: 「${locName}で『${loc.item}』を発見。${loc.truth}」</span>`;
        if (locName === "脱出ポッド") bodyDiscovered = true;
        addInventory(loc.item, loc.truth);
    }

    loadingEntry.innerHTML = `<small>T${turn}: ${char.name} の報告</small><br>${resultMsg}`;

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
};

/**
 * ボタンの有効/無効切り替え
 */
function refreshUI() {
    // 4人全員使ったらリセット
    if (movedChars.length >= 4) {
        movedChars = []; 
    }

    const ids = ['engineer', 'captain', 'pilot', 'observer'];
    ids.forEach(id => {
        const btn = document.getElementById(`btn-${id}`);
        const status = document.getElementById(`status-${id}`);
        if (!btn) return;

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

    // 場所ボタンのロック
    document.querySelectorAll('.loc-btn').forEach(btn => {
        const locName = btn.innerText;
        btn.disabled = usedLocations.includes(locName);
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

    if (engineerLiedAboutPod && !bodyDiscovered) {
        finalHtml = "<div style='color:var(--error-red); text-align:center;'><h2>MISSION FAILED</h2><p>犯人の隠蔽工作を阻止できませんでした。</p></div>";
        setTimeout(() => { location.href = "badend1.html"; }, 5000);
    } else {
        finalHtml = "<div style='color:var(--warning-yellow); text-align:center;'><h2>PHASE 01 COMPLETE</h2><p>証拠を保存しました。個別尋問へ移行します。</p></div>";
        const btn = document.createElement('button');
        btn.className = "char-btn active";
        btn.style.justifyContent = "center";
        btn.innerText = ">> 尋問を開始する";
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

// 初期化
window.onload = refreshUI;
