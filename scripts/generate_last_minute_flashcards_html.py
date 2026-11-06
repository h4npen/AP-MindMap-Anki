# -*- coding: utf-8 -*-
"""
scripts/generate_last_minute_flashcards_html.py
間違えた全129問から、前日・試験直前用の「最終チェック単語帳」HTMLを生成。
・過去問番号バッジ（例: 📌 R6春 問6）をクリック → 過去問道場の該当問題ページへ直行！
・問題タイトル（例: #1 【荷物の積み下ろし】...）をクリック → 昔作成した詳細解説ページ（offline_app.html）へ直行！
・A4二つ折り印刷 ＆ スマホ暗記モード両対応！
"""

import os
import json
import re

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUTPUT_PATH = os.path.join(ROOT_DIR, "printable", "last_minute_flashcards.html")

with open("flashcards_data.json", "r", encoding="utf-8") as f:
    cards_by_category = json.load(f)

CAT_CONFIG = {
    "システム構成要素": {"icon": "💻", "color": "#0284c7"},
    "ソフトウェア": {"icon": "⚙️", "color": "#0369a1"},
    "データベース": {"icon": "🗄️", "color": "#0d9488"},
    "ネットワーク": {"icon": "🌐", "color": "#2563eb"},
    "セキュリティ": {"icon": "🛡️", "color": "#dc2626"},
    "システム開発技術": {"icon": "📐", "color": "#7c3aed"},
    "ソフトウェア開発管理技術": {"icon": "📋", "color": "#9333ea"},
    "プロジェクトマネジメント": {"icon": "📊", "color": "#ea580c"},
    "サービスマネジメント": {"icon": "🛎️", "color": "#d97706"},
    "システム監査": {"icon": "🔍", "color": "#ca8a04"},
    "システム企画": {"icon": "💡", "color": "#16a34a"},
    "経営戦略マネジメント": {"icon": "📈", "color": "#059669"},
    "ビジネスインダストリ": {"icon": "🏭", "color": "#475569"},
    "企業活動": {"icon": "🏢", "color": "#334155"},
    "法務": {"icon": "⚖️", "color": "#4f46e5"}
}

