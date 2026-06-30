<template>
  <div class="admin-dashboard">
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
      <section class="dashboard-greeting">
        <div class="skeleton skeleton--title"></div>
        <div class="skeleton skeleton--subtitle"></div>
      </section>
      <section class="dashboard-section">
        <div class="skeleton skeleton--section-title"></div>
        <div class="skeleton skeleton--card-wide"></div>
      </section>
      <section class="dashboard-section">
        <div class="skeleton skeleton--section-title"></div>
        <div class="skeleton skeleton--list-item"></div>
        <div class="skeleton skeleton--list-item"></div>
        <div class="skeleton skeleton--list-item"></div>
      </section>
      <section class="dashboard-section">
        <div class="skeleton skeleton--section-title"></div>
        <div class="quick-actions-grid">
          <div class="skeleton skeleton--action-card" v-for="i in 4" :key="i"></div>
        </div>
      </section>
    </div>

    <!-- ======== 真实内容 ======== -->
    <div v-else :class="{ 'content-fadein': loader.fadeInActive.value }">

      <!-- ======== 顶部导航栏 ======== -->
      <header class="dashboard-topbar">
        <div class="dashboard-topbar__search">
          <span class="material-symbols-rounded dashboard-topbar__search-icon">search</span>
          <span class="dashboard-topbar__search-placeholder">Search articles...</span>
          <span class="dashboard-topbar__search-kbd">⌘K</span>
        </div>
        <div class="dashboard-topbar__actions">
          <md-filled-button class="dashboard-topbar__new-btn" @click="onQuickAction('new-article')">
            <span class="material-symbols-rounded dashboard-topbar__new-icon" slot="icon">add</span>
            New Article
          </md-filled-button>
          <button class="dashboard-topbar__icon-btn" aria-label="Notifications">
            <span class="material-symbols-rounded">notifications</span>
            <span class="dashboard-topbar__badge"></span>
          </button>
          <div class="dashboard-topbar__avatar">
            <span class="material-symbols-rounded">person</span>
          </div>
        </div>
      </header>

      <!-- 内容区统一 padding -->
      <div class="dashboard-body">

        <!-- 1. 问候模块 -->
        <section class="dashboard-greeting">
          <h1 class="dashboard-greeting__title">{{ greetingText }}, Bao 👋</h1>
          <p class="dashboard-greeting__subtitle">Here's what's happening with your blog today.</p>
        </section>

        <!-- 2. Continue writing — 用最近编辑的文章做占位 -->
        <section v-if="continueArticle" class="dashboard-section">
          <h2 class="dashboard-section__title">Continue writing</h2>
          <div class="continue-card">
            <div class="continue-card__thumb">
              <span class="material-symbols-rounded continue-card__thumb-icon">
                {{ continueArticle.publishedAt ? 'article' : 'edit_note' }}
              </span>
            </div>
            <div class="continue-card__body">
              <span class="continue-card__title">{{ continueArticle.title || '(无标题)' }}</span>
              <span class="continue-card__desc">{{ continueArticle.description || '暂无描述' }}</span>
              <span class="continue-card__meta">Last edited {{ formatRelativeTime(continueArticle.updatedAt) }}</span>
            </div>
            <button class="continue-card__menu" aria-label="More options">
              <span class="material-symbols-rounded">more_vert</span>
            </button>
            <button class="continue-card__action" @click="onContinueWriting(continueArticle)">
              <span>Continue writing</span>
              <span class="material-symbols-rounded">arrow_forward</span>
            </button>
          </div>
        </section>

        <!-- 3. Recent articles -->
        <section class="dashboard-section">
          <div class="dashboard-section__header">
            <h2 class="dashboard-section__title">Recent articles</h2>
            <button class="dashboard-section__link" @click="goToArticles">
              View all <span class="material-symbols-rounded">arrow_forward</span>
            </button>
          </div>
          <div class="recent-list" v-if="recentArticles.length">
            <div
              v-for="(art, idx) in recentArticles"
              :key="art.documentId"
              class="recent-item"
              :class="{ 'recent-item--last': idx === recentArticles.length - 1 }"
              @click="onArticleClick(art)"
            >
              <!-- 封面图占位 -->
              <div class="recent-item__thumb" :class="getArticleThumbClass(art)">
                <span class="material-symbols-rounded">{{ art.publishedAt ? 'article' : 'edit_note' }}</span>
              </div>
              <!-- 标题+描述 -->
              <div class="recent-item__body">
                <span class="recent-item__title">{{ art.title || '(无标题)' }}</span>
                <span class="recent-item__desc">{{ art.description || '暂无描述' }}</span>
              </div>
              <!-- 状态 — 固定宽度列对齐 -->
              <span
                class="recent-item__status"
                :class="art.publishedAt ? 'recent-item__status--published' : 'recent-item__status--draft'"
              >
                {{ art.publishedAt ? 'Published' : 'Draft' }}
              </span>
              <!-- 日期 — 固定宽度列对齐 -->
              <span class="recent-item__date">{{ formatDate(art.publishedAt || art.createdAt) }}</span>
              <!-- 分类标签 — 固定宽度列对齐 -->
              <div class="recent-item__tags" v-if="art.tags && art.tags.length">
                <span
                  v-for="(tag, ti) in getVisibleTags(art.tags)"
                  :key="ti"
                  class="recent-item__tag"
                  :class="getTagClass(tag)"
                >{{ tag }}</span>
              </div>
              <!-- 三点菜单 -->
              <button class="recent-item__menu" aria-label="More options" @click.stop>
                <span class="material-symbols-rounded">more_vert</span>
              </button>
            </div>
          </div>
          <div v-else class="empty-state">
            <span class="material-symbols-rounded empty-state__icon">article</span>
            <p class="empty-state__text">暂无文章</p>
          </div>
        </section>

        <!-- 4. Quick actions -->
        <section class="dashboard-section dashboard-section--last">
          <h2 class="dashboard-section__title">Quick actions</h2>
          <div class="quick-actions-grid">
            <button class="quick-action-card" @click="onQuickAction('new-article')">
              <div class="quick-action-card__icon quick-action-card__icon--primary">
                <span class="material-symbols-rounded">edit</span>
              </div>
              <div class="quick-action-card__text">
                <span class="quick-action-card__title">New article</span>
                <span class="quick-action-card__desc">Start writing a new article</span>
              </div>
            </button>
            <button class="quick-action-card" @click="onQuickAction('upload-media')">
              <div class="quick-action-card__icon quick-action-card__icon--green">
                <span class="material-symbols-rounded">upload</span>
              </div>
              <div class="quick-action-card__text">
                <span class="quick-action-card__title">Upload media</span>
                <span class="quick-action-card__desc">Add image or file</span>
              </div>
            </button>
            <button class="quick-action-card" @click="onQuickAction('new-category')">
              <div class="quick-action-card__icon quick-action-card__icon--orange">
                <span class="material-symbols-rounded">folder</span>
              </div>
              <div class="quick-action-card__text">
                <span class="quick-action-card__title">New category</span>
                <span class="quick-action-card__desc">Create a new category</span>
              </div>
            </button>
            <button class="quick-action-card" @click="onQuickAction('view-analytics')">
              <div class="quick-action-card__icon quick-action-card__icon--blue">
                <span class="material-symbols-rounded">bar_chart</span>
              </div>
              <div class="quick-action-card__text">
                <span class="quick-action-card__title">View analytics</span>
                <span class="quick-action-card__desc">Check your blog stats</span>
              </div>
            </button>
          </div>
        </section>

      </div><!-- /.dashboard-body -->
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { cmList } from '@/services/articleService'
import { useAdminLoader } from '@/composables/useAdminLoader'
import '@material/web/progress/linear-progress'
import '@material/web/button/filled-button'

