/**
 * PROJECT: ECLIPSE DEADLINE - Accusation Protocol
 * 最終隔離・投棄コマンドの実行とエンディング分岐
 */

class AccusationSystem {
    constructor() {
        // 各ルートの遷移先（HTMLファイル名）
        this.ENDINGS = {
            TRUE: "ending_true.html",         // ノア + 医者 + エンジン
            STARVATION: "ending_starv.html",  // ノア + 柱 + エンジン
            DARK: "ending_dark.html",         // 無実の誰か + エンジン
            DRIFT: "ending_drift.html",       // 犯人を逃した / エンジン以外
            DEATH: "ending_death.html"        // メイの心中プログラム作動（タイムオーバー時など）
        };
    }

    /**
     * 画面のセレクトボックスから値を取得して実行
     */
    executeFinalCommand() {
        const target1 = document.getElementById('select-target-1').value;
        const target2 = document.getElementById('select-target-2').value;
        const location = document.getElementById('select-room').value;

        console.log(`[GCC FINAL COMMAND] Bind: ${target1} & ${target2} | Target: ${location}`);

        // --- ルート判定ロジック ---

        // A. 1名でも「エンジン」に放り込む場合の処理
        if (location === "エンジン") {
            
            // 【TRUE END】: 真犯人と新鮮な有機質量（遺体）をリアクターへ
            if (this.isMatch(target1, target2, "ノア", "医者")) {
                this.navigate(this.ENDINGS.TRUE);
            }
            
            // 【STARVATION END】: 犯人は捕らえたが、燃料が「柱」では熱量が足りない
            else if (this.isMatch(target1, target2, "ノア", "柱")) {
                this.navigate(this.ENDINGS.STARVATION);
            }

            // 【DARK END】: 無実の人間（ハリス、リク、メイ）を1人でも犠牲にした
            else if (this.isInnocentSacrificed(target1, target2)) {
                this.navigate(this.ENDINGS.DARK);
            }

            // 【DRIFT END】: 犯人を入れず、死体や柱だけを入れた（加速不足で漂流）
            else {
                this.navigate(this.ENDINGS.DRIFT);
            }

        } else {
            // B. 「エンジン」以外に隔離した場合
            // 犯人をどこかに閉じ込めたとしても、燃料がなければ船は動かず心中プログラムが作動する
            this.navigate(this.ENDINGS.DRIFT);
        }
    }

    /**
     * 2つの選択肢が順不同で一致するか確認
     */
    isMatch(a, b, val1, val2) {
        return (a === val1 && b === val2) || (a === val2 && b === val1);
    }

    /**
     * 無実の人間が選択されているか判定
     * (ハリス、リク、メイのいずれかが含まれている場合)
     */
    isInnocentSacrificed(t1, t2) {
        const innocents = ["ハリス", "リク", "メイ"];
        return innocents.includes(t1) || innocents.includes(t2);
    }

    /**
     * エンディング画面へ遷移
     */
    navigate(file) {
        // 最終的な緊張感を出すための演出（画面フェードアウトなど）
        document.body.style.transition = "opacity 2s";
        document.body.style.opacity = "0";
        
        setTimeout(() => {
            window.location.href = file;
        }, 2000);
    }
}

// インスタンス化
const finalCommand = new AccusationSystem();

// HTML側から呼べるようにグローバル登録
window.executeFinalCommand = () => {
    if (confirm("【最終警告】このコマンドは取り消せません。送信しますか？")) {
        finalCommand.executeFinalCommand();
    }
};
