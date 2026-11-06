#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/export_offline_app.py
新幹線の移動中など完全オフライン（通信ゼロ）環境で学習するための、
スタンドアロン単一HTMLアプリケーション生成スクリプト。
"""

import os
import sys
import glob
import json
import re

# Windows環境でのUnicode出力対策
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DOCS_DIR = os.path.join(ROOT_DIR, "docs")
NODE_MODULES = os.path.join(ROOT_DIR, "node_modules")
TEMPLATE_PATH = os.path.join(ROOT_DIR, "scripts", "template_offline.html")
OUTPUT_HTML = os.path.join(ROOT_DIR, "offline_app.html")
PRINTABLE_OUTPUT = os.path.join(ROOT_DIR, "printable", "offline_app.html")

def load_all_notes():
    """docs/ 配下のすべてのmarkdownファイルを読み込む"""
    notes = []
    md_files = glob.glob(os.path.join(DOCS_DIR, "**", "*.md"), recursive=True)

    for file_path in md_files:
        rel_path = os.path.relpath(file_path, DOCS_DIR).replace("\\", "/")
        match = re.match(r"^(inbox|ap-prep)/([0-9]{2})_([^/]+)/(.+?\.md)$", rel_path)
        if not match:
            continue

        folder, cat_num, cat_name, filename = match.groups()

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
        except Exception as e:
            print(f"Error reading {file_path}: {e}", file=sys.stderr)
            continue

        # タイトル抽出
        title_match = re.search(r"^#\s+(.+)$", content, flags=re.MULTILINE)
        title = title_match.group(1).strip() if title_match else filename.replace(".md", "")

        # 対象過去問
        exam_match = re.search(r">\s*\*\*対象過去問\*\*:\s*([^\n\r]+)", content)
        target_exam = exam_match.group(1).strip() if exam_match else ""

        # 所要時間
        time_match = re.search(r">\s*\*\*所要時間\*\*:\s*([^\n\r]+)", content)
        reading_time = time_match.group(1).strip() if time_match else "5分"

        notes.append({
            "id": f"{folder}-{cat_num}-{filename}",
            "folder": folder,
            "categoryNumber": cat_num,
            "categoryName": cat_name,
            "filename": filename,
            "title": title,
            "targetExam": target_exam,
            "readingTime": reading_time,
            "content": content
        })

    # 分野番号昇順、タイトル昇順でソート
    notes.sort(key=lambda x: (x["categoryNumber"], x["title"]))
    return notes


def build_offline_html(notes):
    """単一HTMLファイルを生成"""
    marked_path = os.path.join(NODE_MODULES, "marked", "lib", "marked.umd.js")
    mermaid_path = os.path.join(NODE_MODULES, "mermaid", "dist", "mermaid.min.js")

    if not os.path.exists(marked_path):
        raise FileNotFoundError(f"marked not found at {marked_path}")
    if not os.path.exists(mermaid_path):
        raise FileNotFoundError(f"mermaid not found at {mermaid_path}")

    with open(marked_path, "r", encoding="utf-8") as f:
        marked_js = f.read()

    with open(mermaid_path, "r", encoding="utf-8") as f:
        mermaid_js = f.read()

    with open(TEMPLATE_PATH, "r", encoding="utf-8") as f:
        template = f.read()

    notes_json = json.dumps(notes, ensure_ascii=False).replace("<", "\\u003c")

    # プレースホルダーの置換
    html_content = template.replace("/* __MARKED_JS__ */", marked_js)
    html_content = html_content.replace("/* __MERMAID_JS__ */", mermaid_js)
    html_content = html_content.replace("/* __NOTES_JSON__ */", notes_json)

    return html_content

def main():
    print("=== オフライン用単一HTMLアプリ生成スクリプト ===")
    notes = load_all_notes()
    print(f"✓ 読み込み完了: {len(notes)} 件のノート")

    html = build_offline_html(notes)

    os.makedirs(os.path.dirname(PRINTABLE_OUTPUT), exist_ok=True)

    with open(OUTPUT_HTML, "w", encoding="utf-8") as f:
        f.write(html)
    size_mb = len(html.encode('utf-8')) / 1024 / 1024
    print(f"✓ 生成完了: {OUTPUT_HTML} ({size_mb:.2f} MB)")

    with open(PRINTABLE_OUTPUT, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"✓ コピー作成: {PRINTABLE_OUTPUT}")

if __name__ == "__main__":
    main()
