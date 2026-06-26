<template>
  <div class="article-content">
    <div class="block" id="v1-overview">
      <div class="copy-button-container focusable">
        <div class="material-symbols-rounded copy-button" role="button" tabindex="0" aria-label="copy link to v1 概览 section">link</div>
        <div class="copy-button-background"></div>
        <div class="tooltip">
          <span class="deactivated">Copy link</span>
          <span aria-live="polite" class="activated">Link copied</span>
        </div>
      </div>
      <div class="scroll-target"></div>
      <div class="text-chunk">
        <h2 class="linkable" tabindex="-1">v1 概览</h2>
      </div>
    </div>
    <p>
      Kernel's Blog v1 是项目的首个正式发布版本，实现了从零到完整博客站点的全部核心功能。
      本文记录了 v1 开发周期中的关键里程碑、遇到的问题以及最终的解决方案。
    </p>
    <p>
      项目的核心目标始终明确：<strong>严格遵循 Material Design 3 规范</strong>，
      使用 Google 官方的 <code>@material/web</code> Web Components 构建，
      不依赖任何第三方 M3 UI 框架。这一决策在带来规范一致性的同时，
      也意味着所有 M3 组件的集成细节都需要自行处理。
    </p>

    <div class="block" id="milestones">
      <div class="copy-button-container focusable">
        <div class="material-symbols-rounded copy-button" role="button" tabindex="0" aria-label="copy link to 关键里程碑 section">link</div>
        <div class="copy-button-background"></div>
        <div class="tooltip">
          <span class="deactivated">Copy link</span>
          <span aria-live="polite" class="activated">Link copied</span>
        </div>
      </div>
      <div class="scroll-target"></div>
      <div class="text-chunk">
        <h2 class="linkable" tabindex="-1">关键里程碑</h2>
      </div>
    </div>
    <ol>
      <li><strong>项目初始化</strong> — Vite + Vue 3 + @material/web 脚手架搭建，确立组件自包含原则</li>
      <li><strong>Navigation Rail</strong> — 80px M3 导航栏，指示器药丸动画，子面板浮动/常驻双模式</li>
      <li><strong>HCT 主题引擎</strong> — 基于色彩空间的动态主题系统，亮暗模式无缝切换</li>
      <li><strong>首页编辑式布局</strong> — TOC 侧栏 + 分区卡片，对照 m3.material.io 源码精确还原</li>
      <li><strong>文章页</strong> — M3 官方博客文章页完整复刻，含 Up Next 区域和 copy link 交互</li>
      <li><strong>Google Sans 字体</strong> — 25 片 @font-face 内联，完整 GRAD 轴响应</li>
      <li><strong>Google Sans Mono</strong> — 代码字体加载，code-snippet 15px/500 + inline code 16px/400</li>
      <li><strong>中文排版</strong> — 双轨方案（GRAD + font-weight 插值），M3 官方 ol/ul 列表样式</li>
      <li><strong>Footer 对齐</strong> — 参照 M3 官方 grid 布局，所有元素边缘对齐一致</li>
      <li><strong>卡片状态层</strong> — hover/pressed/focused 三态，精确匹配 M3 的 state layer 透明度</li>
    </ol>

    <div class="block" id="key-fixes">
      <div class="copy-button-container focusable">
        <div class="material-symbols-rounded copy-button" role="button" tabindex="0" aria-label="copy link to 关键修复 section">link</div>
        <div class="copy-button-background"></div>
        <div class="tooltip">
          <span class="deactivated">Copy link</span>
          <span aria-live="polite" class="activated">Link copied</span>
        </div>
      </div>
      <div class="scroll-target"></div>
      <div class="text-chunk">
        <h2 class="linkable" tabindex="-1">关键修复</h2>
      </div>
    </div>

    <h3 id="toc-indicator">TOC Indicator 闪烁</h3>
    <p>
      最初的 IntersectionObserver 实现中，同一个批次的回调里"离开"事件可能先于"进入"事件被处理，
      导致在两个 section 交界处出现 indicator 消失的空窗期。
    </p>
    <p>
      修复方案：在 observer 回调中先收集所有"进入"事件再处理"离开"事件，
      并将 rescan 逻辑从检测 <code>rect.bottom > rootRect.top</code> 改为
      找"已越过中点"的最后一个 section。这样只在滚回页面顶部时 indicator 才 fade out，
      下滑过程中始终可见。
    </p>

    <h3 id="up-next-alignment">Up Next 对齐</h3>
    <p>
      初始版本使用了 JavaScript 动态计算偏移量来对齐 Up Next 区域与文章内容区。
      对照 M3 源码后发现，官方完全通过 CSS Flex 布局实现：
      <code>flex-direction: row-reverse</code> + <code>justify-content: center</code>，
      配合固定宽度的 TOC/Empty 占位元素和 <code>flex: 1 1 0%</code> 的内容区，
      纯 CSS 即可实现任意内容下的完美对齐。
    </p>

    <h3 id="dark-mode-bullets">暗色主题列表图标</h3>
    <p>
      ul 列表的星形子弹 SVG 在暗色模式下使用了硬编码的亮色值 <code>#1E1E1C</code>，
      导致在深色背景上几乎不可见。修复时添加 <code>:deep()</code> 穿透到子组件的
      scoped 样式，将颜色切换为 M3 官方的 <code>#E3E3E3</code>。
      ol 列表的药丸数字徽章因使用 CSS 变量而自动适配暗色主题，无需额外处理。
    </p>

    <h3 id="global-link-css">全局 &lt;a&gt; 样式污染</h3>
    <p>
      全局 CSS 中对 <code>&lt;a&gt;</code> 元素设置了 <code>padding: 3px</code>、
      <code>text-decoration: none</code>、hover 时的 <code>background-color</code>
      和 <code>border-radius</code>，导致许多组件内的 <code>&lt;a&gt;</code> 元素
      叠加了非预期的 hover 效果。将全局 <code>&lt;a&gt;</code> 规则清理后，
      各组件恢复使用自己的 scoped link 样式，问题彻底解决。
    </p>

    <div class="block" id="commit-log">
      <div class="copy-button-container focusable">
        <div class="material-symbols-rounded copy-button" role="button" tabindex="0" aria-label="copy link to 提交记录 section">link</div>
        <div class="copy-button-background"></div>
        <div class="tooltip">
          <span class="deactivated">Copy link</span>
          <span aria-live="polite" class="activated">Link copied</span>
        </div>
      </div>
      <div class="scroll-target"></div>
      <div class="text-chunk">
        <h2 class="linkable" tabindex="-1">提交记录</h2>
      </div>
    </div>
    <p>v1 开发周期中的关键 commit：</p>
    <ul>
      <li><code>a054ed2</code> — 卡片状态层匹配 M3 官方 hover/pressed/focused 三态</li>
      <li><code>ae9032b</code> — thumb-container 背景统一为 secondary-container</li>
      <li><code>69e4fe5</code> — 行内代码、代码块、tooltip、ul bullet 暗色模式修复</li>
      <li><code>045c08e</code> — M3 官方 mio-code-snippet 与 CodeMirror 结构和字体规格</li>
      <li><code>fb5e2c8</code> — 纯 CSS Up Next 对齐，移除所有 JS 偏移计算</li>
      <li><code>8cab877</code> — 作者信息统一为 Jerry Bao / Developer，间距 24px</li>
      <li><code>01129b0</code> — TOC indicator 离开事件修复，fade out 仅在回到页面顶部时触发</li>
      <li><code>2668361</code> — TOC indicator 异常消失问题根因修复</li>
      <li><code>1b3944d</code> — ul bullet 暗色模式显示修复</li>
      <li><code>b80963f</code> — footer about-material 与 brand-logo 左边缘对齐</li>
      <li><code>bbae269</code> — footer social-links 和 site-links h3 与链接文本对齐</li>
      <li><code>f130404</code> — 删除全局 &lt;a&gt; CSS 污染规则</li>
      <li><code>9306886</code> — Up Next 区域与 M3 官方对齐差异修复</li>
    </ul>

    <div class="block" id="whats-next">
      <div class="copy-button-container focusable">
        <div class="material-symbols-rounded copy-button" role="button" tabindex="0" aria-label="copy link to 后续计划 section">link</div>
        <div class="copy-button-background"></div>
        <div class="tooltip">
          <span class="deactivated">Copy link</span>
          <span aria-live="polite" class="activated">Link copied</span>
        </div>
      </div>
      <div class="scroll-target"></div>
      <div class="text-chunk">
        <h2 class="linkable" tabindex="-1">后续计划</h2>
      </div>
    </div>
    <p>v1 完成了基础架构和 M3 规范还原，接下来的迭代方向：</p>
    <ul>
      <li><strong>更多文章内容</strong> — M3 Expressive 设计语言、Dynamic Color 实战指南等</li>
      <li><strong>CMS 后端</strong> — 标准化组件架构已就位，可接入 Headless CMS 实现内容管理</li>
      <li><strong>可访问性</strong> — 键盘导航优化、屏幕阅读器支持、高对比度模式</li>
      <li><strong>性能优化</strong> — 图片懒加载、组件代码分割、首屏渲染优化</li>
      <li><strong>PWA 支持</strong> — Service Worker 离线缓存、添加到主屏幕</li>
    </ul>
    <p>
      项目源码在 <strong>GitHub</strong> 开源，
      欢迎查看和贡献。每一个 commit 都对应一次对 M3 规范细节的深入理解和精确还原。
    </p>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'

