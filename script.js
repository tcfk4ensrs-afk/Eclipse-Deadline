/**
 * PROJECT: ECLIPSE DEADLINE - Phase 01: Sector Investigation
 */

// --- グローバル変数の定義 ---
let turn = 1;
let selectedCharId = null;
let movedChars = []; 
let usedLocations = []; 
const inventory = []; // オブジェクト形式で保存するため配列に変更
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
            truth: "医師の遺体が隠されていた。後頭部に鈍器の痕がある。"
        },
        "操縦室": { 
            item: "ノイズ混じりの記録データ", 
            observation: "14:15前後の記録に、意図的な電磁パルスを受けたような激しいノイズが走っている。",
            truth: "削除されたログの復元に成功。14:15にポッドへ入る『2つの人影』が記録されていた。"
        },
        "倉庫": { 
            item: "不自然に軽いコンテナ", 
            observation: "中身は空っぽに見える。微かな金属音だけが響く。",
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
    }
};

/**
 * 要員選択
 */
window.selectChar = function(id) {
    console.log("--- 要員選択: " + id + " ---");

    if (movedChars.includes(id)) {
        console.warn(id + " はリチャージ中。");
        return;
    }

    selectedCharId = id;

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

    toggleAllControls(false);

    const loadingEntry = document.createElement('div');
    loadingEntry.className = "analyzing";
    loadingEntry.innerHTML = `>> [スキャン中] ${char.name} が ${locName} を調査中...`;
    log.prepend(loadingEntry);

    // 演出用の待ち時間
    await new Promise(resolve => setTimeout(resolve, 2000));
    loadingEntry.classList.remove('analyzing');
    
    let resultMsg = "";

    // シナリオ分岐ロジック
    if (locName === "エンジンルーム") {
        resultMsg = `[報告] ${char.name}: 「エネルギーログに不整合を確認。何かが『排出』されています。」`;
        addInventory(loc.item, loc.observation);
    } 
    else if (char.isCulprit && locName === "脱出ポッド") {
        if (bodyDiscovered) {
            resultMsg = `[報告] ${char.name}: 「……隠し通せませんか。ハッチの中に遺体があります。」`;
            addInventory(loc.item, loc.observation);
        } else {
            resultMsg = `<span style="color:#fff;">[報告] ${char.name}: "${char.lieMsg}"</span>`;
            engineerLiedAboutPod = true;
        }
    }
    else if (char.lieLoc === locName) {
        resultMsg = `<span style="color:#fff;">[報告] ${char.name}: "${char.lieMsg}"</span>`;
    }
    else {
        // 正常な発見（曖昧な観測事実を表示）
        resultMsg = `<span style="color:var(--neon-green);">[報告] ${char.name}: 「${locName}で『${loc.item}』を確保。${loc.observation}」</span>`;
        if (locName === "脱出ポッド") bodyDiscovered = true;
        addInventory(loc.item, loc.observation);
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

function refreshUI() {
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

    document.querySelectorAll('.loc-btn').forEach(btn => {
        const locName = btn.innerText;
        btn.disabled = usedLocations.includes(locName);
    });
}

function toggleAllControls(enable) {
    document.querySelectorAll('.loc-btn, .char-btn').forEach(btn => btn.disabled = !enable);
}

/**
 * インベントリ追加ロジック
 * 名前と詳細をセットで保存
 */
function addInventory(name, detail) {
    // 重複チェック
    const alreadyHas = inventory.some(item => item.name === name);
    if (alreadyHas) return;

    inventory.push({ name, detail });
    
    const list = document.getElementById('evidence-list');
    if (inventory.length === 1) list.innerHTML = "";
    
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
        finalHtml = "<div style='color:var(--error-red); text-align:center;'><h2>MISSION FAILED</h2><p>致命的な証拠を見逃しました。犯人は逃亡準備を終えています。</p></div>";
        setTimeout(() => { location.href = "bad-end.html"; }, 4000);
    } else {
        finalHtml = "<div style='color:var(--warning-yellow); text-align:center;'><h2>INVESTIGATION COMPLETE</h2><p>証拠をアーカイブしました。個別尋問プロトコルを開始します。</p></div>";
        const btn = document.createElement('button');
        btn.className = "char-btn active";
        btn.style.width = "100%";
        btn.style.justifyContent = "center";
        btn.style.marginTop = "15px";
        btn.innerText = ">> 尋問フェーズへ移行";
        btn.onclick = () => {
            // 第2フェーズのためにインベントリを保存
            localStorage.setItem('securedEvidence', JSON.stringify(inventory));
            location.href = "detective.html";
        };
        log.prepend(btn);
    }
    const endContainer = document.createElement('div');
    endContainer.innerHTML = `<hr>${finalHtml}`;
    log.prepend(endContainer);
}

window.onload = refreshUI;
