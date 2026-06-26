<template>
  <div class="editorial">
    <!-- ======== mio-header（复用 HomeView 的 header 结构，文章页多了 date + wrapper--article） ======== -->
    <header class="mio-header">
      <div class="primary-container">
        <div class="wrapper wrapper--article">
          <div class="date">{{ article.date }}</div>
          <div class="title">
            <h1>{{ article.title }}</h1>
            <div class="description">{{ article.description }}</div>
          </div>
        </div>
      </div>
      <div
        v-if="article.heroImage"
        class="split-asset-image"
        :style="{ backgroundImage: `url(${article.heroImage})` }"
      >
        <div class="split-asset-image__foreground"></div>
      </div>
      <!-- 无头图时用 home 首页同款渐变占位 -->
      <div v-else class="split-asset-image">
        <div class="split-asset-image__foreground"></div>
      </div>
    </header>

    <!-- ======== content-container（复用 HomeView 的 flex row-reverse 布局） ======== -->
    <div class="content-container" :class="{ 'no-toc': tocItems.length === 0 }">
      <!-- TOC 目录（复用 HomeView 的 .toc 结构和 indicator，始终渲染容器） -->
      <aside class="toc" v-show="tocItems.length > 0">
        <nav aria-label="page content">
          <div class="toc__overline">On this page</div>
          <h2 class="toc__title">{{ article.title }}</h2>
          <div
            class="toc__indicator"
            :class="{ 'toc__indicator--hide': activeTocIndex < 0 }"
            :style="indicatorStyle"
          ></div>
          <ul class="toc__list">
            <li
              v-for="(item, i) in tocItems"
              :key="item.id"
              role="link"
              tabindex="0"
              class="toc__item"
              :aria-current="activeTocIndex === i ? 'true' : 'false'"
              @click="scrollToHeading(item.id)"
              @keydown.enter="scrollToHeading(item.id)"
            >
              <a
                class="toc__link"
                :class="{ 'toc__link--selected': activeTocIndex === i }"
                @click.prevent
              >{{ item.text }}</a>
            </li>
          </ul>
        </nav>
      </aside>

      <!-- article 区域（M3 文章页专有组件） -->
      <article class="blog-section">
        <!-- authors 区域 -->
        <div class="authors">
          <p class="overline">Posted by</p>
          <div
            v-for="(author, i) in article.authors"
            :key="i"
            class="byline"
          >
            <img class="author-avatar" :src="author.avatar || '/favicon.ico'" :alt="author.name" />
            <div class="author-info">
              <span class="author-name">{{ author.name }}</span>
              <span class="author-role">{{ author.role }}</span>
            </div>
          </div>
        </div>

        <!-- separator -->
        <hr class="separator" />

        <!-- blog-content -->
        <div class="blog-content" ref="blogContentRef">
          <component :is="article.contentComponent" v-if="article.contentComponent" />
          <div v-else v-html="article.content"></div>
        </div>
      </article>
    </div>

    <!-- ======== Up Next（M3 文章页专有：推荐阅读） ======== -->
    <!-- 对照 m3: mio-up-next > .content-container(flex) > .empty + .section -->
    <div class="mio-up-next" v-if="upNextArticles.length">
      <div class="content-container" :class="{ 'no-toc': tocItems.length === 0 }">
        <div class="empty"></div>
        <div class="section">
          <div class="section-header">
            <h2>Up next</h2>
          </div>
          <div class="card-set">
        <a
          v-for="item in upNextArticles"
          :key="item.slug"
          class="regular-card thumbnail"
          :href="'#/article/' + item.slug"
          @click.prevent="$router.push('/article/' + item.slug)"
          @mousedown="onCardDown"
        >
    <div class="content-container">
            <span v-if="item.date" class="date">{{ item.date }}</span>
            <span class="mio-title-row">
              <span class="title" :class="{ 'title--cjk': isCjk(item.title) }">{{ item.title }}</span>
            </span>
            <span v-if="item.description" class="description">{{ item.description }}</span>
          </div>
          <div class="thumb-container" :style="{ background: thumbBg }">
            <span class="material-symbols-rounded thumb-icon">{{ item.icon || 'article' }}</span>
          </div>
        </a>
          </div>
        </div>
      </div>
    </div>

    <!-- ======== Footer（对照 m3.material.io mio-footer 结构，在 main 内部随内容滚动） ======== -->
    <div class="mio-footer" :data-theme-squiggle="isDark ? 'dark' : 'light'">
      <div class="squiggle" aria-hidden="true">
        <!-- 亮色 squiggle（M3 官方 stroke: #E1E3E1） -->
        <svg v-if="!isDark" width="100%" height="8" overflow="visible" fill="none" xmlns="http://www.w3.org/2000/svg">
          <pattern id="squiggle-pattern" width="91" height="8" patternUnits="userSpaceOnUse">
            <path d="M114 4c-5.067 4.667-10.133 4.667-15.2 0S88.667-.667 83.6 4 73.467 8.667 68.4 4 58.267-.667 53.2 4 43.067 8.667 38 4 27.867-.667 22.8 4 12.667 8.667 7.6 4-2.533-.667-7.6 4s-10.133 4.667-15.2 0S-32.933-.667-38 4s-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0" stroke="#E1E3E1" stroke-linecap="square" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#squiggle-pattern)" />
        </svg>
        <!-- 暗色 squiggle（M3 官方 stroke: #49454f） -->
        <svg v-else width="100%" height="8" overflow="visible" fill="none" xmlns="http://www.w3.org/2000/svg">
          <pattern id="squiggle-pattern" width="91" height="8" patternUnits="userSpaceOnUse">
            <path d="M114 4c-5.067 4.667-10.133 4.667-15.2 0S88.667-.667 83.6 4 73.467 8.667 68.4 4 58.267-.667 53.2 4 43.067 8.667 38 4 27.867-.667 22.8 4 12.667 8.667 7.6 4-2.533-.667-7.6 4s-10.133 4.667-15.2 0S-32.933-.667-38 4s-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0" stroke="#49454f" stroke-linecap="square" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#squiggle-pattern)" />
        </svg>
      </div>
      <footer class="mio-footer-inner">
        <section class="about">
          <div class="about-material">
            <a class="about-logo" @click.prevent="$router.push('/')" aria-label="Kernel's Blog">
              <span class="material-symbols-rounded">edit_note</span>
            </a>
            <p>Kernel's Blog 是基于 Vue 3 + Material Web 的个人博客站点，严格遵循 Material Design 3 规范。探索技术，记录生活。</p>
          </div>
          <ul class="social-links">
            <li><h3>Social</h3></li>
            <li><a href="https://github.com/BJY-STUDIO/myprofile" target="_blank" rel="noopener">GitHub</a></li>
          </ul>
          <ul class="site-links">
            <li><h3>Site</h3></li>
            <li><a @click.prevent="$router.push('/')">首页</a></li>
            <li><a @click.prevent="$router.push('/blog')">博客</a></li>
            <li><a @click.prevent="$router.push('/projects')">项目</a></li>
            <li><a @click.prevent="$router.push('/about')">关于</a></li>
            <li><a @click.prevent="$router.push('/contact')">联系</a></li>
          </ul>
        </section>
        <section class="legal">
          <div class="brand-logo" @click.prevent="$router.push('/')" aria-label="Kernel's Blog">
            <span class="brand-logo-text">BJY-STUDIO</span>
          </div>
          <ul>
            <li><a href="https://github.com/BJY-STUDIO/myprofile" target="_blank" rel="noopener">GitHub</a></li>
            <li><a @click.prevent="$router.push('/about')">关于</a></li>
          </ul>
        </section>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { articles, defaultSlug } from '@/articles'

