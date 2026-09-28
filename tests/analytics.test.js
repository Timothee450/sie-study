/* Every page carries the visit counter, and no page loads it twice. */
load("chapters/chapters.js");
var pages = ["index.html"];
CHAPTERS.forEach(function (c) {
  ["index.html", "textbook.html", "learn.html", "quiz.html"].forEach(function (p) { pages.push("chapters/" + c.id + "/" + p); });
});
pages.forEach(function (p) {
  test(p + " has exactly one GoatCounter snippet", function () {
    var html = readFile(p);
    var n = html.split('data-goatcounter="https://timotheepellegrino.goatcounter.com/count"').length - 1;
    eq(n, 1, "expected 1 snippet, found " + n);
    ok(html.indexOf("https://gc.zgo.at/count.js") > -1, "missing count.js");
  });
});
