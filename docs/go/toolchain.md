---
title: 02 · 环境、命令与文档查询
description: 建立模块，掌握构建、运行、安装、清理与文档命令。
pageClass: aip-article
---

# 02 · 环境、命令与文档查询

学习前应能完成：[Go 的定位、历史与运行模型](./introduction)。

本章目标：建立可重复的开发环境，理解源码、包、模块和可执行文件的关系。

## 安装与确认环境

从 [Go 官方安装页](https://go.dev/doc/install)选择操作系统和处理器架构对应的稳定版本。升级时按官方说明处理旧安装目录，不要把新文件叠加到旧目录。编辑器可使用 VS Code 的 Go 扩展与 gopls，也可使用 GoLand。

```sh
go version
go env GOROOT GOPATH GOMOD GOPROXY
```

`GOROOT` 是工具链安装位置，通常不需要手动设置；`GOPATH` 仍保存下载缓存和安装的工具，但模块项目不必放在其中。`GOMOD` 帮助判断当前命令是否处于正确模块。代理负责下载模块，校验服务用于验证公共模块内容；网络失败先检查代理和连接，避免通过关闭校验解决。

## 创建第一个模块

```sh
mkdir go-study
cd go-study
go mod init example.com/go-study
```

将下面代码保存为 `main.go`：

```go
package main

import "fmt"

func main() {
	fmt.Println("你好，Go")
}
```

```sh
go fmt ./...
go run .
go build -o hello .
./hello
```

预期两次输出都是 `你好，Go`。Windows 使用 `go build -o hello.exe .` 和 `./hello.exe`。`example.com/go-study` 是本地教学模块路径，不会创建网站；实际发布时改为可访问的仓库路径。

一个目录通常是一个包，模块可以包含多个包；`package main` 与 `func main()` 组成程序入口。import 引入包，大写开头的名字可被其他包访问。未使用的 import 与局部变量会导致编译失败。

## 常用命令

| 命令 | 使用时机 |
| --- | --- |
| `go run .` | 临时编译并运行当前入口。 |
| `go build ./...` | 检查模块内所有包能否构建。 |
| `go test ./...` | 执行模块内测试。 |
| `go fmt ./...` | 使用统一代码格式。 |
| `go vet ./...` | 检查部分可疑用法，不替代测试。 |
| `go doc strings.TrimSpace` | 在终端查看 API。 |
| `go mod tidy` | 根据源码整理模块依赖。 |
| `go install 模块路径@版本` | 安装独立工具，版本与应用依赖分开。 |

模块的 `go` 指令规定最低工具链要求，并影响语言语义；工具链可能按配置自动选择或下载。团队应记录工具链版本，复现问题时同时报告 `go version` 与 `go.mod`。详见 [Go 工具链选择](https://go.dev/doc/toolchain)。

## go clean、install 与 build 的差异

`go build ./...` 检查多个包，但不能假设它为所有包都在当前目录生成可执行文件；单个 main 包配 `-o` 才明确产物路径。`go install 包路径@版本` 安装工具到 GOBIN 或 GOPATH/bin，`go run 包路径@版本` 运行指定工具版本，二者与修改应用依赖的 go get 分开。

`go clean -cache` 清编译缓存，`-testcache` 清测试结果缓存，`-modcache` 清下载模块缓存。清缓存可能导致大量重新下载/编译，不是遇到任何报错都先执行。测试输出 `(cached)` 表示可复用缓存，用 `go test -count=1` 强制执行需要重新观测的用例。

## 一次编译问题的诊断顺序

1. `go version` 确认工具链，`go env GOMOD GOWORK` 确认模块/工作区。
2. 阅读首个编译错误的文件与行号，修复源码问题，不把所有后续错误都当独立问题。
3. import 错误确认模块路径、包目录和实际依赖版本。
4. 工具版本要求更高时按团队策略升级工具链或选择兼容发布版本，不关闭校验。
5. 涉及 cgo/平台时确认 GOOS、GOARCH、CGO_ENABLED 和目标编译器。

`go doc` 查具体 API，`go help build` 查命令，pkg.go.dev 查依赖所用版本，语言规范解释语义。三类文档解决不同问题，不只搜索一条报错就复制任意博客命令。

## 练习与验收 {#lab}

1. 将输出改为名字和日期，格式化后重新编译。
2. 故意增加未使用的 import，读懂报错再修复。
3. 从另一目录执行命令，观察 `GOMOD` 与模块查找结果。

验收：能从空目录创建模块、运行和构建，并解释为什么不需要把项目搬到 GOPATH。参考：[官方入门教程](https://go.dev/doc/tutorial/getting-started)。
