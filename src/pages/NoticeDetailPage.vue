<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NSpin, NButton, NEmpty } from 'naive-ui'
import { ArrowLeft, Calendar, User } from 'lucide-vue-next'
import { useApi } from '@/composables/useApi'

const { api } = useApi()
const route = useRoute()
const router = useRouter()

const loading = ref(true)
const notice = ref<any>(null)

const fetchNotice = async () => {
  loading.value = true
  try {
    const { data } = await api.get(`/notices/${route.params.id}`)
    notice.value = data.data
  } catch { /* ignore */ }
  loading.value = false
}

onMounted(fetchNotice)
</script>

<template>
  <div class="container mx-auto px-4 py-6 animate-fade-in">
    <NSpin :show="loading">
      <template v-if="notice">
        <div class="mb-4">
          <NButton quaternary @click="router.back()">
            <template #icon><ArrowLeft :size="16" /></template> 返回
          </NButton>
        </div>
        <div class="warm-card-static p-6 md:p-8 max-w-3xl mx-auto">
          <h1 class="font-title text-2xl text-warm-dark mb-4">{{ notice.title }}</h1>
          <div class="flex items-center gap-4 text-sm text-warm-dark/40 mb-6 pb-4 border-b border-warm-brown/10">
            <span class="flex items-center gap-1">
              <User :size="14" /> {{ notice.author_name || '管理员' }}
            </span>
            <span class="flex items-center gap-1">
              <Calendar :size="14" /> {{ notice.created_at?.slice(0, 10) }}
            </span>
          </div>
          <div class="text-warm-dark/80 leading-relaxed whitespace-pre-wrap">{{ notice.content }}</div>
        </div>
      </template>
      <NEmpty v-else-if="!loading" description="公告不存在" class="py-12" />
    </NSpin>
  </div>
</template>
