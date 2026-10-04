<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { computed } from 'vue'
import { useData, useRoute } from 'vitepress'
import MermaidRenderer from './MermaidRenderer.vue'

type DirectoryPage = {
  eyebrow: string
  title: string
  description: string
  count: string
  searchLabel: string
  parent: { label: string; href: string } | null
  source: { label: string; href: string }
}

const guidesDirectoryPage: DirectoryPage = {
  eyebrow: 'GRPC DOCUMENTATION',
  title: 'Guides',
  description: '面向认证、截止时间、错误处理、重试与性能等常见场景的操作指南。',
  count: '24 篇指南',
  searchLabel: '搜索 Guides',
  parent: { label: 'gRPC', href: '/grpc/' },
  source: { label: '查看官方 Guides', href: 'https://grpc.io/docs/guides/' },
}

const directoryPages: Record<string, DirectoryPage> = {
  '/rust': {
    eyebrow: 'RUST LEARNING GUIDE',
    title: 'Rust 学习指南',
    description: '从语言基础到工程实践，循序掌握所有权、类型系统、并发与异步开发。',
    count: '18 篇学习文档',
    searchLabel: '搜索 Rust 文档',
    parent: null,
    source: { label: '查看 Rust 官方学习资源', href: 'https://rust-lang.org/learn/' },
  },
  '/aip/general': {
    eyebrow: 'API IMPROVEMENT PROPOSALS',
    title: 'General AIPs',
    description: '按主题与编号浏览通用 API 设计规范，译文与英文原文一一对应。',
    count: '72 篇规范',
    searchLabel: '搜索 AIP',
    parent: { label: 'API Improvement Proposals', href: '/aip/' },
    source: { label: '查看官方 AIPs', href: 'https://google.aip.dev/general' },
  },
  '/grpc': { ...guidesDirectoryPage, parent: null },
  '/grpc/guides': guidesDirectoryPage,
  '/grpc/blog': {
    eyebrow: 'GRPC DOCUMENTATION',
    title: 'Blog',
    description: '按年份浏览 gRPC 的发布说明、工程实践与社区动态。',
    count: '59 篇文章',
    searchLabel: '搜索 Blog',
    parent: { label: 'gRPC', href: '/grpc/' },
    source: { label: '查看官方 Blog', href: 'https://grpc.io/blog/' },
  },
}

const { frontmatter } = useData()
const route = useRoute()
const directoryPage = computed(() => directoryPages[normalizePath(route.path)] ?? null)

function openSearch() {
  document.querySelector<HTMLButtonElement>('.VPNavBar .DocSearch-Button')?.click()
}

function normalizePath(pathname: string) {
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
}

function formatArticleDate(value: unknown) {
  if (value instanceof Date) return value.toISOString().slice(0, 10)

  return String(value ?? '').slice(0, 10)
}
</script>

<template>
  <DefaultTheme.Layout>
    <template #doc-before>
      <header v-if="directoryPage" class="directory-header">
        <div class="directory-header-copy">
          <nav class="directory-breadcrumb" aria-label="Breadcrumb">
            <a v-if="directoryPage.parent" :href="directoryPage.parent.href">{{ directoryPage.parent.label }}</a>
            <span v-if="directoryPage.parent" aria-hidden="true">›</span>
            <span aria-current="page">{{ directoryPage.title }}</span>
          </nav>
          <p class="directory-eyebrow">{{ directoryPage.eyebrow }}</p>
          <h1>{{ directoryPage.title }}</h1>
          <p class="directory-description">{{ directoryPage.description }}</p>
          <a class="directory-source" :href="directoryPage.source.href" target="_blank" rel="noreferrer">
            {{ directoryPage.source.label }} <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div class="directory-search" role="search" :aria-label="directoryPage.searchLabel">
          <div class="directory-search-heading">
            <span>快速查找</span>
            <small>{{ directoryPage.count }}</small>
          </div>
          <button class="directory-search-trigger" type="button" @click="openSearch">
            <span class="vpi-search" aria-hidden="true"></span>
            <span class="directory-search-placeholder">{{ directoryPage.searchLabel }}</span>
            <kbd aria-hidden="true">⌘ K</kbd>
          </button>
          <p class="directory-search-hint">从标题、目录和正文中查找</p>
        </div>
      </header>
      <header v-if="frontmatter.showArticleHeader" class="grpc-article-header">
        <p v-if="frontmatter.date" class="grpc-article-meta">
          {{ formatArticleDate(frontmatter.date) }}<span v-if="frontmatter.author?.name"> · {{ frontmatter.author.name }}</span>
        </p>
        <h1>{{ frontmatter.title }}</h1>
        <p v-if="frontmatter.description" class="grpc-article-description">
          {{ frontmatter.description }}
        </p>
      </header>
    </template>
    <template #layout-bottom>
      <MermaidRenderer />
    </template>
  </DefaultTheme.Layout>
</template>
