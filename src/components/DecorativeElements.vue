<script setup lang="ts">
defineProps<{
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}>()
</script>

<template>
  <div class="pointer-events-none select-none absolute" :class="[
    position === 'top-left' ? 'top-0 left-0' : position === 'top-right' ? 'top-0 right-0' : position === 'bottom-left' ? 'bottom-0 left-0' : 'bottom-0 right-0',
  ]">
    <slot>
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" class="opacity-[0.06]">
        <path d="M30 100L30 50L60 30L90 50L90 100L65 100L65 75L55 75L55 100Z" stroke="#B8956A" stroke-width="2" fill="none"/>
        <rect x="70" y="20" width="30" height="25" rx="2" stroke="#E8763A" stroke-width="1.5" fill="none"/>
        <line x1="76" y1="27" x2="94" y2="27" stroke="#E8763A" stroke-width="1"/>
        <line x1="76" y1="32" x2="94" y2="32" stroke="#E8763A" stroke-width="1"/>
        <line x1="76" y1="37" x2="88" y2="37" stroke="#E8763A" stroke-width="1"/>
        <path d="M15 95L20 85L22 95Z" stroke="#B8956A" stroke-width="1" fill="none"/>
        <line x1="21" y1="85" x2="21" y2="70" stroke="#B8956A" stroke-width="1.5"/>
      </svg>
    </slot>
  </div>
</template>
