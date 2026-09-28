var document = undefined;
load("assets/quiz.js"); load("chapters/ch3/questions.js");
test("ch3: 20 valid questions", function () { eq(validateQuiz(QUIZ), []); eq(QUIZ.questions.length, 20); eq(QUIZ.chapter, "ch3"); });
test("ch3: answers spread across A-D", function () {
  var c = [0,0,0,0]; QUIZ.questions.forEach(function (q) { c[q.answer]++; });
  ok(c.every(function (n) { return n >= 3; }), "answer distribution " + JSON.stringify(c));
});
test("ch3: every section 3.1-3.4 is covered", function () {
  ["s3-1", "s3-2", "s3-3", "s3-4"].forEach(function (p) {
    ok(QUIZ.questions.filter(function (q) { return q.section.indexOf(p) === 0; }).length >= 4, "fewer than 4 questions for " + p);
  });
});
test("ch3: no duplicate questions", function () {
  var seen = {}; QUIZ.questions.forEach(function (q) { ok(!seen[q.q], "dup: " + q.q); seen[q.q] = 1; });
});
