/* Chapter 2 facts that must agree across Textbook, Learning and Chapter 1. */
var tb = readFile("chapters/ch2/textbook.html"), ln = readFile("chapters/ch2/learn.html"), lnjs = readFile("chapters/ch2/learn.js");
test("liquidation order matches chapter 1 (wages → taxes → secured → …)", function () {
  ok(/Unpaid wages → unpaid taxes → secured creditors/i.test(tb), "textbook");
  ok(ln.indexOf("Unpaid wages") > -1 && ln.indexOf("Junior unsecured") > -1, "learning ladder");
});
test("par is $100 and dividends are figured from par", function () {
  ok(/\$100 par/.test(tb) && /\$100 par/.test(ln));
  ok(/always (figured|based) (from|on) par/i.test(tb), "textbook states the dividend is always based on par");
});
test("worked examples use the agreed numbers", function () {
  ok(tb.indexOf("17%") > -1 || tb.indexOf("$17") > -1, "cumulative example totals $17 per share (17%)");
  ok(tb.indexOf("$2,500") > -1 && ln.indexOf("$2,500") > -1, "conversion example gains $2,500");
  ok(tb.indexOf("102") > -1 && ln.indexOf("102") > -1, "call premium example at 102");
});
