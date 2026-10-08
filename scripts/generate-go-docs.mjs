import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = new URL('../', import.meta.url)
const curriculum = JSON.parse(readFileSync(new URL('docs/public/go/curriculum.json', root), 'utf8'))
const { chapters, groups, source, checkedAt } = curriculum
const chapterIds = new Set()
const topics = new Set()

for (const chapter of chapters) {
  if (chapterIds.has(chapter.id)) throw new Error(`重复 Go 章节：${chapter.id}`)
  chapterIds.add(chapter.id)
  const path = new URL(`docs/go/${chapter.id}.md`, root)
  const body = readFileSync(path, 'utf8')
  if (!body.includes('{#lab}')) throw new Error(`缺少 Go 实验入口：${fileURLToPath(path)}`)
  for (const topic of chapter.roadmapTopics) {
    if (topics.has(topic)) throw new Error(`重复 Go 路线主题：${topic}`)
    topics.add(topic)
  }
}
for (const chapter of chapters) {
  for (const prerequisite of chapter.prerequisites) {
    if (!chapterIds.has(prerequisite)) throw new Error(`未知 Go 前置章节：${prerequisite}`)
  }
  for (const dataset of chapter.datasets) {
    if (!curriculum.datasets.some((item) => item.id === dataset)) throw new Error(`未知 Go 数据集：${dataset}`)
  }
}

const index = [
  '---',
  'title: Go 学习指南',
  'description: 按 roadmap.sh Go 逐项组织的中文学习文档，包含语义实验、并发模式、应用生态、运行时与综合项目。',
  'pageClass: aip-directory',
  'outline: false',
  'aside: false',
  'prev: false',
  'next: false',
  '---', '',
  `本指南按 [roadmap.sh Go](${source.url}) 的主题范围重构，以[官方路线 PDF](${source.snapshotUrl})逐项校对。将语言基础、类型系统、并发、标准库、测试、生态、工具与高级主题拆成 **${chapters.length} 章**，每章讲清语义、失败边界与可验证实验。完整对应关系见 [roadmap 逐项对照](./roadmap)。资料核对日期：${checkedAt}。`, '',
  '课程组织参考 Learn Go with Tests、inancgumus/learngo 与 Udemy 上 Stephen Grider、Maximilian Schwarzmüller、Todd McLeod 的公开课程大纲，具体对应见[课程与学习资料](./resources)。语义以 Go 官方文档为依据，本站内容与样本重新编写，不转载付费课程。', '',
  '## 怎样学习', '',
  '先预测代码行为，再运行示例、修改边界输入、写下测试。每章给出具体实验与通过条件；遇到失败先解释原因，再继续下一章。基础完整示例以 Go 1.22+ 语法为基线，实际使用官方受支持工具链；第三方库、cgo、插件和代码生成注明独立依赖与平台条件。', '',
  '| 路径 | 阅读顺序 | 阶段交付 |',
  '| --- | --- | --- |',
  '| 零基础 | 起步 → 类型与组织 → 并发 → 标准库与测试 | 能解释容器共享、方法集、错误链与取消，完成日志 CLI。 |',
  '| 已有其他语言经验 | 重点验证切片、指针、接口、错误与并发实验 | 用测试证明语义差别，再完成任务 API。 |',
  '| 后端方向 | 完成主线后进入 HTTP、SQL、gRPC、日志与交付 | 持久化、权限、回滚与生命周期都有明确验证。 |',
  '| 运行时方向 | 基准与 Profile 之后读内存、反射、unsafe/cgo、插件 | 有测量和平台依据，不把高级语法用于不需要的业务。 |', '',
  'roadmap 中框架属于可选分支：逐个认识其职责，实际项目选择一种主要方案。高级主题覆盖完整，但不要求初学者立刻用 unsafe 或动态插件。', '',
]
for (const group of groups) {
  index.push(`## ${group}`, '', '| 编号 | 章节与学习任务 |', '| --- | --- |')
  for (const chapter of chapters.filter((item) => item.group === group)) {
    index.push(`| ${String(chapter.order).padStart(2, '0')} | [${chapter.title}](./${chapter.id}) · ${chapter.summary} |`)
  }
  index.push('')
}
index.push(
  '## 项目与实验数据', '',
  '两个综合项目提供完整代码、测试与输入契约。日志 CLI 综合 I/O、map、flag、错误和测试；任务 API 综合 HTTP、JSON、同步和生命周期，随后按要求升级数据库、授权与实时事件。内存版任务 API 重启清空，不能当作生产持久化服务。', '',
  '- <a href="/go/data/logs-valid.jsonl" download>有效日志</a>与<a href="/go/data/logs-invalid.jsonl" download>错误日志</a>：验证计数、行号和退出码。',
  '- [任务请求用例](/go/data/task-requests.json)：验证 CRUD、字段、错误与响应形状。',
  '- [Benchmark 规模](/go/data/benchmark-sizes.json)：固定输入规模和报告字段，实际数据由运行产生。', '',
  '章节与主题、前置关系、课程、课时、练习和数据集已整理为[课程数据清单](/go/curriculum.json)，后续新增课时和样本可沿用稳定章节链接。', '',
  '从 [Go 的定位与运行模型](./introduction)开始；熟悉基础后可通过[路线对照目录](./roadmap)查缺补漏。', '',
)
writeFileSync(new URL('docs/go/index.md', root), index.join('\n'))

