#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/export_printable.py
指定した分野フォルダ（または全inbox）の解説Markdownを、
A5両面印刷（またはPDF化）に最適化された単一HTMLファイルとして一括出力するツール。

【特徴】
1. 重複印刷防止:
   印刷履歴（docs/.print_history.json）を自動記録し、
   次回以降は「新しく追加された未印刷の問題のみ」を差分出力します。
2. A5両面印刷に最適化:
   - 1問ごとに改ページ（break-before: page）
   - Mermaid図の自動レンダリング
   - 正解（<details>）の自動展開
   - 参考書クオリティの洗練された組版デザイン（フォント・余白調整）
3. 全件再出力オプション:
   復習用に全問題を再印刷したい場合は `--all` を指定。

使用例:
  # ネットワーク分野の未印刷問題だけをA5印刷用に一括出力（差分出力）
  python scripts/export_printable.py docs/inbox/10_ネットワーク/

  # 履歴を無視して全問を一括出力（総復習・再印刷用）
  python scripts/export_printable.py docs/inbox/10_ネットワーク/ --all

  # 全分野の未印刷分をまとめて出力
  python scripts/export_printable.py docs/inbox/
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
OUTPUT_DIR = os.path.join(ROOT_DIR, "dist", "printable")


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


def markdown_to_html_simple(md_text):
    """
    Python標準機能で簡易Markdownパース（A5印刷用HTMLへの変換）
    """
    html = md_text

    # 1. Mermaidコードブロックの保護（divプレースホルダーにしてpタグ混入を防止）
    mermaid_blocks = []
    def save_mermaid(match):
        mermaid_blocks.append(match.group(1).strip())
        return f'<div class="mermaid-placeholder" data-index="{len(mermaid_blocks)-1}"></div>'

    html = re.sub(r'```mermaid\s*\n(.*?)\n```', save_mermaid, html, flags=re.DOTALL)

    # 2. その他コードブロック
    html = re.sub(r'```[a-zA-Z]*\s*\n(.*?)\n```', r'<pre><code>\1</code></pre>', html, flags=re.DOTALL)
    html = re.sub(r'`([^`]+)`', r'<code>\1</code>', html)

    # 3. details / summary の処理（印刷用なので常に open を強制）
    html = re.sub(r'<details>', r'<details open class="print-details">', html)
    html = re.sub(r'<summary>(.*?)</summary>', r'<summary class="print-summary">\1</summary>', html)

    # 4. 見出し
    html = re.sub(r'^# (.*?)$', r'<h1 class="print-h1">\1</h1>', html, flags=re.MULTILINE)
    html = re.sub(r'^## (.*?)$', r'<h2 class="print-h2">\1</h2>', html, flags=re.MULTILINE)
    html = re.sub(r'^### (.*?)$', r'<h3 class="print-h3">\1</h3>', html, flags=re.MULTILINE)

    # 5. 強調
    html = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', html)
    html = re.sub(r'\*(.*?)\*', r'<em>\1</em>', html)

    # 6. 引用ブロック
    def replace_quote(match):
        content = match.group(0)
        lines = [re.sub(r'^>\s?', '', l) for l in content.splitlines()]
        return f'<blockquote class="print-quote">{"<br>".join(lines)}</blockquote>'

    html = re.sub(r'(?:^>.*(?:\n|$))+', replace_quote, html, flags=re.MULTILINE)

    # 7. リスト
    html = re.sub(r'^- \[ \] \*\*(.*?)\*\*', r'<div class="print-check">□ <strong>\1</strong></div>', html, flags=re.MULTILINE)
    html = re.sub(r'^- \*\*(.*?)\*\*', r'<div class="print-bullet">• <strong>\1</strong></div>', html, flags=re.MULTILINE)
    html = re.sub(r'^- (.*?)$', r'<div class="print-bullet">• \1</div>', html, flags=re.MULTILINE)

    # 8. 水平線
    html = re.sub(r'^---$', r'<hr class="print-hr">', html, flags=re.MULTILINE)

    # 段落（改行）
    paragraphs = html.split("\n\n")
    processed = []
    for p in paragraphs:
        p_strip = p.strip()
        if not p_strip:
            continue
        if p_strip.startswith("<h") or p_strip.startswith("<div") or p_strip.startswith("<block") or p_strip.startswith("<hr") or p_strip.startswith("<pre") or p_strip.startswith("<details"):
            processed.append(p_strip)
        else:
            p_br = p_strip.replace("\n", "<br>")
            processed.append(f"<p>{p_br}</p>")

    html = "\n".join(processed)

    # 9. Mermaidの復元（矢印構文やタグを破壊しないようエスケープせずpre.mermaidで挿入）
    for i, code in enumerate(mermaid_blocks):
        html = html.replace(
            f'<div class="mermaid-placeholder" data-index="{i}"></div>',
            f'<pre class="mermaid">\n{code}\n</pre>'
        )

    return html


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
       A5用紙・両面印刷（製本）専用組版スタイル
       ======================================================== */
    @page {{
      size: A5 portrait; /* A5縦（148mm × 210mm） */
      margin: 12mm 10mm 12mm 10mm; /* 上下12mm、左右10mm */
      @bottom-right {{
        content: counter(page);
        font-size: 8pt;
        color: #666;
      }}
    }}

    @page :left {{
      margin-left: 8mm;
      margin-right: 12mm; /* 偶数ページのとじしろ配慮 */
    }}

    @page :right {{
      margin-left: 12mm; /* 奇数ページのとじしろ配慮 */
      margin-right: 8mm;
    }}

    * {{
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }}

    body {{
      font-family: 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Noto Sans JP', sans-serif;
      font-size: 9.5pt;
      line-height: 1.55;
      color: #111827;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }}

    /* 印刷ツールバー（画面表示時のみ） */
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

    /* 1問ごとのカード区切り（改ページ） */
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

    /* 見出し */
    .print-h1 {{
      font-size: 12.5pt;
      font-weight: 800;
      color: #0f172a;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 4px;
      margin: 0 0 8px 0;
      line-height: 1.35;
    }}

    .print-h2 {{
      font-size: 10.5pt;
      font-weight: 800;
      color: #1e3a8a;
      background: #f1f5f9;
      border-left: 4px solid #2563eb;
      padding: 3px 8px;
      margin: 12px 0 6px 0;
      page-break-after: avoid;
      break-after: avoid;
    }}

    .print-h3 {{
      font-size: 9.5pt;
      font-weight: 700;
      color: #0f172a;
      margin: 8px 0 4px 0;
      page-break-after: avoid;
      break-after: avoid;
    }}

    p {{
      margin: 4px 0;
    }}

    /* 引用・メタ情報 */
    .print-quote {{
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 3.5px solid #64748b;
      border-radius: 4px;
      padding: 6px 10px;
      margin: 6px 0 10px 0;
      font-size: 8.5pt;
      color: #334155;
      line-height: 1.45;
    }}

    /* 正解折りたたみ（印刷時は自動展開） */
    .print-details {{
      background: #faf5ff;
      border: 1.5px solid #a855f7;
      border-radius: 6px;
      margin: 8px 0;
      padding: 8px 12px;
    }}

    .print-summary {{
      font-weight: 800;
      color: #6b21a8;
      font-size: 9.5pt;
      margin-bottom: 4px;
      list-style: none;
    }}

    /* リスト要素 */
    .print-bullet {{
      margin: 3px 0;
      padding-left: 10px;
      text-indent: -10px;
    }}

    .print-check {{
      margin: 4px 0;
      font-size: 9pt;
      background: #fefce8;
      border: 1px dashed #ca8a04;
      padding: 4px 8px;
      border-radius: 4px;
    }}

    /* 水平線 */
    .print-hr {{
      border: none;
      border-top: 1px dashed #cbd5e1;
      margin: 10px 0;
    }}

    /* コード・強調 */
    code {{
      font-family: Consolas, Monaco, monospace;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      padding: 1px 4px;
      font-size: 8.5pt;
      border-radius: 3px;
    }}

    /* Mermaid図 */
    .mermaid, pre.mermaid {{
      text-align: center;
      margin: 8px auto;
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
      max-height: 230px !important;
      width: auto !important;
      max-width: 100% !important;
    }}
  </style>
</head>
<body>
  <div class="screen-toolbar">
    <div>
      <strong>📄 {title}</strong>
      <span style="font-size: 12px; color: #94a3b8; margin-left: 10px;">（全 {total_count} 問収録・A5両面印刷最適化）</span>
    </div>
    <button onclick="window.print()">🖨️ 今すぐ印刷 / PDF保存 (Ctrl+P)</button>
  </div>

  <main>
    {content}
  </main>
</body>
</html>
"""


def export_printable(target_dir, force_all=False, reset_history=False):
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

    # 未印刷ファイルの判定
    files_to_print = []
    skipped_count = 0

    for fpath in sorted(valid_files):
        fname = os.path.basename(fpath)
        rel_path = os.path.relpath(fpath, ROOT_DIR).replace("\\", "/")

        if not force_all and rel_path in history:
            skipped_count += 1
            continue
        files_to_print.append((fpath, rel_path, fname))

    if not files_to_print:
        print(f"🎉 新規に追加された問題はありません！すべての問題（{skipped_count}問）は印刷済みです。")
        print("💡 すべて再印刷したい場合は `--all` オプションを付けて実行してください。")
        return

    print(f"📋 対象問題数: {len(files_to_print)} 問（スキップ済み: {skipped_count} 問）")

    # 各ノートのHTML変換
    rendered_sheets = []
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    for idx, (fpath, rel_path, fname) in enumerate(files_to_print, 1):
        with open(fpath, "r", encoding="utf-8") as fp:
            md_content = fp.read()

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

    # タイトルと出力先決定
    cat_name = os.path.basename(os.path.normpath(target_dir))
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    out_filename = f"print_{cat_name}_{timestamp}.html"
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    out_filepath = os.path.join(OUTPUT_DIR, out_filename)

    full_html = HTML_TEMPLATE.format(
        title=f"AP暗記ノート（{cat_name}）",
        total_count=len(files_to_print),
        content="\n\n".join(rendered_sheets)
    )

    with open(out_filepath, "w", encoding="utf-8") as out_fp:
        out_fp.write(full_html)

    # 履歴の保存
    save_print_history(history)

    print("\n" + "=" * 60)
    print("✅ A5印刷用HTMLの書き出しが完了しました！")
    print(f"📄 出力先: {out_filepath}")
    print(f"📊 収録数: {len(files_to_print)} 問（重複なし）")
    print("=" * 60)
    print("\n👉 ブラウザでこのファイルを開き、Ctrl + P を押すだけで")
    print("   用紙サイズ「A5」、両面印刷（長辺とじ）で美しく印刷・PDF保存できます！\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="A5両面印刷用一括エクスポートツール")
    parser.add_argument("target_dir", nargs="?", default="docs/inbox/10_ネットワーク/", help="対象のMarkdownディレクトリ")
    parser.add_argument("--all", action="store_true", help="印刷履歴を無視して全問を出力する")
    parser.add_argument("--reset", action="store_true", help="印刷履歴をリセットする")

    args = parser.parse_args()
    export_printable(args.target_dir, force_all=args.all, reset_history=args.reset)
