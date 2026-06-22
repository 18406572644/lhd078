<script setup lang="ts">
import { NTag } from 'naive-ui'
import { Pin } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

defineProps<{
  notice: {
    id: number
    title: string
    content: string
    is_top: number
    created_at: string
  }
}>()

const router = useRouter()
</script>

<template>
  <div
    class="warm-card p-4 cursor-pointer hover:border-warm-orange/30 transition-colors"
    @click="router.push({ name: 'noticeDetail', params: { id: notice.id } })"
  >
    <div class="flex items-start gap-3">
      <Pin v-if="notice.is_top" :size="16" class="text-warm-orange flex-shrink-0 mt-1" />
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <h3 class="font-medium text-warm-dark truncate">{{ notice.title }}</h3>
          <NTag v-if="notice.is_top" size="small" type="warning" :bordered="false">置顶</NTag>
        </div>
        <p class="text-sm text-warm-dark/50 line-clamp-1">{{ notice.content }}</p>
        <p class="text-xs text-warm-dark/30 mt-2">{{ notice.created_at }}</p>
      </div>
    </div>
  </div>
</template>
