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
    <div v-if="!loader.dataLoaded.value" class="skeleton-container">
      <div class="skeleton skeleton--topbar"></div>
      <div class="skeleton-body">
        <div class="skeleton skeleton--page-title"></div>
        <div class="skeleton skeleton--filter-bar"></div>
        <div class="skeleton skeleton--row" v-for="n in 5" :key="n"></div>
      </div>
    </div>

    <!-- ======== 真实内容 ======== -->
    <div v-else :class="{ 'content-fadein': loader.fadeInActive.value }">

      <!-- ======== 编辑器模式 ======== -->
      <section v-if="editingIndex >= 0" class="editor-section">
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

      <!-- ======== 列表模式 ======== -->
      <template v-else>
        <!-- 顶部栏 -->
        <header class="am-topbar">
          <div class="am-topbar__search">
            <span class="material-symbols-rounded am-topbar__search-icon">search</span>
            <span class="am-topbar__search-placeholder">Search articles...</span>
            <span class="am-topbar__search-kbd">⌘K</span>
          </div>
          <div class="am-topbar__actions">
            <md-filled-button class="am-topbar__new-btn" @click="onCreate">
              <span class="material-symbols-rounded am-topbar__new-icon" slot="icon">add</span>
              New Article
            </md-filled-button>
            <button class="am-topbar__icon-btn" aria-label="Notifications">
              <span class="material-symbols-rounded">notifications</span>
              <span class="am-topbar__badge"></span>
            </button>
            <div class="am-topbar__avatar">
              <span class="material-symbols-rounded">person</span>
            </div>
          </div>
        </header>

        <div class="am-body">
          <!-- 页面标题 -->
          <div class="am-page-header">
            <h1 class="am-page-header__title">All Articles</h1>
            <p class="am-page-header__subtitle">{{ filteredArticles.length }} articles found</p>
          </div>

          <!-- 筛选栏 -->
          <div class="am-filter-bar">
            <div class="am-filter-bar__left">
              <button
                v-for="opt in filterOptions"
                :key="opt.value"
                class="am-filter-tab"
                :class="{ 'am-filter-tab--active': showPublishedFilter === opt.value }"
                @click="showPublishedFilter = opt.value"
              >
                {{ opt.label }}
                <span class="am-filter-tab__count">{{ opt.count }}</span>
              </button>
            </div>
            <div class="am-filter-bar__right">
              <div class="am-filter-bar__search">
                <span class="material-symbols-rounded">search</span>
                <input v-model="searchQuery" type="text" placeholder="Search..." class="am-filter-bar__search-input" />
              </div>
              <button class="am-sort-btn" @click="toggleSort">
                <span class="material-symbols-rounded">{{ sortAsc ? 'arrow_upward' : 'arrow_downward' }}</span>
                <span>Sort: {{ sortField }}</span>
              </button>
              <div class="am-view-toggle">
                <button class="am-view-toggle__btn" :class="{ 'am-view-toggle__btn--active': viewMode === 'list' }" @click="viewMode = 'list'" aria-label="List view">
                  <span class="material-symbols-rounded">view_list</span>
                </button>
                <button class="am-view-toggle__btn" :class="{ 'am-view-toggle__btn--active': viewMode === 'grid' }" @click="viewMode = 'grid'" aria-label="Grid view">
                  <span class="material-symbols-rounded">grid_view</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 批量操作栏 -->
          <Transition name="am-bulk">
            <div v-if="selectedIds.size > 0" class="am-bulk-bar">
              <span class="am-bulk-bar__count">{{ selectedIds.size }} selected</span>
              <div class="am-bulk-bar__actions">
                <button class="am-bulk-bar__btn" @click="bulkPublish">
                  <span class="material-symbols-rounded">publish</span>
                  Publish
                </button>
                <button class="am-bulk-bar__btn am-bulk-bar__btn--danger" @click="bulkDelete">
                  <span class="material-symbols-rounded">delete</span>
                  Delete
                </button>
              </div>
              <button class="am-bulk-bar__clear" @click="selectedIds.clear()">Clear</button>
            </div>
          </Transition>

          <!-- 文章列表 -->
          <div v-if="filteredArticles.length" class="am-article-list">
            <!-- 表头 -->
            <div class="am-article-row am-article-row--header">
              <label class="am-checkbox">
                <input type="checkbox" :checked="allSelected" @change="toggleSelectAll($event)" />
                <span class="am-checkbox__box"></span>
              </label>
              <span class="am-article-row__col-title">Article</span>
              <span class="am-article-row__col-status">Status</span>
              <span class="am-article-row__col-date">Date</span>
              <span class="am-article-row__col-tags">Tags</span>
              <span class="am-article-row__col-menu"></span>
            </div>

            <!-- 文章行 -->
            <div
              v-for="art in paginatedArticles"
              :key="art.documentId"
              class="am-article-row"
              :class="{ 'am-article-row--selected': selectedIds.has(art.documentId) }"
              @click="onEdit(findOriginalIndex(art))"
            >
              <label class="am-checkbox" @click.stop>
                <input type="checkbox" :checked="selectedIds.has(art.documentId)" @change="toggleSelect(art.documentId)" />
                <span class="am-checkbox__box"></span>
              </label>
              <div class="am-article-row__col-article">
                <div class="am-article-row__thumb" :class="art.publishedAt ? 'am-article-row__thumb--published' : 'am-article-row__thumb--draft'">
                  <span class="material-symbols-rounded">{{ art.publishedAt ? 'article' : 'edit_note' }}</span>
                </div>
                <div class="am-article-row__info">
                  <span class="am-article-row__title">{{ art.title || '(无标题)' }}</span>
                  <span class="am-article-row__desc">{{ art.description || '暂无描述' }}</span>
                </div>
              </div>
              <span class="am-article-row__col-status">
                <span class="am-status-tag" :class="art.publishedAt ? 'am-status-tag--published' : 'am-status-tag--draft'">
                  {{ art.publishedAt ? 'Published' : 'Draft' }}
                </span>
              </span>
              <span class="am-article-row__col-date">{{ formatDate(art.publishedAt || art.createdAt) }}</span>
              <span class="am-article-row__col-tags">
                <span
                  v-for="(tag, ti) in getVisibleTags(art.tags)"
                  :key="ti"
                  class="am-tag"
                  :class="getTagClass(tag)"
                >{{ tag }}</span>
              </span>
              <button class="am-article-row__menu" @click.stop aria-label="More options">
                <span class="material-symbols-rounded">more_vert</span>
              </button>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-else class="am-empty">
            <span class="material-symbols-rounded am-empty__icon">article</span>
            <p class="am-empty__title">暂无文章</p>
            <p class="am-empty__desc">点击右上角 New Article 创建第一篇文章</p>
          </div>

          <!-- 分页 -->
          <div v-if="totalPages > 1" class="am-pagination">
            <button class="am-pagination__btn" :disabled="currentPage <= 1" @click="currentPage--">
              <span class="material-symbols-rounded">chevron_left</span>
            </button>
            <button
              v-for="p in pageNumbers"
              :key="p"
              class="am-pagination__page"
              :class="{ 'am-pagination__page--active': p === currentPage }"
              @click="currentPage = p"
            >{{ p }}</button>
            <button class="am-pagination__btn" :disabled="currentPage >= totalPages" @click="currentPage++">
              <span class="material-symbols-rounded">chevron_right</span>
            </button>
          </div>
        </div>
      </template>

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

