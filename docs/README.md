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
| [net-arp-request-broadcast-response-unicast.md](./inbox/10_ネットワーク/net-arp-request-broadcast-response-unicast.md) | **ARPの要求と応答**<br>（[平成23年特別 問37](https://www.ap-siken.com/kakomon/23_toku/q37.html)） | 『要求＝ブロードキャスト（全員）、応答＝ユニキャスト（1対1）！』<br>教室での落とし物探し。「このハンカチ誰のー？（全体放送）」→「あ、僕のです！（直接返しに行く）」 | inbox |
| [net-atm-fixed-cell-low-delay.md](./inbox/10_ネットワーク/net-atm-fixed-cell-low-delay.md) | **ATM交換方式**<br>（[平成20年秋期 問57](https://www.ap-siken.com/kakomon/20_aki/q57.html)） | 『ATMは53バイトの固定長セル！ハードウェア処理で網内遅延が小さい！』<br>宅配便のダンボール。サイズが全部同じ規格（固定長）ならベルトコンベアの機械で超高速に流せる！ | inbox |
| [net-dhcpdiscover-source-dest-ip.md](./inbox/10_ネットワーク/net-dhcpdiscover-source-dest-ip.md) | **DHCPDISCOVER**<br>（[令和2年秋期 問35](https://www.ap-siken.com/kakomon/02_aki/q35.html)） | 『送信元は名無し（0.0.0.0）、宛先は全館放送（255.255.255.255）！』<br>身分証なしで役所の総合受付に飛び込む人。「名無しの権兵衛（0.0.0.0）ですが、誰か番号札（IP）をください！（全館放送 255.255.255.255）」 | inbox |
| [net-arp-ip-to-mac.md](./inbox/10_ネットワーク/net-arp-ip-to-mac.md) | **ARP**<br>（[平成29年秋期 問34](https://www.ap-siken.com/kakomon/29_aki/q34.html)） | 『IPアドレスからMACアドレスを調べるプロトコル！』<br>座席表の番号（IP）から、実際に座っている人のマイナンバー（MAC）を呼び出すこと | inbox |
| [net-wifi-ssid-specification.md](./inbox/10_ネットワーク/net-wifi-ssid-specification.md) | **SSID**<br>（[平成29年秋期 問31](https://www.ap-siken.com/kakomon/29_aki/q31.html)） | 『最大32オクテット（文字）のネットワーク識別子！』<br>カフェのWi-Fi一覧に出る「店舗の名前（看板）」。好きな看板を選んでタップして繋ぐ！ | inbox |
| [net-subnet-broadcast-address-20.md](./inbox/10_ネットワーク/net-subnet-broadcast-address-20.md) | **ブロードキャストアドレス計算（/20）**<br>（[平成26年春期 問33](https://www.ap-siken.com/kakomon/26_haru/q33.html)） | 『172.22.29.44/20 のブロードキャストは 172.22.31.255！』<br>16部屋区切りのアパート。29号室がある棟の最後の部屋（全館放送）は31号室！ | inbox |
| [net-router-mac-hop-by-hop.md](./inbox/10_ネットワーク/net-router-mac-hop-by-hop.md) | **ルータ越え通信**<br>（[平成31年春期 問33](https://www.ap-siken.com/kakomon/31_haru/q33.html)） | 『宛先IPはずっと変わらない（IP2）、宛先MACはルータ（MAC3）！』<br>旅行のチケット。目的地はずっと「北海道」だが、乗る電車は「まず東京駅行き、次は新函館北斗行き」と乗り継ぐ！ | inbox |
| [net-private-ip-ranges.md](./inbox/10_ネットワーク/net-private-ip-ranges.md) | **プライベートIPアドレス**<br>（[平成19年春期 問54](https://www.ap-siken.com/kakomon/19_haru/q54.html)） | 『クラスCのプライベートIPは 192.168.0.0〜192.168.255.255！』<br>社内の内線電話番号。内線番号だから社外（インターネット）には直接通じない！ | inbox |
| [net-ipsec-network-layer-vpn.md](./inbox/10_ネットワーク/net-ipsec-network-layer-vpn.md) | **IPsec**<br>（[平成19年秋期 問59](https://www.ap-siken.com/kakomon/19_aki/q59.html)） | 『IPsecはネットワーク層（第3層）で通信を暗号化・認証する！』<br>高速道路の地下トンネル。トラックの荷物（アプリ）が何であれ、道路（IP）ごと頑丈に守る！ | inbox |
| [net-cidr-descending-ip-allocation.md](./inbox/10_ネットワーク/net-cidr-descending-ip-allocation.md) | **CIDRアドレス割り当て**<br>（[令和7年春期 問32](https://www.ap-siken.com/kakomon/07_haru/q32.html)） | 『/28のネットワークアドレスは16の倍数！降順割り当てなら最大の16の倍数を選ぶ！』<br>劇場の座席指定。一番後ろの列（大きい席番号）から団体席を16席ずつ予約していく感覚 | inbox |
| [net-modem-v24-interface.md](./inbox/10_ネットワーク/net-modem-v24-interface.md) | **V.24**<br>（[平成17年春期 問54](https://www.ap-siken.com/kakomon/17_haru/q54.html)） | 『端末（DTE）とモデム（DCE）間のインタフェース規格は V.24！』<br>テレビとビデオデッキを繋ぐ3色ケーブル（赤白黄）。機器同士を繋ぐための端子規格！ | inbox |
| [net-poe-power-over-ethernet.md](./inbox/10_ネットワーク/net-poe-power-over-ethernet.md) | **PoE**<br>（[令和7年春期 問29](https://www.ap-siken.com/kakomon/07_haru/q29.html)） | 『LANケーブルを利用して機器に給電する技術が PoE！』<br>新幹線の座席。背もたれのコンセントからスマホを充電しながら車内Wi-Fiを使う感覚 | inbox |
| [net-routing-longest-match.md](./inbox/10_ネットワーク/net-routing-longest-match.md) | **ロンゲストマッチ**<br>（[令和7年春期 問31](https://www.ap-siken.com/kakomon/07_haru/q31.html)） | 『ルーティングはプレフィックス（マスク）が最も長いエントリが最優先！』<br>郵便配達。「日本宛て（大雑把）」より「東京都宛て」、「東京都宛て」より「千代田区1-1（超詳細）」の指示に従う！ | inbox |
| [net-smime-email-security.md](./inbox/10_ネットワーク/net-smime-email-security.md) | **S/MIME**<br>（[平成27年秋期 問33](https://www.ap-siken.com/kakomon/27_aki/q33.html)） | 『メールの内容の機密性（暗号化）と改ざん検知を行うのは S/MIME！』<br>手紙を封蝋（シーリングワックス）で閉じて頑丈なアタッシュケースに入れて送るイメージ | inbox |
| [net-napt-ip-masquerade.md](./inbox/10_ネットワーク/net-napt-ip-masquerade.md) | **NAPT**<br>（[平成20年秋期 問36](https://www.ap-siken.com/kakomon/20_aki/q36.html)） | 『1つのグローバルIPで複数台が同時接続できる仕組みが NAPT（IPマスカレード）！』<br>会社の代表電話番号。外からは代表番号1つに見えるが、内線番号（ポート番号）で各社員のデスクに繋がる！ | inbox |
| [net-nat-address-translation.md](./inbox/10_ネットワーク/net-nat-address-translation.md) | **NAT**<br>（[平成18年秋期 問58](https://www.ap-siken.com/kakomon/18_aki/q58.html)） | 『プライベートIPアドレスとグローバルIPアドレスを相互に変換する！』<br>空港の両替所。日本円（プライベートIP）をドル（グローバルIP）に両替して海外（インターネット）へ旅立つ！ | inbox |
| [net-repeater-physical-layer.md](./inbox/10_ネットワーク/net-repeater-physical-layer.md) | **リピータ**<br>（[平成20年秋期 問59](https://www.ap-siken.com/kakomon/20_aki/q59.html)） | 『物理層（第1層）で信号を増幅・中継する装置はリピータ！』<br>マラソンの給水所。ヘトヘトになって電波（信号）が弱まったランナーにポカリを飲ませて元気に走らせる！ | inbox |
| [net-dns-reverse-lookup-ptr.md](./inbox/10_ネットワーク/net-dns-reverse-lookup-ptr.md) | **DNS逆引き**<br>（[令和6年秋期 問33](https://www.ap-siken.com/kakomon/06_aki/q33.html)） | 『IPアドレスに対応するホスト名を調べることを「逆引き」と呼ぶ！』<br>電話帳。人名から電話番号を調べるのが正引き、電話番号から誰の番号か調べるのが逆引き！ | inbox |
| [net-arp-purpose-and-role.md](./inbox/10_ネットワーク/net-arp-purpose-and-role.md) | **ARPの役割**<br>（[令和3年秋期 問32](https://www.ap-siken.com/kakomon/03_aki/q32.html)） | 『IPアドレスからMACアドレスを得るプロトコルである！』<br>郵便番号だけじゃ届かない！「〇〇番地の黒いポスト」を特定する作業 | inbox |
| [net-voip-gateway-role.md](./inbox/10_ネットワーク/net-voip-gateway-role.md) | **VoIPゲートウェイ**<br>（[平成24年秋期 問35](https://www.ap-siken.com/kakomon/24_aki/q35.html)） | 『一般の電話機（PBX）とIPネットワークを繋ぐ位置に配置する！』<br>海外旅行の入国審査・通訳ブース。日本語しか話せない人と英語しか話せない人の間に立って通訳する！ | inbox |
| [net-frame-relay-vs-packet.md](./inbox/10_ネットワーク/net-frame-relay-vs-packet.md) | **フレームリレー**<br>（[平成18年秋期 問56](https://www.ap-siken.com/kakomon/18_aki/q56.html)） | 『交換機での誤り制御処理を省略して、網内遅延を小さくした！』<br>荷物の検問。昔は各都道府県の関所ごとに荷物を全部開けて検査していたが、道路が良くなったので「最後の受取人がまとめて確認すればOK」にした！ | inbox |
| [net-l2-switch-is-bridge.md](./inbox/10_ネットワーク/net-l2-switch-is-bridge.md) | **レイヤ2スイッチ**<br>（[平成30年秋期 問32](https://www.ap-siken.com/kakomon/30_aki/q32.html)） | 『L2スイッチと同じデータリンク層（第2層）で動く装置は「ブリッジ」！』<br>郵便局の仕分け係。宛先住所（MACアドレス）を見て、該当する配達員のカバンにだけ荷物を入れる！ | inbox |
| [net-rss-web-feed-xml.md](./inbox/10_ネットワーク/net-rss-web-feed-xml.md) | **RSS**<br>（[平成26年春期 問35](https://www.ap-siken.com/kakomon/26_haru/q35.html)） | 『見出しや要約の更新をXMLで通知するフォーマットは RSS！』<br>新聞の朝刊の「1面見出し一覧」。見出しと要約だけを毎朝ポストに投函してくれる！ | inbox |
| [net-class-d-multicast.md](./inbox/10_ネットワーク/net-class-d-multicast.md) | **クラスD**<br>（[令和6年秋期 問35](https://www.ap-siken.com/kakomon/06_aki/q35.html)） | 『クラスDのIPアドレスは「マルチキャストアドレス」として使用される！』<br>テレビやラジオのチャンネル。特定の周波数（クラスD）に合わせている人たち全員に映像や音声を同時配信する！ | inbox |
| [net-snmp-network-management.md](./inbox/10_ネットワーク/net-snmp-network-management.md) | **SNMP**<br>（[平成26年春期 問34](https://www.ap-siken.com/kakomon/26_haru/q34.html)） | 『ネットワーク機器の監視や障害情報収集を行うプロトコルは SNMP！』<br>ビルの防災センター。各部屋の火災報知器（エージェント）の異常信号を集中モニタ（マネージャ）で監視する！ | inbox |
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

