#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/export_printable.py
指定した分野フォルダ（または全inbox）の解説Markdownを、
1. 通常形式（print_*.html）: 1問ごとに問題＋詳細解説を収録したA4/A5両面印刷用ファイル
2. 問題集形式（workbook_*.html）: 通常形式とは別ファイルで、前半に「問題文＋選択肢＋赤ペン3秒テスト記述欄」のみを並べ、巻末に「解答・合言葉・たとえ話・他選択肢の×理由」をまとめた白紙テスト用問題集ファイル
として一括出力するツール。

使用例:
  # 未印刷問題の「通常解説ノート」と「別冊・問題集」の両方を出力（差分出力）
  python scripts/export_printable.py docs/inbox/10_ネットワーク/

  # 履歴を無視して全問の「通常解説ノート」と「別冊・問題集」を出力
  python scripts/export_printable.py docs/inbox/10_ネットワーク/ --all

  # 印刷履歴を更新せず、全問または指定フォルダの「問題集（workbook_*.html）」のみを作成
  python scripts/export_printable.py docs/inbox/ --workbook
"""

import os
import sys
import glob
import json
import re
import argparse
from datetime import datetime

# Windows環境でのUnicode出力対策
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DOCS_DIR = os.path.join(ROOT_DIR, "docs")
HISTORY_FILE = os.path.join(DOCS_DIR, ".print_history.json")
OUTPUT_DIR = os.path.join(ROOT_DIR, "printable")
DIST_OUTPUT_DIR = os.path.join(ROOT_DIR, "dist", "printable")


def load_print_history():
    """印刷履歴を読み込む"""
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def save_print_history(history):
    """印刷履歴を保存する"""
    os.makedirs(os.path.dirname(HISTORY_FILE), exist_ok=True)
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)


def parse_markdown_tables(md_text):
    """
    行ベースの状態機械でMarkdown内のテーブルを検出し、
    HTMLの <table> に置換する
    """
    lines = md_text.splitlines()
    output_lines = []
    table_lines = []
    in_table = False

    def render_table(tbl_lines):
        if len(tbl_lines) < 2:
            return "\n".join(tbl_lines)

        sep_line = tbl_lines[1].strip()
        if not re.match(r'^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$', sep_line):
            return "\n".join(tbl_lines)

        sep_cols = [c.strip() for c in sep_line.strip('|').split('|')]
        aligns = []
        for c in sep_cols:
            left = c.startswith(':')
            right = c.endswith(':')
            if left and right:
                aligns.append('center')
            elif right:
                aligns.append('right')
            elif left:
                aligns.append('left')
            else:
                aligns.append('left')

        header_cols = [c.strip() for c in tbl_lines[0].strip('|').split('|')]
        th_cells = []
        for i, col in enumerate(header_cols):
            align = f' style="text-align: {aligns[i]}"' if i < len(aligns) and aligns[i] != 'left' else ''
            th_cells.append(f'<th{align}>{col}</th>')

        tr_rows = []
        for line in tbl_lines[2:]:
            cols = [c.strip() for c in line.strip('|').split('|')]
            td_cells = []
            for i, col in enumerate(cols):
                align = f' style="text-align: {aligns[i]}"' if i < len(aligns) and aligns[i] != 'left' else ''
                td_cells.append(f'<td{align}>{col}</td>')
            tr_rows.append(f"    <tr>{''.join(td_cells)}</tr>")

        return (
            '<table class="print-table">\n'
            f"  <thead>\n    <tr>{''.join(th_cells)}</tr>\n  </thead>\n"
            f"  <tbody>\n{chr(10).join(tr_rows)}\n  </tbody>\n"
            '</table>'
        )

    for line in lines:
        stripped = line.strip()
        if stripped.startswith('|') and stripped.endswith('|'):
            table_lines.append(stripped)
            in_table = True
        else:
            if in_table:
                output_lines.append(render_table(table_lines))
                table_lines = []
                in_table = False
            output_lines.append(line)

    if in_table:
        output_lines.append(render_table(table_lines))

    return "\n".join(output_lines)


def markdown_to_html_simple(md_text):
    """
    Python標準機能で高品質Markdownパース（印刷用HTMLへの変換）
    """
    html = md_text

    # 1. Mermaidコードブロックの保護（divプレースホルダーにしてpタグ混入・改行破壊を防止）
    mermaid_blocks = []
    def save_mermaid(match):
        code = match.group(1).strip()
        mermaid_blocks.append(code)
        return f'\n\n<!--MERMAID_PLACEHOLDER_{len(mermaid_blocks)-1}-->\n\n'

    html = re.sub(r'```mermaid\s*\r?\n([\s\S]*?)\r?\n```', save_mermaid, html)

    # 2. その他コードブロックの保護
    code_blocks = []
    def save_code(match):
        code = match.group(1).strip()
        code_blocks.append(code)
        return f'\n\n<!--CODE_PLACEHOLDER_{len(code_blocks)-1}-->\n\n'

    html = re.sub(r'```[a-zA-Z0-9_-]*\s*\r?\n([\s\S]*?)\r?\n```', save_code, html)

    # 3. インラインコード
    html = re.sub(r'`([^`]+)`', r'<code>\1</code>', html)

    # 4. details / summary の処理（印刷用なので常に open を強制）
    html = re.sub(r'<details>', r'<details open class="print-details">', html)
    html = re.sub(r'<summary>(.*?)</summary>', r'<summary class="print-summary">\1</summary>', html)

    # 5. 見出し
    html = re.sub(r'^# (.*?)$', r'<h1 class="print-h1">\1</h1>', html, flags=re.MULTILINE)
    html = re.sub(r'^## (.*?)$', r'<h2 class="print-h2">\1</h2>', html, flags=re.MULTILINE)
    html = re.sub(r'^### (.*?)$', r'<h3 class="print-h3">\1</h3>', html, flags=re.MULTILINE)

    # 6. 強調
    html = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', html)
    html = re.sub(r'\*([^*]+)\*', r'<em>\1</em>', html)

    # 7. テーブルの変換
    html = parse_markdown_tables(html)

    # 8. 引用ブロック
    def replace_quote(match):
        content = match.group(0)
        lines = [re.sub(r'^>\s?', '', l) for l in content.splitlines()]
        return f'<blockquote class="print-quote">{"<br>".join(lines)}</blockquote>'

    html = re.sub(r'(?:^>.*(?:\r?\n|$))+', replace_quote, html, flags=re.MULTILINE)

    # 9. リスト
    html = re.sub(r'^- \[ \] \*\*(.*?)\*\*', r'<div class="print-check">□ <strong>\1</strong></div>', html, flags=re.MULTILINE)
    html = re.sub(r'^- \[ \] (.*?)$', r'<div class="print-check">□ \1</div>', html, flags=re.MULTILINE)
    html = re.sub(r'^- \*\*(.*?)\*\*', r'<div class="print-bullet">• <strong>\1</strong></div>', html, flags=re.MULTILINE)
    html = re.sub(r'^- (.*?)$', r'<div class="print-bullet">• \1</div>', html, flags=re.MULTILINE)

    # 10. 水平線
    html = re.sub(r'^---$', r'<hr class="print-hr">', html, flags=re.MULTILINE)

    # 11. 段落（改行）
    paragraphs = re.split(r'\r?\n\r?\n', html)
    processed = []
    block_prefixes = (
        "<h", "<div", "<block", "<hr", "<pre", "<details", "</details>", "<table",
        "<!--MERMAID_PLACEHOLDER", "<!--CODE_PLACEHOLDER"
    )
    for p in paragraphs:
        p_strip = p.strip()
        if not p_strip:
            continue
        if any(p_strip.startswith(bp) for bp in block_prefixes):
            processed.append(p_strip)
        else:
            p_br = p_strip.replace("\r\n", "\n").replace("\n", "<br>")
            processed.append(f"<p>{p_br}</p>")

    html = "\n\n".join(processed)

    # 12. プレースホルダーの復元
    for i, code in enumerate(mermaid_blocks):
        html = html.replace(
            f'<!--MERMAID_PLACEHOLDER_{i}-->',
            f'<pre class="mermaid">\n{code}\n</pre>'
        )

    for i, code in enumerate(code_blocks):
        html = html.replace(
            f'<!--CODE_PLACEHOLDER_{i}-->',
            f'<pre><code>{code}</code></pre>'
        )

    return html


def extract_workbook_parts(md_content):
    """
    問題集（workbook_*.html）向けに、1つのノートから
    - テーマ名（ネタバレのサブタイトルを除去）
    - 対象過去問
    - 問題文＆選択肢HTML（正解<details>より前の部分）
    - 巻末解答編用の要約データ（正解、合言葉、たとえ話、選択肢のひっかけ理由）
    を抽出する。
    """
    # <details> が無いノート（スケジュール等）はスキップ対象
    details_match = re.search(r'<details>([\s\S]*?)</details>', md_content)
    if not details_match:
        return None

    # 1. タイトル（：より前の純粋なテーマ名だけ取得してネタバレ防止）
    title_match = re.search(r'^#\s+(.+)$', md_content, flags=re.MULTILINE)
    full_title = title_match.group(1).strip() if title_match else "問題"
    short_theme = re.split(r'[：:]', full_title)[0].strip()

    # 2. 対象過去問
    exam_match = re.search(r'>\s*\*\*対象過去問\*\*:\s*([^\n\r]+)', md_content)
    target_exam = exam_match.group(1).strip() if exam_match else ""

    # 3. 問題文と選択肢の切り出し（## 【対象過去問】 から <details> の直前まで）
    before_details = md_content[:details_match.start()].strip()
    prob_start = re.search(r'^##\s*【対象過去問】.*$', before_details, flags=re.MULTILINE)
    if prob_start:
        question_md = before_details[prob_start.end():].strip()
    else:
        question_md = before_details

    # 先頭の「**【問題】**」見出しを整理
    question_md = re.sub(r'^\*\*【問題】\*\*\s*', '', question_md).strip()
    question_html = markdown_to_html_simple(question_md)

    # 4. 巻末解答編用データの抽出
    answer_raw = re.sub(r'<summary>[\s\S]*?</summary>', '', details_match.group(1)).strip()
    answer_html = markdown_to_html_simple(answer_raw)

    # 合言葉 / セクション0見出し
    sec0_match = re.search(r'^##\s*0\.\s*(.+)$', md_content, flags=re.MULTILINE)
    sec0_title = sec0_match.group(1).strip() if sec0_match else ""

    # 日常のたとえ話見出し（セクション1）
    sec1_match = re.search(r'^##\s*1\.\s*(.+)$', md_content, flags=re.MULTILINE)
    sec1_title = sec1_match.group(1).strip() if sec1_match else ""

    # セクション2（選択肢のひっかけポイント）本文の抽出
    sec2_match = re.search(
        r'^##\s*2\.\s*[^\n\r]+\n([\s\S]*?)(?=^---\s*$|^##\s*3\.|^##\s*🎯|\Z)',
        md_content,
        flags=re.MULTILINE
    )
    sec2_html = markdown_to_html_simple(sec2_match.group(1).strip()) if sec2_match else ""

    return {
        "full_title": full_title,
        "short_theme": short_theme,
        "target_exam": target_exam,
        "question_html": question_html,
        "answer_html": answer_html,
        "sec0_title": sec0_title,
        "sec1_title": sec1_title,
        "sec2_html": sec2_html,
    }


HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>{title}</title>
  <!-- Mermaid.js for Vector Diagram Rendering -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>
    mermaid.initialize({{
      startOnLoad: true,
      theme: 'neutral',
      securityLevel: 'loose',
      fontFamily: 'Noto Sans JP, sans-serif',
      fontSize: 12
    }});
  </script>
  <style>
    /* ========================================================
       A4用紙・両面印刷（製本）専用組版スタイル
       ======================================================== */
    @page {{
      size: A4 portrait;
      margin: 15mm 15mm 15mm 15mm;
      @bottom-right {{
        content: counter(page);
        font-size: 8.5pt;
        color: #64748b;
      }}
    }}

    @page :left {{
      margin-left: 12mm;
      margin-right: 18mm;
    }}

    @page :right {{
      margin-left: 18mm;
      margin-right: 12mm;
    }}

    * {{
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }}

    body {{
      font-family: 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Noto Sans JP', sans-serif;
      font-size: 10.5pt;
      line-height: 1.62;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }}

    .screen-toolbar {{
      background: #1e293b;
      color: #ffffff;
      padding: 12px 20px;
      position: sticky;
      top: 0;
      z-index: 999;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }}

    .screen-toolbar button {{
      background: #f59e0b;
      color: #000;
      border: none;
      padding: 8px 18px;
      font-size: 14px;
      font-weight: bold;
      border-radius: 6px;
      cursor: pointer;
    }}

    .screen-toolbar button:hover {{
      background: #d97706;
    }}

    @media print {{
      .screen-toolbar {{
        display: none !important;
      }}
    }}

    .question-sheet {{
      page-break-before: always;
      break-before: page;
      padding: 0;
      margin: 0 auto;
    }}

    .question-sheet:first-of-type {{
      page-break-before: avoid;
      break-before: avoid;
    }}

    .print-h1 {{
      font-size: 14pt;
      font-weight: 800;
      color: #0f172a;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 5px;
      margin: 0 0 10px 0;
      line-height: 1.35;
    }}

    .print-h2 {{
      font-size: 11.5pt;
      font-weight: 800;
      color: #1e3a8a;
      background: #f1f5f9;
      border-left: 5px solid #2563eb;
      padding: 4px 10px;
      margin: 14px 0 8px 0;
      page-break-after: avoid;
      break-after: avoid;
    }}

    .print-h3 {{
      font-size: 10.5pt;
      font-weight: 700;
      color: #0f172a;
      margin: 10px 0 6px 0;
      page-break-after: avoid;
      break-after: avoid;
    }}

    p {{
      margin: 5px 0;
    }}

    .print-quote {{
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #64748b;
      border-radius: 4px;
      padding: 8px 12px;
      margin: 8px 0 12px 0;
      font-size: 9.5pt;
      color: #334155;
      line-height: 1.5;
    }}

    .print-details {{
      background: #faf5ff;
      border: 1.5px solid #a855f7;
      border-radius: 6px;
      margin: 10px 0;
      padding: 10px 14px;
    }}

    .print-summary {{
      font-weight: 800;
      color: #6b21a8;
      font-size: 10.5pt;
      margin-bottom: 6px;
      list-style: none;
    }}

    .print-bullet {{
      margin: 4px 0;
      padding-left: 12px;
      text-indent: -12px;
    }}

    .print-check {{
      margin: 6px 0;
      font-size: 10pt;
      background: #fefce8;
      border: 1px dashed #ca8a04;
      padding: 6px 10px;
      border-radius: 4px;
    }}

    .print-hr {{
      border: none;
      border-top: 1px dashed #cbd5e1;
      margin: 14px 0;
    }}

    table.print-table {{
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0 14px 0;
      font-size: 9.5pt;
      line-height: 1.45;
      page-break-inside: avoid;
      break-inside: avoid;
    }}

    table.print-table th, table.print-table td {{
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      vertical-align: top;
    }}

    table.print-table th {{
      background: #f1f5f9;
      color: #1e293b;
      font-weight: 700;
      border-bottom: 2px solid #94a3b8;
    }}

    table.print-table tr:nth-child(even) td {{
      background: #f8fafc;
    }}

    code {{
      font-family: Consolas, Monaco, monospace;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      padding: 2px 5px;
      font-size: 9.5pt;
      border-radius: 3px;
    }}

    .mermaid, pre.mermaid {{
      text-align: center;
      margin: 12px auto;
      background: #ffffff;
      border: none;
      padding: 0;
      font-family: inherit;
      font-size: inherit;
      display: flex;
      justify-content: center;
      page-break-inside: avoid;
      break-inside: avoid;
    }}

    .mermaid svg, pre.mermaid svg {{
      max-height: 280px !important;
      width: auto !important;
      max-width: 100% !important;
    }}
  </style>
</head>
<body>
  <div class="screen-toolbar">
    <div>
      <strong>📄 {title}（通常解説ノート版）</strong>
      <span style="font-size: 12px; color: #94a3b8; margin-left: 10px;">（全 {total_count} 問収録・A4両面印刷最適化）</span>
    </div>
    <button onclick="window.print()">🖨️ 今すぐ印刷 / PDF保存 (Ctrl+P)</button>
  </div>

  <main>
    {content}
  </main>
</body>
</html>
"""


