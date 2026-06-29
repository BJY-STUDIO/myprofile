<template>
  <div class="editorial">
    <!-- ======== mio-header（对照 m3: header.split-asset, grid 1fr 1fr, gap 8px） ======== -->
    <header class="mio-header">
      <div class="primary-container">
        <div class="wrapper">
          <div class="title">
            <h1>{{ pageTitle }}</h1>
            <div class="description">{{ pageDescription }}</div>
          </div>
        </div>
      </div>
      <div class="split-asset-image">
        <div class="split-asset-image__foreground"></div>
      </div>
    </header>

    <!-- ======== content-container（对照 m3: flex row-reverse, TOC右 + posts左） ======== -->
    <div class="content-container">
      <!-- TOC 占位：骨架屏时预留同尺寸空间防 layout shift；加载后显示真实 TOC -->
      <aside v-if="showSkeleton" class="toc toc--placeholder"></aside>
      <aside v-else class="toc toc--fade-in">
        <nav aria-label="page content">
          <div class="toc__overline">On this page</div>
          <h2 class="toc__title">{{ pageTitle }}</h2>
          <div
            class="toc__indicator"
            :class="{ 'toc__indicator--hide': activeSection < 0 }"
            :style="indicatorStyle"
          ></div>
          <ul class="toc__list">
            <li
              v-for="(tocItem, i) in tocSections"
              :key="i"
              role="link"
              tabindex="0"
              class="toc__item"
              :aria-current="activeSection === sections.indexOf(tocItem) ? 'true' : 'false'"
              @click="scrollToSection(sections.indexOf(tocItem))"
              @keydown.enter="scrollToSection(sections.indexOf(tocItem))"
            >
              <a
                class="toc__link"
                :class="{ 'toc__link--selected': activeSection === sections.indexOf(tocItem) }"
                @click.prevent
              >{{ tocItem.label }}</a>
            </li>
          </ul>
        </nav>
      </aside>

      <!-- posts-container（对照 m3: article.posts-container, 996px宽） -->
      <article class="posts-container">
        <!-- 加载中：骨架屏 -->
        <div v-if="showSkeleton" class="posts-inner posts-inner--skeleton">
          <div v-for="si in 3" :key="'sk-section-' + si" class="section">
            <div class="section-header">
              <h2 :class="si > 1 ? 'sub-heading' : ''"><span class="skeleton skeleton-heading" :style="si === 1 ? 'width:35%' : 'width:25%'"></span></h2>
            </div>
            <div class="card-set">
              <div v-for="n in (si === 1 ? 3 : 2)" :key="'sk-' + n" class="skeleton-card">
                <div class="sk-content">
                  <span class="skeleton" style="height:16px;width:80px;"></span>
                  <span class="skeleton" style="height:24px;width:70%;"></span>
                  <span class="skeleton" style="height:16px;width:85%;"></span>
                </div>
                <div class="sk-thumb skeleton"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 已加载：真实内容 -->
        <div v-else class="posts-inner posts-inner--loaded">
        <!-- 每个 section -->
        <div
          v-for="(section, si) in sections"
          :key="si"
          :id="'section-' + si"
          :data-section-index="si"
          class="section"
        >
          <!-- section-header -->
          <div class="section-header">
            <h2 :class="section.headingLevel === 'section-header' ? '' : 'sub-heading'">{{ section.label }}</h2>
          </div>

          <!-- card-set -->
          <div class="card-set">
            <!-- feature-block 长卡 -->
            <a
              v-if="section.feature"
              :href="section.feature.route"
              class="feature-card thumbnail"
              @mousedown="onCardDown"
            >
              <div class="content-container">
                <span v-if="section.feature.date" class="date">{{ section.feature.date }}</span>
                <span class="mio-title-row">
                  <span class="title" :class="{ 'title--cjk': isCjk(section.feature.title) }">{{ section.feature.title }}</span>
                </span>
                <span class="description">{{ section.feature.excerpt }}</span>
              </div>
              <div class="thumb-container" :style="{ background: thumbBg }">
                <span class="material-symbols-rounded thumb-icon">{{ section.feature.icon || 'article' }}</span>
              </div>
            </a>

            <!-- 中卡片 -->
            <a
              v-for="post in section.items"
              :key="post.id"
              :href="post.route"
              class="regular-card thumbnail"
              @mousedown="onCardDown"
            >
              <div class="content-container">
                <span v-if="post.date" class="date">{{ post.date }}</span>
                <span class="mio-title-row">
                  <span class="title" :class="{ 'title--cjk': isCjk(post.title) }">{{ post.title }}</span>
                </span>
                <span v-if="post.excerpt" class="description">{{ post.excerpt }}</span>
              </div>
              <div class="thumb-container" :style="{ background: thumbBg }">
                <span class="material-symbols-rounded thumb-icon">{{ post.icon || 'article' }}</span>
              </div>
            </a>
          </div>
        </div>
        </div>
      </article>
    </div>

    <!-- ======== Footer ======== -->
    <MioFooter />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { getArticleIndex, retryArticleIndexFetch } from '@/services/articleService'
