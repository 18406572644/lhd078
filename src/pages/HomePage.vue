<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NInput, NButton, NSpin, NCarousel } from 'naive-ui'
import { Search, Trophy, Wrench, Heart, Bell, ChevronRight, Calendar, Store, Gift, Sparkles } from 'lucide-vue-next'
import ToolCard from '@/components/ToolCard.vue'
import HelpCard from '@/components/HelpCard.vue'
import DecorativeElements from '@/components/DecorativeElements.vue'
import { useApi } from '@/composables/useApi'

const { api } = useApi()
const router = useRouter()

const loading = ref(true)
const hotTools = ref<any[]>([])
const helpRequests = ref<any[]>([])
const rankings = ref<any[]>([])
const notices = ref<any[]>([])
const latestActivities = ref<any[]>([])
const hotShopItems = ref<any[]>([])
const searchKeyword = ref('')

const formatDateTime = (dt: string) => {
  if (!dt) return ''
  return dt.slice(5, 16).replace('T', ' ')
}

const fetchHome = async () => {
  loading.value = true
  try {
    const [toolsRes, helpRes, rankRes, noticeRes, actRes, shopRes] = await Promise.allSettled([
      api.get('/tools/hot', { params: { limit: 4 } }),
      api.get('/help-requests', { params: { limit: 3 } }),
      api.get('/tools/rankings', { params: { limit: 10 } }),
      api.get('/notices', { params: { limit: 5 } }),
      api.get('/activities', { params: { status: 1, limit: 3 } }),
      api.get('/shop/items', { params: { limit: 4 } }),
    ])
    if (toolsRes.status === 'fulfilled') hotTools.value = toolsRes.value.data?.data || []
    if (helpRes.status === 'fulfilled') helpRequests.value = helpRes.value.data?.data || []
    if (rankRes.status === 'fulfilled') rankings.value = rankRes.value.data?.data || []
    if (noticeRes.status === 'fulfilled') notices.value = noticeRes.value.data?.data || []
    if (actRes.status === 'fulfilled') latestActivities.value = (actRes.value.data?.data || []).slice(0, 3)
    if (shopRes.status === 'fulfilled') hotShopItems.value = (shopRes.value.data?.data || []).slice(0, 4)
  } catch { /* ignore */ }
  loading.value = false
}

const handleSearch = () => {
  router.push({ name: 'tools', query: { keyword: searchKeyword.value } })
}

const medalIcons = ['🥇', '🥈', '🥉']

onMounted(fetchHome)
</script>

