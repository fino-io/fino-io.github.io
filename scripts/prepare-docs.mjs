const tasks = [
  'sync-aip-english.mjs',
  'sync-grpc-english.mjs',
  'generate-aip-sidebar.mjs',
  'generate-grpc-sidebar.mjs',
  'generate-go-docs.mjs',
  'generate-python-docs.mjs',
]

for (const task of tasks) {
  await import(`./${task}`)
}
