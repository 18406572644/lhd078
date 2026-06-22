<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NSpin, NPagination, NEmpty } from 'naive-ui'
import { Megaphone } from 'lucide-vue-next'
import NoticeCard from '@/components/NoticeCard.vue'
import { useApi } from '@/composables/useApi'

const { api } = useApi()

const loading = ref(true)
const notices = ref<any[]>([])
const pinnedNotices = ref<any[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const fetchNotices = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/notices', { params: { page: page.value, pageSize: pageSize.value } })
    const list = data.data || []
    pinnedNotices.value = list.filter((n: any) => n.is_top === 1)
    notices.value = list.filter((n: any) => n.is_top !== 1)
    total.value = list.length
  } catch { /* ignore */ }
  loading.value = false
}

const handlePageChange = (p: number) => {
  page.value = p
  fetchNotices()
}

onMounted(fetchNotices)
</script>

<template>
  <div class="container mx-auto px-4 py-6 animate-fade-in">
    <h1 class="font-title text-2xl text-warm-dark mb-6 flex items-center gap-2">
      <Megaphone :size="24" class="text-warm-orange" /> 公告栏
    </h1>

    <NSpin :show="loading">
      <section v-if="pinnedNotices.length" class="mb-8">
        <h2 class="section-title mb-4">置顶公告</h2>
        <div class="space-y-3">
          <NoticeCard v-for="notice in pinnedNotices" :key="notice.id" :notice="notice" />
        </div>
      </section>

      <section>
        <h2 v-if="pinnedNotices.length" class="section-title mb-4">全部公告</h2>
        <div class="space-y-3">
          <NoticeCard v-for="notice in notices" :key="notice.id" :notice="notice" />
        </div>
        <NEmpty v-if="!notices.length && !pinnedNotices.length && !loading" description="暂无公告" class="py-12" />
      </section>
    </NSpin>

    <div class="flex justify-center mt-6" v-if="total > pageSize">
      <NPagination :page="page" :page-count="Math.ceil(total / pageSize)" @update:page="handlePageChange" />
    </div>
  </div>
</template>
