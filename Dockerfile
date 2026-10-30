FROM oven/bun:1.4.4-slim@sha256:1846adf22496bd711036aae8be147e57bdebbaea2e5264e3e0b5af1db187d9a4

LABEL org.opencontainers.image.source="https://github.com/DanDekker/gauntlet-web"

WORKDIR /app

COPY --chown=bun:bun package.json ./
COPY --chown=bun:bun src/ ./src/
COPY --chown=bun:bun public/ ./public/
COPY --chown=bun:bun exercises/ ./exercises/

RUN mkdir -p /data && chown bun:bun /data

ENV NODE_ENV=production \
    PORT=3000 \
    GUANTLET_WEB_HOST=0.0.0.0 \
    GUANTLET_WEB_DATA_DIR=/data

USER bun
EXPOSE 3000
CMD ["bun", "src/server.js"]
