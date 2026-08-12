# Stage 1: Build NestJS API Monorepo Workspace
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# Copy root monorepo package configs
COPY package*.json ./
COPY tsconfig.json ./
COPY packages/types ./packages/types
COPY prisma ./prisma
COPY apps/api ./apps/api

# Install dependencies and generate Prisma Client
RUN npm install
RUN npx prisma generate
RUN npm run build --workspace=packages/types
RUN npm run build --workspace=apps/api

# Stage 2: Production Container
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production

# Copy built node_modules, generated Prisma Client, compiled code, and entrypoint
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/tsconfig.json ./

# Make entrypoint executable
RUN chmod +x ./apps/api/entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["./apps/api/entrypoint.sh"]
