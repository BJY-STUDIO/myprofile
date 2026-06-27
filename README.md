# Kernel's Blog

基于 Vue 3 + Material Web Components 的个人博客网站，严格遵循 Material Design 3 设计规范。全栈零成本部署于 Cloudflare Pages + Render + Neon PostgreSQL。

配套后端仓库：[myprofile-cms](https://github.com/BJY-STUDIO/myprofile-cms)

## 特性

**前端**
- Vue 3 + Material Web Components (M3)，严格遵循 Material Design 3 规范
- 响应式布局：桌面端 Navigation Rail + 移动端 Top App Bar + 抽屉导航
- 暗色模式支持，一键切换亮/暗/跟随系统
- 文章渲染：marked + CodeMirror 6 (Lezer) 混合语法高亮
- 文章加载缓冲进度条（md-linear-progress），指数退避自动重试应对冷启动
- URL fragment 书签跳转、目录 (TOC) 滚动追踪
- 自动降级：API 不可达时无缝回退本地文章

**后端**
- Strapi v5 纯 API 模式，中文管理后台（~95% 覆盖率）
- 文章 + 作者 RESTful API，Markdown 内容存储
- 部署于 Render 免费层，Neon 免费 PostgreSQL

**部署**
- 三层架构：Vue 前端 (Cloudflare Pages) → Strapi API (Render) → PostgreSQL (Neon)
- 全部使用免费服务，零运营成本
- Cloudflare Pages 自动部署，推送即上线

## 快速入门

### 环境要求

- Node.js >= 20
- npm >= 6

### 前端

```bash
# 克隆仓库
git clone https://github.com/BJY-STUDIO/myprofile.git
cd myprofile

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env，填入 Strapi API 地址

# 启动开发服务器
npm run dev
```

访问 http://localhost:5173

### 后端 (CMS)

```bash
# 克隆仓库
git clone https://github.com/BJY-STUDIO/myprofile-cms.git
cd myprofile-cms

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env，填入数据库连接字符串和密钥

# 启动开发服务器
npm run develop
```

访问 http://localhost:1337/admin

## 配置

### 前端环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `VITE_API_BASE_URL` | Strapi API 地址 | `https://myprofile-cms.onrender.com/api` |
| `VITE_ARTICLE_SOURCE` | 文章数据源（可选） | `auto`（默认）/ `api` / `local` |

### 后端环境变量

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | PostgreSQL 连接字符串（Neon pooler） |
| `API_TOKEN_SALT` | API Token 盐值 |
| `ENCRYPTION_KEY` | 加密密钥 |
| `CORS_ORIGINS` | 允许的跨域来源 |

### 数据源模式

- `auto`（默认）：优先 API，不可达时自动回退本地文章
- `api`：仅从 API 获取
- `local`：仅使用本地文章

## 部署

### Cloudflare Pages（前端）

1. 关联 GitHub 仓库 `BJY-STUDIO/myprofile`
2. 构建命令：`npm run build`
3. 输出目录：`dist`
4. 环境变量：`VITE_API_BASE_URL`、`VITE_ARTICLE_SOURCE=auto`

### Render（后端）

1. 关联 GitHub 仓库 `BJY-STUDIO/myprofile-cms`
2. 类型：Web Service
3. 构建命令：`npm ci && npm run build`
4. 启动命令：`npm run start`
5. 环境变量：见后端环境变量表，`NODE_ENV=production`

### Neon（数据库）

1. 创建免费 PostgreSQL 数据库
2. 获取 Pooler 连接字符串
3. 将连接字符串填入 Render 的 `DATABASE_URL` 环境变量

## 项目结构

```
src/
├── App.vue                  # 应用骨架：Navigation Rail + 路由视图
├── views/                   # 页面组件
│   ├── HomeView.vue         # 首页
│   ├── BlogView.vue         # 博客列表
│   ├── BlogArticleView.vue  # 文章详情（骨架屏 + 进度条 + TOC）
│   ├── ProjectsView.vue     # 项目展示
│   ├── AboutView.vue        # 关于
│   └── ContactView.vue      # 联系方式
├── components/
│   ├── NavigationRail.vue   # 桌面端导航栏
│   ├── common/              # 公共组件（MioFooter 等）
│   ├── blog/                # 博客组件
│   └── admin/               # 管理后台组件
├── services/
│   └── articleService.js    # 文章数据统一接口（API + 本地降级 + 重试）
├── router/index.js          # Vue Router 路由配置
├── plugins/material-web.js  # Material Web Components 全局注册
├── stores/blogStore.js      # 导航数据 Pinia store
├── styles/main.css          # 全局样式 + M3 CSS 变量
├── utils/theme.js           # 主题引擎（亮/暗/跟随系统）
└── articles/                # 本地文章（按需降级使用）
```

## 技术栈

| 层 | 技术 |
|----|------|
| 前端框架 | Vue 3 |
| UI 组件 | @material/web (Material Web Components) |
| 路由 | Vue Router 4 |
| 状态管理 | Pinia |
| Markdown 渲染 | marked v12 |
| 代码高亮 | CodeMirror 6 (Lezer) + highlight.js (bash/yaml/sql) |
| 构建 | Vite 5 |
| CMS | Strapi v5 |
| 数据库 | PostgreSQL (Neon) |
| 前端托管 | Cloudflare Pages |
| 后端托管 | Render |

## License

MIT