import MioFooter from '@/components/common/MioFooter.vue'

const activeSection = ref(-1)

// ===== Article 数据：API 驱动 =====
const apiArticles = ref(null) // null = 尚未加载; {} = 结果（可能为空）
let cancelRetry = null

// 动态指示器
const indicatorTop = ref(0)
const indicatorY = ref(0)
const indicatorH = ref(36)

// 将 API 文章按年份分组为 sections
const sections = computed(() => {
  if (!apiArticles.value) return []
  const articles = Object.values(apiArticles.value)
  if (articles.length === 0) return []

  // 按年份分组（从 date 字段提取年份）
  const yearMap = {}
  for (const article of articles) {
    // date 格式: 'Jun 18, 2026' → 提取年份
    const yearMatch = article.date?.match(/,\s*(\d{4})/)
    const year = yearMatch ? yearMatch[1] : 'Uncategorized'
    if (!yearMap[year]) yearMap[year] = []
    yearMap[year].push(article)
  }

  // 年份降序排列（2026 → 2025 → ...）
  const years = Object.keys(yearMap).sort((a, b) => {
    if (a === 'Uncategorized') return 1
    if (b === 'Uncategorized') return -1
    return parseInt(b) - parseInt(a)
  })

  return years.map(year => {
    const items = yearMap[year]
      .sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
        return new Date(b.date) - new Date(a.date)
      })
      .map(article => ({
        id: `api-${article.slug}`,
        title: article.title,
        excerpt: article.description,
        date: article.date,
        icon: article.icon || 'article',
        route: `/article/${article.slug}`,
        image: '',
        sortOrder: article.sortOrder ?? 0,
      }))

    // 第一个年份 section 的第一篇文章作为 feature card
    const isFirstYear = year === years[0]
    const feature = isFirstYear && items.length > 0 ? items[0] : null
    const regularItems = isFirstYear ? items.slice(1) : items

    return {
      id: `s-year-${year}`,
      label: year,
      headingLevel: 'section-header',
      noJumplink: false,
      sortOrder: 0,
      feature,
      items: regularItems,
    }
  })
})

const showSkeleton = computed(() => apiArticles.value === null)

const tocSections = computed(() => {
  return sections.value.filter(s => !s.noJumplink)
})

const pageTitle = computed(() => 'Blog')
const pageDescription = computed(() => '所有文章，按年份分组。')

const indicatorStyle = computed(() => {
  return {
    transform: `translateY(${indicatorY.value}px)`,
    height: `${indicatorH.value}px`,
  }
})

// 更新指示器位置
function updateIndicatorPosition(sectionIndex) {
  if (sectionIndex < 0) return
  const nav = document.querySelector('.toc nav')
  const tocItems = document.querySelectorAll('.toc__item')
  if (!nav || !tocItems.length) return
  const tocIdx = tocSections.value.findIndex(s => sections.value.indexOf(s) === sectionIndex)
  if (tocIdx < 0 || !tocItems[tocIdx]) return
  const navRect = nav.getBoundingClientRect()
  const itemRect = tocItems[tocIdx].getBoundingClientRect()
  indicatorY.value = Math.round(itemRect.top - navRect.top - indicatorTop.value)
  indicatorH.value = Math.round(itemRect.height)
}

// 滚动检测
let observer = null
let scrollRoot = null

