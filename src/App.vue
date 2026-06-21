<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavigationRail from '@/components/NavigationRail.vue'

const route = useRoute()
const router = useRouter()

const navItems = [
  { id: 'home', label: '首页', icon: 'home', activeIcon: 'home', route: '/' },
  { id: 'about', label: '关于', icon: 'person_outline', activeIcon: 'person', route: '/about' },
  {
    id: 'blog', label: '博客', icon: 'description', activeIcon: 'description', route: '/blog',
    children: [
      { id: 'blog-overview', label: '全部文章', route: '/blog' },
      { id: 'blog-tech', label: '技术', route: '/blog/tech' },
      { id: 'blog-life', label: '生活', route: '/blog/life' },
    ],
  },
  {
    id: 'projects', label: '项目', icon: 'code', activeIcon: 'code', route: '/projects',
    children: [
      { id: 'projects-overview', label: '全部项目', route: '/projects' },
      { id: 'projects-web', label: 'Web 应用', route: '/projects/web' },
      { id: 'projects-tools', label: '工具', route: '/projects/tools' },
    ],
  },
  { id: 'contact', label: '联系', icon: 'mail_outline', activeIcon: 'mail', route: '/contact' },
]

const fabConfig = { icon: 'create', label: '新建' }

const activeNavId = computed(() => {
  const matched = navItems.find(
    (item) => route.path === item.route || route.path.startsWith(item.route + '/')
  )
  return matched ? matched.id : navItems[0].id
})

// ======== 二级子菜单面板 ========
const activeSubItems = computed(() => {
  const activeItem = navItems.find(item => item.id === activeNavId.value)
  return activeItem?.children || null
})

// 当前活跃一级菜单项的完整数据
const activeNavItem = computed(() => {
  return navItems.find(item => item.id === activeNavId.value)
})

const activeSubItemId = computed(() => {
  if (!activeSubItems.value) return null
  const exact = activeSubItems.value.find(child => route.path === child.route)
  if (exact) return exact.id
  const prefix = activeSubItems.value.find(
    child => route.path.startsWith(child.route + '/') || (child.route !== '/' && route.path.startsWith(child.route))
  )
  return prefix ? prefix.id : activeSubItems.value[0]?.id
})

// 响应式：宽屏自动展开 inline，窄屏通过 hover 浮层
const isWideScreen = ref(true)
const subPanelInlineOpen = ref(false)
const hoveredNavId = ref(null) // 当前鼠标悬停的一级菜单 id

function updateScreenWidth() {
  isWideScreen.value = window.innerWidth >= 1240
  // 宽屏下：当前选中项有 children 则自动展开 inline
  subPanelInlineOpen.value = isWideScreen.value && !!activeSubItems.value
}

// 首次渲染完成标记（控制 --animate class）
const subPanelTransitionsReady = ref(false)

// 首项 indicator 延迟激活标记（控制 --active class 在新面板出现时的延迟添加）
// 目的：让 indicator 先渲染在 scaleX(0.32) 初始位，然后过渡到 scaleX(1)
const subPanelActiveReady = ref(true)

onMounted(() => {
  updateScreenWidth()
  window.addEventListener('resize', updateScreenWidth)
  requestAnimationFrame(() => {
    subPanelTransitionsReady.value = true
  })
})
onUnmounted(() => {
  window.removeEventListener('resize', updateScreenWidth)
})

// 当子面板内容变化时（切到不同父级菜单），延迟添加 active class
// 使 indicator 能从 scaleX(0.32) 过渡到 scaleX(1)（从中间向两端展开）
watch(activeSubItems, (newItems, oldItems) => {
  // 子项列表发生变化 = 切到了不同的父级菜单
  if (newItems !== oldItems && newItems) {
    subPanelActiveReady.value = false
    subPanelTransitionsReady.value = false
    // 先让 DOM 渲染出 indicator 的初始状态（scaleX(0.32), opacity: 0）
    // 再启用 transition + active，触发 scaleX(0.32)→1 的展开动画
    requestAnimationFrame(() => {
      subPanelTransitionsReady.value = true
      requestAnimationFrame(() => {
        subPanelActiveReady.value = true
      })
    })
  }
})

