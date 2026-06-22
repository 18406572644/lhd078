<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NTabs, NTabPane, NButton, NSpin, NEmpty, NTag } from 'naive-ui'
import { Clock, PackageCheck } from 'lucide-vue-next'
import StatusBadge from '@/components/StatusBadge.vue'
import { useApi } from '@/composables/useApi'
import { useMessage } from 'naive-ui'

const { api } = useApi()
const message = useMessage()

const loading = ref(true)
const activeTab = ref('active')
const borrows = ref<any[]>([])

const fetchBorrows = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/borrows')
    borrows.value = data.data || []
  } catch {
    message.error('获取借用记录失败')
  }
  loading.value = false
}

const returnTool = async (id: number) => {
  try {
    await api.put(`/borrows/${id}/return`)
    message.success('归还成功')
    fetchBorrows()
  } catch (e: any) {
    message.error(e.response?.data?.message || '归还失败')
  }
}

const filteredBorrows = ref<any[]>([])

const filterBorrows = () => {
  switch (activeTab.value) {
    case 'active':
      filteredBorrows.value = borrows.value.filter((b: any) => b.status === 1)
      break
    case 'pending':
      filteredBorrows.value = borrows.value.filter((b: any) => b.status === 0)
      break
    case 'returned':
      filteredBorrows.value = borrows.value.filter((b: any) => b.status === 2)
      break
    default:
      filteredBorrows.value = borrows.value
  }
}

const handleTabChange = (tab: string) => {
  activeTab.value = tab
  filterBorrows()
}

onMounted(async () => {
  await fetchBorrows()
  filterBorrows()
})
</script>

<template>
  <div class="container mx-auto px-4 py-6 animate-fade-in">
    <h1 class="font-title text-2xl text-warm-dark mb-6">我的借用</h1>

    <NTabs type="line" animated @update:value="handleTabChange" :value="activeTab">
      <NTabPane name="active" tab="进行中" />
      <NTabPane name="pending" tab="待审批" />
      <NTabPane name="returned" tab="已归还" />
      <NTabPane name="all" tab="全部" />
    </NTabs>

    <NSpin :show="loading" class="mt-6">
      <div class="space-y-4">
        <div
          v-for="borrow in filteredBorrows"
          :key="borrow.id"
          class="warm-card-static p-4"
          :class="{ 'animate-pulse-alert border-warm-orange/50': borrow.status === 3 }"
        >
          <div class="flex flex-col md:flex-row gap-4">
            <div class="w-full md:w-24 h-24 bg-warm-brown/5 rounded-lg overflow-hidden flex-shrink-0">
              <img
                v-if="borrow.tool_image"
                :src="borrow.tool_image"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <PackageCheck :size="32" class="text-warm-brown/20" />
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between mb-2">
                <h3 class="font-medium text-warm-dark truncate">{{ borrow.tool_name || '工具' }}</h3>
                <StatusBadge :status="borrow.status" type="borrow" />
              </div>
              <div class="text-sm text-warm-dark/60 space-y-1">
                <p class="flex items-center gap-1">
                  <Clock :size="14" />
                  {{ borrow.start_date?.slice(0, 10) }} ~ {{ borrow.end_date?.slice(0, 10) }}
                </p>
                <p>押金：¥{{ borrow.deposit_amount }}</p>
              </div>
            </div>
            <div class="flex items-end gap-2 flex-shrink-0">
              <NButton
                v-if="borrow.status === 1"
                type="primary"
                size="small"
                @click="returnTool(borrow.id)"
              >
                归还
              </NButton>
            </div>
          </div>
        </div>
        <NEmpty v-if="!filteredBorrows.length && !loading" description="暂无借用记录" class="py-12" />
      </div>
    </NSpin>
  </div>
</template>
