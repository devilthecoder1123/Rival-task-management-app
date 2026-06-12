FROM node:20-bullseye-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

FROM node:20-bullseye-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package.json ./
EXPOSE 4000
CMD npx prisma db push --skip-generate --accept-data-loss && node dist/index.js