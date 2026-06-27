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
import hljs from 'highlight.js/lib/core'

// 按需注册 highlight.js 语言（减小 bundle 体积）
import javascript from 'highlight.js/lib/languages/javascript'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import json from 'highlight.js/lib/languages/json'
import bash from 'highlight.js/lib/languages/bash'
import python from 'highlight.js/lib/languages/python'
import sql from 'highlight.js/lib/languages/sql'
import yaml from 'highlight.js/lib/languages/yaml'
import java from 'highlight.js/lib/languages/java'
import typescript from 'highlight.js/lib/languages/typescript'
import shell from 'highlight.js/lib/languages/shell'
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('css', css)
hljs.registerLanguage('json', json)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('shell', shell)
hljs.registerLanguage('python', python)
hljs.registerLanguage('py', python)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('yml', yaml)
hljs.registerLanguage('java', java)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts', typescript)

// ===== hljs → CodeMirror token 类名映射 =====
// M3 官方使用 CodeMirror 的 cm-s-neo 主题，token 类名为 cm-variable / cm-keyword 等
// highlight.js 使用 hljs-title / hljs-keyword 等，需要映射以复用现有 CSS
const hljsToCm = {
  'hljs-keyword': 'cm-keyword',
  'hljs-built_in': 'cm-variable',
  'hljs-type': 'cm-variable',
  'hljs-literal': 'cm-atom',
  'hljs-number': 'cm-number',
  'hljs-operator': 'cm-operator',
  'hljs-punctuation': 'cm-operator',
  'hljs-property': 'cm-property',
  'hljs-title': 'cm-property',
  'hljs-title class_': 'cm-variable',
  'hljs-title function_': 'cm-variable',
  'hljs-class': 'cm-variable',
  'hljs-function': 'cm-variable',
  'hljs-variable': 'cm-variable',
  'hljs-variable language_': 'cm-variable',
  'hljs-variable constant_': 'cm-number',
  'hljs-symbol': 'cm-number',
  'hljs-attr': 'cm-property',
  'hljs-attribute': 'cm-property',
  'hljs-selector-tag': 'cm-tag',
  'hljs-selector-class': 'cm-variable',
  'hljs-selector-id': 'cm-variable',
  'hljs-selector-attr': 'cm-property',
  'hljs-name': 'cm-tag',
  'hljs-tag': 'cm-tag',
  'hljs-subst': 'cm-variable',
  'hljs-template-tag': 'cm-keyword',
  'hljs-template-variable': 'cm-variable',
  'hljs-comment': 'cm-comment',
  'hljs-doctag': 'cm-comment',
  'hljs-meta': 'cm-comment',
  'hljs-string': 'cm-string',
  'hljs-regexp': 'cm-string',
  'hljs-addition': 'cm-string',
  'hljs-deletion': 'cm-string',
  'hljs-params': 'cm-variable',
  'hljs-section': 'cm-keyword',
}

/**
 * 将 highlight.js 输出的 HTML 中的 hljs-* 类名替换为 cm-* 类名
 * hljs 输出格式: <span class="hljs-keyword">const</span>
 * 目标格式: <span class="cm-keyword">const</span>
 */
function remapHljsToCm(html) {
  return html.replace(/class="([^"]*hljs[^"]*)"/g, (match, classList) => {
    const classes = classList.split(/\s+/)
    const mapped = classes.map(cls => hljsToCm[cls] || cls)
    // 去重并过滤掉残留的 hljs-* 类
    const unique = [...new Set(mapped.filter(c => !c.startsWith('hljs')))]
    return unique.length > 0 ? `class="${unique.join(' ')}"` : ''
  })
}

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
  // 兼容不同 marked 版本的参数格式：
  // - marked v12 CJS: heading(text: string, level: number, raw: string)
  // - marked v13+ (Vite 预构建可能使用更高版本): heading({text, depth, raw})
  let headingText, headingLevel
  if (typeof text === 'object' && text !== null) {
    // 对象参数格式（marked v13+）
    headingText = text.text
    headingLevel = text.depth
  } else {
    // 位置参数格式（marked v12）
    headingText = text
    headingLevel = level
  }

  if (headingLevel === 2) {
    const id = headingText.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '')
    return `<div class="block" id="${id}"><div class="copy-button-container focusable"><div class="material-symbols-rounded copy-button" role="button" tabindex="0" aria-label="copy link to ${headingText} section">link</div><div class="copy-button-background"></div><div class="tooltip"><span class="deactivated">Copy link</span><span aria-live="polite" class="activated">Link copied</span></div></div><div class="scroll-target"></div><div class="text-chunk"><h2 class="linkable" tabindex="-1">${headingText}</h2></div></div>`
  }
  return `<h${headingLevel}>${headingText}</h${headingLevel}>`
}

m3Renderer.code = function(code, infostring, escaped) {
  // 兼容不同 marked 版本的参数格式：
  // - marked v12 CJS: code(code, infostring, escaped)
  // - marked v13+: code({text, lang, escaped})
  let codeText, lang
  if (typeof code === 'object' && code !== null) {
    codeText = code.text
    lang = code.lang
  } else {
    codeText = code
    lang = infostring
  }

  // 使用 highlight.js 进行语法高亮
  let highlighted
  if (lang && hljs.getLanguage(lang)) {
    try {
      highlighted = hljs.highlight(codeText, { language: lang }).value
    } catch {
      highlighted = codeText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    }
  } else {
    // 无语言标识或不支持的语言，尝试自动检测
    try {
      highlighted = hljs.highlightAuto(codeText).value
    } catch {
      highlighted = codeText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    }
  }

  // 将 hljs-* 类名映射为 CodeMirror cm-* 类名
  const remapped = remapHljsToCm(highlighted)
  // 按行拆分并包裹在 <pre class="CodeMirror-line"> 中
  const lines = remapped.trimEnd().split('\n')
  const preLines = lines.map(line => `<pre class="CodeMirror-line"><span role="presentation" style="padding-right: 0.1px;">${line || ' '}</span></pre>`).join('')
  return `<mio-code-snippet><div class="mio-code-snippet__container"><div class="CodeMirror cm-s-neo CodeMirror-wrap" translate="no"><div class="CodeMirror-scroll"><div class="CodeMirror-sizer"><div class="CodeMirror-lines"><div class="CodeMirror-code">${preLines}</div></div></div></div></div></div></mio-code-snippet>`
}

// ===== 表格渲染器 — 对照 M3 博客 mio-table 结构 =====
// M3 官方结构: <div class="mio-table"><div class="mdc-data-table table-wrapper"><table class="mdc-data-table__table">...
// table-wrapper: border 1px solid surface-variant, border-radius 24px, overflow-x auto
// td: padding 16px 24px, border-top 1px solid surface-variant, border-right 1px solid surface-variant
// 首行无 border-top, 末列无 border-right
m3Renderer.table = function(header, body) {
  // 兼容 marked v12 (header, body) 和 marked v13+ ({header, body})
  let headerContent, bodyContent
  if (typeof header === 'object' && header !== null && !Array.isArray(header)) {
    headerContent = header.header || ''
    bodyContent = header.body || ''
  } else {
    headerContent = header || ''
    bodyContent = body || ''
  }
  // marked v12 headerContent 不含 <thead> 包装，需显式添加
  const thead = headerContent ? `<thead>${headerContent}</thead>` : ''
  return `<div class="mio-table"><div class="table-wrapper"><table>${thead}${bodyContent}</table></div></div>`
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
