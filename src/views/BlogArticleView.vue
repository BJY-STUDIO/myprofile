<template>
  <div class="blog-article">
    <!-- ======== mio-header（对照 m3: header, 含日期/标题/副标题 + 头图） ======== -->
    <header class="mio-header">
      <div class="header__container">
        <div class="header__wrapper">
          <div class="header__date">{{ article.date }}</div>
          <div class="header__title">
            <h1>{{ article.title }}</h1>
            <div class="header__description">{{ article.description }}</div>
          </div>
        </div>
      </div>
      <div
        v-if="article.heroImage"
        class="header__hero"
        :style="{ backgroundImage: `url(${article.heroImage})` }"
      ></div>
    </header>

    <!-- ======== content-container（对照 m3: flex, article左 + TOC右） ======== -->
    <div class="content-container">
      <!-- article 区域 -->
      <article class="blog-section">
        <!-- authors 区域 -->
        <div class="authors">
          <p class="authors__label">Posted by</p>
          <div
            v-for="(author, i) in article.authors"
            :key="i"
            class="byline"
          >
            <span class="byline__name">{{ author.name }}</span>
            <span class="byline__role">{{ author.role }}</span>
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

      <!-- TOC 目录（右侧） -->
      <aside class="mio-toc" v-if="tocItems.length">
        <nav>
          <div class="toc__heading">On this page</div>
          <div class="toc__list">
            <a
              v-for="(item, i) in tocItems"
              :key="item.id"
              :class="['toc__link', { 'toc__link--active': activeTocIndex === i, 'toc__link--sub': item.level === 'H3' }]"
              @click.prevent="scrollToHeading(item.id)"
            >{{ item.text }}</a>
          </div>
        </nav>
      </aside>
    </div>

    <!-- ======== mio-up-next（对照 m3: 推荐阅读） ======== -->
    <section class="mio-up-next" v-if="upNextArticles.length">
      <h2 class="up-next__title">Up next</h2>
      <div class="up-next__grid">
        <a
          v-for="item in upNextArticles"
          :key="item.slug"
          class="up-next__card"
          :href="'#/article/' + item.slug"
          @click.prevent="$router.push('/article/' + item.slug)"
        >
          <div
            v-if="item.heroImage"
            class="up-next__card-image"
            :style="{ backgroundImage: `url(${item.heroImage})` }"
          ></div>
          <div class="up-next__card-body">
            <div class="up-next__card-title">{{ item.title }}</div>
            <div class="up-next__card-desc">{{ item.description }}</div>
            <div class="up-next__card-date">{{ item.date }}</div>
          </div>
        </a>
      </div>
    </section>

    <!-- ======== mio-footer ======== -->
    <footer class="mio-footer">
      <div class="footer__inner">
        <div class="footer__col">
          <div class="footer__logo">
            <span class="material-symbols-rounded">edit_note</span>
            <span class="footer__brand">Kernel's Blog</span>
          </div>
          <p class="footer__desc">探索技术，记录生活。遵循 Material Design 3 规范的个人博客。</p>
        </div>
        <div class="footer__col">
          <div class="footer__nav-heading">导航</div>
          <a class="footer__link" @click.prevent="$router.push('/')">首页</a>
          <a class="footer__link" @click.prevent="$router.push('/blog')">博客</a>
          <a class="footer__link" @click.prevent="$router.push('/projects')">项目</a>
          <a class="footer__link" @click.prevent="$router.push('/about')">关于</a>
        </div>
        <div class="footer__col">
          <div class="footer__nav-heading">联系</div>
          <a class="footer__link" href="https://github.com/BJY-STUDIO/myprofile" target="_blank" rel="noopener">GitHub</a>
          <a class="footer__link" @click.prevent="$router.push('/contact')">联系我</a>
        </div>
      </div>
      <div class="footer__bottom">
        <span>&copy; {{ new Date().getFullYear() }} Kernel's Blog. All rights reserved.</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch, shallowRef, defineAsyncComponent } from 'vue'
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

// ======== TOC 目录 ========
const tocItems = ref([])
const activeTocIndex = ref(0)
const blogContentRef = ref(null)

function buildToc() {
  if (!blogContentRef.value) return
  const headings = blogContentRef.value.querySelectorAll('h2, h3')
  if (!headings.length) return false // 内容尚未渲染
  tocItems.value = Array.from(headings).map((h, i) => {
    const id = h.id || `section-${i}`
    if (!h.id) h.id = id
    return { id, text: h.textContent, level: h.tagName }
  })
  return true
}

let observer = null
let contentMutationObserver = null

function setupScrollObserver() {
  if (observer) observer.disconnect()
  if (!tocItems.value.length) return

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const idx = tocItems.value.findIndex(t => t.id === entry.target.id)
          if (idx >= 0) activeTocIndex.value = idx
        }
      }
    },
    { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
  )

  nextTick(() => {
    if (!blogContentRef.value) return
    tocItems.value.forEach(t => {
      const el = blogContentRef.value.querySelector(`#${CSS.escape(t.id)}`)
      if (el) observer.observe(el)
    })
  })
}

