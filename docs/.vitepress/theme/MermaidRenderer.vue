<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useData, useRoute } from 'vitepress'

const { isDark } = useData()
const route = useRoute()
let mermaid: typeof import('mermaid').default | undefined
let diagramId = 0
let rendering = false
let observer: MutationObserver | undefined

async function renderDiagrams(refresh = false) {
  if (rendering) return
  rendering = true
  await nextTick()
  try {
    const module = await import('mermaid')
    mermaid ??= module.default
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: isDark.value ? 'dark' : 'default',
    })

    const targets = [
      ...Array.from(document.querySelectorAll('.language-mermaid pre > code')).map((code) => ({
        element: code.parentElement!,
        source: code.textContent ?? '',
      })),
      ...(refresh
        ? Array.from(document.querySelectorAll<HTMLElement>('.mermaid-diagram')).map((element) => ({
            element,
            source: element.dataset.mermaidSource ?? '',
          }))
        : []),
    ]

    for (const { element, source } of targets) {
      if (!source.trim()) continue

      try {
        const { svg, bindFunctions } = await mermaid.render(`mermaid-diagram-${diagramId++}`, source)
        const diagram = document.createElement('div')
        diagram.className = 'mermaid-diagram'
        diagram.dataset.mermaidSource = source
        diagram.innerHTML = svg
        element.replaceWith(diagram)
        bindFunctions?.(diagram)
      } catch (error) {
        console.error('Failed to render Mermaid diagram', error)
      }
    }
  } finally {
    rendering = false
  }
}

onMounted(() => {
  renderDiagrams()
  observer = new MutationObserver(() => renderDiagrams())
  observer.observe(document.body, { childList: true, subtree: true })
})
onUnmounted(() => observer?.disconnect())
watch(() => route.path, () => renderDiagrams(), { flush: 'post' })
watch(isDark, () => renderDiagrams(true), { flush: 'post' })
</script>

<template>
  <span class="mermaid-renderer" aria-hidden="true" />
</template>
