var __results = { pass: 0, fail: 0 };
function test(name, fn) {
  try { fn(); __results.pass++; print("  ok   " + name); }
  catch (e) { __results.fail++; print("  FAIL " + name + "\n       " + e.message); }
}
function eq(a, b, msg) {
  var sa = JSON.stringify(a), sb = JSON.stringify(b);
  if (sa !== sb) throw new Error((msg ? msg + ": " : "") + "expected " + sb + ", got " + sa);
}
function ok(c, msg) { if (!c) throw new Error(msg || "expected truthy"); }
function __done() { print(__results.pass + " passed, " + __results.fail + " failed"); if (__results.fail) throw new Error("tests failed"); }
/* minimal window/localStorage fakes for jsc */
var window = this;
function makeStorage() {
  var m = {};
  return { getItem: function (k) { return k in m ? m[k] : null; },
           setItem: function (k, v) { m[k] = String(v); },
           removeItem: function (k) { delete m[k]; }, _m: m };
}