WORKBOOK_HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>{title}</title>
  <style>
    /* ========================================================
       別冊・赤ペン3秒テスト問題集（前半：問題＋記述欄 ／ 後半：解答解説）
       ======================================================== */
    @page {{
      size: A4 portrait;
      margin: 12mm 14mm 12mm 14mm;
      @bottom-right {{
        content: counter(page);
        font-size: 8.5pt;
        color: #64748b;
      }}
    }}

    * {{
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }}

    body {{
      font-family: 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Noto Sans JP', sans-serif;
      font-size: 10pt;
      line-height: 1.55;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }}

    .screen-toolbar {{
      background: #3b0764;
      color: #ffffff;
      padding: 12px 20px;
      position: sticky;
      top: 0;
      z-index: 999;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.15);
    }}

    .screen-toolbar button {{
      background: #fde047;
      color: #0f172a;
      border: none;
      padding: 8px 18px;
      font-size: 14px;
      font-weight: 800;
      border-radius: 6px;
      cursor: pointer;
    }}

    @media print {{
      .screen-toolbar {{
        display: none !important;
      }}
    }}

    .section-cover-banner {{
      border: 2.5px solid #0f172a;
      background: #f8fafc;
      padding: 10px 14px;
      border-radius: 8px;
      margin-bottom: 14px;
    }}

    .section-cover-title {{
      font-size: 13pt;
      font-weight: 800;
      margin: 0 0 4px 0;
    }}

    .section-cover-sub {{
      font-size: 9pt;
      color: #334155;
      margin: 0;
    }}

    /* 問題カード（1ページに2問程度収まるコンパクト設計、途中で切れないようbreak-inside: avoid） */
    .wb-question-card {{
      border: 2px solid #0f172a;
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 14px;
      page-break-inside: avoid;
      break-inside: avoid;
    }}

    .wb-q-header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid #cbd5e1;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }}

    .wb-q-num {{
      font-size: 11pt;
      font-weight: 800;
      background: #0f172a;
      color: #ffffff;
      padding: 2px 9px;
      border-radius: 4px;
    }}

    .wb-q-meta {{
      font-size: 9pt;
      font-weight: 700;
      color: #475569;
    }}

    .wb-self-check {{
      font-size: 8.5pt;
      font-weight: 700;
      border: 1px solid #94a3b8;
      padding: 2px 8px;
      border-radius: 4px;
      background: #f8fafc;
    }}

    .wb-q-body p {{
      margin: 4px 0 8px 0;
      font-weight: 600;
    }}

    .wb-q-body .print-bullet {{
      margin: 4px 0;
      padding-left: 14px;
      text-indent: -14px;
    }}

    /* 赤ペン3秒テスト記述欄 */
    .wb-recall-box {{
      margin-top: 10px;
      padding: 8px 10px;
      background: #fffbeb;
      border: 1.5px dashed #d97706;
      border-radius: 6px;
      font-size: 8.8pt;
    }}

    .wb-recall-grid {{
      display: grid;
      grid-template-columns: 95px 1fr;
      gap: 6px;
      align-items: center;
    }}

    .wb-answer-circle {{
      border: 1.5px solid #0f172a;
      background: #ffffff;
      border-radius: 6px;
      padding: 6px;
      text-align: center;
      font-weight: 800;
      height: 52px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }}

    .wb-memo-lines {{
      display: flex;
      flex-direction: column;
      gap: 6px;
    }}

    .wb-memo-line {{
      border-bottom: 1px dotted #94a3b8;
      padding-bottom: 3px;
      color: #475569;
      font-weight: 700;
    }}

    table.print-table {{
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      font-size: 8.5pt;
      line-height: 1.35;
      page-break-inside: avoid;
      break-inside: avoid;
    }}

    table.print-table th, table.print-table td {{
      border: 1px solid #cbd5e1;
      padding: 4px 8px;
      vertical-align: top;
    }}

    table.print-table th {{
      background: #f1f5f9;
      color: #1e293b;
      font-weight: 700;
    }}

    table.print-table tr:nth-child(even) td {{
      background: #f8fafc;
    }}

    /* 巻末・解答解説セクション（改ページして開始） */
    .wb-answers-section {{
      page-break-before: always;
      break-before: page;
    }}

    .wb-answer-card {{
      border: 1.5px solid #cbd5e1;
      border-left: 5px solid #16a34a;
      border-radius: 6px;
      padding: 9px 12px;
      margin-bottom: 10px;
      page-break-inside: avoid;
      break-inside: avoid;
      background: #ffffff;
    }}

    .wb-ans-header {{
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      border-bottom: 1px dashed #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 6px;
    }}

    .wb-ans-title {{
      font-size: 10pt;
      font-weight: 800;
      color: #0f172a;
    }}

    .wb-ans-correct {{
      font-size: 9.5pt;
      font-weight: 800;
      color: #15803d;
      background: #dcfce7;
      padding: 2px 8px;
      border-radius: 4px;
      margin: 4px 0;
    }}

    .wb-ans-point {{
      font-size: 9pt;
      margin: 3px 0;
      color: #1e293b;
    }}

    .wb-ans-traps {{
      margin-top: 5px;
      padding-top: 5px;
      border-top: 1px dotted #cbd5e1;
      font-size: 8.8pt;
      color: #334155;
    }}

    .wb-ans-traps .print-bullet {{
      margin: 2px 0;
    }}
  </style>
