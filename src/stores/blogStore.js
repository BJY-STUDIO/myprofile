/**
 * 博客数据存储 — reactive + localStorage 持久化
 * 管理导航菜单、页面内容（sections/cards）
 */
import { reactive, watch, toRaw } from 'vue'

const STORAGE_KEY = 'm3-blog-store'

// ===== 默认数据 =====
function createDefaultData() {
  return {
    // 一级导航菜单
    navItems: [
      { id: 'home', label: '首页', icon: 'home', route: '/', children: [] },
      { id: 'about', label: '关于', icon: 'person_outline', route: '/about', children: [] },
      {
        id: 'blog', label: '博客', icon: 'description', route: '/blog',
        children: [
          { id: 'blog-overview', label: '全部文章', route: '/blog' },
          { id: 'blog-tech', label: '技术', route: '/blog/tech' },
          { id: 'blog-life', label: '生活', route: '/blog/life' },
        ],
      },
      {
        id: 'projects', label: '项目', icon: 'code', route: '/projects',
        children: [
          { id: 'projects-overview', label: '全部项目', route: '/projects' },
          { id: 'projects-web', label: 'Web 应用', route: '/projects/web' },
          { id: 'projects-tools', label: '工具', route: '/projects/tools' },
        ],
      },
      { id: 'contact', label: '联系', icon: 'mail_outline', route: '/contact', children: [] },
    ],

    // 页面数据（按 pageId 索引）
    pages: {
      home: {
        title: "Kernel's Blog",
        description: '探索技术，记录生活。一个遵循 Material Design 3 规范的个人博客。',
        heroImage: '',
        sections: [
          {
            id: 's-featured',
            label: 'Featured',
            headingLevel: 'section-header',  // section-header | sub-heading
            noJumplink: false,
            feature: {
              id: 'c-1',
              title: 'Vue 3 Composition API 实战指南',
              excerpt: '深入理解 setup 语法、响应式原理与组合式函数的设计模式。',
              date: '2026-06-18',
              icon: 'code',
              route: '/blog/tech',
              image: '',
            },
            items: [
              {
                id: 'c-2',
                title: 'Material Design 3 主题系统解析',
                excerpt: '从 HCT 色彩空间到动态配色，了解 Google 最新设计语言的色彩体系。',
                date: '2026-06-12',
                icon: 'palette',
                route: '/blog/tech',
                image: '',
              },
              {
                id: 'c-3',
                title: '我的 2026 上半年阅读清单',
                excerpt: '分享上半年读过的几本好书，涵盖技术、设计和思维方式。',
                date: '2026-06-05',
                icon: 'menu_book',
                route: '/blog/life',
                image: '',
              },
            ],
          },
          {
            id: 's-projects',
            label: 'Projects',
            headingLevel: 'sub-heading',
            noJumplink: false,
            feature: null,
            items: [
              {
                id: 'c-4',
                title: "Kernel's Blog",
                excerpt: '基于 Vue 3 + Material Web 的个人博客站点，严格遵循 M3 规范。',
                icon: 'web',
                route: '/article/kernels-blog',
                image: '',
                date: '',
              },
              {
                id: 'c-5',
                title: '数据可视化工具集',
                excerpt: '面向电信行业的数据抓取、清洗与可视化展示工具。',
                icon: 'analytics',
                route: '/projects/tools',
                image: '',
                date: '',
              },
            ],
          },
          {
            id: 's-2026',
            label: '2026',
            headingLevel: 'sub-heading',
            noJumplink: false,
            feature: null,
            items: [
              {
                id: 'c-6',
                title: '考核题库管理平台',
                excerpt: '客户经理培训考核系统，支持题目录入、组卷与成绩统计。',
                date: '2026-03-15',
                icon: 'school',
                route: '/projects/web',
                image: '',
              },
            ],
          },
        ],
      },
    },
  }
}

// ===== 从 localStorage 加载或使用默认值 =====
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.warn('blogStore: localStorage load failed, using defaults')
  }
  return createDefaultData()
}

// ===== 创建响应式 store =====
const store = reactive(loadData())

// ===== 持久化：深层 watch =====
watch(
  () => JSON.parse(JSON.stringify(store)),
  (val) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
    } catch (e) {
      console.warn('blogStore: localStorage save failed')
    }
  },
  { deep: true, immediate: true }
)

// ===== 导航菜单 CRUD =====
export function useNavItems() {
  function addNavItem(item) {
    store.navItems.push({
      id: item.id || `nav-${Date.now()}`,
      label: item.label || '新页面',
      icon: item.icon || 'article',
      route: item.route || `/${item.id || Date.now()}`,
      children: item.children || [],
    })
  }

  function updateNavItem(index, updates) {
    if (index >= 0 && index < store.navItems.length) {
      Object.assign(store.navItems[index], updates)
    }
  }

  function removeNavItem(index) {
    store.navItems.splice(index, 1)
  }

  function moveNavItem(from, to) {
    const [item] = store.navItems.splice(from, 1)
    store.navItems.splice(to, 0, item)
  }

  // 二级菜单
  function addSubItem(parentIndex, item) {
    if (!store.navItems[parentIndex].children) store.navItems[parentIndex].children = []
    store.navItems[parentIndex].children.push({
      id: item.id || `sub-${Date.now()}`,
      label: item.label || '子页面',
      route: item.route || `/sub/${Date.now()}`,
    })
  }

  function updateSubItem(parentIndex, subIndex, updates) {
    const children = store.navItems[parentIndex]?.children
    if (children && subIndex >= 0 && subIndex < children.length) {
      Object.assign(children[subIndex], updates)
    }
  }

  function removeSubItem(parentIndex, subIndex) {
    store.navItems[parentIndex]?.children?.splice(subIndex, 1)
  }

  function moveSubItem(parentIndex, from, to) {
    const children = store.navItems[parentIndex]?.children
    if (children) {
      const [item] = children.splice(from, 1)
      children.splice(to, 0, item)
    }
  }

  return {
    navItems: () => store.navItems,
    addNavItem,
    updateNavItem,
    removeNavItem,
    moveNavItem,
    addSubItem,
    updateSubItem,
    removeSubItem,
    moveSubItem,
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
  const defaults = createDefaultData()
  store.navItems = defaults.navItems
  store.pages = defaults.pages
}

// ===== 导出原始 store（仅供需要时使用） =====
export function getRawStore() {
  return store
}

export default store
