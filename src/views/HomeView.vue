<template>
  <div class="home-view">
    <!-- Hero 区域（对照 m3 mio-header split-asset 布局） -->
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
        <h2 class="title">最近文章</h2>
      </div>

      <!-- Feature card（横排：文字左 + 图片右） -->
      <router-link
        v-if="recentPosts.length"
        :to="recentPosts[0].route"
        class="card card--feature thumbnail"
      >
        <div class="content-container">
          <span class="date">{{ recentPosts[0].date }}</span>
          <span class="card-title">{{ recentPosts[0].title }}</span>
          <span class="card-desc">{{ recentPosts[0].excerpt }}</span>
        </div>
        <div class="thumb-container" :style="{ background: thumbGradient(0) }"></div>
      </router-link>

      <!-- Regular cards（竖排：图片上 + 文字下） -->
      <div class="card-set">
        <router-link
          v-for="post in recentPosts.slice(1)"
          :key="post.id"
          :to="post.route"
          class="card thumbnail"
        >
          <div class="content-container">
            <span class="date">{{ post.date }}</span>
            <span class="card-title">{{ post.title }}</span>
            <span class="card-desc">{{ post.excerpt }}</span>
          </div>
          <div class="thumb-container" :style="{ background: thumbGradient(post.id) }"></div>
        </router-link>
      </div>
    </section>

    <!-- 精选项目 -->
    <section class="section">
      <div class="section-header">
        <span class="overline">PROJECTS</span>
        <h2 class="title">精选项目</h2>
      </div>

      <div class="card-set">
        <router-link
          v-for="project in featuredProjects"
          :key="project.id"
          :to="project.route"
          class="card thumbnail"
        >
          <div class="content-container">
            <span class="date">{{ project.tags.join(' · ') }}</span>
            <span class="card-title">{{ project.title }}</span>
            <span class="card-desc">{{ project.excerpt }}</span>
          </div>
          <div class="thumb-container" :style="{ background: thumbGradient(project.id + 10) }">
            <span class="material-symbols-rounded thumb-icon">{{ project.icon }}</span>
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

// 为占位卡片生成不同色调的渐变背景
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
   ================================================================ */

.mio-header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 24px;
  margin-bottom: 56px;
}

@media screen and (max-width: 1294px) {
  .mio-header {
    grid-template-columns: 1fr;
    margin-bottom: 40px;
  }
}

/* primary-container */
.primary-container {
  display: flex;
  margin: 0;
  padding: 56px;
  border-radius: 24px;
  background: var(--md-sys-color-surface-container-low, #f7f2fa);
  min-height: 544px;
  grid-column: span 1;
}

@media screen and (max-width: 1294px) {
  .primary-container {
    min-height: unset;
    grid-column: span 2;
    padding: 40px 24px;
  }
}

/* wrapper */
.wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 840px;
  margin: 0;
}

.wrapper .date {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  line-height: 24px;
}

.wrapper .title h1 {
  font-size: 57px;
  font-weight: 400;
  line-height: 64px;
  letter-spacing: -0.25px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0 0 16px;
}

@media screen and (max-width: 1294px) {
  .wrapper .title h1 {
    font-size: 40px;
    line-height: 48px;
  }
}

@media screen and (max-width: 600px) {
  .wrapper .title h1 {
    font-size: 32px;
    line-height: 40px;
  }
}

.wrapper .description {
  font-size: 18px;
  font-weight: 400;
  line-height: 28px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
}

@media screen and (max-width: 600px) {
  .wrapper .description {
    font-size: 16px;
    line-height: 24px;
  }
}

