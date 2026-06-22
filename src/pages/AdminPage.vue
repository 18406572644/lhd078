<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount, shallowRef, watch } from 'vue'
import { NTabs, NTabPane, NCard, NGrid, NGi, NDataTable, NButton, NSpin, NTag, NSpace, NModal, NForm, NFormItem, NInput, NInputNumber, NSelect, NDatePicker } from 'naive-ui'
import { Users, Wrench, Repeat, Activity, TrendingUp, PieChart, Calendar, Store, Gift, Plus, Edit2, Trash2, Coins } from 'lucide-vue-next'
import { useApi } from '@/composables/useApi'
import { useMessage } from 'naive-ui'
import * as echarts from 'echarts/core'
import type { EChartsCoreOption } from 'echarts/core'
import { LineChart, PieChart as EChartsPieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent
} from 'echarts/components'
import { LabelLayout, UniversalTransition } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  LineChart,
  EChartsPieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LabelLayout,
  UniversalTransition,
  CanvasRenderer
])

const { api } = useApi()
const message = useMessage()

const loading = ref(true)
const activeTab = ref('stats')
const stats = ref({
  totalUsers: 0,
  totalTools: 0,
  totalBorrows: 0,
  activeBorrows: 0,
  toolPublishTrend: [] as { date: string; count: number }[],
  borrowTrend: [] as { date: string; count: number }[],
  categoryBorrowStats: [] as { id: number; name: string; count: number }[]
})
const users = ref<any[]>([])
const pendingTools = ref<any[]>([])
const violations = ref<any[]>([])
const rankings = ref<any[]>([])
const activities = ref<any[]>([])
const shopItems = ref<any[]>([])
const redemptions = ref<any[]>([])

const showActivityModal = ref(false)
const activityForm = ref<any>({
  id: null,
  title: '',
  description: '',
  image: '',
  location: '',
  start_time: null,
  end_time: null,
  max_participants: 50,
  points_reward: 20,
  status: 1,
})
const activityModalLoading = ref(false)

const showItemModal = ref(false)
const itemForm = ref<any>({
  id: null,
  name: '',
  description: '',
  image: '',
  points_cost: 0,
  stock: 100,
  category: 'physical',
  status: 1,
})
const itemModalLoading = ref(false)

const activityDetail = ref<any>(null)
const showActivityDetailModal = ref(false)

const publishTrendChartRef = shallowRef<HTMLDivElement | null>(null)
const borrowTrendChartRef = shallowRef<HTMLDivElement | null>(null)
const categoryPieChartRef = shallowRef<HTMLDivElement | null>(null)

let publishTrendChart: echarts.ECharts | null = null
let borrowTrendChart: echarts.ECharts | null = null
let categoryPieChart: echarts.ECharts | null = null

const getLast30Days = () => {
  const dates: string[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

const last30Days = computed(() => getLast30Days())

const fillMissingDates = (data: { date: string; count: number }[]) => {
  const dateMap = new Map(data.map(d => [d.date, d.count]))
  return last30Days.value.map(date => ({
    date,
    count: dateMap.get(date) || 0
  }))
}

const initPublishTrendChart = () => {
  if (!publishTrendChartRef.value) return
  publishTrendChart = echarts.init(publishTrendChartRef.value)
  updatePublishTrendChart()
}

const updatePublishTrendChart = () => {
  if (!publishTrendChart) return
  const filledData = fillMissingDates(stats.value.toolPublishTrend)
  const option: EChartsCoreOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e8d5c4',
      textStyle: { color: '#5a4a3a' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: filledData.map(d => d.date.slice(5)),
      axisLine: { lineStyle: { color: '#e8d5c4' } },
      axisLabel: { color: '#9a8a7a', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f5ebe0', type: 'dashed' } },
      axisLabel: { color: '#9a8a7a', fontSize: 11 }
    },
    series: [{
      name: '工具发布数',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      itemStyle: { color: '#f4a261' },
      lineStyle: { color: '#f4a261', width: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(244, 162, 97, 0.3)' },
          { offset: 1, color: 'rgba(244, 162, 97, 0.05)' }
        ])
      },
      data: filledData.map(d => d.count)
    }]
  }
  publishTrendChart.setOption(option)
}

