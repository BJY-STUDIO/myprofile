/**
 * 文章数据统一访问层
 *
 * 支持两种数据源模式：
 *   - local（默认）：使用 import.meta.glob 自动发现 src/articles/ 下的 .js 文件
 *   - api：从远程 Headless CMS / REST API 获取文章数据
 *
 * 配置方式：
 *   环境变量 VITE_ARTICLE_SOURCE=local|api
 *   环境变量 VITE_API_BASE_URL=https://your-cms.example.com/api
 *
 * API 响应格式约定：
 *   GET /articles          → { data: ArticleMeta[] }
 *   GET /articles/:slug    → ArticleDetail
 *
 *   ArticleMeta {
 *     slug: string
 *     title: string
 *     description: string
 *     date: string          // 'Jul 1, 2026' 格式
 *     icon?: string         // Material Symbols Rounded 名称
 *     authors: { name: string, role: string }[]
 *   }
 *
 *   ArticleDetail extends ArticleMeta {
 *     content?: string      // HTML 或 Markdown 字符串（v-html 渲染）
 *     contentFormat?: 'html' | 'markdown'  // 默认 html
 *     // contentComponent 不由 API 返回 — 交互式组件只能通过本地 .js 文件注册
 *   }
 *
 * CMS 迁移步骤：
 *   1. 部署 Headless CMS（Strapi / Sanity / 自建）
 *   2. 按上述格式实现 API 端点
 *   3. 设置 VITE_ARTICLE_SOURCE=api, VITE_API_BASE_URL=...
 *   4. 需要交互式组件的文章仍保留本地 .js 文件（contentComponent 优先于 content）
 *   5. 纯文本文章可完全由 API 交付，无需前端代码修改
 */

import { defineAsyncComponent } from 'vue'

// ===== 配置 =====
const ARTICLE_SOURCE = import.meta.env.VITE_ARTICLE_SOURCE || 'local'
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

// ===== Local 模式：import.meta.glob 自动发现 =====

// 延迟加载，避免在生产环境 API 模式下仍执行 glob
let _localArticles = null
let _localSortedSlugs = null
let _localDefaultSlug = null

function getLocalArticles() {
  if (_localArticles) return _localArticles

  const rawModules = import.meta.glob('../articles/*.js', { eager: true })
  const articles = {}

  for (const path in rawModules) {
    if (path === '../articles/index.js') continue
    const mod = rawModules[path]
    if (mod.default && mod.default.slug) {
      const article = { ...mod.default }
      if (typeof article.contentComponent === 'function') {
        article.contentComponent = defineAsyncComponent(article.contentComponent)
      }
      articles[article.slug] = article
    }
  }

  _localArticles = articles
  _localSortedSlugs = Object.values(articles)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(a => a.slug)
  _localDefaultSlug = _localSortedSlugs[0] || Object.keys(articles)[0]

  return _localArticles
}

// ===== API 模式：远程获取 =====

let _apiCache = { list: null, detail: {} }
let _apiFetchPromise = null

async function fetchArticleList() {
  if (_apiCache.list) return _apiCache.list

  if (!_apiFetchPromise) {
    _apiFetchPromise = fetch(`${API_BASE_URL}/articles`)
      .then(res => {
        if (!res.ok) throw new Error(`API ${res.status}`)
        return res.json()
      })
      .then(json => {
        _apiCache.list = (json.data || []).reduce((acc, a) => {
          acc[a.slug] = a
          return acc
        }, {})
        _apiFetchPromise = null
        return _apiCache.list
      })
      .catch(err => {
        console.error('[ArticleService] fetchArticleList failed:', err)
        _apiFetchPromise = null
        _apiCache.list = {} // 降级为空
        return _apiCache.list
      })
  }

  return _apiFetchPromise
}

async function fetchArticleDetail(slug) {
  if (_apiCache.detail[slug]) return _apiCache.detail[slug]

  try {
    const res = await fetch(`${API_BASE_URL}/articles/${slug}`)
    if (!res.ok) throw new Error(`API ${res.status}`)
    const data = await res.json()
    _apiCache.detail[slug] = data
    return data
  } catch (err) {
    console.error(`[ArticleService] fetchArticleDetail(${slug}) failed:`, err)
    return null
  }
}

function invalidateCache(slug) {
  if (slug) {
    delete _apiCache.detail[slug]
  } else {
    _apiCache = { list: null, detail: {} }
  }
}

