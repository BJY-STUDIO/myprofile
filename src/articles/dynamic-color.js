/**
 * dynamic-color 文章数据
 * M3 Dynamic Color 与 HCT 色彩空间实战指南
 */
export default {
  slug: 'dynamic-color',
  title: 'Dynamic Color 实战指南',
  description: '从 HCT 色彩空间到动态配色方案，深入理解 M3 的个性化色彩体系。',
  date: 'Jun 28, 2026',
  icon: 'palette',
  authors: [
    { name: 'Jerry Bao', role: 'Developer' }
  ],
  contentComponent: () => import('@/components/blog/DynamicColorContent.vue')
}
