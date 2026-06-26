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
      <!-- TOC 目录（对照 m3: mio-toc > nav, sticky, 156px宽, indicator border-only） -->
      <aside class="toc">
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
        <!-- 每个 section（对照 m3: div.section, margin 72px/96px top/bottom） -->
        <div
          v-for="(section, si) in sections"
          :key="si"
          :id="'section-' + si"
          :data-section-index="si"
          class="section"
        >
          <!-- section-header（对照 m3: div.section-header, margin 24px） -->
          <div class="section-header">
            <h2 :class="section.headingLevel === 'section-header' ? '' : 'sub-heading'">{{ section.label }}</h2>
          </div>

          <!-- card-set（对照 m3: mio-card-set, grid, gap 8px） -->
          <div class="card-set">
            <!-- feature-block 长卡（对照 m3: mio-card.feature-block > a.thumbnail, grid 1fr 1fr） -->
            <a
              v-if="section.feature"
              :href="section.feature.route"
              class="feature-card thumbnail"
              @mousedown="onCardDown"
            >
              <div class="content-container">
                <span v-if="section.feature.date" class="date">{{ formatDate(section.feature.date) }}</span>
                <span class="mio-title-row">
                  <span class="title" :class="{ 'title--cjk': isCjk(section.feature.title) }">{{ section.feature.title }}</span>
                </span>
                <span class="description">{{ section.feature.excerpt }}</span>
              </div>
              <div class="thumb-container" :style="{ background: thumbBg }">
                <span class="material-symbols-rounded thumb-icon">{{ section.feature.icon || 'article' }}</span>
              </div>
            </a>

            <!-- 中卡片（对照 m3: mio-card > a.thumbnail, inline-flex column-reverse） -->
            <a
              v-for="post in section.items"
              :key="post.id"
              :href="post.route"
              class="regular-card thumbnail"
              @mousedown="onCardDown"
            >
              <div class="content-container">
                <span v-if="post.date" class="date">{{ formatDate(post.date) }}</span>
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
      </article>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { usePage } from '@/stores/blogStore'
import store from '@/stores/blogStore'

const pageApi = usePage('home')

const activeSection = ref(-1) // -1 = 无激活态（hide 状态）

// 动态指示器位置：存储每个 item 的 top 和 height（对照 m3: item 高度随文字长度 36/56px 动态变化）
const indicatorTop = ref(0)   // 指示器 top（相对于 nav）
const indicatorY = ref(0)     // translateY（当前激活 item 的相对偏移）
const indicatorH = ref(36)    // 指示器高度（匹配 item 高度）

// 从 blogStore 读取页面数据
const sections = computed(() => {
  const page = store.pages.home
  if (!page?.sections) return []
  return page.sections
})

// TOC 列表：只包含非 noJumplink 的 section（对照需求: section-header 中 noJumplink 的 h2 不进 TOC）
const tocSections = computed(() => {
  return sections.value.filter(s => !s.noJumplink)
})

// 页面标题和描述从 blogStore 读取
const pageTitle = computed(() => store.pages.home?.title || "Kernel's Blog")
const pageDescription = computed(() => store.pages.home?.description || '')

// 计算 indicator inline style
const indicatorStyle = computed(() => {
  return {
    transform: `translateY(${indicatorY.value}px)`,
    height: `${indicatorH.value}px`,
  }
})

// 更新指示器位置：读取激活 TOC item 的 DOM 位置
function updateIndicatorPosition(sectionIndex) {
  if (sectionIndex < 0) return
  const nav = document.querySelector('.toc nav')
  const tocItems = document.querySelectorAll('.toc__item')
  if (!nav || !tocItems.length) return

  // 找到该 sectionIndex 对应的 TOC item 索引
  const tocIdx = tocSections.value.findIndex(s => sections.value.indexOf(s) === sectionIndex)
  if (tocIdx < 0 || !tocItems[tocIdx]) return

  const navRect = nav.getBoundingClientRect()
  const itemRect = tocItems[tocIdx].getBoundingClientRect()

  indicatorY.value = Math.round(itemRect.top - navRect.top - indicatorTop.value)
  indicatorH.value = Math.round(itemRect.height)
}

