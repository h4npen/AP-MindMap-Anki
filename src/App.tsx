import React, { useState, useMemo, useEffect } from 'react';
import { loadNotes, type Note } from './notesData';
import { extractVocabFromNotes } from './vocabData';
import { MarkdownViewer } from './components/MarkdownViewer';
import './App.css';

export type MasteryLevel = 'none' | 'red' | 'yellow' | 'green';

export const MASTERY_CONFIG: Record<
  MasteryLevel,
  { label: string; shortLabel: string; desc: string; className: string }
> = {
  none: {
    label: '⚪ 未着手',
    shortLabel: '⚪ 未着手',
    desc: 'まだ確認していない項目',
    className: 'level-none',
  },
  red: {
    label: '🔴 要復習',
    shortLabel: '🔴 要復習',
    desc: '間違えた・思い出せなかった',
    className: 'level-red',
  },
  yellow: {
    label: '🟡 あやふや（読了）',
    shortLabel: '🟡 あやふや',
    desc: '解説を読んで理解したが、即答はまだ不安',
    className: 'level-yellow',
  },
  green: {
    label: '🟢 瞬殺できる',
    shortLabel: '🟢 瞬殺',
    desc: 'たとえ話も他選択肢の×理由も3秒で言える',
    className: 'level-green',
  },
};

/**
 * ノート本文から「問題パート」「正解記号」「解説パート」を分離するヘルパー
 */
