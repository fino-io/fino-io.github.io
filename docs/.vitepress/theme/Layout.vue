<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { computed } from 'vue'
import { useData, useRoute } from 'vitepress'
import MermaidRenderer from './MermaidRenderer.vue'
import ContentLanguageLink from './ContentLanguageLink.vue'
import { goChapterCount, goUnitCount } from '../go'
import { pythonChapterCount, pythonUnitCount } from '../python'

type DirectoryPage = {
  title: string
  description: string
  count: string
  parent: { label: string; href: string } | null
  source: { label: string; href: string }
}

const guidesDirectoryPage: DirectoryPage = {
  title: 'Guides',
  description: '面向认证、截止时间、错误处理、重试与性能等常见场景的操作指南。',
  count: '24 篇指南',
  parent: { label: 'gRPC', href: '/grpc/' },
  source: { label: '查看官方 Guides', href: 'https://grpc.io/docs/guides/' },
}

const directoryPages: Record<string, DirectoryPage> = {
  '/go': {
    title: 'Go 语言课程',
    description: '从值与类型到并发和工程实践，用图解、示例与练习理解 Go。',
    count: `${goUnitCount} 个单元 · ${goChapterCount} 节课程`,
    parent: null,
    source: { label: '查看 roadmap.sh Go', href: 'https://roadmap.sh/golang' },
  },
  '/python': {
    title: 'Python 语言课程',
    description: '按路线理解语言、算法、框架与工程实践，用图解、示例和项目验证。',
    count: `${pythonUnitCount} 个单元 · ${pythonChapterCount} 节课程`,
    parent: null,
    source: { label: '查看 roadmap.sh Python', href: 'https://roadmap.sh/python' },
  },
  '/rust': {
    title: 'Rust 学习指南',
    description: '从语言基础到工程实践，循序掌握所有权、类型系统、并发与异步开发。',
    count: '18 篇学习文档',
    parent: null,
    source: { label: '查看 Rust 官方学习资源', href: 'https://rust-lang.org/learn/' },
  },
  '/aip/general': {
    title: 'General AIPs',
    description: '按主题与编号浏览通用 API 设计规范，译文与英文原文一一对应。',
    count: '72 篇规范',
    parent: { label: 'API Improvement Proposals', href: '/aip/' },
    source: { label: '查看官方 AIPs', href: 'https://google.aip.dev/general' },
  },
  '/grpc': { ...guidesDirectoryPage, parent: null },
  '/grpc/guides': guidesDirectoryPage,
  '/grpc/blog': {
    title: 'Blog',
    description: '按年份浏览 gRPC 的发布说明、工程实践与社区动态。',
    count: '59 篇文章',
    parent: { label: 'gRPC', href: '/grpc/' },
    source: { label: '查看官方 Blog', href: 'https://grpc.io/blog/' },
  },
}

const { frontmatter } = useData()
const route = useRoute()
const directoryPage = computed(() => directoryPages[normalizePath(route.path)] ?? null)

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
    <template #nav-bar-content-after>
      <ContentLanguageLink />
    </template>
    <template #doc-before>
      <header v-if="directoryPage" class="directory-header">
        <div class="directory-header-copy">
          <nav v-if="directoryPage.parent" class="directory-breadcrumb" aria-label="面包屑">
            <a v-if="directoryPage.parent" :href="directoryPage.parent.href">{{ directoryPage.parent.label }}</a>
            <span v-if="directoryPage.parent" aria-hidden="true">›</span>
            <span aria-current="page">{{ directoryPage.title }}</span>
          </nav>
          <h1>{{ directoryPage.title }}</h1>
          <p class="directory-description">{{ directoryPage.description }}</p>
          <div class="directory-meta">
            <span>{{ directoryPage.count }}</span>
            <a class="directory-source" :href="directoryPage.source.href" target="_blank" rel="noreferrer">
              {{ directoryPage.source.label }} <span aria-hidden="true">↗</span>
            </a>
          </div>
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
