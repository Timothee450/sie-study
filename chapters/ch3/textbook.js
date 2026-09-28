/* Chapter 3 textbook widgets. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var fmtUsd = function (n) { return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var pct = function (n) { return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%"; };
  var num = function (el) { var v = parseFloat(el.value); return isFinite(v) ? v : 0; };
  var PAR = 1000;

  /* Semiannual bond price: coupon rate, years to maturity and yield are all annual percentages. */
  function bondPrice(cpn, yrs, yld) {
    var n = Math.round(yrs * 2), c = cpn / 100 * PAR / 2, i = yld / 100 / 2;
    if (i === 0) return c * n + PAR;
    return c * (1 - Math.pow(1 + i, -n)) / i + PAR * Math.pow(1 + i, -n);
  }

  /* ---------- Contents: highlight the section in view ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll(".tb-toc a"));
  var details = document.getElementById("toc-details");
  if (details && window.matchMedia && window.matchMedia("(max-width:860px)").matches) details.open = false;
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id); });
      });
    }, { rootMargin: "-35% 0px -60% 0px" });
    document.querySelectorAll('.tb-body [id^="s3-"]').forEach(function (s) { io.observe(s); });
  }
  links.forEach(function (a) { a.addEventListener("click", function () { if (details && window.matchMedia("(max-width:860px)").matches) details.open = false; }); });

  /* ---------- 3.1 Interest and current yield ---------- */
  function yieldCalc() {
    var rate = Math.max(0, num($("b-rate"))), quote = num($("b-px")), n = Math.max(0, Math.floor(num($("b-n"))));
    var interest = rate / 100 * PAR, price = quote / 100 * PAR;
    $("b-int").textContent = fmtUsd(interest);
    $("b-inc").textContent = fmtUsd(interest * n);
    if (price <= 0) { $("b-yld").textContent = "—"; $("b-note").textContent = "Enter a price quote above 0."; return; }
    var y = interest / price * 100;
    $("b-yld").textContent = pct(y);
    $("b-note").textContent = "Price " + fmtUsd(price) + ". " + (quote < 100
      ? "Trading at a discount, so the current yield (" + pct(y) + ") is higher than the " + pct(rate) + " coupon rate."
      : quote > 100
        ? "Trading at a premium, so the current yield (" + pct(y) + ") is lower than the " + pct(rate) + " coupon rate."
        : "Trading at par, so the current yield equals the coupon rate.") +
      " Two payments of " + fmtUsd(interest / 2) + " a year per bond.";
  }
  ["b-rate", "b-px", "b-n"].forEach(function (id) { $(id).addEventListener("input", yieldCalc); }); yieldCalc();

  /* ---------- 3.2 Price when market rates change ---------- */
  function priceCalc() {
    var cpn = Math.max(0, num($("p-cpn"))), yrs = Math.min(40, Math.max(1, num($("p-yrs")))), mkt = Math.max(0, num($("p-mkt")));
    var px = bondPrice(cpn, yrs, mkt), chg = (px / PAR - 1) * 100;
    $("p-px").textContent = fmtUsd(px);
    $("p-q").textContent = (px / PAR * 100).toFixed(2);
    $("p-chg").textContent = (chg > 0 ? "+" : chg < 0 ? "−" : "") + Math.abs(chg).toFixed(2) + "%";
    $("p-note").textContent = mkt > cpn
      ? "Market rates are above the " + pct(cpn) + " coupon, so the bond sells at a discount."
      : mkt < cpn ? "Market rates are below the " + pct(cpn) + " coupon, so the bond sells at a premium."
        : "Market rates equal the coupon rate, so the bond sells at par.";
  }
  ["p-cpn", "p-yrs", "p-mkt"].forEach(function (id) { $(id).addEventListener("input", priceCalc); }); priceCalc();
})();
