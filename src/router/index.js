/**
 * 路由配置
 */
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/AboutView.vue'),
  },
  {
    path: '/blog',
    name: 'blog',
    component: () => import('@/views/BlogView.vue'),
  },
  {
    path: '/projects',
    name: 'projects',
    component: () => import('@/views/ProjectsView.vue'),
  },
  {
    path: '/projects/:category',
    name: 'projects-category',
    component: () => import('@/views/ProjectsView.vue'),
  },
  {
    path: '/article/:slug',
    name: 'article',
    component: () => import('@/views/BlogArticleView.vue'),
  },
  {
    path: '/contact',
    name: 'contact',
    component: () => import('@/views/ContactView.vue'),
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/views/AdminView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 滚动容器是 main.app-main，window.scrollTo 不生效
    // 返回 savedPosition 或顶部 —— 对于同组件切换在 BlogArticleView watch 中处理
    if (savedPosition) {
      return savedPosition
    }
    // 不同页面导航时由路由处理，延迟确保 DOM 渲染完成
    return new Promise(resolve => {
      setTimeout(() => {
        const main = document.querySelector('main.app-main')
        if (main) main.scrollTo({ top: 0, behavior: 'instant' })
        resolve({ top: 0 })
      }, 0)
    })
  },
})

export default router
