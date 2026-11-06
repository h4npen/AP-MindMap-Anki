import { type Note } from './notesData';
import readmeRaw from '../docs/README.md?raw';

export interface VocabItem {
  id: string;
  term: string;
  type: 'main' | 'sub'; // main: ノートの主役用語, sub: 選択肢・比較で登場する関連重要用語
  categoryNumber: string;
  categoryName: string;
  catchphrase: string; // 一言定義・合言葉
  analogy: string; // 日常のたとえ話
  descriptiveAnswer?: string; // 午後記述用ワンフレーズ（あれば）
  sourceNoteId: string;
  sourceNoteTitle: string;
  targetExam: string;
}

/**
 * docs/README.md の目次テーブルから、ファイル名ごとの「洗練された合言葉＆日常のたとえ話」マップを取得する
 */
function parseReadmeSummaries(): Record<string, { theme: string; catchphrase: string; analogy: string }> {
  const map: Record<string, { theme: string; catchphrase: string; analogy: string }> = {};
  const lines = readmeRaw.split(/\r?\n/);

  for (const line of lines) {
    if (!line.startsWith('| [')) continue;
    const cols = line.split('|').map((c) => c.trim());
    if (cols.length < 4) continue;

    // cols[1]: [filename.md](./path/to/filename.md)
    const fileMatch = cols[1].match(/^\[([^\]]+\.md)\]/);
    if (!fileMatch) continue;
    const filename = fileMatch[1].trim();

    // cols[2]: **テーマ名**<br>（[過去問](...)）
    const themeMatch = cols[2].match(/\*\*([^*]+)\*\*/);
    const theme = themeMatch ? themeMatch[1].trim() : '';

    // cols[3]: 『合言葉』<br>日常のたとえ話
    const col3 = cols[3];
    const parts = col3.split(/<br\s*\/?>/i).map((s) => s.replace(/\*\*/g, '').trim());
    let catchphrase = '';
    let analogy = '';

    if (parts.length >= 2) {
      catchphrase = parts[0].replace(/^[『「]|[』」]$/g, '').trim();
      analogy = parts.slice(1).join(' / ').trim();
    } else if (parts.length === 1) {
      catchphrase = parts[0].replace(/^[『「]|[』」]$/g, '').trim();
      analogy = catchphrase;
    }

    map[filename] = { theme, catchphrase, analogy };
  }

  return map;
}

/**
 * ノートのテーマ名（例：「ARPの役割」「HTTPSの正体」）を純粋な「単語帳の見出し語（専門用語）」に正規化する
 */