const UID = 'api::article.article'
const router = useRouter()

const props = defineProps({ token: { type: String, required: true } })

// ===== 共享加载控制器 =====
const loader = useAdminLoader()

const articles = ref([])

// ===== 问候语 =====
const greetingText = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
})

// ===== 最近文章（按更新时间倒序取前 5 篇） =====
const recentArticles = computed(() => {
  return [...articles.value]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 5)
})

// ===== Continue writing — 优先后取草稿，无草稿则取最近编辑的文章 =====
const continueArticle = computed(() => {
  const sorted = [...articles.value]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
  // 优先草稿
  const draft = sorted.find(a => !a.publishedAt)
  if (draft) return draft
  // 无草稿则取最近编辑的文章
  return sorted[0] || null
})

// ===== 数据加载 =====
const LIST_PARAMS = { pageSize: 100, sort: ['updatedAt:desc', 'createdAt:desc'] }

function loadArticles() {
  loader.loadWithRetry(
    props.token, UID, LIST_PARAMS,
    (results) => { articles.value = results }
  )
}

onMounted(loadArticles)

// ===== 路由跳转 =====
function goToArticles() {
  router.push('/admin?tab=articles')
}

function onContinueWriting(art) {
  router.push('/admin?tab=articles')
}

function onArticleClick(art) {
  router.push('/admin?tab=articles')
}

