/* Chapter 1 learning deck: simulators and custom animations. The slide engine is assets/deck.js. */
(() => {
const { $, $$, RM, D, clamp, r2, num, qty, usd, short, big, arcPath, makePie, renderDots, pressSeg } = SIEDeck;

// Shared math, one function per concept
const M = {
  split: (shares, price, a, b) => { const f = a / b; return { f, shares: shares * f, price: price / f, value: shares * price }; },
  stockDiv: (shares, price, pct) => { const f = 1 + pct / 100; return { f, shares: shares * f, price: price / f, value: shares * price }; },
  capTier: v => v >= 2e11 ? 'Mega' : v >= 1e10 ? 'Large' : v >= 2e9 ? 'Mid' : v >= 2.5e8 ? 'Small' : 'Micro',
  pe: (p, eps) => p / eps,
  income: ({ rev, cogs, opex, int, taxRate, div }) => {
    const gp = rev - cogs, ebit = gp - opex, ebt = ebit - int, tax = Math.max(0, ebt) * taxRate / 100, ni = ebt - tax, re = ni - div;
    return { rev, cogs, gp, opex, ebit, int, ebt, tax, ni, div, re };
  },
  liquidate: (cash, claims) => { let left = cash; const paid = claims.map(c => { const p = Math.min(c, left); left -= p; return p; }); return { paid, residual: left }; },
};

/* ---------- hooks (custom per-step animation) ---------- */
const Hooks = {
  slice: {
    build(s) {
      const svg = $('#slice-svg'); let h = '';
      for (let i = 0; i < 10; i++) h += `<path d="${arcPath(160, 160, 130, i * Math.PI / 5, (i + 1) * Math.PI / 5)}" class="f-accent-soft s-bg" stroke-width="0" data-i="${i}"/>`;
      h += '<text x="160" y="166" text-anchor="middle" font-size="20" font-weight="800" class="f-ink" id="slice-t">Acme Corp</text>';
      svg.innerHTML = h;
    },
    step(s, n, instant) {
      if (!$('#slice-svg path')) this.build(s);
      const d = instant ? 0 : D(.7);
      $$('#slice-svg path').forEach((p, i) => {
        const mid = (i + .5) * Math.PI / 5, you = i === 1 && n >= 2, off = n >= 1 ? (you ? 30 : 7) : 0;
        gsap.to(p, { x: Math.sin(mid) * off, y: -Math.cos(mid) * off, attr: { 'stroke-width': n >= 1 ? 3 : 0 }, duration: d, ease: 'power3.out' });
        p.setAttribute('class', (you ? 'f-accent' : 'f-accent-soft') + ' s-bg');
      });
      $('#slice-t').textContent = n >= 1 ? (n >= 2 ? '1 of 10 = you' : '10 shares') : 'Acme Corp';
    },
  },
  balance: {
    step(s, n, instant) { gsap.to('#bal-beam', { rotation: [0, -8, -3, 0][n] || 0, svgOrigin: '260 117', duration: instant ? 0 : D(1), ease: 'elastic.out(1,0.55)' }); },
  },
};
Hooks.slice.enter = (s, n) => Hooks.slice.step(s, n, true);
Hooks.balance.enter = (s, n) => Hooks.balance.step(s, n, true);
// the seven-rights slide reveals its tiles by itself on arrival
Hooks.rights = { enter(s, n, deck) { if (n === 0) setTimeout(() => { if (deck.current() === s && deck.step() === 0) deck.next(); }, RM ? 0 : 450); } };

/* ---------- sims ---------- */
const Sims = {};

Sims.demand = s => {
  let b = 0, se = 0;
  const upd = () => {
    const diff = b - se, price = Math.max(1, 50 + diff * 3);
    gsap.to('#sd-beam', { rotation: -clamp(diff * 4, -16, 16), svgOrigin: '200 116', duration: D(.8), ease: 'elastic.out(1,0.5)' });
    $('#sd-bn').textContent = 'Buyers ' + b; $('#sd-sn').textContent = 'Sellers ' + se;
    const el = $('#sd-price'); el.textContent = usd(price) + (diff > 0 ? ' ▲' : diff < 0 ? ' ▼' : '');
    el.className = 'big ' + (diff > 0 ? 'pos' : diff < 0 ? 'neg' : '');
    if (!RM) gsap.fromTo(el, { scale: 1.08 }, { scale: 1, duration: .4 });
  };
  $('#sd-buy').onclick = () => { b++; upd(); };
  $('#sd-sell').onclick = () => { se++; upd(); };
  $('#sd-reset').onclick = () => { b = se = 0; upd(); };
  upd();
};

Sims.econ = s => {
  const data = [['Autos', 'cyc', 22, -28], ['Restaurants', 'cyc', 16, -22], ['Hotels', 'cyc', 19, -26], ['Utilities', 'def', 4, 2], ['Healthcare', 'def', 5, 1], ['Food', 'def', 3, -2]];
  const box = $('#ec-cards');
  box.innerHTML = data.map(d => `<div class="ecard"><span class="grp">${d[1] === 'cyc' ? 'Cyclical' : 'Defensive'}</span><div class="plot"><i class="b"></i></div><span class="pct"></span><b>${d[0]}</b></div>`).join('');
  const up = $('#ec-up'), down = $('#ec-down');
  const set = exp => {
    pressSeg([up, down], exp ? up : down);
    gsap.to('#ec-marker', { attr: { cx: exp ? 75 : 225, cy: exp ? 5 : 65 }, duration: D(.8), ease: 'power2.inOut' });
    $$('.ecard', box).forEach((c, i) => {
      const v = exp ? data[i][2] : data[i][3], bar = $('.b', c);
      bar.classList.toggle('down', v < 0);
      gsap.to(bar, { scaleY: v / 30, duration: D(.8), delay: D(i * .05), ease: 'power3.out' });
      $('.pct', c).textContent = (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v) + '%';
      $('.pct', c).className = 'pct ' + (v < 0 ? 'neg' : 'pos');
    });
  };
  up.onclick = () => set(true); down.onclick = () => set(false);
  set(true);
};

Sims.prorata = s => {
  const pie = makePie($('#pr-pie')), r = $('#pr-own');
  const upd = instant => { const own = +r.value, pct = own / 1e6; $('#pr-own-o').textContent = num(own); $('#pr-pct').textContent = short(pct * 100) + '%'; $('#pr-get').textContent = usd(own * 1); pie(pct, short(pct * 100) + '%', instant); };
  r.oninput = () => upd(); upd(true);
};

Sims.stockdiv = s => {
  const sh = $('#sdv-shares'), pr = $('#sdv-price'), pc = $('#sdv-pct');
  const upd = () => {
    const shares = Math.max(0, +sh.value || 0), price = Math.max(0, +pr.value || 0), pct = +pc.value, o = M.stockDiv(shares, price, pct);
    $('#sdv-pct-o').textContent = pct + '%';
    $('#sdv-ns').textContent = qty(o.shares); $('#sdv-np').textContent = usd(o.price);
    $('#sdv-vb').textContent = usd(o.value); $('#sdv-va').textContent = usd(o.shares * o.price);
    $('#sdv-f').innerHTML = `Factor = 1 + ${pct}% = <b>${o.f.toFixed(2)}</b> · ${qty(shares)} × ${o.f.toFixed(2)} = ${qty(o.shares)} sh · ${usd(price)} ÷ ${o.f.toFixed(2)} = ${usd(o.price)}`;
    renderDots($('#sdv-dots'), o.shares, shares);
  };
  [sh, pr, pc].forEach(e => e.oninput = upd); upd();
};

Sims.voting = s => {
  const stat = $('#v-stat'), cum = $('#v-cum'), r = $('#v-you'); let mode = 'stat';
  const cands = [['A', 200, 'Big holder'], ['B', 200, 'Big holder'], ['C', 200, 'Big holder'], ['Y', 0, 'You']];
  $('#v-bars').innerHTML = cands.map(c => `<div class="lq-row" style="grid-template-columns:28px 1fr 64px"><b>${c[0]}</b><div class="bar-h"><i></i></div><span class="amt"></span></div>`).join('');
  const upd = () => {
    const max = mode === 'stat' ? 100 : 300; r.max = max; if (+r.value > max) r.value = max;
    const you = +r.value; cands[3][1] = you;
    $('#v-you-o').textContent = you;
    const rows = $$('#v-bars .lq-row');
    rows.forEach((row, i) => {
      const v = cands[i][1], bar = $('.bar-h > i', row);
      bar.style.background = i === 3 ? 'var(--amber)' : 'var(--ink-2)';
      gsap.to(bar, { width: (v / 300 * 100) + '%', duration: D(.5), ease: 'power3.out' });
      $('.amt', row).textContent = v + ' v';
    });
    const res = $('#v-result');
    res.innerHTML = you > 200 ? `<b>Y wins a seat</b> with ${you} votes. Stacking beat the big holder's 200.`
      : you === 200 ? `Tie with the big holder's candidates at 200. Push past 200.`
      : mode === 'stat' ? `Y loses. Statutory caps you at <b>100</b> per seat vs their 200.` : `Y loses so far. Stack more votes on Y (up to <b>300</b>).`;
  };
  stat.onclick = () => { mode = 'stat'; pressSeg([stat, cum], stat); upd(); };
  cum.onclick = () => { mode = 'cum'; pressSeg([stat, cum], cum); upd(); };
  r.oninput = upd; upd();
};

Sims.dilution = s => {
  const pie = makePie($('#dl-pie')), r = $('#dl-new'), ex = $('#dl-ex');
  const upd = instant => {
    const nw = +r.value, mine = 50000 + (ex.checked ? nw * 0.10 : 0), total = 500000 + nw, pct = mine / total;
    $('#dl-new-o').textContent = num(nw); $('#dl-mine').textContent = num(mine);
    const p = $('#dl-pct'); p.textContent = short(pct * 100) + '%'; p.className = 'v ' + (pct < 0.0999 ? 'neg' : 'pos');
    pie(pct, short(pct * 100) + '%', instant);
  };
  r.oninput = () => upd(); ex.onchange = () => upd(); upd(true);
};

Sims.split = s => {
  const btns = $$('#sp-ratios button'), sh = $('#sp-shares'), pr = $('#sp-price'); let a = 2, b = 1;
  const upd = () => {
    const shares = Math.max(0, +sh.value || 0), price = Math.max(0, +pr.value || 0), o = M.split(shares, price, a, b);
    $('#sp-ns').textContent = qty(o.shares); $('#sp-np').textContent = usd(o.price); $('#sp-val').textContent = usd(o.shares * o.price);
    const fs = Number.isInteger(o.f) ? o.f : r2(o.f);
    $('#sp-f').innerHTML = `${a}-for-${b}: factor = ${a} ÷ ${b} = <b>${fs}</b> · ${qty(shares)} × ${fs} = ${qty(o.shares)} sh · ${usd(price)} ÷ ${fs} = ${usd(o.price)}`;
    const per = renderDots($('#sp-dots'), o.shares);
    if (per > 1) $('#sp-f').innerHTML += ` <span style="color:var(--ink-2)">(each square = ${per} shares)</span>`;
  };
  btns.forEach(btn => btn.onclick = () => { a = +btn.dataset.a; b = +btn.dataset.b; pressSeg(btns, btn); upd(); });
  sh.oninput = upd; pr.oninput = upd; upd();
};

Sims.liquidation = s => {
  const claims = [['Unpaid wages', 4], ['Unpaid taxes', 6], ['Secured creditors', 30], ['Unsecured creditors', 20], ['Junior unsecured', 10], ['Preferred stock', 10]];
  const box = $('#lq-rows');
  box.innerHTML = claims.map((c, i) => `<div class="lq-row"><span><span class="pri">${i + 1}</span>${c[0]}</span><div class="bar-h"><i></i></div><span class="amt"></span></div>`).join('')
    + `<div class="lq-row common"><span><span class="pri">7</span><b>Common stock</b></span><div class="bar-h"><i></i></div><span class="amt"></span></div>`;
  const r = $('#lq-p');
  const upd = () => {
    const cash = +r.value, o = M.liquidate(cash, claims.map(c => c[1])), rows = $$('.lq-row', box);
    $('#lq-p-o').textContent = '$' + cash + 'M';
    o.paid.forEach((p, i) => {
      gsap.to($('.bar-h > i', rows[i]), { width: (p / claims[i][1] * 100) + '%', duration: D(.45), delay: D(i * .04), ease: 'power2.out' });
      $('.amt', rows[i]).innerHTML = `$${p}<span style="color:var(--ink-2)">/${claims[i][1]}</span>`;
    });
    const last = rows[rows.length - 1];
    gsap.to($('.bar-h > i', last), { width: (o.residual / 50 * 100) + '%', duration: D(.45), delay: D(.25), ease: 'power2.out' });
    $('.amt', last).textContent = o.residual > 0 ? '$' + o.residual : '$0';
  };
  r.oninput = upd; upd();
};

Sims.funnel = s => {
  const AUTH = 1e6; let issued = 6e5, tre = 0;
  const upd = () => {
    const out = issued - tre, price = Math.max(0, +$('#fn-price').value || 0);
    gsap.to('#fn-iss-bar', { width: (issued / AUTH * 100) + '%', duration: D(.6), ease: 'power3.out' });
    gsap.to('#fn-out-bar', { width: (out / AUTH * 100) + '%', duration: D(.6), ease: 'power3.out' });
    gsap.to('#fn-tre-bar', { left: (out / AUTH * 100) + '%', width: (tre / AUTH * 100) + '%', duration: D(.6), ease: 'power3.out' });
    $('#fn-iss').textContent = 'Issued ' + num(issued);
    $('#fn-out').textContent = 'Outstanding ' + num(out) + (tre ? '  +  treasury' : '');
    $('#fn-tre').textContent = num(tre); $('#fn-outv').textContent = num(out); $('#fn-cap').textContent = big(price * out);
    $('#fn-buyback').disabled = tre + 5e4 > issued - 5e4; $('#fn-reissue').disabled = tre === 0; $('#fn-issue').disabled = issued + 1e5 > AUTH;
  };
  $('#fn-buyback').onclick = () => { tre += 5e4; upd(); };
  $('#fn-reissue').onclick = () => { tre = Math.max(0, tre - 5e4); upd(); };
  $('#fn-issue').onclick = () => { issued = Math.min(AUTH, issued + 1e5); upd(); };
  $('#fn-price').oninput = upd; upd();
};

Sims.sorter = s => {
  const RISKS = [
    ['Market risk', 'sys', 'The whole market drops together. No amount of diversifying avoids it.'],
    ['Inflation risk', 'sys', 'Rising prices shrink every investment\'s buying power.'],
    ['Interest rate risk', 'sys', 'When rates rise, prices of stocks and bonds across the market tend to fall.'],
    ['Concentration risk', 'non', 'Too much in one stock or sector. Fix it by diversifying.'],
    ['Financial risk', 'non', 'One company carries too much debt.'],
    ['Business risk', 'non', 'One company loses to competitors or is mismanaged.'],
    ['Regulatory risk', 'non', 'Agency rules raise costs for a specific industry.'],
    ['Legislative risk', 'non', 'A new law hurts a particular investment.'],
    ['Political risk', 'non', 'Instability hurts a specific country\'s securities.'],
    ['Liquidity risk', 'non', 'Hard to sell this security without dropping the price (common with OTC).'],
  ];
  const tray = $('#rs-tray'), buckets = $$('.bucket', s), fb = $('#rs-fb'); let sel = null, drags = [];
  const select = c => { if (c.classList.contains('placed')) return; $$('.risk-card', s).forEach(x => x.classList.toggle('sel', x === c && sel !== c)); sel = sel === c ? null : c; if (sel) fb.textContent = `"${c.textContent}": now tap Systematic or Non-systematic.`; };
  const place = (card, bucket) => {
    const r = RISKS.find(x => x[0] === card.textContent);
    if (r[1] !== bucket.dataset.type) {
      fb.innerHTML = `<b class="neg">Not quite.</b> ${card.textContent} ${r[1] === 'sys' ? 'affects the whole market.' : 'hits one company or sector.'}`;
      gsap.fromTo(card, { x: -8 }, { x: 0, duration: D(.4), ease: 'elastic.out(1,0.3)' });
      return false;
    }
    const first = card.getBoundingClientRect();
    gsap.set(card, { x: 0, y: 0 });
    $('.bucket-list', bucket).appendChild(card);
    card.classList.remove('sel'); card.classList.add('placed'); card.removeAttribute('tabindex'); sel = null;
    const last = card.getBoundingClientRect();
    gsap.from(card, { x: first.left - last.left, y: first.top - last.top, duration: D(.45), ease: 'power3.out' });
    const d = drags.find(x => x.target === card); d && d.disable();
    const left = $$('.risk-card:not(.placed)', s).length;
    fb.innerHTML = `<b class="pos">Yes.</b> ${r[2]}` + (left ? '' : ' <b>All sorted. Only 3 risks are systematic; the other 7 shrink with diversification.</b>');
    return true;
  };
  const build = () => {
    drags.forEach(d => d.kill()); drags = []; sel = null;
    $$('.risk-card', s).forEach(c => c.remove());
    const order = RISKS.map(r => r[0]).sort(() => Math.random() - .5);
    order.forEach(name => {
      const c = document.createElement('div');
      c.className = 'risk-card'; c.textContent = name; c.tabIndex = 0; c.setAttribute('role', 'button');
      c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(c); } });
      tray.appendChild(c);
      if (window.Draggable) {
        drags.push(Draggable.create(c, {
          type: 'x,y', zIndexBoost: true,
          onDrag() { buckets.forEach(b => b.classList.toggle('hot', this.hitTest(b, '30%'))); },
          onRelease() { buckets.forEach(b => b.classList.remove('hot')); const hit = buckets.find(b => this.hitTest(b, '30%')); if (!(hit && place(c, hit))) gsap.to(c, { x: 0, y: 0, duration: D(.35), ease: 'power3.out' }); },
          onClick() { select(c); },
        })[0]);
      } else c.addEventListener('click', () => select(c));
    });
    if (!RM) gsap.from($$('.risk-card', tray), { y: 16, opacity: 0, stagger: .05, duration: .4 });
    fb.textContent = 'Pick a card to start.';
  };
  buckets.forEach(b => {
    b.addEventListener('click', e => { if (sel && !e.target.closest('.risk-card')) place(sel, b); });
    b.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && sel) { e.preventDefault(); place(sel, b); } });
  });
  $('#rs-reset').onclick = build; build();
};

