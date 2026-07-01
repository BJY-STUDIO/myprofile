<template>
  <header class="admin-topbar">
    <!-- 搜索框（装饰性） -->
    <div class="admin-topbar__search">
      <span class="material-symbols-rounded admin-topbar__search-icon">search</span>
      <span class="admin-topbar__search-placeholder">Search articles...</span>
      <span class="admin-topbar__search-kbd">⌘K</span>
    </div>
    <!-- 右侧操作区 -->
    <div class="admin-topbar__actions">
      <md-filled-button class="admin-topbar__new-btn" @click="$emit('new-article')">
        <span class="material-symbols-rounded admin-topbar__new-icon" slot="icon">add</span>
        New Article
      </md-filled-button>
      <button class="admin-topbar__icon-btn" aria-label="Notifications">
        <span class="material-symbols-rounded">notifications</span>
        <span class="admin-topbar__badge"></span>
      </button>
      <div class="admin-topbar__avatar">
        <span class="material-symbols-rounded">person</span>
      </div>
    </div>
  </header>
</template>

<script setup>
// 共享管理后台顶栏组件
// 通过 @new-article 事件通知父组件
defineEmits(['new-article'])
</script>

<style scoped>
.admin-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 32px;
  background: var(--md-sys-color-surface-container-lowest, #FFFFFF);
  border-bottom: 1px solid var(--md-sys-color-outline-variant, #E5E7EB);
  flex-shrink: 0;
  gap: 16px;
}

/* ======== 搜索框 ======== */
.admin-topbar__search {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  max-width: 420px;
  height: 40px;
  padding: 0 12px;
  border-radius: 8px;
  background: var(--md-sys-color-surface-container-high, #F3F4F6);
  cursor: pointer;
  transition: background 200ms ease;
}

.admin-topbar__search:hover {
  background: var(--md-sys-color-surface-container-highest, #E5E7EB);
}

.admin-topbar__search-icon {
  font-size: 16px;
  color: var(--md-sys-color-on-surface-variant, #64748B);
  flex-shrink: 0;
}

.admin-topbar__search-placeholder {
  font-size: 14px;
  font-weight: 400;
  color: var(--md-sys-color-on-surface-variant, #9CA3AF);
  flex: 1;
}

.admin-topbar__search-kbd {
  font-size: 12px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface-variant, #64748B);
  padding: 2px 6px;
  border-radius: 6px;
  background: var(--md-sys-color-surface-container-highest, #E2E8F0);
  flex-shrink: 0;
  line-height: 1.4;
}

/* ======== 右侧操作区 ======== */
.admin-topbar__actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

/* New Article 按钮 */
.admin-topbar__new-btn {
  --md-filled-button-container-color: var(--md-sys-color-primary, #635bff);
  --md-filled-button-label-text-color: var(--md-sys-color-on-primary, #FFFFFF);
  --md-filled-button-container-height: 40px;
  --md-filled-button-container-shape: 10px;
  --md-filled-button-label-text-size: 14px;
  --md-filled-button-label-text-weight: 600;
  --md-filled-button-leading-space: 20px;
  --md-filled-button-trailing-space: 20px;
}

.admin-topbar__new-icon {
  font-size: 16px;
}

/* 通知图标按钮 */
.admin-topbar__icon-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background 200ms ease;
}

.admin-topbar__icon-btn:hover {
  background: var(--md-sys-color-surface-container-high, #F3F4F6);
}

.admin-topbar__icon-btn .material-symbols-rounded {
  font-size: 20px;
  color: var(--md-sys-color-on-surface-variant, #64748B);
}

/* 通知红点 */
.admin-topbar__badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--md-sys-color-primary, #635bff);
  border: 1.5px solid var(--md-sys-color-surface-container-lowest, #FFFFFF);
}

/* 头像 */
.admin-topbar__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--md-sys-color-primary-container, #eaddff);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 200ms ease;
  flex-shrink: 0;
}

.admin-topbar__avatar:hover {
  background: var(--md-sys-color-secondary-container, #e8def8);
}

.admin-topbar__avatar .material-symbols-rounded {
  font-size: 20px;
  color: var(--md-sys-color-on-primary-container, #21005d);
}

/* ======== 响应式 ======== */
@media (max-width: 1294px) {
  .admin-topbar__search {
    max-width: 280px;
  }

  .admin-topbar {
    padding: 0 24px;
  }
}

@media (max-width: 840px) {
  .admin-topbar__search {
    display: none;
  }

  .admin-topbar {
    padding: 0 16px;
  }
}
</style>

<!-- 非scoped：暗色主题覆盖 -->
<style>
[data-theme="dark"] .admin-topbar__search {
  background: var(--md-sys-color-surface-container-high, #2a2a3e);
}

[data-theme="dark"] .admin-topbar__search:hover {
  background: var(--md-sys-color-surface-container-highest, #36343b);
}

[data-theme="dark"] .admin-topbar__icon-btn:hover {
  background: var(--md-sys-color-surface-container-high, #2a2a3e);
}

[data-theme="dark"] .admin-topbar__badge {
  border-color: var(--md-sys-color-surface-container-lowest, #0f0d13);
}
</style>
