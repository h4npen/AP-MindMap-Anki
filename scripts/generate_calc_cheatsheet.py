# -*- coding: utf-8 -*-
"""
scripts/generate_calc_cheatsheet.py
ユーザーが過去に間違えた計算問題・数値処理問題を完全ケアする
「A4印刷対応・計算問題即効チートシート」HTML生成スクリプト
※JS/KaTeX依存を完全に排除し、CSSネイティブ分数・数式レイアウトでオフライン・印刷でも絶対に生コード化けしない仕様！
"""

import os
import json
import re

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUTPUT_PATH = os.path.join(ROOT_DIR, "printable", "calc_cheatsheet.html")

CALC_TOPICS = [
    {
        "id": 1,
        "category": "基礎理論・待ち行列",
        "title": "M/M/1 待ち行列の平均待ち時間・応答時間",
        "target_q": "令和4年春期 問3",
        "problem": "M/M/1の待ち行列モデルにおいて，窓口の利用率が25%から40%に増えると，平均待ち時間は何倍になるか。<br><strong>ア:</strong> 1.25 &nbsp; <strong>イ:</strong> 1.60 &nbsp; <strong>ウ:</strong> 2.00 &nbsp; <strong>エ:</strong> 3.00",
        "answer": "ウ（2.00倍）",
        "formula": """
<div class="formula-box">
  <div class="f-title">【絶対に覚える公式】</div>
  <div class="f-main">
    <span>平均待ち時間 <em>W</em> ＝ </span>
    <span class="fraction"><span class="num">ρ</span><span class="den">1 − ρ</span></span>
    <span> × <em>T<sub>s</sub></em></span>
    <span class="f-sep">｜</span>
    <span>平均応答時間 <em>T</em> ＝ </span>
    <span class="fraction"><span class="num">1</span><span class="den">1 − ρ</span></span>
    <span> × <em>T<sub>s</sub></em> ＝ <em>W</em> ＋ <em>T<sub>s</sub></em></span>
  </div>
  <div class="f-sub">※ ρ（ロー）＝ 窓口利用率（0〜1）、<em>T<sub>s</sub></em> ＝ 平均サービス時間（窓口処理時間）</div>
</div>
""",
        "memory_trick": """
<strong>🍜 ラーメン屋のワンオペカウンターで覚える！</strong><br>
・分子は「忙しさ（利用率 ρ）」、分母は「ヒマな余裕時間（1 − ρ）」！<br>
・<strong>合言葉：『 待ち時間は 利用率 ÷ (1 − 利用率)。サービス時間は比べる時に割り算で消える！ 』</strong><br>
・「応答時間（退店まで）」は「待ち時間 ＋ ラーメン食べる時間（サービス時間）」だから分子が1になる！
""",
        "fast_solution": """
<strong>⚡ 10秒瞬殺解法ステップ：</strong><br>
① 何倍になるか（比率）を問われているので、<em>T<sub>s</sub></em> は無視して <strong>利用率 ÷ (1 − 利用率)</strong> だけ計算する！<br>
② 利用率25%（0.25）のとき：0.25 ÷ (1 − 0.25) ＝ 0.25 ÷ 0.75 ＝ <strong>1/3</strong><br>
③ 利用率40%（0.40）のとき：0.40 ÷ (1 − 0.40) ＝ 0.4 ÷ 0.6 ＝ <strong>2/3</strong><br>
④ 比べる：(2/3) ÷ (1/3) ＝ <strong>2倍</strong>！ 一瞬で「ウ」！
"""
    },
    {
        "id": 2,
        "category": "システム構成・信頼性",
        "title": "稼働率とMTBF・MTTR・直列並列システム",
        "target_q": "平成30年秋期 問15等",
        "problem": "あるシステムにおいて，MTBFとMTTRがともに1.5倍になったとき，アベイラビリティ(稼働率)は何倍になるか。<br><strong>ア:</strong> 2/3 &nbsp; <strong>イ:</strong> 1.5 &nbsp; <strong>ウ:</strong> 2.25 &nbsp; <strong>エ:</strong> 変わらない",
        "answer": "エ（変わらない）",
        "formula": """
<div class="formula-box">
  <div class="f-title">【絶対に覚える公式】</div>
  <div class="f-main">
    <span>稼働率 <em>A</em> ＝ </span>
    <span class="fraction"><span class="num">MTBF</span><span class="den">MTBF ＋ MTTR</span></span>
    <span class="f-sep">｜</span>
    <span>直列 ＝ <em>A</em><sub>1</sub> × <em>A</em><sub>2</sub></span>
    <span class="f-sep">｜</span>
    <span>並列 ＝ 1 − (1 − <em>A</em><sub>1</sub>)(1 − <em>A</em><sub>2</sub>)</span>
  </div>
  <div class="f-sub">MTBF（平均故障間隔：元気な時間） / MTTR（平均修理時間：入院時間）</div>
</div>
""",
        "memory_trick": """
<strong>📱 スマホの元気時間と入院時間で覚える！</strong><br>
・<strong>MTBF</strong> の「B」＝ <strong>Between</strong>（故障と故障の間＝元気に動いている平均時間！）<br>
・<strong>MTTR</strong> の「R」＝ <strong>Repair</strong>（修理にかかる平均時間＝入院している時間！）<br>
・稼働率は「全体（動いてる＋直してる）のうち、元気に動いてる時間の割合」！<br>
・<strong>合言葉：『 ビー（B）は元気、アール（R）はリペア！全体分の元気！ 』</strong>
""",
        "fast_solution": """
<strong>⚡ 10秒瞬殺解法ステップ：</strong><br>
・MTBFもMTTRも「ともに1.5倍」なら、分子も分母も1.5倍されて完全に相殺（約分）される！<br>
・計算するまでもなく<strong>「変わらない（エ）」</strong>が確定！
"""
    },
    {
        "id": 3,
        "category": "システム構成・プロセッサ",
        "title": "CPU利用率とMIPS・必要処理能力の計算",
        "target_q": "平成26年春期 問12",
        "problem": "オンライントランザクション処理システムにおいて，1分当たりの平均トランザクション数が1,200件であり，1件のトランザクション処理で100万命令を実行する場合，CPU性能が100MIPSのコンピュータを使用したときのCPUの平均利用率は何%か。<br><strong>ア:</strong> 2 &nbsp; <strong>イ:</strong> 10 &nbsp; <strong>ウ:</strong> 12 &nbsp; <strong>エ:</strong> 20",
        "answer": "エ（20%）",
        "formula": """
<div class="formula-box">
  <div class="f-title">【絶対に覚える公式】</div>
  <div class="f-main">
    <span>CPU利用率(%) ＝ </span>
    <span class="fraction"><span class="num">1秒間に要求される命令数</span><span class="den">CPUが1秒間に処理できる命令能力</span></span>
    <span> × 100</span>
  </div>
  <div class="f-sub">MIPS（Million Instructions Per Second）＝ 1秒間に何百万回命令を実行できるか（100MIPS ＝ 1秒に1億回）</div>
</div>
""",
        "memory_trick": """
<strong>🛒 スーパーのレジ打ち能力で覚える！</strong><br>
・MIPSの「S」は「Second（秒）」！<br>
・問題文の「1分間に1,200件」という罠を見破れ！必ず<strong>「秒」に直してから割る！</strong><br>
・<strong>合言葉：『 MIPSは1秒に百万命令！「分」を「秒（÷60）」に直してから割る！ 』</strong>
""",
        "fast_solution": """
<strong>⚡ 10秒瞬殺解法ステップ：</strong><br>
① 1分1,200件 → 1秒あたり：1,200 ÷ 60 ＝ <strong>20件/秒</strong><br>
② 1件あたり100万命令 → 1秒間に必要な命令数：20 × 100万 ＝ <strong>2,000万命令（＝ 20 MIPS分）</strong><br>
③ CPU能力は100 MIPSなので利用率：(20 ÷ 100) × 100 ＝ <strong>20%</strong>（エ）！
"""
    },
    {
        "id": 4,
        "category": "ネットワーク・IPアドレス",
        "title": "IPv4 プレフィックス長と利用可能ホスト数の計算",
        "target_q": "平成24年秋期 問34",
        "problem": "IPv4で 192.168.30.32/28 のネットワークに接続可能なホストの最大数はどれか。<br><strong>ア:</strong> 14 &nbsp; <strong>イ:</strong> 16 &nbsp; <strong>ウ:</strong> 28 &nbsp; <strong>エ:</strong> 30",
        "answer": "ア（14個）",
        "formula": """
<div class="formula-box">
  <div class="f-title">【絶対に覚える公式】</div>
  <div class="f-main">
    <span>利用可能ホスト数 ＝ 2<sup>(32 − プレフィックス長)</sup> − 2</span>
  </div>
  <div class="f-sub">※引く「2」の内訳：ネットワークアドレス（ホスト部全ビット0）＋ ブロードキャストアドレス（ホスト部全ビット1）</div>
</div>
""",
        "memory_trick": """
<strong>🏢 マンションの部屋割りで覚える！</strong><br>
・IPv4アドレス全体は32ビット。プレフィックスが /28 なら、残り 32 − 28 ＝ 4ビットがホスト部！<br>
・2<sup>4</sup> ＝ 16部屋あるが、「マンションの看板（ネットワーク番号）」と「全館放送スピーカー（ブロードキャスト）」の2部屋には住人が住めない！<br>
・<strong>合言葉：『 ホスト数は 2のn乗 − 2！看板と館内放送の2個を必ず引く！ 』</strong>
""",
        "fast_solution": """
<strong>⚡ 10秒瞬殺解法ステップ：</strong><br>
① 32 − 28 ＝ 4ビット<br>
② 2<sup>4</sup> ＝ 16<br>
③ 16 − 2 ＝ <strong>14個</strong>！ 16に飛びついたら不合格の典型罠！迷わず「ア」！
"""
    },
    {
        "id": 5,
        "category": "ネットワーク・サブネット",
        "title": "サブネットとブロードキャストアドレス計算（/20等の刻み幅）",
        "target_q": "平成28年秋期 問38",
        "problem": "IPv4アドレス 172.22.29.44/20 のホストが存在するネットワークのブロードキャストアドレスはどれか。<br><strong>ア:</strong> 172.22.29.255 &nbsp; <strong>イ:</strong> 172.22.30.255 &nbsp; <strong>ウ:</strong> 172.22.31.255 &nbsp; <strong>エ:</strong> 172.22.255.255",
        "answer": "ウ（172.22.31.255）",
        "formula": """
<div class="formula-box">
  <div class="f-title">【絶対に覚える公式】</div>
  <div class="f-main">
    <span>ブロードキャストアドレス ＝ ホスト部ビットを「すべて1」にしたアドレス</span>
  </div>
  <div class="f-sub">2進数展開不要の刻み幅解法：第3オクテットの変化幅 ＝ 2<sup>(24 − 20)</sup> ＝ 2<sup>4</sup> ＝ 16刻み</div>
</div>
""",
        "memory_trick": """
<strong>🍰 2進数展開不要！「刻み幅パズル」で覚える！</strong><br>
・第1・第2オクテット（172.22）は固定（8+8=16ビット）。<br>
・/20 は第3オクテット（17〜24ビット目）の途中で切れる。第3オクテットは 24 − 20 ＝ 4ビット余るので、<strong>2<sup>4</sup> ＝ 16刻み！</strong><br>
・グループ分け：0〜15、16〜31、32〜47…<br>
・問題の「29」は<strong>「16〜31」のグループ</strong>に所属！<br>
・<strong>合言葉：『 グループのケツ（末尾）がブロードキャスト！16〜31だから末尾は31.255！ 』</strong>
""",
        "fast_solution": """
<strong>⚡ 10秒瞬殺解法ステップ：</strong><br>
① /20 → 第3オクテットで 24 − 20 ＝ 4ビット。刻み幅は 2<sup>4</sup> ＝ 16。<br>
② 29が含まれるブロックは「16 〜 31」。<br>
③ このブロックの最後は 31。第4オクテットも全部1（255）にして「172.22.31.255」！答えは「ウ」！
"""
    },
    {
        "id": 6,
        "category": "ネットワーク・回線伝送",
        "title": "LAN伝送時間と伝送効率・単位変換（バイト×8）",
        "target_q": "平成25年秋期 問32",
        "problem": "100Mビット／秒のLANを使用し，1件のレコード長が1,000バイトの電文を1,000件連続して伝送するとき，伝送時間は何秒か。ここで，LANの伝送効率は50%とする。<br><strong>ア:</strong> 0.02 &nbsp; <strong>イ:</strong> 0.08 &nbsp; <strong>ウ:</strong> 0.16 &nbsp; <strong>エ:</strong> 0.20",
        "answer": "ウ（0.16秒）",
        "formula": """
<div class="formula-box">
  <div class="f-title">【絶対に覚える公式】</div>
  <div class="f-main">
    <span>伝送時間(秒) ＝ </span>
    <span class="fraction"><span class="num">総データ量 (バイト) × 8</span><span class="den">回線速度 (bps) × 伝送効率</span></span>
  </div>
  <div class="f-sub">※バイト（Byte）をビット（bit）に直す「× 8」を絶対に忘れないこと！</div>
</div>
""",
        "memory_trick": """
<strong>🚚 高速道路のトラック輸送で覚える！</strong><br>
・回線速度（100Mbps）は「ビット/秒」、データ量（1,000バイト）は「バイト」！単位が違う！<br>
・1バイト＝8ビットだから、<strong>必ず 8 を掛ける！</strong><br>
・伝送効率50%（0.5）は、100車線のうち50車線しか使えない渋滞状態！実効速度は 50Mbps！<br>
・<strong>合言葉：『 バイトは8倍！速度には効率を掛けてから割る！ 』</strong>
""",
        "fast_solution": """
<strong>⚡ 10秒瞬殺解法ステップ：</strong><br>
① 総データ量：1,000バイト × 1,000件 ＝ 1,000,000バイト ＝ 1 Mバイト<br>
② ビット換算：1 Mバイト × 8 ＝ <strong>8 Mビット</strong><br>
③ 実効速度：100 Mbps × 0.5 ＝ <strong>50 Mbps</strong><br>
④ 伝送時間：8 Mビット ÷ 50 Mbps ＝ 16 ÷ 100 ＝ <strong>0.16秒</strong>！（ウ）
"""
    },
    {
        "id": 7,
        "category": "ネットワーク・パケット",
        "title": "回線速度差とパケット送信時間・共通オーバーヘッド相殺",
        "target_q": "平成27年秋期 問32",
        "problem": "100Mビット／秒のLANと1Gビット／秒のLANがある。ヘッダーを含めて1,250バイトのパケットをN個送付するときに，100Mビット／秒のLANの送信時間が1Gビット／秒のLANより9ミリ秒多く掛かった。Nは幾らか。ここで，いずれのLANでもパケット送信間隔は0.01ミリ秒とする。<br><strong>ア:</strong> 10 &nbsp; <strong>イ:</strong> 90 &nbsp; <strong>ウ:</strong> 100 &nbsp; <strong>エ:</strong> 112",
        "answer": "ウ（100個）",
        "formula": """
<div class="formula-box">
  <div class="f-title">【絶対に覚える公式】</div>
  <div class="f-main">
    <span>1個あたりの差 Δt ＝ </span>
    <span class="fraction"><span class="num">サイズ × 8</span><span class="den">低速回線速度</span></span>
    <span> − </span>
    <span class="fraction"><span class="num">サイズ × 8</span><span class="den">高速回線速度</span></span>
    <span class="f-sep">｜</span>
    <span>パケット数 <em>N</em> ＝ </span>
    <span class="fraction"><span class="num">総時間差</span><span class="den">Δt</span></span>
  </div>
  <div class="f-sub">※「パケット送信間隔（0.01ms）」は両回線で完全に等しいため、差を取ると相殺されて消える！</div>
</div>
""",
        "memory_trick": """
<strong>☕ 共通の休憩時間は引き算で消える！</strong><br>
・パケット間隔0.01msを見て身構えるな！両方のLANで同じ回数だけ発生するから、差をとる引き算をしたらゼロになって消滅する！<br>
・<strong>合言葉：『 両方に同じだけ足される足枷は、差を取れば消える！バイトは×8でビットへ！ 』</strong>
""",
        "fast_solution": """
<strong>⚡ 10秒瞬殺解法ステップ：</strong><br>
① 1パケットのビット数：1,250バイト × 8 ＝ 10,000ビット ＝ 10<sup>4</sup> bit<br>
② 100Mbpsでの1個の送信時間：10<sup>4</sup> ÷ 10<sup>8</sup> ＝ 0.0001秒 ＝ 0.1 ms<br>
③ 1Gbps（1,000Mbps）での1個の送信時間：10<sup>4</sup> ÷ 10<sup>9</sup> ＝ 0.00001秒 ＝ 0.01 ms<br>
④ 1個あたりの時間差：0.1 − 0.01 ＝ <strong>0.09 ms</strong><br>
⑤ 全体で 9 ms 差がついたので：<em>N</em> ＝ 9 ms ÷ 0.09 ms ＝ <strong>100個</strong>！（ウ）
"""
    },
    {
        "id": 8,
        "category": "ネットワーク・信頼性計算",
        "title": "多数決方式の伝送誤り率（3回送信・2回以上誤り）",
        "target_q": "平成26年秋期 問32",
        "problem": "ビット誤り率が10%の伝送路を使って1ビットデータを送る。誤り率を改善するために，送信側は元データの各ビットを3回連続して送信し，受信側は多数決で判定することにする。このときの誤り率は何%になるか。<br><strong>ア:</strong> 2.7 &nbsp; <strong>イ:</strong> 2.8 &nbsp; <strong>ウ:</strong> 3.0 &nbsp; <strong>エ:</strong> 3.7",
        "answer": "イ（2.8%）",
        "formula": """
<div class="formula-box">
  <div class="f-title">【絶対に覚える公式】</div>
  <div class="f-main">
    <span>誤り率 <em>P</em> ＝ 3 × <em>p</em><sup>2</sup>(1 − <em>p</em>) ＋ <em>p</em><sup>3</sup></span>
  </div>
  <div class="f-sub">多数決（3人中2人以上一致）で間違えるケース ＝「2人間違える（3通り）」＋「3人全員間違える（1通り）」</div>
</div>
""",
        "memory_trick": """
<strong>🧑‍⚖️ 3人の裁判官の多数決パズルで覚える！</strong><br>
・1人だけが間違えても、残り2人が合っていれば多数決で救われる！<br>
・多数決で間違えてしまうのは：<br>
  パターンA：3人中2人がミス（誰がミスするかで3通り）<br>
  パターンB：3人全員がミス（1通り）<br>
・<strong>合言葉：『 多数決のミスは「2人ミス」＋「3人ミス」！ 』</strong>
""",
        "fast_solution": """
<strong>⚡ 10秒瞬殺解法ステップ：</strong><br>
誤り率 <em>p</em> ＝ 0.1（10%）、正解率 1 − <em>p</em> ＝ 0.9<br>
① 2人ミスの確率：3 × (0.1)<sup>2</sup> × 0.9 ＝ 3 × 0.01 × 0.9 ＝ <strong>0.027（2.7%）</strong><br>
② 3人ミスの確率：(0.1)<sup>3</sup> ＝ <strong>0.001（0.1%）</strong><br>
③ 合計：2.7% ＋ 0.1% ＝ <strong>2.8%</strong>！ 2.7%（ア）で終わらせる引っ掛けに注意して「イ」を選ぶ！
"""
    },
    {
        "id": 9,
        "category": "ストラテジ・企業会計",
        "title": "損益分岐点売上高・変動費率・限界利益・安全余裕率",
        "target_q": "令和元年秋期 問76等",
        "problem": "損益分岐点分析において、売上高2,000万円、固定費600万円、変動費1,000万円の企業の損益分岐点売上高は何万円か。また安全余裕率は何%か。",
        "answer": "損益分岐点: 1,200万円 / 安全余裕率: 40%",
        "formula": """
<div class="formula-box">
  <div class="f-title">【絶対に覚える公式】</div>
  <div class="f-main">
    <span>損益分岐点売上高 ＝ </span>
    <span class="fraction"><span class="num">固定費</span><span class="den">1 − 変動費率</span></span>
    <span> ＝ </span>
    <span class="fraction"><span class="num">固定費</span><span class="den">限界利益率</span></span>
    <span class="f-sep">｜</span>
    <span>安全余裕率 ＝ </span>
    <span class="fraction"><span class="num">売上高 − 損益分岐点売上高</span><span class="den">売上高</span></span>
  </div>
  <div class="f-sub">変動費率 ＝ 変動費 ÷ 売上高 ｜ 限界利益率 ＝ (売上高 − 変動費) ÷ 売上高</div>
</div>
""",
        "memory_trick": """
<strong>🍜 ラーメン屋の家賃回収パズルで覚える！</strong><br>
・固定費は「毎月の店舗家賃」。売上がゼロでも絶対に出ていく！<br>
・1杯売るごとに「売上 − 原料費（変動費）」＝<strong>限界利益</strong> が残る。<br>
・この限界利益をコツコツ積み上げて、家賃（固定費）をチャラにした瞬間が<strong>損益分岐点</strong>！<br>
・安全余裕率は「売上が何%落ちても赤字にならないか」のバッファ度合い！<br>
・<strong>合言葉：『 固定費 ÷ (1 − 変動費率)！家賃を利益率で割る！ 』</strong>
""",
        "fast_solution": """
<strong>⚡ 10秒瞬殺解法ステップ：</strong><br>
① 変動費率：1,000 ÷ 2,000 ＝ <strong>0.5（50%）</strong><br>
② 限界利益率：1 − 0.5 ＝ <strong>0.5</strong><br>
③ 損益分岐点売上高：600 ÷ 0.5 ＝ <strong>1,200万円</strong>！<br>
④ 安全余裕率：(2,000 − 1,200) ÷ 2,000 ＝ 800 ÷ 2,000 ＝ <strong>40%</strong>！
"""
    },
    {
        "id": 10,
        "category": "ストラテジ・マーケティング",
        "title": "最大利益の価格設定（4択総当たり法）",
        "target_q": "平成30年秋期 問69",
        "problem": "最大利益が見込める新製品の設定価格はどれか。ここで固定費は1,000,000円、変動費は600円／個とし、価格と需要は「ア:1,000円(3,000個)」「イ:1,200円(2,800個)」「ウ:1,400円(2,400個)」「エ:1,600円(2,000個)」とする。",
        "answer": "エ（1,600円）",
        "formula": """
<div class="formula-box">
  <div class="f-title">【絶対に覚える公式】</div>
  <div class="f-main">
    <span>利益 ＝ (価格 − 変動費) × 需要(販売個数) − 固定費</span>
  </div>
  <div class="f-sub">固定費は全選択肢で共通なので、<strong>限界利益「(価格 − 600) × 個数」の最大</strong>を探せばOK！</div>
</div>
""",
        "memory_trick": """
<strong>🐙 屋台のたこ焼き屋で覚える！</strong><br>
・微分や方程式は不要！選択肢は4つしかないのだから、<strong>全部掛けて最大を選ぶのが最速・確実！</strong><br>
・固定費100万円は引き算しても順位が変わらないので、暗算時は無視して良い！<br>
・<strong>合言葉：『 利益は (価格−変動費)×個数！4つ全部掛けてデカい山を探す！ 』</strong>
""",
        "fast_solution": """
<strong>⚡ 10秒瞬殺解法ステップ：</strong><br>
各選択肢の「1個あたり利益（価格 − 600円）」× 個数を暗算比較！<br>
・ア：(1,000 − 600) × 3,000 ＝ 400 × 3,000 ＝ 120万円<br>
・イ：(1,200 − 600) × 2,800 ＝ 600 × 2,800 ＝ 168万円<br>
・ウ：(1,400 − 600) × 2,400 ＝ 800 × 2,400 ＝ 192万円<br>
・エ：(1,600 − 600) × 2,000 ＝ 1,000 × 2,000 ＝ <strong>200万円 ★最大！</strong><br>
利益＝200万 − 固定費100万 ＝ 100万円。迷わず「エ」！
"""
    },
    {
        "id": 11,
        "category": "ストラテジ・投資評価",
        "title": "投資評価指標（PBP・ROI・NPV・IRRの見分け方）",
        "target_q": "平成26年春期 問67",
        "problem": "IT投資効果の評価方法において，キャッシュフローベースで初年度の投資によるキャッシュアウトを何年後に回収できるかという指標はどれか。<br><strong>ア:</strong> IRR &nbsp; <strong>イ:</strong> NPV &nbsp; <strong>ウ:</strong> PBP &nbsp; <strong>エ:</strong> ROI",
        "answer": "ウ（PBP: Payback Period）",
        "formula": """
<div class="formula-box">
  <div class="f-title">【絶対に覚える公式】</div>
  <div class="f-main">
    <span>回収期間 (PBP) ＝ </span>
    <span class="fraction"><span class="num">初期投資額</span><span class="den">年間キャッシュフロー</span></span>
    <span class="f-sep">｜</span>
    <span>投資利益率 (ROI) ＝ </span>
    <span class="fraction"><span class="num">利益</span><span class="den">投資額</span></span>
    <span> × 100 (%)</span>
  </div>
  <div class="f-sub">NPV（正味現在価値：差額が正なら投資） / IRR（内部収益率：NPVがゼロになる割引率）</div>
</div>
""",
        "memory_trick": """
<strong>☕ 100万円のカフェマシン代、何年で元が取れる？</strong><br>
・<strong>Payback</strong> ＝ 元を取る（払い戻す）、<strong>Period</strong> ＝ 期間（年数）！<br>
・問題文に<strong>「何年後に回収できるか」</strong>と書いてあれば、Period（期間）が入っている「PBP」一択！<br>
・<strong>合言葉：『 ペイバック（PBP）は元を取るピリオド（年数）！ROIは利益の割合（%）！ 』</strong>
""",
        "fast_solution": """
<strong>⚡ 3秒瞬殺キーワード対応：</strong><br>
・「何年後？」「回収期間」 → <strong>PBP</strong>（Payback Period）<br>
・「利益の割合（%）」「費用対効果」 → <strong>ROI</strong>（Return On Investment）<br>
・「現在価値に割り引いた差額」 → <strong>NPV</strong>（Net Present Value）<br>
・「正味現在価値がゼロになる割引率」 → <strong>IRR</strong>（Internal Rate of Return）
"""
    },
    {
        "id": 12,
        "category": "プロジェクトマネジメント",
        "title": "開発工数式（COCOMO・べき乗則）と生産性の計算",
        "target_q": "平成27年秋期 問51",
        "problem": "あるソフトウェア開発部門では，開発工数E(人月)と開発規模L(キロ行)との関係を，E＝5.2L^0.98（Lの0.98乗）としている。L＝10としたときの生産性(キロ行／人月)は，およそ幾らか。<br><strong>ア:</strong> 0.2 &nbsp; <strong>イ:</strong> 0.5 &nbsp; <strong>ウ:</strong> 1.9 &nbsp; <strong>エ:</strong> 5.2",
        "answer": "ア（0.2）",
        "formula": """
<div class="formula-box">
  <div class="f-title">【絶対に覚える公式】</div>
  <div class="f-main">
    <span>生産性 ＝ </span>
    <span class="fraction"><span class="num">開発規模 <em>L</em> (キロ行)</span><span class="den">開発工数 <em>E</em> (人月)</span></span>
  </div>
  <div class="f-sub">※べき乗式 <em>E</em> ＝ <em>a</em> × <em>L<sup>b</sup></em> において、<em>b</em> ≒ 1 のときは「ほぼ1乗」として近似計算する！</div>
</div>
""",
        "memory_trick": """
<strong>😱 0.98乗にビビるな！「ほぼ1乗」で割り算するだけ！</strong><br>
・試験会場で指数計算機はない！0.98乗は「ほぼ1乗（10<sup>1</sup> ＝ 10）」！<br>
・生産性は「1人月あたり何キロ行作れるか」だから、「規模 ÷ 工数」！<br>
・<strong>合言葉：『 生産性＝できた量 ÷ かかった工数！0.98乗は1乗とみなして割る！ 』</strong>
""",
        "fast_solution": """
<strong>⚡ 10秒瞬殺解法ステップ：</strong><br>
① 工数：<em>E</em> ＝ 5.2 × 10<sup>0.98</sup> ≒ 5.2 × 10 ＝ <strong>52人月</strong><br>
② 生産性：10 ÷ 52 ≒ 10 ÷ 50 ＝ <strong>0.2 キロ行/人月</strong>！<br>
③ 選択肢を見ると 0.2、0.5、1.9、5.2 と桁や値が離れているので、近似で「ア（0.2）」と即断できる！
"""
    },
    {
        "id": 13,
        "category": "プロジェクトマネジメント",
        "title": "要員割り当てパズル（制約条件足切り＋最小コスト探索）",
        "target_q": "平成29年春期 問52",
        "problem": "プログラムx, y, zの開発を2か月以内に完了したい。要員A, B, Cの3名（生産性・単価が異なる）。このプログラム群を開発する最小のコストは何千円か。各プログラムは1名が担当し，兼任不可。",
        "answer": "ウ（3,600千円）",
        "formula": """
<div class="formula-box">
  <div class="f-title">【解法の鉄則】</div>
  <div class="f-main">
    <span>所要期間 ＝ </span>
    <span class="fraction"><span class="num">プログラム規模</span><span class="den">要員の生産性</span></span>
    <span> ≦ 2か月 （制約条件） ｜ 費用 ＝ 所要期間 × 要員の月額単価</span>
  </div>
</div>
""",
        "memory_trick": """
<strong>🧩 パズルは「足切り」から攻める！</strong><br>
・3人×3プログラム＝6通りの全組み合わせを計算する必要なし！<br>
・「2か月以内」に終わらないNGな組み合わせをまずバツ印で抹殺する！<br>
・一番規模が大きくて重い仕事から、担当できる人を当てはめる！<br>
・<strong>合言葉：『 期限で絞って・重い順にハメて・残りで最小！ 』</strong>
""",
        "fast_solution": """
<strong>⚡ 瞬殺解法ステップ：</strong><br>
① 期間オーバー（>2か月）になる人を表から消去（足切り）。<br>
② 一番重いプログラムを担当できる人が1人〜2人に限定されるので、その人を確定。<br>
③ 残りの枠を比較し、コスト合計が最小になる組み合わせ（3,600千円）を選択！
"""
    },
    {
        "id": 14,
        "category": "サービスマネジメント",
        "title": "可用性管理の指標（MTBF・MTTR・MTRS・SLA許容ダウン時間）",
        "target_q": "ITIL 2011 / 平成28年春期 問54",
        "problem": "ITILにおいて可用性管理のKPIとして「保守性を表す指標値」の短縮を挙げている。保守性を表す指標に該当するものはどれか。<br><strong>ア:</strong> 中断の数 &nbsp; <strong>イ:</strong> MTBF &nbsp; <strong>ウ:</strong> サービス可用性 &nbsp; <strong>エ:</strong> MTRS（平均サービス回復時間）",
        "answer": "エ（平均サービス回復時間: MTRS）",
        "formula": """
<div class="formula-box">
  <div class="f-title">【絶対に覚える公式・指標】</div>
  <div class="f-main">
    <span>保守性（Maintainability）指標 ＝ <strong>MTRS</strong>（平均サービス回復時間）</span>
    <span class="f-sep">｜</span>
    <span>信頼性（Reliability）指標 ＝ <strong>MTBF</strong>（平均故障間隔）</span>
  </div>
  <div class="f-sub">SLA稼働率の年間停止時間：1年＝8,760時間。99.9%稼働なら年間許容停止時間は 8,760 × 0.001 ＝ 約8.76時間！</div>
</div>
""",
        "memory_trick": """
<strong>🏥 壊れにくさと退院の早さで覚える！</strong><br>
・<strong>信頼性</strong> ＝ 「壊れにくさ」＝ 元気な期間が長いこと（MTBF）！<br>
・<strong>保守性</strong> ＝ 「直す速さ」＝ 入院から退院までの回復スピード（MTRS / MTTR）！<br>
・<strong>合言葉：『 保守性は直す速さ（MTRS）！信頼性は壊れにくさ（MTBF）！ 』</strong>
""",
        "fast_solution": """
<strong>⚡ 3秒瞬殺キーワード対応：</strong><br>
・問題文に「保守性を表す指標」と来たら → 「回復時間（Restore / MTRS）」を選ぶ！<br>
・「信頼性を表す指標」と来たら → 「故障間隔（Between / MTBF）」を選ぶ！
"""
    },
    {
        "id": 15,
        "category": "生産・ビジネスインダストリ",
        "title": "段取り時間最小化（巡回セールスマン・貪欲接続法）",
        "target_q": "平成26年秋期 問66",
        "problem": "NC工作機械を用いて4つの仕事a〜dを行う。各仕事間の段取り時間マトリクスから、合計段取り時間が最小になる順序を選んだときの合計時間は何時間か。",
        "answer": "ア（4時間）",
        "formula": """
<div class="formula-box">
  <div class="f-title">【解法の鉄則】</div>
  <div class="f-main">
    <span>合計段取り時間 ＝ 第1手 ＋ 第2手 ＋ 第3手 （仕事が4つなら段取りは3回）</span>
  </div>
  <div class="f-sub">貪欲法：表の中の最小値（最も所要時間の短い矢印）を優先して一本の鎖につなぐ</div>
</div>
""",
        "memory_trick": """
<strong>🧹 掃除の段取りで覚える！</strong><br>
・4つの仕事をする場合、間の段取り（切替）は「3回」発生する。<br>
・表の中で「1時間」など最もコストの低い矢印を探し、数珠つなぎ（一本道）にする！<br>
・枝分かれやループを作らず、全仕事（a, b, c, d）を一度ずつ通るルートを確定！<br>
・<strong>合言葉：『 一番安い矢印を数珠つなぎ！余り物は最後尾へ！ 』</strong>
""",
        "fast_solution": """
<strong>⚡ 瞬殺解法ステップ：</strong><br>
① マトリクス中の最小値「1時間」を探す → b→a (1h), a→c (1h) がつながる（b→a→cで計2h）。<br>
② 残った「d」への接続で最小を探す → c→d (2h)。<br>
③ ルート完成：b → a → c → d （合計：1 + 1 + 2 = <strong>4時間</strong>）！
"""
    },
    {
        "id": 16,
        "category": "基礎理論・アルゴリズム",
        "title": "カルノー図による論理式の簡単化（隣接ループと共通項）",
        "target_q": "平成22年春期 問2",
        "problem": "カルノー図において「1」が入っているセルをグループ化して簡単化した論理式を求める問題。",
        "answer": "エ（簡単化された積和標準形）",
        "formula": """
<div class="formula-box">
  <div class="f-title">【カルノー図の3大原則】</div>
  <div class="f-main">
    <span>① 「1」のマスを 1, 2, 4, 8個（2のべき乗個）の長方形でできるだけ大きく囲む！</span><br>
    <span>② 外側の端と端（左右端・上下端・四隅）はワープして隣り合っている！</span><br>
    <span>③ 囲みの中で「0から1へ変化する文字」は消去し、「変化しない文字」だけを積で残す！</span>
  </div>
</div>
""",
        "memory_trick": """
<strong>🗺️ パックマンの画面ワープで覚える！</strong><br>
・マス目の世界は球体！右端から出たら左端から入る！四隅の4つで1つのグループを作れる！<br>
・囲みが大きければ大きいほど、消える変数が多くなって式がシンプルになる！<br>
・<strong>合言葉：『 1を大きく囲え！変わらない変数だけ残して、グループ同士を＋でつなぐ！ 』</strong>
""",
        "fast_solution": """
<strong>⚡ 瞬殺解法ステップ：</strong><br>
① カルノー図の「1」を最大の2のべき乗サイズで囲む。<br>
② 4マスの囲み → 2変数が消えて2変数の積が残る。<br>
③ 2マスの囲み → 1変数が消えて3変数の積が残る。<br>
④ それぞれの積を「＋（OR）」で足し合わせた選択肢を一発で選ぶ！
"""
    },
    {
        "id": 17,
        "category": "基礎理論・データ構造",
        "title": "2分木の走査順序（先行順・中間順・後行順・再帰出力）",
        "target_q": "平成26年春期 問6",
        "problem": "各ノードのデータを出力する再帰処理f(ノードn)：「右の子があればf(右)を実行 → 左の子があればf(左)を実行 → ノードnの値を出力」。このときの出力順序はどれか。<br><strong>正解:</strong> エ（ED－CB×÷A＋）",
        "answer": "エ",
        "formula": """
<div class="formula-box">
  <div class="f-title">【木構造の3大走査順】</div>
  <div class="f-main">
    <span>・先行順（前序）：<strong>自分</strong> → 左 → 右</span><br>
    <span>・中間順（通り順）：左 → <strong>自分</strong> → 右</span><br>
    <span>・後行順（帰りがけ）：左 → 右 → <strong>自分</strong></span>
  </div>
  <div class="f-sub">※問題独自の定義「右 → 左 → 自分」の場合：輪郭を右回りになぞるだけで瞬殺できる！</div>
</div>
""",
        "memory_trick": """
<strong>🌲 木の周りを歩くペン先トレース法で覚える！</strong><br>
・「自分を出力」が処理の最後にある（後行順）場合、<strong>ノードの真下（または帰り道）にペン先が触れた瞬間</strong>に出力される！<br>
・右から先に進むなら「木の輪郭を右側からグルッとなぞる」！<br>
・葉（末端）にぶつかったら帰り道で次々に出力される！<br>
・<strong>合言葉：『 右・左・自分で下から出す！末端の葉から順番に回収！ 』</strong>
""",
        "fast_solution": """
<strong>⚡ 瞬殺解法ステップ：</strong><br>
① 一番深い右下のノードから順に処理が終わって出力される。<br>
② 末端の「E, D」が真っ先に出てくる選択肢（エ）を即座に特定！
"""
    },
    {
        "id": 18,
        "category": "基礎理論・データ構造",
        "title": "ハッシュ表の探索時間特性（衝突なしの場合のグラフ）",
        "target_q": "平成25年秋期 問5",
        "problem": "ハッシュ表の理論的な探索時間を示すグラフはどれか。ここで複数のデータが同じハッシュ値になること（衝突）はないものとする。",
        "answer": "エ（データ数nが増えても探索時間が変わらない＝水平な横ばい直線）",
        "formula": """
<div class="formula-box">
  <div class="f-title">【探索アルゴリズムの計算量 O】</div>
  <div class="f-main">
    <span>・ハッシュ法（衝突なし）：<strong>O(1)</strong> （データ数に関わらず<strong>一定時間・水平グラフ</strong>）</span><br>
    <span>・2分探索：<strong>O(log<sub>2</sub> n)</strong> （緩やかに上昇する曲線）</span><br>
    <span>・線形探索（順次探索）：<strong>O(n)</strong> （比例する右上がりの直線）</span>
  </div>
</div>
""",
        "memory_trick": """
<strong>🗄️ コインロッカーの鍵番号で覚える！</strong><br>
・コインロッカーが10個でも1万個でも、鍵に「777番」と書いてあれば探す時間は同じ1秒！<br>
・ハッシュ関数で一発で保管場所が計算できるため、データ数 <em>n</em> が増えても時間は一切増えない！<br>
・<strong>合言葉：『 ハッシュは一発！データが増えても探索時間は横ばい O(1)！ 』</strong>
""",
        "fast_solution": """
<strong>⚡ 3秒瞬殺解法ステップ：</strong><br>
「衝突はない」と明記されているので、計算量は O(1)。グラフは横軸（データ数）に対して縦軸（時間）がフラットな<strong>「水平直線（エ）」</strong>を選ぶ！
"""
    }
]

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>AP応用情報 計算問題・数式即効チートシート（A4印刷用）</title>
  <style>
    /* ========================================================
       A4縦向き印刷 最適化スタイルシート
       ======================================================== */
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 12mm 12mm;
      @bottom-right {
        content: counter(page) " / " counter(pages);
        font-size: 8pt;
        color: #64748b;
      }
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: "Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Meiryo", sans-serif;
      font-size: 8.8pt;
      line-height: 1.45;
      color: #1e293b;
      background: #f1f5f9;
      margin: 0;
      padding: 0;
    }

    /* 印刷時のコンテナ */
    .sheet-container {
      width: 100%;
      max-width: 210mm;
      margin: 0 auto;
      background: #ffffff;
      padding: 10px 15px;
    }

    @media screen {
      body {
        padding: 20px 10px;
      }
      .sheet-container {
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        border-radius: 8px;
        padding: 25px;
      }
      .no-print-bar {
        position: sticky;
        top: 0;
        z-index: 100;
        background: #0f172a;
        color: #ffffff;
        padding: 12px 20px;
        border-radius: 6px;
        margin-bottom: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      }
      .print-btn {
        background: #38bdf8;
        color: #0f172a;
        font-weight: 800;
        border: none;
        padding: 8px 18px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 10pt;
      }
      .print-btn:hover {
        background: #7dd3fc;
      }
    }

    @media print {
      body {
        background: #ffffff;
      }
      .sheet-container {
        box-shadow: none;
        padding: 0;
        max-width: none;
      }
      .no-print-bar {
        display: none !important;
      }
      .card {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }

    /* ヘッダーバナー */
    .header-banner {
      border-bottom: 3px solid #0f172a;
      padding-bottom: 8px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .header-title {
      font-size: 15pt;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .header-sub {
      font-size: 8.5pt;
      color: #64748b;
      font-weight: 700;
    }
    .header-tag {
      background: #ef4444;
      color: #ffffff;
      font-size: 8pt;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 3px;
    }

    /* 各計算問題カード */
    .card {
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      background: #ffffff;
      margin-bottom: 13px;
      overflow: hidden;
    }

    .card-header {
      background: #0f172a;
      color: #ffffff;
      padding: 5px 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .card-cat {
      font-size: 7.5pt;
      font-weight: 800;
      background: #38bdf8;
      color: #0f172a;
      padding: 1px 6px;
      border-radius: 3px;
      text-transform: uppercase;
    }
    .card-title {
      font-size: 9.8pt;
      font-weight: 800;
      color: #f8fafc;
      flex-grow: 1;
      margin-left: 8px;
    }
    .card-target {
      font-size: 7.5pt;
      color: #cbd5e1;
    }

    .card-body {
      padding: 8px 10px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 6px;
    }

    /* 問題文ブロック */
    .prob-box {
      background: #f8fafc;
      border-left: 3px solid #64748b;
      padding: 5px 8px;
      font-size: 8.5pt;
      color: #334155;
    }
    .prob-label {
      font-weight: 800;
      color: #0f172a;
      margin-right: 4px;
    }
    .ans-badge {
      display: inline-block;
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #f87171;
      font-weight: 800;
      padding: 0 5px;
      border-radius: 3px;
      font-size: 8pt;
      margin-left: 6px;
    }

    /* 公式枠 & CSSネイティブ分数 */
    .formula-box {
      background: #f0fdf4;
      border: 1.5px solid #22c55e;
      border-radius: 4px;
      padding: 6px 10px;
    }
    .f-title {
      font-size: 8pt;
      font-weight: 800;
      color: #15803d;
      margin-bottom: 3px;
    }
    .f-main {
      font-size: 10pt;
      font-weight: 800;
      color: #14532d;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 3px;
    }
    .f-sep {
      color: #86efac;
      margin: 0 6px;
      font-weight: normal;
    }
    .f-sub {
      font-size: 7.5pt;
      color: #166534;
      margin-top: 4px;
    }

    /* 完全に崩れないCSSネイティブ分数スタイル */
    .fraction {
      display: inline-flex;
      flex-direction: column;
      vertical-align: middle;
      text-align: center;
      padding: 0 3px;
      font-size: 0.95em;
      line-height: 1.1;
    }
    .fraction .num {
      border-bottom: 1.5px solid currentColor;
      padding-bottom: 1px;
    }
    .fraction .den {
      padding-top: 2px;
    }

    /* 覚え方＆瞬殺テクニック グリッド */
    .explain-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 2px;
    }

    .trick-box {
      background: #fefce8;
      border: 1px solid #fde047;
      border-radius: 4px;
      padding: 6px 8px;
      font-size: 8pt;
      color: #713f12;
    }
    .fast-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 4px;
      padding: 6px 8px;
      font-size: 8pt;
      color: #1e3a8a;
    }

    .sec-title {
      font-weight: 800;
      font-size: 8pt;
      margin-bottom: 3px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* 印刷時の改ページガイド */
    .page-break-hint {
      page-break-before: always;
      break-before: always;
    }
  </style>
</head>
<body>

  <div class="sheet-container">
    <div class="no-print-bar">
      <div>
        <strong>🖨️ A4印刷用チートシート</strong>（Ctrl+P / Cmd+P でそのまま印刷・PDF保存できます）
      </div>
      <button class="print-btn" onclick="window.print()">今すぐA4印刷する</button>
    </div>

    <div class="header-banner">
      <div>
        <span class="header-tag">前日・直前超速対策</span>
        <div class="header-title">AP 応用情報 計算問題＆公式 即効暗記チートシート</div>
        <div class="header-sub">あなたが過去に間違えた問題から厳選！「公式」×「日常たとえの覚え方」×「10秒瞬殺ステップ」</div>
      </div>
      <div style="text-align: right; font-size: 7.5pt; color: #64748b;">
        全18テーマ完全収録<br>試験会場持込用 A4版
      </div>
    </div>

    <!-- ここにカードをループ挿入 -->
    __CARDS_HTML__

  </div>

</body>
</html>
"""

def generate_html():
    cards_html = []
    
    TOPIC_LINKS = {1: ('math-queueing-mm1-wait-time.md', 'R4春 問3', 'https://www.ap-siken.com/kakomon/04_haru/q3.html'), 2: ('sys-availability-mtbf-mttr.md', 'R4秋 問14', 'https://www.ap-siken.com/kakomon/04_aki/q14.html'), 3: ('sys-cpu-utilization-mips.md', 'H28秋 問15', 'https://www.ap-siken.com/kakomon/28_aki/q15.html'), 4: ('net-host-count-prefix-28.md', 'R4春 問34', 'https://www.ap-siken.com/kakomon/04_haru/q34.html'), 5: ('net-subnet-broadcast-address-20.md', 'H26春 問33', 'https://www.ap-siken.com/kakomon/26_haru/q33.html'), 6: ('net-lan-transmission-time-efficiency.md', 'R5秋 問31', 'https://www.ap-siken.com/kakomon/05_aki/q31.html'), 7: ('net-transmission-time-packet-interval.md', 'R5春 問32', 'https://www.ap-siken.com/kakomon/05_haru/q32.html'), 8: ('net-majority-voting-error-rate-calc.md', 'H25秋 問33', 'https://www.ap-siken.com/kakomon/25_aki/q33.html'), 9: ('strategy-breakeven-point.md', 'R1秋 問77', 'https://www.ap-siken.com/kakomon/01_aki/q77.html'), 10: ('strategy-max-profit-price-calc.md', 'R4春 問76', 'https://www.ap-siken.com/kakomon/04_haru/q76.html'), 11: ('strategy-investment-pbp-payback-period.md', 'R5秋 問64', 'https://www.ap-siken.com/kakomon/05_aki/q64.html'), 12: ('pm-productivity-effort-power-formula.md', 'H30春 問54', 'https://www.ap-siken.com/kakomon/30_haru/q54.html'), 13: ('pm-cost-assignment-puzzle.md', 'R1秋 問54', 'https://www.ap-siken.com/kakomon/01_aki/q54.html'), 14: ('service-availability-maintainability-mtrs.md', 'R4春 問56', 'https://www.ap-siken.com/kakomon/04_haru/q56.html'), 15: ('ind-setup-time-min-order.md', 'R6秋 問72', 'https://www.ap-siken.com/kakomon/06_aki/q72.html'), 16: ('theory-karnaugh-map-simplification.md', 'R4秋 問2', 'https://www.ap-siken.com/kakomon/04_aki/q2.html'), 17: ('algo-binary-tree-postorder-traversal.md', 'R6春 問6', 'https://www.ap-siken.com/kakomon/06_haru/q6.html'), 18: ('algo-hash-table-constant-search-time.md', 'R5春 問19', 'https://www.ap-siken.com/kakomon/05_haru/q19.html')}
    for idx, topic in enumerate(CALC_TOPICS, 1):
        fname, k_label, k_url = TOPIC_LINKS.get(topic['id'], ("", topic['target_q'], "https://www.ap-siken.com/"))
        pb_class = ""
        if idx in [4, 7, 10, 13, 16]:
            pb_class = "page-break-hint"

        card = f"""
    <div class="card {pb_class}">
      <div class="card-header">
        <span class="card-cat">{topic['category']}</span>
        <a class="card-title" href="offline_app.html#{fname}" target="_blank" title="作成した詳細解説ページを開く" style="text-decoration:none; color:#f8fafc;">#{topic['id']} 📖 {topic['title']}</a>
        <a class="card-target" href="{k_url}" target="_blank" rel="noopener" title="過去問道場でこの問題を開く" style="text-decoration:none; background:#1e293b; color:#38bdf8; padding:2px 7px; border-radius:3px; font-weight:800; border:1px solid #38bdf8;">📌 {k_label} ↗</a>
      </div>
      <div class="card-body">
        <div class="prob-box">
          <span class="prob-label">【過去問】</span>{topic['problem']}
          <span class="ans-badge">正解: {topic['answer']}</span>
        </div>
        {topic['formula']}
        <div class="explain-grid">
          <div class="trick-box">
            <div class="sec-title">🧠 式の覚え方・合言葉（なぜそうなるか）</div>
            {topic['memory_trick']}
          </div>
          <div class="fast-box">
            <div class="sec-title">⚡ 本番での10秒瞬殺解法ステップ</div>
            {topic['fast_solution']}
          </div>
        </div>
      </div>
    </div>
"""
        cards_html.append(card)

    final_html = HTML_TEMPLATE.replace("__CARDS_HTML__", "\n".join(cards_html))
    
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write(final_html)

    print(f"Successfully generated: {OUTPUT_PATH} ({len(final_html)} bytes)")

if __name__ == "__main__":
    generate_html()
