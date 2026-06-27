<template>
  <div class="admin-view">
    <!-- 未登录状态 -->
    <div v-if="!isLoggedIn" class="admin-login">
      <div class="admin-login__card">
        <span class="material-symbols-rounded admin-login__icon">admin_panel_settings</span>
        <h1 class="admin-login__title">CMS 管理后台</h1>
        <p class="admin-login__desc">登录 Strapi 以管理文章与作者</p>

        <form class="admin-login__form" @submit.prevent="onLogin">
          <md-outlined-text-field
            label="邮箱"
            type="email"
            v-model="loginEmail"
            required
            class="admin-login__field"
          ></md-outlined-text-field>
          <md-outlined-text-field
            label="密码"
            type="password"
            v-model="loginPassword"
            required
            class="admin-login__field"
          ></md-outlined-text-field>
          <md-filled-button type="submit" :disabled="loginLoading" class="admin-login__btn">
            <span class="material-symbols-rounded" slot="icon">login</span>
            {{ loginLoading ? '登录中...' : '登录' }}
          </md-filled-button>
          <p v-if="loginError" class="admin-login__error">{{ loginError }}</p>
        </form>
      </div>
    </div>

    <!-- 已登录 — 主界面 -->
    <div v-else class="admin-main">
      <div class="admin-main__header">
        <h1 class="admin-main__title">CMS 管理后台</h1>
        <div class="admin-main__actions">
          <md-filled-button @click="onCreateArticle">
            <span class="material-symbols-rounded" slot="icon">add</span>
            新建文章
          </md-filled-button>
          <md-outlined-button @click="onLogout">
            <span class="material-symbols-rounded" slot="icon">logout</span>
            登出
          </md-outlined-button>
        </div>
      </div>

      <!-- API 连接状态 -->
      <div class="admin-status">
        <span class="admin-status__dot" :class="{ 'admin-status__dot--ok': apiConnected, 'admin-status__dot--err': !apiConnected }"></span>
        <span class="admin-status__text">{{ apiConnected ? 'Strapi 已连接' : 'Strapi 未连接' }}</span>
      </div>

      <!-- 标签栏切换 -->
      <md-tabs :active-tab-index="activeTabIdx" @change="onTabChange">
        <md-secondary-tab v-for="tab in tabs" :key="tab.id" :inline-icon="true">
          <span class="material-symbols-rounded" slot="icon">{{ tab.icon }}</span>
          {{ tab.label }}
        </md-secondary-tab>
      </md-tabs>

      <!-- 内容区 -->
      <div class="admin-main__content">
        <!-- 文章列表 -->
        <div v-if="activeTab === 'articles'" class="admin-articles">
          <div v-if="articlesLoading" class="admin-loading">
            <md-circular-progress indeterminate></md-circular-progress>
            <span>加载中...</span>
          </div>
          <div v-else-if="articles.length === 0" class="admin-empty">
            <span class="material-symbols-rounded">article</span>
            <p>暂无文章</p>
          </div>
          <div v-else class="admin-article-list">
            <div v-for="article in articles" :key="article.documentId" class="admin-article-card">
              <div class="admin-article-card__info">
                <div class="admin-article-card__title">{{ article.title }}</div>
                <div class="admin-article-card__meta">
                  <span class="admin-article-card__slug">/{{ article.slug }}</span>
                  <span class="admin-article-card__date">{{ formatDate(article.publishedAt) }}</span>
                  <span v-if="article.author" class="admin-article-card__author">{{ article.author.name }}</span>
                </div>
                <div v-if="article.description" class="admin-article-card__desc">{{ article.description }}</div>
                <div v-if="article.tags?.length" class="admin-article-card__tags">
                  <md-assist-chip v-for="tag in article.tags" :key="tag" :label="tag" class="admin-chip"></md-assist-chip>
                </div>
              </div>
              <div class="admin-article-card__actions">
                <md-icon-button @click="onEditArticle(article)" title="编辑">
                  <span class="material-symbols-rounded">edit</span>
                </md-icon-button>
                <md-icon-button @click="onDeleteArticle(article)" title="删除">
                  <span class="material-symbols-rounded">delete</span>
                </md-icon-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 作者列表 -->
        <div v-if="activeTab === 'authors'" class="admin-authors">
          <div class="admin-authors__header">
            <h2>作者管理</h2>
            <md-outlined-button @click="showCreateAuthor = true">
              <span class="material-symbols-rounded" slot="icon">person_add</span>
              新建作者
            </md-outlined-button>
          </div>
          <div v-if="authorsLoading" class="admin-loading">
            <md-circular-progress indeterminate></md-circular-progress>
          </div>
          <div v-else class="admin-author-list">
            <div v-for="author in authors" :key="author.documentId" class="admin-author-card">
              <span class="material-symbols-rounded admin-author-card__avatar">person</span>
              <div class="admin-author-card__info">
                <span class="admin-author-card__name">{{ author.name }}</span>
                <span class="admin-author-card__role">{{ author.role }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 文章编辑对话框 -->
    <md-dialog v-if="showArticleDialog" class="admin-article-dialog" :open="showArticleDialog" @close="onDialogClose">
      <div slot="headline">{{ editingArticle ? '编辑文章' : '新建文章' }}</div>
      <form slot="content" class="admin-article-form" @submit.prevent id="article-form">
        <md-outlined-text-field
          label="标题"
          v-model="articleForm.title"
          required
          class="admin-field"
        ></md-outlined-text-field>
        <md-outlined-text-field
          label="Slug (URL 路径)"
          v-model="articleForm.slug"
          required
          :placeholder="slugPlaceholder"
          class="admin-field"
        ></md-outlined-text-field>
        <md-outlined-text-field
          label="描述"
          type="textarea"
          rows="2"
          v-model="articleForm.description"
          class="admin-field"
        ></md-outlined-text-field>
        <md-outlined-text-field
          label="标签 (逗号分隔)"
          v-model="articleForm.tagsStr"
          class="admin-field"
        ></md-outlined-text-field>
        <md-outlined-text-field
          label="内容 (Markdown)"
          type="textarea"
          rows="12"
          v-model="articleForm.content"
          class="admin-field admin-field--content"
        ></md-outlined-text-field>
        <md-outlined-select label="作者" v-model="articleForm.authorId" class="admin-field">
          <md-select-option v-for="author in authors" :key="author.documentId" :value="author.documentId">
            {{ author.name }}
          </md-select-option>
        </md-outlined-select>
      </form>
      <div slot="actions">
        <md-text-button @click="showArticleDialog = false">取消</md-text-button>
        <md-filled-button form="article-form" @click="onSaveArticle" :disabled="saveLoading">
          {{ saveLoading ? '保存中...' : '保存' }}
        </md-filled-button>
      </div>
    </md-dialog>

    <!-- 创建作者对话框 -->
    <md-dialog v-if="showCreateAuthor" :open="showCreateAuthor" @close="showCreateAuthor = false">
      <div slot="headline">新建作者</div>
      <form slot="content" class="admin-author-form" @submit.prevent>
        <md-outlined-text-field label="姓名" v-model="authorForm.name" required class="admin-field"></md-outlined-text-field>
        <md-outlined-text-field label="角色" v-model="authorForm.role" class="admin-field"></md-outlined-text-field>
      </form>
      <div slot="actions">
        <md-text-button @click="showCreateAuthor = false">取消</md-text-button>
        <md-filled-button @click="onSaveAuthor">创建</md-filled-button>
      </div>
    </md-dialog>

    <!-- 删除确认对话框 -->
    <md-dialog v-if="showDeleteDialog" :open="showDeleteDialog" @close="showDeleteDialog = false">
      <div slot="headline">确认删除</div>
      <div slot="content">
        <p>确定要删除文章「{{ deletingArticle?.title }}」吗？此操作不可恢复。</p>
      </div>
      <div slot="actions">
        <md-text-button @click="showDeleteDialog = false">取消</md-text-button>
        <md-filled-button @click="onConfirmDelete" style="--md-sys-color-primary: var(--md-sys-color-error, #b3261e);">
          删除
        </md-filled-button>
      </div>
    </md-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  contentLogin,
  fetchArticles,
  fetchAuthors,
  createArticle,
  updateArticle,
  deleteArticle,
  createAuthor,
  getJwt,
  setJwt,
} from '@/services/cmsService'
import { clearArticleCache } from '@/services/articleService'

