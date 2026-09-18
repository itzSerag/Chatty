# syntax=docker/dockerfile:1
FROM node:22-slim

RUN corepack enable \
    && corepack prepare pnpm@10.33.2 --activate

WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY Backend/package.json ./Backend/package.json
COPY Frontend/package.json ./Frontend/package.json

RUN pnpm install --frozen-lockfile

COPY . .

WORKDIR /app/Backend

EXPOSE 5000
CMD ["pnpm", "start:dev"]