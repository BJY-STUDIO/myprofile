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

    <div class="section-title">
      <h2>文章管理</h2>
      <md-filled-tonal-button @click="onCreate">
        <span class="material-symbols-rounded" slot="icon">add</span>
        新建文章
      </md-filled-tonal-button>
    </div>

    <!-- ======== 骨架屏 ======== -->
    <div v-if="!loader.dataLoaded.value" class="article-list">
      <div v-for="n in 4" :key="'sk-' + n" class="article-card article-card--skeleton">
        <div class="article-card__main">
          <div class="article-card__info">
            <span class="skeleton" style="height:18px;width:55%;"></span>
            <div style="display:flex;gap:12px;margin-top:8px;">
              <span class="skeleton" style="height:12px;width:80px;"></span>
              <span class="skeleton" style="height:12px;width:60px;"></span>
              <span class="skeleton" style="height:12px;width:50px;"></span>
            </div>
            <span class="skeleton" style="height:12px;width:80%;margin-top:6px;"></span>
          </div>
        </div>
        <div class="article-card__actions article-card__actions--skeleton">
          <span class="skeleton" style="width:40px;height:40px;border-radius:20px;"></span>
          <span class="skeleton" style="width:40px;height:40px;border-radius:20px;"></span>
        </div>
      </div>
    </div>

    <!-- ======== 真实内容（fadeIn） ======== -->
    <div v-else :class="{ 'content-fadein': loader.fadeInActive.value }">
      <div v-if="articles.length" class="article-list">
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
    </div>

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
        <md-outlined-text-field label="正文内容（Markdown）" id="art-content" type="textarea" :value="form.content" rows="12" supporting-text="支持 Markdown 格式"></md-outlined-text-field>
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
import { cmCreate, cmUpdate, cmDelete } from '@/services/articleService'
import { useAdminLoader } from '@/composables/useAdminLoader'
import '@material/web/button/filled-button'
import '@material/web/button/filled-tonal-button'
import '@material/web/button/text-button'
import '@material/web/iconbutton/icon-button'
import '@material/web/dialog/dialog'
import '@material/web/textfield/outlined-text-field'
import '@material/web/progress/linear-progress'

const UID = 'api::article.article'

const props = defineProps({ token: { type: String, required: true } })

// ===== 共享加载控制器 =====
const loader = useAdminLoader()

const articles = ref([])
const saving = ref(false)
const showDialog = ref(false)
const showDeleteConfirm = ref(false)
const editingIndex = ref(-1)
const deleteTarget = ref(null)

const form = ref({ title: '', slug: '', description: '', content: '', date: '', sortOrder: 0, tagsRaw: '[]' })

// ===== 数据加载（带冷启动重试） =====
const LIST_PARAMS = { pageSize: 100, sort: ['sortOrder:asc', 'createdAt:desc'] }

function loadArticles() {
  loader.loadWithRetry(
    props.token, UID, LIST_PARAMS,
    (results) => { articles.value = results }
  )
}

/** 静默刷新（CRUD 后） */
async function reloadArticles() {
  await loader.silentReload(props.token, UID, LIST_PARAMS, (results) => {
    articles.value = results
  })
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
    await reloadArticles()
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
    await reloadArticles()
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

/* ======== 缓冲进度条 ======== */
.loading-progress {
  position: sticky;
  top: 0;
  z-index: 10;
  width: 100%;
  margin: -24px -24px 24px -24px;
  width: calc(100% + 48px);
  --md-linear-progress-active-indicator-color: var(--md-sys-color-primary, #6750a4);
  --md-linear-progress-track-color: var(--md-sys-color-surface-container-highest, #e6e0e9);
  transition: opacity 400ms ease-out;
}

.loading-progress--fading {
  opacity: 0;
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

.article-card--skeleton {
  border-color: transparent;
  background: var(--md-sys-color-surface-container-low, #f8f1f6);
}

.article-card--skeleton .article-card__info {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.article-card__actions--skeleton {
  display: flex;
  gap: 4px;
}

.article-card__main {
  flex: 1;
  min-width: 0;
}

.article-card__info {
  flex: 1;
  min-width: 0;
}

.article-card__title {
  display: block;
  font-family: var(--md-sys-typescale-title-m-font-family);
  font-size: var(--md-sys-typescale-title-m-font-size);
  font-weight: var(--md-sys-typescale-title-m-font-weight);
  letter-spacing: var(--md-sys-typescale-title-m-letter-spacing);
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
  font-family: var(--md-sys-typescale-label-m-font-family);
  font-size: var(--md-sys-typescale-label-m-font-size);
  font-weight: var(--md-sys-typescale-label-m-font-weight);
  letter-spacing: var(--md-sys-typescale-label-m-letter-spacing);
  color: var(--md-sys-color-on-surface-variant, #49454f);
}

.article-card__desc {
  display: block;
  font-family: var(--md-sys-typescale-body-m-font-family);
  font-size: var(--md-sys-typescale-body-m-font-size);
  font-weight: var(--md-sys-typescale-body-m-font-weight);
  letter-spacing: var(--md-sys-typescale-body-m-letter-spacing);
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

.empty-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  font-family: var(--md-sys-typescale-body-m-font-family);
  font-size: var(--md-sys-typescale-body-m-font-size);
}

.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 400px;
  max-width: 560px;
}

/* ======== fadeIn 动画（对照 M3: opacity 0→1 + translateY 10px→0, 200ms delay + 200ms linear） ======== */
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
</style>
