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

# Build for production
RUN pnpm build

EXPOSE 5000

# Default to production and 350MB memory ceiling for Render 512MB container limit.
# Local docker-compose overrides NODE_ENV to development.
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=350"

CMD ["sh", "-c", "if [ \"$NODE_ENV\" = 'development' ]; then pnpm start:dev; else pnpm start:prod; fi"]
