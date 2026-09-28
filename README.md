# SIE Study

A course-style study site for the FINRA SIE exam. Each chapter has three parts:

- **Textbook**: detailed reading, with worked examples, tables and calculators
- **Learning**: an animated, click-through lesson with hands-on simulators
- **Quiz**: 25 exam-style questions; the best score shows on the home page and the chapter page

The site is plain HTML, CSS and JavaScript. There is no build step, and every link is relative, so the folder can be hosted as is (for example on GitHub Pages).

## Folder layout

```
index.html               home page (chapter cards)
assets/                  shared theme, progress storage, quiz engine, slide engine (deck.js/deck.css),
                         and page styles (hub.css, textbook.css, quiz.css)
chapters/chapters.js     list of chapters shown on the home page
chapters/ch1/            Chapter 1 (Common Stock): hub (index.html), textbook, learn, quiz, questions.js
chapters/ch2/            Chapter 2 (Preferred Stock): same five parts
chapters/ch3/            Chapter 3 (Bonds): same five parts
tests/                   unit tests (run with macOS's built-in JavaScriptCore)
tools/                   site checker and preview helpers
```

The working folder on the author's Mac also has `source/` (the two original Chapter 1 sites) and `docs/` (design spec, plan, build ledger). Those aren't published.

**Live site:** https://timothee450.github.io/sie-study/

## Preview

The preview server can't read files on the Desktop directly, so it serves a copy:

```bash
sh tools/sync.sh
```

Then start the `sie-study` preview (configured in `.claude/launch.json`) and open http://localhost:8765. Re-run `sh tools/sync.sh` after each edit.

## Checks

```bash
sh tests/run.sh
```

```bash
python3 tools/check_site.py
```

`run.sh` runs the unit tests: theme, progress storage, quiz engine, chapter list and question data. `check_site.py` checks every link and anchor. It also checks that each quiz question's "read this in the textbook" link points at a real section, that no link starts with `/` (those would break once the site is hosted in a sub-folder), and that the word "free" doesn't appear in page copy.

## Add a chapter

1. Copy `chapters/ch2/` to `chapters/chN/` (it's the smaller example).
2. Replace the content of `index.html`, `textbook.html`/`textbook.js` and `learn.html`/`learn.js`. Then replace the questions in `questions.js` and set `chapter: "chN"`. Shared styles come from `assets/`; only add a small inline `<style>` for something truly chapter-specific.
3. In `learn.js`, define the chapter's `Sims` (one per `data-sim` slide) and call `SIEDeck.start({ sections, sims, hooks })`.
4. In the new hub (`chapters/chN/index.html`), change `Progress.showBadge(…, "ch2")` to `"chN"`.
5. Add an entry to `chapters/chapters.js` and update `tests/chapters.test.js`. Copy `tests/questions-ch2.test.js` for the new quiz, then run both checks.

Quiz scores are saved in the visitor's own browser (`localStorage`), so they stay on that device only.
