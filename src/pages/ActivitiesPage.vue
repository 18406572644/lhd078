<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { NSpin, NEmpty, NTag, NButton } from 'naive-ui'
import { Calendar, MapPin, Users, Gift, Clock, Search, ChevronRight } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi'

const { api } = useApi()
const router = useRouter()

const loading = ref(true)
const activities = ref<any[]>([])
const searchKeyword = ref('')

const fetchActivities = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (searchKeyword.value) params.keyword = searchKeyword.value
    const { data } = await api.get('/activities', { params })
    activities.value = data.data || []
  } catch { /* ignore */ }
  loading.value = false
}

const formatDateTime = (dt: string) => {
  if (!dt) return ''
  return dt.slice(0, 16).replace('T', ' ')
}

const statusMap: Record<number, { text: string; type: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
  0: { text: '未开放', type: 'default' },
  1: { text: '报名中', type: 'success' },
  2: { text: '进行中', type: 'info' },
  3: { text: '已结束', type: 'warning' },
}

const activityStatus = (status: number) => statusMap[status] || { text: '未知', type: 'default' }

const handleSearch = () => {
  fetchActivities()
}

onMounted(fetchActivities)
</script>

<template>
  <div class="container mx-auto px-4 py-6 animate-fade-in">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
      <h1 class="font-title text-2xl text-warm-dark flex items-center gap-2">
        <Calendar :size="24" class="text-warm-orange" /> 社区活动
      </h1>
      <div class="flex gap-2 max-w-sm w-full sm:w-auto">
        <div class="relative flex-1">
          <input
            v-model="searchKeyword"
            placeholder="搜索活动..."
            class="w-full px-4 py-2 pl-10 rounded-lg border border-warm-brown/20 bg-white focus:outline-none focus:border-warm-orange focus:ring-2 focus:ring-warm-orange/20 text-sm"
            @keyup.enter="handleSearch"
          />
          <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-warm-dark/40" />
        </div>
        <NButton type="primary" @click="handleSearch" class="warm-btn">搜索</NButton>
      </div>
    </div>

    <NSpin :show="loading">
      <div v-if="activities.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="activity in activities"
          :key="activity.id"
          class="warm-card overflow-hidden cursor-pointer group"
          @click="router.push({ name: 'activityDetail', params: { id: activity.id } })"
        >
          <div class="relative h-48 overflow-hidden bg-warm-brown/10">
            <img
              v-if="activity.image"
              :src="activity.image"
              :alt="activity.title"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-warm-orange/20 to-warm-brown/20">
              <Calendar :size="48" class="text-warm-orange/40" />
            </div>
            <div class="absolute top-3 left-3">
              <NTag :type="activityStatus(activity.status).type" size="small" :bordered="false">
                {{ activityStatus(activity.status).text }}
              </NTag>
            </div>
            <div class="absolute top-3 right-3 bg-warm-orange text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Gift :size="12" /> +{{ activity.points_reward }}积分
            </div>
          </div>
          <div class="p-4">
            <h3 class="font-title text-lg text-warm-dark mb-2 line-clamp-1 group-hover:text-warm-orange transition-colors">
              {{ activity.title }}
            </h3>
            <p class="text-sm text-warm-dark/60 mb-3 line-clamp-2 h-10">
              {{ activity.description }}
            </p>
            <div class="space-y-1.5 text-xs text-warm-dark/50">
              <div class="flex items-center gap-1.5">
                <Clock :size="14" class="text-warm-orange/60" />
                <span>{{ formatDateTime(activity.start_time) }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <MapPin :size="14" class="text-warm-orange/60" />
                <span class="truncate">{{ activity.location }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <Users :size="14" class="text-warm-orange/60" />
                <span>{{ activity.participant_count || 0 }}/{{ activity.max_participants }}人已报名</span>
              </div>
            </div>
            <div class="mt-4 flex items-center justify-between">
              <span class="text-xs text-warm-dark/40">主办方：{{ activity.creator_name || '社区' }}</span>
              <span class="text-sm text-warm-orange flex items-center gap-0.5 font-medium">
                查看详情 <ChevronRight :size="16" />
              </span>
            </div>
          </div>
        </div>
      </div>
      <NEmpty v-else-if="!loading" description="暂无活动" class="py-16" />
    </NSpin>
  </div>
</template>
