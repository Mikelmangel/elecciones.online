FROM node:22-slim AS build
RUN corepack enable
WORKDIR /repo
COPY data ./data
COPY web ./web
WORKDIR /repo/web
RUN pnpm install --frozen-lockfile && pnpm build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 TERMOMETRO_DB=/app/var/termometro.sqlite
COPY --from=build /repo/web/.next/standalone ./
COPY --from=build /repo/web/.next/static ./web/.next/static
COPY --from=build /repo/web/public ./web/public
# sin root: el volumen del termómetro debe pertenecer a node (ver infra/README)
RUN mkdir -p /app/var && chown node:node /app/var
USER node
EXPOSE 3000
CMD ["node", "web/server.js"]