// ===== Markdown → HTML 简易转换 =====
// 对于需要完整 Markdown 支持的场景，推荐安装 marked 或 markdown-it
// 这里提供一个最小实现，仅处理前端展示常用的 Markdown 子集

function markdownToHtml(md) {
  if (!md) return ''
  let html = md

  // 代码块 (```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .trimEnd()
    return `<mio-code-snippet><div class="mio-code-snippet__container"><div class="CodeMirror cm-s-neo CodeMirror-wrap" translate="no"><div class="CodeMirror-scroll"><div class="CodeMirror-sizer"><div class="CodeMirror-lines"><div class="CodeMirror-code"><pre class="CodeMirror-line">${escaped.split('\n').join('</pre><pre class="CodeMirror-line">')}</pre></div></div></div></div></div></div></mio-code-snippet>`
  })

  // 行内代码
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // 标题 h2-h4
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>')
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, (_, text) => {
    const id = text.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '')
    return `<div class="block" id="${id}"><div class="copy-button-container focusable"><div class="material-symbols-rounded copy-button" role="button" tabindex="0" aria-label="copy link to ${text} section">link</div><div class="copy-button-background"></div><div class="tooltip"><span class="deactivated">Copy link</span><span aria-live="polite" class="activated">Link copied</span></div></div><div class="scroll-target"></div><div class="text-chunk"><h2 class="linkable" tabindex="-1">${text}</h2></div></div>`
  })

  // 粗体 / 斜体
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // 有序列表
  html = html.replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ol>$1</ol>')

  // 无序列表
  html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>')
  // 合并相邻 li 为 ul（排除已在 ol 中的）
  html = html.replace(/(<li>(?!<).*<\/li>\n?(?!<\/ol>))/g, (match) => {
    return match
  })

  // 段落：非标签行包裹为 <p>
  html = html.replace(/^(?!<[ohmdub]|$)(.+)$/gm, '<p>$1</p>')

  // 清理多余空行
  html = html.replace(/\n{3,}/g, '\n\n')

  return html
}

// ===== 统一接口 =====

/**
 * 获取文章列表（元数据）
 * - local 模式：同步返回
 * - api 模式：异步获取
 * @returns {Promise<{ articles: Object, sortedSlugs: string[], defaultSlug: string }>}
 */
export async function getArticleIndex() {
  if (ARTICLE_SOURCE === 'api') {
    const list = await fetchArticleList()
    const sortedSlugs = Object.values(list)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(a => a.slug)
    const defaultSlug = sortedSlugs[0] || ''
    return { articles: list, sortedSlugs, defaultSlug }
  }

  // Local 模式
  getLocalArticles()
  return {
    articles: _localArticles,
    sortedSlugs: _localSortedSlugs,
    defaultSlug: _localDefaultSlug,
  }
}

/**
 * 获取单篇文章详情
 * - local 模式：直接从 articles 对象获取（contentComponent 可能有）
 * - api 模式：从 API 获取，content 字段转为 HTML
 * - 优先级：本地 contentComponent > API content > 本地无 contentComponent 的降级
 *
 * @param {string} slug
 * @returns {Promise<Object|null>}
 */
export async function getArticle(slug) {
  // 无论何种模式，先查本地（可能有交互式 contentComponent）
  getLocalArticles()
  const localArticle = _localArticles[slug]

  if (ARTICLE_SOURCE === 'api') {
    const apiArticle = await fetchArticleDetail(slug)

    if (!apiArticle && !localArticle) return null

    // API 文章 + 本地交互组件：合并
    if (apiArticle && localArticle?.contentComponent) {
      return {
        ...apiArticle,
        contentComponent: localArticle.contentComponent,
      }
    }

    // 纯 API 文章：转换 content 为 HTML
    if (apiArticle) {
      if (apiArticle.contentFormat === 'markdown' && apiArticle.content) {
        apiArticle.content = markdownToHtml(apiArticle.content)
      }
      return apiArticle
    }

    // 降级到本地
    return localArticle || null
  }

  // Local 模式
  return localArticle || null
}

/**
 * 清除缓存（CMS 内容更新时调用）
 * @param {string} [slug] — 指定文章，不传则清除全部
 */
export function clearArticleCache(slug) {
  invalidateCache(slug)
}

/**
 * 当前数据源模式
 */
export function getArticleSource() {
  return ARTICLE_SOURCE
}
