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
      <aside v-else class="toc">
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
        <!-- 加载中：骨架屏（3 个默认 section 结构，匹配真实布局） -->
        <div v-if="showSkeleton" class="posts-inner posts-inner--skeleton">
          <div v-for="si in 3" :key="'sk-section-' + si" class="section">
            <div class="section-header">
              <h2 :class="si > 1 ? 'sub-heading' : ''"><span class="skeleton skeleton-heading" :style="si === 1 ? 'width:35%' : 'width:25%'"></span></h2>
            </div>
            <div class="card-set">
              <!-- feature 骨架屏（对照 feature-card.thumbnail: grid 1fr 1fr） -->
              <div v-if="si === 1" class="skeleton-feature-card">
                <div class="sk-content">
                  <span class="skeleton" style="height:16px;width:80px;"></span>
                  <span class="skeleton" style="height:24px;width:60%;"></span>
                  <span class="skeleton" style="height:16px;width:90%;"></span>
                </div>
                <div class="sk-thumb skeleton"></div>
              </div>
              <!-- regular 骨架屏（对照 regular-card.thumbnail: flex column-reverse） -->
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
        </div>
      </article>
    </div>

    <!-- ======== Footer ======== -->
    <MioFooter />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { getHomeSections, retryHomeSectionsFetch } from '@/services/articleService'
import MioFooter from '@/components/common/MioFooter.vue'

const activeSection = ref(-1) // -1 = 无激活态（hide 状态）

// ===== Section 数据：纯 API 驱动，骨架屏覆盖加载态 =====
const apiSections = ref(null)  // null = 尚未加载（显示骨架屏）; [] = 空结果
let cancelRetry = null

// 动态指示器位置：存储每个 item 的 top 和 height（对照 m3: item 高度随文字长度 36/56px 动态变化）
const indicatorTop = ref(0)   // 指示器 top（相对于 nav）
const indicatorY = ref(0)     // translateY（当前激活 item 的相对偏移）
const indicatorH = ref(36)    // 指示器高度（匹配 item 高度）

// 动态 sections：API 加载完成后才渲染真实数据，否则骨架屏
const sections = computed(() => {
  return apiSections.value || []
})

// 骨架屏显示：API 尚未返回数据时显示
const showSkeleton = computed(() => apiSections.value === null)

// TOC 列表：只包含非 noJumplink 的 section（对照需求: section-header 中 noJumplink 的 h2 不进 TOC）
const tocSections = computed(() => {
  return sections.value.filter(s => !s.noJumplink)
})

// 页面标题和描述
const pageTitle = computed(() => "Kernel's Blog")
const pageDescription = computed(() => '探索技术，记录生活。一个遵循 Material Design 3 规范的个人博客。')

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
  // 先清理旧的 observer
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