const initBorrowTrendChart = () => {
  if (!borrowTrendChartRef.value) return
  borrowTrendChart = echarts.init(borrowTrendChartRef.value)
  updateBorrowTrendChart()
}

const updateBorrowTrendChart = () => {
  if (!borrowTrendChart) return
  const filledData = fillMissingDates(stats.value.borrowTrend)
  const option: EChartsCoreOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e8d5c4',
      textStyle: { color: '#5a4a3a' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: filledData.map(d => d.date.slice(5)),
      axisLine: { lineStyle: { color: '#e8d5c4' } },
      axisLabel: { color: '#9a8a7a', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f5ebe0', type: 'dashed' } },
      axisLabel: { color: '#9a8a7a', fontSize: 11 }
    },
    series: [{
      name: '借用次数',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      itemStyle: { color: '#2a9d8f' },
      lineStyle: { color: '#2a9d8f', width: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(42, 157, 143, 0.3)' },
          { offset: 1, color: 'rgba(42, 157, 143, 0.05)' }
        ])
      },
      data: filledData.map(d => d.count)
    }]
  }
  borrowTrendChart.setOption(option)
}

const initCategoryPieChart = () => {
  if (!categoryPieChartRef.value) return
  categoryPieChart = echarts.init(categoryPieChartRef.value)
  updateCategoryPieChart()
}

const updateCategoryPieChart = () => {
  if (!categoryPieChart) return
  const pieData = stats.value.categoryBorrowStats
    .filter(c => c.count > 0)
    .map(c => ({ name: c.name, value: c.count }))

  const colors = ['#f4a261', '#2a9d8f', '#e76f51', '#264653', '#e9c46a', '#8ab17d']

  const option: EChartsCoreOption = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e8d5c4',
      textStyle: { color: '#5a4a3a' },
      formatter: '{b}: {c}次 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: '#5a4a3a', fontSize: 12 },
      itemWidth: 12,
      itemHeight: 12
    },
    color: colors,
    series: [{
      name: '分类借用',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 6,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold',
          color: '#5a4a3a'
        }
      },
      labelLine: {
        show: false
      },
      data: pieData.length > 0 ? pieData : [{ name: '暂无数据', value: 1, itemStyle: { color: '#e8d5c4' } }]
    }]
  }
  categoryPieChart.setOption(option)
}

const handleResize = () => {
  publishTrendChart?.resize()
  borrowTrendChart?.resize()
  categoryPieChart?.resize()
}

const fetchAdminData = async () => {
  loading.value = true
  try {
    const [statsRes, usersRes, toolsRes, violationsRes, rankRes, actsRes, itemsRes, redeemRes] = await Promise.allSettled([
      api.get('/admin/stats'),
      api.get('/admin/users'),
      api.get('/admin/tools/pending'),
      api.get('/admin/violations'),
      api.get('/admin/rankings'),
      api.get('/activities'),
      api.get('/shop/items'),
      api.get('/shop/redemptions'),
    ])
    if (statsRes.status === 'fulfilled') {
      const data = statsRes.value.data?.data
      stats.value = {
        totalUsers: data?.totalUsers || 0,
        totalTools: data?.totalTools || 0,
        totalBorrows: data?.totalBorrows || 0,
        activeBorrows: data?.activeBorrows || 0,
        toolPublishTrend: data?.toolPublishTrend || [],
        borrowTrend: data?.borrowTrend || [],
        categoryBorrowStats: data?.categoryBorrowStats || []
      }
    }
    if (usersRes.status === 'fulfilled') users.value = usersRes.value.data?.data || []
    if (toolsRes.status === 'fulfilled') pendingTools.value = toolsRes.value.data?.data || []
    if (violationsRes.status === 'fulfilled') violations.value = violationsRes.value.data?.data || []
    if (rankRes.status === 'fulfilled') rankings.value = rankRes.value.data?.data || []
    if (actsRes.status === 'fulfilled') activities.value = actsRes.value.data?.data || []
    if (itemsRes.status === 'fulfilled') shopItems.value = itemsRes.value.data?.data || []
    if (redeemRes.status === 'fulfilled') redemptions.value = redeemRes.value.data?.data || []
  } catch { /* ignore */ }
  loading.value = false
}