function setupScrollObserver() {
  if (observer) {
    observer.disconnect()
    observer = null
  }
  scrollRoot = document.querySelector('.app-main')
  if (!scrollRoot) return

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const idx = parseInt(entry.target.getAttribute('data-section-index'))
          if (!isNaN(idx) && activeSection.value !== idx) {
            activeSection.value = idx
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

  const sectionEls = scrollRoot.querySelectorAll('[data-section-index]')
  sectionEls.forEach((el) => observer.observe(el))

  requestAnimationFrame(() => {
    const rootRect = scrollRoot.getBoundingClientRect()
    const midPoint = rootRect.top + rootRect.height * 0.5
    let active = -1
    let maxTop = -Infinity
    sectionEls.forEach((el) => {
      const rect = el.getBoundingClientRect()
      if (rect.top < midPoint && rect.bottom > rootRect.top && rect.top > maxTop) {
        maxTop = rect.top
        active = parseInt(el.getAttribute('data-section-index'))
      }
    })
    if (active >= 0) {
      activeSection.value = active
      updateIndicatorPosition(active)
    }
  })
}

function initTocInteraction() {
  const nav = document.querySelector('.toc nav')
  const firstItem = document.querySelector('.toc__item')
  if (nav && firstItem) {
    const navRect = nav.getBoundingClientRect()
    const itemRect = firstItem.getBoundingClientRect()
    indicatorTop.value = Math.round(itemRect.top - navRect.top)
  }
  setupScrollObserver()
  scrollRoot = document.querySelector('.app-main')
  if (scrollRoot) scrollRoot.addEventListener('scroll', onScroll, { passive: true })
}

function onScroll() {
  if (!scrollRoot) return
  const scrollTop = scrollRoot.scrollTop
  if (scrollTop < 100 && activeSection.value >= 0) {
    const rootRect = scrollRoot.getBoundingClientRect()
    const midPoint = rootRect.top + rootRect.height * 0.5
    const sectionEls = scrollRoot.querySelectorAll('[data-section-index]')
    let anyVisible = false
    for (const el of sectionEls) {
      const rect = el.getBoundingClientRect()
      if (rect.top < midPoint && rect.bottom > rootRect.top) {
        anyVisible = true
        break
      }
    }
    if (!anyVisible) activeSection.value = -1
  }
}

function scrollToSection(i) {
  activeSection.value = i
  updateIndicatorPosition(i)
  const el = document.getElementById('section-' + i)
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
  }
}

// Ripple
const RIPPLE_PRESS_GROW_MS = 450
const RIPPLE_OPACITY = 0.12
const RIPPLE_COLOR = '#001d35'
const RIPPLE_INITIAL_ORIGIN_SCALE = 0.2
const RIPPLE_PADDING = 10
const RIPPLE_SOFT_EDGE_CONTAINER_RATIO = 0.35
const RIPPLE_SOFT_EDGE_MINIMUM_SIZE = 75

function onCardDown(e) {
  const card = e.currentTarget
  let ripple = card.querySelector(':scope > .ripple')
  if (!ripple) {
    ripple = document.createElement('div')
    ripple.className = 'ripple'
    for (const attr of card.attributes) {
      if (attr.name.startsWith('data-v-')) ripple.setAttribute(attr.name, '')
    }
    card.appendChild(ripple)
  }
  const prevAnim = ripple.getAnimations()
  prevAnim.forEach(a => a.cancel())

  const rect = card.getBoundingClientRect()
  const containerW = rect.width
  const containerH = rect.height
  const maxDim = Math.max(containerW, containerH)
  const softEdgeSize = Math.max(RIPPLE_SOFT_EDGE_CONTAINER_RATIO * maxDim, RIPPLE_SOFT_EDGE_MINIMUM_SIZE)
  const initialSize = Math.floor(maxDim * RIPPLE_INITIAL_ORIGIN_SCALE)
  const hypotenuse = Math.sqrt(containerW ** 2 + containerH ** 2)
  const maxRadius = hypotenuse + RIPPLE_PADDING
  const rippleScale = (maxRadius + softEdgeSize) / initialSize

  const clickX = e.clientX ?? (rect.left + containerW / 2)
  const clickY = e.clientY ?? (rect.top + containerH / 2)
  const startX = clickX - rect.left - initialSize / 2
  const startY = clickY - rect.top - initialSize / 2
  const startTransform = `translate(${startX}px, ${startY}px) scale(1)`
  const endX = (containerW - initialSize) / 2
  const endY = (containerH - initialSize) / 2
  const endTransform = `translate(${endX}px, ${endY}px) scale(${rippleScale})`

  const anim = ripple.animate([
    {
      display: 'block',
      opacity: RIPPLE_OPACITY,
      width: `${initialSize}px`,
      height: `${initialSize}px`,
      background: RIPPLE_COLOR,
      transform: startTransform
    },
    { opacity: 0, transform: endTransform }
  ], {
    duration: RIPPLE_PRESS_GROW_MS,
    easing: 'cubic-bezier(0.2, 0, 0, 1)',
    fill: 'forwards'
  })
  anim.onfinish = () => { ripple.style.display = 'none' }
}

