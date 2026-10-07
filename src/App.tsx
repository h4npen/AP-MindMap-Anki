import React, { useState, useMemo, useEffect } from 'react';
import { loadNotes } from './notesData';
import { MarkdownViewer } from './components/MarkdownViewer';
import './App.css';

export function App() {
  const allNotes = useMemo(() => loadNotes(), []);

  // State
  const [activeFolder, setActiveFolder] = useState<'all' | 'inbox' | 'ap-prep'>('inbox');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  // Completed notes stored in localStorage
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('ap_completed_notes');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggleComplete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      localStorage.setItem('ap_completed_notes', JSON.stringify(Array.from(next)));
      return next;
    });
  };

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
      // Folder filter
      if (activeFolder !== 'all' && note.folder !== activeFolder) return false;
      // Category filter
      if (selectedCategory !== 'all' && note.categoryNumber !== selectedCategory) return false;
      // Search query
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
  }, [allNotes, activeFolder, selectedCategory, searchQuery]);

  // Currently active note object
  const activeNote = useMemo(() => {
    if (!activeNoteId) return null;
    return allNotes.find((n) => n.id === activeNoteId) || null;
  }, [allNotes, activeNoteId]);

  // Next / Previous note navigation
  const { prevNote, nextNote } = useMemo(() => {
    if (!activeNote) return { prevNote: null, nextNote: null };
    const currentIndex = filteredNotes.findIndex((n) => n.id === activeNote.id);
    if (currentIndex === -1) return { prevNote: null, nextNote: null };
    return {
      prevNote: currentIndex > 0 ? filteredNotes[currentIndex - 1] : null,
      nextNote: currentIndex < filteredNotes.length - 1 ? filteredNotes[currentIndex + 1] : null,
    };
  }, [activeNote, filteredNotes]);

  // Scroll to top when active note changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [activeNoteId]);

  // Progress percentage
  const progressPercent = allNotes.length > 0 ? Math.round((completedIds.size / allNotes.length) * 100) : 0;

  // Exam countdown for 科目A (2026-11-07)
  const daysLeft = useMemo(() => {
    const examDate = new Date('2026-11-07T12:00:00+09:00');
    const now = new Date();
    const diff = examDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, []);

  // Find schedule note
  const scheduleNote = useMemo(() => {
    return allNotes.find((n) => n.id.includes('schedule') || n.categoryNumber === '00') || null;
  }, [allNotes]);

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="app-header">
        <div className="header-inner">
          <div className="logo-area" onClick={() => setActiveNoteId(null)} title="トップへ戻る">
            <span className="logo-icon">🧠</span>
            <div className="logo-text">
              <h1 className="logo-title">AP 直感攻略ノート</h1>
              <span className="logo-subtitle">通勤速習・脳内ハッキング暗記ビューア</span>
            </div>
          </div>

          <div className="header-stats">
            {scheduleNote && (
              <button
                className="schedule-header-btn"
                onClick={() => setActiveNoteId(scheduleNote.id)}
                title="週別合格スケジュールを確認する"
              >
                🎯 科目Aまであと <strong>{daysLeft}日</strong>
              </button>
            )}
            <span className="stat-pill count">
              全 {allNotes.length} 本
            </span>
            <span className="stat-pill success">
              読了 {completedIds.size} 本 ({progressPercent}%)
            </span>
          </div>
        </div>
        {/* Progress Bar under header */}
        <div className="header-progress-track">
          <div className="header-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="main-layout">
        {activeNote ? (
          /* ================= DETAIL VIEW ================= */
          <div className="note-detail-view">
            {/* Top Navigation Bar */}
            <div className="detail-top-nav">
              <button className="back-btn" onClick={() => setActiveNoteId(null)}>
                ← 一覧に戻る
              </button>

              <div className="detail-nav-actions">
                <button
                  className={`complete-toggle-btn ${completedIds.has(activeNote.id) ? 'is-completed' : ''}`}
                  onClick={() => toggleComplete(activeNote.id)}
                >
                  {completedIds.has(activeNote.id) ? '✓ 読了済' : '読了にする'}
                </button>
              </div>
            </div>

            {/* Note Metadata Banner */}
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
                  {activeNote.folder === 'inbox' ? '📬 inbox (未読)' : '📚 ap-prep (定着)'}
                </span>
              </div>
            </div>

            {/* Markdown Content */}
            <article className="note-article">
              <MarkdownViewer content={activeNote.content} />
            </article>

            {/* Bottom Navigation (Next / Prev) */}
            <div className="bottom-nav">
              {prevNote ? (
                <button
                  className="nav-page-btn prev"
                  onClick={() => setActiveNoteId(prevNote.id)}
                >
                  <span className="nav-arrow">← 前のノート</span>
                  <span className="nav-label">{prevNote.title}</span>
                </button>
              ) : <div />}

              {nextNote ? (
                <button
                  className="nav-page-btn next"
                  onClick={() => setActiveNoteId(nextNote.id)}
                >
                  <span className="nav-arrow">次のノート →</span>
                  <span className="nav-label">{nextNote.title}</span>
                </button>
              ) : <div />}
            </div>
          </div>
        ) : (
          /* ================= LIST VIEW ================= */
          <div className="notes-list-view">
            {/* Roadmap Banner */}
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
                      11/7(土) 科目A 受験まで あと <strong>{daysLeft}日</strong>
                    </div>
                    <div className="schedule-banner-sub">
                      【第1週: 10/6〜10/12】テクノロジ系集中（NW・DB・セキュリティ）＆ミス問登録
                    </div>
                  </div>
                </div>
                <span className="schedule-banner-arrow">週別詳細を見る →</span>
              </div>
            )}

            {/* Filter & Search Controls */}
            <div className="control-panel">
              {/* Search Bar */}
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

              {/* Folder Tabs (inbox / ap-prep / all) */}
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

              {/* Category Filter Pills (Scrollable horizontally) */}
              <div className="category-pills-wrap">
                <button
                  className={`category-pill ${selectedCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('all')}
                >
                  全単元
                </button>
                {categories.map((cat) => {
                  const count = allNotes.filter(
                    (n) => n.categoryNumber === cat.num && (activeFolder === 'all' || n.folder === activeFolder)
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

            {/* Notes Grid */}
            <div className="notes-grid">
              {filteredNotes.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <h3>該当するノートが見つかりませんでした</h3>
                  <p>検索条件や単元フィルターを変更してみてください。</p>
                </div>
              ) : (
                filteredNotes.map((note) => {
                  const isDone = completedIds.has(note.id);
                  return (
                    <div
                      key={note.id}
                      className={`note-card ${isDone ? 'is-done' : ''}`}
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
                        {note.targetExam && (
                          <span className="card-exam">{note.targetExam}</span>
                        )}

                        <button
                          className={`card-check-btn ${isDone ? 'checked' : ''}`}
                          onClick={(e) => toggleComplete(note.id, e)}
                          title={isDone ? '読了済みを解除' : '読了済みにする'}
                        >
                          {isDone ? '✓ 読了' : '未読'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
