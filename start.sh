#!/bin/sh
set -e

cd /app/backend
npm run start &
BACKEND_PID=$!

cd /app/frontend
npx next start -p 3000 &
FRONTEND_PID=$!

nginx -g 'daemon off;' &
NGINX_PID=$!

cleanup() {
  kill "$BACKEND_PID" "$FRONTEND_PID" "$NGINX_PID" 2>/dev/null || true
}

trap cleanup INT TERM

wait "$BACKEND_PID" || BACKEND_EXIT=$?
wait "$FRONTEND_PID" || FRONTEND_EXIT=$?
wait "$NGINX_PID" || NGINX_EXIT=$?

EXIT_CODE=${BACKEND_EXIT:-${FRONTEND_EXIT:-${NGINX_EXIT:-0}}}
cleanup
exit "$EXIT_CODE"
