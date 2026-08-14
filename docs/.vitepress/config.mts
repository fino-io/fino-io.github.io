import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Fino Docs',
  description: 'API 规范与项目文档的中文知识库',
  cleanUrls: true,
  rewrites: {
    'generated/aip/general/:page.md': 'aip/general/:page.md',
  },
  // 官方英文源文件保留原站链接（/1、/general 等），镜像层不改写原文。
  ignoreDeadLinks: true,
  themeConfig: {
    siteTitle: 'AIPs 中文版',
    nav: [
      { text: 'AIPs', link: '/' },
      { text: '浏览 AIPs', link: '/aip/general' },
      { text: '动态', link: 'https://google.aip.dev/news' },
      { text: 'FAQ', link: 'https://google.aip.dev/faq' },
      { text: '参与贡献', link: 'https://google.aip.dev/contributing' },
      { text: 'API Linter ↗', link: 'https://linter.aip.dev/' },
      { text: '按 Scope', link: '/aip/scopes' },
      { text: '项目文档', link: '/projects/' },
      { text: '原站 ↗', link: 'https://google.aip.dev/' },
      { text: 'GitHub ↗', link: 'https://github.com/aip-dev/google.aip.dev' },
      { component: 'LanguageSwitcher' },
    ],
    sidebar: {
      '/aip/': [
        {
          text: 'Google AIP 中文版',
          items: [
            { text: '总览', link: '/aip/' },
      { text: 'General：通用 AIP', link: '/aip/general' },
            { text: '按 Scope 浏览', link: '/aip/scopes' },
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
            { text: '元规范', link: '/aip/general#meta：元规范' },
            { text: '流程', link: '/aip/general#process：流程' },
            { text: 'API 概念', link: '/aip/general#api-concepts：api-概念' },
            { text: '资源设计', link: '/aip/general#resource-design：资源设计' },
            { text: '操作', link: '/aip/general#operations：操作' },
            { text: '字段', link: '/aip/general#fields：字段' },
            { text: '设计模式', link: '/aip/general#design-patterns：设计模式' },
            { text: '兼容性与版本管理', link: '/aip/general#compatibility-and-versioning：兼容性与版本管理' },
            { text: '润色', link: '/aip/general#polish：润色' },
            { text: 'Protocol Buffers', link: '/aip/general#protocol-buffers：protocol-buffers' },
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
    search: { provider: 'local' },
    outline: { label: '本页目录', level: [2, 3] },
    docFooter: { prev: '上一篇', next: '下一篇' },
    lastUpdated: { text: '最后更新' },
    footer: {
      message: '为清晰而写',
      copyright: 'Fino Docs',
    },
    i18nRouting: false,
  },
})
