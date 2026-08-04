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
COPY --from=builder /app/public ./public

# 创建数据目录
RUN mkdir -p /app/data

EXPOSE 3456

CMD ["node", "server.js"]
