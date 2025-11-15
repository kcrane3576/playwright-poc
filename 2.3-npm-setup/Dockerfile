# ---------- Stage 1: Node deps + browser download ----------
FROM node:22-bookworm-slim AS deps
ARG PW_VERSION=1.54
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    CI=1

WORKDIR /app

# Install Playwright Core
RUN npm init -y \
 && npm install --omit=dev --no-audit --no-fund playwright-core@${PW_VERSION} \
 && npm cache clean --force

# Download Chromium + Firefox browser binaries into /ms-playwright + trim unneeded parts
RUN set -eux; \
    npx playwright@${PW_VERSION} install chromium firefox; \
    # Didn't install WebKit, but this is safe / future-proof:
    rm -rf /ms-playwright/webkit-* || true; \
    # (optional) trim crashpad tools, symbols, minidumps to save extra space
    find /ms-playwright -type f -name '*.sym' -delete || true; \
    find /ms-playwright -type f -name 'minidump_stackwalk*' -delete || true; \
    find /ms-playwright -type d -name 'crashpad' -prune -exec rm -rf {} + || true; \
    # Clean apt caches if anything was pulled in under the hood
    rm -rf /var/lib/apt/lists/* /var/cache/apt/*

# ---------- Stage 2: Ubuntu 24.04 runtime ----------
FROM ubuntu:24.04
ARG PW_VERSION=1.54
ENV NODE_ENV=production \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    HOME=/home/pwuser \
    XDG_CACHE_HOME=/home/pwuser/.cache \
    DEBIAN_FRONTEND=noninteractive \
    # put PW temp files in shm to dodge small /tmp quotas
    TMPDIR=/dev/shm \
    # if your host blocks user namespaces for Firefox, uncomment next line:
    # (prefer enabling userns in the runtime instead of disabling sandbox)
    MOZ_DISABLE_CONTENT_SANDBOX=1 \
    CI=1

# Install ONLY OS libs for Chromium+Firefox (no webkit deps)
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        nodejs \
        npm \
        curl \
        gnupg \
        fontconfig; \
    # Install system libs Playwright expects for Chromium/Firefox
    npx -y playwright@${PW_VERSION} install-deps chromium firefox; \
    # Remove install-only tools
    apt-get purge -y --auto-remove npm curl gnupg; \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/*

ENV TMPDIR=/dev/shm
# Create the app user BEFORE copying, then set ownership at copy time
RUN useradd -m -u 1001 -s /usr/sbin/nologin pwuser \
 && mkdir -p /home/pwuser/.cache/fontconfig /home/pwuser/.cache/dconf \
 && chown -R 1001:1001 /home/pwuser \
 && fc-cache -s

WORKDIR /app

# Copy Node deps, app, and browsers
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /ms-playwright /ms-playwright
COPY --chown=1001:1001 entrypoint.js /app/entrypoint.js

RUN chown -R 1001:1001 /app \
 && rm -rf /usr/share/doc/* /usr/share/man/* \
 && find /usr/share/locale -mindepth 1 -maxdepth 1 ! -name 'en*' -exec rm -rf {} +

USER pwuser
ENTRYPOINT ["node", "/app/entrypoint.js"]
