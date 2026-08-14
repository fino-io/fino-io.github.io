import { cp, mkdir, readdir, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'upstream/google-aip/aip/general')
const target = join(root, 'docs/generated/aip/general')

await rm(target, { recursive: true, force: true })
await mkdir(target, { recursive: true })

for (const file of await readdir(source)) {
  if (!/^\d{4}\.md$/.test(file)) continue
  await cp(join(source, file), join(target, file))
}

console.log('Synced English AIPs from upstream/google-aip/aip/general')
