/* SIE Study quiz engine.
   QuizCore: pure scoring state (unit-tested).
   QuizUI.mount(el, quiz): renders one question at a time and saves the result via Progress. */
(function (w) {
  "use strict";

  function QuizCore(questions) {
    var s = { index: 0, score: 0, picks: [] };
    var api = {
      get index() { return s.index; },
      get score() { return s.score; },
      current: function () { return questions[s.index]; },
      answered: function () { return s.picks[s.index] != null; },
      answer: function (i) {
        if (api.answered()) throw new Error("already answered");
        s.picks[s.index] = i;
        var q = questions[s.index], ok = i === q.answer;
        if (ok) s.score++;
        return { correct: ok, answer: q.answer };
      },
      next: function () {
        if (!api.answered()) throw new Error("answer first");
        if (s.index < questions.length - 1) { s.index++; return true; }
        return false;
      },
      done: function () { return s.index === questions.length - 1 && api.answered(); },
      missed: function () {
        var out = [];
        questions.forEach(function (q, i) {
          if (s.picks[i] != null && s.picks[i] !== q.answer) out.push({ n: i + 1, q: q.q, chosen: s.picks[i], answer: q.answer, section: q.section });
        });
        return out;
      },
      reset: function () { s = { index: 0, score: 0, picks: [] }; }
    };
    return api;
  }

  function validateQuiz(z) {
    var e = [];
    if (!z || typeof z.chapter !== "string" || !z.chapter) e.push("chapter missing");
    if (!z || typeof z.title !== "string" || !z.title) e.push("title missing");
    if (!z || typeof z.textbook !== "string" || !z.textbook) e.push("textbook url missing");
    ((z && z.questions) || []).forEach(function (q, i) {
      var n = "Q" + (i + 1) + ": ";
      if (!q.q) e.push(n + "empty question");
      if (!Array.isArray(q.options) || q.options.length !== 4 || q.options.some(function (o) { return !o; })) e.push(n + "needs exactly 4 non-empty options");
      if (!(q.answer >= 0 && q.answer <= 3 && q.answer % 1 === 0)) e.push(n + "answer must be 0-3");
      if (!q.explain) e.push(n + "explanation missing");
      if (!q.section) e.push(n + "section anchor missing");
    });
    if (!z || !z.questions || !z.questions.length) e.push("no questions");
    return e;
  }

  /* ---- UI ---- */
  var L = "ABCD";
  function el(tag, cls, text) {
    var n = w.document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function mount(root, quiz) {
    var errs = validateQuiz(quiz);
    if (errs.length) { root.textContent = "This quiz could not load: " + errs[0]; return; }
    var core = QuizCore(quiz.questions), total = quiz.questions.length;

    function render() {
      var q = core.current();
      root.innerHTML = "";
      var bar = el("div", "qbar");
      bar.appendChild(el("span", "label num", "Question " + (core.index + 1) + " of " + total));
      var pr = el("div", "qprogress"), ps = el("span");
      ps.style.width = (core.index / total * 100) + "%"; pr.appendChild(ps); bar.appendChild(pr);
      bar.appendChild(el("span", "label num", "Score " + core.score));
      root.appendChild(bar);

      var h = el("h2", "qtext", q.q); h.tabIndex = -1; root.appendChild(h);
      var opts = el("div", "opts");
      opts.setAttribute("role", "group"); opts.setAttribute("aria-label", "Answer choices");
      root.appendChild(opts);
      var exp = el("div", "explain"); exp.hidden = true; exp.setAttribute("aria-live", "polite");
      var next = el("button", "btn primary", core.index === total - 1 ? "See results" : "Next question →");
      next.type = "button"; next.hidden = true;

      q.options.forEach(function (text, i) {
        var b = el("button", "opt"); b.type = "button";
        b.appendChild(el("span", "l num", L[i])); b.appendChild(el("span", null, text));
        b.addEventListener("click", function () {
          if (core.answered()) return;
          var r = core.answer(i);
          [].forEach.call(opts.children, function (x, j) {
            x.disabled = true;
            if (j === r.answer) x.classList.add("right");
            else if (j === i) x.classList.add("wrong");
          });
          exp.innerHTML = "";
          exp.appendChild(el("strong", null, r.correct ? "Correct. " : "Not quite. The answer is " + L[r.answer] + ". "));
          exp.appendChild(w.document.createTextNode(q.explain));
          exp.hidden = false; next.hidden = false; next.focus();
        });
        opts.appendChild(b);
      });
      root.appendChild(exp);
      next.addEventListener("click", function () {
        if (core.next()) { render(); root.querySelector(".qtext").focus(); }
        else results();
      });
      var row = el("div", "btn-row"); row.appendChild(next); root.appendChild(row);
    }

    function results() {
      var rec = w.Progress ? w.Progress.saveQuiz(quiz.chapter, core.score, total) : null;
      var pct = Math.round(core.score / total * 100), pass = pct >= 70;
      root.innerHTML = "";
      root.appendChild(el("span", "label", "Results"));
      root.appendChild(el("div", "score-big num", core.score + " / " + total));
      var meter = el("div", "meter"), fill = el("span", pass ? "pass" : "fail");
      fill.style.width = pct + "%"; meter.appendChild(fill);
      var mark = el("i", "mark"); mark.style.left = "70%"; mark.title = "70% passing score"; meter.appendChild(mark);
      meter.setAttribute("role", "img"); meter.setAttribute("aria-label", pct + "% scored; 70% needed to pass");
      root.appendChild(meter);
      root.appendChild(el("p", null, pct + "%. " + (pass
        ? "Above the 70% SIE passing line. Review any misses below."
        : "The SIE passing score is 70%. Revisit the sections below and try again.")));
      root.appendChild(el("p", "note", rec ? w.Progress.badgeText(rec) : "Your browser isn't saving progress, so this score won't be kept."));

      var miss = core.missed();
      if (miss.length) {
        root.appendChild(el("h3", null, "Review these"));
        var list = el("ol", "review-list");
        miss.forEach(function (m) {
          var li = el("li", "review-item");
          li.appendChild(el("strong", null, m.n + ". " + m.q));
          li.appendChild(el("span", "note", "You chose " + L[m.chosen] + ". Correct: " + L[m.answer] + ", " + quiz.questions[m.n - 1].options[m.answer] + "."));
          var a = el("a", null, "Read this in the textbook →"); a.href = quiz.textbook + "#" + m.section;
          li.appendChild(a);
          list.appendChild(li);
        });
        root.appendChild(list);
      } else {
        root.appendChild(el("p", null, "Perfect score. Nothing to review."));
      }
      var row = el("div", "btn-row");
      var again = el("button", "btn primary", "Retake quiz"); again.type = "button";
      again.addEventListener("click", function () { core.reset(); render(); root.querySelector(".qtext").focus(); });
      var back = el("a", "btn", "← Chapter hub"); back.href = "index.html";
      row.appendChild(again); row.appendChild(back); root.appendChild(row);
      root.scrollIntoView({ block: "start" });
    }

    render();
  }

  w.QuizCore = QuizCore;
  w.validateQuiz = validateQuiz;
  w.QuizUI = { mount: mount };
})(window);
