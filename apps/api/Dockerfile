# Build from monorepo root (see docker-compose.yml: context + dockerfile).
# Uses pnpm-lock.yaml and pnpm-workspace.yaml so allowBuilds / frozen install work in CI.

# =====================================
# STAGE 1 — BUILD
# =====================================

FROM node:22-alpine AS builder

WORKDIR /app

ENV CI=true
ENV PNPM_HOME="/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"

# bcrypt + prisma engines need a toolchain on Alpine
RUN apk add --no-cache python3 make g++ openssl

RUN corepack enable && corepack prepare pnpm@11.1.2 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/

# Schema not copied yet — skip postinstall (prisma generate) until sources are present
RUN pnpm install --frozen-lockfile --filter api --ignore-scripts

COPY apps/api ./apps/api

RUN pnpm --filter api build

# =====================================
# STAGE 2 — PRODUCTION
# =====================================

FROM node:22-alpine AS runner

WORKDIR /app/apps/api

ENV NODE_ENV=production

# OpenSSL runtime for Prisma + libstdc++ for bcrypt's prebuilt binding
RUN apk add --no-cache openssl libstdc++

# Run as non-root: drop privileges for the runtime process
RUN addgroup -S appgroup \
 && adduser -S appuser -G appgroup

# Copy installed workspace as-is so Prisma's generated `.prisma/client/*`
# stays where Node's resolution can find it.
COPY --from=builder --chown=appuser:appgroup /app /app

USER appuser

EXPOSE 3001

CMD ["node", "dist/main"]
