<template>
  <span class="admin-tag" :class="colorClass" :style="cssVars">{{ label }}</span>
</template>

<script setup>
/**
 * 统一管理后台分类标签组件
 *
 * 基于 CATEGORY_MAP 将 tag 文本映射到对应分类颜色，
 * 颜色体系与 ArticleManager 侧边栏 Categories 圆点一致。
 *
 * Props:
 *   label - 标签文字（如 "Vue", "Design", "AI"）
 *
 * 颜色匹配逻辑：
 *   1. 精确匹配 CATEGORY_MAP 中的 value（不区分大小写）
 *   2. 关键词包含匹配
 *   3. 兜底：primary 色系
 */
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true }
})

// ====== 分类颜色定义（与 ArticleManager subnavCategories 一致） ======
const CATEGORY_MAP = {
  design:      { bg: '#EFF8FF', text: '#3b82f6', darkBg: '#1e3a5f', darkText: '#60a5fa' },
  development: { bg: '#F5F3FF', text: '#4f46e5', darkBg: '#312e81', darkText: '#a5b4fc' },
  ai:          { bg: '#ECFDF3', text: '#10b981', darkBg: '#06381f', darkText: '#34d399' },
  product:     { bg: '#F5F3FF', text: '#8b5cf6', darkBg: '#312e81', darkText: '#c4b5fd' },
  travel:      { bg: '#FFF6ED', text: '#f59e0b', darkBg: '#3a2200', darkText: '#fbbf24' },
}

// 关键词映射：tag 文本 → 分类 key
const TAG_KEYWORD_MAP = {
  design:      ['design', 'ui', 'css'],
  development: ['vue', 'strapi', 'deployment', 'development', 'vite', 'cloudflare', 'web components', 'md3', 'expressive', 'cms', 'headless'],
  ai:          ['ai', 'agent', 'rag', 'dynamic-color'],
  product:     ['product', 'project', 'changelog'],
  travel:      ['travel'],
}

// 匹配 tag 到分类 key
function matchCategory(tagText) {
  const t = (tagText || '').toLowerCase()
  // 精确匹配
  if (CATEGORY_MAP[t]) return t
  // 关键词包含
  for (const [key, keywords] of Object.entries(TAG_KEYWORD_MAP)) {
    if (keywords.some(k => t.includes(k))) return key
  }
  return 'development' // 兜底：primary 色系
}

const matchedKey = computed(() => matchCategory(props.label))
const colorClass = computed(() => `admin-tag--${matchedKey.value}`)

// 使用 CSS 变量传递颜色，dark mode 通过 HTML 属性选择器切换
const cssVars = computed(() => {
  const cat = CATEGORY_MAP[matchedKey.value]
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
