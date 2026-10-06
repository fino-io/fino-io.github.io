<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

type Collection = {
  title: string
  count: number
  unit: string
  description: string
  link: string
  label: string
}

const { frontmatter } = useData()
const collections = computed(() => frontmatter.value.collections as Collection[])
</script>

<template>
  <div class="library-shell">
    <aside class="library-sidebar" aria-label="知识库导航">
      <div class="library-sidebar-heading">
        <span>工作区</span>
        <strong>API 知识库</strong>
      </div>
      <nav class="library-sidebar-nav">
        <a class="is-active" href="/" aria-current="page">概览</a>
        <a v-for="collection in collections" :key="collection.link" :href="collection.link">{{ collection.title }}</a>
      </nav>
      <div class="library-sidebar-heading library-sidebar-heading--reading">
        <span>阅读参考</span>
      </div>
      <nav class="library-sidebar-nav" aria-label="阅读参考">
        <a href="/aip/scopes">按 Scope 浏览</a>
        <a href="/aip/translation-plan">AIP 翻译计划</a>
        <a href="/grpc/translation-plan">gRPC 翻译计划</a>
      </nav>
    </aside>
    <main class="library-home">
      <header class="library-header">
        <div>
          <p class="directory-eyebrow">Fino</p>
          <h1>{{ frontmatter.hero.text }}</h1>
          <p class="library-description">{{ frontmatter.hero.tagline }}</p>
        </div>
        <div class="library-actions">
          <a
            v-for="action in frontmatter.hero.actions"
            :key="action.link"
            class="library-button"
            :class="{ primary: action.theme === 'brand' }"
            :href="action.link"
          >{{ action.text }}</a>
        </div>
      </header>

      <section class="library-panel" aria-labelledby="library-overview-title">
        <div class="library-panel-heading">
          <h2 id="library-overview-title">知识库概览</h2>
          <span>中文阅读 · 英文原文</span>
        </div>
        <div class="library-metrics">
          <a v-for="collection in collections" :key="collection.link" class="library-metric" :href="collection.link">
            <span>{{ collection.title }}</span>
            <strong>{{ collection.count }}<small>{{ collection.unit }}</small></strong>
            <span>{{ collection.label }}</span>
          </a>
        </div>
      </section>

      <div class="library-grid">
        <section class="library-panel" aria-labelledby="library-collections-title">
          <div class="library-panel-heading">
            <h2 id="library-collections-title">文档合集</h2>
            <span>Google AIPs / gRPC</span>
          </div>
          <a v-for="collection in collections" :key="collection.link" class="library-collection" :href="collection.link">
            <div>
              <h3>{{ collection.title }}</h3>
              <p>{{ collection.description }}</p>
            </div>
            <span class="library-text-link">浏览 <span aria-hidden="true">→</span></span>
          </a>
        </section>

        <section class="library-panel" aria-labelledby="library-reading-title">
          <div class="library-panel-heading">
            <h2 id="library-reading-title">从这里开始</h2>
            <span>API Design</span>
          </div>
          <a v-for="item in frontmatter.reading" :key="item.link" class="library-reading" :href="item.link">
            <span class="library-reading-number">{{ item.label }}</span>
            <strong>{{ item.title }}</strong>
            <span aria-hidden="true">↗</span>
          </a>
        </section>
      </div>

      <section class="library-panel library-about">
        <Content class="vp-doc" />
      </section>
    </main>
  </div>
</template>

<style src="./library-home.css" />