Sims.divers = s => {
  const svg = $('#dv-svg'), X = n => 50 + (n - 1) / 39 * 450, Y = v => 240 - v / 90 * 215, SYS = 20, ns = n => 60 / Math.sqrt(n);
  let curve = '', area = `M${X(1)} ${Y(SYS)}`;
  for (let n = 1; n <= 40; n += .5) { curve += (curve ? 'L' : 'M') + X(n) + ' ' + Y(SYS + ns(n)); area += `L${X(n)} ${Y(SYS + ns(n))}`; }
  area += `L${X(40)} ${Y(SYS)}Z`;
  svg.innerHTML = `
    <rect x="${X(1)}" y="${Y(SYS)}" width="${X(40) - X(1)}" height="${Y(0) - Y(SYS)}" class="f-red-soft"/>
    <path d="${area}" class="f-accent-soft"/>
    <path d="${curve}" class="f-none s-accent" stroke-width="3"/>
    <line x1="${X(1)}" y1="${Y(SYS)}" x2="${X(40)}" y2="${Y(SYS)}" class="s-red" stroke-width="2" stroke-dasharray="6 5"/>
    <line x1="${X(1)}" y1="${Y(0)}" x2="${X(40)}" y2="${Y(0)}" class="s-ink2" stroke-width="1.5"/>
    <text x="${X(40)}" y="${Y(SYS) + 22}" text-anchor="end" font-size="13" font-weight="700" class="f-red">Systematic floor</text>
    <text x="${X(40)}" y="${Y(SYS + ns(40)) - 12}" text-anchor="end" font-size="13" font-weight="700" class="f-accent">Non-systematic</text>
    <text x="${X(1)}" y="${Y(0) + 22}" font-size="12" class="f-ink2">1 stock</text>
    <text x="${X(40)}" y="${Y(0) + 22}" text-anchor="end" font-size="12" class="f-ink2">40 stocks</text>
    <text x="16" y="${Y(45)}" font-size="12" class="f-ink2" transform="rotate(-90 16 ${Y(45)})" text-anchor="middle">Total risk</text>
    <line id="dv-guide" x1="0" x2="0" y1="${Y(0)}" y2="${Y(0)}" class="s-ink" stroke-width="1.5" stroke-dasharray="3 4"/>
    <circle id="dv-dot" r="8" class="f-ink"/>`;
  const r = $('#dv-n'), st = { n: 1 };
  const draw = () => { const n = st.n; $('#dv-dot').setAttribute('cx', X(n)); $('#dv-dot').setAttribute('cy', Y(SYS + ns(n))); const g = $('#dv-guide'); g.setAttribute('x1', X(n)); g.setAttribute('x2', X(n)); g.setAttribute('y1', Y(SYS + ns(n))); };
  const upd = instant => { const n = +r.value; $('#dv-n-o').textContent = n; $('#dv-ns').textContent = Math.round(ns(n)); $('#dv-s').textContent = SYS;
    if (instant || RM) { st.n = n; draw(); } else gsap.to(st, { n, duration: .5, ease: 'power3.out', onUpdate: draw, overwrite: true }); };
  r.oninput = () => upd(); upd(true);
};