function onQuickAction(action) {
  switch (action) {
    case 'new-article':
      router.push('/admin?tab=articles')
      break
    case 'upload-media':
    case 'new-category':
    case 'view-analytics':
      // TODO: 对应模块暂未实现，暂无操作
      break
  }
}

// ===== 工具方法 =====
function formatDate(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

function formatRelativeTime(isoStr) {
  if (!isoStr) return ''
  const now = Date.now()
  const then = new Date(isoStr).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin} minutes ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 30) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`
  return formatDate(isoStr)
}

function getArticleThumbClass(art) {
  if (art.publishedAt) return 'recent-item__thumb--purple'
  return 'recent-item__thumb--orange'
}

// 标签：最多显示2个
function getVisibleTags(tags) {
  if (!tags || !tags.length) return []
  return tags.slice(0, 2)
}

// 标签颜色：根据文字内容分配不同色系
const TAG_COLOR_MAP = {
  primary: ['vue', 'strapi', 'changelog'],
  blue: ['design', 'deployment', 'development', 'md3'],
  green: ['ai', 'agent', 'rag'],
  orange: ['cms', 'headless'],
}
function getTagClass(tag) {
  const t = (tag || '').toLowerCase()
  for (const [cls, keywords] of Object.entries(TAG_COLOR_MAP)) {
    if (keywords.some(k => t.includes(k))) return `recent-item__tag--${cls}`
  }
  return 'recent-item__tag--primary'
}
</script>

<style scoped>
/* ===== 根容器 ===== */
.admin-dashboard {
  min-height: 100%;
  background: #F8F9FF;
}

/* ===== 进度条 ===== */
.loading-progress {
  position: fixed;
  top: 0;
  left: 80px;
  z-index: 100;
  width: calc(100% - 80px);
  --md-linear-progress-active-indicator-color: #6366F1;
  --md-linear-progress-track-color: #ede9fe;
  transition: opacity 400ms ease-out;
}
.loading-progress--fading { opacity: 0; }

@media (max-width: 840px) {
  .loading-progress { left: 0; width: 100%; }
}

/* ===== fadeIn 动画 ===== */
.content-fadein {
  animation: dashboard-fadein 200ms linear 200ms both;
}
@keyframes dashboard-fadein {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ===== 骨架屏 ===== */
.skeleton-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px 48px;
}
.skeleton {
  border-radius: 12px;
  background: #ede9fe;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}
.skeleton--topbar { width: 100%; height: 64px; border-radius: 0; }
.skeleton--title { width: 50%; height: 32px; }
.skeleton--subtitle { width: 65%; height: 16px; margin-top: 8px; }
.skeleton--section-title { width: 30%; height: 22px; margin-bottom: 12px; }
.skeleton--card-wide { width: 100%; height: 160px; }
.skeleton--list-item { width: 100%; height: 72px; }
.skeleton--action-card { height: 88px; }
@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ================================================================
   顶部导航栏
   ================================================================ */
.dashboard-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 48px;
  background: #FFFFFF;
  border-bottom: 1px solid #F1F5F9;
  position: sticky;
  top: 0;
  z-index: 50;
}

/* 搜索框 */
.dashboard-topbar__search {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 420px;
  height: 40px;
  padding: 0 12px;
  border-radius: 12px;
  background: #F5F6FA;
  cursor: pointer;
  transition: background 200ms ease;
}
.dashboard-topbar__search:hover {
  background: #eef0f5;
}
.dashboard-topbar__search-icon {
  font-size: 16px;
  color: #94A3B8;
  flex-shrink: 0;
}
.dashboard-topbar__search-placeholder {
  font-size: 14px;
  font-weight: 400;
  color: #94A3B8;
  flex: 1;
}
.dashboard-topbar__search-kbd {
  font-size: 12px;
  font-weight: 500;
  color: #64748B;
  padding: 2px 6px;
  border-radius: 6px;
  background: #E2E8F0;
  flex-shrink: 0;
  line-height: 1.4;
}

/* 右侧操作区 */
.dashboard-topbar__actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* New Article 按钮 */
.dashboard-topbar__new-btn {
  --md-filled-button-container-color: #6366F1;
  --md-filled-button-label-text-color: #FFFFFF;
  --md-filled-button-container-height: 40px;
  --md-filled-button-container-shape: 12px;
  --md-filled-button-label-text-size: 14px;
  --md-filled-button-label-text-weight: 500;
  --md-filled-button-leading-space: 20px;
  --md-filled-button-trailing-space: 20px;
}
.dashboard-topbar__new-icon {
  font-size: 16px;
}

/* 通用图标按钮 */
.dashboard-topbar__icon-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background 200ms ease;
}
.dashboard-topbar__icon-btn:hover {
  background: #F5F6FA;
}
.dashboard-topbar__icon-btn .material-symbols-rounded {
  font-size: 20px;
  color: #475569;
}

/* 通知红点 */
.dashboard-topbar__badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #6366F1;
  border: 1.5px solid #FFFFFF;
}

/* 头像 */
.dashboard-topbar__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #F1F0FF;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 200ms ease;
}
.dashboard-topbar__avatar:hover { background: #e5e3ff; }
.dashboard-topbar__avatar .material-symbols-rounded {
  font-size: 20px;
  color: #6366F1;
}

/* ===== 内容区统一 padding ===== */
.dashboard-body {
  padding: 32px 48px 48px;
}

/* ===== 问候模块 ===== */
.dashboard-greeting {
  margin-bottom: 0;
}
.dashboard-greeting__title {
  font-size: 32px;
  font-weight: 600;
  color: #1E293B;
  margin: 0 0 8px;
  line-height: 1.3;
}
.dashboard-greeting__subtitle {
  font-size: 16px;
  font-weight: 400;
  color: #64748B;
  margin: 0;
  line-height: 24px;
}

/* ===== 通用 section ===== */
.dashboard-section {
  margin-top: 32px;
}
.dashboard-section--last {
  margin-bottom: 0;
}
.dashboard-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.dashboard-section__title {
  font-size: 18px;
  font-weight: 600;
  color: #1E293B;
  margin: 0;
}
.dashboard-section__link {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #6366F1;
  padding: 4px 0;
  font-family: inherit;
  transition: opacity 200ms ease;
}
.dashboard-section__link:hover { opacity: 0.8; }
.dashboard-section__link .material-symbols-rounded {
  font-size: 16px;
}

/* ================================================================
   Continue writing 卡片
   ================================================================ */
.continue-card {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px;
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  position: relative;
  flex-wrap: wrap;
}
.continue-card__thumb {
  width: 320px;
  height: 180px;
  border-radius: 12px;
  background: linear-gradient(135deg, #F1F0FF 0%, #ede9fe 50%, #e5e0ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.continue-card__thumb-icon {
  font-size: 64px;
  color: #6366F1;
  opacity: 0.5;
}
.continue-card__body {
  flex: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 0;
}
.continue-card__title {
  font-size: 20px;
  font-weight: 600;
  color: #1E293B;
  line-height: 28px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 8px;
}
.continue-card__desc {
  font-size: 14px;
  font-weight: 400;
  color: #64748B;
  line-height: 20px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 16px;
}
.continue-card__meta {
  font-size: 13px;
  font-weight: 400;
  color: #94A3B8;
}

/* 三点菜单 */
.continue-card__menu {
  position: absolute;
  top: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background 200ms ease;
}
.continue-card__menu:hover { background: #F5F6FA; }
.continue-card__menu .material-symbols-rounded {
  font-size: 16px;
  color: #94A3B8;
}

/* Continue writing 按钮 */
.continue-card__action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 12px;
  border: none;
  background: #F1F0FF;
  color: #6366F1;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: background 200ms ease;
  flex-shrink: 0;
}
.continue-card__action:hover {
  background: #e5e3ff;
}
.continue-card__action .material-symbols-rounded {
  font-size: 16px;
}

/* ================================================================
   Recent articles 列表 — 列对齐
   ================================================================ */
.recent-list {
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  overflow: hidden;
}
.recent-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: #FFFFFF;
  cursor: pointer;
  transition: background 200ms ease;
  border-bottom: 1px solid #F1F5F9;
}
.recent-item:last-child,
.recent-item--last {
  border-bottom: none;
}
.recent-item:hover {
  background: #FAFAFF;
}

/* 封面图占位 — 64x48 比例，圆角8px */
.recent-item__thumb {
  width: 64px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}
.recent-item__thumb .material-symbols-rounded {
  font-size: 24px;
  color: white;
}
.recent-item__thumb--purple {
  background: linear-gradient(135deg, #6366F1, #818cf8);
}
.recent-item__thumb--orange {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
}

/* 文字区域 — flex:1 占据剩余空间 */
.recent-item__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.recent-item__title {
  font-size: 15px;
  font-weight: 600;
  color: #1E293B;
  line-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.recent-item__desc {
  font-size: 13px;
  font-weight: 400;
  color: #64748B;
  line-height: 18px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 状态标签 — 固定宽度 96px 实现列对齐 */
.recent-item__status {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 0;
  border-radius: 8px;
  flex-shrink: 0;
  white-space: nowrap;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  text-align: center;
}
.recent-item__status--published {
  background: #ECFDF5;
  color: #059669;
}
.recent-item__status--draft {
  background: #FFF7ED;
  color: #D97706;
}

/* 日期 — 固定宽度 120px 实现列对齐 */
.recent-item__date {
  font-size: 13px;
  color: #64748B;
  flex-shrink: 0;
  white-space: nowrap;
  width: 120px;
}

/* 分类标签组 — 固定宽度 180px 实现列对齐 */
.recent-item__tags {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  width: 180px;
}
.recent-item__tag {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 8px;
  white-space: nowrap;
  height: 24px;
  display: inline-flex;
  align-items: center;
}
.recent-item__tag--primary {
  background: #F1F0FF;
  color: #6366F1;
}
.recent-item__tag--blue {
  background: #EFF6FF;
  color: #3B82F6;
}
.recent-item__tag--green {
  background: #ECFDF5;
  color: #10B981;
}
.recent-item__tag--orange {
  background: #FFF7ED;
  color: #F59E0B;
}

/* 三点菜单 */
.recent-item__menu {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 200ms ease;
}
.recent-item__menu:hover { background: #F5F6FA; }
.recent-item__menu .material-symbols-rounded {
  font-size: 16px;
  color: #94A3B8;
}

/* ===== 空状态 ===== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 48px 32px;
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  color: #94A3B8;
}
.empty-state__icon {
  font-size: 40px;
}
.empty-state__text {
  font-size: 14px;
  margin: 0;
  color: #64748B;
}

/* ================================================================
   Quick actions 网格
   ================================================================ */
.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
.quick-action-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 16px;
  background: #FFFFFF;
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: box-shadow 200ms ease, transform 200ms ease;
}
.quick-action-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  transform: translateY(-1px);
}

/* 图标容器：浅色背景 + 彩色图标 */
.quick-action-card__icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.quick-action-card__icon .material-symbols-rounded {
  font-size: 20px;
}
.quick-action-card__icon--primary {
  background: #F1F0FF;
}
.quick-action-card__icon--primary .material-symbols-rounded { color: #6366F1; }
.quick-action-card__icon--green {
  background: #ECFDF5;
}
.quick-action-card__icon--green .material-symbols-rounded { color: #10B981; }
.quick-action-card__icon--orange {
  background: #FFF7ED;
}
.quick-action-card__icon--orange .material-symbols-rounded { color: #F59E0B; }
.quick-action-card__icon--blue {
  background: #EFF6FF;
}
.quick-action-card__icon--blue .material-symbols-rounded { color: #3B82F6; }

.quick-action-card__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.quick-action-card__title {
  font-size: 15px;
  font-weight: 600;
  color: #1E293B;
  line-height: 20px;
}
.quick-action-card__desc {
  font-size: 13px;
  font-weight: 400;
  color: #64748B;
  line-height: 18px;
}

/* ================================================================
   响应式
   ================================================================ */
@media (max-width: 1294px) {
  .quick-actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .dashboard-topbar__search {
    width: 280px;
  }
  .dashboard-body {
    padding: 32px 32px 48px;
  }
  .dashboard-topbar {
    padding: 0 32px;
  }
  /* 日期列缩窄 */
  .recent-item__date { width: 100px; }
  /* tags列缩窄 */
  .recent-item__tags { width: 140px; }
}

@media (max-width: 840px) {
  .dashboard-topbar__search { display: none; }
  .dashboard-topbar__search-kbd { display: none; }
  .dashboard-body {
    padding: 24px 24px 48px;
  }
  .dashboard-topbar {
    padding: 0 24px;
  }
  .continue-card__thumb { width: 160px; height: 100px; }
  .continue-card__thumb-icon { font-size: 40px; }
  .recent-item__date { display: none; }
  .recent-item__tags { width: auto; }
}

@media (max-width: 600px) {
  .quick-actions-grid {
    grid-template-columns: 1fr;
  }
  .dashboard-greeting__title { font-size: 24px; }
  .dashboard-body {
    padding: 20px 16px 48px;
  }
  .dashboard-topbar {
    padding: 0 16px;
  }
  .recent-item { flex-wrap: wrap; gap: 8px; }
  .recent-item__desc { display: none; }
  .recent-item__tags { flex-wrap: wrap; width: auto; }
  .recent-item__status { width: auto; padding: 4px 12px; }
  .recent-item__date { display: none; }
  .continue-card {
    flex-direction: column;
    align-items: flex-start;
  }
  .continue-card__thumb { width: 100%; height: 140px; }
  .continue-card__menu { top: 12px; right: 12px; }
}

/* ================================================================
   暗色主题
   ================================================================ */
:global([data-theme="dark"]) .admin-dashboard { background: #0f0e17; }
:global([data-theme="dark"]) .dashboard-topbar { background: #1a1a2e; border-bottom-color: #2a2a3e; }
:global([data-theme="dark"]) .dashboard-topbar__search { background: #2a2a3e; }
:global([data-theme="dark"]) .dashboard-topbar__search:hover { background: #33334a; }
:global([data-theme="dark"]) .dashboard-topbar__search-placeholder { color: #64748B; }
:global([data-theme="dark"]) .dashboard-topbar__search-kbd { background: #3a3a4e; color: #94A3B8; }
:global([data-theme="dark"]) .dashboard-topbar__icon-btn .material-symbols-rounded { color: #94A3B8; }
:global([data-theme="dark"]) .dashboard-topbar__icon-btn:hover { background: #2a2a3e; }
:global([data-theme="dark"]) .dashboard-topbar__badge { border-color: #1a1a2e; }
:global([data-theme="dark"]) .dashboard-topbar__avatar { background: #3a3a4e; }
:global([data-theme="dark"]) .dashboard-topbar__avatar:hover { background: #4a4a5e; }
:global([data-theme="dark"]) .dashboard-topbar__avatar .material-symbols-rounded { color: #a5b4fc; }

:global([data-theme="dark"]) .dashboard-greeting__title { color: #e2e8f0; }
:global([data-theme="dark"]) .dashboard-greeting__subtitle { color: #94A3B8; }
:global([data-theme="dark"]) .dashboard-section__title { color: #e2e8f0; }
:global([data-theme="dark"]) .dashboard-section__link { color: #a5b4fc; }

:global([data-theme="dark"]) .continue-card { background: #1a1a2e; box-shadow: none; }
:global([data-theme="dark"]) .continue-card__thumb { background: linear-gradient(135deg, #2a2a3e, #3a3a4e, #4a3a5e); }
:global([data-theme="dark"]) .continue-card__thumb-icon { color: #a5b4fc; }
:global([data-theme="dark"]) .continue-card__title { color: #e2e8f0; }
:global([data-theme="dark"]) .continue-card__desc { color: #94A3B8; }
:global([data-theme="dark"]) .continue-card__meta { color: #64748B; }
:global([data-theme="dark"]) .continue-card__menu:hover { background: #2a2a3e; }
:global([data-theme="dark"]) .continue-card__action { background: #2a2a4e; color: #a5b4fc; }
:global([data-theme="dark"]) .continue-card__action:hover { background: #3a3a5e; }

:global([data-theme="dark"]) .recent-list { background: #1a1a2e; box-shadow: none; }
:global([data-theme="dark"]) .recent-item { background: #1a1a2e; border-bottom-color: #2a2a3e; }
:global([data-theme="dark"]) .recent-item:hover { background: #22223a; }
:global([data-theme="dark"]) .recent-item__thumb--purple { background: linear-gradient(135deg, #4f46e5, #6366f1); }
:global([data-theme="dark"]) .recent-item__thumb--orange { background: linear-gradient(135deg, #b45309, #d97706); }
:global([data-theme="dark"]) .recent-item__title { color: #e2e8f0; }
:global([data-theme="dark"]) .recent-item__desc { color: #94A3B8; }
:global([data-theme="dark"]) .recent-item__status--published { background: #06381f; color: #34d399; }
:global([data-theme="dark"]) .recent-item__status--draft { background: #3a2200; color: #fbbf24; }
:global([data-theme="dark"]) .recent-item__date { color: #94A3B8; }
:global([data-theme="dark"]) .recent-item__tag--primary { background: #2a2a4e; color: #a5b4fc; }
:global([data-theme="dark"]) .recent-item__tag--blue { background: #1e3a5f; color: #60a5fa; }
:global([data-theme="dark"]) .recent-item__tag--green { background: #06381f; color: #34d399; }
:global([data-theme="dark"]) .recent-item__tag--orange { background: #3a2200; color: #fbbf24; }
:global([data-theme="dark"]) .recent-item__menu:hover { background: #2a2a3e; }
:global([data-theme="dark"]) .recent-item__menu .material-symbols-rounded { color: #64748B; }

:global([data-theme="dark"]) .quick-action-card { background: #1a1a2e; box-shadow: none; }
:global([data-theme="dark"]) .quick-action-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
:global([data-theme="dark"]) .quick-action-card__icon--primary { background: #2a2a4e; }
:global([data-theme="dark"]) .quick-action-card__icon--primary .material-symbols-rounded { color: #a5b4fc; }
:global([data-theme="dark"]) .quick-action-card__icon--green { background: #06381f; }
:global([data-theme="dark"]) .quick-action-card__icon--green .material-symbols-rounded { color: #34d399; }
:global([data-theme="dark"]) .quick-action-card__icon--orange { background: #3a2200; }
:global([data-theme="dark"]) .quick-action-card__icon--orange .material-symbols-rounded { color: #fbbf24; }
:global([data-theme="dark"]) .quick-action-card__icon--blue { background: #1e3a5f; }
:global([data-theme="dark"]) .quick-action-card__icon--blue .material-symbols-rounded { color: #60a5fa; }
:global([data-theme="dark"]) .quick-action-card__title { color: #e2e8f0; }
:global([data-theme="dark"]) .quick-action-card__desc { color: #94A3B8; }

:global([data-theme="dark"]) .empty-state { background: #1a1a2e; box-shadow: none; }
:global([data-theme="dark"]) .empty-state__icon { color: #64748B; }
:global([data-theme="dark"]) .empty-state__text { color: #94A3B8; }

:global([data-theme="dark"]) .skeleton { background: #2a2a3e; }
:global([data-theme="dark"]) .loading-progress {
  --md-linear-progress-active-indicator-color: #818cf8;
  --md-linear-progress-track-color: #2a2a3e;
}
</style>
