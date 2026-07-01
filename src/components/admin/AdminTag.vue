<template>
  <span class="admin-tag" :style="cssVars">{{ label }}</span>
</template>

<script setup>
/**
 * 统一管理后台分类标签组件
 *
 * 颜色体系与 ArticleManager subnavCategories 一致：
 * 1. 优先读取 localStorage 中用户自定义颜色映射
 * 2. 回退到 tag 文字哈希分配预设颜色
 * 3. 兜底：development 色系
 */
import { computed, ref } from 'vue'

const props = defineProps({
  label: { type: String, required: true }
})

// 预设颜色池（与 ArticleManager PRESET_COLORS 同步）
const PRESET_COLORS = [
  { bg: '#EFF8FF', text: '#3b82f6', darkBg: '#1e3a5f', darkText: '#60a5fa' },
  { bg: '#F5F3FF', text: '#4f46e5', darkBg: '#312e81', darkText: '#a5b4fc' },
  { bg: '#ECFDF3', text: '#10b981', darkBg: '#06381f', darkText: '#34d399' },
  { bg: '#F5F3FF', text: '#8b5cf6', darkBg: '#312e81', darkText: '#c4b5fd' },
  { bg: '#FFF6ED', text: '#f59e0b', darkBg: '#3a2200', darkText: '#fbbf24' },
  { bg: '#FEF2F2', text: '#ef4444', darkBg: '#450a0a', darkText: '#fca5a5' },
  { bg: '#ECFEFF', text: '#06b6d4', darkBg: '#083344', darkText: '#67e8f9' },
  { bg: '#FDF2F8', text: '#ec4899', darkBg: '#500724', darkText: '#f9a8d4' },
]

// 全局响应式颜色版本号，任何组件修改自定义颜色时递增
const colorVersion = ref(0)

// 监听 localStorage 变化（跨组件同步）与自定义事件（同页面即时响应）
window.addEventListener('admin-tag-colors-changed', () => {
  colorVersion.value++
})

function getColorIndex(tagLabel) {
  // 触发响应式依赖（读取 colorVersion 但不使用它的值）
  void colorVersion.value
  // 尝试读取自定义颜色
  try {
    const stored = localStorage.getItem('admin-tag-colors')
    if (stored) {
      const custom = JSON.parse(stored)
      const key = tagLabel.toLowerCase()
      if (custom[key] !== undefined) return custom[key]
    }
  } catch {}
  // 哈希分配
  const key = tagLabel.toLowerCase()
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash)
  return Math.abs(hash) % PRESET_COLORS.length
}

const cssVars = computed(() => {
  const cat = PRESET_COLORS[getColorIndex(props.label)]
  return {
    '--admin-tag-bg': cat.bg,
    '--admin-tag-text': cat.text,
    '--admin-tag-dark-bg': cat.darkBg,
    '--admin-tag-dark-text': cat.darkText,
  }
})
</script>

<style scoped>
.admin-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  height: 24px;
  background: var(--admin-tag-bg);
  color: var(--admin-tag-text);
  transition: background 200ms, color 200ms;
}
</style>

<!-- 非scoped：暗色主题覆盖 -->
<style>
[data-theme="dark"] .admin-tag {
  background: var(--admin-tag-dark-bg) !important;
  color: var(--admin-tag-dark-text) !important;
}
</style>
