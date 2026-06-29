<template>
  <div class="card-style-manager">
    <div class="section-title">
      <h2>卡片样式管理</h2>
      <md-filled-tonal-button @click="onCreateSection">
        <span class="material-symbols-rounded" slot="icon">add</span>
        新建分区
      </md-filled-tonal-button>
    </div>

    <!-- 操作提示 -->
    <div v-if="operationMessage" class="operation-notice" :class="{ 'operation-notice--error': operationError }">
      <span class="material-symbols-rounded operation-notice__icon">{{ operationError ? 'error' : 'check_circle' }}</span>
      <span class="operation-notice__text">{{ operationMessage }}</span>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-hint">
      <md-circular-progress indeterminate></md-circular-progress>
      <span>加载中...</span>
    </div>

    <!-- 分区列表 -->
    <div v-else-if="sections.length" class="section-list">
      <div v-for="(sec, i) in sections" :key="sec.documentId" class="section-card">
        <div class="section-card__header">
          <div class="section-card__info">
            <div class="section-card__title-row">
              <span class="section-card__title">{{ sec.title || '(无标题)' }}</span>
              <span class="section-card__badge" :class="`section-card__badge--${sec.headingLevel}`">
                {{ sec.headingLevel === 'section-header' ? '主标题' : '副标题' }}
              </span>
              <span v-if="sec.noJumplink" class="section-card__badge section-card__badge--nojumplink">
                无跳转
              </span>
            </div>
            <div class="section-card__meta">
              <span v-if="getFeatureTitle(sec)" class="section-card__feature">
                特色：{{ getFeatureTitle(sec) }}
              </span>
              <span class="section-card__count">{{ getArticleCount(sec) }} 篇文章</span>
              <span class="section-card__sort-order">排序：{{ sec.sortOrder ?? 0 }}</span>
            </div>
          </div>
          <div class="section-card__actions">
            <md-icon-button :disabled="i === 0" @click="onMoveSection(i, i - 1)">
              <span class="material-symbols-rounded">keyboard_arrow_up</span>
            </md-icon-button>
            <md-icon-button :disabled="i === sections.length - 1" @click="onMoveSection(i, i + 1)">
              <span class="material-symbols-rounded">keyboard_arrow_down</span>
            </md-icon-button>
            <md-icon-button @click="onEditSection(i)">
              <span class="material-symbols-rounded">edit</span>
            </md-icon-button>
            <md-icon-button @click="onRemoveSection(i)">
              <span class="material-symbols-rounded">delete</span>
            </md-icon-button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-hint">暂无分区</div>

    <!-- 编辑对话框 -->
    <md-dialog :open="showDialog" @close="showDialog = false" class="edit-dialog">
      <div slot="headline">{{ editingIndex >= 0 ? '编辑分区' : '新建分区' }}</div>
      <form slot="content" class="dialog-form" id="section-form" @submit.prevent>
        <md-outlined-text-field label="分区名称" id="sec-title" :value="form.title"></md-outlined-text-field>

        <md-outlined-select id="sec-headingLevel" label="标题级别" :value="form.headingLevel" menu-positioning="fixed">
          <md-select-option value="section-header" headline="主标题 (section-header)"></md-select-option>
          <md-select-option value="sub-heading" headline="副标题 (sub-heading)"></md-select-option>
        </md-outlined-select>

        <label class="switch-field">
          <md-switch :selected="form.noJumplink" @change="form.noJumplink = $event.target.selected"></md-switch>
          <span class="switch-field__label">无跳转链接 (noJumplink)</span>
        </label>

        <md-outlined-text-field label="排序序号" id="sec-sortOrder" :value="String(form.sortOrder ?? 0)" type="number"></md-outlined-text-field>

        <!-- 特色文章选择 -->
        <md-outlined-select id="sec-featureArticle" label="特色文章（Feature Article）" :value="form.featureArticleDocId" menu-positioning="fixed">
          <md-select-option value="" headline="— 无 —"></md-select-option>
          <md-select-option v-for="art in allArticles" :key="art.documentId" :value="art.documentId" :headline="art.title || '(无标题)'"></md-select-option>
        </md-outlined-select>

        <!-- 文章列表选择 -->
        <div class="articles-select">
          <label class="select-field__label">分区文章</label>
          <div class="articles-select__list">
            <label v-for="art in allArticles" :key="art.documentId" class="article-check">
              <md-checkbox
                :checked="form.selectedArticles.includes(art.documentId)"
                @change="onToggleArticle(art.documentId, $event.target.checked)"
              ></md-checkbox>
              <span class="article-check__label">{{ art.title || '(无标题)' }}</span>
            </label>
          </div>
        </div>
      </form>
      <div slot="actions">
        <md-text-button @click="showDialog = false">取消</md-text-button>
        <md-filled-button @click="onSaveSection" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</md-filled-button>
      </div>
    </md-dialog>

    <!-- 删除确认 -->
    <md-dialog :open="showDeleteConfirm" @close="showDeleteConfirm = false">
      <div slot="headline">确认删除</div>
      <div slot="content">确定删除分区「{{ deleteTarget?.title }}」？此操作仅删除分区配置，不会删除关联的文章。</div>
      <div slot="actions">
        <md-text-button @click="showDeleteConfirm = false">取消</md-text-button>
        <md-filled-button @click="confirmDeleteSection" :disabled="saving">删除</md-filled-button>
      </div>
    </md-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { cmList, cmCreate, cmUpdate, cmDelete } from '@/services/articleService'
