# syntax=docker/dockerfile:1

# ---- build stage ----
FROM node:22-slim AS builder
WORKDIR /app
# 2 GB VPS — cap Node's heap so `nest build` (tsc) doesn't OOM.
ENV NODE_OPTIONS=--max-old-space-size=768
COPY package.json package-lock.json ./
# npm 10.9.8 (ships with node:22) crashes with "edgesOut" on this project.
RUN npm install -g npm@latest
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- runtime stage ----
FROM node:22-slim AS runtime
# Prisma's engine needs openssl on debian-based images.
RUN apt-get update && apt-get install -y openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
CMD ["node", "dist/main.js"]
