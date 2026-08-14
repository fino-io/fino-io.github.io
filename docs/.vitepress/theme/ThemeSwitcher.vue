<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { isDark } = useData()

const label = computed(() => isDark.value ? '切换到浅色主题' : '切换到深色主题')

function toggleTheme() {
  isDark.value = !isDark.value
}
</script>

<template>
  <button
    class="theme-switcher"
    type="button"
    :aria-label="label"
    :title="label"
    :aria-pressed="isDark"
    @click="toggleTheme"
  >
    <span aria-hidden="true">{{ isDark ? '☀' : '☾' }}</span>
    <span class="theme-switcher__label">{{ isDark ? '浅色' : '深色' }}</span>
  </button>
</template>
