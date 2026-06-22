<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { NForm, NFormItem, NInput, NSelect, NInputNumber, NUpload, NButton, NSpace } from 'naive-ui'
import { ArrowLeft, Upload } from 'lucide-vue-next'
import { useApi } from '@/composables/useApi'
import { useMessage } from 'naive-ui'

const { api } = useApi()
const router = useRouter()
const message = useMessage()

const submitting = ref(false)
const fileList = ref<any[]>([])

const form = ref({
  name: '',
  category_id: null as number | null,
  description: '',
  deposit: 0,
})

const categoryOptions = [
  { label: '电动工具', value: 1 },
  { label: '家用工具', value: 2 },
  { label: '户外装备', value: 3 },
  { label: '园林工具', value: 4 },
  { label: '维修工具', value: 5 },
  { label: '其他', value: 6 },
]

const handleUploadChange = (data: { fileList: any[] }) => {
  fileList.value = data.fileList
}

const handleSubmit = async () => {
  if (!form.value.name || !form.value.category_id) {
    message.warning('请填写必要信息')
    return
  }
  submitting.value = true
  try {
    const imageUrls: string[] = []
    for (const file of fileList.value) {
      if (file.file) {
        const formData = new FormData()
        formData.append('file', file.file)
        const { data } = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        imageUrls.push(data.url || data.path || '')
      }
    }
    await api.post('/tools', {
      ...form.value,
      images: imageUrls,
    })
    message.success('发布成功')
    router.push({ name: 'tools' })
  } catch (e: any) {
    message.error(e.response?.data?.message || '发布失败')
  }
  submitting.value = false
}
</script>

<template>
  <div class="container mx-auto px-4 py-6 animate-fade-in">
    <div class="mb-4">
      <NButton quaternary @click="router.back()">
        <template #icon><ArrowLeft :size="16" /></template> 返回
      </NButton>
    </div>

    <div class="warm-card-static p-6 max-w-2xl mx-auto">
      <h1 class="font-title text-2xl text-warm-dark mb-6">发布工具</h1>

      <NForm label-placement="left" label-width="80">
        <NFormItem label="工具名称">
          <NInput v-model:value="form.name" placeholder="请输入工具名称" />
        </NFormItem>
        <NFormItem label="工具分类">
          <NSelect v-model:value="form.category_id" :options="categoryOptions" placeholder="选择分类" />
        </NFormItem>
        <NFormItem label="工具描述">
          <NInput v-model:value="form.description" type="textarea" :rows="4" placeholder="描述工具的状况和特点" />
        </NFormItem>
        <NFormItem label="押金金额">
          <NInputNumber v-model:value="form.deposit" :min="0" :step="10" class="w-full">
            <template #prefix>¥</template>
          </NInputNumber>
        </NFormItem>
        <NFormItem label="工具图片">
          <NUpload
            :default-upload="false"
            @change="handleUploadChange"
            accept="image/*"
            multiple
            list-type="image-card"
          >
            <div class="text-center">
              <Upload :size="24" class="text-warm-brown/40" />
              <p class="text-xs text-warm-dark/30 mt-1">点击上传</p>
            </div>
          </NUpload>
        </NFormItem>
        <div class="flex justify-end gap-3 mt-6">
          <NButton @click="router.back()">取消</NButton>
          <NButton type="primary" :loading="submitting" @click="handleSubmit" class="warm-btn">发布</NButton>
        </div>
      </NForm>
    </div>
  </div>
</template>
