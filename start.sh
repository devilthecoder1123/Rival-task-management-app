#!/bin/sh
set -e

PORT=${PORT:-80}
BACKEND_PORT=4000
FRONTEND_PORT=3000

cat > /etc/nginx/nginx.conf <<'EOF'
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;
events { worker_connections 1024; }
http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;
  sendfile on;
  keepalive_timeout 65;
  upstream backend { server 127.0.0.1:${BACKEND_PORT}; }
  upstream frontend { server 127.0.0.1:${FRONTEND_PORT}; }

  server {
    listen ${PORT};

    location /api {
      proxy_pass http://backend$request_uri;
      proxy_http_version 1.1;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /_next/ {
      proxy_pass http://frontend$request_uri;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
      proxy_pass http://frontend$request_uri;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }
  }
}
EOF

cd /app/backend
PORT=${BACKEND_PORT} npm run start &
BACKEND_PID=$!

cd /app/frontend
npx next start -p ${FRONTEND_PORT} &
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