// ===== Material Web Components =====
import '@material/web/button/filled-button'
import '@material/web/button/outlined-button'
import '@material/web/button/text-button'
import '@material/web/iconbutton/icon-button'
import '@material/web/textfield/outlined-text-field'
import '@material/web/textfield/filled-text-field'
import '@material/web/select/outlined-select'
import '@material/web/select/select-option'
import '@material/web/tabs/tabs'
import '@material/web/tabs/secondary-tab'
import '@material/web/dialog/dialog'
import '@material/web/chips/assist-chip'
import '@material/web/progress/circular-progress'

// ===== 登录状态 =====
const isLoggedIn = ref(!!getJwt())
const loginEmail = ref('')
const loginPassword = ref('')
const loginLoading = ref(false)
const loginError = ref('')

async function onLogin() {
  loginLoading.value = true
  loginError.value = ''
  try {
    await contentLogin(loginEmail.value, loginPassword.value)
    isLoggedIn.value = true
    loadArticles()
    loadAuthors()
  } catch (e) {
    loginError.value = e.message
  } finally {
    loginLoading.value = false
  }
}

function onLogout() {
  setJwt(null)
  isLoggedIn.value = false
  articles.value = []
  authors.value = []
}

// ===== 数据 =====
const articles = ref([])
const authors = ref([])
const articlesLoading = ref(false)
const authorsLoading = ref(false)
const apiConnected = ref(false)