watch(activeNavId, () => {
  if (isWideScreen.value) {
    subPanelInlineOpen.value = !!activeSubItems.value
  }
})

watch(isWideScreen, (wide) => {
  subPanelInlineOpen.value = wide && !!activeSubItems.value
})

// 计算当前要显示的 hover 浮层 children（仅窄屏桌面端）
const hoveredSubItems = computed(() => {
  if (isWideScreen.value) return null // 宽屏用 inline
  if (!hoveredNavId.value) return null
  const item = navItems.find(i => i.id === hoveredNavId.value)
  return item?.children || null
})

const hoverLeaveTimer = ref(null)

// hover 浮层面版的 indicator 同样需要延迟激活
const hoverPanelActiveReady = ref(true)

function onRailItemHover(itemId) {
  if (hoverLeaveTimer.value) {
    clearTimeout(hoverLeaveTimer.value)
    hoverLeaveTimer.value = null
  }
  // 如果切换到不同的有子菜单的项，延迟添加 active 以触发展开动画
  const prevItem = navItems.find(i => i.id === hoveredNavId.value)
  const nextItem = navItems.find(i => i.id === itemId)
  if (hoveredNavId.value !== itemId && prevItem?.children && nextItem?.children) {
    hoverPanelActiveReady.value = false
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        hoverPanelActiveReady.value = true
      })
    })
  }
  hoveredNavId.value = itemId
}

function onRailItemLeave() {
  hoverLeaveTimer.value = setTimeout(() => {
    hoveredNavId.value = null
  }, 150)
}

function onHoverPanelEnter() {
  if (hoverLeaveTimer.value) {
    clearTimeout(hoverLeaveTimer.value)
    hoverLeaveTimer.value = null
  }
}

function onHoverPanelLeave() {
  hoveredNavId.value = null
}

function navigateToSubItem(child) {
  if (child.route) router.push(child.route)
  hoveredNavId.value = null
}

function navigateTo(item) {
  if (item.route) router.push(item.route)
  closeDrawer()
}

function onFabClick() {
  // FAB 点击事件，后续扩展
}

// ======== 移动端 Navigation Drawer ========
const drawerOpen = ref(false)

function toggleDrawer() {
  drawerOpen.value = !drawerOpen.value
}

function closeDrawer() {
  drawerOpen.value = false
}

// 桌面端内容区左边距
const bodyMarginLeft = computed(() => {
  if (!isWideScreen.value) return '80px'
  let margin = 80
  if (activeSubItems.value && subPanelInlineOpen.value) margin += 256
  return margin + 'px'
})
</script>

