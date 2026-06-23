<template>
  <div class="editorial">
    <!-- ======== mio-header（对照 m3: header.split-asset, grid 1fr 1fr, gap 8px） ======== -->
    <header class="mio-header">
      <div class="primary-container">
        <div class="wrapper">
          <div class="title">
            <h1>Kernel's Blog</h1>
            <div class="description">探索技术，记录生活。一个遵循 Material Design 3 规范的个人博客。</div>
          </div>
        </div>
      </div>
      <div class="split-asset-image">
        <div class="split-asset-image__foreground"></div>
      </div>
    </header>

    <!-- ======== content-container（对照 m3: flex row-reverse, TOC右 + posts左） ======== -->
    <div class="content-container">
      <!-- TOC 目录（对照 m3: mio-toc > nav, sticky, 156px宽） -->
      <aside class="toc">
        <nav>
          <div class="toc__overline">On this page</div>
          <h2 class="toc__title">Kernel's Blog</h2>
          <div class="toc__indicator"></div>
          <ul class="toc__list">
            <li
              v-for="(section, i) in sections"
              :key="i"
              class="toc__item"
              :class="{ 'toc__item--active': activeSection === i }"
            >
              <a
                :href="'#section-' + i"
                class="toc__link"
                @click.prevent="scrollToSection(i)"
              >{{ section.label }}</a>
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
          class="section"
        >
          <!-- section-header（对照 m3: div.section-header, margin 24px） -->
          <div class="section-header">
            <h2 :class="si === 0 ? '' : 'sub-heading'">{{ section.label }}</h2>
          </div>

          <!-- card-set（对照 m3: mio-card-set, grid, gap 8px） -->
          <div class="card-set">
            <!-- feature-block 长卡（对照 m3: mio-card.feature-block > a.thumbnail, grid 1fr 1fr） -->
            <a
              v-if="section.feature"
              :href="section.feature.route"
              class="feature-card thumbnail"
              @mousedown="onCardClick"
            >
              <div class="content-container">
                <span v-if="section.feature.date" class="date">{{ formatDate(section.feature.date) }}</span>
                <span class="mio-title-row">
                  <span class="title">{{ section.feature.title }}</span>
                </span>
                <span class="description">{{ section.feature.excerpt }}</span>
              </div>
              <div class="thumb-container" :style="{ background: gradient(section.feature.id) }">
                <span class="material-symbols-rounded thumb-icon">{{ section.feature.icon || 'article' }}</span>
              </div>
              <div class="ripple"></div>
            </a>

            <!-- 中卡片（对照 m3: mio-card > a.thumbnail, inline-flex column-reverse） -->
            <a
              v-for="post in section.items"
              :key="post.id"
              :href="post.route"
              class="regular-card thumbnail"
              @mousedown="onCardClick"
            >
              <div class="content-container">
                <span v-if="post.date" class="date">{{ formatDate(post.date) }}</span>
                <span class="mio-title-row">
                  <span class="title">{{ post.title }}</span>
                </span>
                <span v-if="post.excerpt" class="description">{{ post.excerpt }}</span>
              </div>
              <div class="thumb-container" :style="{ background: gradient(post.id + 10) }">
                <span class="material-symbols-rounded thumb-icon">{{ post.icon || 'article' }}</span>
              </div>
              <div class="ripple"></div>
            </a>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const activeSection = ref(0)

