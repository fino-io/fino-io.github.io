export const goSidebar = [
  { text: 'Go 学习', items: [{ text: '学习路线与目录', link: '/go/' }] },
  {
    text: '起步与语言基础',
    items: [
      { text: '01 · 环境与工具链', link: '/go/toolchain' },
      { text: '02 · 语法、类型与控制流', link: '/go/basics' },
      { text: '03 · 字符串、切片与映射', link: '/go/collections' },
      { text: '04 · 函数、指针与 defer', link: '/go/functions' },
      { text: '05 · 结构体、方法与接口', link: '/go/types' },
      { text: '06 · 错误处理与边界设计', link: '/go/errors' },
    ],
  },
  {
    text: '工程实践',
    items: [
      { text: '07 · 模块、依赖与项目结构', link: '/go/modules' },
      { text: '08 · 文件、JSON 与标准库', link: '/go/io' },
      { text: '09 · 泛型与常用容器算法', link: '/go/generics' },
      { text: '10 · 测试、模糊测试与质量检查', link: '/go/testing' },
    ],
  },
  {
    text: '并发与应用开发',
    items: [
      { text: '11 · Goroutine、Channel 与同步', link: '/go/concurrency' },
      { text: '12 · Context、取消与并发编排', link: '/go/context' },
      { text: '13 · HTTP 客户端与可靠调用', link: '/go/http' },
      { text: '14 · HTTP 服务与接口设计', link: '/go/web' },
      { text: '15 · SQL、连接池与事务', link: '/go/databases' },
      { text: '16 · gRPC、生态与技术选型', link: '/go/ecosystem' },
    ],
  },
  {
    text: '进阶、实战与延伸',
    items: [
      { text: '17 · 调试、性能与运行时', link: '/go/performance' },
      { text: '18 · 配置、安全与部署', link: '/go/deployment' },
      { text: '19 · 实战一：日志统计 CLI', link: '/go/project-cli' },
      { text: '20 · 实战二：任务管理 API', link: '/go/project-api' },
      { text: '21 · 项目架构与交付检查', link: '/go/projects' },
      { text: '22 · 资料、方向与常见问题', link: '/go/resources' },
    ],
  },
]