import '@material/web/button/filled-button'
import '@material/web/button/filled-tonal-button'
import '@material/web/button/text-button'
import '@material/web/iconbutton/icon-button'
import '@material/web/dialog/dialog'
import '@material/web/textfield/outlined-text-field'
import '@material/web/select/outlined-select'
import '@material/web/select/select-option'
import '@material/web/checkbox/checkbox'
import '@material/web/switch/switch'
import '@material/web/progress/circular-progress'

const HS_UID = 'api::home-section.home-section'
const ART_UID = 'api::article.article'

const props = defineProps({ token: { type: String, required: true } })

const sections = ref([])
const allArticles = ref([])
const loading = ref(true)
const saving = ref(false)
const showDialog = ref(false)
const showDeleteConfirm = ref(false)
const editingIndex = ref(-1)
const deleteTarget = ref(null)

const form = ref({
  title: '',
  headingLevel: 'sub-heading',
  noJumplink: false,
  sortOrder: 0,
  featureArticleDocId: '',
  selectedArticles: [],
})

// 操作提示
const operationMessage = ref('')
const operationError = ref(false)
let noticeTimer = null
function showNotice(msg, isError = false) {
  operationMessage.value = msg
  operationError.value = isError
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => { operationMessage.value = '' }, 4000)
}

// ===== 辅助方法 =====

/** 获取特色文章标题 */
function getFeatureTitle(sec) {
  const fa = sec.featureArticle
  if (!fa) return ''
  if (typeof fa === 'string') {
    const art = allArticles.value.find(a => a.documentId === fa)
    return art?.title || fa
  }
  return fa.title || ''
}

/** 获取分区文章数量 */
function getArticleCount(sec) {
  const arts = sec.articles
  if (!arts) return 0
  if (Array.isArray(arts)) return arts.length
  return 0
}

// ===== 数据加载 =====

async function loadSections() {
  try {
    const { results } = await cmList(props.token, HS_UID, {
      pageSize: 100,
      sort: ['sortOrder:asc'],
    })
    sections.value = results
  } catch (e) {
    console.error('loadSections failed:', e)
    showNotice('加载分区失败：' + (e.message || '未知错误'), true)
  }
}

async function loadAllArticles() {
  try {
    const { results } = await cmList(props.token, ART_UID, {
      pageSize: 100,
      sort: ['sortOrder:asc', 'createdAt:desc'],
    })
    allArticles.value = results
  } catch (e) {
    console.error('loadAllArticles failed:', e)
  }
}

async function loadAll() {
  loading.value = true
  await Promise.all([loadSections(), loadAllArticles()])
  loading.value = false
}

onMounted(loadAll)

// ===== 分区 CRUD =====

function onCreateSection() {
  editingIndex.value = -1
  form.value = {
    title: '',
    headingLevel: 'sub-heading',
    noJumplink: false,
    sortOrder: sections.value.length,
    featureArticleDocId: '',
    selectedArticles: [],
  }
  showDialog.value = true
}

function onEditSection(i) {
  const sec = sections.value[i]
  editingIndex.value = i

  // 从当前分区数据提取已关联的文章
  let featureDocId = ''
  if (sec.featureArticle) {
    featureDocId = typeof sec.featureArticle === 'string'
      ? sec.featureArticle
      : sec.featureArticle.documentId || ''
  }

  const selectedArticles = []
  if (Array.isArray(sec.articles)) {
    for (const art of sec.articles) {
      const docId = typeof art === 'string' ? art : art.documentId
      if (docId) selectedArticles.push(docId)
    }
  }

  form.value = {
    title: sec.title || '',
    headingLevel: sec.headingLevel || 'sub-heading',
    noJumplink: sec.noJumplink || false,
    sortOrder: sec.sortOrder ?? 0,
    featureArticleDocId: featureDocId,
    selectedArticles,
  }
  showDialog.value = true
}

