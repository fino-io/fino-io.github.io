import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'upstream/grpc.io/content/en')
const translations = join(root, 'docs/grpc')
const target = join(root, 'docs/generated')

await rm(join(target, 'grpc'), { recursive: true, force: true })

for (const section of ['guides', 'blog']) {
  const files = await readdir(join(translations, section))
  const translated = files.filter((file) => file.endsWith('_zh.md'))

  const targetDir = join(target, `grpc-${section}`)
  await rm(targetDir, { recursive: true, force: true })
  await mkdir(targetDir, { recursive: true })
  await Promise.all(translated.map(async (file) => {
    const sourceFile = file.replace(/_zh\.md$/, '.md')
    const sourcePath = join(source, section === 'guides' ? 'docs/guides' : 'blog', sourceFile)
    const targetPath = join(targetDir, sourceFile)
    const content = await readFile(sourcePath, 'utf8')

    await writeFile(
      targetPath,
      content
        .replace(/\{\{[<%][\s\S]*?[>%]\}\}/g, '')
        .replace(/\]\(\/img\//g, '](https://grpc.io/img/')
        .replace(/: \/img\//g, ': https://grpc.io/img/')
        .replace(/src="\/img\//g, 'src="https://grpc.io/img/')
        .replace(/\]\(\/(?!\/)/g, '](https://grpc.io/')
        .replace(/: \/(?!\/)/g, ': https://grpc.io/')
        .replace(/\]:\/(?!\/)/g, ']:https://grpc.io/')
        .replace(/\]\(\.\/\.\.\/([^/)]+)\/?\)/g, `](https://grpc.io/${section}/$1/)`)
        .replace(/\]\(\.\.\/([^/)]+)\/?\)/g, `](https://grpc.io/${section}/$1/)`)
        .replace(/\]\(\.\.\/([^/)]+)\/?\)/g, `](https://grpc.io/${section}/$1/)`),
    )
  }))
}

console.log('Synced English gRPC pages with Chinese translations from upstream/grpc.io')
