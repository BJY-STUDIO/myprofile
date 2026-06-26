/**
 * kernels-blog 文章数据
 * 新增文章：复制此文件，修改 slug/标题/描述/日期，指向对应的 Content.vue
 */
export default {
  slug: 'kernels-blog',
  title: "Kernel's Blog",
  description: '基于 Vue 3 + Material Web 的个人博客站点，严格遵循 M3 规范。',
  date: 'Jun 25, 2026',
  icon: 'article',
  authors: [
    { name: 'Jerry Bao', role: 'Developer' }
  ],
  // 懒加载内容组件 — defineAsyncComponent 由 BlogArticleView 统一包装
  contentComponent: () => import('@/components/blog/KernelsBlogContent.vue')
}
