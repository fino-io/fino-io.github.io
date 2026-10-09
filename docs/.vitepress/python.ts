export const pythonSidebar = [
  { text: 'Python 学习', items: [{ text: '学习路线与目录', link: '/python/' }] },
  {
    text: '1. 起步与语言基础',
    items: [
      { text: '1.1. 环境、解释器与虚拟环境', link: '/python/toolchain' },
      { text: '1.2. 语法、类型与控制流', link: '/python/basics' },
      { text: '1.3. 字符串、集合与数据处理', link: '/python/collections' },
      { text: '1.4. 函数、作用域与接口设计', link: '/python/functions' },
      { text: '1.5. 文件、异常与常用标准库', link: '/python/files-errors' },
    ],
  },
  {
    text: '2. 工程实践与语言进阶',
    items: [
      { text: '2.1. 模块、包与项目结构', link: '/python/modules' },
      { text: '2.2. 对象、类与数据建模', link: '/python/objects' },
      { text: '2.3. 迭代器、生成器与装饰器', link: '/python/iterators' },
      { text: '2.4. 类型标注与边界校验', link: '/python/typing' },
      { text: '2.5. 测试、调试与代码质量', link: '/python/testing' },
    ],
  },
  {
    text: '3. 应用开发与生态',
    items: [
      { text: '3.1. HTTP、接口调用与采集', link: '/python/http' },
      { text: '3.2. SQL、SQLite 与持久化', link: '/python/databases' },
      { text: '3.3. 线程、进程与异步', link: '/python/concurrency' },
      { text: '3.4. Web 开发与 FastAPI', link: '/python/web' },
      { text: '3.5. 数据分析、自动化与性能', link: '/python/data' },
    ],
  },
  {
    text: '4. 项目与延伸阅读',
    items: [
      { text: '4.1. CSV 消费报告 CLI', link: '/python/project-cli' },
      { text: '4.2. 任务管理 API', link: '/python/project-api' },
      { text: '4.3. 月度消费分析', link: '/python/project-data' },
      { text: '4.4. 从练习到完整项目', link: '/python/projects' },
      { text: '4.5. 资料、方向与常见问题', link: '/python/resources' },
    ],
  },
]