<template>
  <div class="admin-view">
    <div class="admin-view__header">
      <h1 class="admin-view__title">管理后台</h1>
      <md-outlined-button @click="onReset" title="重置为默认数据">
        <span class="material-symbols-rounded" slot="icon">restart_alt</span>
        重置数据
      </md-outlined-button>
    </div>

    <!-- 标签栏切换 -->
    <md-tabs :active-tab-index="activeTabIdx" @change="onTabChange">
      <md-secondary-tab v-for="tab in tabs" :key="tab.id" :inline-icon="true">
        <span class="material-symbols-rounded" slot="icon">{{ tab.icon }}</span>
        {{ tab.label }}
      </md-secondary-tab>
    </md-tabs>

    <!-- 内容区 -->
    <div class="admin-view__content">
      <NavManager v-if="activeTab === 'nav'" />
      <PageEditor v-else-if="activeTab === 'page'" />
      <SectionEditor v-else-if="activeTab === 'section'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { resetStore } from '@/stores/blogStore'
import NavManager from '@/components/admin/NavManager.vue'
import PageEditor from '@/components/admin/PageEditor.vue'
import SectionEditor from '@/components/admin/SectionEditor.vue'
import '@material/web/button/outlined-button'
import '@material/web/tabs/tabs'
import '@material/web/tabs/secondary-tab'

const activeTab = ref('nav')

const tabs = [
  { id: 'nav', label: '导航菜单', icon: 'menu' },
  { id: 'page', label: '页面信息', icon: 'article' },
  { id: 'section', label: '区块与卡片', icon: 'dashboard' },
]

const activeTabIdx = computed(() => tabs.findIndex(t => t.id === activeTab.value))

function onTabChange(e) {
  const idx = e.target.activeTabIndex
  if (idx >= 0 && idx < tabs.length) activeTab.value = tabs[idx].id
}

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

md-tabs {
  margin-bottom: 24px;
}

.admin-view__content {
  min-height: 400px;
}
</style>
