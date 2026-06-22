<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { NSpin, NEmpty, NTag, NButton, NModal, useMessage, NInputNumber } from 'naive-ui'
import { Store, Gift, ShoppingBag, Package, Sparkles, Search, Coins, Check } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi'
import { useUserStore } from '@/stores/user'

const { api } = useApi()
const router = useRouter()
const userStore = useUserStore()
const message = useMessage()

const loading = ref(true)
const items = ref<any[]>([])
const searchKeyword = ref('')
const activeCategory = ref<string | null>(null)
const pointsSummary = ref<any>({ current: 0, total_earned: 0, total_spent: 0 })

const selectedItem = ref<any>(null)
const showRedeemModal = ref(false)
const redeemQuantity = ref(1)
const redeemLoading = ref(false)

const categories = [
  { key: null, label: '全部' },
  { key: 'physical', label: '实物商品' },
  { key: 'service', label: '服务兑换' },
]

const filteredItems = computed(() => {
  let list = items.value
  if (activeCategory.value) {
    list = list.filter((i: any) => i.category === activeCategory.value)
  }
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter((i: any) => i.name.toLowerCase().includes(kw) || i.description.toLowerCase().includes(kw))
  }
  return list
})

const totalCost = computed(() => (selectedItem.value?.points_cost || 0) * redeemQuantity.value)

const canAfford = computed(() => pointsSummary.value.current >= totalCost.value)

const fetchData = async () => {
  loading.value = true
  try {
    const [itemsRes, summaryRes] = await Promise.allSettled([
      api.get('/shop/items'),
      userStore.isLoggedIn ? api.get('/points/summary') : Promise.resolve({ data: { data: { current: 0 } } }),
    ])
    if (itemsRes.status === 'fulfilled') items.value = itemsRes.value.data?.data || []
    if (summaryRes.status === 'fulfilled') pointsSummary.value = summaryRes.value.data?.data || { current: 0 }
    if (userStore.isLoggedIn) {
      await userStore.getProfile()
    }
  } catch { /* ignore */ }
  loading.value = false
}

const openRedeem = (item: any) => {
  if (!userStore.isLoggedIn) {
    router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
    return
  }
  selectedItem.value = item
  redeemQuantity.value = 1
  showRedeemModal.value = true
}

const confirmRedeem = async () => {
  if (!canAfford.value) {
    message.error('积分不足')
    return
  }
  redeemLoading.value = true
  try {
    const { data } = await api.post(`/shop/redeem/${selectedItem.value.id}`, { quantity: redeemQuantity.value })
    message.success(data.message || '兑换成功')
    showRedeemModal.value = false
    fetchData()
  } catch (e: any) {
    message.error(e?.response?.data?.error || '兑换失败')
  }
  redeemLoading.value = false
}

onMounted(fetchData)
</script>