const MAIN_TERM_NORMALIZATION: Record<string, string> = {
  '稼働率とMTBF・MTTR': 'MTBF・MTTR・稼働率',
  'プリエンプション方式のタスク管理': 'プリエンプション（横取り方式）',
  'プリエンプション方式': 'プリエンプション（横取り方式）',
  'SQL外部結合と集約': 'LEFT OUTER JOIN（外部結合）と COUNT関数',
  'NOT EXISTS相関副問合せ': 'NOT EXISTS（相関副問合せ）',
  'E-R図と外部キー': 'E-R図と外部キー（1対多の参照制約）',
  '関係代数の演算': '関係代数（選択σ・射影π・直積・差）',
  '関数従属の導出': '関数従属と推移的関数従属',
  '正規形の判定': '第1正規形・部分関数従属',
  'トランザクションのACID特性': 'ACID特性（原子性・一貫性・独立性・耐久性）',
  '3層スキーマ構造と内部設計': '3層スキーマ（外部・概念・内部スキーマ）',
  '3層スキーマ構造': '3層スキーマ（外部・概念・内部スキーマ）',
  '回線伝送効率': 'MTU・MSSと回線伝送効率',
  'NAPTの役割': 'NAPT（IPマスカレード）',
  'NAPT書き換え': 'NAPTのヘッダ変換（送信元IP＋ポート）',
  '多数決方式の伝送誤り率': '多数決方式（FEC：前方誤り訂正）',
  'パケット交換 vs ATM交換': 'ATM交換方式（固定長53バイトセル）',
  'TCPコネクション識別': 'TCPコネクション識別（4タプル）',
  'IPsecと鍵交換': 'IKE（Internet Key Exchange / IPsec鍵交換）',
  'ルート集約（CIDR計算パズル）': 'ルート集約（スーパーネット化 / CIDR）',
  'ルート集約（CIDR）': 'ルート集約（スーパーネット化 / CIDR）',
  'IPv6アドレス表記ルール': 'IPv6アドレス表記（ゼロ圧縮 :: ルール）',
  'IPv6アドレスの省略ルール': 'IPv6アドレス表記（ゼロ圧縮 :: ルール）',
  'OSI参照モデルとプロトコル': 'OSI参照モデル（7階層と各層プロトコル）',
  '無線LAN規格（11acと周波数帯）': 'IEEE 802.11ac（Wi-Fi 5GHz帯規格）',
  '無線LAN（Wi-Fi規格）': 'IEEE 802.11ac / CSMA/CA（無線LAN規格）',
  'ARPの要求と応答': 'ARP要求（ブロードキャスト）とARP応答（ユニキャスト）',
  'ARPの役割': 'ARP（Address Resolution Protocol）',
  'ブロードキャストアドレス計算（/20）': 'ブロードキャストアドレスとプレフィックス長（/20）',
  'ルータ越え通信': 'デフォルトゲートウェイ（ルータ越えのIP/MAC変化）',
  'CIDRアドレス割り当て': 'CIDR（クラスレスアドレッシング / サブネット分割）',
  'DNS逆引き': 'DNS逆引き（PTRレコード）',
  'クラスD': 'マルチキャストアドレス（クラスD）',
  'セッション乗っ取り対策（再認証）': 'セッションハイジャック対策（重要処理前の再認証）',
  'セッション乗っ取り対策': 'セッションハイジャック対策（重要処理前の再認証）',
  'TLSクライアント認証の送付順序': 'TLSクライアント認証（双方向証明書検証）',
  '情報セキュリティのCIA（完全性）': '完全性（Integrity / 改ざん防止）',
  'クラウド責任共有モデル': '責任共有モデル（IaaS・PaaS・SaaS）',
  'クロスサイトスクリプティング（XSS）対策': 'クロスサイトスクリプティング（XSS）とサニタイジング',
  'DNSキャッシュポイズニングの被害': 'DNSキャッシュポイズニング（ファーミング誘導）',
  'HTTPSで実現できること': 'HTTPS（暗号化・改ざん検知・サーバ認証）',
  'HTTPSの正体': 'SSL/TLS（HTTPSの暗号化プロトコル）',
  'SSL/TLSとプロキシ': 'SSL/TLS（End-to-End暗号化とプロキシ透過）',
  '無線LANの暗号規格': 'WPA2-AES（CCMP / 128ビット共通鍵暗号）',
  'ファイアウォールのルール判定': 'パケットフィルタリング（ファーストマッチ原則）',
  'サイバーセキュリティ基本法': 'NCO / 旧NISC（内閣サイバーセキュリティセンター）',
  'ログアウト時のセッション対策': 'セッションIDのサーバ側無効化（ログアウト処理）',
  'JIS Q 27000の用語定義': '機密性（Confidentiality / JIS Q 27000）',
  'メールの第三者中継（オープンリレー）': 'オープンリレー（メール不正第三者中継）',
  'ソフトウェア品質特性 (SQuaRE)': 'SQuaRE（ISO/IEC 25010 ソフトウェア品質8特性）',
  'ソフトウェア品質特性（SQuaRE）': 'SQuaRE（ISO/IEC 25010 ソフトウェア品質8特性）',
  '要員割り当て最小コストパズル': 'アサインメント問題（要員割当とコスト最小化）',
  'プロジェクト要員割り当てパズル': 'アサインメント問題（要員割当とコスト最小化）',
  'サービスレベル管理 (SLM) と SLA': 'SLA（サービスレベル合意書）と SLM',
  'サービスレベル管理（SLM）': 'SLA（サービスレベル合意書）と SLM',
  '規程の承認者と3者の力関係': 'システム監査規程（最高経営者による承認・独立性）',
  'システム監査の人間関係': 'システム監査の独立性（自己監査の禁止）',
  '可用性とセキュリティ3大要件 (CIA)': '可用性（Availability / システム二重化）',
  'システム監査の「可用性」': '可用性（Availability / システム二重化）',
  '投資評価の回収期間法 (PBP)': 'PBP（回収期間法 / Payback Period）',
  'バリューチェーンと4大フレームワーク': 'バリューチェーン（主活動5つ・支援活動4つ）',
  'バリューチェーンと経営フレームワーク': 'バリューチェーン（主活動5つ・支援活動4つ）',
  '新QC7つ道具「連関図」': '連関図（新QC七つ道具・因果関係の解明）',
  '技適マークと各国の認証マーク': '技適マーク（技術基準適合証明）',
  '技適マークと認証規格': '技適マーク（技術基準適合証明）',
  '請負・派遣・出向の契約形態': '請負・派遣・出向と偽装請負（指揮命令権）',
  '労働形態の三角関係': '請負・派遣・出向と偽装請負（指揮命令権）',
  '個人情報保護法': '要配慮個人情報（個人情報保護法）',
};

