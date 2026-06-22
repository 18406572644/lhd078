<script setup lang="ts">
import { NCard, NTag, NAvatar } from 'naive-ui'
import { MapPin } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import StatusBadge from './StatusBadge.vue'

const props = defineProps<{
  tool: {
    id: number
    name: string
    category_name?: string
    status: number
    deposit: number
    images?: string
    user_name?: string
    user_avatar?: string
    borrow_count?: number
  }
}>()

const router = useRouter()

const getImage = () => {
  try {
    const imgs = JSON.parse(props.tool.images || '[]')
    return imgs[0] || ''
  } catch {
    return ''
  }
}
</script>

<template>
  <div
    class="warm-card overflow-hidden cursor-pointer group"
    @click="router.push({ name: 'toolDetail', params: { id: tool.id } })"
  >
    <div class="h-40 bg-warm-brown/10 overflow-hidden relative">
      <img
        v-if="getImage()"
        :src="getImage()"
        :alt="tool.name"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div v-else class="w-full h-full flex items-center justify-center">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" class="text-warm-brown/30">
          <path d="M24 8L8 20H12V40H22V30H26V40H36V20H40L24 8Z" stroke="currentColor" stroke-width="2" fill="none"/>
        </svg>
      </div>
      <div class="absolute top-2 left-2">
        <NTag size="small" :bordered="false" class="bg-warm-orange/90 text-white">
          {{ tool.category_name || '未分类' }}
        </NTag>
      </div>
      <div class="absolute top-2 right-2">
        <StatusBadge :status="tool.status" type="tool" />
      </div>
    </div>
    <div class="p-4">
      <h3 class="font-medium text-warm-dark text-base mb-2 truncate">{{ tool.name }}</h3>
      <div class="flex items-center justify-between">
        <span class="text-warm-orange font-bold">押金 ¥{{ tool.deposit }}</span>
        <div class="flex items-center gap-1 text-warm-dark/50 text-xs">
          <NAvatar v-if="tool.user_avatar" :src="tool.user_avatar" :size="18" round />
          <span>{{ tool.user_name || '匿名' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
