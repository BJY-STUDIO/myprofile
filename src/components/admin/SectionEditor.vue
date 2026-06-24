<template>
  <div class="section-editor">
    <div class="section-title">
      <h2>区块与卡片管理</h2>
    </div>

    <!-- 页面选择 -->
    <div class="section-editor__selector">
      <label class="field-label">选择页面</label>
      <md-chip-set>
        <md-filter-chip
          v-for="(_, key) in pages"
          :key="key"
          :selected="selectedPageId === key"
          @click="selectedPageId = key"
          :label="key"
        ></md-filter-chip>
      </md-chip-set>
    </div>

    <!-- TOC 预览 -->
    <div v-if="tocItems.length" class="section-editor__toc">
      <label class="field-label">自动生成目录 (TOC)</label>
      <div class="toc-preview">
        <span v-for="(item, i) in tocItems" :key="i" class="toc-preview__item">
          <span class="material-symbols-rounded toc-preview__dot">{{ item.headingLevel === 'section-header' ? 'radio_button_checked' : 'radio_button_unchecked' }}</span>
          {{ item.label }}
          <span v-if="item.headingLevel === 'section-header'" class="toc-preview__badge">H2</span>
          <span v-else class="toc-preview__badge toc-preview__badge--sub">H3</span>
        </span>
      </div>
    </div>

    <!-- 区块列表 -->
    <div v-if="page" class="section-editor__sections">
      <div
        v-for="(section, si) in page.sections"
        :key="section.id"
        class="section-block"
      >
        <div class="section-block__header">
          <div class="section-block__info">
            <span class="material-symbols-rounded section-block__icon">
              {{ section.headingLevel === 'section-header' ? 'title' : 'subtitles' }}
            </span>
            <div>
              <span class="section-block__label">{{ section.label }}</span>
              <span class="section-block__meta">
                {{ section.headingLevel === 'section-header' ? 'Section Header' : 'Sub Heading' }}
                <template v-if="section.noJumplink"> | 不进 TOC</template>
                <template v-else> | 进 TOC</template>
              </span>
            </div>
          </div>
          <div class="section-block__actions">
            <md-icon-button @click="editSectionIdx = si; showSectionDialog = true">
              <span class="material-symbols-rounded">edit</span>
            </md-icon-button>
            <md-icon-button @click="removeSection(si)">
              <span class="material-symbols-rounded">delete</span>
            </md-icon-button>
          </div>
        </div>

        <!-- Feature Card -->
        <div v-if="section.feature" class="card-block card-block--feature">
          <div class="card-block__header">
            <span class="card-block__badge card-block__badge--feature">Feature Card</span>
            <div class="card-block__actions">
              <md-icon-button @click="openCardEditor(si, 'feature', 0)">
                <span class="material-symbols-rounded">edit</span>
              </md-icon-button>
              <md-icon-button @click="removeCard(si, 'feature', 0)">
                <span class="material-symbols-rounded">delete</span>
              </md-icon-button>
            </div>
          </div>
          <div class="card-block__body">
            <span class="card-block__title">{{ section.feature.title }}</span>
            <span class="card-block__excerpt">{{ section.feature.excerpt }}</span>
            <span v-if="section.feature.date" class="card-block__date">{{ section.feature.date }}</span>
          </div>
        </div>
        <div v-else class="card-block card-block--add-feature">
          <md-text-button @click="addFeatureCard(si)">
            <span class="material-symbols-rounded" slot="icon">add</span>
            添加 Feature Card
          </md-text-button>
        </div>

        <!-- Regular Cards -->
        <div class="card-block__list">
          <div
            v-for="(card, ci) in section.items"
            :key="card.id"
            class="card-block card-block--regular"
          >
            <div class="card-block__header">
              <span class="card-block__badge">Card</span>
              <div class="card-block__actions">
                <md-icon-button @click="openCardEditor(si, 'regular', ci)">
                  <span class="material-symbols-rounded">edit</span>
                </md-icon-button>
                <md-icon-button @click="removeCard(si, 'regular', ci)">
                  <span class="material-symbols-rounded">delete</span>
                </md-icon-button>
              </div>
            </div>
            <div class="card-block__body">
              <span class="card-block__title">{{ card.title }}</span>
              <span class="card-block__excerpt">{{ card.excerpt }}</span>
              <span v-if="card.date" class="card-block__date">{{ card.date }}</span>
            </div>
          </div>

          <md-text-button class="add-card-btn" @click="addRegularCard(si)">
            <span class="material-symbols-rounded" slot="icon">add</span>
            添加卡片
          </md-text-button>
        </div>
      </div>

      <!-- 添加区块 -->
      <md-filled-tonal-button @click="onAddSection" class="add-section-btn">
        <span class="material-symbols-rounded" slot="icon">add</span>
        添加区块
      </md-filled-tonal-button>
    </div>

    <div v-else class="section-editor__empty">
      <span class="material-symbols-rounded section-editor__empty-icon">dashboard</span>
      <span>请先在「页面信息」中创建一个页面</span>
    </div>

    <!-- 区块编辑对话框 -->
    <md-dialog :open="showSectionDialog" @close="showSectionDialog = false">
      <div slot="headline">{{ editSectionIdx >= 0 ? '编辑区块' : '添加区块' }}</div>
      <form slot="content" class="dialog-form" id="section-form">
        <md-outlined-text-field
          label="区块标题"
          :value="editSectionIdx >= 0 ? page?.sections?.[editSectionIdx]?.label : ''"
          id="section-label"
        ></md-outlined-text-field>
        <div class="field-group">
          <label class="field-label">标题级别</label>
          <md-outlined-segmented-button-set>
            <md-outlined-segmented-button
              :selected="dialogHeadingLevel === 'section-header'"
              @click="dialogHeadingLevel = 'section-header'"
              label="Section Header (H2)"
            ></md-outlined-segmented-button>
            <md-outlined-segmented-button
              :selected="dialogHeadingLevel === 'sub-heading'"
              @click="dialogHeadingLevel = 'sub-heading'"
              label="Sub Heading (H3)"
            ></md-outlined-segmented-button>
          </md-outlined-segmented-button-set>
        </div>
        <div class="field-group">
          <label class="field-label">加入 TOC 目录</label>
          <md-switch
            :selected="!dialogNoJumplink"
            @change="dialogNoJumplink = !$event.target.selected"
            icons
          ></md-switch>
          <span class="switch-label">{{ dialogNoJumplink ? '不加入' : '加入' }}</span>
        </div>
      </form>
      <div slot="actions">
        <md-text-button @click="showSectionDialog = false">取消</md-text-button>
        <md-filled-button form="section-form" @click="onSaveSection">保存</md-filled-button>
      </div>
    </md-dialog>

    <!-- 卡片编辑对话框 -->
    <md-dialog :open="showCardDialog" @close="showCardDialog = false">
      <div slot="headline">
        {{ cardEditType === 'feature' ? 'Feature' : 'Regular' }} Card 编辑
      </div>
      <form slot="content" class="dialog-form" id="card-form">
        <md-outlined-text-field
          label="标题"
          :value="editingCard?.title || ''"
          id="card-title"
        ></md-outlined-text-field>
        <md-outlined-text-field
          label="摘述"
          :value="editingCard?.excerpt || ''"
          id="card-excerpt"
          type="textarea"
          rows="2"
        ></md-outlined-text-field>
        <md-outlined-text-field
          label="日期 (如 2026-06-18)"
          :value="editingCard?.date || ''"
          id="card-date"
        >
          <span class="material-symbols-rounded" slot="leading-icon">calendar_today</span>
        </md-outlined-text-field>
        <md-outlined-text-field
          label="路由 (如 /blog/tech)"
          :value="editingCard?.route || ''"
          id="card-route"
        >
          <span class="material-symbols-rounded" slot="leading-icon">link</span>
        </md-outlined-text-field>
        <div class="icon-field">
          <label class="field-label">图标</label>
          <div class="icon-field__preview">
            <span class="material-symbols-rounded">{{ pickedCardIcon || editingCard?.icon || 'article' }}</span>
            <md-outlined-button type="button" @click="showCardIconPicker = !showCardIconPicker">选择图标</md-outlined-button>
          </div>
          <IconPicker
            v-if="showCardIconPicker"
            :modelValue="pickedCardIcon || editingCard?.icon || 'article'"
            @update:modelValue="onPickCardIcon"
          />
        </div>
        <md-outlined-text-field
          label="缩略图 URL"
          :value="editingCard?.image || ''"
          id="card-image"
        >
          <span class="material-symbols-rounded" slot="leading-icon">image</span>
        </md-outlined-text-field>
      </form>
      <div slot="actions">
        <md-text-button @click="showCardDialog = false">取消</md-text-button>
        <md-filled-button form="card-form" @click="onSaveCard">保存</md-filled-button>
      </div>
    </md-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { usePage } from '@/stores/blogStore'
