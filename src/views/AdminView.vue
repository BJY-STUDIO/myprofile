<template>
  <div class="admin-view">
    <div class="admin-header">
      <h1 class="admin-header__title">博客管理</h1>
      <p class="admin-header__desc">管理导航菜单与页面交互结构。文章内容请在 <a :href="strapiAdminUrl" target="_blank" rel="noopener noreferrer">Strapi 后台</a> 编辑。</p>
    </div>

    <!-- Strapi 状态提示 -->
    <div class="admin-strapi-hint">
      <span class="material-symbols-rounded admin-strapi-hint__icon">open_in_new</span>
      <span class="admin-strapi-hint__text">
        Strapi 后台：
        <a :href="strapiAdminUrl" target="_blank" rel="noopener noreferrer" class="admin-strapi-hint__link">{{ strapiAdminUrl }}</a>
      </span>
    </div>

    <!-- 标签栏切换 -->
    <md-tabs :active-tab-index="activeTabIdx" @change="onTabChange">
      <md-secondary-tab v-for="tab in tabs" :key="tab.id" :inline-icon="true">
        <span class="material-symbols-rounded" slot="icon">{{ tab.icon }}</span>
        {{ tab.label }}
      </md-secondary-tab>
    </md-tabs>

    <!-- 内容区 -->
    <div class="admin-content">
      <NavManager v-if="activeTab === 'navigation'" />
    </div>

    <!-- Footer -->
    <MioFooter />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import NavManager from '@/components/admin/NavManager.vue'
import MioFooter from '@/components/common/MioFooter.vue'
import '@material/web/tabs/tabs'
import '@material/web/tabs/secondary-tab'

// Strapi 后台地址
const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:1337/api').replace(/\/api$/, '')
const strapiAdminUrl = `${API_BASE}/admin`

// 标签页
const tabs = [
  { id: 'navigation', label: '导航菜单', icon: 'menu' },
]
const activeTab = ref('navigation')
const activeTabIdx = computed(() => tabs.findIndex(t => t.id === activeTab.value))

function onTabChange(e) {
  const idx = e.target.activeTabIndex
  if (idx >= 0 && idx < tabs.length) activeTab.value = tabs[idx].id
}
</script>

<style scoped>
.admin-view {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}

.admin-header {
  padding: 56px;
  border-radius: 24px;
  background: var(--md-sys-color-surface-container-low, #f8f1f6);
  margin-bottom: 24px;
}

.admin-header__title {
  font-family: var(--md-sys-typescale-headline-l-font-family);
  font-size: var(--md-sys-typescale-headline-l-font-size);
  font-weight: var(--md-sys-typescale-headline-l-font-weight);
  letter-spacing: var(--md-sys-typescale-headline-l-letter-spacing);
  line-height: var(--md-sys-typescale-headline-l-line-height);
  font-variation-settings: "GRAD" var(--md-sys-typescale-headline-l-font-variation-GRAD), "opsz" var(--md-sys-typescale-headline-l-font-variation-opsz);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0 0 8px;
}

.admin-header__desc {
  font-family: var(--md-sys-typescale-body-l-font-family);
  font-size: var(--md-sys-typescale-body-l-font-size);
  font-weight: var(--md-sys-typescale-body-l-font-weight);
  letter-spacing: var(--md-sys-typescale-body-l-letter-spacing);
  line-height: var(--md-sys-typescale-body-l-line-height);
  font-variation-settings: "GRAD" var(--md-sys-typescale-body-l-font-variation-GRAD), "opsz" var(--md-sys-typescale-body-l-font-variation-opsz);
  color: var(--md-sys-color-on-surface-variant, #49454f);
  margin: 0;
}

.admin-header__desc a {
  color: var(--md-sys-color-primary, #6750a4);
  text-decoration: none;
}

.admin-header__desc a:hover {
  text-decoration: underline;
}

.admin-strapi-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--md-sys-color-surface-container, #ece7e9);
  margin-bottom: 16px;
}

.admin-strapi-hint__icon {
  font-size: 18px;
  color: var(--md-sys-color-primary, #6750a4);
}

.admin-strapi-hint__text {
  font-family: var(--md-sys-typescale-body-m-font-family);
  font-size: var(--md-sys-typescale-body-m-font-size);
  font-weight: var(--md-sys-typescale-body-m-font-weight);
  letter-spacing: var(--md-sys-typescale-body-m-letter-spacing);
  line-height: var(--md-sys-typescale-body-m-line-height);
  color: var(--md-sys-color-on-surface-variant, #49454f);
}

.admin-strapi-hint__link {
  color: var(--md-sys-color-primary, #6750a4);
  text-decoration: none;
  font-family: var(--md-sys-typescale-label-l-font-family);
  font-size: var(--md-sys-typescale-label-l-font-size);
  font-weight: var(--md-sys-typescale-label-l-font-weight);
}

.admin-strapi-hint__link:hover {
  text-decoration: underline;
}

.admin-content {
  max-width: 960px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

md-tabs {
  margin-bottom: 8px;
}

/* 暗色主题 */
:global([data-theme="dark"] .admin-header) {
  background: var(--md-sys-color-surface-container-low, #1d1b20);
}

:global([data-theme="dark"] .admin-strapi-hint) {
  background: var(--md-sys-color-surface-container, #2b292b);
}

/* 移动端 */
@media screen and (max-width: 600px) {
  .admin-header {
    padding: 32px;
  }
}
</style>