/**
 * 重複排除用の正規化キーを生成する（カッコ内の補足や末尾の「トポロジ」等を揃えて同一用語の重複を防ぐ）
 */
function normalizeTermKey(term: string): string {
  return term
    .split(/[（(]/)[0]
    .replace(/トポロジ$/, '')
    .replace(/^NCO\s*\/\s*旧NISC$/, 'nco')
    .replace(/^NCO$/, 'nco')
    .replace(/^静的NAT$/, 'nat')
    .trim()
    .toLowerCase();
}

/**
 * 文字列が「文章や選択肢の文面」ではなく「本物の専門用語・名詞」であるかを厳格に判定する
 */
function isGenuineTechnicalTerm(term: string): boolean {
  const t = term.trim();
  if (t.length < 2 || t.length > 26) return false;

  // 1. 記号・感嘆符・数式・IP範囲・カンマ・カギカッコを含むものは除外
  if (/[…‥=＝<>%％`＄$\\！!？?〜～，,★☆「」『』]/.test(t)) return false;
  if (/^\d+(\.\d+)+(\/\d+)?$/.test(t)) return false; // 10.1.0.1, 192.168.1.240/28 等
  if (/^\d+\s*の作り方$/.test(t)) return false;
  if (/^(WPA|WPA2)\s*\//.test(t)) return false; // WPA / AES / 64ビット 等の組み合わせ選択肢

  // 2. 人名・会社名・タスク名・一般名詞単体・見出しフレーズは除外
  if (
    /^([A-Z]さん|[A-Z]社|タスク[A-Z]|サイト[A-Z]|ノード[A-Z]|長さ|役割|特徴|正解|不正解|理由|注意|手順|場合|主活動.*|支援活動.*|低遅延|通信量の削減|明示的ニーズ|暗黙のニーズ|のひっかけ|Edge.*)$/.test(
      t
    )
  ) {
    return false;
  }

  // 3. 助詞（が・を・に・は・へ・で・から・より・まで）や動詞・形容詞・文章表現を含む選択肢文面は徹底除外！
  const sentencePattern =
    /(が|を|には|は|へ|で|から|より|まで|について|に関して|における|によって|に対する|による|ための|として|であり|である|なった|なる|する|した|して|れる|られる|せる|させる|ある|ない|できる|おく|くる|いく|みる|ため|とき|こと|もの|どれか|作り方|ひっかけ|引っ掛け|選び方|見分け方|持たせる|割り当てる|書き換え|確認する|防止|軽減|管理|設定|検査|検知|コピー|盗聴|改ざん|保護|暗号化|無効化|再発行|普通|昔ながら|自社|受信者|端末\d+|最大\d+|\d+ビットの|可変長・|固定長・|通常の|指示して|電波|の取得|の役割|の正体|の仕組み|の標準|振り分け|名前解決|ガードマン)/;

  if (sentencePattern.test(t)) {
    return false;
  }

  return true;
}

/**
 * 選択肢の解説文（「→ これは『DHCP』の説明です」「→ メールサーバの『MTA』の役割です」等）から
 * 隠れている本物の専門用語と、その定義（選択肢の文面）を逆引き救出する
 */
function rescueTermFromChoiceExplanation(
  leftChoiceText: string,
  rightExplanationText: string
): { term: string; definition: string } | null {
  const cleanLeft = leftChoiceText
    .replace(/^[アイウエ][：:\s]+/, '')
    .replace(/[…‥]+$/, '')
    .trim();
  const cleanRight = rightExplanationText.replace(/\*\*/g, '').trim();

  // パターン1: 「『〇〇』の役割です」「〇〇の説明です」
  const quotedExplainMatch = cleanRight.match(
    /「([A-Za-z0-9ァ-ヶー一-龠（）()／/・\s\-+]{2,26}?)」の(?:説明|役割|特徴|定義)です/
  );
  if (quotedExplainMatch) {
    const candidate = quotedExplainMatch[1].trim();
    if (isGenuineTechnicalTerm(candidate) && cleanLeft.length >= 4) {
      return {
        term: candidate,
        definition: `${cleanLeft}（${cleanRight.replace(/^(?:これは)?/, '')}）`,
      };
    }
  }

  const explainMatch = cleanRight.match(
    /^(?:これは)?「?([A-Za-z0-9ァ-ヶー一-龠（）()／/・\s\-+]{2,24}?)」?(?:など)?の(?:説明|役割|特徴|定義)です/
  );
  if (explainMatch) {
    const candidate = explainMatch[1]
      .replace(/^(それぞれ|一般的な|通常の)\s*/, '')
      .replace(/や/, ' / ')
      .trim();
    if (isGenuineTechnicalTerm(candidate) && cleanLeft.length >= 4) {
      return {
        term: candidate,
        definition: `${cleanLeft}（${cleanRight.replace(/^(?:これは)?/, '')}）`,
      };
    }
  }

  // パターン2: 「問合せを行うのは『リゾルバ』です」「別名は『CNAMEレコード』です」
  const quotedTermMatch = cleanRight.match(/「([A-Za-z0-9ァ-ヶー一-龠（）()／/・\-+]{2,20})」です/);
  if (quotedTermMatch) {
    const candidate = quotedTermMatch[1].trim();
    if (isGenuineTechnicalTerm(candidate)) {
      return {
        term: candidate,
        definition: cleanRight,
      };
    }
  }

  return null;
}

/**
 * ノート内のMarkdown表や本文に登場する重要対比用語（PBP/ROI/NPV/IRR、SWOT/BSC/PPM、AH/ESP等）の補足辞書
 */
const SUPPLEMENTAL_TERMS_BY_FILENAME: Record<
  string,
  Array<{ term: string; catchphrase: string; analogy: string }>
> = {
  'os-preemption-task-scheduling.md': [
    {
      term: '実行状態（Run）',
      catchphrase: '現在CPUの権利を握ってプログラムを実行している状態（シングルコアなら常に1人だけ）。',
      analogy: '市役所の窓口の椅子に座って手続きしてもらっている状態',
    },
    {
      term: '実行可能状態（Ready）',
      catchphrase: 'いつでも実行できる準備が整い、CPUの順番待ち行列に並んでいる状態。',
      analogy: '書類を全部持って窓口の後ろの待機イスに並んでいる状態',
    },
    {
      term: '待ち状態（Wait）',
      catchphrase: '入出力（I/O）完了などを待っており、CPUが空いてもすぐには動けない状態（自発的解放で遷移）。',
      analogy: '「住民票のコピーを取ってきます」と自分から窓口の席を外した状態',
    },
    {
      term: 'ディスパッチャ',
      catchphrase: '実行可能状態（Ready）のタスクの中から次に実行するタスクを選び、CPU使用権を割り当てるOS機能。',
      analogy: '窓口で「次の方どうぞ！」と席へ案内する進行係',
    },
  ],
  'sec-ipsec-ah-esp.md': [
    {
      term: 'AH（Authentication Header）',
      catchphrase: 'IPsecにおいてデータの「完全性（改ざん検知）」と「送信元認証」のみを行い、暗号化は行わないプロトコル。',
      analogy: '中身が透けて見える透明ケースに「改ざん防止の封蝋スタンプ」だけ押した宅配便',
    },
    {
      term: 'ESP（Encapsulating Security Payload）',
      catchphrase: 'IPsecにおいて「暗号化（機密性）」と「認証・改ざん検知（完全性）」の両方を提供するプロトコル。',
      analogy: '外から中身が見えない頑丈な黒い金庫に封蝋も付けた万能宅配便',
    },
  ],
  'strategy-investment-pbp-payback-period.md': [
    {
      term: 'ROI（投資利益率）',
      catchphrase: 'Return On Investment。投資額に対してどれだけ利益が出たかの「割合（％）」を測る指標（利益÷投資額）。',
      analogy: '100万円のマシンで年間25万円儲かるなら「利回り25%！」と見る指標',
    },
    {
      term: 'NPV（正味現在価値法）',
      catchphrase: 'Net Present Value。将来得られる現金を現在の価値に割り引いて、投資額を引いたプラス額を測る手法。',
      analogy: '将来の100万円を今の価値に換算して「結局いくら得するの？」を計算する方法',
    },
    {
      term: 'IRR（内部収益率法）',
      catchphrase: 'Internal Rate of Return。投資の正味現在価値（NPV）がゼロになる割引率を求め、資本コストと比較する手法。',
      analogy: 'この投資プロジェクト自体の「実質年利は何％に相当するか」を算出する指標',
    },
  ],
  'strategy-value-chain-frameworks.md': [
    {
      term: 'SWOT分析',
      catchphrase: '自社の内部環境（強みStrengths・弱みWeaknesses）と外部環境（機会Opportunities・脅威Threats）を4象限で整理する手法。',
      analogy: '自分の体力（内部）と今日の天気（外部）を4つの箱に書き出して作戦を立てるシート',
    },
    {
      term: 'BSC（バランススコアカード）',
      catchphrase: '「財務・顧客・内部ビジネスプロセス・学習と成長」の4つの視点から戦略目標とKPIを設定・評価する経営管理手法。',
      analogy: '売上だけでなく「客の笑顔・店の仕組み・店員の成長」の4科目でつける通知表',
    },
    {
      term: 'ファイブフォース分析（5つの力）',
      catchphrase: 'マイケル・ポーターが提唱した、業界の収益性を決める「5つの競争要因（新規参入・代替品・買い手・売り手・既存競合）」の分析手法。',
      analogy: '自分の店を取り囲む「5方向のプレッシャー（ライバルや客の強さ）」を測るレーダー',
    },
  ],
  'law-sensitive-personal-information.md': [
    {
      term: '匿名加工情報',
      catchphrase: '特定の個人を識別できないように加工し、かつ「元の個人情報に復元できない」ようにした情報（本人の同意なく第三者提供可能）。',
      analogy: 'モザイクを完全に焼き付けて、二度と元の顔に戻せないようにした統計データ',
    },
    {
      term: '仮名加工情報',
      catchphrase: '氏名などを削除して単体では個人を特定できないように加工した情報（社内でのAI分析・統計分析に利用しやすい）。',
      analogy: '社内カルテの名前を「患者ID: 001」に置き換えて、社内研究に使いやすくしたデータ',
    },
  ],
  'law-labor-contract-dispatch-subcontract.md': [
    {
      term: '偽装請負',
      catchphrase: '契約上は「請負（成果物の完成責任）」であるにもかかわらず、発注者（客先）が労働者に直接「指揮命令」を行ってしまう違法状態。',
      analogy: '外注のパン職人に、発注元の店長が厨房に入って「その粉を混ぜろ」と直接命令してしまうルール違反',
    },
  ],
};

/**
 * 全解説ノートから「100%純粋な専門用語・重要単語」のみを抽出して単語帳データを生成する
 */
export function extractVocabFromNotes(notes: Note[]): VocabItem[] {
  const vocabList: VocabItem[] = [];
  const seenTerms = new Set<string>();
  const readmeMap = parseReadmeSummaries();

  for (const note of notes) {
    if (note.categoryNumber === '00') continue;

    const raw = note.content;
    const readmeInfo = readmeMap[note.filename];

    // 1. 主役用語の決定（READMEのテーマ名 or H1のコロン前 → 正規化辞書を適用）
    let rawTheme = readmeInfo?.theme || note.title.split(/[：:]/)[0].trim();
    const quoteMatch = note.title.match(/「([^」]+)」/);
    if (note.title.startsWith('タイトル') && quoteMatch) {
      rawTheme = quoteMatch[1].trim();
    }
    const mainTerm = MAIN_TERM_NORMALIZATION[rawTheme] || MAIN_TERM_NORMALIZATION[note.title.split(/[：:]/)[0].trim()] || rawTheme;

    // 2. 合言葉（一言定義）と日常のたとえ話の決定
    // 本文の > **『...』** または README目次テーブルの洗練された要約を優先使用
    const mottoMatch = raw.match(/>\s*\*\*『([^』]+)』\*\*/);
    const correctMatch = raw.match(/\*\*正解:\s*[アイウエ]（([^）]+)）\*\*/);

    let catchphrase = '';
    if (mottoMatch) {
      catchphrase = mottoMatch[1].trim();
    } else if (readmeInfo?.catchphrase) {
      catchphrase = readmeInfo.catchphrase;
    } else if (correctMatch) {
      catchphrase = correctMatch[1].trim();
    } else {
      catchphrase = note.title;
    }

    let analogy = '';
    if (readmeInfo?.analogy) {
      analogy = readmeInfo.analogy;
    } else {
      const sec1HeaderMatch = raw.match(/^##\s*1\.\s*([^\n\r]+)/m);
      if (sec1HeaderMatch) {
        analogy = sec1HeaderMatch[1]
          .replace(/^なぜそうなるのか？[（(]?/, '')
          .replace(/[）)]$/, '')
          .replace(/^日常のたとえ話[：:]\s*/, '')
          .trim();
      }
    }
    if (!analogy || analogy.includes('言葉の理屈') || analogy.includes('一発暗記')) {
      analogy = catchphrase;
    }

    // 3. 午後試験 記述対策ワンフレーズ
    let descriptiveAnswer: string | undefined;
    const descMatch = raw.match(/→\s*\*\*「([^」]+)」\*\*/);
    if (descMatch) {
      descriptiveAnswer = descMatch[1].trim();
    }

    const mainKey = normalizeTermKey(mainTerm);
    if (!seenTerms.has(mainKey)) {
      seenTerms.add(mainKey);
      vocabList.push({
        id: `vocab-main-${note.id}`,
        term: mainTerm,
        type: 'main',
        categoryNumber: note.categoryNumber,
        categoryName: note.categoryName,
        catchphrase,
        analogy,
        descriptiveAnswer,
        sourceNoteId: note.id,
        sourceNoteTitle: note.title,
        targetExam: note.targetExam,
      });
    }

    // 4. 補足辞書にある重要関連用語の追加
    const supplements = SUPPLEMENTAL_TERMS_BY_FILENAME[note.filename] || [];
    for (const sup of supplements) {
      const supKey = normalizeTermKey(sup.term);
      if (!seenTerms.has(supKey)) {
        seenTerms.add(supKey);
        vocabList.push({
          id: `vocab-sup-${note.id}-${vocabList.length}`,
          term: sup.term,
          type: 'sub',
          categoryNumber: note.categoryNumber,
          categoryName: note.categoryName,
          catchphrase: sup.catchphrase,
          analogy: sup.analogy,
          sourceNoteId: note.id,
          sourceNoteTitle: note.title,
          targetExam: note.targetExam,
        });
      }
    }

    // 5. セクション1・2の箇条書きから「本物の専門用語」だけを厳格抽出
    const subBulletRegex =
      /^-\s*\*\*(?:[アイウエ][：:]\s*)?([^*\n\r：:]{2,32}?)\*\*(?:[：:]|\s*→\s*)\s*([^\n\r]+)/gm;
    let match: RegExpExecArray | null;
    while ((match = subBulletRegex.exec(raw)) !== null) {
      const rawLeft = match[1]
        .replace(/^[アイウエ][：:\s]+/, '')
        .replace(/【正解！】|（正解！）|\(正解!\)/g, '')
        .trim();
      const rawRight = match[2]
        .replace(/\*\*/g, '')
        .replace(/\$\\rightarrow\$/g, '→')
        .replace(/\\rightarrow/g, '→')
        .replace(/^→\s*/, '')
        .replace(/【正解！】/g, '')
        .replace(/[（(][◯×○✕][）)]/g, '')
        .trim();

      // ケースA: 左側が「専門用語」として適格な場合
      if (isGenuineTechnicalTerm(rawLeft)) {
        if (rawRight.length >= 8 && !/^(誤り|間違い|不適切|正解)/.test(rawRight)) {
          // 既に主役用語や補足用語で登録済みならスキップ
          const cleanTermName = rawLeft.replace(/（親玉）|（手下）|（ホテル）|（家具.*）|（コンクリ.*）/, '').trim();
          const key = normalizeTermKey(cleanTermName);
          if (!seenTerms.has(key)) {
            seenTerms.add(key);
            vocabList.push({
              id: `vocab-sub-${note.id}-${vocabList.length}`,
              term: cleanTermName,
              type: 'sub',
              categoryNumber: note.categoryNumber,
              categoryName: note.categoryName,
              catchphrase: rawRight,
              analogy: `「${mainTerm}」とセットで比較・区別して覚える重要用語`,
              sourceNoteId: note.id,
              sourceNoteTitle: note.title,
              targetExam: note.targetExam,
            });
          }
        }
        continue;
      }

      // ケースB: 左側が説明文で、右側に「〇〇の説明です」と本物の専門用語が書かれている場合を逆引き救出
      const rescued = rescueTermFromChoiceExplanation(rawLeft, rawRight);
      if (rescued) {
        const key = normalizeTermKey(rescued.term);
        if (!seenTerms.has(key)) {
          seenTerms.add(key);
          vocabList.push({
            id: `vocab-rescued-${note.id}-${vocabList.length}`,
            term: rescued.term,
            type: 'sub',
            categoryNumber: note.categoryNumber,
            categoryName: note.categoryName,
            catchphrase: rescued.definition,
            analogy: `「${mainTerm}」の過去問選択肢で登場する重要対比用語`,
            sourceNoteId: note.id,
            sourceNoteTitle: note.title,
            targetExam: note.targetExam,
          });
        }
      }
    }
  }

  return vocabList;
}