// 滚动检测 — 对照 m3: IntersectionObserver rootMargin "0px 0px -50% 0px"
let observer = null
let scrollRoot = null

function setupScrollObserver() {
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

  // 初始检测：检查是否已有 section 在视口上半区
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

// 监听回到顶部时隐藏指示器
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

// Ripple: 对照 m3 mioripple 指令 — mousedown 创建 ripple DOM, mouseup 移除
// 每次点击创建全新 ripple 实例，避免长按取消后 class 残留导致下次失效
function onCardDown(e) {
  const card = e.currentTarget
  const rect = card.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  // 计算涟漪半径：从点击位置到卡片四角的最大距离
  const maxDist = Math.max(
    Math.hypot(x, y),
    Math.hypot(rect.width - x, y),
    Math.hypot(x, rect.height - y),
    Math.hypot(rect.width - x, rect.height - y)
  )
  const size = maxDist * 2

  // 创建 ripple DOM
  const ripple = document.createElement('div')
  ripple.className = 'ripple'
  // 复制 Vue scoped data-v- 属性，使 scoped CSS 规则能匹配动态创建的元素
  for (const attr of card.attributes) {
    if (attr.name.startsWith('data-v-')) {
      ripple.setAttribute(attr.name, '')
    }
  }
  ripple.style.width = size + 'px'
  ripple.style.height = size + 'px'
  ripple.style.left = (x - size / 2) + 'px'
  ripple.style.top = (y - size / 2) + 'px'
  card.appendChild(ripple)

  // 触发动画（下一帧添加 active class）
  requestAnimationFrame(() => {
    ripple.classList.add('ripple--active')
  })

  // 对照 m3: window mouseup 触发 deactivation
  const onUp = () => {
    window.removeEventListener('mouseup', onUp)
    ripple.classList.remove('ripple--active')
    ripple.classList.add('ripple--fade-out')
    // fade-out 动画结束后移除 DOM
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true })
    // 兜底：如果 animationend 未触发（如元素被移除），300ms 后强制清理
    setTimeout(() => { if (ripple.parentNode) ripple.remove() }, 500)
  }
  window.addEventListener('mouseup', onUp)
}

const thumbBg = 'var(--md-sys-color-secondary-container, #e8def8)'

// 日期格式化（对照 m3: "Jun 18, 2026"）
function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr // 不是合法日期则原样返回
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// 检测文本是否包含 CJK 中文字符（用于决定是否启用 font-weight 插值补偿）
// Noto Sans SC 的 GRAD 轴对 CJK 字形无视觉效果，需用 font-weight 补偿
// 纯英文标题只需 GRAD 轴（与 M3 官方一致）
function isCjk(text) {
  if (!text) return false
  return /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(text)
}

onMounted(() => {
  nextTick(() => {
    // 计算 indicator top 基准位置：取第一个 list-item 相对于 nav 的 top
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
  })
})

