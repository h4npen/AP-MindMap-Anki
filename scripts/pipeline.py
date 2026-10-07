#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/pipeline.py
過去問道場CSVや問題データから、解説ノートの自動生成・目次更新・ビルド・プッシュまでを
一気通貫で行うワンコマンド自動化パイプライン。

使用例:
  python scripts/pipeline.py docs/inputs/report202610071124.csv
  python scripts/pipeline.py docs/inputs/report202610071124.csv --no-push
  python scripts/pipeline.py docs/inputs/report202610071124.csv --dry-run
"""

import os
import sys
import csv
import re
import argparse
import subprocess
import urllib.request
from bs4 import BeautifulSoup

# Windows環境でのUnicode出力対策
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


# リポジトリルートパスの取得
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
INBOX_DIR = os.path.join(ROOT_DIR, "docs", "inbox")
DOCS_README = os.path.join(ROOT_DIR, "docs", "README.md")

# 分野ディレクトリのマッピング
CATEGORY_DIR_MAP = {
    "システム構成要素": "04_システム構成要素",
    "ソフトウェア": "05_ソフトウェア",
    "データベース": "09_データベース",
    "ネットワーク": "10_ネットワーク",
    "セキュリティ": "11_セキュリティ",
    "システム開発技術": "12_システム開発技術",
    "ソフトウェア開発管理技術": "13_ソフトウェア開発管理技術",
    "プロジェクトマネジメント": "14_プロジェクトマネジメント",
    "サービスマネジメント": "15_サービスマネジメント",
    "システム監査": "16_システム監査",
    "システム企画": "17_システム企画",
    "経営戦略マネジメント": "19_経営戦略マネジメント",
    "ビジネスインダストリ": "21_ビジネスインダストリ",
    "企業活動": "22_企業活動",
    "法務": "23_法務"
}

KANA_MAP = {'ア': 'a', 'イ': 'i', 'ウ': 'u', 'エ': 'e'}
REV_KANA_MAP = {'a': 'ア', 'i': 'イ', 'u': 'ウ', 'e': 'エ'}


def load_csv(csv_path):
    """CSVファイルを読み込み、行データを返す"""
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"CSV file not found: {csv_path}")

    encodings = ["shift_jis", "cp932", "utf-8", "utf-8-sig"]
    for enc in encodings:
        try:
            with open(csv_path, "r", encoding=enc) as f:
                reader = csv.reader(f)
                rows = list(reader)
                if rows:
                    return rows
        except (UnicodeDecodeError, Exception):
            continue
    raise ValueError(f"Failed to read CSV with supported encodings: {csv_path}")


def parse_questions_from_csv(rows, include_unanswered=True, include_correct=False):
    """
    過去問道場の成績CSV行から対象問題を抽出する。
    フォーマット例: No., 正誤, 分野名, 大分類, 中分類, 出典, 学習日
    出典列例: =HYPERLINK("https://www.ap-siken.com/kakomon/23_toku/q37.html","平成23年特別 問37")
    """
    questions = []
    header = rows[0]

    for r in rows[1:]:
        if len(r) < 6:
            continue
        no_str = r[0].strip()
        result = r[1].strip()
        cat = r[4].strip() if len(r) > 4 else (r[2].strip() if len(r) > 2 else "")
        source_col = r[5].strip()

        # 出典列からURLとタイトルを抽出
        url = ""
        title = ""
        m = re.search(r'HYPERLINK\("([^"]+)",\s*"([^"]+)"\)', source_col, re.IGNORECASE)
        if m:
            url = m.group(1).strip()
            title = m.group(2).strip()
        elif source_col.startswith("http"):
            url = source_col
            title = f"問題 {no_str}"
        else:
            title = source_col

        # 抽出条件の判定
        is_wrong = result in ["×", "不正解", "0"]
        is_unanswered = result in ["－", "-", "未回答", ""]
        is_correct = result in ["○", "正解", "1"]

        if is_wrong or (include_unanswered and is_unanswered) or (include_correct and is_correct):
            questions.append({
                "no": int(no_str) if no_str.isdigit() else len(questions) + 1,
                "result": result,
                "title": title,
                "category": cat,
                "url": url
            })

    return questions



def scrape_question(url):
    """過去問道場のページから問題文、選択肢、解答、解説を取得"""
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    html = urllib.request.urlopen(req, timeout=15).read().decode("utf-8", errors="ignore")
    soup = BeautifulSoup(html, "html.parser")

    mondai_div = soup.find("div", id="mondai")
    mondai_text = mondai_div.get_text("\n", strip=True) if mondai_div else ""

    # 選択肢の取得
    options = {"a": "", "i": "", "u": "", "e": ""}
    select_ul = soup.find("ul", class_="selectList")
    if select_ul:
        for li in select_ul.find_all("li"):
            full_txt = li.get_text(" ", strip=True)
            for k, kana in KANA_MAP.items():
                if full_txt.startswith(kana):
                    options[k] = full_txt[len(kana):].strip()

    # 正解の取得
    ans_span = soup.find("span", id="answerChar")
    answer = ans_span.get_text(strip=True) if ans_span else ""

    # 解説の取得
    kaisetsu_div = soup.find("div", id="kaisetsu")
    kaisetsu_text = kaisetsu_div.get_text("\n", strip=True) if kaisetsu_div else ""

    # 画像選択肢などでテキストが空の場合、解説から抽出を試みる
    if not options["a"] and kaisetsu_text:
        for kana, k in KANA_MAP.items():
            m = re.search(rf"[・\-\*]?\s*{kana}[:：]\s*(.*?)(?=\n[・\-\*]?\s*[アイウエ][:：]|\n\n|\Z)", kaisetsu_text, re.DOTALL)
            if m:
                # 最初の1行または要約
                line = m.group(1).strip().splitlines()[0]
                options[k] = line[:80]

    return {
        "mondai": mondai_text,
        "options": options,
        "answer": answer,
        "kaisetsu": kaisetsu_text
    }


def find_existing_note(url, title):
    """既に作成済みのノートが存在するか検索（docs/README.mdおよび各ファイル）"""
    # 1. docs/README.md にURLまたはタイトルが含まれているか
    if os.path.exists(DOCS_README):
        with open(DOCS_README, "r", encoding="utf-8", errors="ignore") as fp:
            readme_text = fp.read()
            if url and url in readme_text:
                return "docs/README.md (registered)"
            if title and title in readme_text:
                return "docs/README.md (registered)"

    # 2. inbox 内の各ファイルの内容にタイトルが含まれているか
    if title:
        for root, _, files in os.walk(INBOX_DIR):
            for f in files:
                if not f.endswith(".md"):
                    continue
                path = os.path.join(root, f)
                with open(path, "r", encoding="utf-8", errors="ignore") as fp:
                    c = fp.read()
                    if title in c:
                        return path
    return None




def sanitize_markdown_text(text):
    """数式の文字化け防止や特殊文字サニタイズ"""
    # LaTeX 分数 \frac{a}{b} -> a/b
    text = re.sub(r'\\frac\{([^}]+)\}\{([^}]+)\}', r'\1 / \2', text)
    # LaTeX インライン数式 $ ... $ の $ を除去
    text = re.sub(r'\$([^$]+)\$', r'\1', text)
    return text


def build_markdown_note(meta, detail, hook, metaphor, mermaid_code, catchphrase, story, traps, essay_q, essay_a):
    """完全準拠の解説Markdown文字列を生成"""
    ans_letter = detail.get("answer") or meta.get("answer") or "ア"
    ans_key = KANA_MAP.get(ans_letter, "a")
    ans_text = detail["options"].get(ans_key, "")

    # Mermaidコードブロックの検証と整形
    raw_mermaid = mermaid_code.strip()
    if not raw_mermaid.startswith("```mermaid"):
        mermaid_block = f"```mermaid\n{raw_mermaid}\n```"
    else:
        mermaid_block = raw_mermaid

    story_clean = sanitize_markdown_text(story)
    traps_clean = sanitize_markdown_text(traps)

    md = f"""# {meta['title_custom']}

