# Vibe Nav

现代、简洁的个人导航站，支持浏览器书签导入、亮暗主题切换、后台管理。

## 功能

- **书签展示** — 按分类展示，支持图标、标题和描述信息
- **浏览器书签导入** — 支持导入浏览器导出的 HTML 书签文件
- **元数据识别** — 自动抓取链接的标题、描述和 favicon 图标
- **批量识别** — 一键扫描所有书签，自动补全元数据
- **后台管理** — 分类/书签的增删改查，密码鉴权保护
- **亮暗主题** — 默认亮色，一键切换暗色模式
- **分类导航** — 首页横向药片导航栏，点击平滑滚动
- **站点配置** — 自定义网站名称、Logo 和 Favicon
- **Docker 部署** — 多阶段构建，数据目录持久化

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Next.js 14 (App Router) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS v3 |
| 存储 | JSON 文件 |
| 鉴权 | HMAC-SHA256 签名 + httpOnly Cookie |
| 主题 | next-themes + CSS 变量 |
| 部署 | Docker / Docker Compose |

## 开发

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，修改 ADMIN_PASSWORD 和 AUTH_SECRET

# 启动开发服务器
npm run dev
# 访问 http://localhost:3456
```

### 环境变量

| 变量 | 说明 | 默认值 |
|---|---|---|
| `ADMIN_PASSWORD` | 后台管理登录密码 | `admin123` |
| `AUTH_SECRET` | 会话签名密钥 | 随机生成 |

```bash
# 生成安全的 AUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 生产部署

### Docker

```bash
# 配置 .env.local
cp .env.example .env.local
# 编辑 .env.local，修改密码和密钥

# 启动
docker compose up -d
# 访问 http://localhost:3456
```

### Nginx 反代

```nginx
server {
    listen 80;
    server_name nav.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3456;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 项目结构

```
src/
├── app/                      # 页面路由
│   ├── page.tsx              # 首页
│   ├── admin/
│   │   ├── page.tsx          # 后台管理
│   │   └── login/page.tsx    # 登录页
│   └── api/                  # API 路由
│       ├── auth/             # 鉴权（登录/登出/检查）
│       ├── bookmarks/        # 书签 CRUD
│       ├── categories/       # 分类 CRUD
│       ├── fetch-meta/       # 元数据抓取（单个/批量）
│       ├── import/           # 浏览器书签导入
│       └── settings/         # 站点配置
├── components/
│   ├── BookmarkItem.tsx      # 书签卡片
│   ├── BookmarkForm.tsx      # 书签编辑器
│   ├── CategoryCard.tsx      # 分类卡片
│   ├── CategoryForm.tsx      # 分类编辑器
│   ├── ImportModal.tsx       # 导入弹窗
│   ├── SettingsForm.tsx      # 站点配置表单
│   ├── Navbar.tsx            # 导航栏
│   └── ThemeToggle.tsx       # 主题切换按钮
├── lib/
│   ├── db.ts                 # 数据存储
│   ├── auth.ts               # 鉴权工具
│   └── parser.ts             # 书签 HTML 解析器
└── middleware.ts              # 路由鉴权中间件
```

## 使用指南

### 导入书签

1. 点击右上角「管理」进入后台，输入密码登录
2. 点击「📥 导入书签」
3. 选择浏览器导出的 HTML 文件（Chrome: 书签管理器 → 导出书签）
4. 选择「替换所有」或「合并导入」

### 识别元数据

1. 在后台点击「🔍 批量识别」
2. 系统自动扫描缺少描述或图标的书签
3. 逐个抓取并更新标题、描述和 favicon

### 自定义站点

1. 后台点击「⚙️ 配置」
2. 填写网站名称、Logo URL、Favicon URL
3. 保存后刷新页面生效
