<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { NButton, NTabs, NTabPane, NModal, NForm, NFormItem, NInput, NSelect, NSpin, NEmpty } from 'naive-ui'
import { Plus, Heart } from 'lucide-vue-next'
import HelpCard from '@/components/HelpCard.vue'
import { useApi } from '@/composables/useApi'
import { useMessage } from 'naive-ui'

const { api } = useApi()
const message = useMessage()

const loading = ref(true)
const helpRequests = ref<any[]>([])
const activeTab = ref('all')
const urgencyFilter = ref<number | null>(null)
const showModal = ref(false)
const submitting = ref(false)

const form = ref({
  title: '',
  description: '',
  urgency: 1,
})

const urgencyOptions = [
  { label: '普通', value: 1 },
  { label: '紧急', value: 2 },
  { label: '非常紧急', value: 3 },
]

const filteredList = computed(() => {
  let list = helpRequests.value
  if (activeTab.value !== 'all') {
    const statusMap: Record<string, number> = { pending: 0, active: 1, completed: 2 }
    list = list.filter((h: any) => h.status === statusMap[activeTab.value])
  }
  if (urgencyFilter.value) {
    list = list.filter((h: any) => h.urgency === urgencyFilter.value)
  }
  return list
})

const fetchHelp = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/help-requests')
    helpRequests.value = data.data || []
  } catch { /* ignore */ }
  loading.value = false
}

const submitHelp = async () => {
  if (!form.value.title || !form.value.description) {
    message.warning('请填写完整信息')
    return
  }
  submitting.value = true
  try {
    await api.post('/help-requests', form.value)
    message.success('发布成功')
    showModal.value = false
    form.value = { title: '', description: '', urgency: 1 }
    fetchHelp()
  } catch (e: any) {
    message.error(e.response?.data?.message || '发布失败')
  }
  submitting.value = false
}

const handleRespond = async (id: number) => {
  try {
    await api.post(`/help-requests/${id}/respond`)
    message.success('已响应帮助')
    fetchHelp()
  } catch (e: any) {
    message.error(e.response?.data?.message || '响应失败')
  }
}

onMounted(fetchHelp)
</script>

<template>
  <div class="container mx-auto px-4 py-6 animate-fade-in">
    <div class="flex items-center justify-between mb-6">
      <h1 class="font-title text-2xl text-warm-dark flex items-center gap-2">
        <Heart :size="24" class="text-warm-orange" /> 互助广场
      </h1>
      <NButton type="primary" @click="showModal = true" class="warm-btn">
        <template #icon><Plus :size="16" /></template> 发布求助
      </NButton>
    </div>

    <div class="warm-card-static p-4 mb-6">
      <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <NTabs type="segment" v-model:value="activeTab" size="small">
          <NTabPane name="all" tab="全部" />
          <NTabPane name="pending" tab="待帮助" />
          <NTabPane name="active" tab="进行中" />
          <NTabPane name="completed" tab="已完成" />
        </NTabs>
        <div class="flex gap-2">
          <NButton
            v-for="opt in [{ label: '全部', value: null }, ...urgencyOptions]"
            :key="opt.value ?? 'all'"
            :type="urgencyFilter === opt.value ? 'primary' : 'default'"
            size="small"
            round
            @click="urgencyFilter = opt.value"
          >
            {{ opt.label }}
          </NButton>
        </div>
      </div>
    </div>

    <NSpin :show="loading">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <HelpCard
          v-for="help in filteredList" :key="help.id" :help="help"
          @respond="handleRespond"
        />
      </div>
      <NEmpty v-if="!filteredList.length && !loading" description="暂无互助信息" class="py-12" />
    </NSpin>

    <NModal v-model:show="showModal" preset="card" title="发布求助" class="max-w-md" :bordered="false">
      <NForm>
        <NFormItem label="标题">
          <NInput v-model:value="form.title" placeholder="请输入求助标题" />
        </NFormItem>
        <NFormItem label="描述">
          <NInput v-model:value="form.description" type="textarea" :rows="4" placeholder="请描述您的需求" />
        </NFormItem>
        <NFormItem label="紧急程度">
          <NSelect v-model:value="form.urgency" :options="urgencyOptions" />
        </NFormItem>
      </NForm>
      <template #action>
        <NButton type="primary" :loading="submitting" @click="submitHelp" class="warm-btn">提交</NButton>
      </template>
    </NModal>
  </div>
</template>
