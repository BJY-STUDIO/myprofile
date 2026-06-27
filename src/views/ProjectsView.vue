<template>
  <div class="projects-view">
    <!-- 页面标题 -->
    <div class="projects-header">
      <h1 class="projects-header__title">项目</h1>
      <p class="projects-header__desc">个人项目与开源贡献</p>
    </div>

    <!-- 分类筛选 -->
    <div class="filter-bar">
      <md-chip-set>
        <md-filter-chip
          v-for="cat in categories"
          :key="cat.id"
          :selected="activeCategory === cat.id"
          @click="activeCategory = cat.id"
          :label="cat.label"
        ></md-filter-chip>
      </md-chip-set>
    </div>

    <!-- 项目卡片网格 -->
    <div class="project-grid">
      <div
        v-for="project in filteredProjects"
        :key="project.id"
        class="project-card"
        @click="openProject(project)"
      >
        <div class="project-card__header">
          <span class="material-symbols-rounded project-card__icon">{{ project.icon }}</span>
          <a
            v-if="project.github"
            :href="project.github"
            target="_blank"
            rel="noopener noreferrer"
            class="project-card__link"
            @click.stop
            title="查看源码"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" width="18" height="18">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
          </a>
        </div>
        <h3 class="project-card__title">{{ project.title }}</h3>
        <p class="project-card__desc">{{ project.excerpt }}</p>
        <div class="project-card__tags">
          <span v-for="tag in project.tags" :key="tag" class="project-card__tag">{{ tag }}</span>
        </div>
        <div class="project-card__meta">
          <span v-if="project.stars" class="project-card__stat">
            <span class="material-symbols-rounded">star</span> {{ project.stars }}
          </span>
          <span class="project-card__status" :class="'project-card__status--' + project.status">
            {{ statusLabel(project.status) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 项目详情弹窗 -->
    <Teleport to="body">
      <div v-if="selectedProject" class="project-overlay" @click.self="selectedProject = null">
        <div class="project-detail">
          <md-icon-button class="project-detail__close" @click="selectedProject = null">
            <span class="material-symbols-rounded">close</span>
          </md-icon-button>
          <span class="material-symbols-rounded project-detail__icon">{{ selectedProject.icon }}</span>
          <h1 class="project-detail__title">{{ selectedProject.title }}</h1>
          <p class="project-detail__desc">{{ selectedProject.description }}</p>
          <div class="project-detail__tags">
            <span v-for="tag in selectedProject.tags" :key="tag" class="project-detail__tag">{{ tag }}</span>
          </div>
          <md-divider></md-divider>
          <div class="project-detail__section">
            <h2>功能特性</h2>
            <ul>
              <li v-for="feature in selectedProject.features" :key="feature">{{ feature }}</li>
            </ul>
          </div>
          <div class="project-detail__actions" v-if="selectedProject.github">
            <a :href="selectedProject.github" target="_blank" rel="noopener noreferrer" class="project-detail__btn">
              <svg viewBox="0 0 16 16" fill="currentColor" width="18" height="18">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
              </svg>
              查看源码
            </a>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ======== Footer ======== -->
    <MioFooter />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import '@material/web/chips/chip-set'
import '@material/web/chips/filter-chip'
import '@material/web/iconbutton/icon-button'
import '@material/web/divider/divider'
import MioFooter from '@/components/common/MioFooter.vue'

const route = useRoute()
const activeCategory = ref('all')

if (route.params.category) {
  activeCategory.value = route.params.category
}

const categories = [
  { id: 'all', label: '全部' },
  { id: 'web', label: 'Web 应用' },
  { id: 'tools', label: '工具' },
]

const projects = ref([
  {
    id: 1,
    title: "Kernel's Blog",
    icon: 'web',
    excerpt: '基于 Vue 3 + Material Web 的个人博客站点，严格遵循 M3 规范。',
    description: '一个现代个人博客站点，采用 Vue 3 Composition API + @material/web 组件库构建，严格遵循 Material Design 3 设计规范。支持多色彩主题切换、暗色模式、响应式布局。',
    tags: ['Vue 3', 'Material Web', 'Vite'],
    category: 'web',
    status: 'active',
    stars: 12,
    github: 'https://github.com/BJY-STUDIO/myprofile',
    features: [
      'Navigation Rail 严格复刻 m3.material.io 交互效果',
      'HCT 色彩空间动态主题引擎',
      '6 种色彩方案 + 浅色/深色/跟随系统',
      '移动端 Navigation Drawer 适配',
      '文章、项目、关于页面完整骨架',
    ],
  },
  {
    id: 2,
    title: '数据可视化工具集',
    icon: 'analytics',
    excerpt: '面向电信行业的数据抓取、清洗与可视化展示工具。',
    description: '针对电信行业营业厅数据的一站式处理工具，支持从多个数据源自动抓取、清洗整合、生成可视化报表。',
    tags: ['Python', 'ECharts', 'Pandas'],
    category: 'tools',
    status: 'active',
    stars: 8,
    features: [
      '多数据源自动抓取（API + 网页 + Excel）',
      '数据清洗与异常值检测',
      'ECharts 交互式可视化图表',
      '自动生成日报/周报模板',
      '本地缓存减少网络依赖',
    ],
  },
  {
    id: 3,
    title: '考核题库管理平台',
    icon: 'school',
    excerpt: '客户经理培训考核系统，支持题目录入、组卷与成绩统计。',
    description: '面向电信行业客户经理的培训考核平台，支持题目录入、自动组卷、在线答题、成绩统计与分析。注重降低考试心理压力，提升学习效果。',
    tags: ['Vue 3', 'Node.js', 'MongoDB'],
    category: 'web',
    status: 'development',
    features: [
      '题目分类管理与批量导入',
      '智能组卷算法（难度均衡）',
      '在线答题与实时评分',
      '成绩统计与可视化分析',
      '微信端适配',
    ],
  },
  {
    id: 4,
    title: 'Markdown 笔记工具',
    icon: 'edit_note',
    excerpt: '轻量级本地 Markdown 编辑器，支持实时预览与标签管理。',
    description: '一个基于 Electron 的轻量级 Markdown 笔记工具，所有数据本地存储，支持实时预览、标签管理和全文搜索。',
    tags: ['Electron', 'CodeMirror', 'SQLite'],
    category: 'tools',
    status: 'completed',
    stars: 5,
    features: [
      'CodeMirror 6 编辑器',
      '实时预览与编辑器同步滚动',
      '标签系统与全文搜索',
      '本地 SQLite 存储',
      '导出为 PDF / HTML',
    ],
  },
])

const filteredProjects = computed(() => {
  if (activeCategory.value === 'all') return projects.value
  return projects.value.filter(p => p.category === activeCategory.value)
})

const selectedProject = ref(null)

function openProject(project) {
  selectedProject.value = project
}

function statusLabel(status) {
  const map = { active: '维护中', development: '开发中', completed: '已完成' }
  return map[status] || status
}
</script>

<style scoped>
.projects-view {
  max-width: 960px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 32px;
  box-sizing: border-box;
}

/* ======== Header ======== */
.projects-header {
  padding: 16px 0 24px;
}

.projects-header__title {
  font-size: 32px;
  font-weight: 400;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  line-height: 40px;
}

.projects-header__desc {
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  margin-top: 4px;
}

/* ======== Filter Bar ======== */
.filter-bar {
  margin-bottom: 24px;
}

/* ======== Project Grid ======== */
.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.project-card {
  padding: 20px;
  border-radius: 12px;
  background-color: var(--md-sys-color-surface-container, #f3edf7);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.project-card:hover {
  box-shadow: var(--md-sys-elevation-2, 0 1px 3px 1px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.3));
}

.project-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 12px;
  background-color: var(--md-sys-color-on-surface, #1c1b1f);
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.project-card:hover::after {
  opacity: 0.08;
}

.project-card:active::after {
  opacity: 0.12;
}

.project-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.project-card__icon {
  font-size: 32px;
  color: var(--md-sys-color-primary, #6750a4);
  font-variation-settings: "FILL" 0, "wght" 400;
}

.project-card__link {
  color: var(--md-sys-color-on-surface-variant, #49454f);
  padding: 4px;
  border-radius: 12px;
  position: relative;
  z-index: 2;
  transition: background-color 0.2s;
}

.project-card__link:hover {
  background-color: color-mix(in srgb, var(--md-sys-color-on-surface-variant, #49454f) 8%, transparent);
}

.project-card__title {
  font-size: 18px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  line-height: 24px;
  margin-bottom: 8px;
  position: relative;
  z-index: 1;
}

.project-card__desc {
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  line-height: 20px;
  position: relative;
  z-index: 1;
}

.project-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
  position: relative;
  z-index: 1;
}

.project-card__tag {
  padding: 2px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
  background-color: var(--md-sys-color-secondary-container, #e8def8);
  color: var(--md-sys-color-on-secondary-container, #1d192b);
}

.project-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  position: relative;
  z-index: 1;
}

.project-card__stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
}

.project-card__stat .material-symbols-rounded {
  font-size: 16px;
  font-variation-settings: "FILL" 1, "wght" 400;
}

.project-card__status {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 10px;
  border-radius: 8px;
}

.project-card__status--active {
  background-color: var(--md-sys-color-tertiary-container, #ffd8e4);
  color: var(--md-sys-color-on-tertiary-container, #31111d);
}

.project-card__status--development {
  background-color: var(--md-sys-color-primary-container, #eaddff);
  color: var(--md-sys-color-on-primary-container, #21005d);
}

.project-card__status--completed {
  background-color: var(--md-sys-color-surface-container-highest, #e6e0e9);
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

/* ======== Project Detail Overlay ======== */
.project-overlay {
  position: fixed;
  inset: 0;
  z-index: 500;
  background-color: color-mix(in srgb, var(--md-sys-color-scrim, #000000) 40%, transparent);
  display: flex;
  justify-content: center;
  padding: 48px 24px;
  overflow-y: auto;
}

.project-detail {
  max-width: 680px;
  width: 100%;
  background-color: var(--md-sys-color-surface, #fffbfe);
  border-radius: 28px;
  padding: 32px;
  position: relative;
  max-height: calc(100vh - 96px);
  overflow-y: auto;
}

.project-detail__close {
  position: absolute;
  top: 16px;
  right: 16px;
}

.project-detail__icon {
  font-size: 48px;
  color: var(--md-sys-color-primary, #6750a4);
  font-variation-settings: "FILL" 0, "wght" 300;
  margin-bottom: 16px;
}

.project-detail__title {
  font-size: 28px;
  font-weight: 400;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  line-height: 36px;
  margin-bottom: 12px;
}

.project-detail__desc {
  font-size: 15px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  line-height: 24px;
  margin-bottom: 16px;
}

.project-detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.project-detail__tag {
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  background-color: var(--md-sys-color-secondary-container, #e8def8);
  color: var(--md-sys-color-on-secondary-container, #1d192b);
}

.project-detail__section {
  margin-top: 20px;
}

.project-detail__section h2 {
  font-size: 18px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin-bottom: 12px;
}

.project-detail__section ul {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.project-detail__section li {
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  line-height: 20px;
  padding: 8px 12px;
  border-radius: 8px;
  background-color: var(--md-sys-color-surface-container, #f3edf7);
  position: relative;
  padding-left: 28px;
}

.project-detail__section li::before {
  content: '';
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--md-sys-color-primary, #6750a4);
}

.project-detail__actions {
  margin-top: 24px;
}

.project-detail__btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border-radius: 20px;
  background-color: var(--md-sys-color-primary, #6750a4);
  color: var(--md-sys-color-on-primary, #ffffff);
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: box-shadow 0.2s;
}

.project-detail__btn:hover {
  box-shadow: var(--md-sys-elevation-2, 0 1px 3px 1px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.3));
}

/* ======== 暗色主题 ======== */
:global([data-theme="dark"]) .project-card {
  background-color: var(--md-sys-color-surface-container, #211f26);
}

:global([data-theme="dark"]) .project-card::after {
  background-color: var(--md-sys-color-on-surface, #e6e1e5);
}

:global([data-theme="dark"]) .project-card__tag {
  background-color: var(--md-sys-color-secondary-container, #4a4458);
  color: var(--md-sys-color-on-secondary-container, #e8def8);
}

:global([data-theme="dark"]) .project-card__status--active {
  background-color: var(--md-sys-color-tertiary-container, #633b48);
  color: var(--md-sys-color-on-tertiary-container, #ffd8e4);
}

:global([data-theme="dark"]) .project-card__status--development {
  background-color: var(--md-sys-color-primary-container, #4f378b);
  color: var(--md-sys-color-on-primary-container, #eaddff);
}

:global([data-theme="dark"]) .project-card__status--completed {
  background-color: var(--md-sys-color-surface-container-highest, #36343b);
  color: var(--md-sys-color-on-surface, #e6e1e5);
}

:global([data-theme="dark"]) .project-detail {
  background-color: var(--md-sys-color-surface, #1c1b1f);
}

:global([data-theme="dark"]) .project-detail__tag {
  background-color: var(--md-sys-color-secondary-container, #4a4458);
  color: var(--md-sys-color-on-secondary-container, #e8def8);
}

:global([data-theme="dark"]) .project-detail__section li {
  background-color: var(--md-sys-color-surface-container, #211f26);
}

:global([data-theme="dark"]) .project-detail__section li::before {
  background-color: var(--md-sys-color-primary, #d0bcff);
}

:global([data-theme="dark"]) .project-detail__btn {
  background-color: var(--md-sys-color-primary, #d0bcff);
  color: var(--md-sys-color-on-primary, #381e72);
}
</style>
