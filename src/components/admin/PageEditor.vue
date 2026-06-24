<template>
  <div class="page-editor">
    <div class="section-title">
      <h2>页面信息编辑</h2>
    </div>

    <!-- 页面选择 -->
    <div class="page-editor__selector">
      <label class="field-label">选择页面</label>
      <div class="page-editor__page-list">
        <button
          v-for="(page, key) in pages"
          :key="key"
          class="page-chip"
          :class="{ 'page-chip--active': selectedPageId === key }"
          @click="selectedPageId = key"
        >
          <span class="material-symbols-rounded page-chip__icon">article</span>
          {{ page.title || key }}
        </button>
        <button class="page-chip page-chip--add" @click="onAddPage">
          <span class="material-symbols-rounded">add</span>
          新页面
        </button>
      </div>
    </div>

    <!-- 页面编辑表单 -->
    <div v-if="currentPage" class="page-editor__form">
      <md-outlined-text-field
        label="页面标题"
        :value="currentPage.title"
        @input="onFieldInput('title', $event)"
        class="field"
      ></md-outlined-text-field>

      <md-outlined-text-field
        label="页面描述"
        :value="currentPage.description"
        @input="onFieldInput('description', $event)"
        type="textarea"
        rows="3"
        class="field"
      ></md-outlined-text-field>

      <md-outlined-text-field
        label="封面图片 URL"
        :value="currentPage.heroImage"
        @input="onFieldInput('heroImage', $event)"
        class="field"
        placeholder="https://example.com/image.jpg"
      >
        <span class="material-symbols-rounded" slot="leading-icon">image</span>
      </md-outlined-text-field>

      <!-- 封面预览 -->
      <div v-if="currentPage.heroImage" class="page-editor__preview">
        <img :src="currentPage.heroImage" alt="封面预览" class="page-editor__preview-img" />
      </div>
    </div>

    <div v-else class="page-editor__empty">
      <span class="material-symbols-rounded page-editor__empty-icon">edit_note</span>
      <span>请选择或创建一个页面</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { usePage } from '@/stores/blogStore'
import store from '@/stores/blogStore'
import '@material/web/textfield/outlined-text-field'

const pages = computed(() => store.pages)
const selectedPageId = ref(Object.keys(store.pages)[0] || '')

const currentPage = computed(() => {
  return store.pages[selectedPageId.value] || null
})

// 延迟保存，避免每次击键都直接修改 store
let saveTimer = null

function onFieldInput(field, event) {
  const value = event.target.value
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    const pageApi = usePage(selectedPageId.value)
    pageApi.updatePageHeader({ [field]: value })
  }, 300)
}

function onAddPage() {
  const id = prompt('请输入页面 ID（英文，如 about、blog）')
  if (!id || !id.trim()) return
  const key = id.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '')
  if (!key) return
  if (store.pages[key]) {
    alert('该页面 ID 已存在')
    return
  }
  const pageApi = usePage(key)
  pageApi.ensurePage()
  selectedPageId.value = key
}
</script>

<style scoped>
.page-editor {
  padding: 0;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-title h2 {
  font-size: 22px;
  font-weight: 475;
  line-height: 28px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0;
}

.page-editor__selector {
  margin-bottom: 24px;
}

.field-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  margin-bottom: 8px;
  display: block;
}

.page-editor__page-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.page-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid var(--md-sys-color-outline, #79747e);
  border-radius: 20px;
  background: none;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s, color 0.2s;
}

.page-chip:hover {
  background: color-mix(in srgb, var(--md-sys-color-on-surface, #1c1b1f) 8%, transparent);
}

.page-chip--active {
  background: var(--md-sys-color-secondary-container, #e8def8);
  border-color: transparent;
  color: var(--md-sys-color-on-secondary-container, #1d192b);
}

.page-chip--add {
  border-style: dashed;
  color: var(--md-sys-color-primary, #6750a4);
}

.page-chip__icon {
  font-size: 18px;
}

.page-editor__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  width: 100%;
}

.page-editor__preview {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
  max-height: 240px;
}

.page-editor__preview-img {
  width: 100%;
  height: auto;
  display: block;
  max-height: 240px;
  object-fit: cover;
}

.page-editor__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 0;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  font-size: 14px;
}

.page-editor__empty-icon {
  font-size: 48px;
  opacity: 0.4;
}
</style>