const openCreateActivity = () => {
  activityForm.value = {
    id: null,
    title: '',
    description: '',
    image: '',
    location: '',
    start_time: null,
    end_time: null,
    max_participants: 50,
    points_reward: 20,
    status: 1,
  }
  showActivityModal.value = true
}

const openEditActivity = (act: any) => {
  activityForm.value = {
    id: act.id,
    title: act.title,
    description: act.description,
    image: act.image || '',
    location: act.location,
    start_time: act.start_time ? new Date(act.start_time).getTime() : null,
    end_time: act.end_time ? new Date(act.end_time).getTime() : null,
    max_participants: act.max_participants,
    points_reward: act.points_reward,
    status: act.status,
  }
  showActivityModal.value = true
}

const saveActivity = async () => {
  activityModalLoading.value = true
  try {
    const payload: any = {
      title: activityForm.value.title,
      description: activityForm.value.description,
      image: activityForm.value.image,
      location: activityForm.value.location,
      start_time: activityForm.value.start_time ? new Date(activityForm.value.start_time).toISOString().slice(0, 19).replace('T', ' ') : '',
      end_time: activityForm.value.end_time ? new Date(activityForm.value.end_time).toISOString().slice(0, 19).replace('T', ' ') : '',
      max_participants: activityForm.value.max_participants,
      points_reward: activityForm.value.points_reward,
      status: activityForm.value.status,
    }
    if (activityForm.value.id) {
      await api.put(`/activities/${activityForm.value.id}`, payload)
      message.success('更新成功')
    } else {
      await api.post('/activities', payload)
      message.success('创建成功')
    }
    showActivityModal.value = false
    fetchAdminData()
  } catch (e: any) {
    message.error(e.response?.data?.error || '保存失败')
  }
  activityModalLoading.value = false
}

const deleteActivity = async (id: number) => {
  if (!confirm('确定删除此活动吗？')) return
  try {
    await api.delete(`/activities/${id}`)
    message.success('删除成功')
    fetchAdminData()
  } catch (e: any) {
    message.error(e.response?.data?.error || '删除失败')
  }
}

const openActivityDetail = async (id: number) => {
  try {
    const { data } = await api.get(`/activities/${id}`)
    activityDetail.value = data.data
    showActivityDetailModal.value = true
  } catch {
    message.error('获取活动详情失败')
  }
}

const awardPoints = async (userId: number) => {
  try {
    await api.post(`/activities/${activityDetail.value.id}/award-points`, { user_id: userId })
    message.success('积分已发放')
    openActivityDetail(activityDetail.value.id)
  } catch (e: any) {
    message.error(e.response?.data?.error || '发放失败')
  }
}

const openCreateItem = () => {
  itemForm.value = {
    id: null,
    name: '',
    description: '',
    image: '',
    points_cost: 0,
    stock: 100,
    category: 'physical',
    status: 1,
  }
  showItemModal.value = true
}

const openEditItem = (item: any) => {
  itemForm.value = {
    id: item.id,
    name: item.name,
    description: item.description,
    image: item.image || '',
    points_cost: item.points_cost,
    stock: item.stock,
    category: item.category,
    status: item.status,
  }
  showItemModal.value = true
}

