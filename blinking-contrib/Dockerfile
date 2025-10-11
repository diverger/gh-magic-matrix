FROM oven/bun:1.2.2-slim AS builder

WORKDIR /build

# Copy from parent directory
COPY ../package.json ../tsconfig.json ./
COPY ../packages ./packages

RUN bun install --no-cache
RUN bun run build

# Final image
FROM oven/bun:1.2.2-slim

WORKDIR /action

# Only copy the blinking-contrib action
COPY --from=builder /build/dist/blinking-contrib/ ./

ENTRYPOINT ["bun", "index.js"]
