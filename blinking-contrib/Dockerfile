# Build blinking-contrib from subdirectory but access parent files
FROM scratch AS context
COPY . /workspace

FROM oven/bun:1.2.2-slim AS builder
WORKDIR /app
COPY --from=context /workspace/package.json /workspace/tsconfig.json ./
COPY --from=context /workspace/packages ./packages
RUN bun install --no-cache
RUN bun run build

FROM oven/bun:1.2.2-slim
WORKDIR /action
COPY --from=builder /app/dist/blinking-contrib/ ./
ENTRYPOINT ["bun", "index.js"]