// Copy link 交互逻辑 — 使用事件委托
function handleClick(e) {
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

onMounted(() => {
  const container = document.querySelector('.article-content')
  container?.addEventListener('click', handleClick)

  // M3 官方：ul li 的 bullet 每个有随机旋转角度 (0-9 * 36deg)
  container?.querySelectorAll('ul > li').forEach(li => {
    li.style.setProperty('--rotation', String(Math.floor(Math.random() * 10)))
  })
})

onUnmounted(() => {
  document.querySelector('.article-content')?.removeEventListener('click', handleClick)
})
</script>

<style scoped>
/* ================================================================
   M3 linkable heading block structure
   对照 m3: .block (grid: 68px auto 0px 0px, gap 20px, margin-left -90px)
   ================================================================ */
.block {
  display: grid;
  position: relative;
  grid-template-columns: 68px auto 0px 0px;
  gap: 20px;
  margin: 80px 0 24px -90px;
}

.copy-button-container {
  display: flex;
  position: relative;
  align-items: flex-start;
  justify-content: center;
  height: max-content;
  margin-left: 20px;
  margin-top: 2px;
  cursor: auto;
}

.copy-button {
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

.block:hover .copy-button {
  opacity: 1;
}

.copy-button:focus-visible,
.copy-button:hover {
  opacity: 1;
}

.copy-button:focus-visible + .copy-button-background,
.copy-button:focus-visible ~ .tooltip,
.copy-button:hover + .copy-button-background,
.copy-button:hover ~ .tooltip {
  opacity: 1;
}

.copy-button.activated + .copy-button-background {
  background: var(--md-sys-color-tertiary-container, #ffd8e4);
}

.copy-button.activated ~ .tooltip {
  width: 86px;
}

.copy-button.activated ~ .tooltip .deactivated {
  opacity: 0;
  visibility: hidden;
}

.copy-button.activated ~ .tooltip .activated {
  opacity: 1;
  visibility: visible;
}

.copy-button-background {
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

.scroll-target {
  display: block;
  position: absolute;
  width: 0;
  height: 0;
}

.tooltip {
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

.tooltip .deactivated {
  position: absolute;
  transition: opacity 0.2s cubic-bezier(0.2, 0, 0, 1);
  opacity: 1;
  visibility: visible;
}

.tooltip .activated {
  position: absolute;
  transition: opacity 0.2s cubic-bezier(0.2, 0, 0, 1);
  opacity: 0;
  visibility: hidden;
}

.text-chunk {
  display: block;
}

.article-content {
  /* 排版由 BlogArticleView 的 .blog-content :deep() 控制 */
}

@media screen and (max-width: 1294px) {
  .block {
    display: block;
    margin: 64px 0 24px 0;
  }

  .copy-button-container {
    display: none;
  }
}

/* ── 暗色主题覆盖 ── */

:global([data-theme="dark"] .copy-button) {
  color: var(--md-sys-color-on-surface, #e6e1e5);
}

:global([data-theme="dark"] .copy-button-background) {
  background: color-mix(in srgb, var(--md-sys-color-on-surface-variant, #cac4d0) 8%, transparent);
}

:global([data-theme="dark"] .tooltip) {
  background: #fefbff;
  color: #1f1f1f;
}
</style>
