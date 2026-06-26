/**
 * 文章自动发现注册表
 *
 * 数据源由 articleService 统一管理：
 *   - local（默认）：自动发现 src/articles/ 下的 .js 文件
 *   - api：从远程 Headless CMS 获取
 *
 * 新增本地文章只需在 src/articles/ 下创建 xxx.js，无需修改此文件。
 *
 * 文章 JS 文件格式：
 *   export default {
 *     slug: 'xxx',                                    // 必填，唯一标识，同时作为路由参数 /article/xxx
 *     title: '文章标题',                               // 必填
 *     description: '摘要描述',                          // 必填，用于 Up Next 卡片
 *     date: 'Jul 1, 2026',                            // 必填
 *     icon: 'article',                                // 可选，Up Next 卡片图标（Material Symbols Rounded 名称）
 *     authors: [{ name: 'Jerry Bao', role: 'Developer' }], // 必填
 *     contentComponent: () => import('@/components/blog/XxxContent.vue')  // 必填，懒加载 Vue 组件
 *   }
 *
 * CMS 迁移路径：
 *   1. 设置 VITE_ARTICLE_SOURCE=api, VITE_API_BASE_URL=...
 *   2. 后端 API 返回相同结构的 JSON（contentComponent 改为 content: html/markdown）
 *   3. BlogArticleView 的 v-html 分支直接渲染
 *   4. 需要交互式组件的文章仍保留本地 .js 文件（contentComponent 优先于 content）
 *   5. 详见 src/services/articleService.js
 */

import { defineAsyncComponent } from 'vue'

// import.meta.glob 自动扫描 src/articles/ 下的所有 .js 文件（排除自身）
const rawModules = import.meta.glob('./*.js', { eager: true })

const articles = {}

for (const path in rawModules) {
  // 跳过 index.js 自身
  if (path === './index.js') continue

  const mod = rawModules[path]
  if (mod.default && mod.default.slug) {
    const article = { ...mod.default }

    // 将 contentComponent 工厂函数包装为 defineAsyncComponent
    if (typeof article.contentComponent === 'function') {
      article.contentComponent = defineAsyncComponent(article.contentComponent)
    }

    articles[article.slug] = article
  }
}

// 按日期降序排列，最近的文章在前
const sortedSlugs = Object.values(articles)
  .sort((a, b) => new Date(b.date) - new Date(a.date))
  .map(a => a.slug)

// 默认文章（最新的）
const defaultSlug = sortedSlugs[0] || Object.keys(articles)[0]

export { articles, sortedSlugs, defaultSlug }
export default articles
