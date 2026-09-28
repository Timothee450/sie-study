/* Every chapter's Learning deck uses the shared slide engine (assets/deck.css + assets/deck.js). */
load("chapters/chapters.js");
var deckCss = "";
try { deckCss = readFile("assets/deck.css"); } catch (e) {}
test("shared deck stylesheet exists and owns the full-window layout", function () {
  ok(deckCss.length > 1000, "assets/deck.css missing or empty");
  ok(/\.app\{[^}]*position:fixed[^}]*display:grid/.test(deckCss), ".app must be a fixed, full-window grid");
  var bodyRule = (deckCss.match(/\nbody\{[^}]*\}/) || [""])[0];
  ok(bodyRule && bodyRule.indexOf("display:grid") === -1, "body must not be the layout grid (extensions add children to <body>)");
});
CHAPTERS.forEach(function (c) {
  var dir = "chapters/" + c.id + "/", html = readFile(dir + "learn.html"), js = readFile(dir + "learn.js");
  test(c.id + ": learn.html loads the shared engine in order", function () {
    ok(html.indexOf('href="../../assets/deck.css"') > -1, "no deck.css link");
    var g = html.indexOf("gsap.min.js"), d = html.indexOf('src="../../assets/deck.js"'), l = html.indexOf('src="learn.js"');
    ok(g > -1 && d > g && l > d, "script order must be gsap → deck.js → learn.js");
    ok(html.indexOf(".slide{position:absolute") === -1, "engine CSS should live in deck.css, not the page");
    ok(/<div class="app">\s*<header class="top">/.test(html), "header/stage/footer must sit inside .app");
  });
  test(c.id + ": every data-sim has a simulator and the deck starts", function () {
    var sims = (html.match(/data-sim="[^"]+"/g) || []).map(function (s) { return s.slice(10, -1); });
    sims.forEach(function (name) { ok(js.indexOf("Sims." + name + " =") > -1, "missing Sims." + name); });
    ok(js.indexOf("SIEDeck.start(") > -1, "learn.js must call SIEDeck.start");
  });
});
