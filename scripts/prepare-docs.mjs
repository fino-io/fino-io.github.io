const tasks = [
  'sync-aip-english.mjs',
  'sync-grpc-english.mjs',
  'generate-aip-sidebar.mjs',
  'generate-grpc-sidebar.mjs',
]

for (const task of tasks) {
  await import(`./${task}`)
}
