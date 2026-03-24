const scenarios = [
    {
        id: "captain",
        name: "ハリス船長",
        text: "「……事態は深刻だ。医師の行方がわからず、燃料も不自然に減っている。君はこの状況、どう見ている？」",
        choices: [
            { text: "「内部に犯人がいるはずです」", affinity: "suspicious", nextText: "「……やはり君もそう思うか。慎重に調査を頼む。」" },
            { text: "「今は全員で協力すべきです」", affinity: "trust", nextText: "「……その通りだ。君の冷静さに期待しているよ。」" }
        ]
    },
    {
        id: "engineer",
        name: "ノア",
        text: "「あぁん？ 忙しい時に通信してくんなよ。エンジンがイカれてんだ、俺が何とかするしかねぇんだよ。」",
        choices: [
            { text: "「エンジンの異常について詳しく」", affinity: "professional", nextText: "「バイオ・コンバーターが空っぽなんだよ。誰かが捨てたとしか思えねぇ。」" },
            { text: "「何か隠していることはないか？」", affinity: "hostile", nextText: "「は？ 俺を疑ってんのか？ 作業の邪魔だ、消えろ。」" }
        ]
    },
    {
        id: "pilot",
        name: "リク",
        text: "「なぁ、もし地球に帰れなかったらどうする？ 俺はまだ、あっちでやり残したことがあるんだ……。」",
        choices: [
            { text: "「必ず帰れる、私が保証する」", affinity: "friendly", nextText: "「……ありがとな。お前を信じるぜ。」" },
            { text: "「やり残したこと、とは何だ？」", affinity: "wary", nextText: "「……別に、大したことじゃねぇよ。気にするな。」" }
        ]
    },
    {
        id: "observer",
        name: "メイ",
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
    document.getElementById('speaker-name').innerText = scenario.name;
    document.getElementById('dialogue-text').innerText = scenario.text;
    
    const choiceArea = document.getElementById('choice-area');
    choiceArea.innerHTML = ""; // クリア

    scenario.choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = "choice-btn";
        btn.innerText = choice.text;
        btn.onclick = () => selectChoice(choice);
        choiceArea.appendChild(btn);
    });
}

async function selectChoice(choice) {
    const scenario = scenarios[currentStep];
    
    // 態度を保存
    playerChoices[scenario.id] = choice.affinity;
    
    // キャラクターの反応を表示
    document.getElementById('dialogue-text').innerText = choice.nextText;
    document.getElementById('choice-area').innerHTML = "";

    // 2秒待って次のキャラへ
    await new Promise(r => setTimeout(r, 2000));
    
    currentStep++;
    
    if (currentStep < scenarios.length) {
        showScenario();
    } else {
        finishIntro();
    }
}

function finishIntro() {
    // localStorageに保存（フェーズ2で使用）
    localStorage.setItem('introAffinity', JSON.stringify(playerChoices));
    
    document.getElementById('speaker-name').innerText = "SYSTEM";
    document.getElementById('dialogue-text').innerText = "ブリーフィング終了。捜査フェーズへ移行します。";
    
    const startBtn = document.createElement('button');
    startBtn.className = "choice-btn";
    startBtn.style.textAlign = "center";
    startBtn.innerText = ">> 捜査開始（Phase 01）";
    startBtn.onclick = () => { location.href = "select.html"; };
    document.getElementById('choice-area').appendChild(startBtn);
}

window.onload = initIntro;
