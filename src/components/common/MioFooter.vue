<template>
  <!-- ======== Footer（对照 m3.material.io mio-footer 结构，在 main 内部随内容滚动） ======== -->
  <div class="mio-footer" :data-theme-squiggle="isDark ? 'dark' : 'light'">
    <div class="squiggle" aria-hidden="true">
      <!-- 亮色 squiggle（M3 官方 stroke: #E1E3E1） -->
      <svg v-if="!isDark" width="100%" height="8" overflow="visible" fill="none" xmlns="http://www.w3.org/2000/svg">
        <pattern id="squiggle-pattern" width="91" height="8" patternUnits="userSpaceOnUse">
          <path d="M114 4c-5.067 4.667-10.133 4.667-15.2 0S88.667-.667 83.6 4 73.467 8.667 68.4 4 58.267-.667 53.2 4 43.067 8.667 38 4 27.867-.667 22.8 4 12.667 8.667 7.6 4-2.533-.667-7.6 4s-10.133 4.667-15.2 0S-32.933-.667-38 4s-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0" stroke="#E1E3E1" stroke-linecap="square" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#squiggle-pattern)" />
      </svg>
      <!-- 暗色 squiggle（M3 官方 stroke: #49454f） -->
      <svg v-else width="100%" height="8" overflow="visible" fill="none" xmlns="http://www.w3.org/2000/svg">
        <pattern id="squiggle-pattern" width="91" height="8" patternUnits="userSpaceOnUse">
          <path d="M114 4c-5.067 4.667-10.133 4.667-15.2 0S88.667-.667 83.6 4 73.467 8.667 68.4 4 58.267-.667 53.2 4 43.067 8.667 38 4 27.867-.667 22.8 4 12.667 8.667 7.6 4-2.533-.667-7.6 4s-10.133 4.667-15.2 0S-32.933-.667-38 4s-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0" stroke="#49454f" stroke-linecap="square" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#squiggle-pattern)" />
      </svg>
    </div>
    <footer class="mio-footer-inner">
      <section class="about">
        <div class="about-material">
          <a class="about-logo" @click.prevent="$router.push('/')" aria-label="Kernel's Blog">
            <span class="material-symbols-rounded">edit_note</span>
          </a>
          <p>Kernel's Blog 是基于 Vue 3 + Material Web 的个人博客站点，严格遵循 Material Design 3 规范。探索技术，记录生活。</p>
        </div>
        <ul class="social-links">
          <li><h3>Social</h3></li>
          <li><a href="https://github.com/BJY-STUDIO/myprofile" target="_blank" rel="noopener">GitHub</a></li>
        </ul>
        <ul class="site-links">
          <li><h3>Site</h3></li>
          <li><a @click.prevent="$router.push('/')">首页</a></li>
          <li><a @click.prevent="$router.push('/blog')">博客</a></li>
          <li><a @click.prevent="$router.push('/projects')">项目</a></li>
          <li><a @click.prevent="$router.push('/about')">关于</a></li>
          <li><a @click.prevent="$router.push('/contact')">联系</a></li>
        </ul>
      </section>
      <section class="legal">
        <div class="brand-logo" @click.prevent="$router.push('/')" aria-label="Kernel's Blog">
          <span class="brand-logo-text">BJY-STUDIO</span>
        </div>
        <ul>
          <li><a href="https://github.com/BJY-STUDIO/myprofile" target="_blank" rel="noopener">GitHub</a></li>
          <li><a @click.prevent="$router.push('/about')">关于</a></li>
        </ul>
      </section>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// ======== 主题状态（用于 squiggle 颜色切换） ========
const isDark = ref(document.documentElement.getAttribute('data-theme') === 'dark')

function updateThemeState() {
  isDark.value = document.documentElement.getAttribute('data-theme') === 'dark'
}

let observer = null

