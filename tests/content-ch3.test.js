/* Chapter 3 facts that must agree across Textbook, Learning and earlier chapters. */
var tb = readFile("chapters/ch3/textbook.html"), ln = readFile("chapters/ch3/learn.html"), lnjs = readFile("chapters/ch3/learn.js");
test("liquidation order matches chapters 1 and 2 (wages → taxes → secured → …)", function () {
  ok(/Unpaid wages → unpaid taxes → secured creditors/i.test(tb), "textbook");
  ok(ln.indexOf("Unpaid wages") > -1 && ln.indexOf("Junior unsecured") > -1, "learning ladder");
});
test("par is $1,000 and interest is figured from par", function () {
  ok(/\$1,000 par/.test(tb) && /\$1,000 par/.test(ln));
  ok(/always (figured|based) (from|on) par/i.test(tb), "textbook states interest is always based on par");
  ok(!/\$100 par/.test(tb + ln), "$100 par belongs to preferred stock, not bonds");
});
test("worked example uses the agreed numbers", function () {
  ["$50", "$25", "5.26%"].forEach(function (n) { ok(tb.indexOf(n) > -1, "textbook missing " + n); });
  ok(ln.indexOf("$50") > -1 && ln.indexOf("$25") > -1, "learning deck shows $50 a year / $25 semiannual");
});
test("investment-grade line sits at BBB / Baa", function () {
  ok(/BBB/.test(tb) && /Baa/.test(tb) && /BB\b/.test(tb), "textbook names BBB, Baa and BB");
  ok(/BBB/.test(ln) && /BB\b/.test(ln), "learning deck names BBB and BB");
});
test("yield ordering rule is stated in both", function () {
  ok(/yield to maturity[^<]*(higher|greater|above)[^<]*current yield/i.test(tb) || /YTM[^<]*&gt;[^<]*current yield/i.test(tb), "textbook: discount bond YTM > current yield");
  ok(/YTM/.test(ln), "learning deck mentions YTM");
});
test("wording rule: the word 'free' never appears in page copy", function () {
  var text = (tb + ln).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, " ");
  ok(!/\bfree\b/i.test(text), "found 'free'");
});
