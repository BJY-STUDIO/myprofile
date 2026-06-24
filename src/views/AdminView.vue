<template>
  <div class="admin-view">
    <div class="admin-view__header">
      <h1 class="admin-view__title">管理后台</h1>
      <md-outlined-button @click="onReset" title="重置为默认数据">
        <md-icon slot="icon">restart_alt</md-icon>
        重置数据
      </md-outlined-button>
    </div>

    <!-- 标签栏切换 -->
    <div class="admin-view__tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="admin-tab"
        :class="{ 'admin-tab--active': activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <span class="material-symbols-rounded admin-tab__icon">{{ tab.icon }}</span>
        <span class="admin-tab__label">{{ tab.label }}</span>
      </button>
    </div>

    <!-- 内容区 -->
    <div class="admin-view__content">
      <NavManager v-if="activeTab === 'nav'" />
      <PageEditor v-else-if="activeTab === 'page'" />
      <SectionEditor v-else-if="activeTab === 'section'" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { resetStore } from '@/stores/blogStore'
import NavManager from '@/components/admin/NavManager.vue'
import PageEditor from '@/components/admin/PageEditor.vue'
import SectionEditor from '@/components/admin/SectionEditor.vue'
import '@material/web/button/outlined-button'
import '@material/web/icon/icon'

const activeTab = ref('nav')

const tabs = [
  { id: 'nav', label: '导航菜单', icon: 'menu' },
  { id: 'page', label: '页面信息', icon: 'article' },
  { id: 'section', label: '区块与卡片', icon: 'dashboard' },
]

function onReset() {
  if (confirm('确认重置所有数据为默认值？此操作不可恢复。')) {
    resetStore()
  }
}
</script>

<style scoped>
.admin-view {
  padding: 24px;
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.admin-view__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.admin-view__title {
  font-size: 28px;
  font-weight: 475;
  line-height: 36px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0;
}

.admin-view__tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
  padding-bottom: 4px;
}

.admin-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 20px 20px 0 0;
  background: none;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.1px;
  position: relative;
  transition: background-color 0.2s cubic-bezier(0.2, 0, 0, 1),
              color 0.2s cubic-bezier(0.2, 0, 0, 1);
}

.admin-tab:hover {
  background: color-mix(in srgb, var(--md-sys-color-on-surface, #1c1b1f) 8%, transparent);
}

.admin-tab--active {
  color: var(--md-sys-color-on-secondary-container, #1d192b);
  background: var(--md-sys-color-secondary-container, #e8def8);
}

.admin-tab--active:hover {
  background: color-mix(in srgb, var(--md-sys-color-secondary-container, #e8def8) 90%, var(--md-sys-color-on-surface, #1c1b1f) 8%);
}

.admin-tab__icon {
  font-size: 20px;
}

.admin-tab__label {
  font-variation-settings: "GRAD" 0;
  transition: font-variation-settings 0.2s;
}

.admin-tab--active .admin-tab__label {
  font-variation-settings: "GRAD" 125;
}

.admin-view__content {
  min-height: 400px;
}
</style>
