<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NMenu, NAvatar, NBadge, NDropdown, NSpace, NButton } from 'naive-ui'
import { Home, Wrench, Heart, Bell, User, LogOut, Shield, Plus, Calendar, Store } from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'
import { useApi } from '@/composables/useApi'

const { api } = useApi()
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const unreadCount = ref(0)

const navItems = computed(() => {
  const items = [
    { name: 'home', label: '首页' },
    { name: 'tools', label: '工具大厅' },
    { name: 'activities', label: '社区活动' },
    { name: 'shop', label: '积分商城' },
    { name: 'help', label: '互助广场' },
    { name: 'notices', label: '公告栏' },
  ]
  if (userStore.isAdmin) {
    items.push({ name: 'admin', label: '后台管理' })
  }
  return items
})

onMounted(() => {
  if (userStore.isLoggedIn) {
    fetchUnread()
  }
})

watch(
  () => userStore.isLoggedIn,
  (newVal) => {
    if (newVal) {
      fetchUnread()
    } else {
      unreadCount.value = 0
    }
  },
)

const fetchUnread = async () => {
  try {
    const { data } = await api.get('/notifications/unread')
    const result = data.data || data
    unreadCount.value = result.count || 0
  } catch { /* ignore */ }
}

const menuOptions = [
  { label: '首页', key: 'home', icon: () => h(Home, { size: 18 }) },
  { label: '工具大厅', key: 'tools', icon: () => h(Wrench, { size: 18 }) },
  { label: '互助广场', key: 'help', icon: () => h(Heart, { size: 18 }) },
  { label: '公告栏', key: 'notices', icon: () => h(Bell, { size: 18 }) },
]

import { h } from 'vue'

const activeKey = ref('home')

const handleMenuUpdate = (key: string) => {
  activeKey.value = key
  router.push({ name: key })
}

const userDropdownOptions = computed(() => {
  const options = [
    { label: '个人中心', key: 'profile' },
    { label: '我的借用', key: 'borrows' },
    { label: '发布工具', key: 'publish' },
  ]
  if (userStore.isAdmin) {
    options.push({ label: '后台管理', key: 'admin' })
  }
  options.push({ label: '退出登录', key: 'logout' })
  return options
})

const handleUserAction = (key: string) => {
  if (key === 'logout') {
    userStore.logout()
    router.push({ name: 'home' })
  } else {
    router.push({ name: key })
  }
}
</script>

<template>
  <header class="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-50 border-b border-warm-brown/10">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center gap-2 cursor-pointer" @click="router.push({ name: 'home' })">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 4L4 16H8V30H16V22H20V30H28V16H32L18 4Z" fill="#E8763A" stroke="#5C3D2E" stroke-width="1.5"/>
            <rect x="22" y="6" width="8" height="10" rx="1" fill="#FFF3D6" stroke="#B8956A" stroke-width="1"/>
            <path d="M23 9H29M23 11H29M23 13H27" stroke="#E8763A" stroke-width="0.8"/>
          </svg>
          <span class="font-title text-xl text-warm-dark hidden sm:inline">温馨邻里</span>
        </div>

        <nav class="hidden md:flex items-center gap-1">
          <router-link
            v-for="item in navItems"
            :key="item.name"
            :to="{ name: item.name }"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="route.name === item.name ? 'bg-warm-orange/10 text-warm-orange' : 'text-warm-dark/70 hover:bg-warm-orange/5 hover:text-warm-orange'"
          >
            {{ item.label }}
          </router-link>
        </nav>

        <div class="flex items-center gap-3">
          <NBadge :value="unreadCount" :max="99" v-if="userStore.isLoggedIn">
            <NButton quaternary circle size="small" @click="router.push({ name: 'profile' })">
              <template #icon><Bell :size="18" /></template>
            </NButton>
          </NBadge>

          <template v-if="userStore.isLoggedIn">
            <NDropdown :options="userDropdownOptions" @select="handleUserAction" placement="bottom-end">
              <div class="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg hover:bg-warm-orange/5 transition-colors">
                <NAvatar
                  v-if="userStore.user?.avatar"
                  :src="userStore.user.avatar"
                  :size="30"
                  round
                />
                <NAvatar v-else :size="30" round class="bg-warm-orange text-white">
                  {{ userStore.user?.name?.[0] || '用' }}
                </NAvatar>
                <span class="text-sm text-warm-dark hidden sm:inline">{{ userStore.user?.name }}</span>
              </div>
            </NDropdown>
          </template>

          <template v-else>
            <NSpace>
              <NButton size="small" @click="router.push({ name: 'login' })">登录</NButton>
              <NButton size="small" type="primary" @click="router.push({ name: 'register' })">注册</NButton>
            </NSpace>
          </template>
        </div>
      </div>
    </div>
  </header>
</template>
