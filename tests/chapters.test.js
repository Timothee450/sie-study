load("chapters/chapters.js");
test("registry shape", function () {
  ok(Array.isArray(CHAPTERS) && CHAPTERS.length === 1, "exactly one chapter for now");
  var c = CHAPTERS[0];
  eq([c.id, c.num, c.title, c.href], ["ch1", 1, "Common Stock", "chapters/ch1/index.html"]);
  ok(typeof c.summary === "string" && c.summary.length > 20);
});
