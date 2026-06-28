<template>
  <div class="blog-article-view">
    <!-- 单根包裹：避免 Fragment 导致 <Transition mode="out-in"> 无法正确检测离开动画结束 -->
    <div class="editorial article-fadein" v-if="article">
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
      <!-- TOC 目录（桌面端：右侧 sticky 侧栏；移动端：inline 显示在 article 上方） -->
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

    <!-- ======== Footer ======== -->
    <MioFooter />
  </div>

  <!-- ======== Back to top（对照 M3: .back-to-top，<=1294px 可见）
       使用 Teleport 传送到 body，避免被 .editorial 的 transform 吞掉 fixed 定位 ======== -->
  <Teleport to="body">
    <div
      class="back-to-top"
      :class="{ 'back-to-top--show': showBackToTop }"
      role="button"
      aria-label="go back to top"
      tabindex="0"
      @click="scrollToTop"
      @keydown.enter="scrollToTop"
    >
      <div class="back-to-top__state-overlay"></div>
      <span class="material-symbols-rounded">vertical_align_top</span>
    </div>
  </Teleport>

  <!-- ======== 缓冲进度条（加载中显示，加载完成后 fade 消失） ======== -->
  <md-linear-progress
    v-if="loadingActive"
    :class="{ 'loading-progress--fading': loadingFading }"
    class="loading-progress"
    :value="progressValue"
    :buffer="progressBuffer"
  ></md-linear-progress>

  <!-- ======== 骨架屏（文章加载中 — 整页切换，非逐段消失） ======== -->
  <div class="editorial" v-if="!article">
    <div class="content-container no-toc">
      <article class="blog-section">
        <div class="authors">
          <p class="overline skeleton" style="height:14px;width:80px;"></p>
          <div class="byline">
            <div class="skeleton" style="width:40px;height:40px;border-radius:50%;"></div>
            <div class="author-info">
              <span class="skeleton" style="display:block;height:14px;width:90px;margin-bottom:6px;"></span>
              <span class="skeleton" style="display:block;height:14px;width:60px;"></span>
            </div>
          </div>
        </div>
        <hr class="separator" />
        <div class="blog-content skeleton-article">
          <div class="skeleton-block">
            <div class="skeleton skeleton-heading"></div>
            <div class="skeleton skeleton-paragraph" style="width:95%;"></div>
            <div class="skeleton skeleton-paragraph" style="width:85%;"></div>
            <div class="skeleton skeleton-paragraph" style="width:70%;"></div>
            <div class="skeleton skeleton-code"></div>
            <div class="skeleton skeleton-paragraph" style="width:90%;"></div>
            <div class="skeleton skeleton-paragraph" style="width:60%;"></div>
          </div>
          <div class="skeleton-block">
            <div class="skeleton skeleton-heading"></div>
            <div class="skeleton skeleton-paragraph" style="width:95%;"></div>
            <div class="skeleton skeleton-paragraph" style="width:80%;"></div>
            <div class="skeleton skeleton-code"></div>
            <div class="skeleton skeleton-paragraph" style="width:85%;"></div>
            <div class="skeleton skeleton-paragraph" style="width:75%;"></div>
          </div>
          <div class="skeleton-block">
            <div class="skeleton skeleton-heading"></div>
            <div class="skeleton skeleton-paragraph" style="width:90%;"></div>
            <div class="skeleton skeleton-paragraph" style="width:95%;"></div>
            <div class="skeleton skeleton-paragraph" style="width:50%;"></div>
          </div>
        </div>
      </article>
    </div>
    <MioFooter />
  </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getArticle, getArticleIndex, retryArticleFetch, retryArticleIndexFetch, getResolvedSource } from '@/services/articleService'
import MioFooter from '@/components/common/MioFooter.vue'

const route = useRoute()

// ======== 文章数据 ========
// 统一通过 articleService 异步获取：
//   - auto 模式：优先 API，不可达时回退本地
//   - local 模式：直接本地
//   - api 模式：仅 API
// 加载中 article=null → 显示骨架屏

const article = ref(null)
const articleList = ref({})  // 用于 Up Next
const resolvedSource = ref('local')

// ======== 缓冲进度条状态 ========
const loadingActive = ref(false)   // 进度条是否可见
const loadingFading = ref(false)   // 正在 fade 消失
const progressValue = ref(0)       // 已确认进度
const progressBuffer = ref(0.2)    // 预期缓冲进度

// 进度条时间驱动推进器
let progressTimer = null

/**
 * 启动进度条时间推进
 * 每轮重试期间，按时间缓慢推进 progressValue（多段递进曲线），
 * buffer 始终领先 value 一段距离，减少访客等待焦虑。
 *
 * 递进曲线设计（每段递减增速，避免线性拖沓感）：
 *   0%   → 15%  快速起步（0~2s）
 *   15%  → 40%  中速推进（2~8s）
 *   40%  → 65%  减速缓行（8~20s）
 *   65%  → 85%  逐渐停滞（20~45s）
 *   85%+        几乎不再推进（等待最终结果）
 */
function startProgressAnimation(startValue = 0, startBuffer = 0.2) {
  stopProgressAnimation()
  progressValue.value = startValue
  progressBuffer.value = startBuffer
  loadingActive.value = true
  loadingFading.value = false

  const TICK_MS = 500  // 每 500ms 推进一步
  progressTimer = setInterval(() => {
    const v = progressValue.value
    const b = progressBuffer.value
    // 多段递进：根据当前进度选择增量
    let dv, db
    if (v < 0.15)      { dv = 0.025; db = 0.035 }  // 快速起步
    else if (v < 0.40) { dv = 0.012; db = 0.020 }  // 中速推进
    else if (v < 0.65) { dv = 0.006; db = 0.012 }  // 减速缓行
    else if (v < 0.85) { dv = 0.002; db = 0.006 }  // 逐渐停滞
    else               { dv = 0.0005; db = 0.002 } // 几乎不动

    progressValue.value = Math.min(v + dv, 0.95)
    progressBuffer.value = Math.min(b + db, 0.98)
  }, TICK_MS)
}

