const scenarios = [
    {
        id: "captain",
        name: "ハリス船長",
        image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", // 実際の画像パスを指定してください
        text: "「……事態は深刻だ。医師の行方がわからず、燃料も不自然に減っている。君はこの状況、どう見ている？」",
        choices: [
            { text: "「内部に犯人がいるはずです」", affinity: "suspicious", nextText: "「……やはり君もそう思うか。慎重に調査を頼む。」" },
            { text: "「今は全員で協力すべきです」", affinity: "trust", nextText: "「……その通りだ。君の冷静さに期待しているよ。」" }
        ]
    },
    {
        id: "engineer",
        name: "ノア",
        image: "assets/noa.jpg",
        text: "「あぁん？ 忙しい時に通信してくんなよ。エンジンがイカれてんだ、俺が何とかするしかねぇんだよ。」",
        choices: [
            { text: "「エンジンの異常について詳しく」", affinity: "professional", nextText: "「バイオ・コンバーターが空っぽなんだよ。誰かが捨てたとしか思えねぇ。」" },
            { text: "「何か隠していることはないか？」", affinity: "hostile", nextText: "「は？ 俺を疑ってんのか？ 作業の邪魔だ、消えろ。」" }
        ]
    },
    {
        id: "pilot",
        name: "リク",
        image: "assets/riku.jpg",
        text: "「なぁ、もし地球に帰れなかったらどうする？ 俺はまだ、あっちでやり残したことがあるんだ……。」",
        choices: [
            { text: "「必ず帰れる、私が保証する」", affinity: "friendly", nextText: "「……ありがとな。お前を信じるぜ。」" },
            { text: "「やり残したこと、とは何だ？」", affinity: "wary", nextText: "「……別に、大したことじゃねぇよ。気にするな。」" }
        ]
    },
    {
        id: "observer",
        name: "メイ",
        image: "assets/mei.jpg",
        text: "「……システムログが一部書き換えられているわ。意図的なものよ。……怖い。誰かが私たちを見ている気がする。」",
        choices: [
            { text: "「私が守る、大丈夫だ」", affinity: "hero", nextText: "「……頼りにしてるわ。ログ解析、続けてみる。」" },
            { text: "「君の操作ミスではないのか？」", affinity: "cold", nextText: "「……ひどいわね。私はプロよ。……もういいわ。」" }
        ]
    }
];

let currentStep = 0;
const playerChoices = {};

function initIntro() {
    showScenario();
}

function showScenario() {
    const scenario = scenarios[currentStep];
    console.log("--- Current Scenario: " + scenario.id + " ---");

    // テキスト更新
    document.getElementById('speaker-name').innerText = scenario.name;
    document.getElementById('dialogue-text').innerText = scenario.text;
    
    // 画像要素の取得
    const imgElement = document.getElementById('char-img');
    
    if (imgElement) {
        console.log("Attempting to load image: " + scenario.image);
        
        // 演出なしで即座に表示を試みる（トラブル防止のため一旦フェードを無効化）
        imgElement.src = scenario.image;
        imgElement.style.opacity = "1"; 
        imgElement.style.visibility = "visible"; // 念のため
        
        // 画像読み込みエラーが起きた時のログ
        imgElement.onerror = function() {
            console.error("FAILED to load image at: " + scenario.image);
            // エラー時は枠を赤くして目立たせる
            imgElement.style.border = "2px solid red";
        };
        
        imgElement.onload = function() {
            console.log("SUCCESS: Image loaded correctly.");
            imgElement.style.border = "none";
        };
    } else {
        console.error("Error: Element with ID 'char-img' not found.");
    }

    // 選択肢ボタンの生成
    const choiceArea = document.getElementById('choice-area');
    choiceArea.innerHTML = "";

    scenario.choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = "choice-btn";
        btn.innerText = choice.text;
        btn.onclick = () => selectChoice(choice);
        choiceArea.appendChild(btn);
    });
}

// （以下、selectChoice, finishIntro関数は以前のものと同じでOKです）
async function selectChoice(choice) {
    const scenario = scenarios[currentStep];
    playerChoices[scenario.id] = choice.affinity;
    document.getElementById('dialogue-text').innerText = choice.nextText;
    document.getElementById('choice-area').innerHTML = "";

    await new Promise(r => setTimeout(r, 2000));
    currentStep++;
    if (currentStep < scenarios.length) {
        showScenario();
    } else {
        finishIntro();
    }
}

function finishIntro() {
    localStorage.setItem('introAffinity', JSON.stringify(playerChoices));
    document.getElementById('speaker-name').innerText = "SYSTEM";
    document.getElementById('dialogue-text').innerText = "全クルーとのブリーフィングが完了しました。";
    document.getElementById('char-img').style.opacity = 0; // 立ち絵を消す

    const startBtn = document.createElement('button');
    startBtn.className = "choice-btn";
    startBtn.innerText = ">> 捜査フェーズへ移行（Phase 01）";
    startBtn.onclick = () => { location.href = "select.html"; };
    document.getElementById('choice-area').appendChild(startBtn);
}

window.onload = initIntro;
