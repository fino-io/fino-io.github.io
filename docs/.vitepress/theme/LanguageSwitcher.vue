<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vitepress'

const route = useRoute()

const routeMap: Record<string, string> = {
  '/': '/',
  '/aip/': '/general',
  '/aip/general': '/general',
  '/aip/scopes': '/general',
  '/aip/3': '/aip/general/0003_zh',
}

const localPairs: Record<string, string> = {
  '/aip/general/0001_zh': '/aip/general/0001',
  '/aip/general/0001': '/aip/general/0001_zh',
  '/aip/general/0002_zh': '/aip/general/0002',
  '/aip/general/0002': '/aip/general/0002_zh',
  '/aip/general/0003_zh': '/aip/general/0003',
  '/aip/general/0003': '/aip/general/0003_zh',
  '/aip/general/0008_zh': '/aip/general/0008',
  '/aip/general/0008': '/aip/general/0008_zh',
  '/aip/general/0009_zh': '/aip/general/0009',
  '/aip/general/0009': '/aip/general/0009_zh',
}

const target = computed(() => {
  const pathname = route.path.replace(/\.html$/, '')
  if (localPairs[pathname]) return localPairs[pathname]
  return `https://google.aip.dev${routeMap[pathname] ?? '/'}`
})

const label = computed(() => route.path.includes('_zh') ? 'English' : '中文')

</script>

<template>
  <a class="language-switcher" :href="target" :aria-label="`切换到${label}`">
    <span aria-hidden="true">文</span>
    <span>{{ label }}</span>
  </a>
</template>
