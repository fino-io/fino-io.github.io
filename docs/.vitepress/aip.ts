const chineseArticle = /^aip\/general\/(\d{4})_zh\.md$/
const englishArticle = /^(?:generated\/)?aip\/general\/(\d{4})\.md$/

export function isAipArticle(relativePath: string) {
  return chineseArticle.test(relativePath) || englishArticle.test(relativePath)
}

export function getAipTranslation(relativePath: string) {
  const chinese = relativePath.match(chineseArticle)
  if (chinese) return { href: `/aip/general/${chinese[1]}`, text: 'English' }

  const english = relativePath.match(englishArticle)
  if (english) return { href: `/aip/general/${english[1]}_zh`, text: '中文' }

  return null
}
