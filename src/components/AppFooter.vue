<script setup lang="ts">
import { Heart } from 'lucide-vue-next'
</script>

<template>
  <footer class="bg-warm-dark text-white/80 mt-auto">
    <div class="container mx-auto px-4 py-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div class="flex items-center gap-2 mb-3">
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 4L4 16H8V30H16V22H20V30H28V16H32L18 4Z" fill="#E8763A" stroke="#FFF3D6" stroke-width="1.5"/>
            </svg>
            <span class="font-title text-lg text-white">温馨邻里</span>
          </div>
          <p class="text-sm text-white/60 leading-relaxed">
            社区工具共享与互助平台，让邻里之间共享资源、互帮互助，构建温暖可信的社区生态。
          </p>
        </div>
        <div>
          <h4 class="text-warm-orange font-medium mb-3">快速链接</h4>
          <div class="flex flex-col gap-2 text-sm">
            <router-link :to="{ name: 'tools' }" class="hover:text-warm-orange transition-colors">工具大厅</router-link>
            <router-link :to="{ name: 'help' }" class="hover:text-warm-orange transition-colors">互助广场</router-link>
            <router-link :to="{ name: 'notices' }" class="hover:text-warm-orange transition-colors">公告栏</router-link>
            <router-link :to="{ name: 'publish' }" class="hover:text-warm-orange transition-colors">发布工具</router-link>
          </div>
        </div>
        <div>
          <h4 class="text-warm-orange font-medium mb-3">关于我们</h4>
          <p class="text-sm text-white/60 leading-relaxed">
            温馨邻里致力于打造安全、便捷的社区共享平台，让每一件工具都能找到需要它的人。
          </p>
        </div>
      </div>
      <div class="mt-8 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p class="text-xs text-white/40">© 2024 温馨邻里 社区工具共享平台</p>
        <p class="text-xs text-white/40 flex items-center gap-1">
          用 <Heart :size="12" class="text-warm-orange" /> 构建温暖社区
        </p>
      </div>
    </div>
  </footer>
</template>