</head>
<body>
  <div class="screen-toolbar">
    <div>
      <strong>📝 {title}（別冊・白紙テスト問題集 ＋ 巻末解答編）</strong>
      <span style="font-size: 12px; color: #e9d5ff; margin-left: 10px;">（全 {total_count} 問・通常解説ノートとは別ファイル）</span>
    </div>
    <button onclick="window.print()">🖨️ 問題集を印刷 / PDF保存 (Ctrl+P)</button>
  </div>

  <main>
    <!-- 前半：問題編 -->
    <div class="section-cover-banner">
      <div class="section-cover-title">📝 【前半：問題編】 {title} （全 {total_count} 問）</div>
      <p class="section-cover-sub">
        💡 <strong>脳に定着させる赤ペン3秒ルール</strong>：①正解記号を書く前に「どんな日常のたとえ話だったか」をメモ欄に1語で書く → ②残りの選択肢がなぜ×かを1語で書く → ③巻末の解答編で答え合わせ！
      </p>
    </div>

    {questions_html}

    <!-- 後半：解答・解説要約編 -->
    <div class="wb-answers-section">
      <div class="section-cover-banner" style="background: #f0fdf4; border-color: #166534;">
        <div class="section-cover-title">✅ 【巻末：解答・合言葉・ひっかけ理由一覧】 {title}</div>
        <p class="section-cover-sub">
          ※詳しい図解やストーリーを読み直したい問題（🔴要復習）は、通常版解説ノートまたはWebアプリを参照してください。
        </p>
      </div>

      {answers_html}
    </div>
  </main>
