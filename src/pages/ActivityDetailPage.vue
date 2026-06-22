<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { NSpin, NTag, NButton, NAvatar, NModal, useMessage } from 'naive-ui'
import { Calendar, MapPin, Users, Gift, Clock, ArrowLeft, UserPlus, X } from 'lucide-vue-next'
import { useRouter, useRoute } from 'vue-router'
import { useApi } from '@/composables/useApi'
import { useUserStore } from '@/stores/user'

const { api } = useApi()
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const message = useMessage()

const loading = ref(true)
const activity = ref<any>(null)
const hasJoined = ref(false)
const showConfirmModal = ref(false)
const joinLoading = ref(false)

const statusMap: Record<number, { text: string; type: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' }> = {
  0: { text: '未开放', type: 'default' },
  1: { text: '报名中', type: 'success' },
  2: { text: '进行中', type: 'info' },
  3: { text: '已结束', type: 'warning' },
}

const activityStatus = computed((): { text: string; type: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' } => {
  return activity.value ? (statusMap[activity.value.status] || { text: '未知', type: 'default' }) : { text: '未知', type: 'default' }
})

const formatDateTime = (dt: string) => {
  if (!dt) return ''
  return dt.slice(0, 16).replace('T', ' ')
}

const fetchDetail = async () => {
  loading.value = true
  try {
    const { data } = await api.get(`/activities/${route.params.id}`)
    activity.value = data.data
    if (userStore.isLoggedIn && activity.value?.participants) {
      hasJoined.value = activity.value.participants.some((p: any) => p.user_id === userStore.user?.id)
    }
  } catch {
    message.error('获取活动详情失败')
  }
  loading.value = false
}

