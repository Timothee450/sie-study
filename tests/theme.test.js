var localStorage = makeStorage();
var document = { documentElement: { dataset: {} }, addEventListener: function () {}, querySelectorAll: function () { return []; } };
var matchMedia = function () { return { matches: false }; };
load("assets/theme.js");
test("no stored theme -> null and no data-theme", function () { eq(SIETheme.get(), null); eq(document.documentElement.dataset.theme, undefined); });
test("set dark persists and applies", function () { SIETheme.set("dark"); eq(localStorage.getItem("sie-study:theme"), "dark"); eq(document.documentElement.dataset.theme, "dark"); });
test("toggle from dark -> light", function () { eq(SIETheme.toggle(), "light"); eq(localStorage.getItem("sie-study:theme"), "light"); });
test("storage throwing does not crash", function () {
  localStorage = { getItem: function () { throw new Error("blocked"); }, setItem: function () { throw new Error("blocked"); } };
  window.localStorage = localStorage;
  eq(SIETheme.get(), null); SIETheme.set("dark"); eq(document.documentElement.dataset.theme, "dark");
});
test("toggle still flips when storage is blocked", function () {
  eq(SIETheme.toggle(), "light"); eq(SIETheme.toggle(), "dark");
});
