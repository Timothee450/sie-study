/* SIE Study theme: applies the saved light/dark choice before paint and wires [data-theme-toggle] buttons. */
(function (w) {
  "use strict";
  var KEY = "sie-study:theme";
  function ls() { try { return w.localStorage; } catch (e) { return null; } }
  function get() { try { var v = ls().getItem(KEY); return v === "light" || v === "dark" ? v : null; } catch (e) { return null; } }
  function apply(mode) { var d = w.document.documentElement.dataset; if (mode) d.theme = mode; else delete d.theme; }
  function systemDark() { return !!(w.matchMedia && w.matchMedia("(prefers-color-scheme: dark)").matches); }
  function set(mode) { try { ls().setItem(KEY, mode); } catch (e) {} apply(mode); }
  function current() { return get() || w.document.documentElement.dataset.theme || (systemDark() ? "dark" : "light"); }
  function toggle() { var next = current() === "dark" ? "light" : "dark"; set(next); return next; }
  var labels = [];
  apply(get());
  w.document.addEventListener("DOMContentLoaded", function () {
    [].forEach.call(w.document.querySelectorAll("[data-theme-toggle]"), function (b) {
      function label() {
        var dark = current() === "dark";
        b.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
        b.textContent = dark ? "☀" : "☾";
      }
      labels.push(label);
      label(); b.addEventListener("click", function () { toggle(); label(); });
    });
  });
  /* A page restored by the Back button keeps its old state; re-read the saved theme. */
  if (w.addEventListener) w.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    apply(get()); labels.forEach(function (f) { f(); });
  });
  w.SIETheme = { get: get, set: set, toggle: toggle, current: current };
})(window);
