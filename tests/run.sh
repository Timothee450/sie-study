#!/bin/sh
# Run from anywhere: sh tests/run.sh
JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc
cd "$(dirname "$0")/.." || exit 1
status=0
for f in tests/*.test.js; do
  echo "$f"
  "$JSC" tests/assert.js "$f" -e '__done()' || status=1
done
exit $status