const coverage = [
  '---',
  'title: roadmap.sh Go 逐项对照',
  'description: 路线主题到中文章节的逐项映射、来源快照与课程数据说明。',
  'pageClass: aip-article',
  '---', '',
  '# roadmap.sh Go 逐项对照', '',
  `按 [roadmap.sh Go](${source.url})及[官方 PDF](${source.snapshotUrl})核对，截至 ${checkedAt}。下表保留原图的短主题名称，分类与子主题都列入映射；一个章节可以覆盖多个相关节点。HTTP 客户端、综合项目与交付练习属于补充内容，明确列在表后，不伪称为原图独立节点。`, '',
  'GitHub 当次可访问页面与 raw 数据未能提供可用完整节点图，因此本次采用官方 PDF 人工核对，记录快照校验，不伪造 upstream commit 或官方节点 ID。中文讲解以当前 Go 官方文档校准，课程仅提供教学组织参考。', '',
]
for (const group of groups) {
  const matching = chapters.filter((item) => item.group === group && item.roadmapTopics.length)
  if (!matching.length) continue
  coverage.push(`## ${group}`, '', '| 路线主题 | 中文讲解 |', '| --- | --- |')
  for (const chapter of matching) {
    for (const topic of chapter.roadmapTopics) coverage.push(`| ${topic.replaceAll('|', '\\|')} | [${chapter.title}](./${chapter.id}) |`)
  }
  coverage.push('')
}
coverage.push('## 补充练习', '')
for (const chapter of chapters.filter((item) => !item.roadmapTopics.length)) coverage.push(`- [${chapter.title}](./${chapter.id})：${chapter.summary}`)
coverage.push('', '## 来源与扩展数据', '',
  `本次路线 PDF SHA-256：\`${source.sha256}\`。这是下载内容的校验，不代表官方路线版本号。`, '',
  '[课程数据清单](/go/curriculum.json)记录稳定章节 ID、顺序、前置章节、来源主题、课程引用、已填课时、练习与样本。后续可扩展课时路径、难度、提示和解答位置；未制作的课时不标记已完成，不预填或伪造测量结果。', '',
  '数据与两份项目的详细任务见[综合实验与交付](./projects)，课程作者和公开大纲见[学习资料](./resources)。', '',
)
writeFileSync(new URL('docs/go/roadmap.md', root), coverage.join('\n'))
console.log(`Generated Go directory: ${chapters.length} chapters, ${topics.size} mapped topics`)
