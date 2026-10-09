---
title: 10.1. go 命令与工具工作流
description: 区分运行、构建、安装、依赖整理、缓存与文档查询。
pageClass: aip-article go-course
---

# 10.1. go 命令与工具工作流

先修建议：[安装环境、Hello World 与文档入口](./toolchain)、[包、模块、依赖与发布](./modules)。

同一个 go 命令既能运行程序，也能管理依赖、执行测试和查文档。这些操作的作用对象不同：源码、应用依赖、独立工具、缓存或最终产物。弄清作用对象比记一串命令更有用。

## 从修改源码到得到产物 {#concept-1}

```mermaid
flowchart LR
  E["编辑源码"] --> F["go fmt：统一格式"] --> T["go test：检查行为"]
  T --> V["go vet：检查部分可疑用法"] --> B["go build：得到产物"]
```

这是一条常用开发路径，图中的命令各自可以单独执行；go build 不自动替你运行全套测试或 go generate。不要看到构建通过就认为运行行为已验证。

| 命令 | 对象 / 结果 | 使用场景 |
| --- | --- | --- |
| `go version` | 当前工具链 | 复现问题、确认版本要求。 |
| `go run .` | 当前 main 包，临时编译运行 | 快速试运行。 |
| `go build -o app .` | 一个明确可执行文件 | 交付或检查构建。 |
| `go build ./...` | 当前模块内多个包 | 编译检查，不为每个包都产生独立文件。 |
| `go install 包路径@版本` | 安装独立工具 | 工具版本与应用依赖分开。 |
| `go fmt ./...` | 源码格式 | 遵循 gofmt。 |
| `go mod tidy` | go.mod/go.sum | 根据源码整理应用依赖。 |
| `go test ./...` | 测试及部分构建检查 | 行为回归。 |
| `go doc 包.名字` | 文档 | 精确查询 API。 |
| `go clean` | 根据选项清理产物或缓存 | 有明确缓存问题时使用。 |

## get、install 与 run 的边界 {#concept-2}

`go get 模块@版本` 调整应用依赖；`go install 工具包@版本` 安装命令；`go run 工具包@版本` 临时运行工具。三者不能因都下载模块就混用。版本后缀明确指定工具来源，应用 go.mod 不应因为安装工具被随意污染。

安装位置通常是 GOBIN 或 GOPATH/bin，命令找不到先检查 PATH。团队记录工具版本与最低 Go 要求，更新工具后重新确认输出和配置兼容性。

## 测试缓存与下载缓存 {#concept-3}

测试输出 `(cached)` 说明工具链认为可复用上次结果；需要强制执行时用 `go test -count=1 ./...`。`go clean -testcache` 清测试缓存，`-cache` 清编译缓存，`-modcache` 清模块下载缓存。它们不是“万能修复”，清空可能造成大量下载和重新编译。

`go env GOMOD GOWORK GOOS GOARCH CGO_ENABLED` 有助于确认当前工作环境。工作区可以使本地修改覆盖发布依赖，独立交付前用 GOWORK=off 检查声明的模块依赖。

## 动手练习与解题线索 {#lab}

1. 在一个带测试的模块依次执行 run、test、build，记录每项得到的对象。
2. 对同一测试执行两次，再加 -count=1，观察缓存提示。
3. 安装一个确定版本的官方工具，指出安装位置和它是否改变应用 go.mod。
4. 故意从模块外运行命令，用 GOMOD 定位目录问题，避免先清所有缓存。

依据：[go 命令](https://pkg.go.dev/cmd/go)、[依赖管理](https://go.dev/doc/modules/managing-dependencies)。
