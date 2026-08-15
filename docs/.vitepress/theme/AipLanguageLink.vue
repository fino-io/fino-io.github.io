<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { page } = useData()

const translation = computed(() => {
  const chinese = page.value.relativePath.match(/^aip\/general\/(\d{4})_zh\.md$/)
  if (chinese) return { href: `/aip/general/${chinese[1]}`, text: 'English' }

  const english = page.value.relativePath.match(
    /^(?:generated\/)?aip\/general\/(\d{4})\.md$/,
  )
  if (english) return { href: `/aip/general/${english[1]}_zh`, text: '中文' }

  return null
})
</script>

<template>
  <a
    v-if="translation"
    class="AipLanguageLink"
    :href="translation.href"
    :aria-label="`切换至${translation.text}`"
  >
    <span class="vpi-languages" aria-hidden="true" />
    <span>{{ translation.text }}</span>
  </a>
</template>