onBeforeUnmount(() => {
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
   grid repeat(2, minmax(0, 1fr)), gap 8px
   响应式断点: 1294px / 600px（与m3源码一致）
   左 primary-container + 右 split-asset-image
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
  font-size: 96px;
  font-weight: 475;
  line-height: 96px;
  letter-spacing: normal;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0 0 16px;
}

.primary-container .wrapper .title .description {
  font-size: 22px;
  font-weight: 400;
  line-height: 30px;
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

/* h1 字体响应式（对照 m3 源码变量系统） */
/* >1294px: hero 96px/475/96px（已在上方设置） */
/* 601px-1294px: display-l 57px/475/64px */
/* ≤600px: display-m 45px/475/52px */
@media screen and (min-width: 601px) and (max-width: 1294px) {
  .primary-container .wrapper .title h1 {
    font-size: 57px;
    font-weight: 475;
    line-height: 64px;
  }
  .primary-container .wrapper .title .description {
    font-size: 22px;
    line-height: 30px;
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
    font-weight: 475;
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
   content-container（对照 m3: div.content-container）
   flex row-reverse: TOC 在右, posts 在左
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
    TOC（对照 m3: mio-toc > nav）
    156px宽, margin 112px 24px 0, sticky top
    指示器: border-only (1px solid outline), translateY + height 动画, hide 状态 opacity:0
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
}

/* ====== 指示器（对照 m3: .indicator, border-only pill） ====== */
.toc__indicator {
  position: absolute;
  width: 156px;
  left: 0;
  /* top = overline + title 高度（动态计算，因标题可能换行） */
  top: v-bind(indicatorTop + 'px');
  border: 1px solid var(--md-sys-color-outline, #79747e);
  border-radius: 18px;
  background-color: rgba(0, 0, 0, 0);
  opacity: 1;
  z-index: -1;
  pointer-events: none;
  /* 对照 m3: transition transform 0.5s, opacity 0.2s, height 0.5s, cubic-bezier(0.2,0,0,1) */
  transition: transform 0.5s cubic-bezier(0.2, 0, 0, 1),
              opacity 0.2s cubic-bezier(0.2, 0, 0, 1),
              height 0.5s cubic-bezier(0.2, 0, 0, 1);
}

/* hide 状态：opacity: 0（对照 m3: .indicator.hide { opacity: 0 }） */
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
  /* 对照 m3: 高度动态 — 单行 36px, 换行 56px */
}

/* 对照 m3: hover — on-surface 8%, 灰色半透明态（非 primary 色） */
.toc__item:hover {
  background: color-mix(in srgb, var(--md-sys-color-on-surface, #1c1b1f) 8%, transparent);
}

/* 注意: m3 的 active item 没有背景色, 指示器用 border pill 代替 */

/* 对照 m3: .toc-item — body-m 字号 */
.toc__link {
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

/* 对照 m3: .toc-item.toc-item-selected — color on-secondary-container, GRAD 125 */
.toc__link--selected {
  color: var(--md-sys-color-on-secondary-container, #1d192b);
  font-variation-settings: "GRAD" 125;
}

/* 移动端隐藏 TOC */
@media screen and (max-width: 1294px) {
  .toc {
    display: none;
  }
  .content-container {
    flex-direction: column;
  }
}

/* ================================================================
   posts-container（对照 m3: article.posts-container）
   ================================================================ */
.posts-container {
  flex: 0 1 auto;
  min-width: 0;
}

/* ================================================================
   section（对照 m3: div.section）
   margin: 72px 0 96px (first), 96px 0 (others)
   ================================================================ */
.section {
  margin: 72px 0 96px;
}

/* ================================================================
   section-header（对照 m3: div.section-header, margin 24px）
   ================================================================ */
.section-header {
  margin: 24px;
}

.section-header h2 {
  font-size: 57px;
  font-weight: 475;
  line-height: 64px;
  letter-spacing: normal;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0 0 8px;
}

.section-header h2.sub-heading {
  font-size: 28px;
  font-weight: 475;
  line-height: 36px;
  margin: 48px 0 8px;
}

/* ================================================================
   card-set（对照 m3: mio-card-set, grid, gap 8px, margin 32px 0 0）
   ================================================================ */
/* card-set: ≤600px 单列，>600px 双列（对照 m3 断点 @600px） */
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
    卡片通用 — thumbnail 容器（对照 m3: a.thumbnail）
    border-radius 24px, bg surface-container-low, overflow hidden, position relative
    hover/focus/active: bg secondary-container（M3 官方统一）
    focus: border-radius 48px + outline 2px solid on-surface
    active: border-radius 48px + outline initial
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

/* feature-card / regular-card 同等 specificity */
.feature-card.thumbnail:hover,
.feature-card.thumbnail:focus,
.feature-card.thumbnail:active,
.regular-card.thumbnail:hover,
.regular-card.thumbnail:focus,
.regular-card.thumbnail:active {
  background-color: var(--md-sys-color-secondary-container, #e8def8);
}

/* M3 官方：focus 时圆角 48px + outline 2px solid on-surface + offset 1px */
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

/* M3 官方：active 时圆角 48px，outline 复位 */
.thumbnail:active {
  border-radius: 48px;
  outline: initial;
}

.feature-card.thumbnail:active,
.regular-card.thumbnail:active {
  border-radius: 48px;
  outline: initial;
}

/* ripple 涟漪动效（对照 m3 mioripple 指令：动态创建 DOM） */
/* z-index: 0 使 ripple 画在 content-container(2) 和 thumb-container(1) 下方 */
.thumbnail > .ripple {
  position: absolute;
  border-radius: 50%;
  background-color: var(--md-sys-color-on-secondary-container, #1d192b);
  opacity: 0;
  pointer-events: none;
  transform: scale(0);
  z-index: 0;
  /* 对照 m3: blur(4px) 使涟漪边缘柔和 */
  filter: blur(4px);
}

/* active: scale 从 0 展开到 1, opacity 0→0.12 */
.thumbnail > .ripple.ripple--active {
  animation: ripple-expand 0.4s cubic-bezier(0.2, 0, 0, 1) forwards;
}

/* fade-out: scale 保持 1, opacity 0.12→0 */
.thumbnail > .ripple.ripple--fade-out {
  animation: ripple-fade 0.3s cubic-bezier(0.2, 0, 0, 1) forwards;
}

@keyframes ripple-expand {
  0% {
    transform: scale(0);
    opacity: 0.12;
  }
  100% {
    transform: scale(1);
    opacity: 0.12;
  }
}

@keyframes ripple-fade {
  0% {
    opacity: 0.12;
  }
  100% {
    opacity: 0;
  }
}

/* ================================================================
   content-container（卡片内部，对照 m3: div.content-container）
   grid, gap 8px, margin 24px, position relative
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
  font-size: 24px;
  font-weight: 475;
  line-height: 32px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0;
  /* M3 官方格式：GRAD 轴 + opsz 光学尺寸轴 */
  font-variation-settings: "GRAD" 0, "opsz" 18;
  /* 可变字体：GRAD 轴 + font-weight（仅 CJK 标题）均支持平滑插值过渡 */
  transition: font-variation-settings 0.3s cubic-bezier(0.2, 0, 0, 1),
              font-weight 0.3s cubic-bezier(0.2, 0, 0, 1);
}

/* 对照 m3: a:hover .title { GRAD 50 } — 标题视觉加重（M3 官方值） */
/* 必须显式声明 font-weight: 475，否则 unset 会继承父元素 normal(400) 抵消 GRAD 效果 */
/* CJK 标题：GRAD 轴对中文无效，额外用 font-weight 插值补偿 */
.thumbnail:hover > .content-container .title {
  font-variation-settings: "GRAD" 50, "opsz" 18;
  font-weight: 475;
}
.thumbnail:hover > .content-container .title.title--cjk {
  font-weight: 525;
}

/* 对照 m3: a:active .title { GRAD -50 } — 标题视觉变细（M3 官方值） */
/* 必须显式声明 font-weight: 475，否则 unset 会继承父元素 normal(400) 抵消 GRAD 效果 */
/* CJK 标题：GRAD 轴对中文无效，额外用 font-weight 插值补偿 */
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
}

/* regular-card 的 description 无截断（m3 中 regular-card description 也是无 clamp） */
.regular-card.thumbnail > .content-container .description {
  display: block;
  overflow: visible;
}

/* ================================================================
   thumb-container（对照 m3: mio-thumbnail > .thumb-container）
   border-radius 24px, background-size cover, position relative, overflow hidden
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
    feature-block 长卡（对照 m3: mio-card.feature-block > a.thumbnail）
    grid 1fr 1fr, grid-auto-flow column, align-items center
    thumb order:-1 排左列, content 自然排右列
    移动端: inline-flex column-reverse
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

/* feature-card 窄屏：inline-flex column-reverse（对照 m3 @ ≤600px） */
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
    regular-card 中卡（对照 m3: mio-card > a.thumbnail）
    inline-flex column-reverse: 图片上 + 文字下
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

/* 移动端 thumb 高度缩小（对照 m3 @ ≤600px: thumb h 200px） */
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

/* M3 官方暗色：hover/focus/active 统一使用 secondary-container */
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
