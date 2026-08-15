type Translation = { href: string; text: 'English' | '中文' }

const translations: Array<{
  chinese: RegExp
  english: RegExp
  toEnglish: (match: RegExpMatchArray) => string
  toChinese: (match: RegExpMatchArray) => string
}> = [
  {
    chinese: /^aip\/general\/(\d{4})_zh\.md$/,
    english: /^(?:generated\/)?aip\/general\/(\d{4})\.md$/,
    toEnglish: (match) => `/aip/general/${match[1]}`,
    toChinese: (match) => `/aip/general/${match[1]}_zh`,
  },
  {
    chinese: /^grpc\/(guides|blog)\/([\w-]+)_zh\.md$/,
    english: /^generated\/grpc-(guides|blog)\/([\w-]+)\.md$/,
    toEnglish: (match) => `/grpc/${match[1]}/${match[2]}`,
    toChinese: (match) => `/grpc/${match[1]}/${match[2]}_zh`,
  },
]

export function getContentTranslation(relativePath: string): Translation | null {
  for (const translation of translations) {
    const chinese = relativePath.match(translation.chinese)
    if (chinese) return { href: translation.toEnglish(chinese), text: 'English' }

    const english = relativePath.match(translation.english)
    if (english) return { href: translation.toChinese(english), text: '中文' }
  }

  return null
}
