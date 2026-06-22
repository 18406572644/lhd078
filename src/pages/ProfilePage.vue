<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { NMenu, NGrid, NGi, NAvatar, NSpin, NCard, NButton, NEmpty, NTag, NList, NListItem } from 'naive-ui'
import { User, Wrench, Clock, Wallet, Bell, AlertTriangle } from 'lucide-vue-next'
import StatusBadge from '@/components/StatusBadge.vue'
import { useApi } from '@/composables/useApi'
import { useUserStore } from '@/stores/user'
import { useMessage } from 'naive-ui'

const { api } = useApi()
const userStore = useUserStore()
const message = useMessage()

const loading = ref(true)
const activeSection = ref('info')
const myTools = ref<any[]>([])
const borrowHistory = ref<any[]>([])
const deposits = ref<any[]>([])
const notifications = ref<any[]>([])
const damageClaims = ref<any[]>([])

const menuOptions = [
  { label: '我的信息', key: 'info', icon: () => h(User, { size: 16 }) },
  { label: '我的工具', key: 'tools', icon: () => h(Wrench, { size: 16 }) },
  { label: '借用历史', key: 'borrows', icon: () => h(Clock, { size: 16 }) },
  { label: '押金管理', key: 'deposits', icon: () => h(Wallet, { size: 16 }) },
  { label: '消息通知', key: 'notifications', icon: () => h(Bell, { size: 16 }) },
  { label: '损坏赔偿', key: 'damages', icon: () => h(AlertTriangle, { size: 16 }) },
]

import { h } from 'vue'

const fetchProfileData = async () => {
  loading.value = true
  try {
    await userStore.getProfile()
    const [toolsRes, borrowsRes, depositsRes, notifsRes, damagesRes] = await Promise.allSettled([
      api.get('/tools', { params: { userId: userStore.user?.id } }),
      api.get('/borrows'),
      api.get('/deposits'),
      api.get('/notifications'),
      api.get('/borrows'),
    ])
    if (toolsRes.status === 'fulfilled') myTools.value = toolsRes.value.data?.data || []
    if (borrowsRes.status === 'fulfilled') borrowHistory.value = borrowsRes.value.data?.data || []
    if (depositsRes.status === 'fulfilled') deposits.value = depositsRes.value.data?.data || []
    if (notifsRes.status === 'fulfilled') notifications.value = notifsRes.value.data?.data || []
    if (damagesRes.status === 'fulfilled') {
      const borrows = damagesRes.value.data?.data || []
      damageClaims.value = borrows.filter((b: any) => b.status === 4)
    }
  } catch { /* ignore */ }
  loading.value = false
}

const markRead = async (id: number) => {
  try {
    await api.put(`/notifications/${id}/read`)
    notifications.value = notifications.value.map((n: any) =>
      n.id === id ? { ...n, is_read: 1 } : n
    )
  } catch { /* ignore */ }
}

onMounted(fetchProfileData)
</script>