import store from '@/stores/blogStore'
import IconPicker from './IconPicker.vue'
import '@material/web/button/filled-button'
import '@material/web/button/filled-tonal-button'
import '@material/web/button/outlined-button'
import '@material/web/button/text-button'
import '@material/web/iconbutton/icon-button'
import '@material/web/dialog/dialog'
import '@material/web/textfield/outlined-text-field'
import '@material/web/switch/switch'
import '@material/web/chips/chip-set'
import '@material/web/chips/filter-chip'
import '@material/web/labs/segmentedbuttonset/outlined-segmented-button-set'
import '@material/web/labs/segmentedbutton/outlined-segmented-button'

const pages = computed(() => store.pages)
const selectedPageId = ref(Object.keys(store.pages)[0] || '')

const pageApi = computed(() => usePage(selectedPageId.value))
const page = computed(() => store.pages[selectedPageId.value] || null)

const tocItems = computed(() => {
  if (!page.value) return []
  return pageApi.value.generateTOC()
})

// ===== 区块编辑 =====
const showSectionDialog = ref(false)
const editSectionIdx = ref(-1)
const dialogHeadingLevel = ref('sub-heading')
const dialogNoJumplink = ref(false)

function onAddSection() {
  editSectionIdx.value = -1
  dialogHeadingLevel.value = 'sub-heading'
  dialogNoJumplink.value = false
  showSectionDialog.value = true
}

