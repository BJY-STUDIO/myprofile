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
    <div v-if="!loader.dataLoaded.value" class="hero">
      <div class="hero__inner">
        <span class="skeleton" style="height:56px;width:35%;border-radius:8px;"></span>
        <span class="skeleton" style="height:20px;width:55%;margin-top:16px;border-radius:4px;"></span>
        <div class="hero__toc" style="margin-top:32px;">
          <span v-for="n in 3" :key="'toc-sk-'+n" class="skeleton" style="height:72px;flex:1;border-radius:20px;"></span>
        </div>
      </div>
    </div>

    <!-- ======== 真实内容（fadeIn） ======== -->
    <div v-else :class="{ 'content-fadein': loader.fadeInActive.value }">

      <!-- ======== Hero（对齐 m3 get-started：大圆角容器 + 居中标题 + TOC link-cards） ======== -->
      <section class="hero">
        <div class="hero__inner">
          <h1 class="hero__title">文章管理</h1>
          <p class="hero__desc">创建、编辑和发布博客文章。管理文章内容、排序和发布状态。</p>
          <div class="hero__toc">
            <button class="link-card" @click="onCreate">
              <span class="material-symbols-rounded link-card__icon">note_add</span>
              <div class="link-card__text">
                <span class="link-card__title">新建文章</span>
                <span class="link-card__desc">创建一篇新文章</span>
              </div>
              <span class="material-symbols-rounded link-card__arrow">arrow_forward</span>
            </button>
            <button class="link-card" @click="cycleFilter">
              <span class="material-symbols-rounded link-card__icon">filter_list</span>
              <div class="link-card__text">
                <span class="link-card__title">{{ filterLabel }}</span>
                <span class="link-card__desc">{{ articles.length }} 篇文章</span>
              </div>
              <span class="material-symbols-rounded link-card__arrow">arrow_forward</span>
            </button>
            <button class="link-card" @click="reloadArticles()">
              <span class="material-symbols-rounded link-card__icon">refresh</span>
              <div class="link-card__text">
                <span class="link-card__title">刷新</span>
                <span class="link-card__desc">重新加载列表</span>
              </div>
              <span class="material-symbols-rounded link-card__arrow">arrow_forward</span>
            </button>
          </div>
        </div>
      </section>

      <!-- ======== 内容区（对齐 m3 get-started：grid 两栏，左1.2fr 右1fr） ======== -->
      <section v-if="editingIndex < 0" class="content-section">
        <!-- 左栏：文章列表 -->
        <div class="content-section__list">
          <div v-if="filteredArticles.length" class="article-list">
            <button
              v-for="art in filteredArticles"
              :key="art.documentId"
              class="link-card article-card"
              @click="onEdit(findOriginalIndex(art))"
            >
              <span class="material-symbols-rounded link-card__icon">{{ art.publishedAt ? 'article' : 'draft' }}</span>
              <div class="link-card__text">
                <span class="link-card__title">{{ art.title || '(无标题)' }}</span>
                <span class="link-card__desc">
                  {{ art.slug || '无slug' }}
                  <template v-if="art.sortOrder != null"> · 排序 {{ art.sortOrder }}</template>
                </span>
              </div>
              <span class="mio-icon-badge" :class="art.publishedAt ? 'mio-icon-badge--published' : 'mio-icon-badge--draft'">
                <span class="material-symbols-rounded mio-icon-badge__icon">{{ art.publishedAt ? 'check_circle' : 'draft' }}</span>
                {{ art.publishedAt ? '已发布' : '草稿' }}
              </span>
            </button>
          </div>
          <div v-else class="empty-state">
            <span class="material-symbols-rounded empty-state__icon">article</span>
            <p class="empty-state__text">暂无文章</p>
          </div>
        </div>

        <!-- 右栏：占位提示 -->
        <div class="content-section__detail">
          <div class="placeholder-card">
            <span class="material-symbols-rounded placeholder-card__icon">edit_note</span>
            <p class="placeholder-card__title">选择一篇文章开始编辑</p>
            <p class="placeholder-card__desc">点击左侧列表中的文章，或新建一篇文章</p>
          </div>
        </div>
      </section>

      <!-- ======== 编辑器区（全宽，grid 两栏：字段 + markdown） ======== -->
      <section v-else class="editor-section">
        <!-- 顶部操作栏 -->
        <div class="editor-topbar">
          <div class="editor-topbar__left">
            <md-icon-button @click="closeEditor" aria-label="返回列表">
              <span class="material-symbols-rounded">arrow_back</span>
            </md-icon-button>
            <h2 class="editor-topbar__title">{{ form.title || '未命名文章' }}</h2>
            <span class="mio-icon-badge" :class="form.isPublished ? 'mio-icon-badge--published' : 'mio-icon-badge--draft'">
              <span class="material-symbols-rounded mio-icon-badge__icon">{{ form.isPublished ? 'check_circle' : 'draft' }}</span>
              {{ form.isPublished ? '已发布' : '草稿' }}
            </span>
          </div>
          <div class="editor-topbar__right">
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

        <!-- 编辑器主体：grid 左字段 + 右 markdown -->
        <div class="editor-grid">
          <!-- 左栏：元数据字段 -->
          <div class="editor-fields">
            <md-outlined-text-field label="标题" id="art-title" :value="form.title" class="field"></md-outlined-text-field>
            <md-outlined-text-field label="Slug（URL标识）" id="art-slug" :value="form.slug" helper="留空则自动从标题生成" class="field"></md-outlined-text-field>
            <md-outlined-text-field label="描述" id="art-description" :value="form.description" type="textarea" rows="2" class="field"></md-outlined-text-field>
            <div class="field-row">
              <md-outlined-text-field label="自定义日期" id="art-date" :value="form.date" type="date" helper="可选" class="field"></md-outlined-text-field>
              <md-outlined-text-field label="排序序号" id="art-sortOrder" :value="String(form.sortOrder ?? 0)" type="number" class="field"></md-outlined-text-field>
            </div>
            <md-outlined-text-field label="标签（逗号分隔）" id="art-tags" :value="form.tagsDisplay" helper='如：技术, Vue, 前端' class="field"></md-outlined-text-field>
            <div class="switch-field">
              <md-switch :selected="form.isPublished" @change="form.isPublished = $event.target.selected"></md-switch>
              <span class="switch-field__label">{{ form.isPublished ? '已发布' : '草稿' }}</span>
            </div>
            <div class="editor-fields__actions">
              <md-text-button @click="onRemove(editingIndex)" class="editor-fields__delete-btn">
                <span class="material-symbols-rounded" slot="icon">delete</span>
                删除文章
              </md-text-button>
            </div>
          </div>

          <!-- 右栏：完整 Markdown 编辑器 -->
          <div class="md-editor">
            <!-- 工具栏 -->
            <div class="md-editor__toolbar">
              <div class="md-editor__toolbar-group">
                <md-icon-button @click="insertMd('heading')" aria-label="标题" title="标题">
                  <span class="material-symbols-rounded">title</span>
                </md-icon-button>
                <md-icon-button @click="insertMd('bold')" aria-label="加粗" title="加粗">
                  <span class="material-symbols-rounded">format_bold</span>
                </md-icon-button>
                <md-icon-button @click="insertMd('italic')" aria-label="斜体" title="斜体">
                  <span class="material-symbols-rounded">format_italic</span>
                </md-icon-button>
                <md-icon-button @click="insertMd('strikethrough')" aria-label="删除线" title="删除线">
                  <span class="material-symbols-rounded">strikethrough_s</span>
                </md-icon-button>
              </div>
              <div class="md-editor__toolbar-divider"></div>
              <div class="md-editor__toolbar-group">
                <md-icon-button @click="insertMd('link')" aria-label="链接" title="链接">
                  <span class="material-symbols-rounded">link</span>
                </md-icon-button>
                <md-icon-button @click="insertMd('image')" aria-label="图片" title="图片">
                  <span class="material-symbols-rounded">image</span>
                </md-icon-button>
                <md-icon-button @click="insertMd('code')" aria-label="行内代码" title="行内代码">
                  <span class="material-symbols-rounded">code</span>
                </md-icon-button>
                <md-icon-button @click="insertMd('codeblock')" aria-label="代码块" title="代码块">
                  <span class="material-symbols-rounded">data_object</span>
                </md-icon-button>
              </div>
              <div class="md-editor__toolbar-divider"></div>
              <div class="md-editor__toolbar-group">
                <md-icon-button @click="insertMd('ul')" aria-label="无序列表" title="无序列表">
                  <span class="material-symbols-rounded">format_list_bulleted</span>
                </md-icon-button>
                <md-icon-button @click="insertMd('ol')" aria-label="有序列表" title="有序列表">
                  <span class="material-symbols-rounded">format_list_numbered</span>
                </md-icon-button>
                <md-icon-button @click="insertMd('quote')" aria-label="引用" title="引用">
                  <span class="material-symbols-rounded">format_quote</span>
                </md-icon-button>
                <md-icon-button @click="insertMd('hr')" aria-label="分割线" title="分割线">
                  <span class="material-symbols-rounded">horizontal_rule</span>
                </md-icon-button>
                <md-icon-button @click="insertMd('table')" aria-label="表格" title="表格">
                  <span class="material-symbols-rounded">table_chart</span>
                </md-icon-button>
              </div>
              <div class="md-editor__toolbar-spacer"></div>
              <!-- 视图切换 -->
              <div class="md-editor__view-toggle">
                <md-icon-button
                  :class="{ 'md-editor__view-btn--active': markdownTab === 'edit' }"
                  @click="markdownTab = 'edit'"
                  aria-label="编辑模式"
                  title="编辑"
                >
                  <span class="material-symbols-rounded">edit</span>
                </md-icon-button>
                <md-icon-button
                  :class="{ 'md-editor__view-btn--active': markdownTab === 'split' }"
                  @click="markdownTab = 'split'"
                  aria-label="分屏模式"
                  title="分屏"
                >
                  <span class="material-symbols-rounded">vertical_split</span>
                </md-icon-button>
                <md-icon-button
                  :class="{ 'md-editor__view-btn--active': markdownTab === 'preview' }"
                  @click="markdownTab = 'preview'"
                  aria-label="预览模式"
                  title="预览"
                >
                  <span class="material-symbols-rounded">visibility</span>
                </md-icon-button>
              </div>
            </div>

            <!-- 编辑/预览区 -->
            <div class="md-editor__body" :class="'md-editor__body--' + markdownTab">
              <textarea
                v-show="markdownTab === 'edit' || markdownTab === 'split'"
                ref="textareaRef"
                class="md-editor__textarea"
                :value="form.content"
                @input="onTextareaInput"
                placeholder="在此输入 Markdown 内容..."
                spellcheck="false"
              ></textarea>
              <div
                v-show="markdownTab === 'preview' || markdownTab === 'split'"
                class="md-editor__preview markdown-body"
                v-html="renderedMarkdown"
              ></div>
            </div>

            <!-- 状态栏 -->
            <div class="md-editor__statusbar">
              <span>{{ charCount }} 字符</span>
              <span>{{ lineCount }} 行</span>
              <span>Markdown</span>
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
import { ref, computed, onMounted } from 'vue'
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
const textareaRef = ref(null)

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

