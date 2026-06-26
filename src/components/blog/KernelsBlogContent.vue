<template>
  <div class="article-content">
    <div class="block" id="project-overview">
      <div class="copy-button-container focusable">
        <div class="material-symbols-rounded copy-button" role="button" tabindex="0" aria-label="copy link to 项目概述 section">link</div>
        <div class="copy-button-background"></div>
        <div class="tooltip">
          <span class="deactivated">Copy link</span>
          <span aria-live="polite" class="activated">Link copied</span>
        </div>
      </div>
      <div class="scroll-target"></div>
      <div class="text-chunk">
        <h2 class="linkable" tabindex="-1">项目概述</h2>
      </div>
    </div>
    <p>
      Kernel's Blog 是一个基于 <strong>Vue 3</strong> 和 <strong>Material Web Components</strong> 构建的个人博客站点，
      严格遵循 <strong>Material Design 3</strong> 设计规范。项目从零搭建，不依赖任何现成的 M3 UI 框架，
      而是直接使用 Google 官方的 <code>@material/web</code> Web Components 包，
      确保与 M3 规范的完全一致性。
    </p>
    <p>
      这个项目起源于一个简单的问题：在 2026 年，能不能完全用 Material Design 3 的原生组件和交互规范，
      打造一个既美观又实用的个人博客？答案是肯定的——但过程远比想象中复杂。
    </p>

    <div class="block" id="tech-stack">
      <div class="copy-button-container focusable">
        <div class="material-symbols-rounded copy-button" role="button" tabindex="0" aria-label="copy link to 技术栈 section">link</div>
        <div class="copy-button-background"></div>
        <div class="tooltip">
          <span class="deactivated">Copy link</span>
          <span aria-live="polite" class="activated">Link copied</span>
        </div>
      </div>
      <div class="scroll-target"></div>
      <div class="text-chunk">
        <h2 class="linkable" tabindex="-1">技术栈</h2>
      </div>
    </div>
    <p>项目采用以下核心技术和工具：</p>
    <ul>
      <li><strong>Vue 3.4</strong> — Composition API + Script Setup，无 Options API</li>
      <li><strong>@material/web 1.4</strong> — Google 官方 M3 Web Components（md-button, md-dialog, md-slider 等）</li>
      <li><strong>Vue Router 4</strong> — HTML5 History 模式，支持导航持久化</li>
      <li><strong>Vite</strong> — 极速开发服务器和构建工具</li>
      <li><strong>Material Symbols Rounded</strong> — 可变字体图标，支持 FILL/wght/GRAD/opsz 四轴</li>
      <li><strong>Google Sans</strong> — M3 官方展示字体，通过直接内联 @font-face 声明实现完整 GRAD 轴响应</li>
      <li><strong>Noto Sans SC</strong> — 中文可变字体，字重范围 100–900</li>
    </ul>

    <div class="block" id="m3-implementation">
      <div class="copy-button-container focusable">
        <div class="material-symbols-rounded copy-button" role="button" tabindex="0" aria-label="copy link to M3 规范实现 section">link</div>
        <div class="copy-button-background"></div>
        <div class="tooltip">
          <span class="deactivated">Copy link</span>
          <span aria-live="polite" class="activated">Link copied</span>
        </div>
      </div>
      <div class="scroll-target"></div>
      <div class="text-chunk">
        <h2 class="linkable" tabindex="-1">M3 规范实现</h2>
      </div>
    </div>

    <h3 id="navigation-rail">Navigation Rail 导航栏</h3>
    <p>
      左侧 80px 宽的 Navigation Rail 是整个应用的骨架。它实现了 M3 规范中的所有交互状态：
      指示器药丸（indicator pill）的 <code>scaleX(0.32)</code> → <code>scaleX(1)</code> 过渡、
      FAB 的涟漪效果、图标在 hover/active 时的 <code>font-variation-settings</code> 变化——
      wght 从 400 到 600（hover）再到 300（active），GRAD 从 0 到 50 再到 -50。
    </p>
    <p>
      子面板（sub-panel）的交互更加复杂：在窄屏下以浮动模式出现（hover 触发，不压缩布局），
      在宽屏（≥1200px）下切换为常驻模式（persist 在布局中占据空间）。
      两种模式之间的切换使用 CSS transition 平滑过渡。
    </p>

    <h3 id="typography-system">字体排版系统</h3>
    <p>
      这是整个项目中最具挑战性的部分之一。M3 官方使用 <strong>Google Sans</strong> 字体的
      GRAD（Grade）轴来实现标题的 hover/active 视觉反馈——悬停时 GRAD 从 0 变为 50，
      按压时变为 -50，产生明显的粗细变化效果。
    </p>
    <h4 id="grad-axis">GRAD 轴的差异</h4>
    <p>
      然而，Google Fonts API 返回的标准 Google Sans 字体文件的 GRAD 轴响应极弱，
      几乎无法感知 ±50 的变化。经过深入排查，我们发现 M3 官方页面使用的字体文件
      具有完全不同的编译版本（文件哈希前缀 <code>4UaRrE...</code> 与 API 返回的
      <code>4UasrE...</code> 不同），GRAD 轴的响应强度有天壤之别。
    </p>
    <h4 id="font-face-inline">@font-face 内联方案</h4>
    <p>
      最终方案是直接从 M3 官方页面提取完整的 25 个 <code>@font-face</code> 声明
      （全部 <code>font-weight: 475</code>、<code>font-display: block</code>），
      内联到 <code>index.html</code> 中，绕过 Google Fonts API 的弱响应版本。
    </p>
    <p>
      这种方式虽然增加了首屏加载的 CSS 体积，但保证了字体效果与 M3 官方完全一致。
      每个字重切片独立声明，确保浏览器只下载当前渲染所需的子集。
    </p>

    <h3 id="cjk-handling">中文字体的双轨方案</h3>
    <p>
      GRAD 轴对中文汉字无效——无论值设为 -100 还是 200，视觉上完全一样。
      这是 Google Sans 字体本身的限制，CJK 字形不支持该变体轴。
    </p>
    <h4 id="dual-track">双轨策略</h4>
    <p>
      我们的解决方案是 <strong>双轨方案</strong>：纯英文标题仅使用 GRAD 轴变化（与 M3 官方一致），
      包含中文的标题则额外使用 <code>font-weight</code> 插值作为补偿——
      默认 475，hover 时加粗到 525，active 时变细到 425。
      JavaScript 通过 Unicode 范围检测标题是否包含汉字，动态添加 <code>.title--cjk</code> 类名。
    </p>
    <h4 id="cjk-font">中文字体选择</h4>
    <p>
      中文排版使用 <strong>Noto Sans SC</strong> 可变字体（字重范围 100–900），
      确保与 Google Sans 在相近的字重值下视觉协调。
      通过 <code>font-variation-settings</code> 控制拉丁字符的 GRAD 轴，
      <code>font-weight</code> 控制中文字符的字重，两者互不干扰。
    </p>

    <h3 id="code-block">代码块与语法高亮</h3>
    <p>
      文章页中的代码展示是博客的核心交互元素之一。我们按照 M3 官方
      <code>mio-code-snippet</code> 组件的结构，构建了一个轻量的静态代码块组件——
      不依赖 CodeMirror 运行时，而是直接输出 <code>&lt;pre&gt;</code> 标签结构，
      通过 CSS class 模拟 CodeMirror 的语法高亮 token（<code>.cm-keyword</code>、
      <code>.cm-string</code>、<code>.cm-comment</code> 等）。
    </p>

    <h4 id="syntax-coloring">语法着色原理</h4>
    <p>
      代码着色的核心是 <strong>token 分类 + CSS 选择器映射</strong>。
      每个语法元素被包裹在带有 CodeMirror 命名约定的 <code>&lt;span&gt;</code> 标签中，
      例如关键字用 <code>.cm-keyword</code>、字符串用 <code>.cm-string</code>、
      注释用 <code>.cm-comment</code>、变量用 <code>.cm-variable</code>、
      函数定义用 <code>.cm-def</code>、属性访问用 <code>.cm-property</code>、
      布尔与 null 用 <code>.cm-atom</code>。
      这种分类方式与 CodeMirror 编辑器的 token 系统完全对应，
      但我们不需要引入 CodeMirror 的词法分析器——对于静态展示的代码片段，
      手动标注 token class 不仅更轻量，还能精确控制每个 token 的归属。
    </p>
    <p>
      颜色由两层 CSS 主题类驱动：亮色主题使用 <code>.cm-s-neo</code>，
      暗色主题使用 <code>.cm-s-material-darker</code>。
      两套配色方案都直接对照 M3 官方页面的 CodeMirror 主题色值提取——
      亮色下关键字为 <code>#1d75b3</code>（蓝）、变量为 <code>#047d65</code>（绿）、
      字符串为 <code>#b35e14</code>（橙）、注释为 <code>#75787b</code>（灰）；
      暗色下关键字变为 <code>#c792ea</code>（紫）、变量变为 <code>#f07178</code>（粉红）、
      字符串变为 <code>#c3e88d</code>（浅绿）、注释变为 <code>#545454</code>（深灰）。
    </p>
    <p>
      主题切换的关键在于 <strong>容器级别的 class 交换</strong>：
      Vue 组件通过 <code>MutationObserver</code> 监听 <code>data-theme</code> 属性变化，
      同步更新 <code>isDark</code> ref，从而在 CodeMirror 容器上切换
      <code>cm-s-neo</code> 和 <code>cm-s-material-darker</code> 两个 class。
      由于所有高亮选择器都以主题 class 为前缀（如 <code>.cm-s-neo .cm-keyword</code>），
      切换容器 class 即可一次性切换全部 token 颜色，无需逐个修改元素样式。
    </p>
    <p>
      代码块的背景和边框同样按主题区分：亮色下背景为 <code>#f5f5f5</code>，
      暗色下为 <code>#212121</code>，边框颜色跟随 <code>--md-sys-color-surface-variant</code>
      CSS 变量自动适配。这些值全部从 M3 官方 <code>mio-code-snippet</code> 的
      渲染结果中精确测量得到。
    </p>

    <h4 id="code-typography">代码排版规格</h4>
    <p>
      代码字体严格遵循 M3 的排版规格：代码块使用
      <code>Google Sans Mono 15px / weight 500 / line-height 32px</code>，
      行内代码使用 <code>Google Sans Mono 16px / weight 400 / line-height 24px</code>——
      这些参数直接对应 M3 官方 CSS 变量中的 <code>--mio-theme-v2-code-snippet</code>
      和 <code>--mio-theme-v2-code-l</code> 令牌。
      与 Google Sans 类似，Google Sans Mono 也需要通过 @font-face 内联声明来确保加载。
      我们从 Google Fonts CDN 获取 woff2 格式的 weight 400 和 500 两个字重的
      3 个 unicode-range 切片，在 <code>index.html</code> 中声明，
      确保代码块的 font-weight: 500 不会降级为浏览器合成粗体。
    </p>

    <div class="block" id="theme-engine">
      <div class="copy-button-container focusable">
        <div class="material-symbols-rounded copy-button" role="button" tabindex="0" aria-label="copy link to 主题引擎 section">link</div>
        <div class="copy-button-background"></div>
        <div class="tooltip">
          <span class="deactivated">Copy link</span>
          <span aria-live="polite" class="activated">Link copied</span>
        </div>
      </div>
      <div class="scroll-target"></div>
      <div class="text-chunk">
        <h2 class="linkable" tabindex="-1">主题引擎</h2>
      </div>
    </div>
    <p>
      主题系统基于 <strong>HCT 色彩空间</strong>（Hue-Chroma-Tone）构建，
      这是 M3 规范的核心创新。用户可以通过颜色选择器选取任意颜色，
      系统自动生成完整的 M3 色彩方案——包括 Primary、Secondary、Tertiary、Error、
      Surface 等全部色彩令牌。
    </p>
    <p>
      由于浏览器尚不原生支持 HCT，我们使用 HSL 作为近似实现，
      并在关键转换点进行色相偏移校正。生成的色彩变量通过
      <code>CSS.registerProperty</code> 或直接设置 <code>document.documentElement.style</code>
      注入页面，实现全局即时主题切换。
    </p>
    <p>
      暗色模式会在现有色彩方案基础上做 Tone 值的反转，并通过
      <code>color-mix(in srgb, ...)</code> 处理状态层（hover/pressed/focused）的透明度叠加。
    </p>

    <div class="block" id="architecture">
      <div class="copy-button-container focusable">
        <div class="material-symbols-rounded copy-button" role="button" tabindex="0" aria-label="copy link to 架构设计 section">link</div>
        <div class="copy-button-background"></div>
        <div class="tooltip">
          <span class="deactivated">Copy link</span>
          <span aria-live="polite" class="activated">Link copied</span>
        </div>
      </div>
      <div class="scroll-target"></div>
      <div class="text-chunk">
        <h2 class="linkable" tabindex="-1">架构设计</h2>
      </div>
    </div>
    <p>项目的组件层级清晰，职责分明：</p>
    <ul>
      <li><strong>App.vue</strong> — 顶层布局：Navigation Rail + 可折叠子面板 + 移动端抽屉 + 主题面板</li>
      <li><strong>HomeView.vue</strong> — 首页：M3 编辑式布局，TOC 侧栏 + 分区卡片</li>
      <li><strong>BlogArticleView.vue</strong> — 文章页：严格复刻 m3.material.io/blog 的布局结构</li>
      <li><strong>blogStore.js</strong> — 响应式数据层，localStorage 持久化</li>
      <li><strong>theme.js</strong> — HCT 色彩引擎</li>
    </ul>
    <p>
      每个 Vue 文件遵循自包含原则：独立导入其使用的 Material Web Components，
      样式使用 <code>&lt;style scoped&gt;</code> 隔离，但 Teleport 内容通过
      <code>:global()</code> 选择器突破 Shadow DOM 限制。
    </p>

    <h3 id="standardized-components">标准化组件架构</h3>
    <p>
      为了支撑未来的 CMS 后端编辑场景，我们对页面中的所有可复用元素进行了标准化。
      标题区块（h2 block with copy link）、代码块（mio-code-snippet）、
      行内代码（<code>&lt;code&gt;</code>）、有序/无序列表等，
      都遵循统一的排版规格和交互模式。
    </p>
    <p>
      核心原则是 <strong>布局稳定性</strong>：无论某个组件是否存在，
      页面中其他元素的位置不应发生变化。例如，文章页右侧的 TOC 侧栏和 Up Next 区域
      使用相同宽度的占位元素，确保内容区的宽度在有无 TOC 时都完全一致。
      这通过 CSS Flex 布局的固定比例分配实现，而非 JavaScript 动态计算。
    </p>
    <p>
      每个标准化组件都有明确的 M3 对照规格——从 copy link 按钮的 48×48px 触摸目标、
      tooltip 的 <code>border-radius: 6px</code>，到 ol 列表的药丸数字徽章
      （24×32px，<code>inverse-surface</code> 背景色）和 ul 列表的星形子弹
      （8×8px SVG 背景图，随机旋转角度），全部可追溯到 M3 官方源代码。
    </p>
    <p>从零搭建到完整上线的典型开发流程如下：</p>
    <ol>
      <li><strong>环境初始化</strong> — 使用 Vite 创建 Vue 3 项目，安装 <code>@material/web</code> 及字体依赖</li>
      <li><strong>主题系统搭建</strong> — 实现 HCT 色彩引擎，支持亮暗模式和自定义源色</li>
      <li><strong>核心布局开发</strong> — Navigation Rail 骨架 + 路由配置 + 子面板交互</li>
      <li><strong>页面内容填充</strong> — 首页编辑式布局、文章页 M3 复刻、项目页卡片系统</li>
      <li><strong>细节打磨</strong> — 字体 GRAD 轴效果、涟漪动效、暗色主题适配、移动端响应式</li>
      <li><strong>部署上线</strong> — GitHub Pages 部署，配置自定义域名与 HTTPS</li>
    </ol>
    <p>
      实际的迭代过程远比上述线性列表复杂。我们采用的是 <strong>对照复刻</strong> 驱动的开发方式——
      每个组件和交互效果都直接参照 m3.material.io 的源代码和渲染结果，
      通过浏览器 DevTools 精确测量尺寸、间距、颜色、动效参数，然后在自己的项目中还原。
    </p>
    <p>
      这种方式的好处是目标明确、偏差可量化；代价是 M3 官方使用 Angular + 自定义 Web Components，
      而我们使用 Vue 3 + <code>@material/web</code>，技术栈差异意味着同样的视觉效果
      可能需要截然不同的实现路径。例如，M3 的布局对齐完全基于 CSS Flex 和固定比例，
      而初始版本中我们误用了 JavaScript 动态计算偏移量——对照 M3 源码才发现
      原版根本没有 JS 参与，纯 CSS 就能实现完美对齐。
    </p>
    <p>
      每轮迭代通常遵循「测量 → 实现 → 对比 → 修正」的循环。
      一个看似简单的 footer 对齐问题可能需要 3-4 轮迭代才能与 M3 官方完全一致。
      但正是这种对细节的执着追求，让最终产物的视觉质量达到了与 M3 官网几乎无差别的水平。
    </p>

    <mio-code-snippet>
      <div class="mio-code-snippet__container">
        <div :class="['CodeMirror', isDark ? 'cm-s-material-darker' : 'cm-s-neo', 'CodeMirror-wrap']" translate="no">
          <div class="CodeMirror-scroll">
            <div class="CodeMirror-sizer">
              <div class="CodeMirror-lines">
                <div class="CodeMirror-code">
                  <pre class="CodeMirror-line"><span class="cm-comment">// theme.js — HCT 色彩引擎核心逻辑</span></pre>
                  <pre class="CodeMirror-line"><span class="cm-keyword">export function</span> <span class="cm-def">applyThemeFromHCT</span>(sourceColor) {</pre>
                  <pre class="CodeMirror-line">  <span class="cm-keyword">const</span> <span class="cm-variable">hct</span> = <span class="cm-variable">Hct</span>.<span class="cm-property">fromInt</span>(<span class="cm-variable">sourceColor</span>);</pre>
                  <pre class="CodeMirror-line">  <span class="cm-keyword">const</span> <span class="cm-variable">scheme</span> = <span class="cm-keyword">new</span> <span class="cm-variable">SchemeContent</span>(<span class="cm-variable">hct</span>, <span class="cm-atom">false</span>, <span class="cm-atom">0.0</span>);</pre>
                  <pre class="CodeMirror-line">&nbsp;</pre>
                  <pre class="CodeMirror-line">  <span class="cm-keyword">const</span> <span class="cm-variable">tokens</span> = <span class="cm-variable">schemeToTokens</span>(<span class="cm-variable">scheme</span>);</pre>
                  <pre class="CodeMirror-line">  <span class="cm-keyword">for</span> (<span class="cm-keyword">const</span> [<span class="cm-variable">key</span>, <span class="cm-variable">value</span>] <span class="cm-keyword">of</span> <span class="cm-variable">Object</span>.<span class="cm-property">entries</span>(<span class="cm-variable">tokens</span>)) {</pre>
                  <pre class="CodeMirror-line">    <span class="cm-variable">document</span>.<span class="cm-property">documentElement</span>.<span class="cm-property">style</span>.<span class="cm-property">setProperty</span>(</pre>
                  <pre class="CodeMirror-line">      <span class="cm-string">`--md-sys-color-${<span class="cm-variable">key</span>}`</span>, <span class="cm-variable">value</span></pre>
                  <pre class="CodeMirror-line">    );</pre>
                  <pre class="CodeMirror-line">  }</pre>
                  <pre class="CodeMirror-line">}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </mio-code-snippet>

    <div class="block" id="challenges">
      <div class="copy-button-container focusable">
        <div class="material-symbols-rounded copy-button" role="button" tabindex="0" aria-label="copy link to 遇到的挑战 section">link</div>
        <div class="copy-button-background"></div>
        <div class="tooltip">
          <span class="deactivated">Copy link</span>
          <span aria-live="polite" class="activated">Link copied</span>
        </div>
      </div>
      <div class="scroll-target"></div>
      <div class="text-chunk">
        <h2 class="linkable" tabindex="-1">遇到的挑战</h2>
      </div>
    </div>

    <h3 id="shadow-dom">Shadow DOM 样式穿透</h3>
    <p>
      Material Web Components 基于 Shadow DOM 实现，内部样式无法被外部 CSS 直接修改。
      例如 <code>md-slider</code> 的轨道宽度、<code>md-dialog</code> 的滚动条、
      <code>input[type=color]</code> 的原生样式等，都需要针对性的 JS 补丁或 CSS 变量覆盖。
    </p>
    <p>
      对话框内所有 <code>&lt;form&gt;</code> 必须添加 <code>@submit.prevent</code> 防止页面刷新——
      这是 Shadow DOM 内表单提交行为与 Vue 事件系统不兼容导致的隐蔽 bug。
    </p>

    <h3 id="font-weight-global">全局 font-weight 重置</h3>
    <p>
      <code>base.css</code> 中的 <code>* { font-weight: normal }</code> 重置规则
      导致 hover 时 <code>font-weight</code> 从 475 回退到 400（normal 的计算值），
      完全抵消 Google Sans 的 GRAD 轴效果。
    </p>
    <p>
      修复方案是在所有 hover/active 规则中显式声明 <code>font-weight: 475</code>，
      确保不被通配符规则覆盖。这类由全局重置引发的局部样式失效是最难定位的 CSS 问题之一。
    </p>

    <h3 id="font-loading">字体加载策略</h3>
    <p>
      项目使用三种字体族：Google Sans（展示字体）、Google Sans Mono（代码字体）、
      Noto Sans SC（中文可变字体）。前两者不通过 Google Fonts API 的
      <code>&lt;link&gt;</code> 标签加载——API 返回的 Google Sans 字体文件
      GRAD 轴响应极弱，与 M3 官方使用的编译版本完全不同。
    </p>
    <p>
      最终采用的方案是直接在 <code>index.html</code> 中内联全部 @font-face 声明：
      Google Sans 有 25 个 unicode-range 切片（<code>font-weight: 475</code>、
      <code>font-display: block</code>），Google Sans Mono 有 6 个切片
      （weight 400 和 500 各 3 个，<code>font-display: swap</code>）。
      Noto Sans SC 因无需 GRAD 轴，仍通过 Google Fonts API 加载。
    </p>
    <p>
      这套方案确保了字体效果与 M3 官方完全一致，同时浏览器按 unicode-range
      按需下载子集——纯英文页面不会加载中文切片，纯中文页面也不会下载符号切片。
    </p>

    <div class="block" id="lessons">
      <div class="copy-button-container focusable">
        <div class="material-symbols-rounded copy-button" role="button" tabindex="0" aria-label="copy link to 经验总结 section">link</div>
        <div class="copy-button-background"></div>
        <div class="tooltip">
          <span class="deactivated">Copy link</span>
          <span aria-live="polite" class="activated">Link copied</span>
        </div>
      </div>
      <div class="scroll-target"></div>
      <div class="text-chunk">
        <h2 class="linkable" tabindex="-1">经验总结</h2>
      </div>
    </div>
    <p>在构建这个项目的过程中，我们总结出以下关键经验：</p>
    <ol>
      <li><strong>Web Components 与框架的协作需要额外注意</strong>——Shadow DOM 的封装是特性也是障碍，scoped 样式遇上 <code>::slotted()</code> 需要仔细处理优先级</li>
      <li><strong>可变字体的轴支持因编译版本而异</strong>——同一字体族的不同 woff2 编译可能有截然不同的轴响应特性</li>
      <li><strong>M3 规范的细节远超视觉</strong>——从触摸目标的 48px 最小尺寸到 state layer 的精确透明度，每处都经过可访问性考量</li>
      <li><strong>全局重置是定时炸弹</strong>——<code>* { font-weight: normal }</code> 这种规则在与可变字体配合时会产生意想不到的连锁效应</li>
      <li><strong>渐进式适配比一次性响应式更可靠</strong>——从移动端基础布局逐步增强到桌面端完整体验</li>
      <li><strong>对照源码胜过猜测</strong>——当布局效果与预期不符时，直接测量 M3 官方源码的 CSS 属性比凭直觉调整更高效</li>
      <li><strong>字体加载是可变字体的第一道坎</strong>——同一字体族的不同编译版本，轴响应特性可能有天壤之别，必须验证</li>
    </ol>
    <p>
      这个项目仍在持续迭代中。未来计划添加更多博客文章、完善可访问性、
      并探索 M3 的 Dynamic Color 在个人博客场景下的更多可能。
    </p>
  </div>