HTML_HEADER = """<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>AP応用情報 間違えた全129問 直前総復習単語帳（過去問道場＆解説ページ直リンク搭載）</title>
  <style>
    /* ========================================================
       A4縦向き印刷 & スマホ両対応スタイルシート
       ======================================================== */
    @page {
      size: A4 portrait;
      margin: 10mm 10mm 10mm 10mm;
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
      font-size: 8.5pt;
      line-height: 1.35;
      color: #0f172a;
      background: #f8fafc;
      margin: 0;
      padding: 0;
    }

    .container {
      width: 100%;
      max-width: 210mm;
      margin: 0 auto;
      background: #ffffff;
      padding: 8px 12px;
    }

    /* 画面表示用コントロールバー */
    @media screen {
      body {
        padding: 15px 10px;
      }
      .container {
        box-shadow: 0 4px 20px rgba(0,0,0,0.12);
        border-radius: 8px;
        padding: 20px 25px;
      }
      .nav-bar {
        position: sticky;
        top: 0;
        z-index: 100;
        background: #0f172a;
        color: #ffffff;
        padding: 10px 16px;
        border-radius: 6px;
        margin-bottom: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.25);
      }
      .btn {
        background: #38bdf8;
        color: #0f172a;
        font-weight: 800;
        border: none;
        padding: 6px 14px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 9pt;
      }
      .btn:hover {
        background: #7dd3fc;
      }
      .btn-toggle {
        background: #334155;
        color: #f8fafc;
      }
      .btn-toggle:hover {
        background: #475569;
      }
      .card-row {
        cursor: pointer;
        transition: background-color 0.15s ease;
      }
      .card-row:hover {
        background-color: #f1f5f9;
      }
      .hide-answers .desc-col {
        visibility: hidden;
      }
      .hide-answers .card-row.revealed .desc-col {
        visibility: visible;
        background-color: #fef08a !important;
      }
      /* リンクのホバー演出（画面表示時のみ） */
      a.q-badge-link:hover {
        background: #1e40af !important;
        color: #ffffff !important;
        transform: translateY(-1px);
      }
      a.term-title-link:hover {
        color: #2563eb !important;
        text-decoration: underline !important;
      }
    }

    @media print {
      body {
        background: #ffffff;
      }
      .container {
        box-shadow: none;
        padding: 0;
        max-width: none;
      }
      .nav-bar, .no-print {
        display: none !important;
      }
      .card-row {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .category-header {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
      .link-icon {
        display: none !important;
      }
    }

    /* ヘッダー */
    .header-box {
      border-bottom: 2.5px solid #0f172a;
      padding-bottom: 6px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .main-title {
      font-size: 14pt;
      font-weight: 900;
      color: #0f172a;
    }
    .sub-title {
      font-size: 8pt;
      color: #64748b;
    }
    .badge-top {
      background: #ef4444;
      color: #ffffff;
      font-size: 7.5pt;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 3px;
    }

    /* 分野見出し */
    .category-header {
      background: #0f172a;
      color: #ffffff;
      padding: 4px 8px;
      font-size: 9pt;
      font-weight: 800;
      border-radius: 4px;
      margin-top: 12px;
      margin-bottom: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* 二つ折り単語帳テーブル */
    .flashcard-table {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #94a3b8;
      margin-bottom: 8px;
    }

    .flashcard-table th {
      background: #e2e8f0;
      color: #1e293b;
      padding: 4px 6px;
      font-size: 8pt;
      border: 1px solid #cbd5e1;
      text-align: left;
    }

    .card-row {
      border-bottom: 1px solid #e2e8f0;
    }

    /* 左列：問題・用語（40%） 中央に破線折り目ガイド */
    .term-col {
      width: 40%;
      padding: 6px 7px;
      background: #f8fafc;
      border-right: 2px dashed #64748b;
      vertical-align: top;
    }

    /* 右列：合言葉・正解・ひっかけ（60%） */
    .desc-col {
      width: 60%;
      padding: 6px 8px;
      background: #ffffff;
      vertical-align: top;
    }

    .term-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 3px;
    }

    /* 過去問出題番号リンクバッジ（クリックで過去問道場へ） */
    a.q-badge-link {
      display: inline-block;
      background: #0f172a;
      color: #38bdf8;
      font-size: 7.5pt;
      font-weight: 900;
      padding: 1px 6px;
      border-radius: 3px;
      letter-spacing: 0.3px;
      border: 1px solid #1e293b;
      white-space: nowrap;
      text-decoration: none;
      transition: all 0.15s ease;
    }

    /* 問題タイトルリンク（クリックで作成した詳細解説ページへ） */
    a.term-title-link {
      display: block;
      font-size: 9.2pt;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.3;
      margin-bottom: 2px;
      text-decoration: none;
    }

    .num-pill {
      display: inline-block;
      background: #e2e8f0;
      color: #0f172a;
      padding: 0 4px;
      border-radius: 3px;
      font-size: 8pt;
      margin-right: 3px;
      border: 1px solid #cbd5e1;
    }

    .check-box {
      font-size: 7.5pt;
      color: #94a3b8;
      letter-spacing: 1px;
    }

    /* 右側のスタイル */
    .catchphrase-text {
      font-size: 8.5pt;
      font-weight: 800;
      color: #b45309;
      margin-bottom: 3px;
      line-height: 1.3;
    }

    .ans-tag {
      display: inline-block;
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
      padding: 1px 5px;
      border-radius: 2px;
      font-weight: 800;
      font-size: 7.5pt;
      margin-bottom: 2px;
    }

    .trap-hint {
      font-size: 7.5pt;
      color: #475569;
      background: #fef2f2;
      border-left: 2.5px solid #ef4444;
      padding: 3px 6px;
      margin-top: 3px;
      line-height: 1.25;
    }
  </style>
  <script>
    function toggleAnswers() {
      document.body.classList.toggle('hide-answers');
      const btn = document.getElementById('toggleBtn');
      if (document.body.classList.contains('hide-answers')) {
        btn.innerText = '👀 全ての答えを表示する';
      } else {
        btn.innerText = '🙈 答えを隠す（暗記モード）';
      }
    }

    document.addEventListener('DOMContentLoaded', () => {
      const rows = document.querySelectorAll('.card-row');
      rows.forEach(row => {
        row.addEventListener('click', () => {
          row.classList.toggle('revealed');
        });
      });
    });
  </script>
</head>
<body>

  <div class="container">
    <div class="nav-bar">
      <div>
        <strong>📖 直前総復習単語帳（全129問・直リンク搭載版）</strong>
        <span style="font-size: 8pt; opacity: 0.9; margin-left: 6px;">
          💡 <strong>「📌 R6春 問6」</strong>を押すと過去問道場へ、<strong>「#1 タイトル」</strong>を押すと詳細解説ページへ飛べます！
        </span>
      </div>
      <div style="display: flex; gap: 8px;">
        <button id="toggleBtn" class="btn btn-toggle" onclick="toggleAnswers()">🙈 答えを隠す（暗記モード）</button>
        <button class="btn" onclick="window.print()">🖨️ A4印刷する</button>
      </div>
    </div>

    <div class="header-box">
      <div>
        <span class="badge-top">明日試験！最終チェック版</span>
        <div class="main-title">AP 応用情報 直前総復習単語帳（間違えた全129問完全収録）</div>
        <div class="sub-title">
          【画面】過去問バッジクリック＝過去問道場を開く ／ #番号・タイトルクリック＝自作解説ノートを開く<br>
          【印刷】真ん中の破線で半分に折ってセルフテスト！「過去問番号・用語」を見て右側の「合言葉・正解」を即答！
        </div>
      </div>
      <div style="text-align: right; font-size: 7.5pt; color: #64748b;">
        過去問道場＆解説直リンク対応<br>中央二つ折り印刷対応
      </div>
    </div>
"""