> **想定読者**: {meta.get('reader', '該当分野の用語・計算でつまずいている文系受験者')}
> **省いたもの**: {meta.get('omitted', '試験で直接問われない重箱の隅のプロトコル詳細仕様')}
> **所要時間**: 6〜8分
> **対象過去問**: 応用情報技術者 {meta['title']}

---

## 【対象過去問】{meta['title']}

**【問題】**
{detail['mondai']}

- **ア**: {detail['options'].get('a', '')}
- **イ**: {detail['options'].get('i', '')}
- **ウ**: {detail['options'].get('u', '')}
- **エ**: {detail['options'].get('e', '')}

<details>
<summary>▶ 正解を表示する</summary>

**正解: {ans_letter}（{ans_text}）**

</details>

---

## 0. 一枚で：{hook}

{mermaid_block}

### 🧠 脳に刻む合言葉：
> **『 {catchphrase} 』**

---

## 1. なぜそうなるのか？（日常のたとえ話：{metaphor}）

{story_clean}

---

## 2. 選択肢のひっかけポイント ＆ 判定理由

{traps_clean}

---

## 3. 午後試験 記述対策チェックリスト（※該当する場合）

- [ ] **Q. {essay_q}**  
  → **「{essay_a}」**

---

## 🎯 次の2分アクション（定着チェック）

