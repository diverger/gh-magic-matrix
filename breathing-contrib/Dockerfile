# Import the pre-built breathing-contrib stage from root Dockerfile
# We build from root context to access all files
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
COPY --from=builder /app/dist/breathing-contrib/ ./
ENTRYPOINT ["bun", "index.js"]
