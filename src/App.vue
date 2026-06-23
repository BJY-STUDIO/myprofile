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
const PERSISTENT_THRESHOLD = 1200 // 常驻模式的最小宽度

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

// 响应式断点
const isWideScreen = ref(true)       // ≥840px：Rail 可见
const isPersistentScreen = ref(false) // ≥1200px：常驻模式可用
const hoveredNavId = ref(null)       // 当前鼠标悬停的一级菜单 id
const isHoveringPanel = ref(false)   // 鼠标是否在子面板区域内

function updateScreenWidth() {
  const w = window.innerWidth
  isWideScreen.value = w >= 840
  isPersistentScreen.value = w >= PERSISTENT_THRESHOLD
}

// 首次渲染完成标记（控制 --animate class）
const subPanelTransitionsReady = ref(false)

// 首项 indicator 延迟激活标记（控制 --active class 在新面板出现时的延迟添加）
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

// 是否处于常驻模式：当前激活的一级菜单有子菜单 且 屏幕足够宽
const isPersistentPanel = computed(() => {
  return isPersistentScreen.value && !!activeSubItems.value
})

// 计算当前要显示在子面板中的子菜单项
// 优先级：hover 项 > active 项（仅 persistent 模式）
const displaySubItems = computed(() => {
  if (!isWideScreen.value) return null
  // hover 优先（悬停模式，浮动不压缩页面）
  if (hoveredNavId.value) {
    const hoverItem = navItems.find(i => i.id === hoveredNavId.value)
    if (hoverItem?.children) return hoverItem.children
  }
  // 常驻模式：显示 active 项的子菜单
  if (isPersistentPanel.value) return activeSubItems.value
  return null
})

// 当前子面板显示的是哪个父菜单（用于 Transition key 触发 fade）
const displayParentId = computed(() => {
  if (hoveredNavId.value) {
    const hoverItem = navItems.find(i => i.id === hoveredNavId.value)
    if (hoverItem?.children) return hoveredNavId.value
  }
  if (isPersistentPanel.value) return activeNavId.value
  return null
})

// 子面板是否显示（hover 模式 或 常驻模式）
const subPanelVisible = computed(() => {
  if (!isWideScreen.value) return false
  // hover 触发：任何有 children 的项被悬停时都显示
  if (hoveredNavId.value) {
    const hoverItem = navItems.find(i => i.id === hoveredNavId.value)
    if (hoverItem?.children) return true
  }
  // 常驻触发：仅在 persistent 模式下自动显示 active 项的子菜单
  return isPersistentPanel.value
})

// 当前是否为 hover 模式（非常驻）——用于 CSS 区分样式
const isHoverMode = computed(() => {
  if (!subPanelVisible.value) return false
  // 如果是因为 hover 而显示的 → hover 模式
  if (hoveredNavId.value) {
    const hoverItem = navItems.find(i => i.id === hoveredNavId.value)
    if (hoverItem?.children) return true
  }
  // 如果 active 就是当前显示的内容，但屏幕不够宽做常驻 → 也算 hover 模式
  // （中等宽度下即使选中了有子菜单的项，也用悬浮效果）
  return !isPersistentPanel.value
})