</template>

<script setup>
// Copy link 交互逻辑 — 使用事件委托，避免异步组件加载后找不到 DOM 元素
import { onMounted, onUnmounted, ref } from 'vue'

// 暗色模式检测 — 监听 data-theme 属性变化同步 CodeMirror 主题 class
const isDark = ref(false)
let themeObserver = null

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
  // 初始化 isDark
  const root = document.documentElement
  isDark.value = root.getAttribute('data-theme') === 'dark'

  // 监听 data-theme 变化（用户切换主题时同步）
  themeObserver = new MutationObserver(() => {
    isDark.value = root.getAttribute('data-theme') === 'dark'
  })
  themeObserver.observe(root, { attributes: true, attributeFilter: ['data-theme'] })

  const container = document.querySelector('.article-content')
  container?.addEventListener('click', handleClick)

  // M3 官方：ul li 的 bullet 每个有随机旋转角度 (0-9 * 36deg)
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

/* copy-button-container — 对照 m3: display flex, relative, margin 8px 0 0 20px */
.copy-button-container {
  display: flex;
  position: relative;
  align-items: flex-start;
  justify-content: center;
  height: max-content;
  /* margin-top 对齐：M3 官方 h2 line-height=64px，按钮中心=h2Top+8+24=h2Top+32=h2Center ✓
     我们的 h2 line-height=52px，按钮中心=h2Top+8+24=h2Top+32，而 h2Center=h2Top+26，差 6px
     修正：margin-top = h2Center - 24 = 26 - 24 = 2px */
  margin-left: 20px;
  margin-top: 2px;
  cursor: auto;
}

