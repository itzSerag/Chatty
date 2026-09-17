# syntax=docker/dockerfile:1
FROM node:22-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable \
    && corepack prepare pnpm@10.33.2 --activate

WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml ./

COPY Backend/package.json ./Backend/package.json

COPY Frontend/package.json ./Frontend/package.json

#Prisma needs its schema + config present BEFORE install,
# because postinstall runs `prisma generate` automatically.
COPY Backend/prisma.config.ts ./Backend/prisma.config.ts
COPY Backend/prisma ./Backend/prisma

RUN pnpm install --frozen-lockfile

COPY . .

WORKDIR /app/Backend
RUN pnpm exec prisma generate

EXPOSE 5000
CMD ["pnpm", "start:dev"]