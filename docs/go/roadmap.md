---
title: roadmap.sh Go 逐项对照
description: 路线主题到中文章节的逐项映射、来源快照与课程数据说明。
pageClass: aip-article
---

# roadmap.sh Go 逐项对照

按 [roadmap.sh Go](https://roadmap.sh/golang)及[官方 PDF](https://roadmap.sh/pdfs/roadmaps/golang.pdf)核对，截至 2026-10-08。下表保留原图的短主题名称，分类与子主题都列入映射；一个章节可以覆盖多个相关节点。HTTP 客户端、综合项目与交付练习属于补充内容，明确列在表后，不伪称为原图独立节点。

GitHub 当次可访问页面与 raw 数据未能提供可用完整节点图，因此本次采用官方 PDF 人工核对，记录快照校验，不伪造 upstream commit 或官方节点 ID。中文讲解以当前 Go 官方文档校准，课程仅提供教学组织参考。

## 起步与语言基础

| 路线主题 | 中文讲解 |
| --- | --- |
| Introduction to Go | [Go 的定位、历史与运行模型](./introduction) |
| Why use Go | [Go 的定位、历史与运行模型](./introduction) |
| History of Go | [Go 的定位、历史与运行模型](./introduction) |
| Setting up the Environment | [环境、命令与文档查询](./toolchain) |
| Hello World in Go | [环境、命令与文档查询](./toolchain) |
| go command | [环境、命令与文档查询](./toolchain) |
| Commands & Docs | [环境、命令与文档查询](./toolchain) |
| go run | [环境、命令与文档查询](./toolchain) |
| go build | [环境、命令与文档查询](./toolchain) |
| go install | [环境、命令与文档查询](./toolchain) |
| go fmt | [环境、命令与文档查询](./toolchain) |
| go mod | [环境、命令与文档查询](./toolchain) |
| go test | [环境、命令与文档查询](./toolchain) |
| go clean | [环境、命令与文档查询](./toolchain) |
| go doc | [环境、命令与文档查询](./toolchain) |
| go version | [环境、命令与文档查询](./toolchain) |
| Variables & Constants | [变量、常量、iota 与作用域](./variables) |
| var vs := | [变量、常量、iota 与作用域](./variables) |
| Zero Values | [变量、常量、iota 与作用域](./variables) |
| const and iota | [变量、常量、iota 与作用域](./variables) |
| Scope and Shadowing | [变量、常量、iota 与作用域](./variables) |
| Data Types | [基本类型、数值与类型转换](./basics) |
| Boolean | [基本类型、数值与类型转换](./basics) |
| Numeric Types | [基本类型、数值与类型转换](./basics) |
| Integers (Signed, Unsigned) | [基本类型、数值与类型转换](./basics) |
| Floating Points | [基本类型、数值与类型转换](./basics) |
| Complex Numbers | [基本类型、数值与类型转换](./basics) |
| Runes | [基本类型、数值与类型转换](./basics) |
| Type Conversion | [基本类型、数值与类型转换](./basics) |
| Conditionals | [条件、循环与控制转移](./control-flow) |
| if | [条件、循环与控制转移](./control-flow) |
| if-else | [条件、循环与控制转移](./control-flow) |
| switch | [条件、循环与控制转移](./control-flow) |
| Loops | [条件、循环与控制转移](./control-flow) |
| for loop | [条件、循环与控制转移](./control-flow) |
| for range | [条件、循环与控制转移](./control-flow) |
| Iterating Maps | [条件、循环与控制转移](./control-flow) |
| Iterating Strings | [条件、循环与控制转移](./control-flow) |
| break | [条件、循环与控制转移](./control-flow) |
| continue | [条件、循环与控制转移](./control-flow) |
| goto (discouraged) | [条件、循环与控制转移](./control-flow) |
| Composite Types | [字符串、数组与切片模型](./collections) |
| Arrays | [字符串、数组与切片模型](./collections) |
| Slices | [字符串、数组与切片模型](./collections) |
| Capacity and Growth | [字符串、数组与切片模型](./collections) |
| make() | [字符串、数组与切片模型](./collections) |
| Slice to Array Conversion | [字符串、数组与切片模型](./collections) |
| Array to Slice Conversion | [字符串、数组与切片模型](./collections) |
| Strings | [字符串、数组与切片模型](./collections) |
| Raw String Literals | [字符串、数组与切片模型](./collections) |
| Interpreted String Literals | [字符串、数组与切片模型](./collections) |
| Maps | [Map、集合与逗号 ok](./maps) |
| Comma-Ok Idiom | [Map、集合与逗号 ok](./maps) |
| Structs | [结构体、Tag 与嵌入](./types) |
| Struct Tags & JSON | [结构体、Tag 与嵌入](./types) |
| Embedding Structs | [结构体、Tag 与嵌入](./types) |

## 类型系统与代码组织

| 路线主题 | 中文讲解 |
| --- | --- |
| Functions | [函数、闭包与调用语义](./functions) |
| Functions Basics | [函数、闭包与调用语义](./functions) |
| Variadic Functions | [函数、闭包与调用语义](./functions) |
| Multiple Return Values | [函数、闭包与调用语义](./functions) |
| Anonymous Functions | [函数、闭包与调用语义](./functions) |
| Closures | [函数、闭包与调用语义](./functions) |
| Named Return Values | [函数、闭包与调用语义](./functions) |
| Call by Value | [函数、闭包与调用语义](./functions) |
| Pointers | [指针、别名与内存概览](./pointers) |
| Pointers Basics | [指针、别名与内存概览](./pointers) |
| Pointers with Structs | [指针、别名与内存概览](./pointers) |
| With Maps & Slices | [指针、别名与内存概览](./pointers) |
| Get a Brief Overview | [指针、别名与内存概览](./pointers) |
| Memory Management | [指针、别名与内存概览](./pointers) |
| Garbage Collection | [指针、别名与内存概览](./pointers) |
| Methods and Interfaces | [方法集、值与指针接收者](./methods) |
| Methods vs Functions | [方法集、值与指针接收者](./methods) |
| Pointer Receivers | [方法集、值与指针接收者](./methods) |
| Value Receivers | [方法集、值与指针接收者](./methods) |
| Interfaces | [接口、断言与动态类型](./interfaces) |
| Interfaces Basics | [接口、断言与动态类型](./interfaces) |
| Empty Interfaces | [接口、断言与动态类型](./interfaces) |
| Embedding Interfaces | [接口、断言与动态类型](./interfaces) |
| Type Assertions | [接口、断言与动态类型](./interfaces) |
| Type Switch | [接口、断言与动态类型](./interfaces) |
| Generics | [泛型函数、泛型类型与约束](./generics) |
| Why Generics? | [泛型函数、泛型类型与约束](./generics) |
| Generic Functions | [泛型函数、泛型类型与约束](./generics) |
| Generic Types / Interfaces | [泛型函数、泛型类型与约束](./generics) |
| Type Constraints | [泛型函数、泛型类型与约束](./generics) |
| Type Inference | [泛型函数、泛型类型与约束](./generics) |
| Code Organization | [包、模块、依赖与发布](./modules) |
| Modules & Dependencies | [包、模块、依赖与发布](./modules) |
| go mod init | [包、模块、依赖与发布](./modules) |
| go mod tidy | [包、模块、依赖与发布](./modules) |
| go mod vendor | [包、模块、依赖与发布](./modules) |
| Packages | [包、模块、依赖与发布](./modules) |
| Package Import Rules | [包、模块、依赖与发布](./modules) |
| Using 3rd Party Packages | [包、模块、依赖与发布](./modules) |
| Publishing Modules | [包、模块、依赖与发布](./modules) |
| Error Handling | [错误模型、包装与恢复](./errors) |
| Error Handling Basics | [错误模型、包装与恢复](./errors) |
| error interface | [错误模型、包装与恢复](./errors) |
| errors.New | [错误模型、包装与恢复](./errors) |
| fmt.Errorf | [错误模型、包装与恢复](./errors) |
| Wrapping/Unwrapping Errors | [错误模型、包装与恢复](./errors) |
| Sentinel Errors | [错误模型、包装与恢复](./errors) |
| panic and recover | [错误模型、包装与恢复](./errors) |
| Stack Traces & Debugging | [错误模型、包装与恢复](./errors) |

## 并发与取消

| 路线主题 | 中文讲解 |
| --- | --- |
| Concurrency | [Goroutine 与任务生命周期](./concurrency) |
| Goroutines | [Goroutine 与任务生命周期](./concurrency) |
| Channels | [Channel、缓冲与 select](./channels) |
| Buffered vs Unbuffered | [Channel、缓冲与 select](./channels) |
| Select Statement | [Channel、缓冲与 select](./channels) |
| sync Package | [Mutex、WaitGroup 与同步](./synchronization) |
| Mutexes | [Mutex、WaitGroup 与同步](./synchronization) |
| WaitGroups | [Mutex、WaitGroup 与同步](./synchronization) |
| Race Detection | [Mutex、WaitGroup 与同步](./synchronization) |
| context Package | [Context、截止时间与取消](./context) |
| Deadlines & Cancellations | [Context、截止时间与取消](./context) |
| Common Usecases | [Context、截止时间与取消](./context) |
| Worker Pools | [Worker Pool、Fan-in 与 Pipeline](./patterns) |
| Concurrency Patterns | [Worker Pool、Fan-in 与 Pipeline](./patterns) |
| fan-in | [Worker Pool、Fan-in 与 Pipeline](./patterns) |
| fan-out | [Worker Pool、Fan-in 与 Pipeline](./patterns) |
| pipeline | [Worker Pool、Fan-in 与 Pipeline](./patterns) |

## 标准库与测试

| 路线主题 | 中文讲解 |
| --- | --- |
| Standard Library | [文件、流式 I/O 与 JSON](./io) |
| I/O & File Handling | [文件、流式 I/O 与 JSON](./io) |
| os | [文件、流式 I/O 与 JSON](./io) |
| bufio | [文件、流式 I/O 与 JSON](./io) |
| encoding/json | [文件、流式 I/O 与 JSON](./io) |
| flag | [flag、time、regexp 与 embed](./standard-library) |
| time | [flag、time、regexp 与 embed](./standard-library) |
| regexp | [flag、time、regexp 与 embed](./standard-library) |
| go:embed for embedding | [flag、time、regexp 与 embed](./standard-library) |
| Testing & Benchmarking | [表驱动、替身与 HTTP 测试](./testing) |
| testing package basics | [表驱动、替身与 HTTP 测试](./testing) |
| Table-driven Tests | [表驱动、替身与 HTTP 测试](./testing) |
| Mocks and Stubs | [表驱动、替身与 HTTP 测试](./testing) |
| httptest for HTTP Tests | [表驱动、替身与 HTTP 测试](./testing) |
| Coverage | [表驱动、替身与 HTTP 测试](./testing) |
| Benchmarks | [Benchmark 与分配实验](./benchmarking) |

## 应用生态

| 路线主题 | 中文讲解 |
| --- | --- |
| Ecosystem & Popular Libraries | [CLI 与终端界面生态](./cli) |
| Building CLIs | [CLI 与终端界面生态](./cli) |
| Cobra | [CLI 与终端界面生态](./cli) |
| urfave/cli | [CLI 与终端界面生态](./cli) |
| bubbletea | [CLI 与终端界面生态](./cli) |
| Web Development | [HTTP 服务与 Web 框架](./web) |
| net/http (standard) | [HTTP 服务与 Web 框架](./web) |
| Frameworks (Optional) | [HTTP 服务与 Web 框架](./web) |
| gin | [HTTP 服务与 Web 框架](./web) |
| echo | [HTTP 服务与 Web 框架](./web) |
| fiber | [HTTP 服务与 Web 框架](./web) |
| beego | [HTTP 服务与 Web 框架](./web) |
| ORMs & DB Access | [pgx、SQL、连接池与 GORM](./databases) |
| pgx | [pgx、SQL、连接池与 GORM](./databases) |
| GORM | [pgx、SQL、连接池与 GORM](./databases) |
| gRPC & Protocol Buffers | [gRPC 与 Protocol Buffers](./ecosystem) |
| slog | [日志与实时通信生态](./logging-realtime) |
| Logging | [日志与实时通信生态](./logging-realtime) |
| Zerolog | [日志与实时通信生态](./logging-realtime) |
| Zap | [日志与实时通信生态](./logging-realtime) |
| Realtime Communication | [日志与实时通信生态](./logging-realtime) |
| Melody | [日志与实时通信生态](./logging-realtime) |
| Centrifugo | [日志与实时通信生态](./logging-realtime) |

## 工具链与交付

| 路线主题 | 中文讲解 |
| --- | --- |
| Go Toolchain and Tools | [静态分析、Linter 与漏洞检查](./quality) |
| Core Go Commands | [静态分析、Linter 与漏洞检查](./quality) |
| Code Quality and Analysis | [静态分析、Linter 与漏洞检查](./quality) |
| go vet | [静态分析、Linter 与漏洞检查](./quality) |
| goimports | [静态分析、Linter 与漏洞检查](./quality) |
| Linters | [静态分析、Linter 与漏洞检查](./quality) |
| revive | [静态分析、Linter 与漏洞检查](./quality) |
| staticcheck | [静态分析、Linter 与漏洞检查](./quality) |
| golangci-lint | [静态分析、Linter 与漏洞检查](./quality) |
| Security | [静态分析、Linter 与漏洞检查](./quality) |
| govulncheck | [静态分析、Linter 与漏洞检查](./quality) |
| Code Generation / Build Tags | [代码生成与构建约束](./generation) |
| go generate | [代码生成与构建约束](./generation) |
| Build Tags | [代码生成与构建约束](./generation) |
| Build Constraints & Tags | [代码生成与构建约束](./generation) |
| Performance and Debugging | [pprof、Trace 与调试](./performance) |
| pprof | [pprof、Trace 与调试](./performance) |
| trace | [pprof、Trace 与调试](./performance) |
| Race Detector | [pprof、Trace 与调试](./performance) |
| Deployment & Tooling | [可执行文件、交叉编译与部署](./deployment) |
| Building Executables | [可执行文件、交叉编译与部署](./deployment) |
| Cross-compilation | [可执行文件、交叉编译与部署](./deployment) |
| Compiler & Linker Flags | [可执行文件、交叉编译与部署](./deployment) |

## 运行时与高级主题

| 路线主题 | 中文讲解 |
| --- | --- |
| Advanced Topics | [逃逸、GC 与内存预算](./memory) |
| Memory Mgmt. in Depth | [逃逸、GC 与内存预算](./memory) |
| Escape Analysis | [逃逸、GC 与内存预算](./memory) |
| Reflection | [反射、类型检查与动态赋值](./reflection) |
| Unsafe Package | [Unsafe、cgo 与边界约束](./unsafe-cgo) |
| CGO Basics | [Unsafe、cgo 与边界约束](./unsafe-cgo) |
| Plugins & Dynamic Loading | [插件与动态加载](./plugins) |

## 项目与学习资料

| 路线主题 | 中文讲解 |
| --- | --- |
| Related Roadmaps | [课程、开源练习与学习方向](./resources) |
| Backend Roadmap | [课程、开源练习与学习方向](./resources) |
| DevOps Roadmap | [课程、开源练习与学习方向](./resources) |
| Docker Roadmap | [课程、开源练习与学习方向](./resources) |
| Kubernetes Roadmap | [课程、开源练习与学习方向](./resources) |
| System Design | [课程、开源练习与学习方向](./resources) |
| Software Design & Architecture | [课程、开源练习与学习方向](./resources) |

## 补充练习

- [HTTP 客户端、超时与重试](./http)：服务章节的延伸：连接复用、有限重试与本地验证。
- [实战：日志统计 CLI](./project-cli)：完整源码、合成输入、错误路径与升级任务。
- [实战：任务管理 API](./project-api)：完整源码、CRUD、分页、同步与数据库升级任务。
- [综合实验、数据集与交付](./projects)：贯穿路线的实验清单、输入数据和验收规范。

## 来源与扩展数据

本次路线 PDF SHA-256：`d8931fda36764f60fdfbb47b4c7617ce94b936cff2e9a35833149020cf19fe5b`。这是下载内容的校验，不代表官方路线版本号。

[课程数据清单](/go/curriculum.json)记录稳定章节 ID、阅读顺序、前置章节、来源主题、课程引用、已填课时、练习与样本。后续可扩展课时路径、难度、提示和解答位置；未制作的课时不标记已完成，不预填或伪造测量结果。

数据与两份项目的详细任务见[综合实验与交付](./projects)，课程作者和公开大纲见[学习资料](./resources)。
