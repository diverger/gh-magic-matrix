FROM oven/bun:1.2.2-slim AS builder

WORKDIR /app

COPY package.json ./

COPY packages/*/package.json ./packages/

RUN bun install --frozen-lockfile

COPY tsconfig.json ./
COPY packages packages

RUN bun run build

FROM oven/bun:1.2.2-slim

WORKDIR /action

COPY --from=builder /app/packages/breathing-contrib/dist/ /action/

CMD ["bun", "/action/index.js"]