const route = useRoute()

// ======== 主题状态（用于 squiggle 颜色切换） ========
const isDark = ref(document.documentElement.getAttribute('data-theme') === 'dark')

function updateThemeState() {
  isDark.value = document.documentElement.getAttribute('data-theme') === 'dark'
}

onMounted(() => {
  // 监听 data-theme 变化
  const observer = new MutationObserver(updateThemeState)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  onUnmounted(() => observer.disconnect())
})

// ======== 文章数据（来自 src/articles/ 自动发现注册表） ========
// 新增文章只需创建 src/articles/xxx.js，无需修改此文件

const article = computed(() => {
  const slug = route.params.slug
  return articles[slug] || articles[defaultSlug] || Object.values(articles)[0]
})

// ======== TOC 目录（复用 HomeView 的 indicator 方案） ========
const tocItems = ref([])
const activeTocIndex = ref(-1)
const blogContentRef = ref(null)

// indicator 位置
const indicatorTop = ref(0)
const indicatorY = ref(0)
const indicatorH = ref(36)

const indicatorStyle = computed(() => ({
  transform: `translateY(${indicatorY.value}px)`,
  height: `${indicatorH.value}px`,
}))

function updateIndicatorPosition(idx) {
  if (idx < 0) return
  const nav = document.querySelector('.editorial .toc nav')
  const tocItemEls = document.querySelectorAll('.editorial .toc__item')
  if (!nav || !tocItemEls.length) return
  if (idx >= tocItemEls.length) return
  const navRect = nav.getBoundingClientRect()
  const itemRect = tocItemEls[idx].getBoundingClientRect()
  indicatorY.value = Math.round(itemRect.top - navRect.top - indicatorTop.value)
  indicatorH.value = Math.round(itemRect.height)
}

function buildToc() {
  if (!blogContentRef.value) return
  const headings = blogContentRef.value.querySelectorAll('h2.linkable')
  if (!headings.length) return false
  tocItems.value = Array.from(headings).map((h, i) => {
    // id 优先取 .block 父级的 id，其次取 h2 自身的 id
    const block = h.closest('.block')
    const id = (block?.id) || h.id || `section-${i}`
    if (!h.id && !block?.id) h.id = id
    return { id, text: h.textContent, level: 'H2' }
  })
  return true
}

let observer = null
let contentMutationObserver = null
let scrollRoot = null
let programmaticScrolling = false

function setupScrollObserver() {
  if (observer) observer.disconnect()
  if (!tocItems.value.length) return

  scrollRoot = document.querySelector('.app-main')
  observer = new IntersectionObserver(
    (entries) => {
      // 如果正在程序化滚动（scrollToHeading），跳过 IntersectionObserver 更新
      if (programmaticScrolling) return

      // 先处理「进入」再处理「离开」，避免两 section 交替时 indicator 误消失
      const entering = entries.filter(e => e.isIntersecting)
      const leaving  = entries.filter(e => !e.isIntersecting)

      for (const entry of entering) {
        const idx = tocItems.value.findIndex(t => t.id === entry.target.id)
        if (idx >= 0 && activeTocIndex.value !== idx) {
          activeTocIndex.value = idx
          updateIndicatorPosition(idx)
        }
      }

      for (const entry of leaving) {
        const idx = tocItems.value.findIndex(t => t.id === entry.target.id)
        if (idx !== activeTocIndex.value) continue   // 离开的不是当前 active → 忽略

        // 当前 active section 离开视口上半区，重新扫描
        // 找「top 已越过中点」的最后一个 section（即使已滚出视口），保证 indicator 不空窗
        let foundActive = -1
        let maxTop = -Infinity
        const rootRect = scrollRoot.getBoundingClientRect()
        const midPoint = rootRect.top + rootRect.height * 0.5
        tocItems.value.forEach(t => {
          const el = blogContentRef.value?.querySelector(`#${CSS.escape(t.id)}`)
          if (!el) return
          const rect = el.getBoundingClientRect()
          if (rect.top < midPoint && rect.top > maxTop) {
            maxTop = rect.top
            foundActive = tocItems.value.indexOf(t)
          }
        })
        if (foundActive >= 0) {
          activeTocIndex.value = foundActive
          updateIndicatorPosition(foundActive)
        } else {
          // 回到页面顶部，无 section 越过中点 → indicator fade out
          activeTocIndex.value = -1
        }
      }
    },
    {
      root: scrollRoot,
      rootMargin: '0px 0px -50% 0px',
      threshold: 0,
    }
  )

  nextTick(() => {
    if (!blogContentRef.value) return
    tocItems.value.forEach(t => {
      const el = blogContentRef.value.querySelector(`#${CSS.escape(t.id)}`)
      if (el) observer.observe(el)
    })

    // 初始检测：找「top 已越过中点」的最后一个 section，若无则保持 hidden
    requestAnimationFrame(() => {
      if (!scrollRoot) return
      const rootRect = scrollRoot.getBoundingClientRect()
      const midPoint = rootRect.top + rootRect.height * 0.5
      let active = -1
      let maxTop = -Infinity
      tocItems.value.forEach(t => {
        const el = blogContentRef.value?.querySelector(`#${CSS.escape(t.id)}`)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top < midPoint && rect.top > maxTop) {
            maxTop = rect.top
            active = tocItems.value.indexOf(t)
          }
        }
      })
      if (active >= 0) {
        activeTocIndex.value = active
        updateIndicatorPosition(active)
      }
    })
  })
}