const thumbBg = 'var(--md-sys-color-secondary-container, #e8def8)'

function isCjk(text) {
  if (!text) return false
  return /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(text)
}

onMounted(() => {
  getArticleIndex().then(index => {
    if (index && index.articles && Object.keys(index.articles).length > 0) {
      apiArticles.value = index.articles
    } else {
      // API 不可用，启动后台重试
      cancelRetry = retryArticleIndexFetch(index => {
        if (index && index.articles && Object.keys(index.articles).length > 0) {
          apiArticles.value = index.articles
        }
      })
    }
  })
})

watch(apiArticles, (newVal) => {
  if (newVal && Object.keys(newVal).length > 0) {
    nextTick(() => {
      initTocInteraction()
    })
  }
})

onBeforeUnmount(() => {
  if (cancelRetry) cancelRetry()
  if (observer) observer.disconnect()
  if (scrollRoot) scrollRoot.removeEventListener('scroll', onScroll)
})
</script>

<style scoped>
/* ================================================================
   editorial（对照 m3: main.editorial, flex column）
   ================================================================ */
.editorial {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}

/* ================================================================
   mio-header（对照 m3: header.split-asset）
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
  min-height: 544px;
}

.primary-container,
.split-asset-image {
  min-height: 544px;
}

@media screen and (max-width: 1294px) {
  .primary-container,
  .split-asset-image {
    min-height: unset;
  }
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

.primary-container .wrapper .title h1 {
  font-family: var(--md-sys-typescale-home-hero-font-family);
  font-size: var(--md-sys-typescale-home-hero-font-size);
  font-weight: var(--md-sys-typescale-home-hero-font-weight);
  letter-spacing: var(--md-sys-typescale-home-hero-letter-spacing);
  line-height: var(--md-sys-typescale-home-hero-line-height);
  font-variation-settings: "GRAD" var(--md-sys-typescale-home-hero-font-variation-GRAD), "opsz" var(--md-sys-typescale-home-hero-font-variation-opsz);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0 0 16px;
}

.primary-container .wrapper .title .description {
  font-family: var(--md-sys-typescale-home-desc-font-family);
  font-size: var(--md-sys-typescale-home-desc-font-size);
  font-weight: var(--md-sys-typescale-home-desc-font-weight);
  letter-spacing: var(--md-sys-typescale-home-desc-letter-spacing);
  line-height: var(--md-sys-typescale-home-desc-line-height);
  font-variation-settings: "GRAD" var(--md-sys-typescale-home-desc-font-variation-GRAD), "opsz" var(--md-sys-typescale-home-desc-font-variation-opsz);
  color: var(--md-sys-color-on-surface-variant, #49454f);
}

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

@media screen and (max-width: 600px) {
  .mio-header {
    grid-template-columns: 1fr;
  }
  .primary-container {
    padding: 32px;
  }
  .primary-container .wrapper .title .description {
    font-weight: 425;
  }
  .split-asset-image__foreground {
    position: absolute;
    inset: 0;
  }
}

/* ================================================================
   content-container
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
   TOC
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
  font-family: var(--md-sys-typescale-label-s-font-family);
  font-size: var(--md-sys-typescale-label-s-font-size);
  font-weight: var(--md-sys-typescale-label-s-font-weight);
  letter-spacing: var(--md-sys-typescale-label-s-letter-spacing);
  line-height: var(--md-sys-typescale-label-s-line-height);
  font-variation-settings: "GRAD" var(--md-sys-typescale-label-s-font-variation-GRAD), "opsz" var(--md-sys-typescale-label-s-font-variation-opsz);
  color: var(--md-sys-color-on-surface-variant, #4d4256);
  margin: 0 16px 8px;
}

.toc__title {
  font-family: var(--md-sys-typescale-headline-s-font-family);
  font-size: var(--md-sys-typescale-headline-s-font-size);
  font-weight: 475;
  letter-spacing: var(--md-sys-typescale-headline-s-letter-spacing);
  line-height: var(--md-sys-typescale-headline-s-line-height);
  font-variation-settings: "GRAD" var(--md-sys-typescale-headline-s-font-variation-GRAD), "opsz" var(--md-sys-typescale-headline-s-font-variation-opsz);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0 16px 8px;
}

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
  font-family: var(--md-sys-typescale-body-m-font-family);
  font-size: var(--md-sys-typescale-body-m-font-size);
  font-weight: var(--md-sys-typescale-body-m-font-weight);
  letter-spacing: var(--md-sys-typescale-body-m-letter-spacing);
  line-height: var(--md-sys-typescale-body-m-line-height);
  font-variation-settings: "GRAD" var(--md-sys-typescale-body-m-font-variation-GRAD), "opsz" var(--md-sys-typescale-body-m-font-variation-opsz);
  color: var(--md-sys-color-on-surface-variant, #49454f);
  text-decoration: none;
  border-radius: 4px;
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
   posts-container
   ================================================================ */
