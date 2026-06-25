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
    <div class="content-container">
      <!-- TOC 目录（复用 HomeView 的 .toc 结构和 indicator，始终渲染容器） -->
      <aside class="toc" v-show="tocItems.length > 0">
        <nav aria-label="page content">
          <div class="toc__overline">On this page</div>
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
              :class="{ 'toc__item--sub': item.level === 'H3' }"
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
            <span class="author-name">{{ author.name }}</span>
            <span class="author-role">{{ author.role }}</span>
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
    <div class="section" v-if="upNextArticles.length">
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

    <!-- ======== Footer（M3 about 风格） ======== -->
    <footer class="mio-footer">
      <section class="about">
        <div class="about-material">
          <a class="about-logo" @click.prevent="$router.push('/')">
            <span class="material-symbols-rounded">edit_note</span>
          </a>
          <p>Kernel's Blog 是基于 Vue 3 + Material Web 的个人博客站点，严格遵循 Material Design 3 规范。探索技术，记录生活。</p>
        </div>
      </section>
      <div class="footer-links">
        <a class="footer-link" @click.prevent="$router.push('/')">首页</a>
        <a class="footer-link" @click.prevent="$router.push('/blog')">博客</a>
        <a class="footer-link" @click.prevent="$router.push('/projects')">项目</a>
        <a class="footer-link" @click.prevent="$router.push('/about')">关于</a>
        <a class="footer-link" href="https://github.com/BJY-STUDIO/myprofile" target="_blank" rel="noopener">GitHub</a>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// ======== 文章数据 ========
const articles = {
  'kernels-blog': {
    slug: 'kernels-blog',
    title: "Kernel's Blog",
    description: '基于 Vue 3 + Material Web 的个人博客站点，严格遵循 M3 规范。',
    date: 'Jun 25, 2026',
    heroImage: null,
    authors: [
      { name: 'BJY', role: 'Developer, Material Design Contributor' }
    ],
    contentComponent: defineAsyncComponent(() => import('@/components/blog/KernelsBlogContent.vue'))
  }
}

