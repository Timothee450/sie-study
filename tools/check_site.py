#!/usr/bin/env python3
"""Static checks for SIE Study. Run from anywhere: python3 tools/check_site.py"""
import re, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
SKIP = {"source", "docs", "tests", "tools", ".superpowers", ".claude"}
problems = []

def pages():
    for p in sorted(ROOT.rglob("*.html")):
        if SKIP.intersection(p.relative_to(ROOT).parts): continue
        yield p

def ids_in(path):
    return set(re.findall(r'\bid="([^"]+)"', path.read_text(encoding="utf-8")))

for page in pages():
    text = page.read_text(encoding="utf-8")
    rel = page.relative_to(ROOT)
    for attr, url in re.findall(r'\b(href|src)="([^"]*)"', text):
        if url.startswith(("http://", "https://", "mailto:", "data:", "javascript:")): continue
        if url.startswith("/"):
            problems.append(f"{rel}: root-absolute {attr} {url!r} breaks on a sub-path"); continue
        if url.startswith("#"):
            if url[1:] and url[1:] not in ids_in(page) and not re.fullmatch(r"#\d+", url):
                problems.append(f"{rel}: missing anchor {url}")
            continue
        path, _, frag = url.partition("#")
        target = page.parent / path
        if path.endswith("/") or path == "": target = target / "index.html"
        if not target.exists():
            problems.append(f"{rel}: broken {attr} {url!r}"); continue
        if frag and target.suffix == ".html" and frag not in ids_in(target):
            problems.append(f"{rel}: {url!r} points to missing anchor #{frag}")
    visible = re.sub(r"<script.*?</script>|<style.*?</style>|<[^>]+>", " ", text, flags=re.S)
    if re.search(r"\bfree\b", visible, re.I):
        problems.append(f"{rel}: contains the word 'free' in page copy")

# quiz anchors -> textbook ids
for qfile in sorted(ROOT.glob("chapters/*/questions.js")):
    tb = qfile.parent / "textbook.html"
    anchors = re.findall(r'section:\s*"([^"]+)"', qfile.read_text(encoding="utf-8"))
    tb_ids = ids_in(tb) if tb.exists() else set()
    for a in anchors:
        if a not in tb_ids:
            problems.append(f"{qfile.relative_to(ROOT)}: section {a!r} not found in {tb.name}")

if problems:
    for i, p in enumerate(problems, 1): print(f"{i}. {p}")
    sys.exit(1)
print("check_site: all good")