const saveItem = async () => {
  itemModalLoading.value = true
  try {
    const payload = { ...itemForm.value }
    delete payload.id
    if (itemForm.value.id) {
      await api.put(`/shop/items/${itemForm.value.id}`, payload)
      message.success('更新成功')
    } else {
      await api.post('/shop/items', payload)
      message.success('创建成功')
    }
    showItemModal.value = false
    fetchAdminData()
  } catch (e: any) {
    message.error(e.response?.data?.error || '保存失败')
  }
  itemModalLoading.value = false
}

const deleteItem = async (id: number) => {
  if (!confirm('确定删除此商品吗？')) return
  try {
    await api.delete(`/shop/items/${id}`)
    message.success('删除成功')
    fetchAdminData()
  } catch (e: any) {
    message.error(e.response?.data?.error || '删除失败')
  }
}

const updateRedemptionStatus = async (id: number, status: number) => {
  try {
    await api.put(`/shop/redemptions/${id}/status`, { status })
    message.success('更新成功')
    fetchAdminData()
  } catch (e: any) {
    message.error(e.response?.data?.error || '更新失败')
  }
}

const redemptionStatusMap: Record<number, { text: string; type: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
  0: { text: '待领取', type: 'warning' },
  1: { text: '已领取', type: 'success' },
  2: { text: '已取消', type: 'default' },
}

