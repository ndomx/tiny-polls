#!/bin/sh
set -eu

PB_DIR="${PB_DIR:-/pb/pb_data}"
PB_MIGRATIONS_DIR="${PB_MIGRATIONS_DIR:-/pb/pb_migrations}"
PB_HTTP="${PB_HTTP:-0.0.0.0:${PORT:-8090}}"

./pocketbase migrate up --dir="$PB_DIR" --migrationsDir="$PB_MIGRATIONS_DIR"

if [ -n "${POCKETBASE_SUPERUSER_EMAIL:-}" ] && [ -n "${POCKETBASE_SUPERUSER_PASSWORD:-}" ]; then
  ./pocketbase superuser upsert "$POCKETBASE_SUPERUSER_EMAIL" "$POCKETBASE_SUPERUSER_PASSWORD" \
    --dir="$PB_DIR" \
    --migrationsDir="$PB_MIGRATIONS_DIR"
fi

exec ./pocketbase serve \
  --http="$PB_HTTP" \
  --dir="$PB_DIR" \
  --migrationsDir="$PB_MIGRATIONS_DIR"