</body>
</html>
"""


def build_workbook_html(title, workbook_items):
    """問題集HTML（前半：問題カード一覧、後半：解答一覧）を組み立てる"""
    q_cards = []
    a_cards = []

    for idx, item in enumerate(workbook_items, 1):
        q_card = f"""<div class="wb-question-card" id="wb_q_{idx}">
  <div class="wb-q-header">
    <div>
      <span class="wb-q-num">問 {idx}</span>
      <span class="wb-q-meta" style="margin-left: 8px;">{item['short_theme']} ／ {item['target_exam']}</span>
    </div>
    <div class="wb-self-check">自己判定: 🔴要復習 ・ 🟡あやふや ・ 🟢瞬殺</div>
  </div>
  <div class="wb-q-body">
    {item['question_html']}
  </div>
  <div class="wb-recall-box">
    <div class="wb-recall-grid">
      <div class="wb-answer-circle">
        <span style="font-size: 7.5pt; color: #64748b;">解答欄</span>
        <span style="font-size: 9pt; color: #cbd5e1;">ア・イ・ウ・エ</span>
      </div>
      <div class="wb-memo-lines">
        <div class="wb-memo-line">🔑 たとえ話・合言葉メモ：</div>
        <div class="wb-memo-line">❌ 他選択肢がバツの理由：</div>
      </div>
    </div>
  </div>
</div>"""
        q_cards.append(q_card)

        sec0_line = f'<div class="wb-ans-point"><strong>📌 要約:</strong> {item["sec0_title"]}</div>' if item["sec0_title"] else ''
        sec1_line = f'<div class="wb-ans-point"><strong>💡 たとえ話:</strong> {item["sec1_title"]}</div>' if item["sec1_title"] else ''
        sec2_block = f'<div class="wb-ans-traps">{item["sec2_html"]}</div>' if item["sec2_html"] else ''

        a_card = f"""<div class="wb-answer-card" id="wb_a_{idx}">
  <div class="wb-ans-header">
    <span class="wb-ans-title">問 {idx}：{item['full_title']}</span>
    <span class="wb-q-meta">{item['target_exam']}</span>
  </div>
  <div class="wb-ans-correct">{item['answer_html']}</div>
  {sec0_line}
  {sec1_line}
  {sec2_block}
</div>"""
        a_cards.append(a_card)

    return WORKBOOK_HTML_TEMPLATE.format(
        title=title,
        total_count=len(workbook_items),
        questions_html="\n".join(q_cards),
        answers_html="\n".join(a_cards),
    )


GLOSSARY_HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>{title}</title>
  <style>
    /* ========================================================
       別冊・二つ折り暗記単語帳（左：用語＆チェック欄 ／ 右：一言定義＆日常のたとえ話）
       ======================================================== */
    @page {{
      size: A4 portrait;
      margin: 10mm 12mm 10mm 12mm;
      @bottom-right {{
        content: counter(page);
        font-size: 8.5pt;
        color: #64748b;
      }}
    }}

    * {{
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }}

    body {{
      font-family: 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Noto Sans JP', sans-serif;
      font-size: 9.2pt;
      line-height: 1.45;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }}

    .screen-toolbar {{
      background: #831843;
      color: #ffffff;
      padding: 12px 20px;
      position: sticky;
      top: 0;
      z-index: 999;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.15);
    }}

    .screen-toolbar button {{
      background: #fde047;
      color: #0f172a;
      border: none;
      padding: 8px 18px;
      font-size: 14px;
      font-weight: 800;
      border-radius: 6px;
      cursor: pointer;
    }}

    @media print {{
      .screen-toolbar {{
        display: none !important;
      }}
    }}

    .glossary-banner {{
      border: 2px solid #0f172a;
      background: #fdf2f8;
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 10px;
    }}

    .glossary-banner h1 {{
      font-size: 12pt;
      margin: 0 0 3px 0;
      color: #831843;
    }}

    .glossary-banner p {{
      font-size: 8.5pt;
      margin: 0;
      color: #334155;
    }}

    .glossary-table {{
      width: 100%;
      border-collapse: collapse;
      border: 2px solid #0f172a;
    }}

    .glossary-table th {{
      background: #0f172a;
      color: #ffffff;
      padding: 6px 8px;
      font-size: 8.8pt;
      text-align: left;
      border: 1px solid #0f172a;
    }}

    .glossary-table tr {{
      page-break-inside: avoid;
      break-inside: avoid;
    }}

    .glossary-table td {{
      padding: 6px 8px;
      border-bottom: 1px solid #cbd5e1;
      vertical-align: top;
    }}

    /* 中央の二つ折りガイド線 */
    .col-term {{
      width: 34%;
      background: #f8fafc;
      border-right: 2px dashed #64748b;
    }}

    .col-desc {{
      width: 66%;
      background: #ffffff;
    }}

    .term-name {{
      font-size: 10pt;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 3px;
    }}

    .term-meta {{
      font-size: 7.5pt;
      color: #475569;
      display: flex;
      gap: 6px;
      align-items: center;
      flex-wrap: wrap;
    }}

    .badge-main {{
      background: #fef08a;
      color: #713f12;
      padding: 0 4px;
      border-radius: 3px;
      font-weight: 800;
      border: 1px solid #ca8a04;
    }}

    .badge-sub {{
      background: #e2e8f0;
      color: #334155;
      padding: 0 4px;
      border-radius: 3px;
      font-weight: 700;
    }}

    .check-boxes {{
      font-size: 7.8pt;
      color: #64748b;
      margin-top: 3px;
    }}

    .desc-catch {{
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 2px;
    }}

    .desc-analogy {{
      font-size: 8.5pt;
      color: #1e40af;
    }}
  </style>
</head>
<body>
  <div class="screen-toolbar">
    <div>
      <strong>🗂️ {title}（別冊・二つ折り暗記単語帳）</strong>
      <span style="font-size: 12px; color: #fbcfe8; margin-left: 10px;">（全 {total_count} 語収録・主役用語＋選択肢関連用語）</span>
    </div>
    <button onclick="window.print()">🖨️ 単語帳を印刷 / PDF保存 (Ctrl+P)</button>
  </div>

  <main>
    <div class="glossary-banner">
      <h1>🗂️ {title} （全 {total_count} 語：⭐主役用語 ＋ 🔀選択肢の関連用語）</h1>
      <p>💡 <strong>使い方</strong>：中央の点線（または右半分を紙で隠す）で「左の用語名」だけを見て、「⚡一言定義」と「💡日常のたとえ話」を3秒で言えるかテスト！3回連続で即答できたら □ を塗りつぶしましょう。</p>
    </div>

    <table class="glossary-table">
      <thead>
        <tr>
          <th class="col-term">📌 用語名 ＆ 3回チェック欄 （✂️二つ折り線）</th>
          <th class="col-desc">⚡ 一言定義・合言葉 ／ 💡 日常のたとえ話</th>
        </tr>
      </thead>
      <tbody>
        {rows_html}
      </tbody>
    </table>
  </main>
</body>
</html>
"""