<template>
  <div class="animate-fade-in">
    <section class="relative bg-gradient-to-br from-warm-orange/10 via-warm-bg to-warm-brown/10 py-16 overflow-hidden">
      <DecorativeElements position="top-right" />
      <DecorativeElements position="bottom-left" />
      <div class="container mx-auto px-4 relative z-10">
        <div class="max-w-2xl mx-auto text-center">
          <h1 class="font-title text-4xl md:text-5xl text-warm-dark mb-4">
            温馨邻里
          </h1>
          <p class="text-warm-dark/60 text-lg mb-8">社区工具共享与互助平台 — 让邻里之间共享资源、互帮互助</p>
          <div class="flex gap-2 max-w-md mx-auto">
            <NInput
              v-model:value="searchKeyword"
              placeholder="搜索工具..."
              size="large"
              round
              @keyup.enter="handleSearch"
            >
              <template #prefix><Search :size="18" class="text-warm-brown" /></template>
            </NInput>
            <NButton type="primary" size="large" round @click="handleSearch" class="warm-btn">搜索</NButton>
          </div>
        </div>
      </div>
      <div class="absolute bottom-0 left-0 right-0 decorative-stripe"></div>
    </section>

    <div class="container mx-auto px-4 py-8">
      <NSpin :show="loading">
        <div class="space-y-12">
          <section>
            <div class="flex items-center justify-between mb-6">
              <h2 class="section-title flex items-center gap-2">
                <Wrench :size="22" class="text-warm-orange" />
                热门工具
              </h2>
              <NButton text type="primary" @click="router.push({ name: 'tools' })">
                查看更多 <ChevronRight :size="16" />
              </NButton>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ToolCard v-for="tool in hotTools" :key="tool.id" :tool="tool" />
            </div>
            <div v-if="!hotTools.length && !loading" class="warm-card-static p-8 text-center text-warm-dark/40">
              暂无热门工具
            </div>
          </section>

          <section>
            <div class="flex items-center justify-between mb-6">
              <h2 class="section-title flex items-center gap-2">
                <Heart :size="22" class="text-warm-orange" />
                最新互助
              </h2>
              <NButton text type="primary" @click="router.push({ name: 'help' })">
                查看更多 <ChevronRight :size="16" />
              </NButton>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <HelpCard v-for="help in helpRequests" :key="help.id" :help="help" />
            </div>
            <div v-if="!helpRequests.length && !loading" class="warm-card-static p-8 text-center text-warm-dark/40">
              暂无互助信息
            </div>
          </section>

          <section>
            <div class="flex items-center justify-between mb-6">
              <h2 class="section-title flex items-center gap-2">
                <Calendar :size="22" class="text-warm-orange" />
                社区活动
              </h2>
              <NButton text type="primary" @click="router.push({ name: 'activities' })">
                查看更多 <ChevronRight :size="16" />
              </NButton>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                v-for="act in latestActivities" :key="act.id"
                class="warm-card overflow-hidden cursor-pointer group"
                @click="router.push({ name: 'activityDetail', params: { id: act.id } })"
              >
                <div class="relative h-36 overflow-hidden bg-warm-brown/10">
                  <img
                    v-if="act.image"
                    :src="act.image"
                    :alt="act.title"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <Calendar v-else :size="32" class="w-full h-full text-warm-orange/40 p-8" />
                  <div class="absolute top-2 right-2 bg-warm-orange text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Gift :size="10" /> +{{ act.points_reward }}
                  </div>
                </div>
                <div class="p-3">
                  <h3 class="font-medium text-warm-dark text-sm mb-1 line-clamp-1 group-hover:text-warm-orange transition-colors">
                    {{ act.title }}
                  </h3>
                  <p class="text-xs text-warm-dark/50 flex items-center gap-1">
                    <Calendar :size="12" /> {{ formatDateTime(act.start_time) }}
                  </p>
                </div>
              </div>
            </div>
            <div v-if="!latestActivities.length && !loading" class="warm-card-static p-8 text-center text-warm-dark/40">
              暂无活动
            </div>
          </section>

          <section>
            <div class="flex items-center justify-between mb-6">
              <h2 class="section-title flex items-center gap-2">
                <Store :size="22" class="text-warm-orange" />
                积分商城
              </h2>
              <NButton text type="primary" @click="router.push({ name: 'shop' })">
                查看更多 <ChevronRight :size="16" />
              </NButton>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div
                v-for="item in hotShopItems" :key="item.id"
                class="warm-card overflow-hidden cursor-pointer group"
                @click="router.push({ name: 'shop' })"
              >
                <div class="relative h-28 overflow-hidden bg-warm-brown/10">
                  <img
                    v-if="item.image"
                    :src="item.image"
                    :alt="item.name"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <Gift v-else :size="28" class="w-full h-full text-warm-orange/40 p-6" />
                </div>
                <div class="p-2.5">
                  <h3 class="text-sm text-warm-dark font-medium line-clamp-1 group-hover:text-warm-orange transition-colors mb-1">
                    {{ item.name }}
                  </h3>
                  <p class="text-warm-orange font-bold text-sm flex items-center gap-0.5">
                    <Sparkles :size="12" /> {{ item.points_cost }}
                  </p>
                </div>
              </div>
            </div>
            <div v-if="!hotShopItems.length && !loading" class="warm-card-static p-8 text-center text-warm-dark/40">
              暂无商品
            </div>
          </section>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section>
              <h2 class="section-title flex items-center gap-2 mb-6">
                <Trophy :size="22" class="text-warm-orange" />
                贡献排行榜
              </h2>
              <div class="warm-card-static p-4">
                <div v-for="(user, idx) in rankings" :key="user.id"
                  class="flex items-center gap-3 py-3 border-b border-warm-brown/10 last:border-0">
                  <span class="text-lg w-8 text-center">{{ medalIcons[idx] || (idx + 1) }}</span>
                  <div class="w-8 h-8 rounded-full bg-warm-orange/10 flex items-center justify-center text-warm-orange text-sm font-medium">
                    {{ user.name?.[0] || '?' }}
                  </div>
                  <span class="flex-1 text-warm-dark text-sm">{{ user.name }}</span>
                  <span class="text-warm-orange font-bold text-sm">{{ user.points }} 积分</span>
                </div>
                <div v-if="!rankings.length && !loading" class="py-4 text-center text-warm-dark/40 text-sm">
                  暂无排行数据
                </div>
              </div>
            </section>

            <section>
              <h2 class="section-title flex items-center gap-2 mb-6">
                <Bell :size="22" class="text-warm-orange" />
                社区公告
              </h2>
              <div class="warm-card-static p-4 space-y-3">
                <router-link
                  v-for="notice in notices" :key="notice.id"
                  :to="{ name: 'noticeDetail', params: { id: notice.id } }"
                  class="flex items-center gap-2 py-2 border-b border-warm-brown/10 last:border-0 hover:text-warm-orange transition-colors"
                >
                  <span v-if="notice.is_top" class="text-warm-orange text-xs">[置顶]</span>
                  <span class="flex-1 text-sm text-warm-dark truncate">{{ notice.title }}</span>
                  <span class="text-xs text-warm-dark/30 flex-shrink-0">{{ notice.created_at?.slice(0, 10) }}</span>
                </router-link>
                <div v-if="!notices.length && !loading" class="py-4 text-center text-warm-dark/40 text-sm">
                  暂无公告
                </div>
              </div>
            </section>
          </div>
        </div>
      </NSpin>
    </div>
  </div>
</template>
