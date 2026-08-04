# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app

# 安装全部依赖（包括 devDependencies，构建需要）
COPY package.json package-lock.json ./
RUN npm ci

# 复制源码并构建
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3456

# 仅复制 standalone 输出
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 确保 public 和 data 目录存在
RUN mkdir -p /app/public /app/data

EXPOSE 3456

CMD ["node", "server.js"]