MAIN_TERM_NORMALIZATION = {
    "稼働率とMTBF・MTTR": "MTBF・MTTR・稼働率",
    "プリエンプション方式のタスク管理": "プリエンプション（横取り方式）",
    "プリエンプション方式": "プリエンプション（横取り方式）",
    "SQL外部結合と集約": "LEFT OUTER JOIN（外部結合）と COUNT関数",
    "NOT EXISTS相関副問合せ": "NOT EXISTS（相関副問合せ）",
    "E-R図と外部キー": "E-R図と外部キー（1対多の参照制約）",
    "関係代数の演算": "関係代数（選択σ・射影π・直積・差）",
    "関数従属の導出": "関数従属と推移的関数従属",
    "正規形の判定": "第1正規形・部分関数従属",
    "トランザクションのACID特性": "ACID特性（原子性・一貫性・独立性・耐久性）",
    "3層スキーマ構造と内部設計": "3層スキーマ（外部・概念・内部スキーマ）",
    "3層スキーマ構造": "3層スキーマ（外部・概念・内部スキーマ）",
    "回線伝送効率": "MTU・MSSと回線伝送効率",
    "NAPTの役割": "NAPT（IPマスカレード）",
    "NAPT書き換え": "NAPTのヘッダ変換（送信元IP＋ポート）",
    "多数決方式の伝送誤り率": "多数決方式（FEC：前方誤り訂正）",
    "パケット交換 vs ATM交換": "ATM交換方式（固定長53バイトセル）",
    "TCPコネクション識別": "TCPコネクション識別（4タプル）",
    "IPsecと鍵交換": "IKE（Internet Key Exchange / IPsec鍵交換）",
    "ルート集約（CIDR計算パズル）": "ルート集約（スーパーネット化 / CIDR）",
    "ルート集約（CIDR）": "ルート集約（スーパーネット化 / CIDR）",
    "IPv6アドレス表記ルール": "IPv6アドレス表記（ゼロ圧縮 :: ルール）",
    "IPv6アドレスの省略ルール": "IPv6アドレス表記（ゼロ圧縮 :: ルール）",
    "OSI参照モデルとプロトコル": "OSI参照モデル（7階層と各層プロトコル）",
    "無線LAN規格（11acと周波数帯）": "IEEE 802.11ac（Wi-Fi 5GHz帯規格）",
    "無線LAN（Wi-Fi規格）": "IEEE 802.11ac / CSMA/CA（無線LAN規格）",
    "ARPの要求と応答": "ARP要求（ブロードキャスト）とARP応答（ユニキャスト）",
    "ARPの役割": "ARP（Address Resolution Protocol）",
    "ブロードキャストアドレス計算（/20）": "ブロードキャストアドレスとプレフィックス長（/20）",
    "ルータ越え通信": "デフォルトゲートウェイ（ルータ越えのIP/MAC変化）",
    "CIDRアドレス割り当て": "CIDR（クラスレスアドレッシング / サブネット分割）",
    "DNS逆引き": "DNS逆引き（PTRレコード）",
    "クラスD": "マルチキャストアドレス（クラスD）",
    "セッション乗っ取り対策（再認証）": "セッションハイジャック対策（重要処理前の再認証）",
    "セッション乗っ取り対策": "セッションハイジャック対策（重要処理前の再認証）",
    "TLSクライアント認証の送付順序": "TLSクライアント認証（双方向証明書検証）",
    "情報セキュリティのCIA（完全性）": "完全性（Integrity / 改ざん防止）",
    "クラウド責任共有モデル": "責任共有モデル（IaaS・PaaS・SaaS）",
    "クロスサイトスクリプティング（XSS）対策": "クロスサイトスクリプティング（XSS）とサニタイジング",
    "DNSキャッシュポイズニングの被害": "DNSキャッシュポイズニング（ファーミング誘導）",
    "HTTPSで実現できること": "HTTPS（暗号化・改ざん検知・サーバ認証）",
    "HTTPSの正体": "SSL/TLS（HTTPSの暗号化プロトコル）",
    "SSL/TLSとプロキシ": "SSL/TLS（End-to-End暗号化とプロキシ透過）",
    "無線LANの暗号規格": "WPA2-AES（CCMP / 128ビット共通鍵暗号）",
    "ファイアウォールのルール判定": "パケットフィルタリング（ファーストマッチ原則）",
    "サイバーセキュリティ基本法": "NCO / 旧NISC（内閣サイバーセキュリティセンター）",
    "ログアウト時のセッション対策": "セッションIDのサーバ側無効化（ログアウト処理）",
    "JIS Q 27000の用語定義": "機密性（Confidentiality / JIS Q 27000）",
    "メールの第三者中継（オープンリレー）": "オープンリレー（メール不正第三者中継）",
    "ソフトウェア品質特性 (SQuaRE)": "SQuaRE（ISO/IEC 25010 ソフトウェア品質8特性）",
    "ソフトウェア品質特性（SQuaRE）": "SQuaRE（ISO/IEC 25010 ソフトウェア品質8特性）",
    "要員割り当て最小コストパズル": "アサインメント問題（要員割当とコスト最小化）",
    "プロジェクト要員割り当てパズル": "アサインメント問題（要員割当とコスト最小化）",
    "サービスレベル管理 (SLM) と SLA": "SLA（サービスレベル合意書）と SLM",
    "サービスレベル管理（SLM）": "SLA（サービスレベル合意書）と SLM",
    "規程の承認者と3者の力関係": "システム監査規程（最高経営者による承認・独立性）",
    "システム監査の人間関係": "システム監査の独立性（自己監査の禁止）",
    "可用性とセキュリティ3大要件 (CIA)": "可用性（Availability / システム二重化）",
    "システム監査の「可用性」": "可用性（Availability / システム二重化）",
    "投資評価の回収期間法 (PBP)": "PBP（回収期間法 / Payback Period）",
    "バリューチェーンと4大フレームワーク": "バリューチェーン（主活動5つ・支援活動4つ）",
    "バリューチェーンと経営フレームワーク": "バリューチェーン（主活動5つ・支援活動4つ）",
    "新QC7つ道具「連関図」": "連関図（新QC七つ道具・因果関係の解明）",
    "技適マークと各国の認証マーク": "技適マーク（技術基準適合証明）",
    "技適マークと認証規格": "技適マーク（技術基準適合証明）",
    "請負・派遣・出向の契約形態": "請負・派遣・出向と偽装請負（指揮命令権）",
    "労働形態の三角関係": "請負・派遣・出向と偽装請負（指揮命令権）",
    "個人情報保護法": "要配慮個人情報（個人情報保護法）",
}

