<script setup lang="ts">
import { ref, onMounted, shallowRef } from 'vue'
import { NTabs, NTabPane, NCard, NGrid, NGi, NDataTable, NButton, NSpin, NTag, NSpace } from 'naive-ui'
import { Users, Wrench, Repeat, Activity } from 'lucide-vue-next'
import { useApi } from '@/composables/useApi'
import { useMessage } from 'naive-ui'

const { api } = useApi()
const message = useMessage()

const loading = ref(true)
const activeTab = ref('stats')
const stats = ref({ totalUsers: 0, totalTools: 0, totalBorrows: 0, activeBorrows: 0 })
const users = ref<any[]>([])
const pendingTools = ref<any[]>([])
const violations = ref<any[]>([])
const rankings = ref<any[]>([])

const fetchAdminData = async () => {
  loading.value = true
  try {
    const [statsRes, usersRes, toolsRes, violationsRes, rankRes] = await Promise.allSettled([
      api.get('/admin/stats'),
      api.get('/admin/users'),
      api.get('/admin/tools/pending'),
      api.get('/admin/violations'),
      api.get('/admin/rankings'),
    ])
    if (statsRes.status === 'fulfilled') stats.value = statsRes.value.data?.data || stats.value
    if (usersRes.status === 'fulfilled') users.value = usersRes.value.data?.data || []
    if (toolsRes.status === 'fulfilled') pendingTools.value = toolsRes.value.data?.data || []
    if (violationsRes.status === 'fulfilled') violations.value = violationsRes.value.data?.data || []
    if (rankRes.status === 'fulfilled') rankings.value = rankRes.value.data?.data || []
  } catch { /* ignore */ }
  loading.value = false
}

const toggleUserStatus = async (userId: number, currentStatus: number) => {
  try {
    await api.put(`/admin/users/${userId}`, { status: currentStatus === 1 ? 0 : 1 })
    message.success('操作成功')
    fetchAdminData()
  } catch (e: any) {
    message.error(e.response?.data?.message || '操作失败')
  }
}

const auditTool = async (toolId: number, approved: boolean) => {
  try {
    await api.put(`/admin/tools/${toolId}/audit`, { approved })
    message.success(approved ? '已通过' : '已拒绝')
    fetchAdminData()
  } catch (e: any) {
    message.error(e.response?.data?.message || '操作失败')
  }
}

const statCards = [
  { key: 'totalUsers', label: '总用户', icon: Users, color: 'text-warm-orange' },
  { key: 'totalTools', label: '总工具', icon: Wrench, color: 'text-warm-green' },
  { key: 'totalBorrows', label: '总借用', icon: Repeat, color: 'text-warm-brown' },
  { key: 'activeBorrows', label: '活跃借用', icon: Activity, color: 'text-blue-500' },
] as const

onMounted(fetchAdminData)
</script>

<template>
  <div class="container mx-auto px-4 py-6 animate-fade-in">
    <h1 class="font-title text-2xl text-warm-dark mb-6">后台管理</h1>

    <NTabs type="line" animated v-model:value="activeTab">
      <NTabPane name="stats" tab="数据统计">
        <NSpin :show="loading">
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 mt-4">
            <div v-for="card in statCards" :key="card.key" class="warm-card-static p-5">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-warm-orange/10 flex items-center justify-center">
                  <component :is="card.icon" :size="20" :class="card.color" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-warm-dark">{{ stats[card.key] }}</p>
                  <p class="text-xs text-warm-dark/40">{{ card.label }}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="warm-card-static p-6">
            <h3 class="font-medium text-warm-dark mb-4">贡献排行</h3>
            <div class="space-y-2">
              <div v-for="(user, idx) in rankings" :key="user.id"
                class="flex items-center gap-3 py-2 border-b border-warm-brown/10 last:border-0">
                <span class="w-6 text-center font-medium text-warm-orange">{{ idx + 1 }}</span>
                <span class="flex-1 text-sm text-warm-dark">{{ user.name }}</span>
                <span class="text-sm text-warm-orange">{{ user.points }} 积分</span>
              </div>
            </div>
          </div>
        </NSpin>
      </NTabPane>

      <NTabPane name="users" tab="用户管理">
        <NSpin :show="loading" class="mt-4">
          <div class="space-y-3">
            <div v-for="user in users" :key="user.id" class="warm-card-static p-4 flex items-center justify-between">
              <div>
                <span class="font-medium text-warm-dark">{{ user.name }}</span>
                <span class="text-sm text-warm-dark/40 ml-2">{{ user.phone }}</span>
                <NTag v-if="user.role === 1" size="small" type="warning" :bordered="false" class="ml-2">管理员</NTag>
              </div>
              <NButton
                :type="user.status === 1 ? 'error' : 'success'"
                size="small"
                @click="toggleUserStatus(user.id, user.status)"
              >
                {{ user.status === 1 ? '禁用' : '启用' }}
              </NButton>
            </div>
          </div>
        </NSpin>
      </NTabPane>

      <NTabPane name="audit" tab="工具审核">
        <NSpin :show="loading" class="mt-4">
          <div class="space-y-3">
            <div v-for="tool in pendingTools" :key="tool.id" class="warm-card-static p-4">
              <div class="flex items-center justify-between">
                <div>
                  <span class="font-medium text-warm-dark">{{ tool.name }}</span>
                  <span class="text-sm text-warm-dark/40 ml-2">发布者：{{ tool.user_name || '未知' }}</span>
                </div>
                <NSpace>
                  <NButton type="success" size="small" @click="auditTool(tool.id, true)">通过</NButton>
                  <NButton type="error" size="small" @click="auditTool(tool.id, false)">拒绝</NButton>
                </NSpace>
              </div>
              <p class="text-sm text-warm-dark/50 mt-2">{{ tool.description || '暂无描述' }}</p>
            </div>
            <div v-if="!pendingTools.length && !loading" class="warm-card-static p-8 text-center text-warm-dark/40">
              暂无待审核工具
            </div>
          </div>
        </NSpin>
      </NTabPane>

      <NTabPane name="violations" tab="违规处理">
        <NSpin :show="loading" class="mt-4">
          <div class="space-y-3">
            <div v-for="v in violations" :key="v.id" class="warm-card-static p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-warm-dark">违规类型：{{ v.target_type }}</span>
                <NTag :type="v.status === 0 ? 'warning' : 'success'" size="small" :bordered="false">
                  {{ v.status === 0 ? '处理中' : '已处理' }}
                </NTag>
              </div>
              <p class="text-sm text-warm-dark/50">{{ v.reason }}</p>
            </div>
            <div v-if="!violations.length && !loading" class="warm-card-static p-8 text-center text-warm-dark/40">
              暂无违规记录
            </div>
          </div>
        </NSpin>
      </NTabPane>
    </NTabs>
  </div>
</template>