<template>
  <div class="container mx-auto px-4 py-6 animate-fade-in">
    <h1 class="font-title text-2xl text-warm-dark mb-6">个人中心</h1>

    <NGrid :cols="1" :x-gap="16" :y-gap="16" responsive="screen" item-responsive>
      <NGi span="1" md:span="6">
        <div class="warm-card-static p-4">
          <NMenu
            :value="activeSection"
            :options="menuOptions"
            @update:value="(v: string) => activeSection = v"
          />
        </div>
      </NGi>
      <NGi span="1" md:span="18">
        <NSpin :show="loading">
          <div v-if="activeSection === 'info' && userStore.user" class="warm-card-static p-6">
            <div class="flex items-center gap-4 mb-6">
              <NAvatar :size="64" round class="bg-warm-orange text-white text-2xl">
                {{ userStore.user.name?.[0] || '?' }}
              </NAvatar>
              <div>
                <h2 class="font-title text-xl text-warm-dark">{{ userStore.user.name }}</h2>
                <p class="text-sm text-warm-dark/50">{{ userStore.user.phone }}</p>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div class="py-2 border-b border-warm-brown/10">
                <span class="text-warm-dark/40">地址：</span>{{ userStore.user.address || '未填写' }}
              </div>
              <div class="py-2 border-b border-warm-brown/10">
                <span class="text-warm-dark/40">贡献积分：</span>
                <span class="text-warm-orange font-bold">{{ userStore.user.points || 0 }}</span>
              </div>
              <div class="py-2 border-b border-warm-brown/10">
                <span class="text-warm-dark/40">角色：</span>
                {{ userStore.user.role === 1 ? '管理员' : '居民' }}
              </div>
              <div class="py-2 border-b border-warm-brown/10">
                <span class="text-warm-dark/40">注册时间：</span>
                {{ userStore.user.created_at?.slice(0, 10) || '未知' }}
              </div>
            </div>
          </div>

          <div v-else-if="activeSection === 'tools'" class="space-y-3">
            <div v-for="tool in myTools" :key="tool.id" class="warm-card-static p-4 flex items-center justify-between">
              <div>
                <span class="font-medium text-warm-dark">{{ tool.name }}</span>
                <span class="text-sm text-warm-dark/40 ml-2">押金 ¥{{ tool.deposit }}</span>
              </div>
              <StatusBadge :status="tool.status" type="tool" />
            </div>
            <NEmpty v-if="!myTools.length" description="暂无发布的工具" class="py-8" />
          </div>

          <div v-else-if="activeSection === 'borrows'" class="space-y-3">
            <div v-for="b in borrowHistory" :key="b.id" class="warm-card-static p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-warm-dark">{{ b.tool_name || '工具' }}</span>
                <StatusBadge :status="b.status" type="borrow" />
              </div>
              <p class="text-sm text-warm-dark/50">{{ b.start_date?.slice(0, 10) }} ~ {{ b.end_date?.slice(0, 10) }}</p>
            </div>
            <NEmpty v-if="!borrowHistory.length" description="暂无借用记录" class="py-8" />
          </div>

          <div v-else-if="activeSection === 'deposits'" class="space-y-3">
            <div v-for="d in deposits" :key="d.id" class="warm-card-static p-4 flex items-center justify-between">
              <div>
                <span class="font-medium text-warm-dark">{{ d.tool_name || '工具' }}</span>
                <span class="text-sm text-warm-orange ml-2">¥{{ d.deposit_amount }}</span>
              </div>
              <StatusBadge :status="d.deposit_status" type="deposit" />
            </div>
            <NEmpty v-if="!deposits.length" description="暂无押金记录" class="py-8" />
          </div>

          <div v-else-if="activeSection === 'notifications'" class="space-y-3">
            <div
              v-for="n in notifications" :key="n.id"
              class="warm-card-static p-4 cursor-pointer"
              :class="{ 'border-l-4 border-l-warm-orange': !n.is_read }"
              @click="markRead(n.id)"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium text-warm-dark text-sm">{{ n.title }}</span>
                <NTag v-if="!n.is_read" size="small" type="warning" :bordered="false">未读</NTag>
              </div>
              <p class="text-sm text-warm-dark/50">{{ n.content }}</p>
              <p class="text-xs text-warm-dark/30 mt-1">{{ n.created_at }}</p>
            </div>
            <NEmpty v-if="!notifications.length" description="暂无通知" class="py-8" />
          </div>

          <div v-else-if="activeSection === 'damages'" class="space-y-3">
            <div v-for="d in damageClaims" :key="d.id" class="warm-card-static p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-warm-dark">{{ d.tool_name || '工具' }}</span>
                <StatusBadge :status="d.damage_status || 0" type="damage" />
              </div>
              <p class="text-sm text-warm-dark/50">{{ d.damage_description || '损坏赔偿处理中' }}</p>
            </div>
            <NEmpty v-if="!damageClaims.length" description="暂无损坏赔偿记录" class="py-8" />
          </div>
        </NSpin>
      </NGi>
    </NGrid>
  </div>
</template>
