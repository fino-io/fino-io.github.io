<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import MermaidRenderer from './MermaidRenderer.vue'

const { frontmatter } = useData()
</script>

<template>
  <DefaultTheme.Layout>
    <template #layout-bottom>
      <MermaidRenderer />
    </template>
    <template #doc-before>
      <header v-if="frontmatter.showArticleHeader" class="grpc-article-header">
        <p v-if="frontmatter.date" class="grpc-article-meta">
          {{ frontmatter.date }}<span v-if="frontmatter.author?.name"> · {{ frontmatter.author.name }}</span>
        </p>
        <h1>{{ frontmatter.title }}</h1>
        <p v-if="frontmatter.description" class="grpc-article-description">
          {{ frontmatter.description }}
        </p>
      </header>
    </template>
  </DefaultTheme.Layout>
</template>