// 当子面板内容变化时（切到不同父级菜单），延迟添加 active class
// 使 indicator 能从 scaleX(0.32) 过渡到 scaleX(1)（从中间向两端展开）
watch(displaySubItems, (newItems, oldItems) => {
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

const hoverLeaveTimer = ref(null)

// hover 进入 Rail 项
function onRailItemHover(itemId) {
  if (hoverLeaveTimer.value) {
    clearTimeout(hoverLeaveTimer.value)
    hoverLeaveTimer.value = null
  }
  hoveredNavId.value = itemId
}

// hover 离开 Rail 项（延迟清除，给鼠标移到子面板留时间）
function onRailItemLeave() {
  // 只有当前 hover 项有 children 时才延迟，否则立即清除
  const item = navItems.find(i => i.id === hoveredNavId.value)
  if (item?.children) {
    hoverLeaveTimer.value = setTimeout(() => {
      hoveredNavId.value = null
    }, 150)
  } else {
    hoveredNavId.value = null
  }
}

// 鼠标进入子面板时取消离开计时 + 标记 hover 状态
function onSubPanelEnter() {
  if (hoverLeaveTimer.value) {
    clearTimeout(hoverLeaveTimer.value)
    hoverLeaveTimer.value = null
  }
  isHoveringPanel.value = true
}

// 鼠标离开子面板（延迟收缩，避免鼠标往返 rail 时闪烁）
function onSubPanelLeave() {
  isHoveringPanel.value = false
  hoverLeaveTimer.value = setTimeout(() => {
    hoveredNavId.value = null
  }, 100)
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
const drawerSubMenu = ref(null) // 当前展开的子菜单父级 id，null 表示主菜单

// 抽屉导航方向：'forward' 进入子菜单, 'back' 返回主菜单
const drawerDirection = ref('forward')

function toggleDrawer() {
  drawerOpen.value = !drawerOpen.value
  // 打开时重置到主菜单
  if (drawerOpen.value) {
    drawerSubMenu.value = null
  }
}

function closeDrawer() {
  drawerOpen.value = false
  drawerSubMenu.value = null
}

// 点击有子菜单的项 → 进入子菜单
function openDrawerSubMenu(item) {
  drawerDirection.value = 'forward'
  drawerSubMenu.value = item.id
}

// 从子菜单返回主菜单
function backToDrawerMain() {
  drawerDirection.value = 'back'
  drawerSubMenu.value = null
}

// 子菜单项点击 → 导航后关闭抽屉
function navigateDrawerSubItem(child) {
  if (child.route) router.push(child.route)
  closeDrawer()
}

// 抽屉主菜单项点击逻辑
function onDrawerItemClick(item) {
  if (item.children) {
    openDrawerSubMenu(item)
  } else {
    navigateTo(item)
  }
}

// 当前子菜单的子项列表
const drawerSubItems = computed(() => {
  if (!drawerSubMenu.value) return null
  const parent = navItems.find(i => i.id === drawerSubMenu.value)
  return parent?.children || null
})

// 当前子菜单的父级项数据
const drawerSubParent = computed(() => {
  if (!drawerSubMenu.value) return null
  return navItems.find(i => i.id === drawerSubMenu.value) || null
})

// 桌面端内容区左边距
// 只有常驻模式（persistent）才增加 240px 边距压缩内容区
// hover 模式下子面板浮动覆盖，不改变布局
const bodyMarginLeft = computed(() => {
  if (!isWideScreen.value) return '0px'
  const margin = 80 // Rail 宽度
  if (isPersistentPanel.value) return (margin + 240) + 'px'
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

    <!-- 宽屏 (≥840px)：二级子面板 -->
    <!-- hover 模式：浮动不压缩页面 | persistent 模式：常驻压缩右侧 -->
    <Transition name="sub-panel">
      <aside
        v-if="subPanelVisible && displaySubItems"
        class="sub-panel"
        :class="{
          'sub-panel--hover-mode': isHoverMode,
          'sub-panel--persistent-mode': !isHoverMode,
          'sub-panel--hovered-within': isHoveringPanel
        }"
        @mouseenter="onSubPanelEnter"
        @mouseleave="onSubPanelLeave"
      >
      <nav class="sub-panel__items">
        <Transition name="sub-content-fade" mode="out-in">
          <div :key="displayParentId" class="sub-panel__content">
            <a
              v-for="child in displaySubItems"
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
          </div>
        </Transition>
      </nav>
    </aside>
    </Transition>

    <!-- 右侧主区域 -->
    <div class="app-layout__body" :style="{ marginLeft: bodyMarginLeft }">
      <!-- 移动端：顶部 App Bar -->
      <header class="mobile-top-bar">
        <button
          class="mobile-top-bar__menu-btn"
          :aria-label="drawerOpen ? 'close menu' : 'open menu'"
          :title="drawerOpen ? 'Close' : 'Menu'"
          @click="toggleDrawer"
        >
          <span class="material-symbols-rounded">{{ drawerOpen ? 'menu_open' : 'menu' }}</span>
        </button>
        <a class="mobile-top-bar__title" href="/">Kernel's Blog</a>
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
        <router-view v-slot="{ Component }">
          <Transition name="page-fade" mode="out-in">
            <component :is="Component" :key="route.path" />
          </Transition>
        </router-view>
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
        <!-- Drawer 内部 close 按钮（官方: menu_open icon, margin: 0 0 8px 12px） -->
        <div class="nav-drawer__close-btn-wrap">
          <button
            class="nav-drawer__close-btn"
            aria-label="close menu"
            @click="closeDrawer"
          >
            <span class="material-symbols-rounded">menu_open</span>
          </button>
        </div>

        <!-- 子菜单导航容器（带淡入淡出+微位移动画，对照 m3 @fadeInOutSectionModal / @fadeInOutSubsectionModal） -->
        <div class="nav-drawer__content">
          <!-- 主菜单：离开时向左切出(fadeInOutSectionModal)，进入时从左切入 -->
          <Transition :name="drawerDirection === 'forward' ? 'drawer-section' : 'drawer-section'">
            <div v-if="!drawerSubMenu" key="main" class="nav-drawer__page">
              <nav class="nav-drawer__items">
                <a
                  v-for="item in navItems"
                  :key="item.id"
                  class="nav-drawer__item"
                  :class="{ 'nav-drawer__item--active': activeNavId === item.id }"
                  @click.prevent="onDrawerItemClick(item)"
                >
                  <span class="material-symbols-rounded nav-drawer__icon">{{ item.icon }}</span>
                  <span class="nav-drawer__label">{{ item.label }}</span>
                  <span v-if="item.children" class="material-symbols-rounded nav-drawer__arrow">arrow_forward</span>
                </a>
              </nav>
            </div>
          </Transition>

          <!-- 子菜单：进入时从右切入(fadeInOutSubsectionModal)，离开时向右切出 -->
          <Transition :name="drawerDirection === 'forward' ? 'drawer-subsection' : 'drawer-subsection'">
            <div v-if="drawerSubMenu" key="sub" class="nav-drawer__page">
              <!-- 返回主菜单按钮（官方: arrow_back + "Main menu"） -->
              <div class="nav-drawer__back" role="button" aria-label="back to main menu" @click="backToDrawerMain">
                <span class="material-symbols-rounded nav-drawer__back-icon">arrow_back</span>
                <span class="nav-drawer__back-label">Main menu</span>
              </div>
              <nav class="nav-drawer__items">
                <a
                  v-for="child in drawerSubItems"
                  :key="child.id"
                  class="nav-drawer__item"
                  :class="{ 'nav-drawer__item--active': activeSubItemId === child.id }"
                  @click.prevent="navigateDrawerSubItem(child)"
                >
                  <span class="nav-drawer__label">{{ child.label }}</span>
                </a>
              </nav>
            </div>
          </Transition>
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
  height: 100%;
  display: flex;
  flex-direction: row;
  overflow: hidden;
}

.app-layout__body {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: margin-left 0.3s cubic-bezier(0.2, 0, 0, 1);
}

/* ======== 主内容区（滚动容器，匹配 m3 .page-content） ======== */
.app-main {
  flex: 1;
  padding: 0;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
  overflow-y: auto;
}

/* 页面切换 fadeIn 过渡
 * m3 ng-trigger-fadeIn: opacity 0→1 + translateY(10px→0)
 * FADE_IN = 200ms delay + 200ms linear
 * FADE_OUT = 100ms cubic-bezier(0.2,0,0,1) */
.page-fade-enter-active {
  transition: opacity 200ms linear 200ms, transform 200ms linear 200ms;
}
.page-fade-leave-active {
  transition: opacity 100ms cubic-bezier(0.2, 0, 0, 1), transform 100ms cubic-bezier(0.2, 0, 0, 1);
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.page-fade-leave-to {
  opacity: 0;
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
  text-decoration: none;
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

/* ======== Navigation Drawer（移动端，严格对照 m3.material.io） ======== */
/* m3 实测数据: drawer width=320px, bg=surface-2, border-radius: 0 16px 16px 0, border-left: 1px solid surface-variant */
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
  width: 320px;
  max-width: calc(100vw - 56px);
  background-color: var(--md-sys-color-surface-2, #f3edf7);
  border-left: 1px solid var(--md-sys-color-surface-variant, #e7e0ec);
  z-index: 201;
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1),
              box-shadow 0.3s cubic-bezier(0.2, 0, 0, 1);
  display: flex;
  flex-direction: column;
  border-radius: 0 16px 16px 0;
  box-shadow: var(--md-sys-elevation-2, 0 1px 2px 0 rgba(0,0,0,0.3), 0 2px 6px 2px rgba(0,0,0,0.15));
}

.nav-drawer--open {
  transform: translateX(0);
}

/* Drawer 内部的 close 按钮（官方: mio-icon-button icon="menu_open"） */
/* m3 实测: margin: 0 0 8px 12px, width/height: 48px */
.nav-drawer__close-btn-wrap {
  flex-shrink: 0;
  padding: 12px 0 0 0;
}

.nav-drawer__close-btn {
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
  margin: 0 0 8px 12px;
  position: relative;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
}

.nav-drawer__close-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 24px;
  background-color: var(--md-sys-color-on-surface-variant, #49454f);
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.nav-drawer__close-btn:hover::before {
  opacity: 0.08;
}

.nav-drawer__close-btn:active::before {
  opacity: 0.12;
}

.nav-drawer__close-btn .material-symbols-rounded {
  font-size: 24px;
  font-variation-settings: "wght" 400, "opsz" 24;
  transition: font-variation-settings 0.2s cubic-bezier(0.2, 0, 0, 1);
  position: relative;
  z-index: 1;
}

.nav-drawer__close-btn:hover .material-symbols-rounded {
  font-variation-settings: "wght" 600, "opsz" 24;
}

.nav-drawer__close-btn:active .material-symbols-rounded {
  font-variation-settings: "wght" 300, "opsz" 24;
}

/* 滑动容器 — overflow:hidden 裁剪超出部分 */
.nav-drawer__content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* 每一页（主菜单 / 子菜单）占满容器 */
.nav-drawer__page {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
}

/* ======== 子菜单淡入淡出动画（严格对照 m3 源码） ======== */
/* m3 定义了 3 个 Angular animation trigger:
 *   1. fadeInOut               — 纯 opacity (桌面端 nav item 切换)
 *   2. fadeInOutSectionModal   — opacity + translateX(-10px) (主菜单离开：向左切出)
 *   3. fadeInOutSubsectionModal— opacity + translateX(10px)  (子菜单进入：从右切入)
 *
 * 时序参数:
 *   FADE_OUT = 100ms cubic-bezier(.2,0,0,1)
 *   FADE_IN  = 200ms delay + 200ms linear
 */

/* 主菜单离开：fadeInOutSectionModal — 向左 translateX(-10px) + fade out */
.drawer-section-leave-active {
  transition: opacity 100ms cubic-bezier(0.2, 0, 0, 1),
              transform 100ms cubic-bezier(0.2, 0, 0, 1);
}
.drawer-section-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

/* 子菜单进入：fadeInOutSubsectionModal — 从右 translateX(10px) → 0 + fade in */
.drawer-subsection-enter-active {
  transition: opacity 200ms linear 200ms,
              transform 200ms linear 200ms;
}
.drawer-subsection-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

/* 返回时反向：子菜单离开 — 向右 translateX(10px) + fade out */
.drawer-subsection-leave-active {
  transition: opacity 100ms cubic-bezier(0.2, 0, 0, 1),
              transform 100ms cubic-bezier(0.2, 0, 0, 1);
}
.drawer-subsection-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

/* 返回时反向：主菜单进入 — 从左 translateX(-10px) → 0 + fade in */
.drawer-section-enter-active {
  transition: opacity 200ms linear 200ms,
              transform 200ms linear 200ms;
}
.drawer-section-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

/* ======== 返回主菜单按钮（严格对照 m3 .main-menu） ======== */
/* m3 实测: height=48px, padding=0 16px, border-radius=100px, color=on-surface-variant, fontSize=16px */
.nav-drawer__back {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 16px;
  border-radius: 100px;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  font-size: 16px;
  font-weight: 500;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  margin: 0 8px; /* 对应 m3 .topic-wrapper 的 margin: 0 8px，与 .nav-drawer__items 的 padding 一致 */
}

/* m3: .main-menu:hover = background: on-surface-variant-2, color: on-surface */
.nav-drawer__back:hover {
  background-color: color-mix(in srgb, var(--md-sys-color-on-surface-variant, #49454f) 8%, transparent);
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

/* m3: .main-menu:active = background: on-surface-variant-4, color: on-surface */
.nav-drawer__back:active {
  background-color: color-mix(in srgb, var(--md-sys-color-on-surface-variant, #49454f) 12%, transparent);
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

/* m3: arrow-back-icon margin-right: 16px */
.nav-drawer__back-icon {
  font-family: 'Material Symbols Rounded';
  font-size: 24px;
  font-variation-settings: "wght" 400, "opsz" 24;
  transition: font-variation-settings 0.2s cubic-bezier(0.2, 0, 0, 1);
  margin-right: 16px;
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}

/* m3: .main-menu:hover .google-symbols = wght 600 */
.nav-drawer__back:hover .nav-drawer__back-icon {
  font-variation-settings: "wght" 600, "opsz" 24;
}

/* m3: .main-menu:active .google-symbols = wght 300 */
.nav-drawer__back:active .nav-drawer__back-icon {
  font-variation-settings: "wght" 300, "opsz" 24;
}

.nav-drawer__back-label {
  font-size: 16px;
  font-weight: 500;
  font-variation-settings: "GRAD" 0;
  transition: font-variation-settings 0.2s cubic-bezier(0.2, 0, 0, 1);
  position: relative;
  z-index: 1;
}

/* m3: .main-menu:hover .label = GRAD 50 */
.nav-drawer__back:hover .nav-drawer__back-label {
  font-variation-settings: "GRAD" 50;
}

/* m3: .main-menu:active .label = GRAD -50 */
.nav-drawer__back:active .nav-drawer__back-label {
  font-variation-settings: "GRAD" -50;
}

/* ======== Drawer 项目列表容器 ======== */
/* m3 实测: topic-wrapper margin: 0 8px; nav-drawer-section padding-bottom: 24px */
.nav-drawer__items {
  flex: 1;
  padding: 0 8px 24px;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
}

/* ======== Drawer 项目（严格对照 m3 .item） ======== */
/* m3 实测: display=flex, height=48px, padding=2px 16px, borderRadius=100px, fontSize=16px, fontWeight=500 */
.nav-drawer__item {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 2px 16px;
  border-radius: 100px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  font-size: 16px;
  font-weight: 500;
  font-variation-settings: "GRAD" 0, "opsz" 24;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  outline: none;
  text-decoration: none;
  position: relative;
  overflow: hidden;
  transition: background-color 0.2s cubic-bezier(0.2, 0, 0, 1);
}

/* m3: .item::before = indicator pill (secondary-container, scaleX(0.32), opacity 0) */
.nav-drawer__item::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 100px;
  background-color: var(--md-sys-color-secondary-container, #e8def8);
  opacity: 0;
  transform: scaleX(0.32);
  transition-duration: 0.2s;
  transition-property: transform, opacity;
  transition-timing-function: linear;
  z-index: -1;
}

/* m3: .item.active::before = opacity 1, scaleX(1) */
.nav-drawer__item--active::before {
  opacity: 1;
  transform: scaleX(1);
}

/* m3: .item.active = color on-secondary-container */
.nav-drawer__item--active {
  color: var(--md-sys-color-on-secondary-container, #1d192b);
}

/* m3: .item:hover = background on-surface-variant-2 */
.nav-drawer__item:hover {
  background-color: color-mix(in srgb, var(--md-sys-color-on-surface-variant, #49454f) 8%, transparent);
}

/* m3: .item:active = background on-surface-variant-4 */
.nav-drawer__item:active {
  background-color: color-mix(in srgb, var(--md-sys-color-on-surface-variant, #49454f) 12%, transparent);
}

/* ======== section-icon（图标） ======== */
/* m3 实测: fontSize=24px, fontVariationSettings="opsz 24, wght 400", marginRight=16px */
.nav-drawer__icon {
  font-family: 'Material Symbols Rounded';
  font-size: 24px;
  font-variation-settings: "wght" 400, "opsz" 24;
  transition: font-variation-settings 0.2s cubic-bezier(0.2, 0, 0, 1);
  margin-right: 16px;
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}

/* m3: .item:hover .google-symbols = FILL 1, wght 600, opsz 24 */
.nav-drawer__item:hover .nav-drawer__icon {
  font-variation-settings: "FILL" 1, "wght" 600, "opsz" 24;
}

/* m3: .item:active .google-symbols = FILL 1, wght 300, opsz 24 */
.nav-drawer__item:active .nav-drawer__icon {
  font-variation-settings: "FILL" 1, "wght" 300, "opsz" 24;
}

/* ======== label（文字） ======== */
/* m3 实测: fontSize=16px, fontWeight=500, GRAD=0 */
.nav-drawer__label {
  font-size: 16px;
  font-weight: 500;
  font-variation-settings: "GRAD" 0;
  transition: font-variation-settings 0.2s cubic-bezier(0.2, 0, 0, 1);
  position: relative;
  z-index: 1;
  flex-grow: 0;
}

/* m3: .item:hover .label = GRAD 50 */
.nav-drawer__item:hover .nav-drawer__label {
  font-variation-settings: "GRAD" 50;
}

/* m3: .item:active .label = GRAD -50 */
.nav-drawer__item:active .nav-drawer__label {
  font-variation-settings: "GRAD" -50;
}

/* m3: active item 的 icon 在 hover 时也是 FILL 1, wght 600 */
.nav-drawer__item--active:hover .nav-drawer__icon {
  font-variation-settings: "FILL" 1, "wght" 600, "opsz" 24;
}

/* m3: active item 的 icon 在 press 时也是 FILL 1, wght 300 */
.nav-drawer__item--active:active .nav-drawer__icon {
  font-variation-settings: "FILL" 1, "wght" 300, "opsz" 24;
}

/* m3: active item label hover = GRAD 50 */
.nav-drawer__item--active:hover .nav-drawer__label {
  font-variation-settings: "GRAD" 50;
}

/* m3: active item label press = GRAD -50 */
.nav-drawer__item--active:active .nav-drawer__label {
  font-variation-settings: "GRAD" -50;
}

/* ======== arrow-right-icon（右侧箭头，有子菜单的项） ======== */
/* m3: arrow-right-icon margin-left: auto */
.nav-drawer__arrow {
  font-family: 'Material Symbols Rounded';
  font-size: 24px;
  font-variation-settings: "wght" 400, "opsz" 24;
  transition: font-variation-settings 0.2s cubic-bezier(0.2, 0, 0, 1);
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  margin-left: auto;
}

/* m3: .item:hover .google-symbols = FILL 1, wght 600, opsz 24（箭头也受影响） */
.nav-drawer__item:hover .nav-drawer__arrow {
  font-variation-settings: "FILL" 1, "wght" 600, "opsz" 24;
}

/* m3: .item:active .google-symbols = FILL 1, wght 300, opsz 24 */
.nav-drawer__item:active .nav-drawer__arrow {
  font-variation-settings: "FILL" 1, "wght" 300, "opsz" 24;
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

/* ======== 二级子菜单面板（严格参照 m3.material.io Shadow DOM 样式） ======== */
/* m3 实测: border-radius: 0 16px 16px 0; left: 88px; top:0; bottom:0;
   background: var(--mio-theme-color-surface-2);
   border-left: 1px solid var(--mio-theme-color-surface-variant);
   box-shadow: var(--mio-theme-elevation-2); width: 240px */
.sub-panel {
  position: fixed;
  left: 80px;
  top: 0;
  bottom: 0;
  width: 240px;
  border-radius: 0 16px 16px 0;
  background-color: var(--md-sys-color-surface-2, #f3edf7);
  border-left: 1px solid var(--md-sys-color-surface-variant, #e7e0ec);
  z-index: 99;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1),
              box-shadow 0.3s cubic-bezier(0.2, 0, 0, 1);
}

/* ====== Hover 模式（悬浮浮动，不压缩页面） ====== */
/* 始终有阴影，表示浮于内容之上 */
.sub-panel--hover-mode {
  box-shadow: var(--md-sys-elevation-2, 0 1px 2px 0 rgba(0,0,0,0.3), 0 2px 6px 2px rgba(0,0,0,0.15));
}

/* ====== Persistent 模式（常驻，压缩页面） ====== */
/* 默认无阴影：通过背景色区分菜单区域和右侧页面区域 */
/* 只有鼠标进入子面板区域时才显示阴影 */
.sub-panel--persistent-mode {
  box-shadow: none;
}

.sub-panel--persistent-mode.sub-panel--hovered-within {
  box-shadow: var(--md-sys-elevation-2, 0 1px 2px 0 rgba(0,0,0,0.3), 0 2px 6px 2px rgba(0,0,0,0.15));
}

/* ====== 子面板进入/离开动画（Vue Transition） ====== */
/* m3 LEFT_NAV_SLIDE_ANIMATION: 300ms cubic-bezier(0.2, 0, 0, 1)，纯平移无 fade */
.sub-panel-enter-active {
  transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1);
}
.sub-panel-leave-active {
  transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1);
}
.sub-panel-enter-from {
  transform: translateX(-100%);
}
.sub-panel-leave-to {
  transform: translateX(-100%);
}

.sub-panel__items {
  flex: 1;
  padding: 8px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow: hidden;
}

/* 二级菜单内容切换容器 */
.sub-panel__content {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* 二级菜单内容 fadeInOut 过渡
 * m3 fadeInOut: 纯 opacity fade（桌面端子面板内容切换）
 * FADE_IN = 200ms delay + 200ms linear
 * FADE_OUT = 100ms cubic-bezier(0.2,0,0,1) */
.sub-content-fade-enter-active {
  transition: opacity 200ms linear 200ms;
}
.sub-content-fade-leave-active {
  transition: opacity 100ms cubic-bezier(0.2, 0, 0, 1);
}
.sub-content-fade-enter-from,
.sub-content-fade-leave-to {
  opacity: 0;
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

/* Indicator 药丸 — ::before（紫色，只在 active 态可见，有 scaleX 动画） */
.sub-panel__item::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 100px;
  opacity: 0;
  transform: scaleX(0.32);
  background-color: var(--md-sys-color-secondary-container, #e8def8);
  z-index: -1;
  /* 默认无 transition，由 --animate 控制 */
}

/* State layer — ::after（灰色，与一级菜单一致，hover/pressed 态） */
.sub-panel__item::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 24px;
  background-color: var(--md-sys-color-on-surface-variant, #49454f);
  opacity: 0;
  z-index: 0;
  pointer-events: none;
  transition: opacity 0.2s cubic-bezier(0.2, 0, 0, 1);
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

/* Inactive 项 hover state layer（灰色 8%） */
.sub-panel__item:not(.sub-panel__item--active):hover::after {
  opacity: 0.08;
}

/* Active 项 hover state layer */
.sub-panel__item--active:hover::after {
  opacity: 0.08;
}

/* Inactive 项 pressed state layer */
.sub-panel__item:not(.sub-panel__item--active):active::after {
  opacity: 0.12;
}

/* Active 项 pressed state layer */
.sub-panel__item--active:active::after {
  opacity: 0.12;
}

.sub-panel__item-label {
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.1px;
  position: relative;
  z-index: 1;
  white-space: nowrap;
  font-variation-settings: "GRAD" 0;
  transition: font-variation-settings 0.2s cubic-bezier(0.2, 0, 0, 1);
}

/* 激活态标签强调加粗 */
.sub-panel__item--active .sub-panel__item-label {
  font-variation-settings: "GRAD" 125;
}

/* Hover 标签 GRAD 50（所有项） */
.sub-panel__item:not(.sub-panel__item--active):hover .sub-panel__item-label {
  font-variation-settings: "GRAD" 50;
}

/* Active 项 hover 标签 GRAD 50 */
.sub-panel__item--active:hover .sub-panel__item-label {
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
  background-color: var(--md-sys-color-surface-2, #211f26);
  border-left-color: var(--md-sys-color-surface-variant, #49454f);
}

:global([data-theme="dark"]) .sub-panel__item::before {
  background-color: var(--md-sys-color-secondary-container, #4a4458);
}

:global([data-theme="dark"]) .sub-panel__item::after {
  background-color: var(--md-sys-color-on-surface-variant, #cac4d0);
}

:global([data-theme="dark"]) .sub-panel__item--active {
  color: var(--md-sys-color-on-secondary-container, #e8def8);
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
  background-color: var(--md-sys-color-surface-2, #211f26);
  border-left-color: var(--md-sys-color-surface-variant, #49454f);
}

:global([data-theme="dark"]) .nav-drawer__close-btn {
  color: var(--md-sys-color-on-surface-variant, #cac4d0);
}

:global([data-theme="dark"]) .nav-drawer__close-btn::before {
  background-color: var(--md-sys-color-on-surface-variant, #cac4d0);
}

:global([data-theme="dark"]) .nav-drawer__item {
  color: var(--md-sys-color-on-surface-variant, #cac4d0);
}

:global([data-theme="dark"]) .nav-drawer__item::before {
  background-color: var(--md-sys-color-secondary-container, #4a4458);
}

:global([data-theme="dark"]) .nav-drawer__item--active {
  color: var(--md-sys-color-on-secondary-container, #e8def8);
}

:global([data-theme="dark"]) .nav-drawer__back {
  color: var(--md-sys-color-on-surface-variant, #cac4d0);
}

:global([data-theme="dark"]) .nav-drawer__back:hover {
  color: var(--md-sys-color-on-surface, #e6e1e5);
}

:global([data-theme="dark"]) .nav-drawer__back-icon {
  color: var(--md-sys-color-on-surface-variant, #cac4d0);
}

:global([data-theme="dark"]) .nav-drawer__back-label {
  color: var(--md-sys-color-on-surface-variant, #cac4d0);
}

:global([data-theme="dark"]) .nav-drawer__arrow {
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
