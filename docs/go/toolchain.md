---
title: 01 · 环境与工具链
description: Go 中文学习指南：环境与工具链，包含概念、示例、练习与验收。
pageClass: aip-article
---

# 01 · 环境与工具链

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

## 练习与验收

1. 将输出改为名字和日期，格式化后重新编译。
2. 故意增加未使用的 import，读懂报错再修复。
3. 从另一目录执行命令，观察 `GOMOD` 与模块查找结果。

验收：能从空目录创建模块、运行和构建，并解释为什么不需要把项目搬到 GOPATH。参考：[官方入门教程](https://go.dev/doc/tutorial/getting-started)。