function scrollToHeading(id) {
  // 优先找 .block 容器（id 在 block 上），其次找 h2（id 在 h2 上）
  let el = blogContentRef.value?.querySelector(`#${CSS.escape(id)}`)
  if (!el) {
    el = blogContentRef.value?.querySelector(`h2[id="${CSS.escape(id)}"]`)
  }
  // 如果找到的是 h2，尝试定位到 .block 的 scroll-target
  const block = el?.closest('.block') || el
  const scrollTarget = block?.querySelector('.scroll-target') || el
  if (scrollTarget || el) {
    const target = scrollTarget || el
    const sr = document.querySelector('.app-main')
    const idx = tocItems.value.findIndex(t => t.id === id)
    if (sr && target) {
      // 立即更新 indicator 到目标位置
      if (idx >= 0) {
        activeTocIndex.value = idx
        updateIndicatorPosition(idx)
      }
      // 标记程序化滚动，防止 IntersectionObserver 在滚动过程中更新 indicator
      programmaticScrolling = true
      const rootRect = sr.getBoundingClientRect()
      const elRect = target.getBoundingClientRect()
      sr.scrollTo({
        top: sr.scrollTop + elRect.top - rootRect.top - 24,
        behavior: 'smooth',
      })
      // 滚动结束后恢复 IntersectionObserver 响应
      const onScrollEnd = () => {
        sr.removeEventListener('scrollend', onScrollEnd)
        clearTimeout(fallbackTimer)
        programmaticScrolling = false
        // 确保最终位置正确
        if (idx >= 0) {
          activeTocIndex.value = idx
          updateIndicatorPosition(idx)
        }
      }
      sr.addEventListener('scrollend', onScrollEnd, { once: true })
      // 降级：scrollend 兼容性不足时用超时
      const fallbackTimer = setTimeout(onScrollEnd, 2000)
    }
  }
}

// Up Next 数据
const upNextArticles = computed(() => {
  const currentSlug = route.params.slug
  return Object.values(articles)
    .filter(a => a.slug !== currentSlug)
    .slice(0, 2)
})

// 卡片涟漪动效（复用 HomeView 的 onCardDown）
const thumbBg = 'var(--md-sys-color-secondary-container, #e8def8)'

function isCjk(text) {
  if (!text) return false
  return /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(text)
}

function onCardDown(e) {
  const card = e.currentTarget
  const rect = card.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const maxDist = Math.max(
    Math.hypot(x, y),
    Math.hypot(rect.width - x, y),
    Math.hypot(x, rect.height - y),
    Math.hypot(rect.width - x, rect.height - y)
  )
  const size = maxDist * 2
  const ripple = document.createElement('div')
  ripple.className = 'ripple'
  for (const attr of card.attributes) {
    if (attr.name.startsWith('data-v-')) ripple.setAttribute(attr.name, '')
  }
  ripple.style.width = size + 'px'
  ripple.style.height = size + 'px'
  ripple.style.left = (x - size / 2) + 'px'
  ripple.style.top = (y - size / 2) + 'px'
  card.appendChild(ripple)
  requestAnimationFrame(() => ripple.classList.add('ripple--active'))
  const onUp = () => {
    window.removeEventListener('mouseup', onUp)
    ripple.classList.remove('ripple--active')
    ripple.classList.add('ripple--fade-out')
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true })
    setTimeout(() => { if (ripple.parentNode) ripple.remove() }, 500)
  }
  window.addEventListener('mouseup', onUp)
}

function recalcIndicatorTop() {
  const nav = document.querySelector('.editorial .toc nav')
  const firstItem = document.querySelector('.editorial .toc__item')
  if (nav && firstItem) {
    const navRect = nav.getBoundingClientRect()
    const itemRect = firstItem.getBoundingClientRect()
    indicatorTop.value = Math.round(itemRect.top - navRect.top)
  }
}

onMounted(() => {
  // 监听 blog-content DOM 变化，异步组件加载完时再构建 TOC
  contentMutationObserver = new MutationObserver(() => {
    const built = buildToc()
    if (built) {
      setupScrollObserver()
      contentMutationObserver?.disconnect()
      nextTick(recalcIndicatorTop)
    }
  })
  nextTick(() => {
    if (blogContentRef.value) {
      contentMutationObserver.observe(blogContentRef.value, { childList: true, subtree: true })
      const built = buildToc()
      if (built) {
        setupScrollObserver()
        contentMutationObserver.disconnect()
        nextTick(recalcIndicatorTop)
      }
    }

    // 计算 indicator top 基准位置
    recalcIndicatorTop()
  })
})

onUnmounted(() => {
  if (observer) observer.disconnect()
  if (contentMutationObserver) contentMutationObserver.disconnect()
})

watch(() => route.params.slug, () => {
  // 同组件路由切换时滚动到顶部（滚动容器是 main.app-main，不是 window）
  const main = document.querySelector('main.app-main')
  if (main) main.scrollTo({ top: 0, behavior: 'instant' })
  tocItems.value = []
  activeTocIndex.value = -1
  nextTick(() => {
    if (blogContentRef.value) {
      if (contentMutationObserver) contentMutationObserver.disconnect()
      contentMutationObserver = new MutationObserver(() => {
        const built = buildToc()
        if (built) {
          setupScrollObserver()
          contentMutationObserver?.disconnect()
          nextTick(recalcIndicatorTop)
        }
      })
      contentMutationObserver.observe(blogContentRef.value, { childList: true, subtree: true })
      const built = buildToc()
      if (built) {
        setupScrollObserver()
        contentMutationObserver.disconnect()
        nextTick(recalcIndicatorTop)
      }
    }
  })
})
</script>

<style scoped>
/* ================================================================
   editorial — 复用 HomeView 的顶层结构
   ================================================================ */
.editorial {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}

/* ================================================================
   mio-header（复用 HomeView 的 split-asset 头部）
   文章页差异：h1 88px（非 96px），description 16px（非 22px），
   多了 date 行，minHeight auto（非 544px）
   ================================================================ */
.mio-header {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 0;
}

.primary-container {
  display: flex;
  margin: 0;
  padding: 56px;
  border-radius: 24px;
  background: var(--md-sys-color-surface-container-low, #f8f1f6);
  background-repeat: no-repeat;
  background-position: 0 50%;
  background-size: cover;
  /* 对照 M3 官方博客文章页：min-height 544px */
  min-height: 544px;
}

.primary-container,
.split-asset-image {
  min-height: 544px;
}

@media screen and (max-width: 1294px) {
  .primary-container {
    grid-column: span 2;
    min-height: unset;
  }
  .split-asset-image {
    padding-bottom: 50%;
    grid-column: span 2;
    min-height: unset;
  }
}

.primary-container .wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 840px;
  margin: 0;
}

/* 文章页 date 行（对照 M3: title-m, 16px/500/24px, margin-bottom 16px） */
.date {
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0 0 16px;
  display: block;
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
}

