var localStorage = makeStorage();
load("assets/progress.js");
test("empty -> null", function () { eq(Progress.getQuiz("ch1"), null); });
test("first save", function () {
  var r = Progress.saveQuiz("ch1", 18, 25, new Date("2026-09-28T12:00:00Z"));
  eq(r, { best: 18, total: 25, attempts: 1, last: "2026-09-28" });
  eq(Progress.getQuiz("ch1"), r);
});
test("higher score raises best", function () { eq(Progress.saveQuiz("ch1", 21, 25, new Date("2026-09-29T00:00:00Z")).best, 21); });
test("lower score keeps best, still counts attempt", function () {
  var r = Progress.saveQuiz("ch1", 10, 25, new Date("2026-09-30T00:00:00Z"));
  eq(r.best, 21); eq(r.attempts, 3); eq(r.last, "2026-09-30");
});
test("chapters are independent", function () { eq(Progress.getQuiz("ch2"), null); });
test("badge text", function () {
  eq(Progress.badgeText(null), "Not attempted yet");
  eq(Progress.badgeText({ best: 21, total: 25, attempts: 3 }), "Best 21/25 (84%) · 3 attempts");
  eq(Progress.badgeText({ best: 25, total: 25, attempts: 1 }), "Best 25/25 (100%) · 1 attempt");
});
test("passed at 70%", function () {
  ok(Progress.passed({ best: 18, total: 25 })); /* 72% */
  ok(!Progress.passed({ best: 17, total: 25 })); /* 68% */
  ok(!Progress.passed(null));
});
test("corrupt JSON -> null, save recovers", function () {
  localStorage.setItem("sie-study:v1", "{not json");
  eq(Progress.getQuiz("ch1"), null);
  eq(Progress.saveQuiz("ch1", 5, 25, new Date("2026-10-01T00:00:00Z")).attempts, 1);
});
test("wrong shape -> null", function () {
  localStorage.setItem("sie-study:v1", JSON.stringify({ quizzes: { ch1: { best: "x" } } }));
  eq(Progress.getQuiz("ch1"), null);
});
test("storage throws -> null, no crash", function () {
  window.localStorage = { getItem: function () { throw new Error("blocked"); }, setItem: function () { throw new Error("blocked"); } };
  eq(Progress.getQuiz("ch1"), null);
  eq(Progress.saveQuiz("ch1", 20, 25), null);
});
