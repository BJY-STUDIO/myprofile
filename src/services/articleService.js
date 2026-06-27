/**
 * 文章数据统一访问层
 *
 * 支持两种数据源模式：
 *   - auto（默认）：优先从 Strapi API 获取，不可达时回退到本地
 *   - local：仅使用 import.meta.glob 自动发现 src/articles/ 下的 .js 文件
 *   - api：仅从 Strapi REST API 获取
 *
 * 配置方式：
 *   环境变量 VITE_ARTICLE_SOURCE=auto|local|api
 *   环境变量 VITE_API_BASE_URL=http://localhost:1337/api
 *
 * Strapi 响应格式（v5）：
 *   GET /api/articles?populate=*
 *   → { data: [{ id, documentId, title, slug, description, content, tags, publishedAt, author: { ... } }], meta: { pagination } }
 *
 *   GET /api/articles?filters[slug][$eq]=xxx&populate=*
 *   → { data: [Article], meta: { pagination } }
 *
 * 内部统一格式：
 *   ArticleMeta {
 *     slug: string
 *     title: string
 *     description: string
 *     date: string          // 'Jul 1, 2026' 格式
 *     icon?: string
 *     authors: { name: string, role: string, avatar?: string }[]
 *     tags?: string[]
 *   }
 *
 *   ArticleDetail extends ArticleMeta {
 *     content?: string      // HTML 字符串（v-html 渲染）
 *     contentComponent?: Component  // 本地交互式组件（优先于 content）
 *   }
 */

import { defineAsyncComponent } from 'vue'
import { marked, Renderer } from 'marked'

// ===== 配置 =====
const ARTICLE_SOURCE = import.meta.env.VITE_ARTICLE_SOURCE || 'auto'
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:1337/api').replace(/\/$/, '')

// ===== 日期格式化：ISO → 'Jul 1, 2026' =====
function formatDate(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

// ===== Markdown → HTML（使用 marked，自定义 renderer 匹配 M3 结构） =====

const m3Renderer = new Renderer()

m3Renderer.heading = function(text, level, raw) {
  if (level === 2) {
    const id = text.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '')
    return `<div class="block" id="${id}"><div class="copy-button-container focusable"><div class="material-symbols-rounded copy-button" role="button" tabindex="0" aria-label="copy link to ${text} section">link</div><div class="copy-button-background"></div><div class="tooltip"><span class="deactivated">Copy link</span><span aria-live="polite" class="activated">Link copied</span></div></div><div class="scroll-target"></div><div class="text-chunk"><h2 class="linkable" tabindex="-1">${text}</h2></div></div>`
  }
  return `<h${level}>${text}</h${level}>`
}

m3Renderer.code = function(code, infostring, escaped) {
  const text = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trimEnd()
  const lines = text.split('\n')
  const preLines = lines.map(line => `<pre class="CodeMirror-line">${line}</pre>`).join('')
  return `<mio-code-snippet><div class="mio-code-snippet__container"><div class="CodeMirror cm-s-neo CodeMirror-wrap" translate="no"><div class="CodeMirror-scroll"><div class="CodeMirror-sizer"><div class="CodeMirror-lines"><div class="CodeMirror-code">${preLines}</div></div></div></div></div></div></mio-code-snippet>`
}

marked.use({ renderer: m3Renderer })

function markdownToHtml(md) {
  if (!md) return ''
  return marked.parse(md)
}

// ===== Local 模式：import.meta.glob 自动发现 =====

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

// ===== Strapi API 映射 =====

/**
 * 将 Strapi v5 文章对象映射为内部 ArticleMeta/ArticleDetail 格式
 */
function mapStrapiArticle(strapiArticle, includeContent = false) {
  if (!strapiArticle) return null

  const result = {
    slug: strapiArticle.slug || '',
    title: strapiArticle.title || '',
    description: strapiArticle.description || '',
    date: formatDate(strapiArticle.publishedAt || strapiArticle.createdAt),
    icon: 'article',
    tags: strapiArticle.tags || [],
    authors: [],
  }

  // 作者映射
  if (strapiArticle.author) {
    result.authors = [{
      name: strapiArticle.author.name || 'Unknown',
      role: strapiArticle.author.role || '',
      avatar: strapiArticle.author.avatar?.url || '',
    }]
  }

  // 内容映射
  if (includeContent && strapiArticle.content) {
    result.content = markdownToHtml(strapiArticle.content)
    result.contentFormat = 'html'
  }

  return result
}

