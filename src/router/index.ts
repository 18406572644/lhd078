import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/HomePage.vue'),
  },
  {
    path: '/tools',
    name: 'tools',
    component: () => import('@/pages/ToolsPage.vue'),
  },
  {
    path: '/tools/:id',
    name: 'toolDetail',
    component: () => import('@/pages/ToolDetailPage.vue'),
  },
  {
    path: '/borrows',
    name: 'borrows',
    component: () => import('@/pages/BorrowsPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/help',
    name: 'help',
    component: () => import('@/pages/HelpPage.vue'),
  },
  {
    path: '/notices',
    name: 'notices',
    component: () => import('@/pages/NoticesPage.vue'),
  },
  {
    path: '/notices/:id',
    name: 'noticeDetail',
    component: () => import('@/pages/NoticeDetailPage.vue'),
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/pages/ProfilePage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/publish',
    name: 'publish',
    component: () => import('@/pages/PublishToolPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/pages/AdminPage.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/pages/RegisterPage.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (to.meta.requiresAdmin) {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        if (user.role !== 1) {
          next({ name: 'home' })
          return
        }
      } catch {
        next({ name: 'login' })
        return
      }
    } else {
      next({ name: 'login' })
      return
    }
    next()
  } else {
    next()
  }
})

export default router
