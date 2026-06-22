<script setup lang="ts">
import { NTag, NAvatar } from 'naive-ui'
import StatusBadge from './StatusBadge.vue'

defineProps<{
  help: {
    id: number
    title: string
    description: string
    urgency: number
    status: number
    user_name?: string
    user_avatar?: string
    created_at?: string
  }
}>()

const emit = defineEmits<{
  respond: [id: number]
}>()

const urgencyMap: Record<number, { label: string; type: string }> = {
  1: { label: '普通', type: 'default' },
  2: { label: '紧急', type: 'warning' },
  3: { label: '非常紧急', type: 'error' },
}
</script>

<template>
  <div class="warm-card p-4 flex flex-col gap-3">
    <div class="flex items-start justify-between">
      <h3 class="font-medium text-warm-dark text-base leading-snug flex-1 mr-2 line-clamp-2">{{ help.title }}</h3>
      <NTag :type="(urgencyMap[help.urgency]?.type as any)" size="small" :bordered="false">
        {{ urgencyMap[help.urgency]?.label || '普通' }}
      </NTag>
    </div>
    <p class="text-sm text-warm-dark/60 line-clamp-2">{{ help.description }}</p>
    <div class="flex items-center justify-between mt-auto pt-2 border-t border-warm-brown/10">
      <div class="flex items-center gap-2">
        <NAvatar v-if="help.user_avatar" :src="help.user_avatar" :size="22" round />
        <NAvatar v-else :size="22" round class="bg-warm-brown/20 text-warm-dark text-xs">
          {{ help.user_name?.[0] || '?' }}
        </NAvatar>
        <span class="text-xs text-warm-dark/50">{{ help.user_name || '匿名' }}</span>
        <StatusBadge :status="help.status" type="help" />
      </div>
      <button
        v-if="help.status === 0"
        class="text-xs px-3 py-1 rounded-md bg-warm-orange/10 text-warm-orange hover:bg-warm-orange/20 transition-colors"
        @click="emit('respond', help.id)"
      >
        响应帮助
      </button>
    </div>
  </div>
</template>
