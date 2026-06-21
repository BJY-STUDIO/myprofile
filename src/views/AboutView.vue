<template>
  <div class="about-view">
    <!-- 个人信息卡片 -->
    <section class="profile">
      <div class="profile__avatar">
        <span class="material-symbols-rounded">person</span>
      </div>
      <div class="profile__info">
        <h1 class="profile__name">Kernel</h1>
        <p class="profile__role">全栈开发者 / 技术博主</p>
        <p class="profile__bio">
          热爱前端技术与用户体验设计，专注于 Vue 生态和 Material Design。
          相信好的技术应该服务于人，而非增加复杂度。
        </p>
      </div>
    </section>

    <!-- 技能标签 -->
    <section class="section">
      <h2 class="section__title">技术栈</h2>
      <div class="skill-grid">
        <div
          v-for="skill in skills"
          :key="skill.name"
          class="skill-chip"
        >
          <span class="material-symbols-rounded skill-chip__icon">{{ skill.icon }}</span>
          <span class="skill-chip__label">{{ skill.name }}</span>
        </div>
      </div>
    </section>

    <!-- 经历时间线 -->
    <section class="section">
      <h2 class="section__title">经历</h2>
      <div class="timeline">
        <div
          v-for="(item, index) in experiences"
          :key="index"
          class="timeline__item"
        >
          <div class="timeline__dot"></div>
          <div class="timeline__content">
            <span class="timeline__period">{{ item.period }}</span>
            <h3 class="timeline__title">{{ item.title }}</h3>
            <p class="timeline__desc">{{ item.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 兴趣爱好 -->
    <section class="section">
      <h2 class="section__title">兴趣</h2>
      <div class="interest-row">
        <div
          v-for="interest in interests"
          :key="interest.name"
          class="interest-card"
        >
          <span class="material-symbols-rounded interest-card__icon">{{ interest.icon }}</span>
          <span class="interest-card__label">{{ interest.name }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const skills = ref([
  { name: 'Vue 3', icon: 'code' },
  { name: 'TypeScript', icon: 'data_object' },
  { name: 'Material Design', icon: 'palette' },
  { name: 'Vite', icon: 'bolt' },
  { name: 'Node.js', icon: 'terminal' },
  { name: 'Python', icon: 'data_object' },
  { name: 'Web Components', icon: 'widgets' },
  { name: 'Git', icon: 'branch' },
  { name: 'CSS / Tailwind', icon: 'style' },
  { name: 'SQLite / MongoDB', icon: 'storage' },
  { name: 'Docker', icon: 'deployed_code' },
  { name: 'Linux', icon: 'computer' },
])

const experiences = ref([
  {
    period: '2024 - 至今',
    title: '全栈开发工程师',
    description: '负责内部工具平台的前后端开发，推动团队采用 Vue 3 + TypeScript 技术栈，提升开发效率。',
  },
  {
    period: '2022 - 2024',
    title: '前端开发工程师',
    description: '参与多个 Web 应用项目的开发与维护，深入实践组件化架构与状态管理方案。',
  },
  {
    period: '2020 - 2022',
    title: '技术培训与考核设计',
    description: '设计客户经理培训方案与考核题库，积累了对用户体验和学习曲线的深入理解。',
  },
])

const interests = ref([
  { name: '开源项目', icon: 'code_blocks' },
  { name: '设计系统', icon: 'design_services' },
  { name: '阅读', icon: 'menu_book' },
  { name: '游戏', icon: 'sports_esports' },
])
</script>

<style scoped>
.about-view {
  max-width: 720px;
  width: 100%;
}

/* ======== Profile ======== */
.profile {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  padding: 32px 0 40px;
}

.profile__avatar {
  width: 96px;
  height: 96px;
  border-radius: 48px;
  background-color: var(--md-sys-color-primary-container, #eaddff);
  color: var(--md-sys-color-on-primary-container, #21005d);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.profile__avatar .material-symbols-rounded {
  font-size: 48px;
  font-variation-settings: "FILL" 1, "wght" 300;
}

.profile__name {
  font-size: 28px;
  font-weight: 400;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  line-height: 36px;
  margin-bottom: 4px;
}

.profile__role {
  font-size: 16px;
  color: var(--md-sys-color-primary, #6750a4);
  font-weight: 500;
  margin-bottom: 12px;
}

.profile__bio {
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  line-height: 22px;
}

/* ======== Section ======== */
.section {
  margin-top: 36px;
}

.section__title {
  font-size: 22px;
  font-weight: 400;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  line-height: 28px;
  margin-bottom: 16px;
}

/* ======== Skill Grid ======== */
.skill-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.skill-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  background-color: var(--md-sys-color-secondary-container, #e8def8);
  color: var(--md-sys-color-on-secondary-container, #1d192b);
  font-size: 14px;
  font-weight: 500;
  transition: box-shadow 0.2s;
}

.skill-chip__icon {
  font-size: 18px;
  font-variation-settings: "FILL" 0, "wght" 400;
}

/* ======== Timeline ======== */
.timeline {
  position: relative;
  padding-left: 24px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background-color: var(--md-sys-color-outline-variant, #cac4d0);
  border-radius: 1px;
}

.timeline__item {
  position: relative;
  padding-bottom: 24px;
}

.timeline__item:last-child {
  padding-bottom: 0;
}

.timeline__dot {
  position: absolute;
  left: -24px;
  top: 6px;
  width: 12px;
  height: 12px;
  border-radius: 6px;
  background-color: var(--md-sys-color-primary, #6750a4);
  border: 2px solid var(--md-sys-color-surface, #fffbfe);
  box-sizing: border-box;
}

.timeline__period {
  font-size: 12px;
  font-weight: 500;
  color: var(--md-sys-color-primary, #6750a4);
  letter-spacing: 0.5px;
}

.timeline__title {
  font-size: 16px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  line-height: 24px;
  margin-top: 4px;
}

.timeline__desc {
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  line-height: 20px;
  margin-top: 4px;
}

/* ======== Interest Row ======== */
.interest-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.interest-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  border-radius: 12px;
  background-color: var(--md-sys-color-surface-container, #f3edf7);
  transition: background-color 0.2s;
}

.interest-card__icon {
  font-size: 28px;
  color: var(--md-sys-color-primary, #6750a4);
  font-variation-settings: "FILL" 0, "wght" 400;
}

.interest-card__label {
  font-size: 13px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

/* ======== 暗色主题 ======== */
:global([data-theme="dark"]) .profile__avatar {
  background-color: var(--md-sys-color-primary-container, #4f378b);
  color: var(--md-sys-color-on-primary-container, #eaddff);
}

:global([data-theme="dark"]) .skill-chip {
  background-color: var(--md-sys-color-secondary-container, #4a4458);
  color: var(--md-sys-color-on-secondary-container, #e8def8);
}

:global([data-theme="dark"]) .timeline::before {
  background-color: var(--md-sys-color-outline-variant, #49454f);
}

:global([data-theme="dark"]) .interest-card {
  background-color: var(--md-sys-color-surface-container, #211f26);
}

:global([data-theme="dark"]) .timeline__dot {
  border-color: var(--md-sys-color-surface, #1c1b1f);
}

:global([data-theme="dark"]) .profile__role {
  color: var(--md-sys-color-primary, #d0bcff);
}

:global([data-theme="dark"]) .timeline__period {
  color: var(--md-sys-color-primary, #d0bcff);
}

:global([data-theme="dark"]) .interest-card__icon {
  color: var(--md-sys-color-primary, #d0bcff);
}
</style>
