/**
 * Strapi CMS 管理服务 — 用于 Admin 后台 CRUD 操作
 * 
 * 需要 JWT 认证 — 通过 Strapi Admin 登录获取 token
 * 
 * API 参考（Strapi v5）：
 *   POST /api/articles        — 创建文章
 *   GET  /api/articles        — 列表（populate=*）
 *   GET  /api/articles/:id    — 详情（用 documentId）
 *   PUT  /api/articles/:id    — 更新
 *   DELETE /api/articles/:id  — 删除
 *   同理 /api/authors
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:1337/api').replace(/\/$/, '')

let _jwt = null

/**
 * 设置 JWT token（登录成功后调用）
 */
export function setJwt(token) {
  _jwt = token
  if (token) {
    localStorage.setItem('strapi_jwt', token)
  } else {
    localStorage.removeItem('strapi_jwt')
  }
}

/**
 * 获取 JWT token
 */
export function getJwt() {
  if (!_jwt) {
    _jwt = localStorage.getItem('strapi_jwt')
  }
  return _jwt
}

/**
 * 带认证的 fetch 封装
 */
async function apiFetch(path, options = {}) {
  const token = getJwt()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error?.message || `API ${res.status}: ${res.statusText}`)
  }

  return res.json()
}

// ===== 认证 =====

/**
 * 管理员登录 — 使用 Strapi 的 /admin/login 接口
 * 注意：这是 Admin API，不是 Content API
 */
export async function adminLogin(email, password) {
  const adminBase = API_BASE.replace('/api', '/admin')
  const res = await fetch(`${adminBase}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error?.message || data.message || 'Login failed')
  }

  const data = await res.json()
  // Strapi admin login 返回 { data: { token, user } }
  const token = data.data?.token
  if (token) {
    setJwt(token)
  }
  return data.data
}

/**
 * 使用 Content API 的认证（users-permissions）
 * 注意：需要 Strapi 用户账户，不是 admin
 */
export async function contentLogin(identifier, password) {
  const res = await fetch(`${API_BASE}/auth/local`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error?.message || 'Login failed')
  }

  const data = await res.json()
  const token = data.jwt
  if (token) {
    setJwt(token)
  }
  return data
}

// ===== 文章 CRUD =====

/**
 * 获取文章列表
 */
export async function fetchArticles() {
  const data = await apiFetch('/articles?populate=*')
  return data.data || []
}

/**
 * 获取单篇文章
 */
export async function fetchArticle(documentId) {
  const data = await apiFetch(`/articles/${documentId}?populate=*`)
  return data.data || data
}

/**
 * 创建文章
 */
export async function createArticle(articleData) {
  const payload = {
    data: {
      title: articleData.title,
      slug: articleData.slug,
      description: articleData.description || '',
      content: articleData.content || '',
      tags: articleData.tags || [],
      author: articleData.authorId || undefined,
    }
  }
  const data = await apiFetch('/articles?populate=*', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data.data || data
}

/**
 * 更新文章
 */
export async function updateArticle(documentId, articleData) {
  const payload = {
    data: {}
  }
  // 只传需要更新的字段
  if (articleData.title !== undefined) payload.data.title = articleData.title
  if (articleData.slug !== undefined) payload.data.slug = articleData.slug
  if (articleData.description !== undefined) payload.data.description = articleData.description
  if (articleData.content !== undefined) payload.data.content = articleData.content
  if (articleData.tags !== undefined) payload.data.tags = articleData.tags
  if (articleData.authorId !== undefined) payload.data.author = articleData.authorId

  const data = await apiFetch(`/articles/${documentId}?populate=*`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return data.data || data
}

/**
 * 删除文章
 */
export async function deleteArticle(documentId) {
  const data = await apiFetch(`/articles/${documentId}`, {
    method: 'DELETE',
  })
  return data.data || data
}

// ===== 作者 CRUD =====

/**
 * 获取作者列表
 */
export async function fetchAuthors() {
  const data = await apiFetch('/authors?populate=*')
  return data.data || []
}

/**
 * 创建作者
 */
export async function createAuthor(authorData) {
  const payload = {
    data: {
      name: authorData.name,
      role: authorData.role || '',
    }
  }
  const data = await apiFetch('/authors?populate=*', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data.data || data
}