// ===== API 检测与超时配置 =====

// 首次请求超时：15s（API 热启动 1-3s 足够）
const API_FETCH_TIMEOUT = 15000
// 重试超时：60s（覆盖 Render 冷启动 30-50s）
const API_RETRY_TIMEOUT = 60000
// 首次失败后等待 2s 再重试（Render 正在启动中）
const API_RETRY_DELAY = 2000

let _apiAvailable = null  // null=未检测, true=已确认可用。永远不缓存 false
let _apiCache = { list: null, detail: {} }
let _apiListPromise = null

/**
 * 带超时的 fetch 封装
 */
async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)
    return res
  } catch (e) {
    clearTimeout(timer)
    throw e
  }
}

async function fetchArticleList(timeoutMs = API_FETCH_TIMEOUT) {
  if (_apiCache.list) return _apiCache.list

  if (!_apiListPromise) {
    _apiListPromise = fetchWithTimeout(`${API_BASE_URL}/articles?populate=*`, timeoutMs)
      .then(res => {
        if (!res.ok) throw new Error(`API ${res.status}`)
        return res.json()
      })
      .then(json => {
        const items = json.data || []
        _apiCache.list = items.reduce((acc, item) => {
          const mapped = mapStrapiArticle(item, false)
          if (mapped) acc[mapped.slug] = mapped
          return acc
        }, {})
        _apiListPromise = null
        _apiAvailable = true
        return _apiCache.list
      })
      .catch(err => {
        console.error('[ArticleService] fetchArticleList failed:', err)
        _apiListPromise = null
        // 不缓存 _apiAvailable = false，下次调用会重试
        return null  // 返回 null 表示失败，调用方决定降级策略
      })
  }

  return _apiListPromise
}

