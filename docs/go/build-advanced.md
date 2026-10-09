---
title: 11.4. 构建约束、编译器与链接器参数
description: 理解条件编译、优化诊断和产物信息的分工。
pageClass: aip-article go-course
---

# 11.4. 构建约束、编译器与链接器参数

先修建议：[go 命令与工具工作流](./commands)、[代码生成与构建约束](./generation)。

编译时排除某个文件、运行时选择一个分支、链接时填入版本号，是三个不同动作。本节把它们分开，避免“配置开关”这个词遮住实际行为。

## 构建约束决定文件是否参与编译 {#concept-1}

```mermaid
flowchart LR
  A["目标：GOOS / GOARCH / tags / cgo"] --> B["按文件名与 go:build 选择源码"]
  B --> C["编译器：类型检查与优化"] --> D["链接器：组合包与填产物信息"]
  D --> E["目标平台运行产物"]
```

文件名 `_linux.go`、`_windows.go`、`_amd64.go` 对应平台约束；首部 `//go:build integration` 表示只有启用该标签才参与。运行时 `if runtime.GOOS == ...` 不能让平台专属 import 自动从编译中消失。

例子中准备 `platform_linux.go` 和 `platform_windows.go`，分别实现同一个 `platformName() string`。在不同 GOOS 下只会选中对应文件；另给 macOS 准备 `_darwin.go`。不要把当前文件集缺少实现的错误误判为 Go 不支持交叉构建。

## 两份互补实现的完整实验 {#concept-2}

`main.go`：

```go
package main

import "fmt"

var version = "dev"

func main() { fmt.Println(version, mode()) }
```

`mode_default.go`：

```go
//go:build !demo

package main

func mode() string { return "normal" }
```

`mode_demo.go`：

```go
//go:build demo

package main

func mode() string { return "demo" }
```

```sh
go run .
go run -tags=demo .
go build -tags=demo -ldflags='-X main.version=study-v1' -o app .
./app
```

输出分别为 `dev normal`、`dev demo`、`study-v1 demo`。标签是编译条件，构建后的 app 不会因为改变环境变量就切换回 normal。

## 编译器参数与链接器参数 {#concept-3}

| 参数 | 作用对象 | 用途与条件 |
| --- | --- | --- |
| `-gcflags='-m'` | 编译器 | 观察逃逸与内联诊断，输出依工具链版本。 |
| `-ldflags='-X main.version=...'` | 链接器 | 改可设置的 string 变量，不改 const 或任意类型。 |
| `-trimpath` | 构建产物路径信息 | 减少嵌入的本机构建路径。 |
| `-ldflags='-s -w'` | 链接与调试信息 | 缩小部分产物信息，也可能影响调试。 |
| `-buildmode=plugin` | 构建模式 | 构建插件，受平台与兼容条件限制。 |

参数没有统一的“开越多越快”。诊断、可调试性、文件大小与兼容性各有目标；发布记录应保留目标架构、标签、Go 版本、cgo 条件与关键参数。

## 动手练习与解题线索 {#lab}

1. 运行三文件实验，确认两份 mode 不会同时参与构建。
2. 故意去掉互补约束，阅读重复定义错误；再使两份都不选中，观察缺失实现。
3. 把 version 改成 const，解释为什么 -X 不适用。
4. 在实际支持的目标平台验证产物，而不只确认编译命令退出 0。

依据：[构建约束](https://pkg.go.dev/cmd/go#hdr-Build_constraints)、[编译器](https://pkg.go.dev/cmd/compile)、[链接器](https://pkg.go.dev/cmd/link)。
