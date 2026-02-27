#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_DIR="$ROOT_DIR/server"
COMPOSE_FILE="$ROOT_DIR/docker-compose.test.yml"

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  DOCKER_COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  DOCKER_COMPOSE=(docker-compose)
else
  echo "Docker Compose is required to run local Postgres tests."
  exit 1
fi

cleanup() {
  "${DOCKER_COMPOSE[@]}" -f "$COMPOSE_FILE" down -v --remove-orphans >/dev/null 2>&1 || true
}

if [[ "${KEEP_TEST_DB:-0}" != "1" ]]; then
  trap cleanup EXIT INT TERM
fi

cd "$SERVER_DIR"

if [[ -f .env.test ]]; then
  set -a
  . ./.env.test
  set +a
elif [[ -f .env.test.sample ]]; then
  set -a
  . ./.env.test.sample
  set +a
else
  echo "Missing server/.env.test and server/.env.test.sample."
  exit 1
fi

: "${DATABASE_URL:?DATABASE_URL must be set for local docker tests}"
export DATABASE_ADAPTER="${DATABASE_ADAPTER:-direct}"

if [[ "$DATABASE_ADAPTER" == "direct" ]]; then
  if ! pnpm exec node -e "require.resolve('@prisma/adapter-pg'); require.resolve('pg')" >/dev/null 2>&1; then
    echo "Missing required packages for DATABASE_ADAPTER=direct."
    echo "Install with: pnpm --filter @markstagram/server add @prisma/adapter-pg pg"
    exit 1
  fi
fi

echo "Starting local Postgres test container..."
"${DOCKER_COMPOSE[@]}" -f "$COMPOSE_FILE" up -d --wait

echo "Applying Prisma migrations..."
pnpm prisma:migrate:test

echo "Running server test suite..."
SERVER_TEST_SCRIPT="${SERVER_TEST_SCRIPT:-test:inner:run}"
pnpm "$SERVER_TEST_SCRIPT"

if [[ "${KEEP_TEST_DB:-0}" == "1" ]]; then
  echo "Leaving test database running because KEEP_TEST_DB=1."
fi
