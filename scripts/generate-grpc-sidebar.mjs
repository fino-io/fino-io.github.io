import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'docs/grpc')
const output = join(root, 'docs/generated/grpc-sidebar.json')

async function getArticles(section) {
  const files = (await readdir(join(source, section))).filter((file) => file.endsWith('_zh.md'))

  return Promise.all(files.map(async (file) => {
    const content = await readFile(join(source, section, file), 'utf8')
    const frontmatter = parse(content.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '')
    const slug = file.replace(/_zh\.md$/, '')

    return {
      date: String(frontmatter.date ?? ''),
      link: `/grpc/${section}/${slug}_zh`,
      slug,
      title: frontmatter.title ?? slug,
    }
  }))
}

const [guides, blog] = await Promise.all([getArticles('guides'), getArticles('blog')])
guides.sort((left, right) => left.slug.localeCompare(right.slug))
blog.sort((left, right) => right.date.localeCompare(left.date))

const blogByYear = new Map()
for (const article of blog) {
  const year = article.date.slice(0, 4) || '未分类'
  const articles = blogByYear.get(year) ?? []
  articles.push(article)
  blogByYear.set(year, articles)
}
const overview = {
  text: 'gRPC 中文版',
  items: [
    { text: `Guides（${guides.length} 篇）`, link: '/grpc/guides/' },
    { text: `Blog（${blog.length} 篇）`, link: '/grpc/blog/' },
    { text: '翻译计划', link: '/grpc/translation-plan' },
  ],
}
const guideSection = {
  text: 'Guides',
  collapsed: false,
  items: guides.map(({ link, title }) => ({ text: title, link })),
}
const blogSections = [...blogByYear.entries()].map(([year, articles]) => ({
  text: `Blog · ${year}`,
  collapsed: year !== '2026',
  items: articles.map(({ date, link, title }) => ({ text: `${date} ${title}`, link })),
}))
const sidebar = {
  root: [overview],
  guides: [overview, guideSection],
  blog: [overview, ...blogSections],
}

await mkdir(dirname(output), { recursive: true })
await writeFile(output, `${JSON.stringify(sidebar, null, 2)}\n`)
console.log(`Generated gRPC sidebar from ${guides.length} Guides and ${blog.length} Blog articles`)
