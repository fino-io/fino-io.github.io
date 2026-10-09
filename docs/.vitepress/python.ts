import curriculum from './python-curriculum.json'

export const pythonChapterCount = curriculum.chapters.length
export const pythonUnitCount = curriculum.units.length

export const pythonSidebar = [
  {
    text: 'Python 学习',
    items: [
      { text: '学习路线与目录', link: '/python/' },
      { text: 'roadmap 逐项对照', link: '/python/roadmap' },
    ],
  },
  ...curriculum.units.map((unit, unitIndex) => ({
    text: `${unitIndex + 1}. ${unit.title}`,
    collapsed: unitIndex > 0,
    items: unit.chapterIds.map((id, chapterIndex) => {
      const chapter = curriculum.chapters.find((item) => item.id === id)!
      return { text: `${unitIndex + 1}.${chapterIndex + 1}. ${chapter.title}`, link: `/python/${id}` }
    }),
  })),
]