Sims.cap = s => {
  const r = $('#cap-r'), rungs = $$('.rung', s);
  const val = t => Math.pow(10, 7.5 + t / 1000 * 5.1);
  const upd = () => {
    const v = val(+r.value), tier = M.capTier(v);
    $('#cap-v').textContent = big(v) + ' · ' + tier;
    rungs.forEach(g => g.classList.toggle('on', $('b', g).textContent === tier));
  };
  r.oninput = upd; upd();
};

Sims.waterfall = s => {
  const svg = $('#wf-svg'), W = 720, TOP = 30, BOT = 272, L = 20;
  const labels = ['Revenue', 'COGS', 'Gross', 'OpEx', 'EBIT', 'Interest', 'EBT', 'Taxes', 'Net inc.', 'Divs', 'Retained'];
  const slot = (W - L * 2) / labels.length, bw = slot * .64;
  svg.innerHTML = '<line id="wf-zero" x1="' + L + '" x2="' + (W - L) + '" class="s-ink2" stroke-width="1.5"/>' + labels.map((l, i) => {
    const x = L + i * slot + (slot - bw) / 2;
    return `<g><rect x="${x}" y="${BOT}" width="${bw}" height="0" rx="4" class="${i % 2 ? 'f-red' : 'f-accent'}" id="wf-r${i}"/><text x="${x + bw / 2}" y="${BOT}" text-anchor="middle" font-size="12.5" font-weight="700" class="f-ink" id="wf-t${i}"></text><text x="${x + bw / 2}" y="${BOT + 32}" text-anchor="middle" font-size="12.5" class="f-ink2">${l}</text></g>`;
  }).join('');
  if (svg.getAttribute('viewBox') !== `0 0 ${W} 310`) svg.setAttribute('viewBox', `0 0 ${W} 310`);
  const ids = ['rev', 'cogs', 'opex', 'int', 'tax', 'div'];
  const upd = () => {
    const v = Object.fromEntries(ids.map(k => [k, +$('#wf-' + k).value]));
    ids.forEach(k => $('#wf-' + k + '-o').textContent = k === 'tax' ? v[k] + '%' : '$' + v[k]);
    const o = M.income({ rev: v.rev, cogs: v.cogs, opex: v.opex, int: v.int, taxRate: v.tax, div: v.div });
    const spans = [[0, o.rev], [o.gp, o.rev], [0, o.gp], [o.ebit, o.gp], [0, o.ebit], [o.ebt, o.ebit], [0, o.ebt], [o.ni, o.ebt], [0, o.ni], [o.re, o.ni], [0, o.re]];
    const vals = [o.rev, o.cogs, o.gp, o.opex, o.ebit, o.int, o.ebt, o.tax, o.ni, o.div, o.re];
    const all = spans.flat(), hi = Math.max(...all), lo = Math.min(0, ...all);
    const Y = x => BOT - (x - lo) / (hi - lo || 1) * (BOT - TOP);
    const z = $('#wf-zero'); z.setAttribute('y1', Y(0)); z.setAttribute('y2', Y(0));
    spans.forEach(([a, b], i) => {
      const top = Y(Math.max(a, b)), h = Math.max(1.5, Y(Math.min(a, b)) - top);
      const total = i % 2 === 0, neg = total && vals[i] < 0;
      const rect = $('#wf-r' + i); rect.setAttribute('class', total ? (neg ? 'f-red' : (i === 10 ? 'f-amber' : 'f-accent')) : 'f-red-soft');
      gsap.to(rect, { attr: { y: top, height: h }, duration: D(.5), ease: 'power3.out' });
      const t = $('#wf-t' + i); t.textContent = (total ? '' : '−') + (Math.round(vals[i] * 10) / 10);
      gsap.to(t, { attr: { y: top - 7 }, duration: D(.5), ease: 'power3.out' });
    });
  };
  ids.forEach(k => $('#wf-' + k).oninput = upd); upd();
};