.posts-container {
  flex: 1 1 auto;
  min-width: 0;
}

.toc--placeholder {
  visibility: hidden;
}

.toc--fade-in {
  animation: toc-fade-in 200ms linear forwards;
}

@keyframes toc-fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.skeleton-heading {
  display: inline-block;
  height: 28px;
  vertical-align: middle;
  border-radius: 8px;
}

.sub-heading .skeleton-heading {
  height: 24px;
}

.posts-inner {
  transition: opacity 200ms linear, transform 200ms linear;
}

.posts-inner--skeleton {
  opacity: 1;
  transform: translateY(0);
}

.posts-inner--loaded {
  animation: posts-fade-in 200ms linear forwards;
}

@keyframes posts-fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ================================================================
   section
   ================================================================ */
.section {
  margin: 72px 0 96px;
}

.section-header {
  margin: 24px;
}

.section-header h2 {
  font-family: var(--md-sys-typescale-display-l-font-family);
  font-size: var(--md-sys-typescale-display-l-font-size);
  font-weight: var(--md-sys-typescale-display-l-font-weight);
  letter-spacing: var(--md-sys-typescale-display-l-letter-spacing);
  line-height: var(--md-sys-typescale-display-l-line-height);
  font-variation-settings: "GRAD" var(--md-sys-typescale-display-l-font-variation-GRAD), "opsz" var(--md-sys-typescale-display-l-font-variation-opsz);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0 0 8px;
}

.section-header h2.sub-heading {
  font-family: var(--md-sys-typescale-headline-m-font-family);
  font-size: var(--md-sys-typescale-headline-m-font-size);
  font-weight: var(--md-sys-typescale-headline-m-font-weight);
  letter-spacing: var(--md-sys-typescale-headline-m-letter-spacing);
  line-height: var(--md-sys-typescale-headline-m-line-height);
  font-variation-settings: "GRAD" var(--md-sys-typescale-headline-m-font-variation-GRAD), "opsz" var(--md-sys-typescale-headline-m-font-variation-opsz);
  margin: 48px 0 8px;
}

/* ================================================================
   card-set
   ================================================================ */
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
   卡片通用 — thumbnail
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

