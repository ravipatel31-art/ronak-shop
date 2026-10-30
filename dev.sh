#!/usr/bin/env bash
# Starts everything for local development: PostgreSQL (Docker) + FastAPI + Vite.
set -euo pipefail
cd "$(dirname "$0")"

echo "▸ PostgreSQL"
if ! docker ps --format '{{.Names}}' | grep -q '^ronak-shop-db$'; then
  if docker ps -a --format '{{.Names}}' | grep -q '^ronak-shop-db$'; then
    docker start ronak-shop-db >/dev/null
  else
    docker run -d --name ronak-shop-db --restart unless-stopped \
      -e POSTGRES_USER=ronak -e POSTGRES_PASSWORD=ronak_shop_2026 \
      -e POSTGRES_DB=ronak_shop -p 5432:5432 postgres:17-alpine >/dev/null
  fi
fi
until docker exec ronak-shop-db pg_isready -U ronak >/dev/null 2>&1; do sleep 1; done
echo "  ready on localhost:5432"

echo "▸ FastAPI  → http://localhost:8000  (docs at /docs)"
(cd backend && ./.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload) &
BACK_PID=$!

echo "▸ React    → http://localhost:5173"
(cd frontend && npm run dev) &
FRONT_PID=$!

trap 'kill $BACK_PID $FRONT_PID 2>/dev/null' INT TERM EXIT
wait
