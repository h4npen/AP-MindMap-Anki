# 応用情報技術者試験（AP）直感攻略ノート一覧

応用情報技術者試験の出題範囲（シラバス）の中分類単元に準拠した体系的インデックスです。

---

## 📂 フォルダの運用ルール
- **`docs/inbox/`**: 新しく生成された未読ノートが入る受信用フォルダ（単元ごとに配置）
- **`docs/ap-prep/`**: 読了して理解できたノートを移動してストック・復習する整理用フォルダ

---

## 04. システム構成要素
| ファイル名 | テーマ・過去問 | 日常のたとえ話（暗記フック・要約） | 状態 |
| :--- | :--- | :--- | :---: |
| [`sys-availability-mtbf-mttr.md`](inbox/04_システム構成要素/sys-availability-mtbf-mttr.md) | **稼働率とMTBF・MTTR**<br>（[R4秋 問14](https://www.ap-siken.com/kakomon/04_aki/q14.html)） | **『Bは元気・Rはリペア（修理）』**<br>スマホの元気時間と入院時間。両方1.5倍になっても比率だから「変わらない」！ | `inbox` |

## 09. データベース
| ファイル名 | テーマ・過去問 | 日常のたとえ話（暗記フック・要約） | 状態 |
| :--- | :--- | :--- | :---: |
| [`db-three-schema-architecture.md`](inbox/09_データベース/db-three-schema-architecture.md) | **3層スキーマ構造と内部設計**<br>（[H31春 問26](https://www.ap-siken.com/kakomon/31_haru/q26.html), [R4春 問27](https://www.ap-siken.com/kakomon/04_haru/q27.html)） | **3段のお重イメージ**<br>上段:外部（画面）、中段:概念（テーブル設計）、下段:内部（記録媒体・インデックス） | `inbox` |
| [`db-acid-properties.md`](inbox/09_データベース/db-acid-properties.md) | **トランザクションのACID特性**<br>（[R2秋 問30](https://www.ap-siken.com/kakomon/02_aki/q30.html)） | **銀行のATM1万円送金**<br>A:全か無か、C:矛盾なし、I:一人ずつ隔離、D:落雷停電でも消えない耐久力（Durability） | `inbox` |

## 10. ネットワーク
| ファイル名 | テーマ・過去問 | 日常のたとえ話（暗記フック・要約） | 状態 |
| :--- | :--- | :--- | :---: |
| [`network-ipv6-notation.md`](inbox/10_ネットワーク/network-ipv6-notation.md) | **IPv6アドレス表記ルール**<br>（[R4春 問31](https://www.ap-siken.com/kakomon/04_haru/q31.html)） | **小学生の引き算パズル**<br>「::」は1回だけ！2回あると引き算が壊れて復元不能。ドット混入は即消去 | `inbox` |
| [`network-osi-7layers-protocols.md`](inbox/10_ネットワーク/network-osi-7layers-protocols.md) | **OSI参照モデルとプロトコル**<br>（[R5春 問34](https://www.ap-siken.com/kakomon/05_haru/q34.html)） | **7階建てマンションの住人**<br>4階（トランスポート層）の住人は「TCP」と「UDP」だけ！HTTPは7階、IPは3階 | `inbox` |
| [`network-wifi-80211ac.md`](inbox/10_ネットワーク/network-wifi-80211ac.md) | **無線LAN規格（11acと周波数帯）**<br>（[R3春 問33](https://www.ap-siken.com/kakomon/03_haru/q33.html)） | **『あっ（a）、クリア（ac）な5GHz！』**<br>電子レンジの邪魔が入らない5GHz専用。無線は衝突回避（CA）なのでCDは即消去 | `inbox` |
| [`network-dns.md`](ap-prep/10_ネットワーク/network-dns.md) | **DNSキャッシュポイズニングとDNSSEC** | カミンスキー型攻撃がTTL待ちを回避する原理と、DS/DNSKEY/RRSIGの信頼の連鎖 | `ap-prep` |
| [`network-frame-relay.md`](ap-prep/10_ネットワーク/network-frame-relay.md) | **フレームリレー方式** | 交換機での誤りチェックをサボって高速化。CIR超過パケットはDE=1で混雑時に優先破棄 | `ap-prep` |
| [`network-tcp-vs-udp.md`](ap-prep/10_ネットワーク/network-tcp-vs-udp.md) | **TCP と UDP の違い** | 書留郵便（TCP: 再送・3ウェイハンドシェイク） vs 拡声器（UDP: 投げっぱなし・生配信） | `ap-prep` |

## 11. セキュリティ
| ファイル名 | テーマ・過去問 | 日常のたとえ話（暗記フック・要約） | 状態 |
| :--- | :--- | :--- | :---: |
| [`sec-session-hijacking-reauth.md`](inbox/11_セキュリティ/sec-session-hijacking-reauth.md) | **セッション乗っ取り対策（再認証）**<br>（[H28春 問41](https://www.ap-siken.com/kakomon/28_haru/q41.html)） | **ホテルのカードキーと貴重品金庫**<br>部屋の鍵を盗まれても、最後の金庫（個人情報）を開ける直前のパスワード再入力で防ぐ | `inbox` |
| [`sec-tls-client-authentication.md`](inbox/11_セキュリティ/sec-tls-client-authentication.md) | **TLSクライアント認証の送付順序**<br>（[R3春 問45](https://www.ap-siken.com/kakomon/03_haru/q45.html)） | **高級会員制クラブの名刺交換**<br>詐欺を警戒してまず店側が名刺（b） $\rightarrow$ 客が会員証（a） $\rightarrow$ 店が確認（c）！ | `inbox` |

## 12. システム開発技術
| ファイル名 | テーマ・過去問 | 日常のたとえ話（暗記フック・要約） | 状態 |
| :--- | :--- | :--- | :---: |
| [`dev-square-quality-characteristics.md`](inbox/12_システム開発技術/dev-square-quality-characteristics.md) | **ソフトウェア品質特性 (SQuaRE)**<br>（[R1秋 問47](https://www.ap-siken.com/kakomon/01_aki/q47.html)） | **スマホ選びの8大チェック項目**<br>機能適合性＝明示的＆暗黙の「ニーズを満足させる」機能があるかどうか | `inbox` |

## 13. ソフトウェア開発管理技術
| ファイル名 | テーマ・過去問 | 日常のたとえ話（暗記フック・要約） | 状態 |
| :--- | :--- | :--- | :---: |
| [`dev-cmmi-maturity-levels.md`](inbox/13_ソフトウェア開発管理技術/dev-cmmi-maturity-levels.md) | **CMMI（能力成熟度モデル統合）**<br>（[H29秋 問49](https://www.ap-siken.com/kakomon/29_aki/q49.html)） | **開発組織のオトナ度ピラミッド**<br>`M`＝Maturity（成熟度）。共通フレームは作業基準、CMMIは組織の通信簿 | `inbox` |

## 14. プロジェクトマネジメント
| ファイル名 | テーマ・過去問 | 日常のたとえ話（暗記フック・要約） | 状態 |
| :--- | :--- | :--- | :---: |
| [`pm-cost-assignment-puzzle.md`](inbox/14_プロジェクトマネジメント/pm-cost-assignment-puzzle.md) | **要員割り当て最小コストパズル**<br>（[R1秋 問54](https://www.ap-siken.com/kakomon/01_aki/q54.html)） | **『期限で絞って・重い順に・パズルする！』**<br>遅いCさんは4キロの仕事を2か月で終わらせられない（足切り脱落）から解く | `inbox` |

## 15. サービスマネジメント
| ファイル名 | テーマ・過去問 | 日常のたとえ話（暗記フック・要約） | 状態 |
| :--- | :--- | :--- | :---: |
| [`service-level-management-sla.md`](inbox/15_サービスマネジメント/service-level-management-sla.md) | **サービスレベル管理 (SLM) と SLA**<br>（[H27秋 問56](https://www.ap-siken.com/kakomon/27_aki/q56.html)） | **ホテルの宿泊プラン契約**<br>顧客とサービス目標を「合意文書（SLA）」として交わし、定期的にPDCAを回す | `inbox` |

## 16. システム監査
| ファイル名 | テーマ・過去問 | 日常のたとえ話（暗記フック・要約） | 状態 |
| :--- | :--- | :--- | :---: |
| [`audit-system-audit-charter-approval.md`](inbox/16_システム監査/audit-system-audit-charter-approval.md) | **規程の承認者と3者の力関係**<br>（[H30春 問59](https://www.ap-siken.com/kakomon/30_haru/q59.html)） | **警察と裁判所と社長**<br>現場にルールを決めさせたら不正が隠せる（自己監査の禁止）。承認は社長一択！ | `inbox` |

## 19. 経営戦略マネジメント
| ファイル名 | テーマ・過去問 | 日常のたとえ話（暗記フック・要約） | 状態 |
| :--- | :--- | :--- | :---: |
| [`strategy-value-chain-frameworks.md`](inbox/19_経営戦略マネジメント/strategy-value-chain-frameworks.md) | **バリューチェーンと4大フレームワーク**<br>（[R3秋 問67](https://www.ap-siken.com/kakomon/03_aki/q67.html)） | **パン屋さんのバトンリレー**<br>「5つの主活動と4つの支援活動」＝バリューチェーン。SWOT・BSCとの見分け方 | `inbox` |

## 21. ビジネスインダストリ
| ファイル名 | テーマ・過去問 | 日常のたとえ話（暗記フック・要約） | 状態 |
| :--- | :--- | :--- | :---: |
| [`strategy-cps-cyber-physical-system.md`](inbox/21_ビジネスインダストリ/strategy-cps-cyber-physical-system.md) | **サイバーフィジカルシステム (CPS)**<br>（[R4秋 問73](https://www.ap-siken.com/kakomon/04_aki/q73.html)） | **現実と仮想の卓球ラリー**<br>畑のデータを測る（現実） $\rightarrow$ AIで分析（仮想） $\rightarrow$ 自動散水（現実にフィードバック） | `inbox` |

## 22. 企業活動
| ファイル名 | テーマ・過去問 | 日常のたとえ話（暗記フック・要約） | 状態 |
| :--- | :--- | :--- | :---: |
| [`strategy-breakeven-point.md`](inbox/22_企業活動/strategy-breakeven-point.md) | **損益分岐点・安全余裕率**<br>（[R1秋 問77](https://www.ap-siken.com/kakomon/01_aki/q77.html)） | **『粗利を・こそげて・安心』**<br>ラーメン屋の家賃回収パズル。小数を10倍して消す途中式を全記載 | `inbox` |

## 23. 法務
| ファイル名 | テーマ・過去問 | 日常のたとえ話（暗記フック・要約） | 状態 |
| :--- | :--- | :--- | :---: |
| [`law-sensitive-personal-information.md`](inbox/23_法務/law-sensitive-personal-information.md) | **要配慮個人情報（個人情報保護法）**<br>（[R6春 問80](https://www.ap-siken.com/kakomon/06_haru/q80.html)） | **個人情報のデリケート度3段階**<br>要配慮＝差別の防止！病歴、前科、信条など知られたら不当な不利益が生じる情報 | `inbox` |
