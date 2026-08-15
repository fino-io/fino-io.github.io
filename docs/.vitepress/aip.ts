const chineseArticle = /^aip\/general\/(\d{4})_zh\.md$/
const englishArticle = /^(?:generated\/)?aip\/general\/(\d{4})\.md$/

export function isAipArticle(relativePath: string) {
  return chineseArticle.test(relativePath) || englishArticle.test(relativePath)
}
