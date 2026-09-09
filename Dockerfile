# =============================================================================
# Dockerfile — QRCraft SPA (Multi-Stage Build)
#
# Stage 1 (builder): Node 20 Alpine — install deps, compile TS, build Vite
# Stage 2 (runtime): Nginx Alpine — serve static assets with security hardening
#
# Build:  docker build -t qrcraft:local .
# Run:    docker run --rm -p 8080:80 --read-only --cap-drop ALL \
#           --tmpfs /var/cache/nginx:mode=1777 \
#           --tmpfs /tmp:mode=1777 \
#           qrcraft:local
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Builder — compile TypeScript + bundle with Vite
# ---------------------------------------------------------------------------
FROM --platform=$BUILDPLATFORM node:20-alpine AS builder

WORKDIR /app

# Copy workspace manifests first for layer cache optimization (FR-016)
# Only re-runs npm ci when package files change, not on every source edit.
# npm workspaces needs every member's package.json present to compute the
# install even though only apps/web is built here.
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json

# Use npm ci for reproducible, clean installs (mirrors CI behavior)
RUN npm ci --ignore-scripts

# Copy configuration files needed by the build pipeline
COPY apps/web/tsconfig.json apps/web/tsconfig.app.json apps/web/tsconfig.node.json apps/web/
COPY apps/web/vite.config.ts apps/web/
COPY apps/web/postcss.config.cjs apps/web/tailwind.config.js apps/web/
COPY apps/web/index.html apps/web/

# Copy source code and public assets (changes here don't invalidate npm ci cache)
COPY apps/web/src/ apps/web/src/
COPY apps/web/public/ apps/web/public/

# Compile TypeScript and build production bundle
RUN npm run build --workspace=apps/web

# ---------------------------------------------------------------------------
# Stage 2: Runtime — serve static assets with hardened Nginx
# ---------------------------------------------------------------------------
FROM nginx:alpine-slim AS runtime

# Patch CVE-2026-22184: upgrade zlib to ≥1.3.2-r0 (CRITICAL, fixed upstream)
# Patch CVE-2026-28390: upgrade openssl to ≥3.5.6-r0 (HIGH, fixed upstream)
# Patch CVE-2026-40200: upgrade musl to ≥1.2.7-r0 (HIGH, stack corruption in qsort)
# Targeted upgrades avoid unnecessary package bloat while eliminating the CVEs
RUN apk upgrade --no-cache zlib libcrypto3 libssl3 musl musl-utils

# Create non-root user for security hardening (FR-003)
# UID 1000, no home directory, no login shell
RUN addgroup -g 1000 -S app && \
    adduser -u 1000 -S -G app -s /sbin/nologin app

# Remove default Nginx HTML and config
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Copy built static assets from builder stage
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY .docker/nginx.conf /etc/nginx/nginx.conf

# Prepare writable directories for Nginx on read-only filesystem (FR-004)
# These are the only directories Nginx needs to write to at runtime
RUN mkdir -p /var/cache/nginx /tmp && \
    chown -R app:app /var/cache/nginx /tmp && \
    chown -R app:app /usr/share/nginx/html && \
    chown -R app:app /var/log/nginx

# Expose HTTP port
EXPOSE 80

# Health check instruction for container orchestrators (FR-012)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

# Switch to non-root user
USER app

# Start Nginx in foreground (required for container lifecycle management)
CMD ["nginx", "-g", "daemon off;"]