/* 文章页 h1: 对照 M3 wrapper.sm → hero-sm: 60px/475/65px */
.primary-container .wrapper .title h1 {
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 60px;
  font-weight: 475;
  line-height: 65px;
  letter-spacing: normal;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0 0 8px;
  font-variation-settings: "GRAD" 0, "opsz" 18;
}

/* 文章页 description: 对照 M3 wrapper.sm → title-m: 16px/500/24px */
.primary-container .wrapper .title .description {
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

/* split-asset-image（与首页完全一致） */
.split-asset-image {
  display: flex;
  position: relative;
  justify-content: center;
  border: 1px solid var(--md-sys-color-surface-variant, #e8e0e8);
  border-radius: 24px;
  background-repeat: no-repeat;
  background-size: cover;
  overflow: hidden;
}

.split-asset-image__foreground {
  display: flex;
  position: absolute;
  align-self: stretch;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    var(--md-sys-color-primary-container, #eaddff) 0%,
    var(--md-sys-color-secondary-container, #e8def8) 50%,
    var(--md-sys-color-tertiary-container, #ffd8e4) 100%
  );
  background-repeat: no-repeat;
  background-position: 50% 50%;
  background-size: contain;
}

/* 对照 M3: 601-1294px, h1 → display-l: 57px/475/64px, desc → title-l: 22px/400/30px */
@media screen and (min-width: 601px) and (max-width: 1294px) {
  .primary-container .wrapper .title h1 {
    font-size: 57px;
    line-height: 64px;
  }
  .primary-container .wrapper .title .description {
    font-size: 22px;
    font-weight: 400;
    line-height: 30px;
  }
  .primary-container .wrapper .date {
    font-size: 22px;
    font-weight: 400;
    line-height: 30px;
  }
}

/* 对照 M3: ≤600px, h1 → display-m: 45px/475/52px, desc → body-l: 16px/400/24px */
@media screen and (max-width: 600px) {
  .mio-header {
    grid-template-columns: 1fr;
  }
  .primary-container {
    padding: 32px;
    min-height: unset;
  }
  .split-asset-image {
    min-height: unset;
  }
  .primary-container .wrapper .title h1 {
    font-size: 45px;
    line-height: 52px;
  }
  .primary-container .wrapper .title .description {
    font-size: 16px;
    font-weight: 400;
    line-height: 24px;
  }
  .primary-container .wrapper .date {
    font-size: 16px;
    font-weight: 400;
    line-height: 24px;
  }
  .split-asset-image__foreground {
    position: absolute;
    inset: 0;
  }
}

/* ================================================================
   content-container（复用 HomeView 的 flex row-reverse）
   ================================================================ */
.content-container {
  display: flex;
  flex-direction: row-reverse;
  justify-content: center;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

/* ================================================================
   TOC（复用 HomeView 的 .toc 结构，含 border-only indicator）
   ================================================================ */
.toc {
  flex: 0 0 156px;
  width: 156px;
  margin: 112px 24px 0;
}

.toc nav {
  position: sticky;
  top: 136px;
}

.toc__overline {
  font-size: 11px;
  font-weight: 500;
  line-height: 16px;
  letter-spacing: 0.1px;
  color: var(--md-sys-color-on-surface-variant, #4d4256);
  margin: 0 16px 8px;
}

.toc__title {
  font-size: 24px;
  font-weight: 475;
  line-height: 32px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0 16px 8px;
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
  font-variation-settings: "GRAD" 0, "opsz" 18;
}

/* indicator: border-only pill（与首页完全一致） */
.toc__indicator {
  position: absolute;
  width: 156px;
  left: 0;
  top: v-bind(indicatorTop + 'px');
  border: 1px solid var(--md-sys-color-outline, #79747e);
  border-radius: 18px;
  background-color: rgba(0, 0, 0, 0);
  opacity: 1;
  z-index: -1;
  pointer-events: none;
  transition: transform 0.5s cubic-bezier(0.2, 0, 0, 1),
              opacity 0.2s cubic-bezier(0.2, 0, 0, 1),
              height 0.5s cubic-bezier(0.2, 0, 0, 1);
}

.toc__indicator--hide {
  opacity: 0;
}

.toc__list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc__item {
  display: flex;
  padding: 8px 16px;
  min-height: 36px;
  box-sizing: border-box;
  border-radius: 18px;
  cursor: pointer;
  align-items: center;
}

.toc__item:hover {
  background: color-mix(in srgb, var(--md-sys-color-on-surface, #1c1b1f) 8%, transparent);
}

.toc__link {
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.1px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  text-decoration: none;
  border-radius: 4px;
  font-variation-settings: "GRAD" 0;
  transition: color 200ms cubic-bezier(0.2, 0, 0, 1),
              font-variation-settings 200ms cubic-bezier(0.2, 0, 0, 1),
              font-weight 200ms cubic-bezier(0.2, 0, 0, 1);
}

/* 对照 m3: .toc-item.toc-item-selected — color on-secondary-container, GRAD 125, font-weight 500 */
.toc__link--selected {
  color: var(--md-sys-color-on-secondary-container, #1d192b);
  font-weight: 500;
  font-variation-settings: "GRAD" 125;
}

@media screen and (max-width: 1294px) {
  .toc {
    display: none;
  }
  .content-container {
    flex-direction: column;
  }
}

/* 桌面端 TOC 不可见时，也切换为 column（否则 row-reverse 会让 blog-section 跑到右侧） */
@media screen and (min-width: 1295px) {
  .content-container.no-toc {
    flex-direction: column;
  }
}

/* ================================================================
   blog-section（M3 文章页专有：文章区域）
   对照 M3: flex: 1 1 0%, max-width: 1112px → 我们 max-width:840px
   flex-grow:1 确保始终扩展到最大宽度，不因内容为空而收缩
   ================================================================ */
.blog-section {
  flex: 1 1 0%;
  min-width: 0;
  max-width: 840px;
}

/* ================================================================
   authors（M3 文章页专有）
   对照 m3: .authors + .overline "Posted by" + mio-byline
   ================================================================ */
.authors {
  margin: 80px 24px 0;
}

.authors .overline {
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 11px;
  font-weight: 500;
  line-height: 16px;
  letter-spacing: 0.1px;
  color: var(--md-sys-color-on-surface-variant, #4d4256);
  margin: 0 0 16px;
}

.byline {
  display: flex;
  align-items: center;
  gap: 0;
  margin-top: 8px;
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.author-info {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  margin-left: 24px;
}

.author-name {
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

.author-role {
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
}

.author-role::before {
  content: ', ';
}

/* separator（对照 m3: hr, 1px solid, margin 80px 24px 56px） */
.separator {
  border: none;
  border-top: 1px solid var(--md-sys-color-outline-variant, #e8e0e8);
  margin: 80px 24px 56px;
}

/* squiggle（对照 m3: SVG pattern 方案，亮暗色通过 v-if 切换）
   M3 官方使用内联 SVG + <pattern> 实现无缝波浪线 */
.mio-footer .squiggle {
  position: relative;
}

.mio-footer .squiggle svg {
  display: block;
}

/* ================================================================
   blog-content（M3 文章页专有：文章排版）
   对照 m3: h2 45px/475/52px, p 16px/400/24px, on-surface
   ================================================================ */
.blog-content {
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
  padding: 0 24px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

.blog-content :deep(h2.linkable) {
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 45px;
  font-weight: 475;
  line-height: 52px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0;
  font-variation-settings: "GRAD" 0, "opsz" 18;
}

/* block 容器中 h2 的 margin 由 .block 控制，不在 h2 上 */

.blog-content :deep(h3) {
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 32px;
  font-weight: 475;
  line-height: 40px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 48px 0 16px 0;
  font-variation-settings: "GRAD" 0, "opsz" 18;
}

.blog-content :deep(h4) {
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 24px;
  font-weight: 475;
  line-height: 32px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 32px 0 12px 0;
  font-variation-settings: "GRAD" 0, "opsz" 18;
}

.blog-content :deep(p) {
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin-bottom: 24px;
}

.blog-content :deep(ol) {
  padding-left: 0;
  list-style: none;
  counter-reset: item 0;
  margin-top: 16px;
  margin-bottom: 24px;
}

.blog-content :deep(ol > li) {
  margin-top: 4px;
  margin-bottom: 20px;
  margin-left: 36px;
  counter-increment: item 1;
}

.blog-content :deep(ol > li::before) {
  font-family: 'Google Sans Text', 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0;
  font-variation-settings: "GRAD" 0, "opsz" 17;
  display: block;
  width: 24px;
  height: 32px;
  margin-top: -4px;
  margin-right: 10px;
  margin-left: -36px;
  float: left;
  border-radius: 12px;
  background: var(--md-sys-color-inverse-surface, #323032);
  color: var(--md-sys-color-inverse-on-surface, #f2f2f2);
  line-height: 32px;
  text-align: center;
  content: counter(item);
}

/* ── 移动端 ≤600px: ol pill badge font 12px（对照 M3: label-m） ── */
@media screen and (max-width: 600px) {
  .blog-content :deep(ol > li::before) {
    font-size: 12px;
  }
}

.blog-content :deep(ul) {
  list-style: none;
  padding-left: 0;
  margin-left: 22px;
  margin-top: 56px;
  margin-bottom: 24px;
}

.blog-content :deep(ul li) {
  position: relative;
}

.blog-content :deep(ul li::before) {
  display: inline-block;
  position: absolute;
  top: 8px;
  left: -16px;
  width: 8px;
  height: 8px;
  transform: rotate(calc(var(--rotation, 0) * 36deg));
  background-image: url("data:image/svg+xml,%3Csvg width='8' height='8' viewBox='0 0 8 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4.95843 0.279933C5.5378 -0.353974 6.58452 0.173492 6.41974 1.01632L6.05454 2.88412C5.99767 3.17501 6.09646 3.47451 6.31525 3.67447L7.72007 4.95843C8.35397 5.5378 7.82651 6.58452 6.98368 6.41974L5.11588 6.05454C4.82499 5.99767 4.52549 6.09646 4.32553 6.31525L3.04157 7.72007C2.4622 8.35397 1.41548 7.82651 1.58026 6.98368L1.94545 5.11588C2.00233 4.82499 1.90354 4.52549 1.68475 4.32553L0.279933 3.04157C-0.353974 2.4622 0.173492 1.41548 1.01632 1.58026L2.88412 1.94545C3.17501 2.00233 3.47451 1.90354 3.67447 1.68475L4.95843 0.279933Z' fill='%231E1E1C'/%3E%3C/svg%3E");
  line-height: 0;
  text-align: center;
  content: "";
}

.blog-content :deep(li) {
  margin-bottom: 8px;
  line-height: 24px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

.blog-content :deep(strong) {
  font-weight: 600;
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

/* inline <code> — 对照 m3: Google Sans Mono 400 16px/24px, surface-container bg, 2px 8px padding, 2px radius */
.blog-content :deep(code) {
  font-family: 'Google Sans Mono', 'Courier New', monospace;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  font-variation-settings: "GRAD" 0, "opsz" 17;
  background: var(--md-sys-color-surface-container, #ece7e9);
  padding: 2px 8px;
  border-radius: 2px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

/* ================================================================
   mio-code-snippet__container（对照 m3: CodeMirror code snippet）
   M3 官方结构: mio-code-snippet > .mio-code-snippet__container > .CodeMirror > .CodeMirror-code > pre.CodeMirror-line
   字体: Google Sans Mono 15px/500/32px, GRAD 0, opsz 17
   ================================================================ */

/* mio-code-snippet 外层 display:block, margin-top:56px */
.blog-content :deep(mio-code-snippet) {
  display: block;
  margin-top: 56px;
}

/* mio-code-snippet__container — 纯 wrapper，无 bg/padding/margin */
.blog-content :deep(.mio-code-snippet__container) {
  display: block;
}

/* .CodeMirror — 对照 m3: box-sizing border-box, height auto, 1px border surface-variant, 16px radius */
.blog-content :deep(.mio-code-snippet__container .CodeMirror) {
  box-sizing: border-box;
  height: auto;
  background: #fff;
  border: 1px solid var(--md-sys-color-surface-variant, #e8e0e8);
  border-radius: 16px;
  color: #2e383c;
  line-height: normal;
  position: relative;
  overflow: hidden;
}

/* .CodeMirror-lines padding */
.blog-content :deep(.mio-code-snippet__container .CodeMirror-lines) {
  padding: 4px 0;
  cursor: text;
  min-height: 1px;
}

/* .CodeMirror-code margin */
.blog-content :deep(.mio-code-snippet__container .CodeMirror-code) {
  margin: 12px 0;
  outline: none;
}

/* pre.CodeMirror-line — 对照 m3: font-family Google Sans Mono 500 15px/32px, padding 0 4px 0 24px */
.blog-content :deep(.mio-code-snippet__container pre.CodeMirror-line) {
  font-family: 'Google Sans Mono', sans-serif;
  font-size: 15px;
  font-weight: 500;
  line-height: 32px;
  font-variation-settings: "GRAD" 0, "opsz" 17;
  padding: 0 4px 0 24px;
  margin: 0;
  border-radius: 0;
  border: none;
  background: transparent;
  color: inherit;
  white-space: pre;
  overflow-wrap: normal;
  word-break: normal;
}

/* 移动端 ≤960px: padding-left 16px（对照 m3） */
@media screen and (max-width: 960px) {
  .blog-content :deep(.mio-code-snippet__container pre.CodeMirror-line) {
    padding-left: 16px;
    padding-right: 16px;
  }
}

/* ── 语法高亮色彩 — 对照 m3 cm-s-neo 亮色主题 ── */
.blog-content :deep(.cm-s-neo .cm-variable),
.blog-content :deep(.cm-s-neo .cm-qualifier) {
  color: #047d65;
}

.blog-content :deep(.cm-s-neo .cm-keyword),
.blog-content :deep(.cm-s-neo .cm-property) {
  color: #1d75b3;
}

.blog-content :deep(.cm-s-neo .cm-atom),
.blog-content :deep(.cm-s-neo .cm-number) {
  color: #75438a;
}

.blog-content :deep(.cm-s-neo .cm-node),
.blog-content :deep(.cm-s-neo .cm-tag) {
  color: #9c3328;
}

.blog-content :deep(.cm-s-neo .cm-string) {
  color: #b35e14;
}

.blog-content :deep(.cm-s-neo .cm-comment) {
  color: #75787b;
}

.blog-content :deep(.cm-s-neo .cm-operator) {
  color: #2e383c;
}

.blog-content :deep(blockquote) {
  border-left: 4px solid var(--md-sys-color-primary);
  padding-left: 20px;
  margin: 24px 0;
  color: var(--md-sys-color-on-surface-variant);
  font-style: italic;
}

.blog-content :deep(img) {
  width: 100%;
  border-radius: 16px;
  margin: 24px 0;
}

.blog-content :deep(a) {
  color: var(--md-sys-color-primary);
  text-decoration: none;
  border-radius: 4px;
  padding: 1px 2px;
  transition: background-color 0.15s ease;
}

.blog-content :deep(a:hover) {
  background: var(--md-sys-color-primary-container);
}

.blog-content :deep(hr) {
  border: none;
  border-top: 1px solid var(--md-sys-color-outline-variant);
  margin: 48px 0;
}

/* ================================================================
   Up Next — 严格对照 M3 源代码架构
   纯 CSS 对齐，无需 JS 计算：
   
   M3 对齐原理：
   1. editorial .content-container 与 up-next .content-container 同宽同级
   2. 两者都用 flex row-reverse + justify-content:center
   3. .empty 宽度+margin = TOC 宽度+margin（156px + 24px*2）
   4. .section max-width = .blog-section max-width → 右边缘对齐
   5. .section padding-left = blog-content padding-left → h2 与文本对齐
   6. 最终：卡片左边缘 = 文本起始，卡片右边缘 = section 右边缘 = blog-section 右边缘
   
   对应 M3 的值：
   - .section max-width: 1112px → 我们 840px（= blog-section）
   - .section padding-left: 116px → 我们 24px（= blog-content padding）
   - .empty width: 156px, margin: 0 24px → 与 TOC 尺寸一致
   ================================================================ */
.mio-up-next {
  display: block;
  margin: 120px 0 0;
}

.mio-up-next .content-container {
  display: flex;
  flex-direction: row-reverse;
  justify-content: center;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

/* .empty — 与 .toc 尺寸完全一致：width:156px + margin:0 24px
   桌面端显示，移动端隐藏 */
.mio-up-next .empty {
  display: none;
  flex-shrink: 0;
}

@media screen and (min-width: 1295px) {
  .mio-up-next .empty {
    display: block;
    width: 156px;
    margin: 0 24px;
  }
  /* TOC 不可见时，.empty 也隐藏，section 居中 */
  .mio-up-next .content-container.no-toc .empty {
    display: none;
  }
  .mio-up-next .content-container.no-toc {
    flex-direction: column;
  }
}

/* .section — 与 .blog-section max-width 一致，纯 CSS 对齐
   桌面端: max-width:840px + padding-left:24px = 文本对齐
   移动/平板: padding:0 24px = 与 blog-content 一致 */
.mio-up-next .section {
  display: block;
  flex: 1;
  min-width: 0;
  max-width: 840px;
  padding: 0 24px;
  margin: 0;
}

@media screen and (min-width: 1295px) {
  .mio-up-next .section {
    padding-left: 24px;
  }
}

.mio-up-next .section-header {
  margin: 24px 24px 24px 0;
}

.mio-up-next .section-header h2 {
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 57px;
  font-weight: 475;
  line-height: 64px;
  letter-spacing: normal;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0 0 8px;
  font-variation-settings: "GRAD" 0, "opsz" 18;
}

/* 移动端 ≤600px: display-s (对照 M3) */
@media screen and (max-width: 600px) {
  .mio-up-next .section-header h2 {
    font-size: 36px;
    line-height: 44px;
  }
}

/* 平板 601-1294px: display-m (对照 M3) */
@media screen and (min-width: 601px) and (max-width: 1294px) {
  .mio-up-next .section-header h2 {
    font-size: 45px;
    line-height: 52px;
  }
}

.mio-up-next .card-set {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 0;
  padding: 0;
}

/* 卡片填满网格单元（inline-flex 默认只包裹内容，需 width:100% 拉伸） */
.mio-up-next .card-set .thumbnail {
  width: 100%;
}

@media screen and (max-width: 600px) {
  .mio-up-next .card-set {
    grid-template-columns: 1fr;
  }
}

/* ================================================================
   thumbnail 卡片（复用 HomeView 的卡片样式）
   ================================================================ */
.thumbnail {
  position: relative;
  display: inline-flex;
  border-radius: 24px;
  background-color: var(--md-sys-color-surface-container-low, #f8f1f6);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  text-decoration: none;
  overflow: hidden;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: border-radius 0.3s cubic-bezier(0.2, 0, 0, 1), background-color 0.3s cubic-bezier(0.2, 0, 0, 1);
}

/* M3 官方：hover/focus/active 统一使用 secondary-container 背景色 */
.thumbnail:hover,
.thumbnail:focus,
.thumbnail:active {
  background-color: var(--md-sys-color-secondary-container, #e8def8);
}

/* M3 官方：focus 时圆角 48px + outline 2px solid on-surface + offset 1px */
.thumbnail:focus {
  border-radius: 48px;
  outline: 2px solid var(--md-sys-color-on-surface, #1c1b1f);
  outline-offset: 1px;
}

/* M3 官方：active 时圆角 48px，outline 复位 */
.thumbnail:active {
  border-radius: 48px;
  outline: initial;
}

/* ripple */
.thumbnail > .ripple {
  position: absolute;
  border-radius: 50%;
  background-color: var(--md-sys-color-on-secondary-container, #1d192b);
  opacity: 0;
  pointer-events: none;
  transform: scale(0);
  z-index: 0;
  filter: blur(4px);
}

.thumbnail > .ripple.ripple--active {
  animation: ripple-expand 0.4s cubic-bezier(0.2, 0, 0, 1) forwards;
}

.thumbnail > .ripple.ripple--fade-out {
  animation: ripple-fade 0.3s cubic-bezier(0.2, 0, 0, 1) forwards;
}

@keyframes ripple-expand {
  0% { transform: scale(0); opacity: 0.12; }
  100% { transform: scale(1); opacity: 0.12; }
}

@keyframes ripple-fade {
  0% { opacity: 0.12; }
  100% { opacity: 0; }
}

/* 卡片内部 content-container */
.thumbnail > .content-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin: 24px;
  position: relative;
  z-index: 2;
  min-width: 0;
  flex-shrink: 0;
  max-width: none;
  justify-content: start;
}

.thumbnail > .content-container .date {
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0 0 8px;
  display: block;
}

.thumbnail > .content-container .mio-title-row {
  display: flex;
  gap: 5px;
  align-items: flex-start;
  justify-content: space-between;
}

.thumbnail > .content-container .title {
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 24px;
  font-weight: 475;
  line-height: 32px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0;
  font-variation-settings: "GRAD" 0, "opsz" 18;
  transition: font-variation-settings 0.3s cubic-bezier(0.2, 0, 0, 1),
              font-weight 0.3s cubic-bezier(0.2, 0, 0, 1);
}

.thumbnail:hover > .content-container .title {
  font-variation-settings: "GRAD" 50, "opsz" 18;
  font-weight: 475;
}
.thumbnail:hover > .content-container .title.title--cjk {
  font-weight: 525;
}

.thumbnail:active > .content-container .title {
  font-variation-settings: "GRAD" -50, "opsz" 18;
  font-weight: 475;
}
.thumbnail:active > .content-container .title.title--cjk {
  font-weight: 425;
}

.thumbnail > .content-container .description {
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0;
  display: block;
  overflow: visible;
}

/* thumb-container */
.thumb-container {
  border-radius: 24px;
  background-size: cover;
  background-position: center;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  width: 100%;
  flex-shrink: 0;
}

.thumb-icon {
  font-size: 56px;
  color: var(--md-sys-color-on-primary-container, #21005d);
  opacity: 0.4;
  z-index: 1;
}

/* regular-card 中卡 */
.regular-card.thumbnail {
  display: inline-flex;
  flex-direction: column-reverse;
  justify-content: flex-end;
  background-color: var(--md-sys-color-surface-container-low, #f8f1f6);
}

.regular-card.thumbnail > .content-container {
  align-self: start;
  width: calc(100% - 48px);
  overflow: hidden;
}

.regular-card.thumbnail > .thumb-container {
  height: 298px;
}

@media screen and (max-width: 600px) {
  .regular-card.thumbnail > .thumb-container {
    height: 200px;
  }
}

/* ================================================================
   Footer（对照 m3.material.io footer 结构）
   mio-footer (外层 wrapper): margin-top 120px, position static
   mio-footer-inner (footer): padding 64px 40px, 无背景色
   section.about: grid, max-width 1200px, 3列, gap 20px, justify-content: space-between
   section.legal: margin-top 64px, flex row, logo + 法律链接
   ================================================================ */
.mio-footer {
  margin-top: 120px;
}

/* ── Footer 内层容器 ── 对照 m3: max-width 1280px 居中, padding 64px 40px */
.mio-footer-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 64px 40px;
  font-family: 'Google Sans Text', 'Google Sans', 'Noto Sans SC', sans-serif;
  box-sizing: border-box;
}

/* section.about — 对照 m3: grid, max-width 1200px, justify-content: space-between */
.mio-footer-inner .about {
  display: grid;
  grid-template-columns: auto;
  gap: 0 20px;
  justify-content: space-between;
}

@media screen and (min-width: 960px) {
  .mio-footer-inner .about {
    grid-template-columns: 570px 190px 190px;
    max-width: 1200px;
  }
}

/* about-material — 对照 m3: logo (Google Symbols 40px) + description */
.about-material {
  display: block;
}

.about-material .about-logo {
  display: flex;
  cursor: pointer;
  padding: 1px;
  width: max-content;
}

.about-material .about-logo .material-symbols-rounded {
  font-size: 40px;
  line-height: 40px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

.about-material p {
  font-family: 'Google Sans Text', 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 24px 64px 16px 0;
}

/* social-links / site-links — 对照 m3: ul, flex column, gap 20px, margin-top 24px */
/* h3 在第一个 li 中，与下方链接左对齐（同列） */
.mio-footer-inner .social-links,
.mio-footer-inner .site-links {
  display: flex;
  flex-direction: column;
  gap: 20px;
  list-style: none;
  padding: 0;
  margin: 24px 0 0;
}

.mio-footer-inner .social-links h3,
.mio-footer-inner .site-links h3 {
  font-family: 'Google Sans Text', 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  margin: 0;
  color: var(--md-sys-color-on-surface-variant, #49454f);
}

.mio-footer-inner .social-links li,
.mio-footer-inner .site-links li {
  padding: 0;
  margin: 0;
}

.mio-footer-inner .social-links li a,
.mio-footer-inner .site-links li a {
  font-family: 'Google Sans Text', 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  color: var(--md-sys-color-primary, #6750a4);
  text-decoration: underline !important;
  cursor: pointer;
  display: inline-flex;
  padding: 1px;
}

/* section.legal — 对照 m3: margin-top 64px, flex row, brand logo + 链接, max-width 1200px */
.mio-footer-inner .legal {
  display: flex;
  align-items: center;
  margin: 64px 0 0;
  max-width: 1200px;
}

.mio-footer-inner .legal .brand-logo {
  display: block;
  cursor: pointer;
  margin-right: 32px;
  flex-shrink: 0;
}

.mio-footer-inner .legal .brand-logo-text {
  font-family: 'Google Sans Text', 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  letter-spacing: 0.5px;
}

.mio-footer-inner .legal ul {
  display: flex;
  flex-direction: row;
  gap: 16px 24px;
  list-style: none;
  padding: 0;
  margin: 0;
  flex-wrap: wrap;
}

.mio-footer-inner .legal li {
  margin: 0;
  padding: 0;
}

.mio-footer-inner .legal li a {
  font-family: 'Google Sans Text', 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  color: var(--md-sys-color-primary, #6750a4);
  text-decoration: none !important;
  cursor: pointer;
  display: inline;
  padding: 1px;
}

/* ── 平板端 601-960px ── 对照 M3: footer padding 32px, about 3-col, about-material span 3 */
@media screen and (max-width: 960px) and (min-width: 601px) {
  .mio-footer-inner {
    padding: 64px 32px;
  }

  .mio-footer-inner .about {
    grid-template-columns: 1fr 1fr 1fr;
  }

  .about-material {
    grid-column: span 3;
  }

  .about-material p {
    margin-right: 0;
  }
}

/* ── 移动端 ≤600px ── 对照 M3: footer padding 24px, about 1-col, legal column, ul gap 24px */
@media screen and (max-width: 600px) {
  .mio-footer-inner {
    padding: 64px 24px;
  }

  .mio-footer-inner .about {
    grid-template-columns: 1fr;
  }

  .about-material p {
    margin-right: 0;
  }

  .mio-footer-inner .social-links,
  .mio-footer-inner .site-links {
    row-gap: 24px;
  }

  .mio-footer-inner .legal {
    flex-direction: column;
    align-items: flex-start;
  }

  .mio-footer-inner .legal ul {
    margin-top: 24px;
  }
}

/* ================================================================
   暗色主题
   ================================================================ */
:global([data-theme="dark"] .primary-container) {
  background: var(--md-sys-color-surface-container-low, #1d1b20);
}

:global([data-theme="dark"] .split-asset-image__foreground) {
  background: linear-gradient(
    135deg,
    var(--md-sys-color-primary-container, #21005d) 0%,
    var(--md-sys-color-secondary-container, #4a4458) 50%,
    var(--md-sys-color-tertiary-container, #633b48) 100%
  );
}

:global([data-theme="dark"] .thumbnail) {
  background-color: var(--md-sys-color-surface-container-low, #1d1b20);
}

/* M3 官方暗色：hover/focus/active 统一使用 secondary-container */
:global([data-theme="dark"] .thumbnail:hover),
:global([data-theme="dark"] .thumbnail:focus),
:global([data-theme="dark"] .thumbnail:active) {
  background-color: var(--md-sys-color-secondary-container, #4a4458);
}

:global([data-theme="dark"] .thumbnail:focus) {
  border-radius: 48px;
  outline: 2px solid var(--md-sys-color-on-surface, #e6e1e5);
  outline-offset: 1px;
}

:global([data-theme="dark"] .thumb-icon) {
  color: var(--md-sys-color-on-primary-container, #eaddff);
}

:global([data-theme="dark"] .toc__indicator) {
  border-color: var(--md-sys-color-outline, #938f99);
}

:global([data-theme="dark"] .toc__item:hover) {
  background: color-mix(in srgb, var(--md-sys-color-on-surface, #e6e1e5) 8%, transparent);
}

:global([data-theme="dark"] .toc__link--selected) {
  color: var(--md-sys-color-on-secondary-container, #e8def8);
}

:global([data-theme="dark"] .about-material .about-logo .material-symbols-rounded),
:global([data-theme="dark"] .mio-footer-inner .legal .brand-logo-text) {
  color: var(--md-sys-color-on-surface, #e6e1e5);
}

:global([data-theme="dark"] .mio-footer-inner .social-links h3),
:global([data-theme="dark"] .mio-footer-inner .site-links h3) {
  color: var(--md-sys-color-on-surface, #e6e1e5);
}

:global([data-theme="dark"] .separator) {
  border-top-color: var(--md-sys-color-outline-variant, #49454f);
}

/* 暗色主题 — squiggle: 已通过 v-if 切换 SVG（stroke 硬编码为 #49454f），无需额外 CSS */

/* 暗色主题 — ol 药丸徽章：CSS 变量 inverse-surface/inverse-on-surface 由 theme.js 自动切换，无需额外规则 */

/* 暗色主题 — inline <code>（M3 官方暗色 bg: #2b292b, color: #e6e1e3） */
:global([data-theme="dark"] .blog-content code) {
  background: var(--md-sys-color-surface-container, #2b292b);
  color: var(--md-sys-color-on-surface, #e6e1e3);
}

/* 暗色主题 — CodeMirror code block（M3 官方 cm-s-material-darker: bg #212121, border #4d4256, color #eeffff） */
:global([data-theme="dark"] .blog-content .mio-code-snippet__container .CodeMirror) {
  background: #212121;
  border-color: var(--md-sys-color-surface-variant, #49454f);
  color: #eeffff;
}

/* 暗色主题 — 语法高亮色彩（对照 m3 cm-s-material-darker） */
:global([data-theme="dark"] .blog-content .cm-s-material-darker .cm-variable) {
  color: #f07178;
}

:global([data-theme="dark"] .blog-content .cm-s-material-darker .cm-keyword),
:global([data-theme="dark"] .blog-content .cm-s-material-darker .cm-property) {
  color: #c792ea;
}

:global([data-theme="dark"] .blog-content .cm-s-material-darker .cm-number) {
  color: #ff5370;
}

:global([data-theme="dark"] .blog-content .cm-s-material-darker .cm-atom) {
  color: #f78c6c;
}

:global([data-theme="dark"] .blog-content .cm-s-material-darker .cm-string) {
  color: #c3e88d;
}

:global([data-theme="dark"] .blog-content .cm-s-material-darker .cm-operator) {
  color: #89ddff;
}

:global([data-theme="dark"] .blog-content .cm-s-material-darker .cm-comment) {
  color: #545454;
}

:global([data-theme="dark"] .blog-content .cm-s-material-darker .cm-def) {
  color: #82aaff;
}

:global([data-theme="dark"] .blog-content .cm-s-material-darker .cm-tag) {
  color: #ff5370;
}

:global([data-theme="dark"] .blog-content .cm-s-material-darker .cm-attribute) {
  color: #c792ea;
}

/* 暗色主题 — ul bullet SVG（M3 官方暗色 #E3E3E3，:global() 包裹完整选择器防止 Vue 编译破坏） */
:global([data-theme="dark"] .blog-content ul li::before) {
  background-image: url("data:image/svg+xml,%3Csvg width='8' height='8' viewBox='0 0 8 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4.95843 0.279933C5.5378 -0.353974 6.58452 0.173492 6.41974 1.01632L6.05454 2.88412C5.99767 3.17501 6.09646 3.47451 6.31525 3.67447L7.72007 4.95843C8.35397 5.5378 7.82651 6.58452 6.98368 6.41974L5.11588 6.05454C4.82499 5.99767 4.52549 6.09646 4.32553 6.31525L3.04157 7.72007C2.4622 8.35397 1.41548 7.82651 1.58026 6.98368L1.94545 5.11588C2.00233 4.82499 1.90354 4.52549 1.68475 4.32553L0.279933 3.04157C-0.353974 2.4622 0.173492 1.41548 1.01632 1.58026L2.88412 1.94545C3.17501 2.00233 3.47451 1.90354 3.67447 1.68475L4.95843 0.279933Z' fill='%23E3E3E3'/%3E%3C/svg%3E");
}

</style>
