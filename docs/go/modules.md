---
title: 07 · 模块、依赖与项目结构
description: Go 中文学习指南：模块、依赖与项目结构，包含概念、示例、练习与验收。
pageClass: aip-article
---

# 07 · 模块、依赖与项目结构

本章目标：理解包与模块边界，能引入、升级和复现依赖，不为小项目制造复杂目录。

## 从一个包开始

小工具先使用根目录的 main 包，出现独立职责再拆包。一个服务可采用：

```text
task-service/
  go.mod
  go.sum
  cmd/server/main.go        # 装配配置、依赖与生命周期
  internal/task/           # 模型、业务操作与相关测试
  internal/httpapi/        # 路由、请求校验、响应映射
  migrations/             # 数据库版本变更
  README.md
```

`cmd` 是常用约定，不是强制规则。`internal` 目录的导入限制由工具链执行，适合应用内部包；没有导出复用需求时，不必先建 pkg 目录。包按职责命名，避免 `utils`、`common` 成为杂物集合。依赖保持单向，HTTP 依赖业务，业务不依赖 HTTP；入口负责把具体存储注入使用方。

参照 [官方模块组织说明](https://go.dev/doc/modules/layout)，用真实需求驱动拆分，不给每个类或每个函数建立一个包。

## 模块与版本

`go.mod` 声明模块路径、Go 要求和依赖；`go.sum` 记录模块内容校验值，并非把整个依赖图完全锁死的锁文件。可复现构建还依赖 go.mod、工具链、平台和外部构建输入。

```sh
go get example.com/some/module@v1.2.3
go mod tidy
go list -m all
go mod graph
go mod verify
```

这里的 example.com 地址只是命令格式示意，替换为真实模块。`go get` 调整应用依赖；安装命令行工具使用 `go install 包路径@版本`。新增依赖先看维护状态、许可证、API、最低 Go 要求与是否引入过多传递依赖，提交时应保留 go.mod 和 go.sum。

模块选择基于最小版本选择规则，依赖可能被其他模块提升；`go list -m all` 用于确认实际选择。v2 及以上模块通常需要路径后缀，例如 `/v2`。升级时先看变更说明，运行测试和漏洞扫描，不把所有依赖一次性更新到最新。

## 本地开发与私有模块

多个模块一起修改时可用 `go work init ./service ./library`，单模块无需工作区。发布前在 `GOWORK=off` 下验证模块，避免只在本地工作区中能通过。临时 replace 可以用于调试，不能把本机绝对路径当作交付依赖。

私有模块使用适当的 `GOPRIVATE` 模式并配置仓库认证，遵循组织要求，避免向公共代理泄露私有模块路径。遇到循环导入，通常需要重新检查职责归属，或由使用方定义小接口打破不合理依赖。

## 练习与验收

1. 把日志解析逻辑移到 internal 包，main 只保留输入输出。
2. 查看一个依赖的实际版本和传递依赖，说明引入原因。
3. 使用 `go mod tidy` 后，从干净目录重新构建。

验收：入口清楚、依赖单向，环境中没有不可复现的本机路径。参考：[依赖管理](https://go.dev/doc/modules/managing-dependencies)、[模块参考](https://go.dev/ref/mod)。