// ===== 列表视图状态 =====
const searchQuery = ref('')
const sortField = ref('Updated')
const sortAsc = ref(false)
const viewMode = ref('list')
const currentPage = ref(1)
const pageSize = 10
const selectedIds = ref(new Set())

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
  let result = articles.value
  if (showPublishedFilter.value === 'published') result = result.filter(a => a.publishedAt)
  if (showPublishedFilter.value === 'draft') result = result.filter(a => !a.publishedAt)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(a =>
      (a.title || '').toLowerCase().includes(q) ||
      (a.description || '').toLowerCase().includes(q)
    )
  }
  result = [...result].sort((a, b) => {
    const da = new Date(a.updatedAt || a.createdAt || 0).getTime()
    const db = new Date(b.updatedAt || b.createdAt || 0).getTime()
    return sortAsc.value ? da - db : db - da
  })
  return result
})

const publishedCount = computed(() => articles.value.filter(a => a.publishedAt).length)
const draftCount = computed(() => articles.value.filter(a => !a.publishedAt).length)

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

// ===== 列表视图：筛选选项 =====
const filterOptions = computed(() => [
  { label: 'All', value: 'all', count: articles.value.length },
  { label: 'Published', value: 'published', count: publishedCount.value },
  { label: 'Draft', value: 'draft', count: draftCount.value },
])

