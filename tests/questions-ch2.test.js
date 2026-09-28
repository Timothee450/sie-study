var document = undefined;
load("assets/quiz.js"); load("chapters/ch2/questions.js");
test("ch2: 20 valid questions", function () { eq(validateQuiz(QUIZ), []); eq(QUIZ.questions.length, 20); eq(QUIZ.chapter, "ch2"); });
test("ch2: answers spread across A-D", function () {
  var c = [0,0,0,0]; QUIZ.questions.forEach(function (q) { c[q.answer]++; });
  ok(c.every(function (n) { return n >= 3; }), "answer distribution " + JSON.stringify(c));
});
test("ch2: every section 2.1-2.3 is covered", function () {
  ["s2-1", "s2-2", "s2-3"].forEach(function (p) {
    ok(QUIZ.questions.filter(function (q) { return q.section.indexOf(p) === 0; }).length >= 4, "fewer than 4 questions for " + p);
  });
});
test("ch2: no duplicate questions", function () {
  var seen = {}; QUIZ.questions.forEach(function (q) { ok(!seen[q.q], "dup: " + q.q); seen[q.q] = 1; });
});