const tabs = [
  { id: 'articles', label: '文章', icon: 'article' },
  { id: 'authors', label: '作者', icon: 'person' },
]
const activeTab = ref('articles')
const activeTabIdx = computed(() => tabs.findIndex(t => t.id === activeTab.value))

function onTabChange(e) {
  const idx = e.target.activeTabIndex
  if (idx >= 0 && idx < tabs.length) activeTab.value = tabs[idx].id
}

// ===== 加载文章 =====
async function loadArticles() {
  articlesLoading.value = true
  try {
    articles.value = await fetchArticles()
    apiConnected.value = true
  } catch (e) {
    console.error('Failed to load articles:', e)
    apiConnected.value = false
  } finally {
    articlesLoading.value = false
  }
}

// ===== 加载作者 =====
async function loadAuthors() {
  authorsLoading.value = true
  try {
    authors.value = await fetchAuthors()
  } catch (e) {
    console.error('Failed to load authors:', e)
  } finally {
    authorsLoading.value = false
  }
}

// ===== 日期格式化 =====
function formatDate(iso) {
  if (!iso) return '草稿'
  const d = new Date(iso)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ===== 文章 CRUD =====
const showArticleDialog = ref(false)
const editingArticle = ref(null)  // null = 新建, object = 编辑
const saveLoading = ref(false)

const articleForm = ref({
  title: '',
  slug: '',
  description: '',
  tagsStr: '',
  content: '',
  authorId: '',
})

const slugPlaceholder = computed(() => {
  const t = articleForm.value.title
  if (!t) return 'auto-generated-from-title'
  return t.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '')
})

function onCreateArticle() {
  editingArticle.value = null
  articleForm.value = { title: '', slug: '', description: '', tagsStr: '', content: '', authorId: authors.value[0]?.documentId || '' }
  showArticleDialog.value = true
}

function onEditArticle(article) {
  editingArticle.value = article
  articleForm.value = {
    title: article.title || '',
    slug: article.slug || '',
    description: article.description || '',
    tagsStr: (article.tags || []).join(', '),
    content: article.content || '',
    authorId: article.author?.documentId || '',
  }
  showArticleDialog.value = true
}

async function onSaveArticle() {
  if (!articleForm.value.title) return
  saveLoading.value = true
  try {
    const data = {
      title: articleForm.value.title,
      slug: articleForm.value.slug || slugPlaceholder.value,
      description: articleForm.value.description,
      tags: articleForm.value.tagsStr ? articleForm.value.tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [],
      content: articleForm.value.content,
      authorId: articleForm.value.authorId || undefined,
    }

    if (editingArticle.value) {
      await updateArticle(editingArticle.value.documentId, data)
    } else {
      await createArticle(data)
    }

    showArticleDialog.value = false
    clearArticleCache()  // 清除前端缓存
    await loadArticles()  // 刷新列表
  } catch (e) {
    alert('保存失败: ' + e.message)
  } finally {
    saveLoading.value = false
  }
}

// 删除
const showDeleteDialog = ref(false)
const deletingArticle = ref(null)

function onDeleteArticle(article) {
  deletingArticle.value = article
  showDeleteDialog.value = true
}

async function onConfirmDelete() {
  if (!deletingArticle.value) return
  try {
    await deleteArticle(deletingArticle.value.documentId)
    showDeleteDialog.value = false
    clearArticleCache()
    await loadArticles()
  } catch (e) {
    alert('删除失败: ' + e.message)
  }
}

// 对话框关闭
function onDialogClose(e) {
  if (e.target?.returnValue !== 'confirm') {
    showArticleDialog.value = false
  }
}

// ===== 作者 CRUD =====
const showCreateAuthor = ref(false)
const authorForm = ref({ name: '', role: '' })

