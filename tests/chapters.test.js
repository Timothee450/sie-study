load("chapters/chapters.js");
test("registry lists chapters 1 and 2 in order", function () {
  eq(CHAPTERS.map(function (c) { return [c.id, c.num]; }), [["ch1", 1], ["ch2", 2]]);
});
test("chapter entries are complete", function () {
  eq([CHAPTERS[0].title, CHAPTERS[0].href], ["Common Stock", "chapters/ch1/index.html"]);
  eq([CHAPTERS[1].title, CHAPTERS[1].href], ["Preferred Stock", "chapters/ch2/index.html"]);
  CHAPTERS.forEach(function (c) { ok(typeof c.summary === "string" && c.summary.length > 20, c.id + " summary"); });
});