/** 停止进度条推进器 */
function stopProgressAnimation() {
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
}

/**
 * 重试轮次开始时，跳进进度条（给用户"又过了一关"的感觉）
 * buffer 先跳，value 跟随滞后
 */
function onRetryAttempt(attempt) {
  const maxAttempts = 5
  // value 跳到当前轮次对应的基础位，但不超过 85%
  const jumpedValue = Math.min(0.10 + (attempt / maxAttempts) * 0.60, 0.85)
  // buffer 再多跳一步
  const jumpedBuffer = Math.min(jumpedValue + 0.15, 0.95)
  // 只往上跳，不回退
  if (jumpedValue > progressValue.value) progressValue.value = jumpedValue
  if (jumpedBuffer > progressBuffer.value) progressBuffer.value = jumpedBuffer
}

// 异步加载文章列表（用于 Up Next）
let cancelListRetry = null

async function loadArticleList() {
  try {
    const index = await getArticleIndex()
    if (index.articles && Object.keys(index.articles).length > 0) {
      articleList.value = index.articles
      resolvedSource.value = index.source
    }
    // 如果源是 local（API 暂不可达），启动后台重试
    if (index.source === 'local') {
      if (cancelListRetry) cancelListRetry()
      cancelListRetry = retryArticleIndexFetch((apiIndex) => {
        articleList.value = apiIndex.articles
        resolvedSource.value = apiIndex.source
      })
    }
  } catch {
    // 保持空数据，骨架屏继续显示
  }
}

// 异步加载当前文章
let cancelArticleRetry = null

async function resolveArticle(slug) {
  // 重置进度条并启动时间推进
  stopProgressAnimation()
  startProgressAnimation(0, 0.2)

  // 取消之前的重试
  if (cancelArticleRetry) {
    cancelArticleRetry()
    cancelArticleRetry = null
  }

  try {
    const data = await getArticle(slug)
    if (data) {
      article.value = data
      // 加载成功 → fade 进度条
      fadeOutProgress()

      // 如果返回的是本地文章（API 暂不可达），启动后台重试
      const resolved = await getResolvedSource()
      if (resolved === 'local') {
        // 重新显示进度条（后台正在尝试 API）
        startProgressAnimation(0.15, 0.35)
        cancelArticleRetry = retryArticleFetch(
          slug,
          (apiArticle) => {
            // 重试成功：静默更新文章数据
            article.value = apiArticle
            resolvedSource.value = 'api'
            fadeOutProgress()
          },
          ({ attempt }) => onRetryAttempt(attempt),
          () => {
            // 所有重试耗尽（有本地文章兜底）
            fadeOutProgress()
          }
        )
      }
    } else {
      // getArticle 返回 null — 无本地降级的纯 API 文章
      // 进度条继续推进，启动后台重试
      cancelArticleRetry = retryArticleFetch(
        slug,
        (apiArticle) => {
          article.value = apiArticle
          resolvedSource.value = 'api'
          fadeOutProgress()
        },
        ({ attempt }) => onRetryAttempt(attempt),
        () => {
          // 所有重试耗尽，进度条保持显示
          stopProgressAnimation()
          progressValue.value = progressBuffer.value
        }
      )
    }
  } catch {
    // getArticle 本身异常，进度条保持显示
    stopProgressAnimation()
    progressValue.value = progressBuffer.value
  }
  // TOC 通过 watch(article) 自动重建
}

/**
 * 进度条 fade 消失
 * 先添加 fade class → CSS 过渡完成后再移除元素
 */
function fadeOutProgress() {
  stopProgressAnimation()
  loadingFading.value = true
  setTimeout(() => {
    loadingActive.value = false
    loadingFading.value = false
  }, 400)  // 与 CSS transition 时长一致
}

// 初始解析
resolveArticle(route.params.slug)
loadArticleList()

// 路由变化时重新解析
watch(() => route.params.slug, (slug) => {
  if (slug) resolveArticle(slug)
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

// Up Next 数据 — 使用 articleList（可能是 API 数据或本地数据）
const upNextArticles = computed(() => {
  const currentSlug = route.params.slug
  return Object.values(articleList.value)
    .filter(a => a.slug !== currentSlug)
    .slice(0, 2)
})

// 卡片涟漪动效（严格对照 @material/web ripple/internal/ripple.ts 实现）
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

  const clickX = e.clientX ?? (rect.left + containerW / 2)
  const clickY = e.clientY ?? (rect.top + containerH / 2)

  // 起点变换：ripple 圆心对齐点击位置
  const startX = clickX - rect.left - initialSize / 2
  const startY = clickY - rect.top - initialSize / 2
  const startTransform = `translate(${startX}px, ${startY}px) scale(1)`

  // 终点变换：移至容器中心 + scale 覆盖
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
    ripple.style.display = 'none'
  }
}

const thumbBg = 'var(--md-sys-color-secondary-container, #e8def8)'

// ======== Back-to-top 按钮（对照 M3: .back-to-top） ========
// 仅在 tablet（601-1293px）显示，桌面和移动端均 display:none
const showBackToTop = ref(false)
let backToTopScrollHandler = null