HTML_FOOTER = """
  </div>
</body>
</html>
"""

def generate_flashcards_html():
    body_parts = []
    
    total_cards = sum(len(items) for items in cards_by_category.values())
    card_counter = 0

    for cat_name, items in cards_by_category.items():
        if not items:
            continue
        cfg = CAT_CONFIG.get(cat_name, {"icon": "📌", "color": "#0f172a"})
        
        body_parts.append(f"""
    <div class="category-header" style="background: {cfg['color']};">
      <span>{cfg['icon']} {cat_name} ({len(items)}問)</span>
      <span style="font-size: 7.5pt; opacity: 0.9;">中央の破線で二つ折り ✂️</span>
    </div>

    <table class="flashcard-table">
      <thead>
        <tr>
          <th style="width: 40%;">🔍 過去問番号(道場リンク) ／ #用語(解説リンク)</th>
          <th style="width: 60%;">💡 脳内合言葉・正解・ひっかけ注意（答え側）</th>
        </tr>
      </thead>
      <tbody>
""")
        
        for item in items:
            card_counter += 1
            term = item['term'] or item['file']
            catch = item['catch'] or "重要キーワード"
            ans = item['ans']
            traps = item['traps']
            kakomon = item['kakomon_label']
            kakomon_url = item['kakomon_url']
            note_link = item['note_link']
            
            traps_clean = traps.replace("- **", "").replace("**", "")
            if len(traps_clean) > 130:
                traps_clean = traps_clean[:128] + "…"

            trap_html = f'<div class="trap-hint">⚠️ {traps_clean}</div>' if traps_clean else ''
            ans_html = f'<div class="ans-tag">正解: {ans}</div>' if ans else ''

            row_html = f"""
        <tr class="card-row">
          <td class="term-col">
            <div class="term-header">
              <a class="q-badge-link" href="{kakomon_url}" target="_blank" rel="noopener" title="過去問道場でこの問題を開く" onclick="event.stopPropagation();">📌 {kakomon} <span class="link-icon">↗</span></a>
              <span class="check-box">☐ ☐ ☐</span>
            </div>
            <a class="term-title-link" href="{note_link}" target="_blank" title="作成した詳細解説ページを開く" onclick="event.stopPropagation();">
              <span class="num-pill">#{card_counter} 📖</span>{term}
            </a>
          </td>
          <td class="desc-col">
            <div class="catchphrase-text">🧠 {catch}</div>
            {ans_html}
            {trap_html}
          </td>
        </tr>
"""
            body_parts.append(row_html)

        body_parts.append("""
      </tbody>
    </table>
""")

    final_html = HTML_HEADER + "\n".join(body_parts) + HTML_FOOTER
    
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write(final_html)

    print(f"Successfully generated: {OUTPUT_PATH} ({len(final_html)} bytes, {total_cards} cards)")

if __name__ == "__main__":
    generate_flashcards_html()
