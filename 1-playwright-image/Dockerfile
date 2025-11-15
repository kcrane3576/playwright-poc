# ---- Stage 0: pull browsers, then drop WebKit and full Chromium bundle ----
FROM mcr.microsoft.com/playwright:v1.54.2-noble AS browsers

# Keep only what we need:
# - remove WebKit entirely
# - remove the *full* Chromium tree; keep only the headless shell that PW-core launches
RUN set -eux; \
    rm -rf /ms-playwright/webkit-* || true; \
    find /ms-playwright -maxdepth 1 -type d -name 'chromium-[0-9]*' -prune -exec rm -rf {} +; \
    # (optional) trim crashpad tools, symbols, minidumps to save extra space
    find /ms-playwright -type f -name '*.sym' -delete || true; \
    find /ms-playwright -type f -name 'minidump_stackwalk*' -delete || true; \
    find /ms-playwright -type d -name 'crashpad' -prune -exec rm -rf {} + || true

# ---- Stage 1: runtime Node deps only (no bundled browsers) ----
FROM node:20-bookworm-slim AS deps
ARG PW_VERSION=1.54
WORKDIR /app
RUN npm init -y \
 && npm install --omit=dev --no-audit --no-fund playwright-core@${PW_VERSION} \
 && npm cache clean --force

# ---- Stage 2: final slim runtime ----
FROM node:20-bookworm-slim AS runtime
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
    MOZ_DISABLE_CONTENT_SANDBOX=1

# Install ONLY OS libs for Chromium+Firefox (no webkit deps)
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends ca-certificates curl gnupg fontconfig; \
    npx -y playwright@${PW_VERSION} install-deps chromium firefox; \
    apt-get purge -y --auto-remove curl gnupg; \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/*

ENV TMPDIR=/dev/shm
# Create the app user BEFORE copying, then set ownership at copy time
RUN useradd -m -u 1001 -s /usr/sbin/nologin pwuser \
 && mkdir -p /home/pwuser/.cache/fontconfig /home/pwuser/.cache/dconf \
 && chown -R 1001:1001 /home/pwuser \
 && fc-cache -s

# Copy just the trimmed browser payloads + node deps with ownership set
COPY --from=browsers --chown=1001:1001 /ms-playwright /ms-playwright
WORKDIR /app
COPY --from=deps    --chown=1001:1001 /app/node_modules /app/node_modules
COPY                 --chown=1001:1001 entrypoint.js /app/entrypoint.js

# Trim obvious bulk safely (docs/man/locales)
RUN rm -rf /usr/share/doc/* /usr/share/man/* \
 && find /usr/share/locale -mindepth 1 -maxdepth 1 ! -name 'en*' -exec rm -rf {} +

USER pwuser
ENTRYPOINT ["node", "/app/entrypoint.js"]
