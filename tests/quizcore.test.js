var document = undefined; /* QuizUI must not run at load */
load("assets/quiz.js");
var Q = [
  { q: "a", options: ["1","2","3","4"], answer: 0, explain: "x", section: "s1-1" },
  { q: "b", options: ["1","2","3","4"], answer: 2, explain: "y", section: "s1-2" },
  { q: "c", options: ["1","2","3","4"], answer: 3, explain: "z", section: "s1-3" }
];
test("scores correct answers", function () {
  var c = QuizCore(Q);
  eq(c.answer(0), { correct: true, answer: 0 }); ok(c.next());
  eq(c.answer(1), { correct: false, answer: 2 }); ok(c.next());
  eq(c.answer(3).correct, true); ok(!c.next()); ok(c.done());
  eq(c.score, 2);
  eq(c.missed(), [{ n: 2, q: "b", chosen: 1, answer: 2, section: "s1-2" }]);
});
test("cannot answer twice", function () {
  var c = QuizCore(Q); c.answer(0);
  var threw = false; try { c.answer(1); } catch (e) { threw = true; } ok(threw);
  eq(c.score, 1);
});
test("next before answering is refused", function () {
  var c = QuizCore(Q); var threw = false; try { c.next(); } catch (e) { threw = true; } ok(threw);
});
test("retake resets everything", function () {
  var c = QuizCore(Q); c.answer(0); c.next(); c.answer(0); c.reset();
  eq([c.index, c.score, c.answered(), c.missed().length], [0, 0, false, 0]);
});
test("validateQuiz flags bad data", function () {
  eq(validateQuiz({ chapter: "ch1", title: "t", textbook: "textbook.html", questions: Q }), []);
  var bad = validateQuiz({ chapter: "ch1", title: "t", textbook: "t", questions: [{ q: "", options: ["a","b","c"], answer: 5, explain: "", section: "" }] });
  ok(bad.length >= 4, "expected several errors, got " + JSON.stringify(bad));
});