<template>
  <div class="app-layout">
    <!-- 桌面端：左侧 Navigation Rail -->
    <NavigationRail
      class="app-layout__rail"
      :items="navItems"
      :fab="fabConfig"
      @fab-click="onFabClick"
      @item-hover="onRailItemHover"
      @item-leave="onRailItemLeave"
    />

    <!-- 宽屏 (≥1240px)：inline 二级面板 -->
    <aside
      v-if="subPanelInlineOpen && activeSubItems"
      class="sub-panel sub-panel--inline"
    >
      <nav class="sub-panel__items">
        <a
          v-for="child in activeSubItems"
          :key="child.id"
          class="sub-panel__item"
          :class="{
            'sub-panel__item--active': subPanelActiveReady && activeSubItemId === child.id,
            'sub-panel__item--animate': subPanelTransitionsReady,
          }"
          @click.prevent="navigateToSubItem(child)"
        >
          <span class="sub-panel__item-label">{{ child.label }}</span>
        </a>
      </nav>
    </aside>

    <!-- 中等屏幕 (840-1240px)：hover 浮层面板 -->
    <Teleport to="body">
      <aside
        v-if="hoveredSubItems && !isWideScreen"
        class="sub-panel sub-panel--hover"
        @mouseenter="onHoverPanelEnter"
        @mouseleave="onHoverPanelLeave"
      >
        <nav class="sub-panel__items">
          <a
            v-for="child in hoveredSubItems"
            :key="child.id"
            class="sub-panel__item"
            :class="{
              'sub-panel__item--active': hoverPanelActiveReady && activeSubItemId === child.id,
              'sub-panel__item--animate': subPanelTransitionsReady,
            }"
            @click.prevent="navigateToSubItem(child)"
          >
            <span class="sub-panel__item-label">{{ child.label }}</span>
          </a>
        </nav>
      </aside>
    </Teleport>

    <!-- 右侧主区域 -->
    <div class="app-layout__body" :style="{ marginLeft: bodyMarginLeft }">
      <!-- 移动端：顶部 App Bar -->
      <header class="mobile-top-bar">
        <button
          class="mobile-top-bar__menu-btn"
          :aria-label="drawerOpen ? 'Close navigation menu' : 'Open navigation menu'"
          :title="drawerOpen ? 'Close' : 'Menu'"
          @click="toggleDrawer"
        >
          <span class="material-symbols-rounded">{{ drawerOpen ? 'close' : 'menu' }}</span>
        </button>
        <span class="mobile-top-bar__title">Kernel's Blog</span>
        <div class="mobile-top-bar__actions">
          <a
            class="mobile-top-bar__icon-btn"
            href="https://github.com/BJY-STUDIO/myprofile"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub repository"
            title="GitHub repository"
          >
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
          </a>
          <button
            id="theme-btn-mobile"
            class="mobile-top-bar__icon-btn"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            <span class="material-symbols-rounded">palette</span>
          </button>
        </div>
      </header>

      <!-- 主内容 -->
      <main class="app-main">
        <router-view />
      </main>
    </div>

    <!-- 移动端：Navigation Drawer + 遮罩 -->
    <Teleport to="body">
      <div
        v-if="drawerOpen"
        class="drawer-scrim"
        @click="closeDrawer"
      ></div>
      <aside
        class="nav-drawer"
        :class="{ 'nav-drawer--open': drawerOpen }"
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div class="nav-drawer__header">
          <span class="nav-drawer__title">Kernel's Blog</span>
        </div>
        <nav class="nav-drawer__items">
          <div
            v-for="item in navItems"
            :key="item.id"
            class="nav-drawer__item"
            :class="{ 'nav-drawer__item--active': activeNavId === item.id }"
            @click="navigateTo(item)"
          >
            <span class="material-symbols-rounded nav-drawer__icon">
              {{ activeNavId === item.id ? (item.activeIcon || item.icon) : item.icon }}
            </span>
            <span class="nav-drawer__label">{{ item.label }}</span>
          </div>
        </nav>
        <div class="nav-drawer__footer">
          <a
            class="nav-drawer__footer-link"
            href="https://github.com/BJY-STUDIO/myprofile"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" width="20" height="20">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            <span>GitHub</span>
          </a>
        </div>
      </aside>
    </Teleport>

    <!-- 主题面板 (md-menu, Teleport 到 body 避免 z-index 遮挡) -->
    <Teleport to="body">
      <md-menu id="theme-menu" anchor="theme-btn" has-overflow positioning="fixed">
        <div class="theme-panel">
        <div class="theme-panel__header">
          <span class="material-symbols-rounded theme-panel__header-icon">palette</span>
          <span class="theme-panel__header-title">Theme Controls</span>
        </div>

        <md-divider></md-divider>

        <!-- Source Color 输入 -->
        <div class="theme-panel__section">
          <label class="theme-panel__label">Hex Source Color</label>
          <div class="theme-panel__color-input">
            <input
              id="source-color-picker"
              type="color"
              class="theme-panel__color-swatch"
            />
            <md-filled-text-field
              id="source-color-text"
              label=""
              type="text"
              maxlength="7"
              value="#6750a4"
              style="flex:1"
            ></md-filled-text-field>
          </div>
        </div>

        <!-- Hue 滑块 -->
        <div class="theme-panel__section">
          <label class="theme-panel__label">Hue</label>
          <div class="theme-panel__slider-row">
            <md-slider id="hue-slider" min="0" max="360" value="270" labeled></md-slider>
            <span id="hue-value" class="theme-panel__slider-value">0</span>
          </div>
        </div>

        <!-- Chroma 滑块 -->
        <div class="theme-panel__section">
          <label class="theme-panel__label">Chroma</label>
          <div class="theme-panel__slider-row">
            <md-slider id="chroma-slider" min="0" max="150" value="55" labeled></md-slider>
            <span id="chroma-value" class="theme-panel__slider-value">0</span>
          </div>
        </div>

        <!-- Tone 滑块 -->
        <div class="theme-panel__section">
          <label class="theme-panel__label">Tone</label>
          <div class="theme-panel__slider-row">
            <md-slider id="tone-slider" min="0" max="100" value="50" labeled></md-slider>
            <span id="tone-value" class="theme-panel__slider-value">0</span>
          </div>
        </div>

        <md-divider></md-divider>

        <!-- 明暗模式切换 -->
        <div class="theme-panel__section">
          <label class="theme-panel__label">Color Scheme</label>
          <div class="theme-panel__mode-buttons">
            <button class="theme-mode-btn" data-mode="dark" aria-label="dark color scheme" title="Dark">
              <span class="material-symbols-rounded">dark_mode</span>
            </button>
            <button class="theme-mode-btn" data-mode="system" aria-label="auto color scheme" title="Auto">
              <span class="material-symbols-rounded">brightness_medium</span>
            </button>
            <button class="theme-mode-btn" data-mode="light" aria-label="light color scheme" title="Light">
              <span class="material-symbols-rounded">light_mode</span>
            </button>
          </div>
        </div>
      </div>
      </md-menu>
    </Teleport>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: row;
}

