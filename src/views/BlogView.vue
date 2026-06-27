<template>
  <div class="blog-view">
    <!-- 页面标题 -->
    <div class="blog-header">
      <h1 class="blog-header__title">博客</h1>
      <p class="blog-header__desc">技术心得与生活随笔</p>
    </div>

    <!-- 分类筛选 -->
    <div class="filter-bar">
      <md-chip-set>
        <md-filter-chip
          v-for="cat in categories"
          :key="cat.id"
          :selected="activeCategory === cat.id"
          @click="activeCategory = cat.id"
          :label="cat.label"
        ></md-filter-chip>
      </md-chip-set>
    </div>

    <!-- 文章列表 -->
    <div class="post-list">
      <article
        v-for="post in filteredPosts"
        :key="post.id"
        class="post-card"
        @click="openPost(post)"
      >
        <div class="post-card__badge">{{ post.category }}</div>
        <h2 class="post-card__title">{{ post.title }}</h2>
        <p class="post-card__excerpt">{{ post.excerpt }}</p>
        <div class="post-card__footer">
          <div class="post-card__tags">
            <span v-for="tag in post.tags" :key="tag" class="post-card__tag">{{ tag }}</span>
          </div>
          <span class="post-card__date">{{ post.date }}</span>
        </div>
      </article>
    </div>

    <!-- 文章详情弹窗 -->
    <Teleport to="body">
      <div v-if="selectedPost" class="post-overlay" @click.self="selectedPost = null">
        <div class="post-detail">
          <md-icon-button class="post-detail__close" @click="selectedPost = null">
            <span class="material-symbols-rounded">close</span>
          </md-icon-button>
          <div class="post-detail__badge">{{ selectedPost.category }}</div>
          <h1 class="post-detail__title">{{ selectedPost.title }}</h1>
          <div class="post-detail__meta">
            <span>{{ selectedPost.date }}</span>
            <span>·</span>
            <span>{{ selectedPost.readTime }} 分钟阅读</span>
          </div>
          <md-divider></md-divider>
          <div class="post-detail__body" v-html="selectedPost.content"></div>
        </div>
      </div>
    </Teleport>

    <!-- ======== Footer ======== -->
    <MioFooter />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import '@material/web/chips/chip-set'
import '@material/web/chips/filter-chip'
import '@material/web/iconbutton/icon-button'
import '@material/web/divider/divider'
import MioFooter from '@/components/common/MioFooter.vue'

const route = useRoute()

const activeCategory = ref('all')

// 根据路由设置默认分类
if (route.params.category) {
  activeCategory.value = route.params.category
}

const categories = [
  { id: 'all', label: '全部', icon: '' },
  { id: 'tech', label: '技术', icon: 'code' },
  { id: 'life', label: '生活', icon: 'favorite' },
]

