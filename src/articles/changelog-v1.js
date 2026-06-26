/**
 * changelog-v1 文章数据
 */
export default {
  slug: 'changelog-v1',
  title: "Changelog: Kernel's Blog v1",
  description: 'v1 开发周期的关键里程碑、修复记录与后续计划。',
  date: 'Jun 26, 2026',
  icon: 'history',
  authors: [
    { name: 'Jerry Bao', role: 'Developer' }
  ],
  contentComponent: () => import('@/components/blog/ChangelogContent.vue')
}
