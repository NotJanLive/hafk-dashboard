FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:24-alpine
LABEL org.opencontainers.image.source="https://github.com/NotJanLive/hafk-dashboard"
RUN apk add --no-cache tini && addgroup -S hafk && adduser -S hafk -G hafk
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
COPY --from=build /app/.next/standalone /app/
COPY --from=build /app/.next/static /app/.next/static
COPY --from=build /app/public /app/public
RUN mkdir -p /app/.next/cache && chmod 1777 /app/.next/cache
USER hafk
EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--", "/bin/sh", "-c", "export PORT=\"${SERVER_PORT:-$PORT}\" HOSTNAME=0.0.0.0; exec node /app/server.js"]
