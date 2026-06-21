<script setup>
/**
 * Navigation Rail 组件
 * 严格遵循 Material Design 3 规范
 *
 * M3 规范要点：
 * - 宽度 80dp，固定左侧
 * - 每个目标项高度 72dp
 * - Indicator（药丸）：56x32dp，full round (16dp radius)
 * - State layer 在 indicator 内部，不在整个 item 上
 * - 选中态：secondary-container 药丸 + on-secondary-container 图标
 * - 未选中态：透明背景 + on-surface-variant 图标
 * - Hover: state layer 8% / Focus: 12% / Pressed: 12%
 * - 选中项 hover state layer 颜色用 on-secondary-container
 * - 未选中项 hover state layer 颜色用 on-surface-variant
 * - Ripple: 使用 md-ripple 官方组件，bounded 到 indicator 形状
 */
import { computed } from 'vue'
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
          <md-ripple></md-ripple>
          <span class="material-icons-round">{{ fab.icon }}</span>
        </button>
      </div>

      <div v-else class="nav-rail__fab-spacer"></div>

      <!-- 导航目标项 -->
      <div
        v-for="item in items"
        :key="item.id"
        class="nav-rail__destination"
        :class="{
          'nav-rail__destination--active': activeId === item.id,
          'nav-rail__destination--has-children': item.children,
        }"
        role="tab"
        :aria-selected="activeId === item.id"
        :aria-expanded="item.children ? activeId === item.id : undefined"
        :aria-label="item.label"
        tabindex="0"
        @click="navigate(item)"
        @keydown.enter="navigate(item)"
        @keydown.space.prevent="navigate(item)"
        @mouseenter="onItemHover(item.id)"
        @mouseleave="onItemLeave"
      >
        <!-- Indicator 容器 -->
        <div class="nav-rail__indicator">
          <!-- md-ripple bounded 到 indicator 形状 -->
          <md-ripple class="nav-rail__md-ripple"></md-ripple>
          <!-- 图标 -->
          <span class="nav-rail__icon material-icons-round">
            {{ activeId === item.id ? (item.activeIcon || item.icon) : item.icon }}
          </span>
        </div>
        <span class="nav-rail__label">{{ item.label }}</span>
      </div>
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
          <md-ripple></md-ripple>
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
          <md-ripple></md-ripple>
          <span class="material-icons-round">palette</span>
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
  background-color: var(--md-sys-color-surface, #fffbfe);
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
}

/* ======== FAB ======== */
.nav-rail__fab-container {
  padding: 16px 0 24px 0;
  display: flex;
  justify-content: center;
}

.nav-rail__fab-spacer {
  height: 16px;
}