/* split-asset-image */
.split-asset-image {
  display: flex;
  position: relative;
  justify-content: center;
  border: 1px solid var(--md-sys-color-surface-variant, #cac4d0);
  border-radius: 24px;
  overflow: hidden;
  min-height: 544px;
  grid-column: span 1;
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

@media screen and (max-width: 1294px) {
  .split-asset-image {
    min-height: unset;
    padding-bottom: 50%;
    grid-column: span 2;
  }
  .split-asset-image__foreground {
    position: absolute;
    inset: 0;
  }
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

.section-header .title {
  font-size: 32px;
  font-weight: 400;
  line-height: 40px;
  letter-spacing: 0;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0;
}

@media screen and (max-width: 600px) {
  .section-header .title {
    font-size: 24px;
    line-height: 32px;
  }
}

/* ================================================================
   Card — 通用（对照 m3 mio-card a.thumbnail）
   m3 使用 <a.thumbnail> 作为卡片容器，border-radius 24px，
   内部 content-container + thumb-container
   ================================================================ */

.card.thumbnail {
  position: relative;
  border-radius: 24px;
  background-color: var(--md-sys-color-surface-container, #f3edf7);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  text-decoration: none;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s cubic-bezier(0.2, 0, 0, 1);
}

.card.thumbnail:hover {
  box-shadow: var(--md-sys-elevation-2, 0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15));
}

/* State layer（覆盖在整张卡片上） */
.card.thumbnail::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 24px;
  background-color: var(--md-sys-color-on-surface, #1c1b1f);
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
  z-index: 2;
}

.card.thumbnail:hover::after {
  opacity: 0.08;
}

.card.thumbnail:active::after {
  opacity: 0.12;
}

/* ================================================================
   content-container（对照 m3 .content-container）
   m3: display grid, gap 8px, margin 24px (feature), padding (regular)
   ================================================================ */

.content-container {
  display: grid;
  gap: 8px;
  position: relative;
  z-index: 1;
}

.content-container .date {
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
}

.content-container .card-title {
  font-size: 24px;
  font-weight: 500;
  line-height: 32px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

@media screen and (max-width: 600px) {
  .content-container .card-title {
    font-size: 18px;
    line-height: 24px;
  }
}

.content-container .card-desc {
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media screen and (max-width: 600px) {
  .content-container .card-desc {
    font-size: 14px;
    line-height: 20px;
  }
}

/* ================================================================
   thumb-container（对照 m3 mio-thumbnail .thumb-container）
   ================================================================ */

.thumb-container {
  border-radius: 24px;
  background-size: cover;
  background-position: center;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 项目卡片中的覆盖图标 */
.thumb-icon {
  font-size: 64px;
  color: var(--md-sys-color-on-primary-container, #21005d);
  opacity: 0.5;
  z-index: 1;
}

/* ================================================================
   Feature card（对照 m3 mio-card.feature-block）
   桌面端：grid 1fr 1fr 横排（文字左 + 图片右）
   移动端：inline-flex column-reverse 竖排（图片上 + 文字下）
   ================================================================ */

.card--feature.thumbnail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin-bottom: 24px;
}

.card--feature.thumbnail .content-container {
  margin: 24px;
  align-self: center;
}

.card--feature.thumbnail .thumb-container {
  min-height: 298px;
}

@media screen and (max-width: 840px) {
  .card--feature.thumbnail {
    display: inline-flex;
    flex-direction: column-reverse;
  }

  .card--feature.thumbnail .content-container {
    margin: 0;
    padding: 24px;
  }

  .card--feature.thumbnail .thumb-container {
    min-height: 200px;
    border-radius: 24px 24px 0 0;
  }
}

/* ================================================================
   Regular card（对照 m3 mio-card a.thumbnail column-reverse）
   竖排：图片上 + 文字下
   ================================================================ */

.card-set {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.card-set .card.thumbnail {
  display: inline-flex;
  flex-direction: column-reverse;
}

.card-set .card.thumbnail .content-container {
  padding: 24px;
}

.card-set .card.thumbnail .thumb-container {
  min-height: 200px;
  border-radius: 24px 24px 0 0;
}

@media screen and (max-width: 840px) {
  .card-set {
    grid-template-columns: 1fr;
  }
}

/* ================================================================
   暗色主题
   ================================================================ */

:global([data-theme="dark"]) .primary-container {
  background: var(--md-sys-color-surface-container-low, #1d1b20);
}

:global([data-theme="dark"]) .split-asset-image {
  border-color: var(--md-sys-color-surface-variant, #49454f);
}

:global([data-theme="dark"]) .split-asset-image__foreground {
  background: linear-gradient(
    135deg,
    var(--md-sys-color-primary-container, #21005d) 0%,
    var(--md-sys-color-secondary-container, #4a4458) 50%,
    var(--md-sys-color-tertiary-container, #633b48) 100%
  );
}

:global([data-theme="dark"]) .card.thumbnail {
  background-color: var(--md-sys-color-surface-container, #211f26);
}

:global([data-theme="dark"]) .card.thumbnail::after {
  background-color: var(--md-sys-color-on-surface, #e6e1e5);
}

:global([data-theme="dark"]) .thumb-icon {
  color: var(--md-sys-color-on-primary-container, #eaddff);
}
</style>