async function fetchArticleDetail(slug, timeoutMs = API_FETCH_TIMEOUT) {
  if (_apiCache.detail[slug]) return _apiCache.detail[slug]

  try {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/articles?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=*`,
      timeoutMs
    )
    if (!res.ok) throw new Error(`API ${res.status}`)
    const json = await res.json()
    const items = json.data || []
    if (items.length === 0) return null

    const mapped = mapStrapiArticle(items[0], true)
    _apiCache.detail[slug] = mapped
    _apiAvailable = true
    return mapped
  } catch (err) {
    console.error(`[ArticleService] fetchArticleDetail(${slug}) failed:`, err)
    // 不缓存 _apiAvailable = false，下次调用会重试
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

// ===== 统一接口 =====

/**
 * 获取文章列表（元数据）
 * auto 模式：先尝试 API（15s 超时），失败则回退本地
 * @returns {Promise<{ articles: Object, sortedSlugs: string[], defaultSlug: string, source: string }>}
 */
export async function getArticleIndex() {
  // local 模式：直接本地
  if (ARTICLE_SOURCE === 'local') {
    getLocalArticles()
    return {
      articles: _localArticles,
      sortedSlugs: _localSortedSlugs,
      defaultSlug: _localDefaultSlug,
      source: 'local',
    }
  }

  // api 或 auto 模式：先尝试 API
  if (ARTICLE_SOURCE === 'api' || ARTICLE_SOURCE === 'auto') {
    const list = await fetchArticleList(API_FETCH_TIMEOUT)
    if (list && Object.keys(list).length > 0) {
      const sortedSlugs = Object.values(list)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(a => a.slug)
      const defaultSlug = sortedSlugs[0] || ''
      return { articles: list, sortedSlugs, defaultSlug, source: 'api' }
    }

    // API 失败且 auto 模式 → 回退本地
    if (ARTICLE_SOURCE === 'auto') {
      getLocalArticles()
      return {
        articles: _localArticles,
        sortedSlugs: _localSortedSlugs,
        defaultSlug: _localDefaultSlug,
        source: 'local',
      }
    }

    // api 模式：API 失败，返回空
    return { articles: {}, sortedSlugs: [], defaultSlug: '', source: 'api' }
  }

  // 兜底
  getLocalArticles()
  return {
    articles: _localArticles,
    sortedSlugs: _localSortedSlugs,
    defaultSlug: _localDefaultSlug,
    source: 'local',
  }
}

/**
 * 获取单篇文章详情
 * - 优先级：API 内容 > 本地 contentComponent > 降级
 * - auto 模式：先尝试 API（15s 超时），失败则回退本地
 *
 * @param {string} slug
 * @returns {Promise<Object|null>}
 */
export async function getArticle(slug) {
  getLocalArticles()  // 始终预加载本地数据
  const localArticle = _localArticles[slug]

  // local 模式
  if (ARTICLE_SOURCE === 'local') {
    return localArticle || null
  }

  // api 或 auto 模式：先尝试 API
  const apiArticle = await fetchArticleDetail(slug, API_FETCH_TIMEOUT)

  if (apiArticle) {
    // API 文章 + 本地交互组件：合并
    if (localArticle?.contentComponent) {
      return { ...apiArticle, contentComponent: localArticle.contentComponent }
    }
    return apiArticle
  }

  // API 失败 → auto 模式回退本地
  if (ARTICLE_SOURCE === 'auto') {
    return localArticle || null
  }

  // api 模式且 API 失败
  return localArticle || null
}

/**
 * 后台重试获取文章（用于 Render 冷启动场景）
 * 首次 15s 超时失败后，等待 2s 再用 60s 超时重试
 * @param {string} slug
 * @param {function} onUpdate — 重试成功时回调，参数为文章数据
 * @returns {function} 取消函数
 */
export function retryArticleFetch(slug, onUpdate) {
  if (ARTICLE_SOURCE === 'local') return () => {}
  if (_apiAvailable === true) return () => {}

  let cancelled = false

  setTimeout(async () => {
    if (cancelled) return
    try {
      const apiArticle = await fetchArticleDetail(slug, API_RETRY_TIMEOUT)
      if (cancelled) return
      if (apiArticle) {
        getLocalArticles()
        const localArticle = _localArticles[slug]
        if (localArticle?.contentComponent) {
          onUpdate({ ...apiArticle, contentComponent: localArticle.contentComponent })
        } else {
          onUpdate(apiArticle)
        }
      }
    } catch {
      // 重试也失败，放弃本次
    }
  }, API_RETRY_DELAY)

  return () => { cancelled = true }
}

/**
 * 后台重试获取文章列表（用于 Up Next 等场景）
 * @param {function} onUpdate — 重试成功时回调，参数为 index 对象
 * @returns {function} 取消函数
 */
export function retryArticleIndexFetch(onUpdate) {
  if (ARTICLE_SOURCE === 'local') return () => {}
  if (_apiAvailable === true) return () => {}

  let cancelled = false

  setTimeout(async () => {
    if (cancelled) return
    try {
      const list = await fetchArticleList(API_RETRY_TIMEOUT)
      if (cancelled) return
      if (list && Object.keys(list).length > 0) {
        const sortedSlugs = Object.values(list)
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .map(a => a.slug)
        const defaultSlug = sortedSlugs[0] || ''
        onUpdate({ articles: list, sortedSlugs, defaultSlug, source: 'api' })
      }
    } catch {
      // 重试也失败
    }
  }, API_RETRY_DELAY)

  return () => { cancelled = true }
}

/**
 * 异步获取实际数据源状态
 */
export async function getResolvedSource() {
  if (ARTICLE_SOURCE !== 'auto') return ARTICLE_SOURCE
  if (_apiAvailable === true) return 'api'
  return 'local'
}

/**
 * 清除缓存（CMS 内容更新时调用）
 * @param {string} [slug] — 指定文章，不传则清除全部
 */
export function clearArticleCache(slug) {
  invalidateCache(slug)
}

/**
 * 当前配置的数据源模式
 */
export function getArticleSource() {
  return ARTICLE_SOURCE
}

/**
 * 重置 API 可用性检测（用于重新检测）
 */
export function resetApiDetection() {
  _apiAvailable = null
}
