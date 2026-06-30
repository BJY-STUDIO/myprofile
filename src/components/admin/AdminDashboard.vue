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

      <!-- 1. 问候模块 -->
      <section class="dashboard-greeting">
        <h1 class="dashboard-greeting__title">{{ greetingText }}，Bao 👋</h1>
        <p class="dashboard-greeting__subtitle">Here's what's happening with your blog today.</p>
      </section>

      <!-- 2. Continue writing -->
      <section v-if="lastDraft" class="dashboard-section">
        <h2 class="dashboard-section__title">Continue writing</h2>
        <div class="continue-card">
          <div class="continue-card__thumb">
            <span class="material-symbols-rounded continue-card__thumb-icon">draft</span>
          </div>
          <div class="continue-card__body">
            <span class="continue-card__title">{{ lastDraft.title || '(无标题)' }}</span>
            <span class="continue-card__desc">{{ lastDraft.description || '暂无描述' }}</span>
            <span class="continue-card__meta">Last edited {{ formatRelativeTime(lastDraft.updatedAt) }}</span>
          </div>
          <button class="continue-card__action" @click="onContinueWriting(lastDraft)">
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
        <div class="recent-list">
          <div
            v-for="art in recentArticles"
            :key="art.documentId"
            class="recent-item"
            @click="onArticleClick(art)"
          >
            <div class="recent-item__thumb" :class="getArticleThumbClass(art)">
              <span class="material-symbols-rounded">{{ art.publishedAt ? 'article' : 'edit_note' }}</span>
            </div>
            <div class="recent-item__body">
              <span class="recent-item__title">{{ art.title || '(无标题)' }}</span>
              <span class="recent-item__desc">{{ art.description || '暂无描述' }}</span>
            </div>
            <span
              class="recent-item__status"
              :class="art.publishedAt ? 'recent-item__status--published' : 'recent-item__status--draft'"
            >
              {{ art.publishedAt ? 'Published' : 'Draft' }}
            </span>
            <span class="recent-item__date">{{ formatDate(art.publishedAt || art.createdAt) }}</span>
            <span class="recent-item__tag" v-if="art.tags && art.tags.length">{{ art.tags[0] }}</span>
          </div>
          <div v-if="!recentArticles.length" class="empty-state">
            <span class="material-symbols-rounded empty-state__icon">article</span>
            <p class="empty-state__text">暂无文章</p>
          </div>
        </div>
      </section>

      <!-- 4. Quick actions -->
      <section class="dashboard-section">
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
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { cmList } from '@/services/articleService'
import { useAdminLoader } from '@/composables/useAdminLoader'
import '@material/web/progress/linear-progress'

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

