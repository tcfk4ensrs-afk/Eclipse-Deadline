/**
 * Project: Eclipse Deadline - Phase 01 Script
 */

let turn = 1;
let selectedCharId = null;
let movedChars = []; // このラウンドで動いた人を記録
let usedLocations = []; // 探索済みの場所を記録
const inventory = new Set();
let engineerLiedAboutPod = false;
let bodyDiscovered = false; // 医師の遺体を発見したかどうかのフラグ

// 罪と嘘のマスターデータ
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
        "エンジンルーム": { item: "バイオ・コンバーターの稼働ログ", truth: "直近で大量の『有機燃料』が排出された記録。" }
    }
};

/**
 * キャラクター選択処理
 */
function selectChar(id) {
    // すでにこのラウンドで動いたキャラは選択不可
    if (movedChars.includes(id)) return;

    selectedCharId = id;
    
    // UI反映
    document.querySelectorAll('.char-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${id}`).classList.add('active');
}

/**
 * 探索実行（メインロジック）
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

    // 3秒の通信ウェイト（味付け）
    await new Promise(resolve => setTimeout(resolve, 3000));

    loadingEntry.classList.remove('analyzing');
    
    // --- 結果判定ロジック ---
    let resultMsg = "";

    // 1. エンジンルームの特殊演出（全員共通）
    if (locName === "エンジンルーム") {
        resultMsg = `[REPORT] ${char.name}: 「エンジンルームを調査。……この最新の[バイオ・コンバーター]、様子がおかしいです。有機燃料が完全に空で、ログには強制排出の記録が。……不気味な臭いもします。」`;
        addInventory(loc.item, loc.truth);
    } 
    // 2. エンジニアが脱出ポッドへ行く場合（犯人の分岐）
    else if (char.isCulprit && locName === "脱出ポッド") {
        if (bodyDiscovered) {
            // すでに死体が発見されている場合：嘘をつけない
            resultMsg = `[REPORT] ${char.name}: 「……報告します。ポッド内に医師の遺体を確認。後頭部に鈍器のような痕があります。燃料計は……ゼロ。完全に空です。」`;
            addInventory(loc.item, loc.truth);
        } else {
            // まだ発見されていない場合：嘘をついて脱出準備
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
        if (locName === "脱出ポッド") bodyDiscovered = true; // 死体発見フラグ
        addInventory(loc.item, loc.truth);
    }

    loadingEntry.innerHTML = `<small>T${turn}: ${char.name} 報告</small><br>${resultMsg}`;

    // --- 状態更新 ---
    movedChars.push(selectedCharId);
    usedLocations.push(locName);
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
 * UIの更新（ロック判定と5ターン目の例外処理）
 */
function refreshUI() {
    // 4人全員動いたか、または5ターン目（最終ターン）ならキャラのロックを解除
    if (movedChars.length >= 4 || turn === 5) {
        movedChars = []; 
        // 5ターン目は「最後の調査」として場所のロックもすべて解除
        if (turn === 5) usedLocations = []; 
    }

    // キャラクターボタンの状態更新
    const ids = ['engineer', 'captain', 'pilot', 'observer'];
    ids.forEach(id => {
        const btn = document.getElementById(`btn-${id}`);
        const status = document.getElementById(`status-${id}`);
        if (!btn || !status) return;

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

    // 場所ボタンの状態更新
    document.querySelectorAll('.loc-btn').forEach(btn => {
        const locName = btn.innerText;
        if (usedLocations.includes(locName)) {
            btn.disabled = true;
        } else {
            btn.disabled = false;
        }
    });
}

/**
 * すべてのコントロールを一時的にロック/解除
 */
function toggleAllControls(enable) {
    document.querySelectorAll('.loc-btn, .char-btn').forEach(btn => btn.disabled = !enable);
}

/**
 * 証拠品をインベントリ（右パネル）に追加
 */
function addInventory(name, detail) {
    if (inventory.has(name)) return;
    inventory.add(name);
    
    const list = document.getElementById('evidence-list');
    if (inventory.size === 1) list.innerHTML = ""; // 初期メッセージを消す
    
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

    // 失敗判定：ノアが嘘をつき通し、かつ誰も死体を見つけていない
    if (engineerLiedAboutPod && !bodyDiscovered) {
        finalHtml = "<div style='color:var(--error-red); text-align:center;'><h2>MISSION FAILED</h2><p>エンジニア：ノアによる「脱出ポッド」での逃亡を確認。<br>外部ハッチの爆破により船体構造が崩壊しました。</p></div>";
        setTimeout(() => { location.href = "badend1.html"; }, 5000);
    } else {
        // 成功（または進行）判定
        finalHtml = "<div style='color:var(--warning-yellow); text-align:center;'><h2>PHASE 01 COMPLETE</h2><p>捜査完了。船内ログに重大な矛盾が検出されました。<br>これより「第ニフェーズ：個別尋問」を開始します。</p></div>";
        
        const btn = document.createElement('button');
        btn.className = "char-btn active";
        btn.style.justifyContent = "center";
        btn.innerText = ">> 尋問プロトコルを承認する";
        btn.onclick = () => {
            // インベントリをlocalStorageに保存して遷移
            localStorage.setItem('securedEvidence', JSON.stringify(Array.from(inventory)));
            location.href = "detective.html";
        };
        log.prepend(btn);
    }
    
    const endContainer = document.createElement('div');
    endContainer.innerHTML = `<hr>${finalHtml}`;
    log.prepend(endContainer);
}

// ページ読み込み時にUIを初期化
window.onload = refreshUI;