SUPPLEMENTAL_TERMS_BY_FILENAME = {
    "os-preemption-task-scheduling.md": [
        {"term": "実行状態（Run）", "catchphrase": "現在CPUの権利を握ってプログラムを実行している状態。", "analogy": "市役所の窓口の椅子に座って手続きしてもらっている状態"},
        {"term": "実行可能状態（Ready）", "catchphrase": "いつでも実行できる準備が整い、CPUの順番待ち行列に並んでいる状態。", "analogy": "書類を全部持って窓口の後ろの待機イスに並んでいる状態"},
        {"term": "待ち状態（Wait）", "catchphrase": "入出力（I/O）完了などを待っており、CPUが空いてもすぐには動けない状態（自発的解放で遷移）。", "analogy": "「住民票のコピーを取ってきます」と自分から窓口の席を外した状態"},
        {"term": "ディスパッチャ", "catchphrase": "実行可能状態（Ready）のタスクの中から次に実行するタスクを選び、CPU使用権を割り当てるOS機能。", "analogy": "窓口で「次の方どうぞ！」と席へ案内する進行係"},
    ],
    "sec-ipsec-ah-esp.md": [
        {"term": "AH（Authentication Header）", "catchphrase": "IPsecにおいてデータの「完全性（改ざん検知）」と「送信元認証」のみを行い、暗号化は行わないプロトコル。", "analogy": "中身が透けて見える透明ケースに「改ざん防止の封蝋スタンプ」だけ押した宅配便"},
        {"term": "ESP（Encapsulating Security Payload）", "catchphrase": "IPsecにおいて「暗号化（機密性）」と「認証・改ざん検知（完全性）」の両方を提供するプロトコル。", "analogy": "外から中身が見えない頑丈な黒い金庫に封蝋も付けた万能宅配便"},
    ],
    "strategy-investment-pbp-payback-period.md": [
        {"term": "ROI（投資利益率）", "catchphrase": "Return On Investment。投資額に対してどれだけ利益が出たかの「割合（％）」を測る指標（利益÷投資額）。", "analogy": "100万円のマシンで年間25万円儲かるなら「利回り25%！」と見る指標"},
        {"term": "NPV（正味現在価値法）", "catchphrase": "Net Present Value。将来得られる現金を現在の価値に割り引いて、投資額を引いたプラス額を測る手法。", "analogy": "将来の100万円を今の価値に換算して「結局いくら得するの？」を計算する方法"},
        {"term": "IRR（内部収益率法）", "catchphrase": "Internal Rate of Return。投資の正味現在価値（NPV）がゼロになる割引率を求め、資本コストと比較する手法。", "analogy": "この投資プロジェクト自体の「実質年利は何％に相当するか」を算出する指標"},
    ],
    "strategy-value-chain-frameworks.md": [
        {"term": "SWOT分析", "catchphrase": "自社の内部環境（強みStrengths・弱みWeaknesses）と外部環境（機会Opportunities・脅威Threats）を4象限で整理する手法。", "analogy": "自分の体力（内部）と今日の天気（外部）を4つの箱に書き出して作戦を立てるシート"},
        {"term": "BSC（バランススコアカード）", "catchphrase": "「財務・顧客・内部ビジネスプロセス・学習と成長」の4つの視点から戦略目標とKPIを設定・評価する経営管理手法。", "analogy": "売上だけでなく「客の笑顔・店の仕組み・店員の成長」の4科目でつける通知表"},
        {"term": "ファイブフォース分析（5つの力）", "catchphrase": "マイケル・ポーターが提唱した、業界の収益性を決める「5つの競争要因（新規参入・代替品・買い手・売り手・既存競合）」の分析手法。", "analogy": "自分の店を取り囲む「5方向のプレッシャー（ライバルや客の強さ）」を測るレーダー"},
    ],
    "law-sensitive-personal-information.md": [
        {"term": "匿名加工情報", "catchphrase": "特定の個人を識別できないように加工し、かつ「元の個人情報に復元できない」ようにした情報（本人の同意なく第三者提供可能）。", "analogy": "モザイクを完全に焼き付けて、二度と元の顔に戻せないようにした統計データ"},
        {"term": "仮名加工情報", "catchphrase": "氏名などを削除して単体では個人を特定できないように加工した情報（社内でのAI分析・統計分析に利用しやすい）。", "analogy": "社内カルテの名前を「患者ID: 001」に置き換えて、社内研究に使いやすくしたデータ"},
    ],
    "law-labor-contract-dispatch-subcontract.md": [
        {"term": "偽装請負", "catchphrase": "契約上は「請負（成果物の完成責任）」であるにもかかわらず、発注者（客先）が労働者に直接「指揮命令」を行ってしまう違法状態。", "analogy": "外注のパン職人に、発注元の店長が厨房に入って「その粉を混ぜろ」と直接命令してしまうルール違反"},
    ],
}


