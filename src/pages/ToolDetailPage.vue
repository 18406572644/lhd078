<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NCard, NButton, NGrid, NGi, NAvatar, NSpin, NDatePicker, NEmpty } from 'naive-ui'
import { ArrowLeft, User, Shield, Wrench } from 'lucide-vue-next'
import StatusBadge from '@/components/StatusBadge.vue'
import ToolCard from '@/components/ToolCard.vue'
import { useApi } from '@/composables/useApi'
import { useMessage } from 'naive-ui'

const { api } = useApi()
const route = useRoute()
const router = useRouter()
const message = useMessage()

const loading = ref(true)
const tool = ref<any>(null)
const relatedTools = ref<any[]>([])
const dateRange = ref<[number, number] | null>(null)
const submitting = ref(false)

const fetchTool = async () => {
  loading.value = true
  try {
    const { data } = await api.get(`/tools/${route.params.id}`)
    tool.value = data.data
    const { data: related } = await api.get('/tools', { params: { category_id: data.data?.category_id, limit: 4 } })
    relatedTools.value = (related.data || []).filter((t: any) => t.id !== data.data?.id).slice(0, 4)
  } catch {
    message.error('获取工具详情失败')
  }
  loading.value = false
}

const getImages = () => {
  try {
    return JSON.parse(tool.value?.images || '[]')
  } catch {
    return []
  }
}

const submitBorrow = async () => {
  if (!dateRange.value) {
    message.warning('请选择借用时间')
    return
  }
  submitting.value = true
  try {
    await api.post('/borrows', {
      toolId: tool.value.id,
      startDate: new Date(dateRange.value[0]).toISOString(),
      endDate: new Date(dateRange.value[1]).toISOString(),
    })
    message.success('借用申请已提交')
  } catch (e: any) {
    message.error(e.response?.data?.message || '提交失败')
  }
  submitting.value = false
}

onMounted(fetchTool)
</script>

<template>
  <div class="container mx-auto px-4 py-6 animate-fade-in">
    <NSpin :show="loading">
      <template v-if="tool">
        <div class="mb-4">
          <NButton quaternary @click="router.back()">
            <template #icon><ArrowLeft :size="16" /></template> 返回
          </NButton>
        </div>

        <NGrid :cols="1" :x-gap="24" :y-gap="16" responsive="screen" item-responsive>
          <NGi span="1" md:span="14">
            <div class="warm-card-static overflow-hidden">
              <div class="h-64 md:h-96 bg-warm-brown/5 flex items-center justify-center">
                <img
                  v-if="getImages()[0]"
                  :src="getImages()[0]"
                  :alt="tool.name"
                  class="w-full h-full object-cover"
                />
                <Wrench v-else :size="64" class="text-warm-brown/20" />
              </div>
              <div v-if="getImages().length > 1" class="flex gap-2 p-4 overflow-x-auto">
                <img
                  v-for="(img, idx) in getImages()" :key="idx"
                  :src="img"
                  class="w-16 h-16 rounded-lg object-cover cursor-pointer border-2 border-transparent hover:border-warm-orange transition-colors"
                />
              </div>
            </div>
          </NGi>

          <NGi span="1" md:span="10">
            <div class="space-y-4">
              <div class="warm-card-static p-5">
                <div class="flex items-start justify-between mb-3">
                  <h1 class="font-title text-2xl text-warm-dark">{{ tool.name }}</h1>
                  <StatusBadge :status="tool.status" type="tool" />
                </div>
                <div class="space-y-2 text-sm text-warm-dark/70">
                  <p><span class="text-warm-dark/40">分类：</span>{{ tool.category_name || '未分类' }}</p>
                  <p><span class="text-warm-dark/40">押金：</span><span class="text-warm-orange font-bold text-lg">¥{{ tool.deposit }}</span></p>
                  <p><span class="text-warm-dark/40">借用次数：</span>{{ tool.borrow_count || 0 }} 次</p>
                </div>
                <div class="mt-4 pt-4 border-t border-warm-brown/10">
                  <p class="text-sm text-warm-dark/60">{{ tool.description || '暂无描述' }}</p>
                </div>
              </div>

              <div class="warm-card-static p-5">
                <h3 class="text-sm font-medium text-warm-dark mb-3 flex items-center gap-2">
                  <User :size="16" class="text-warm-brown" /> 发布者信息
                </h3>
                <div class="flex items-center gap-3">
                  <NAvatar v-if="tool.user_avatar" :src="tool.user_avatar" :size="40" round />
                  <NAvatar v-else :size="40" round class="bg-warm-orange/10 text-warm-orange">
                    {{ tool.user_name?.[0] || '?' }}
                  </NAvatar>
                  <div>
                    <p class="font-medium text-warm-dark">{{ tool.user_name || '匿名' }}</p>
                    <p class="text-xs text-warm-dark/40">贡献积分：{{ tool.user_points || 0 }}</p>
                  </div>
                </div>
              </div>

              <div class="warm-card-static p-5" v-if="tool.status === 1">
                <h3 class="text-sm font-medium text-warm-dark mb-3 flex items-center gap-2">
                  <Shield :size="16" class="text-warm-orange" /> 借用申请
                </h3>
                <div class="space-y-3">
                  <NDatePicker
                    v-model:value="dateRange"
                    type="daterange"
                    clearable
                    class="w-full"
                    placeholder="选择借用时间段"
                  />
                  <NButton
                    type="primary"
                    block
                    :loading="submitting"
                    @click="submitBorrow"
                    class="warm-btn"
                  >
                    提交借用申请
                  </NButton>
                </div>
              </div>
              <div v-else-if="tool.status !== 1" class="warm-card-static p-5 text-center text-warm-dark/40">
                该工具当前不可借用
              </div>
            </div>
          </NGi>
        </NGrid>

        <section v-if="relatedTools.length" class="mt-12">
          <h2 class="section-title mb-4">相关工具</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ToolCard v-for="t in relatedTools" :key="t.id" :tool="t" />
          </div>
        </section>
      </template>
      <NEmpty v-else-if="!loading" description="工具不存在" class="py-12" />
    </NSpin>
  </div>
</template>
