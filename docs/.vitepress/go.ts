import curriculum from '../public/go/curriculum.json'

export const goChapterCount = curriculum.chapters.length

export const goSidebar = [
  {
    text: 'Go 学习',
    items: [
      { text: '学习路线与目录', link: '/go/' },
      { text: 'roadmap 逐项对照', link: '/go/roadmap' },
    ],
  },
  ...curriculum.groups.map((group, index) => ({
    text: group,
    collapsed: index > 1,
    items: curriculum.chapters
      .filter((chapter) => chapter.group === group)
      .map((chapter) => ({
        text: `${String(chapter.order).padStart(2, '0')} · ${chapter.title}`,
        link: `/go/${chapter.id}`,
      })),
  })),
]