Sims.pe = s => {
  const svg = $('#pe-svg'), cx = 160, cy = 160, R = 130, MAX = 60;
  const pt = (v, r) => { const a = Math.PI * (1 - v / MAX); return [cx + r * Math.cos(a), cy - r * Math.sin(a)]; };
  const arc = (v0, v1, r) => { const [x0, y0] = pt(v0, r), [x1, y1] = pt(v1, r); return `M${x0} ${y0}A${r} ${r} 0 0 1 ${x1} ${y1}`; };
  let ticks = '';
  for (let v = 0; v <= MAX; v += 10) { const [x, y] = pt(v, R + 14); ticks += `<text x="${x}" y="${y + 4}" text-anchor="middle" font-size="11" class="f-ink2">${v === MAX ? '60+' : v}</text>`; }
  svg.innerHTML = `
    <path d="${arc(0, MAX, R)}" class="f-none s-line" stroke-width="18" stroke-linecap="round"/>
    <path d="${arc(15, 25, R)}" class="f-none s-amber" stroke-width="18"/>
    ${ticks}
    <text x="${pt(20, R - 26)[0]}" y="${pt(20, R - 26)[1] + 4}" text-anchor="middle" font-size="11" font-weight="700" class="f-amber">typical</text>
    <line id="pe-needle" x1="${cx}" y1="${cy}" x2="${cx - R + 22}" y2="${cy}" class="s-ink" stroke-width="4" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="9" class="f-ink"/>
    <text id="pe-val" x="${cx}" y="${cy - 34}" text-anchor="middle" font-size="30" font-weight="800" class="f-ink"></text>
    <text id="pe-lab" x="${cx}" y="${cy - 14}" text-anchor="middle" font-size="12" font-weight="600" class="f-ink2"></text>`;
  const p = $('#pe-p'), e = $('#pe-e');
  const upd = () => {
    const price = +p.value, eps = +e.value, pe = M.pe(price, eps);
    $('#pe-p-o').textContent = usd(price); $('#pe-e-o').textContent = usd(eps);
    gsap.to('#pe-needle', { rotation: 180 * Math.min(pe, MAX) / MAX, svgOrigin: `${cx} ${cy}`, duration: D(.7), ease: 'elastic.out(1,0.6)' });
    $('#pe-val').textContent = short(pe) + '×';
    $('#pe-lab').textContent = pe < 15 ? 'value territory' : pe <= 25 ? 'typical range' : 'growth territory';
    $('#pe-f').innerHTML = `P/E = ${usd(price)} ÷ ${usd(eps)} = <b>${short(pe)}</b>`;
  };
  p.oninput = upd; e.oninput = upd; upd();
};

SIEDeck.start({
  sections: { intro: 'Intro', '1.1': 'Basic characteristics', '1.2': 'Rights of stockholders', '1.3': 'Trading', '1.4': 'Suitability', '1.5': 'Fundamental analysis', end: 'Review' },
  sims: Sims,
  hooks: Hooks,
});
})();