const handleJoin = async () => {
  if (!userStore.isLoggedIn) {
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  showConfirmModal.value = true
}

const confirmJoin = async () => {
  joinLoading.value = true
  try {
    const { data } = await api.post(`/activities/${route.params.id}/join`)
    message.success(data.message || '报名成功')
    showConfirmModal.value = false
    hasJoined.value = true
    fetchDetail()
  } catch (e: any) {
    message.error(e?.response?.data?.error || '报名失败')
  }
  joinLoading.value = false
}

const handleCancel = async () => {
  joinLoading.value = true
  try {
    const { data } = await api.post(`/activities/${route.params.id}/cancel`)
    message.success(data.message || '取消成功')
    hasJoined.value = false
    fetchDetail()
  } catch (e: any) {
    message.error(e?.response?.data?.error || '取消失败')
  }
  joinLoading.value = false
}

onMounted(fetchDetail)
</script>

<template>
  <div class="container mx-auto px-4 py-6 animate-fade-in">
    <button
      @click="router.back()"
      class="flex items-center gap-1 text-warm-dark/60 hover:text-warm-orange mb-6 transition-colors text-sm"
    >
      <ArrowLeft :size="16" /> 返回
    </button>

    <NSpin :show="loading">
      <div v-if="activity" class="max-w-4xl mx-auto">
        <div class="relative rounded-2xl overflow-hidden mb-6 bg-warm-brown/10">
          <img
            v-if="activity.image"
            :src="activity.image"
            :alt="activity.title"
            class="w-full h-64 md:h-80 object-cover"
          />
          <div v-else class="w-full h-64 md:h-80 flex items-center justify-center bg-gradient-to-br from-warm-orange/20 to-warm-brown/20">
            <Calendar :size="80" class="text-warm-orange/40" />
          </div>
          <div class="absolute top-4 left-4 flex items-center gap-2">
            <NTag :type="activityStatus.type" size="large" :bordered="false">
              {{ activityStatus.text }}
            </NTag>
            <div class="bg-warm-orange text-white text-sm px-3 py-1 rounded-full flex items-center gap-1">
              <Gift :size="14" /> +{{ activity.points_reward }}积分
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-6">
            <div class="warm-card-static p-6">
              <h1 class="font-title text-2xl md:text-3xl text-warm-dark mb-4">{{ activity.title }}</h1>
              <p class="text-warm-dark/70 leading-relaxed whitespace-pre-wrap">{{ activity.description }}</p>
            </div>

            <div class="warm-card-static p-6">
              <h2 class="section-title mb-4">活动详情</h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div class="flex items-start gap-3">
                  <div class="w-9 h-9 rounded-lg bg-warm-orange/10 flex items-center justify-center flex-shrink-0">
                    <Clock :size="18" class="text-warm-orange" />
                  </div>
                  <div>
                    <p class="text-warm-dark/40 text-xs mb-0.5">活动时间</p>
                    <p class="text-warm-dark font-medium">{{ formatDateTime(activity.start_time) }}</p>
                    <p class="text-warm-dark/60 text-xs">至 {{ formatDateTime(activity.end_time) }}</p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <div class="w-9 h-9 rounded-lg bg-warm-orange/10 flex items-center justify-center flex-shrink-0">
                    <MapPin :size="18" class="text-warm-orange" />
                  </div>
                  <div>
                    <p class="text-warm-dark/40 text-xs mb-0.5">活动地点</p>
                    <p class="text-warm-dark font-medium">{{ activity.location }}</p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <div class="w-9 h-9 rounded-lg bg-warm-orange/10 flex items-center justify-center flex-shrink-0">
                    <Users :size="18" class="text-warm-orange" />
                  </div>
                  <div>
                    <p class="text-warm-dark/40 text-xs mb-0.5">报名人数</p>
                    <p class="text-warm-dark font-medium">
                      {{ activity.participant_count || 0 }}/{{ activity.max_participants }} 人
                    </p>
                    <div class="w-32 h-2 bg-warm-brown/10 rounded-full mt-1.5 overflow-hidden">
                      <div
                        class="h-full bg-warm-orange rounded-full transition-all"
                        :style="{ width: `${Math.min((activity.participant_count || 0) / activity.max_participants * 100, 100)}%` }"
                      ></div>
                    </div>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <div class="w-9 h-9 rounded-lg bg-warm-orange/10 flex items-center justify-center flex-shrink-0">
                    <Gift :size="18" class="text-warm-orange" />
                  </div>
                  <div>
                    <p class="text-warm-dark/40 text-xs mb-0.5">积分奖励</p>
                    <p class="text-warm-orange font-bold text-lg">+{{ activity.points_reward }} 积分</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-6">
            <div class="warm-card-static p-6 sticky top-20">
              <h2 class="font-title text-lg text-warm-dark mb-4">立即报名</h2>
              <div class="mb-4">
                <p class="text-sm text-warm-dark/60 mb-2">参与活动即可获得</p>
                <p class="text-3xl font-bold text-warm-orange">{{ activity.points_reward }} <span class="text-sm font-normal text-warm-dark/40">积分</span></p>
              </div>
              <div class="text-sm text-warm-dark/50 mb-4">
                已报名 {{ activity.participant_count || 0 }} / {{ activity.max_participants }} 人
              </div>
              <template v-if="hasJoined">
                <NButton type="default" block size="large" @click="handleCancel" :loading="joinLoading" class="!bg-warm-brown/10 !text-warm-dark">
                  取消报名
                </NButton>
                <p class="text-xs text-warm-green text-center mt-3 flex items-center justify-center gap-1">
                  <UserPlus :size="12" /> 您已报名此活动
                </p>
              </template>
              <template v-else-if="activity.status === 1">
                <NButton type="primary" block size="large" @click="handleJoin" :loading="joinLoading" class="warm-btn">
                  我要报名
                </NButton>
              </template>
              <template v-else>
                <NButton type="default" block size="large" disabled>
                  {{ activityStatus.text }}
                </NButton>
              </template>
            </div>

            <div v-if="activity.participants?.length" class="warm-card-static p-6">
              <h2 class="font-title text-lg text-warm-dark mb-4 flex items-center gap-2">
                <Users :size="18" class="text-warm-orange" /> 已报名 ({{ activity.participants.length }})
              </h2>
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="p in activity.participants.slice(0, 12)"
                  :key="p.id"
                  class="flex items-center gap-2 bg-warm-bg px-3 py-1.5 rounded-full"
                >
                  <NAvatar :size="24" round class="bg-warm-orange text-white text-xs">
                    {{ p.user_name?.[0] || '?' }}
                  </NAvatar>
                  <span class="text-xs text-warm-dark">{{ p.user_name }}</span>
                </div>
                <span v-if="activity.participants.length > 12" class="text-xs text-warm-dark/40 self-center px-2">
                  等 {{ activity.participants.length }} 人
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </NSpin>

    <NModal v-model:show="showConfirmModal" preset="dialog" title="确认报名" positive-text="确认报名" negative-text="取消"
      :positive-button-props="{ loading: joinLoading }"
      @positive-click="confirmJoin"
    >
      <p class="text-sm text-warm-dark/70">确认报名参加「{{ activity?.title }}」活动吗？</p>
      <p class="text-sm text-warm-dark/50 mt-2">参与活动完成后可获得 <span class="text-warm-orange font-medium">{{ activity?.points_reward }}积分</span> 奖励。</p>
    </NModal>
  </div>
</template>
