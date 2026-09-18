FROM node:22-alpine

# Required for native modules like bcrypt
RUN apk add --no-cache python3 make g++

RUN corepack enable \
    && corepack prepare pnpm@10.33.2 --activate

WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY Backend/package.json ./Backend/package.json

RUN pnpm install --frozen-lockfile
COPY . .

WORKDIR /app/Backend
EXPOSE 5000
CMD ["pnpm", "start:dev"]
