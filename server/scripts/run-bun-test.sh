#!/usr/bin/env sh
set -eu

if command -v bun >/dev/null 2>&1; then
  BUN_BIN="$(command -v bun)"
elif [ -x "$HOME/.bun/bin/bun" ]; then
  BUN_BIN="$HOME/.bun/bin/bun"
else
  echo "bun not found on PATH and not found at \$HOME/.bun/bin/bun" >&2
  exit 1
fi

exec "$BUN_BIN" test "$@"
