import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { instance } from '@viz-js/viz'
import { defineConfig } from 'vitepress'
import { isAipArticle } from './aip'
import { isGrpcArticle } from './grpc'

const graphviz = await instance()
const configDir = dirname(fileURLToPath(import.meta.url))
const generalSidebar = JSON.parse(
  readFileSync(resolve(configDir, 'general-sidebar.generated.json'), 'utf8'),
)
const grpcSidebar = JSON.parse(
  readFileSync(resolve(configDir, '../generated/grpc-sidebar.json'), 'utf8'),
)

function startsWithHeading(relativePath: string) {
  const filePath = resolve(configDir, '..', relativePath)
  if (!existsSync(filePath)) return false

  return readFileSync(filePath, 'utf8')
    .replace(/^---\n[\s\S]*?\n---\n?/, '')
    .trimStart()
    .startsWith('# ')
}

export default defineConfig({
  title: 'Fino',
  description: 'API 规范与项目文档的中文知识库',
  head: [['link', { rel: 'icon', href: '/fino-mark.png', type: 'image/png' }]],
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
    'generated/grpc-guides/:page.md': 'grpc/guides/:page.md',
    'generated/grpc-blog/:page.md': 'grpc/blog/:page.md',
  },
  markdown: {
    config(md) {
      const defaultFence = md.renderer.rules.fence
      const defaultImage = md.renderer.rules.image

      md.renderer.rules.image = (tokens, index, options, env, self) => {
        const token = tokens[index]
        const source = token.attrGet('src') ?? ''
        const localSource = source
          .replace('https://grpc.io/img/', '/grpc-assets/img/')
          .replace(
            'https://raw.githubusercontent.com/grpc/grpc-community/main/PanCakes/',
            '/grpc-assets/PanCakes/',
          )

        if (localSource !== source) token.attrSet('src', localSource)
        return defaultImage?.(tokens, index, options, env, self)
          ?? self.renderToken(tokens, index, options)
      }

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
    } else if (['grpc/index.md', 'grpc/guides/index.md', 'grpc/blog/index.md'].includes(pageData.relativePath)) {
      pageData.frontmatter.pageClass = 'aip-directory grpc-directory'
    } else if (isGrpcArticle(pageData.relativePath) || pageData.relativePath.startsWith('grpc/')) {
      pageData.frontmatter.pageClass = 'aip-article grpc-article'
      pageData.frontmatter.showArticleHeader = isGrpcArticle(pageData.relativePath)
        && !startsWithHeading(pageData.relativePath)
    }
  },
  themeConfig: {
    logo: { src: '/fino-logo.png', alt: 'Fino' },
    siteTitle: false,
    socialLinks: [
      { icon: 'github', link: 'https://github.com/fino-io/fino-io.github.io' },
    ],
    nav: [
      { text: 'Google AIPs', link: '/aip/general', activeMatch: '^/aip/' },
      { text: 'gRPC', link: '/grpc/', activeMatch: '^/grpc/' },
      { text: 'Rust', link: '/rust/', activeMatch: '^/rust/' },
      {
        text: '更多',
        items: [
          { text: '项目文档', link: '/projects/' },
          { text: 'AIP News', link: 'https://google.aip.dev/news' },
          { text: 'FAQ', link: 'https://google.aip.dev/faq' },
          { text: 'Contributing', link: 'https://google.aip.dev/contributing' },
          { text: 'API Linter ↗', link: 'https://linter.aip.dev/' },
          { text: 'Google AIP 源码', link: 'https://github.com/aip-dev/google.aip.dev' },
        ],
      },
      { component: 'ContentLanguageLink' },
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
      '/grpc/guides/': grpcSidebar.guides,
      '/grpc/blog/': grpcSidebar.blog,
      '/grpc/': grpcSidebar.root,
      '/rust/': [
        { text: 'Rust 学习', items: [{ text: '学习路线与目录', link: '/rust/' }] },
        {
          text: '起步与语言基础',
          items: [
            { text: '01 · 环境与工具链', link: '/rust/toolchain' },
            { text: '02 · 语法与基本类型', link: '/rust/basics' },
            { text: '03 · 所有权与借用', link: '/rust/ownership' },
            { text: '04 · 结构体、枚举与模式匹配', link: '/rust/data-modeling' },
            { text: '05 · 字符串与集合', link: '/rust/collections' },
            { text: '06 · 错误处理', link: '/rust/error-handling' },
          ],
        },
        {
          text: '类型系统与工程实践',
          items: [
            { text: '07 · 泛型与 Trait', link: '/rust/traits' },
            { text: '08 · 生命周期', link: '/rust/lifetimes' },
            { text: '09 · 模块、Cargo 与依赖', link: '/rust/project-structure' },
            { text: '10 · 闭包与迭代器', link: '/rust/iterators' },
            { text: '11 · 智能指针与内部可变性', link: '/rust/smart-pointers' },
            { text: '12 · 测试、文档与质量检查', link: '/rust/testing' },
          ],
        },
        {
          text: '并发与进阶',
          items: [
            { text: '13 · 线程与并发', link: '/rust/concurrency' },
            { text: '14 · Async 与 Tokio', link: '/rust/async' },
            { text: '15 · 常用生态与技术选型', link: '/rust/ecosystem' },
            { text: '16 · 宏、Unsafe 与性能', link: '/rust/advanced' },
          ],
        },
        {
          text: '项目与延伸阅读',
          items: [
            { text: '17 · 从练习到完整项目', link: '/rust/projects' },
            { text: '18 · 资料、方向与常见问题', link: '/rust/resources' },
          ],
        },
      ],
    },
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档',
          },
        },
      },
    },
    outline: { label: 'Categories', level: [2, 3] },
    docFooter: { prev: '上一篇', next: '下一篇' },
    lastUpdated: { text: '最后更新' },
    i18nRouting: false,
  },
})