function scrollToSection(i) {
  activeSection.value = i
  const el = document.getElementById('section-' + i)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Ripple: 记录点击位置，触发涟漪动画（对照 m3: <div class="ripple">）
function onCardClick(e) {
  const card = e.currentTarget
  const rect = card.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  card.style.setProperty('--ripple-x', x + 'px')
  card.style.setProperty('--ripple-y', y + 'px')
  // 触发 ripple 动画：先移除再添加，确保可重复触发
  const ripple = card.querySelector('.ripple')
  if (ripple) {
    ripple.classList.remove('ripple--active')
    // 强制 reflow
    void ripple.offsetWidth
    ripple.classList.add('ripple--active')
  }
}

const sections = ref([
  {
    label: 'Featured',
    feature: {
      id: 1,
      title: 'Vue 3 Composition API 实战指南',
      excerpt: '深入理解 setup 语法、响应式原理与组合式函数的设计模式。',
      date: '2026-06-18',
      icon: 'code',
      route: '/blog/tech',
    },
    items: [
      {
        id: 2,
        title: 'Material Design 3 主题系统解析',
        excerpt: '从 HCT 色彩空间到动态配色，了解 Google 最新设计语言的色彩体系。',
        date: '2026-06-12',
        icon: 'palette',
        route: '/blog/tech',
      },
      {
        id: 3,
        title: '我的 2026 上半年阅读清单',
        excerpt: '分享上半年读过的几本好书，涵盖技术、设计和思维方式。',
        date: '2026-06-05',
        icon: 'menu_book',
        route: '/blog/life',
      },
    ],
  },
  {
    label: 'Projects',
    items: [
      {
        id: 4,
        title: "Kernel's Blog",
        excerpt: '基于 Vue 3 + Material Web 的个人博客站点，严格遵循 M3 规范。',
        icon: 'web',
        route: '/projects/web',
      },
      {
        id: 5,
        title: '数据可视化工具集',
        excerpt: '面向电信行业的数据抓取、清洗与可视化展示工具。',
        icon: 'analytics',
        route: '/projects/tools',
      },
    ],
  },
  {
    label: '2026',
    items: [
      {
        id: 6,
        title: '考核题库管理平台',
        excerpt: '客户经理培训考核系统，支持题目录入、组卷与成绩统计。',
        date: '2026-03-15',
        icon: 'school',
        route: '/projects/web',
      },
    ],
  },
])

const gradients = [
  'linear-gradient(135deg, var(--md-sys-color-primary-container, #eaddff) 0%, var(--md-sys-color-secondary-container, #e8def8) 50%, var(--md-sys-color-tertiary-container, #ffd8e4) 100%)',
  'linear-gradient(135deg, var(--md-sys-color-secondary-container, #e8def8) 0%, var(--md-sys-color-tertiary-container, #ffd8e4) 50%, var(--md-sys-color-primary-container, #eaddff) 100%)',
  'linear-gradient(135deg, var(--md-sys-color-tertiary-container, #ffd8e4) 0%, var(--md-sys-color-primary-container, #eaddff) 50%, var(--md-sys-color-secondary-container, #e8def8) 100%)',
  'linear-gradient(135deg, var(--md-sys-color-primary-container, #eaddff) 30%, var(--md-sys-color-surface-container-high, #ece6f0) 100%)',
]

function gradient(id) {
  return gradients[id % gradients.length]
}

// 日期格式化（对照 m3: "Jun 18, 2026"）
function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr // 不是合法日期则原样返回
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
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
    font-weight: 400;
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

.toc__indicator {
  width: 156px;
  height: 36px;
  border-radius: 18px;
  background: transparent;
  margin: 0;
  position: absolute;
  z-index: -1;
  transition: transform 300ms cubic-bezier(0.2, 0, 0, 1), background-color 200ms cubic-bezier(0.2, 0, 0, 1);
}

.toc__list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc__item {
  display: flex;
  padding: 8px 16px;
  border-radius: 18px;
  cursor: pointer;
  transition: background-color 200ms cubic-bezier(0.2, 0, 0, 1);
}

.toc__item:hover {
  background: var(--md-sys-color-surface-variant, #e8e0e8);
}

.toc__item--active {
  background: var(--md-sys-color-secondary-container, #e8def8);
}

.toc__link {
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: var(--md-sys-color-on-surface-variant, #4d4256);
  text-decoration: none;
  border-radius: 4px;
}

.toc__item--active .toc__link {
  color: var(--md-sys-color-on-secondary-container, #1d192b);
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
.card-set {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 0 8px;
  margin: 32px 0 0;
}

@media screen and (max-width: 1294px) {
  .card-set {
    grid-template-columns: 1fr;
  }
}

@media screen and (max-width: 600px) {
  .card-set {
    grid-template-columns: 1fr;
  }
}

/* ================================================================
    卡片通用 — thumbnail 容器（对照 m3: a.thumbnail）
    border-radius 24px, bg surface-container, overflow hidden, position relative
    hover: backgroundColor 用 primary 8% 混合
    pressed: border-radius 24px→40px, backgroundColor 用 primary 12% 混合, ripple
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

/* hover: primary 8% 混合到 surface（对照 m3: backgroundColor 变为 primary 色 state-layer） */
.thumbnail:hover {
  background-color: color-mix(in srgb, var(--md-sys-color-primary, #6750a4) 8%, var(--md-sys-color-surface-container-low, #f8f1f6));
}

/* pressed: border-radius 变大 + primary 12% 混合 */
.thumbnail:active {
  border-radius: 40px;
  background-color: color-mix(in srgb, var(--md-sys-color-primary, #6750a4) 12%, var(--md-sys-color-surface-container-low, #f8f1f6));
}

/* feature-card / regular-card 的 hover/active 需要同等的 specificity 来覆盖各自的基础 bg */
.feature-card.thumbnail:hover,
.regular-card.thumbnail:hover {
  background-color: color-mix(in srgb, var(--md-sys-color-primary, #6750a4) 8%, var(--md-sys-color-surface-container-low, #f8f1f6));
}

.feature-card.thumbnail:active,
.regular-card.thumbnail:active {
  border-radius: 40px;
  background-color: color-mix(in srgb, var(--md-sys-color-primary, #6750a4) 12%, var(--md-sys-color-surface-container-low, #f8f1f6));
}

/* ripple 涟漪动效（对照 m3: <div class="ripple"> 真实 DOM 元素） */
.thumbnail > .ripple {
  position: absolute;
  left: var(--ripple-x, 50%);
  top: var(--ripple-y, 50%);
  width: 0;
  height: 0;
  border-radius: 50%;
  background-color: var(--md-sys-color-primary, #6750a4);
  opacity: 0;
  pointer-events: none;
  overflow: visible;
  transform: translate(-50%, -50%);
}

/* pressed 时触发 ripple（从点击位置扩散） */
.thumbnail:active > .ripple,
.thumbnail > .ripple.ripple--active {
  animation: ripple-expand 0.4s cubic-bezier(0.2, 0, 0, 1) forwards;
}

@keyframes ripple-expand {
  0% {
    width: 0;
    height: 0;
    opacity: 0.1;
  }
  100% {
    width: 400px;
    height: 400px;
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
  z-index: auto;
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

/* feature-card 窄屏：inline-flex column-reverse（对照 m3 @ ≤1294px） */
@media screen and (max-width: 1294px) {
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

:global([data-theme="dark"]) .thumbnail:hover,
:global([data-theme="dark"]) .feature-card.thumbnail:hover,
:global([data-theme="dark"]) .regular-card.thumbnail:hover {
  background-color: color-mix(in srgb, var(--md-sys-color-primary, #d0bcff) 8%, var(--md-sys-color-surface-container-low, #1d1b20));
}

:global([data-theme="dark"]) .thumbnail:active,
:global([data-theme="dark"]) .feature-card.thumbnail:active,
:global([data-theme="dark"]) .regular-card.thumbnail:active {
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

:global([data-theme="dark"]) .toc__item--active {
  background: var(--md-sys-color-secondary-container, #4a4458);
}

:global([data-theme="dark"]) .toc__item:hover {
  background: var(--md-sys-color-surface-variant, #49454f);
}

:global([data-theme="dark"]) .toc__item--active .toc__link {
  color: var(--md-sys-color-on-secondary-container, #e8def8);
}
</style>
