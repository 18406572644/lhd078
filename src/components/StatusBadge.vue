<script setup lang="ts">
import { NTag } from 'naive-ui'
import { computed } from 'vue'

const props = defineProps<{
  status: string | number
  type?: 'tool' | 'borrow' | 'help' | 'deposit' | 'damage' | 'violation'
}>()

const statusMap: Record<string, Record<string | number, { label: string; color: string }>> = {
  tool: {
    0: { label: '待审核', color: 'warning' },
    1: { label: '可用', color: 'success' },
    2: { label: '借出', color: 'info' },
    3: { label: '下架', color: 'default' },
  },
  borrow: {
    0: { label: '待审批', color: 'warning' },
    1: { label: '进行中', color: 'info' },
    2: { label: '已归还', color: 'success' },
    3: { label: '已逾期', color: 'error' },
    4: { label: '损坏', color: 'error' },
  },
  help: {
    0: { label: '待帮助', color: 'warning' },
    1: { label: '进行中', color: 'info' },
    2: { label: '已完成', color: 'success' },
  },
  deposit: {
    0: { label: '未支付', color: 'default' },
    1: { label: '已支付', color: 'success' },
    2: { label: '已退还', color: 'info' },
    3: { label: '已扣款', color: 'error' },
  },
  damage: {
    0: { label: '待处理', color: 'warning' },
    1: { label: '已赔偿', color: 'success' },
    2: { label: '已驳回', color: 'error' },
  },
  violation: {
    0: { label: '处理中', color: 'warning' },
    1: { label: '已处理', color: 'success' },
  },
}

const config = computed(() => {
  const t = props.type || 'tool'
  const map = statusMap[t] || statusMap.tool
  return map[props.status] || { label: String(props.status), color: 'default' }
})
</script>

<template>
  <NTag :type="(config.color as any)" size="small" round :bordered="false">
    {{ config.label }}
  </NTag>
</template>
