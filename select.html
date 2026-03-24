<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GCC Terminal - Sector Investigation</title>
    <style>
        :root {
            --neon-green: #00ff41;
            --dark-bg: #050a05;
            --dim-green: rgba(0, 255, 65, 0.15);
            --warning-yellow: #ffff00;
            --error-red: #ff0000;
        }

        body {
            background: var(--dark-bg);
            background-image: 
                linear-gradient(var(--dim-green) 1px, transparent 1px),
                linear-gradient(90deg, var(--dim-green) 1px, transparent 1px);
            background-size: 40px 40px;
            color: var(--neon-green);
            font-family: 'Courier New', Courier, monospace;
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            overflow: hidden;
        }

        body::after {
            content: " ";
            display: block;
            position: fixed;
            top: 0; left: 0; bottom: 0; right: 0;
            background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%);
            z-index: 10;
            background-size: 100% 4px;
            pointer-events: none;
        }

        .game-container {
            display: grid;
            grid-template-columns: 350px 1fr 320px; /* 左パネルを少し広く */
            gap: 20px;
            width: 96vw;
            height: 92vh;
        }

        .panel {
            border: 1px solid var(--neon-green);
            background: rgba(0, 5, 0, 0.9);
            backdrop-filter: blur(8px);
            padding: 20px;
            display: flex;
            flex-direction: column;
            box-shadow: inset 0 0 20px var(--dim-green);
            position: relative;
            overflow: hidden;
        }

        h3 { border-bottom: 1px solid var(--neon-green); padding-bottom: 8px; margin-top: 0; font-size: 1.1em; letter-spacing: 2px; z-index: 2; }

        /* 背景画像エリアは削除 */

        /* 要員ボタンの修正（画像を表示するため） */
        .char-btn {
            width: 100%;
            height: 80px; /* 高さを固定 */
            margin: 10px 0;
            background: transparent;
            color: var(--neon-green);
            border: 1px solid var(--neon-green);
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center; /* 上下中央 */
            padding: 0; /* 余白を一旦リセット */
            overflow: hidden;
            position: relative;
            z-index: 2;
        }

        /* [新規] ボタン内の顔写真スペース */
        .char-img-thumb {
            width: 80px; /* ボタンの高さと同じ正方形 */
            height: 80px;
            border-right: 1px solid var(--neon-green);
            overflow: hidden;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #000;
        }

        .char-img-thumb img {
            width: auto;
            height: 100%; /* 縦幅に合わせる */
            min-width: 100%; /* 横が足りない場合は横幅に合わせる */
            object-fit: cover; /* 両サイドをトリミングして正方形に収める */
            filter: sepia(1) hue-rotate(90deg) contrast(1.2); /* 🟢ここがポイント：全体を緑っぽくする */
        }

        /* [新規] ボタン内のテキストエリア */
        .char-info {
            flex: 1;
            padding: 0 15px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .char-name-label { font-size: 1em; font-weight: bold; margin-bottom: 4px; }

        .char-btn:hover:not(:disabled) { background: var(--dim-green); }
        
        .char-btn.active { 
            background: var(--neon-green) !important; 
            color: #000 !important; 
            font-weight: bold;
            box-shadow: 0 0 20px var(--neon-green);
        }
        /* active時の画像フィルターを解除 */
        .char-btn.active .char-img-thumb img {
            filter: none;
            border-right: 1px solid #000;
        }
        /* active時のテキスト色調整 */
        .char-btn.active .char-name-label { color: #000; }
        .char-btn.active .status-label { border-color: #000; color: #000; }

        .status-label { font-size: 0.7em; padding: 2px 6px; border: 1px solid; border-radius: 2px; width: fit-content;}
        .status-available { border-color: var(--neon-green); color: var(--neon-green); }
        .status-recharging { border-color: #555; color: #555; background: #111; }

        .char-btn:disabled { opacity: 0.4; cursor: not-allowed; border-color: #444; }
        .char-btn:disabled .char-img-thumb img { filter: sepia(1) hue-rotate(90deg) contrast(0.8) brightness(0.5); }

        .location-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; z-index: 2; }
        .loc-btn {
            padding: 18px;
            background: rgba(0, 255, 65, 0.05);
            color: var(--neon-green);
            border: 1px solid var(--neon-green);
            cursor: pointer;
            font-size: 1em;
            transition: 0.2s;
        }
        .loc-btn:hover:not(:disabled) { background: var(--neon-green); color: #000; }
        .loc-btn:disabled { opacity: 0.2; cursor: not-allowed; border-color: #333; }

        #log-window {
            flex-grow: 1;
            border: 1px inset var(--neon-green);
            background: #000;
            margin-top: 15px;
            padding: 15px;
            overflow-y: auto;
            font-size: 0.9em;
            line-height: 1.6;
            border-radius: 4px;
            z-index: 2;
        }

        .analyzing { animation: blink 1s infinite; color: var(--warning-yellow); text-align: center; padding: 10px; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

        .evidence-item {
            margin-bottom: 15px;
            border-left: 3px solid var(--warning-yellow);
            padding: 8px 12px;
            background: rgba(255, 255, 0, 0.05);
        }
        .evidence-item strong { color: var(--warning-yellow); display: block; margin-bottom: 4px; }
        .evidence-item p { margin: 0; font-size: 0.8em; color: #ddd; }

        .turn-display {
            font-size: 1.3em;
            color: var(--warning-yellow);
            text-align: center;
            padding: 10px;
            border: 2px double var(--warning-yellow);
            margin-bottom: 20px;
            background: rgba(255, 255, 0, 0.05);
            z-index: 2;
        }
    </style>
</head>
<body>
    <div class="game-container">
        <div class="panel">
            <h3>OPERATIVE STATUS</h3>
            <div id="char-list">
                
                <button class="char-btn" id="btn-engineer" onclick="selectChar('engineer')">
                    <div class="char-img-thumb"><img src="assets/noa.jpg" alt="Noa"></div>
                    <div class="char-info">
                        <div class="char-name-label">ノア (ENG)</div>
                        <span class="status-label status-available" id="status-engineer">AVAILABLE</span>
                    </div>
                </button>
                
                <button class="char-btn" id="btn-captain" onclick="selectChar('captain')">
                    <div class="char-img-thumb"><img src="assets/haris.jpg" alt="Harris"></div>
                    <div class="char-info">
                        <div class="char-name-label">ハリス (CPT)</div>
                        <span class="status-label status-available" id="status-captain">AVAILABLE</span>
                    </div>
                </button>
                
                <button class="char-btn" id="btn-pilot" onclick="selectChar('pilot')">
                    <div class="char-img-thumb"><img src="assets/riku.jpg" alt="Riku"></div>
                    <div class="char-info">
                        <div class="char-name-label">リク (PLT)</div>
                        <span class="status-label status-available" id="status-pilot">AVAILABLE</span>
                    </div>
                </button>
                
                <button class="char-btn" id="btn-observer" onclick="selectChar('observer')">
                    <div class="char-img-thumb"><img src="assets/mei.jpg" alt="Mei"></div>
                    <div class="char-info">
                        <div class="char-name-label">メイ (OBS)</div>
                        <span class="status-label status-available" id="status-observer">AVAILABLE</span>
                    </div>
                </button>
                
            </div>
            <div style="margin-top: auto; font-size: 0.7em; color: #888; border-top: 1px solid #333; padding-top: 10px;">
                ※警告: 通信安定のため、同一要員の連続派遣は禁止されています。
            </div>
        </div>

        <div class="panel">
            <div class="turn-display">MISSION: T-<span id="turn-count">1</span> / 5</div>
            <h3>SECTOR SCANNER</h3>
            <div class="location-grid">
                <button class="loc-btn" onclick="executeInvestigate('脱出ポッド')">脱出ポッド</button>
                <button class="loc-btn" onclick="executeInvestigate('操縦室')">操縦室</button>
                <button class="loc-btn" onclick="executeInvestigate('倉庫')">倉庫</button>
                <button class="loc-btn" onclick="executeInvestigate('寝室')">寝室</button>
                <button class="loc-btn" onclick="executeInvestigate('エンジンルーム')">エンジンルーム</button>
            </div>
            <div id="log-window">>> 待機中。左パネルより派遣要員を選択してください。</div>
        </div>

        <div class="panel">
            <h3>RECOVERED DATA</h3>
            <div id="evidence-list">
                <p style="color:#444; font-size:0.8em; text-align: center; margin-top: 20px;">NO DATA SECURED</p>
            </div>
        </div>
    </div>
    <script src="script.js"></script>
</body>
</html>