function onSaveSection() {
  const label = document.getElementById('section-label')?.value?.trim() || '新分区'
  const updates = {
    label,
    headingLevel: dialogHeadingLevel.value,
    noJumplink: dialogNoJumplink.value,
  }

  if (editSectionIdx.value >= 0) {
    pageApi.value.updateSection(editSectionIdx.value, updates)
  } else {
    pageApi.value.addSection(updates)
  }
  showSectionDialog.value = false
}

function removeSection(si) {
  if (confirm(`确认删除区块「${page.value?.sections?.[si]?.label}」及其所有卡片？`)) {
    pageApi.value.removeSection(si)
  }
}

// ----- 编辑区块时初始化对话框数据 -----
watch(showSectionDialog, (open) => {
  if (open && editSectionIdx.value >= 0) {
    const section = page.value?.sections?.[editSectionIdx.value]
    if (section) {
      dialogHeadingLevel.value = section.headingLevel || 'sub-heading'
      dialogNoJumplink.value = section.noJumplink || false
    }
  }
})

// ===== 卡片编辑 =====
const showCardDialog = ref(false)
const showCardIconPicker = ref(false)
const cardEditSectionIdx = ref(-1)
const cardEditType = ref('regular')    // 'feature' | 'regular'
const cardEditCardIdx = ref(-1)
const editingCard = ref(null)
const pickedCardIcon = ref('')

function openCardEditor(si, type, ci) {
  cardEditSectionIdx.value = si
  cardEditType.value = type
  cardEditCardIdx.value = ci
  showCardIconPicker.value = false

  if (type === 'feature') {
    editingCard.value = page.value?.sections?.[si]?.feature || null
  } else {
    editingCard.value = page.value?.sections?.[si]?.items?.[ci] || null
  }
  pickedCardIcon.value = editingCard.value?.icon || 'article'
  showCardDialog.value = true
}

function onPickCardIcon(icon) {
  pickedCardIcon.value = icon
  if (editingCard.value) {
    editingCard.value = { ...editingCard.value, icon }
  }
}

