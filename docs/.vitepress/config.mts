import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { instance } from '@viz-js/viz'
import { defineConfig } from 'vitepress'
import { isAipArticle } from './aip'

const graphviz = await instance()
const configDir = dirname(fileURLToPath(import.meta.url))
const generalSidebar = JSON.parse(
  readFileSync(resolve(configDir, 'general-sidebar.generated.json'), 'utf8'),
)

export default defineConfig({
  title: 'Fino',
  description: 'API 规范与项目文档的中文知识库',
  appearance: true,
  cleanUrls: true,
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
    },
  },
  rewrites: {
    'generated/aip/general/:page.md': 'aip/general/:page.md',
  },
  markdown: {
    config(md) {
      const defaultFence = md.renderer.rules.fence

      md.renderer.rules.fence = (tokens, index, options, env, self) => {
        const token = tokens[index]
        if (token.info.trim() !== 'graphviz') {
          return defaultFence(tokens, index, options, env, self)
        }

        try {
          const svg = graphviz
            .renderString(token.content, { format: 'svg' })
            .replace(/^<\?xml[\s\S]*?\?>\s*<!DOCTYPE[\s\S]*?>\s*/, '')
          return `<div class="graphviz-diagram">${svg}</div>`
        } catch {
          return `<pre><code>${md.utils.escapeHtml(token.content)}</code></pre>`
        }
      }
    },
  },
  transformPageData(pageData) {
    if (pageData.relativePath === 'aip/general/index.md') {
      pageData.frontmatter.pageClass = 'aip-directory'
    } else if (isAipArticle(pageData.relativePath)) {
      pageData.frontmatter.pageClass = 'aip-article'
    }
  },
  // 官方英文源文件保留原站链接（/1、/general 等），镜像层不改写原文。
  ignoreDeadLinks: true,
  themeConfig: {
    logo: '/fino-mark.svg',
    siteTitle: 'Fino',
    socialLinks: [
      { icon: 'github', link: 'https://github.com/fino-io/fino-io.github.io' },
    ],
    nav: [
      { text: 'Browse AIPs', link: '/aip/general' },
      { text: 'News', link: 'https://google.aip.dev/news' },
      { text: 'FAQ', link: 'https://google.aip.dev/faq' },
      { text: 'Contributing', link: 'https://google.aip.dev/contributing' },
      { text: 'API Linter ↗', link: 'https://linter.aip.dev/' },
      { text: 'View on GitHub', link: 'https://github.com/aip-dev/google.aip.dev' },
      { component: 'AipLanguageLink' },
    ],
    sidebar: {
      '/aip/general': generalSidebar,
      '/aip/': [
        {
          text: 'Google AIP 中文版',
          items: [
            { text: '总览', link: '/aip/' },
            { text: 'General：通用 AIP（72篇）', link: '/aip/general' },
            { text: '按 Scope 浏览', link: '/aip/scopes' },
            { text: '翻译与布局计划', link: '/aip/translation-plan' },
            { text: 'AIP-3：AIP 版本管理', link: '/aip/general/0003_zh' },
          ],
        },
        {
          text: 'Meta AIPs 1–99',
          collapsed: false,
          items: [
            { text: 'AIP-1：目的与指南', link: '/aip/general/0001_zh' },
            { text: 'AIP-2：编号', link: '/aip/general/0002_zh' },
            { text: 'AIP-3：版本管理', link: '/aip/general/0003_zh' },
            { text: 'AIP-8：风格与指导', link: '/aip/general/0008_zh' },
            { text: 'AIP-9：术语表', link: '/aip/general/0009_zh' },
          ],
        },
        {
          text: 'General 分类',
          collapsed: false,
          items: [
            { text: '元规范', link: '/aip/general#meta-元规范' },
            { text: '流程', link: '/aip/general#process-流程' },
            { text: 'API 概念', link: '/aip/general#api-concepts-api-概念' },
            { text: '资源设计', link: '/aip/general#resource-design-资源设计' },
            { text: '操作', link: '/aip/general#operations-操作' },
            { text: '字段', link: '/aip/general#fields-字段' },
            { text: '设计模式', link: '/aip/general#design-patterns-设计模式' },
            { text: '兼容性与版本管理', link: '/aip/general#compatibility-and-versioning-兼容性与版本管理' },
            { text: '润色', link: '/aip/general#polish-润色' },
            { text: 'Protocol Buffers', link: '/aip/general#protocol-buffers-protocol-buffers' },
            { text: '其他', link: '/aip/general#miscellaneous-其他' },
          ],
        },
      ],
      '/projects/': [
        {
          text: '项目文档',
          items: [{ text: '收录计划', link: '/projects/' }],
        },
      ],
    },
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: 'Search AIPs' },
        },
      },
    },
    outline: { label: 'Categories', level: [2, 3] },
    docFooter: { prev: '上一篇', next: '下一篇' },
    lastUpdated: { text: '最后更新' },
    i18nRouting: false,
  },
})
