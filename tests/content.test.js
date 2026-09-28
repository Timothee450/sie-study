/* Cross-page content consistency (Textbook vs Learning vs Quiz). */
var tb = readFile("chapters/ch1/textbook.html"), tbjs = readFile("chapters/ch1/textbook.js");
var ln = readFile("chapters/ch1/learn.html"), lnjs = readFile("chapters/ch1/learn.js");
test("textbook liquidation order starts with unpaid wages and taxes, like the Learning sim", function () {
  ok(/Unpaid wages → unpaid taxes → secured creditors/i.test(tb), "textbook exam tip lacks wages → taxes → secured");
  ok(tbjs.indexOf('"Unpaid wages"') > -1 && tbjs.indexOf('"Unpaid taxes"') > -1, "textbook widget lacks wage/tax tiers");
  ok(lnjs.indexOf("['Unpaid wages'") > -1, "learning sim changed unexpectedly");
});
test("learning teaches interest rate risk as systematic", function () {
  ok(lnjs.indexOf("['Interest rate risk', 'sys'") > -1, "sorter has no systematic interest-rate card");
  ok(/<span class="chip">Interest rate risk<\/span>/.test(ln), "systematic slide lacks interest rate chip");
  ok(ln.indexOf("Systematic (market, inflation, interest rate)") > -1, "must-remember card not updated");
  ok(lnjs.indexOf("Only 2 risks are systematic") === -1, "sorter still says only 2 are systematic");
});
test("learning never calls the $10 spread 'value of 1 right'", function () {
  ok(ln.indexOf("value of 1 right") === -1);
});
