<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import { getAipTranslation } from '../aip'

const { page } = useData()

const translation = computed(() => getAipTranslation(page.value.relativePath))
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
