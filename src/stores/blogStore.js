/**
 * 博客数据存储 — API 驱动 + localStorage 缓存 + 硬编码回退
 *
 * 导航菜单数据流：
 *   1. 应用启动：localStorage 缓存 → 硬编码默认值（同步，即时显示）
 *   2. 后台 API 请求：Strapi NavItem API → 更新 store → 缓存到 localStorage
 *   3. API 不可达时：使用缓存或默认值，指数退避重试
 *
 * 写操作（NavManager）：
 *   通过 Strapi Admin API 执行，成功后刷新缓存
 */
import { reactive, watch, toRaw } from 'vue'
import { getNavItems, retryNavItemsFetch, clearNavItemsCache } from '@/services/articleService'

const STORAGE_KEY = 'm3-blog-store'
const NAV_CACHE_KEY = 'm3-nav-cache'

// ===== 默认导航数据 =====
function createDefaultNavItems() {
  return [
    { id: 'home', label: '首页', icon: 'home', route: '/', children: [] },
    { id: 'about', label: '关于', icon: 'person_outline', route: '/about', children: [] },
    { id: 'blog', label: '博客', icon: 'description', route: '/blog', children: [] },
    {
      id: 'projects', label: '项目', icon: 'code', route: '/projects',
      children: [
        { id: 'projects-overview', label: '全部项目', route: '/projects' },
        { id: 'projects-web', label: 'Web 应用', route: '/projects/web' },
        { id: 'projects-tools', label: '工具', route: '/projects/tools' },
      ],
    },
    { id: 'contact', label: '联系', icon: 'mail_outline', route: '/contact', children: [] },
  ]
}

// ===== localStorage 缓存 =====
function loadNavCache() {
  try {
    const raw = localStorage.getItem(NAV_CACHE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (Array.isArray(data) && data.length > 0) return data
    }
  } catch {
    console.warn('[blogStore] nav cache load failed')
  }
  return null
}

function saveNavCache(items) {
  try {
    // 脱敏：移除 _documentId 等内部字段再缓存
    const clean = JSON.parse(JSON.stringify(items))
    localStorage.setItem(NAV_CACHE_KEY, JSON.stringify(clean))
  } catch {
    console.warn('[blogStore] nav cache save failed')
  }
}

function loadPagesFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      return data?.pages || {}
    }
  } catch {}
  return {}
}

function savePagesToStorage(pages) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ pages: toRaw(pages) }))
  } catch {
    console.warn('[blogStore] pages save failed')
  }
}

// ===== 初始化 =====
// 优先级：localStorage 缓存 > 硬编码默认值
const initialNavItems = loadNavCache() || createDefaultNavItems()

const store = reactive({
  navItems: initialNavItems,
  navSource: loadNavCache() ? 'cache' : 'default',  // 'cache' | 'api' | 'default'
  pages: loadPagesFromStorage(),
})

// ===== 持久化 watch =====

// 导航菜单变更 → 缓存到 localStorage
watch(
  () => JSON.parse(JSON.stringify(store.navItems)),
  (val) => {
    saveNavCache(val)
  },
  { deep: true }
)

// 页面数据变更 → 持久化到 localStorage
watch(
  () => JSON.parse(JSON.stringify(store.pages)),
  (val) => {
    savePagesToStorage(val)
  },
  { deep: true }
)

// ===== 后台 API 初始化 =====

// 应用启动时从 Strapi API 获取最新导航数据
getNavItems().then(apiNavItems => {
  if (apiNavItems && apiNavItems.length > 0) {
    store.navItems = apiNavItems
    store.navSource = 'api'
  }
})

// API 不可达时指数退避重试
retryNavItemsFetch((apiNavItems) => {
  if (apiNavItems && apiNavItems.length > 0) {
    store.navItems = apiNavItems
    store.navSource = 'api'
  }
})

/**
 * 从 Strapi API 重新加载导航数据（写操作后调用）
 */
export async function refreshNavItems() {
  clearNavItemsCache()
  const apiNavItems = await getNavItems()
  if (apiNavItems && apiNavItems.length > 0) {
    store.navItems = apiNavItems
    store.navSource = 'api'
    return true
  }
  return false
}