function scrollToTop() {
  // 对照 M3 官方：back-to-top 滚动到 TOC 区域，而非页面顶端
  const sr = document.querySelector('main.app-main')
  if (!sr) return
  // 移动端（<=1294px）TOC 是 inline，滚动到 .toc 顶部即可看到
  // 桌面端（>=1295px）不会显示 back-to-top 按钮（display:none）
  const tocEl = document.querySelector('.editorial .toc')
  if (tocEl) {
    tocEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } else {
    sr.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function setupBackToTopObserver() {
  const sr = document.querySelector('main.app-main')
  if (!sr) return

  // 对照 M3 官方：displayBackToTop = mio-compile-component.getBoundingClientRect().y < 0
  // 即文章正文区域（.blog-content）顶部滚出视口上方时才显示按钮
  backToTopScrollHandler = () => {
    // 文章未加载完成（骨架屏状态）时不触发
    if (!article.value) { showBackToTop.value = false; return }
    const w = window.innerWidth
    if (w >= 601 && w <= 1293) {
      const blogContent = document.querySelector('.blog-content')
      showBackToTop.value = blogContent ? blogContent.getBoundingClientRect().y < 0 : false
    } else {
      showBackToTop.value = false
    }
  }
  sr.addEventListener('scroll', backToTopScrollHandler, { passive: true })
}

function teardownBackToTopObserver() {
  if (backToTopScrollHandler) {
    const sr = document.querySelector('main.app-main')
    if (sr) sr.removeEventListener('scroll', backToTopScrollHandler)
    backToTopScrollHandler = null
  }
}

function isCjk(text) {
  if (!text) return false
  return /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(text)
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

// ======== v-html 内容的 copy link 事件委托 ========
// 本地组件（如 KernelsBlogContent.vue）在自己的 script 中通过事件委托处理 click，
// 但 v-html 内容是纯 HTML，没有 Vue 事件绑定，需要在 BlogArticleView 层面统一委托。
function handleVHtmlClick(e) {
  const btn = e.target.closest('.copy-button')
  if (!btn) return
  const block = btn.closest('.block')
  if (!block) return
  const id = block.id
  if (!id) return

  const url = window.location.origin + window.location.pathname + '#' + id
  navigator.clipboard.writeText(url).catch(() => {})

  btn.classList.add('activated')
  setTimeout(() => {
    btn.classList.remove('activated')
  }, 2000)
}

// v-html 内容中 ul li 的随机旋转（与本地组件 onMounted 逻辑一致）
function applyBulletRotations() {
  if (!blogContentRef.value) return
  blogContentRef.value.querySelectorAll('ul > li').forEach(li => {
    li.style.setProperty('--rotation', String(Math.floor(Math.random() * 10)))
  })
}

// 绑定 v-html 内容的 copy link 事件委托
// 注意：本地组件自己绑定了 handleClick（通过 .article-content 容器），
// 我们只在 blogContentRef 上监听，不会与本地组件冲突（因为本地组件的容器是 .article-content，
// 而 v-html 的 div 是 blogContentRef 的直接子元素）
function bindVHtmlEvents() {
  if (!blogContentRef.value) return
  // 避免重复绑定
  blogContentRef.value.removeEventListener('click', handleVHtmlClick)
  blogContentRef.value.addEventListener('click', handleVHtmlClick)
}

onMounted(() => {
  // 计算 indicator top 基准位置
  recalcIndicatorTop()
  // 设置 back-to-top 滚动监听
  setupBackToTopObserver()
})

// 当文章数据变化时，设置 MutationObserver 等 DOM 就绪后构建 TOC
watch(article, (val) => {
  if (!val) return
  tocItems.value = []
  activeTocIndex.value = -1
  if (contentMutationObserver) contentMutationObserver.disconnect()

  nextTick(() => {
    if (!blogContentRef.value) return

    // 尝试立即构建 TOC（v-html 内容在 nextTick 后已就绪）
    const built = buildToc()
    if (built) {
      setupScrollObserver()
      nextTick(recalcIndicatorTop)
      // 为 v-html 内容绑定 copy link 事件委托
      bindVHtmlEvents()
      applyBulletRotations()
      // 处理 URL hash 跳转（copy link 场景）
      handleHashNavigation()
      return
    }

    // 对于 contentComponent（异步组件），需要 MutationObserver 等待 DOM 变化
    contentMutationObserver = new MutationObserver(() => {
      const built = buildToc()
      if (built) {
        setupScrollObserver()
        contentMutationObserver?.disconnect()
        nextTick(recalcIndicatorTop)
        // 异步组件也需要绑定事件
        bindVHtmlEvents()
        applyBulletRotations()
        // 处理 URL hash 跳转
        handleHashNavigation()
      }
    })
    contentMutationObserver.observe(blogContentRef.value, { childList: true, subtree: true })
  })
}, { immediate: true })

/**
 * 处理 URL hash 跳转
 * 从 copy link 访问带 #fragment 的 URL 时，文章尚未加载无法跳转，
 * 此函数在文章 DOM 就绪后补做跳转。
 */
function handleHashNavigation() {
  const hash = route.hash
  if (!hash) return
  const id = hash.substring(1)  // 去掉 #
  if (!id) return
  // 使用 scrollToHeading 实现一致的滚动行为
  nextTick(() => {
    scrollToHeading(id)
  })
}

onUnmounted(() => {
  if (observer) observer.disconnect()
  if (contentMutationObserver) contentMutationObserver.disconnect()
  if (cancelArticleRetry) cancelArticleRetry()
  if (cancelListRetry) cancelListRetry()
  stopProgressAnimation()
  teardownBackToTopObserver()
  // 清理 v-html 事件委托
  if (blogContentRef.value) {
    blogContentRef.value.removeEventListener('click', handleVHtmlClick)
  }
})

watch(() => route.params.slug, () => {
  // 同组件路由切换时滚动到顶部（滚动容器是 main.app-main，不是 window）
  // 如果 URL 包含 hash，则不滚动顶部，由 handleHashNavigation 处理跳转
  if (!route.hash) {
    const main = document.querySelector('main.app-main')
    if (main) main.scrollTo({ top: 0, behavior: 'instant' })
  }
  // TOC 将通过 watch(article) 重新构建
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

/* 文章页 date 行 — 与 description 使用同一 token（响应式自动切换） */
.date {
  font-family: var(--md-sys-typescale-article-desc-font-family);
  font-size: var(--md-sys-typescale-article-desc-font-size);
  font-weight: var(--md-sys-typescale-article-desc-font-weight);
  line-height: var(--md-sys-typescale-article-desc-line-height);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0 0 16px;
  display: block;
}

/* 文章页 h1: hero title，响应式由 :root --md-sys-typescale-article-hero-* 控制 */
.primary-container .wrapper .title h1 {
  font-family: var(--md-sys-typescale-article-hero-font-family);
  font-size: var(--md-sys-typescale-article-hero-font-size);
  font-weight: var(--md-sys-typescale-article-hero-font-weight);
  line-height: var(--md-sys-typescale-article-hero-line-height);
  letter-spacing: var(--md-sys-typescale-article-hero-letter-spacing);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0 0 8px;
  font-variation-settings: "GRAD" var(--md-sys-typescale-article-hero-font-variation-GRAD), "opsz" var(--md-sys-typescale-article-hero-font-variation-opsz);
}

/* 文章页 description，响应式由 :root --md-sys-typescale-article-desc-* 控制 */
.primary-container .wrapper .title .description {
  font-family: var(--md-sys-typescale-article-desc-font-family);
  font-size: var(--md-sys-typescale-article-desc-font-size);
  font-weight: var(--md-sys-typescale-article-desc-font-weight);
  line-height: var(--md-sys-typescale-article-desc-line-height);
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

/* ── 601-1294px: h1/desc 响应式由 :root 变量自动切换，此处仅处理布局调整 ── */
@media screen and (min-width: 601px) and (max-width: 1294px) {
  .primary-container .wrapper .date {
    font-size: var(--md-sys-typescale-article-desc-font-size);
    font-weight: var(--md-sys-typescale-article-desc-font-weight);
    line-height: var(--md-sys-typescale-article-desc-line-height);
  }
}

/* ── ≤600px: h1/desc 响应式由 :root 变量自动切换，此处仅处理布局调整 ── */
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
  .primary-container .wrapper .date {
    font-size: var(--md-sys-typescale-article-desc-font-size);
    font-weight: var(--md-sys-typescale-article-desc-font-weight);
    line-height: var(--md-sys-typescale-article-desc-line-height);
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
  /* TOC 从右侧 sticky 侧栏切换为 inline 模式（对照 M3: <=1294px nav inline） */
  .toc {
    flex: 1 1 100%;
    width: 100%;
    margin: 0;
    max-width: none;
    order: -1;  /* 确保 TOC 在 article 上方 */
  }
  .toc nav {
    position: static;  /* 不再 sticky */
    margin: 64px 88px 0;
    max-width: 840px;
  }
  /* indicator 在移动端隐藏 */
  .toc__indicator {
    opacity: 0;
    pointer-events: none;
  }
  /* title 在移动端隐藏 */
  .toc__title {
    display: none;
  }
  /* TOC items 变为 pill 样式（对照 M3: border-radius: 20px, width: fit-content） */
  .toc__item {
    width: fit-content;
    border-radius: 20px;
  }
  /* hover/active 仅桌面端 */
  .toc__item:hover {
    background: none;
  }
  /* 文字样式调整（对照 M3: title-m 16px/500, primary 色） */
  .toc__link {
    font-size: 16px;
    font-weight: 500;
    line-height: 24px;
    color: var(--md-sys-color-primary, #6750a4);
    letter-spacing: 0;
  }
  .toc__link--selected {
    color: var(--md-sys-color-on-secondary-container, #1d192b);
    font-weight: 500;
  }
  /* content-container 切换为 column 布局 */
  .content-container {
    flex-direction: column;
  }
}

@media screen and (max-width: 960px) {
  .toc nav {
    margin-left: 40px;
    margin-right: 40px;
  }
}

@media screen and (max-width: 600px) {
  .toc nav {
    margin-left: 24px;
    margin-right: 24px;
  }
  /* 移动端 TOC list 左侧紧凑，看起来更美观 */
  .toc__overline {
    margin-left: 0;
    margin-right: 0;
  }
  .toc__item {
    padding-left: 8px;
    padding-right: 12px;
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
   缓冲进度条（md-linear-progress）
   桌面端：右侧内容区顶端 full-width，不在 nav rail 区域
   移动端：top app bar 正下方 0 margin
   加载完成后 fade 消失
   ================================================================ */
.loading-progress {
  position: sticky;
  top: 0;
  z-index: 10;
  width: 100%;
  --md-linear-progress-active-indicator-color: var(--md-sys-color-primary, #6750a4);
  --md-linear-progress-track-color: var(--md-sys-color-surface-container-highest, #e6e0e9);
  transition: opacity 400ms ease-out;
}

.loading-progress--fading {
  opacity: 0;
}

/* ================================================================
   文章内容 fadeIn 进场动画
   对照 M3 ng-trigger-fadeIn: opacity 0→1 + translateY(10px→0)
   FADE_IN = 200ms delay + 200ms linear（与 App.vue page-fade 一致）
   ================================================================ */
@keyframes article-fadein-keyframes {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.article-fadein {
  animation: article-fadein-keyframes 200ms linear 200ms both;
}

/* ================================================================
   authors（M3 文章页专有）
   对照 m3: .authors + .overline "Posted by" + mio-byline
   ================================================================ */
.authors {
  margin: 80px 24px 0;
}

.authors .overline {
  font-family: var(--md-sys-typescale-label-s-font-family);
  font-size: var(--md-sys-typescale-label-s-font-size);
  font-weight: var(--md-sys-typescale-label-s-font-weight);
  line-height: var(--md-sys-typescale-label-s-line-height);
  letter-spacing: var(--md-sys-typescale-label-s-letter-spacing);
  font-variation-settings: "GRAD" var(--md-sys-typescale-label-s-font-variation-GRAD), "opsz" var(--md-sys-typescale-label-s-font-variation-opsz);
  color: var(--md-sys-color-on-surface-variant, #4d4256);
  margin: 0 0 16px;
}

.byline {
  display: flex;
  align-items: center;
  gap: 0;
  margin-top: 8px;
  font-family: var(--md-sys-typescale-article-body-font-family);
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
  font-family: var(--md-sys-typescale-title-m-font-family);
  font-size: var(--md-sys-typescale-title-m-font-size);
  font-weight: var(--md-sys-typescale-title-m-font-weight);
  line-height: var(--md-sys-typescale-title-m-line-height);
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

.author-role {
  font-size: var(--md-sys-typescale-article-body-font-size);
  font-weight: var(--md-sys-typescale-article-body-font-weight);
  line-height: var(--md-sys-typescale-article-body-line-height);
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

/* ================================================================
   blog-content（M3 文章页专有：文章排版）
   对照 m3: h2 45px/475/52px, p 16px/400/24px, on-surface
   ================================================================ */
.blog-content {
  font-family: var(--md-sys-typescale-article-body-font-family);
  padding: 0 24px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

.blog-content :deep(h2.linkable) {
  font-family: var(--md-sys-typescale-article-h2-font-family);
  font-size: var(--md-sys-typescale-article-h2-font-size);
  font-weight: var(--md-sys-typescale-article-h2-font-weight);
  line-height: var(--md-sys-typescale-article-h2-line-height);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0;
  font-variation-settings: "GRAD" var(--md-sys-typescale-article-h2-font-variation-GRAD), "opsz" var(--md-sys-typescale-article-h2-font-variation-opsz);
}

/* block 容器中 h2 的 margin 由 .block 控制，不在 h2 上 */

.blog-content :deep(h3) {
  font-family: var(--md-sys-typescale-article-h3-font-family);
  font-size: var(--md-sys-typescale-article-h3-font-size);
  font-weight: var(--md-sys-typescale-article-h3-font-weight);
  line-height: var(--md-sys-typescale-article-h3-line-height);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 48px 0 16px 0;
  font-variation-settings: "GRAD" var(--md-sys-typescale-article-h3-font-variation-GRAD), "opsz" var(--md-sys-typescale-article-h3-font-variation-opsz);
}

.blog-content :deep(h4) {
  font-family: var(--md-sys-typescale-article-h4-font-family);
  font-size: var(--md-sys-typescale-article-h4-font-size);
  font-weight: var(--md-sys-typescale-article-h4-font-weight);
  line-height: var(--md-sys-typescale-article-h4-line-height);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 32px 0 12px 0;
  font-variation-settings: "GRAD" var(--md-sys-typescale-article-h4-font-variation-GRAD), "opsz" var(--md-sys-typescale-article-h4-font-variation-opsz);
}

.blog-content :deep(h5) {
  font-family: var(--md-sys-typescale-article-h5-font-family);
  font-size: var(--md-sys-typescale-article-h5-font-size);
  font-weight: var(--md-sys-typescale-article-h5-font-weight);
  line-height: var(--md-sys-typescale-article-h5-line-height);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 24px 0 8px 0;
  font-variation-settings: "GRAD" var(--md-sys-typescale-article-h5-font-variation-GRAD), "opsz" var(--md-sys-typescale-article-h5-font-variation-opsz);
}

.blog-content :deep(h6) {
  font-family: var(--md-sys-typescale-article-h6-font-family);
  font-size: var(--md-sys-typescale-article-h6-font-size);
  font-weight: var(--md-sys-typescale-article-h6-font-weight);
  line-height: var(--md-sys-typescale-article-h6-line-height);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 24px 0 8px 0;
  font-variation-settings: "GRAD" var(--md-sys-typescale-article-h6-font-variation-GRAD), "opsz" var(--md-sys-typescale-article-h6-font-variation-opsz);
}

.blog-content :deep(p) {
  font-size: var(--md-sys-typescale-article-body-font-size);
  font-weight: var(--md-sys-typescale-article-body-font-weight);
  line-height: var(--md-sys-typescale-article-body-line-height);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin-bottom: 24px;
}

.blog-content :deep(ol) {
  padding-left: 0;
  list-style: none;
  counter-reset: item 0;
  margin-top: 16px;
}

.blog-content :deep(ol > li) {
  margin-top: 4px;
  margin-bottom: 20px;
  margin-left: 36px;
  counter-increment: item 1;
}

.blog-content :deep(ol > li::before) {
  font-family: var(--md-sys-typescale-article-ol-badge-font-family);
  font-size: var(--md-sys-typescale-article-ol-badge-font-size);
  font-weight: var(--md-sys-typescale-article-ol-badge-font-weight);
  letter-spacing: var(--md-sys-typescale-article-ol-badge-letter-spacing);
  font-variation-settings: "GRAD" var(--md-sys-typescale-article-ol-badge-font-variation-GRAD), "opsz" var(--md-sys-typescale-article-ol-badge-font-variation-opsz);
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

/* ── ol pill badge 响应式已由 :root 变量自动切换（label-l → label-m） ── */

.blog-content :deep(ul) {
  list-style: none;
  padding-left: 0;
  margin-left: 22px;
  margin-top: 16px;
}

.blog-content :deep(ul li) {
  position: relative;
  margin-bottom: 16px;
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

/* M3 body-large: li 字体与 p 一致，继承自 :root article-body token */
.blog-content :deep(li) {
  font-size: var(--md-sys-typescale-article-body-font-size);
  font-weight: var(--md-sys-typescale-article-body-font-weight);
  line-height: var(--md-sys-typescale-article-body-line-height);
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

/* ── M3 官方：figure/image/video/code-snippet/table 后紧跟的 ol/ul 用 margin-top:56px ── */
.blog-content :deep(mio-code-snippet + ol),
.blog-content :deep(mio-code-snippet + ul),
.blog-content :deep(figure + ol),
.blog-content :deep(figure + ul) {
  margin-top: 56px;
}

/* ── M3 官方：ol>li>ul>li 的 margin-top:16px（嵌套列表间距） ── */
.blog-content :deep(ol > li > ul > li) {
  margin-top: 16px;
}

.blog-content :deep(strong) {
  font-weight: 600;
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

/* inline <code> — 对照 m3: code token, surface-container bg, 2px 8px padding, 2px radius */
.blog-content :deep(code) {
  font-family: var(--md-sys-typescale-article-code-font-family);
  font-size: var(--md-sys-typescale-article-code-font-size);
  font-weight: var(--md-sys-typescale-article-code-font-weight);
  line-height: var(--md-sys-typescale-article-code-line-height);
  font-variation-settings: "GRAD" var(--md-sys-typescale-article-code-font-variation-GRAD), "opsz" var(--md-sys-typescale-article-code-font-variation-opsz);
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

/* mio-code-snippet 外层 display:block, margin-top:56px, margin-bottom:24px（对照 M3 官方） */
.blog-content :deep(mio-code-snippet) {
  display: block;
  margin-top: 56px;
  margin-bottom: 0;
}

/* p 紧跟在 mio-code-snippet 之后 — 对照 M3: margin-top 56px（视觉分隔代码块与正文） */
.blog-content :deep(mio-code-snippet + p) {
  margin-top: 32px;
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

/* .CodeMirror-scroll — 对照 M3 官方: overflow-x scroll（移动端长代码横向滚动） */
.blog-content :deep(.mio-code-snippet__container .CodeMirror-scroll) {
  overflow-x: auto;
  overflow-y: hidden;
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

/* 移动端 ≤600px: code snippet 更紧凑的间距 */
@media screen and (max-width: 600px) {
  .blog-content :deep(mio-code-snippet) {
    margin-top: 32px;
  }
  .blog-content :deep(mio-code-snippet + p) {
    margin-top: 24px;
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

/* ================================================================
   表格样式 — 对照 M3 博客 mio-table 结构
   官方结构: div.mio-table > div.table-wrapper > table
   外层 mio-table: display block, margin-top 56px
     table-wrapper: border 1px solid surface-variant, border-radius 24px, overflow-x auto
     table: width 100%, border-collapse collapse
     td: padding 16px 24px, border-top 1px solid surface-variant,
         border-right 1px solid surface-variant, vertical-align middle
     th: 同 td, 另加 font-weight 500, background surface-container-low
     首行: border-top 0 (wrapper 边框代替)
     末列: border-right 0 (wrapper 边框代替)
     table + p: margin-top 56px（与 code-snippet + p 一致）
   亮色实际值: surface-variant #e7e0ec, on-surface-variant #49454f
   暗色实际值: surface-variant #49454f, on-surface-variant #cac4d0
   ================================================================ */

/* mio-table 外层 — 对照 M3: display block, margin-top 56px */
.blog-content :deep(.mio-table) {
  display: block;
  margin-top: 56px;
}

/* table-wrapper — 对照 M3: border 1px solid, radius 24px, overflow-x auto */
.blog-content :deep(.mio-table .table-wrapper) {
  max-width: calc(-80px + 100vw);
  border: 1px solid var(--md-sys-color-surface-variant, #e7e0ec);
  border-radius: 24px;
  overflow-x: auto;
}

/* table — 对照 M3: width 100%, border-collapse collapse */
.blog-content :deep(.mio-table table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  line-height: 24px;
}

.blog-content :deep(.mio-table table p) {
  margin-block: 0;
}

/* td/th — 对照 M3: padding 16px 24px, row/col 分隔线 */
.blog-content :deep(.mio-table table td),
.blog-content :deep(.mio-table table th) {
  padding: 16px 24px;
  border-top: 1px solid var(--md-sys-color-surface-variant, #e7e0ec);
  border-right: 1px solid var(--md-sys-color-surface-variant, #e7e0ec);
  vertical-align: middle;
  text-align: left;
}

/* th — 对照 M3: font-weight 500 */
.blog-content :deep(.mio-table table th) {
  font-family: 'Google Sans Text', 'Google Sans', 'Noto Sans SC', sans-serif;
  font-weight: 500;
  font-variation-settings: "GRAD" 0, "opsz" 17;
  background: var(--md-sys-color-surface-container-low, #f7f2fa);
  color: var(--md-sys-color-on-surface-variant, #49454f);
}

/* 首行无 border-top（wrapper 已有边框）— 覆盖 thead 和无 thead 两种情况 */
.blog-content :deep(.mio-table table thead:first-child tr:first-child th),
.blog-content :deep(.mio-table table tbody:first-child tr:first-child td),
.blog-content :deep(.mio-table table tbody:first-child tr:first-child th) {
  border-top: 0;
}

/* 末列无 border-right（wrapper 已有边框） */
.blog-content :deep(.mio-table table tr th:last-child),
.blog-content :deep(.mio-table table tr td:last-child) {
  border-right: 0;
}

/* 空单元格 */
.blog-content :deep(.mio-table table td:empty),
.blog-content :deep(.mio-table table th:empty) {
  border-top: 0;
}

/* table 后的 p — 对照 M3: margin-top 56px */
.blog-content :deep(.mio-table + p) {
  margin-top: 32px;
}

/* 表格内 inline code */
.blog-content :deep(.mio-table table td code) {
  background: var(--md-sys-color-surface-container, #ece7e9);
  padding: 1px 6px;
  font-size: 13px;
}

/* 移动端 ≤960px */
@media screen and (max-width: 960px) {
  .blog-content :deep(.mio-table table td),
  .blog-content :deep(.mio-table table th) {
    padding: 12px 16px;
  }
}

/* 移动端 ≤600px */
@media screen and (max-width: 600px) {
  .blog-content :deep(.mio-table table td),
  .blog-content :deep(.mio-table table th) {
    padding: 10px 12px;
    font-size: 13px;
  }

  .blog-content :deep(.mio-table + p) {
    margin-top: 24px;
  }
}

/* ── 暗色主题表格 ── */
:global([data-theme="dark"] .blog-content .mio-table .table-wrapper) {
  border-color: var(--md-sys-color-surface-variant, #49454f);
}

:global([data-theme="dark"] .blog-content .mio-table table th) {
  background: var(--md-sys-color-surface-container-low, #1e1b1f);
  color: var(--md-sys-color-on-surface-variant, #cac4d0);
}

:global([data-theme="dark"] .blog-content .mio-table table td),
:global([data-theme="dark"] .blog-content .mio-table table th) {
  border-top-color: var(--md-sys-color-surface-variant, #49454f);
  border-right-color: var(--md-sys-color-surface-variant, #49454f);
}

:global([data-theme="dark"] .blog-content .mio-table table td code) {
  background: var(--md-sys-color-surface-container, #2b292b);
}

/* M3 body-large: blockquote 字体与 p/li 一致（16px/24px/400） */
.blog-content :deep(blockquote) {
  font-family: var(--md-sys-typescale-article-blockquote-font-family);
  font-size: var(--md-sys-typescale-article-blockquote-font-size);
  font-weight: var(--md-sys-typescale-article-blockquote-font-weight);
  line-height: var(--md-sys-typescale-article-blockquote-line-height);
  font-variation-settings: "GRAD" var(--md-sys-typescale-article-blockquote-font-variation-GRAD), "opsz" var(--md-sys-typescale-article-blockquote-font-variation-opsz);
  border-left: 4px solid var(--md-sys-color-primary);
  padding-left: 20px;
  margin: 56px 0;
  color: var(--md-sys-color-on-surface-variant);
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
   v-html 内容的 copy link 样式
   从本地组件（KernelsBlogContent.vue）提取，用 :deep() 作用于 v-html 元素
   本地组件的 copy link 样式在各自 scoped CSS 中，v-html 元素没有 data-v-xxx，
   所以需要在 BlogArticleView 中用 :deep() 重新声明
   ================================================================ */

/* .block — 对照 m3: grid 68px auto 0px 0px, gap 20px, margin-left -90px */
.blog-content :deep(.block) {
  display: grid;
  position: relative;
  grid-template-columns: 68px auto 0px 0px;
  gap: 20px;
  margin: 80px 0 24px -90px;
}

/* .copy-button-container — 对照 m3: display flex, relative, margin-left 20px */
.blog-content :deep(.copy-button-container) {
  display: flex;
  position: relative;
  align-items: flex-start;
  justify-content: center;
  height: max-content;
  margin-left: 20px;
  margin-top: 2px;
  cursor: auto;
}

/* .copy-button — 对照 m3: flex, relative, 48x48, opacity 0, z-index 2, border-radius 24px */
.blog-content :deep(.copy-button) {
  display: flex;
  position: relative;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  transition: opacity 0.2s cubic-bezier(0.2, 0, 0, 1);
  border-radius: 24px;
  opacity: 0;
  z-index: 2;
  font-size: 24px;
  line-height: 24px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  cursor: pointer;
  overflow: hidden;
  user-select: none;
}

/* .block:hover 时显示 copy-button */
.blog-content :deep(.block:hover .copy-button) {
  opacity: 1;
}

/* .copy-button 自身 focus-visible / hover 时也显示 */
.blog-content :deep(.copy-button:focus-visible),
.blog-content :deep(.copy-button:hover) {
  opacity: 1;
}

/* .copy-button hover/focus-visible 时显示 background + tooltip */
.blog-content :deep(.copy-button:focus-visible + .copy-button-background),
.blog-content :deep(.copy-button:focus-visible ~ .tooltip),
.blog-content :deep(.copy-button:hover + .copy-button-background),
.blog-content :deep(.copy-button:hover ~ .tooltip) {
  opacity: 1;
}

/* .copy-button.activated 时 background 变色 */
.blog-content :deep(.copy-button.activated + .copy-button-background) {
  background: var(--md-sys-color-tertiary-container, #ffd8e4);
}

/* .copy-button.activated 时 tooltip 宽度变化 */
.blog-content :deep(.copy-button.activated ~ .tooltip) {
  width: 86px;
}

/* .copy-button.activated 时 tooltip 文字切换 */
.blog-content :deep(.copy-button.activated ~ .tooltip .deactivated) {
  opacity: 0;
  visibility: hidden;
}

.blog-content :deep(.copy-button.activated ~ .tooltip .activated) {
  opacity: 1;
  visibility: visible;
}

/* .copy-button-background — 对照 m3: absolute, 48x48, z-index 1 */
.blog-content :deep(.copy-button-background) {
  position: absolute;
  width: 48px;
  height: 48px;
  transition: 0.2s cubic-bezier(0.2, 0, 0, 1);
  border-radius: 24px;
  background: color-mix(in srgb, var(--md-sys-color-on-surface-variant, #49454f) 8%, transparent);
  opacity: 0;
  pointer-events: none;
  z-index: 1;
}

/* .scroll-target (对照 m3: position absolute, 0x0, 锚点定位偏移) */
.blog-content :deep(.scroll-target) {
  display: block;
  position: absolute;
  width: 0;
  height: 0;
}

/* .tooltip — 对照 m3: absolute, bottom -28px, 74x24px, padding 4px 11px */
.blog-content :deep(.tooltip) {
  display: block;
  position: absolute;
  bottom: -28px;
  width: 74px;
  height: 24px;
  padding: 4px 11px;
  transition: 0.2s cubic-bezier(0.2, 0, 0, 1);
  border-radius: 6px;
  background: rgba(48, 48, 48, 0.8);
  color: var(--md-sys-color-inverse-on-surface, #f2f2f2);
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  letter-spacing: 0.1px;
  opacity: 0;
  pointer-events: none;
  white-space: nowrap;
}

/* .tooltip 文字切换 */
.blog-content :deep(.tooltip .deactivated) {
  position: absolute;
  transition: opacity 0.2s cubic-bezier(0.2, 0, 0, 1);
  opacity: 1;
  visibility: visible;
}

.blog-content :deep(.tooltip .activated) {
  position: absolute;
  transition: opacity 0.2s cubic-bezier(0.2, 0, 0, 1);
  opacity: 0;
  visibility: hidden;
}

/* .text-chunk */
.blog-content :deep(.text-chunk) {
  display: block;
}

/* 移动端 ≤1294px: 隐藏 copy-button 区域，block 回退到无 grid */
@media screen and (max-width: 1294px) {
  .blog-content :deep(.block) {
    display: block;
    margin: 64px 0 24px 0;
  }

  .blog-content :deep(.copy-button-container) {
     display: none;
  }
}

/* ================================================================
    back-to-top 按钮
    仅在 tablet 宽度（601px - 1293px）显示
    desktop (>=1294px): display: none（TOC 侧栏提供导航）
    mobile (<=600px): display: none（空间有限，不需要）
    ================================================================ */
:global(.back-to-top) {
  display: none;
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--md-sys-color-primary-container, #e8def8);
  color: var(--md-sys-color-on-primary-container, #1d192b);
  cursor: pointer;
  z-index: 50;
  border: none;
  outline: none;
  align-items: center;
  justify-content: center;
  box-shadow: var(--md-sys-elevation-2, 0px 1px 2px 0px rgba(0,0,0,0.3), 0px 2px 6px 2px rgba(0,0,0,0.15));
  overflow: hidden;
}

/* tablet 宽度：启用 back-to-top */
@media screen and (min-width: 601px) and (max-width: 1293px) {
  :global(.back-to-top) {
    display: flex;
    opacity: 0;
    visibility: hidden;
    transition: opacity 200ms cubic-bezier(0.2, 0, 0, 1), visibility 0ms 200ms;
  }

  :global(.back-to-top--show) {
    opacity: 1;
    visibility: visible;
    transition: opacity 200ms cubic-bezier(0.2, 0, 0, 1), visibility 0ms 0ms;
  }
}

:global(.back-to-top .material-symbols-rounded) {
  font-size: 24px;
  position: relative;
  z-index: 1;
}

:global(.back-to-top__state-overlay) {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--md-sys-color-on-primary-container, #1d192b);
  opacity: 0;
  transition: opacity 150ms linear;
}

:global(.back-to-top:hover .back-to-top__state-overlay) {
  opacity: 0.08;
}

:global(.back-to-top:active .back-to-top__state-overlay) {
  opacity: 0.12;
}

:global(.back-to-top:focus-visible) {
  outline: 2px solid var(--md-sys-color-primary, #6750a4);
  outline-offset: 2px;
}

/* 桌面端（>=1294px）已由 base display:none 覆盖，无需额外规则 */

/* 移动端（<=600px）已由 base display:none 覆盖，无需额外规则 */

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

/* 暗色主题 — 语法高亮色彩（同时覆盖 cm-s-neo 和 cm-s-material-darker） */
:global([data-theme="dark"] .blog-content .cm-s-neo .cm-variable),
:global([data-theme="dark"] .blog-content .cm-s-neo .cm-qualifier),
:global([data-theme="dark"] .blog-content .cm-s-material-darker .cm-variable) {
  color: #f07178;
}

:global([data-theme="dark"] .blog-content .cm-s-neo .cm-keyword),
:global([data-theme="dark"] .blog-content .cm-s-neo .cm-property),
:global([data-theme="dark"] .blog-content .cm-s-material-darker .cm-keyword),
:global([data-theme="dark"] .blog-content .cm-s-material-darker .cm-property) {
  color: #c792ea;
}

:global([data-theme="dark"] .blog-content .cm-s-neo .cm-number),
:global([data-theme="dark"] .blog-content .cm-s-material-darker .cm-number) {
  color: #ff5370;
}

:global([data-theme="dark"] .blog-content .cm-s-neo .cm-atom),
:global([data-theme="dark"] .blog-content .cm-s-material-darker .cm-atom) {
  color: #f78c6c;
}

:global([data-theme="dark"] .blog-content .cm-s-neo .cm-string),
:global([data-theme="dark"] .blog-content .cm-s-material-darker .cm-string) {
  color: #c3e88d;
}

:global([data-theme="dark"] .blog-content .cm-s-neo .cm-operator),
:global([data-theme="dark"] .blog-content .cm-s-material-darker .cm-operator) {
  color: #89ddff;
}

:global([data-theme="dark"] .blog-content .cm-s-neo .cm-comment),
:global([data-theme="dark"] .blog-content .cm-s-material-darker .cm-comment) {
  color: #545454;
}

:global([data-theme="dark"] .blog-content .cm-s-neo .cm-tag),
:global([data-theme="dark"] .blog-content .cm-s-material-darker .cm-tag) {
  color: #ff5370;
}

:global([data-theme="dark"] .blog-content .cm-s-neo .cm-def),
:global([data-theme="dark"] .blog-content .cm-s-material-darker .cm-def) {
  color: #82aaff;
}

:global([data-theme="dark"] .blog-content .cm-s-neo .cm-attribute),
:global([data-theme="dark"] .blog-content .cm-s-material-darker .cm-attribute) {
  color: #c792ea;
}

/* 暗色主题 — ul bullet SVG（M3 官方暗色 #E3E3E3，:global() 包裹完整选择器防止 Vue 编译破坏） */
:global([data-theme="dark"] .blog-content ul li::before) {
  background-image: url("data:image/svg+xml,%3Csvg width='8' height='8' viewBox='0 0 8 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4.95843 0.279933C5.5378 -0.353974 6.58452 0.173492 6.41974 1.01632L6.05454 2.88412C5.99767 3.17501 6.09646 3.47451 6.31525 3.67447L7.72007 4.95843C8.35397 5.5378 7.82651 6.58452 6.98368 6.41974L5.11588 6.05454C4.82499 5.99767 4.52549 6.09646 4.32553 6.31525L3.04157 7.72007C2.4622 8.35397 1.41548 7.82651 1.58026 6.98368L1.94545 5.11588C2.00233 4.82499 1.90354 4.52549 1.68475 4.32553L0.279933 3.04157C-0.353974 2.4622 0.173492 1.41548 1.01632 1.58026L2.88412 1.94545C3.17501 2.00233 3.47451 1.90354 3.67447 1.68475L4.95843 0.279933Z' fill='%23E3E3E3'/%3E%3C/svg%3E");
}

/* 暗色主题 — v-html copy link 样式（对照 KernelsBlogContent.vue 暗色覆盖） */
:global([data-theme="dark"] .blog-content .copy-button) {
  color: var(--md-sys-color-on-surface, #e6e1e5);
}

:global([data-theme="dark"] .blog-content .copy-button-background) {
  background: color-mix(in srgb, var(--md-sys-color-on-surface-variant, #cac4d0) 8%, transparent);
}

:global([data-theme="dark"] .blog-content .tooltip) {
  background: #fefbff;
  color: #1f1f1f;
}

</style>
