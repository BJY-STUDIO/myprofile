<template>
  <div class="home-view">
    <!-- Hero 区域（对照 m3 mio-header split-asset 布局）
         header grid 里两个独立卡片：primary-container + split-asset-image -->
    <header class="mio-header">
      <div class="primary-container">
        <div class="wrapper">
          <span class="date">2026 年 6 月</span>
          <div class="title">
            <h1>Kernel's Blog</h1>
          </div>
          <div class="description">探索技术，记录生活。一个遵循 Material Design 3 规范的个人博客。</div>
        </div>
      </div>
      <div class="split-asset-image">
        <div class="split-asset-image__foreground"></div>
      </div>
    </header>

    <!-- 最近文章 -->
    <section class="section">
      <div class="section-header">
        <span class="overline">BLOG</span>
        <h2 class="section-title">最近文章</h2>
      </div>

      <!-- 每篇文章都是 mio-header 模式的双卡片 grid -->
      <div class="article-grid">
        <router-link
          v-for="(post, index) in recentPosts"
          :key="post.id"
          :to="post.route"
          class="article-card"
        >
          <!-- 左侧：文字卡片（对照 mio-header .primary-container） -->
          <div class="article-card__text">
            <div class="wrapper">
              <span class="date">{{ post.date }}</span>
              <span class="card-title">{{ post.title }}</span>
              <span class="card-desc">{{ post.excerpt }}</span>
            </div>
          </div>
          <!-- 右侧：图片卡片（对照 mio-header .split-asset-image） -->
          <div class="article-card__image" :style="{ background: thumbGradient(post.id) }">
            <span class="material-symbols-rounded article-icon">article</span>
          </div>
        </router-link>
      </div>
    </section>

    <!-- 精选项目 -->
    <section class="section">
      <div class="section-header">
        <span class="overline">PROJECTS</span>
        <h2 class="section-title">精选项目</h2>
      </div>

      <div class="article-grid">
        <router-link
          v-for="project in featuredProjects"
          :key="project.id"
          :to="project.route"
          class="article-card"
        >
          <div class="article-card__text">
            <div class="wrapper">
              <span class="date">{{ project.tags.join(' · ') }}</span>
              <span class="card-title">{{ project.title }}</span>
              <span class="card-desc">{{ project.excerpt }}</span>
            </div>
          </div>
          <div class="article-card__image" :style="{ background: thumbGradient(project.id + 10) }">
            <span class="material-symbols-rounded article-icon">{{ project.icon }}</span>
          </div>
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const recentPosts = ref([
  {
    id: 1,
    title: 'Vue 3 Composition API 实战指南',
    excerpt: '深入理解 setup 语法、响应式原理与组合式函数的设计模式。',
    category: '技术',
    date: '2026-06-18',
    route: '/blog/tech',
  },
  {
    id: 2,
    title: 'Material Design 3 主题系统解析',
    excerpt: '从 HCT 色彩空间到动态配色，了解 Google 最新设计语言的色彩体系。',
    category: '技术',
    date: '2026-06-12',
    route: '/blog/tech',
  },
  {
    id: 3,
    title: '我的 2026 上半年阅读清单',
    excerpt: '分享上半年读过的几本好书，涵盖技术、设计和思维方式。',
    category: '生活',
    date: '2026-06-05',
    route: '/blog/life',
  },
])

const featuredProjects = ref([
  {
    id: 1,
    title: "Kernel's Blog",
    icon: 'web',
    excerpt: '基于 Vue 3 + Material Web 的个人博客站点，严格遵循 M3 规范。',
    tags: ['Vue 3', 'Material Web', 'Vite'],
    route: '/projects/web',
  },
  {
    id: 2,
    title: '数据可视化工具集',
    icon: 'analytics',
    excerpt: '面向电信行业的数据抓取、清洗与可视化展示工具。',
    tags: ['Python', 'ECharts', 'Pandas'],
    route: '/projects/tools',
  },
  {
    id: 3,
    title: '考核题库管理平台',
    icon: 'school',
    excerpt: '客户经理培训考核系统，支持题目录入、组卷与成绩统计。',
    tags: ['Vue 3', 'Node.js', 'MongoDB'],
    route: '/projects/web',
  },
])

const gradients = [
  'linear-gradient(135deg, var(--md-sys-color-primary-container, #eaddff) 0%, var(--md-sys-color-secondary-container, #e8def8) 50%, var(--md-sys-color-tertiary-container, #ffd8e4) 100%)',
  'linear-gradient(135deg, var(--md-sys-color-secondary-container, #e8def8) 0%, var(--md-sys-color-tertiary-container, #ffd8e4) 50%, var(--md-sys-color-primary-container, #eaddff) 100%)',
  'linear-gradient(135deg, var(--md-sys-color-tertiary-container, #ffd8e4) 0%, var(--md-sys-color-primary-container, #eaddff) 50%, var(--md-sys-color-secondary-container, #e8def8) 100%)',
  'linear-gradient(135deg, var(--md-sys-color-primary-container, #eaddff) 30%, var(--md-sys-color-surface-container-high, #ece6f0) 100%)',
]

function thumbGradient(id) {
  return gradients[id % gradients.length]
}
</script>

<style scoped>
.home-view {
  max-width: 1200px;
  width: 100%;
}

/* ================================================================
   mio-header（严格对照 m3 源码 split-asset 布局）
   header grid: 1fr 1fr, gap 8px（m3 实测）
   左 primary-container + 右 split-asset-image = 两个独立圆角卡片
   ================================================================ */

