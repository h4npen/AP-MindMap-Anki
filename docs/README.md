# 応用情報技術者試験（AP）直感攻略ノート一覧

応用情報技術者試験の出題範囲（シラバス）の中分類単元に準拠した体系的インデックスです。

---

## 📂 フォルダの運用サイクル

1. **`docs/inputs/` (入力・投入)**:
   - 過去問道場で間違えた問題（スクショ画像、CSV、問題番号メモなど）を置くフォルダ。
   - 「inputsのファイルから解説を作って」と指示すると、AIがこのフォルダを読み取って自動作成します。
2. **`docs/inbox/` (生成・未読)**:
   - 新しく自動生成された解説ノートが入る受信用フォルダ（単元ごとに自動分類）。
   - バス通勤中などにスマホでサクッと読み進めます。
3. **`docs/ap-prep/` (定着・保管)**:
   - 読了して「腹落ち・理解できた」ノートを移動してストック・復習するアーカイブフォルダ。

---

## 🚌 通勤バス・スマホ学習のための解説MD作成ルール（厳格ガイドライン）

今後AI（Antigravity）が新しい解説ノートを作成・改修する際は、**必ず以下のルールと構成テンプレートを遵守** すること。

### 1. デザイン原則（通勤スマホ最適化 ＆ エピソード記憶定着）
- **所要時間5〜8分**: バスの1区間・通勤のスキマ時間で1本読み切れる文量。
- **文系・非エンジニア向け（情景の浮かぶたとえ話）**: 専門用語は必ず「日常生活のたとえ話（パン屋、スマホ、銀行、ラーメン屋等）」に翻訳し、Why（なぜその仕組みが必要なのか）をストーリーとして腹落ちさせる。
- **ネタバレ厳禁（折りたたみ正解）**: スクロールした瞬間に答えが見えてしまわないよう、問題文直下に `<details>` タグで正解を隠す。自力で考えてからタップして正解を確認できるクイズ体験を担保する。
- **セクション0でのネタバレ禁止**: `## 0. 一枚で：...` の冒頭に直接正解の記号を書かない。合言葉やMermaidチャートで「考え方の手順」を示す。
- **モバイルファーストのレイアウト**: 横スクロールが発生しにくい簡潔な表やMermaid図、筆算レベルで省略しない途中計算パズルを採用。
- **数式の平易化（文字化け防止）**: LaTeX記法（`$\frac{2}{3}$` 等）は避け、誰でも直感的に読める分数（`2/3`）や日本語の四則演算にする。

### 2. 必須構成テンプレート
````markdown
# タイトル：[日常のたとえ話] で覚える「[重要キーワード]」

> **想定読者**: [つまずきポイントを持つ文系受験者]  
> **省いたもの**: [難解すぎる枝葉の数式や学説]  
> **所要時間**: 6〜8分  
> **対象過去問**: 応用情報技術者 [年度・期 午前問XX]  

---

## 【対象過去問】[年度・期 午前問XX]

**【問題】**  
[問題文]

- **ア**: ...
- **イ**: ...
- **ウ**: ...
- **エ**: ...

<details>
<summary>▶ 正解を表示する</summary>

**正解: [記号]（[正解の記述]）**

</details>

---

## 0. 一枚で：[解く手順・要約チャート・合言葉]！

[Mermaid図 や 早見表、3ステップ解法、覚えやすい合言葉]

---

## 1. なぜそうなるのか？（日常のたとえ話・言葉の理屈）

[身近なモノ・日常に例えた直感的腹落ち解説。情景が目に浮かぶストーリーで「なるほど！」という納得感を作る]

---

## 2. 選択肢のひっかけポイント ＆ 途中計算パズル

[各選択肢がなぜ消去できるのか、作問者の意図や人間の心理トラップを分析。小数の割り算などを10倍して消す途中計算など]

---

## 3. 午後試験 記述対策チェックリスト（※該当する場合）

- [ ] **Q. [記述で狙われる問い]**  
  → **「[40字程度の模範解答]」**

---

## 🎯 次の2分アクション（定着チェック）

- [ ] **画面の一番上に戻り、正解を隠した状態で正解肢を確信を持って選べるか試してみよう！**
````

---

## 04. システム構成要素

