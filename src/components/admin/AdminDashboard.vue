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
/* ===== 根容器 — M3 surface ===== */
.admin-dashboard {
  background: var(--md-sys-color-surface, #F9FAFB);
}

/* ===== 进度条 ===== */
.loading-progress {
  position: fixed;
  top: 0;
  left: 80px;
  z-index: 100;
  width: calc(100% - 80px);
  --md-linear-progress-active-indicator-color: var(--md-sys-color-primary, #5E54F0);
  --md-linear-progress-track-color: var(--md-sys-color-primary-container, #eaddff);
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
  background: var(--md-sys-color-primary-container, #eaddff);
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
  background: var(--md-sys-color-surface-container-lowest, #FFFFFF);
  border-bottom: 1px solid var(--md-sys-color-outline-variant, #E5E7EB);
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
  border-radius: 8px;
  background: var(--md-sys-color-surface-container-high, #F3F4F6);
  cursor: pointer;
  transition: background 200ms ease;
}
.dashboard-topbar__search:hover {
  background: var(--md-sys-color-surface-container-highest, #E5E7EB);
}
.dashboard-topbar__search-icon {
  font-size: 16px;
  color: var(--md-sys-color-on-surface-variant, #64748B);
  flex-shrink: 0;
}
.dashboard-topbar__search-placeholder {
  font-size: 14px;
  font-weight: 400;
  color: var(--md-sys-color-on-surface-variant, #9CA3AF);
  flex: 1;
}
.dashboard-topbar__search-kbd {
  font-size: 12px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface-variant, #64748B);
  padding: 2px 6px;
  border-radius: 6px;
  background: var(--md-sys-color-surface-container-highest, #E2E8F0);
  flex-shrink: 0;
  line-height: 1.4;
}

/* 右侧操作区 */
.dashboard-topbar__actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* New Article 按钮 — 10px圆角 对标mockup */
.dashboard-topbar__new-btn {
  --md-filled-button-container-color: var(--md-sys-color-primary, #5E54F0);
  --md-filled-button-label-text-color: var(--md-sys-color-on-primary, #FFFFFF);
  --md-filled-button-container-height: 40px;
  --md-filled-button-container-shape: 10px;
  --md-filled-button-label-text-size: 14px;
  --md-filled-button-label-text-weight: 600;
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
  border-radius: 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background 200ms ease;
}
.dashboard-topbar__icon-btn:hover {
  background: var(--md-sys-color-surface-container-high, #F3F4F6);
}
.dashboard-topbar__icon-btn .material-symbols-rounded {
  font-size: 20px;
  color: var(--md-sys-color-on-surface-variant, #64748B);
}

/* 通知红点 — 主色 */
.dashboard-topbar__badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--md-sys-color-primary, #5E54F0);
  border: 1.5px solid var(--md-sys-color-surface-container-lowest, #FFFFFF);
}

/* 头像 — primary-container */
.dashboard-topbar__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--md-sys-color-primary-container, #eaddff);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 200ms ease;
}
.dashboard-topbar__avatar:hover { background: var(--md-sys-color-secondary-container, #e8def8); }
.dashboard-topbar__avatar .material-symbols-rounded {
  font-size: 20px;
  color: var(--md-sys-color-on-primary-container, #21005d);
}

/* ===== 内容区统一 padding ===== */
.dashboard-body {
  padding: 40px 48px 8px;
}

/* ===== 问候模块 ===== */
.dashboard-greeting {
  margin-bottom: 0;
}
.dashboard-greeting__title {
  font-size: 32px;
  font-weight: 600;
  color: var(--md-sys-color-on-surface, #101828);
  margin: 0 0 8px;
  line-height: 1.3;
}
.dashboard-greeting__subtitle {
  font-size: 16px;
  font-weight: 400;
  color: var(--md-sys-color-on-surface-variant, #64748B);
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
  margin-bottom: 16px;
}
.dashboard-section__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--md-sys-color-on-surface, #101828);
  margin: 0 0 16px;
}
/* 标题在 header 内时，margin 由 header 控制 */
.dashboard-section__header .dashboard-section__title {
  margin-bottom: 0;
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
  color: var(--md-sys-color-primary, #5E54F0);
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
  background: var(--md-sys-color-surface-container-lowest, #FFFFFF);
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  position: relative;
  flex-wrap: wrap;
}
.continue-card__thumb {
  width: 180px;
  height: 120px;
  border-radius: 8px;
  background: linear-gradient(135deg,
    var(--md-sys-color-primary-container, #eaddff) 0%,
    var(--md-sys-color-secondary-container, #e8def8) 50%,
    var(--md-sys-color-tertiary-container, #ffd8e4) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.continue-card__thumb-icon {
  font-size: 40px;
  color: var(--md-sys-color-primary, #5E54F0);
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
  color: var(--md-sys-color-on-surface, #101828);
  line-height: 28px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 8px;
}
.continue-card__desc {
  font-size: 14px;
  font-weight: 400;
  color: var(--md-sys-color-on-surface-variant, #64748B);
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
  color: var(--md-sys-color-outline, #64748B);
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
  border-radius: 50%;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background 200ms ease;
}
.continue-card__menu:hover { background: var(--md-sys-color-surface-container-high, #F3F4F6); }
.continue-card__menu .material-symbols-rounded {
  font-size: 16px;
  color: var(--md-sys-color-on-surface-variant, #64748B);
}

/* Continue writing 按钮 — 药丸形 对标mockup */
.continue-card__action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  border-radius: 9999px;
  border: none;
  background: var(--md-sys-color-primary-container, #eaddff);
  color: var(--md-sys-color-on-primary-container, #5E54F0);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: background 200ms ease;
  flex-shrink: 0;
}
.continue-card__action:hover {
  background: var(--md-sys-color-secondary-container, #e8def8);
}
.continue-card__action .material-symbols-rounded {
  font-size: 16px;
}

/* ================================================================
   Recent articles 列表 — 列对齐
   ================================================================ */
.recent-list {
  background: var(--md-sys-color-surface-container-lowest, #FFFFFF);
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  overflow: hidden;
}
.recent-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: var(--md-sys-color-surface-container-lowest, #FFFFFF);
  cursor: pointer;
  transition: background 200ms ease;
  border-bottom: 1px solid var(--md-sys-color-outline-variant, #E5E7EB);
}
.recent-item:last-child,
.recent-item--last {
  border-bottom: none;
}
.recent-item:hover {
  background: var(--md-sys-color-surface-container, #F3EDF7);
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
  color: var(--md-sys-color-on-primary, #FFFFFF);
}
.recent-item__thumb--purple {
  background: linear-gradient(135deg,
    var(--md-sys-color-primary, #5E54F0),
    var(--md-sys-color-secondary, #8b7ec8));
}
.recent-item__thumb--orange {
  background: linear-gradient(135deg, #EC6C34, #f59e0b);
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
  color: var(--md-sys-color-on-surface, #101828);
  line-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.recent-item__desc {
  font-size: 13px;
  font-weight: 400;
  color: var(--md-sys-color-on-surface-variant, #64748B);
  line-height: 18px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 状态标签 — 药丸形 对标mockup */
.recent-item__status {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 9999px;
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
  background: #E6F6EE;
  color: #0E9F6E;
}
.recent-item__status--draft {
  background: #FEF3E7;
  color: #D97706;
}

/* 日期 — 固定宽度 120px 实现列对齐 */
.recent-item__date {
  font-size: 13px;
  color: var(--md-sys-color-on-surface-variant, #64748B);
  flex-shrink: 0;
  white-space: nowrap;
  width: 120px;
}

/* 分类标签组 — 固定宽度 180px 实现列对齐, 药丸形 */
.recent-item__tags {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  width: 180px;
}
.recent-item__tag {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 9999px;
  white-space: nowrap;
  height: 24px;
  display: inline-flex;
  align-items: center;
}
.recent-item__tag--primary {
  background: #F5F3FF;
  color: #5E54F0;
}
.recent-item__tag--blue {
  background: #EFF8FF;
  color: #2970CC;
}
.recent-item__tag--green {
  background: #ECFDF3;
  color: #039855;
}
.recent-item__tag--orange {
  background: #FFF6ED;
  color: #EC6C34;
}

/* 三点菜单 */
.recent-item__menu {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 200ms ease;
}
.recent-item__menu:hover { background: var(--md-sys-color-surface-container-high, #F3F4F6); }
.recent-item__menu .material-symbols-rounded {
  font-size: 16px;
  color: var(--md-sys-color-on-surface-variant, #64748B);
}

/* ===== 空状态 ===== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 48px 32px;
  background: var(--md-sys-color-surface-container-lowest, #FFFFFF);
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  color: var(--md-sys-color-on-surface-variant, #64748B);
}
.empty-state__icon {
  font-size: 40px;
}
.empty-state__text {
  font-size: 14px;
  margin: 0;
  color: var(--md-sys-color-on-surface-variant, #64748B);
}

/* ================================================================
   Quick actions 网格 — 对标mockup: 12px圆角, 40x40图标容器10px圆角
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
  padding: 18px 20px;
  border-radius: 12px;
  background: var(--md-sys-color-surface-container-lowest, #FFFFFF);
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  transition: box-shadow 200ms ease, transform 200ms ease;
}
.quick-action-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  transform: translateY(-1px);
}

/* 图标容器：40x40, 10px圆角, 浅色背景+彩色图标 对标mockup */
.quick-action-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.quick-action-card__icon .material-symbols-rounded {
  font-size: 20px;
}
.quick-action-card__icon--primary {
  background: #F5F3FF;
}
.quick-action-card__icon--primary .material-symbols-rounded { color: #5E54F0; }
.quick-action-card__icon--green {
  background: #ECFDF3;
}
.quick-action-card__icon--green .material-symbols-rounded { color: #039855; }
.quick-action-card__icon--orange {
  background: #FFF6ED;
}
.quick-action-card__icon--orange .material-symbols-rounded { color: #EC6C34; }
.quick-action-card__icon--blue {
  background: #EFF8FF;
}
.quick-action-card__icon--blue .material-symbols-rounded { color: #2970CC; }

.quick-action-card__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.quick-action-card__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--md-sys-color-on-surface, #101828);
  line-height: 20px;
}
.quick-action-card__desc {
  font-size: 13px;
  font-weight: 400;
  color: var(--md-sys-color-on-surface-variant, #64748B);
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
    padding: 32px 32px 8px;
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
    padding: 24px 24px 8px;
  }
  .dashboard-topbar {
    padding: 0 24px;
  }
  .continue-card__thumb { width: 140px; height: 94px; }
  .continue-card__thumb-icon { font-size: 28px; }
  .recent-item__date { display: none; }
  .recent-item__tags { width: auto; }
}

@media (max-width: 600px) {
  .quick-actions-grid {
    grid-template-columns: 1fr;
  }
  .dashboard-greeting__title { font-size: 24px; }
  .dashboard-body {
    padding: 20px 16px 8px;
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

</style>

<style>
/* ================================================================
   暗色主题 — 非 scoped 块，M3 CSS 变量自动切换，此处补充
   非变量层面的暗色专用覆盖（药丸/圆角/阴影等不受变量控制的部分）
   ================================================================ */

/* ---- topbar ---- */
[data-theme="dark"] .dashboard-topbar__search { background: var(--md-sys-color-surface-container-high, #2a2a3e); }
[data-theme="dark"] .dashboard-topbar__search:hover { background: var(--md-sys-color-surface-container-highest, #36343b); }
[data-theme="dark"] .dashboard-topbar__icon-btn:hover { background: var(--md-sys-color-surface-container-high, #2a2a3e); }
[data-theme="dark"] .dashboard-topbar__badge { border-color: var(--md-sys-color-surface-container-lowest, #0f0d13); }

/* ---- cards hover/阴影 ---- */
[data-theme="dark"] .continue-card { box-shadow: none; }
[data-theme="dark"] .continue-card__menu:hover { background: var(--md-sys-color-surface-container-high, #2b2930); }
[data-theme="dark"] .recent-list { box-shadow: none; }
[data-theme="dark"] .recent-item { border-bottom-color: var(--md-sys-color-outline-variant, #49454f); }
[data-theme="dark"] .recent-item__menu:hover { background: var(--md-sys-color-surface-container-high, #2b2930); }
[data-theme="dark"] .quick-action-card { box-shadow: none; }
[data-theme="dark"] .quick-action-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
[data-theme="dark"] .empty-state { box-shadow: none; }

/* ---- 暗色专用渐变/位图颜色（无法通过变量自动切换的部分）---- */
[data-theme="dark"] .continue-card__thumb {
  background: linear-gradient(135deg,
    var(--md-sys-color-primary-container, #4f378b),
    var(--md-sys-color-secondary-container, #4a4458),
    var(--md-sys-color-tertiary-container, #633b48));
}
[data-theme="dark"] .recent-item__thumb--purple {
  background: linear-gradient(135deg,
    var(--md-sys-color-primary, #d0bcff),
    var(--md-sys-color-secondary, #ccc2dc));
}
[data-theme="dark"] .recent-item__thumb--orange {
  background: linear-gradient(135deg, #b45309, #d97706);
}

/* ---- 状态标签暗色 ---- */
[data-theme="dark"] .recent-item__status--published { background: #06381f; color: #34d399; }
[data-theme="dark"] .recent-item__status--draft { background: #3a2200; color: #fbbf24; }

/* ---- 分类标签暗色 ---- */
[data-theme="dark"] .recent-item__tag--primary { background: var(--md-sys-color-primary-container, #4f378b); color: var(--md-sys-color-on-primary-container, #eaddff); }
[data-theme="dark"] .recent-item__tag--blue { background: #1e3a5f; color: #60a5fa; }
[data-theme="dark"] .recent-item__tag--green { background: #06381f; color: #34d399; }
[data-theme="dark"] .recent-item__tag--orange { background: #3a2200; color: #fbbf24; }

/* ---- Quick actions 图标暗色 ---- */
[data-theme="dark"] .quick-action-card__icon--primary { background: var(--md-sys-color-primary-container, #4f378b); }
[data-theme="dark"] .quick-action-card__icon--primary .material-symbols-rounded { color: var(--md-sys-color-on-primary-container, #eaddff); }
[data-theme="dark"] .quick-action-card__icon--green { background: #06381f; }
[data-theme="dark"] .quick-action-card__icon--green .material-symbols-rounded { color: #34d399; }
[data-theme="dark"] .quick-action-card__icon--orange { background: #3a2200; }
[data-theme="dark"] .quick-action-card__icon--orange .material-symbols-rounded { color: #fbbf24; }
[data-theme="dark"] .quick-action-card__icon--blue { background: #1e3a5f; }
[data-theme="dark"] .quick-action-card__icon--blue .material-symbols-rounded { color: #60a5fa; }

/* ---- 骨架屏/进度条 ---- */
[data-theme="dark"] .skeleton { background: var(--md-sys-color-surface-container-high, #2b2930); }
[data-theme="dark"] .loading-progress {
  --md-linear-progress-active-indicator-color: var(--md-sys-color-primary, #d0bcff);
  --md-linear-progress-track-color: var(--md-sys-color-surface-container-high, #2b2930);
}
</style>
