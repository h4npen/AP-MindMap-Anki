# -*- coding: utf-8 -*-
"""
scripts/build_last_minute_flashcards.py
全129問の間違えた問題から、
1. 過去問番号ラベル（例: R6春 問6）
2. 過去問道場の直リンクURL（例: https://www.ap-siken.com/kakomon/06_haru/q6.html）
3. 解説ページへの直リンク（例: offline_app.html#algo-binary-tree-postorder-traversal.md）
を抽出し、flashcards_data.json に保存する。
"""

import os
import glob
import re
import json

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
INBOX_DIR = os.path.join(ROOT_DIR, "docs", "inbox")

files = sorted(glob.glob(os.path.join(INBOX_DIR, "**", "*.md"), recursive=True))

def normalize_to_rh_label(text):
    text = text.replace("午前", "").replace("応用情報技術者", "").strip()
    text = re.sub(r'令和([0-9]+|元)年?', lambda m: f"R{1 if m.group(1)=='元' else m.group(1)}", text)
    text = re.sub(r'平成([0-9]+)年?', r'H\1', text)
    text = re.sub(r'令([0-9]+|元)', lambda m: f"R{1 if m.group(1)=='元' else m.group(1)}", text)
    text = re.sub(r'平([0-9]+)', r'H\1', text)
    text = text.replace("期", "")
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def parse_kakomon_tag(content):
    m = re.search(r'##\s*【対象過去問】\s*([^\n\r]+)', content)
    if m:
        return normalize_to_rh_label(m.group(1))
            
    m = re.search(r'対象過去問[*:]*\s*([^\n\r]+)', content)
    if m:
        return normalize_to_rh_label(m.group(1).replace('*', ''))

    m = re.search(r'^title:\s*["\']?(.*?)(問\d+)["\']?$', content, re.M)
    if m:
        return normalize_to_rh_label(m.group(1) + m.group(2))
        
    m = re.search(r'^title:\s*["\']?(.*?[前後春秋]期\s*問\d+)["\']?$', content, re.M)
    if m:
        return normalize_to_rh_label(m.group(1))

    m = re.search(r'kakomon/([0-9]+)_([a-z]+)/q([0-9]+)\.html', content)
    if m:
        yr = int(m.group(1))
        season = "春" if m.group(2) == "haru" else ("秋" if m.group(2) == "aki" else "特別")
        qno = m.group(3)
        era = f"R{yr}" if yr <= 10 else f"H{yr}"
        return f"{era}{season} 問{qno}"

    m = re.search(r'((?:令和|平成)[0-9１-９元]+年[春秋]期?\s*(?:午前)?問[0-9１-９]+)', content)
    if m:
        return normalize_to_rh_label(m.group(1))

    return "過去問"

def build_kakomon_url(content, rh_label):
    # 1. 本文内にURLがあればそれを使う
    m = re.search(r'(https://www\.ap-siken\.com/kakomon/[0-9]+_[a-z]+/q[0-9]+\.html)', content)
    if m:
        return m.group(1)
        
    # 2. rh_label (例: "R6春 問6", "H20秋 問19") から生成
    m = re.search(r'([RH])([0-9]+)(春|秋|特別)\s*問([0-9]+)', rh_label)
    if m:
        era, yr_str, season_jp, qno = m.groups()
        yr = int(yr_str)
        season_en = "haru" if season_jp == "春" else ("aki" if season_jp == "秋" else "toku")
        return f"https://www.ap-siken.com/kakomon/{yr:02d}_{season_en}/q{qno}.html"
        
    return "https://www.ap-siken.com/"

cards_by_category = {}
url_count = 0

for f in files:
    fname = os.path.basename(f)
    if fname in ["ap-exam-schedule-roadmap.md", "textbook-study-guide.md", "README.md"]:
        continue
        
    rel_path = os.path.relpath(f, INBOX_DIR)
    cat_dir = rel_path.split(os.sep)[0]
    cat_clean = re.sub(r'^\d+_', '', cat_dir)
    
    with open(f, "r", encoding="utf-8", errors="ignore") as fp:
        content = fp.read()
        
    kakomon_label = parse_kakomon_tag(content)
    kakomon_url = build_kakomon_url(content, kakomon_label)
    if "q" in kakomon_url:
        url_count += 1

    hook = ""
    m = re.search(r'^hook:\s*["\']?(.*?)["\']?$', content, re.M)
    if m:
        hook = m.group(1).strip()

    catchphrase = ""
    m = re.search(r'^catchphrase:\s*["\']?(.*?)["\']?$', content, re.M)
    if m:
        catchphrase = m.group(1).strip()

    title_custom = ""
    m = re.search(r'^title_custom:\s*["\']?(.*?)["\']?$', content, re.M)
    if m:
        title_custom = m.group(1).strip()
        
    h1 = ""
    m = re.search(r'^#\s*(.*?)$', content, re.M)
    if m:
        h1 = m.group(1).strip()
        
    # 正解
    ans = ""
    m = re.search(r'正解[:：]\s*([^\n\r<]+)', content)
    if m:
        ans = m.group(1).strip()
    else:
        m2 = re.search(r'^answer:\s*["\']?(.*?)["\']?$', content, re.M)
        if m2:
            ans = m2.group(1).strip()
            
    ans_text = ""
    m = re.search(r'^answer_text:\s*["\']?(.*?)["\']?$', content, re.M)
    if m:
        ans_text = m.group(1).strip()

    traps = ""
    m = re.search(r'^traps:\s*["\']?([\s\S]*?)["\']?$(?=\n[a-z_]+:|\n---|\Z)', content, re.M)
    if m:
        traps = m.group(1).strip()
    else:
        m2 = re.search(r'##\s*2\.\s*試験でよく出るひっかけ.*?\n+([\s\S]*?)(?=\n##|\Z)', content)
        if m2:
            traps = m2.group(1).strip()[:200].replace('\n', ' ')

    term = title_custom or h1 or fname.replace(".md", "")
    term = term.replace("タイトル：", "").replace("#", "").strip()

    catch = catchphrase or hook
    if not catch:
        m_c = re.search(r'合言葉[：:]([\s\S]*?)(?=\n---|\n##|\Z)', content)
        if m_c:
            catch = m_c.group(1).strip()

    catch = catch.split('```')[0]
    catch = re.sub(r'[>\*『』]', '', catch).strip()
    catch_lines = [l.strip() for l in catch.splitlines() if l.strip()]
    catch = " ".join(catch_lines[:2]) if catch_lines else "重要キーワード"

    ans_full = f"{ans} {ans_text}".replace('*', '').strip()

    if cat_clean not in cards_by_category:
        cards_by_category[cat_clean] = []
        
    cards_by_category[cat_clean].append({
        "file": fname,
        "note_link": f"offline_app.html#{fname}",
        "category": cat_clean,
        "kakomon_label": kakomon_label,
        "kakomon_url": kakomon_url,
        "term": term[:60],
        "catch": catch[:140],
        "ans": ans_full[:90],
        "traps": traps[:150]
    })

with open('flashcards_data.json', 'w', encoding='utf-8') as out:
    json.dump(cards_by_category, out, ensure_ascii=False, indent=2)

print(f"flashcards_data.json updated cleanly. Direct kakomon URLs generated: {url_count}/129")
