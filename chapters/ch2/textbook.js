/* Chapter 2 textbook widgets. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var fmtUsd = function (n) { return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var pct = function (n) { return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%"; };
  var num = function (el) { var v = parseFloat(el.value); return isFinite(v) ? v : 0; };
  var PAR = 100;

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
    document.querySelectorAll('.tb-body [id^="s2-"]').forEach(function (s) { io.observe(s); });
  }
  links.forEach(function (a) { a.addEventListener("click", function () { if (details && window.matchMedia("(max-width:860px)").matches) details.open = false; }); });

  /* ---------- 2.1 Dividend and current yield ---------- */
  function yieldCalc() {
    var rate = Math.max(0, num($("y-rate"))), px = num($("y-px")), sh = Math.max(0, Math.floor(num($("y-sh"))));
    var div = rate / 100 * PAR;
    $("y-div").textContent = fmtUsd(div);
    $("y-inc").textContent = fmtUsd(div * sh);
    if (px <= 0) { $("y-yld").textContent = "—"; $("y-note").textContent = "Enter a market price above $0."; return; }
    var y = div / px * 100;
    $("y-yld").textContent = pct(y);
    $("y-note").textContent = px < PAR
      ? "Trading at a discount ($" + px + " < $100 par), so the current yield (" + pct(y) + ") is higher than the " + pct(rate) + " dividend rate."
      : px > PAR
        ? "Trading at a premium ($" + px + " > $100 par), so the current yield (" + pct(y) + ") is lower than the " + pct(rate) + " dividend rate."
        : "Trading at par, so the current yield equals the dividend rate.";
  }
  ["y-rate", "y-px", "y-sh"].forEach(function (id) { $(id).addEventListener("input", yieldCalc); }); yieldCalc();

  /* ---------- 2.2 Dividends owed before common ---------- */
  function owedCalc() {
    var rate = Math.max(0, num($("c-rate"))), skip = Math.max(0, Math.floor(num($("c-skip")))), part = Math.max(0, num($("c-part")));
    var perYear = rate / 100 * PAR, partial = Math.min(part, rate) / 100 * PAR;
    var shortfall = part > 0 ? perYear - partial : 0;
    var cum = skip * perYear + shortfall + perYear, str = perYear;
    $("c-cum").textContent = fmtUsd(cum);
    $("c-str").textContent = fmtUsd(str);
    $("c-note").textContent = "Cumulative: " + skip + " skipped year(s) × " + fmtUsd(perYear) +
      (part > 0 ? " + " + fmtUsd(shortfall) + " short in the partial year" : "") +
      " + " + fmtUsd(perYear) + " for this year = " + fmtUsd(cum) + " per share (" + pct(cum) + " of par). Straight: only this year's " + fmtUsd(str) + ".";
  }
  ["c-rate", "c-skip", "c-part"].forEach(function (id) { $(id).addEventListener("input", owedCalc); }); owedCalc();

  /* ---------- 2.2 Conversion value ---------- */
  function convCalc() {
    var ratio = num($("v-ratio")), com = num($("v-com")), pref = num($("v-pref"));
    var val = ratio * com, parity = ratio > 0 ? pref / ratio : 0, v = $("v-verdict");
    $("v-val").textContent = fmtUsd(val);
    $("v-par").textContent = ratio > 0 ? fmtUsd(parity) : "—";
    var gap = val - pref;
    if (ratio <= 0) { v.className = "verdict no"; v.textContent = "Enter a conversion ratio above 0."; }
    else if (gap > 0.005) { v.className = "verdict yes"; v.textContent = "Arbitrage: buy the preferred for " + fmtUsd(pref) + ", convert into " + ratio + " common shares and sell them for " + fmtUsd(val) + ". Profit " + fmtUsd(gap) + " per share (before costs)."; }
    else if (gap < -0.005) { v.className = "verdict no"; v.textContent = "Converting now is worth " + fmtUsd(val) + ", less than the " + fmtUsd(pref) + " the preferred sells for. Keep the preferred (or sell it)."; }
    else { v.className = "verdict yes"; v.textContent = "At parity: the preferred and its conversion value are equal."; }
  }
  ["v-ratio", "v-com", "v-pref"].forEach(function (id) { $(id).addEventListener("input", convCalc); }); convCalc();
})();