.app-layout__body {
  flex: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s cubic-bezier(0.2, 0, 0, 1);
}

/* ======== 主内容区 ======== */
.app-main {
  flex: 1;
  padding: 24px 32px;
  max-width: 1200px;
  width: 100%;
  box-sizing: border-box;
  margin: 0 auto;
}

/* ======== 移动端顶部 App Bar ======== */
.mobile-top-bar {
  display: none;
  position: sticky;
  top: 0;
  z-index: 50;
  height: 64px;
  background-color: var(--md-sys-color-surface, #fffbfe);
  align-items: center;
  padding: 0 4px 0 4px;
  gap: 4px;
}

.mobile-top-bar__menu-btn {
  width: 48px;
  height: 48px;
  border-radius: 24px;
  border: none;
  background: none;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
}

.mobile-top-bar__menu-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 24px;
  background-color: var(--md-sys-color-on-surface-variant, #49454f);
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.mobile-top-bar__menu-btn:hover::before {
  opacity: 0.08;
}

.mobile-top-bar__menu-btn:active::before {
  opacity: 0.12;
}

.mobile-top-bar__menu-btn .material-symbols-rounded {
  font-size: 24px;
  position: relative;
  z-index: 1;
}

.mobile-top-bar__title {
  flex: 1;
  font-size: 22px;
  font-weight: 400;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  line-height: 28px;
}

.mobile-top-bar__actions {
  display: flex;
  align-items: center;
  gap: 0;
}

.mobile-top-bar__icon-btn {
  width: 48px;
  height: 48px;
  border-radius: 24px;
  border: none;
  background: none;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
}

.mobile-top-bar__icon-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 24px;
  background-color: var(--md-sys-color-on-surface-variant, #49454f);
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.mobile-top-bar__icon-btn:hover::before {
  opacity: 0.08;
}

.mobile-top-bar__icon-btn:active::before {
  opacity: 0.12;
}

.mobile-top-bar__icon-btn svg {
  width: 24px;
  height: 24px;
  position: relative;
  z-index: 1;
}

.mobile-top-bar__icon-btn .material-symbols-rounded {
  font-size: 24px;
  position: relative;
  z-index: 1;
}

/* ======== Navigation Drawer（移动端） ======== */
.drawer-scrim {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 200;
  animation: scrim-fade-in 0.2s ease-out;
}

@keyframes scrim-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.nav-drawer {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 360px;
  max-width: calc(100vw - 56px);
  background-color: var(--md-sys-color-surface, #fffbfe);
  z-index: 201;
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1);
  display: flex;
  flex-direction: column;
  border-radius: 0 16px 16px 0;
  box-shadow: var(--md-sys-elevation-2, 0 1px 2px 0 rgba(0,0,0,0.3), 0 2px 6px 2px rgba(0,0,0,0.15));
}

.nav-drawer--open {
  transform: translateX(0);
}

.nav-drawer__header {
  padding: 28px 24px 20px 24px;
}

.nav-drawer__title {
  font-size: 24px;
  font-weight: 400;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  line-height: 32px;
}

.nav-drawer__items {
  flex: 1;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
}

.nav-drawer__item {
  display: flex;
  align-items: center;
  height: 56px;
  border-radius: 28px;
  padding: 0 24px 0 16px;
  gap: 12px;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  outline: none;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  position: relative;
}

.nav-drawer__item::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 28px;
  background-color: var(--md-sys-color-on-surface-variant, #49454f);
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.nav-drawer__item:hover::before {
  opacity: 0.08;
}

.nav-drawer__item:active::before {
  opacity: 0.12;
}

.nav-drawer__item--active {
  background-color: var(--md-sys-color-secondary-container, #e8def8);
  color: var(--md-sys-color-on-secondary-container, #1d192b);
}

.nav-drawer__item--active::before {
  background-color: var(--md-sys-color-on-secondary-container, #1d192b);
}

.nav-drawer__icon {
  font-family: 'Material Symbols Rounded';
  font-size: 24px;
  font-variation-settings: "FILL" 0, "wght" 400, "opsz" 24;
  transition: font-variation-settings 0.2s cubic-bezier(0.2, 0, 0, 1);
  position: relative;
  z-index: 1;
}

.nav-drawer__item--active .nav-drawer__icon {
  font-variation-settings: "FILL" 1, "wght" 400, "opsz" 24;
}

.nav-drawer__label {
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.1px;
  font-variation-settings: "GRAD" 0;
  transition: font-variation-settings 0.2s cubic-bezier(0.2, 0, 0, 1);
  position: relative;
  z-index: 1;
}

.nav-drawer__item--active .nav-drawer__label {
  font-variation-settings: "GRAD" 125;
}

.nav-drawer__footer {
  padding: 12px 16px 16px;
  border-top: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
  margin-top: auto;
}

.nav-drawer__footer-link {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 48px;
  border-radius: 24px;
  padding: 0 16px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  position: relative;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
  transition: background-color 0.2s;
}

.nav-drawer__footer-link:hover {
  background-color: color-mix(in srgb, var(--md-sys-color-on-surface-variant, #49454f) 8%, transparent);
}

/* ======== 主题面板（Teleported to body，需要全局选择器） ======== */
:global(#theme-menu) {
  --md-menu-container-color: var(--md-sys-color-surface-container-high, #ece6f0);
  --md-menu-container-shape: 16px;
  --md-menu-container-elevation: 3;
}

.theme-panel {
  padding: 16px;
  min-width: 300px;
  max-width: 340px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.theme-panel__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.theme-panel__header-icon {
  font-size: 24px;
  color: var(--md-sys-color-primary, #6750a4);
}

.theme-panel__header-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

.theme-panel__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.theme-panel__label {
  font-size: 12px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.theme-panel__color-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.theme-panel__color-swatch {
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  padding: 0;
  background: none;
}

.theme-panel__color-swatch::-webkit-color-swatch-wrapper {
  padding: 0;
}

.theme-panel__color-swatch::-webkit-color-swatch {
  border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
  border-radius: 12px;
}

.theme-panel__slider-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.theme-panel__slider-row md-slider {
  flex: 1;
}

.theme-panel__slider-value {
  font-size: 12px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  min-width: 28px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* 明暗模式按钮组 */
.theme-panel__mode-buttons {
  display: flex;
  border: 1px solid var(--md-sys-color-outline, #79747e);
  border-radius: 20px;
  overflow: hidden;
}

.theme-mode-btn {
  flex: 1;
  height: 40px;
  border: none;
  background: none;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s, color 0.2s;
  position: relative;
}

.theme-mode-btn:not(:last-child) {
  border-right: 1px solid var(--md-sys-color-outline, #79747e);
}

.theme-mode-btn:hover {
  background-color: color-mix(in srgb, var(--md-sys-color-on-surface-variant, #49454f) 8%, transparent);
}

.theme-mode-btn.selected {
  background-color: var(--md-sys-color-secondary-container, #e8def8);
  color: var(--md-sys-color-on-secondary-container, #1d192b);
}

.theme-mode-btn .material-symbols-rounded {
  font-size: 20px;
}

/* ======== 二级子菜单面板 ======== */
.sub-panel {
  position: fixed;
  left: 80px;
  top: 0;
  bottom: 0;
  width: 256px;
  background-color: var(--md-sys-color-surface-2, #f3edf7);
  z-index: 99;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 宽屏 inline 面板：与 Rail 同色视觉一体，右侧柔和阴影 */
.sub-panel--inline {
  box-shadow: 1px 0 2px 0 rgba(0, 0, 0, 0.08), 2px 0 6px 0 rgba(0, 0, 0, 0.04);
}

/* 中等屏幕 hover 浮层面板：右侧柔和阴影 */
.sub-panel--hover {
  box-shadow: 1px 0 2px 0 rgba(0, 0, 0, 0.12), 2px 0 8px 2px rgba(0, 0, 0, 0.06);
  animation: sub-panel-fade-in 0.15s ease-out;
}

@keyframes sub-panel-fade-in {
  from {
    opacity: 0;
    transform: translateX(-4px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.sub-panel__items {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ======== 子面板项（m3.material.io 风格，无 ripple） ======== */
.sub-panel__item {
  display: flex;
  align-items: center;
  height: 48px;
  border-radius: 24px;
  padding: 0 20px;
  cursor: pointer;
  text-decoration: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  outline: none;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  position: relative;
  overflow: hidden;
}

/* Indicator 药丸 — ::before 伪元素（严格复刻 m3.material.io） */
.sub-panel__item::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 100px;
  opacity: 0;
  transform: scaleX(0.32);
  background-color: var(--md-sys-color-secondary-container, #e8def8);
  z-index: 0;
  /* 默认无 transition，由 --animate 控制 */
}

/* mounted 后启用 transition（严格复刻 m3：0.2s linear 同步） */
.sub-panel__item--animate::before {
  transition-duration: 0.2s;
  transition-property: transform, opacity;
  transition-timing-function: linear;
}

/* 激活态 indicator（m3: opacity:1 + scaleX(1)） */
.sub-panel__item--active::before {
  opacity: 1;
  transform: scaleX(1);
}

/* 激活态文字颜色 */
.sub-panel__item--active {
  color: var(--md-sys-color-on-secondary-container, #1d192b);
}

/* Hover state layer（inactive 项） */
.sub-panel__item:not(.sub-panel__item--active):hover::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 24px;
  background-color: color-mix(in srgb, var(--md-sys-color-on-surface-variant, #49454f) 8%, transparent);
  z-index: 1;
}

/* Active 项 hover 无 state layer（与 m3 一致，仅有 font-variation 变化） */

/* Pressed state layer（inactive 项） */
.sub-panel__item:not(.sub-panel__item--active):active::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 24px;
  background-color: color-mix(in srgb, var(--md-sys-color-on-surface-variant, #49454f) 12%, transparent);
  z-index: 1;
}

/* Active 项 pressed 无 state layer（与 m3 一致） */

.sub-panel__item-label {
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.1px;
  position: relative;
  z-index: 2;
  white-space: nowrap;
  font-variation-settings: "GRAD" 0;
  transition: font-variation-settings 0.2s cubic-bezier(0.2, 0, 0, 1);
}

/* 激活态标签强调加粗 */
.sub-panel__item--active .sub-panel__item-label {
  font-variation-settings: "GRAD" 125;
}

/* Hover 标签 GRAD 50 */
.sub-panel__item:not(.sub-panel__item--active):hover .sub-panel__item-label {
  font-variation-settings: "GRAD" 50;
}

/* Pressed 标签 GRAD -50 */
.sub-panel__item:active .sub-panel__item-label {
  font-variation-settings: "GRAD" -50;
}

/* ======== 响应式 ======== */
@media (max-width: 840px) {
  .app-layout__rail {
    display: none !important;
  }

  .sub-panel {
    display: none !important;
  }

  .app-layout__body {
    margin-left: 0 !important;
  }

  .mobile-top-bar {
    display: flex;
  }
}

/* ======== 暗色主题（通过 data-theme 属性切换） ======== */
:global([data-theme="dark"]) .sub-panel {
  background-color: var(--md-sys-color-surface-2, #1d1b20);
}

:global([data-theme="dark"]) .sub-panel__item::before {
  background-color: var(--md-sys-color-secondary-container, #4a4458);
}

:global([data-theme="dark"]) .sub-panel__item--active {
  color: var(--md-sys-color-on-secondary-container, #e8def8);
}

:global([data-theme="dark"]) .sub-panel__item:not(.sub-panel__item--active):hover::after {
  background-color: color-mix(in srgb, var(--md-sys-color-on-surface-variant, #cac4d0) 8%, transparent);
}

/* 暗色 active hover/pressed 无 state layer（与 m3 一致） */

:global([data-theme="dark"]) .sub-panel__item:not(.sub-panel__item--active):active::after {
  background-color: color-mix(in srgb, var(--md-sys-color-on-surface-variant, #cac4d0) 12%, transparent);
}

/* 暗色主题 - 移动端 Top Bar 和 Drawer */
:global([data-theme="dark"]) .mobile-top-bar {
  background-color: var(--md-sys-color-surface, #1c1b1f);
  color: var(--md-sys-color-on-surface, #e6e1e5);
}

:global([data-theme="dark"]) .mobile-top-bar__title {
  color: var(--md-sys-color-on-surface, #e6e1e5);
}

:global([data-theme="dark"]) .nav-drawer {
  background-color: var(--md-sys-color-surface, #1c1b1f);
}

:global([data-theme="dark"]) .nav-drawer__title {
  color: var(--md-sys-color-on-surface, #e6e1e5);
}

:global([data-theme="dark"]) .nav-drawer__item {
  color: var(--md-sys-color-on-surface-variant, #cac4d0);
}

:global([data-theme="dark"]) .nav-drawer__item--active {
  background-color: var(--md-sys-color-secondary-container, #4a4458);
  color: var(--md-sys-color-on-secondary-container, #e8def8);
}

:global([data-theme="dark"]) .nav-drawer__item::before {
  background-color: var(--md-sys-color-on-secondary-container, #e8def8);
}

:global([data-theme="dark"]) .nav-drawer__footer {
  border-top-color: var(--md-sys-color-outline-variant, #49454f);
}

:global([data-theme="dark"]) .nav-drawer__footer-link {
  color: var(--md-sys-color-on-surface-variant, #cac4d0);
}

:global([data-theme="dark"]) .mobile-top-bar__menu-btn,
:global([data-theme="dark"]) .mobile-top-bar__icon-btn {
  color: var(--md-sys-color-on-surface-variant, #cac4d0);
}

:global([data-theme="dark"]) .mobile-top-bar__menu-btn::before,
:global([data-theme="dark"]) .mobile-top-bar__icon-btn::before {
  background-color: var(--md-sys-color-on-surface-variant, #cac4d0);
}

:global([data-theme="dark"]) .theme-panel__header-icon {
  color: var(--md-sys-color-primary, #d0bcff);
}

:global([data-theme="dark"]) .theme-panel__header-title {
  color: var(--md-sys-color-on-surface, #e6e1e5);
}

:global([data-theme="dark"]) .theme-panel__label {
  color: var(--md-sys-color-on-surface-variant, #cac4d0);
}

:global([data-theme="dark"]) .theme-panel__slider-value {
  color: var(--md-sys-color-on-surface-variant, #cac4d0);
}

:global([data-theme="dark"]) .theme-mode-btn {
  color: var(--md-sys-color-on-surface-variant, #cac4d0);
  border-color: var(--md-sys-color-outline, #938f99);
}

:global([data-theme="dark"]) .theme-mode-btn.selected {
  background-color: var(--md-sys-color-secondary-container, #4a4458);
  color: var(--md-sys-color-on-secondary-container, #e8def8);
}
</style>
