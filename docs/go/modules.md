---
title: 2.6. 包、模块、依赖与发布
description: 导入规则、MVS、vendor、工作区与版本发布。
pageClass: aip-article
---

# 2.6. 包、模块、依赖与发布

学习前应能完成：[环境、命令与文档查询](./toolchain)、[函数、闭包与调用语义](./functions)。

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

## 从模块路径到一次包导入

`module example.com/tasks` 声明命名空间，`internal/task` 的导入路径是 `example.com/tasks/internal/task`，不是文件系统绝对路径。包名与目录名通常一致，但语法上不是必须；同目录的普通源码不能混用多个包名，测试可使用外部 `task_test` 包验证公开 API。

源码导入形成有向图，循环导入无法构建。init 依初始化依赖执行，不用它隐式建立数据库连接；入口显式装配更易诊断。包级变量有初始化依赖，避免多个文件用 init 顺序表达业务流程。

## MVS 与直接/间接依赖

A 要求 B v1.2.0，C 要求 B v1.4.0，构建列表选择满足要求的较高版本 v1.4.0，不会仅因 B 有 v1.9.0 自动选最新。go.sum 是校验记录，不能理解为 npm package-lock 的等价锁文件。间接依赖仍能影响行为与安全，检查 `go list -m all` 与 `go mod why -m 模块`。

```sh
go mod tidy
go mod verify
go list -m all
go mod graph
go mod vendor
go build -mod=vendor ./...
```

vendor 把依赖源码放到项目内，适合组织明确要求离线构建或审查依赖的场景；不自动固定工具链和平台，也不把缺失源码变成完整产物。生成 vendor 后仍需检查差异。现代 Go 在适当模块条件下可自动采用 vendor，团队显式选择保持一致。

## 工作区实验

```text
workspace/
  go.work
  app/go.mod      # require example.com/lib 的发布版本
  lib/go.mod      # 本地开发版本
```

在父目录 `go work init ./app ./lib` 后 app 可看到本地 lib 改动。交付 app 前运行 `GOWORK=off go test ./...`，验证声明的发布依赖，而非只依赖本地工作区。replace 本机路径只用于本地测试，发布时移除或说明受控来源。

## 发布模块与 v2 的步骤

1. module 使用仓库实际可解析的路径，公开 API 有文档和测试。
2. 清理依赖，以 `GOWORK=off` 做独立构建，检查许可证与受支持 Go 版本。
3. 选择语义版本标签。v0 允许不稳定，v1 后尽量保持兼容。
4. 发布不兼容 v2 时，模块路径加 `/v2`，更新导入路径与调用方迁移说明。
5. 发布后从另一个干净模块 `go get 路径@版本`，测试导入与使用。

子目录模块的标签通常需带路径前缀，单根模块的 `v1.2.3` 不能照搬到所有仓库布局。已发布版本不重写，用新版本修复。依赖发布步骤参见 [官方发布模块](https://go.dev/doc/modules/publishing)。本指南提供的是学习步骤，不在当前仓库替用户发布任何模块。

## 练习与验收 {#lab}

1. 把日志解析逻辑移到 internal 包，main 只保留输入输出。
2. 查看一个依赖的实际版本和传递依赖，说明引入原因。
3. 使用 `go mod tidy` 后，从干净目录重新构建。

验收：入口清楚、依赖单向，环境中没有不可复现的本机路径。参考：[依赖管理](https://go.dev/doc/modules/managing-dependencies)、[模块参考](https://go.dev/ref/mod)。
