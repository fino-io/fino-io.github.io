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
    english: /^(?:generated\/grpc-(guides|blog)|grpc\/(guides|blog))\/(?!index\.md$)([\w-]+)\.md$/,
    toEnglish: (match) => `/grpc/${match[1]}/${match[2]}`,
    toChinese: (match) => `/grpc/${match[1] ?? match[2]}/${match[3]}_zh`,
  },
]

export function getContentTranslation(relativePath: string): Translation | null {
  if (relativePath === 'index.md') {
    return { href: '/en/', text: 'English' }
  }

  if (relativePath === 'en/index.md') {
    return { href: '/', text: '中文' }
  }

  if (relativePath === 'aip/index.md') {
    return { href: 'https://google.aip.dev/', text: 'English' }
  }

  if (relativePath === 'aip/general/index.md') {
    return { href: 'https://google.aip.dev/general', text: 'English' }
  }

  if (relativePath === 'grpc/guides/index.md') {
    return { href: 'https://grpc.io/docs/guides/', text: 'English' }
  }

  if (relativePath === 'grpc/blog/index.md') {
    return { href: 'https://grpc.io/blog/', text: 'English' }
  }

  for (const translation of translations) {
    const chinese = relativePath.match(translation.chinese)
    if (chinese) return { href: translation.toEnglish(chinese), text: 'English' }

    const english = relativePath.match(translation.english)
    if (english) return { href: translation.toChinese(english), text: '中文' }
  }

  return null
}