// ===== 分页 =====
const totalPages = computed(() => Math.max(1, Math.ceil(filteredArticles.value.length / pageSize)))
const paginatedArticles = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredArticles.value.slice(start, start + pageSize)
})
const pageNumbers = computed(() => {
  const pages = []
  for (let i = 1; i <= totalPages.value; i++) pages.push(i)
  return pages
})

// ===== 选择 =====
const allSelected = computed(() => {
  if (!paginatedArticles.value.length) return false
  return paginatedArticles.value.every(a => selectedIds.value.has(a.documentId))
})

function toggleSelectAll(event) {
  const checked = event.target.checked
  if (checked) {
    paginatedArticles.value.forEach(a => selectedIds.value.add(a.documentId))
  } else {
    paginatedArticles.value.forEach(a => selectedIds.value.delete(a.documentId))
  }
  selectedIds.value = new Set(selectedIds.value)
}

function toggleSelect(documentId) {
  if (selectedIds.value.has(documentId)) {
    selectedIds.value.delete(documentId)
  } else {
    selectedIds.value.add(documentId)
  }
  selectedIds.value = new Set(selectedIds.value)
}

// ===== 批量操作 =====
async function bulkPublish() {
  saving.value = true
  try {
    const ids = [...selectedIds.value]
    for (const id of ids) {
      const art = articles.value.find(a => a.documentId === id)
      if (art && !art.publishedAt) {
        await cmUpdate(props.token, UID, id, { publishedAt: new Date().toISOString() })
      }
    }
    showNotice(`已批量发布 ${ids.length} 篇文章`)
    selectedIds.value = new Set()
    await reloadArticles()
  } catch (e) {
    showNotice('批量发布失败：' + (e.message || '未知错误'), true)
  } finally {
    saving.value = false
  }
}

async function bulkDelete() {
  saving.value = true
  try {
    const ids = [...selectedIds.value]
    for (const id of ids) {
      await cmDelete(props.token, UID, id)
    }
    showNotice(`已删除 ${ids.length} 篇文章`)
    selectedIds.value = new Set()
    await reloadArticles()
  } catch (e) {
    showNotice('批量删除失败：' + (e.message || '未知错误'), true)
  } finally {
    saving.value = false
  }
}

function toggleSort() {
  sortAsc.value = !sortAsc.value
}

// ===== 辅助函数 =====
const TAG_COLOR_MAP = {
  primary: ['vue', 'strapi', 'changelog'],
  blue: ['design', 'deployment', 'development', 'md3'],
  green: ['ai', 'agent', 'rag'],
  orange: ['cms', 'headless'],
}

