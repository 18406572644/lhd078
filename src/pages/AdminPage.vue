<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount, shallowRef, watch } from 'vue'
import { NTabs, NTabPane, NCard, NGrid, NGi, NDataTable, NButton, NSpin, NTag, NSpace } from 'naive-ui'
import { Users, Wrench, Repeat, Activity, TrendingUp, PieChart } from 'lucide-vue-next'
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
    const [statsRes, usersRes, toolsRes, violationsRes, rankRes] = await Promise.allSettled([
      api.get('/admin/stats'),
      api.get('/admin/users'),
      api.get('/admin/tools/pending'),
      api.get('/admin/violations'),
      api.get('/admin/rankings'),
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
    </NTabs>
  </div>
</template>
