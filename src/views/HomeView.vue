<template>
  <div class="home-view">
    <article class="home-article">
      <h1 class="home-article__title">Welcome to M3 Blog</h1>
      <p class="home-article__subtitle">一个基于 Vue 3 + Material Web 的个人博客</p>

      <md-divider></md-divider>

      <section class="home-article__section">
        <h2>关于本项目</h2>
        <p>
          M3 Blog 是一个使用 <strong>Vue 3</strong> 和
          <strong>@material/web</strong> 构建的现代个人博客站点。
          严格遵循 <strong>Material Design 3</strong> 设计规范，
          提供精致的视觉体验和流畅的交互反馈。
        </p>
      </section>

      <section class="home-article__section">
        <h2>技术特点</h2>
        <ul>
          <li><strong>Vue 3 Composition API</strong> — 使用 &lt;script setup&gt; 语法，简洁高效</li>
          <li><strong>Material Web Components</strong> — Google 官方 Web Components 组件库</li>
          <li><strong>M3 主题系统</strong> — 支持 6 种色彩方案 + 浅色/深色/跟随系统</li>
          <li><strong>Vite 构建</strong> — 极速的开发体验和优化的生产构建</li>
          <li><strong>响应式布局</strong> — 自适应桌面端和移动端</li>
        </ul>
      </section>

      <section class="home-article__section">
        <h2>主题切换</h2>
        <p>
          点击右上角的调色板图标，即可选择喜欢的色彩方案和明暗模式。
          你的偏好会自动保存到本地，下次访问时自动恢复。
        </p>
      </section>

      <section class="home-article__section">
        <h2>项目状态</h2>
        <p>
          本站仍在建设中，各子页面将逐步完善。欢迎通过顶部 GitHub 图标访问源码仓库，关注开发进展。
        </p>
      </section>
    </article>
  </div>
</template>

<script setup>
// 首页 — 项目介绍
</script>

<style scoped>
.home-view {
  display: flex;
  justify-content: center;
}

.home-article {
  max-width: 720px;
  width: 100%;
}

.home-article__title {
  font-size: 32px;
  font-weight: 400;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  line-height: 40px;
  margin-bottom: 8px;
}

.home-article__subtitle {
  font-size: 16px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  line-height: 24px;
  margin-bottom: 24px;
}

.home-article__section {
  margin-top: 24px;
}

.home-article__section h2 {
  font-size: 22px;
  font-weight: 400;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  line-height: 28px;
  margin-bottom: 12px;
}

.home-article__section p {
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  line-height: 22px;
}

.home-article__section ul {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.home-article__section li {
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  line-height: 22px;
  padding: 12px 16px;
  border-radius: 12px;
  background-color: var(--md-sys-color-surface-container, #f3edf7);
}

.home-article__section li strong {
  color: var(--md-sys-color-on-surface, #1c1b1f);
}
</style>
