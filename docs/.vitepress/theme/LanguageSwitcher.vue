<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vitepress'

const route = useRoute()

const routeMap: Record<string, string> = {
  '/': '/',
  '/aip/': '/general',
  '/aip/general': '/general',
  '/aip/scopes': '/general',
  '/aip/translation-plan': '/general',
  '/aip/3': '/aip/general/0003_zh',
}

const chinesePages = new Set([
  '/aip/',
  '/aip/general',
  '/aip/scopes',
  '/aip/translation-plan',
])

const target = computed(() => {
  const pathname = route.path.replace(/\.html$/, '')
  const generalDocument = pathname.match(/^\/aip\/general\/(\d{4})(_zh)?$/)
  if (generalDocument) {
    const [, number, language] = generalDocument
    return `/aip/general/${number}${language ? '' : '_zh'}`
  }
  return `https://google.aip.dev${routeMap[pathname] ?? '/'}`
})

const isChinesePage = computed(() => {
  const pathname = route.path.replace(/\.html$/, '')
  return pathname.endsWith('_zh') || chinesePages.has(pathname)
})

const label = computed(() => isChinesePage.value ? 'English' : '中文')

</script>

<template>
  <a class="language-switcher i18n-button" :href="target" :aria-label="`切换到${label}`">
    <span aria-hidden="true">文</span>
    <span>{{ label }}</span>
  </a>
</template>
