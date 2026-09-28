/* Chapter 1 textbook widgets (ported from the original chapter page). */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var fmtInt = function (n) { return Math.round(n).toLocaleString("en-US"); };
  var fmtUsd = function (n) { return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var num = function (el) { var v = parseFloat(el.value); return isFinite(v) ? v : 0; };

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
    document.querySelectorAll('.tb-body [id^="s1-"]').forEach(function (s) { io.observe(s); });
  }
  links.forEach(function (a) { a.addEventListener("click", function () { if (details && window.matchMedia("(max-width:860px)").matches) details.open = false; }); });

  /* ---------- 1.1 Liquidation ---------- */
  var claims = [
    { name: "Unpaid wages", amt: 5 },
    { name: "Unpaid taxes", amt: 5 },
    { name: "Secured creditors", amt: 35 },
    { name: "Unsecured creditors & debentures", amt: 25 },
    { name: "Subordinated debt", amt: 10 },
    { name: "Preferred stockholders", amt: 10 },
    { name: "Common stockholders", amt: null }
  ];
  var liqStack = $("liq-stack");
  claims.forEach(function (c, i) {
    var row = document.createElement("div");
    row.className = "claim" + (c.amt === null ? " common" : "");
    row.innerHTML = '<span class="rank">' + (i + 1) + '</span><div class="bar"><div class="fill"></div><div class="name"></div></div><span class="paid"></span>';
    row.querySelector(".name").textContent = c.name + (c.amt === null ? " (residual)" : " · owed $" + c.amt + "M");
    liqStack.appendChild(row); c.row = row;
  });
  function liq() {
    var cash = num($("liq-amt")), left = cash, senior = 90;
    $("liq-amt-out").textContent = "$" + cash + "M";
    claims.forEach(function (c) {
      var paid, pct;
      if (c.amt === null) { paid = left; pct = cash > senior ? Math.min(100, paid / 60 * 100) : 0; }
      else { paid = Math.min(left, c.amt); pct = paid / c.amt * 100; }
      left -= paid;
      c.row.querySelector(".fill").style.width = pct + "%";
      c.row.querySelector(".paid").textContent = "$" + paid + "M" + (c.amt !== null && paid < c.amt ? " of " + c.amt : "");
    });
    var shares = 20;
    $("liq-note").textContent = cash > senior
      ? "Common stockholders split the $" + (cash - senior) + "M left over. With 20M shares outstanding, that is " + fmtUsd((cash - senior) / shares) + " per share."
      : "Nothing is left for common stockholders. Their shares are worth $0, but limited liability means they owe nothing more.";
  }
  $("liq-amt").addEventListener("input", liq); liq();

  /* ---------- 1.2 Share counts ---------- */
  function shares() {
    var A = Math.max(0, num($("sc-auth"))), I = Math.max(0, num($("sc-iss"))), T = Math.max(0, num($("sc-tre")));
    var w = $("sc-warn"), msg = "";
    if (I > A) msg = "Issued shares cannot exceed authorized shares. The company would need a shareholder vote to amend its charter first.";
    else if (T > I) msg = "Treasury shares cannot exceed issued shares. The company can only buy back shares it has already issued.";
    w.hidden = !msg; w.textContent = msg;
    var out = Math.max(0, I - T), un = Math.max(0, A - I), tot = Math.max(A, I, 1);
    $("sc-out").textContent = fmtInt(out); $("sc-un").textContent = fmtInt(un);
    $("sc-seg-out").style.flexBasis = (out / tot * 100) + "%";
    $("sc-seg-tre").style.flexBasis = (Math.min(T, I) / tot * 100) + "%";
    $("sc-seg-un").style.flexBasis = (un / tot * 100) + "%";
  }
  ["sc-auth", "sc-iss", "sc-tre"].forEach(function (id) { $(id).addEventListener("input", shares); }); shares();

  /* ---------- 1.4 Voting ---------- */
  function candRow(label, v, max) {
    var d = document.createElement("div"); d.className = "cand";
    d.innerHTML = '<span></span><span class="track"><span></span></span><span class="v"></span>';
    d.children[0].textContent = label;
    d.querySelector(".track span").style.width = (max ? v / max * 100 : 0) + "%";
    d.children[2].textContent = fmtInt(v);
    return d;
  }
  function voting() {
    var S = Math.max(1, Math.floor(num($("v-sh")))), N = Math.min(12, Math.max(1, Math.floor(num($("v-seats")))));
    var kEl = $("v-k"); kEl.max = N; if (+kEl.value > N) kEl.value = N;
    var k = +kEl.value, total = S * N, each = Math.floor(total / k), max = total;
    $("v-k-out").textContent = k;
    var st = $("v-stat"), cu = $("v-cum"); st.innerHTML = ""; cu.innerHTML = "";
    for (var i = 0; i < N; i++) {
      st.appendChild(candRow("Seat " + (i + 1), S, max));
      cu.appendChild(candRow("Seat " + (i + 1), i < k ? (i === k - 1 ? total - each * (k - 1) : each) : 0, max));
    }
    $("v-stat-note").textContent = "Up to " + fmtInt(S) + " votes per seat, " + fmtInt(total) + " in total. You cannot move votes between seats.";
    $("v-cum-note").textContent = "Same " + fmtInt(total) + " votes (" + fmtInt(S) + " × " + N + "), but you may put all of them on one candidate.";
  }
  ["v-sh", "v-seats", "v-k"].forEach(function (id) { $(id).addEventListener("input", voting); }); voting();

  /* ---------- 1.5 Yield ---------- */
  function yieldCalc() {
    var q = Math.max(0, num($("y-div"))), p = num($("y-px")), ann = q * 4;
    $("y-ann").textContent = fmtUsd(ann);
    $("y-yld").textContent = p > 0 ? (ann / p * 100).toFixed(2) + "%" : "–";
  }
  ["y-div", "y-px"].forEach(function (id) { $(id).addEventListener("input", yieldCalc); }); yieldCalc();

  /* ---------- 1.5 Dividend timeline ---------- */
  var DAY = 864e5;
  function parseD(s) { if (!s) return null; var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function isBD(d) { var w = d.getDay(); return w !== 0 && w !== 6; }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function addBD(d, n) { var x = new Date(d); while (n > 0) { x = addDays(x, 1); if (isBD(x)) n--; } return x; }
  function fmtD(d) { return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }); }
  function exDateFor(rec) {
    // First business day whose T+1 settlement falls after the record date
    var t = addDays(rec, -10);
    while (!(isBD(t) && addBD(t, 1) > rec)) t = addDays(t, 1);
    return t;
  }
  function timeline() {
    var dec = parseD($("d-dec").value), rec = parseD($("d-rec").value), pay = parseD($("d-pay").value), trd = parseD($("d-trd").value);
    var warn = [], tl = $("d-tl"), list = $("d-list"), ver = $("d-verdict");
    tl.querySelectorAll(".tl-dot, .tl-ok").forEach(function (n) { n.remove(); });
    list.innerHTML = "";
    if (!dec || !rec || !pay || !trd) { ver.className = "verdict"; ver.textContent = "Fill in all four dates."; return; }
    if (!(dec < rec)) warn.push("The declaration date should come before the record date.");
    if (!(rec < pay)) warn.push("The payable date should come after the record date.");
    if (!isBD(rec)) warn.push("Record dates normally fall on a business day.");
    if (!isBD(trd)) warn.push("Your trade date is a weekend, when the market is closed.");
    var ex = exDateFor(rec), settle = addBD(trd, 1);
    var events = [
      { i: 0, k: "D", d: dec, name: "Declaration", cls: "" },
      { i: 1, k: "E", d: ex, name: "Ex-dividend", cls: "ex" },
      { i: 2, k: "R", d: rec, name: "Record", cls: "" },
      { i: 3, k: "P", d: pay, name: "Payable", cls: "" },
      { i: 4, k: "T", d: trd, name: "Your trade", cls: "tr" }
    ];
    var times = events.map(function (e) { return e.d.getTime(); });
    var lo = Math.min.apply(null, times), hi = Math.max.apply(null, times), span = Math.max(hi - lo, DAY);
    var pos = function (d) { return (d.getTime() - lo) / span * 100; };
    var ok = document.createElement("div"); ok.className = "tl-ok";
    ok.style.left = "0%"; ok.style.width = Math.max(0, pos(addDays(ex, -1))) + "%";
    ok.title = "Buy in this window to get the dividend";
    tl.appendChild(ok);
    events.forEach(function (e) {
      var dot = document.createElement("span"); dot.className = "tl-dot " + e.cls;
      dot.style.left = pos(e.d) + "%"; dot.textContent = e.k; tl.appendChild(dot);
    });
    events.slice().sort(function (a, b) { return a.d - b.d || a.i - b.i; }).forEach(function (e) {
      var li = document.createElement("li");
      var extra = e.k === "T" ? " · settles " + fmtD(settle) : e.k === "E" ? " · set by the exchange" : "";
      li.innerHTML = '<span class="k"></span><span class="d"></span><span></span>';
      li.children[0].textContent = e.k; li.children[1].textContent = fmtD(e.d); li.children[2].textContent = e.name + extra;
      list.appendChild(li);
    });
    var gets = trd < ex;
    ver.className = "verdict " + (gets ? "yes" : "no");
    ver.textContent = gets
      ? "You get the dividend. Your trade settles " + fmtD(settle) + ", on or before the record date, so you are the holder of record."
      : "No dividend for you. You bought on or after the ex-date, so your trade settles after the record date and the seller keeps the dividend.";
    var w = $("d-warn"); w.hidden = !warn.length; w.textContent = warn.join(" ");
  }
  ["d-dec", "d-rec", "d-pay", "d-trd"].forEach(function (id) { $(id).addEventListener("input", timeline); }); timeline();

  /* ---------- 1.6 Splits ---------- */
  function split() {
    var sh = Math.max(0, num($("sp-sh"))), px = Math.max(0, num($("sp-px")));
    var n = Math.max(1, num($("sp-new"))), o = Math.max(1, num($("sp-old")));
    var raw = sh * n / o, whole = Math.floor(raw + 1e-9), frac = raw - whole, npx = px * o / n;
    $("sp-before").textContent = fmtInt(sh) + " @ " + fmtUsd(px);
    $("sp-after").textContent = fmtInt(whole) + " @ " + fmtUsd(npx);
    $("sp-val").textContent = fmtUsd(sh * px);
    var kind = n > o ? "Forward split: more shares at a lower price." : n < o ? "Reverse split: fewer shares at a higher price." : "A 1-for-1 ratio changes nothing.";
    var fracNote = frac > 1e-6 ? " The " + frac.toFixed(2) + " fractional share is normally paid out in cash (" + fmtUsd(frac * npx) + ")." : "";
    $("sp-note").textContent = kind + " Your position is still worth " + fmtUsd(sh * px) + "." + fracNote;
  }
  ["sp-sh", "sp-px", "sp-new", "sp-old"].forEach(function (id) { $(id).addEventListener("input", split); });
  document.querySelectorAll("[data-split]").forEach(function (b) {
    b.addEventListener("click", function () { var r = b.getAttribute("data-split").split(","); $("sp-new").value = r[0]; $("sp-old").value = r[1]; split(); });
  });
  split();

  /* ---------- 1.7 Rights ---------- */
  function rights() {
    var M = num($("r-m")), S = num($("r-s")), N = Math.max(1, Math.floor(num($("r-n"))));
    var v = (M - S) / (N + 1);
    if (M <= S) {
      $("r-val").textContent = "$0.00"; $("r-ex").textContent = fmtUsd(M);
      $("r-note").textContent = "The subscription price is at or above market, so the rights have no value. Rights offerings are priced below market for this reason.";
    } else {
      $("r-val").textContent = fmtUsd(v); $("r-ex").textContent = fmtUsd(M - v);
      $("r-note").textContent = "Check: (" + fmtUsd(M - v) + " − " + fmtUsd(S) + ") ÷ " + N + " = " + fmtUsd((M - v - S) / N) + ", the same value measured after the stock goes ex-rights.";
    }
    $("r-cost").textContent = N + " rights + " + fmtUsd(S);
  }
  ["r-m", "r-s", "r-n"].forEach(function (id) { $(id).addEventListener("input", rights); }); rights();
})();