// ===== 字符/行统计 =====
const charCount = computed(() => (form.value.content || '').length)
const lineCount = computed(() => {
  const c = form.value.content || ''
  return c ? c.split('\n').length : 0
})

// ===== 筛选 =====
const filteredArticles = computed(() => {
  if (showPublishedFilter.value === 'published') return articles.value.filter(a => a.publishedAt)
  if (showPublishedFilter.value === 'draft') return articles.value.filter(a => !a.publishedAt)
  return articles.value
})

const filterLabel = computed(() => {
  if (showPublishedFilter.value === 'published') return '已发布'
  if (showPublishedFilter.value === 'draft') return '草稿'
  return '全部文章'
})

function cycleFilter() {
  const order = ['all', 'published', 'draft']
  const idx = order.indexOf(showPublishedFilter.value)
  showPublishedFilter.value = order[(idx + 1) % order.length]
}

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
    if (editingIndex.value >= 0 && articles.value[editingIndex.value]?.documentId === deleteTarget.value?.documentId) {
      editingIndex.value = -1
    }
    deleteTarget.value = null
    showNotice('文章已删除')
    await reloadArticles()
  } catch (e) {
    showNotice('删除失败：' + (e.message || '未知错误'), true)
  } finally {
    saving.value = false
  }
}

