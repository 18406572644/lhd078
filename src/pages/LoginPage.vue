<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NCard, NForm, NFormItem, NInput, NButton } from 'naive-ui'
import { Phone, Lock } from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'
import { useMessage } from 'naive-ui'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const message = useMessage()

const loading = ref(false)
const form = ref({ phone: '', password: '' })

const handleLogin = async () => {
  if (!form.value.phone || !form.value.password) {
    message.warning('请填写手机号和密码')
    return
  }
  loading.value = true
  try {
    await userStore.login(form.value.phone, form.value.password)
    message.success('登录成功')
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch (e: any) {
    message.error(e.response?.data?.message || '登录失败')
  }
  loading.value = false
}
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center px-4 animate-fade-in">
    <div class="w-full max-w-md">
      <div class="warm-card-static p-8 relative overflow-hidden">
        <div class="absolute top-0 right-0 opacity-[0.06]">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M60 10L20 40H30V90H55V65H65V90H90V40H100L60 10Z" stroke="#B8956A" stroke-width="2" fill="none"/>
          </svg>
        </div>
        <div class="absolute bottom-0 left-0 opacity-[0.06]">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="20" width="25" height="18" rx="2" stroke="#E8763A" stroke-width="1.5" fill="none"/>
            <line x1="14" y1="27" x2="31" y2="27" stroke="#E8763A" stroke-width="1"/>
            <line x1="14" y1="32" x2="31" y2="32" stroke="#E8763A" stroke-width="1"/>
          </svg>
        </div>

        <div class="text-center mb-8 relative z-10">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-warm-orange/10 mb-4">
            <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
              <path d="M18 4L4 16H8V30H16V22H20V30H28V16H32L18 4Z" fill="#E8763A" stroke="#5C3D2E" stroke-width="1"/>
            </svg>
          </div>
          <h1 class="font-title text-2xl text-warm-dark">欢迎回家</h1>
          <p class="text-sm text-warm-dark/40 mt-1">登录温馨邻里</p>
        </div>

        <NForm class="relative z-10">
          <NFormItem>
            <NInput v-model:value="form.phone" placeholder="手机号" size="large" @keyup.enter="handleLogin">
              <template #prefix><Phone :size="16" class="text-warm-brown" /></template>
            </NInput>
          </NFormItem>
          <NFormItem>
            <NInput v-model:value="form.password" type="password" show-password-on="click" placeholder="密码" size="large" @keyup.enter="handleLogin">
              <template #prefix><Lock :size="16" class="text-warm-brown" /></template>
            </NInput>
          </NFormItem>
          <NButton type="primary" block size="large" :loading="loading" @click="handleLogin" class="warm-btn">
            登录
          </NButton>
        </NForm>

        <p class="text-center text-sm text-warm-dark/40 mt-6 relative z-10">
          还没有账号？
          <router-link :to="{ name: 'register' }" class="text-warm-orange hover:underline">立即注册</router-link>
        </p>
      </div>
    </div>
  </div>
</template>
