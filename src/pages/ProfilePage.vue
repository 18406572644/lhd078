<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { NMenu, NGrid, NGi, NAvatar, NSpin, NCard, NButton, NEmpty, NTag, NList, NListItem } from 'naive-ui'
import { User, Wrench, Clock, Wallet, Bell, AlertTriangle, Calendar, Store, Coins, Sparkles, TrendingUp, TrendingDown } from 'lucide-vue-next'
import StatusBadge from '@/components/StatusBadge.vue'
import { useApi } from '@/composables/useApi'
import { useUserStore } from '@/stores/user'
import { useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'

const router = useRouter()

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
const myActivities = ref<any[]>([])
const myRedemptions = ref<any[]>([])
const pointRecords = ref<any[]>([])
const pointsSummary = ref<any>({ current: 0, total_earned: 0, total_spent: 0 })

const menuOptions = [
  { label: '我的信息', key: 'info', icon: () => h(User, { size: 16 }) },
  { label: '我的工具', key: 'tools', icon: () => h(Wrench, { size: 16 }) },
  { label: '借用历史', key: 'borrows', icon: () => h(Clock, { size: 16 }) },
  { label: '我的活动', key: 'activities', icon: () => h(Calendar, { size: 16 }) },
  { label: '积分流水', key: 'points', icon: () => h(Coins, { size: 16 }) },
  { label: '我的兑换', key: 'redemptions', icon: () => h(Store, { size: 16 }) },
  { label: '押金管理', key: 'deposits', icon: () => h(Wallet, { size: 16 }) },
  { label: '消息通知', key: 'notifications', icon: () => h(Bell, { size: 16 }) },
  { label: '损坏赔偿', key: 'damages', icon: () => h(AlertTriangle, { size: 16 }) },
]

const redemptionStatusMap: Record<number, { text: string; type: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
  0: { text: '待领取', type: 'warning' },
  1: { text: '已领取', type: 'success' },
  2: { text: '已取消', type: 'default' },
}

const activityJoinStatusMap: Record<number, { text: string; type: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
  0: { text: '已报名', type: 'info' },
  1: { text: '已完成', type: 'success' },
}

import { h } from 'vue'

const fetchProfileData = async () => {
  loading.value = true
  try {
    await userStore.getProfile()
    const [toolsRes, borrowsRes, depositsRes, notifsRes, damagesRes, actsRes, redeemRes, pointsRes, summaryRes] = await Promise.allSettled([
      api.get('/tools', { params: { userId: userStore.user?.id } }),
      api.get('/borrows'),
      api.get('/deposits'),
      api.get('/notifications'),
      api.get('/borrows'),
      api.get('/activities/my'),
      api.get('/shop/my-redemptions'),
      api.get('/points/records'),
      api.get('/points/summary'),
    ])
    if (toolsRes.status === 'fulfilled') myTools.value = toolsRes.value.data?.data || []
    if (borrowsRes.status === 'fulfilled') borrowHistory.value = borrowsRes.value.data?.data || []
    if (depositsRes.status === 'fulfilled') deposits.value = depositsRes.value.data?.data || []
    if (notifsRes.status === 'fulfilled') notifications.value = notifsRes.value.data?.data || []
    if (damagesRes.status === 'fulfilled') {
      const borrows = damagesRes.value.data?.data || []
      damageClaims.value = borrows.filter((b: any) => b.status === 4)
    }
    if (actsRes.status === 'fulfilled') myActivities.value = actsRes.value.data?.data || []
    if (redeemRes.status === 'fulfilled') myRedemptions.value = redeemRes.value.data?.data || []
    if (pointsRes.status === 'fulfilled') pointRecords.value = pointsRes.value.data?.data || []
    if (summaryRes.status === 'fulfilled') pointsSummary.value = summaryRes.value.data?.data || { current: 0, total_earned: 0, total_spent: 0 }
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

          <div v-else-if="activeSection === 'activities'" class="space-y-3">
            <div
              v-for="act in myActivities" :key="act.id"
              class="warm-card-static p-4 cursor-pointer hover:shadow-md transition-shadow"
              @click="router.push({ name: 'activityDetail', params: { id: act.id } })"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-warm-dark">{{ act.title }}</span>
                <NTag :type="activityJoinStatusMap[act.join_status]?.type || 'default'" size="small" :bordered="false">
                  {{ activityJoinStatusMap[act.join_status]?.text || '未知' }}
                </NTag>
              </div>
              <div class="flex items-center justify-between text-xs text-warm-dark/50">
                <span class="flex items-center gap-1"><Calendar :size="12" /> {{ act.start_time?.slice(0, 16).replace('T', ' ') }}</span>
                <span v-if="act.points_awarded > 0" class="text-warm-orange font-medium flex items-center gap-0.5">
                  <Sparkles :size="12" /> +{{ act.points_awarded }}积分
                </span>
              </div>
            </div>
            <NEmpty v-if="!myActivities.length" description="暂无活动记录，快去报名参加吧" class="py-8" />
          </div>

          <div v-else-if="activeSection === 'points'" class="space-y-4">
            <div class="grid grid-cols-3 gap-3">
              <div class="warm-card-static p-4 text-center">
                <p class="text-xs text-warm-dark/40 mb-1">当前积分</p>
                <p class="text-xl font-bold text-warm-orange flex items-center justify-center gap-1">
                  <Coins :size="16" /> {{ userStore.user?.points || pointsSummary.current || 0 }}
                </p>
              </div>
              <div class="warm-card-static p-4 text-center">
                <p class="text-xs text-warm-dark/40 mb-1">累计获得</p>
                <p class="text-xl font-bold text-warm-green flex items-center justify-center gap-1">
                  <TrendingUp :size="16" /> {{ pointsSummary.total_earned || 0 }}
                </p>
              </div>
              <div class="warm-card-static p-4 text-center">
                <p class="text-xs text-warm-dark/40 mb-1">累计消耗</p>
                <p class="text-xl font-bold text-warm-brown flex items-center justify-center gap-1">
                  <TrendingDown :size="16" /> {{ pointsSummary.total_spent || 0 }}
                </p>
              </div>
            </div>
            <div class="space-y-2">
              <div
                v-for="r in pointRecords" :key="r.id"
                class="warm-card-static p-3 flex items-center justify-between"
              >
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center"
                    :class="r.type === 'earn' ? 'bg-warm-green/10' : 'bg-warm-orange/10'">
                    <TrendingUp v-if="r.type === 'earn'" :size="14" class="text-warm-green" />
                    <TrendingDown v-else :size="14" class="text-warm-orange" />
                  </div>
                  <div>
                    <p class="text-sm text-warm-dark">{{ r.reason }}</p>
                    <p class="text-xs text-warm-dark/40">{{ r.created_at?.slice(0, 16).replace('T', ' ') }}</p>
                  </div>
                </div>
                <span class="font-bold" :class="r.type === 'earn' ? 'text-warm-green' : 'text-warm-orange'">
                  {{ r.type === 'earn' ? '+' : '' }}{{ r.change }}
                </span>
              </div>
              <NEmpty v-if="!pointRecords.length" description="暂无积分记录" class="py-8" />
            </div>
          </div>

          <div v-else-if="activeSection === 'redemptions'" class="space-y-3">
            <div v-for="r in myRedemptions" :key="r.id" class="warm-card-static p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-warm-dark">{{ r.item_name }}</span>
                <NTag :type="redemptionStatusMap[r.status]?.type || 'default'" size="small" :bordered="false">
                  {{ redemptionStatusMap[r.status]?.text || '未知' }}
                </NTag>
              </div>
              <div class="flex items-center justify-between text-xs text-warm-dark/50">
                <span>数量：{{ r.quantity }}</span>
                <span class="text-warm-orange font-medium">-{{ r.points_cost * r.quantity }}积分</span>
              </div>
              <p class="text-xs text-warm-dark/30 mt-1">兑换时间：{{ r.created_at?.slice(0, 16).replace('T', ' ') }}</p>
            </div>
            <NEmpty v-if="!myRedemptions.length" description="暂无兑换记录" class="py-8" />
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