function addFeatureCard(si) {
  pageApi.value.addCard(si, { title: '新 Feature Card', excerpt: '', date: '', icon: 'article', route: '' }, 'feature')
}

function addRegularCard(si) {
  pageApi.value.addCard(si, { title: '新文章', excerpt: '', date: '', icon: 'article', route: '' }, 'regular')
}

function onSaveCard() {
  const title = document.getElementById('card-title')?.value?.trim() || '新文章'
  const excerpt = document.getElementById('card-excerpt')?.value?.trim() || ''
  const date = document.getElementById('card-date')?.value?.trim() || ''
  const route = document.getElementById('card-route')?.value?.trim() || ''
  const image = document.getElementById('card-image')?.value?.trim() || ''
  const icon = pickedCardIcon.value || 'article'

  pageApi.value.updateCard(
    cardEditSectionIdx.value,
    cardEditType.value,
    cardEditCardIdx.value,
    { title, excerpt, date, route, image, icon }
  )
  showCardDialog.value = false
}

function removeCard(si, type, ci) {
  if (confirm('确认删除此卡片？')) {
    pageApi.value.removeCard(si, type, ci)
  }
}
</script>

<style scoped>
.section-editor {
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

.section-editor__selector {
  margin-bottom: 20px;
}

.field-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  margin-bottom: 8px;
  display: block;
}

/* TOC 预览 */
.section-editor__toc {
  margin-bottom: 20px;
  padding: 12px 16px;
  background: var(--md-sys-color-surface-container, #f3edf7);
  border-radius: 12px;
}

.toc-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.toc-preview__item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
}

.toc-preview__dot {
  font-size: 14px;
}

.toc-preview__badge {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--md-sys-color-primary-container, #eaddff);
  color: var(--md-sys-color-on-primary-container, #21005d);
}

.toc-preview__badge--sub {
  background: var(--md-sys-color-tertiary-container, #ffd8e4);
  color: var(--md-sys-color-on-tertiary-container, #31111d);
}

/* 区块列表 */
.section-editor__sections {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-block {
  border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
  border-radius: 16px;
  padding: 16px;
  background: var(--md-sys-color-surface-container-low, #f7f2fa);
}

.section-block__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-block__info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-block__icon {
  font-size: 22px;
  color: var(--md-sys-color-primary, #6750a4);
}

.section-block__label {
  display: block;
  font-size: 16px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

.section-block__meta {
  display: block;
  font-size: 12px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
}

.section-block__actions {
  display: flex;
  gap: 4px;
}

/* 卡片块 */
.card-block {
  border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
  border-radius: 12px;
  padding: 12px;
  margin: 8px 0;
  background: var(--md-sys-color-surface-container, #f3edf7);
}

.card-block--feature {
  border-left: 3px solid var(--md-sys-color-primary, #6750a4);
}

.card-block--add-feature {
  border-style: dashed;
  display: flex;
  justify-content: center;
  padding: 8px;
  background: none;
}

.card-block__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.card-block__badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--md-sys-color-surface-container-high, #ece6f0);
  color: var(--md-sys-color-on-surface-variant, #49454f);
}

.card-block__badge--feature {
  background: var(--md-sys-color-primary-container, #eaddff);
  color: var(--md-sys-color-on-primary-container, #21005d);
}

.card-block__actions {
  display: flex;
  gap: 2px;
}

.card-block__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-block__title {
  font-size: 14px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

.card-block__excerpt {
  font-size: 13px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-block__date {
  font-size: 12px;
  color: var(--md-sys-color-outline, #79747e);
}

.card-block__list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.add-card-btn {
  margin-top: 4px;
}

.add-section-btn {
  margin-top: 8px;
}

/* 对话框表单 */
.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 360px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.switch-label {
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  margin-left: 12px;
}

.icon-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.icon-field__preview {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-field__preview .material-symbols-rounded {
  font-size: 24px;
  color: var(--md-sys-color-primary, #6750a4);
}

.section-editor__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 0;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  font-size: 14px;
}

.section-editor__empty-icon {
  font-size: 48px;
  opacity: 0.4;
}
</style>