// ===== 最近草稿（用于 Continue writing） =====
const lastDraft = computed(() => {
  const drafts = articles.value
    .filter(a => !a.publishedAt)
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
  return drafts[0] || null
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
</script>

<style scoped>
/* ===== 根容器 ===== */
.admin-dashboard {
  min-height: 100%;
  padding: 24px;
  max-width: 960px;
}

/* ===== 进度条 ===== */
.loading-progress {
  position: fixed;
  top: 0;
  left: 80px;
  z-index: 100;
  width: calc(100% - 80px);
  --md-linear-progress-active-indicator-color: var(--md-sys-color-primary, #6750a4);
  --md-linear-progress-track-color: var(--md-sys-color-surface-container-highest, #e6e0e9);
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
  padding: 24px;
  max-width: 960px;
}
.skeleton {
  border-radius: 12px;
  background: var(--md-sys-color-surface-container-high, #ece6f0);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}
.skeleton--title { width: 50%; height: 36px; }
.skeleton--subtitle { width: 65%; height: 18px; margin-top: 8px; }
.skeleton--section-title { width: 30%; height: 22px; margin-bottom: 12px; }
.skeleton--card-wide { width: 100%; height: 120px; }
.skeleton--list-item { width: 100%; height: 64px; }
.skeleton--action-card { height: 88px; }
@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ===== 问候模块 ===== */
.dashboard-greeting {
  margin-bottom: 32px;
}
.dashboard-greeting__title {
  font-family: var(--md-sys-typescale-headline-l-font-family);
  font-size: var(--md-sys-typescale-headline-l-font-size, 28px);
  font-weight: var(--md-sys-typescale-headline-l-font-weight, 700);
  line-height: var(--md-sys-typescale-headline-l-line-height);
  letter-spacing: var(--md-sys-typescale-headline-l-letter-spacing);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0 0 8px;
}
.dashboard-greeting__subtitle {
  font-family: var(--md-sys-typescale-body-l-font-family);
  font-size: var(--md-sys-typescale-body-l-font-size, 16px);
  font-weight: var(--md-sys-typescale-body-l-font-weight, 400);
  line-height: var(--md-sys-typescale-body-l-line-height);
  color: var(--md-sys-color-on-surface-variant, #49454f);
  margin: 0;
}

/* ===== 通用 section ===== */
.dashboard-section {
  margin-bottom: 32px;
}
.dashboard-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.dashboard-section__title {
  font-family: var(--md-sys-typescale-title-m-font-family);
  font-size: var(--md-sys-typescale-title-m-font-size, 18px);
  font-weight: var(--md-sys-typescale-title-m-font-weight, 600);
  line-height: var(--md-sys-typescale-title-m-line-height);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0 0 12px;
}
.dashboard-section__link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--md-sys-color-primary, #6750a4);
  padding: 4px 0;
  font-family: inherit;
}
.dashboard-section__link .material-symbols-rounded {
  font-size: 18px;
}

/* ===== Continue writing 卡片 ===== */
.continue-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: var(--md-sys-color-surface-container-low, #f8f1f6);
  border-radius: 16px;
  position: relative;
  flex-wrap: wrap;
}
.continue-card__thumb {
  width: 72px;
  height: 72px;
  border-radius: 12px;
  background: var(--md-sys-color-primary-container, #eaddff);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.continue-card__thumb-icon {
  font-size: 32px;
  color: var(--md-sys-color-on-primary-container, #21005d);
}
.continue-card__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.continue-card__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.continue-card__desc {
  font-size: 13px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.continue-card__meta {
  font-size: 12px;
  color: var(--md-sys-color-outline, #79747e);
}
.continue-card__action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 20px;
  border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
  background: transparent;
  color: var(--md-sys-color-primary, #6750a4);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: background 200ms ease;
}
.continue-card__action:hover {
  background: var(--md-sys-color-primary-container, #eaddff);
}
.continue-card__action .material-symbols-rounded {
  font-size: 18px;
}

/* ===== Recent articles 列表 ===== */
.recent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.recent-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  border-radius: 14px;
  background: var(--md-sys-color-surface-container-low, #f8f1f6);
  cursor: pointer;
  transition: background 200ms ease;
}
.recent-item:hover {
  background: var(--md-sys-color-surface-container, #f3edf7);
}
.recent-item__thumb {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.recent-item__thumb .material-symbols-rounded {
  font-size: 22px;
  color: white;
}
.recent-item__thumb--purple {
  background: var(--md-sys-color-primary, #6750a4);
}
.recent-item__thumb--orange {
  background: var(--md-sys-color-tertiary, #7d5260);
}
.recent-item__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.recent-item__title {
  font-size: 14px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.recent-item__desc {
  font-size: 12px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.recent-item__status {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 8px;
  flex-shrink: 0;
}
.recent-item__status--published {
  background: #c4eed0;
  color: #0f5f1e;
}
.recent-item__status--draft {
  background: #ffddb1;
  color: #5e4000;
}
.recent-item__date {
  font-size: 12px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  flex-shrink: 0;
  white-space: nowrap;
}
.recent-item__tag {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 8px;
  background: var(--md-sys-color-primary-container, #eaddff);
  color: var(--md-sys-color-on-primary-container, #21005d);
  flex-shrink: 0;
}

/* ===== 空状态 ===== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
}
.empty-state__icon {
  font-size: 40px;
  opacity: 0.5;
}
.empty-state__text {
  font-size: 14px;
  margin: 0;
}

/* ===== Quick actions 网格 ===== */
.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.quick-action-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 20px 16px;
  border-radius: 16px;
  background: var(--md-sys-color-surface-container-low, #f8f1f6);
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: background 200ms ease, box-shadow 200ms ease;
}
.quick-action-card:hover {
  background: var(--md-sys-color-surface-container, #f3edf7);
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.quick-action-card__icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.quick-action-card__icon .material-symbols-rounded {
  font-size: 22px;
  color: white;
}
.quick-action-card__icon--primary { background: var(--md-sys-color-primary, #6750a4); }
.quick-action-card__icon--green { background: #4a9c6d; }
.quick-action-card__icon--orange { background: #c0703a; }
.quick-action-card__icon--blue { background: #4a7cc9; }
.quick-action-card__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.quick-action-card__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--md-sys-color-on-surface, #1c1b1f);
}
.quick-action-card__desc {
  font-size: 12px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
}

/* ===== 响应式 ===== */
@media (max-width: 1294px) {
  .quick-actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 600px) {
  .admin-dashboard { padding: 16px; }
  .quick-actions-grid {
    grid-template-columns: 1fr;
  }
  .dashboard-greeting__title {
    font-size: 24px;
  }
  .recent-item {
    flex-wrap: wrap;
    gap: 8px;
  }
  .recent-item__desc { display: none; }
  .continue-card {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* ===== 暗色主题 ===== */
:global([data-theme="dark"]) .recent-item__status--published {
  background: #06381f;
  color: #a8f0bf;
}
:global([data-theme="dark"]) .recent-item__status--draft {
  background: #3a2200;
  color: #ffb870;
}
:global([data-theme="dark"]) .quick-action-card__icon--green { background: #2d6e42; }
:global([data-theme="dark"]) .quick-action-card__icon--orange { background: #8a4e22; }
:global([data-theme="dark"]) .quick-action-card__icon--blue { background: #2e5a8a; }
:global([data-theme="dark"]) .continue-card__thumb {
  background: var(--md-sys-color-primary-container, #4f378b);
}
:global([data-theme="dark"]) .continue-card__thumb-icon {
  color: var(--md-sys-color-on-primary-container, #eaddff);
}
</style>
