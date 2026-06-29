<template>
  <div class="article-manager">
    <!-- ======== 缓冲进度条 ======== -->
    <md-linear-progress
      v-if="loader.loadingActive.value"
      :class="{ 'loading-progress--fading': loader.loadingFading.value }"
      class="loading-progress"
      :value="loader.progressValue.value"
      :buffer="loader.progressBuffer.value"
    ></md-linear-progress>

    <!-- ======== 骨架屏 ======== -->
    <div v-if="!loader.dataLoaded.value" class="admin-container">
      <div class="admin-hero">
        <span class="skeleton" style="height:36px;width:40%;"></span>
        <span class="skeleton" style="height:16px;width:65%;margin-top:12px;"></span>
        <div class="admin-hero__toc" style="margin-top:24px;">
          <span v-for="n in 3" :key="'toc-sk-'+n" class="skeleton" style="height:48px;width:180px;border-radius:12px;"></span>
        </div>
      </div>
    </div>

    <!-- ======== 真实内容（fadeIn） ======== -->
    <div v-else :class="{ 'content-fadein': loader.fadeInActive.value }">
      <!-- ======== admin-container: Hero 区域 ======== -->
      <section class="admin-container">
        <div class="admin-hero">
          <h1 class="admin-hero__title">文章管理</h1>
          <p class="admin-hero__desc">创建、编辑和发布博客文章。管理文章内容、排序和发布状态。</p>
          <div class="admin-hero__toc">
            <button class="hero-toc-card" @click="onCreate">
              <span class="material-symbols-rounded hero-toc-card__icon">note_add</span>
              <div class="hero-toc-card__text">
                <span class="hero-toc-card__label">新建文章</span>
                <span class="hero-toc-card__desc">创建一篇新文章</span>
              </div>
            </button>
            <button class="hero-toc-card" @click="showPublishedFilter = !showPublishedFilter">
              <span class="material-symbols-rounded hero-toc-card__icon">filter_list</span>
              <div class="hero-toc-card__text">
                <span class="hero-toc-card__label">{{ showPublishedFilter === 'all' ? '全部文章' : showPublishedFilter === 'published' ? '已发布' : '草稿' }}</span>
                <span class="hero-toc-card__desc">{{ articles.length }} 篇文章</span>
              </div>
            </button>
            <button class="hero-toc-card" @click="reloadArticles()">
              <span class="material-symbols-rounded hero-toc-card__icon">refresh</span>
              <div class="hero-toc-card__text">
                <span class="hero-toc-card__label">刷新</span>
                <span class="hero-toc-card__desc">重新加载列表</span>
              </div>
            </button>
          </div>
        </div>
      </section>

      <!-- ======== scroll-show-container: 列表 + 编辑器 ======== -->
      <section class="scroll-show-container">
        <!-- 左侧：文章列表 -->
        <div class="section-cards">
          <div v-if="filteredArticles.length" class="section-cards__list">
            <div
              v-for="(art, i) in filteredArticles"
              :key="art.documentId"
              class="section-card"
              :class="{
                'section-card--active': editingIndex >= 0 && articles[editingIndex]?.documentId === art.documentId,
                'section-card--draft': !art.publishedAt,
              }"
              @click="onEdit(findOriginalIndex(art))"
            >
              <div class="section-card__header">
                <span class="section-card__title">{{ art.title || '(无标题)' }}</span>
                <span class="mio-icon-badge" :class="art.publishedAt ? 'mio-icon-badge--published' : 'mio-icon-badge--draft'">
                  <span class="material-symbols-rounded mio-icon-badge__icon">{{ art.publishedAt ? 'check_circle' : 'draft' }}</span>
                  {{ art.publishedAt ? '已发布' : '草稿' }}
                </span>
              </div>
              <div class="section-card__meta">
                <span v-if="art.slug" class="section-card__slug">{{ art.slug }}</span>
                <span v-if="art.date" class="section-card__date">{{ art.date }}</span>
                <span class="section-card__sort">排序: {{ art.sortOrder ?? 0 }}</span>
              </div>
              <span v-if="art.description" class="section-card__desc">{{ art.description }}</span>
              <div class="section-card__actions" @click.stop>
                <md-icon-button @click="onEdit(findOriginalIndex(art))" aria-label="编辑">
                  <span class="material-symbols-rounded">edit</span>
                </md-icon-button>
                <md-icon-button @click="onRemove(findOriginalIndex(art))" aria-label="删除">
                  <span class="material-symbols-rounded">delete</span>
                </md-icon-button>
              </div>
            </div>
          </div>
          <div v-else class="empty-hint">暂无文章</div>
        </div>

        <!-- 右侧：scroll-show 编辑器区域 -->
        <div class="scroll-show">
          <!-- 未选择文章 -->
          <div v-if="editingIndex < 0" class="editor-placeholder">
            <span class="material-symbols-rounded editor-placeholder__icon">edit_note</span>
            <p class="editor-placeholder__text">选择一篇文章开始编辑，或新建文章</p>
          </div>

          <!-- 编辑器 -->
          <div v-else class="editor">
            <div class="editor__header">
              <h2 class="editor__title">{{ form.title || '未命名文章' }}</h2>
              <div class="editor__header-actions">
                <md-icon-button @click="closeEditor" aria-label="关闭编辑器">
                  <span class="material-symbols-rounded">close</span>
                </md-icon-button>
              </div>
            </div>

            <div class="editor__body">
              <!-- 左侧：字段编辑 -->
              <div class="editor__fields">
                <md-outlined-text-field label="标题" id="art-title" :value="form.title" class="editor__field"></md-outlined-text-field>
                <md-outlined-text-field label="Slug（URL标识）" id="art-slug" :value="form.slug" helper="留空则自动从标题生成" class="editor__field"></md-outlined-text-field>
                <md-outlined-text-field label="描述" id="art-description" :value="form.description" type="textarea" rows="2" class="editor__field"></md-outlined-text-field>

                <div class="editor__field-row">
                  <md-outlined-text-field label="自定义日期" id="art-date" :value="form.date" type="date" helper="可选" class="editor__field"></md-outlined-text-field>
                  <md-outlined-text-field label="排序序号" id="art-sortOrder" :value="String(form.sortOrder ?? 0)" type="number" class="editor__field"></md-outlined-text-field>
                </div>

                <md-outlined-text-field label="标签（逗号分隔）" id="art-tags" :value="form.tagsDisplay" helper='如：技术, Vue, 前端' class="editor__field"></md-outlined-text-field>

                <!-- 发布状态开关 -->
                <div class="editor__status">
                  <label class="switch-field">
                    <md-switch :selected="form.isPublished" @change="form.isPublished = $event.target.selected"></md-switch>
                    <span class="switch-field__label">{{ form.isPublished ? '已发布' : '草稿' }}</span>
                  </label>
                  <span class="mio-icon-badge" :class="form.isPublished ? 'mio-icon-badge--published' : 'mio-icon-badge--draft'">
                    <span class="material-symbols-rounded mio-icon-badge__icon">{{ form.isPublished ? 'check_circle' : 'draft' }}</span>
                    {{ form.isPublished ? '已发布' : '草稿' }}
                  </span>
                </div>
              </div>

              <!-- 右侧：Markdown 编辑器 + 预览 -->
              <div class="editor__markdown">
                <div class="editor__markdown-tabs">
                  <button
                    class="editor__tab"
                    :class="{ 'editor__tab--active': markdownTab === 'edit' }"
                    @click="markdownTab = 'edit'"
                  >编辑</button>
                  <button
                    class="editor__tab"
                    :class="{ 'editor__tab--active': markdownTab === 'preview' }"
                    @click="markdownTab = 'preview'"
                  >预览</button>
                  <button
                    class="editor__tab"
                    :class="{ 'editor__tab--active': markdownTab === 'split' }"
                    @click="markdownTab = 'split'"
                  >分屏</button>
                </div>

                <div class="editor__markdown-body" :class="'editor__markdown-body--' + markdownTab">
                  <textarea
                    v-show="markdownTab === 'edit' || markdownTab === 'split'"
                    id="art-content"
                    class="editor__textarea"
                    :value="form.content"
                    @input="form.content = $event.target.value"
                    placeholder="在此输入 Markdown 内容..."
                  ></textarea>
                  <div
                    v-show="markdownTab === 'preview' || markdownTab === 'split'"
                    class="editor__preview markdown-body"
                    v-html="renderedMarkdown"
                  ></div>
                </div>
              </div>
            </div>

            <div class="editor__footer">
              <md-text-button @click="closeEditor">取消</md-text-button>
              <md-outlined-button @click="onSaveDraft" :disabled="saving">
                <span class="material-symbols-rounded" slot="icon">save</span>
                {{ saving ? '保存中...' : '保存草稿' }}
              </md-outlined-button>
              <md-filled-button @click="onSavePublish" :disabled="saving">
                <span class="material-symbols-rounded" slot="icon">publish</span>
                {{ saving ? '保存中...' : '保存并发布' }}
              </md-filled-button>
            </div>
          </div>
        </div>
      </section>

      <!-- 删除确认 -->
      <md-dialog :open="showDeleteConfirm" @close="showDeleteConfirm = false">
        <div slot="headline">确认删除</div>
        <div slot="content">确定删除文章「{{ deleteTarget?.title }}」？此操作不可撤销。</div>
        <div slot="actions">
          <md-text-button @click="showDeleteConfirm = false">取消</md-text-button>
          <md-filled-button @click="confirmDelete" :disabled="saving">删除</md-filled-button>
        </div>
      </md-dialog>

      <!-- 操作提示 -->
      <div v-if="operationMessage" class="operation-notice" :class="{ 'operation-notice--error': operationError }">
        <span class="material-symbols-rounded operation-notice__icon">{{ operationError ? 'error' : 'check_circle' }}</span>
        <span class="operation-notice__text">{{ operationMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { cmCreate, cmUpdate, cmDelete } from '@/services/articleService'
import { useAdminLoader } from '@/composables/useAdminLoader'
import { marked } from 'marked'
import '@material/web/button/filled-button'
import '@material/web/button/outlined-button'
import '@material/web/button/text-button'
import '@material/web/iconbutton/icon-button'
import '@material/web/dialog/dialog'
import '@material/web/textfield/outlined-text-field'
import '@material/web/switch/switch'
import '@material/web/progress/linear-progress'

const UID = 'api::article.article'

const props = defineProps({ token: { type: String, required: true } })

// ===== 共享加载控制器 =====
const loader = useAdminLoader()

const articles = ref([])
const saving = ref(false)
const showDeleteConfirm = ref(false)
const deleteTarget = ref(null)
const editingIndex = ref(-1)
const markdownTab = ref('edit')
const showPublishedFilter = ref('all')

// ===== 操作提示 =====
const operationMessage = ref('')
const operationError = ref(false)
let noticeTimer = null
function showNotice(msg, isError = false) {
  operationMessage.value = msg
  operationError.value = isError
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => { operationMessage.value = '' }, 4000)
}

const form = ref({
  title: '',
  slug: '',
  description: '',
  content: '',
  date: '',
  sortOrder: 0,
  tagsDisplay: '',
  isPublished: false,
})

// ===== Markdown 渲染 =====
const renderedMarkdown = computed(() => {
  try {
    return marked.parse(form.value.content || '')
  } catch {
    return form.value.content || ''
  }
})

// ===== 筛选 =====
const filteredArticles = computed(() => {
  if (showPublishedFilter.value === 'published') return articles.value.filter(a => a.publishedAt)
  if (showPublishedFilter.value === 'draft') return articles.value.filter(a => !a.publishedAt)
  return articles.value
})

function findOriginalIndex(art) {
  return articles.value.findIndex(a => a.documentId === art.documentId)
}

// ===== 数据加载 =====
const LIST_PARAMS = { pageSize: 100, sort: ['sortOrder:asc', 'createdAt:desc'] }

function loadArticles() {
  loader.loadWithRetry(
    props.token, UID, LIST_PARAMS,
    (results) => { articles.value = results }
  )
}

async function reloadArticles() {
  await loader.silentReload(props.token, UID, LIST_PARAMS, (results) => {
    articles.value = results
  })
}

onMounted(loadArticles)

// ===== 编辑操作 =====
function onCreate() {
  editingIndex.value = -1
  form.value = {
    title: '',
    slug: '',
    description: '',
    content: '',
    date: '',
    sortOrder: articles.value.length,
    tagsDisplay: '',
    isPublished: false,
  }
  markdownTab.value = 'edit'
}

function onEdit(i) {
  if (i < 0 || i >= articles.value.length) return
  const art = articles.value[i]
  editingIndex.value = i
  const tags = Array.isArray(art.tags) ? art.tags : []
  form.value = {
    title: art.title || '',
    slug: art.slug || '',
    description: art.description || '',
    content: art.content || '',
    date: art.date || '',
    sortOrder: art.sortOrder ?? 0,
    tagsDisplay: tags.join(', '),
    isPublished: !!art.publishedAt,
  }
  markdownTab.value = 'edit'
}

function closeEditor() {
  editingIndex.value = -1
}

// ===== 保存 =====
function collectFormData(publish) {
  const title = document.getElementById('art-title')?.value?.trim() || form.value.title
  const slug = document.getElementById('art-slug')?.value?.trim() || form.value.slug
  const description = document.getElementById('art-description')?.value?.trim() || form.value.description
  const date = document.getElementById('art-date')?.value || form.value.date
  const sortOrder = parseInt(document.getElementById('art-sortOrder')?.value) || form.value.sortOrder
  const tagsDisplay = document.getElementById('art-tags')?.value?.trim() || form.value.tagsDisplay
  const content = form.value.content

  const tags = tagsDisplay.split(/[,，]/).map(t => t.trim()).filter(Boolean)

  return { title, slug, description, content, date, sortOrder, tags, publishedAt: publish ? new Date().toISOString() : null }
}

async function onSaveDraft() {
  const data = collectFormData(false)
  saving.value = true
  try {
    if (editingIndex.value >= 0) {
      const docId = articles.value[editingIndex.value].documentId
      await cmUpdate(props.token, UID, docId, data)
      showNotice('草稿已保存')
    } else {
      await cmCreate(props.token, UID, data)
      showNotice('草稿已创建')
    }
    await reloadArticles()
  } catch (e) {
    showNotice('保存失败：' + (e.message || '未知错误'), true)
  } finally {
    saving.value = false
  }
}

async function onSavePublish() {
  const data = collectFormData(true)
  saving.value = true
  try {
    if (editingIndex.value >= 0) {
      const docId = articles.value[editingIndex.value].documentId
      await cmUpdate(props.token, UID, docId, data)
      showNotice('文章已发布')
    } else {
      await cmCreate(props.token, UID, data)
      showNotice('文章已创建并发布')
    }
    await reloadArticles()
  } catch (e) {
    showNotice('保存失败：' + (e.message || '未知错误'), true)
  } finally {
    saving.value = false
  }
}

// ===== 删除 =====
function onRemove(i) {
  deleteTarget.value = articles.value[i]
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  saving.value = true
  try {
    await cmDelete(props.token, UID, deleteTarget.value.documentId)
    showDeleteConfirm.value = false
    deleteTarget.value = null
    if (editingIndex.value >= 0 && articles.value[editingIndex.value]?.documentId === deleteTarget.value?.documentId) {
      editingIndex.value = -1
    }
    showNotice('文章已删除')
    await reloadArticles()
  } catch (e) {
    showNotice('删除失败：' + (e.message || '未知错误'), true)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.article-manager {
  position: relative;
}

/* ======== 缓冲进度条 ======== */
.loading-progress {
  position: sticky;
  top: 0;
  z-index: 10;
  width: 100%;
  --md-linear-progress-active-indicator-color: var(--md-sys-color-primary, #6750a4);
  --md-linear-progress-track-color: var(--md-sys-color-surface-container-highest, #e6e0e9);
  transition: opacity 400ms ease-out;
}

.loading-progress--fading {
  opacity: 0;
}

/* ======== admin-container: Hero 区域 ======== */
.admin-container {
  padding: 48px 48px 0;
}

.admin-hero {
  max-width: 1200px;
  margin: 0 auto;
}

.admin-hero__title {
  font-family: var(--md-sys-typescale-display-s-font-family);
  font-size: var(--md-sys-typescale-display-s-font-size);
  font-weight: var(--md-sys-typescale-display-s-font-weight);
  letter-spacing: var(--md-sys-typescale-display-s-letter-spacing);
  line-height: var(--md-sys-typescale-display-s-line-height);
  font-variation-settings: "GRAD" var(--md-sys-typescale-display-s-font-variation-GRAD), "opsz" var(--md-sys-typescale-display-s-font-variation-opsz);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0;
}

.admin-hero__desc {
  font-family: var(--md-sys-typescale-body-l-font-family);
  font-size: var(--md-sys-typescale-body-l-font-size);
  font-weight: var(--md-sys-typescale-body-l-font-weight);
  letter-spacing: var(--md-sys-typescale-body-l-letter-spacing);
  line-height: var(--md-sys-typescale-body-l-line-height);
  color: var(--md-sys-color-on-surface-variant, #49454f);
  margin: 12px 0 0;
  max-width: 640px;
}

.admin-hero__toc {
  display: flex;
  gap: 12px;
  margin-top: 32px;
  flex-wrap: wrap;
}

/* ======== hero-toc-card ======== */
.hero-toc-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border-radius: 16px;
  border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
  background: var(--md-sys-color-surface-container-low, #f8f1f6);
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  color: inherit;
  transition: background-color 0.2s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s;
  min-width: 200px;
  flex: 1;
  max-width: 280px;
}

.hero-toc-card:hover {
  background: var(--md-sys-color-surface-container, #ece7e9);
  box-shadow: var(--md-sys-elevation-1, 0 1px 2px 0 rgba(0,0,0,0.3), 0 1px 3px 1px rgba(0,0,0,0.15));
}

.hero-toc-card__icon {
  font-size: 24px;
  color: var(--md-sys-color-primary, #6750a4);
  flex-shrink: 0;
}

.hero-toc-card__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hero-toc-card__label {
  font-family: var(--md-sys-typescale-title-m-font-family);
  font-size: var(--md-sys-typescale-title-m-font-size);
  font-weight: var(--md-sys-typescale-title-m-font-weight);
  letter-spacing: var(--md-sys-typescale-title-m-letter-spacing);
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

.hero-toc-card__desc {
  font-family: var(--md-sys-typescale-body-m-font-family);
  font-size: var(--md-sys-typescale-body-m-font-size);
  font-weight: var(--md-sys-typescale-body-m-font-weight);
  color: var(--md-sys-color-on-surface-variant, #49454f);
}

/* ======== scroll-show-container ======== */
.scroll-show-container {
  display: flex;
  gap: 24px;
  padding: 32px 48px 48px;
  max-width: 1200px;
  margin: 0 auto;
  align-items: flex-start;
}

/* ======== 左侧 section-cards 列表 ======== */
.section-cards {
  flex: 0 0 360px;
  max-height: calc(100vh - 280px);
  overflow-y: auto;
  position: sticky;
  top: 24px;
}

.section-cards__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-card {
  padding: 16px 20px;
  border-radius: 16px;
  border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
  background: var(--md-sys-color-surface-container-low, #f8f1f6);
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
}

.section-card:hover {
  background: var(--md-sys-color-surface-container, #ece7e9);
}

.section-card--active {
  border-color: var(--md-sys-color-primary, #6750a4);
  background: var(--md-sys-color-primary-container, #e8def8);
}

.section-card--draft {
  border-left: 3px solid var(--md-sys-color-outline, #79747e);
}

.section-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.section-card__title {
  font-family: var(--md-sys-typescale-title-m-font-family);
  font-size: var(--md-sys-typescale-title-m-font-size);
  font-weight: var(--md-sys-typescale-title-m-font-weight);
  letter-spacing: var(--md-sys-typescale-title-m-letter-spacing);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.section-card__meta {
  display: flex;
  gap: 12px;
  margin-top: 6px;
  flex-wrap: wrap;
}

.section-card__slug,
.section-card__date,
.section-card__sort {
  font-family: var(--md-sys-typescale-label-m-font-family);
  font-size: var(--md-sys-typescale-label-m-font-size);
  font-weight: var(--md-sys-typescale-label-m-font-weight);
  letter-spacing: var(--md-sys-typescale-label-m-letter-spacing);
  color: var(--md-sys-color-on-surface-variant, #49454f);
}

.section-card__desc {
  display: block;
  font-family: var(--md-sys-typescale-body-m-font-family);
  font-size: var(--md-sys-typescale-body-m-font-size);
  font-weight: var(--md-sys-typescale-body-m-font-weight);
  color: var(--md-sys-color-on-surface-variant, #49454f);
  margin-top: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.section-card__actions {
  display: flex;
  gap: 4px;
  margin-top: 8px;
  justify-content: flex-end;
}

/* ======== mio-icon-badge ======== */
.mio-icon-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: 100px;
  font-family: var(--md-sys-typescale-label-s-font-family);
  font-size: var(--md-sys-typescale-label-s-font-size);
  font-weight: var(--md-sys-typescale-label-s-font-weight);
  letter-spacing: var(--md-sys-typescale-label-s-letter-spacing);
  white-space: nowrap;
  flex-shrink: 0;
}

.mio-icon-badge__icon {
  font-size: 14px;
}

.mio-icon-badge--published {
  background: var(--md-sys-color-primary-container, #e8def8);
  color: var(--md-sys-color-on-primary-container, #1d192b);
}

.mio-icon-badge--draft {
  background: var(--md-sys-color-secondary-container, #e8def8);
  color: var(--md-sys-color-on-secondary-container, #1d192b);
}

/* ======== 右侧 scroll-show 编辑器 ======== */
.scroll-show {
  flex: 1;
  min-width: 0;
  position: sticky;
  top: 24px;
}

.editor-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  border-radius: 28px;
  border: 2px dashed var(--md-sys-color-outline-variant, #cac4d0);
  background: var(--md-sys-color-surface-container-lowest, #fffbfe);
  padding: 48px;
}

.editor-placeholder__icon {
  font-size: 64px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  opacity: 0.4;
  margin-bottom: 16px;
}

.editor-placeholder__text {
  font-family: var(--md-sys-typescale-body-l-font-family);
  font-size: var(--md-sys-typescale-body-l-font-size);
  font-weight: var(--md-sys-typescale-body-l-font-weight);
  color: var(--md-sys-color-on-surface-variant, #49454f);
  margin: 0;
}

/* ======== 编辑器 ======== */
.editor {
  border-radius: 28px;
  border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
  background: var(--md-sys-color-surface-container-low, #f8f1f6);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 280px);
  overflow: hidden;
}

.editor__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 12px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
  flex-shrink: 0;
}

.editor__title {
  font-family: var(--md-sys-typescale-headline-s-font-family);
  font-size: var(--md-sys-typescale-headline-s-font-size);
  font-weight: var(--md-sys-typescale-headline-s-font-weight);
  letter-spacing: var(--md-sys-typescale-headline-s-letter-spacing);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.editor__header-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.editor__body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.editor__fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.editor__field {
  width: 100%;
}

.editor__field-row {
  display: flex;
  gap: 16px;
}

.editor__field-row .editor__field {
  flex: 1;
}

.editor__status {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
}

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
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

/* ======== Markdown 编辑/预览 ======== */
.editor__markdown {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
}

.editor__markdown-tabs {
  display: flex;
  border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
}

.editor__tab {
  padding: 10px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-family: var(--md-sys-typescale-label-l-font-family);
  font-size: var(--md-sys-typescale-label-l-font-size);
  font-weight: var(--md-sys-typescale-label-l-font-weight);
  letter-spacing: var(--md-sys-typescale-label-l-letter-spacing);
  color: var(--md-sys-color-on-surface-variant, #49454f);
  border-bottom: 2px solid transparent;
  transition: color 0.2s, border-color 0.2s;
}

.editor__tab:hover {
  background: color-mix(in srgb, var(--md-sys-color-on-surface, #1c1b1f) 8%, transparent);
}

.editor__tab--active {
  color: var(--md-sys-color-primary, #6750a4);
  border-bottom-color: var(--md-sys-color-primary, #6750a4);
}

.editor__markdown-body {
  min-height: 300px;
}

.editor__markdown-body--edit {
  display: block;
}

.editor__markdown-body--preview {
  display: block;
}

.editor__markdown-body--split {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.editor__textarea {
  width: 100%;
  min-height: 300px;
  padding: 16px;
  border: none;
  background: var(--md-sys-color-surface, #fffbfe);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
}

.editor__textarea:focus {
  outline: 2px solid var(--md-sys-color-primary, #6750a4);
  outline-offset: -2px;
}

.editor__preview {
  padding: 16px;
  background: var(--md-sys-color-surface, #fffbfe);
  overflow-y: auto;
  min-height: 300px;
}

.editor__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
  flex-shrink: 0;
}

/* ======== 空状态 ======== */
.empty-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  font-family: var(--md-sys-typescale-body-m-font-family);
  font-size: var(--md-sys-typescale-body-m-font-size);
  border-radius: 16px;
  border: 2px dashed var(--md-sys-color-outline-variant, #cac4d0);
}

/* ======== 操作提示 ======== */
.operation-notice {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 12px;
  background: var(--md-sys-color-tertiary-container, #ffd8e4);
  z-index: 200;
  animation: notice-enter 200ms ease;
}

.operation-notice--error {
  background: var(--md-sys-color-error-container, #f9dedc);
}

.operation-notice__icon {
  font-size: 20px;
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

@keyframes notice-enter {
  from { opacity: 0; transform: translateX(-50%) translateY(10px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

/* ======== fadeIn 动画 ======== */
.content-fadein {
  animation: admin-fadein 200ms linear 200ms both;
}

@keyframes admin-fadein {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ======== 暗色主题 ======== */
:global([data-theme="dark"]) .hero-toc-card {
  background: var(--md-sys-color-surface-container-low, #1d1b20);
}

:global([data-theme="dark"]) .hero-toc-card:hover {
  background: var(--md-sys-color-surface-container, #211f26);
}

:global([data-theme="dark"]) .section-card {
  background: var(--md-sys-color-surface-container-low, #1d1b20);
}

:global([data-theme="dark"]) .section-card:hover {
  background: var(--md-sys-color-surface-container, #211f26);
}

:global([data-theme="dark"]) .section-card--active {
  background: var(--md-sys-color-primary-container, #4a4458);
  border-color: var(--md-sys-color-primary, #d0bcff);
}

:global([data-theme="dark"]) .editor {
  background: var(--md-sys-color-surface-container-low, #1d1b20);
}

:global([data-theme="dark"]) .editor__textarea {
  background: var(--md-sys-color-surface, #1c1b1f);
  color: var(--md-sys-color-on-surface, #e6e1e5);
}

:global([data-theme="dark"]) .editor__preview {
  background: var(--md-sys-color-surface, #1c1b1f);
}

:global([data-theme="dark"]) .editor-placeholder {
  background: var(--md-sys-color-surface-container-lowest, #141218);
}

:global([data-theme="dark"]) .empty-hint {
  background: transparent;
}

/* ======== 响应式 ======== */
@media (max-width: 840px) {
  .admin-container {
    padding: 24px 16px 0;
  }

  .scroll-show-container {
    flex-direction: column;
    padding: 24px 16px;
  }

  .section-cards {
    flex: none;
    width: 100%;
    max-height: none;
    position: static;
  }

  .scroll-show {
    position: static;
  }

  .editor__field-row {
    flex-direction: column;
  }
}
</style>