const posts = ref([
  {
    id: 1,
    title: 'Vue 3 Composition API 实战指南',
    excerpt: '深入理解 setup 语法、响应式原理与组合式函数的设计模式，帮助你在项目中更好地组织代码。',
    category: '技术',
    categoryKey: 'tech',
    tags: ['Vue 3', 'Composition API'],
    date: '2026-06-18',
    readTime: 8,
    content: `
      <h2>为什么选择 Composition API？</h2>
      <p>Options API 在小型项目中非常直观，但随着组件逻辑增多，同一功能的代码被分散到不同选项中，难以维护。Composition API 允许按功能组织代码，让相关逻辑聚合在一起。</p>
      <h2>响应式基础</h2>
      <p><code>ref()</code> 用于基本类型的响应式数据，<code>reactive()</code> 用于对象。在模板中 ref 会自动解包，但在 JS 中需要 <code>.value</code>。</p>
      <h2>组合式函数 (Composables)</h2>
      <p>将可复用的逻辑提取为独立函数，以 <code>use</code> 前缀命名。这是 Composition API 最强大的模式——让逻辑复用变得自然且类型安全。</p>
    `,
  },
  {
    id: 2,
    title: 'Material Design 3 主题系统解析',
    excerpt: '从 HCT 色彩空间到动态配色，了解 Google 最新设计语言的色彩体系如何工作。',
    category: '技术',
    categoryKey: 'tech',
    tags: ['M3', 'Design System'],
    date: '2026-06-12',
    readTime: 12,
    content: `
      <h2>HCT 色彩空间</h2>
      <p>M3 引入了新的 HCT (Hue-Chroma-Tone) 色彩空间，相比 HSL 更符合人眼感知。它解决了 HSL 中不同色相但相同"亮度"看起来实际亮度不一致的问题。</p>
      <h2>动态配色</h2>
      <p>从一张图片提取主色，通过 HCT 算法生成完整的 40+ 色彩令牌。用户设置的壁纸颜色会影响整个系统 UI 的配色方案。</p>
      <h2>色彩令牌体系</h2>
      <p>M3 定义了 Primary、Secondary、Tertiary、Error、Neutral、Neutral Variant 六组色调，每组包含 Container/On-Container 等变体，共 40+ 个令牌。</p>
    `,
  },
  {
    id: 3,
    title: '我的 2026 上半年阅读清单',
    excerpt: '分享上半年读过的几本好书，涵盖技术、设计和思维方式。',
    category: '生活',
    categoryKey: 'life',
    tags: ['阅读', '成长'],
    date: '2026-06-05',
    readTime: 5,
    content: `
      <h2>技术类</h2>
      <p>《重构：改善既有代码的设计》——每次重读都有新收获，特别是关于"小步修改"的理念。</p>
      <p>《设计模式之美》——用通俗的语言解释 23 种设计模式，比 GoF 原著易读得多。</p>
      <h2>设计类</h2>
      <p>《写给大家看的设计书》——四大原则（对齐、对比、重复、亲密性）是所有设计的基石。</p>
      <h2>思维类</h2>
      <p>《思考，快与慢》——系统 1 和系统 2 的框架帮助我理解为什么直觉常常不可靠。</p>
    `,
  },
  {
    id: 4,
    title: '用 Vite 插件扩展构建流程',
    excerpt: 'Vite 的插件机制基于 Rollup，但增加了开发服务器钩子，让你可以深度定制开发体验。',
    category: '技术',
    categoryKey: 'tech',
    tags: ['Vite', 'Build Tools'],
    date: '2026-05-28',
    readTime: 10,
    content: `
      <h2>Vite 插件 vs Rollup 插件</h2>
      <p>Vite 插件兼容 Rollup 插件接口，但额外提供 <code>configureServer</code>、<code>transformIndexHtml</code> 等开发专用钩子。</p>
      <h2>实战：自定义 Material Web 组件注册</h2>
      <p>通过 <code>transform</code> 钩子自动注入 <code>@material/web</code> 组件注册代码，省去手动 import 的繁琐。</p>
    `,
  },
  {
    id: 5,
    title: '五一自驾游：川西小环线',
    excerpt: '四姑娘山、丹巴藏寨、塔公草原，三天两夜的川西自驾之旅。',
    category: '生活',
    categoryKey: 'life',
    tags: ['旅行', '摄影'],
    date: '2026-05-10',
    readTime: 6,
    content: `
      <h2>行程概览</h2>
      <p>Day 1: 成都 → 四姑娘山双桥沟 → 小金县</p>
      <p>Day 2: 小金 → 丹巴藏寨 → 塔公草原 → 新都桥</p>
      <p>Day 3: 新都桥 → 折多山 → 康定 → 成都</p>
      <h2>一些体验</h2>
      <p>高原天气多变，一天之内经历了晴天、小雨和冰雹。沿途的风景令人震撼，手机根本拍不出肉眼看到的万分之一。</p>
    `,
  },
])

const filteredPosts = computed(() => {
  if (activeCategory.value === 'all') return posts.value
  return posts.value.filter(p => p.categoryKey === activeCategory.value)
})

const selectedPost = ref(null)

function openPost(post) {
  selectedPost.value = post
}
</script>

<style scoped>
.blog-view {
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 32px;
  box-sizing: border-box;
}

/* ======== Header ======== */
.blog-header {
  padding: 16px 0 24px;
}

.blog-header__title {
  font-size: 32px;
  font-weight: 400;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  line-height: 40px;
}

.blog-header__desc {
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  margin-top: 4px;
}

/* ======== Filter Bar ======== */
.filter-bar {
  margin-bottom: 24px;
}

