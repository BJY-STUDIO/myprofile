<script setup>
/**
 * Top App Bar 组件
 * 参照 material-web.dev 风格：
 * - 左侧：站点标题
 * - 右侧：GitHub 链接按钮 + 主题切换按钮（弹出菜单选色+明暗）
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { applyTheme, COLOR_SCHEMES, DARK_MODE_OPTIONS } from '@/utils/theme'

const GITHUB_REPO = 'https://github.com/BJY-STUDIO/myprofile'

// 主题菜单
const themeMenuRef = ref(null)
const themeBtnRef = ref(null)

// 当前选择
const currentScheme = ref('purple')
const currentDarkMode = ref('system')

// 打开主题菜单
function openThemeMenu() {
  if (themeMenuRef.value) themeMenuRef.value.open = true
}

// 选择色彩方案
function selectScheme(schemeId) {
  currentScheme.value = schemeId
  applyTheme(schemeId, currentDarkMode.value)
  savePrefs()
}

// 选择明暗模式
function selectDarkMode(mode) {
  currentDarkMode.value = mode
  applyTheme(currentScheme.value, mode)
  savePrefs()
}

// 持久化偏好
function savePrefs() {
  localStorage.setItem('m3-theme-scheme', currentScheme.value)
  localStorage.setItem('m3-theme-dark-mode', currentDarkMode.value)
}

function loadPrefs() {
  const scheme = localStorage.getItem('m3-theme-scheme')
  const mode = localStorage.getItem('m3-theme-dark-mode')
  if (scheme) currentScheme.value = scheme
  if (mode) currentDarkMode.value = mode
}

// 监听系统主题变化
let mediaQuery = null
function onSystemThemeChange() {
  if (currentDarkMode.value === 'system') {
    applyTheme(currentScheme.value, 'system')
  }
}

onMounted(() => {
  loadPrefs()
  applyTheme(currentScheme.value, currentDarkMode.value)
  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', onSystemThemeChange)
})

onUnmounted(() => {
  mediaQuery?.removeEventListener('change', onSystemThemeChange)
})
</script>

<template>
  <header class="top-app-bar">
    <div class="top-app-bar__content">
      <!-- 左侧标题 -->
      <div class="top-app-bar__title-area">
        <span class="top-app-bar__title">M3 Blog</span>
      </div>

      <!-- 右侧操作区 -->
      <div class="top-app-bar__actions">
        <!-- GitHub 链接 -->
        <md-icon-button
          :href="GITHUB_REPO"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
        >
          <span class="material-icons-round">code</span>
        </md-icon-button>

        <!-- 主题切换 -->
        <md-icon-button
          ref="themeBtnRef"
          aria-label="切换主题"
          @click="openThemeMenu"
        >
          <span class="material-icons-round">palette</span>
        </md-icon-button>

        <!-- 主题弹窗菜单 -->
        <md-menu ref="themeMenuRef" class="theme-menu" :anchor="themeBtnRef" has-overflow>
          <!-- 色彩方案 -->
          <div class="theme-menu__section">
            <span class="theme-menu__section-title">色彩方案</span>
          </div>
          <md-menu-item
            v-for="scheme in COLOR_SCHEMES"
            :key="scheme.id"
            :type="'button'"
            @click="selectScheme(scheme.id)"
          >
            <span
              class="theme-menu__color-dot"
              :style="{ backgroundColor: scheme.color }"
              slot="headline"
            >
              {{ scheme.label }}
            </span>
            <span
              v-if="currentScheme === scheme.id"
              class="material-icons-round theme-menu__check"
              slot="end"
            >check</span>
          </md-menu-item>

          <md-divider></md-divider>

          <!-- 明暗模式 -->
          <div class="theme-menu__section">
            <span class="theme-menu__section-title">明暗模式</span>
          </div>
          <md-menu-item
            v-for="mode in DARK_MODE_OPTIONS"
            :key="mode.id"
            :type="'button'"
            @click="selectDarkMode(mode.id)"
          >
            <span class="material-icons-round theme-menu__mode-icon" slot="start">{{ mode.icon }}</span>
            <span slot="headline">{{ mode.label }}</span>
            <span
              v-if="currentDarkMode === mode.id"
              class="material-icons-round theme-menu__check"
              slot="end"
            >check</span>
          </md-menu-item>
        </md-menu>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* ======== M3 Top App Bar ======== */
.top-app-bar {
  position: sticky;
  top: 0;
  z-index: 200;
  background-color: var(--md-sys-color-surface, #fffbfe);
  border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 16px;
}

.top-app-bar__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.top-app-bar__title-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.top-app-bar__title {
  font-size: 22px;
  font-weight: 400;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  line-height: 28px;
}

.top-app-bar__actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ======== 主题菜单 ======== */
.theme-menu {
  --md-menu-container-color: var(--md-sys-color-surface-container, #f3edf7);
  min-width: 200px;
}

.theme-menu__section {
  padding: 12px 16px 4px;
}

.theme-menu__section-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.theme-menu__color-dot {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.theme-menu__color-dot::before {
  content: '';
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: inherit;
  flex-shrink: 0;
}

.theme-menu__check {
  font-size: 18px;
  color: var(--md-sys-color-primary, #6750a4);
}

.theme-menu__mode-icon {
  font-size: 20px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
}

/* ======== 移动端 ======== */
@media (max-width: 840px) {
  .top-app-bar {
    height: 56px;
    padding: 0 8px;
  }

  .top-app-bar__title {
    font-size: 18px;
  }
}
</style>