function scrollToHeading(id) {
  const el = blogContentRef.value?.querySelector(`#${CSS.escape(id)}`)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Up Next 数据
const upNextArticles = computed(() => {
  const currentSlug = route.params.slug
  return Object.values(articles)
    .filter(a => a.slug !== currentSlug)
    .slice(0, 2)
})

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
      // 也直接尝试一次（同步组件场景）
      const built = buildToc()
      if (built) {
        setupScrollObserver()
        contentMutationObserver.disconnect()
      }
    }
  })
})

onUnmounted(() => {
  if (observer) observer.disconnect()
  if (contentMutationObserver) contentMutationObserver.disconnect()
})

watch(() => route.params.slug, () => {
  tocItems.value = []
  activeTocIndex.value = 0
  nextTick(() => {
    if (blogContentRef.value) {
      // 重新监听 DOM 变化
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
/* ============================================
   Blog Article View
   对照 m3.material.io/blog 文章页面布局
   ============================================ */

.blog-article {
  width: 100%;
  min-height: 100%;
  background: var(--md-sys-color-surface);
}

/* ======== mio-header ======== */
.mio-header {
  max-width: 1112px;
  margin: 0 auto;
  padding: 0 8px;
}

.header__container {
  background: var(--md-sys-color-surface-container-low);
  border-radius: 24px;
  padding: 56px;
}

.header__wrapper {
  display: flex;
  flex-direction: column;
}

.header__date {
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  color: var(--md-sys-color-on-surface);
  margin-bottom: 16px;
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
}

.header__title h1 {
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 57px;
  font-weight: 475;
  line-height: 64px;
  letter-spacing: 0;
  color: var(--md-sys-color-on-surface);
  margin: 0 0 8px 0;
  font-variation-settings: "GRAD" 0, "opsz" 18;
}

.header__description {
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 24px;
  font-weight: 400;
  line-height: 32px;
  color: var(--md-sys-color-on-surface-variant);
  margin-top: 8px;
}

.header__hero {
  margin-top: 16px;
  border-radius: 24px;
  background-size: cover;
  background-position: center;
  padding-bottom: 45%;
  min-height: 200px;
}

/* ======== content-container（双栏：TOC + article） ======== */
.content-container {
  max-width: 1112px;
  margin: 0 auto;
  padding: 0 8px;
  display: flex;
  gap: 88px;
}

/* ======== mio-toc ======== */
.mio-toc {
  flex-shrink: 0;
  width: 260px;
  padding: 0;
  margin-top: 56px; /* 与 .authors margin-top 对齐 */
}

.mio-toc nav {
  position: sticky;
  top: 24px;
}

.toc__heading {
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  color: var(--md-sys-color-on-surface);
  margin-bottom: 16px;
}

.toc__list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.toc__link {
  display: block;
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: var(--md-sys-color-on-surface-variant);
  padding: 8px 12px;
  border-radius: 8px;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.toc__link:hover {
  background: var(--md-sys-color-surface-container-high);
}

.toc__link--active {
  color: var(--md-sys-color-primary);
  background: none;
}

.toc__link--sub {
  padding-left: 24px;
  font-size: 13px;
}

/* ======== blog-section（article 区域） ======== */
.blog-section {
  flex: 1;
  min-width: 0;
  max-width: 720px;
}

/* authors */
.authors {
  margin-top: 56px;
}

.authors__label {
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: var(--md-sys-color-on-surface-variant);
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.1px;
}

.byline {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 8px;
}

.byline__name {
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  color: var(--md-sys-color-on-surface);
}

.byline__role {
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: var(--md-sys-color-on-surface-variant);
}

/* separator */
.separator {
  border: none;
  border-top: 1px solid var(--md-sys-color-outline-variant);
  margin: 56px 0 56px 0;
}

/* ======== blog-content 文章排版 ======== */
.blog-content {
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 28px;
  color: var(--md-sys-color-on-surface-variant);
}

.blog-content :deep(h2) {
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 36px;
  font-weight: 475;
  line-height: 44px;
  color: var(--md-sys-color-on-surface);
  margin: 64px 0 16px 0;
  font-variation-settings: "GRAD" 0, "opsz" 18;
}

.blog-content :deep(h3) {
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 24px;
  font-weight: 475;
  line-height: 32px;
  color: var(--md-sys-color-on-surface);
  margin: 48px 0 12px 0;
  font-variation-settings: "GRAD" 0, "opsz" 18;
}

.blog-content :deep(p) {
  font-size: 16px;
  line-height: 28px;
  color: var(--md-sys-color-on-surface-variant);
  margin-bottom: 24px;
}

.blog-content :deep(ul),
.blog-content :deep(ol) {
  padding-left: 24px;
  margin-bottom: 24px;
}

.blog-content :deep(li) {
  margin-bottom: 8px;
  line-height: 28px;
  color: var(--md-sys-color-on-surface-variant);
}

.blog-content :deep(strong) {
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
}

.blog-content :deep(code) {
  font-family: 'Google Sans Mono', 'Courier New', monospace;
  font-size: 14px;
  background: var(--md-sys-color-surface-container-high);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--md-sys-color-on-surface);
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

/* ======== mio-up-next ======== */
.mio-up-next {
  max-width: 1112px;
  margin: 120px auto 0;
  padding: 0 8px;
}

.up-next__title {
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 36px;
  font-weight: 475;
  line-height: 44px;
  color: var(--md-sys-color-on-surface);
  margin: 0 0 32px 40px;
  font-variation-settings: "GRAD" 0, "opsz" 18;
}

.up-next__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 24px;
  padding: 0 40px;
}

.up-next__card {
  display: flex;
  flex-direction: column;
  background: var(--md-sys-color-surface-container-low);
  border-radius: 24px;
  overflow: hidden;
  text-decoration: none;
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.15s ease;
  border: 1px solid var(--md-sys-color-outline-variant);
}

.up-next__card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transform: translateY(-2px);
}

.up-next__card-image {
  width: 100%;
  padding-bottom: 50%;
  background-size: cover;
  background-position: center;
  border-radius: 12px 12px 0 0;
}

.up-next__card-body {
  padding: 24px;
}

.up-next__card-title {
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 24px;
  color: var(--md-sys-color-on-surface);
  margin-bottom: 8px;
}

.up-next__card-desc {
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: var(--md-sys-color-on-surface-variant);
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.up-next__card-date {
  font-size: 12px;
  font-weight: 500;
  color: var(--md-sys-color-outline);
  letter-spacing: 0.1px;
}

/* ======== mio-footer ======== */
.mio-footer {
  margin-top: 120px;
  background: var(--md-sys-color-surface-container-low);
  padding: 48px 8px 0;
}

.footer__inner {
  max-width: 1112px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 48px;
  padding: 0 40px 32px;
}

.footer__logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.footer__logo .material-symbols-rounded {
  font-size: 28px;
  color: var(--md-sys-color-primary);
}

.footer__brand {
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 22px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface);
}

.footer__desc {
  font-size: 14px;
  line-height: 20px;
  color: var(--md-sys-color-on-surface-variant);
  max-width: 320px;
}

.footer__nav-heading {
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
  margin-bottom: 16px;
}

.footer__link {
  display: block;
  font-size: 14px;
  font-weight: 400;
  line-height: 32px;
  color: var(--md-sys-color-on-surface-variant);
  text-decoration: none;
  cursor: pointer;
  transition: color 0.15s ease;
}

.footer__link:hover {
  color: var(--md-sys-color-primary);
}

.footer__bottom {
  border-top: 1px solid var(--md-sys-color-outline-variant);
  max-width: 1112px;
  margin: 0 auto;
  padding: 24px 40px;
  text-align: center;
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant);
}

/* ======== 响应式 ======== */
@media (max-width: 1024px) {
  .content-container {
    flex-direction: column;
    gap: 0;
  }

  .mio-toc {
    width: 100%;
    margin-top: 32px;
    order: -1;
  }

  .blog-section {
    order: 1;
  }

  .mio-toc nav {
    position: static;
  }

  .toc__list {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;
  }

  .toc__link {
    font-size: 12px;
    padding: 6px 12px;
  }

  .blog-section {
    max-width: 100%;
  }
}

@media (max-width: 840px) {
  .header__container {
    padding: 32px 24px;
    border-radius: 16px;
  }

  .header__title h1 {
    font-size: 40px;
    line-height: 48px;
  }

  .header__description {
    font-size: 18px;
    line-height: 24px;
  }

  .header__hero {
    border-radius: 16px;
    padding-bottom: 56%;
  }

  .up-next__grid {
    grid-template-columns: 1fr;
    padding: 0 16px;
  }

  .up-next__title {
    margin-left: 16px;
  }

  .footer__inner {
    grid-template-columns: 1fr;
    gap: 32px;
    padding: 0 16px 24px;
  }
}

@media (max-width: 600px) {
  .header__container {
    padding: 24px 16px;
  }

  .header__title h1 {
    font-size: 32px;
    line-height: 40px;
  }

  .header__description {
    font-size: 16px;
    line-height: 24px;
  }

  .blog-content :deep(h2) {
    font-size: 28px;
    line-height: 36px;
  }

  .blog-content :deep(h3) {
    font-size: 20px;
    line-height: 28px;
  }

  .authors {
    margin-top: 48px;
  }

  .separator {
    margin: 40px 0;
  }

  .mio-up-next {
    margin-top: 80px;
  }

  .mio-footer {
    margin-top: 80px;
  }
}

/* ======== 暗色主题适配 ======== */
:global([data-theme="dark"]) .header__container {
  background: var(--md-sys-color-surface-container-low);
}

:global([data-theme="dark"]) .up-next__card {
  background: var(--md-sys-color-surface-container-low);
}

:global([data-theme="dark"]) .mio-footer {
  background: var(--md-sys-color-surface-container-low);
}
</style>
