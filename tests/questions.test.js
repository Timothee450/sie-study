var document = undefined;
load("assets/quiz.js"); load("chapters/ch1/questions.js");
test("25 valid questions", function () { eq(validateQuiz(QUIZ), []); eq(QUIZ.questions.length, 25); eq(QUIZ.chapter, "ch1"); });
test("answers are spread across A-D", function () {
  var c = [0,0,0,0]; QUIZ.questions.forEach(function (q) { c[q.answer]++; });
  ok(c.every(function (n) { return n >= 4; }), "answer distribution " + JSON.stringify(c));
});
test("every section 1.1-1.5 is covered", function () {
  ["s1-1", "s1-2", "s1-3", "s1-4", "s1-5"].forEach(function (p) {
    ok(QUIZ.questions.some(function (q) { return q.section.indexOf(p) === 0; }), "no question for " + p);
  });
});
test("no duplicate questions", function () {
  var seen = {}; QUIZ.questions.forEach(function (q) { ok(!seen[q.q], "dup: " + q.q); seen[q.q] = 1; });
});
test("rights lifespan is 30-45 days everywhere", function () {
  QUIZ.questions.forEach(function (q) { ok(!/60.90/.test(q.explain + q.q + q.options.join()), "old 60-90 figure in: " + q.q); });
});
