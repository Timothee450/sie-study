/* Chapter 3 learning deck: simulators. The slide engine is assets/deck.js. */
(() => {
const { $, $$, RM, D, clamp, num, usd, pressSeg } = SIEDeck;

const PAR = 1000;
// Shared math, one function per concept
const M = {
  interest: rate => rate / 100 * PAR,
  currentYield: (interest, price) => interest / price * 100,
  // Semiannual bond price from coupon rate, years to maturity and yield (all annual percentages)
  price: (cpn, yrs, yld) => {
    const n = Math.round(yrs * 2), c = cpn / 100 * PAR / 2, i = yld / 200;
    return i === 0 ? c * n + PAR : c * (1 - Math.pow(1 + i, -n)) / i + PAR * Math.pow(1 + i, -n);
  },
  // Yield to maturity by bisection: price falls as yield rises
  ytm: (cpn, yrs, price) => {
    let lo = 0, hi = 40;
    for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2; if (M.price(cpn, yrs, mid) > price) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  },
};
const pct = v => num(v, 2) + '%';
const money = v => '$' + num(v, 2);

const Sims = {};

Sims.coupon = s => {
  const r = $('#cp-rate', s), p = $('#cp-px', s);
  const upd = () => {
    const rate = +r.value, q = +p.value, i = M.interest(rate);
    $('#cp-rate-o').textContent = rate + '%'; $('#cp-px-o').textContent = q;
    $('#cp-yr').textContent = usd(i); $('#cp-half').textContent = usd(i / 2);
    $('#cp-f').innerHTML = `Interest = <b>${rate}%</b> × $1,000 par = <b>${usd(i)}</b> a year` + (q !== 100 ? ` <span style="color:var(--ink-2)">(price $${num(q * 10)} doesn't matter)</span>` : '');
  };
  r.oninput = upd; p.oninput = upd; upd();
};

Sims.seesaw = s => {
  const p = $('#ss-px', s), interest = M.interest(5);
  const upd = () => {
    const q = +p.value, price = q * 10, y = M.currentYield(interest, price);
    $('#ss-px-o').textContent = q;
    $('#ss-pl').textContent = '$' + num(price); $('#ss-yl').textContent = pct(y);
    gsap.to('#ss-beam', { rotation: clamp((q - 100) / 20 * 12, -12, 12), svgOrigin: '200 108', duration: D(.5), ease: 'power2.out' });
    const kind = q < 100 ? 'Discount: yield is above the 5% coupon' : q > 100 ? 'Premium: yield is below the 5% coupon' : 'At par: yield equals the 5% coupon';
    $('#ss-f').innerHTML = `$50 ÷ $${num(price)} = <b>${pct(y)}</b> · ${kind}`;
  };
  p.oninput = upd; upd();
};

Sims.yields = s => {
  const btns = $$('#yl-btns button', s);
  let q = 100;
  const upd = () => {
    const price = q * 10, cy = M.currentYield(M.interest(5), price), ytm = M.ytm(5, 10, price);
    const set = (id, v) => { $('#yl-' + id).textContent = pct(v); gsap.to('#yl-' + id + '-b', { width: clamp(v / 8 * 100, 4, 100) + '%', duration: D(.4) }); };
    set('ytm', ytm); set('cy', cy); set('cp', 5);
    $('#yl-f').innerHTML = q < 100 ? `Discount ($${num(price)}): <b>YTM ${pct(ytm)} &gt; current yield ${pct(cy)} &gt; coupon 5.00%</b>`
      : q > 100 ? `Premium ($${num(price)}): <b>coupon 5.00% &gt; current yield ${pct(cy)} &gt; YTM ${pct(ytm)}</b>`
        : 'At par ($1,000): <b>all three are 5.00%</b>';
  };
  btns.forEach(b => b.onclick = () => { q = +b.dataset.px; pressSeg(btns, b); upd(); });
  upd();
};

Sims.rates = s => {
  const r = $('#rt-r', s), btns = $$('#rt-btns button', s);
  let yrs = 10;
  const upd = () => {
    const mkt = +r.value, px = M.price(5, yrs, mkt), chg = (px / PAR - 1) * 100;
    $('#rt-r-o').textContent = num(mkt, 1) + '%';
    $('#rt-px').textContent = money(px);
    $('#rt-chg').textContent = (chg > 0.005 ? '+' : chg < -0.005 ? '−' : '') + num(Math.abs(chg), 2) + '%';
    $('#rt-px').className = 'v ' + (px > PAR + 0.005 ? 'pos' : px < PAR - 0.005 ? 'neg' : '');
    gsap.to('#rt-bar', { width: clamp(px / 2000 * 100, 4, 100) + '%', duration: D(.4) });
    $('#rt-f').innerHTML = mkt > 5 ? `Rates above the 5% coupon → price <b>falls</b> below par` : mkt < 5 ? `Rates below the 5% coupon → price <b>rises</b> above par` : `Rates at 5% → price sits at <b>par</b>`;
  };
  btns.forEach(b => b.onclick = () => { yrs = +b.dataset.y; pressSeg(btns, b); upd(); });
  r.oninput = upd; upd();
};

// Tap-a-card, tap-a-bucket sorter shared by the ratings game
const sorter = (s, { cards, trayId, resetId, fbId, start, done }) => {
  const tray = $(trayId, s), buckets = $$('.bucket', s), fb = $(fbId, s);
  let sel = null;
  const deal = () => {
    sel = null; buckets.forEach(b => { $('.bucket-list', b).innerHTML = ''; b.classList.remove('hot'); });
    const order = cards.map((c, i) => i).sort(() => Math.random() - .5);
    tray.innerHTML = order.map(i => `<button type="button" class="risk-card" data-i="${i}">${cards[i][0]}</button>`).join('');
    fb.textContent = start;
    $$('.risk-card', tray).forEach(c => c.onclick = () => {
      $$('.risk-card', tray).forEach(x => x.classList.toggle('sel', x === c && sel !== c));
      sel = sel === c ? null : c;
      buckets.forEach(b => b.classList.toggle('hot', !!sel));
      if (sel) fb.textContent = `"${c.textContent}": now tap where it belongs.`;
    });
  };
  const place = b => {
    if (!sel) { fb.textContent = 'Pick a card first.'; return; }
    const card = cards[+sel.dataset.i];
    if (card[1] !== b.dataset.type) { fb.innerHTML = `<b class="neg">Not quite.</b> ${card[3]}`; return; }
    sel.classList.remove('sel'); sel.classList.add('placed'); sel.onclick = null; $('.bucket-list', b).appendChild(sel); sel = null;
    buckets.forEach(x => x.classList.remove('hot'));
    const left = $$('.risk-card', tray).length;
    fb.innerHTML = `<b class="pos">Yes.</b> ${card[2]}` + (left ? '' : ` <b>${done}</b>`);
  };
  buckets.forEach(b => { b.onclick = () => place(b); b.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); place(b); } }; });
  $(resetId, s).onclick = deal;
  deal();
};

