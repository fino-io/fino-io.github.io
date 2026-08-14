import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Fino Docs',
  description: 'API 规范与项目文档的中文知识库',
  cleanUrls: true,
  themeConfig: {
    siteTitle: 'Fino Docs',
    nav: [
      { text: '首页', link: '/' },
      { text: 'AIP 中文版', link: '/aip/' },
      { text: '项目文档', link: '/projects/' },
      { text: 'AIP 原站 ↗', link: 'https://google.aip.dev/' },
    ],
    sidebar: {
      '/aip/': [
        {
          text: 'Google AIP 中文版',
          items: [
            { text: '总览', link: '/aip/' },
            { text: 'AIP-3：AIP 版本管理', link: '/aip/3' },
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
  },
})
