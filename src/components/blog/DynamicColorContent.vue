<template>
  <div class="article-content">
    <div class="block" id="dynamic-color-intro">
      <div class="copy-button-container focusable">
        <div class="material-symbols-rounded copy-button" role="button" tabindex="0" aria-label="copy link to 动态配色概述 section">link</div>
        <div class="copy-button-background"></div>
        <div class="tooltip">
          <span class="deactivated">Copy link</span>
          <span aria-live="polite" class="activated">Link copied</span>
        </div>
      </div>
      <div class="scroll-target"></div>
      <div class="text-chunk">
        <h2 class="linkable" tabindex="-1">动态配色概述</h2>
      </div>
    </div>
    <p>
      <strong>Dynamic Color</strong> 是 Material Design 3 最具标志性的创新之一。
      它让应用的色彩方案不再由设计师预先固定，而是根据用户的壁纸颜色
      <strong>实时动态生成</strong>——每个人的设备都拥有独一无二的视觉体验。
    </p>
    <p>
      这一能力建立在 <strong>HCT 色彩空间</strong>（Hue-Chroma-Tone）之上，
      这是 Google 专门为 M3 设计的色彩模型。与传统的 HSL/HSV 不同，
      HCT 的色度（Chroma）和人眼感知的饱和度高度一致，
      <strong>明度（Tone）</strong>则与 CIELAB 的 L* 对齐，
      确保不同色相下相同 Tone 值的视觉亮度完全一致。
    </p>

    <div class="block" id="hct-color-space">
      <div class="copy-button-container focusable">
        <div class="material-symbols-rounded copy-button" role="button" tabindex="0" aria-label="copy link to HCT 色彩空间 section">link</div>
        <div class="copy-button-background"></div>
        <div class="tooltip">
          <span class="deactivated">Copy link</span>
          <span aria-live="polite" class="activated">Link copied</span>
        </div>
      </div>
      <div class="scroll-target"></div>
      <div class="text-chunk">
        <h2 class="linkable" tabindex="-1">HCT 色彩空间</h2>
      </div>
    </div>

    <h3 id="three-axes">三个轴的含义</h3>
    <ul>
      <li><strong>Hue（色相）</strong> — 0°–360° 的色轮角度，与 HSL 的色相定义一致</li>
      <li><strong>Chroma（色度）</strong> — 0–150+ 的彩色强度。与 HSL 饱和度的关键区别：
        Chroma 为 0 时总是灰色，但 Chroma 为 100 时不同色相的视觉鲜艳度可能差异很大——
        这与人眼的色觉异质性一致（人眼对黄绿色更敏感，对蓝紫色较迟钝）</li>
      <li><strong>Tone（色调/明度）</strong> — 0–100 的亮度感知值。Tone 50 总是中等亮度，
        无论色相和色度如何。这比 HSL 的 Lightness 更准确——HSL 中
        纯黄色 L=50 和纯蓝色 L=50 的视觉亮度差异巨大</li>
    </ul>

    <h3 id="hct-vs-hsl">HCT 与 HSL 的关键差异</h3>
    <p>
      为什么 M3 不直接使用 HSL？核心原因是<strong>感知均匀性</strong>。
      在 HSL 中，将饱和度从 50% 提高到 100% 时，黄色的视觉变化远大于蓝色——
      这导致设计师无法通过调整一个参数来获得"等量的鲜艳度变化"。
    </p>
    <p>
      HCT 通过引入 CAM16 色外观模型的色度计算，使得：
    </p>
    <ol>
      <li>相同 Chroma 值在不同色相下看起来<strong>同样鲜艳</strong></li>
      <li>相同 Tone 值在不同色相和色度下看起来<strong>同样明亮</strong></li>
      <li>从任意颜色出发，改变单个轴的值时<strong>不会产生意外的色调偏移</strong></li>
    </ol>
    <p>
      这三项保证是 Dynamic Color 能够"从壁纸自动生成和谐配色"的数学基础。
    </p>

    <div class="block" id="color-roles">
      <div class="copy-button-container focusable">
        <div class="material-symbols-rounded copy-button" role="button" tabindex="0" aria-label="copy link to 色彩角色系统 section">link</div>
        <div class="copy-button-background"></div>
        <div class="tooltip">
          <span class="deactivated">Copy link</span>
          <span aria-live="polite" class="activated">Link copied</span>
        </div>
      </div>
      <div class="scroll-target"></div>
      <div class="text-chunk">
        <h2 class="linkable" tabindex="-1">色彩角色系统</h2>
      </div>
    </div>
    <p>
      M3 定义了一套<strong>色彩角色</strong>（Color Roles）系统，将 UI 元素映射到命名的语义色彩：
    </p>
    <ol>
      <li><strong>Primary</strong> — 主要操作色彩，用于 FAB、Filled Button、Switch 激活态</li>
      <li><strong>Secondary</strong> — 辅助强调色彩，用于 FAB variant、Filter Chip</li>
      <li><strong>Tertiary</strong> — 第三强调色彩，用于对比性装饰元素</li>
      <li><strong>Error</strong> — 错误状态色彩，用于 Text Field 验证、Error Icon</li>
      <li><strong>Surface</strong> — 背景与容器色彩家族（含变体 dim/bright/container 等）</li>
      <li><strong>Outline</strong> — 边框与分隔线色彩（含 Variant）</li>
    </ol>
    <p>
      每个角色都有 Container 变体和 On- 变体（如 <code>primary</code> / <code>on-primary</code> /
      <code>primary-container</code> / <code>on-primary-container</code>），
      形成前景/背景的配对关系。Dynamic Color 生成算法确保每个配对的对比度满足
      WCAG AA 标准（至少 4.5:1 对比度）。
    </p>

    <div class="block" id="scheme-generation">
      <div class="copy-button-container focusable">
        <div class="material-symbols-rounded copy-button" role="button" tabindex="0" aria-label="copy link to 配色方案生成 section">link</div>
        <div class="copy-button-background"></div>
        <div class="tooltip">
          <span class="deactivated">Copy link</span>
          <span aria-live="polite" class="activated">Link copied</span>
        </div>
      </div>
      <div class="scroll-target"></div>
      <div class="text-chunk">
        <h2 class="linkable" tabindex="-1">配色方案生成</h2>
      </div>
    </div>

    <h3 id="source-color">源色提取</h3>
    <p>
      Dynamic Color 的起点是一个<strong>源色</strong>（Source Color）。
      在 Android 12+ 上，系统从用户壁纸中提取源色——具体算法并非简单的取主色，
      而是对壁纸图像进行<strong>量化聚类</strong>，筛选出满足最低 Chroma 阈值的候选色，
      再根据人类偏好评分（偏好适度饱和、避免过于鲜艳的颜色）选择最终源色。
    </p>

    <h3 id="scheme-variants">方案变体</h3>
    <p>
      M3 提供六种方案变体（Scheme Variants），从同一源色生成不同风格的配色：
    </p>
    <ul>
      <li><strong>SchemeContent</strong> — 源色直接作为 Primary，其他角色通过色相偏移和 Tone 调整派生</li>
      <li><strong>SchemeExpressive</strong> — 更大胆的色相偏移，Primary 可能偏移 60°以上</li>
      <li><strong>SchemeVibrant</strong> — 最大化 Chroma，适合视觉冲击力强的场景</li>
      <li><strong>SchemeTonalSpot</strong> — 温和平衡，Primary 色相仅微调 ±15°</li>
      <li><strong>SchemeFidelity</strong> — 保持源色的色相忠实度，减少算法偏移</li>
      <li><strong>SchemeMonochrome</strong> — Chroma 为 0，纯灰度配色</li>
    </ul>

    <mio-code-snippet>
      <div class="mio-code-snippet__container">
        <div :class="['CodeMirror', isDark ? 'cm-s-material-darker' : 'cm-s-neo', 'CodeMirror-wrap']" translate="no">
          <div class="CodeMirror-scroll">
            <div class="CodeMirror-sizer">
              <div class="CodeMirror-lines">
                <div class="CodeMirror-code">
                  <pre class="CodeMirror-line"><span class="cm-comment">// material-color-utilities 中的方案生成</span></pre>
                  <pre class="CodeMirror-line"><span class="cm-keyword">import</span> { <span class="cm-variable">Hct</span>, <span class="cm-variable">SchemeContent</span> } <span class="cm-keyword">from</span> <span class="cm-string">'@material/material-color-utilities'</span></pre>
                  <pre class="CodeMirror-line">&nbsp;</pre>
                  <pre class="CodeMirror-line"><span class="cm-keyword">const</span> <span class="cm-variable">sourceColor</span> = <span class="cm-number">0xFF6750A4</span>  <span class="cm-comment">// ARGB 整数</span></pre>
                  <pre class="CodeMirror-line"><span class="cm-keyword">const</span> <span class="cm-variable">hct</span> = <span class="cm-variable">Hct</span>.<span class="cm-property">fromInt</span>(<span class="cm-variable">sourceColor</span>)</pre>
                  <pre class="CodeMirror-line"><span class="cm-keyword">const</span> <span class="cm-variable">scheme</span> = <span class="cm-keyword">new</span> <span class="cm-variable">SchemeContent</span>(<span class="cm-variable">hct</span>, <span class="cm-atom">false</span>, <span class="cm-number">0</span>)</pre>
                  <pre class="CodeMirror-line">&nbsp;</pre>
                  <pre class="CodeMirror-line"><span class="cm-comment">// scheme.toJSON() 输出全部色彩角色</span></pre>
                  <pre class="CodeMirror-line"><span class="cm-variable">console</span>.<span class="cm-property">log</span>(<span class="cm-variable">scheme</span>.<span class="cm-property">toJSON</span>())</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </mio-code-snippet>

    <div class="block" id="web-implementation">
      <div class="copy-button-container focusable">
        <div class="material-symbols-rounded copy-button" role="button" tabindex="0" aria-label="copy link to Web 端实现 section">link</div>
        <div class="copy-button-background"></div>
        <div class="tooltip">
          <span class="deactivated">Copy link</span>
          <span aria-live="polite" class="activated">Link copied</span>
        </div>
      </div>
      <div class="scroll-target"></div>
      <div class="text-chunk">
        <h2 class="linkable" tabindex="-1">Web 端实现</h2>
      </div>
    </div>

    <h3 id="hct-polyfill">HCT 多项式近似</h3>
    <p>
      浏览器目前不原生支持 HCT 色彩空间。Google 官方的
      <code>@material/material-color-utilities</code> 包提供了 JavaScript 实现，
      可以在 Node.js 和浏览器中运行，将 HCT 值转换为 sRGB。
    </p>
    <p>
      我们项目的 <code>theme.js</code> 采用了一种更轻量的方式——
      使用 HSL 作为近似实现，并在关键转换点进行<strong>色相偏移校正</strong>。
      这种方式的精度虽然不及完整的 HCT 实现（部分极端色相下对比度可能不足 4.5:1），
      但在绝大多数情况下视觉效果与 M3 官方方案几乎无差别，
      且避免了引入完整的 CAM16 色外观模型计算。
    </p>

    <h3 id="css-variables">CSS 变量注入</h3>
    <p>
      无论色彩方案的生成方式如何，最终的输出格式都是一套 CSS 自定义属性：
    </p>

    <mio-code-snippet>
      <div class="mio-code-snippet__container">
        <div :class="['CodeMirror', isDark ? 'cm-s-material-darker' : 'cm-s-neo', 'CodeMirror-wrap']" translate="no">
          <div class="CodeMirror-scroll">
            <div class="CodeMirror-sizer">
              <div class="CodeMirror-lines">
                <div class="CodeMirror-code">
                  <pre class="CodeMirror-line"><span class="cm-comment">/* M3 色彩角色 → CSS 变量映射 */</span></pre>
                  <pre class="CodeMirror-line">:<span class="cm-variable">root</span> {</pre>
                  <pre class="CodeMirror-line">  <span class="cm-property">--md-sys-color-primary</span>: <span class="cm-number">#6750A4</span>;</pre>
                  <pre class="CodeMirror-line">  <span class="cm-property">--md-sys-color-on-primary</span>: <span class="cm-number">#FFFFFF</span>;</pre>
                  <pre class="CodeMirror-line">  <span class="cm-property">--md-sys-color-primary-container</span>: <span class="cm-number">#EADDFF</span>;</pre>
                  <pre class="CodeMirror-line">  <span class="cm-property">--md-sys-color-on-primary-container</span>: <span class="cm-number">#21005D</span>;</pre>
                  <pre class="CodeMirror-line">  <span class="cm-comment">/* ... 其余 40+ 色彩角色 ... */</span></pre>
                  <pre class="CodeMirror-line">}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </mio-code-snippet>

    <p>
      在我们的实现中，<code>theme.js</code> 通过
      <code>document.documentElement.style.setProperty()</code> 动态注入这些变量。
      所有组件的样式只引用 CSS 变量，不硬编码颜色值——
      这确保了主题切换时<strong>零延迟的全局更新</strong>。
    </p>

    <h3 id="dark-mode-scheme">暗色模式方案</h3>
    <p>
      暗色模式不是"亮色模式的反色"。M3 的暗色方案生成逻辑独立运行：
      它从同一源色出发，但对 Tone 值做了系统性调整——Surface 基准 Tone 从 98 降到 6，
      Primary 的 Tone 从 40 提升到 80（确保在深色背景上有足够对比度），
      Container 色彩的 Tone 与亮色模式互换位置。
    </p>
    <p>
      这意味着亮色和暗色方案不是简单的反转关系，而是两次独立的方案生成。
      状态层（State Layer）在暗色模式下使用 <code>color-mix(in srgb, ...)</code>
      重新计算透明度叠加，而非直接复用亮色的参数。
    </p>

    <div class="block" id="accessibility">
      <div class="copy-button-container focusable">
        <div class="material-symbols-rounded copy-button" role="button" tabindex="0" aria-label="copy link to 无障碍保障 section">link</div>
        <div class="copy-button-background"></div>
        <div class="tooltip">
          <span class="deactivated">Copy link</span>
          <span aria-live="polite" class="activated">Link copied</span>
        </div>
      </div>
      <div class="scroll-target"></div>
      <div class="text-chunk">
        <h2 class="linkable" tabindex="-1">无障碍保障</h2>
      </div>
    </div>
    <p>
      Dynamic Color 最被质疑的问题就是：<strong>自动生成的配色一定能保证对比度吗？</strong>
    </p>
    <p>
      答案是肯定的——这正是 HCT 色彩空间和 Tone 值设计的核心目的。
      因为 Tone 与 CIELAB L* 对齐，而对比度计算本质上依赖亮度差异，
      所以算法可以通过控制 Tone 值的差值来保证对比度：
    </p>
    <ul>
      <li><strong>On-Primary 对 Primary</strong> — Tone 差 ≥ 50，对比度 &gt; 9:1</li>
      <li><strong>On-Primary-Container 对 Primary-Container</strong> — Tone 差 ≥ 40，对比度 &gt; 4.5:1</li>
      <li><strong>On-Surface 对 Surface</strong> — Tone 差 ≥ 50，对比度 &gt; 9:1</li>
    </ul>
    <p>
      这些 Tone 差约束被硬编码在方案生成算法中，无论源色是什么，
      输出的配色方案总是满足 WCAG AA 标准。这也是为什么 HCT 比 HSL 更适合
      用于自动化配色——在 HSL 中，相同 Lightness 差值可能产生截然不同的对比度。
    </p>

    <div class="block" id="project-implementation">
      <div class="copy-button-container focusable">
        <div class="material-symbols-rounded copy-button" role="button" tabindex="0" aria-label="copy link to 项目实现回顾 section">link</div>
        <div class="copy-button-background"></div>
        <div class="tooltip">
          <span class="deactivated">Copy link</span>
          <span aria-live="polite" class="activated">Link copied</span>
        </div>
      </div>
      <div class="scroll-target"></div>
      <div class="text-chunk">
        <h2 class="linkable" tabindex="-1">项目实现回顾</h2>
      </div>
    </div>
    <p>
      在 Kernel's Blog 中，我们的 Dynamic Color 实现分为两层：
    </p>
    <ol>
      <li><strong>静态主题</strong> — 预定义了 M3 默认 Baseline 配色的 CSS 变量，
        作为降级方案和初始渲染的保障</li>
      <li><strong>动态主题</strong> — 用户通过颜色选择器选取源色，
        <code>theme.js</code> 的 HSL 近似算法实时生成完整配色方案并注入页面</li>
    </ol>
    <p>
      这种双层架构确保了即使用户未选择自定义颜色，页面也有完整且正确的 M3 配色；
      而选择自定义颜色后，所有组件通过 CSS 变量自动适配，无需逐个更新。
    </p>
    <p>
      未来我们可以将 <code>theme.js</code> 的 HSL 近似升级为完整的 HCT 实现——
      Google 的 <code>@material/material-color-utilities</code> 包已经支持 Web 平台，
      集成成本主要在于包体积（约 30KB gzipped）和初始化性能。
      对于我们的博客场景，30KB 的额外体积在首次主题切换时按需加载，
      对首屏渲染零影响。
    </p>
    <p>
      Dynamic Color 不仅仅是一个技术特性，它重新定义了设计系统的边界——
      从"设计师指定一切"转变为"系统在约束内自动生成"。
      而那些约束（WCAA AA 对比度、感知均匀性、语义色彩角色）正是 M3 规范中
      最精妙的设计。
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