/* copy-button — 对照 m3: flex, relative, 48x48, opacity 0, z-index 2, border-radius 24px */
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

/* block:hover 时显示 copy-button */
.block:hover .copy-button {
  opacity: 1;
}

/* copy-button 自身 focus-visible / hover 时也显示 */
.copy-button:focus-visible,
.copy-button:hover {
  opacity: 1;
}

/* copy-button hover/focus-visible 时显示 background + tooltip */
.copy-button:focus-visible + .copy-button-background,
.copy-button:focus-visible ~ .tooltip,
.copy-button:hover + .copy-button-background,
.copy-button:hover ~ .tooltip {
  opacity: 1;
}

/* copy-button.activated 时 background 变色 */
.copy-button.activated + .copy-button-background {
  background: var(--md-sys-color-tertiary-container, #ffd8e4);
}

/* copy-button.activated 时 tooltip 宽度变化 */
.copy-button.activated ~ .tooltip {
  width: 86px;
}

/* copy-button.activated 时 tooltip 文字切换 */
.copy-button.activated ~ .tooltip .deactivated {
  opacity: 0;
  visibility: hidden;
}

.copy-button.activated ~ .tooltip .activated {
  opacity: 1;
  visibility: visible;
}

/* copy-button-background — 对照 m3: absolute, 48x48, z-index 1, bg on-surface-variant-2 */
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

/* scroll-target (对照 m3: position absolute, 0x0, 用于锚点定位偏移) */
.scroll-target {
  display: block;
  position: absolute;
  width: 0;
  height: 0;
}

/* tooltip — 对照 m3: absolute, bottom -28px, width 74px, height 24px, padding 4px 11px */
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

/* tooltip 文字切换 — 对照 m3: position absolute, opacity+visibility */
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

/* text-chunk */
.text-chunk {
  display: block;
}

.article-content {
  /* 排版由 BlogArticleView 的 .blog-content :deep() 控制 */
}

/* 移动端：隐藏 copy-button 区域，block 回退到无 grid */
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

/* 暗色主题 — copy-button 颜色（on-surface 暗） */
:global([data-theme="dark"] .copy-button) {
  color: var(--md-sys-color-on-surface, #e6e1e5);
}

/* 暗色主题 — copy-button-background（on-surface-variant 暗 8%） */
:global([data-theme="dark"] .copy-button-background) {
  background: color-mix(in srgb, var(--md-sys-color-on-surface-variant, #cac4d0) 8%, transparent);
}

/* 暗色主题 — tooltip 反转色彩（M3 官方：暗色模式下 tooltip 为浅色背景深色文字） */
:global([data-theme="dark"] .tooltip) {
  background: #fefbff;
  color: #1f1f1f;
}
</style>