onMounted(() => {
  observer = new MutationObserver(updateThemeState)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>

<style scoped>
/* ================================================================
   Footer（对照 m3.material.io footer 结构）
   mio-footer (外层 wrapper): margin-top 120px, position static
   mio-footer-inner (footer): padding 64px 40px, 无背景色
   section.about: grid, max-width 1200px, 3列, gap 20px, justify-content: space-between
   section.legal: margin-top 64px, flex row, logo + 法律链接
   ================================================================ */
.mio-footer {
  margin-top: 120px;
}

/* squiggle（对照 m3: SVG pattern 方案，亮暗色通过 v-if 切换）
   M3 官方使用内联 SVG + <pattern> 实现无缝波浪线 */
.mio-footer .squiggle {
  position: relative;
}

.mio-footer .squiggle svg {
  display: block;
}

/* ── Footer 内层容器 ── 对照 m3: max-width 1280px 居中, padding 64px 40px */
.mio-footer-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 64px 40px;
  font-family: 'Google Sans Text', 'Google Sans', 'Noto Sans SC', sans-serif;
  box-sizing: border-box;
}

/* section.about — 对照 m3: grid, max-width 1200px, justify-content: space-between */
.mio-footer-inner .about {
  display: grid;
  grid-template-columns: auto;
  gap: 0 20px;
  justify-content: space-between;
}

@media screen and (min-width: 960px) {
  .mio-footer-inner .about {
    grid-template-columns: 570px 190px 190px;
    max-width: 1200px;
  }
}

/* about-material — 对照 m3: logo (Google Symbols 40px) + description */
.about-material {
  display: block;
}

.about-material .about-logo {
  display: flex;
  cursor: pointer;
  padding: 1px;
  width: max-content;
}

.about-material .about-logo .material-symbols-rounded {
  font-size: 40px;
  line-height: 40px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

.about-material p {
  font-family: 'Google Sans Text', 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 24px 64px 16px 0;
}

/* social-links / site-links — 对照 m3: ul, flex column, gap 20px, margin-top 24px */
/* h3 在第一个 li 中，与下方链接左对齐（同列） */
.mio-footer-inner .social-links,
.mio-footer-inner .site-links {
  display: flex;
  flex-direction: column;
  gap: 20px;
  list-style: none;
  padding: 0;
  margin: 24px 0 0;
}

.mio-footer-inner .social-links h3,
.mio-footer-inner .site-links h3 {
  font-family: 'Google Sans Text', 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  margin: 0;
  color: var(--md-sys-color-on-surface-variant, #49454f);
}

.mio-footer-inner .social-links li,
.mio-footer-inner .site-links li {
  padding: 0;
  margin: 0;
}

.mio-footer-inner .social-links li a,
.mio-footer-inner .site-links li a {
  font-family: 'Google Sans Text', 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  color: var(--md-sys-color-primary, #6750a4);
  text-decoration: underline !important;
  cursor: pointer;
  display: inline-flex;
  padding: 1px;
}

/* section.legal — 对照 m3: margin-top 64px, flex row, brand logo + 链接, max-width 1200px */
.mio-footer-inner .legal {
  display: flex;
  align-items: center;
  margin: 64px 0 0;
  max-width: 1200px;
}

.mio-footer-inner .legal .brand-logo {
  display: block;
  cursor: pointer;
  margin-right: 32px;
  flex-shrink: 0;
}

.mio-footer-inner .legal .brand-logo-text {
  font-family: 'Google Sans Text', 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  letter-spacing: 0.5px;
}

.mio-footer-inner .legal ul {
  display: flex;
  flex-direction: row;
  gap: 16px 24px;
  list-style: none;
  padding: 0;
  margin: 0;
  flex-wrap: wrap;
}

.mio-footer-inner .legal li {
  margin: 0;
  padding: 0;
}

.mio-footer-inner .legal li a {
  font-family: 'Google Sans Text', 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  color: var(--md-sys-color-primary, #6750a4);
  text-decoration: none !important;
  cursor: pointer;
  display: inline;
  padding: 1px;
}

/* ── 平板端 601-960px ── 对照 M3: footer padding 32px, about 3-col, about-material span 3 */
@media screen and (max-width: 960px) and (min-width: 601px) {
  .mio-footer-inner {
    padding: 64px 32px;
  }

  .mio-footer-inner .about {
    grid-template-columns: 1fr 1fr 1fr;
  }

  .about-material {
    grid-column: span 3;
  }

  .about-material p {
    margin-right: 0;
  }
}

/* ── 移动端 ≤600px ── 对照 M3: footer padding 24px, about 1-col, legal column, ul gap 24px */
@media screen and (max-width: 600px) {
  .mio-footer-inner {
    padding: 64px 24px;
  }

  .mio-footer-inner .about {
    grid-template-columns: 1fr;
  }

  .about-material p {
    margin-right: 0;
  }

  .mio-footer-inner .social-links,
  .mio-footer-inner .site-links {
    row-gap: 24px;
  }

  .mio-footer-inner .legal {
    flex-direction: column;
    align-items: flex-start;
  }

  .mio-footer-inner .legal ul {
    margin-top: 24px;
  }
}

/* ================================================================
   暗色主题
   ================================================================ */
:global([data-theme="dark"] .about-material .about-logo .material-symbols-rounded),
:global([data-theme="dark"] .mio-footer-inner .legal .brand-logo-text) {
  color: var(--md-sys-color-on-surface, #e6e1e5);
}

:global([data-theme="dark"] .mio-footer-inner .social-links h3),
:global([data-theme="dark"] .mio-footer-inner .site-links h3) {
  color: var(--md-sys-color-on-surface, #e6e1e5);
}
</style>