.nav-rail__fab {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  border: none;
  background-color: var(--md-sys-color-primary-container, #eaddff);
  color: var(--md-sys-color-on-primary-container, #21005d);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  transition: box-shadow 0.2s cubic-bezier(0.2, 0, 0, 1);
  box-shadow: var(--md-sys-elevation-1, 0 1px 2px 0 rgba(0,0,0,0.3), 0 1px 3px 1px rgba(0,0,0,0.15));
}

.nav-rail__fab:hover {
  box-shadow: var(--md-sys-elevation-2, 0 1px 2px 0 rgba(0,0,0,0.3), 0 2px 6px 2px rgba(0,0,0,0.15));
}

.nav-rail__fab:active {
  box-shadow: var(--md-sys-elevation-1, 0 1px 2px 0 rgba(0,0,0,0.3), 0 1px 3px 1px rgba(0,0,0,0.15));
}

/* FAB 内 md-ripple 颜色 */
.nav-rail__fab md-ripple {
  --md-ripple-hover-color: var(--md-sys-color-on-primary-container, #21005d);
  --md-ripple-pressed-color: var(--md-sys-color-on-primary-container, #21005d);
  --md-ripple-hover-opacity: 0.08;
  --md-ripple-pressed-opacity: 0.12;
}

.nav-rail__fab .material-icons-round {
  font-size: 24px;
  position: relative;
  z-index: 1;
}

/* ======== 目标项 ======== */
.nav-rail__destination {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 72px;
  cursor: pointer;
  position: relative;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  outline: none;
  color: var(--md-sys-color-on-surface-variant, #49454f);
}

/* ======== Indicator（药丸容器） ======== */
.nav-rail__indicator {
  width: 56px;
  height: 32px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  transition: background-color 0.3s cubic-bezier(0.2, 0, 0, 1);
}

/* 选中态 - indicator 药丸背景 */
.nav-rail__destination--active .nav-rail__indicator {
  background-color: var(--md-sys-color-secondary-container, #e8def8);
}

/* md-ripple 在 indicator 内 - 未选中项 */
.nav-rail__destination:not(.nav-rail__destination--active) .nav-rail__md-ripple {
  --md-ripple-hover-color: var(--md-sys-color-on-surface-variant, #49454f);
  --md-ripple-pressed-color: var(--md-sys-color-on-surface-variant, #49454f);
  --md-ripple-hover-opacity: 0.08;
  --md-ripple-pressed-opacity: 0.12;
}

/* md-ripple 在 indicator 内 - 选中项 */
.nav-rail__destination--active .nav-rail__md-ripple {
  --md-ripple-hover-color: var(--md-sys-color-on-secondary-container, #1d192b);
  --md-ripple-pressed-color: var(--md-sys-color-on-secondary-container, #1d192b);
  --md-ripple-hover-opacity: 0.08;
  --md-ripple-pressed-opacity: 0.12;
}

/* ======== 图标 ======== */
.nav-rail__icon {
  font-size: 24px;
  line-height: 1;
  position: relative;
  z-index: 2;
  transition: color 0.2s cubic-bezier(0.2, 0, 0, 1);
}

/* 选中态图标颜色 */
.nav-rail__destination--active .nav-rail__icon {
  color: var(--md-sys-color-on-secondary-container, #1d192b);
}

/* ======== 标签 ======== */
.nav-rail__label {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.5px;
  line-height: 16px;
  margin-top: 4px;
  text-align: center;
  transition: color 0.2s cubic-bezier(0.2, 0, 0, 1);
}

.nav-rail__destination--active .nav-rail__label {
  color: var(--md-sys-color-on-surface, #1c1b1f);
  font-weight: 600;
}

/* 有子菜单的项 hover 时图标和标签加粗 */
.nav-rail__destination--has-children:hover .nav-rail__icon,
.nav-rail__destination--has-children:hover .nav-rail__label {
  font-weight: 700;
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

/* ======== 底部操作按钮 ======== */
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

.nav-rail__action-btn md-ripple {
  --md-ripple-hover-color: var(--md-sys-color-on-surface-variant, #49454f);
  --md-ripple-pressed-color: var(--md-sys-color-on-surface-variant, #49454f);
  --md-ripple-hover-opacity: 0.08;
  --md-ripple-pressed-opacity: 0.12;
}

.nav-rail__action-btn svg {
  width: 24px;
  height: 24px;
  position: relative;
  z-index: 1;
}

.nav-rail__action-btn .material-icons-round {
  font-size: 24px;
  position: relative;
  z-index: 1;
}

/* ======== 暗色主题 ======== */
@media (prefers-color-scheme: dark) {
  .nav-rail {
    background-color: var(--md-sys-color-surface, #1c1b1f);
  }

  .nav-rail__fab {
    background-color: var(--md-sys-color-primary-container, #4f378b);
    color: var(--md-sys-color-on-primary-container, #eaddff);
    box-shadow: var(--md-sys-elevation-1, 0 1px 3px 1px rgba(0,0,0,0.3));
  }

  .nav-rail__fab md-ripple {
    --md-ripple-hover-color: var(--md-sys-color-on-primary-container, #eaddff);
    --md-ripple-pressed-color: var(--md-sys-color-on-primary-container, #eaddff);
  }

  .nav-rail__fab:hover {
    box-shadow: var(--md-sys-elevation-2, 0 2px 6px 2px rgba(0,0,0,0.3));
  }

  .nav-rail__destination {
    color: var(--md-sys-color-on-surface-variant, #cac4d0);
  }

  .nav-rail__destination--active .nav-rail__indicator {
    background-color: var(--md-sys-color-secondary-container, #4a4458);
  }

  .nav-rail__destination:not(.nav-rail__destination--active) .nav-rail__md-ripple {
    --md-ripple-hover-color: var(--md-sys-color-on-surface-variant, #cac4d0);
    --md-ripple-pressed-color: var(--md-sys-color-on-surface-variant, #cac4d0);
  }

  .nav-rail__destination--active .nav-rail__md-ripple {
    --md-ripple-hover-color: var(--md-sys-color-on-secondary-container, #e8def8);
    --md-ripple-pressed-color: var(--md-sys-color-on-secondary-container, #e8def8);
  }

  .nav-rail__destination--active .nav-rail__icon {
    color: var(--md-sys-color-on-secondary-container, #e8def8);
  }

  .nav-rail__destination--active .nav-rail__label {
    color: var(--md-sys-color-on-surface, #e6e1e5);
  }

  .nav-rail__action-btn {
    color: var(--md-sys-color-on-surface-variant, #cac4d0);
  }

  .nav-rail__action-btn md-ripple {
    --md-ripple-hover-color: var(--md-sys-color-on-surface-variant, #cac4d0);
    --md-ripple-pressed-color: var(--md-sys-color-on-surface-variant, #cac4d0);
  }
}
</style>
