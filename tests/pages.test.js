/* Every chapter's hub, textbook and quiz use the shared page styles instead of copying them. */
load("chapters/chapters.js");
var shared = { "index.html": "hub.css", "textbook.html": "textbook.css", "quiz.html": "quiz.css" };
Object.keys(shared).forEach(function (css) {
  test("assets/" + shared[css] + " exists", function () {
    var t = ""; try { t = readFile("assets/" + shared[css]); } catch (e) {}
    ok(t.length > 300, "assets/" + shared[css] + " missing or empty");
  });
});
CHAPTERS.forEach(function (c) {
  Object.keys(shared).forEach(function (page) {
    test(c.id + "/" + page + " links the shared " + shared[page] + " and keeps no big inline style", function () {
      var html = readFile("chapters/" + c.id + "/" + page);
      ok(html.indexOf('href="../../assets/' + shared[page] + '"') > -1, "missing link to " + shared[page]);
      var inline = (html.match(/<style>[\s\S]*?<\/style>/g) || []).join("");
      ok(inline.length < 600, "inline <style> is " + inline.length + " chars; move shared rules to assets/" + shared[page]);
    });
  });
});