const activityStatusMap: Record<number, { text: string; type: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
  0: { text: '未开放', type: 'default' },
  1: { text: '报名中', type: 'success' },
  2: { text: '进行中', type: 'info' },
  3: { text: '已结束', type: 'warning' },
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

watch(activeTab, (newVal) => {
  if (newVal === 'stats') {
    setTimeout(() => {
      if (!publishTrendChart && publishTrendChartRef.value) initPublishTrendChart()
      else updatePublishTrendChart()
      if (!borrowTrendChart && borrowTrendChartRef.value) initBorrowTrendChart()
      else updateBorrowTrendChart()
      if (!categoryPieChart && categoryPieChartRef.value) initCategoryPieChart()
      else updateCategoryPieChart()
    }, 50)
  }
})

watch(() => stats.value.toolPublishTrend, () => {
  if (activeTab.value === 'stats') updatePublishTrendChart()
}, { deep: true })

watch(() => stats.value.borrowTrend, () => {
  if (activeTab.value === 'stats') updateBorrowTrendChart()
}, { deep: true })

watch(() => stats.value.categoryBorrowStats, () => {
  if (activeTab.value === 'stats') updateCategoryPieChart()
}, { deep: true })

onMounted(() => {
  fetchAdminData()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  publishTrendChart?.dispose()
  borrowTrendChart?.dispose()
  categoryPieChart?.dispose()
})
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
                  <p class="text-2xl font-bold text-warm-dark">{{ (stats as any)[card.key] }}</p>
                  <p class="text-xs text-warm-dark/40">{{ card.label }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div class="warm-card-static p-6">
              <div class="flex items-center gap-2 mb-4">
                <TrendingUp :size="18" class="text-warm-orange" />
                <h3 class="font-medium text-warm-dark">最近30天工具发布趋势</h3>
              </div>
              <div ref="publishTrendChartRef" class="w-full h-64"></div>
            </div>

            <div class="warm-card-static p-6">
              <div class="flex items-center gap-2 mb-4">
                <TrendingUp :size="18" class="text-green-600" />
                <h3 class="font-medium text-warm-dark">最近30天借用趋势</h3>
              </div>
              <div ref="borrowTrendChartRef" class="w-full h-64"></div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="warm-card-static p-6">
              <div class="flex items-center gap-2 mb-4">
                <PieChart :size="18" class="text-warm-orange" />
                <h3 class="font-medium text-warm-dark">分类借用占比</h3>
              </div>
              <div ref="categoryPieChartRef" class="w-full h-64"></div>
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
                <div v-if="!rankings.length && !loading" class="py-4 text-center text-warm-dark/40 text-sm">
                  暂无排行数据
                </div>
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

      <NTabPane name="activities" tab="活动管理">
        <div class="flex justify-end mb-4 mt-4">
          <NButton type="primary" @click="openCreateActivity" class="warm-btn">
            <template #icon><Plus :size="16" /></template>
            新建活动
          </NButton>
        </div>
        <NSpin :show="loading">
          <div class="space-y-3">
            <div v-for="act in activities" :key="act.id" class="warm-card-static p-4">
              <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-medium text-warm-dark">{{ act.title }}</span>
                    <NTag :type="activityStatusMap[act.status]?.type || 'default'" size="small" :bordered="false">
                      {{ activityStatusMap[act.status]?.text || '未知' }}
                    </NTag>
                    <NTag size="small" type="warning" :bordered="false">
                      <Gift :size="10" class="mr-0.5" /> +{{ act.points_reward }}积分
                    </NTag>
                  </div>
                  <p class="text-xs text-warm-dark/50 mb-1">📍 {{ act.location }} | 📅 {{ act.start_time?.slice(0, 16).replace('T', ' ') }} ~ {{ act.end_time?.slice(5, 16).replace('T', ' ') }}</p>
                  <p class="text-xs text-warm-dark/40">报名人数：{{ act.participant_count || 0 }}/{{ act.max_participants }}</p>
                </div>
                <NSpace>
                  <NButton size="small" quaternary type="primary" @click="openActivityDetail(act.id)">
                    <template #icon><Users :size="14" /></template>
                    参与者
                  </NButton>
                  <NButton size="small" quaternary type="primary" @click="openEditActivity(act)">
                    <template #icon><Edit2 :size="14" /></template>
                    编辑
                  </NButton>
                  <NButton size="small" quaternary type="error" @click="deleteActivity(act.id)">
                    <template #icon><Trash2 :size="14" /></template>
                    删除
                  </NButton>
                </NSpace>
              </div>
            </div>
            <div v-if="!activities.length && !loading" class="warm-card-static p-8 text-center text-warm-dark/40">
              暂无活动，点击右上角创建
            </div>
          </div>
        </NSpin>
      </NTabPane>

      <NTabPane name="shop" tab="商品管理">
        <div class="flex justify-end mb-4 mt-4">
          <NButton type="primary" @click="openCreateItem" class="warm-btn">
            <template #icon><Plus :size="16" /></template>
            新建商品
          </NButton>
        </div>
        <NSpin :show="loading">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="item in shopItems" :key="item.id" class="warm-card-static p-4">
              <div class="flex items-start gap-3">
                <div class="w-16 h-16 rounded-lg overflow-hidden bg-warm-brown/10 flex-shrink-0">
                  <img v-if="item.image" :src="item.image" :alt="item.name" class="w-full h-full object-cover" />
                  <Gift v-else :size="24" class="w-full h-full text-warm-orange/40 p-3" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-medium text-warm-dark text-sm">{{ item.name }}</span>
                    <NTag size="small" :type="item.category === 'service' ? 'info' : 'warning'" :bordered="false">
                      {{ item.category === 'service' ? '服务' : '实物' }}
                    </NTag>
                  </div>
                  <p class="text-warm-orange font-bold flex items-center gap-0.5">
                    <Coins :size="12" /> {{ item.points_cost }}
                  </p>
                  <p class="text-xs text-warm-dark/40">库存：{{ item.stock }} | 状态：{{ item.status === 1 ? '上架' : '下架' }}</p>
                </div>
              </div>
              <div class="flex justify-end gap-2 mt-3">
                <NButton size="small" quaternary type="primary" @click="openEditItem(item)">
                  <template #icon><Edit2 :size="14" /></template>
                  编辑
                </NButton>
                <NButton size="small" quaternary type="error" @click="deleteItem(item.id)">
                  <template #icon><Trash2 :size="14" /></template>
                  删除
                </NButton>
              </div>
            </div>
            <div v-if="!shopItems.length && !loading" class="md:col-span-2 lg:col-span-3 warm-card-static p-8 text-center text-warm-dark/40">
              暂无商品，点击右上角创建
            </div>
          </div>
        </NSpin>
      </NTabPane>

      <NTabPane name="redemptions" tab="兑换管理">
        <NSpin :show="loading" class="mt-4">
          <div class="space-y-3">
            <div v-for="r in redemptions" :key="r.id" class="warm-card-static p-4">
              <div class="flex items-center justify-between">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-medium text-warm-dark">{{ r.item_name }}</span>
                    <NTag :type="redemptionStatusMap[r.status]?.type || 'default'" size="small" :bordered="false">
                      {{ redemptionStatusMap[r.status]?.text || '未知' }}
                    </NTag>
                  </div>
                  <p class="text-xs text-warm-dark/50">
                    兑换人：{{ r.user_name }} ({{ r.user_phone }}) | 数量：{{ r.quantity }} | 消耗积分：<span class="text-warm-orange font-medium">{{ r.points_cost * r.quantity }}</span>
                  </p>
                  <p class="text-xs text-warm-dark/30 mt-0.5">{{ r.created_at?.slice(0, 16).replace('T', ' ') }}</p>
                </div>
                <NButton v-if="r.status === 0" size="small" type="success" @click="updateRedemptionStatus(r.id, 1)">
                  标记已领取
                </NButton>
              </div>
            </div>
            <div v-if="!redemptions.length && !loading" class="warm-card-static p-8 text-center text-warm-dark/40">
              暂无兑换记录
            </div>
          </div>
        </NSpin>
      </NTabPane>
    </NTabs>

    <NModal v-model:show="showActivityModal" preset="card" :title="activityForm.id ? '编辑活动' : '新建活动'" style="max-width: 560px">
      <NForm label-placement="left" label-width="90px">
        <NFormItem label="活动标题" required>
          <NInput v-model:value="activityForm.title" placeholder="请输入活动标题" />
        </NFormItem>
        <NFormItem label="活动描述" required>
          <NInput v-model:value="activityForm.description" type="textarea" :rows="3" placeholder="请输入活动描述" />
        </NFormItem>
        <NFormItem label="活动图片">
          <NInput v-model:value="activityForm.image" placeholder="图片URL（可选）" />
        </NFormItem>
        <NFormItem label="活动地点" required>
          <NInput v-model:value="activityForm.location" placeholder="请输入活动地点" />
        </NFormItem>
        <div class="grid grid-cols-2 gap-3">
          <NFormItem label="开始时间" required>
            <NDatePicker v-model:value="activityForm.start_time" type="datetime" style="width: 100%" />
          </NFormItem>
          <NFormItem label="结束时间" required>
            <NDatePicker v-model:value="activityForm.end_time" type="datetime" style="width: 100%" />
          </NFormItem>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <NFormItem label="人数上限">
            <NInputNumber v-model:value="activityForm.max_participants" :min="1" style="width: 100%" />
          </NFormItem>
          <NFormItem label="积分奖励">
            <NInputNumber v-model:value="activityForm.points_reward" :min="0" style="width: 100%" />
          </NFormItem>
        </div>
        <NFormItem label="活动状态">
          <NSelect v-model:value="activityForm.status" :options="[
            { label: '未开放', value: 0 },
            { label: '报名中', value: 1 },
            { label: '进行中', value: 2 },
            { label: '已结束', value: 3 },
          ]" />
        </NFormItem>
      </NForm>
      <template #footer>
        <div class="flex justify-end gap-2">
          <NButton @click="showActivityModal = false">取消</NButton>
          <NButton type="primary" :loading="activityModalLoading" @click="saveActivity" class="warm-btn">保存</NButton>
        </div>
      </template>
    </NModal>

    <NModal v-model:show="showItemModal" preset="card" :title="itemForm.id ? '编辑商品' : '新建商品'" style="max-width: 520px">
      <NForm label-placement="left" label-width="90px">
        <NFormItem label="商品名称" required>
          <NInput v-model:value="itemForm.name" placeholder="请输入商品名称" />
        </NFormItem>
        <NFormItem label="商品描述" required>
          <NInput v-model:value="itemForm.description" type="textarea" :rows="2" placeholder="请输入商品描述" />
        </NFormItem>
        <NFormItem label="商品图片">
          <NInput v-model:value="itemForm.image" placeholder="图片URL（可选）" />
        </NFormItem>
        <div class="grid grid-cols-2 gap-3">
          <NFormItem label="所需积分" required>
            <NInputNumber v-model:value="itemForm.points_cost" :min="0" style="width: 100%" />
          </NFormItem>
          <NFormItem label="库存数量" required>
            <NInputNumber v-model:value="itemForm.stock" :min="0" style="width: 100%" />
          </NFormItem>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <NFormItem label="商品分类">
            <NSelect v-model:value="itemForm.category" :options="[
              { label: '实物商品', value: 'physical' },
              { label: '服务兑换', value: 'service' },
            ]" />
          </NFormItem>
          <NFormItem label="商品状态">
            <NSelect v-model:value="itemForm.status" :options="[
              { label: '上架', value: 1 },
              { label: '下架', value: 0 },
            ]" />
          </NFormItem>
        </div>
      </NForm>
      <template #footer>
        <div class="flex justify-end gap-2">
          <NButton @click="showItemModal = false">取消</NButton>
          <NButton type="primary" :loading="itemModalLoading" @click="saveItem" class="warm-btn">保存</NButton>
        </div>
      </template>
    </NModal>

    <NModal v-model:show="showActivityDetailModal" preset="card" :title="activityDetail?.title || '活动详情'" style="max-width: 600px">
      <div v-if="activityDetail" class="space-y-4">
        <div class="text-sm text-warm-dark/60">
          <p>📍 地点：{{ activityDetail.location }}</p>
          <p class="mt-1">📅 时间：{{ activityDetail.start_time?.slice(0, 16).replace('T', ' ') }} ~ {{ activityDetail.end_time?.slice(5, 16).replace('T', ' ') }}</p>
          <p class="mt-1">👥 已报名：{{ activityDetail.participant_count || 0 }}/{{ activityDetail.max_participants }} 人</p>
        </div>
        <div>
          <h4 class="text-sm font-medium text-warm-dark mb-3 flex items-center gap-1">
            <Users :size="14" class="text-warm-orange" /> 参与者列表
          </h4>
          <div class="space-y-2 max-h-80 overflow-y-auto">
            <div v-for="p in activityDetail.participants" :key="p.id" class="flex items-center justify-between p-2 bg-warm-bg rounded-lg">
              <div class="flex items-center gap-2">
                <span class="text-sm text-warm-dark font-medium">{{ p.user_name }}</span>
                <NTag v-if="p.points_awarded > 0" size="small" type="success" :bordered="false">
                  已发放 +{{ p.points_awarded }}
                </NTag>
                <NTag v-else size="small" type="warning" :bordered="false">待发放</NTag>
              </div>
              <NButton
                v-if="p.points_awarded === 0"
                size="small"
                type="primary"
                @click="awardPoints(p.user_id)"
                class="warm-btn"
              >
                发放{{ activityDetail.points_reward }}积分
              </NButton>
            </div>
            <div v-if="!activityDetail.participants?.length" class="text-center py-4 text-warm-dark/40 text-sm">
              暂无参与者
            </div>
          </div>
        </div>
      </div>
    </NModal>
  </div>
</template>