const article = computed(() => {
  const slug = route.params.slug
  return articles[slug] || articles['kernels-blog']
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
  const headings = blogContentRef.value.querySelectorAll('h2, h3')
  if (!headings.length) return false
  tocItems.value = Array.from(headings).map((h, i) => {
    const id = h.id || `section-${i}`
    if (!h.id) h.id = id
    return { id, text: h.textContent, level: h.tagName }
  })
  return true
}

let observer = null
let contentMutationObserver = null
let scrollRoot = null

function setupScrollObserver() {
  if (observer) observer.disconnect()
  if (!tocItems.value.length) return

  scrollRoot = document.querySelector('.app-main')
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const idx = tocItems.value.findIndex(t => t.id === entry.target.id)
          if (idx >= 0 && activeTocIndex.value !== idx) {
            activeTocIndex.value = idx
            updateIndicatorPosition(idx)
          }
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

    // 初始检测
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
          if (rect.top < midPoint && rect.bottom > rootRect.top && rect.top > maxTop) {
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
  const el = blogContentRef.value?.querySelector(`#${CSS.escape(id)}`)
  if (el) {
    const sr = document.querySelector('.app-main')
    if (sr) {
      const rootRect = sr.getBoundingClientRect()
      const elRect = el.getBoundingClientRect()
      sr.scrollTo({
        top: sr.scrollTop + elRect.top - rootRect.top - 24,
        behavior: 'smooth',
      })
    }
    const idx = tocItems.value.findIndex(t => t.id === id)
    if (idx >= 0) {
      activeTocIndex.value = idx
      updateIndicatorPosition(idx)
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
const thumbBg = 'color-mix(in srgb, var(--md-sys-color-primary, #6750a4) 8%, var(--md-sys-color-surface-container-low, #f8f1f6))'

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

onMounted(() => {
  // 监听 blog-content DOM 变化，异步组件加载完时再构建 TOC
  contentMutationObserver = new MutationObserver(() => {
    const built = buildToc()
    if (built) {
      setupScrollObserver()
      contentMutationObserver?.disconnect()
    }
  })
  nextTick(() => {
    if (blogContentRef.value) {
      contentMutationObserver.observe(blogContentRef.value, { childList: true, subtree: true })
      const built = buildToc()
      if (built) {
        setupScrollObserver()
        contentMutationObserver.disconnect()
      }
    }

    // 计算 indicator top 基准位置
    const nav = document.querySelector('.editorial .toc nav')
    const firstItem = document.querySelector('.editorial .toc__item')
    if (nav && firstItem) {
      const navRect = nav.getBoundingClientRect()
      const itemRect = firstItem.getBoundingClientRect()
      indicatorTop.value = Math.round(itemRect.top - navRect.top)
    }
  })
})

onUnmounted(() => {
  if (observer) observer.disconnect()
  if (contentMutationObserver) contentMutationObserver.disconnect()
})

watch(() => route.params.slug, () => {
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
        }
      })
      contentMutationObserver.observe(blogContentRef.value, { childList: true, subtree: true })
      const built = buildToc()
      if (built) {
        setupScrollObserver()
        contentMutationObserver.disconnect()
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
  /* 文章页：minHeight auto（首页 544px） */
}

.primary-container,
.split-asset-image {
  min-height: auto;
}

@media screen and (max-width: 1294px) {
  .primary-container {
    grid-column: span 2;
  }
  .split-asset-image {
    padding-bottom: 50%;
    grid-column: span 2;
  }
}

.primary-container .wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 840px;
  margin: 0;
}

/* 文章页 date 行（M3: 16px/400, margin-bottom 16px） */
.date {
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0 0 16px;
  display: block;
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
}

/* 文章页 h1: 88px/475/96px（首页 96px/475/96px） */
.primary-container .wrapper .title h1 {
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 88px;
  font-weight: 475;
  line-height: 96px;
  letter-spacing: normal;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0 0 8px;
  font-variation-settings: "GRAD" 0, "opsz" 18;
}

/* 文章页 description: 16px/400/24px（首页 22px/400/30px） */
.primary-container .wrapper .title .description {
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 16px;
  font-weight: 400;
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

/* h1 响应式 */
@media screen and (min-width: 601px) and (max-width: 1294px) {
  .primary-container .wrapper .title h1 {
    font-size: 57px;
    line-height: 64px;
  }
}

@media screen and (max-width: 600px) {
  .mio-header {
    grid-template-columns: 1fr;
  }
  .primary-container {
    padding: 32px;
  }
  .primary-container .wrapper .title h1 {
    font-size: 45px;
    line-height: 52px;
  }
  .primary-container .wrapper .title .description {
    font-size: 16px;
    font-weight: 425;
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

/* H3 子项缩进 */
.toc__item--sub {
  padding-left: 32px;
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
              font-variation-settings 200ms cubic-bezier(0.2, 0, 0, 1);
}

.toc__link--selected {
  color: var(--md-sys-color-on-secondary-container, #1d192b);
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

/* ================================================================
   blog-section（M3 文章页专有：文章区域）
   ================================================================ */
.blog-section {
  flex: 0 1 auto;
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
  align-items: baseline;
  gap: 0;
  margin-top: 8px;
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
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

/* separator（对照 m3: hr, 1px inset, margin 80px 24px 56px） */
.separator {
  border: none;
  border-top: 1px inset var(--md-sys-color-outline-variant, #e8e0e8);
  margin: 80px 24px 56px;
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

.blog-content :deep(h2) {
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 45px;
  font-weight: 475;
  line-height: 52px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 64px 0 24px 0;
  font-variation-settings: "GRAD" 0, "opsz" 18;
}

.blog-content :deep(h3) {
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 32px;
  font-weight: 475;
  line-height: 40px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 48px 0 16px 0;
  font-variation-settings: "GRAD" 0, "opsz" 18;
}

.blog-content :deep(p) {
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin-bottom: 24px;
}

.blog-content :deep(ul),
.blog-content :deep(ol) {
  padding-left: 24px;
  margin-bottom: 24px;
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

.blog-content :deep(code) {
  font-family: 'Google Sans Mono', 'Courier New', monospace;
  font-size: 14px;
  background: var(--md-sys-color-surface-container-high);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

.blog-content :deep(pre) {
  background: var(--md-sys-color-surface-container);
  border-radius: 16px;
  padding: 24px;
  overflow-x: auto;
  margin: 24px 0;
  border: 1px solid var(--md-sys-color-outline-variant);
}

.blog-content :deep(pre code) {
  background: none;
  padding: 0;
  font-size: 14px;
  line-height: 24px;
  border-radius: 0;
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
   section / section-header / card-set（复用 HomeView 结构）
   ================================================================ */
.section {
  margin: 72px 0 96px;
}

.section-header {
  margin: 24px;
}

.section-header h2 {
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 45px;
  font-weight: 475;
  line-height: 52px;
  letter-spacing: normal;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0 0 8px;
  font-variation-settings: "GRAD" 0, "opsz" 18;
}

.card-set {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 0 8px;
  margin: 24px 0 0;
}

@media screen and (max-width: 600px) {
  .card-set {
    grid-template-columns: 1fr;
  }
}

/* ================================================================
   thumbnail 卡片（复用 HomeView 的卡片样式）
   ================================================================ */
.thumbnail {
  position: relative;
  border-radius: 24px;
  background-color: var(--md-sys-color-surface-container-low, #f8f1f6);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  text-decoration: none;
  overflow: hidden;
  cursor: pointer;
  transition: border-radius 0.3s cubic-bezier(0.2, 0, 0, 1), background-color 0.3s cubic-bezier(0.2, 0, 0, 1);
}

.thumbnail:focus-visible {
  outline: 1.6px solid var(--md-sys-color-on-surface, #1c1b1f);
  outline-offset: 0.8px;
}

.thumbnail:hover {
  background-color: color-mix(in srgb, var(--md-sys-color-primary, #6750a4) 8%, var(--md-sys-color-surface-container-low, #f8f1f6));
}

.thumbnail:active {
  border-radius: 40px;
  background-color: color-mix(in srgb, var(--md-sys-color-primary, #6750a4) 12%, var(--md-sys-color-surface-container-low, #f8f1f6));
}

/* ripple */
.thumbnail > .ripple {
  position: absolute;
  border-radius: 50%;
  background-color: var(--md-sys-color-primary, #6750a4);
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
   Footer（M3 about 风格，对照 m3: footer > section.about）
   ================================================================ */
.mio-footer {
  margin-top: 120px;
  background: var(--md-sys-color-surface-container-low, #f8f1f6);
}

.about {
  max-width: 840px;
  margin: 0 auto;
  padding: 56px 24px 32px;
}

.about-material {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.about-logo {
  cursor: pointer;
  flex-shrink: 0;
}

.about-logo .material-symbols-rounded {
  font-size: 32px;
  color: var(--md-sys-color-primary, #6750a4);
}

.about-material p {
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  margin: 0;
}

.footer-links {
  max-width: 840px;
  margin: 0 auto;
  padding: 24px 24px 56px;
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.footer-link {
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  text-decoration: none;
  cursor: pointer;
  transition: color 0.15s ease;
}

.footer-link:hover {
  color: var(--md-sys-color-primary, #6750a4);
}

/* ================================================================
   暗色主题
   ================================================================ */
:global([data-theme="dark"]) .primary-container {
  background: var(--md-sys-color-surface-container-low, #1d1b20);
}

:global([data-theme="dark"]) .split-asset-image__foreground {
  background: linear-gradient(
    135deg,
    var(--md-sys-color-primary-container, #21005d) 0%,
    var(--md-sys-color-secondary-container, #4a4458) 50%,
    var(--md-sys-color-tertiary-container, #633b48) 100%
  );
}

:global([data-theme="dark"]) .thumbnail {
  background-color: var(--md-sys-color-surface-container-low, #1d1b20);
}

:global([data-theme="dark"]) .thumbnail:hover {
  background-color: color-mix(in srgb, var(--md-sys-color-primary, #d0bcff) 8%, var(--md-sys-color-surface-container-low, #1d1b20));
}

:global([data-theme="dark"]) .thumbnail:active {
  background-color: color-mix(in srgb, var(--md-sys-color-primary, #d0bcff) 12%, var(--md-sys-color-surface-container-low, #1d1b20));
}

:global([data-theme="dark"]) .thumbnail::after {
  background-color: var(--md-sys-color-primary, #d0bcff);
}

:global([data-theme="dark"]) .thumbnail:focus-visible {
  outline-color: var(--md-sys-color-on-surface, #e6e1e5);
}

:global([data-theme="dark"]) .thumb-icon {
  color: var(--md-sys-color-on-primary-container, #eaddff);
}

:global([data-theme="dark"]) .toc__indicator {
  border-color: var(--md-sys-color-outline, #938f99);
}

:global([data-theme="dark"]) .toc__item:hover {
  background: color-mix(in srgb, var(--md-sys-color-on-surface, #e6e1e5) 8%, transparent);
}

:global([data-theme="dark"]) .toc__link--selected {
  color: var(--md-sys-color-on-secondary-container, #e8def8);
}

:global([data-theme="dark"]) .mio-footer {
  background: var(--md-sys-color-surface-container-low, #1d1b20);
}

:global([data-theme="dark"]) .separator {
  border-top-color: var(--md-sys-color-outline-variant, #49454f);
}
</style>