async function onSaveSection() {
  const title = document.getElementById('sec-title')?.value?.trim() || ''
  const headingLevel = document.getElementById('sec-headingLevel')?.value || 'sub-heading'
  const sortOrder = parseInt(document.getElementById('sec-sortOrder')?.value) || 0
  const featureArticleDocId = document.getElementById('sec-featureArticle')?.value || ''

  const { noJumplink, selectedArticles } = form.value

  if (!title) {
    showNotice('分区名称不能为空', true)
    return
  }

  const data = { title, headingLevel, noJumplink, sortOrder }

  // 处理特色文章关联 (oneToOne)
  if (featureArticleDocId) {
    data.featureArticle = { connect: [featureArticleDocId] }
  } else {
    // 如果编辑时原来有特色文章，现在清空，需要断开
    if (editingIndex.value >= 0) {
      const sec = sections.value[editingIndex.value]
      const oldFeature = sec.featureArticle
      if (oldFeature) {
        const oldDocId = typeof oldFeature === 'string' ? oldFeature : oldFeature.documentId
        if (oldDocId) {
          data.featureArticle = { disconnect: [{ documentId: oldDocId }] }
        }
      }
    }
  }

  // 处理文章列表关联 (oneToMany)
  if (editingIndex.value >= 0) {
    const sec = sections.value[editingIndex.value]
    const oldDocIds = new Set()
    if (Array.isArray(sec.articles)) {
      for (const art of sec.articles) {
        const docId = typeof art === 'string' ? art : art.documentId
        if (docId) oldDocIds.add(docId)
      }
    }
    const newDocIds = new Set(selectedArticles)
    const connect = selectedArticles.filter(id => !oldDocIds.has(id))
    const disconnect = [...oldDocIds].filter(id => !newDocIds.has(id))

    if (connect.length > 0 || disconnect.length > 0) {
      data.articles = {}
      if (connect.length > 0) data.articles.connect = connect
      if (disconnect.length > 0) data.articles.disconnect = disconnect.map(id => ({ documentId: id }))
    }
  } else {
    // 新建分区：仅 connect
    if (selectedArticles.length > 0) {
      data.articles = { connect: selectedArticles }
    }
  }

  saving.value = true
  try {
    if (editingIndex.value >= 0) {
      const docId = sections.value[editingIndex.value].documentId
      await cmUpdate(props.token, HS_UID, docId, data)
      showNotice('分区已更新')
    } else {
      await cmCreate(props.token, HS_UID, data)
      showNotice('分区已创建')
    }
    showDialog.value = false
    await loadSections()
  } catch (e) {
    showNotice('保存失败：' + (e.message || '未知错误'), true)
  } finally {
    saving.value = false
  }
}

function onRemoveSection(i) {
  deleteTarget.value = sections.value[i]
  showDeleteConfirm.value = true
}

async function confirmDeleteSection() {
  if (!deleteTarget.value) return
  saving.value = true
  try {
    await cmDelete(props.token, HS_UID, deleteTarget.value.documentId)
    showDeleteConfirm.value = false
    deleteTarget.value = null
    showNotice('分区已删除')
    await loadSections()
  } catch (e) {
    showNotice('删除失败：' + (e.message || '未知错误'), true)
  } finally {
    saving.value = false
  }
}

// ===== 分区排序 =====

async function onMoveSection(from, to) {
  // 乐观更新：先在 UI 中移动
  const moved = sections.value.splice(from, 1)[0]
  sections.value.splice(to, 0, moved)

  // 更新所有受影响项的 sortOrder
  try {
    for (let idx = 0; idx < sections.value.length; idx++) {
      const sec = sections.value[idx]
      if (sec.documentId) {
        await cmUpdate(props.token, HS_UID, sec.documentId, { sortOrder: idx })
      }
    }
    showNotice('排序已更新')
  } catch (e) {
    showNotice('排序同步失败：' + (e.message || '未知错误'), true)
    await loadSections()
  }
}

// ===== 文章选择 =====

function onToggleArticle(docId, checked) {
  if (checked) {
    if (!form.value.selectedArticles.includes(docId)) {
      form.value.selectedArticles.push(docId)
    }
  } else {
    form.value.selectedArticles = form.value.selectedArticles.filter(id => id !== docId)
  }
}
</script>

