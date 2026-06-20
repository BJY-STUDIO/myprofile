<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavigationRail from '@/components/NavigationRail.vue'

const route = useRoute()
const router = useRouter()

const navItems = [
  { id: 'home', label: '首页', icon: 'home', activeIcon: 'home', route: '/' },
  { id: 'about', label: '关于', icon: 'person_outline', activeIcon: 'person', route: '/about' },
  { id: 'blog', label: '博客', icon: 'description', activeIcon: 'description', route: '/blog' },
  { id: 'projects', label: '项目', icon: 'code', activeIcon: 'code', route: '/projects' },
  { id: 'contact', label: '联系', icon: 'mail_outline', activeIcon: 'mail', route: '/contact' },
]

const fabConfig = { icon: 'create', label: '新建' }

const activeNavId = computed(() => {
  const matched = navItems.find(
    (item) => route.path === item.route || route.path.startsWith(item.route + '/')
  )
  return matched ? matched.id : navItems[0].id
})

function navigateTo(item) {
  if (item.route) router.push(item.route)
}

function onFabClick() {
  // FAB 点击事件，后续扩展
}
</script>

<template>
  <div class="app-layout">
    <!-- 桌面端：左侧 Navigation Rail -->
    <NavigationRail
      class="app-layout__rail"
      :items="navItems"
      :fab="fabConfig"
      @fab-click="onFabClick"
    />

    <!-- 主内容区 -->
    <div class="app-layout__body">
      <main class="app-main">
        <router-view />
      </main>
    </div>

    <!-- 移动端：底部 Navigation Bar -->
    <nav class="app-layout__bottom-nav" role="navigation" aria-label="Mobile navigation">
      <div
        v-for="item in navItems"
        :key="item.id"
        class="bottom-nav__item"
        :class="{ 'bottom-nav__item--active': activeNavId === item.id }"
        @click="navigateTo(item)"
      >
        <div class="bottom-nav__indicator">
          <!-- State layer -->
          <div class="bottom-nav__state-layer"></div>
          <span class="material-icons-round bottom-nav__icon">
            {{ activeNavId === item.id ? (item.activeIcon || item.icon) : item.icon }}
          </span>
        </div>
        <span class="bottom-nav__label">{{ item.label }}</span>
      </div>
    </nav>
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
  margin-left: 80px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-main {
  flex: 1;
  padding: 24px 32px;
  max-width: 1200px;
  width: 100%;
  box-sizing: border-box;
}

/* ======== 移动端底部 Navigation Bar (M3) ======== */
.app-layout__bottom-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background-color: var(--md-sys-color-surface, #fffbfe);
  border-top: 1px solid var(--md-sys-color-outline-variant, #c4c7c5);
  z-index: 100;
  justify-content: space-around;
  align-items: center;
  padding: 0 8px;
}

.bottom-nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  cursor: pointer;
  position: relative;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  outline: none;
  color: var(--md-sys-color-on-surface-variant, #49454f);
}

/* Indicator */
.bottom-nav__indicator {
  width: 64px;
  height: 32px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  transition: background-color 0.3s cubic-bezier(0.2, 0, 0, 1);
}

.bottom-nav__item--active .bottom-nav__indicator {
  background-color: var(--md-sys-color-secondary-container, #e8def8);
}

/* State layer (在 indicator 内) */
.bottom-nav__state-layer {
  position: absolute;
  inset: 0;
  border-radius: 16px;
  opacity: 0;
  transition: opacity 0.2s cubic-bezier(0.2, 0, 0, 1);
  pointer-events: none;
  z-index: 1;
}

.bottom-nav__item:not(.bottom-nav__item--active) .bottom-nav__state-layer {
  background-color: var(--md-sys-color-on-surface-variant, #49454f);
}

.bottom-nav__item--active .bottom-nav__state-layer {
  background-color: var(--md-sys-color-on-secondary-container, #1d192b);
}

.bottom-nav__item:hover .bottom-nav__state-layer {
  opacity: 0.08;
}

.bottom-nav__item:focus-visible .bottom-nav__state-layer {
  opacity: 0.12;
}

.bottom-nav__item:active .bottom-nav__state-layer {
  opacity: 0.12;
}

/* Icon */
.bottom-nav__icon {
  font-size: 24px;
  position: relative;
  z-index: 2;
  transition: color 0.2s cubic-bezier(0.2, 0, 0, 1);
}

.bottom-nav__item--active .bottom-nav__icon {
  color: var(--md-sys-color-on-secondary-container, #1d192b);
}

/* Label */
.bottom-nav__label {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.5px;
  margin-top: 4px;
  transition: color 0.2s cubic-bezier(0.2, 0, 0, 1);
}

.bottom-nav__item--active .bottom-nav__label {
  color: var(--md-sys-color-on-surface, #1c1b1f);
  font-weight: 600;
}

/* ======== 响应式 ======== */
@media (max-width: 840px) {
  .app-layout__rail {
    display: none !important;
  }

  .app-layout__body {
    margin-left: 0;
    padding-bottom: 80px;
  }

  .app-layout__bottom-nav {
    display: flex;
  }
}

/* ======== 暗色主题 ======== */
@media (prefers-color-scheme: dark) {
  .app-layout__bottom-nav {
    background-color: var(--md-sys-color-surface, #1c1b1f);
    border-top-color: var(--md-sys-color-outline-variant, #49454f);
  }

  .bottom-nav__item {
    color: var(--md-sys-color-on-surface-variant, #cac4d0);
  }

  .bottom-nav__item--active .bottom-nav__indicator {
    background-color: var(--md-sys-color-secondary-container, #4a4458);
  }

  .bottom-nav__item:not(.bottom-nav__item--active) .bottom-nav__state-layer {
    background-color: var(--md-sys-color-on-surface-variant, #cac4d0);
  }

  .bottom-nav__item--active .bottom-nav__state-layer {
    background-color: var(--md-sys-color-on-secondary-container, #e8def8);
  }

  .bottom-nav__item--active .bottom-nav__icon {
    color: var(--md-sys-color-on-secondary-container, #e8def8);
  }

  .bottom-nav__item--active .bottom-nav__label {
    color: var(--md-sys-color-on-surface, #e6e1e5);
  }
}
</style>
