FROM oven/bun:1.2.2-slim AS builder

WORKDIR /app

COPY package.json ./

COPY tsconfig.json ./

COPY packages packages

RUN bun install --no-cache

RUN bun run build

FROM oven/bun:1.2.2-slim AS builder

WORKDIR /app

COPY package.json ./
COPY tsconfig.json ./
COPY packages packages

RUN bun install --no-cache
RUN bun run build

# Breathing contrib image
FROM oven/bun:1.2.2-slim AS breathing-contrib

WORKDIR /action

COPY --from=builder /app/dist/breathing-contrib/ /action/

ENTRYPOINT ["bun", "/action/index.js"]

# Blinking contrib image
FROM oven/bun:1.2.2-slim AS blinking-contrib

WORKDIR /action

COPY --from=builder /app/dist/blinking-contrib/ /action/

ENTRYPOINT ["bun", "/action/index.js"]
