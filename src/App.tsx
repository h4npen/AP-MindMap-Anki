import React, { useState, useEffect } from 'react';

// ==========================================
// ⚙️ GAS APIの設定（Vercel仲介プロキシ経由）
// ==========================================
const GAS_API_URL = '/api/gas';

// 環境変数からスプレッドシートの直接のURLを取得
const SPREADSHEET_URL = import.meta.env.VITE_SPREADSHEET_URL || 'https://docs.google.com/spreadsheets/d/1X5l8g3UwPg3Q6oNdawS9_e2dcd0fVITE_GAS_URL_NOT_FOUND/edit';

interface QuestionCard {
  id: string;
  question: string;
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
  key_word: string;
  review_level: number;
  status: '未定着' | '定着済';
  search_key?: string; // 🔍 道場検索キー (例: "令和5年秋期 問1")
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'anki' | 'mindmap' | 'sheet'>('dashboard');
  const [cards, setCards] = useState<QuestionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Anki復習モード ('review' = 要復習のみ, 'all' = 全カード)
  const [ankiMode, setAnkiMode] = useState<'review' | 'all'>('review');

  // 選択肢のインタラクティブな判定用状態 ('a' | 'b' | 'c' | 'd' | null)
  const [selectedChoice, setSelectedChoice] = useState<'a' | 'b' | 'c' | 'd' | null>(null);

  // 右側の解説カードがアンロック（3D反転）されているか
  const [isRightCardFlipped, setIsRightCardFlipped] = useState(false);

  // データ一覧用検索キーワード
  const [searchQuery, setSearchQuery] = useState('');

  // マインドマップ用選択ノード
  const [selectedMapNode, setSelectedMapNode] = useState<string | null>(null);