<template>
  <div class="container mx-auto px-4 py-6 animate-fade-in">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
      <h1 class="font-title text-2xl text-warm-dark flex items-center gap-2">
        <Store :size="24" class="text-warm-orange" /> 积分商城
      </h1>
      <div class="flex items-center gap-3">
        <div v-if="userStore.isLoggedIn" class="warm-card-static px-4 py-2 flex items-center gap-2">
          <Coins :size="18" class="text-warm-orange" />
          <span class="text-sm text-warm-dark/60">我的积分</span>
          <span class="text-lg font-bold text-warm-orange">{{ userStore.user?.points || pointsSummary.current || 0 }}</span>
        </div>
      </div>
    </div>

    <div v-if="userStore.isLoggedIn" class="warm-card-static p-5 mb-6">
      <div class="grid grid-cols-3 gap-4 text-center">
        <div>
          <p class="text-xs text-warm-dark/40 mb-1">当前积分</p>
          <p class="text-2xl font-bold text-warm-orange">{{ pointsSummary.current || 0 }}</p>
        </div>
        <div class="border-x border-warm-brown/10">
          <p class="text-xs text-warm-dark/40 mb-1">累计获得</p>
          <p class="text-2xl font-bold text-warm-green">{{ pointsSummary.total_earned || 0 }}</p>
        </div>
        <div>
          <p class="text-xs text-warm-dark/40 mb-1">累计消耗</p>
          <p class="text-2xl font-bold text-warm-brown">{{ pointsSummary.total_spent || 0 }}</p>
        </div>
      </div>
    </div>

    <div class="flex flex-col sm:flex-row gap-4 mb-6">
      <div class="flex gap-2 flex-wrap">
        <button
          v-for="cat in categories"
          :key="cat.key || 'all'"
          @click="activeCategory = cat.key"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
          :class="activeCategory === cat.key
            ? 'bg-warm-orange text-white shadow-md'
            : 'bg-white text-warm-dark/70 hover:bg-warm-orange/10 hover:text-warm-orange border border-warm-brown/10'"
        >
          {{ cat.label }}
        </button>
      </div>
      <div class="relative sm:ml-auto sm:w-64">
        <input
          v-model="searchKeyword"
          placeholder="搜索商品..."
          class="w-full px-4 py-2 pl-10 rounded-lg border border-warm-brown/20 bg-white focus:outline-none focus:border-warm-orange focus:ring-2 focus:ring-warm-orange/20 text-sm"
        />
        <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-warm-dark/40" />
      </div>
    </div>

    <NSpin :show="loading">
      <div v-if="filteredItems.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="warm-card overflow-hidden group"
        >
          <div class="relative h-44 overflow-hidden bg-warm-brown/10">
            <img
              v-if="item.image"
              :src="item.image"
              :alt="item.name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-warm-orange/20 to-warm-brown/20">
              <Gift :size="48" class="text-warm-orange/40" />
            </div>
            <div class="absolute top-2 left-2">
              <NTag size="small" :bordered="false" :type="item.category === 'service' ? 'info' : 'warning'">
                {{ item.category === 'service' ? '服务' : '实物' }}
              </NTag>
            </div>
            <div v-if="item.stock < 10" class="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              仅剩{{ item.stock }}件
            </div>
          </div>
          <div class="p-4">
            <h3 class="font-medium text-warm-dark mb-1.5 line-clamp-1 group-hover:text-warm-orange transition-colors">
              {{ item.name }}
            </h3>
            <p class="text-xs text-warm-dark/50 mb-3 line-clamp-2 h-8">
              {{ item.description }}
            </p>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1">
                <Sparkles :size="16" class="text-warm-orange" />
                <span class="text-xl font-bold text-warm-orange">{{ item.points_cost }}</span>
                <span class="text-xs text-warm-dark/40">积分</span>
              </div>
              <NButton
                size="small"
                type="primary"
                @click="openRedeem(item)"
                :disabled="item.stock <= 0"
                class="warm-btn"
              >
                {{ item.stock <= 0 ? '已售罄' : '立即兑换' }}
              </NButton>
            </div>
            <p class="text-xs text-warm-dark/30 mt-2">库存：{{ item.stock }} 件</p>
          </div>
        </div>
      </div>
      <NEmpty v-else-if="!loading" description="暂无商品" class="py-16" />
    </NSpin>

    <NModal v-model:show="showRedeemModal" preset="card" :title="`兑换 ${selectedItem?.name || ''}`" style="max-width: 420px">
      <div v-if="selectedItem" class="space-y-4">
        <div class="flex gap-4">
          <div class="w-24 h-24 rounded-lg overflow-hidden bg-warm-brown/10 flex-shrink-0">
            <img v-if="selectedItem.image" :src="selectedItem.image" :alt="selectedItem.name" class="w-full h-full object-cover" />
            <Gift v-else :size="32" class="w-full h-full text-warm-orange/40 p-4" />
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-medium text-warm-dark mb-1">{{ selectedItem.name }}</h3>
            <p class="text-sm text-warm-dark/50 line-clamp-2 mb-2">{{ selectedItem.description }}</p>
            <p class="text-lg font-bold text-warm-orange flex items-center gap-1">
              <Sparkles :size="16" /> {{ selectedItem.points_cost }} 积分/件
            </p>
          </div>
        </div>

        <div class="warm-card-static p-4">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm text-warm-dark/60">兑换数量</span>
            <NInputNumber v-model:value="redeemQuantity" :min="1" :max="selectedItem.stock" size="small" />
          </div>
          <div class="flex items-center justify-between mb-2 pt-3 border-t border-warm-brown/10">
            <span class="text-sm text-warm-dark/60">所需积分</span>
            <span class="text-xl font-bold" :class="canAfford ? 'text-warm-orange' : 'text-red-500'">{{ totalCost }} 积分</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-warm-dark/60">我的积分</span>
            <span class="text-sm font-medium text-warm-dark">{{ pointsSummary.current || 0 }} 积分</span>
          </div>
          <p v-if="!canAfford" class="text-xs text-red-500 mt-2 flex items-center gap-1">
            积分不足，还差 {{ totalCost - (pointsSummary.current || 0) }} 积分
          </p>
        </div>

        <p class="text-xs text-warm-dark/40">
          * 兑换后请凭订单信息于7天内前往社区服务中心领取实物或预约服务
        </p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <NButton @click="showRedeemModal = false">取消</NButton>
          <NButton type="primary" :disabled="!canAfford" :loading="redeemLoading" @click="confirmRedeem" class="warm-btn">
            确认兑换
          </NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>
