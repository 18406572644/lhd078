<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NInput, NButton, NTag, NSpin, NPagination, NSpace, NGrid, NGi, NEmpty } from 'naive-ui'
import { Search, SlidersHorizontal } from 'lucide-vue-next'
import ToolCard from '@/components/ToolCard.vue'
import { useApi } from '@/composables/useApi'

const { api } = useApi()
const route = useRoute()
const router = useRouter()

const loading = ref(false)
const tools = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(12)
const keyword = ref((route.query.keyword as string) || '')
const categoryId = ref<number | null>(null)
const sort = ref('latest')

const categories = [
  { id: null, name: '全部' },
  { id: 1, name: '电动工具' },
  { id: 2, name: '家用工具' },
  { id: 3, name: '户外装备' },
  { id: 4, name: '园林工具' },
  { id: 5, name: '维修工具' },
  { id: 6, name: '其他' },
]

const sortOptions = [
  { label: '最新', value: 'latest' },
  { label: '最热', value: 'hot' },
  { label: '押金低到高', value: 'deposit_asc' },
]

const fetchTools = async () => {
  loading.value = true
  try {
    const params: any = { page: page.value, pageSize: pageSize.value, sort: sort.value }
    if (keyword.value && keyword.value.trim()) params.keyword = keyword.value.trim()
    if (categoryId.value !== null) params.category_id = categoryId.value
    const { data } = await api.get('/tools', { params })
    const result = data.data || data || []
    tools.value = Array.isArray(result) ? result : []
    total.value = data.total !== undefined ? Number(data.total) : tools.value.length
  } catch { /* ignore */ }
  loading.value = false
}

const handleSearch = () => {
  page.value = 1
  fetchTools()
}

const selectCategory = (id: number | null) => {
  categoryId.value = id
  page.value = 1
  fetchTools()
}

const changeSort = (s: string) => {
  sort.value = s
  page.value = 1
  fetchTools()
}

const handlePageChange = (p: number) => {
  page.value = p
  fetchTools()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(fetchTools)
watch(() => route.query.keyword, (val) => {
  if (val) {
    keyword.value = val as string
    fetchTools()
  }
})
</script>

<template>
  <div class="container mx-auto px-4 py-6 animate-fade-in">
    <h1 class="font-title text-2xl text-warm-dark mb-6">工具大厅</h1>

    <div class="warm-card-static p-4 mb-6">
      <div class="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div class="flex gap-2 flex-wrap">
          <NButton
            v-for="cat in categories" :key="cat.id ?? 'all'"
            :type="categoryId === cat.id ? 'primary' : 'default'"
            size="small"
            round
            @click="selectCategory(cat.id)"
          >
            {{ cat.name }}
          </NButton>
        </div>
        <div class="flex gap-2 flex-1 w-full md:w-auto">
          <NInput v-model:value="keyword" placeholder="搜索工具..." clearable @keyup.enter="handleSearch">
            <template #prefix><Search :size="16" class="text-warm-brown" /></template>
          </NInput>
          <NButton type="primary" @click="handleSearch">搜索</NButton>
        </div>
        <div class="flex gap-1">
          <NButton
            v-for="opt in sortOptions" :key="opt.value"
            :type="sort === opt.value ? 'primary' : 'default'"
            size="small"
            quaternary
            @click="changeSort(opt.value)"
          >
            {{ opt.label }}
          </NButton>
        </div>
      </div>
    </div>

    <NSpin :show="loading">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        <ToolCard v-for="tool in tools" :key="tool.id" :tool="tool" />
      </div>
      <NEmpty v-if="!tools.length && !loading" description="暂无工具" class="py-12" />
    </NSpin>

    <div class="flex justify-center mt-6" v-if="total > pageSize">
      <NPagination
        :page="page"
        :page-count="Math.ceil(total / pageSize)"
        :page-size="pageSize"
        @update:page="handlePageChange"
      />
    </div>
  </div>
</template>
