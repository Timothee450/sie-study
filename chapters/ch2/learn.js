/* Chapter 2 learning deck: simulators. The slide engine is assets/deck.js. */
(() => {
const { $, $$, RM, D, clamp, num, usd, pressSeg } = SIEDeck;

const PAR = 100;
// Shared math, one function per concept
const M = {
  dividend: rate => rate / 100 * PAR,
  currentYield: (div, price) => div / price * 100,
  priceAtRate: (div, mktRate) => div / (mktRate / 100),            // price at which the fixed dividend earns the market rate
  owedBeforeCommon: (rate, skipped, partialPct, cumulative) => {
    const d = M.dividend(rate);
    if (!cumulative) return d;
    const shortfall = partialPct > 0 ? d - Math.min(partialPct, rate) / 100 * PAR : 0;
    return skipped * d + shortfall + d;
  },
  conversionValue: (ratio, common) => ratio * common,
  parity: (pref, ratio) => pref / ratio,
};
const pct = v => num(v, 2) + '%';
const money = v => '$' + num(v, 2);

const Sims = {};

Sims.pardiv = s => {
  const r = $('#pd-rate', s), p = $('#pd-px', s);
  const upd = () => {
    const rate = +r.value, px = +p.value, d = M.dividend(rate);
    $('#pd-rate-o').textContent = rate + '%'; $('#pd-px-o').textContent = '$' + px;
    $('#pd-div').textContent = money(d); $('#pd-q').textContent = money(d / 4);
    $('#pd-f').innerHTML = `Dividend = <b>${rate}%</b> × $100 par = <b>${money(d)}</b>` + (px !== PAR ? ` <span style="color:var(--ink-2)">(price $${px} doesn't matter)</span>` : '');
  };
  r.oninput = upd; p.oninput = upd; upd();
};

Sims.seesaw = s => {
  const p = $('#ss-px', s), div = M.dividend(5);
  const upd = () => {
    const px = +p.value, y = M.currentYield(div, px);
    $('#ss-px-o').textContent = '$' + px;
    $('#ss-pl').textContent = '$' + px; $('#ss-yl').textContent = pct(y);
    gsap.to('#ss-beam', { rotation: clamp((px - PAR) / 40 * 12, -12, 12), svgOrigin: '200 108', duration: D(.5), ease: 'power2.out' });
    const kind = px < PAR ? 'Discount: yield is above the 5% rate' : px > PAR ? 'Premium: yield is below the 5% rate' : 'At par: yield equals the 5% rate';
    $('#ss-f').innerHTML = `$5 ÷ $${px} = <b>${pct(y)}</b> · ${kind}`;
  };
  p.oninput = upd; upd();
};

Sims.rates = s => {
  const r = $('#rt-r', s), div = M.dividend(5);
  const upd = () => {
    const mkt = +r.value, px = M.priceAtRate(div, mkt);
    $('#rt-r-o').textContent = num(mkt, 1) + '%';
    $('#rt-px').textContent = money(px); $('#rt-y').textContent = pct(M.currentYield(div, px));
    $('#rt-px').className = 'v ' + (px > PAR + 0.005 ? 'pos' : px < PAR - 0.005 ? 'neg' : '');
    gsap.to('#rt-bar', { width: clamp(px / 250 * 100, 4, 100) + '%', duration: D(.4) });
    $('#rt-f').innerHTML = mkt > 5 ? `Rates above 5% → price <b>falls</b> below par` : mkt < 5 ? `Rates below 5% → price <b>rises</b> above par` : `Rates at 5% → price sits at <b>par</b>`;
  };
  r.oninput = upd; upd();
};

Sims.arrears = s => {
  const skip = $('#ar-skip', s), part = $('#ar-part', s), bC = $('#ar-cum', s), bS = $('#ar-str', s), box = $('#ar-years', s);
  let cumulative = true;
  const upd = () => {
    const k = +skip.value, pp = +part.value, d = M.dividend(5);
    $('#ar-skip-o').textContent = k; $('#ar-part-o').textContent = pp + '%';
    const years = [];
    for (let i = 0; i < k; i++) years.push({ cls: 'skip', label: 'Skipped', owed: cumulative ? d : 0 });
    if (pp > 0) years.push({ cls: 'part', label: 'Paid ' + pp + '%', owed: cumulative ? d - pp : 0 });
    years.push({ cls: 'now', label: 'This year', owed: d });
    box.style.gridTemplateColumns = `repeat(${years.length},minmax(0,1fr))`;
    box.innerHTML = years.map((y, i) => `<div class="yr ${y.cls}"><span>${y.cls === 'now' ? 'Now' : 'Year ' + (i + 1)}</span><span>${y.label}</span><b>${y.owed ? '$' + y.owed : '—'}</b></div>`).join('');
    if (!RM) gsap.from(box.children, { y: 10, opacity: 0, duration: .25, stagger: .05 });
    const total = M.owedBeforeCommon(5, k, pp, cumulative);
    $('#ar-f').innerHTML = cumulative
      ? `Before any common dividend: ${years.filter(y => y.owed).map(y => '$' + y.owed).join(' + ')} = <b>$${total}</b> per share (${total}% of par)`
      : `Straight: missed dividends are gone. Only this year's <b>$${total}</b> must be paid before common.`;
  };
  bC.onclick = () => { cumulative = true; pressSeg([bC, bS], bC); upd(); };
  bS.onclick = () => { cumulative = false; pressSeg([bC, bS], bS); upd(); };
  skip.oninput = upd; part.oninput = upd; upd();
};

Sims.call = s => {
  const r = $('#cl-r', s), prot = $('#cl-prot', s), fb = $('#cl-fb', s);
  const upd = () => {
    const rate = +r.value; $('#cl-r-o').textContent = num(rate, 1) + '%';
    if (prot.checked) { fb.innerHTML = '<b>No call possible.</b> The issuer has to wait until the 10-year call protection ends.'; return; }
    if (rate < 5) {
      const save = 5 - rate;
      fb.innerHTML = `<b class="neg">Call!</b> The issuer sells new ${num(rate, 1)}% preferred and calls yours at <b>$102</b>, saving ${money(save)} a share every year. You get $102 back, but can only reinvest at about ${num(rate, 1)}%: reinvestment risk.`;
    } else fb.innerHTML = `<b>No reason to call.</b> New preferred would cost the issuer ${num(rate, 1)}%, no cheaper than the 5% it already pays.`;
  };
  r.oninput = upd; prot.onchange = upd; upd();
};

Sims.convert = s => {
  const btns = $$('#cv-ratios button', s), com = $('#cv-com', s), pref = $('#cv-pref', s), fb = $('#cv-fb', s);
  let ratio = 2;
  const upd = () => {
    const c = +com.value, p = +pref.value, val = M.conversionValue(ratio, c), gap = val - p;
    $('#cv-com-o').textContent = '$' + c; $('#cv-pref-o').textContent = '$' + p;
    $('#cv-val').textContent = usd(val); $('#cv-par').textContent = usd(M.parity(p, ratio));
    fb.innerHTML = gap > 0
      ? `<b class="pos">Arbitrage!</b> Buy the preferred for $${p}, convert into ${ratio} common and sell for ${usd(val)}: <b>+${usd(gap)}</b> a share. Traders do this until the gap closes.`
      : gap < 0 ? `Converting is worth ${usd(val)}, less than the $${p} the preferred trades for. No reason to convert yet.`
        : 'At parity: the preferred and its conversion value are equal.';
  };
  btns.forEach(b => b.onclick = () => { ratio = +b.dataset.r; pressSeg(btns, b); upd(); });
  com.oninput = upd; pref.oninput = upd; upd();
};

Sims.featsort = s => {
  const CARDS = [
    ['Cumulative', 'inv', 'Missed dividends still have to be paid. That protects you.'],
    ['Participating', 'inv', 'You can receive more than the stated rate in good years.'],
    ['Convertible', 'inv', 'You can swap into common and share in growth.'],
    ['Callable', 'iss', 'The issuer can take the shares back when rates fall.'],
    ['Straight (non-cumulative)', 'iss', 'Skipped dividends are simply lost. That saves the issuer money.'],
  ];
  const tray = $('#fs-tray', s), buckets = $$('.bucket', s), fb = $('#fs-fb', s);
  let sel = null;
  const deal = () => {
    sel = null; buckets.forEach(b => { $('.bucket-list', b).innerHTML = ''; b.classList.remove('hot'); });
    const order = CARDS.map((c, i) => i).sort(() => Math.random() - .5);
    tray.innerHTML = order.map(i => `<button type="button" class="risk-card" data-i="${i}">${CARDS[i][0]}</button>`).join('');
    fb.textContent = 'Pick a card to start.';
    $$('.risk-card', tray).forEach(c => c.onclick = () => {
      $$('.risk-card', tray).forEach(x => x.classList.toggle('sel', x === c && sel !== c));
      sel = sel === c ? null : c;
      buckets.forEach(b => b.classList.toggle('hot', !!sel));
      if (sel) fb.textContent = `"${c.textContent}": now tap who it helps.`;
    });
  };
  const place = b => {
    if (!sel) { fb.textContent = 'Pick a card first.'; return; }
    const card = CARDS[+sel.dataset.i];
    if (card[1] !== b.dataset.type) { fb.innerHTML = `<b class="neg">Not quite.</b> ${card[0]} helps the ${card[1] === 'inv' ? 'investor' : 'issuer'}.`; return; }
    sel.classList.remove('sel'); sel.classList.add('placed'); sel.onclick = null; $('.bucket-list', b).appendChild(sel); sel = null;
    buckets.forEach(x => x.classList.remove('hot'));
    const left = $$('.risk-card', tray).length;
    fb.innerHTML = `<b class="pos">Yes.</b> ${card[2]}` + (left ? '' : ' <b>All sorted. Investor-friendly features raise the price and lower the yield.</b>');
  };
  buckets.forEach(b => { b.onclick = () => place(b); b.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); place(b); } }; });
  $('#fs-reset', s).onclick = deal;
  deal();
};

Sims.income = s => {
  const sh = $('#in-sh', s), r = $('#in-rate', s);
  const upd = () => {
    const n = +sh.value, rate = +r.value, yr = M.dividend(rate) * n;
    $('#in-sh-o').textContent = num(n); $('#in-rate-o').textContent = rate + '%';
    $('#in-yr').textContent = usd(yr); $('#in-q').textContent = usd(yr / 4);
    $('#in-f').innerHTML = `${rate}% × $100 par × ${num(n)} shares = <b>${usd(yr)}</b> a year`;
  };
  sh.oninput = upd; r.oninput = upd; upd();
};

SIEDeck.start({
  sections: { intro: 'Intro', '2.1': 'Basic characteristics', '2.2': 'Features', '2.3': 'Suitability', end: 'Review' },
  sims: Sims,
});
})();
