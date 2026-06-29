<template>
  <div class="article-manager">
    <div class="section-title">
      <h2>文章管理</h2>
      <md-filled-tonal-button @click="onCreate">
        <span class="material-symbols-rounded" slot="icon">add</span>
        新建文章
      </md-filled-tonal-button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-hint">
      <md-circular-progress indeterminate></md-circular-progress>
      <span>加载中...</span>
    </div>

    <!-- 文章列表 -->
    <div v-else-if="articles.length" class="article-list">
      <div v-for="(art, i) in articles" :key="art.documentId" class="article-card">
        <div class="article-card__main">
          <div class="article-card__info">
            <span class="article-card__title">{{ art.title || '(无标题)' }}</span>
            <span class="article-card__meta">
              <span v-if="art.slug" class="article-card__slug">{{ art.slug }}</span>
              <span v-if="art.date" class="article-card__date">{{ art.date }}</span>
              <span v-if="art.sortOrder != null" class="article-card__sort">排序: {{ art.sortOrder }}</span>
            </span>
            <span v-if="art.description" class="article-card__desc">{{ art.description }}</span>
          </div>
        </div>
        <div class="article-card__actions">
          <md-icon-button @click="onEdit(i)">
            <span class="material-symbols-rounded">edit</span>
          </md-icon-button>
          <md-icon-button @click="onRemove(i)">
            <span class="material-symbols-rounded">delete</span>
          </md-icon-button>
        </div>
      </div>
    </div>

    <div v-else class="empty-hint">暂无文章</div>

    <!-- 编辑对话框 -->
    <md-dialog :open="showDialog" @close="showDialog = false" class="edit-dialog">
      <div slot="headline">{{ editingIndex >= 0 ? '编辑文章' : '新建文章' }}</div>
      <form slot="content" class="dialog-form" id="article-form" @submit.prevent>
        <md-outlined-text-field label="标题" id="art-title" :value="form.title"></md-outlined-text-field>
        <md-outlined-text-field label="Slug（URL标识）" id="art-slug" :value="form.slug" helper="留空则自动从标题生成"></md-outlined-text-field>
        <md-outlined-text-field label="描述" id="art-description" :value="form.description" type="textarea" rows="2"></md-outlined-text-field>
        <md-outlined-text-field label="自定义日期" id="art-date" :value="form.date" type="date" helper="可选，覆盖发布日期显示"></md-outlined-text-field>
        <md-outlined-text-field label="排序序号" id="art-sortOrder" :value="String(form.sortOrder ?? 0)" type="number"></md-outlined-text-field>
        <md-outlined-text-field label="标签（JSON 数组）" id="art-tags" :value="form.tagsRaw" helper='如 ["技术","Vue"]'></md-outlined-text-field>
        <label class="textarea-label">
          正文内容（Markdown）
          <textarea id="art-content" class="content-textarea" :value="form.content" rows="12" placeholder="支持 Markdown 格式"></textarea>
        </label>
      </form>
      <div slot="actions">
        <md-text-button @click="showDialog = false">取消</md-text-button>
        <md-filled-button @click="onSave" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</md-filled-button>
      </div>
    </md-dialog>

    <!-- 删除确认 -->
    <md-dialog :open="showDeleteConfirm" @close="showDeleteConfirm = false">
      <div slot="headline">确认删除</div>
      <div slot="content">确定删除文章「{{ deleteTarget?.title }}」？此操作不可撤销。</div>
      <div slot="actions">
        <md-text-button @click="showDeleteConfirm = false">取消</md-text-button>
        <md-filled-button @click="confirmDelete" :disabled="saving">删除</md-filled-button>
      </div>
    </md-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { strapiAdminLogin, cmList, cmCreate, cmUpdate, cmDelete } from '@/services/articleService'
import '@material/web/button/filled-button'
import '@material/web/button/filled-tonal-button'
import '@material/web/button/text-button'
import '@material/web/iconbutton/icon-button'
import '@material/web/dialog/dialog'
import '@material/web/textfield/outlined-text-field'
import '@material/web/progress/circular-progress'