| ファイル名 | テーマ・過去問 | 日常のたとえ話（暗記フック・要約） | 状態 |
| :--- | :--- | :--- | :--- |
| [sys-availability-mtbf-mttr.md](./inbox/04_システム構成要素/sys-availability-mtbf-mttr.md) | **稼働率とMTBF・MTTR**<br>（[R4秋 問14](https://www.ap-siken.com/kakomon/04_aki/q14.html)） | 『Bは元気・Rはリペア（修理）』<br>スマホの元気時間と入院時間。両方1.5倍になっても比率だから「変わらない」！ | inbox |

## 05. ソフトウェア

| ファイル名 | テーマ・過去問 | 日常のたとえ話（暗記フック・要約） | 状態 |
| :--- | :--- | :--- | :--- |
| [os-preemption-task-scheduling.md](./inbox/05_ソフトウェア/os-preemption-task-scheduling.md) | **プリエンプション方式のタスク管理**<br>（[H27秋 問16](https://www.ap-siken.com/kakomon/27_aki/q16.html)） | 市役所窓口のVIP顧客<br>一般客Bが手続き中でも、市長Aが来たら強制中断してCPUを横取り！自発的解放は待ち状態 | inbox |

## 09. データベース

| ファイル名 | テーマ・過去問 | 日常のたとえ話（暗記フック・要約） | 状態 |
| :--- | :--- | :--- | :---: |
| [db-acid-properties.md](./inbox/09_データベース/db-acid-properties.md) | **トランザクションのACID特性**<br>（[R2秋 問30](https://www.ap-siken.com/kakomon/02_aki/q30.html)） | 銀行のATM1万円送金<br>A:全か無か、C:矛盾なし、I:一人ずつ隔離、D:落雷停電でも消えない耐久力（Durability） | inbox |
| [db-three-schema-architecture.md](./inbox/09_データベース/db-three-schema-architecture.md) | **3層スキーマ構造と内部設計**<br>（[H31春 問26](https://www.ap-siken.com/kakomon/31_haru/q26.html)） | 3段のお重イメージ<br>上段:外部（画面）、中段:概念（テーブル設計）、下段:内部（記録媒体・インデックス） | inbox |

## 10. ネットワーク

| ファイル名 | テーマ・過去問 | 日常のたとえ話（暗記フック・要約） | 状態 |
| :--- | :--- | :--- | :---: |
| [network-ipv6-notation.md](./inbox/10_ネットワーク/network-ipv6-notation.md) | **IPv6アドレス表記ルール**<br>（[R4春 問31](https://www.ap-siken.com/kakomon/04_haru/q31.html)） | 小学生の引き算パズル<br>「::」は1回だけ！2回あると引き算が壊れて復元不能。ドット混入は即消去 | inbox |
| [network-osi-7layers-protocols.md](./inbox/10_ネットワーク/network-osi-7layers-protocols.md) | **OSI参照モデルとプロトコル**<br>（[R5春 問34](https://www.ap-siken.com/kakomon/05_haru/q34.html)） | 7階建てマンションの住人<br>4階（トランスポート層）の住人は「TCP」と「UDP」だけ！HTTPは7階、IPは3階 | inbox |
| [network-wifi-80211ac.md](./inbox/10_ネットワーク/network-wifi-80211ac.md) | **無線LAN規格（11acと周波数帯）**<br>（[R3春 問33](https://www.ap-siken.com/kakomon/03_haru/q33.html)） | 『あっ（a）、クリア（ac）な5GHz！』<br>電子レンジの邪魔が入らない5GHz専用。無線は衝突回避（CA）なのでCDは即消去 | inbox |
| [net-multicast-mac-mapping.md](./inbox/10_ネットワーク/net-multicast-mac-mapping.md) | **マルチキャストのMACアドレス変換**<br>（[平成23年特別 問37](https://www.ap-siken.com/kakomon/23_toku/q37.html)） | 『先頭は 01-00-5E 固定！』<br>ツアー客専用の共通バス乗車券 | inbox |
| [net-hdlc-flag-sequence.md](./inbox/10_ネットワーク/net-hdlc-flag-sequence.md) | **HDLCのフラグシーケンス**<br>（[平成20年秋期 問57](https://www.ap-siken.com/kakomon/20_aki/q57.html)） | 『イチが6個の 01111110！』<br>サンドイッチの食パン（パン・具・パン） | inbox |
| [net-subnet-usable-hosts-calculation.md](./inbox/10_ネットワーク/net-subnet-usable-hosts-calculation.md) | **サブネットマスク /26**<br>（[令和2年秋期 問35](https://www.ap-siken.com/kakomon/02_aki/q35.html)） | 『2の6乗＝64 から 2引いて 62台！』<br>幹事席と案内板で2席埋まるパーティー会場 | inbox |
| [net-arp-ip-to-mac.md](./inbox/10_ネットワーク/net-arp-ip-to-mac.md) | **ARP**<br>（[平成29年秋期 問34](https://www.ap-siken.com/kakomon/29_aki/q34.html)） | 『IPからMACを知りたいならARP！』<br>教室で「学籍番号〇〇の佐藤くん、席どこ？」と大声で聞く先生 | inbox |
| [net-wifi-ssid-specification.md](./inbox/10_ネットワーク/net-wifi-ssid-specification.md) | **無線LANのSSID**<br>（[平成29年秋期 問31](https://www.ap-siken.com/kakomon/29_aki/q31.html)） | 『最長32オクテット（バイト）のネットワーク名！』<br>カフェのWi-Fi検索画面に出てくる「Free-WiFi-Cafe」の看板名 | inbox |
| [net-subnet-broadcast-address-20.md](./inbox/10_ネットワーク/net-subnet-broadcast-address-20.md) | **ブロードキャストアドレス計算（/20）**<br>（[平成26年春期 問33](https://www.ap-siken.com/kakomon/26_haru/q33.html)） | 『ホスト部のビットをすべて1（255）にした最大値！』<br>クラス全員へ一斉放送する構内スピーカー | inbox |
| [net-router-mac-hop-by-hop.md](./inbox/10_ネットワーク/net-router-mac-hop-by-hop.md) | **ルータ越えの宛先MACアドレス**<br>（[平成31年春期 問33](https://www.ap-siken.com/kakomon/31_haru/q33.html)） | 『最終宛先IPは変わらない！宛先MACは次のルータになる！』<br>「東京→福岡」の宅配便。トラックは拠点ごとに乗り換える！ | inbox |
| [net-private-ip-ranges.md](./inbox/10_ネットワーク/net-private-ip-ranges.md) | **プライベートIPアドレス範囲**<br>（[平成19年春期 問54](https://www.ap-siken.com/kakomon/19_haru/q54.html)） | 『Aは10、Bは172.16〜31、Cは192.168！』<br>会社の内線番号のケタ数（10番、172番、192番） | inbox |
| [net-ipsec-network-layer-vpn.md](./inbox/10_ネットワーク/net-ipsec-network-layer-vpn.md) | **IPsec**<br>（[平成19年秋期 問59](https://www.ap-siken.com/kakomon/19_aki/q59.html)） | 『ネットワーク層（IP層）でVPNならIPsec！』<br>透明な道路に遮光トンネル（防弾ガラス）を被せる工事 | inbox |
| [net-cidr-descending-ip-allocation.md](./inbox/10_ネットワーク/net-cidr-descending-ip-allocation.md) | **降順IPアドレス割り当て（/26）**<br>（[令和7年春期 問32](https://www.ap-siken.com/kakomon/07_haru/q32.html)） | 『ブロードキャストの1個手前が先頭の割り当てアドレス！』<br>映画館の座席を一番後ろ（末尾）から詰めて座るルール | inbox |
| [net-modem-v24-interface.md](./inbox/10_ネットワーク/net-modem-v24-interface.md) | **V.24**<br>（[平成17年春期 問54](https://www.ap-siken.com/kakomon/17_haru/q54.html)） | 『端末とモデムの物理制御といえば V.24！』<br>昔のパソコンの後ろにあった台形のネジ止めシリアル端子（RS-232C） | inbox |
| [net-poe-power-over-ethernet.md](./inbox/10_ネットワーク/net-poe-power-over-ethernet.md) | **PoE**<br>（[令和7年春期 問29](https://www.ap-siken.com/kakomon/07_haru/q29.html)） | 『LANケーブルで給電もするなら PoE！』<br>USBスマホ充電の「LANケーブル版」 | inbox |
| [net-routing-longest-match.md](./inbox/10_ネットワーク/net-routing-longest-match.md) | **ロンゲストマッチ（最長一致）**<br>（[令和7年春期 問31](https://www.ap-siken.com/kakomon/07_haru/q31.html)） | 『プレフィックス長（サブネットマスク）が最も長い行を採用！』<br>カーナビで「福岡市」より「福岡市東区香椎駅前」の案内を優先採用！ | inbox |
| [net-smime-email-security.md](./inbox/10_ネットワーク/net-smime-email-security.md) | **S/MIME**<br>（[平成27年秋期 問33](https://www.ap-siken.com/kakomon/27_aki/q33.html)） | 『メールの暗号化と改ざん防止・なりすまし防止は S/MIME！』<br>手紙に差出人の実印を押して、中身を見られない特製封筒に入れる | inbox |
| [net-napt-ip-masquerade.md](./inbox/10_ネットワーク/net-napt-ip-masquerade.md) | **NAPT（IPマスカレード）**<br>（[平成20年秋期 問36](https://www.ap-siken.com/kakomon/20_aki/q36.html)） | 『ポート番号も使って1つのグローバルIPを複数人で共有するのがNAPT！』<br>会社代表電話（外線）に「内線番号（ポート番号）」を足して同時通話 | inbox |
| [net-nat-address-translation.md](./inbox/10_ネットワーク/net-nat-address-translation.md) | **NAT**<br>（[平成18年秋期 問58](https://www.ap-siken.com/kakomon/18_aki/q58.html)） | 『プライベートIPとグローバルIPを相互変換するのがNAT！』<br>海外ホテルのフロントで部屋の内線と外線を1対1で繋ぐ交換手 | inbox |
| [net-repeater-physical-layer.md](./inbox/10_ネットワーク/net-repeater-physical-layer.md) | **リピータ**<br>（[平成20年秋期 問59](https://www.ap-siken.com/kakomon/20_aki/q59.html)） | 『物理層（第1層）で信号を増幅・中継するのはリピータ！』<br>マラソンコースの給水所で元気を取り戻して走り直すランナー | inbox |
| [net-dns-reverse-lookup-ptr.md](./inbox/10_ネットワーク/net-dns-reverse-lookup-ptr.md) | **DNSの逆引き**<br>（[令和6年秋期 問33](https://www.ap-siken.com/kakomon/06_aki/q33.html)） | 『IPアドレスからホスト名を調べるのが逆引き！』<br>着信履歴の電話番号を見て「これ誰だっけ？」と電話帳を逆引き検索 | inbox |
| [net-arp-purpose-and-role.md](./inbox/10_ネットワーク/net-arp-purpose-and-role.md) | **ARPの本質**<br>（[令和3年秋期 問32](https://www.ap-siken.com/kakomon/03_aki/q32.html)） | 『IPアドレスからMACアドレスを得るプロトコル！』<br>郵便番号だけじゃ届かない！「〇〇番地の黒いポスト」を特定する作業 | inbox |
| [net-voip-gateway-role.md](./inbox/10_ネットワーク/net-voip-gateway-role.md) | **VoIPゲートウェイ**<br>（[平成24年秋期 問35](https://www.ap-siken.com/kakomon/24_aki/q35.html)） | 『アナログ電話網とIP網の境界に置いて音声を変換するのがVoIPゲートウェイ！』<br>日本語（アナログ音声）を英語（IPパケット）に同時通訳する通訳さん | inbox |
| [net-frame-relay-vs-packet.md](./inbox/10_ネットワーク/net-frame-relay-vs-packet.md) | **フレームリレー**<br>（[平成18年秋期 問56](https://www.ap-siken.com/kakomon/18_aki/q56.html)） | 『網内の誤り制御を省略して高速化！エラー処理は端末に任せる！』<br>駅ごとの全員荷物検査（パケット交換）をやめて、改札スルーで爆速にした新幹線 | inbox |
| [net-l2-switch-is-bridge.md](./inbox/10_ネットワーク/net-l2-switch-is-bridge.md) | **スイッチングハブの本質**<br>（[平成30年秋期 問32](https://www.ap-siken.com/kakomon/30_aki/q32.html)） | 『L2スイッチは、データリンク層（第2層）の「ブリッジ」！』<br>道路の交差点で「車のナンバープレート（MACアドレス）」を見て仕分ける警察官 | inbox |
| [net-rss-web-feed-xml.md](./inbox/10_ネットワーク/net-rss-web-feed-xml.md) | **RSS**<br>（[平成26年春期 問35](https://www.ap-siken.com/kakomon/26_haru/q35.html)） | 『Webサイトの見出しや要約の更新通知フォーマットは RSS！』<br>新聞の配達員が「今日の朝刊の見出し一覧」をポストに入れてくれる仕組み | inbox |
| [net-class-d-multicast.md](./inbox/10_ネットワーク/net-class-d-multicast.md) | **クラスDのIPアドレス**<br>（[令和6年秋期 問35](https://www.ap-siken.com/kakomon/06_aki/q35.html)） | 『クラスD ＝ マルチキャスト（特定グループ一斉送信）！』<br>テレビのチャンネル。同じ番組（データ）を見たい人全員が同時に受信！ | inbox |
| [net-snmp-network-management.md](./inbox/10_ネットワーク/net-snmp-network-management.md) | **SNMP**<br>（[平成26年春期 問34](https://www.ap-siken.com/kakomon/26_haru/q34.html)） | 『ネットワーク機器の監視や障害情報収集といえば SNMP！』<br>学校の保健室の先生が、各教室の生徒の体温や脈拍を定期チェック | inbox |
| [net-bus-topology-cable.md](./inbox/10_ネットワーク/net-bus-topology-cable.md) | **バス型トポロジ**<br>（[平成19年秋期 問58](https://www.ap-siken.com/kakomon/19_aki/q58.html)） | 『1本の基幹ケーブルに全ノードが接続されている形態！』<br>電車の路線。1本のレールにすべての駅（端末）がぶら下がっている形 | inbox |
| [net-ppp-dialup-protocol.md](./inbox/10_ネットワーク/net-ppp-dialup-protocol.md) | **PPP**<br>（[平成29年春期 問33](https://www.ap-siken.com/kakomon/29_haru/q33.html)） | 『WANの1対1接続で認証・リンク制御・誤り処理を行うプロトコル！』<br>直通の糸電話。相手が誰か確認（認証）してから会話をスタート！ | inbox |
| [network-dns.md](./ap-prep/10_ネットワーク/network-dns.md) | **DNSキャッシュポイズニングとDNSSEC**<br>（午前・午後頻出） | カミンスキー型攻撃がTTL待ちを回避する原理と、DS/DNSKEY/RRSIGの信頼の連鎖 | ap-prep |
| [network-frame-relay.md](./ap-prep/10_ネットワーク/network-frame-relay.md) | **フレームリレー方式**<br>（午前頻出） | 交換機での誤りチェックをサボって高速化。CIR超過パケットはDE=1で混雑時に優先破棄 | ap-prep |
| [network-tcp-vs-udp.md](./ap-prep/10_ネットワーク/network-tcp-vs-udp.md) | **TCP と UDP の違い**<br>（午前頻出） | 書留郵便（TCP: 再送・3ウェイハンドシェイク） vs 拡声器（UDP: 投げっぱなし・生配信） | ap-prep |

## 11. セキュリティ

| ファイル名 | テーマ・過去問 | 日常のたとえ話（暗記フック・要約） | 状態 |
| :--- | :--- | :--- | :---: |
| [sec-session-hijacking-reauth.md](./inbox/11_セキュリティ/sec-session-hijacking-reauth.md) | **セッション乗っ取り対策（再認証）**<br>（[H28春 問41](https://www.ap-siken.com/kakomon/28_haru/q41.html)） | ホテルのカードキーと貴重品金庫<br>部屋の鍵を盗まれても、最後の金庫（個人情報）を開ける直前のパスワード再入力で防ぐ | inbox |
| [sec-tls-client-authentication.md](./inbox/11_セキュリティ/sec-tls-client-authentication.md) | **TLSクライアント認証の送付順序**<br>（[R3春 問45](https://www.ap-siken.com/kakomon/03_haru/q45.html)） | 高級会員制クラブの名刺交換<br>詐欺を警戒してまず店側が名刺（b） → 客が会員証（a） → 店が確認（c）！ | inbox |
| [sec-ipsec-ah-esp.md](./inbox/11_セキュリティ/sec-ipsec-ah-esp.md) | **IPsec（AHとESP）**<br>（[R3秋 問43](https://www.ap-siken.com/kakomon/03_aki/q43.html)） | 宅配便の封蝋と頑丈な金庫<br>AHは認証・改ざん防止のみ（暗号化なし）。ESPは暗号化＋認証の万能選手 | inbox |

## 12. システム開発技術

| ファイル名 | テーマ・過去問 | 日常のたとえ話（暗記フック・要約） | 状態 |
| :--- | :--- | :--- | :---: |
| [dev-square-quality-characteristics.md](./inbox/12_システム開発技術/dev-square-quality-characteristics.md) | **ソフトウェア品質特性 (SQuaRE)**<br>（[R1秋 問47](https://www.ap-siken.com/kakomon/01_aki/q47.html)） | スマホ選びの8大チェック項目<br>機能適合性＝明示的＆暗黙の「ニーズを満足させる」機能があるかどうか | inbox |

## 13. ソフトウェア開発管理技術

| ファイル名 | テーマ・過去問 | 日常のたとえ話（暗記フック・要約） | 状態 |
| :--- | :--- | :--- | :---: |
| [dev-cmmi-maturity-levels.md](./inbox/13_ソフトウェア開発管理技術/dev-cmmi-maturity-levels.md) | **CMMI（能力成熟度モデル統合）**<br>（[H29秋 問49](https://www.ap-siken.com/kakomon/29_aki/q49.html)） | 開発組織のオトナ度ピラミッド<br>M＝Maturity（成熟度）。共通フレームは作業基準、CMMIは組織の通信簿 | inbox |

## 14. プロジェクトマネジメント

| ファイル名 | テーマ・過去問 | 日常のたとえ話（暗記フック・要約） | 状態 |
| :--- | :--- | :--- | :---: |
| [pm-cost-assignment-puzzle.md](./inbox/14_プロジェクトマネジメント/pm-cost-assignment-puzzle.md) | **要員割り当て最小コストパズル**<br>（[R1秋 問54](https://www.ap-siken.com/kakomon/01_aki/q54.html)） | 『期限で絞って・重い順に・パズルする！』<br>遅いCさんは4キロの仕事を2か月で終わらせられない（足切り脱落）から解く | inbox |

## 15. サービスマネジメント

| ファイル名 | テーマ・過去問 | 日常のたとえ話（暗記フック・要約） | 状態 |
| :--- | :--- | :--- | :---: |
| [service-level-management-sla.md](./inbox/15_サービスマネジメント/service-level-management-sla.md) | **サービスレベル管理 (SLM) と SLA**<br>（[H27秋 問56](https://www.ap-siken.com/kakomon/27_aki/q56.html)） | ホテルの宿泊プラン契約<br>顧客とサービス目標を「合意文書（SLA）」として交わし、定期的にPDCAを回す | inbox |

## 16. システム監査

| ファイル名 | テーマ・過去問 | 日常のたとえ話（暗記フック・要約） | 状態 |
| :--- | :--- | :--- | :--- |
| [audit-system-audit-charter-approval.md](./inbox/16_システム監査/audit-system-audit-charter-approval.md) | **規程の承認者と3者の力関係**<br>（[H30春 問59](https://www.ap-siken.com/kakomon/30_haru/q59.html)） | 警察と裁判所と社長<br>現場にルールを決めさせたら不正が隠せる（自己監査の禁止）。承認は社長一択！ | inbox |
| [audit-master-file-availability-cia.md](./inbox/16_システム監査/audit-master-file-availability-cia.md) | **可用性とセキュリティ3大要件 (CIA)**<br>（[R3春 問59](https://www.ap-siken.com/kakomon/03_haru/q59.html)） | 金庫のCIA3兄弟<br>機密＝見せない、完全＝壊させない、可用＝いつでも使える予備キー（サーバ二重化）！ | inbox |

## 17. システム企画

| ファイル名 | テーマ・過去問 | 日常のたとえ話（暗記フック・要約） | 状態 |
| :--- | :--- | :--- | :--- |
| [strategy-investment-pbp-payback-period.md](./inbox/17_システム企画/strategy-investment-pbp-payback-period.md) | **投資評価の回収期間法 (PBP)**<br>（[R5秋 問64](https://www.ap-siken.com/kakomon/05_aki/q64.html)） | カフェの100万エスプレッソマシン<br>何年で元が取れる？Period（期間）＝PBP。利益率はROI、現在価値はNPV | inbox |

## 19. 経営戦略マネジメント

| ファイル名 | テーマ・過去問 | 日常のたとえ話（暗記フック・要約） | 状態 |
| :--- | :--- | :--- | :--- |
| [strategy-value-chain-frameworks.md](./inbox/19_経営戦略マネジメント/strategy-value-chain-frameworks.md) | **バリューチェーンと4大フレームワーク**<br>（[R3秋 問67](https://www.ap-siken.com/kakomon/03_aki/q67.html)） | パン屋さんのバトンリレー<br>「5つの主活動と4つの支援活動」＝バリューチェーン。SWOT・BSCとの見分け方 | inbox |

## 21. ビジネスインダストリ

| ファイル名 | テーマ・過去問 | 日常のたとえ話（暗記フック・要約） | 状態 |
| :--- | :--- | :--- | :--- |
| [strategy-cps-cyber-physical-system.md](./inbox/21_ビジネスインダストリ/strategy-cps-cyber-physical-system.md) | **サイバーフィジカルシステム (CPS)**<br>（[R4秋 問73](https://www.ap-siken.com/kakomon/04_aki/q73.html)） | 現実と仮想の卓球ラリー<br>畑のデータを測る（現実） → AIで分析（仮想） → 自動散水（現実にフィードバック） | inbox |
| [strategy-edge-computing.md](./inbox/21_ビジネスインダストリ/strategy-edge-computing.md) | **エッジコンピューティング**<br>（[R6春 問72](https://www.ap-siken.com/kakomon/06_haru/q72.html)） | 現場の店長が即決！<br>本社（クラウド）のお伺い待ちをなくし、端末の近傍で超低遅延処理＆回線負荷軽減 | inbox |

## 22. 企業活動

| ファイル名 | テーマ・過去問 | 日常のたとえ話（暗記フック・要約） | 状態 |
| :--- | :--- | :--- | :--- |
| [strategy-breakeven-point.md](./inbox/22_企業活動/strategy-breakeven-point.md) | **損益分岐点・安全余裕率**<br>（[R1秋 問77](https://www.ap-siken.com/kakomon/01_aki/q77.html)） | 『粗利を・こそげて・安心』<br>ラーメン屋の家賃回収パズル。小数を10倍して消す途中式を全記載 | inbox |
| [strategy-qc7-relations-diagram.md](./inbox/22_企業活動/strategy-qc7-relations-diagram.md) | **新QC7つ道具「連関図」**<br>（[H26秋 問75](https://www.ap-siken.com/kakomon/26_aki/q75.html)） | 太った原因の悪循環ループ！<br>複雑に絡み合った因果関係を矢印で解きほぐし、根本原因（矢印が出る元凶）を暴く | inbox |

## 23. 法務

| ファイル名 | テーマ・過去問 | 日常のたとえ話（暗記フック・要約） | 状態 |
| :--- | :--- | :--- | :---: |
| [law-sensitive-personal-information.md](./inbox/23_法務/law-sensitive-personal-information.md) | **要配慮個人情報（個人情報保護法）**<br>（[R6春 問80](https://www.ap-siken.com/kakomon/06_haru/q80.html)） | 個人情報のデリケート度3段階<br>要配慮＝差別の防止！病歴、前科、信条など知られたら不当な不利益が生じる情報 | inbox |
| [law-giteki-mark-regulations.md](./inbox/23_法務/law-giteki-mark-regulations.md) | **技適マークと各国の認証マーク**<br>（[R1秋 問80](https://www.ap-siken.com/kakomon/01_aki/q80.html)） | スマホの電波の車検シール<br>日本の電波法に適合している証明。EUはCE、米はFCC、家電安全はPSE | inbox |
| [law-labor-contract-dispatch-subcontract.md](./inbox/23_法務/law-labor-contract-dispatch-subcontract.md) | **請負・派遣・出向の契約形態**<br>（[R5秋 問80](https://www.ap-siken.com/kakomon/05_aki/q80.html)） | 労働形態の三角関係<br>請負で客先が指示したら「偽装請負」！出向は出向先と指揮命令関係が生じる | inbox |

