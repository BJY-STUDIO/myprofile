<template>
  <div class="placeholder-page">
    <div class="placeholder-card">
      <span class="material-symbols-rounded placeholder-card__icon">{{ icon }}</span>
      <h1 class="placeholder-card__title">{{ title }}</h1>
      <p class="placeholder-card__desc">{{ description }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, default: 'construction' },
  title: { type: String, required: true },
  description: { type: String, default: '此页面正在建设中...' },
})
</script>

<style scoped>
/* 占位页面居中容器 */
.placeholder-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 48px);
  padding: 24px;
}

/* M3 Outlined Card */
.placeholder-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 40px;
  border-radius: 12px;
  border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
  background-color: var(--md-sys-color-surface, #fffbfe);
  max-width: 400px;
  width: 100%;
}

.placeholder-card__icon {
  font-size: 64px;
  color: var(--md-sys-color-primary, #6750a4);
  margin-bottom: 24px;
}

.placeholder-card__title {
  font-size: 24px;
  font-weight: 400;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin-bottom: 8px;
  line-height: 32px;
}

.placeholder-card__desc {
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  line-height: 20px;
}

/* ======== 暗色主题 ======== */
@media (prefers-color-scheme: dark) {
  .placeholder-card {
    border-color: var(--md-sys-color-outline-variant, #49454f);
    background-color: var(--md-sys-color-surface, #1c1b1f);
  }

  .placeholder-card__icon {
    color: var(--md-sys-color-primary, #d0bcff);
  }

  .placeholder-card__title {
    color: var(--md-sys-color-on-surface, #e6e1e5);
  }

  .placeholder-card__desc {
    color: var(--md-sys-color-on-surface-variant, #cac4d0);
  }
}
</style>
