import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

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
    path: '/activities',
    name: 'activities',
    component: () => import('@/pages/ActivitiesPage.vue'),
  },
  {
    path: '/activities/:id',
    name: 'activityDetail',
    component: () => import('@/pages/ActivityDetailPage.vue'),
  },
  {
    path: '/shop',
    name: 'shop',
    component: () => import('@/pages/ShopPage.vue'),
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

router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }
  
  if (to.meta.requiresAdmin) {
    if (!userStore.isLoggedIn) {
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }
    
    if (!userStore.user) {
      await userStore.getProfile()
    }
    
    if (!userStore.isAdmin) {
      next({ name: 'home' })
      return
    }
  }
  
  next()
})

export default router
