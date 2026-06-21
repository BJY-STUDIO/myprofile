<template>
  <div class="home-view">
    <!-- Hero 区域 -->
    <section class="hero">
      <div class="hero__content">
        <h1 class="hero__title">Kernel's Blog</h1>
        <p class="hero__subtitle">探索技术，记录生活</p>
      </div>
    </section>

    <!-- 最近文章 -->
    <section class="section">
      <div class="section__header">
        <h2 class="section__title">最近文章</h2>
        <router-link to="/blog" class="section__link">
          查看全部
          <span class="material-symbols-rounded">arrow_forward</span>
        </router-link>
      </div>
      <div class="card-row">
        <router-link
          v-for="post in recentPosts"
          :key="post.id"
          :to="post.route"
          class="card card--blog"
        >
          <div class="card__badge">{{ post.category }}</div>
          <h3 class="card__title">{{ post.title }}</h3>
          <p class="card__desc">{{ post.excerpt }}</p>
          <span class="card__meta">{{ post.date }}</span>
        </router-link>
      </div>
    </section>

    <!-- 精选项目 -->
    <section class="section">
      <div class="section__header">
        <h2 class="section__title">精选项目</h2>
        <router-link to="/projects" class="section__link">
          查看全部
          <span class="material-symbols-rounded">arrow_forward</span>
        </router-link>
      </div>
      <div class="card-row">
        <router-link
          v-for="project in featuredProjects"
          :key="project.id"
          :to="project.route"
          class="card card--project"
        >
          <span class="material-symbols-rounded card__icon">{{ project.icon }}</span>
          <h3 class="card__title">{{ project.title }}</h3>
          <p class="card__desc">{{ project.excerpt }}</p>
          <div class="card__tags">
            <span v-for="tag in project.tags" :key="tag" class="card__tag">{{ tag }}</span>
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
    title: 'Kernel\'s Blog',
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
</script>

<style scoped>
.home-view {
  max-width: 960px;
  width: 100%;
}

/* ======== Hero ======== */
.hero {
  padding: 48px 0 40px;
}

.hero__title {
  font-size: 40px;
  font-weight: 400;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  line-height: 48px;
  margin-bottom: 8px;
}

.hero__subtitle {
  font-size: 18px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  line-height: 28px;
}

/* ======== Section ======== */
.section {
  margin-top: 40px;
}

.section__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section__title {
  font-size: 22px;
  font-weight: 400;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  line-height: 28px;
}

.section__link {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 500;
  color: var(--md-sys-color-primary, #6750a4);
  text-decoration: none;
  border-radius: 20px;
  padding: 6px 12px;
  transition: background-color 0.2s;
}

.section__link:hover {
  background-color: color-mix(in srgb, var(--md-sys-color-primary, #6750a4) 8%, transparent);
}

.section__link .material-symbols-rounded {
  font-size: 18px;
  font-variation-settings: "FILL" 0, "wght" 400;
}

/* ======== Card Row ======== */
.card-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

/* ======== Card (M3 Filled Card 风格) ======== */
.card {
  display: flex;
  flex-direction: column;
  padding: 20px;
  border-radius: 12px;
  background-color: var(--md-sys-color-surface-container, #f3edf7);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  text-decoration: none;
  transition: box-shadow 0.2s cubic-bezier(0.2, 0, 0, 1),
              background-color 0.2s;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.card:hover {
  box-shadow: var(--md-sys-elevation-2, 0 1px 3px 1px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.3));
}

/* State layer */
.card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 12px;
  background-color: var(--md-sys-color-on-surface, #1c1b1f);
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.card:hover::after {
  opacity: 0.08;
}

.card:active::after {
  opacity: 0.12;
}

/* Blog card badge */
.card__badge {
  display: inline-flex;
  align-self: flex-start;
  padding: 2px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.5px;
  background-color: var(--md-sys-color-primary, #6750a4);
  color: var(--md-sys-color-on-primary, #ffffff);
  margin-bottom: 12px;
}

.card__icon {
  font-size: 32px;
  color: var(--md-sys-color-primary, #6750a4);
  margin-bottom: 12px;
}

.card__title {
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  margin-bottom: 8px;
  position: relative;
  z-index: 1;
}

.card__desc {
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  line-height: 20px;
  flex: 1;
  position: relative;
  z-index: 1;
}

.card__meta {
  font-size: 12px;
  color: var(--md-sys-color-outline, #79747e);
  margin-top: 12px;
  position: relative;
  z-index: 1;
}

.card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
  position: relative;
  z-index: 1;
}

.card__tag {
  padding: 2px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
  background-color: var(--md-sys-color-secondary-container, #e8def8);
  color: var(--md-sys-color-on-secondary-container, #1d192b);
}

/* ======== 暗色主题 ======== */
:global([data-theme="dark"]) .card {
  background-color: var(--md-sys-color-surface-container, #211f26);
}

:global([data-theme="dark"]) .card__badge {
  background-color: var(--md-sys-color-primary, #d0bcff);
  color: var(--md-sys-color-on-primary, #381e72);
}

:global([data-theme="dark"]) .card__tag {
  background-color: var(--md-sys-color-secondary-container, #4a4458);
  color: var(--md-sys-color-on-secondary-container, #e8def8);
}

:global([data-theme="dark"]) .card::after {
  background-color: var(--md-sys-color-on-surface, #e6e1e5);
}
</style>
