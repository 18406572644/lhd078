<script setup lang="ts">
import { NConfigProvider, NMessageProvider, NDialogProvider } from 'naive-ui'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import { useTheme } from '@/composables/useTheme'

const { themeOverride } = useTheme()
</script>

<template>
  <NConfigProvider :theme-overrides="themeOverride">
    <NMessageProvider>
      <NDialogProvider>
        <div class="min-h-screen flex flex-col bg-warm-bg">
          <AppHeader />
          <main class="flex-1">
            <router-view v-slot="{ Component }">
              <transition name="page" mode="out-in">
                <component :is="Component" />
              </transition>
            </router-view>
          </main>
          <AppFooter />
        </div>
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>