function formatDate(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

function getVisibleTags(tags) {
  if (!tags || !tags.length) return []
  return tags.slice(0, 2)
}

function getTagClass(tag) {
  const t = (tag || '').toLowerCase()
  for (const [cls, keywords] of Object.entries(TAG_COLOR_MAP)) {
    if (keywords.some(k => t.includes(k))) return `am-tag--${cls}`
  }
  return 'am-tag--primary'
}
</script>

<style scoped>
.article-manager {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  min-height: 100dvh;
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

/* ======== 骨架屏 ======== */
.skeleton-container {
  padding: 0;
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--md-sys-color-surface-container-high, #ece7e9) 0%,
    var(--md-sys-color-surface-container-highest, #e6e0e9) 50%,
    var(--md-sys-color-surface-container-high, #ece7e9) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  border-radius: 8px;
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton--topbar {
  height: 56px;
  margin-bottom: 0;
  border-radius: 0;
}

.skeleton-body {
  padding: 24px 32px;
}

.skeleton--page-title {
  height: 28px;
  width: 200px;
  margin-bottom: 24px;
}

.skeleton--filter-bar {
  height: 40px;
  width: 100%;
  margin-bottom: 16px;
}

.skeleton--row {
  height: 72px;
  width: 100%;
  margin-bottom: 8px;
}

/* ======== 顶部栏 ======== */
.am-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background-color: var(--md-sys-color-surface-container-lowest, #fefbff);
  border-bottom: 1px solid var(--md-sys-color-outline-variant, #e5e7eb);
  gap: 16px;
  flex-shrink: 0;
}

.am-topbar__search {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  max-width: 400px;
  padding: 8px 16px;
  background-color: var(--md-sys-color-surface-container-high, #f3f3f3);
  border-radius: 8px;
  border: 1px solid var(--md-sys-color-outline-variant, #e5e7eb);
}

.am-topbar__search-icon {
  font-size: 20px;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
}

.am-topbar__search-placeholder {
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant, #9ca3af);
  flex: 1;
}

.am-topbar__search-kbd {
  font-size: 12px;
  padding: 2px 6px;
  background-color: var(--md-sys-color-surface-container-highest, #e5e7eb);
  border-radius: 4px;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
}

.am-topbar__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.am-topbar__new-btn {
  --md-filled-button-container-shape: 8px;
}

.am-topbar__new-icon {
  font-size: 18px;
}

.am-topbar__icon-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
  transition: background-color 150ms;
}

.am-topbar__icon-btn:hover {
  background-color: var(--md-sys-color-surface-container-high, #f3f3f3);
}

.am-topbar__icon-btn .material-symbols-rounded {
  font-size: 22px;
}

.am-topbar__badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  border: 2px solid var(--md-sys-color-surface-container-lowest, #fefbff);
}

.am-topbar__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  cursor: pointer;
  flex-shrink: 0;
}

.am-topbar__avatar .material-symbols-rounded {
  font-size: 20px;
}

/* ======== 主体区域 ======== */
.am-body {
  padding: 24px 32px;
  flex: 1;
}

/* ======== 页面标题 ======== */
.am-page-header {
  margin-bottom: 24px;
}

.am-page-header__title {
  font-size: 24px;
  font-weight: 700;
  color: var(--md-sys-color-on-surface, #111827);
  margin: 0 0 4px;
}

.am-page-header__subtitle {
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
  margin: 0;
}

/* ======== 筛选栏 ======== */
.am-filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.am-filter-bar__left {
  display: flex;
  gap: 4px;
  background-color: var(--md-sys-color-surface-container-high, #f3f3f3);
  border-radius: 8px;
  padding: 4px;
}

.am-filter-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
  cursor: pointer;
  transition: all 150ms;
  font-family: inherit;
}

.am-filter-tab:hover {
  color: var(--md-sys-color-on-surface, #111827);
}

.am-filter-tab--active {
  background-color: var(--md-sys-color-surface-container-lowest, #fff);
  color: var(--md-sys-color-on-surface, #111827);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.am-filter-tab__count {
  font-size: 11px;
  padding: 1px 6px;
  background-color: var(--md-sys-color-surface-container-highest, #e5e7eb);
  border-radius: 999px;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
  font-weight: 600;
}

.am-filter-tab--active .am-filter-tab__count {
  background-color: #eef2ff;
  color: #6366f1;
}

.am-filter-bar__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.am-filter-bar__search {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: var(--md-sys-color-surface-container-high, #f3f3f3);
  border-radius: 8px;
  border: 1px solid var(--md-sys-color-outline-variant, #e5e7eb);
}

.am-filter-bar__search .material-symbols-rounded {
  font-size: 18px;
  color: var(--md-sys-color-on-surface-variant, #9ca3af);
}

.am-filter-bar__search-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 13px;
  color: var(--md-sys-color-on-surface, #111827);
  width: 140px;
  font-family: inherit;
}

.am-filter-bar__search-input::placeholder {
  color: var(--md-sys-color-on-surface-variant, #9ca3af);
}

.am-sort-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid var(--md-sys-color-outline-variant, #e5e7eb);
  background-color: var(--md-sys-color-surface-container-lowest, #fff);
  border-radius: 8px;
  font-size: 13px;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
  cursor: pointer;
  transition: all 150ms;
  font-family: inherit;
}

.am-sort-btn:hover {
  border-color: #6366f1;
  color: #6366f1;
}

.am-sort-btn .material-symbols-rounded {
  font-size: 16px;
}

.am-view-toggle {
  display: flex;
  border: 1px solid var(--md-sys-color-outline-variant, #e5e7eb);
  border-radius: 6px;
  overflow: hidden;
}

.am-view-toggle__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: var(--md-sys-color-surface-container-lowest, #fff);
  color: var(--md-sys-color-on-surface-variant, #6b7280);
  cursor: pointer;
  transition: all 150ms;
}

.am-view-toggle__btn--active {
  background-color: #eef2ff;
  color: #6366f1;
}

.am-view-toggle__btn .material-symbols-rounded {
  font-size: 18px;
}

/* ======== 批量操作栏 ======== */
.am-bulk-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  margin-bottom: 12px;
  background-color: #eef2ff;
  border: 1px solid #c7d2fe;
  border-radius: 8px;
  gap: 12px;
}

.am-bulk-bar__count {
  font-size: 13px;
  font-weight: 600;
  color: #4f46e5;
}

.am-bulk-bar__actions {
  display: flex;
  gap: 8px;
}

.am-bulk-bar__btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border: 1px solid var(--md-sys-color-outline-variant, #d1d5db);
  background: var(--md-sys-color-surface-container-lowest, #fff);
  border-radius: 6px;
  font-size: 13px;
  color: var(--md-sys-color-on-surface, #374151);
  cursor: pointer;
  transition: all 150ms;
  font-family: inherit;
}

.am-bulk-bar__btn:hover {
  background-color: var(--md-sys-color-surface-container-high, #f3f3f3);
}

.am-bulk-bar__btn .material-symbols-rounded {
  font-size: 16px;
}

.am-bulk-bar__btn--danger {
  color: #ef4444;
}

.am-bulk-bar__btn--danger:hover {
  background-color: #fef2f2;
  border-color: #fecaca;
}

.am-bulk-bar__clear {
  border: none;
  background: transparent;
  font-size: 13px;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: inherit;
}

.am-bulk-bar__clear:hover {
  color: var(--md-sys-color-on-surface, #111827);
}

.am-bulk-enter-active,
.am-bulk-leave-active {
  transition: all 200ms ease;
}

.am-bulk-enter-from,
.am-bulk-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ======== 文章列表 ======== */
.am-article-list {
  background-color: var(--md-sys-color-surface-container-lowest, #fff);
  border: 1px solid var(--md-sys-color-outline-variant, #e5e7eb);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* ======== 文章行 ======== */
.am-article-row {
  display: grid;
  grid-template-columns: 40px 1fr 120px 120px 180px 40px;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant, #f0f0f0);
  cursor: pointer;
  transition: background-color 100ms;
  gap: 12px;
}

.am-article-row:last-child {
  border-bottom: none;
}

.am-article-row:not(.am-article-row--header):hover {
  background-color: var(--md-sys-color-surface-container-high, #f9fafb);
}

.am-article-row--selected {
  background-color: #eef2ff;
}

.am-article-row--selected:hover {
  background-color: #e0e7ff;
}

.am-article-row--header {
  cursor: default;
  background-color: var(--md-sys-color-surface-container-high, #f9fafb);
  font-size: 12px;
  font-weight: 600;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.am-article-row--header:hover {
  background-color: var(--md-sys-color-surface-container-high, #f9fafb);
}

.am-article-row__col-title,
.am-article-row__col-status,
.am-article-row__col-date,
.am-article-row__col-tags,
.am-article-row__col-menu {
  overflow: hidden;
}

/* Article column with thumbnail + title/desc */
.am-article-row__col-article {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.am-article-row__thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  flex-shrink: 0;
}

.am-article-row__thumb--published {
  background-color: #ecfdf5;
  color: #059669;
}

.am-article-row__thumb--draft {
  background-color: #fff7ed;
  color: #d97706;
}

.am-article-row__thumb .material-symbols-rounded {
  font-size: 22px;
}

.am-article-row__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.am-article-row__title {
  font-size: 14px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface, #111827);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.am-article-row__desc {
  font-size: 12px;
  color: var(--md-sys-color-on-surface-variant, #9ca3af);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.am-article-row__col-date {
  font-size: 13px;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
}

.am-article-row__col-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.am-article-row__menu {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: var(--md-sys-color-on-surface-variant, #9ca3af);
  cursor: pointer;
  transition: all 150ms;
}

.am-article-row__menu:hover {
  background-color: var(--md-sys-color-surface-container-highest, #f3f3f3);
  color: var(--md-sys-color-on-surface, #111827);
}

.am-article-row__menu .material-symbols-rounded {
  font-size: 18px;
}

/* ======== 自定义复选框 ======== */
.am-checkbox {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.am-checkbox input {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
  margin: 0;
  z-index: 1;
}

.am-checkbox__box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: 2px solid var(--md-sys-color-outline-variant, #d1d5db);
  border-radius: 4px;
  background-color: transparent;
  transition: all 150ms;
}

.am-checkbox__box::after {
  content: '';
  width: 8px;
  height: 8px;
  background-color: #fff;
  border-radius: 1px;
  opacity: 0;
  transform: scale(0);
  transition: all 100ms;
  clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0, 43% 62%);
}

.am-checkbox input:checked ~ .am-checkbox__box {
  background-color: #6366f1;
  border-color: #6366f1;
}

.am-checkbox input:checked ~ .am-checkbox__box::after {
  opacity: 1;
  transform: scale(1);
}

.am-checkbox input:focus-visible ~ .am-checkbox__box {
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

/* ======== 状态标签 ======== */
.am-status-tag {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

/* ======== 分类标签 ======== */
.am-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

/* ======== 空状态 ======== */
.am-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 32px;
  background-color: var(--md-sys-color-surface-container-lowest, #fff);
  border: 1px solid var(--md-sys-color-outline-variant, #e5e7eb);
  border-radius: 8px;
}

.am-empty__icon {
  font-size: 48px;
  color: var(--md-sys-color-on-surface-variant, #9ca3af);
  opacity: 0.5;
  margin-bottom: 16px;
}

.am-empty__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--md-sys-color-on-surface, #111827);
  margin: 0 0 4px;
}

.am-empty__desc {
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
  margin: 0;
}

/* ======== 分页 ======== */
.am-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 24px;
}

.am-pagination__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--md-sys-color-outline-variant, #e5e7eb);
  background: var(--md-sys-color-surface-container-lowest, #fff);
  border-radius: 6px;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
  cursor: pointer;
  transition: all 150ms;
}

.am-pagination__btn:hover:not(:disabled) {
  border-color: #6366f1;
  color: #6366f1;
}

.am-pagination__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.am-pagination__btn .material-symbols-rounded {
  font-size: 18px;
}

.am-pagination__page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
  cursor: pointer;
  transition: all 150ms;
  font-family: inherit;
}

.am-pagination__page:hover {
  background-color: var(--md-sys-color-surface-container-high, #f3f3f3);
  color: var(--md-sys-color-on-surface, #111827);
}

.am-pagination__page--active {
  background-color: #6366f1;
  color: #fff;
}

.am-pagination__page--active:hover {
  background-color: #6366f1;
  color: #fff;
}

/* ======== 编辑器区域 ======== */
.editor-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 1400px;
  margin: 0 8px 8px;
  padding: 0;
  min-height: calc(100dvh - 16px);
  align-self: center;
}

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

.editor-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 0;
  background-color: var(--md-sys-color-surface-container-low, #f8f1f6);
  border-radius: 0 0 28px 28px;
  overflow: hidden;
  flex: 1;
  min-height: 0;
}

.editor-fields {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-right: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
  overflow-y: auto;
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

/* 编辑器内的 icon badge */
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

/* ======== Markdown 编辑器 ======== */
.md-editor {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

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

.md-editor__view-toggle {
  display: flex;
  gap: 0;
}

.md-editor__view-btn--active {
  background-color: var(--md-sys-color-secondary-container, #e8def8);
  border-radius: 20px;
}

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
  column-gap: 0;
}

.md-editor__body--split .md-editor__textarea {
  border-right: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
}

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

.md-editor__preview {
  padding: 16px 20px;
  background-color: var(--md-sys-color-surface, #fffbfe);
  overflow-y: auto;
  min-height: 400px;
  max-height: calc(100vh - 340px);
}

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
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ======== 响应式 ======== */
@media (max-width: 1024px) {
  .am-article-row {
    grid-template-columns: 40px 1fr 100px 100px 140px 40px;
    gap: 8px;
    padding: 10px 12px;
  }

  .am-body {
    padding: 16px 20px;
  }
}

@media (max-width: 768px) {
  .am-topbar {
    padding: 8px 16px;
  }

  .am-topbar__search {
    max-width: none;
  }

  .am-topbar__new-btn {
    --md-filled-button-label-text-size: 13px;
  }

  .am-body {
    padding: 16px;
  }

  .am-filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .am-filter-bar__right {
    flex-wrap: wrap;
  }

  .am-filter-bar__search-input {
    width: 100px;
  }

  .am-article-row {
    grid-template-columns: 32px 1fr 80px 32px;
    gap: 8px;
    padding: 10px 12px;
  }

  .am-article-row__col-status,
  .am-article-row__col-tags {
    display: none;
  }

  .am-article-row--header .am-article-row__col-status,
  .am-article-row--header .am-article-row__col-tags {
    display: none;
  }

  .am-article-row__thumb {
    width: 32px;
    height: 32px;
  }

  .am-article-row__thumb .material-symbols-rounded {
    font-size: 18px;
  }
}

@media (max-width: 840px) {
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

<!-- 非scoped样式：硬编码颜色 + 暗色主题覆盖 -->
<style>
/* ======== 状态标签颜色 ======== */
.am-status-tag--published {
  background: #ecfdf5;
  color: #065f46;
}

.am-status-tag--draft {
  background: #fff7ed;
  color: #c2410c;
}

/* ======== 分类标签颜色 ======== */
.am-tag--primary {
  background: #eef2ff;
  color: #4f46e5;
}

.am-tag--blue {
  background: #eff6ff;
  color: #1d4ed8;
}

.am-tag--green {
  background: #ecfdf5;
  color: #047857;
}

.am-tag--orange {
  background: #fff6ed;
  color: #c2410c;
}

/* ======== 暗色主题：状态标签 ======== */
[data-theme="dark"] .am-status-tag--published {
  background: #06381f;
  color: #34d399;
}

[data-theme="dark"] .am-status-tag--draft {
  background: #3a2200;
  color: #fbbf24;
}

/* ======== 暗色主题：分类标签 ======== */
[data-theme="dark"] .am-tag--primary {
  background: #2a1a4a;
  color: #a78bfa;
}

[data-theme="dark"] .am-tag--blue {
  background: #1e3a5f;
  color: #60a5fa;
}

[data-theme="dark"] .am-tag--green {
  background: #06381f;
  color: #34d399;
}

[data-theme="dark"] .am-tag--orange {
  background: #3a2200;
  color: #fbbf24;
}

/* ======== 暗色主题：缩略图 ======== */
[data-theme="dark"] .am-article-row__thumb--published {
  background: #06381f;
  color: #34d399;
}

[data-theme="dark"] .am-article-row__thumb--draft {
  background: #3a2200;
  color: #fbbf24;
}

/* ======== 暗色主题：筛选标签激活态 ======== */
[data-theme="dark"] .am-filter-tab--active .am-filter-tab__count {
  background: #312e81;
  color: #a5b4fc;
}

/* ======== 暗色主题：accent 相关 ======== */
[data-theme="dark"] .am-pagination__page--active {
  background-color: #6366f1;
}

[data-theme="dark"] .am-checkbox input:checked ~ .am-checkbox__box {
  background-color: #6366f1;
  border-color: #6366f1;
}

[data-theme="dark"] .am-view-toggle__btn--active {
  background: #312e81;
  color: #a5b4fc;
}

[data-theme="dark"] .am-bulk-bar {
  background: #1e1b4b;
  border-color: #3730a3;
}

[data-theme="dark"] .am-bulk-bar__count {
  color: #a5b4fc;
}

/* ======== 暗色主题：编辑器 ======== */
[data-theme="dark"] .editor-topbar {
  background-color: var(--md-sys-color-surface-container, #211f26);
}

[data-theme="dark"] .editor-grid {
  background-color: var(--md-sys-color-surface-container-low, #1d1b20);
}

[data-theme="dark"] .editor-fields {
  border-right-color: var(--md-sys-color-outline-variant, #49454f);
}

[data-theme="dark"] .md-editor__textarea {
  background-color: var(--md-sys-color-surface, #141218);
  color: var(--md-sys-color-on-surface, #e6e1e5);
}

[data-theme="dark"] .md-editor__preview {
  background-color: var(--md-sys-color-surface, #141218);
}

[data-theme="dark"] .md-editor__toolbar {
  background-color: var(--md-sys-color-surface-container, #211f26);
  border-bottom-color: var(--md-sys-color-outline-variant, #49454f);
}

[data-theme="dark"] .md-editor__statusbar {
  background-color: var(--md-sys-color-surface-container, #211f26);
  border-top-color: var(--md-sys-color-outline-variant, #49454f);
}

[data-theme="dark"] .md-editor__view-btn--active {
  background-color: var(--md-sys-color-secondary-container, #4a4458);
}

[data-theme="dark"] .editor-fields__delete-btn {
  --md-text-button-label-text-color: var(--md-sys-color-error, #f2b8b5);
}

[data-theme="dark"] .mio-icon-badge--published {
  background: var(--md-sys-color-primary-container, #4a4458);
  color: var(--md-sys-color-on-primary-container, #e8def8);
}

[data-theme="dark"] .mio-icon-badge--draft {
  background: var(--md-sys-color-secondary-container, #4a4458);
  color: var(--md-sys-color-on-secondary-container, #e8def8);
}
</style>
