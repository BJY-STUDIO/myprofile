<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TopAppBar from '@/components/TopAppBar.vue'

const route = useRoute()
const router = useRouter()

const navItems = [
  { id: 'home', label: '首页', route: '/' },
  { id: 'about', label: '关于', route: '/about' },
  { id: 'blog', label: '博客', route: '/blog' },
  { id: 'projects', label: '项目', route: '/projects' },
  { id: 'contact', label: '联系', route: '/contact' },
]

const activeNavId = computed(() => {
  const matched = navItems.find(
    (item) => route.path === item.route || route.path.startsWith(item.route + '/')
  )
  return matched ? matched.id : navItems[0].id
})

function navigateTo(item) {
  if (item.route) router.push(item.route)
}
</script>

<template>
  <div class="app-layout" :data-theme-mode="activeNavId">
    <!-- Top App Bar -->
    <TopAppBar />

    <!-- 导航标签栏 -->
    <nav class="app-layout__nav" role="navigation" aria-label="Page navigation">
      <div class="app-layout__nav-inner">
        <button
          v-for="item in navItems"
          :key="item.id"
          class="nav-tab"
          :class="{ 'nav-tab--active': activeNavId === item.id }"
          @click="navigateTo(item)"
        >
          <span class="nav-tab__indicator" v-if="activeNavId === item.id"></span>
          <span class="nav-tab__label">{{ item.label }}</span>
        </button>
      </div>
    </nav>

    <!-- 主内容区 -->
    <div class="app-layout__body">
      <main class="app-main">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--md-sys-color-surface-container-low, #f7f2fa);
}

/* ======== 导航标签栏 ======== */
.app-layout__nav {
  position: sticky;
  top: 64px;
  z-index: 199;
  background-color: var(--md-sys-color-surface, #fffbfe);
  border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
}

.app-layout__nav-inner {
  display: flex;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
  gap: 4px;
  overflow-x: auto;
}

.nav-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 48px;
  padding: 0 20px;
  border: none;
  background: none;
  cursor: pointer;
  position: relative;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  outline: none;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  transition: color 0.2s cubic-bezier(0.2, 0, 0, 1);
}

.nav-tab:hover {
  background-color: var(--md-sys-color-on-surface-variant, #49454f);
  background-color: color-mix(in srgb, var(--md-sys-color-on-surface-variant, #49454f) 8%, transparent);
  border-radius: 12px;
}

.nav-tab:focus-visible {
  background-color: color-mix(in srgb, var(--md-sys-color-on-surface-variant, #49454f) 12%, transparent);
  border-radius: 12px;
}

.nav-tab--active {
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

.nav-tab__label {
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.1px;
  line-height: 20px;
}

.nav-tab--active .nav-tab__label {
  font-weight: 600;
}

/* 底部指示线 */
.nav-tab__indicator {
  position: absolute;
  bottom: 0;
  left: 20px;
  right: 20px;
  height: 3px;
  background-color: var(--md-sys-color-primary, #6750a4);
  border-radius: 3px 3px 0 0;
}

/* ======== 主内容区 ======== */
.app-layout__body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.app-main {
  flex: 1;
  padding: 32px;
  max-width: 1200px;
  width: 100%;
  box-sizing: border-box;
  margin: 0 auto;
}

/* ======== 移动端 ======== */
@media (max-width: 840px) {
  .app-layout__nav {
    top: 56px;
  }

  .app-main {
    padding: 20px 16px;
  }

  .nav-tab {
    padding: 0 14px;
    height: 44px;
  }
}
</style>