// 计算 indicator top 基准 + 设置 observer + 绑定 scroll 监听
function initTocInteraction() {
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

// Ripple: 严格对照 @material/web ripple/internal/ripple.ts 实现
// 核心原理：mousedown 创建 <div class="ripple">，Web Animations API 驱动 translate+scale
// 从点击位置 scale(1) 展开 → translate 到容器中心 + scale(N) 覆盖整个容器
// opacity: 0.12 → 0，单段动画，时长 450ms，M3 EASING.STANDARD 曲线
const RIPPLE_PRESS_GROW_MS = 450                         // @material/web PRESS_GROW_MS
const RIPPLE_OPACITY = 0.12                              // M3 spec: pressed state layer opacity
const RIPPLE_COLOR = '#001d35'                           // M3 官方硬编码色值
const RIPPLE_INITIAL_ORIGIN_SCALE = 0.2                  // @material/web INITIAL_ORIGIN_SCALE
const RIPPLE_PADDING = 10                                // @material/web PADDING
const RIPPLE_SOFT_EDGE_CONTAINER_RATIO = 0.35            // @material/web SOFT_EDGE_CONTAINER_RATIO
const RIPPLE_SOFT_EDGE_MINIMUM_SIZE = 75                 // @material/web SOFT_EDGE_MINIMUM_SIZE

function onCardDown(e) {
  const card = e.currentTarget

  // 复用或创建 ripple 元素（每个卡片只维护 1 个）
  let ripple = card.querySelector(':scope > .ripple')
  if (!ripple) {
    ripple = document.createElement('div')
    ripple.className = 'ripple'
    for (const attr of card.attributes) {
      if (attr.name.startsWith('data-v-')) ripple.setAttribute(attr.name, '')
    }
    card.appendChild(ripple)
  }

  // 取消上一次动画（若还在播放）
  const prevAnim = ripple.getAnimations()
  prevAnim.forEach(a => a.cancel())

  const rect = card.getBoundingClientRect()
  const containerW = rect.width
  const containerH = rect.height

  // determineRippleSize：严格对照 @material/web ripple.ts
  const maxDim = Math.max(containerW, containerH)
  const softEdgeSize = Math.max(
    RIPPLE_SOFT_EDGE_CONTAINER_RATIO * maxDim,
    RIPPLE_SOFT_EDGE_MINIMUM_SIZE
  )
  const initialSize = Math.floor(maxDim * RIPPLE_INITIAL_ORIGIN_SCALE)
  const hypotenuse = Math.sqrt(containerW ** 2 + containerH ** 2)
  const maxRadius = hypotenuse + RIPPLE_PADDING
  const rippleScale = (maxRadius + softEdgeSize) / initialSize

  // 点击位置（相对于视口），若键盘触发则居中
  const clickX = e.clientX ?? (rect.left + containerW / 2)
  const clickY = e.clientY ?? (rect.top + containerH / 2)

  // 起点变换：ripple 圆心对齐点击位置
  const startX = clickX - rect.left - initialSize / 2
  const startY = clickY - rect.top - initialSize / 2
  const startTransform = `translate(${startX}px, ${startY}px) scale(1)`

  // 终点变换：ripple 圆心移至容器中心，scale 覆盖整个容器
  const endX = (containerW - initialSize) / 2
  const endY = (containerH - initialSize) / 2
  const endTransform = `translate(${endX}px, ${endY}px) scale(${rippleScale})`

  // Web Animations API：单段动画，opacity 0.12→0，同时 translate+scale
  const anim = ripple.animate([
    {
      display: 'block',
      opacity: RIPPLE_OPACITY,
      width: `${initialSize}px`,
      height: `${initialSize}px`,
      background: RIPPLE_COLOR,
      transform: startTransform
    },
    {
      opacity: 0,
      transform: endTransform
    }
  ], {
    duration: RIPPLE_PRESS_GROW_MS,
    easing: 'cubic-bezier(0.2, 0, 0, 1)',   // @material/web EASING.STANDARD
    fill: 'forwards'
  })

  anim.onfinish = () => {
    // 动画完成后重置（不删除 DOM，下次复用）
    ripple.style.display = 'none'
  }
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
  // 加载 HomeSection 配置（包含关联的文章卡片数据）
  getHomeSections().then(sections => {
    if (sections && sections.length > 0) {
      apiSections.value = sections
    } else {
      // API 不可用，启动后台重试（覆盖 Render 冷启动场景）
      cancelRetry = retryHomeSectionsFetch(sections => {
        if (sections && sections.length > 0) {
          apiSections.value = sections
        }
      })
    }
  })
})

// 监听 apiSections 变化：API 数据到达后，等 DOM 更新再初始化 TOC 交互
watch(apiSections, (newVal) => {
  if (newVal && newVal.length > 0) {
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

/* h1 字体响应式现已由 :root home-hero/home-desc token 断点自动处理 */
@media screen and (min-width: 601px) and (max-width: 1294px) {
  /* tablet: home-hero → display-l, home-desc → title-l (均由 token 处理) */
}

@media screen and (max-width: 600px) {
  .mio-header {
    grid-template-columns: 1fr;
  }
  .primary-container {
    padding: 32px;
  }
  /* mobile: home-hero → display-m, home-desc → body-l + font-weight: 425 for CJK 偏好 */
  .primary-container .wrapper .title .description {
    font-weight: 425;
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
  flex: 1 1 auto;
  min-width: 0;
}

/* TOC 占位：骨架屏时预留同尺寸空间，防止加载后 layout shift */
.toc--placeholder {
  visibility: hidden;
}

/* 骨架屏标题动画条 */
.skeleton-heading {
  display: inline-block;
  height: 28px;
  vertical-align: middle;
  border-radius: 8px;
}

.sub-heading .skeleton-heading {
  height: 24px;
}

/* fade 过渡：骨架屏→真实内容 */
.posts-inner {
  transition: opacity 200ms linear, transform 200ms linear;
}

.posts-inner--skeleton {
  /* 骨架屏正常显示 */
  opacity: 1;
  transform: translateY(0);
}

.posts-inner--loaded {
  /* 真实内容淡入：M3 官方 fadeIn 动画（opacity 0→1 + translateY 10px→0, 200ms） */
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

/* ripple 涟漪动效（严格对照 @material/web ripple/internal/ripple.ts + M3 官方 .ripple CSS）
   Web Animations API 控制 translate+scale，单段动画 opacity 0.12→0
   初试尺寸 = maxDim × 20%，从点击位置 scale(1) 展开到容器中心 scale(N)
   z-index: 0 使 ripple 画在 content-container(2) 和 thumb-container(1) 下方 */
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
  font-family: var(--md-sys-typescale-body-l-font-family);
  font-size: var(--md-sys-typescale-body-l-font-size);
  font-weight: var(--md-sys-typescale-body-l-font-weight);
  letter-spacing: var(--md-sys-typescale-body-l-letter-spacing);
  line-height: var(--md-sys-typescale-body-l-line-height);
  font-variation-settings: "GRAD" var(--md-sys-typescale-body-l-font-variation-GRAD), "opsz" var(--md-sys-typescale-body-l-font-variation-opsz);
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