<style scoped>
.card-style-manager {
  padding: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.section-title h2 {
  font-family: var(--md-sys-typescale-headline-m-font-family);
  font-size: var(--md-sys-typescale-headline-m-font-size);
  font-weight: var(--md-sys-typescale-headline-m-font-weight);
  letter-spacing: var(--md-sys-typescale-headline-m-letter-spacing);
  line-height: var(--md-sys-typescale-headline-m-line-height);
  font-variation-settings: "GRAD" var(--md-sys-typescale-headline-m-font-variation-GRAD), "opsz" var(--md-sys-typescale-headline-m-font-variation-opsz);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0;
}

.section-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
  border-radius: 16px;
  background: var(--md-sys-color-surface-container-low, #f8f1f6);
}

.section-card__header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.section-card__info {
  flex: 1;
  min-width: 0;
}

.section-card__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.section-card__title {
  font-family: var(--md-sys-typescale-title-m-font-family);
  font-size: var(--md-sys-typescale-title-m-font-size);
  font-weight: var(--md-sys-typescale-title-m-font-weight);
  letter-spacing: var(--md-sys-typescale-title-m-letter-spacing);
  line-height: var(--md-sys-typescale-title-m-line-height);
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

.section-card__badge {
  font-family: var(--md-sys-typescale-label-s-font-family);
  font-size: var(--md-sys-typescale-label-s-font-size);
  font-weight: var(--md-sys-typescale-label-s-font-weight);
  letter-spacing: var(--md-sys-typescale-label-s-letter-spacing);
  padding: 2px 8px;
  border-radius: 8px;
  white-space: nowrap;
}

.section-card__badge--section-header {
  background: var(--md-sys-color-primary-container, #e8def8);
  color: var(--md-sys-color-on-primary-container, #1d192b);
}

.section-card__badge--sub-heading {
  background: var(--md-sys-color-secondary-container, #e8def8);
  color: var(--md-sys-color-on-secondary-container, #1d192b);
}

.section-card__badge--nojumplink {
  background: var(--md-sys-color-tertiary-container, #ffd8e4);
  color: var(--md-sys-color-on-tertiary-container, #31111d);
}

.section-card__meta {
  display: flex;
  gap: 12px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.section-card__feature,
.section-card__count,
.section-card__sort-order {
  font-family: var(--md-sys-typescale-label-m-font-family);
  font-size: var(--md-sys-typescale-label-m-font-size);
  font-weight: var(--md-sys-typescale-label-m-font-weight);
  letter-spacing: var(--md-sys-typescale-label-m-letter-spacing);
  color: var(--md-sys-color-on-surface-variant, #49454f);
}

.section-card__actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.loading-hint,
.empty-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  font-size: 14px;
}

.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 400px;
  max-width: 560px;
}

/* select 字段标签 */
.select-field__label {
  font-size: var(--md-sys-typescale-label-small-font-size, 11px);
  font-weight: var(--md-sys-typescale-label-small-font-weight, 500);
  letter-spacing: var(--md-sys-typescale-label-small-letter-spacing, 0.5px);
  color: var(--md-sys-color-on-surface-variant, #49454f);
}

/* switch 字段 */
.switch-field {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.switch-field__label {
  font-family: var(--md-sys-typescale-body-m-font-family);
  font-size: var(--md-sys-typescale-body-m-font-size);
  font-weight: var(--md-sys-typescale-body-m-font-weight);
  letter-spacing: var(--md-sys-typescale-body-m-letter-spacing);
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

/* 文章选择列表 */
.articles-select {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.articles-select__list {
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
  border-radius: 12px;
  padding: 8px;
}

.article-check {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.article-check:hover {
  background: var(--md-sys-color-surface-container, #ece7e9);
}

.article-check md-checkbox {
  flex-shrink: 0;
}

.article-check__label {
  font-size: var(--md-sys-typescale-body-medium-font-size, 14px);
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

/* 操作提示 */
.operation-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  background: var(--md-sys-color-tertiary-container, #ffd8e4);
  margin-bottom: 12px;
  animation: fadeIn 200ms ease;
}

.operation-notice--error {
  background: var(--md-sys-color-error-container, #f9dedc);
}

.operation-notice__icon {
  font-size: 18px;
  color: var(--md-sys-color-on-tertiary-container, #31111d);
}

.operation-notice--error .operation-notice__icon {
  color: var(--md-sys-color-on-error-container, #410e0b);
}

.operation-notice__text {
  font-family: var(--md-sys-typescale-body-m-font-family);
  font-size: var(--md-sys-typescale-body-m-font-size);
  font-weight: var(--md-sys-typescale-body-m-font-weight);
  color: var(--md-sys-color-on-tertiary-container, #31111d);
}

.operation-notice--error .operation-notice__text {
  color: var(--md-sys-color-on-error-container, #410e0b);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
