/* SIE Study shared slide engine for the Learning decks.
   A chapter's learn.js defines its own Sims (simulators) and Hooks (custom per-step animation),
   then calls SIEDeck.start({ sections, sims, hooks }). */
window.SIEDeck = (() => {
/* ---------- fallback if GSAP didn't load ---------- */
if (!window.gsap) {
  const list = t => t == null ? [] : (t.nodeType || !t.length || typeof t === 'string') ? (typeof t === 'string' ? [...document.querySelectorAll(t)] : [t]) : [...t];
  const apply = (t, v = {}) => {
    list(t).forEach(el => {
      if (el.nodeType) {
        if ('autoAlpha' in v) { el.style.opacity = v.autoAlpha; el.style.visibility = v.autoAlpha ? 'visible' : 'hidden'; }
        if ('opacity' in v) el.style.opacity = v.opacity;
        if (v.attr) for (const k in v.attr) el.setAttribute(k, v.attr[k]);
      } else { for (const k in v) if (typeof v[k] === 'number') el[k] = v[k]; }
    });
    v.onUpdate && v.onUpdate(); v.onComplete && v.onComplete();
  };
  window.gsap = { to: apply, set: apply, from() {}, fromTo: (t, a, b) => apply(t, b), killTweensOf() {}, registerPlugin() {} };
}
if (window.Draggable) gsap.registerPlugin(Draggable);

/* ---------- helpers (shared with every chapter's simulators) ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const D = t => RM ? 0 : t;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const r2 = n => Math.round(n * 100) / 100;
const num = (n, d = 0) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const qty = n => Number.isInteger(r2(n)) ? num(Math.round(n)) : num(r2(n), 2);
const usd = n => { const v = r2(n); return (v < 0 ? '−$' : '$') + (Number.isInteger(v) ? num(Math.abs(v)) : num(Math.abs(v), 2)); };
const short = x => { const v = Math.round(x * 10) / 10; return (v >= 100 ? Math.round(v) : v).toString(); };
const big = n => { const a = Math.abs(n); return a >= 1e12 ? '$' + short(n / 1e12) + 'T' : a >= 1e9 ? '$' + short(n / 1e9) + 'B' : a >= 1e6 ? '$' + short(n / 1e6) + 'M' : usd(n); };

function arcPath(cx, cy, r, a0, a1) {
  if (a1 - a0 >= Math.PI * 2 - 1e-4) return `M${cx} ${cy - r}A${r} ${r} 0 1 1 ${cx} ${cy + r}A${r} ${r} 0 1 1 ${cx} ${cy - r}Z`;
  const x0 = cx + r * Math.sin(a0), y0 = cy - r * Math.cos(a0), x1 = cx + r * Math.sin(a1), y1 = cy - r * Math.cos(a1);
  return `M${cx} ${cy}L${x0} ${y0}A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1} ${y1}Z`;
}
function makePie(svg) {
  svg.innerHTML = '<circle cx="120" cy="120" r="104" class="f-surface2 s-line" stroke-width="1"/><path class="f-accent"/><text x="120" y="126" text-anchor="middle" font-size="22" font-weight="800" class="f-ink"></text>';
  const path = $('path', svg), label = $('text', svg), st = { v: 0 };
  const draw = () => { const v = clamp(st.v, 0, 1); path.setAttribute('d', v <= 0.0005 ? '' : arcPath(120, 120, 104, 0, v * Math.PI * 2)); };
  return (v, text, instant) => {
    label.textContent = text || '';
    if (instant || RM) { gsap.killTweensOf(st); st.v = v; draw(); return; }
    gsap.to(st, { v, duration: .7, ease: 'power3.inOut', onUpdate: draw, overwrite: true });
  };
}
function renderDots(box, count, oldCount) {
  const cap = 300, per = count > cap ? Math.ceil(count / cap) : 1, n = Math.max(0, Math.round(count / per));
  box.innerHTML = '';
  const frag = document.createDocumentFragment();
  for (let i = 0; i < n; i++) { const d = document.createElement('span'); d.className = 'dot' + (oldCount != null && i < Math.round(oldCount / per) ? ' old' : ''); frag.appendChild(d); }
  box.appendChild(frag);
  if (!RM) gsap.from(box.children, { scale: 0, duration: .3, stagger: { amount: .45 }, ease: 'back.out(2.5)' });
  return per;
}
const pressSeg = (btns, on) => btns.forEach(b => b.setAttribute('aria-pressed', b === on ? 'true' : 'false'));

/* ---------- the deck ---------- */
const isNumbered = k => /^\d+\.\d+$/.test(k);

function start({ sections, sims = {}, hooks = {} }) {
  const Sims = sims, Hooks = hooks;
  const slides = $$('.slide');
  let cur = -1, step = 0;

  (function rosette() {
    const svg = $('#rosette'); if (!svg) return; let h = '';
    for (let i = 0; i < 36; i++) h += `<ellipse rx="72" ry="26" transform="rotate(${i * 5})"/>`;
    for (let i = 0; i < 24; i++) h += `<ellipse rx="40" ry="14" transform="rotate(${i * 7.5})"/>`;
    svg.innerHTML = h;
    if (!RM) gsap.to(svg, { rotation: 360, duration: 120, repeat: -1, ease: 'none', transformOrigin: '50% 50%' });
  })();

  slides.forEach(s => { // auto eyebrow
    const sec = s.dataset.section;
    if (isNumbered(sec) && s.dataset.key !== 'div') {
      const p = document.createElement('p'); p.className = 'eyebrow'; p.textContent = sec + ' · ' + sections[sec];
      $('.slide-inner', s).prepend(p);
    }
  });

  const api = { next: () => next(), prev: () => prev(), goTo: (i, o) => goTo(i, o), current: () => slides[cur], step: () => step };
  const maxStep = s => Math.max(0, ...$$('[data-step]', s).map(e => +e.dataset.step));
  const hook = (s, name, ...a) => { const h = Hooks[s.dataset.key]; h && h[name] && h[name](s, ...a, api); };
  function setSteps(s, n) { $$('[data-step]', s).forEach(e => gsap.set(e, { autoAlpha: +e.dataset.step <= n ? 1 : 0, y: 0 })); }
  function initSim(s) { const k = s.dataset.sim; if (k && !s._init && Sims[k]) { s._init = true; try { Sims[k](s); } catch (err) { console.error(k, err); } } }

  function goTo(i, opts = {}) {
    i = clamp(i, 0, slides.length - 1);
    if (i === cur) return;
    const dir = i > cur ? 1 : -1, prevS = slides[cur], s = slides[i];
    if (prevS) {
      gsap.killTweensOf(prevS);
      gsap.to(prevS, { autoAlpha: 0, x: -dir * 40, duration: D(.3), ease: 'power2.in', onComplete: () => prevS.classList.remove('active') });
    }
    cur = i; step = opts.end ? maxStep(s) : 0;
    s.classList.add('active'); s.scrollTop = 0;
    initSim(s);
    setSteps(s, step);
    hook(s, 'enter', step);
    gsap.fromTo(s, { autoAlpha: 0, x: dir * 60 }, { autoAlpha: 1, x: 0, duration: D(.55), ease: 'power3.out', delay: prevS ? D(.1) : 0 });
    const base = $$('.slide-inner > :not([data-step])', s);
    if (!RM) gsap.fromTo(base, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: .6, stagger: .07, ease: 'power3.out', delay: prevS ? .15 : 0 });
    if (s.querySelector('#remember') && !RM) gsap.fromTo('#remember .card', { opacity: 0, y: 18, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: .45, stagger: .045, ease: 'back.out(1.6)', delay: .35 });
    chrome();
    try { history.replaceState(null, '', '#' + (i + 1)); } catch (e) {}
  }
  function next() {
    const s = slides[cur];
    if (step < maxStep(s)) {
      step++;
      const els = $$(`[data-step="${step}"]`, s);
      gsap.fromTo(els, { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: D(.5), stagger: D(.07), ease: 'power3.out' });
      hook(s, 'step', step, false);
      const first = els[0]; if (first && first.getBoundingClientRect().bottom > s.getBoundingClientRect().bottom) first.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
      chrome();
    } else goTo(cur + 1);
  }
  function prev() {
    const s = slides[cur];
    if (step > 0) {
      gsap.to($$(`[data-step="${step}"]`, s), { autoAlpha: 0, y: 12, duration: D(.25) });
      step--; hook(s, 'step', step, false); chrome();
    } else if (cur > 0) goTo(cur - 1, { end: true });
  }

  /* chrome: progress, ticks, menu */
  const track = $('#track'), fill = $('#fill'), menu = $('#menu'), menuBtn = $('#menu-btn');
  const firstOf = {}; slides.forEach((s, i) => { const k = s.dataset.section; if (!(k in firstOf)) firstOf[k] = i; });
  Object.entries(firstOf).forEach(([k, i]) => {
    if (!isNumbered(k)) return;
    const t = document.createElement('button'); t.className = 'tick'; t.style.left = (i / (slides.length - 1) * 100) + '%';
    t.setAttribute('aria-label', 'Go to ' + k + ' ' + sections[k]); t.innerHTML = `<span>${k}</span>`; t.dataset.i = i;
    t.onclick = () => goTo(i); track.appendChild(t);
  });
  menu.innerHTML = Object.entries(firstOf).map(([k, i]) => `<button data-i="${i}"><span class="mono">${k === 'intro' ? '▸' : k === 'end' ? '★' : k}</span><span>${sections[k]}</span></button>`).join('');
  menu.onclick = e => { const b = e.target.closest('button'); if (b) { goTo(+b.dataset.i); toggleMenu(false); } };
  const toggleMenu = open => { menu.hidden = !open; menuBtn.setAttribute('aria-expanded', open); };
  menuBtn.onclick = e => { e.stopPropagation(); toggleMenu(menu.hidden); };
  document.addEventListener('click', e => { if (!menu.hidden && !e.target.closest('#menu')) toggleMenu(false); });

  function chrome() {
    const s = slides[cur], n = slides.length;
    fill.style.width = (cur / (n - 1) * 100) + '%';
    $$('.tick', track).forEach(t => t.classList.toggle('done', +t.dataset.i <= cur));
    $('#sec-label').textContent = (s.dataset.section === 'intro' || s.dataset.section === 'end' ? '' : s.dataset.section + ' · ') + s.dataset.title;
    $('#count').textContent = (cur + 1) + ' / ' + n;
    $('#prev').disabled = cur === 0 && step === 0;
    const atEnd = cur === n - 1 && step >= maxStep(s);
    $('#next').disabled = atEnd; $('#next').textContent = atEnd ? 'Done ✓' : step < maxStep(s) ? 'Next ↓' : 'Next →';
  }

  /* input */
  $('#next').onclick = next; $('#prev').onclick = prev;
  const startBtn = $('#start-btn'); if (startBtn) startBtn.onclick = () => goTo(1);
  document.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target, typing = t.closest && t.closest('input, textarea, select');
    const activating = t.closest && t.closest('button, [role=button], a');
    if (e.key === 'Escape') return toggleMenu(false);
    if (typing) return;
    if (['ArrowRight', 'PageDown'].includes(e.key) || ((e.key === ' ' || e.key === 'Enter') && !activating)) { e.preventDefault(); next(); }
    else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); prev(); }
    else if (e.key === 'Home') goTo(0); else if (e.key === 'End') goTo(slides.length - 1, { end: true });
  });
  const stage = $('#stage'), NOADV = 'button, input, label, a, select, .sim, [role=button], .menu, table';
  stage.addEventListener('click', e => { if (!e.target.closest(NOADV) && !window.getSelection().toString()) next(); });
  let tx = null, ty = 0;
  stage.addEventListener('touchstart', e => { tx = e.target.closest('.sim, input') ? null : e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  stage.addEventListener('touchend', e => {
    if (tx == null) return; const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; tx = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) dx < 0 ? next() : prev();
  }, { passive: true });

  window.addEventListener('hashchange', () => { const n = parseInt(location.hash.slice(1), 10); if (n >= 1 && n <= slides.length && n - 1 !== cur) goTo(n - 1); });
  slides.forEach(s => gsap.set(s, { autoAlpha: 0 }));
  const h = parseInt((location.hash || '').slice(1), 10);
  goTo(h >= 1 && h <= slides.length ? h - 1 : 0);
  return api;
}

return { $, $$, RM, D, clamp, r2, num, qty, usd, short, big, arcPath, makePie, renderDots, pressSeg, start };
})();