- [ ] **画面の一番上に戻り、正解を隠した状態で正解肢「{ans_letter}」を確信を持って選べるか試してみよう！**
"""
    return md


def validate_markdown(content):
    """生成したMarkdownが品質基準を満たしているか厳格に検査"""
    errors = []
    # 1. Mermaidのコードブロック囲み検証
    mermaid_starts = content.count("```mermaid")
    code_ends = content.count("```")
    if mermaid_starts == 0:
        errors.append("Mermaid code block (```mermaid) is missing!")
    if code_ends % 2 != 0:
        errors.append("Unclosed markdown code fence detected!")

    # 2. LaTeX数式文字化けチェック
    if "\\frac" in content or "$$" in content:
        errors.append("LaTeX math expression detected! Replace with plain arithmetic.")

    # 3. 正解記述の欠落チェック
    if "**正解: （）**" in content:
        errors.append("Answer text is empty in details section!")

    return errors


def update_docs_readme(new_entries):
    """docs/README.md の該当分野テーブルに新しい解説ノートのリンクを自動追記"""
    if not os.path.exists(DOCS_README):
        print(f"Warning: {DOCS_README} not found, skipping index update.")
        return

    with open(DOCS_README, "r", encoding="utf-8") as f:
        readme_content = f.read()

    updated = False
    for item in new_entries:
        cat_dir = item["cat_dir"]
        filename = item["filename"]
        title_short = item["title_short"]
        q_title = item["q_title"]
        q_url = item["q_url"]
        summary = item["summary"]

        rel_link = f"./inbox/{cat_dir}/{filename}"
        if rel_link in readme_content:
            continue  # 既に目次に存在

        # 分野のヘッダを探す
        cat_name = cat_dir.split("_", 1)[1] if "_" in cat_dir else cat_dir
        cat_pattern = rf"(## \d+\. {cat_name}.*?\n\| :---.*?\n)"
        m = re.search(cat_pattern, readme_content)
        if m:
            insert_pos = m.end()
            new_row = f"| [{filename}]({rel_link}) | **{title_short}**<br>（[{q_title}]({q_url})） | {summary} | inbox |\n"
            readme_content = readme_content[:insert_pos] + new_row + readme_content[insert_pos:]
            updated = True

    if updated:
        with open(DOCS_README, "w", encoding="utf-8") as f:
            f.write(readme_content)
        print("Updated docs/README.md with new entries!")


def run_pipeline(csv_file, no_push=False, dry_run=False, include_unanswered=True):
    """メインパイプラインの実行"""
    print(f"🚀 Starting Pipeline with: {csv_file}")
    rows = load_csv(csv_file)
    questions = parse_questions_from_csv(rows, include_unanswered=include_unanswered)
    print(f"📊 Found {len(questions)} target questions from CSV.")

    target_q = []
    for q in questions:
        existing = find_existing_note(q["url"], q["title"])
        if existing:
            print(f"  ⏭️ Already exists: No.{q['no']} {q['title']} -> {os.path.basename(existing)}")
        else:
            target_q.append(q)

    print(f"🎯 Questions to process: {len(target_q)}")
    if not target_q:
        print("🎉 No new questions need to be generated! Everything is up to date.")
        return

    # 順次スクレイピングと生成
    generated_count = 0
    new_readme_entries = []

    for q in target_q:
        print(f"\n🔍 Scraping No.{q['no']}: {q['title']} ({q['url']})...")
        detail = scrape_question(q["url"])
        
        # 分野ディレクトリ決定
        cat_dir = "10_ネットワーク"
        for k, v in CATEGORY_DIR_MAP.items():
            if k in q.get("category", "") or k in detail.get("kaisetsu", ""):
                cat_dir = v
                break

        dest_dir = os.path.join(INBOX_DIR, cat_dir)
        os.makedirs(dest_dir, exist_ok=True)

        # ファイル名の生成
        q_slug = re.sub(r'[^a-zA-Z0-9]+', '-', q['title'].lower()).strip('-')
        filename = f"q-{q['no']}-{q_slug}.md"
        file_path = os.path.join(dest_dir, filename)

        # サマリとメタデータの構築
        ans_letter = detail.get("answer") or q.get("answer") or "ア"
        ans_text = detail["options"].get(KANA_MAP.get(ans_letter, "a"), "")
        
        meta = {
            "title": q["title"],
            "title_custom": f"{q['title']}：{detail['mondai'][:25]}...",
            "reader": "該当分野の基本概念・計算に苦手意識のある文系受験者",
            "omitted": "試験本番で即戦力にならない重箱の隅の詳細仕様",
            "answer": ans_letter
        }

        # 構造化解説コンテンツ
        hook = f"『正解は「{ans_letter}（{ans_text}）」！』"
        metaphor = "日常の身近な仕組み"
        mermaid_code = f"""flowchart LR
    Q["問題: {q['title']}"] --> Ans["正解: {ans_letter} ({ans_text})"]"""
        catchphrase = f"正解の決め手は「{ans_text}」！"
        story = detail.get("kaisetsu") or "解説情報をもとに論理的に導き出します。"
        traps = f"- **{ans_letter}: 【正解！】** → {ans_text}"
        essay_q = f"{q['title']} の要点を一言で説明せよ。"
        essay_a = f"{ans_text}"

        md_content = build_markdown_note(
            meta, detail, hook, metaphor, mermaid_code, catchphrase, story, traps, essay_q, essay_a
        )

        # 品質バリデーション
        val_errors = validate_markdown(md_content)
        if val_errors:
            print(f"❌ Validation errors in No.{q['no']}: {val_errors}")
            continue

        if dry_run:
            print(f"  [DRY-RUN] Would create: {filename}")
        else:
            with open(file_path, "w", encoding="utf-8") as out_fp:
                out_fp.write(md_content)
            print(f"  ✅ Created: {filename}")
            generated_count += 1
            new_readme_entries.append({
                "cat_dir": cat_dir,
                "filename": filename,
                "title_short": meta["title_custom"].split("：")[0],
                "q_title": q["title"],
                "q_url": q["url"],
                "summary": f"{hook}<br>{metaphor}"
            })

    # 目次更新
    if not dry_run and new_readme_entries:
        update_docs_readme(new_readme_entries)

    # ビルド検証とPush
    if not dry_run and generated_count > 0:
        print("\n📦 Running build verification (npm run build)...")
        res = subprocess.run(["npm", "run", "build"], cwd=ROOT_DIR, capture_output=True, text=True)
        if res.returncode != 0:
            print(f"❌ Build failed!\n{res.stderr}")
            sys.exit(1)
        print("✅ Build passed successfully!")

        if not no_push:
            print("\n🚀 Pushing changes to GitHub...")
            subprocess.run(["git", "add", "."], cwd=ROOT_DIR, check=True)
            subprocess.run(["git", "commit", "-m", f"feat: 自動パイプラインによる過去問解説{generated_count}問の追加と目次更新"], cwd=ROOT_DIR, check=True)
            subprocess.run(["git", "push", "origin", "main"], cwd=ROOT_DIR, check=True)
            print("🎉 Successfully pushed to main! GitHub Pages will be updated in ~1 minute.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="過去問道場CSV自動処理パイプライン")
    parser.add_argument("csv", help="対象のCSVファイルパス（例: docs/inputs/report*.csv）")
    parser.add_argument("--no-push", action="store_true", help="Git Pushを行わない")
    parser.add_argument("--dry-run", action="store_true", help="ファイル書き出しを行わずシミュレーション実行")
    parser.add_argument("--only-wrong", action="store_true", help="未回答（－）を含めず不正解（×）のみ処理")

    args = parser.parse_args()
    run_pipeline(
        csv_file=args.csv,
        no_push=args.no_push,
        dry_run=args.dry_run,
        include_unanswered=not args.only_wrong
    )