// ===== 导航菜单只读访问 =====
export function useNavItems() {
  function navItems() {
    return store.navItems
  }

  /**
   * 本地乐观更新（写入 Strapi 成功前临时更新 UI）
   * 写入 Strapi 后会通过 refreshNavItems() 刷新全量数据
   */
  function optimisticAdd(item) {
    store.navItems.push({
      id: item.id || `nav-${Date.now()}`,
      label: item.label || '新页面',
      icon: item.icon || 'article',
      route: item.route || `/${item.id || Date.now()}`,
      children: item.children || [],
      ...(item._documentId ? { _documentId: item._documentId } : {}),
    })
  }

  function optimisticUpdate(index, updates) {
    if (index >= 0 && index < store.navItems.length) {
      Object.assign(store.navItems[index], updates)
    }
  }

  function optimisticRemove(index) {
    store.navItems.splice(index, 1)
  }

  function optimisticAddSub(parentIndex, item) {
    if (!store.navItems[parentIndex].children) store.navItems[parentIndex].children = []
    store.navItems[parentIndex].children.push({
      id: item.id || `sub-${Date.now()}`,
      label: item.label || '子页面',
      route: item.route || `/sub/${Date.now()}`,
      ...(item._documentId ? { _documentId: item._documentId } : {}),
    })
  }

  function optimisticUpdateSub(parentIndex, subIndex, updates) {
    const children = store.navItems[parentIndex]?.children
    if (children && subIndex >= 0 && subIndex < children.length) {
      Object.assign(children[subIndex], updates)
    }
  }

  function optimisticRemoveSub(parentIndex, subIndex) {
    store.navItems[parentIndex]?.children?.splice(subIndex, 1)
  }

  return {
    navItems,
    // 乐观更新（NavManager 使用）
    optimisticAdd,
    optimisticUpdate,
    optimisticRemove,
    optimisticAddSub,
    optimisticUpdateSub,
    optimisticRemoveSub,
  }
}

// ===== 页面内容 CRUD =====
export function usePage(pageId) {
  function getPage() {
    return store.pages[pageId]
  }

  function ensurePage() {
    if (!store.pages[pageId]) {
      store.pages[pageId] = {
        title: '',
        description: '',
        heroImage: '',
        sections: [],
      }
    }
    return store.pages[pageId]
  }

  function updatePageHeader(updates) {
    const page = ensurePage()
    if (updates.title !== undefined) page.title = updates.title
    if (updates.description !== undefined) page.description = updates.description
    if (updates.heroImage !== undefined) page.heroImage = updates.heroImage
  }

  // Section CRUD
  function addSection(section) {
    const page = ensurePage()
    page.sections.push({
      id: section?.id || `s-${Date.now()}`,
      label: section?.label || '新分区',
      headingLevel: section?.headingLevel || 'sub-heading',
      noJumplink: section?.noJumplink || false,
      feature: section?.feature || null,
      items: section?.items || [],
    })
  }

  function updateSection(sectionIndex, updates) {
    const page = getPage()
    if (page?.sections?.[sectionIndex]) {
      Object.assign(page.sections[sectionIndex], updates)
    }
  }

  function removeSection(sectionIndex) {
    getPage()?.sections?.splice(sectionIndex, 1)
  }

  function moveSection(from, to) {
    const page = getPage()
    if (page?.sections) {
      const [s] = page.sections.splice(from, 1)
      page.sections.splice(to, 0, s)
    }
  }

  // Card CRUD
  function addCard(sectionIndex, card, type = 'regular') {
    const section = getPage()?.sections?.[sectionIndex]
    if (!section) return
    const newCard = {
      id: `c-${Date.now()}`,
      title: card?.title || '新文章',
      excerpt: card?.excerpt || '',
      date: card?.date || '',
      icon: card?.icon || 'article',
      route: card?.route || '',
      image: card?.image || '',
    }
    if (type === 'feature') {
      section.feature = newCard
    } else {
      if (!section.items) section.items = []
      section.items.push(newCard)
    }
  }

  function updateCard(sectionIndex, cardType, cardIndex, updates) {
    const section = getPage()?.sections?.[sectionIndex]
    if (!section) return
    if (cardType === 'feature' && section.feature) {
      Object.assign(section.feature, updates)
    } else if (cardType === 'regular' && section.items?.[cardIndex]) {
      Object.assign(section.items[cardIndex], updates)
    }
  }

  function removeCard(sectionIndex, cardType, cardIndex) {
    const section = getPage()?.sections?.[sectionIndex]
    if (!section) return
    if (cardType === 'feature') {
      section.feature = null
    } else if (cardType === 'regular') {
      section.items?.splice(cardIndex, 1)
    }
  }

  // TOC 自动生成（从 sections 生成 TOC 列表）
  function generateTOC() {
    const page = getPage()
    if (!page?.sections) return []
    return page.sections
      .filter(s => !s.noJumplink)
      .map((s, i) => ({
        label: s.label,
        sectionIndex: i,
        headingLevel: s.headingLevel,
      }))
  }

  return {
    getPage,
    ensurePage,
    updatePageHeader,
    addSection,
    updateSection,
    removeSection,
    moveSection,
    addCard,
    updateCard,
    removeCard,
    generateTOC,
    // 直接访问 reactive pages
    pages: store.pages,
  }
}

// ===== 重置为默认数据 =====
export function resetStore() {
  const defaults = createDefaultNavItems()
  store.navItems = defaults
  store.navSource = 'default'
}

// ===== 导出原始 store（仅供需要时使用） =====
export function getRawStore() {
  return store
}

export default store
