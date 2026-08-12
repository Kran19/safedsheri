# Stage 1: Build Next.js 14 App Router Monorepo Workspace
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# Copy root monorepo package configs
COPY package*.json ./
COPY tsconfig.json ./
COPY packages/types ./packages/types
COPY apps/admin ./apps/admin

# Install dependencies and build shared types and Next.js Admin app
RUN npm install
RUN npm run build --workspace=packages/types

# Disable Next.js Telemetry during Docker build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1

RUN npm run build --workspace=apps/admin

# Stage 2: Production Next.js Runner
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/admin ./apps/admin
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/tsconfig.json ./

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace=apps/admin"]
