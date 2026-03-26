const scenarios = [
    {
        id: "captain",
        name: "ハリス船長",
        image: "assets/haris.jpg",
        text: "「……事態は深刻だ。医師の行方がわからず、燃料も不自然に減っている。君はこの状況、どう見ている？」",
        choices: [
            { 
                text: "「内部に犯人がいるはずです」", 
                affinity: "suspicious", 
                nextText: "「……やはり君もそう思うか。……だが、私の部下たちを信じたい気持ちもある。」",
                secondText: "「（……僅かに手が震えている）……すまない、少し疲れが溜まっているようだ。パトロールに戻るよ。」" 
            },
            { 
                text: "「今は全員で協力すべきです」", 
                affinity: "trust", 
                nextText: "「……その通りだ。君の冷静さに期待しているよ。」",
                secondText: "「この船の指揮権は私が握っている。君は君の職務を全うしてくれ……頼んだぞ。」" 
            }
        ]
    },
    {
        id: "engineer",
        name: "ノア",
        image: "assets/noa.jpg",
        text: "「あぁん？ 忙しい時に通信してくんなよ。エンジンがイカれてんだ、俺が何とかするしかねぇんだよ。」",
        choices: [
            { 
                text: "「エンジンの異常について詳しく」", 
                affinity: "professional", 
                nextText: "「バイオ・コンバーターが空っぽなんだよ。誰かが手動でパージした形跡がある。」",
                secondText: "「……とにかく、不審な奴がいたらそっちでマークしとけ。俺は忙しい。」" 
            },
            { 
                text: "「何か隠していることはないか？」", 
                affinity: "hostile", 
                nextText: "「は？ 俺を疑ってんのか？ 作業の邪魔だ、消えろ。」",
                secondText: "「……チッ、時間の無駄だ。通信を切るぞ。」" 
            }
        ]
    },
    {
        id: "pilot",
        name: "リク",
        image: "assets/riku.jpg",
        text: "「なぁ、もし地球に帰れなかったらどうする？ 俺はまだ、あっちでやり残したことがあるんだ……。」",
        choices: [
            { 
                text: "「必ず帰れる、私が保証する」", 
                affinity: "friendly", 
                nextText: "「……ありがとな。お前を信じるぜ。家族をスラムに逆戻りさせるわけにはいかねぇんだ。」",
                secondText: "「……そういえば、倉庫の荷物が少し動かされていた気がするんだ。……気のせいだといいんだが。」" 
            },
            { 
                text: "「やり残したこと、とは何だ？」", 
                affinity: "wary", 
                nextText: "「……別に、大したことじゃねぇよ。気にするな。……ただ、少しばかり金が必要なだけだ。」",
                secondText: "「（……視線を逸らす）……悪い、操縦系統のチェックがあるんだ。また後でな。」" 
            }
        ]
    },
    {
        id: "observer",
        name: "メイ",
        image: "assets/mei.jpg",
        text: "「……システムログが一部書き換えられているわ。意図的なものよ。……怖い。誰かが私たちを見ている気がする。」",
        choices: [
            { 
                text: "「私が守る、大丈夫だ」", 
                affinity: "hero", 
                nextText: "「……頼りにしてるわ。……でも、私のアクセス権限じゃ見られない領域があるの。」",
                secondText: "「……医師の端末も、さっきから妙な信号を出してる。……調べた方がいいかもしれないわ。」" 
            },
            { 
                text: "「君の操作ミスではないのか？」", 
                affinity: "cold", 
                nextText: "「……ひどいわね。私はプロよ。……この船の中に『消したい事実』がある人間がいる……」",
                secondText: "「……もういいわ。私は私の仕事をこなすだけ。」" 
            }
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
    
    // 1ラリー目の反応
    document.getElementById('dialogue-text').innerText = choice.nextText;
    document.getElementById('choice-area').innerHTML = ""; // 選択肢を消す

    await new Promise(r => setTimeout(r, 2500)); // 2.5秒待機
    
    // 2ラリー目の「さらなる一言」（伏線が含まれる部分）
    document.getElementById('dialogue-text').innerText = choice.secondText;

    await new Promise(r => setTimeout(r, 3500)); // 少し長めに待機して読ませる
    
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