.mio-header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 56px;
}

.primary-container {
  display: flex;
  margin: 0;
  padding: 56px;
  border-radius: 24px;
  background: var(--md-sys-color-surface-container-low, #f7f2fa);
  min-height: 544px;
}

.split-asset-image {
  display: flex;
  position: relative;
  justify-content: center;
  border-radius: 24px;
  overflow: hidden;
  min-height: 544px;
}

.split-asset-image__foreground {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    var(--md-sys-color-primary-container, #eaddff) 0%,
    var(--md-sys-color-secondary-container, #e8def8) 50%,
    var(--md-sys-color-tertiary-container, #ffd8e4) 100%
  );
}

@media screen and (max-width: 840px) {
  .mio-header {
    grid-template-columns: 1fr;
    margin-bottom: 40px;
  }
  .primary-container {
    min-height: unset;
    padding: 32px 24px;
  }
  .split-asset-image {
    min-height: unset;
    padding-bottom: 50%;
  }
  .split-asset-image__foreground {
    position: absolute;
    inset: 0;
  }
}

/* wrapper */
.wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 840px;
  margin: 0;
  gap: 8px;
}

/* ================================================================
   Section（对照 m3 .section + .section-header）
   ================================================================ */

.section {
  margin: 56px 0;
}

.section-header {
  margin-bottom: 24px;
}

.section-header .overline {
  display: block;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  margin-bottom: 4px;
}

.section-title {
  font-size: 32px;
  font-weight: 400;
  line-height: 40px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0;
}

@media screen and (max-width: 600px) {
  .section-title {
    font-size: 24px;
    line-height: 32px;
  }
}

/* ================================================================
   Article Grid
   ================================================================ */

.article-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ================================================================
   Article Card — 每张卡片内部是 m3 mio-header 布局
   grid 1fr 1fr, gap 8px
   左 article-card__text（对照 primary-container）+ 右 article-card__image（对照 split-asset-image）
   两个独立圆角卡片并排，不是包在一个大容器里
   ================================================================ */

.article-card {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  text-decoration: none;
  color: inherit;
  position: relative;
}

/* 左侧文字卡片 — 对照 m3 .primary-container */
.article-card__text {
  display: flex;
  border-radius: 24px;
  background: var(--md-sys-color-surface-container-low, #f7f2fa);
  padding: 32px;
  min-height: 200px;
  position: relative;
  overflow: hidden;
  transition: background-color 0.2s;
}

/* 右侧图片卡片 — 对照 m3 .split-asset-image */
.article-card__image {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24px;
  overflow: hidden;
  min-height: 200px;
  background-size: cover;
  background-position: center;
  position: relative;
}

.article-icon {
  font-size: 56px;
  color: var(--md-sys-color-on-primary-container, #21005d);
  opacity: 0.4;
}

/* article-card hover state layer — 两侧各自独立 */
.article-card__text::after,
.article-card__image::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 24px;
  background-color: var(--md-sys-color-on-surface, #1c1b1f);
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
  z-index: 1;
}

.article-card:hover .article-card__text::after,
.article-card:hover .article-card__image::after {
  opacity: 0.08;
}

.article-card:active .article-card__text::after,
.article-card:active .article-card__image::after {
  opacity: 0.12;
}

/* ================================================================
   Article card 内部文字
   对照 m3 .content-container: grid, gap 8px
   ================================================================ */

.article-card__text .wrapper .date {
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
}

.article-card__text .wrapper .card-title {
  font-size: 24px;
  font-weight: 500;
  line-height: 32px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

.article-card__text .wrapper .card-desc {
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ================================================================
   Hero header 内部文字（更大字号）
   ================================================================ */

.mio-header .wrapper .date {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  line-height: 24px;
}

.mio-header .wrapper .title h1 {
  font-size: 57px;
  font-weight: 400;
  line-height: 64px;
  letter-spacing: -0.25px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0 0 16px;
}

.mio-header .wrapper .description {
  font-size: 18px;
  font-weight: 400;
  line-height: 28px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
}

@media screen and (max-width: 1294px) {
  .mio-header .wrapper .title h1 {
    font-size: 40px;
    line-height: 48px;
  }
}

@media screen and (max-width: 600px) {
  .mio-header .wrapper .title h1 {
    font-size: 32px;
    line-height: 40px;
  }
  .mio-header .wrapper .description {
    font-size: 16px;
    line-height: 24px;
  }
}

/* ================================================================
   响应式：文章卡片在窄屏变为单列堆叠
   ================================================================ */

@media screen and (max-width: 840px) {
  .article-card {
    grid-template-columns: 1fr;
  }

  .article-card__text {
    min-height: unset;
    padding: 24px;
  }

  /* 移动端图片在上、文字在下（视觉顺序反转） */
  .article-card__image {
    order: -1;
    min-height: 160px;
  }

  .article-card__text .wrapper .card-title {
    font-size: 18px;
    line-height: 24px;
  }

  .article-card__text .wrapper .card-desc {
    font-size: 14px;
    line-height: 20px;
  }
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

:global([data-theme="dark"]) .article-card__text {
  background: var(--md-sys-color-surface-container-low, #1d1b20);
}

:global([data-theme="dark"]) .article-card__text::after,
:global([data-theme="dark"]) .article-card__image::after {
  background-color: var(--md-sys-color-on-surface, #e6e1e5);
}

:global([data-theme="dark"]) .article-icon {
  color: var(--md-sys-color-on-primary-container, #eaddff);
}
</style>
