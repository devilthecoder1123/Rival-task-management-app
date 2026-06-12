FROM node:20-bullseye-slim AS deps
WORKDIR /app

# Install backend dependencies
COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm install

# Install frontend dependencies
COPY frontend/package.json frontend/package-lock.json* ./frontend/
RUN cd frontend && npm install

FROM node:20-bullseye-slim AS builder
WORKDIR /app
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY backend ./backend
COPY frontend ./frontend

RUN cd backend && npx prisma generate
RUN cd backend && npm run build
RUN cd frontend && npm run build

FROM node:20-bullseye-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/backend/package.json ./backend/package.json

COPY --from=builder /app/frontend/.next ./frontend/.next
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder /app/frontend/node_modules ./frontend/node_modules
COPY --from=builder /app/frontend/package.json ./frontend/package.json
COPY --from=builder /app/frontend/next.config.js ./frontend/next.config.js

COPY nginx.conf /etc/nginx/nginx.conf
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 80
CMD ["/start.sh"]
