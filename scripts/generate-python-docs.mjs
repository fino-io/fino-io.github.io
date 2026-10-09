import { readFileSync, writeFileSync } from 'node:fs'

const root = new URL('../', import.meta.url)
const curriculum = JSON.parse(readFileSync(new URL('docs/.vitepress/python-curriculum.json', root), 'utf8'))
writeFileSync(new URL('docs/public/python/curriculum.json', root), JSON.stringify(curriculum, null, 2) + '\n')
const { chapters, units, source, checkedAt } = curriculum
const ids = new Set(chapters.map((chapter) => chapter.id))
const order = units.flatMap((unit) => unit.chapterIds)
if (ids.size !== chapters.length || order.length !== ids.size || new Set(order).size !== ids.size) {
  throw new Error('Python 课程 ID 或单元归属无效')
}
const topics = new Set()
const numbered = new Map()
for (const [unitIndex, unit] of units.entries()) {
  for (const [chapterIndex, id] of unit.chapterIds.entries()) {
    const chapter = chapters.find((item) => item.id === id)
    if (!chapter || chapter.group !== unit.title) throw new Error(`Python 章节归属不一致：${id}`)
    const number = `${unitIndex + 1}.${chapterIndex + 1}.`
    numbered.set(id, { chapter, number })
    const path = new URL(`docs/python/${id}.md`, root)
    let body = readFileSync(path, 'utf8')
    if (!body.includes('{#lab}')) throw new Error(`Python 课程缺少练习：${id}`)
    for (const prerequisite of chapter.prerequisites) {
      if (!ids.has(prerequisite) || order.indexOf(prerequisite) >= order.indexOf(id)) {
        throw new Error(`Python 先修顺序无效：${id} / ${prerequisite}`)
      }
    }
    for (const dataset of chapter.datasets) {
      if (!curriculum.datasets.some((item) => item.id === dataset)) throw new Error(`未知 Python 样本：${dataset}`)
    }
    for (const topic of chapter.roadmapTopics) {
      const anchor = chapter.topicTargets[topic]
      if (topics.has(topic) || !anchor || !body.includes(`{#${anchor}}`)) {
        throw new Error(`Python 主题重复或正文锚点无效：${topic}`)
      }
      topics.add(topic)
    }
    body = body.replace(/^title: .*$/m, `title: ${number} ${chapter.title}`)
      .replace(/^# .*$/m, `# ${number} ${chapter.title}`)
    writeFileSync(path, body)
  }
}

const index = [
  '---', 'title: Python 语言课程',
  'description: 按 roadmap.sh Python 路线组织的中文课程，包含数据结构、框架分支、并发、工具、测试与完整项目。',
  'pageClass: aip-directory python-directory',
  'outline: false', 'aside: false', 'prev: false', 'next: false', '---', '',
  `本课程逐项核对 [roadmap.sh Python](${source.url})及[官方路线图](${source.snapshotUrl})，按知识层级组织为 **${units.length} 个单元、${chapters.length} 节课程**。从语言基础到数据结构、模块、对象、包管理、框架、并发、类型、文档与测试，每个主题有具体讲解、示例和练习。核对日期：${checkedAt}。`, '',
  '语义以 [Python 官方文档](https://docs.python.org/zh-cn/3/tutorial/)为依据，用自己的中文解释。基础例子采用 Python 3.12+ 语法，较新 API 和第三方方案注明条件；框架是可选分支，不要求同一个项目安装全部工具。应用扩展与综合项目明确标注，不伪称原图独立节点。', '',
  '## 课程路径', '',
  '```mermaid', 'flowchart TB',
  '  A["1 语言基础 / 2 数据结构 / 3 模块"] --> B["4 函数与迭代进阶 / 5 面向对象"]',
  '  B --> C["6 包管理与配置 / 7 表达式、范式与资源"]',
  '  C --> D["8 框架分支 / 9 并发 / 10 环境"]',
  '  D --> E["11 类型与校验 / 12 格式 / 13 文档 / 14 测试"]',
  '  E --> F["15 应用扩展 / 16 综合项目与延伸"]', '```', '',
  '路径保留原路线的主题范围与层次，同时提供可读的课程顺序。测试可从第一个函数开始；框架先认识入口，异步和类型细节通过后续单元验证。熟悉其他语言的读者可按[原主题对照](./roadmap)跳到对应正文小节。', '',
  '## 示例怎样运行', '',
  '| 形式 | 使用方法 |', '| --- | --- |',
  '| 独立脚本 | 保存到所示 .py 文件，用项目解释器运行；assert 是明确行为检查。 |',
  '| 双文件 / 包实验 | 按文件名与目录一起保存，不把不同模块粘成一个程序。 |',
  '| 测试文件 | 按所选 unittest、doctest、pytest 或 tox 命令执行，确认确实发现测试。 |',
  '| 片段和服务定义 | 文中说明依赖与上下文；会监听端口的示例在独立项目运行。 |', '',
  '先预测结果，再运行与改变输入，最后完成异常和边界任务。图示帮助理解语义，不规定解释器私有内存布局。运行环境、依赖版本和失败行为都是交付说明的一部分。', '',
]
for (const [unitIndex, unit] of units.entries()) {
  index.push(`## ${unitIndex + 1}. ${unit.title}`, '', unit.outcome, '', '| 课程 | 学习任务 |', '| --- | --- |')
  for (const id of unit.chapterIds) {
    const { chapter, number } = numbered.get(id)
    index.push(`| [${number} ${chapter.title}](./${id}) | ${chapter.summary} |`)
  }
  index.push('')
}
index.push('## 项目样本与验收', '',
  '三个完整项目分别交付 CLI、持久化 API 与数据报告。使用合成样本，测试金额精度、输入定位、接口契约和聚合总额，不以一次正常运行代替失败路径检查。', '',
  '- <a href="/python/data/expenses.csv" download>消费 CSV</a>与<a href="/python/data/invalid-expenses.csv" download>错误 CSV</a>：验证正常统计和第 3 行失败。',
  '- <a href="/python/data/orders.csv" download>月度订单</a>：验证原始与汇总金额均为 18500 分。',
  '- [算法样例](/python/data/algorithm-cases.json)与[接口用例](/python/data/task-cases.json)：覆盖空输入、重复、顺序与错误。', '',
  '路线原词到正文小节的对应见[逐项对照](./roadmap)。[课程数据](/python/curriculum.json)保留单元、先修、官方依据、锚点和样本，后续可继续扩展解答与实验。', '',
)
writeFileSync(new URL('docs/python/index.md', root), index.join('\n'))

const coverage = ['---', 'title: roadmap.sh Python 大纲与正文对照',
  'description: Python 原路线主题、课程、正文位置与工具维护说明。',
  'pageClass: aip-article python-course', '---', '', '# roadmap.sh Python 大纲与正文对照', '',
  `以 [Python 路线](${source.url})及[官方 PDF](${source.snapshotUrl})核对，截至 ${checkedAt}。保留原图主题名称，并链接到具体讲解小节；分类和复合节点可能横跨多节课，不把表格行数当课程数量。`, '',
  '框架分支按原图完整保留，同时按维护者资料解释 WSGI、ASGI、greenlet 与 asyncio 的实际区别。nose 与 Pyre 等历史/维护状态节点仍有说明，不把存在于路线图等同于推荐新项目无条件安装。', '',
]
for (const [unitIndex, unit] of units.entries()) {
  const relevant = unit.chapterIds.map((id) => numbered.get(id)).filter(({ chapter }) => chapter.roadmapTopics.length)
  if (!relevant.length) continue
  coverage.push(`## ${unitIndex + 1}. ${unit.title}`, '', unit.sourceTitle ? `原图分类：**${unit.sourceTitle}**。${unit.outcome}` : unit.outcome,
    '', '| 原路线主题 | 课程与正文 |', '| --- | --- |')
  for (const { chapter, number } of relevant) {
    for (const topic of chapter.roadmapTopics) {
      const anchor = chapter.topicTargets[topic]
      const lesson = chapter.lessons.find((item) => item.anchor === anchor)
      let link = `[${number} ${chapter.title} · ${lesson.title}](./${chapter.id}#${anchor})`
      if (topic === 'Heaps, Stacks and Queues') link += '；[堆与优先级队列](./heaps)'
      coverage.push(`| ${topic.replaceAll('|', '\\|')} | ${link} |`)
    }
  }
  coverage.push('')
}
coverage.push('## 扩展与来源', '',
  '安装入口、文件 I/O、HTTP/SQL/数据应用和综合项目用于连贯学习，其中没有原图独立节点的内容标为扩展。算法的最小模型用于解释结构，实际程序优先复用标准容器与成熟方案。', '',
  `本次 PDF SHA-256：\`${source.sha256}\`。这是核对文件的校验，不是官方版本号。链接使用官方小写 /python 路径。`, '',
  '[课程数据](/python/curriculum.json)记录原主题、正文锚点、先修与样本；构建检查重复主题、先修顺序和锚点存在性。', '',
)
writeFileSync(new URL('docs/python/roadmap.md', root), coverage.join('\n'))
console.log(`Generated Python course: ${units.length} units, ${chapters.length} lessons, ${topics.size} topic mappings`)
