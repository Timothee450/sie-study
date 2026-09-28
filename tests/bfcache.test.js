/* Pages restored by the Back button (bfcache) must re-read theme and quiz results. */
var localStorage = makeStorage();
var handlers = {};
var addEventListener = function (type, fn) { (handlers[type] = handlers[type] || []).push(fn); };
function fire(type, ev) { (handlers[type] || []).forEach(function (f) { f(ev); }); }
function fakeEl() {
  var cls = {};
  return { textContent: "", attrs: {}, setAttribute: function (k, v) { this.attrs[k] = v; },
    classList: { add: function (c) { cls[c] = 1; }, remove: function () { [].forEach.call(arguments, function (c) { delete cls[c]; }); }, contains: function (c) { return !!cls[c]; } } };
}
var toggle = fakeEl(); toggle.addEventListener = function () {};
var domReady = [];
var document = { documentElement: { dataset: {} }, addEventListener: function (t, f) { if (t === "DOMContentLoaded") domReady.push(f); },
  querySelectorAll: function () { return [toggle]; } };
var matchMedia = function () { return { matches: false }; };
load("assets/theme.js"); load("assets/progress.js");
domReady.forEach(function (f) { f(); });

test("restored page re-applies a theme chosen on another page", function () {
  eq(document.documentElement.dataset.theme, undefined);
  localStorage.setItem("sie-study:theme", "dark");
  fire("pageshow", { persisted: true });
  eq(document.documentElement.dataset.theme, "dark");
  eq(toggle.textContent, "☀");
});
test("Progress.showBadge fills text and pass/fail class, and refreshes on restore", function () {
  var b = fakeEl();
  Progress.showBadge(b, "ch1");
  eq(b.textContent, "Not attempted yet"); ok(!b.classList.contains("pass"));
  Progress.saveQuiz("ch1", 20, 25, new Date("2026-09-28T00:00:00Z"));
  fire("pageshow", { persisted: true });
  eq(b.textContent, "Best 20/25 (80%) · 1 attempt"); ok(b.classList.contains("pass"));
  Progress.saveQuiz("ch2", 5, 25);
  var c = fakeEl(); Progress.showBadge(c, "ch2"); ok(c.classList.contains("fail") && !c.classList.contains("pass"));
});
test("fresh page load (not persisted) does not re-render", function () {
  var b = fakeEl(), writes = 0, txt = "";
  Object.defineProperty(b, "textContent", { get: function () { return txt; }, set: function (v) { writes++; txt = v; } });
  Progress.showBadge(b, "ch1"); fire("pageshow", { persisted: false });
  eq(writes, 1);
  fire("pageshow", { persisted: true });
  eq(writes, 2);
});