def load_readme_summaries():
    """docs/README.md の目次テーブルから、ファイル名ごとの合言葉と日常のたとえ話マップを取得する"""
    readme_path = os.path.join(DOCS_DIR, "README.md")
    result = {}
    if not os.path.exists(readme_path):
        return result
    with open(readme_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line.startswith("| ["):
                continue
            cols = [c.strip() for c in line.split("|")]
            if len(cols) < 4:
                continue
            fm = re.match(r'^\[([^\]]+\.md)\]', cols[1])
            if not fm:
                continue
            fname = fm.group(1).strip()
            tm = re.search(r'\*\*([^*]+)\*\*', cols[2])
            theme = tm.group(1).strip() if tm else ""
            parts = [re.sub(r'\*\*', '', p).strip() for p in re.split(r'<br\s*/?>', cols[3], flags=re.IGNORECASE)]
            if len(parts) >= 2:
                catch = re.sub(r'^[『「]|[』」]$', '', parts[0]).strip()
                analogy = " / ".join(parts[1:]).strip()
            elif len(parts) == 1:
                catch = re.sub(r'^[『「]|[』」]$', '', parts[0]).strip()
                analogy = catch
            else:
                catch, analogy = "", ""
            result[fname] = {"theme": theme, "catchphrase": catch, "analogy": analogy}
    return result


def normalize_term_key(term):
    """重複排除用の正規化キーを生成する（カッコ内の補足や末尾の「トポロジ」等を揃えて同一用語の重複を防ぐ）"""
    base = re.split(r'[（(]', term)[0]
    base = re.sub(r'トポロジ$', '', base)
    base = re.sub(r'^NCO\s*/\s*旧NISC$', 'nco', base)
    base = re.sub(r'^NCO$', 'nco', base)
    base = re.sub(r'^静的NAT$', 'nat', base)
    return base.strip().lower()


def is_genuine_technical_term(term):
    """文字列が文章や選択肢の文面ではなく、本物の専門用語・名詞であるかを厳格に判定する"""
    t = term.strip()
    if len(t) < 2 or len(t) > 26:
        return False
    if re.search(r'[…‥=＝<>%％`＄$\\！!？?〜～，,★☆「」『』]', t):
        return False
    if re.match(r'^\d+(\.\d+)+(/\d+)?$', t):
        return False
    if re.match(r'^\d+\s*の作り方$', t):
        return False
    if re.match(r'^(WPA|WPA2)\s*/', t):
        return False
    if re.match(r'^([A-Z]さん|[A-Z]社|タスク[A-Z]|サイト[A-Z]|ノード[A-Z]|長さ|役割|特徴|正解|不正解|理由|注意|手順|場合|主活動.*|支援活動.*|低遅延|通信量の削減|明示的ニーズ|暗黙のニーズ|のひっかけ|Edge.*)$', t):
        return False

    sentence_pattern = re.compile(
        r'(が|を|には|は|へ|で|から|より|まで|について|に関して|における|によって|に対する|による|ための|として|であり|である|なった|なる|する|した|して|れる|られる|せる|させる|ある|ない|できる|おく|くる|いく|みる|ため|とき|こと|もの|どれか|作り方|ひっかけ|引っ掛け|選び方|見分け方|持たせる|割り当てる|書き換え|確認する|防止|軽減|管理|設定|検査|検知|コピー|盗聴|改ざん|保護|暗号化|無効化|再発行|普通|昔ながら|自社|受信者|端末\d+|最大\d+|\d+ビットの|可変長・|固定長・|通常の|指示して|電波|の取得|の役割|の正体|の仕組み|の標準|振り分け|名前解決|ガードマン)'
    )
    if sentence_pattern.search(t):
        return False
    return True


def rescue_term_from_choice_explanation(left_text, right_text):
    """選択肢解説文（「→ ICMPの説明です」「→ メールサーバの『MTA』の役割です」等）から本物の専門用語と定義を逆引き救出する"""
    clean_left = re.sub(r'^[アイウエ][：:\s]+', '', left_text)
    clean_left = re.sub(r'[…‥]+$', '', clean_left).strip()
    clean_right = right_text.replace('**', '').strip()

    mq = re.search(r'「([A-Za-z0-9ァ-ヶー一-龠（）()／/・\s\-+]{2,26}?)」の(?:説明|役割|特徴|定義)です', clean_right)
    if mq:
        cand = mq.group(1).strip()
        if is_genuine_technical_term(cand) and len(clean_left) >= 4:
            return {"term": cand, "definition": f"{clean_left}（{re.sub(r'^(?:これは)?', '', clean_right)}）"}

    m1 = re.match(r'^(?:これは)?「?([A-Za-z0-9ァ-ヶー一-龠（）()／/・\s\-+]{2,24}?)」?(?:など)?の(?:説明|役割|特徴|定義)です', clean_right)
    if m1:
        cand = re.sub(r'^(それぞれ|一般的な|通常の)\s*', '', m1.group(1))
        cand = re.sub(r'や', ' / ', cand).strip()
        if is_genuine_technical_term(cand) and len(clean_left) >= 4:
            return {"term": cand, "definition": f"{clean_left}（{re.sub(r'^(?:これは)?', '', clean_right)}）"}

    m2 = re.search(r'「([A-Za-z0-9ァ-ヶー一-龠（）()／/・\-+]{2,20})」です', clean_right)
    if m2:
        cand = m2.group(1).strip()
        if is_genuine_technical_term(cand):
            return {"term": cand, "definition": clean_right}

    return None


def extract_glossary_items_from_md(md_content, cat_label, fname, readme_map):
    """1つのノートから100%純粋な専門用語（主役用語＋選択肢の重要関連用語）のみを抽出する"""
    if not re.search(r'<details>[\s\S]*?</details>', md_content):
        return []

    items = []
    readme_info = readme_map.get(fname, {})
    title_match = re.search(r'^#\s+(.+)$', md_content, flags=re.MULTILINE)
    full_title = title_match.group(1).strip() if title_match else "用語"
    title_prefix = re.split(r'[：:]', full_title)[0].strip()

    raw_theme = readme_info.get("theme") or title_prefix
    quote_match = re.search(r'「([^」]+)」', full_title)
    if full_title.startswith("タイトル") and quote_match:
        raw_theme = quote_match.group(1).strip()

    main_term = MAIN_TERM_NORMALIZATION.get(raw_theme) or MAIN_TERM_NORMALIZATION.get(title_prefix) or raw_theme

    motto_match = re.search(r'>\s*\*\*『([^』]+)』\*\*', md_content)
    correct_match = re.search(r'\*\*正解:\s*[アイウエ]（([^）]+)）\*\*', md_content)

    if motto_match:
        catchphrase = motto_match.group(1).strip()
    elif readme_info.get("catchphrase"):
        catchphrase = readme_info["catchphrase"]
    elif correct_match:
        catchphrase = correct_match.group(1).strip()
    else:
        catchphrase = full_title

    analogy = readme_info.get("analogy", "")
    if not analogy:
        sec1_match = re.search(r'^##\s*1\.\s*([^\n\r]+)', md_content, flags=re.MULTILINE)
        if sec1_match:
            h_text = sec1_match.group(1)
            h_text = re.sub(r'^なぜそうなるのか？[（(]?', '', h_text)
            h_text = re.sub(r'[）)]$', '', h_text)
            h_text = re.sub(r'^日常のたとえ話[：:]\s*', '', h_text).strip()
            analogy = h_text
    if not analogy or "言葉の理屈" in analogy or "一発暗記" in analogy:
        analogy = catchphrase

    items.append({
        "term": main_term,
        "type": "main",
        "category": cat_label,
        "catchphrase": catchphrase,
        "analogy": analogy,
    })

    # 補足辞書の重要用語を追加
    for sup in SUPPLEMENTAL_TERMS_BY_FILENAME.get(fname, []):
        items.append({
            "term": sup["term"],
            "type": "sub",
            "category": cat_label,
            "catchphrase": sup["catchphrase"],
            "analogy": sup["analogy"],
        })

    # セクション1・2から本物の専門用語のみを厳格抽出
    bullet_pattern = re.compile(
        r'^-\s*\*\*(?:[アイウエ][：:]\s*)?([^*\n\r：:]{2,32}?)\*\*(?:[：:]|\s*→\s*)\s*([^\n\r]+)',
        flags=re.MULTILINE
    )
    for m in bullet_pattern.finditer(md_content):
        raw_left = re.sub(r'^[アイウエ][：:\s]+', '', m.group(1))
        raw_left = re.sub(r'【正解！】|（正解！）|\(正解!\)', '', raw_left).strip()
        raw_right = m.group(2).replace('**', '').replace('$\\rightarrow$', '→').replace('\\rightarrow', '→')
        raw_right = re.sub(r'^→\s*', '', raw_right).replace('【正解！】', '')
        raw_right = re.sub(r'[（(][◯×○✕][）)]', '', raw_right).strip()

        if is_genuine_technical_term(raw_left):
            if len(raw_right) >= 8 and not re.match(r'^(誤り|間違い|不適切|正解)', raw_right):
                clean_name = re.sub(r'（親玉）|（手下）|（ホテル）|（家具.*）|（コンクリ.*）', '', raw_left).strip()
                items.append({
                    "term": clean_name,
                    "type": "sub",
                    "category": cat_label,
                    "catchphrase": raw_right,
                    "analogy": f"「{main_term}」とセットで比較・区別して覚える重要用語",
                })
            continue

        rescued = rescue_term_from_choice_explanation(raw_left, raw_right)
        if rescued:
            items.append({
                "term": rescued["term"],
                "type": "sub",
                "category": cat_label,
                "catchphrase": rescued["definition"],
                "analogy": f"「{main_term}」の過去問選択肢で登場する重要対比用語",
            })

    return items


def build_glossary_html(title, glossary_items):
    """印刷用・二つ折り暗記単語帳HTMLを組み立てる"""
    rows = []
    for item in glossary_items:
        badge = (
            '<span class="badge-main">⭐主役</span>'
            if item["type"] == "main"
            else '<span class="badge-sub">🔀関連</span>'
        )
        row = f"""<tr>
  <td class="col-term">
    <div class="term-name">{item['term']}</div>
    <div class="term-meta">{badge} <span>{item['category']}</span></div>
    <div class="check-boxes">定着チェック: □1回目 ・ □2回目 ・ □瞬殺</div>
  </td>
  <td class="col-desc">
    <div class="desc-catch">⚡ {item['catchphrase']}</div>
    <div class="desc-analogy">💡 {item['analogy']}</div>
  </td>
</tr>"""
        rows.append(row)

    return GLOSSARY_HTML_TEMPLATE.format(
        title=title,
        total_count=len(glossary_items),
        rows_html="\n".join(rows),
    )


def export_printable(target_dir, force_all=False, reset_history=False, workbook_only=False, glossary_only=False):
    """メインエクスポート処理"""
    if reset_history:
        if os.path.exists(HISTORY_FILE):
            os.remove(HISTORY_FILE)
            print("🧹 印刷履歴をリセットしました。")

    history = load_print_history()

    # 対象ファイルの探索
    search_path = os.path.join(target_dir, "**", "*.md")
    all_files = glob.glob(search_path, recursive=True)

    # 対象外ファイル（README.mdなど）の除外
    valid_files = [f for f in all_files if not os.path.basename(f).lower().startswith("readme")]

    if not valid_files:
        print(f"⚠️ 指定されたディレクトリに対象のMarkdownが見つかりませんでした: {target_dir}")
        return

    # 未印刷ファイルの判定（--workbook / --glossary の場合は全対象ファイルを収録）
    files_to_print = []
    skipped_count = 0

    for fpath in sorted(valid_files):
        fname = os.path.basename(fpath)
        rel_path = os.path.relpath(fpath, ROOT_DIR).replace("\\", "/")

        if not force_all and not workbook_only and not glossary_only and rel_path in history:
            skipped_count += 1
            continue
        files_to_print.append((fpath, rel_path, fname))

    if not files_to_print:
        print(f"🎉 新規に追加された問題はありません！すべての問題（{skipped_count}問）は印刷済みです。")
        print("💡 すべて再印刷したい場合は `--all`、問題集は `--workbook`、単語帳は `--glossary` を付けて実行してください。")
        return

    print(f"📋 対象問題数: {len(files_to_print)} 問（スキップ済み: {skipped_count} 問）")

    rendered_sheets = []
    workbook_items = []
    glossary_items = []
    seen_glossary_keys = set()
    readme_map = load_readme_summaries()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    for idx, (fpath, rel_path, fname) in enumerate(files_to_print, 1):
        with open(fpath, "r", encoding="utf-8") as fp:
            md_content = fp.read()

        if not workbook_only and not glossary_only:
            html_body = markdown_to_html_simple(md_content)
            sheet_html = f"""<div class="question-sheet" id="q_{idx}">
  {html_body}
</div>"""
            rendered_sheets.append(sheet_html)

            # 履歴に登録
            history[rel_path] = {
                "printed_at": now_str,
                "filename": fname
            }

        if not glossary_only:
            wb_part = extract_workbook_parts(md_content)
            if wb_part:
                workbook_items.append(wb_part)

        cat_folder = os.path.basename(os.path.dirname(fpath))
        extracted_vocab = extract_glossary_items_from_md(md_content, cat_folder, fname, readme_map)
        for v in extracted_vocab:
            dedup_key = normalize_term_key(v['term'])
            if dedup_key not in seen_glossary_keys:
                seen_glossary_keys.add(dedup_key)
                glossary_items.append(v)

    cat_name = os.path.basename(os.path.normpath(target_dir))
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # 1. 通常解説ノートの出力（workbook_only / glossary_only でない場合）
    if not workbook_only and not glossary_only:
        out_filename = f"print_{cat_name}_{timestamp}.html"
        out_filepath = os.path.join(OUTPUT_DIR, out_filename)

        full_html = HTML_TEMPLATE.format(
            title=f"AP暗記ノート（{cat_name}）",
            total_count=len(files_to_print),
            content="\n\n".join(rendered_sheets)
        )

        with open(out_filepath, "w", encoding="utf-8") as out_fp:
            out_fp.write(full_html)

        try:
            os.makedirs(DIST_OUTPUT_DIR, exist_ok=True)
            dist_filepath = os.path.join(DIST_OUTPUT_DIR, out_filename)
            with open(dist_filepath, "w", encoding="utf-8") as dist_fp:
                dist_fp.write(full_html)
        except Exception:
            pass

        save_print_history(history)
        print("\n" + "=" * 60)
        print("✅ ① 通常版・A4解説ノートHTMLの書き出しが完了しました！")
        print(f"📄 出力先: {out_filepath}")
        print(f"📊 収録数: {len(files_to_print)} 問")
        print("=" * 60)

    # 2. 別ファイルとして「問題集（workbook_*.html）」を出力
    if workbook_items and not glossary_only:
        wb_filename = f"workbook_{cat_name}_{timestamp}.html"
        wb_filepath = os.path.join(OUTPUT_DIR, wb_filename)

        wb_html = build_workbook_html(
            title=f"AP実戦問題集（{cat_name}）",
            workbook_items=workbook_items,
        )

        with open(wb_filepath, "w", encoding="utf-8") as wb_fp:
            wb_fp.write(wb_html)

        try:
            os.makedirs(DIST_OUTPUT_DIR, exist_ok=True)
            dist_wb_path = os.path.join(DIST_OUTPUT_DIR, wb_filename)
            with open(dist_wb_path, "w", encoding="utf-8") as dist_wb_fp:
                dist_wb_fp.write(wb_html)
        except Exception:
            pass

        print("\n" + "=" * 60)
        print("✅ ② 別冊・赤ペンテスト問題集HTML（前半:問題＋メモ欄／巻末:解答一覧）の書き出しが完了しました！")
        print(f"📝 出力先: {wb_filepath}")
        print(f"📊 収録数: {len(workbook_items)} 問（通常形式とは別ファイルで作成）")
        print("=" * 60)

    # 3. 別ファイルとして「暗記単語帳（glossary_*.html）」を出力
    if glossary_items and (glossary_only or not workbook_only):
        gl_filename = f"glossary_{cat_name}_{timestamp}.html"
        gl_filepath = os.path.join(OUTPUT_DIR, gl_filename)

        gl_html = build_glossary_html(
            title=f"AP必須単語帳（{cat_name}）",
            glossary_items=glossary_items,
        )

        with open(gl_filepath, "w", encoding="utf-8") as gl_fp:
            gl_fp.write(gl_html)

        try:
            os.makedirs(DIST_OUTPUT_DIR, exist_ok=True)
            dist_gl_path = os.path.join(DIST_OUTPUT_DIR, gl_filename)
            with open(dist_gl_path, "w", encoding="utf-8") as dist_gl_fp:
                dist_gl_fp.write(gl_html)
        except Exception:
            pass

        print("\n" + "=" * 60)
        print("✅ ③ 別冊・二つ折り暗記単語帳HTML（主役用語＋選択肢の関連用語）の書き出しが完了しました！")
        print(f"🗂️ 出力先: {gl_filepath}")
        print(f"📊 収録数: {len(glossary_items)} 語")
        print("=" * 60 + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="A4両面印刷用一括エクスポートツール（通常解説ノート ＆ 別冊問題集 ＆ 暗記単語帳）")
    parser.add_argument("target_dir", nargs="?", default="docs/inbox/10_ネットワーク/", help="対象のMarkdownディレクトリ")
    parser.add_argument("--all", action="store_true", help="印刷履歴を無視して全問を出力する")
    parser.add_argument("--reset", action="store_true", help="印刷履歴をリセットする")
    parser.add_argument("--workbook", action="store_true", help="印刷履歴を更新せず、別冊の問題集（workbook_*.html）のみを出力する")
    parser.add_argument("--glossary", action="store_true", help="印刷履歴を更新せず、別冊の暗記単語帳（glossary_*.html）のみを出力する")

    args = parser.parse_args()
    export_printable(
        args.target_dir,
        force_all=args.all,
        reset_history=args.reset,
        workbook_only=args.workbook,
        glossary_only=args.glossary,
    )