// ===== Markdown 工具栏插入 =====
function onTextareaInput(e) {
  form.value.content = e.target.value
}

function insertMd(type) {
  const ta = textareaRef.value
  if (!ta) return
  const start = ta.selectionStart
  const end = ta.selectionEnd
  const sel = ta.value.substring(start, end)
  let before = '', after = '', newCursorOffset = 0

  switch (type) {
    case 'heading':
      before = '## '; after = ''; newCursorOffset = before.length
      break
    case 'bold':
      before = '**'; after = '**'; newCursorOffset = sel ? before.length + sel.length + after.length : before.length
      break
    case 'italic':
      before = '*'; after = '*'; newCursorOffset = sel ? before.length + sel.length + after.length : before.length
      break
    case 'strikethrough':
      before = '~~'; after = '~~'; newCursorOffset = sel ? before.length + sel.length + after.length : before.length
      break
    case 'link':
      before = '['; after = '](url)'; newCursorOffset = before.length + (sel || 'text').length
      break
    case 'image':
      before = '!['; after = '](url)'; newCursorOffset = before.length + (sel || 'alt').length
      break
    case 'code':
      before = '`'; after = '`'; newCursorOffset = sel ? before.length + sel.length + after.length : before.length
      break
    case 'codeblock':
      before = '```\n'; after = '\n```'; newCursorOffset = before.length
      break
    case 'ul':
      before = '- '; after = ''; newCursorOffset = before.length
      break
    case 'ol':
      before = '1. '; after = ''; newCursorOffset = before.length
      break
    case 'quote':
      before = '> '; after = ''; newCursorOffset = before.length
      break
    case 'hr':
      before = '\n---\n'; after = ''; newCursorOffset = before.length
      break
    case 'table':
      before = '\n| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| '; after = ' |  |  |\n'; newCursorOffset = before.length
      break
  }

  const replacement = before + sel + after
  const newContent = ta.value.substring(0, start) + replacement + ta.value.substring(end)
  form.value.content = newContent

  // 恢复光标位置
  requestAnimationFrame(() => {
    ta.focus()
    const cursorPos = sel ? start + newCursorOffset : start + newCursorOffset
    ta.setSelectionRange(cursorPos, cursorPos)
  })
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

/* ======== Hero（对齐 m3 get-started: 大圆角容器, 居中标题, TOC link-cards） ======== */
.hero {
  padding: 0 24px;
}

.hero__inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: 48px 32px 40px;
  background-color: var(--md-sys-color-surface-container-low, #f8f1f6);
  border-radius: 28px;
}

.hero__title {
  font-family: var(--md-sys-typescale-display-s-font-family);
  font-size: var(--md-sys-typescale-display-s-font-size);
  font-weight: var(--md-sys-typescale-display-s-font-weight);
  letter-spacing: var(--md-sys-typescale-display-s-letter-spacing);
  line-height: var(--md-sys-typescale-display-s-line-height);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0;
}

.hero__desc {
  font-family: var(--md-sys-typescale-body-l-font-family);
  font-size: var(--md-sys-typescale-body-l-font-size);
  font-weight: var(--md-sys-typescale-body-l-font-weight);
  line-height: var(--md-sys-typescale-body-l-line-height);
  color: var(--md-sys-color-on-surface-variant, #49454f);
  margin: 16px 0 0;
  max-width: 640px;
}

.hero__toc {
  display: flex;
  gap: 12px;
  margin-top: 32px;
  flex-wrap: wrap;
}

/* ======== link-card（对齐 m3 get-started: 20px圆角, icon+title+desc+arrow） ======== */
.link-card {
  display: flex;
  align-items: center;
  padding: 20px 24px;
  border-radius: 20px;
  background-color: var(--md-sys-color-surface-container, #ece7e9);
  text-decoration: none;
  text-align: left;
  font-family: inherit;
  color: inherit;
  border: none;
  cursor: pointer;
  transition: background-color 200ms cubic-bezier(0.2, 0, 0, 1),
              box-shadow 200ms cubic-bezier(0.2, 0, 0, 1);
  min-width: 200px;
  flex: 1;
  max-width: 360px;
  -webkit-tap-highlight-color: transparent;
}

.link-card:hover {
  background-color: var(--md-sys-color-surface-container-high, #e6e0e9);
  box-shadow: var(--md-sys-elevation-1, 0 1px 3px 1px rgba(0,0,0,0.15), 0 1px 2px 0 rgba(0,0,0,0.3));
}

.link-card__icon {
  font-size: 24px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  margin-right: 16px;
  flex-shrink: 0;
}

.link-card__text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.link-card__title {
  font-family: var(--md-sys-typescale-title-m-font-family);
  font-size: var(--md-sys-typescale-title-m-font-size);
  font-weight: var(--md-sys-typescale-title-m-font-weight);
  letter-spacing: var(--md-sys-typescale-title-m-letter-spacing);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.link-card__desc {
  font-family: var(--md-sys-typescale-body-m-font-family);
  font-size: var(--md-sys-typescale-body-m-font-size);
  font-weight: var(--md-sys-typescale-body-m-font-weight);
  color: var(--md-sys-color-on-surface-variant, #49454f);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.link-card__arrow {
  font-size: 20px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity 200ms, transform 200ms;
  flex-shrink: 0;
  margin-left: 8px;
}

.link-card:hover .link-card__arrow {
  opacity: 1;
  transform: translateX(0);
}

/* ======== 内容区（对齐 m3 get-started: grid 两栏） ======== */
.content-section {
  display: grid;
  grid-template-columns: minmax(300px, 1.2fr) 1fr;
  gap: 48px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 24px 48px;
  align-items: start;
}

/* 左栏文章列表 */
.article-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.article-card {
  max-width: none;
}

.article-card .link-card__title {
  flex: 1;
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

/* ======== 空状态 ======== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 32px;
  background-color: var(--md-sys-color-surface-container-low, #f8f1f6);
  border-radius: 28px;
}

.empty-state__icon {
  font-size: 48px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  opacity: 0.5;
  margin-bottom: 16px;
}

.empty-state__text {
  font-family: var(--md-sys-typescale-body-l-font-family);
  font-size: var(--md-sys-typescale-body-l-font-size);
  font-weight: var(--md-sys-typescale-body-l-font-weight);
  color: var(--md-sys-color-on-surface-variant, #49454f);
  margin: 0;
}

/* ======== 占位卡片（右栏空状态） ======== */
.placeholder-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 32px;
  background-color: var(--md-sys-color-surface-container-low, #f8f1f6);
  border-radius: 28px;
  position: sticky;
  top: 24px;
}

.placeholder-card__icon {
  font-size: 64px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  opacity: 0.35;
  margin-bottom: 16px;
}

.placeholder-card__title {
  font-family: var(--md-sys-typescale-title-l-font-family);
  font-size: var(--md-sys-typescale-title-l-font-size);
  font-weight: var(--md-sys-typescale-title-l-font-weight);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0 0 8px;
}

.placeholder-card__desc {
  font-family: var(--md-sys-typescale-body-m-font-family);
  font-size: var(--md-sys-typescale-body-m-font-size);
  font-weight: var(--md-sys-typescale-body-m-font-weight);
  color: var(--md-sys-color-on-surface-variant, #49454f);
  margin: 0;
}

/* ======== 编辑器区域 ======== */
.editor-section {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 24px 48px;
}

/* 顶部操作栏 */
.editor-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background-color: var(--md-sys-color-surface-container, #ece7e9);
  border-radius: 28px 28px 0 0;
  gap: 16px;
  flex-wrap: wrap;
}

.editor-topbar__left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.editor-topbar__title {
  font-family: var(--md-sys-typescale-title-l-font-family);
  font-size: var(--md-sys-typescale-title-l-font-size);
  font-weight: var(--md-sys-typescale-title-l-font-weight);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.editor-topbar__right {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* 编辑器主体 grid */
.editor-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 0;
  background-color: var(--md-sys-color-surface-container-low, #f8f1f6);
  border-radius: 0 0 28px 28px;
  overflow: hidden;
  min-height: calc(100vh - 280px);
}

/* 左栏字段 */
.editor-fields {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-right: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
  overflow-y: auto;
  max-height: calc(100vh - 280px);
}

.field {
  width: 100%;
}

.field-row {
  display: flex;
  gap: 16px;
}

.field-row .field {
  flex: 1;
}

.switch-field {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  cursor: pointer;
}

.switch-field__label {
  font-family: var(--md-sys-typescale-body-m-font-family);
  font-size: var(--md-sys-typescale-body-m-font-size);
  font-weight: var(--md-sys-typescale-body-m-font-weight);
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

.editor-fields__actions {
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
}

.editor-fields__delete-btn {
  --md-text-button-label-text-color: var(--md-sys-color-error, #b3261e);
}

/* ======== Markdown 编辑器 ======== */
.md-editor {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 工具栏 */
.md-editor__toolbar {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
  background-color: var(--md-sys-color-surface-container, #ece7e9);
  gap: 2px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.md-editor__toolbar-group {
  display: flex;
  gap: 0;
}

.md-editor__toolbar-divider {
  width: 1px;
  height: 24px;
  background-color: var(--md-sys-color-outline-variant, #cac4d0);
  margin: 0 4px;
  align-self: center;
}

.md-editor__toolbar-spacer {
  flex: 1;
}

/* 视图切换按钮 */
.md-editor__view-toggle {
  display: flex;
  gap: 0;
}

.md-editor__view-btn--active {
  background-color: var(--md-sys-color-secondary-container, #e8def8);
  border-radius: 20px;
}

/* 编辑/预览区 */
.md-editor__body {
  flex: 1;
  min-height: 400px;
  overflow: hidden;
}

.md-editor__body--edit {
  display: block;
}

.md-editor__body--preview {
  display: block;
}

.md-editor__body--split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  /* 分屏分隔线 */
  column-gap: 0;
}

.md-editor__body--split .md-editor__textarea {
  border-right: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
}

/* Textarea */
.md-editor__textarea {
  width: 100%;
  height: 100%;
  min-height: 400px;
  padding: 16px 20px;
  border: none;
  background-color: var(--md-sys-color-surface, #fffbfe);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.7;
  resize: none;
  outline: none;
  box-sizing: border-box;
  tab-size: 2;
}

.md-editor__textarea:focus {
  outline: none;
  background-color: var(--md-sys-color-surface, #fffbfe);
}

/* 预览区 */
.md-editor__preview {
  padding: 16px 20px;
  background-color: var(--md-sys-color-surface, #fffbfe);
  overflow-y: auto;
  min-height: 400px;
  max-height: calc(100vh - 340px);
}

/* 状态栏 */
.md-editor__statusbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 4px 16px;
  background-color: var(--md-sys-color-surface-container, #ece7e9);
  border-top: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
  font-family: var(--md-sys-typescale-label-s-font-family);
  font-size: var(--md-sys-typescale-label-s-font-size);
  font-weight: var(--md-sys-typescale-label-s-font-weight);
  color: var(--md-sys-color-on-surface-variant, #49454f);
  flex-shrink: 0;
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
:global([data-theme="dark"]) .hero__inner {
  background-color: var(--md-sys-color-surface-container-low, #1d1b20);
}

:global([data-theme="dark"]) .link-card {
  background-color: var(--md-sys-color-surface-container, #211f26);
}

:global([data-theme="dark"]) .link-card:hover {
  background-color: var(--md-sys-color-surface-container-high, #2b2930);
}

:global([data-theme="dark"]) .empty-state {
  background-color: var(--md-sys-color-surface-container-low, #1d1b20);
}

:global([data-theme="dark"]) .placeholder-card {
  background-color: var(--md-sys-color-surface-container-low, #1d1b20);
}

:global([data-theme="dark"]) .editor-topbar {
  background-color: var(--md-sys-color-surface-container, #211f26);
}

:global([data-theme="dark"]) .editor-grid {
  background-color: var(--md-sys-color-surface-container-low, #1d1b20);
}

:global([data-theme="dark"]) .editor-fields {
  border-right-color: var(--md-sys-color-outline-variant, #49454f);
}

:global([data-theme="dark"]) .md-editor__textarea {
  background-color: var(--md-sys-color-surface, #141218);
  color: var(--md-sys-color-on-surface, #e6e1e5);
}

:global([data-theme="dark"]) .md-editor__preview {
  background-color: var(--md-sys-color-surface, #141218);
}

:global([data-theme="dark"]) .md-editor__toolbar {
  background-color: var(--md-sys-color-surface-container, #211f26);
  border-bottom-color: var(--md-sys-color-outline-variant, #49454f);
}

:global([data-theme="dark"]) .md-editor__statusbar {
  background-color: var(--md-sys-color-surface-container, #211f26);
  border-top-color: var(--md-sys-color-outline-variant, #49454f);
}

:global([data-theme="dark"]) .md-editor__view-btn--active {
  background-color: var(--md-sys-color-secondary-container, #4a4458);
}

:global([data-theme="dark"]) .editor-fields__delete-btn {
  --md-text-button-label-text-color: var(--md-sys-color-error, #f2b8b5);
}

/* ======== 响应式 ======== */
@media (max-width: 840px) {
  .hero {
    padding: 0 16px;
  }

  .hero__inner {
    padding: 32px 20px 28px;
    border-radius: 24px;
  }

  .hero__toc {
    flex-direction: column;
  }

  .link-card {
    max-width: none;
  }

  .content-section {
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 24px 16px;
  }

  .placeholder-card {
    position: static;
    padding: 48px 24px;
  }

  .editor-grid {
    grid-template-columns: 1fr;
  }

  .editor-fields {
    border-right: none;
    border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    max-height: none;
  }

  .field-row {
    flex-direction: column;
  }

  .md-editor__toolbar {
    padding: 4px 4px;
  }

  .md-editor__body--split {
    grid-template-columns: 1fr;
  }
}
</style>
