# ============================================================
# Stage 1: Install all dependencies required for compilation
# ============================================================

FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci


# ============================================================
# Stage 2: Build TypeScript application
# ============================================================

FROM node:22-alpine AS build

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules

COPY package.json package-lock.json ./
COPY tsconfig.json ./

COPY src ./src
COPY migrations ./migrations

RUN npm run build


# ============================================================
# Stage 3: Production runtime
# ============================================================

FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Create an unprivileged application user.
RUN addgroup -S reflex \
    && adduser -S reflex -G reflex

# Install production dependencies only.
COPY package.json package-lock.json ./

RUN npm ci --omit=dev \
    && npm cache clean --force

# Copy compiled application.
COPY --from=build /app/dist ./dist

# Keep migrations available for deployment/pre-deploy commands.
COPY migrations ./migrations

USER reflex

EXPOSE 3000

HEALTHCHECK \
    --interval=30s \
    --timeout=5s \
    --start-period=20s \
    --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/index.js"]