  // ==========================================
  // 📥 1. スプレッドシートからデータを取得する (GET)
  // ==========================================
  const fetchCards = async () => {
    try {
      setLoading(true);
      const response = await fetch(GAS_API_URL);
      const json = await response.json();
      if (json.status === 'success') {
        setCards(json.data);
      } else {
        console.error('GAS Error:', json.message);
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

  // 次のカードへ移る時、各種選択状態をリセット
  useEffect(() => {
    setSelectedChoice(null);
    setIsRightCardFlipped(false);
  }, [currentCardIndex, activeTab, ankiMode]);

  // 対象Ankiカードの抽出 (モード別)
  const activeAnkiCards = ankiMode === 'review'
    ? cards.filter(c => c.status === '未定着')
    : cards;

  // ==========================================
  // 📸 2. 画像アップロード ＆ Base64変換 ➔ GAS送信 (POST)
  // ==========================================
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    setUploading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result as string;
      const rawBase64 = base64Data.split(',')[1];

      try {
        const response = await fetch(GAS_API_URL, {
          method: 'POST',
          body: JSON.stringify({
            action: 'upload',
            image: rawBase64,
            mimeType: file.type || 'image/jpeg'
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
    };
    reader.readAsDataURL(file);
  };

  // ==========================================
  // 🔁 3. Anki学習状況の更新 (POST)
  // ==========================================
  const handleAnkiResponse = async (status: '未定着' | '定着済') => {
    const targetCard = activeAnkiCards[currentCardIndex];

    const updatedCards = [...cards];
    const realIndex = cards.findIndex(c => c.id === targetCard.id);
    if (realIndex !== -1) {
      updatedCards[realIndex].status = status;
      if (status === '定着済') {
        updatedCards[realIndex].review_level = Math.min(5, updatedCards[realIndex].review_level + 1);
      } else {
        updatedCards[realIndex].review_level = Math.max(1, updatedCards[realIndex].review_level - 1);
      }
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
          status: status
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
  };

  // 検索フィルタリングロジック
  const filteredCards = cards.filter(c => 
    c.key_word.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.sub_category.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
  // 🌀 📸 画像アップロード中の全画面くるくるローディング
  // ==========================================
  if (uploading) {
    return (
      <div id="root" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100svh', backgroundColor: 'var(--bg-color)' }}>
        <div style={{ textAlign: 'center', padding: '30px', maxWidth: '480px' }}>
          
          <div className="glass-panel" style={{ 
            display: 'inline-block', 
            padding: '24px', 
            backgroundColor: 'var(--accent-yellow)', 
            borderWidth: '4px',
            borderColor: 'var(--border-color)',
            boxShadow: '6px 6px 0 var(--border-color)',
            marginBottom: '20px'
          }}>
            {/* spinクラスのアニメーションで激しくくるくる回る */}
            <div style={{ fontSize: '72px', animation: 'spin 2s linear infinite', display: 'inline-block' }}>🌀</div>
          </div>
          
          <div className="glass-panel" style={{ padding: '20px', backgroundColor: '#fff', borderLeftWidth: '8px', borderLeftColor: 'var(--accent-blue)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-main)', marginBottom: '8px', textTransform: 'uppercase' }}>
              🔮 Gemini Analyzing Past Question...
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 'bold', lineHeight: '1.6' }}>
              Geminiがスプレッドシートの裏で画像を一生懸命解析しています。<br />
              <strong>「過去問の文字起こし」「選択肢の整理」「文系向けの例え話」「ひっかけの罠の解説」</strong>を自動生成してカードに登録するまで、<strong>約15〜30秒ほど</strong>このままお待ちください！
            </p>
          </div>
        </div>
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
              fontSize: '28px', 
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
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold', marginTop: '8px', marginLeft: '4px' }}>
              応用情報 脳内ハッキング学習
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Cardsバッジボタン（クリックで全カード復習へ） */}
            <button 
              className="glass-panel" 
              style={{ 
                padding: '8px 14px', 
                fontSize: '12px', 
                fontFamily: 'var(--font-outfit)', 
                fontWeight: '900', 
                borderColor: 'var(--border-color)', 
                background: 'var(--accent-yellow)',
                boxShadow: '3px 3px 0 var(--border-color)',
                color: 'var(--text-main)',
                cursor: 'pointer',
                transition: 'transform 0.1s, box-shadow 0.1s'
              }}
              onClick={() => {
                setAnkiMode('all');
                setCurrentCardIndex(0);
                setActiveTab('anki');
              }}
              title="すべてのカードで復習を開始"
            >
              📚 {cards.length} Cards
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-content">
        {/* ----------------- ダッシュボード ----------------- */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* 復習ステータス */}
            <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'var(--accent-blue)' }} />
              <h2 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-secondary)', marginBottom: '8px' }}>本日の要復習カード</h2>
              <div style={{ 
                fontSize: '72px', 
                fontWeight: 900, 
                fontFamily: 'var(--font-outfit)', 
                color: 'var(--text-main)', 
                textShadow: '4px 4px 0 var(--accent-yellow)',
                margin: '10px 0' 
              }}>
                {cards.filter(c => c.status === '未定着').length}
              </div>
              <button
                className="neon-btn"
                style={{ width: '100%', justifyContent: 'center', fontSize: '16px' }}
                disabled={cards.filter(c => c.status === '未定着').length === 0}
                onClick={() => {
                  setAnkiMode('review');
                  setCurrentCardIndex(0);
                  setActiveTab('anki');
                }}
              >
                ⚡ 復習トレーニングを開始
              </button>
            </div>

            {/* クイック画像アップロード */}
            <div className="glass-panel" style={{ 
              padding: '30px 20px', 
              borderStyle: 'dashed', 
              borderWidth: '3px', 
              borderColor: 'var(--border-color)', 
              textAlign: 'center', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '15px' 
            }}>
              <div style={{ fontSize: '48px' }}>📸</div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '6px' }}>間違えた問題のスクショを登録</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Geminiが文字起こしと極上解説を自動生成します</p>
              </div>

              <label className="neon-btn neon-btn-mint" style={{ cursor: 'pointer', width: '100%', maxWidth: '240px' }}>
                {uploading ? '⏳ Gemini 解析中...' : 'ファイルを選択'}
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploading} />
              </label>
            </div>

            {/* カテゴリ別の定着進捗 */}
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '900', color: 'var(--text-main)' }}>カテゴリ別定着率</h3>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px', fontWeight: 'bold' }}>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px', fontWeight: 'bold' }}>
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

        {/* ----------------- Ankiカード (左右見開きデュアルレイアウト) ----------------- */}
        {activeTab === 'anki' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            
            {/* モード切替インジケータ */}
            <div className="glass-panel" style={{ 
              display: 'flex', 
              width: '100%', 
              maxWidth: '1100px', 
              padding: '10px 15px', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              backgroundColor: ankiMode === 'all' ? 'var(--accent-yellow)' : '#fff',
              borderWidth: '3px',
              borderColor: 'var(--border-color)',
              fontWeight: '900',
              fontSize: '13px'
            }}>
              <span>
                {ankiMode === 'all' ? '✨ 全カードモード中' : '⚠️ 要復習のみモード中'}
              </span>
              <button 
                className="neon-btn" 
                style={{ 
                  padding: '4px 10px', 
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
                <h3 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '8px' }}>要復習の過去問はありません！</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', fontWeight: 'bold' }}>
                  新しいスクショを登録するか、全カードモードで復習しましょう！
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
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                  カード {currentCardIndex + 1} / {activeAnkiCards.length}
                </div>

                {/* 左右見開きレイアウトコンテナ */}
                <div className="anki-dual-layout">

                  {/* 1. 左側カード（常に問題 ＆ インタラクティブ解答選択肢） */}
                  <div className="card-container">
                    <div className="card-face card-front">
                      <div>
                        {/* 道場検索キー & サブカテゴリの配置 */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
                          <span style={{ 
                            fontSize: '11px', 
                            color: 'var(--text-main)', 
                            border: '2px solid var(--border-color)', 
                            padding: '3px 8px', 
                            background: 'var(--accent-yellow)',
                            fontWeight: '900',
                            fontFamily: 'var(--font-outfit)' 
                          }}>
                            {activeAnkiCards[currentCardIndex].sub_category}
                          </span>
                          {activeAnkiCards[currentCardIndex].search_key && (
                            <span style={{ 
                              fontSize: '11px', 
                              color: '#fff', 
                              border: '2px solid var(--border-color)', 
                              padding: '3px 8px', 
                              background: 'var(--accent-blue)',
                              fontWeight: '900',
                              fontFamily: 'var(--font-outfit)' 
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
                                  fontSize: '11px', 
                                  color: 'var(--text-main)', 
                                  border: '2px solid var(--border-color)', 
                                  padding: '3px 8px', 
                                  background: 'var(--accent-mint)',
                                  fontWeight: '900',
                                  textDecoration: 'none',
                                  boxShadow: '2px 2px 0 var(--border-color)',
                                  transition: 'transform 0.1s',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translate(-1px, -1px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                              >
                                🌐 過去問道場 ↗
                              </a>
                            ) : null;
                          })()}
                        </div>
                        <p style={{ fontSize: '16px', lineHeight: '1.6', textAlign: 'left', fontWeight: '700', color: 'var(--text-main)' }}>
                          {activeAnkiCards[currentCardIndex].question}
                        </p>
                      </div>

                      {/* インタラクティブ解答選択肢（タップで即正誤判定） */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginTop: '20px', marginBottom: '20px' }}>
                        {['a', 'b', 'c', 'd'].map((ch) => {
                          const choice = ch as 'a' | 'b' | 'c' | 'd';
                          const choiceChar = getChoiceChar(choice);
                          const isCorrectChoice = choiceChar === activeAnkiCards[currentCardIndex].correct_answer;
                          
                          // クラスの判定
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
                            >
                              <span>
                                {choiceChar}. {
                                  choice === 'a' ? activeAnkiCards[currentCardIndex].choice_a :
                                  choice === 'b' ? activeAnkiCards[currentCardIndex].choice_b :
                                  choice === 'c' ? activeAnkiCards[currentCardIndex].choice_c :
                                  activeAnkiCards[currentCardIndex].choice_d
                                }
                              </span>

                              {/* 正解/不正解インジケータバッジ */}
                              {selectedChoice !== null && (isCorrectChoice || selectedChoice === choice) && (
                                <span className="choice-badge">
                                  {isCorrectChoice ? '◯ 正解' : '✕ 不正解'}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold', textAlign: 'center', marginTop: 'auto' }}>
                        {selectedChoice === null ? '👉 選択肢を選んで解答してください（◯/✕判定が出ます）' : '✅ 解答完了！右側の解説を確認しましょう！'}
                      </div>
                    </div>
                  </div>

                  {/* 2. 右側カード（解説：回答すると3Dフリップでアンロック ＆ 全セクション一括表示） */}
                  <div className="card-container">
                    <div className={`anki-card ${isRightCardFlipped ? 'is-flipped' : ''}`}>

                      {/* 右カード表面（回答前のロック状態） */}
                      <div className="card-face card-front" style={{ justifyContent: 'center', alignItems: 'center', background: 'var(--bg-color)', gap: '15px' }} onClick={() => setIsRightCardFlipped(true)}>
                        <div style={{ fontSize: '56px' }}>🔒</div>
                        <strong style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-main)' }}>
                          ANSWER & EXPLANATION
                        </strong>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold', textAlign: 'center', maxWidth: '300px' }}>
                          左側の問題で解答を選択するか、下のボタンを押すと解説がアンロック（反転）します！
                        </p>
                        <button 
                          className="neon-btn neon-btn-mint" 
                          style={{ padding: '8px 16px', fontSize: '13px' }}
                          onClick={(e) => { e.stopPropagation(); setIsRightCardFlipped(true); }}
                        >
                          🔓 解説をみる
                        </button>
                      </div>

                      {/* 右カード裏面（解説：①正解・②例え話・③罠の一括表示） */}
                      <div className="card-face card-back" style={{ padding: '24px', overflowY: 'auto' }}>
                        <div style={{ textAlign: 'left', marginBottom: '15px' }}>
                          <h4 style={{ fontSize: '16px', color: 'var(--primary-color)', fontWeight: '900', margin: '0 0 12px 0' }}>
                            正解: 【 {activeAnkiCards[currentCardIndex].correct_answer} 】
                          </h4>
                          {activeAnkiCards[currentCardIndex].search_key && (
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              🔍 道場検索キー: {activeAnkiCards[currentCardIndex].search_key}
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
                                      border: '1.5px solid var(--border-color)', 
                                      padding: '1px 6px', 
                                      background: 'var(--accent-mint)',
                                      fontWeight: '900',
                                      textDecoration: 'none',
                                      boxShadow: '1.5px 1.5px 0 var(--border-color)',
                                      marginLeft: '6px'
                                    }}
                                  >
                                    過去問道場で開く ↗
                                  </a>
                                ) : null;
                              })()}
                            </p>
                          )}
                          <div style={{ borderBottom: '3px solid var(--border-color)', marginBottom: '15px' }} />
                        </div>

                        {/* 常時一括表示される3つのセクション */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
                              
                          {/* 1. 結論 */}
                          <div className="glass-panel" style={{ padding: '12px 16px', borderLeftWidth: '8px', borderLeftColor: 'var(--accent-blue)' }}>
                            <strong style={{ fontSize: '13px', color: 'var(--accent-blue)', display: 'block', marginBottom: '6px' }}>
                              ① 結論 ＆ 重要キーワード 🔍
                            </strong>
                            <p style={{ fontSize: '12.5px', lineHeight: '1.6', color: 'var(--text-main)', fontWeight: '700', whiteSpace: 'pre-wrap', margin: 0 }}>
                              {activeAnkiCards[currentCardIndex].explanation_conclusion}
                            </p>
                          </div>

                          {/* 2. 身近な例え話 */}
                          <div className="glass-panel" style={{ padding: '12px 16px', borderLeftWidth: '8px', borderLeftColor: 'var(--accent-yellow)' }}>
                            <strong style={{ fontSize: '13px', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                              ② 身近な日常生活の例え話 💡
                            </strong>
                            <p style={{ fontSize: '12.5px', lineHeight: '1.6', color: 'var(--text-main)', fontWeight: '700', whiteSpace: 'pre-wrap', margin: 0 }}>
                              {activeAnkiCards[currentCardIndex].explanation_analogy}
                            </p>
                          </div>

                          {/* 3. 罠の指摘 */}
                          <div className="glass-panel" style={{ padding: '12px 16px', borderLeftWidth: '8px', borderLeftColor: 'var(--primary-color)' }}>
                            <strong style={{ fontSize: '13px', color: 'var(--primary-color)', display: 'block', marginBottom: '6px' }}>
                              ③ 引っかけの罠 ＆ 回避ポイント ⚠️
                            </strong>
                            <p style={{ fontSize: '12.5px', lineHeight: '1.6', color: 'var(--text-main)', fontWeight: '700', whiteSpace: 'pre-wrap', margin: 0 }}>
                              {activeAnkiCards[currentCardIndex].explanation_trap}
                            </p>
                          </div>

                        </div>

                        {/* 大カード裏返しの復帰用（クリックでロック表面に戻す） */}
                        <div style={{ textAlign: 'center', marginTop: '20px' }}>
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

                {/* 学習判定・進捗用コントロールボタン */}
                <div style={{ display: 'flex', gap: '15px', width: '100%', maxWidth: '1100px', marginTop: '10px' }}>
                  <button
                    className="neon-btn"
                    style={{ flex: 1, background: 'var(--primary-color)', color: '#fff', justifyContent: 'center' }}
                    onClick={() => handleAnkiResponse('未定着')}
                  >
                    ❌ 覚えてない・間違えた
                  </button>
                  <button
                    className="neon-btn neon-btn-mint"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => handleAnkiResponse('定着済')}
                  >
                    ✅ 覚えた！
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ----------------- 脳内マインドマップ ----------------- */}
        {activeTab === 'mindmap' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', height: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <div className="glass-panel" style={{ display: 'inline-block', padding: '6px 16px', marginBottom: '8px', backgroundColor: 'var(--accent-yellow)' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>脳内弱点マインドマップ</h2>
              </div>
              <div className="glass-panel" style={{ padding: '6px 12px', display: 'inline-block', backgroundColor: '#fff' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold', margin: 0 }}>
                  赤い用語が未暗記の弱点箇所です（タップで過去問表示）
                </p>
              </div>
            </div>

            {/* マインドマップSVG領域 */}
            <div className="glass-panel" style={{ width: '100%', height: '360px', position: 'relative', overflow: 'hidden', background: '#fff' }}>
              {mapNodes.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', gap: '10px' }}>
                  <div style={{ fontSize: '48px' }}>🎉</div>
                  <strong style={{ fontSize: '16px', fontWeight: '900' }}>脳内弱点（未定着用語）はありません！</strong>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>素晴らしい！すべての知識が定着しています。</p>
                </div>
              ) : (
                <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                  {/* 動的に結ばれる接続ライン */}
                  {mapNodes.map((node) => (
                    <line 
                      key={`line-${node.id}`} 
                      x1="50%" 
                      y1="50%" 
                      x2={node.lineX2} 
                      y2={node.lineY2} 
                      stroke="var(--border-color)" 
                      strokeWidth="2.5" 
                    />
                  ))}

                  {/* 中心ノード */}
                  <circle cx="50%" cy="50%" r="22" fill="var(--accent-yellow)" stroke="var(--border-color)" strokeWidth="3.5" />
                  <text x="50%" y="53%" fill="var(--text-main)" fontSize="11" fontWeight="900" textAnchor="middle" pointerEvents="none">AP脳内</text>

                  {/* 動的に自動配置される赤い弱点ノード */}
                  {mapNodes.map((node) => (
                    <g key={node.id} onClick={() => setSelectedMapNode(node.key_word)} style={{ cursor: 'pointer' }}>
                      <circle 
                        cx={node.cx} 
                        cy={node.cy} 
                        r="14" 
                        fill="#fff" 
                        stroke="var(--primary-color)" 
                        strokeWidth="3.5" 
                        className="node-glow" 
                      />
                      <text 
                        x={node.cx} 
                        y={parseFloat(node.cy) + 7 + '%'} 
                        fill="var(--text-main)" 
                        fontSize="10" 
                        fontWeight="900" 
                        textAnchor="middle" 
                        pointerEvents="none"
                      >
                        {node.key_word.length > 8 ? `${node.key_word.substring(0, 7)}…` : node.key_word}
                      </text>
                    </g>
                  ))}
                </svg>
              )}
            </div>

            {/* ノードが選択された際のポップアップ */}
            {selectedMapNode && (
              <div className="glass-panel" style={{ padding: '15px', position: 'relative', borderLeftWidth: '6px', borderLeftColor: 'var(--accent-blue)' }}>
                <button
                  style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}
                  onClick={() => setSelectedMapNode(null)}
                >
                  ✕
                </button>
                <h4 style={{ fontSize: '16px', fontWeight: '900', color: 'var(--text-main)', marginBottom: '8px' }}>{selectedMapNode}</h4>

                {cards.some(c => c.key_word === selectedMapNode || c.sub_category === selectedMapNode) ? (
                  <div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: 'bold' }}>
                      紐づく過去問が {cards.filter(c => c.key_word === selectedMapNode || c.sub_category === selectedMapNode).length} 件あります。
                    </p>
                    <button
                      className="neon-btn neon-btn-mint"
                      style={{ padding: '8px 16px', fontSize: '12px' }}
                      onClick={() => {
                        const index = activeAnkiCards.findIndex(c => c.key_word === selectedMapNode || c.sub_category === selectedMapNode);
                        if (index !== -1) {
                          setCurrentCardIndex(index);
                          setActiveTab('anki');
                        } else {
                          // 定着済でも全カードモードに切り替えて遷移
                          setAnkiMode('all');
                          const allIndex = cards.findIndex(c => c.key_word === selectedMapNode || c.sub_category === selectedMapNode);
                          setCurrentCardIndex(allIndex !== -1 ? allIndex : 0);
                          setActiveTab('anki');
                        }
                      }}
                    >
                      🚀 この過去問へジャンプ
                    </button>
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 'bold' }}>このカテゴリにはまだ問題が登録されていません。</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ----------------- 全データ（スプレッドシートデータ） ----------------- */}
        {activeTab === 'sheet' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div className="glass-panel" style={{ display: 'inline-block', padding: '6px 16px', marginBottom: '8px', backgroundColor: 'var(--accent-blue)' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#fff', margin: 0 }}>データベース＆スプレッドシート</h2>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>スプレッドシートの登録問題データを検索・一覧表示できます</p>
            </div>

            {/* 巨大スプレッドシートボタン */}
            <a 
              href={SPREADSHEET_URL} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="neon-btn neon-btn-mint"
              style={{ 
                width: '100%', 
                padding: '16px 20px', 
                fontSize: '15px', 
                justifyContent: 'center', 
                textDecoration: 'none', 
                boxShadow: '6px 6px 0 var(--border-color)',
                textAlign: 'center'
              }}
            >
              📊 Google スプレッドシートを開く ↗
            </a>

            {/* 検索バー */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="🔍 用語、カテゴリ、道場検索キーで検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '12px 16px',
                  fontSize: '14px',
                  border: '3px solid var(--border-color)',
                  boxShadow: '4px 4px 0 var(--border-color)',
                  outline: 'none',
                  fontWeight: 'bold',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* データテーブル */}
            <div className="glass-panel" style={{ overflowX: 'auto', padding: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '3px solid var(--border-color)' }}>
                    <th style={{ padding: '10px 8px', fontWeight: '900' }}>用語</th>
                    <th style={{ padding: '10px 8px', fontWeight: '900' }}>カテゴリ</th>
                    <th style={{ padding: '10px 8px', fontWeight: '900' }}>検索キー</th>
                    <th style={{ padding: '10px 8px', fontWeight: '900' }}>状態</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCards.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '20px 8px', textAlign: 'center', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                        該当するデータが見つかりません
                      </td>
                    </tr>
                  ) : (
                    filteredCards.map((c) => (
                      <tr 
                        key={c.id} 
                        style={{ borderBottom: '2px solid #e2dcd0', cursor: 'pointer' }}
                        onClick={() => {
                          // 対象カードでAnkiにジャンプ
                          setAnkiMode('all');
                          const index = cards.findIndex(card => card.id === c.id);
                          setCurrentCardIndex(index !== -1 ? index : 0);
                          setActiveTab('anki');
                        }}
                      >
                        <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{c.key_word}</td>
                        <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{c.sub_category}</td>
                        <td style={{ padding: '12px 8px', fontFamily: 'var(--font-outfit)', fontWeight: 'bold' }} onClick={(e) => {
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
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{ 
                            padding: '2px 6px', 
                            fontSize: '10px', 
                            fontWeight: 'bold', 
                            border: '1.5px solid var(--border-color)', 
                            background: c.status === '定着済' ? 'var(--accent-mint)' : 'var(--primary-color)',
                            color: c.status === '定着済' ? 'var(--text-main)' : '#fff'
                          }}>
                            {c.status}
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
        <a href="#mindmap" className={`nav-item ${activeTab === 'mindmap' ? 'active' : ''}`} onClick={() => setActiveTab('mindmap')}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
          </svg>
          弱点マップ
        </a>
        {/* 4つ目のデータタブ */}
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
      question: 'DNSキャッシュポイズニング攻撃に対する根本的な対策はどれか。',
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
      key_word: 'DNSキャッシュポイズニング',
      review_level: 2,
      status: '未定着',
      search_key: '令和5年秋期 問36'
    },
    {
      id: 'mock-2',
      question: 'WAF（Web Application Firewall）を導入することで防御できる攻撃はどれか。',
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
      key_word: 'WAF',
      review_level: 5,
      status: '定着済',
      search_key: '令和4年秋期 問41'
    },
    {
      id: 'mock-3',
      question: 'OSI基本参照モデルにおいて、ルータが動作し経路選択を行うレイヤはどれか。',
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
      key_word: 'ルータ',
      review_level: 1,
      status: '未定着',
      search_key: '令和3年春期 問33'
    }
  ];
}
