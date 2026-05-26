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

RUN corepack enable && corepack prepare pnpm@11.1.2 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile --filter web

COPY apps/web ./apps/web

# NEXT_PUBLIC_* are inlined at build time (browser calls nginx on the host)
ARG NEXT_PUBLIC_API_URL=http://localhost/api
ARG NEXT_PUBLIC_APP_NAME=Healthcare SaaS
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME

RUN pnpm --filter web build

# =====================================
# STAGE 2 — PRODUCTION
# =====================================

FROM node:22-alpine AS runner

WORKDIR /app/apps/web

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as non-root: drop privileges for the runtime process
RUN addgroup -S appgroup \
 && adduser -S appuser -G appgroup

# Copy the whole workspace from builder. Avoids `pnpm deploy` (which respects
# .gitignore and drops `.next/`) and avoids `pnpm start` at runtime (which
# triggers pnpm 11's verify-deps-before-run and crashes on unapproved builds).
COPY --from=builder --chown=appuser:appgroup /app /app

USER appuser

EXPOSE 3000

CMD ["node_modules/.bin/next", "start"]
