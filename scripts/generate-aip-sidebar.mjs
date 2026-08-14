import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'upstream/google-aip/aip/general')
const metadataPath = join(root, 'docs/aip/general/zh.yaml')
const outputDir = join(root, 'docs/.vitepress')
const outputPath = join(outputDir, 'general-sidebar.generated.json')

const metadata = parse(await readFile(metadataPath, 'utf8'))
const translatedById = new Map(metadata.aips.map((aip) => [aip.id, aip]))
const sourceFiles = (await readdir(source)).filter((file) => /^\d{4}\.md$/.test(file))

const entries = await Promise.all(sourceFiles.map(async (file) => {
  const sourceText = await readFile(join(source, file), 'utf8')
  const frontmatter = sourceText.match(/^---\n([\s\S]*?)\n---/)
  const sourceMetadata = parse(frontmatter?.[1] ?? '')
  const id = Number(sourceMetadata.id ?? file.slice(0, 4))
  const translation = translatedById.get(id)

  return {
    id,
    category: sourceMetadata.placement?.category ?? 'misc',
    order: sourceMetadata.placement?.order ?? id,
    translated: translation?.translated ?? false,
    title: translation?.title ?? `AIP-${id}`,
  }
}))

const aipItems = entries
  .sort((a, b) => a.id - b.id)
  .map((entry) => {
    const number = String(entry.id).padStart(4, '0')
    return {
      text: `${entry.id} ${entry.title}`,
      link: `/aip/general/${number}${entry.translated ? '_zh' : ''}`,
    }
  })

const sidebar = [
  {
    text: 'AIPs by Scope',
    items: [
      { text: 'General', link: '/aip/general' },
      { text: 'Google Cloud Platform', link: 'https://google.aip.dev/cloud' },
      { text: 'Auth', link: 'https://google.aip.dev/auth' },
      { text: 'Client libraries', link: 'https://google.aip.dev/client-libraries' },
      { text: 'Workspace', link: 'https://google.aip.dev/apps' },
      { text: 'Actions on Google', link: 'https://google.aip.dev/aog' },
    ],
  },
  {
    text: 'AIPs',
    collapsed: false,
    items: aipItems,
  },
]

await mkdir(outputDir, { recursive: true })
await writeFile(outputPath, `${JSON.stringify(sidebar, null, 2)}\n`)
console.log(`Generated General sidebar from ${entries.length} upstream AIPs`)