Sims.ratings = s => sorter(s, {
  trayId: '#rs-tray', resetId: '#rs-reset', fbId: '#rs-fb', start: 'Pick a rating to start.',
  done: 'All sorted. The line sits between BBB and BB.',
  cards: [
    ['AAA (S&P)', 'ig', 'AAA is the top rating: investment grade.', 'AAA is the top rating, so it is investment grade.'],
    ['A (S&P)', 'ig', 'A is above BBB, so investment grade.', 'A is above BBB, so it is investment grade.'],
    ['BBB (S&P)', 'ig', 'BBB is the lowest investment-grade rating.', 'BBB is the lowest investment-grade rating.'],
    ['Baa (Moody\'s)', 'ig', 'Baa is Moody\'s version of BBB: still investment grade.', 'Baa is Moody\'s version of BBB, so it is investment grade.'],
    ['BB (S&P)', 'hy', 'BB is just below the line: high yield.', 'BB is below BBB, so it is high yield.'],
    ['Ba (Moody\'s)', 'hy', 'Ba is Moody\'s version of BB: high yield.', 'Ba is Moody\'s version of BB, so it is high yield.'],
    ['B (S&P)', 'hy', 'B is well below investment grade: high yield.', 'B is well below BBB, so it is high yield.'],
  ],
});

Sims.riskmatch = s => {
  const RISKS = ['Interest rate', 'Credit', 'Inflation', 'Call', 'Reinvestment'];
  const SCEN = [
    ['Rates jump to 8% and your 4% bond drops to $850 in the market.', 0],
    ['The issuer misses its interest payment.', 1],
    ['Prices rise 6% a year, so your fixed $40 of yearly interest buys less and less.', 2],
    ['The issuer takes your bond back early at a set price.', 3],
    ['Your bond matures, but new bonds pay only half of what you were earning.', 4],
  ];
  const box = $('#rk-btns', s), fb = $('#rk-fb', s), nextBtn = $('#rk-next', s);
  let order = [], at = 0, answered = false;
  const show = () => {
    const [text] = SCEN[order[at]];
    answered = false;
    $('#rk-q').textContent = text; $('#rk-count').textContent = `Scenario ${at + 1} of ${SCEN.length}`;
    fb.textContent = 'Pick the risk that fits.';
    $$('button', box).forEach(b => b.setAttribute('aria-pressed', 'false'));
  };
  box.innerHTML = RISKS.map((r, i) => `<button type="button" data-i="${i}" aria-pressed="false">${r}</button>`).join('');
  $$('button', box).forEach(b => b.onclick = () => {
    if (answered) return;
    const right = SCEN[order[at]][1], pick = +b.dataset.i;
    pressSeg($$('button', box), b);
    if (pick === right) { answered = true; fb.innerHTML = `<b class="pos">Yes: ${RISKS[right]} risk.</b>`; }
    else fb.innerHTML = `<b class="neg">Not quite.</b> Try another.`;
  });
  nextBtn.onclick = () => {
    if (!answered) { fb.textContent = 'Find the right risk first.'; return; }
    at = (at + 1) % SCEN.length;
    if (at === 0) order.sort(() => Math.random() - .5);
    show();
  };
  order = SCEN.map((x, i) => i).sort(() => Math.random() - .5);
  show();
};

SIEDeck.start({
  sections: { intro: 'Intro', '3.1': 'Bond basics', '3.2': 'Price and yield', '3.3': 'Issuers and ratings', '3.4': 'Risks and suitability', end: 'Review' },
  sims: Sims,
});
})();
