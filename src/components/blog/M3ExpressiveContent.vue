<template>
  <div class="article-content">
    <div class="block" id="expressive-overview">
      <div class="copy-button-container focusable">
        <div class="material-symbols-rounded copy-button" role="button" tabindex="0" aria-label="copy link to 设计语言概述 section">link</div>
        <div class="copy-button-background"></div>
        <div class="tooltip">
          <span class="deactivated">Copy link</span>
          <span aria-live="polite" class="activated">Link copied</span>
        </div>
      </div>
      <div class="scroll-target"></div>
      <div class="text-chunk">
        <h2 class="linkable" tabindex="-1">设计语言概述</h2>
      </div>
    </div>
    <p>
      <strong>Material 3 Expressive</strong> 是 Google 在 2025 年推出的设计语言更新，
      基于 Material You 框架构建，着重提升界面表现力与用户情感共鸣。
      它不是 M3 的替代版本，而是在现有规范基础上的一份表达能力扩展——
      让原本严谨的系统更具温度和个性。
    </p>
    <p>
      M3 Expressive 的核心设计理念涵盖三个维度：
      <strong>个性化</strong>（Personalization）、<strong>情感连接</strong>（Emotional Connection）
      和<strong>适应性</strong>（Adaptability）。这些理念通过动态配色方案、
      丰富的字体排版层级和组件视觉强化三大手段落地。
    </p>

    <div class="block" id="typography-expansion">
      <div class="copy-button-container focusable">
        <div class="material-symbols-rounded copy-button" role="button" tabindex="0" aria-label="copy link to 字体排版扩展 section">link</div>
        <div class="copy-button-background"></div>
        <div class="tooltip">
          <span class="deactivated">Copy link</span>
          <span aria-live="polite" class="activated">Link copied</span>
        </div>
      </div>
      <div class="scroll-target"></div>
      <div class="text-chunk">
        <h2 class="linkable" tabindex="-1">字体排版扩展</h2>
      </div>
    </div>
    <p>
      M3 Expressive 将原有的 15 种字体样式扩展到 <strong>30 种</strong>，
      新增了多个展示级（Display）和头部级（Headline）的变体。
      这意味着在保持 M3 排版系统一致性的前提下，设计师拥有了更丰富的视觉层级工具。
    </p>

    <h3 id="display-scale">展示级缩放</h3>
    <p>
      M3 原有的 Display Large/Medium/Small 三个级别被细分为更多粒度。
      Expressive 引入了<strong>可变缩放</strong>（Variable Scale）概念——
      字号不再固定为离散值，而是根据容器可用空间在最小值和最大值之间平滑插值。
      这种响应式排版方式确保标题在任何屏幕尺寸下都占据合理的视觉比重。
    </p>
    <p>
      在技术实现上，可变缩放依赖 CSS 的 <code>clamp()</code> 函数：
    </p>

    <mio-code-snippet>
      <div class="mio-code-snippet__container">
        <div :class="['CodeMirror', isDark ? 'cm-s-material-darker' : 'cm-s-neo', 'CodeMirror-wrap']" translate="no">
          <div class="CodeMirror-scroll">
            <div class="CodeMirror-sizer">
              <div class="CodeMirror-lines">
                <div class="CodeMirror-code">
                  <pre class="CodeMirror-line"><span class="cm-comment">/* M3 Expressive 可变缩放排版 */</span></pre>
                  <pre class="CodeMirror-line"><span class="cm-def">.display-expressive</span> {</pre>
                  <pre class="CodeMirror-line">  <span class="cm-property">font-size</span>: <span class="cm-variable">clamp</span>(</pre>
                  <pre class="CodeMirror-line">    <span class="cm-number">45px</span>,   <span class="cm-comment">/* 最小值 */</span></pre>
                  <pre class="CodeMirror-line">    <span class="cm-number">5vw</span>,     <span class="cm-comment">/* 首选值：视口比例 */</span></pre>
                  <pre class="CodeMirror-line">    <span class="cm-number">96px</span>    <span class="cm-comment">/* 最大值 */</span></pre>
                  <pre class="CodeMirror-line">  );</pre>
                  <pre class="CodeMirror-line">}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </mio-code-snippet>

    <h3 id="weight-axis">字重轴与 GRAD 轴</h3>
    <p>
      Google Sans 字体的 GRAD 轴在 Expressive 中被更广泛地运用。
      除了标题的 hover/active 反馈（GRAD 0 → 50 → -50），
      Expressive 还将 GRAD 轴用于正文段落的<strong>视觉强调层级</strong>——
      通过微调 GRAD 值（±25 范围内），在不改变行高和布局的前提下制造视觉重量差异。
    </p>
    <p>
      这对我们项目的中文排版双轨方案提出了新要求：当 GRAD 轴的运用范围从标题扩展到正文时，
      <code>font-weight</code> 补偿策略也需要覆盖更多元素。
      目前我们仅在标题上实现了双轨，后续可以考虑在 <code>&lt;strong&gt;</code>、
      <code>&lt;em&gt;</code> 等行内元素上增加 GRAD 微调。
    </p>

    <div class="block" id="component-enhancement">
      <div class="copy-button-container focusable">
        <div class="material-symbols-rounded copy-button" role="button" tabindex="0" aria-label="copy link to 组件视觉强化 section">link</div>
        <div class="copy-button-background"></div>
        <div class="tooltip">
          <span class="deactivated">Copy link</span>
          <span aria-live="polite" class="activated">Link copied</span>
        </div>
      </div>
      <div class="scroll-target"></div>
      <div class="text-chunk">
        <h2 class="linkable" tabindex="-1">组件视觉强化</h2>
      </div>
    </div>
    <p>
      M3 Expressive 对 <strong>15 个核心组件</strong>进行了视觉强化，涵盖按钮、卡片、
      对话框、FAB、Chip、Navigation Bar/Rail 等。强化的核心理念是
      <strong>让交互意图更清晰</strong>，而非纯粹增加视觉装饰。
    </p>

    <h3 id="button-expressive">按钮强化</h3>
    <p>
      Filled Button 的圆角从 <code>20px</code> 增大到 <code>28px</code>，
      内边距从 <code>10px 24px</code> 增加到 <code>14px 32px</code>，
      触摸目标从 <code>40px</code> 提升到 <code>56px</code>。
      这些变化让按钮在移动端的可操作性显著提升，同时更大的圆角
      在视觉上更接近"药丸"形态，传达更强的"可点击"暗示。
    </p>

    <h3 id="card-expressive">卡片强化</h3>
    <p>
      Card 的状态层（State Layer）效果在 Expressive 中更加明显。
      Hover 时的透明度从 8% 提升到 12%，Active 时从 12% 提升到 16%，
      并增加了 <code>transform: scale(0.98)</code> 的微缩放效果，
      模拟物理世界的"按压"反馈。
    </p>
    <p>
      这与我们项目中卡片的实现方式一致——我们的卡片状态层已经在 hover 和 active 时
      使用了 <code>secondary-container</code> 背景色叠加，但尚未加入缩放效果。
      后续可以考虑在 <code>:active</code> 状态下增加
      <code>transform: scale(0.98)</code> + <code>transition</code> 来匹配 Expressive 规范。
    </p>

    <h3 id="fab-expressive">FAB 强化</h3>
    <p>
      FAB（Floating Action Button）在 Expressive 中从圆形变为更大的药丸形（Extended FAB 成为默认），
      尺寸从 <code>56×56px</code> 提升到 <code>72×72px</code> 或等宽药丸。
      图标尺寸不变，但容器增大提供了更多的状态层空间和涟漪动效余量。
    </p>

    <div class="block" id="adaptive-layout">
      <div class="copy-button-container focusable">
        <div class="material-symbols-rounded copy-button" role="button" tabindex="0" aria-label="copy link to 自适应布局革新 section">link</div>
        <div class="copy-button-background"></div>
        <div class="tooltip">
          <span class="deactivated">Copy link</span>
          <span aria-live="polite" class="activated">Link copied</span>
        </div>
      </div>
      <div class="scroll-target"></div>
      <div class="text-chunk">
        <h2 class="linkable" tabindex="-1">自适应布局革新</h2>
      </div>
    </div>
    <p>
      M3 Expressive 在自适应布局方面引入了<strong>规范化的断点系统</strong>和
      <strong>容器查询优先</strong>（Container Query First）的设计策略。
    </p>

    <h3 id="breakpoints">断点系统</h3>
    <p>
      Expressive 明确了四个布局断点：
    </p>
    <ol>
      <li><strong>Compact</strong>（0–599dp）— 手机竖屏，单列布局，Navigation Bar 底部</li>
      <li><strong>Medium</strong>（600–839dp）— 折叠屏/小平板，2 列布局可选</li>
      <li><strong>Expanded</strong>（840–1199dp）— 平板，2-3 列布局，Navigation Rail 左侧</li>
      <li><strong>Large / Extra Large</strong>（1200dp+）— 桌面端，多列布局，多面板并存</li>
    </ol>
    <p>
      这与我们项目的断点策略基本吻合。我们目前使用 <code>600px</code> 和
      <code>1294px</code> 作为主要断点，对应 Compact 和 Expanded 级别。
      但 Medium 级别（600–839dp）的适配还有优化空间——
      例如折叠屏外屏下的 Navigation Rail 可以在 <code>840px</code> 处切换，
      而非等到 <code>1294px</code>。
    </p>

    <h3 id="container-queries">容器查询</h3>
    <p>
      Expressive 推荐使用 CSS Container Queries 替代 Media Queries 进行组件级布局适配。
      这意味着一个组件的布局不取决于视口宽度，而取决于其<strong>容器</strong>的可用空间——
      同一个卡片组件在侧栏中显示为紧凑模式，在主内容区中显示为展开模式，
      无需 JavaScript 介入。
    </p>

    <mio-code-snippet>
      <div class="mio-code-snippet__container">
        <div :class="['CodeMirror', isDark ? 'cm-s-material-darker' : 'cm-s-neo', 'CodeMirror-wrap']" translate="no">
          <div class="CodeMirror-scroll">
            <div class="CodeMirror-sizer">
              <div class="CodeMirror-lines">
                <div class="CodeMirror-code">
                  <pre class="CodeMirror-line"><span class="cm-comment">/* 容器查询：组件根据自身容器宽度适配 */</span></pre>
                  <pre class="CodeMirror-line"><span class="cm-def">.card-container</span> {</pre>
                  <pre class="CodeMirror-line">  <span class="cm-property">container-type</span>: <span class="cm-atom">inline-size</span>;</pre>
                  <pre class="CodeMirror-line">}</pre>
                  <pre class="CodeMirror-line">&nbsp;</pre>
                  <pre class="CodeMirror-line"><span class="cm-keyword">@container</span> (<span class="cm-variable">min-width</span>: <span class="cm-number">400px</span>) {</pre>
                  <pre class="CodeMirror-line">  <span class="cm-def">.card</span> { <span class="cm-property">flex-direction</span>: <span class="cm-atom">row</span>; }</pre>
                  <pre class="CodeMirror-line">}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </mio-code-snippet>

    <div class="block" id="practical-impact">
      <div class="copy-button-container focusable">
        <div class="material-symbols-rounded copy-button" role="button" tabindex="0" aria-label="copy link to 对项目的影响 section">link</div>
        <div class="copy-button-background"></div>
        <div class="tooltip">
          <span class="deactivated">Copy link</span>
          <span aria-live="polite" class="activated">Link copied</span>
        </div>
      </div>
      <div class="scroll-target"></div>
      <div class="text-chunk">
        <h2 class="linkable" tabindex="-1">对项目的影响</h2>
      </div>
    </div>
    <p>
      作为严格遵循 M3 规范的项目，M3 Expressive 的推出意味着我们需要评估并逐步适配以下变化：
    </p>
    <ul>
      <li><strong>圆角增大</strong> — 卡片从 24px 可能需要调整到 28px，按钮从 20px 到 28px</li>
      <li><strong>触摸目标增大</strong> — 所有可交互元素的最小尺寸从 48px 提升到 56px</li>
      <li><strong>状态层透明度提升</strong> — hover 从 8% 到 12%，active 从 12% 到 16%</li>
      <li><strong>正文 GRAD 微调</strong> — 强调文本和标签需要支持 GRAD 轴变化</li>
      <li><strong>容器查询替代</strong> — 组件布局适配从 Media Query 迁移到 Container Query</li>
    </ul>
    <p>
      好消息是，我们项目的组件自包含原则和参数化样式体系（CSS 变量 + font-variation-settings）
      让这些调整可以逐个组件进行，而不需要大规模重构。例如圆角的调整只需修改对应的 CSS 变量值，
      状态层透明度只需调整 <code>color-mix()</code> 中的百分比参数。
    </p>
    <p>
      M3 Expressive 代表了设计系统的演进方向：在保持规范一致性的同时，
      给予设计师和开发者更大的表达空间。对于我们这个"对照复刻"驱动的项目而言，
      下一个挑战将从"还原 M3 现有规范"进阶到"同步跟进 M3 规范更新"——
      这需要更敏捷的组件架构和更自动化的视觉回归检测。
    </p>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const isDark = ref(false)
let themeObserver = null

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
  const root = document.documentElement
  isDark.value = root.getAttribute('data-theme') === 'dark'

  themeObserver = new MutationObserver(() => {
    isDark.value = root.getAttribute('data-theme') === 'dark'
  })
  themeObserver.observe(root, { attributes: true, attributeFilter: ['data-theme'] })

  const container = document.querySelector('.article-content')
  container?.addEventListener('click', handleClick)

  container?.querySelectorAll('ul > li').forEach(li => {
    li.style.setProperty('--rotation', String(Math.floor(Math.random() * 10)))
  })
})

onUnmounted(() => {
  document.querySelector('.article-content')?.removeEventListener('click', handleClick)
  themeObserver?.disconnect()
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
