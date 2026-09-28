/* SIE Study progress: quiz results per chapter, stored in this browser only. */
(function (w) {
  "use strict";
  var KEY = "sie-study:v1";
  function read() {
    try { var raw = w.localStorage.getItem(KEY); var d = raw ? JSON.parse(raw) : {}; return d && typeof d === "object" ? d : {}; }
    catch (e) { return {}; }
  }
  function valid(r) {
    return !!r && typeof r === "object" && r.total > 0 &&
      [r.best, r.total, r.attempts].every(function (n) { return typeof n === "number" && isFinite(n) && n >= 0; });
  }
  function getQuiz(id) { var d = read(); var r = d.quizzes && d.quizzes[id]; return valid(r) ? r : null; }
  function saveQuiz(id, score, total, now) {
    var d = read(); if (!d.quizzes || typeof d.quizzes !== "object") d.quizzes = {};
    var prev = getQuiz(id);
    var rec = {
      best: prev ? Math.max(prev.best, score) : score,
      total: total,
      attempts: (prev ? prev.attempts : 0) + 1,
      last: (now || new Date()).toISOString().slice(0, 10)
    };
    d.quizzes[id] = rec;
    try { w.localStorage.setItem(KEY, JSON.stringify(d)); return rec; } catch (e) { return null; }
  }
  function badgeText(r) {
    if (!r) return "Not attempted yet";
    return "Best " + r.best + "/" + r.total + " (" + Math.round(r.best / r.total * 100) + "%) · " +
      r.attempts + (r.attempts === 1 ? " attempt" : " attempts");
  }
  function passed(r) { return !!r && r.best / r.total >= 0.7; }

  /* Fill a badge element with a chapter's quiz result, and refresh it when
     the page is restored by the Back button (which skips page scripts). */
  var badges = [];
  function render(b) {
    var rec = getQuiz(b.id);
    b.el.textContent = badgeText(rec);
    b.el.classList.remove("pass", "fail");
    if (rec) b.el.classList.add(passed(rec) ? "pass" : "fail");
  }
  function showBadge(el, id) { var b = { el: el, id: id }; badges.push(b); render(b); }
  if (w.addEventListener) w.addEventListener("pageshow", function (e) { if (e.persisted) badges.forEach(render); });

  w.Progress = { getQuiz: getQuiz, saveQuiz: saveQuiz, badgeText: badgeText, passed: passed, showBadge: showBadge };
})(window);