/* ======== Post List ======== */
.post-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.post-card {
  padding: 20px;
  border-radius: 12px;
  background-color: var(--md-sys-color-surface-container, #f3edf7);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.post-card:hover {
  box-shadow: var(--md-sys-elevation-2, 0 1px 3px 1px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.3));
}

.post-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 12px;
  background-color: var(--md-sys-color-on-surface, #1c1b1f);
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.post-card:hover::after {
  opacity: 0.08;
}

.post-card:active::after {
  opacity: 0.12;
}

.post-card__badge {
  display: inline-flex;
  padding: 2px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
  background-color: var(--md-sys-color-primary, #6750a4);
  color: var(--md-sys-color-on-primary, #ffffff);
  margin-bottom: 8px;
}

.post-card__title {
  font-size: 18px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  line-height: 24px;
  margin-bottom: 8px;
  position: relative;
  z-index: 1;
}

.post-card__excerpt {
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  line-height: 20px;
  position: relative;
  z-index: 1;
}

.post-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  position: relative;
  z-index: 1;
}

.post-card__tags {
  display: flex;
  gap: 6px;
}

.post-card__tag {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  background-color: var(--md-sys-color-secondary-container, #e8def8);
  color: var(--md-sys-color-on-secondary-container, #1d192b);
}

.post-card__date {
  font-size: 12px;
  color: var(--md-sys-color-outline, #79747e);
}

/* ======== Post Detail Overlay ======== */
.post-overlay {
  position: fixed;
  inset: 0;
  z-index: 500;
  background-color: color-mix(in srgb, var(--md-sys-color-scrim, #000000) 40%, transparent);
  display: flex;
  justify-content: center;
  padding: 48px 24px;
  overflow-y: auto;
}

.post-detail {
  max-width: 680px;
  width: 100%;
  background-color: var(--md-sys-color-surface, #fffbfe);
  border-radius: 28px;
  padding: 32px;
  position: relative;
  max-height: calc(100vh - 96px);
  overflow-y: auto;
}

.post-detail__close {
  position: absolute;
  top: 16px;
  right: 16px;
}

.post-detail__badge {
  display: inline-flex;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  background-color: var(--md-sys-color-primary, #6750a4);
  color: var(--md-sys-color-on-primary, #ffffff);
  margin-bottom: 16px;
}

.post-detail__title {
  font-size: 28px;
  font-weight: 400;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  line-height: 36px;
  margin-bottom: 8px;
}

.post-detail__meta {
  display: flex;
  gap: 8px;
  font-size: 13px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  margin-bottom: 20px;
}

.post-detail__body {
  font-size: 15px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  line-height: 26px;
}

.post-detail__body h2 {
  font-size: 20px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin-top: 28px;
  margin-bottom: 12px;
}

.post-detail__body p {
  margin-bottom: 12px;
}

.post-detail__body code {
  padding: 2px 6px;
  border-radius: 4px;
  background-color: var(--md-sys-color-surface-container, #f3edf7);
  font-size: 13px;
  font-family: 'Roboto Mono', monospace;
}

/* ======== 暗色主题 ======== */
:global([data-theme="dark"]) .post-card {
  background-color: var(--md-sys-color-surface-container, #211f26);
}

:global([data-theme="dark"]) .post-card::after {
  background-color: var(--md-sys-color-on-surface, #e6e1e5);
}

:global([data-theme="dark"]) .post-card__badge {
  background-color: var(--md-sys-color-primary, #d0bcff);
  color: var(--md-sys-color-on-primary, #381e72);
}

:global([data-theme="dark"]) .post-card__tag {
  background-color: var(--md-sys-color-secondary-container, #4a4458);
  color: var(--md-sys-color-on-secondary-container, #e8def8);
}

:global([data-theme="dark"]) .post-detail {
  background-color: var(--md-sys-color-surface, #1c1b1f);
}

:global([data-theme="dark"]) .post-detail__badge {
  background-color: var(--md-sys-color-primary, #d0bcff);
  color: var(--md-sys-color-on-primary, #381e72);
}

:global([data-theme="dark"]) .post-detail__body code {
  background-color: var(--md-sys-color-surface-container, #211f26);
}
</style>
