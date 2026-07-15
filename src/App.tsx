import React, { useState, useEffect } from 'react';

// ==========================================
// 🟥 強力暗記！虫食い穴埋め（デジタル赤シート）コンポーネント
// ==========================================
interface MaskedTextProps {
  text: string;
}

export function MaskedText({ text }: MaskedTextProps) {
  const [unmaskedMap, setUnmaskedMap] = useState<{ [key: string]: boolean }>({});

  if (!text) return null;

  // 「【...】」にマッチする正規表現で分割
  const parts = text.split(/(【[^】]+】)/g);

  const toggleMask = (key: string) => {
    setUnmaskedMap(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      {parts.map((part, index) => {
        const isTarget = part.startsWith('【') && part.endsWith('】');
        if (isTarget) {
          const innerText = part.slice(1, -1);
          const maskKey = `${index}-${part}`;
          const isRevealed = unmaskedMap[maskKey];
          return (
            <span
              key={index}
              onClick={() => toggleMask(maskKey)}
              style={{
                backgroundColor: isRevealed ? 'var(--accent-yellow)' : '#2d2d2d',
                color: isRevealed ? 'var(--text-main)' : 'transparent',
                border: '2px solid var(--border-color)',
                padding: '1px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                userSelect: isRevealed ? 'text' : 'none',
                fontWeight: '900',
                transition: 'background-color 0.15s, color 0.15s',
                display: 'inline-block',
                margin: '1px 3px',
                boxShadow: isRevealed ? 'none' : '2px 2px 0 var(--border-color)',
                fontSize: '12px',
                verticalAlign: 'middle'
              }}
              title={isRevealed ? "クリックで隠す" : "クリックで開示"}
            >
              {innerText}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

interface CsvQuestion {
  id: string;
  searchKey: string;
  category: string;
  subCategory: string;
  selected: boolean;
}

// 過去問道場CSV（Shift-JIS）を解析して間違えた問題を抽出する関数
export function parseDojoCsv(csvText: string): CsvQuestion[] {
  const lines = csvText.split(/\r?\n/);
  if (lines.length < 2) return [];

  const questions: CsvQuestion[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // カンマ区切りのパース（ダブルクォート内のカンマを考慮する簡易的な正規表現）
    const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    if (cols.length < 6) continue;

    const judge = cols[1]?.trim(); // 「正誤」 (× または ○)
    if (judge === '×') {
      const category = cols[2]?.replace(/"/g, '').trim() || ''; // 分野名
      const majorCat = cols[3]?.replace(/"/g, '').trim() || ''; // 大分類
      const subCategory = cols[4]?.replace(/"/g, '').trim() || ''; // 中分類
      const sourceCol = cols[5]?.trim() || ''; // 出典 "=HYPERLINK("URL", "検索キー")"

      // 出典カラムから検索キーを抽出
      // 例: "=HYPERLINK(""https://..."",""平成17年春期 問5"")"
      const match = sourceCol.match(/""([^""]+)""\)/) || sourceCol.match(/"([^"]+)"\)/);
      let searchKey = '';
      if (match && match[1]) {
        searchKey = match[1];
      } else {
        searchKey = sourceCol.replace(/"/g, '').trim();
      }

      if (searchKey) {
        questions.push({
          id: `csv-${i}-${Date.now()}`,
          searchKey,
          category,
          subCategory: subCategory || majorCat || category, // 小分類がなければ大分類、なければ分野名
          selected: true
        });
      }
    }
  }
  return questions;
}

// ==========================================
// ⚙️ GAS APIの設定（Vercel仲介プロキシ経由）
// ==========================================
const GAS_API_URL = '/api/gas';

// 環境変数からスプレッドシートの直接のURLを取得
const SPREADSHEET_URL = import.meta.env.VITE_SPREADSHEET_URL || 'https://docs.google.com/spreadsheets/d/1YZ_G_cocHF_99V5DCIF_tiVqvZY2ejykP3sovyC8eCQ/edit';

interface QuestionCard {
  id: string;
  question: string; // 🔍 用語 (GASのB列に対応)
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  correct_answer: string; // 'ア', 'イ', 'ウ', 'エ'
  explanation_conclusion: string; // ① 結論
  explanation_analogy: string;    // ② 例え
  explanation_trap: string;       // ③ 罠
  category: string;
  sub_category: string;
  text_question: string; // 🔍 問題文 (GASのE列に対応)
  review_level: number;
  status: '未定着' | '定着済';
  search_key?: string; // 🔍 道場検索キー (例: "令和5年秋期 問1")
  past_url?: string; // 🔍 過去問道場URL (GASのO列に対応)
  last_reviewed_at?: string; // 🔍 最終復習日時 (GASのR列に対応)
}

// レベルごとの復習間隔（日）
const REVIEW_INTERVALS: { [key: number]: number } = {
  1: 1,  // 1日後
  2: 3,  // 3日後
  3: 7,  // 7日後
  4: 14, // 14日後
  5: 30  // 30日後
};

// 対象カードが今日復習すべきかどうかを判定
export function isCardDue(card: QuestionCard): boolean {
  if (!card.last_reviewed_at) {
    // 復習したことがないカードは常に「要復習」
    return true;
  }
  if (card.status === '未定着') {
    return true;
  }
  
  const lastReviewed = new Date(card.last_reviewed_at);
  const now = new Date();
  
  // 日付の単純差分（時間・分・秒を無視して日付のみで判定するためにJST基準で計算）
  const offset = 9 * 60 * 60 * 1000; // 9時間
  const lastReviewedJst = new Date(lastReviewed.getTime() + offset);
  const nowJst = new Date(now.getTime() + offset);
  
  const lastReviewedDateStr = lastReviewedJst.toISOString().split('T')[0];
  const nowDateStr = nowJst.toISOString().split('T')[0];
  
  const diffTime = new Date(nowDateStr).getTime() - new Date(lastReviewedDateStr).getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  const interval = REVIEW_INTERVALS[card.review_level] || 1;
  return diffDays >= interval;
}

// ストリーク算出関数
export function calculateStreak(cards: QuestionCard[]): number {
  const dates = cards
    .filter(c => c.last_reviewed_at)
    .map(c => {
      const d = new Date(c.last_reviewed_at!);
      const offset = 9 * 60 * 60 * 1000; // 9時間
      const jstDate = new Date(d.getTime() + offset);
      return jstDate.toISOString().split('T')[0];
    });

  if (dates.length === 0) return 0;
  
  const uniqueDates = Array.from(new Set(dates)).sort((a, b) => b.localeCompare(a));
  
  const todayStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() + 9 * 60 * 60 * 1000 - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) {
    return 0;
  }
  
  let streak = 0;
  const checkDate = new Date(uniqueDates[0]);
  
  while (true) {
    const expectedStr = checkDate.toISOString().split('T')[0];
    if (uniqueDates.includes(expectedStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// 🔍 道場検索キーから過去問道場のURLを自動生成する関数
export function getPastQuestionUrl(searchKey?: string): string | null {
  if (!searchKey) return null;
  // 例: "令和5年秋期 問36" や "R5秋 問1" などの揺らぎに対応
  const regex = /(令和|平成|R|H)\s*(\d+)\s*年?\s*(春期|秋期|春|秋)\s*問\s*(\d+)/i;
  const match = searchKey.match(regex);
  if (!match) return null;

  const year = parseInt(match[2], 10);
  const term = match[3];
  const qNum = parseInt(match[4], 10);

  // 年度(2桁)のゼロ埋め
  const yearStr = year < 10 ? `0${year}` : `${year}`;

  let termStr = "";
  if (term.includes('春')) {
    termStr = "haru";
  } else if (term.includes('秋')) {
    termStr = "aki";
  }

  if (!yearStr || !termStr) return null;

  // 例: https://www.ap-siken.com/kakomon/05_aki/q36.html
  return `https://www.ap-siken.com/kakomon/${yearStr}_${termStr}/q${qNum}.html`;
}


// 選択肢のアルファベットを日本語に変換するヘルパー
function getChoiceChar(choice: 'a' | 'b' | 'c' | 'd'): string {
  if (choice === 'a') return 'ア';
  if (choice === 'b') return 'イ';
  if (choice === 'c') return 'ウ';
  return 'エ';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'anki' | 'mindmap' | 'sheet' | 'ebbinghaus'>('dashboard');
  const [cards, setCards] = useState<QuestionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [uploading, setUploading] = useState(false);

  // ダッシュボード内アコーディオン開閉状態
  const [showMindmapAcc, setShowMindmapAcc] = useState(false);
  const [showEbbinghausAcc, setShowEbbinghausAcc] = useState(false);
  const [showAddQuestionAcc, setShowAddQuestionAcc] = useState(false);

  // 1回あたりの復習カード制限 (5問セッションなど)
  const [sessionLimit, setSessionLimit] = useState<number | null>(5);

  // 今日完了した問題のリスト
  const [todayCompletedCount, setTodayCompletedCount] = useState(0);

  // Anki復習モード ('review' = 要復習のみ, 'all' = 全カード)
  const [ankiMode, setAnkiMode] = useState<'review' | 'all'>('review');

  // 選択肢のインタラクティブな判定用状態 ('a' | 'b' | 'c' | 'd' | null)
  const [selectedChoice, setSelectedChoice] = useState<'a' | 'b' | 'c' | 'd' | null>(null);
  const [showJudge, setShowJudge] = useState<'correct' | 'incorrect' | null>(null);

  // 右側の解説カードがアンロック（3D反転）されているか
  const [isRightCardFlipped, setIsRightCardFlipped] = useState(false);

  // 📚 斜め読み防止！解説アコーディオンの開示ステップ状態
  const [revealedSteps, setRevealedSteps] = useState<{ conclusion: boolean; analogy: boolean; trap: boolean }>({
    conclusion: true, // 結論は最初から表示
    analogy: false,
    trap: false
  });

  // データ一覧用検索キーワード
  const [searchQuery, setSearchQuery] = useState('');

  // マインドマップ用選択ノード
  const [selectedMapNode, setSelectedMapNode] = useState<string | null>(null);

  // 📊 CSVインポート用の一時状態
  const [parsedCsvQuestions, setParsedCsvQuestions] = useState<CsvQuestion[]>([]);
  const [importingProgress, setImportingProgress] = useState<{
    current: number;
    total: number;
    active: boolean;
    statusText: string;
  } | null>(null);

  // ==========================================
  // 📥 1. スプレッドシートからデータを取得する (GET)
  // ==========================================
  const fetchCards = async () => {
    try {
      setLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒タイムアウト
      const response = await fetch(GAS_API_URL, { signal: controller.signal });
      clearTimeout(timeoutId);
      const text = await response.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        console.error('GAS response (not JSON):', text.substring(0, 500));
        setCards(getMockData());
        return;
      }
      if (json.status === 'success') {
        setCards(json.data);
      } else {
        console.error('GAS Error:', json.message);
        alert('⚠️ データ取得エラー: ' + json.message);
        setCards(getMockData());
      }
    } catch (e) {
      console.error('Fetch error:', e);
      setCards(getMockData());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  // 今日完了した問題数を更新
  useEffect(() => {
    const todayStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];
    const completedToday = cards.filter(c => {
      if (!c.last_reviewed_at) return false;
      const jstDate = new Date(new Date(c.last_reviewed_at).getTime() + 9 * 60 * 60 * 1000);
      return jstDate.toISOString().split('T')[0] === todayStr;
    }).length;
    setTodayCompletedCount(completedToday);
  }, [cards]);

  // 次のカードへ移る時、各種選択状態をリセット
  useEffect(() => {
    setSelectedChoice(null);
    setIsRightCardFlipped(false);
    setShowJudge(null);
    setRevealedSteps({ conclusion: true, analogy: false, trap: false });
  }, [currentCardIndex, activeTab, ankiMode]);

  // 対象Ankiカードの抽出 (モード別)
  const dueCards = cards.filter(c => isCardDue(c));
  const activeAnkiCards = ankiMode === 'review'
    ? (sessionLimit ? dueCards.slice(0, sessionLimit) : dueCards)
    : cards;

  // ==========================================
  // 📸 2. 画像アップロード ＆ Base64変換 ➔ GAS送信 (POST)
  // ==========================================

  // 画像をCanvas経由で圧縮するユーティリティ（Vercel 4.5MB上限対策）
  const compressImage = (file: File, maxWidth = 1280, quality = 0.75): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, maxWidth / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context error'));
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' });
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  // 📊 CSVファイルがアップロードされた時の解析処理
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const arrayBuffer = event.target?.result as ArrayBuffer;
      const decoder = new TextDecoder('shift-jis');
      const text = decoder.decode(arrayBuffer);
      
      try {
        const questions = parseDojoCsv(text);
        if (questions.length === 0) {
          alert('CSVから間違えた問題（×の行）を検出できませんでした。');
          return;
        }
        setParsedCsvQuestions(questions);
      } catch (err) {
        console.error('CSV parse error:', err);
        alert('CSVファイルの解析に失敗しました。');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // ⚡ 抽出した問題から1件ずつ安全にGASにPOST送信してインポートするキュー処理
  const startCsvImport = async () => {
    const selectedQuestions = parsedCsvQuestions.filter(q => q.selected);
    const total = selectedQuestions.length;
    if (total === 0) {
      alert('インポートする問題が選択されていません。');
      return;
    }

    setImportingProgress({
      current: 0,
      total,
      active: true,
      statusText: '一括カード生成の準備中...'
    });

    let successCount = 0;
    const newCards: QuestionCard[] = [];

    for (let i = 0; i < total; i++) {
      const q = selectedQuestions[i];
      setImportingProgress({
        current: i + 1,
        total,
        active: true,
        statusText: `「${q.searchKey}」のカードを生成中 (${i + 1}/${total}件)...`
      });

      try {
        const response = await fetch(GAS_API_URL, {
          method: 'POST',
          body: JSON.stringify({
            action: 'import_from_csv',
            searchKey: q.searchKey,
            category: q.category,
            subCategory: q.subCategory
          })
        });

        const text = await response.text();
        let json;
        try {
          json = JSON.parse(text);
        } catch {
          console.error(`GAS response for ${q.searchKey} is not JSON:`, text);
          continue;
        }

        if (json.status === 'success') {
          newCards.push(json.data);
          successCount++;
        } else {
          console.error(`Import failed for ${q.searchKey}:`, json.message);
        }
      } catch (err) {
        console.error(`Import error for ${q.searchKey}:`, err);
      }
    }

    if (newCards.length > 0) {
      setCards(prev => [...newCards, ...prev]);
    }

    setImportingProgress(null);
    setParsedCsvQuestions([]);
    alert(`🎉 CSVインポート完了！\n成功: ${successCount} / ${total} 件のカードを生成しました。`);
    
    setAnkiMode('review');
    setActiveTab('anki');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    setUploading(true);

    compressImage(file).then(async ({ base64: rawBase64, mimeType }) => {
      try {
        const response = await fetch(GAS_API_URL, {
          method: 'POST',
          body: JSON.stringify({
            action: 'upload',
            image: rawBase64,
            mimeType
          })
        });
        const text = await response.text();
        let json;
        try {
          json = JSON.parse(text);
        } catch {
          console.error('GAS response (not JSON):', text);
          throw new Error('GASからの応答がJSONではありません: ' + text.substring(0, 200));
        }
        if (json.status === 'success') {
          setCards(prev => [json.data, ...prev]);
          alert('📸 Geminiによる画像解析・登録が完了しました！');
          setAnkiMode('review');
          setActiveTab('anki');
        } else {
          alert('⚠️ エラーが発生しました: ' + json.message);
        }
      } catch (err) {
        console.error('Upload error:', err);
        alert('⚠️ アップロードに失敗しました。\n詳細: ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setUploading(false);
      }
    }).catch(err => {
      console.error('Compression error:', err);
      alert('⚠️ 画像の圧縮に失敗しました。別の画像をお試しください。');
      setUploading(false);
    });
  };


  // ==========================================
  // 🔁 3. Anki学習状況の更新 (POST)
  // ==========================================
  const handleAnkiResponse = async (actionType: 'retry' | 'maybe' | 'perfect') => {
    const targetCard = activeAnkiCards[currentCardIndex];
    if (!targetCard) return;

    const updatedCards = [...cards];
    const realIndex = cards.findIndex(c => c.id === targetCard.id);

    let nextStatus: '未定着' | '定着済' = '未定着';
    let nextLevel = targetCard.review_level || 1;

    if (actionType === 'retry') {
      nextStatus = '未定着';
      nextLevel = 1;
    } else if (actionType === 'maybe') {
      nextStatus = '未定着';
      // レベル維持
    } else if (actionType === 'perfect') {
      nextStatus = '定着済';
      nextLevel = Math.min(5, nextLevel + 1);
    }

    const nowIso = new Date().toISOString();

    if (realIndex !== -1) {
      updatedCards[realIndex].status = nextStatus;
      updatedCards[realIndex].review_level = nextLevel;
      updatedCards[realIndex].last_reviewed_at = nowIso;
      setCards(updatedCards);
    }

    if (currentCardIndex < activeAnkiCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      setCurrentCardIndex(0);
      alert('🎉 本セッションのカードをすべて完了しました！');
      setActiveTab('dashboard');
    }

    try {
      await fetch(GAS_API_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'update_status',
          id: targetCard.id,
          status: nextStatus,
          review_level: nextLevel
        })
      });
    } catch (e) {
      console.error('Status sync error:', e);
    }
  };

  // 選択肢タップ時の正誤判定処理
  const handleChoiceSelect = (choice: 'a' | 'b' | 'c' | 'd') => {
    if (selectedChoice !== null) return; // 回答は1回きり
    setSelectedChoice(choice);
    // 回答したら右側のカードをフリップして自動アンロック
    setIsRightCardFlipped(true);

    const choiceChar = getChoiceChar(choice);
    const isCorrectChoice = choiceChar === activeAnkiCards[currentCardIndex].correct_answer;
    setShowJudge(isCorrectChoice ? 'correct' : 'incorrect');
  };

  // 検索フィルタリングロジック
  const filteredCards = cards.filter(c => 
    (c.question && c.question.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.text_question && c.text_question.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.sub_category && c.sub_category.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.search_key && c.search_key.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // ==========================================
  // 🗺️ 弱点マップの完全動的ノード生成
  // ==========================================
  const weakCards = cards.filter(c => c.status === '未定着');
  const mapNodes = weakCards.slice(0, 8).map((c, index, arr) => {
    const angle = (index * 2 * Math.PI) / arr.length - Math.PI / 2; 
    const cx = 50 + 35 * Math.cos(angle); 
    const cy = 50 + 32 * Math.sin(angle); 
    return {
      ...c,
      cx: `${cx}%`,
      cy: `${cy}%`,
      lineX2: `${cx}%`,
      lineY2: `${cy}%`
    };
  });

  // ==========================================
  // 🌀 📊 CSVインポート中の一括生成プログレスローディング
  // ==========================================
  if (importingProgress && importingProgress.active) {
    const percent = Math.round((importingProgress.current / importingProgress.total) * 100);
    return (
      <div className="loading-overlay-wl" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="spinner-wl"></div>
        <div style={{ textAlign: 'center', color: '#fff', zIndex: 10 }}>
          <div className="loading-text-wl" style={{ fontSize: '18px', fontWeight: '900', marginBottom: '8px' }}>
            一括カード生成中...
          </div>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--accent-mint)', marginBottom: '15px', maxWidth: '300px', margin: '0 auto' }}>
            {importingProgress.statusText}
          </div>
          {/* ネオブルータリズム調の進捗バー */}
          <div style={{ 
            width: '260px', 
            height: '22px', 
            backgroundColor: '#333', 
            border: '3px solid #fff', 
            boxShadow: '4px 4px 0 #000', 
            position: 'relative',
            overflow: 'hidden',
            margin: '0 auto'
          }}>
            <div style={{ 
              width: `${percent}%`, 
              height: '100%', 
              backgroundColor: 'var(--accent-mint)', 
              transition: 'width 0.3s ease-out' 
            }} />
            <span style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)', 
              color: '#fff', 
              fontWeight: '900', 
              fontSize: '11px',
              textShadow: '1px 1px 0 #000'
            }}>
              {percent}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 🌀 📸 画像アップロード中の全画面くるくるローディング
  // ==========================================
  if (uploading) {
    return (
      <div className="loading-overlay-wl" style={{ display: 'flex' }}>
        <div className="spinner-wl"></div>
        <div className="loading-text-wl">解析中...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div id="root" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100svh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', animation: 'spin 1.5s linear infinite' }}>⏳</div>
          <h2 style={{ fontSize: '18px', marginTop: '15px', color: 'var(--accent-blue)', fontFamily: 'var(--font-outfit)', fontWeight: '900' }}>
            LOADING BRAIN DATA...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div id="root">
      {/* Header */}
      <header className="app-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ 
              fontFamily: 'var(--font-outfit)', 
              fontSize: '24px', 
              letterSpacing: '1px', 
              color: 'var(--text-main)', 
              fontWeight: 900,
              textTransform: 'uppercase',
              textShadow: '3px 3px 0 var(--accent-yellow)',
              background: '#fff',
              border: '3px solid var(--border-color)',
              boxShadow: '4px 4px 0 var(--border-color)',
              padding: '6px 16px',
              display: 'inline-block',
              margin: 0 
            }}>
              AP MindMap
            </h1>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold', marginTop: '6px', marginLeft: '4px' }}>
              応用情報 脳内ハッキング学習
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* ストリークカウンター */}
            <div 
              className="glass-panel" 
              style={{ 
                padding: '8px 12px', 
                fontSize: '12px', 
                fontWeight: '900', 
                borderColor: 'var(--border-color)', 
                background: 'var(--accent-yellow)',
                boxShadow: '2px 2px 0 var(--border-color)',
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="連続で復習した日数（デバイス間で同期されます）"
            >
              🔥 {calculateStreak(cards)}日連続!
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-content">
        {/* ----------------- ダッシュボード (ホーム) ----------------- */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* 本日の目標・進捗 */}
            <div className="glass-panel" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'var(--accent-blue)' }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '900', color: 'var(--text-secondary)' }}>今日の復習進捗</h2>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                  今日完了: <strong style={{ fontSize: '16px', color: 'var(--accent-blue)' }}>{todayCompletedCount}</strong>問
                </span>
              </div>

              {/* 進捗ゲージ */}
              {(() => {
                const target = sessionLimit || 5;
                const percent = Math.min(100, Math.round((todayCompletedCount / target) * 100));
                return (
                  <div style={{ marginBottom: '20px' }}>
                    <div className="progress-neon-bar">
                      <div
                        className="progress-neon-fill"
                        style={{
                          width: `${percent}%`,
                          background: 'var(--accent-mint)'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '6px', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                      <span>目標まで {Math.max(0, target - todayCompletedCount)} 問</span>
                      <span>目標: {target}問 ({percent}%)</span>
                    </div>
                  </div>
                );
              })()}

              <div style={{ borderBottom: '2px solid var(--border-color)', marginBottom: '15px' }} />

              {/* クイック開始セクション */}
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '900', color: 'var(--text-main)', marginBottom: '10px', textAlign: 'left' }}>
                  ⚡ クイック復習トレーニング
                </h3>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
                  <button 
                    className={`glass-panel ${sessionLimit === 5 ? 'active' : ''}`}
                    style={{ flex: '1', padding: '8px', fontSize: '12px', fontWeight: '900', cursor: 'pointer', background: sessionLimit === 5 ? 'var(--accent-yellow)' : '#fff' }}
                    onClick={() => setSessionLimit(5)}
                  >
                    5問
                  </button>
                  <button 
                    className={`glass-panel ${sessionLimit === 10 ? 'active' : ''}`}
                    style={{ flex: '1', padding: '8px', fontSize: '12px', fontWeight: '900', cursor: 'pointer', background: sessionLimit === 10 ? 'var(--accent-yellow)' : '#fff' }}
                    onClick={() => setSessionLimit(10)}
                  >
                    10問
                  </button>
                  <button 
                    className={`glass-panel ${sessionLimit === null ? 'active' : ''}`}
                    style={{ flex: '1', padding: '8px', fontSize: '12px', fontWeight: '900', cursor: 'pointer', background: sessionLimit === null ? 'var(--accent-yellow)' : '#fff' }}
                    onClick={() => setSessionLimit(null)}
                  >
                    制限なし
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    className="neon-btn"
                    style={{ flex: 2, justifyContent: 'center', fontSize: '15px', padding: '12px' }}
                    disabled={dueCards.length === 0}
                    onClick={() => {
                      setAnkiMode('review');
                      setCurrentCardIndex(0);
                      setActiveTab('anki');
                    }}
                  >
                    📅 期限切れ {dueCards.length} 問を復習
                  </button>
                  <button
                    className="neon-btn neon-btn-mint"
                    style={{ flex: 1, justifyContent: 'center', fontSize: '13px', padding: '12px' }}
                    onClick={() => {
                      setAnkiMode('all');
                      setCurrentCardIndex(0);
                      setActiveTab('anki');
                    }}
                  >
                    📚 全 {cards.length} 問
                  </button>
                </div>
              </div>
            </div>

            {/* 📥 アコーディオン：問題の追加 (スクショ & CSV) */}
            <div className="glass-panel" style={{ overflow: 'hidden' }}>
              <div 
                style={{ padding: '15px 20px', background: 'var(--bg-color)', borderBottom: showAddQuestionAcc ? '3px solid var(--border-color)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setShowAddQuestionAcc(!showAddQuestionAcc)}
              >
                <h3 style={{ fontSize: '15px', fontWeight: '900', color: 'var(--text-main)', margin: 0 }}>
                  ＋ 問題を追加する（スクショ / 過去問道場CSV）
                </h3>
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{showAddQuestionAcc ? '▲' : '▼'}</span>
              </div>

              {showAddQuestionAcc && (
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* クイック画像アップロード */}
                  <div style={{ 
                    padding: '20px', 
                    border: '2px dashed var(--border-color)', 
                    textAlign: 'center', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: '12px' 
                  }}>
                    <div style={{ fontSize: '32px' }}>📸</div>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: '900', marginBottom: '4px' }}>間違えた問題のスクショを登録</h4>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Geminiが文字起こしと極上解説を自動生成します</p>
                    </div>

                    <label className="neon-btn neon-btn-mint" style={{ cursor: 'pointer', width: '100%', maxWidth: '200px', padding: '8px 16px', fontSize: '12px' }}>
                      {uploading ? '⏳ 解析中...' : 'ファイルを選択'}
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploading} />
                    </label>
                  </div>

                  {/* 📊 過去問道場CSV一括インポート */}
                  <div style={{ 
                    padding: '20px', 
                    border: '2px dashed var(--border-color)', 
                    textAlign: 'center', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: '12px' 
                  }}>
                    <div style={{ fontSize: '32px' }}>📊</div>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: '900', marginBottom: '4px' }}>過去問道場CSVから一括インポート</h4>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>学習履歴CSVから間違えた問題を一括自動生成します</p>
                    </div>

                    {parsedCsvQuestions.length === 0 ? (
                      <label className="neon-btn neon-btn-mint" style={{ cursor: 'pointer', width: '100%', maxWidth: '200px', padding: '8px 16px', fontSize: '12px' }}>
                        履歴CSVを選択
                        <input type="file" accept=".csv" onChange={handleCsvUpload} style={{ display: 'none' }} />
                      </label>
                    ) : (
                      <div style={{ width: '100%', textAlign: 'left', marginTop: '5px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold' }}>
                            検出された間違えた問題: {parsedCsvQuestions.length} 件
                          </span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button 
                              style={{ fontSize: '10px', padding: '2px 4px', cursor: 'pointer', fontWeight: 'bold', border: '1px solid var(--border-color)', background: '#eee' }}
                              onClick={() => setParsedCsvQuestions(prev => prev.map(q => ({ ...q, selected: true })))}
                            >
                              全選択
                            </button>
                            <button 
                              style={{ fontSize: '10px', padding: '2px 4px', cursor: 'pointer', fontWeight: 'bold', border: '1px solid var(--border-color)', background: '#eee' }}
                              onClick={() => setParsedCsvQuestions(prev => prev.map(q => ({ ...q, selected: false })))}
                            >
                              全解除
                            </button>
                          </div>
                        </div>

                        {/* スクロール可能な問題リスト */}
                        <div style={{ 
                          maxHeight: '150px', 
                          overflowY: 'auto', 
                          border: '2px solid var(--border-color)', 
                          padding: '6px', 
                          background: '#fafafa',
                          marginBottom: '10px'
                        }}>
                          {parsedCsvQuestions.map((q) => (
                            <label 
                              key={q.id} 
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px', 
                                fontSize: '11px', 
                                padding: '3px 0', 
                                cursor: 'pointer',
                                borderBottom: '1px solid #eee'
                              }}
                            >
                              <input 
                                type="checkbox" 
                                checked={q.selected} 
                                onChange={() => setParsedCsvQuestions(prev => prev.map(item => item.id === q.id ? { ...item, selected: !item.selected } : item))}
                              />
                              <span style={{ 
                                fontSize: '9px', 
                                background: q.category.includes('テクノロジ') ? 'var(--accent-mint)' : 'var(--accent-yellow)',
                                padding: '1px 3px',
                                border: '1px solid var(--border-color)',
                                fontWeight: 'bold'
                              }}>
                                {q.subCategory}
                              </span>
                              <span style={{ fontWeight: 'bold' }}>{q.searchKey}</span>
                            </label>
                          ))}
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="neon-btn" 
                            style={{ flex: 1, padding: '6px', fontSize: '11px', background: '#ccc', cursor: 'pointer' }}
                            onClick={() => setParsedCsvQuestions([])}
                          >
                            キャンセル
                          </button>
                          <button 
                            className="neon-btn neon-btn-mint" 
                            style={{ flex: 2, padding: '6px', fontSize: '11px', cursor: 'pointer' }}
                            onClick={startCsvImport}
                          >
                            ⚡ {parsedCsvQuestions.filter(q => q.selected).length} 件生成
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 🧠 アコーディオン：忘却曲線（エビングハウス）の分類状況 */}
            <div className="glass-panel" style={{ overflow: 'hidden' }}>
              <div 
                style={{ padding: '15px 20px', background: 'var(--bg-color)', borderBottom: showEbbinghausAcc ? '3px solid var(--border-color)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setShowEbbinghausAcc(!showEbbinghausAcc)}
              >
                <h3 style={{ fontSize: '15px', fontWeight: '900', color: 'var(--text-main)', margin: 0 }}>
                  🧠 忘却曲線（エビングハウス）定着状況
                </h3>
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{showEbbinghausAcc ? '▲' : '▼'}</span>
              </div>

              {showEbbinghausAcc && (
                <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                    {[
                      { level: 1, title: 'Lv.1 翌日', color: 'var(--primary-color)' },
                      { level: 2, title: 'Lv.2 3日後', color: '#ff9800' },
                      { level: 3, title: 'Lv.3 1週間', color: 'var(--accent-yellow)' },
                      { level: 4, title: 'Lv.4 2週間', color: 'var(--accent-blue)' },
                      { level: 5, title: 'Lv.5 定着済', color: 'var(--accent-mint)' }
                    ].map(bucket => {
                      const bucketCards = cards.filter(c => c.review_level === bucket.level);
                      return (
                        <div key={bucket.level} style={{ minWidth: '160px', flex: '1', border: '2px solid var(--border-color)', background: '#fff', display: 'flex', flexDirection: 'column' }}>
                          <div style={{ background: bucket.color, color: bucket.level === 3 || bucket.level === 5 ? 'var(--text-main)' : '#fff', padding: '6px', fontSize: '11px', fontWeight: '900', borderBottom: '2px solid var(--border-color)', textAlign: 'center' }}>
                            {bucket.title} ({bucketCards.length})
                          </div>
                          <div style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', maxHeight: '200px' }}>
                            {bucketCards.map(c => (
                              <div 
                                key={c.id} 
                                className="glass-panel" 
                                style={{ padding: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', boxShadow: '2px 2px 0 var(--border-color)' }} 
                                onClick={() => {
                                  setAnkiMode('all');
                                  const index = cards.findIndex(card => card.id === c.id);
                                  setCurrentCardIndex(index !== -1 ? index : 0);
                                  setActiveTab('anki');
                                }}
                              >
                                {c.question && c.question.length > 10 ? `${c.question.substring(0, 9)}…` : c.question}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 🗺️ アコーディオン：脳内弱点マインドマップ */}
            <div className="glass-panel" style={{ overflow: 'hidden' }}>
              <div 
                style={{ padding: '15px 20px', background: 'var(--bg-color)', borderBottom: showMindmapAcc ? '3px solid var(--border-color)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setShowMindmapAcc(!showMindmapAcc)}
              >
                <h3 style={{ fontSize: '15px', fontWeight: '900', color: 'var(--text-main)', margin: 0 }}>
                  🗺️ 脳内弱点マインドマップ
                </h3>
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{showMindmapAcc ? '▲' : '▼'}</span>
              </div>

              {showMindmapAcc && (
                <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold', margin: 0 }}>
                    赤いノードが未暗記の弱点用語です（タップでジャンプ）
                  </p>
                  
                  <div style={{ width: '100%', height: '300px', position: 'relative', overflow: 'hidden', background: '#fff', border: '2px solid var(--border-color)' }}>
                    {mapNodes.length === 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', gap: '6px' }}>
                        <div style={{ fontSize: '32px' }}>🎉</div>
                        <strong style={{ fontSize: '14px', fontWeight: '900' }}>脳内弱点はありません！</strong>
                      </div>
                    ) : (
                      <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                        {mapNodes.map((node) => (
                          <line 
                            key={`line-${node.id}`} 
                            x1="50%" 
                            y1="50%" 
                            x2={node.lineX2} 
                            y2={node.lineY2} 
                            stroke="var(--border-color)" 
                            strokeWidth="2" 
                          />
                        ))}

                        <circle cx="50%" cy="50%" r="20" fill="var(--accent-yellow)" stroke="var(--border-color)" strokeWidth="3" />
                        <text x="50%" y="53%" fill="var(--text-main)" fontSize="10" fontWeight="900" textAnchor="middle" pointerEvents="none">AP脳内</text>

                        {mapNodes.map((node) => (
                          <g key={node.id} onClick={() => setSelectedMapNode(node.question)} style={{ cursor: 'pointer' }}>
                            <circle 
                              cx={node.cx} 
                              cy={node.cy} 
                              r="12" 
                              fill="#fff" 
                              stroke="var(--primary-color)" 
                              strokeWidth="3" 
                              className="node-glow" 
                            />
                            <text 
                              x={node.cx} 
                              y={parseFloat(node.cy) + 8 + '%'} 
                              fill="var(--text-main)" 
                              fontSize="9" 
                              fontWeight="900" 
                              textAnchor="middle" 
                              pointerEvents="none"
                            >
                              {node.question && node.question.length > 6 ? `${node.question.substring(0, 5)}…` : (node.question || '')}
                            </text>
                          </g>
                        ))}
                      </svg>
                    )}
                  </div>

                  {selectedMapNode && (
                    <div className="glass-panel" style={{ padding: '12px', position: 'relative', borderLeftWidth: '6px', borderLeftColor: 'var(--accent-blue)', marginTop: '8px' }}>
                      <button
                        style={{ position: 'absolute', top: '8px', right: '8px', background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
                        onClick={() => setSelectedMapNode(null)}
                      >
                        ✕
                      </button>
                      <h4 style={{ fontSize: '14px', fontWeight: '900', color: 'var(--text-main)', margin: '0 0 6px 0' }}>{selectedMapNode}</h4>
                      <button
                        className="neon-btn neon-btn-mint"
                        style={{ padding: '6px 12px', fontSize: '11px' }}
                        onClick={() => {
                          setAnkiMode('all');
                          const allIndex = cards.findIndex(c => c.question === selectedMapNode || c.sub_category === selectedMapNode);
                          setCurrentCardIndex(allIndex !== -1 ? allIndex : 0);
                          setActiveTab('anki');
                        }}
                      >
                        🚀 この過去問へジャンプ
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* カテゴリ別の定着進捗 */}
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '900', color: 'var(--text-main)', margin: 0 }}>分野別定着率</h3>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px', fontWeight: 'bold' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>テクノロジ系</span>
                  <span style={{ fontFamily: 'var(--font-outfit)', fontWeight: '900' }}>
                    {cards.filter(c => c.category === 'テクノロジ系').length > 0
                      ? Math.round((cards.filter(c => c.category === 'テクノロジ系' && c.status === '定着済').length / cards.filter(c => c.category === 'テクノロジ系').length) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="progress-neon-bar">
                  <div
                    className="progress-neon-fill"
                    style={{
                      width: `${cards.filter(c => c.category === 'テクノロジ系').length > 0
                        ? (cards.filter(c => c.category === 'テクノロジ系' && c.status === '定着済').length / cards.filter(c => c.category === 'テクノロジ系').length) * 100
                        : 0}%`,
                      background: 'var(--accent-mint)'
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px', fontWeight: 'bold' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>マネジメント/ストラテジ系</span>
                  <span style={{ fontFamily: 'var(--font-outfit)', fontWeight: '900' }}>
                    {cards.filter(c => c.category !== 'テクノロジ系').length > 0
                      ? Math.round((cards.filter(c => c.category !== 'テクノロジ系' && c.status === '定着済').length / cards.filter(c => c.category !== 'テクノロジ系').length) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="progress-neon-bar">
                  <div
                    className="progress-neon-fill"
                    style={{
                      width: `${cards.filter(c => c.category !== 'テクノロジ系').length > 0
                        ? (cards.filter(c => c.category !== 'テクノロジ系' && c.status === '定着済').length / cards.filter(c => c.category !== 'テクノロジ系').length) * 100
                        : 0}%`,
                      background: 'var(--primary-color)'
                    }}
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ----------------- Ankiカード (スマホ・PC両対応レイアウト) ----------------- */}
        {activeTab === 'anki' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            
            {/* モード切替インジケータ */}
            <div className="glass-panel" style={{ 
              display: 'flex', 
              width: '100%', 
              maxWidth: '1100px', 
              padding: '8px 12px', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              backgroundColor: ankiMode === 'all' ? 'var(--accent-yellow)' : '#fff',
              borderWidth: '3px',
              borderColor: 'var(--border-color)',
              fontWeight: '900',
              fontSize: '13px'
            }}>
              <span>
                {ankiMode === 'all' ? '✨ 全カードモード中' : '📅 期限切れ復習モード中'}
              </span>
              <button 
                className="neon-btn" 
                style={{ 
                  padding: '4px 8px', 
                  fontSize: '11px', 
                  background: ankiMode === 'all' ? 'var(--accent-blue)' : 'var(--accent-yellow)',
                  color: ankiMode === 'all' ? '#fff' : 'var(--text-main)',
                  boxShadow: '2px 2px 0 var(--border-color)',
                  fontWeight: 900
                }}
                onClick={() => {
                  setAnkiMode(ankiMode === 'review' ? 'all' : 'review');
                  setCurrentCardIndex(0);
                }}
              >
                切り替え 🔄
              </button>
            </div>

            {activeAnkiCards.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: '56px', marginBottom: '15px' }}>🎉</div>
                <h3 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '8px' }}>要復習の過去問はありません！</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', fontWeight: 'bold' }}>
                  毎日少しずつ、新カードを追加するか全カードで復習しましょう！
                </p>
                <button 
                  className="neon-btn" 
                  onClick={() => {
                    setAnkiMode('all');
                    setCurrentCardIndex(0);
                  }}
                >
                  全カードモードへ移行 📚
                </button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                  問題 {currentCardIndex + 1} / {activeAnkiCards.length}
                </div>

                {/* 左右見開き/上下スタック対応コンテナ */}
                <div className="anki-dual-layout" style={{ width: '100%' }}>

                  {/* 1. 問題カード */}
                  <div className="card-container" style={{ height: 'auto', minHeight: '380px' }}>
                    <div className="card-face card-front" style={{ position: 'relative', height: '100%', minHeight: '380px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                      
                      {/* メタ情報 */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                        <span style={{ 
                          fontSize: '10px', 
                          color: 'var(--text-main)', 
                          border: '2px solid var(--border-color)', 
                          padding: '2px 6px', 
                          background: 'var(--accent-yellow)',
                          fontWeight: '900'
                        }}>
                          {activeAnkiCards[currentCardIndex].sub_category}
                        </span>
                        {activeAnkiCards[currentCardIndex].search_key && (
                          <span style={{ 
                            fontSize: '10px', 
                            color: '#fff', 
                            border: '2px solid var(--border-color)', 
                            padding: '2px 6px', 
                            background: 'var(--accent-blue)',
                            fontWeight: '900'
                          }}>
                            🔍 {activeAnkiCards[currentCardIndex].search_key}
                          </span>
                        )}
                        {(() => {
                          const url = getPastQuestionUrl(activeAnkiCards[currentCardIndex].search_key);
                          return url ? (
                            <a 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              style={{ 
                                fontSize: '10px', 
                                color: 'var(--text-main)', 
                                border: '2px solid var(--border-color)', 
                                padding: '2px 6px', 
                                background: 'var(--accent-mint)',
                                fontWeight: '900',
                                textDecoration: 'none',
                                boxShadow: '2px 2px 0 var(--border-color)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              🌐 過去問道場 ↗
                            </a>
                          ) : null;
                        })()}
                      </div>

                      <p style={{ fontSize: '15px', lineHeight: '1.5', textAlign: 'left', fontWeight: '700', color: 'var(--text-main)', marginBottom: '15px' }}>
                        {activeAnkiCards[currentCardIndex].text_question}
                      </p>

                      {/* 選択肢 */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginBottom: '15px' }}>
                        {['a', 'b', 'c', 'd'].map((ch) => {
                          const choice = ch as 'a' | 'b' | 'c' | 'd';
                          const choiceChar = getChoiceChar(choice);
                          const isCorrectChoice = choiceChar === activeAnkiCards[currentCardIndex].correct_answer;
                          
                          let choiceClass = "choice-box";
                          if (selectedChoice !== null) {
                            if (isCorrectChoice) {
                              choiceClass += " choice-correct";
                            } else if (selectedChoice === choice) {
                              choiceClass += " choice-incorrect";
                            }
                          }

                          return (
                            <div 
                              key={choice} 
                              className={choiceClass} 
                              onClick={() => handleChoiceSelect(choice)}
                              style={{ padding: '10px 14px', fontSize: '12px' }}
                            >
                              <span>
                                {choiceChar}. {
                                  choice === 'a' ? activeAnkiCards[currentCardIndex].choice_a :
                                  choice === 'b' ? activeAnkiCards[currentCardIndex].choice_b :
                                  choice === 'c' ? activeAnkiCards[currentCardIndex].choice_c :
                                  activeAnkiCards[currentCardIndex].choice_d
                                }
                              </span>

                              {selectedChoice !== null && (isCorrectChoice || selectedChoice === choice) && (
                                <span className="choice-badge" style={{ fontSize: '12px', padding: '1px 6px' }}>
                                  {isCorrectChoice ? '◯ 正解' : '✕ 不正解'}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', textAlign: 'center', marginTop: 'auto' }}>
                        {selectedChoice === null ? '👉 選択肢を選んで解答してください（◯/✕判定が出ます）' : '✅ 解答完了！右側の解説を確認しましょう！'}
                      </div>

                      {/* 正誤判定オーバーレイ */}
                      {showJudge === 'correct' && <div className="judge-overlay show-correct" style={{ fontSize: '100px' }}>◯</div>}
                      {showJudge === 'incorrect' && <div className="judge-overlay show-incorrect" style={{ fontSize: '100px' }}>✕</div>}
                    </div>
                  </div>

                  {/* 2. 解説カード */}
                  <div className="card-container" style={{ height: 'auto', minHeight: '380px' }}>
                    <div className={`anki-card ${isRightCardFlipped ? 'is-flipped' : ''}`} style={{ height: '100%' }}>

                      {/* ロック状態 (回答前) */}
                      <div 
                        className="card-face card-front" 
                        style={{ height: '100%', minHeight: '380px', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-color)', gap: '10px' }}
                        onClick={() => setIsRightCardFlipped(true)}
                      >
                        <div style={{ fontSize: '40px' }}>🔒</div>
                        <strong style={{ fontSize: '15px', fontWeight: '900', color: 'var(--text-main)' }}>
                          解説カード
                        </strong>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold', textAlign: 'center', maxWidth: '240px' }}>
                          左側で解答すると自動でアンロック（反転）します
                        </p>
                        <button 
                          className="neon-btn neon-btn-mint" 
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={(e) => { e.stopPropagation(); setIsRightCardFlipped(true); }}
                        >
                          🔓 解説をみる
                        </button>
                      </div>

                      {/* アンロック状態 (解説表示) */}
                      <div className="card-face card-back" style={{ height: '100%', minHeight: '380px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                        <div style={{ textAlign: 'left', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                            <h4 style={{ fontSize: '15px', color: 'var(--primary-color)', fontWeight: '900', margin: 0 }}>
                              正解: 【 {activeAnkiCards[currentCardIndex].correct_answer} 】
                            </h4>
                            {activeAnkiCards[currentCardIndex].search_key && (
                              (() => {
                                const url = getPastQuestionUrl(activeAnkiCards[currentCardIndex].search_key);
                                return url ? (
                                  <a 
                                    href={url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="neon-btn neon-btn-mint"
                                    style={{ 
                                      fontSize: '10px', 
                                      padding: '2px 8px', 
                                      boxShadow: '1.5px 1.5px 0 var(--border-color)',
                                      textDecoration: 'none'
                                    }}
                                  >
                                    過去問道場 ↗
                                  </a>
                                ) : null;
                              })()
                            )}
                          </div>
                          <div style={{ borderBottom: '2px solid var(--border-color)', marginTop: '8px', marginBottom: '8px' }} />
                        </div>

                        {/* 段階的開示解説 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', overflowY: 'auto', flex: 1 }}>
                          {/* 結論 */}
                          <div className="glass-panel" style={{ padding: '10px 14px', borderLeft: '6px solid var(--accent-blue)', display: 'block', boxShadow: '2px 2px 0 var(--border-color)' }}>
                            <strong style={{ fontSize: '11px', color: 'var(--accent-blue)', display: 'block', marginBottom: '4px' }}>
                              ① 結論 ＆ キーワード
                            </strong>
                            <p style={{ fontSize: '12px', lineHeight: '1.5', color: 'var(--text-main)', fontWeight: '700', whiteSpace: 'pre-wrap', margin: 0 }}>
                              <MaskedText text={activeAnkiCards[currentCardIndex].explanation_conclusion} />
                            </p>
                          </div>

                          {/* 例え話展開ボタン */}
                          {!revealedSteps.analogy && (
                            <button
                              className="neon-btn neon-btn-mint"
                              style={{ width: '100%', justifyContent: 'center', fontSize: '12px', padding: '8px 12px', boxShadow: '2px 2px 0 var(--border-color)' }}
                              onClick={() => setRevealedSteps(prev => ({ ...prev, analogy: true }))}
                            >
                              💡 次のステップ：例え話でイメージする ➔
                            </button>
                          )}

                          {/* 例え話 */}
                          {revealedSteps.analogy && (
                            <div className="glass-panel" style={{ padding: '10px 14px', borderLeft: '6px solid var(--accent-yellow)', boxShadow: '2px 2px 0 var(--border-color)' }}>
                              <strong style={{ fontSize: '11px', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                                ② 身近な例え話
                              </strong>
                              <p style={{ fontSize: '12px', lineHeight: '1.5', color: 'var(--text-main)', fontWeight: '700', whiteSpace: 'pre-wrap', margin: 0 }}>
                                <MaskedText text={activeAnkiCards[currentCardIndex].explanation_analogy} />
                              </p>
                            </div>
                          )}

                          {/* 罠展開ボタン */}
                          {revealedSteps.analogy && !revealedSteps.trap && (
                            <button
                              className="neon-btn"
                              style={{ width: '100%', justifyContent: 'center', fontSize: '12px', padding: '8px 12px', background: 'var(--accent-yellow)', color: 'var(--text-main)', boxShadow: '2px 2px 0 var(--border-color)' }}
                              onClick={() => setRevealedSteps(prev => ({ ...prev, trap: true }))}
                            >
                              ⚠️ 最終ステップ：引っかけの罠を見破る ➔
                            </button>
                          )}

                          {/* 罠 */}
                          {revealedSteps.trap && (
                            <div className="glass-panel" style={{ padding: '10px 14px', borderLeft: '6px solid var(--primary-color)', boxShadow: '2px 2px 0 var(--border-color)' }}>
                              <strong style={{ fontSize: '11px', color: 'var(--primary-color)', display: 'block', marginBottom: '4px' }}>
                                ③ 引っかけの罠
                              </strong>
                              <p style={{ fontSize: '12px', lineHeight: '1.5', color: 'var(--text-main)', fontWeight: '700', whiteSpace: 'pre-wrap', margin: 0 }}>
                                <MaskedText text={activeAnkiCards[currentCardIndex].explanation_trap} />
                              </p>
                            </div>
                          )}
                        </div>

                        {/* 大カード裏返しの復帰用（クリックでロック表面に戻す） */}
                        <div style={{ textAlign: 'center', marginTop: '10px' }}>
                          <button 
                            className="neon-btn" 
                            style={{ padding: '6px 12px', fontSize: '11px', background: 'transparent', color: 'var(--text-secondary)', borderColor: 'var(--border-color)', boxShadow: '2px 2px 0 var(--border-color)' }}
                            onClick={(e) => { e.stopPropagation(); setIsRightCardFlipped(false); }}
                          >
                            🔒 解説を再度ロックする
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

                {/* 学習判定・進捗用コントロールボタン (3択化) */}
                <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '1100px', marginTop: '10px' }}>
                  <button
                    className="neon-btn"
                    style={{ flex: 1.2, background: 'var(--primary-color)', color: '#fff', justifyContent: 'center', fontSize: '13px', padding: '10px 0' }}
                    onClick={() => handleAnkiResponse('retry')}
                  >
                    ❌ もう一度 (Lv.1)
                  </button>
                  <button
                    className="neon-btn"
                    style={{ flex: 1, background: 'var(--accent-yellow)', color: 'var(--text-main)', justifyContent: 'center', fontSize: '13px', padding: '10px 0' }}
                    onClick={() => handleAnkiResponse('maybe')}
                  >
                    🤔 あやふや
                  </button>
                  <button
                    className="neon-btn neon-btn-mint"
                    style={{ flex: 1.2, justifyContent: 'center', fontSize: '13px', padding: '10px 0' }}
                    onClick={() => handleAnkiResponse('perfect')}
                  >
                    ✅ 完璧！ (Lv+1)
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ----------------- 全データ (スプレッドシート連携) ----------------- */}
        {activeTab === 'sheet' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div className="glass-panel" style={{ display: 'inline-block', padding: '6px 16px', marginBottom: '8px', backgroundColor: 'var(--accent-blue)' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '900', color: '#fff', margin: 0 }}>データベース＆スプレッドシート</h2>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>登録問題データの検索・一覧表示、及びマスター編集を行えます</p>
            </div>

            {/* 巨大スプレッドシートボタン */}
            <a 
              href={SPREADSHEET_URL} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="neon-btn neon-btn-mint"
              style={{ 
                width: '100%', 
                padding: '12px 18px', 
                fontSize: '14px', 
                justifyContent: 'center', 
                textDecoration: 'none', 
                boxShadow: '4px 4px 0 var(--border-color)',
                textAlign: 'center'
              }}
            >
              📊 Google スプレッドシートを直接開く ↗
            </a>

            {/* 検索バー */}
            <input 
              type="text" 
              placeholder="🔍 用語、カテゴリ、問題文で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '10px 14px',
                fontSize: '13px',
                border: '3px solid var(--border-color)',
                boxShadow: '3px 3px 0 var(--border-color)',
                outline: 'none',
                fontWeight: 'bold',
                fontFamily: 'inherit'
              }}
            />

            {/* データテーブル */}
            <div className="glass-panel" style={{ overflowX: 'auto', padding: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '3px solid var(--border-color)' }}>
                    <th style={{ padding: '8px', fontWeight: '900' }}>用語</th>
                    <th style={{ padding: '8px', fontWeight: '900' }}>カテゴリ</th>
                    <th style={{ padding: '8px', fontWeight: '900' }}>検索キー</th>
                    <th style={{ padding: '8px', fontWeight: '900' }}>状態/Lv</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCards.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '15px 8px', textAlign: 'center', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                        該当するデータが見つかりません
                      </td>
                    </tr>
                  ) : (
                    filteredCards.map((c) => (
                      <tr 
                        key={c.id} 
                        style={{ borderBottom: '1px solid #e2dcd0', cursor: 'pointer' }}
                        onClick={() => {
                          setAnkiMode('all');
                          const index = cards.findIndex(card => card.id === c.id);
                          setCurrentCardIndex(index !== -1 ? index : 0);
                          setActiveTab('anki');
                        }}
                      >
                        <td style={{ padding: '10px 8px', fontWeight: 'bold' }}>{c.question}</td>
                        <td style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>{c.sub_category}</td>
                        <td style={{ padding: '10px 8px', fontFamily: 'var(--font-outfit)', fontWeight: 'bold' }} onClick={(e) => {
                          const url = getPastQuestionUrl(c.search_key);
                          if (url) {
                            e.stopPropagation();
                            window.open(url, '_blank', 'noopener,noreferrer');
                          }
                        }}>
                          {c.search_key ? (
                            <span style={{ color: 'var(--accent-blue)', textDecoration: 'underline', cursor: 'pointer' }}>
                              {c.search_key} ↗
                            </span>
                          ) : '-'}
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          <span style={{ 
                            padding: '1px 4px', 
                            fontSize: '9px', 
                            fontWeight: 'bold', 
                            border: '1px solid var(--border-color)', 
                            background: c.status === '定着済' ? 'var(--accent-mint)' : 'var(--primary-color)',
                            color: c.status === '定着済' ? 'var(--text-main)' : '#fff'
                          }}>
                            {c.status} (Lv.{c.review_level})
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <a href="#dashboard" className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          ホーム
        </a>
        <a href="#anki" className={`nav-item ${activeTab === 'anki' ? 'active' : ''}`} onClick={() => {
          setCurrentCardIndex(0);
          setActiveTab('anki');
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Anki復習
        </a>
        <a href="#sheet" className={`nav-item ${activeTab === 'sheet' ? 'active' : ''}`} onClick={() => setActiveTab('sheet')}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          全データ
        </a>
      </nav>
    </div>
  );
}

// デモ用フォールバックデータ
function getMockData(): QuestionCard[] {
  return [
    {
      id: 'mock-1',
      question: 'DNSキャッシュポイズニング',
      text_question: 'DNSキャッシュポイズニング攻撃に対する根本的な対策はどれか。',
      choice_a: 'DNSサーバでゾーン転送を許可するIPアドレスを制限する。',
      choice_b: 'DNS応答に含まれる署名を検証するDNSSECを導入する。',
      choice_c: 'DNSクエリの送信元ポート番号を固定する。',
      choice_d: 'キャッシュDNSサーバに登録するレコードの有効期限（TTL）を長くする。',
      correct_answer: 'イ',
      explanation_conclusion: '正解は【イ】。DNSSECを導入することでDNS応答のデジタル署名を検証できるようになり、ポイズニングを根本防ぐことができます。',
      explanation_analogy: '偽物の配達員が「あなたが注文したハンバーガーです！」と嘘の荷物を届けてくるのに対して、お店公式の「デジタル未開封シール（デジタル署名）」を貼って送り、本物かどうかを確かめる防犯シールと同じ仕組みです。',
      explanation_trap: '【解法のポイント】ポート番号固定（ウ）やTTL（エ）は小手先の対策であり根本解決になりません。ゾーン転送制限（ア）はサーバ設定の話でポイズニングとは関係ありません。',
      category: 'テクノロジ系',
      sub_category: 'セキュリティ',
      review_level: 2,
      status: '未定着',
      search_key: '令和5年秋期 問36'
    },
    {
      id: 'mock-2',
      question: 'WAF',
      text_question: 'WAF（Web Application Firewall）を導入することで防御できる攻撃はどれか。',
      choice_a: 'サーバ内のOSの脆弱性を突いた不正アクセス',
      choice_b: 'Webアプリケーションの脆弱性を突いたSQLインジェクション',
      choice_c: 'DNSの情報を書き換えるキャッシュポイズニング',
      choice_d: '大量のメールを送信するスパム攻撃',
      correct_answer: 'イ',
      explanation_conclusion: '正解は【イ】。WAFはHTTPプロトコルの内容を解析し、Webアプリケーションの脆弱性を突くSQLインジェクションなどを防御します。',
      explanation_analogy: 'レストランの注文票に「ラーメン ＋ レジからお金を全部盗み出す」という悪い指示を混ぜて書いてくるお客さんに対し、厨房の手前で注文内容をチェックして悪い呪文を排除する「用心深い受付のガードマン」です。',
      explanation_trap: '【解法のポイント】OSの脆弱性（ア）はWAFの防備対象外でファイアウォールやIPS of 領分です。DNSポイズニング（ウ）やスパム（エ）はプロトコルが全く異なり、WAFでは防げません。',
      category: 'テクノロジ系',
      sub_category: 'セキュリティ',
      review_level: 5,
      status: '定着済',
      search_key: '令和4年秋期 問41'
    },
    {
      id: 'mock-3',
      question: 'ルータ',
      text_question: 'OSI基本参照モデルにおいて、ルータが動作し経路選択を行うレイヤはどれか。',
      choice_a: '物理層',
      choice_b: 'データリンク層',
      choice_c: 'ネットワーク層',
      choice_d: 'トランスポート層',
      correct_answer: 'ウ',
      explanation_conclusion: '正解は【ウ】。ルータはネットワーク層（レイヤ3）で動作し、IPアドレスに基づき最適な経路へのルーティングを行います。',
      explanation_analogy: '手紙の住所（IPアドレス）を見て「この手紙は東京行きだからあっちのトラックだな」と、中継地点で次の配送先ルートを決める「郵便局の仕分けシステム（ルーティング）」と同じです。',
      explanation_trap: '【解法のポイント】物理層（ア）は電気信号（光ケーブル等）、データリンク層（イ）はMACアドレス（スイッチ）、トランスポート層（エ）はポート番号（データ転送信頼性）です。',
      category: 'テクノロジ系',
      sub_category: 'ネットワーク',
      review_level: 1,
      status: '未定着',
      search_key: '令和3年春期 問33'
    }
  ];
}
