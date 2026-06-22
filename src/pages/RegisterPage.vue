<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { NCard, NForm, NFormItem, NInput, NButton } from 'naive-ui'
import { User, Phone, Lock, MapPin } from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'
import { useMessage } from 'naive-ui'

const router = useRouter()
const userStore = useUserStore()
const message = useMessage()

const loading = ref(false)
const form = ref({
  name: '',
  phone: '',
  password: '',
  confirmPassword: '',
  address: '',
})

const handleRegister = async () => {
  if (!form.value.name || !form.value.phone || !form.value.password) {
    message.warning('请填写必要信息')
    return
  }
  if (form.value.password !== form.value.confirmPassword) {
    message.warning('两次密码不一致')
    return
  }
  loading.value = true
  try {
    await userStore.register({
      name: form.value.name,
      phone: form.value.phone,
      password: form.value.password,
      address: form.value.address,
    })
    message.success('注册成功，请登录')
    router.push({ name: 'login' })
  } catch (e: any) {
    message.error(e.response?.data?.message || '注册失败')
  }
  loading.value = false
}
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center px-4 py-8 animate-fade-in">
    <div class="w-full max-w-md">
      <div class="warm-card-static p-8 relative overflow-hidden">
        <div class="absolute top-0 left-0 opacity-[0.06]">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 10L15 35H25V80H45V55H55V80H75V35H85L50 10Z" stroke="#B8956A" stroke-width="2" fill="none"/>
          </svg>
        </div>

        <div class="text-center mb-8 relative z-10">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-warm-orange/10 mb-4">
            <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
              <path d="M18 4L4 16H8V30H16V22H20V30H28V16H32L18 4Z" fill="#E8763A" stroke="#5C3D2E" stroke-width="1"/>
            </svg>
          </div>
          <h1 class="font-title text-2xl text-warm-dark">加入我们</h1>
          <p class="text-sm text-warm-dark/40 mt-1">注册成为温馨邻里的一员</p>
        </div>

        <NForm class="relative z-10">
          <NFormItem>
            <NInput v-model:value="form.name" placeholder="姓名" size="large">
              <template #prefix><User :size="16" class="text-warm-brown" /></template>
            </NInput>
          </NFormItem>
          <NFormItem>
            <NInput v-model:value="form.phone" placeholder="手机号" size="large">
              <template #prefix><Phone :size="16" class="text-warm-brown" /></template>
            </NInput>
          </NFormItem>
          <NFormItem>
            <NInput v-model:value="form.password" type="password" show-password-on="click" placeholder="密码" size="large">
              <template #prefix><Lock :size="16" class="text-warm-brown" /></template>
            </NInput>
          </NFormItem>
          <NFormItem>
            <NInput v-model:value="form.confirmPassword" type="password" show-password-on="click" placeholder="确认密码" size="large">
              <template #prefix><Lock :size="16" class="text-warm-brown" /></template>
            </NInput>
          </NFormItem>
          <NFormItem>
            <NInput v-model:value="form.address" placeholder="地址（选填）" size="large">
              <template #prefix><MapPin :size="16" class="text-warm-brown" /></template>
            </NInput>
          </NFormItem>
          <NButton type="primary" block size="large" :loading="loading" @click="handleRegister" class="warm-btn">
            注册
          </NButton>
        </NForm>

        <p class="text-center text-sm text-warm-dark/40 mt-6 relative z-10">
          已有账号？
          <router-link :to="{ name: 'login' }" class="text-warm-orange hover:underline">去登录</router-link>
        </p>
      </div>
    </div>
  </div>
</template>
