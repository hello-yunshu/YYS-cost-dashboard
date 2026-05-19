FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY vite.config.js tailwind.config.js postcss.config.js index.html ./
COPY src/ src/

RUN npm run build:frontend

FROM node:20-alpine AS backend-builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY server/ server/
COPY build-server.js ./

RUN node build-server.js

FROM node:20-alpine AS production

RUN apk add --no-cache nginx

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=frontend-builder /app/dist /app/dist-frontend
COPY --from=backend-builder /app/dist-portable/app/server.bundle.js /app/server.bundle.js
COPY --from=backend-builder /app/node_modules/sql.js/dist/sql-wasm.wasm /app/sql-wasm.wasm
COPY nginx/default.conf /etc/nginx/http.d/default.conf
COPY docker-entrypoint.sh /app/docker-entrypoint.sh

RUN mkdir -p /app/data /app/uploads /run/nginx && \
    chmod +x /app/docker-entrypoint.sh

ENV NODE_ENV=production
ENV DB_MODE=sqljs
ENV DB_PATH=/app/data/cost_dashboard.db
ENV PORT=3113
ENV TZ=Asia/Shanghai

EXPOSE 8080

ENTRYPOINT ["/app/docker-entrypoint.sh"]