async function onSaveAuthor() {
  if (!authorForm.value.name) return
  try {
    await createAuthor(authorForm.value)
    showCreateAuthor.value = false
    authorForm.value = { name: '', role: '' }
    await loadAuthors()
  } catch (e) {
    alert('创建失败: ' + e.message)
  }
}

// ===== 初始化 =====
onMounted(() => {
  if (isLoggedIn.value) {
    loadArticles()
    loadAuthors()
  }
})
</script>

<style scoped>
/* ===== 全局 ===== */
.admin-view {
  padding: 24px;
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
}

/* ===== 登录页 ===== */
.admin-login {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.admin-login__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px;
  border-radius: 28px;
  background: var(--md-sys-color-surface-container, #ece7e9);
  max-width: 400px;
  width: 100%;
  box-sizing: border-box;
}

.admin-login__icon {
  font-size: 48px;
  color: var(--md-sys-color-primary, #6750a4);
  margin-bottom: 16px;
}

.admin-login__title {
  font-size: 28px;
  font-weight: 475;
  line-height: 36px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0 0 8px;
}

.admin-login__desc {
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  margin: 0 0 32px;
  text-align: center;
}

.admin-login__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.admin-login__field {
  width: 100%;
}

.admin-login__btn {
  width: 100%;
  margin-top: 8px;
}

.admin-login__error {
  color: var(--md-sys-color-error, #b3261e);
  font-size: 14px;
  margin: 8px 0 0;
  text-align: center;
}

/* ===== 主界面 ===== */
.admin-main__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 16px;
}

.admin-main__title {
  font-size: 28px;
  font-weight: 475;
  line-height: 36px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0;
}

.admin-main__actions {
  display: flex;
  gap: 8px;
}

.admin-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
}

.admin-status__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.admin-status__dot--ok {
  background: #0b8043;
}

.admin-status__dot--err {
  background: var(--md-sys-color-error, #b3261e);
}

md-tabs {
  margin-bottom: 24px;
}

.admin-main__content {
  min-height: 300px;
}

/* ===== 文章列表 ===== */
.admin-loading {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 48px;
  justify-content: center;
  color: var(--md-sys-color-on-surface-variant, #49454f);
}

.admin-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
}

.admin-empty .material-symbols-rounded {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.admin-article-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.admin-article-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 20px;
  border-radius: 16px;
  background: var(--md-sys-color-surface-container, #ece7e9);
  gap: 16px;
}

.admin-article-card__info {
  flex: 1;
  min-width: 0;
}

.admin-article-card__title {
  font-size: 18px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin-bottom: 4px;
}

.admin-article-card__meta {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  margin-bottom: 4px;
}

.admin-article-card__slug {
  font-family: 'Google Sans Mono', monospace;
  font-size: 12px;
}

.admin-article-card__desc {
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  margin-top: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.admin-article-card__tags {
  display: flex;
  gap: 4px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.admin-chip {
  --md-chip-height: 24px;
  font-size: 12px;
}

.admin-article-card__actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

/* ===== 作者列表 ===== */
.admin-authors__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.admin-authors__header h2 {
  font-size: 20px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0;
}

.admin-author-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.admin-author-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 16px;
  background: var(--md-sys-color-surface-container, #ece7e9);
}

.admin-author-card__avatar {
  font-size: 32px;
  color: var(--md-sys-color-primary, #6750a4);
}

.admin-author-card__info {
  display: flex;
  flex-direction: column;
}

.admin-author-card__name {
  font-size: 16px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

.admin-author-card__role {
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
}

/* ===== 表单 ===== */
.admin-article-form,
.admin-author-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 480px;
}

.admin-field {
  width: 100%;
}

.admin-field--content {
  --md-outlined-text-field-container-height: 400px;
}

/* ===== 对话框 ===== */
.admin-article-dialog {
  --md-dialog-container-max-width: 640px;
}

/* ===== 暗色主题 ===== */
:global([data-theme="dark"] .admin-login__card) {
  background: var(--md-sys-color-surface-container, #2b292b);
}

:global([data-theme="dark"] .admin-article-card),
:global([data-theme="dark"] .admin-author-card) {
  background: var(--md-sys-color-surface-container, #2b292b);
}

/* ===== 移动端 ===== */
@media screen and (max-width: 600px) {
  .admin-view {
    padding: 16px;
  }

  .admin-login__card {
    padding: 32px 24px;
  }

  .admin-main__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .admin-article-card {
    flex-direction: column;
  }

  .admin-article-form,
  .admin-author-form {
    min-width: unset;
  }
}
</style>
