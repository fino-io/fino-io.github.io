import { readFileSync, writeFileSync } from 'node:fs'

const root = new URL('../', import.meta.url)
const curriculum = JSON.parse(readFileSync(new URL('docs/public/go/curriculum.json', root), 'utf8'))
const { chapters, units, source, checkedAt } = curriculum
const ids = new Set(chapters.map((chapter) => chapter.id))
if (ids.size !== chapters.length) throw new Error('Go 章节 ID 重复')
const topics = new Set()
const numbered = new Map()
const readingOrder = units.flatMap((unit) => unit.chapterIds)

for (const [unitIndex, unit] of units.entries()) {
  for (const [chapterIndex, id] of unit.chapterIds.entries()) {
    const chapter = chapters.find((item) => item.id === id)
    if (!chapter || chapter.group !== unit.title || numbered.has(id)) {
      throw new Error(`Go 单元与章节不一致：${id}`)
    }
    const number = `${unitIndex + 1}.${chapterIndex + 1}.`
    numbered.set(id, { chapter, number })
    const path = new URL(`docs/go/${id}.md`, root)
    let body = readFileSync(path, 'utf8')
    if (!body.includes('{#lab}')) throw new Error(`缺少 Go 练习入口：${id}`)
    for (const prerequisite of chapter.prerequisites) {
      if (!ids.has(prerequisite)) throw new Error(`未知 Go 先修课程：${prerequisite}`)
      if (readingOrder.indexOf(prerequisite) >= readingOrder.indexOf(id)) {
        throw new Error(`Go 先修课程必须在前且不能形成循环：${id} / ${prerequisite}`)
      }
    }
    for (const dataset of chapter.datasets) {
      if (!curriculum.datasets.some((item) => item.id === dataset)) throw new Error(`未知数据集：${dataset}`)
    }
    for (const topic of chapter.roadmapTopics) {
      const anchor = chapter.topicTargets[topic]
      if (topics.has(topic) || !anchor || !body.includes(`{#${anchor}}`)) {
        throw new Error(`Go 主题映射重复或无效：${id} / ${topic}`)
      }
      topics.add(topic)
    }
    body = body.replace(/^title: .*$/m, `title: ${number} ${chapter.title}`)
      .replace(/^# .*$/m, `# ${number} ${chapter.title}`)
    writeFileSync(path, body)
  }
}
if (numbered.size !== chapters.length) throw new Error('Go 存在未归入单元的章节')

const index = [
  '---',
  'title: Go 语言课程',
  'description: 按 roadmap.sh Go 大纲组织的中文课程，包含概念图解、可运行示例、练习与真实基准数据。',
  'pageClass: aip-directory go-directory',
  'outline: false', 'aside: false', 'prev: false', 'next: false',
  '---', '',
  '这门课程从一个小程序出发，先理解值和类型，再学习如何组织代码、处理失败、管理并发，最后进入标准库、应用生态与高级主题。讲解用自己的中文组织，语义与 API 以 [Go 官方文档](https://go.dev/doc/)为依据。', '',
  `课程主线逐项核对 [roadmap.sh Go](${source.url})及其[官方路线图](${source.snapshotUrl})，按原图的知识层级组织为 **${units.length} 个单元、${chapters.length} 节课程**。最后一个单元是综合练习与延伸；HTTP 客户端也是明确标注的应用扩展。资料核对日期：${checkedAt}。`, '',
  '## 先看课程怎样连起来', '',
  '```mermaid',
  'flowchart TB',
  '  subgraph L["值与类型"]',
  '    direction LR',
  '    A["1 语言基础"] --> B["2 方法与接口"] --> C["3 泛型"]',
  '  end',
  '  subgraph P["程序组织与运行"]',
  '    direction LR',
  '    D["4 代码组织"] --> E["5 错误处理"] --> F["6 并发"]',
  '  end',
  '  subgraph W["应用与验证"]',
  '    direction LR',
  '    G["7 标准库"] --> H["8 测试与基准"] --> I["9 应用生态"]',
  '  end',
  '  subgraph R["交付与深入"]',
  '    direction LR',
  '    J["10 工具链"] --> K["11 高级主题"] --> N["12 综合练习"]',
  '  end',
  '  C --> D', '  F --> G', '  I --> J',
  '```', '',
  '这张图表达建议学习路径，不代表各知识只能等前一个单元全部读完才使用。测试可以从第一个函数开始；生态里的框架是可选分支，按需要选择一种实现。', '',
  '## 每节课怎样使用', '',
  '先读解释和图示，预测示例输出；把代码运行起来，再改变输入验证边界，最后完成带解题线索的练习。每节的先修链接帮助查缺补漏，路线对照页可跳到原主题对应的正文小节。', '',
  '| 代码形式 | 运行方式 |', '| --- | --- |',
  '| 独立完整程序 | 含 package main 与入口，保存为单独 main.go，在已初始化模块内 go run .；一次只保留一个入口。 |',
  '| 测试文件 | 保存到所示 _test.go 文件，用 go test；Fuzz 和 Benchmark 另有命令。 |',
  '| 多文件实验 | 按文件名一起保存，例如构建标签、插件与生成实验，不能把每块都放成互不相关程序。 |',
  '| 片段 | 依赖上下文中的变量、导入或已生成类型；文中说明条件，不将它当完整入口直接运行。 |', '',
  '基础示例使用 Go 1.22+ 语法，安装时选官方受支持的稳定工具链。第三方库、cgo、插件和生成器各注明依赖或平台要求；运行时的新 API 应检查最低版本。', '',
]
for (const [unitIndex, unit] of units.entries()) {
  index.push(`## ${unitIndex + 1}. ${unit.title}`, '', unit.outcome, '', '| 课程 | 本节要理解的事情 |', '| --- | --- |')
  for (const id of unit.chapterIds) {
    const { chapter, number } = numbered.get(id)
    index.push(`| [${number} ${chapter.title}](./${id}) | ${chapter.summary} |`)
  }
  index.push('')
}
index.push(
  '## 从练习走向项目', '',
  '日志 CLI 把输入、容器、错误与测试连接起来；任务 API 把请求、共享状态、响应与关闭连接起来。项目使用合成数据，内存 API 重启清空；持久化、授权和实时事件在后续任务中扩展。', '',
  '- <a href="/go/data/logs-valid.jsonl" download>有效日志</a>与<a href="/go/data/logs-invalid.jsonl" download>错误日志</a>：运行统计并检查错误行号、输出与退出码。',
  '- [任务请求数据](/go/data/task-requests.json)：按请求契约验证字段、状态与响应。',
  '- [基准实验规模](/go/data/benchmark-sizes.json)与[本次实际测量](/go/data/join-benchmark.json)：对照输入、测量条件与图表。', '',
  '完整来源与正文对应关系见[路线逐项对照](./roadmap)，课程与练习资源见[延伸资料](./resources)。[课程数据](/go/curriculum.json)保存单元、先修、正文锚点、官方依据和样本，后续可继续扩展课时与解答。', '',
)
writeFileSync(new URL('docs/go/index.md', root), index.join('\n'))

const coverage = [
  '---', 'title: roadmap.sh Go 大纲与正文对照',
  'description: 按原路线知识层级展示主题、课程和对应正文小节。',
  'pageClass: aip-article go-course', '---', '',
  '# roadmap.sh Go 大纲与正文对照', '',
  `以 [roadmap.sh Go](${source.url})和[官方路线 PDF](${source.snapshotUrl})作为覆盖基准，核对日期 ${checkedAt}。表中保留原图的短主题名称，并链接到具体讲解小节；分类节点与知识点都列入，不将表格行数当作课程数量。`, '',
  '中文课程按知识层级组织，主干为语言基础、方法与接口、泛型、代码组织、错误处理、并发、标准库、测试、生态、工具链与高级主题。综合项目、HTTP 客户端和额外实验明确作为延伸。图示是语义模型，涉及版本、平台或底层表示时以相应官方说明为准。', '',
]
for (const [unitIndex, unit] of units.entries()) {
  const relevant = unit.chapterIds.map((id) => numbered.get(id)).filter(({ chapter }) => chapter.roadmapTopics.length)
  if (!relevant.length) continue
  coverage.push(`## ${unitIndex + 1}. ${unit.title}`, '',
    unit.sourceTitle ? `原图范围：**${unit.sourceTitle}**。${unit.outcome}` : unit.outcome,
    '', '| 原路线主题 | 课程与正文小节 |', '| --- | --- |')
  for (const { chapter, number } of relevant) {
    for (const topic of chapter.roadmapTopics) {
      const anchor = chapter.topicTargets[topic]
      const lesson = chapter.lessons.find((item) => item.anchor === anchor)
      coverage.push(`| ${topic.replaceAll('|', '\\|')} | [${number} ${chapter.title} · ${lesson.title}](./${chapter.id}#${anchor}) |`)
    }
  }
  coverage.push('')
}
coverage.push('## 扩展内容与来源快照', '',
  'HTTP 客户端、综合项目和数据实验用于串联学习，不伪称为原图单独节点。相关课程只作教学辅助；语法、标准库和运行时语义优先查 Go 官方资料。', '',
  `本次官方 PDF SHA-256：\`${source.sha256}\`，表示核对文件的内容校验，并非官方版本号。`, '',
  '[课程数据](/go/curriculum.json)中保留单元、原主题、实际锚点、官方链接和样本引用；构建会检查章节归属、重复主题、先修引用与正文锚点。后续增加例子时仍可核对来源和位置。', '',
)
writeFileSync(new URL('docs/go/roadmap.md', root), coverage.join('\n'))
console.log(`Generated Go course: ${units.length} units, ${chapters.length} lessons, ${topics.size} topic mappings`)
