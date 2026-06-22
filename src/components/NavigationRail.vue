<script setup>
/**
 * Navigation Rail 组件
 * 参照 m3.material.io 实际实现：
 *
 * 核心交互机制（无 ripple，纯 font-variation-settings + state layer）：
 *
 * 图标 (google-symbols / material-symbols)：
 *   默认:   "FILL" 0, "wght" 400, "opsz" 24
 *   hover:  "wght" 600, "opsz" 24 + 背景 state layer 8%
 *   active: "FILL" 1, "wght" 400, "opsz" 24
 *   active+hover: "FILL" 1, "wght" 600, "opsz" 24
 *   pressed:      "wght" 300, "opsz" 24 + 背景 state layer 12%
 *   active+pressed: "FILL" 1, "wght" 300, "opsz" 24
 *
 * 标签 (label)：
 *   默认:   "GRAD" 0
 *   hover:  "GRAD" 50
 *   active: "GRAD" 125
 *   pressed: "GRAD" -50
 *
 * Indicator (::before 伪元素)：
 *   默认:   opacity:0, scaleX(0.32)
 *   active: opacity:1, scaleX(1)
 *   transition: transform 0.2s linear, opacity 0.2s linear（与 m3 严格一致）
 *
 * font-variation-settings transition: 0.2s cubic-bezier(0.2, 0, 0, 1) ≈ 200ms
 */
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps({
  items: {
    type: Array,
    required: true,
    validator: (v) => v.length >= 3 && v.length <= 7,
  },
  fab: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['fab-click', 'item-hover', 'item-leave'])

const route = useRoute()
const router = useRouter()

const activeId = computed(() => {
  const matched = props.items.find((item) => {
    if (item.route) return route.path === item.route || route.path.startsWith(item.route + '/')
    return false
  })
  return matched ? matched.id : props.items[0]?.id
})

// 首次渲染完成标记——mounted 后才启用 indicator transition
const transitionsReady = ref(false)
onMounted(() => {
  requestAnimationFrame(() => {
    transitionsReady.value = true
  })
})

function navigate(item) {
  if (item.route) router.push(item.route)
}

// ======== Hover 事件 ========
function onItemHover(itemId) {
  emit('item-hover', itemId)
}

function onItemLeave() {
  emit('item-leave')
}
</script>

<template>
  <nav class="nav-rail" role="navigation" aria-label="Main navigation">
    <!-- 上半部分（可滚动）：FAB + 导航项 -->
    <div class="nav-rail__top">
      <!-- FAB 区域 -->
      <div v-if="fab" class="nav-rail__fab-container">
        <button
          class="nav-rail__fab"
          :aria-label="fab.label"
          @click="emit('fab-click')"
        >
          <span class="material-symbols-rounded">{{ fab.icon }}</span>
        </button>
      </div>

      <div v-else class="nav-rail__fab-spacer"></div>

      <!-- 导航目标项 -->
      <a
        v-for="item in items"
        :key="item.id"
        class="nav-rail__destination"
        :class="{
          'nav-rail__destination--active': activeId === item.id,
          'nav-rail__destination--has-children': item.children,
          'nav-rail__destination--animate-indicator': transitionsReady,
        }"
        role="link"
        :aria-selected="activeId === item.id"
        :aria-expanded="item.children ? activeId === item.id : undefined"
        :aria-label="item.label"
        :aria-controls="item.id"
        tabindex="0"
        @click.prevent="navigate(item)"
        @keydown.enter="navigate(item)"
        @keydown.space.prevent="navigate(item)"
        @mouseenter="onItemHover(item.id)"
        @mouseleave="onItemLeave"
      >
        <!-- 图标区域（含 indicator + state layer + 图标本身） -->
        <span class="nav-rail__icon">
          {{ activeId === item.id ? (item.activeIcon || item.icon) : item.icon }}
        </span>
        <div class="nav-rail__label">{{ item.label }}</div>
      </a>
    </div>

    <!-- 下半部分（固定底部）：GitHub + 调色板 -->
    <div class="nav-rail__bottom">
      <md-divider></md-divider>
      <div class="nav-rail__bottom-actions">
        <a
          class="nav-rail__action-btn"
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
          id="theme-btn"
          class="nav-rail__action-btn"
          aria-label="Toggle theme"
          title="Toggle theme"
        >
          <span class="material-symbols-rounded">palette</span>
        </button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
/* ======== Navigation Rail 容器 ======== */
.nav-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 80px;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
  background-color: var(--md-sys-color-surface-2, #f3edf7);
  padding: 0;
  overflow: visible;
}