function splitNoteForQuiz(rawContent: string): {
  questionMarkdown: string;
  correctChoice: string | null;
  answerSummaryMarkdown: string;
  explanationMarkdown: string;
  hintAnalogy: string | null;
} {
  const correctMatch = rawContent.match(/\*\*正解:\s*([アイウエ])/);
  const correctChoice = correctMatch ? correctMatch[1] : null;

  const analogyMatch = rawContent.match(/##\s*1\.\s*([^\n\r]+)/);
  const hintAnalogy = analogyMatch ? analogyMatch[1].trim() : null;

  const detailsRegex = /<details>([\s\S]*?)<\/details>/;
  const detailsMatch = rawContent.match(detailsRegex);

  if (detailsMatch && detailsMatch.index !== undefined) {
    const beforeDetails = rawContent.slice(0, detailsMatch.index).trim();
    const answerInside = detailsMatch[1]
      .replace(/<summary>[\s\S]*?<\/summary>/, '')
      .trim();
    const afterDetails = rawContent
      .slice(detailsMatch.index + detailsMatch[0].length)
      .replace(/^\s*---\s*/, '')
      .trim();

    const maskedQuestion = beforeDetails.replace(
      /^#\s+([^：\n\r]+)[：:][^\n\r]+/m,
      '# $1 【🧠 クイズ出題中】'
    );

    return {
      questionMarkdown: maskedQuestion,
      correctChoice,
      answerSummaryMarkdown: answerInside,
      explanationMarkdown: afterDetails,
      hintAnalogy,
    };
  }

  return {
    questionMarkdown: rawContent,
    correctChoice: null,
    answerSummaryMarkdown: '',
    explanationMarkdown: '',
    hintAnalogy: null,
  };
}

export function App() {
  const allNotes = useMemo(() => loadNotes(), []);
  const allVocab = useMemo(() => extractVocabFromNotes(allNotes), [allNotes]);

  // メインモード切り替え（解説ノート一覧 vs 暗記単語帳）
  const [appMode, setAppMode] = useState<'notes' | 'vocab'>('notes');

  // ノート一覧用 State
  const [activeFolder, setActiveFolder] = useState<'all' | 'inbox' | 'ap-prep'>('inbox');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMasteryFilter, setSelectedMasteryFilter] = useState<
    'all' | MasteryLevel | 'needs-review'
  >('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  // 単語帳用 State
  const [vocabViewStyle, setVocabViewStyle] = useState<'sheet' | 'flashcard'>('sheet');
  const [vocabTypeFilter, setVocabTypeFilter] = useState<'all' | 'main' | 'sub'>('all');
  const [isRedSheetOn, setIsRedSheetOn] = useState<boolean>(true);
  const [revealedVocabIds, setRevealedVocabIds] = useState<Set<string>>(new Set());
  const [flashcardIndex, setFlashcardIndex] = useState<number>(0);
  const [isFlashcardFlipped, setIsFlashcardFlipped] = useState<boolean>(false);

  // 1. クイズモード（解説ブラインド＆ランダム出題）State
  const [isBlindMode, setIsBlindMode] = useState<boolean>(true);
  const [isExplanationRevealed, setIsExplanationRevealed] = useState<boolean>(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showAnalogyHint, setShowAnalogyHint] = useState<boolean>(false);
  const [recallChecklist, setRecallChecklist] = useState<{
    analogy: boolean;
    whyWrong: boolean;
  }>({ analogy: false, whyWrong: false });

  // ランダムテストキュー
  const [quizQueueIds, setQuizQueueIds] = useState<string[] | null>(null);
  const [quizIndex, setQuizIndex] = useState<number>(0);

  // 2. 3段階の定着度管理（ノート用）
  const [masteryMap, setMasteryMap] = useState<Record<string, MasteryLevel>>(() => {
    try {
      const savedMap = localStorage.getItem('ap_note_mastery_map');
      if (savedMap) {
        return JSON.parse(savedMap);
      }
      const legacySaved = localStorage.getItem('ap_completed_notes');
      if (legacySaved) {
        const ids: string[] = JSON.parse(legacySaved);
        const migrated: Record<string, MasteryLevel> = {};
        ids.forEach((id) => {
          migrated[id] = 'yellow';
        });
        localStorage.setItem('ap_note_mastery_map', JSON.stringify(migrated));
        return migrated;
      }
      return {};
    } catch {
      return {};
    }
  });

  // 単語帳用の定着度管理
  const [vocabMasteryMap, setVocabMasteryMap] = useState<Record<string, MasteryLevel>>(() => {
    try {
      const saved = localStorage.getItem('ap_vocab_mastery_map');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const getMastery = (id: string): MasteryLevel => masteryMap[id] || 'none';
  const getVocabMastery = (id: string): MasteryLevel => vocabMasteryMap[id] || 'none';

  const setNoteMastery = (id: string, level: MasteryLevel, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setMasteryMap((prev) => {
      const next = { ...prev };
      if (level === 'none') {
        delete next[id];
      } else {
        next[id] = level;
      }
      localStorage.setItem('ap_note_mastery_map', JSON.stringify(next));
      return next;
    });
  };

  const setVocabMastery = (id: string, level: MasteryLevel, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setVocabMasteryMap((prev) => {
      const next = { ...prev };
      if (level === 'none') {
        delete next[id];
      } else {
        next[id] = level;
      }
      localStorage.setItem('ap_vocab_mastery_map', JSON.stringify(next));
      return next;
    });
  };

  const cycleMastery = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const current = getMastery(id);
    const order: MasteryLevel[] = ['none', 'yellow', 'green', 'red'];
    const nextLevel = order[(order.indexOf(current) + 1) % order.length];
    setNoteMastery(id, nextLevel);
  };

  // 統計カウント
  const stats = useMemo(() => {
    let red = 0;
    let yellow = 0;
    let green = 0;
    allNotes.forEach((n) => {
      const m = masteryMap[n.id] || 'none';
      if (m === 'red') red++;
      else if (m === 'yellow') yellow++;
      else if (m === 'green') green++;
    });
    const touched = red + yellow + green;
    const touchedPercent =
      allNotes.length > 0 ? Math.round((touched / allNotes.length) * 100) : 0;
    const greenPercent =
      allNotes.length > 0 ? Math.round((green / allNotes.length) * 100) : 0;
    return { red, yellow, green, touched, touchedPercent, greenPercent };
  }, [allNotes, masteryMap]);

  // Distinct categories
  const categories = useMemo(() => {
    const map = new Map<string, string>();
    allNotes.forEach((n) => {
      map.set(n.categoryNumber, `${n.categoryNumber}. ${n.categoryName}`);
    });
    return Array.from(map.entries())
      .map(([num, label]) => ({ num, label }))
      .sort((a, b) => a.num.localeCompare(b.num));
  }, [allNotes]);

  // Filter notes
  const filteredNotes = useMemo(() => {
    return allNotes.filter((note) => {
      if (activeFolder !== 'all' && note.folder !== activeFolder) return false;
      if (selectedCategory !== 'all' && note.categoryNumber !== selectedCategory) return false;

      const m = masteryMap[note.id] || 'none';
      if (selectedMasteryFilter === 'needs-review') {
        if (m !== 'red' && m !== 'yellow') return false;
      } else if (selectedMasteryFilter !== 'all' && m !== selectedMasteryFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = note.title.toLowerCase().includes(query);
        const matchExam = note.targetExam.toLowerCase().includes(query);
        const matchCat = note.categoryName.toLowerCase().includes(query);
        const matchContent = note.content.toLowerCase().includes(query);
        if (!matchTitle && !matchExam && !matchCat && !matchContent) return false;
      }
      return true;
    });
  }, [allNotes, activeFolder, selectedCategory, selectedMasteryFilter, masteryMap, searchQuery]);

  // Filter vocab items
  const filteredVocab = useMemo(() => {
    return allVocab.filter((item) => {
      if (selectedCategory !== 'all' && item.categoryNumber !== selectedCategory) return false;
      if (vocabTypeFilter !== 'all' && item.type !== vocabTypeFilter) return false;

      const m = vocabMasteryMap[item.id] || 'none';
      if (selectedMasteryFilter === 'needs-review') {
        if (m !== 'red' && m !== 'yellow') return false;
      } else if (selectedMasteryFilter !== 'all' && m !== selectedMasteryFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTerm = item.term.toLowerCase().includes(q);
        const matchCatch = item.catchphrase.toLowerCase().includes(q);
        const matchAnalogy = item.analogy.toLowerCase().includes(q);
        const matchCat = item.categoryName.toLowerCase().includes(q);
        if (!matchTerm && !matchCatch && !matchAnalogy && !matchCat) return false;
      }
      return true;
    });
  }, [allVocab, selectedCategory, vocabTypeFilter, selectedMasteryFilter, vocabMasteryMap, searchQuery]);

  // Reset flashcard index when filter changes
  useEffect(() => {
    setFlashcardIndex(0);
    setIsFlashcardFlipped(false);
  }, [selectedCategory, vocabTypeFilter, selectedMasteryFilter, searchQuery]);

  const toggleVocabReveal = (id: string) => {
    setRevealedVocabIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Currently active note object
  const activeNote = useMemo(() => {
    if (!activeNoteId) return null;
    return allNotes.find((n) => n.id === activeNoteId) || null;
  }, [allNotes, activeNoteId]);

  const parsedQuiz = useMemo(() => {
    if (!activeNote) return null;
    return splitNoteForQuiz(activeNote.content);
  }, [activeNote]);

  const isQuizCapableNote = Boolean(parsedQuiz && parsedQuiz.correctChoice);

  const { prevNote, nextNote } = useMemo(() => {
    if (!activeNote) return { prevNote: null, nextNote: null };
    if (quizQueueIds && quizQueueIds.length > 0) {
      const prevId = quizIndex > 0 ? quizQueueIds[quizIndex - 1] : null;
      const nextId = quizIndex < quizQueueIds.length - 1 ? quizQueueIds[quizIndex + 1] : null;
      return {
        prevNote: prevId ? allNotes.find((n) => n.id === prevId) || null : null,
        nextNote: nextId ? allNotes.find((n) => n.id === nextId) || null : null,
      };
    }
    const currentIndex = filteredNotes.findIndex((n) => n.id === activeNote.id);
    if (currentIndex === -1) return { prevNote: null, nextNote: null };
    return {
      prevNote: currentIndex > 0 ? filteredNotes[currentIndex - 1] : null,
      nextNote: currentIndex < filteredNotes.length - 1 ? filteredNotes[currentIndex + 1] : null,
    };
  }, [activeNote, filteredNotes, quizQueueIds, quizIndex, allNotes]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    setIsExplanationRevealed(false);
    setSelectedChoice(null);
    setShowAnalogyHint(false);
    setRecallChecklist({ analogy: false, whyWrong: false });
  }, [activeNoteId]);

  const startRandomQuiz = (mode: 'review-priority' | 'filtered', count = 5) => {
    const candidates = (mode === 'filtered' ? filteredNotes : allNotes).filter(
      (n) => n.categoryNumber !== '00' && /\*\*正解:\s*[アイウエ]/.test(n.content)
    );

    let pool: Note[] = [];
    if (mode === 'review-priority') {
      const reviewOnes = candidates.filter((n) => {
        const m = getMastery(n.id);
        return m === 'red' || m === 'yellow';
      });
      pool = reviewOnes.length >= 3 ? reviewOnes : candidates;
    } else {
      pool = candidates;
    }

    if (pool.length === 0) {
      alert('出題対象のノートがありません。フィルター条件を変更してください。');
      return;
    }

    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
    const ids = shuffled.map((n) => n.id);
    setQuizQueueIds(ids);
    setQuizIndex(0);
    setIsBlindMode(true);
    setActiveNoteId(ids[0]);
  };

  const exitQuizQueue = () => {
    setQuizQueueIds(null);
    setQuizIndex(0);
    setActiveNoteId(null);
  };

  const daysLeft = useMemo(() => {
    const examDate = new Date('2026-11-05T12:00:00+09:00');
    const now = new Date();
    const diff = examDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, []);

  const currentPhaseText = useMemo(() => {
    if (daysLeft >= 16) {
      return '🔥【Phase 1: 10/16〜10/20】基礎の穴埋め（セキュ・NW・DB・システム構成）＋ 石田本20分下読み';
    } else if (daysLeft >= 10) {
      return '🔥【Phase 2: 10/21〜10/26】得点源の「マネジメント・ストラテジ・開発」で合格ラインへの貯金を作る！';
    } else if (daysLeft >= 3) {
      return '🔥【Phase 3: 10/27〜11/2】年度別（回別）過去問通し演習 ＆ ミス問即答ループ';
    } else {
      return '🎓【Phase 4: 11/3〜11/5】直前総仕上げ！ミス問・暗記系をテスト形式で総ざらい！';
    }
  }, [daysLeft]);

  const scheduleNote = useMemo(() => {
    return allNotes.find((n) => n.filename === 'ap-exam-schedule-roadmap.md') || null;
  }, [allNotes]);

  const guideNote = useMemo(() => {
    return allNotes.find((n) => n.filename === 'textbook-study-guide.md') || null;
  }, [allNotes]);

  const currentFlashcard =
    filteredVocab.length > 0
      ? filteredVocab[Math.min(flashcardIndex, filteredVocab.length - 1)]
      : null;

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="app-header">
        <div className="header-inner">
          <div
            className="logo-area"
            onClick={() => {
              exitQuizQueue();
              setAppMode('notes');
            }}
            title="トップへ戻る"
          >
            <span className="logo-icon">🧠</span>
            <div className="logo-text">
              <h1 className="logo-title">AP 直感攻略ノート</h1>
              <span className="logo-subtitle">アクティブリコール（能動的想起）定着ビューア</span>
            </div>
          </div>

          <div className="header-stats">
            <button
              className={`vocab-mode-header-btn ${appMode === 'vocab' && !activeNoteId ? 'active' : ''}`}
              onClick={() => {
                exitQuizQueue();
                setAppMode((prev) => (prev === 'vocab' ? 'notes' : 'vocab'));
              }}
              title="全問題から抽出した必須単語帳（フラッシュカード＆赤シート一覧）を開く"
            >
              🗂️ 必須単語帳 ({allVocab.length}語)
            </button>
            {guideNote && (
              <button
                className="guide-header-btn"
                onClick={() => {
                  setQuizQueueIds(null);
                  setActiveNoteId(guideNote.id);
                }}
                title="手持ちテキスト（合格教本・石田本）の重点学習ガイドを見る"
              >
                📖 テキスト重点箇所
              </button>
            )}
            {scheduleNote && (
              <button
                className="schedule-header-btn"
                onClick={() => {
                  setQuizQueueIds(null);
                  setActiveNoteId(scheduleNote.id);
                }}
                title="週別合格スケジュールを確認する"
              >
                🎯 科目Aまであと <strong>{daysLeft}日</strong>
              </button>
            )}
            <span className="stat-pill level-red-pill" title="要復習">
              🔴 {stats.red}
            </span>
            <span className="stat-pill level-yellow-pill" title="あやふや（読了）">
              🟡 {stats.yellow}
            </span>
            <span className="stat-pill success" title="瞬殺できる（完全定着）">
              🟢 瞬殺 {stats.green}/{allNotes.length} ({stats.greenPercent}%)
            </span>
          </div>
        </div>
        {/* Multi-segment Progress Bar under header */}
        <div className="header-progress-track">
          <div
            className="header-progress-fill green"
            style={{ width: `${(stats.green / Math.max(1, allNotes.length)) * 100}%` }}
          />
          <div
            className="header-progress-fill yellow"
            style={{ width: `${(stats.yellow / Math.max(1, allNotes.length)) * 100}%` }}
          />
          <div
            className="header-progress-fill red"
            style={{ width: `${(stats.red / Math.max(1, allNotes.length)) * 100}%` }}
          />
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="main-layout">
        {activeNote ? (
          /* ================= DETAIL VIEW ================= */
          <div className="note-detail-view">
            {quizQueueIds && (
              <div className="quiz-session-banner">
                <div className="quiz-session-info">
                  <span className="quiz-badge">🎲 抜き打ちテスト中</span>
                  <strong>
                    第 {quizIndex + 1} 問 / 全 {quizQueueIds.length} 問
                  </strong>
                </div>
                <button className="quiz-exit-btn" onClick={exitQuizQueue}>
                  ✕ テスト終了
                </button>
              </div>
            )}

            <div className="detail-top-nav">
              <button className="back-btn" onClick={exitQuizQueue}>
                ← {appMode === 'vocab' ? '単語帳に戻る' : '一覧に戻る'}
              </button>

              <div className="detail-nav-actions">
                {isQuizCapableNote && (
                  <button
                    className={`blind-mode-toggle-btn ${isBlindMode ? 'active' : ''}`}
                    onClick={() => setIsBlindMode((prev) => !prev)}
                    title="解説を隠して問題から解く白紙テストモードのON/OFF"
                  >
                    {isBlindMode ? '🙈 解説ブラインド: ON' : '👁️ 通常表示'}
                  </button>
                )}

                <div className="mastery-selector-group">
                  {(['red', 'yellow', 'green'] as MasteryLevel[]).map((lvl) => {
                    const active = getMastery(activeNote.id) === lvl;
                    return (
                      <button
                        key={lvl}
                        className={`mastery-select-btn ${MASTERY_CONFIG[lvl].className} ${active ? 'is-selected' : ''}`}
                        onClick={() =>
                          setNoteMastery(activeNote.id, active ? 'none' : lvl)
                        }
                        title={MASTERY_CONFIG[lvl].desc}
                      >
                        {MASTERY_CONFIG[lvl].shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="note-meta-banner">
              <div className="note-meta-tags">
                <span className="category-badge">
                  {activeNote.categoryNumber}. {activeNote.categoryName}
                </span>
                {activeNote.targetExam && (
                  <span className="exam-badge">{activeNote.targetExam}</span>
                )}
                <span className="time-badge">⏱️ {activeNote.readingTime}</span>
                <span className={`folder-badge ${activeNote.folder}`}>
                  {activeNote.folder === 'inbox' ? '📬 inbox' : '📚 ap-prep'}
                </span>
              </div>
            </div>

            {isQuizCapableNote && isBlindMode && parsedQuiz ? (
              <div className="quiz-blind-container">
                <article className="note-article question-only-article">
                  <MarkdownViewer content={parsedQuiz.questionMarkdown} />

                  <div className="active-recall-box">
                    <div className="recall-step-title">
                      🧠 Step 1: 解説を見る前に、頭の中で思い出してチェック！
                    </div>
                    <div className="recall-checks">
                      <label className="recall-check-item">
                        <input
                          type="checkbox"
                          checked={recallChecklist.analogy}
                          onChange={(e) =>
                            setRecallChecklist((p) => ({ ...p, analogy: e.target.checked }))
                          }
                        />
                        <span>「どんな日常のたとえ話」だったか思い出した</span>
                      </label>
                      <label className="recall-check-item">
                        <input
                          type="checkbox"
                          checked={recallChecklist.whyWrong}
                          onChange={(e) =>
                            setRecallChecklist((p) => ({ ...p, whyWrong: e.target.checked }))
                          }
                        />
                        <span>「他の3つの選択肢がなぜ×か」理由を言える</span>
                      </label>
                    </div>

                    {parsedQuiz.hintAnalogy && (
                      <div className="analogy-hint-area">
                        {!showAnalogyHint ? (
                          <button
                            className="hint-btn"
                            onClick={() => setShowAnalogyHint(true)}
                          >
                            💡 どうしても思い出せない時だけ「たとえ話のヒント」を見る
                          </button>
                        ) : (
                          <div className="hint-revealed">
                            🔑 ヒント: <strong>{parsedQuiz.hintAnalogy}</strong>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="recall-step-title" style={{ marginTop: '14px' }}>
                      🎯 Step 2: 選択肢を選んで回答！
                    </div>
                    <div className="choice-buttons-grid">
                      {['ア', 'イ', 'ウ', 'エ'].map((ch) => {
                        const isPicked = selectedChoice === ch;
                        const isCorrect = parsedQuiz.correctChoice === ch;
                        let btnClass = 'quiz-choice-btn';
                        if (selectedChoice) {
                          if (isCorrect) btnClass += ' correct';
                          else if (isPicked) btnClass += ' wrong';
                        }
                        return (
                          <button
                            key={ch}
                            className={btnClass}
                            onClick={() => {
                              setSelectedChoice(ch);
                              setIsExplanationRevealed(true);
                              if (ch !== parsedQuiz.correctChoice) {
                                setNoteMastery(activeNote.id, 'red');
                              }
                            }}
                          >
                            {ch}
                            {selectedChoice && isCorrect && ' ⭕️'}
                            {selectedChoice && isPicked && !isCorrect && ' ❌'}
                          </button>
                        );
                      })}
                    </div>

                    {!isExplanationRevealed && (
                      <button
                        className="reveal-explanation-btn"
                        onClick={() => setIsExplanationRevealed(true)}
                      >
                        📖 選択肢を選ばずに正解・解説を開く
                      </button>
                    )}
                  </div>
                </article>

                {isExplanationRevealed && (
                  <article className="note-article explanation-revealed-article">
                    {selectedChoice && (
                      <div
                        className={`quiz-judgment-banner ${
                          selectedChoice === parsedQuiz.correctChoice ? 'is-correct' : 'is-wrong'
                        }`}
                      >
                        <div className="judgment-title">
                          {selectedChoice === parsedQuiz.correctChoice
                            ? `⭕️ 正解！（あなたの回答: ${selectedChoice}）`
                            : `❌ 不正解...（あなたの回答: ${selectedChoice} ／ 正解: ${parsedQuiz.correctChoice}）`}
                        </div>
                        <div className="judgment-sub">
                          <MarkdownViewer content={parsedQuiz.answerSummaryMarkdown} />
                        </div>
                      </div>
                    )}

                    <MarkdownViewer content={parsedQuiz.explanationMarkdown} />

                    <div className="post-quiz-grading-box">
                      <div className="grading-title">
                        📊 今回の想起テストの手応えを記録しましょう（次の復習優先度に反映されます）
                      </div>
                      <div className="grading-buttons">
                        <button
                          className={`grading-btn level-red ${getMastery(activeNote.id) === 'red' ? 'is-selected' : ''}`}
                          onClick={() => setNoteMastery(activeNote.id, 'red')}
                        >
                          🔴 要復習（間違えた・詰まった）
                        </button>
                        <button
                          className={`grading-btn level-yellow ${getMastery(activeNote.id) === 'yellow' ? 'is-selected' : ''}`}
                          onClick={() => setNoteMastery(activeNote.id, 'yellow')}
                        >
                          🟡 あやふや（ヒント有りで解けた）
                        </button>
                        <button
                          className={`grading-btn level-green ${getMastery(activeNote.id) === 'green' ? 'is-selected' : ''}`}
                          onClick={() => setNoteMastery(activeNote.id, 'green')}
                        >
                          🟢 瞬殺できる（理由まで即答できた！）
                        </button>
                      </div>
                    </div>
                  </article>
                )}
              </div>
            ) : (
              <article className="note-article">
                <MarkdownViewer content={activeNote.content} />
              </article>
            )}

            <div className="bottom-nav">
              {prevNote ? (
                <button
                  className="nav-page-btn prev"
                  onClick={() => {
                    if (quizQueueIds) setQuizIndex((i) => Math.max(0, i - 1));
                    setActiveNoteId(prevNote.id);
                  }}
                >
                  <span className="nav-arrow">← 前のノート</span>
                  <span className="nav-label">{prevNote.title}</span>
                </button>
              ) : (
                <div />
              )}

              {nextNote ? (
                <button
                  className="nav-page-btn next"
                  onClick={() => {
                    if (quizQueueIds) setQuizIndex((i) => i + 1);
                    setActiveNoteId(nextNote.id);
                  }}
                >
                  <span className="nav-arrow">
                    {quizQueueIds
                      ? `次のテスト問題 (${quizIndex + 2}/${quizQueueIds.length}) →`
                      : '次のノート →'}
                  </span>
                  <span className="nav-label">{nextNote.title}</span>
                </button>
              ) : quizQueueIds ? (
                <button className="nav-page-btn next finish-quiz-btn" onClick={exitQuizQueue}>
                  <span className="nav-arrow">🎉 全問テスト完了！</span>
                  <span className="nav-label">一覧画面へ戻る</span>
                </button>
              ) : (
                <div />
              )}
            </div>
          </div>
        ) : (
          /* ================= LIST / VOCAB VIEW ================= */
          <div className="notes-list-view">
            {/* Top Mode Switcher Tabs: 解説ノート一覧 vs 必須単語帳 */}
            <div className="main-mode-switcher">
              <button
                className={`main-mode-tab ${appMode === 'notes' ? 'active' : ''}`}
                onClick={() => setAppMode('notes')}
              >
                📚 解説ノート ＆ 問題演習（{allNotes.length}本）
              </button>
              <button
                className={`main-mode-tab vocab ${appMode === 'vocab' ? 'active' : ''}`}
                onClick={() => setAppMode('vocab')}
              >
                🗂️ 頻出・必須単語帳（主役＋選択肢用語 全{allVocab.length}語）
              </button>
            </div>

            {appMode === 'vocab' ? (
              /* ================= VOCABULARY BOOK VIEW ================= */
              <div className="vocab-book-view">
                {/* Vocab Control Header */}
                <div className="vocab-hero-banner">
                  <div className="vocab-hero-left">
                    <span className="vocab-hero-icon">🗂️</span>
                    <div>
                      <div className="vocab-hero-title">
                        過去問から抽出した「覚えるべき重要単語帳」（全 {filteredVocab.length} 語）
                      </div>
                      <div className="vocab-hero-sub">
                        ノートの主役用語だけでなく、<strong>「選択肢で登場したひっかけ関連用語」</strong>も網羅！用語を見て3秒で「一言定義」と「たとえ話」を言えるかチェックしましょう。
                      </div>
                    </div>
                  </div>
                  <div className="vocab-style-switcher">
                    <button
                      className={`vocab-style-btn ${vocabViewStyle === 'sheet' ? 'active' : ''}`}
                      onClick={() => setVocabViewStyle('sheet')}
                    >
                      📕 赤シート一覧表
                    </button>
                    <button
                      className={`vocab-style-btn ${vocabViewStyle === 'flashcard' ? 'active' : ''}`}
                      onClick={() => {
                        setVocabViewStyle('flashcard');
                        setIsFlashcardFlipped(false);
                      }}
                    >
                      🃏 1語1答カードめくり
                    </button>
                  </div>
                </div>

                {/* Common Search & Category Filters */}
                <div className="control-panel">
                  <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      placeholder="単語名、たとえ話、意味を検索..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input"
                    />
                    {searchQuery && (
                      <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Vocab Type & Red Sheet Controls */}
                  <div className="vocab-sub-controls">
                    <div className="vocab-type-pills">
                      <button
                        className={`mastery-filter-pill ${vocabTypeFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setVocabTypeFilter('all')}
                      >
                        すべて ({allVocab.length}語)
                      </button>
                      <button
                        className={`mastery-filter-pill ${vocabTypeFilter === 'main' ? 'active' : ''}`}
                        onClick={() => setVocabTypeFilter('main')}
                      >
                        ⭐ 主役キーワード ({allVocab.filter((v) => v.type === 'main').length}語)
                      </button>
                      <button
                        className={`mastery-filter-pill ${vocabTypeFilter === 'sub' ? 'active' : ''}`}
                        onClick={() => setVocabTypeFilter('sub')}
                      >
                        🔀 選択肢・対比の関連用語 ({allVocab.filter((v) => v.type === 'sub').length}語)
                      </button>
                    </div>

                    {vocabViewStyle === 'sheet' && (
                      <button
                        className={`red-sheet-toggle-btn ${isRedSheetOn ? 'active' : ''}`}
                        onClick={() => {
                          setIsRedSheetOn((p) => !p);
                          setRevealedVocabIds(new Set());
                        }}
                      >
                        {isRedSheetOn ? '📕 赤シート(答え隠し): ON' : '👁️ すべて表示中'}
                      </button>
                    )}
                  </div>

                  {/* Mastery Filter Bar */}
                  <div className="mastery-filter-bar">
                    <button
                      className={`mastery-filter-pill ${selectedMasteryFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setSelectedMasteryFilter('all')}
                    >
                      全ステータス
                    </button>
                    <button
                      className={`mastery-filter-pill needs-review ${selectedMasteryFilter === 'needs-review' ? 'active' : ''}`}
                      onClick={() => setSelectedMasteryFilter('needs-review')}
                    >
                      🔥 復習対象 (🔴+🟡)
                    </button>
                    <button
                      className={`mastery-filter-pill level-red ${selectedMasteryFilter === 'red' ? 'active' : ''}`}
                      onClick={() => setSelectedMasteryFilter('red')}
                    >
                      🔴 要復習
                    </button>
                    <button
                      className={`mastery-filter-pill level-yellow ${selectedMasteryFilter === 'yellow' ? 'active' : ''}`}
                      onClick={() => setSelectedMasteryFilter('yellow')}
                    >
                      🟡 あやふや
                    </button>
                    <button
                      className={`mastery-filter-pill level-green ${selectedMasteryFilter === 'green' ? 'active' : ''}`}
                      onClick={() => setSelectedMasteryFilter('green')}
                    >
                      🟢 瞬殺
                    </button>
                    <button
                      className={`mastery-filter-pill level-none ${selectedMasteryFilter === 'none' ? 'active' : ''}`}
                      onClick={() => setSelectedMasteryFilter('none')}
                    >
                      ⚪ 未チェック
                    </button>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="category-pills-wrap">
                    <button
                      className={`category-pill ${selectedCategory === 'all' ? 'active' : ''}`}
                      onClick={() => setSelectedCategory('all')}
                    >
                      全単元
                    </button>
                    {categories.map((cat) => {
                      const count = allVocab.filter((v) => v.categoryNumber === cat.num).length;
                      if (count === 0) return null;
                      return (
                        <button
                          key={cat.num}
                          className={`category-pill ${selectedCategory === cat.num ? 'active' : ''}`}
                          onClick={() => setSelectedCategory(cat.num)}
                        >
                          {cat.label} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {filteredVocab.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <h3>該当する単語が見つかりませんでした</h3>
                    <p>検索条件や単元フィルターを変更してみてください。</p>
                  </div>
                ) : vocabViewStyle === 'flashcard' && currentFlashcard ? (
                  /* ---------- 1語1答フラッシュカードモード ---------- */
                  <div className="flashcard-stage">
                    <div className="flashcard-progress">
                      <span>
                        カード <strong>{flashcardIndex + 1}</strong> / 全 {filteredVocab.length} 語
                      </span>
                      <button
                        className="flashcard-shuffle-btn"
                        onClick={() => {
                          const randomIdx = Math.floor(Math.random() * filteredVocab.length);
                          setFlashcardIndex(randomIdx);
                          setIsFlashcardFlipped(false);
                        }}
                      >
                        🎲 ランダムに引く
                      </button>
                    </div>

                    <div
                      className={`flashcard-box ${isFlashcardFlipped ? 'is-flipped' : ''}`}
                      onClick={() => setIsFlashcardFlipped((p) => !p)}
                    >
                      <div className="flashcard-top-meta">
                        <span className="card-category">
                          {currentFlashcard.categoryNumber}. {currentFlashcard.categoryName}
                        </span>
                        <span className={`vocab-type-badge ${currentFlashcard.type}`}>
                          {currentFlashcard.type === 'main' ? '⭐ 主役用語' : '🔀 選択肢・対比用語'}
                        </span>
                      </div>

                      <div className="flashcard-term">{currentFlashcard.term}</div>

                      {!isFlashcardFlipped ? (
                        <div className="flashcard-prompt">
                          👆 頭の中で「一言の意味」と「日常のたとえ話」を思い浮かべてからタップして裏面を表示！
                        </div>
                      ) : (
                        <div
                          className="flashcard-back-content"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="fc-section catchphrase">
                            <div className="fc-label">⚡ 一言定義・合言葉</div>
                            <div className="fc-value">{currentFlashcard.catchphrase}</div>
                          </div>

                          <div className="fc-section analogy">
                            <div className="fc-label">💡 日常のたとえ話・暗記フック</div>
                            <div className="fc-value">{currentFlashcard.analogy}</div>
                          </div>

                          {currentFlashcard.descriptiveAnswer && (
                            <div className="fc-section descriptive">
                              <div className="fc-label">✍️ 午後記述 40字フレーズ</div>
                              <div className="fc-value">{currentFlashcard.descriptiveAnswer}</div>
                            </div>
                          )}

                          <div className="fc-footer-actions">
                            <button
                              className="fc-open-note-btn"
                              onClick={() => setActiveNoteId(currentFlashcard.sourceNoteId)}
                            >
                              📖 元ノート「{currentFlashcard.sourceNoteTitle}」を開く
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 自己判定 ＆ 前後移動ボタン */}
                    <div className="flashcard-controls">
                      <button
                        className="fc-nav-btn"
                        disabled={flashcardIndex === 0}
                        onClick={() => {
                          setFlashcardIndex((i) => Math.max(0, i - 1));
                          setIsFlashcardFlipped(false);
                        }}
                      >
                        ← 前の単語
                      </button>

                      <div className="fc-grading-group">
                        {(['red', 'yellow', 'green'] as MasteryLevel[]).map((lvl) => (
                          <button
                            key={lvl}
                            className={`fc-grade-btn ${MASTERY_CONFIG[lvl].className} ${
                              getVocabMastery(currentFlashcard.id) === lvl ? 'active' : ''
                            }`}
                            onClick={() => {
                              setVocabMastery(currentFlashcard.id, lvl);
                              if (flashcardIndex < filteredVocab.length - 1) {
                                setFlashcardIndex((i) => i + 1);
                                setIsFlashcardFlipped(false);
                              }
                            }}
                          >
                            {MASTERY_CONFIG[lvl].shortLabel}
                          </button>
                        ))}
                      </div>

                      <button
                        className="fc-nav-btn"
                        disabled={flashcardIndex >= filteredVocab.length - 1}
                        onClick={() => {
                          setFlashcardIndex((i) => Math.min(filteredVocab.length - 1, i + 1));
                          setIsFlashcardFlipped(false);
                        }}
                      >
                        次の単語 →
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ---------- 赤シート一覧表モード ---------- */
                  <div className="vocab-sheet-list">
                    {filteredVocab.map((item) => {
                      const isMasked = isRedSheetOn && !revealedVocabIds.has(item.id);
                      const m = getVocabMastery(item.id);
                      return (
                        <div
                          key={item.id}
                          className={`vocab-row card-${MASTERY_CONFIG[m].className}`}
                        >
                          {/* 左側：用語名・カテゴリ・ステータス */}
                          <div className="vocab-row-left">
                            <div className="vocab-row-badges">
                              <span className="card-category">
                                {item.categoryNumber}. {item.categoryName}
                              </span>
                              <span className={`vocab-type-badge ${item.type}`}>
                                {item.type === 'main' ? '⭐ 主役' : '🔀 関連'}
                              </span>
                            </div>
                            <div className="vocab-row-term">{item.term}</div>
                            <div className="vocab-row-actions">
                              {(['red', 'yellow', 'green'] as MasteryLevel[]).map((lvl) => (
                                <button
                                  key={lvl}
                                  className={`mini-mastery-btn ${MASTERY_CONFIG[lvl].className} ${
                                    m === lvl ? 'active' : ''
                                  }`}
                                  onClick={() =>
                                    setVocabMastery(item.id, m === lvl ? 'none' : lvl)
                                  }
                                  title={MASTERY_CONFIG[lvl].desc}
                                >
                                  {lvl === 'red' ? '🔴' : lvl === 'yellow' ? '🟡' : '🟢'}
                                </button>
                              ))}
                              <button
                                className="vocab-jump-note-btn"
                                onClick={() => setActiveNoteId(item.sourceNoteId)}
                                title="この単語が登場する解説ノートを開く"
                              >
                                📖 ノートへ
                              </button>
                            </div>
                          </div>

                          {/* 右側：一言定義 ＆ 日常のたとえ話（赤シートON時はタップでアンマスク） */}
                          <div
                            className={`vocab-row-right ${isMasked ? 'is-masked' : ''}`}
                            onClick={() => {
                              if (isRedSheetOn) toggleVocabReveal(item.id);
                            }}
                          >
                            {isMasked ? (
                              <div className="red-sheet-cover">
                                📕 頭の中で思い出してからタップしてめくる
                              </div>
                            ) : (
                              <div className="vocab-row-details">
                                <div className="vocab-detail-catch">
                                  <strong>⚡ 定義・合言葉：</strong> {item.catchphrase}
                                </div>
                                <div className="vocab-detail-analogy">
                                  <strong>💡 たとえ話：</strong> {item.analogy}
                                </div>
                                {item.descriptiveAnswer && (
                                  <div className="vocab-detail-desc">
                                    <strong>✍️ 午後記述：</strong> {item.descriptiveAnswer}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* ================= NOTES LIST VIEW ================= */
              <>
                <div className="quiz-launcher-banner">
                  <div className="quiz-launcher-left">
                    <span className="quiz-launcher-icon">⚡</span>
                    <div className="quiz-launcher-text">
                      <div className="quiz-launcher-title">
                        「読んだつもり」を撃退！抜き打ち白紙テスト
                      </div>
                      <div className="quiz-launcher-sub">
                        解説を隠した状態で出題。たとえ話と他選択肢の×理由を3秒で思い出せるかチェック！
                      </div>
                    </div>
                  </div>
                  <div className="quiz-launcher-actions">
                    <button
                      className="quiz-start-btn priority"
                      onClick={() => startRandomQuiz('review-priority', 5)}
                      title="🔴要復習・🟡あやふや（読了）のノートから優先的にランダム5問出題します"
                    >
                      🎲 要復習・読了から5問テスト ({stats.red + stats.yellow}本対象)
                    </button>
                    <button
                      className="quiz-start-btn filtered"
                      onClick={() => startRandomQuiz('filtered', 5)}
                      title="現在絞り込み中のリストからランダムに5問出題します"
                    >
                      🎯 表示中の単元から5問テスト
                    </button>
                  </div>
                </div>

                {scheduleNote && (
                  <div
                    className="schedule-banner"
                    onClick={() => setActiveNoteId(scheduleNote.id)}
                    title="週別合格ロードマップを見る"
                  >
                    <div className="schedule-banner-left">
                      <span className="schedule-banner-icon">🎯</span>
                      <div className="schedule-banner-text">
                        <div className="schedule-banner-title">
                          11/5 科目A 受験まで あと <strong>{daysLeft}日</strong>
                        </div>
                        <div className="schedule-banner-sub">{currentPhaseText}</div>
                      </div>
                    </div>
                    <span className="schedule-banner-arrow">毎日計画を見る →</span>
                  </div>
                )}

                {guideNote && (
                  <div
                    className="guide-banner"
                    onClick={() => setActiveNoteId(guideNote.id)}
                    title="手持ちテキストで重点的に読むべき単元・早見表を見る"
                  >
                    <div className="schedule-banner-left">
                      <span className="schedule-banner-icon">📖</span>
                      <div className="schedule-banner-text">
                        <div className="schedule-banner-title">
                          【自宅学習用】誤答分析に基づく「重点テキスト基礎学習ガイド」
                        </div>
                        <div className="schedule-banner-sub">
                          🔑 公開鍵・OSI早見シート ＆ 📘石田本・📗合格教本の読むべき章・節まとめ
                        </div>
                      </div>
                    </div>
                    <span className="guide-banner-arrow">ガイドを見る →</span>
                  </div>
                )}

                <div className="control-panel">
                  <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      placeholder="タイトル、過去問、用語を検索..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input"
                    />
                    {searchQuery && (
                      <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="mastery-filter-bar">
                    <button
                      className={`mastery-filter-pill ${selectedMasteryFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setSelectedMasteryFilter('all')}
                    >
                      全ステータス ({allNotes.length})
                    </button>
                    <button
                      className={`mastery-filter-pill needs-review ${selectedMasteryFilter === 'needs-review' ? 'active' : ''}`}
                      onClick={() => setSelectedMasteryFilter('needs-review')}
                    >
                      🔥 復習対象 (🔴+🟡: {stats.red + stats.yellow})
                    </button>
                    <button
                      className={`mastery-filter-pill level-red ${selectedMasteryFilter === 'red' ? 'active' : ''}`}
                      onClick={() => setSelectedMasteryFilter('red')}
                    >
                      🔴 要復習 ({stats.red})
                    </button>
                    <button
                      className={`mastery-filter-pill level-yellow ${selectedMasteryFilter === 'yellow' ? 'active' : ''}`}
                      onClick={() => setSelectedMasteryFilter('yellow')}
                    >
                      🟡 あやふや・読了 ({stats.yellow})
                    </button>
                    <button
                      className={`mastery-filter-pill level-green ${selectedMasteryFilter === 'green' ? 'active' : ''}`}
                      onClick={() => setSelectedMasteryFilter('green')}
                    >
                      🟢 瞬殺 ({stats.green})
                    </button>
                    <button
                      className={`mastery-filter-pill level-none ${selectedMasteryFilter === 'none' ? 'active' : ''}`}
                      onClick={() => setSelectedMasteryFilter('none')}
                    >
                      ⚪ 未着手 ({allNotes.length - stats.touched})
                    </button>
                  </div>

                  <div className="folder-tabs">
                    <button
                      className={`folder-tab ${activeFolder === 'inbox' ? 'active' : ''}`}
                      onClick={() => setActiveFolder('inbox')}
                    >
                      📬 inbox（新着）
                      <span className="tab-count">
                        {allNotes.filter((n) => n.folder === 'inbox').length}
                      </span>
                    </button>
                    <button
                      className={`folder-tab ${activeFolder === 'ap-prep' ? 'active' : ''}`}
                      onClick={() => setActiveFolder('ap-prep')}
                    >
                      📚 ap-prep（定着）
                      <span className="tab-count">
                        {allNotes.filter((n) => n.folder === 'ap-prep').length}
                      </span>
                    </button>
                    <button
                      className={`folder-tab ${activeFolder === 'all' ? 'active' : ''}`}
                      onClick={() => setActiveFolder('all')}
                    >
                      すべて
                      <span className="tab-count">{allNotes.length}</span>
                    </button>
                  </div>

                  <div className="category-pills-wrap">
                    <button
                      className={`category-pill ${selectedCategory === 'all' ? 'active' : ''}`}
                      onClick={() => setSelectedCategory('all')}
                    >
                      全単元
                    </button>
                    {categories.map((cat) => {
                      const count = allNotes.filter(
                        (n) =>
                          n.categoryNumber === cat.num &&
                          (activeFolder === 'all' || n.folder === activeFolder)
                      ).length;
                      return (
                        <button
                          key={cat.num}
                          className={`category-pill ${selectedCategory === cat.num ? 'active' : ''}`}
                          onClick={() => setSelectedCategory(cat.num)}
                        >
                          {cat.label} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="notes-grid">
                  {filteredNotes.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">📭</div>
                      <h3>該当するノートが見つかりませんでした</h3>
                      <p>検索条件や定着度フィルターを変更してみてください。</p>
                    </div>
                  ) : (
                    filteredNotes.map((note) => {
                      const m = getMastery(note.id);
                      const cfg = MASTERY_CONFIG[m];
                      return (
                        <div
                          key={note.id}
                          className={`note-card card-${cfg.className}`}
                          onClick={() => setActiveNoteId(note.id)}
                        >
                          <div className="card-header">
                            <span className="card-category">
                              {note.categoryNumber}. {note.categoryName}
                            </span>
                            <span className="card-time">⏱️ {note.readingTime}</span>
                          </div>

                          <h2 className="card-title">{note.title}</h2>

                          <div className="card-footer">
                            {note.targetExam ? (
                              <span className="card-exam">{note.targetExam}</span>
                            ) : (
                              <span />
                            )}

                            <div
                              className="card-mastery-pills"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {(['red', 'yellow', 'green'] as MasteryLevel[]).map((lvl) => {
                                const isSelected = m === lvl;
                                return (
                                  <button
                                    key={lvl}
                                    className={`mini-mastery-btn ${MASTERY_CONFIG[lvl].className} ${
                                      isSelected ? 'active' : ''
                                    }`}
                                    onClick={(e) =>
                                      setNoteMastery(note.id, isSelected ? 'none' : lvl, e)
                                    }
                                    title={MASTERY_CONFIG[lvl].desc}
                                  >
                                    {lvl === 'red' ? '🔴' : lvl === 'yellow' ? '🟡' : '🟢'}
                                  </button>
                                );
                              })}
                              <button
                                className={`card-check-btn ${cfg.className}`}
                                onClick={(e) => cycleMastery(note.id, e)}
                                title="タップで定着度を切り替え（⚪未着手 → 🟡あやふや → 🟢瞬殺 → 🔴要復習）"
                              >
                                {cfg.shortLabel}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