.thumbnail:hover,
.thumbnail:focus,
.thumbnail:active {
  background-color: var(--md-sys-color-secondary-container, #e8def8);
}

.feature-card.thumbnail:hover,
.feature-card.thumbnail:focus,
.feature-card.thumbnail:active,
.regular-card.thumbnail:hover,
.regular-card.thumbnail:focus,
.regular-card.thumbnail:active {
  background-color: var(--md-sys-color-secondary-container, #e8def8);
}

.thumbnail:focus {
  border-radius: 48px;
  outline: 2px solid var(--md-sys-color-on-surface, #1c1b1f);
  outline-offset: 1px;
}

.feature-card.thumbnail:focus,
.regular-card.thumbnail:focus {
  border-radius: 48px;
  outline: 2px solid var(--md-sys-color-on-surface, #1c1b1f);
  outline-offset: 1px;
}

.thumbnail:active {
  border-radius: 48px;
  outline: initial;
}

.feature-card.thumbnail:active,
.regular-card.thumbnail:active {
  border-radius: 48px;
  outline: initial;
}

.thumbnail > .ripple {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 50%;
  pointer-events: none;
  display: none;
  z-index: 0;
  transform-origin: center center;
  filter: blur(4px);
}

/* ================================================================
   content-container（卡片内部）
   ================================================================ */
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
  font-family: var(--md-sys-typescale-body-l-font-family);
  font-size: var(--md-sys-typescale-body-l-font-size);
  font-weight: var(--md-sys-typescale-body-l-font-weight);
  letter-spacing: var(--md-sys-typescale-body-l-letter-spacing);
  line-height: var(--md-sys-typescale-body-l-line-height);
  font-variation-settings: "GRAD" var(--md-sys-typescale-body-l-font-variation-GRAD), "opsz" var(--md-sys-typescale-body-l-font-variation-opsz);
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
  font-family: var(--md-sys-typescale-headline-s-font-family);
  font-size: var(--md-sys-typescale-headline-s-font-size);
  font-weight: 475;
  letter-spacing: var(--md-sys-typescale-headline-s-letter-spacing);
  line-height: var(--md-sys-typescale-headline-s-line-height);
  font-variation-settings: "GRAD" var(--md-sys-typescale-headline-s-font-variation-GRAD), "opsz" var(--md-sys-typescale-headline-s-font-variation-opsz);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0;
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
  font-family: var(--md-sys-typescale-body-l-font-family);
  font-size: var(--md-sys-typescale-body-l-font-size);
  font-weight: var(--md-sys-typescale-body-l-font-weight);
  letter-spacing: var(--md-sys-typescale-body-l-letter-spacing);
  line-height: var(--md-sys-typescale-body-l-line-height);
  font-variation-settings: "GRAD" var(--md-sys-typescale-body-l-font-variation-GRAD), "opsz" var(--md-sys-typescale-body-l-font-variation-opsz);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0;
}

.regular-card.thumbnail > .content-container .description {
  display: block;
  overflow: visible;
}

/* ================================================================
   thumb-container
   ================================================================ */
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

/* ================================================================
   feature-block 长卡
   ================================================================ */
.feature-card.thumbnail {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-auto-flow: column;
  align-items: center;
  background-color: var(--md-sys-color-surface-container-low, #f8f1f6);
}

.feature-card.thumbnail > .content-container {
  align-self: center;
  width: calc(100% - 48px);
  overflow: hidden;
}

.feature-card.thumbnail > .thumb-container {
  min-height: 298px;
  order: -1;
}

@media screen and (max-width: 600px) {
  .feature-card.thumbnail {
    display: inline-flex;
    flex-direction: column-reverse;
  }
  .feature-card.thumbnail > .thumb-container {
    min-height: 200px;
    order: 0;
  }
}

/* ================================================================
   regular-card 中卡
   ================================================================ */
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
  .feature-card.thumbnail > .thumb-container {
    min-height: 200px;
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

:global([data-theme="dark"] .thumbnail:hover),
:global([data-theme="dark"] .thumbnail:focus),
:global([data-theme="dark"] .thumbnail:active),
:global([data-theme="dark"] .feature-card.thumbnail:hover),
:global([data-theme="dark"] .feature-card.thumbnail:focus),
:global([data-theme="dark"] .feature-card.thumbnail:active),
:global([data-theme="dark"] .regular-card.thumbnail:hover),
:global([data-theme="dark"] .regular-card.thumbnail:focus),
:global([data-theme="dark"] .regular-card.thumbnail:active) {
  background-color: var(--md-sys-color-secondary-container, #4a4458);
}

:global([data-theme="dark"] .thumbnail:focus),
:global([data-theme="dark"] .feature-card.thumbnail:focus),
:global([data-theme="dark"] .regular-card.thumbnail:focus) {
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
</style>