/* ======== 上半部分（可滚动） ======== */
.nav-rail__top {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
}

/* ======== FAB ======== */
.nav-rail__fab-container {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.nav-rail__fab-spacer {
  height: 20px;
}

.nav-rail__fab {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  border: none;
  background-color: var(--md-sys-color-tertiary-container, #ffd8e4);
  color: var(--md-sys-color-on-surface-variant, #49454f);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: box-shadow 0.2s cubic-bezier(0.2, 0, 0, 1), color 0.2s;
}

.nav-rail__fab:hover {
  color: var(--md-sys-color-on-tertiary-container, #31111d);
}

.nav-rail__fab .material-symbols-rounded {
  font-size: 24px;
  margin-bottom: 0;
}

/* ======== 导航目标项 ======== */
/* 参照 m3.material.io .section-link 实现 */
.nav-rail__destination {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 80px;
  margin: -2px auto 14px;
  padding: 2px;
  cursor: pointer;
  text-decoration: none;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  outline: none;
  border: none;
  background: none;
  font-family: inherit;
}

.nav-rail__destination:hover,
.nav-rail__destination:focus {
  border: none;
  outline: none;
  box-shadow: none;
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

/* ======== 图标 (参照 .google-symbols) ======== */
.nav-rail__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  isolation: isolate;
  width: 56px;
  height: 32px;
  margin: 0 auto 4px;
  border-radius: 16px;
  font-family: 'Material Symbols Rounded';
  font-size: 24px;
  font-variation-settings: "FILL" 0, "wght" 400, "opsz" 24;
  transition: font-variation-settings 0.2s cubic-bezier(0.2, 0, 0, 1);
}

/* Indicator 药丸 — ::before 伪元素（严格复刻 m3.material.io） */
.nav-rail__icon::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  transform: scaleX(0.32);
  border-radius: 100px;
  background-color: var(--md-sys-color-secondary-container, #e8def8);
  z-index: 0;
  /* 默认无 transition，由 --animate-indicator 控制 */
}

/* State layer — ::after 伪元素（用 opacity 控制显隐，可动画，不遮挡 indicator） */
.nav-rail__icon::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 16px;
  background-color: var(--md-sys-color-on-surface-variant, #49454f);
  opacity: 0;
  z-index: 1;
  pointer-events: none;
  transition: opacity 0.2s cubic-bezier(0.2, 0, 0, 1);
}

/* mounted 后启用 indicator transition（严格复刻 m3：0.2s linear 同步） */
.nav-rail__destination--animate-indicator .nav-rail__icon::before {
  transition-duration: 0.2s;
  transition-property: transform, opacity;
  transition-timing-function: linear;
}

/* 激活态 indicator（m3: opacity:1 + scaleX(1)） */
.nav-rail__destination--active .nav-rail__icon::before {
  opacity: 1;
  transform: scaleX(1);
}



/* ---- Hover 交互 ---- */
/* 未选中项 hover：图标加粗 + 8% state layer */
.nav-rail__destination:not(.nav-rail__destination--active):hover .nav-rail__icon {
  font-variation-settings: "FILL" 0, "wght" 600, "opsz" 24;
}

.nav-rail__destination:not(.nav-rail__destination--active):hover .nav-rail__icon::after {
  opacity: 0.08;
}

/* 未选中项 hover：标签 GRAD 50 */
.nav-rail__destination:not(.nav-rail__destination--active):hover .nav-rail__label {
  font-variation-settings: "GRAD" 50;
}

/* 选中项 hover：图标 FILL 1 + wght 600 + 8% state layer */
.nav-rail__destination--active:hover .nav-rail__icon {
  font-variation-settings: "FILL" 1, "wght" 600, "opsz" 24;
}

.nav-rail__destination--active:hover .nav-rail__icon::after {
  opacity: 0.08;
}

/* 选中项 hover：标签 GRAD 50 */

/* ---- Active 状态 ---- */
.nav-rail__destination--active .nav-rail__icon {
  color: var(--md-sys-color-on-secondary-container, #1d192b);
  font-variation-settings: "FILL" 1, "wght" 400, "opsz" 24;
}

/* ---- Pressed 交互 ---- */
/* 未选中项 pressed：wght 300 + 12% state layer */
.nav-rail__destination:not(.nav-rail__destination--active):active .nav-rail__icon {
  font-variation-settings: "FILL" 0, "wght" 300, "opsz" 24;
}

.nav-rail__destination:not(.nav-rail__destination--active):active .nav-rail__icon::after {
  opacity: 0.12;
}

.nav-rail__destination:not(.nav-rail__destination--active):active .nav-rail__label {
  font-variation-settings: "GRAD" -50;
}

/* 选中项 pressed：FILL 1 + wght 300 + 12% state layer */
.nav-rail__destination--active:active .nav-rail__icon {
  font-variation-settings: "FILL" 1, "wght" 300, "opsz" 24;
}

.nav-rail__destination--active:active .nav-rail__icon::after {
  opacity: 0.12;
}

.nav-rail__destination--active:active .nav-rail__label {
  font-variation-settings: "GRAD" -50;
}

/* ---- 有子菜单的项 hover 时保持加粗 ---- */
.nav-rail__destination--has-children:hover .nav-rail__icon {
  font-variation-settings: "FILL" 0, "wght" 600, "opsz" 24;
}

.nav-rail__destination--has-children:hover .nav-rail__label {
  font-variation-settings: "GRAD" 50;
}

.nav-rail__destination--active.nav-rail__destination--has-children:hover .nav-rail__icon {
  font-variation-settings: "FILL" 1, "wght" 600, "opsz" 24;
}

/* ======== 标签 (参照 .label) ======== */
.nav-rail__label {
  font-family: var(--md-sys-typescale-label-medium-font, 'Google Sans Text', 'Roboto', sans-serif);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.1px;
  line-height: 16px;
  margin-bottom: 4px;
  text-align: center;
  font-variation-settings: "GRAD" 0, "opsz" 17;
  transition: font-variation-settings 0.2s cubic-bezier(0.2, 0, 0, 1),
              color 0.2s cubic-bezier(0.2, 0, 0, 1);
}

/* 激活态标签强调加粗 (GRAD 125) */
.nav-rail__destination--active .nav-rail__label {
  color: var(--md-sys-color-on-secondary-container, #1d192b);
  font-variation-settings: "GRAD" 125, "opsz" 17;
}

/* ======== 下半部分（固定底部） ======== */
.nav-rail__bottom {
  flex-shrink: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 8px;
  padding-bottom: 16px;
}

.nav-rail__bottom md-divider {
  width: 56px;
  margin-bottom: 12px;
}

.nav-rail__bottom-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

/* ======== 底部操作按钮（保留简单 state layer，无 ripple） ======== */
.nav-rail__action-btn {
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

.nav-rail__action-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 24px;
  background-color: var(--md-sys-color-on-surface-variant, #49454f);
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.nav-rail__action-btn:hover::before {
  opacity: 0.08;
}

.nav-rail__action-btn:active::before {
  opacity: 0.12;
}

.nav-rail__action-btn svg {
  width: 24px;
  height: 24px;
  position: relative;
  z-index: 1;
}

.nav-rail__action-btn .material-symbols-rounded {
  font-size: 24px;
  position: relative;
  z-index: 1;
}

/* ======== 暗色主题（通过 data-theme 属性切换） ======== */
:global([data-theme="dark"]) .nav-rail {
  background-color: var(--md-sys-color-surface-2, #1d1b20);
}

:global([data-theme="dark"]) .nav-rail__fab {
  background-color: var(--md-sys-color-tertiary-container, #633b48);
}

:global([data-theme="dark"]) .nav-rail__fab:hover {
  color: var(--md-sys-color-on-tertiary-container, #ffd8e4);
}

:global([data-theme="dark"]) .nav-rail__destination {
  color: var(--md-sys-color-on-surface-variant, #cac4d0);
}

:global([data-theme="dark"]) .nav-rail__destination:hover,
:global([data-theme="dark"]) .nav-rail__destination:focus {
  color: var(--md-sys-color-on-surface, #e6e1e5);
}

:global([data-theme="dark"]) .nav-rail__icon::before {
  background-color: var(--md-sys-color-secondary-container, #4a4458);
}

:global([data-theme="dark"]) .nav-rail__icon::after {
  background-color: var(--md-sys-color-on-surface-variant, #cac4d0);
}

:global([data-theme="dark"]) .nav-rail__destination--active .nav-rail__icon {
  color: var(--md-sys-color-on-secondary-container, #e8def8);
}

:global([data-theme="dark"]) .nav-rail__destination--active .nav-rail__label {
  color: var(--md-sys-color-on-secondary-container, #e8def8);
}

:global([data-theme="dark"]) .nav-rail__action-btn {
  color: var(--md-sys-color-on-surface-variant, #cac4d0);
}

:global([data-theme="dark"]) .nav-rail__action-btn::before {
  background-color: var(--md-sys-color-on-surface-variant, #cac4d0);
}
</style>