const UID = 'api::article.article'

const props = defineProps({ token: { type: String, required: true } })

const articles = ref([])
const loading = ref(true)
const saving = ref(false)
const showDialog = ref(false)
const showDeleteConfirm = ref(false)
const editingIndex = ref(-1)
const deleteTarget = ref(null)

const form = ref({ title: '', slug: '', description: '', content: '', date: '', sortOrder: 0, tagsRaw: '[]' })

async function loadArticles() {
  loading.value = true
  try {
    const { results } = await cmList(props.token, UID, {
      pageSize: 100,
      sort: ['sortOrder:asc', 'createdAt:desc'],
    })
    articles.value = results
  } catch (e) {
    console.error('loadArticles failed:', e)
  } finally {
    loading.value = false
  }
}

onMounted(loadArticles)

function onCreate() {
  editingIndex.value = -1
  form.value = { title: '', slug: '', description: '', content: '', date: '', sortOrder: articles.value.length, tagsRaw: '[]' }
  showDialog.value = true
}

function onEdit(i) {
  const art = articles.value[i]
  editingIndex.value = i
  form.value = {
    title: art.title || '',
    slug: art.slug || '',
    description: art.description || '',
    content: art.content || '',
    date: art.date || '',
    sortOrder: art.sortOrder ?? 0,
    tagsRaw: JSON.stringify(art.tags || []),
  }
  showDialog.value = true
}

async function onSave() {
  const title = document.getElementById('art-title')?.value?.trim() || ''
  const slug = document.getElementById('art-slug')?.value?.trim() || ''
  const description = document.getElementById('art-description')?.value?.trim() || ''
  const date = document.getElementById('art-date')?.value || ''
  const sortOrder = parseInt(document.getElementById('art-sortOrder')?.value) || 0
  const tagsRaw = document.getElementById('art-tags')?.value?.trim() || '[]'
  const content = document.getElementById('art-content')?.value || ''

  let tags
  try { tags = JSON.parse(tagsRaw) } catch { tags = [] }

  const data = { title, slug, description, content, date, sortOrder, tags }

  // slug 为空时由 Strapi 从 title 自动生成
  if (slug) data.slug = slug

  saving.value = true
  try {
    if (editingIndex.value >= 0) {
      const docId = articles.value[editingIndex.value].documentId
      await cmUpdate(props.token, UID, docId, data)
    } else {
      await cmCreate(props.token, UID, data)
    }
    showDialog.value = false
    await loadArticles()
  } catch (e) {
    alert('保存失败：' + (e.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

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
    await loadArticles()
  } catch (e) {
    alert('删除失败：' + (e.message || '未知错误'))
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.article-manager {
  padding: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.section-title h2 {
  font-size: 28px;
  font-weight: 475;
  line-height: 36px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0;
}

.article-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.article-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
  border-radius: 16px;
  background: var(--md-sys-color-surface-container-low, #f8f1f6);
}

.article-card__main {
  flex: 1;
  min-width: 0;
}

.article-card__title {
  display: block;
  font-size: 16px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

.article-card__meta {
  display: flex;
  gap: 12px;
  margin-top: 4px;
}

.article-card__slug,
.article-card__date,
.article-card__sort {
  font-size: 12px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
}

.article-card__desc {
  display: block;
  font-size: 13px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.article-card__actions {
  display: flex;
  gap: 4px;
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

.textarea-label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface-variant, #49454f);
}

.content-textarea {
  width: 100%;
  min-height: 240px;
  padding: 12px;
  border: 1px solid var(--md-sys-color-outline, #79747e);
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  resize: vertical;
  background: var(--md-sys-color-surface, #fffbfe);
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

.content-textarea:focus {
  outline: 2px solid var(--md-sys-color-primary, #6750a4);
  outline-offset: -1px;
}
</style>
