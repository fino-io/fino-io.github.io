---
title: roadmap.sh Go 大纲与正文对照
description: 按原路线知识层级展示主题、课程和对应正文小节。
pageClass: aip-article go-course
---

# roadmap.sh Go 大纲与正文对照

以 [roadmap.sh Go](https://roadmap.sh/golang)和[官方路线 PDF](https://roadmap.sh/pdfs/roadmaps/golang.pdf)作为覆盖基准，核对日期 2026-10-09。表中保留原图的短主题名称，并链接到具体讲解小节；分类节点与知识点都列入，不将表格行数当作课程数量。

中文课程按知识层级组织，主干为语言基础、方法与接口、泛型、代码组织、错误处理、并发、标准库、测试、生态、工具链与高级主题。综合项目、HTTP 客户端和额外实验明确作为延伸。图示是语义模型，涉及版本、平台或底层表示时以相应官方说明为准。

## 1. 语言基础

原图范围：**Language Basics**。认识值、容器与控制流，先能解释顺序程序的每一步。

| 原路线主题 | 课程与正文小节 |
| --- | --- |
| Language Basics | [1.1. Go 的定位、历史与运行模型 · Go 为什么出现，适合什么工作](./introduction#concept-1) |
| Introduction to Go | [1.1. Go 的定位、历史与运行模型 · Go 为什么出现，适合什么工作](./introduction#concept-1) |
| Why use Go | [1.1. Go 的定位、历史与运行模型 · Go 为什么出现，适合什么工作](./introduction#concept-1) |
| History of Go | [1.1. Go 的定位、历史与运行模型 · Go 为什么出现，适合什么工作](./introduction#concept-1) |
| Setting up the Environment | [1.2. 安装环境、Hello World 与文档入口 · 安装与确认环境](./toolchain#concept-1) |
| Hello World in Go | [1.2. 安装环境、Hello World 与文档入口 · 创建第一个模块](./toolchain#concept-2) |
| go command | [1.2. 安装环境、Hello World 与文档入口 · 创建第一个模块](./toolchain#concept-2) |
| Commands & Docs | [1.2. 安装环境、Hello World 与文档入口 · 查资料也有明确入口](./toolchain#concept-4) |
| Variables & Constants | [1.3. 变量、常量、iota 与作用域 · 用名字、值和作用域理解声明](./variables#concept-1) |
| var vs := | [1.3. 变量、常量、iota 与作用域 · 用名字、值和作用域理解声明](./variables#concept-1) |
| Zero Values | [1.3. 变量、常量、iota 与作用域 · 零值不是“未定义”](./variables#concept-3) |
| const and iota | [1.3. 变量、常量、iota 与作用域 · const 与 iota：编译期表达式](./variables#concept-4) |
| Scope and Shadowing | [1.3. 变量、常量、iota 与作用域 · 用名字、值和作用域理解声明](./variables#concept-1) |
| Data Types | [1.4. 基本类型、数值与类型转换 · 先按需要保存的信息选择类型](./basics#concept-1) |
| Boolean | [1.4. 基本类型、数值与类型转换 · 复数、布尔与 rune](./basics#concept-4) |
| Numeric Types | [1.4. 基本类型、数值与类型转换 · 先按需要保存的信息选择类型](./basics#concept-1) |
| Integers (Signed, Unsigned) | [1.4. 基本类型、数值与类型转换 · 整数与固定宽度](./basics#concept-2) |
| Floating Points | [1.4. 基本类型、数值与类型转换 · 浮点：表示误差与比较](./basics#concept-3) |
| Complex Numbers | [1.4. 基本类型、数值与类型转换 · 复数、布尔与 rune](./basics#concept-4) |
| Runes | [1.4. 基本类型、数值与类型转换 · 复数、布尔与 rune](./basics#concept-4) |
| Type Conversion | [1.4. 基本类型、数值与类型转换 · 整数与固定宽度](./basics#concept-2) |
| Composite Types | [1.5. 数组、切片、容量与共享存储 · 切片是一段存储的描述](./collections#concept-2) |
| Arrays | [1.5. 数组、切片、容量与共享存储 · 数组是带长度的值](./collections#concept-1) |
| Slices | [1.5. 数组、切片、容量与共享存储 · 切片是一段存储的描述](./collections#concept-2) |
| Capacity and Growth | [1.5. 数组、切片、容量与共享存储 · append 可能共享，也可能换数组](./collections#concept-4) |
| make() | [1.5. 数组、切片、容量与共享存储 · make 的长度与容量分别做什么](./collections#concept-3) |
| Slice to Array Conversion | [1.5. 数组、切片、容量与共享存储 · 数组与切片如何转换](./collections#concept-6) |
| Array to Slice Conversion | [1.5. 数组、切片、容量与共享存储 · 数组与切片如何转换](./collections#concept-6) |
| Strings | [1.6. 字符串、字节、rune 与 Unicode · string、byte 与 rune 的三种视角](./strings#concept-1) |
| Raw String Literals | [1.6. 字符串、字节、rune 与 Unicode · 两种字面量只是书写方式不同](./strings#concept-2) |
| Interpreted String Literals | [1.6. 字符串、字节、rune 与 Unicode · 两种字面量只是书写方式不同](./strings#concept-2) |
| Maps | [1.7. Map、集合与逗号 ok · 创建、读取、更新与删除](./maps#concept-2) |
| Comma-Ok Idiom | [1.7. Map、集合与逗号 ok · 把查找结果拆成值与存在性](./maps#concept-1) |
| Structs | [1.8. 结构体、字段标签与组合 · 用字段表达一份数据](./types#concept-1) |
| Struct Tags & JSON | [1.8. 结构体、字段标签与组合 · Tag 给工具读，不改变字段类型](./types#concept-2) |
| Embedding Structs | [1.8. 结构体、字段标签与组合 · 具名组合与嵌入](./types#concept-4) |
| Conditionals | [1.9. 条件、循环与控制转移 · if 初始化与 switch](./control-flow#concept-2) |
| if | [1.9. 条件、循环与控制转移 · if 初始化与 switch](./control-flow#concept-2) |
| if-else | [1.9. 条件、循环与控制转移 · if 初始化与 switch](./control-flow#concept-2) |
| switch | [1.9. 条件、循环与控制转移 · if 初始化与 switch](./control-flow#concept-2) |
| Loops | [1.9. 条件、循环与控制转移 · 执行路径与循环不变量](./control-flow#concept-1) |
| for loop | [1.9. 条件、循环与控制转移 · range 的值是复制](./control-flow#concept-3) |
| for range | [1.9. 条件、循环与控制转移 · range 的值是复制](./control-flow#concept-3) |
| Iterating Maps | [1.9. 条件、循环与控制转移 · range 的值是复制](./control-flow#concept-3) |
| Iterating Strings | [1.9. 条件、循环与控制转移 · range 的值是复制](./control-flow#concept-3) |
| break | [1.9. 条件、循环与控制转移 · break、continue 与标签](./control-flow#concept-4) |
| continue | [1.9. 条件、循环与控制转移 · break、continue 与标签](./control-flow#concept-4) |
| goto (discouraged) | [1.9. 条件、循环与控制转移 · break、continue 与标签](./control-flow#concept-4) |
| Functions | [1.10. 函数、闭包与调用语义 · 参数、返回值与调用过程](./functions#concept-1) |
| Functions Basics | [1.10. 函数、闭包与调用语义 · 参数、返回值与调用过程](./functions#concept-1) |
| Variadic Functions | [1.10. 函数、闭包与调用语义 · 可变参数与共享切片](./functions#concept-3) |
| Multiple Return Values | [1.10. 函数、闭包与调用语义 · 参数、返回值与调用过程](./functions#concept-1) |
| Anonymous Functions | [1.10. 函数、闭包与调用语义 · 函数值、匿名函数与高阶操作](./functions#concept-2) |
| Closures | [1.10. 函数、闭包与调用语义 · 闭包是状态，不只是匿名语法](./functions#concept-4) |
| Named Return Values | [1.10. 函数、闭包与调用语义 · 命名返回值与 defer 的交互](./functions#concept-7) |
| Call by Value | [1.10. 函数、闭包与调用语义 · 参数、返回值与调用过程](./functions#concept-1) |
| Pointers | [1.11. 指针、别名与内存概览 · 修改对象和替换指针不是一回事](./pointers#concept-2) |
| Pointers Basics | [1.11. 指针、别名与内存概览 · 修改对象和替换指针不是一回事](./pointers#concept-2) |
| Pointers with Structs | [1.11. 指针、别名与内存概览 · 修改对象和替换指针不是一回事](./pointers#concept-2) |
| With Maps & Slices | [1.11. 指针、别名与内存概览 · map 与切片的复制模型](./pointers#concept-3) |
| Get a Brief Overview | [1.11. 指针、别名与内存概览 · 地址安全与内存管理概览](./pointers#concept-4) |
| Memory Management | [1.11. 指针、别名与内存概览 · 地址安全与内存管理概览](./pointers#concept-4) |
| Garbage Collection | [1.11. 指针、别名与内存概览 · 地址安全与内存管理概览](./pointers#concept-4) |

## 2. 方法与接口

原图范围：**Methods and Interfaces**。把数据上的操作与使用方需要的行为区分开。

| 原路线主题 | 课程与正文小节 |
| --- | --- |
| Methods and Interfaces | [2.1. 方法集、值与指针接收者 · 值接收者与指针接收者](./methods#concept-2) |
| Methods vs Functions | [2.1. 方法集、值与指针接收者 · 值接收者与指针接收者](./methods#concept-2) |
| Pointer Receivers | [2.1. 方法集、值与指针接收者 · 值接收者与指针接收者](./methods#concept-2) |
| Value Receivers | [2.1. 方法集、值与指针接收者 · 值接收者与指针接收者](./methods#concept-2) |
| Interfaces | [2.2. 接口、断言与动态类型 · 接口值的两部分信息](./interfaces#concept-1) |
| Interfaces Basics | [2.2. 接口、断言与动态类型 · 用一个小接口替换真实 I/O](./interfaces#concept-2) |
| Empty Interfaces | [2.2. 接口、断言与动态类型 · 动态类型、any、断言与 type switch](./interfaces#concept-4) |
| Embedding Interfaces | [2.2. 接口、断言与动态类型 · 嵌入接口与行为交集](./interfaces#concept-3) |
| Type Assertions | [2.2. 接口、断言与动态类型 · 动态类型、any、断言与 type switch](./interfaces#concept-4) |
| Type Switch | [2.2. 接口、断言与动态类型 · 动态类型、any、断言与 type switch](./interfaces#concept-4) |

## 3. 泛型

原图范围：**Generics**。仅在相同算法需要跨类型复用时引入类型参数。

| 原路线主题 | 课程与正文小节 |
| --- | --- |
| Generics | [3.1. 泛型函数、泛型类型与约束 · 把类型参数放回算法中理解](./generics#concept-1) |
| Why Generics? | [3.1. 泛型函数、泛型类型与约束 · 重复来自类型时才考虑泛型](./generics#concept-2) |
| Generic Functions | [3.1. 泛型函数、泛型类型与约束 · 重复来自类型时才考虑泛型](./generics#concept-2) |
| Generic Types / Interfaces | [3.1. 泛型函数、泛型类型与约束 · 泛型类型：保持元素类型的集合](./generics#concept-5) |
| Type Constraints | [3.1. 泛型函数、泛型类型与约束 · 类型约束和运行时接口分工](./generics#concept-6) |
| Type Inference | [3.1. 泛型函数、泛型类型与约束 · 类型约束和运行时接口分工](./generics#concept-6) |

## 4. 代码组织

原图范围：**Code Organization**。把包、模块、依赖版本与发布过程连成一条完整链路。

| 原路线主题 | 课程与正文小节 |
| --- | --- |
| Code Organization | [4.1. 包、模块、依赖与发布 · 从文件目录到模块版本](./modules#concept-1) |
| Modules & Dependencies | [4.1. 包、模块、依赖与发布 · 模块初始化、整理与 vendor](./modules#concept-5) |
| go mod init | [4.1. 包、模块、依赖与发布 · 模块初始化、整理与 vendor](./modules#concept-5) |
| go mod tidy | [4.1. 包、模块、依赖与发布 · 模块初始化、整理与 vendor](./modules#concept-5) |
| go mod vendor | [4.1. 包、模块、依赖与发布 · 模块初始化、整理与 vendor](./modules#concept-5) |
| Packages | [4.1. 包、模块、依赖与发布 · 从模块路径到一次包导入](./modules#concept-6) |
| Package Import Rules | [4.1. 包、模块、依赖与发布 · 从模块路径到一次包导入](./modules#concept-6) |
| Using 3rd Party Packages | [4.1. 包、模块、依赖与发布 · 从模块路径到一次包导入](./modules#concept-6) |
| Publishing Modules | [4.1. 包、模块、依赖与发布 · 发布模块与 v2 的步骤](./modules#concept-9) |

## 5. 错误处理

原图范围：**Error Handling**。让失败成为可识别的返回结果，而不是隐蔽的控制流。

| 原路线主题 | 课程与正文小节 |
| --- | --- |
| Error Handling | [5.1. 错误模型、包装与恢复 · 沿错误链保留原因](./errors#concept-1) |
| Error Handling Basics | [5.1. 错误模型、包装与恢复 · 先处理错误，再继续工作](./errors#concept-2) |
| error interface | [5.1. 错误模型、包装与恢复 · 先处理错误，再继续工作](./errors#concept-2) |
| errors.New | [5.1. 错误模型、包装与恢复 · 创建错误值与稳定识别](./errors#error-values) |
| fmt.Errorf | [5.1. 错误模型、包装与恢复 · 先处理错误，再继续工作](./errors#concept-2) |
| Wrapping/Unwrapping Errors | [5.1. 错误模型、包装与恢复 · 先处理错误，再继续工作](./errors#concept-2) |
| Sentinel Errors | [5.1. 错误模型、包装与恢复 · 创建错误值与稳定识别](./errors#error-values) |
| panic and recover | [5.1. 错误模型、包装与恢复 · recover 的局部性与堆栈](./errors#concept-7) |
| Stack Traces & Debugging | [5.1. 错误模型、包装与恢复 · recover 的局部性与堆栈](./errors#concept-7) |

## 6. 并发

原图范围：**Concurrency**。先管理任务寿命，再理解通信、同步、取消和并发模式。

| 原路线主题 | 课程与正文小节 |
| --- | --- |
| Concurrency | [6.1. Goroutine 与任务生命周期 · 并发不自动提升速度](./concurrency#concept-2) |
| Goroutines | [6.1. Goroutine 与任务生命周期 · 并发不自动提升速度](./concurrency#concept-2) |
| Channels | [6.2. Channel、缓冲与 select · 五种状态决定能否继续](./channels#concept-2) |
| Buffered vs Unbuffered | [6.2. Channel、缓冲与 select · 五种状态决定能否继续](./channels#concept-2) |
| Select Statement | [6.2. Channel、缓冲与 select · select 的就绪规则](./channels#concept-4) |
| sync Package | [6.3. Mutex、WaitGroup 与同步 · 完整临界区](./synchronization#concept-2) |
| Mutexes | [6.3. Mutex、WaitGroup 与同步 · Mutex、RWMutex 与 WaitGroup](./synchronization#concept-3) |
| WaitGroups | [6.3. Mutex、WaitGroup 与同步 · Mutex、RWMutex 与 WaitGroup](./synchronization#concept-3) |
| Race Detection | [6.3. Mutex、WaitGroup 与同步 · Race 检测与逻辑错误](./synchronization#concept-5) |
| context Package | [6.4. Context、截止时间与取消 · Context 是协作取消](./context#concept-2) |
| Deadlines & Cancellations | [6.4. Context、截止时间与取消 · 取消原因、超时和父子关系的实验](./context#concept-6) |
| Common Usecases | [6.4. Context、截止时间与取消 · 请求工作与后台工作分开建生命周期](./context#concept-8) |
| Worker Pools | [6.5. Worker Pool、Fan-in 与 Pipeline · 角色与边界](./patterns#concept-1) |
| Concurrency Patterns | [6.5. Worker Pool、Fan-in 与 Pipeline · 角色与边界](./patterns#concept-1) |
| fan-in | [6.5. Worker Pool、Fan-in 与 Pipeline · 角色与边界](./patterns#concept-1) |
| fan-out | [6.5. Worker Pool、Fan-in 与 Pipeline · 角色与边界](./patterns#concept-1) |
| pipeline | [6.5. Worker Pool、Fan-in 与 Pipeline · 角色与边界](./patterns#concept-1) |

## 7. 标准库

原图范围：**Standard Library**。围绕输入、解析、资源、时间和输出学习通用工具。

| 原路线主题 | 课程与正文小节 |
| --- | --- |
| Standard Library | [7.1. 文件、流式 I/O 与 JSON · Reader 的 n 与 err 要同时处理](./io#concept-5) |
| I/O & File Handling | [7.1. 文件、流式 I/O 与 JSON · 用 Reader 与 Writer 统一 I/O](./io#concept-2) |
| os | [7.1. 文件、流式 I/O 与 JSON · 用 Reader 与 Writer 统一 I/O](./io#concept-2) |
| bufio | [7.1. 文件、流式 I/O 与 JSON · 用 Reader 与 Writer 统一 I/O](./io#concept-2) |
| encoding/json | [7.1. 文件、流式 I/O 与 JSON · JSON 数字、null 与未知字段](./io#concept-7) |
| slog | [7.1. 文件、流式 I/O 与 JSON · 常用标准库与约定](./io#concept-4) |
| flag | [7.2. flag、time、regexp 与 embed · flag：解析与退出分离](./standard-library#concept-2) |
| time | [7.2. flag、time、regexp 与 embed · time：时间点、时长与时区](./standard-library#concept-3) |
| regexp | [7.2. flag、time、regexp 与 embed · regexp：编译、匹配与数据提取](./standard-library#concept-4) |
| go:embed for embedding | [7.2. flag、time、regexp 与 embed · embed：编译时资源](./standard-library#concept-5) |

## 8. 测试与基准

原图范围：**Testing & Benchmarking**。把行为写成断言，再用可复现测量回答性能问题。

| 原路线主题 | 课程与正文小节 |
| --- | --- |
| Testing & Benchmarking | [8.1. 表驱动、替身与 HTTP 测试 · 从一个行为建立红、绿、重构循环](./testing#concept-1) |
| testing package basics | [8.1. 表驱动、替身与 HTTP 测试 · 从一个行为建立红、绿、重构循环](./testing#concept-1) |
| Table-driven Tests | [8.1. 表驱动、替身与 HTTP 测试 · 从一个行为建立红、绿、重构循环](./testing#concept-1) |
| Mocks and Stubs | [8.1. 表驱动、替身与 HTTP 测试 · 从一个行为建立红、绿、重构循环](./testing#concept-1) |
| httptest for HTTP Tests | [8.1. 表驱动、替身与 HTTP 测试 · 从一个行为建立红、绿、重构循环](./testing#concept-1) |
| Coverage | [8.1. 表驱动、替身与 HTTP 测试 · 从一个行为建立红、绿、重构循环](./testing#concept-1) |
| Benchmarks | [8.2. Benchmark 与分配实验 · 同一任务、两种实现](./benchmarking#concept-2) |

## 9. 应用生态

原图范围：**Ecosystem & Popular Libraries**。逐项认识路线中的成熟方案，按实际职责选择实现。

| 原路线主题 | 课程与正文小节 |
| --- | --- |
| Ecosystem & Popular Libraries | [9.1. CLI 与终端界面生态 · 命令框架只组织程序入口](./cli#concept-1) |
| Building CLIs | [9.1. CLI 与终端界面生态 · 命令框架只组织程序入口](./cli#concept-1) |
| Cobra | [9.1. CLI 与终端界面生态 · Cobra 的完整最小入口](./cli#concept-3) |
| urfave/cli | [9.1. CLI 与终端界面生态 · urfave/cli 的对应职责](./cli#concept-4) |
| bubbletea | [9.1. CLI 与终端界面生态 · Bubble Tea：事件驱动而非循环打印](./cli#concept-5) |
| Web Development | [9.2. HTTP 服务与 Web 框架 · 请求从协议边界进入业务](./web#concept-1) |
| net/http (standard) | [9.2. HTTP 服务与 Web 框架 · 最小 HTTP 服务](./web#concept-2) |
| Frameworks (Optional) | [9.2. HTTP 服务与 Web 框架 · 框架节点逐项对照](./web#concept-6) |
| gin | [9.2. HTTP 服务与 Web 框架 · 框架节点逐项对照](./web#concept-6) |
| echo | [9.2. HTTP 服务与 Web 框架 · 框架节点逐项对照](./web#concept-6) |
| fiber | [9.2. HTTP 服务与 Web 框架 · 框架节点逐项对照](./web#concept-6) |
| beego | [9.2. HTTP 服务与 Web 框架 · 框架节点逐项对照](./web#concept-6) |
| gRPC & Protocol Buffers | [9.3. gRPC 与 Protocol Buffers · 定义契约与生成路径](./ecosystem#concept-2) |
| ORMs & DB Access | [9.4. pgx、SQL、连接池与 GORM · SQL 基础先于 ORM](./databases#concept-2) |
| pgx | [9.4. pgx、SQL、连接池与 GORM · pgx 原生连接池与 database/sql 选择](./databases#concept-6) |
| GORM | [9.4. pgx、SQL、连接池与 GORM · GORM 的明确查询与错误](./databases#concept-7) |
| Logging | [9.5. 结构化日志、slog、Zap 与 Zerolog · Zap 与 Zerolog 的具体使用](./logging#concept-3) |
| Zerolog | [9.5. 结构化日志、slog、Zap 与 Zerolog · Zap 与 Zerolog 的具体使用](./logging#concept-3) |
| Zap | [9.5. 结构化日志、slog、Zap 与 Zerolog · Zap 与 Zerolog 的具体使用](./logging#concept-3) |
| Realtime Communication | [9.6. WebSocket、Melody 与 Centrifugo · WebSocket：连接是一段生命周期](./realtime#concept-2) |
| Melody | [9.6. WebSocket、Melody 与 Centrifugo · WebSocket：连接是一段生命周期](./realtime#concept-2) |
| Centrifugo | [9.6. WebSocket、Melody 与 Centrifugo · WebSocket：连接是一段生命周期](./realtime#concept-2) |

## 10. 工具链与工具

原图范围：**Go Toolchain and Tools**。掌握构建、质量、生成、诊断和部署的完整工作流。

| 原路线主题 | 课程与正文小节 |
| --- | --- |
| Core Go Commands | [10.1. go 命令与工具工作流 · 从修改源码到得到产物](./commands#concept-1) |
| go run | [10.1. go 命令与工具工作流 · 从修改源码到得到产物](./commands#concept-1) |
| go build | [10.1. go 命令与工具工作流 · 从修改源码到得到产物](./commands#concept-1) |
| go install | [10.1. go 命令与工具工作流 · 从修改源码到得到产物](./commands#concept-1) |
| go fmt | [10.1. go 命令与工具工作流 · 从修改源码到得到产物](./commands#concept-1) |
| go mod | [10.1. go 命令与工具工作流 · 从修改源码到得到产物](./commands#concept-1) |
| go test | [10.1. go 命令与工具工作流 · 从修改源码到得到产物](./commands#concept-1) |
| go clean | [10.1. go 命令与工具工作流 · 从修改源码到得到产物](./commands#concept-1) |
| go doc | [10.1. go 命令与工具工作流 · 从修改源码到得到产物](./commands#concept-1) |
| go version | [10.1. go 命令与工具工作流 · 从修改源码到得到产物](./commands#concept-1) |
| Go Toolchain and Tools | [10.2. 静态分析、Linter 与漏洞检查 · 每种工具负责一类证据](./quality#concept-1) |
| Code Quality and Analysis | [10.2. 静态分析、Linter 与漏洞检查 · 每种工具负责一类证据](./quality#concept-1) |
| go vet | [10.2. 静态分析、Linter 与漏洞检查 · 基础质量流程与具体失败](./quality#concept-2) |
| goimports | [10.2. 静态分析、Linter 与漏洞检查 · goimports：整理导入](./quality#concept-3) |
| Linters | [10.2. 静态分析、Linter 与漏洞检查 · 三类 Linter 节点](./quality#concept-4) |
| revive | [10.2. 静态分析、Linter 与漏洞检查 · 三类 Linter 节点](./quality#concept-4) |
| staticcheck | [10.2. 静态分析、Linter 与漏洞检查 · 三类 Linter 节点](./quality#concept-4) |
| golangci-lint | [10.2. 静态分析、Linter 与漏洞检查 · 三类 Linter 节点](./quality#concept-4) |
| Security | [10.2. 静态分析、Linter 与漏洞检查 · govulncheck：依赖和调用路径](./quality#concept-5) |
| govulncheck | [10.2. 静态分析、Linter 与漏洞检查 · govulncheck：依赖和调用路径](./quality#concept-5) |
| Code Generation / Build Tags | [10.3. 代码生成与构建约束 · go generate 是显式命令](./generation#concept-2) |
| go generate | [10.3. 代码生成与构建约束 · go generate 是显式命令](./generation#concept-2) |
| Build Tags | [10.3. 代码生成与构建约束 · build tags 与平台文件](./generation#concept-4) |
| Performance and Debugging | [10.4. pprof、Trace 与调试 · 先从现象选择观测工具](./performance#concept-1) |
| pprof | [10.4. pprof、Trace 与调试 · 从 Profile 到修复的具体链路](./performance#concept-6) |
| trace | [10.4. pprof、Trace 与调试 · Trace 的调度与等待实验](./performance#concept-7) |
| Race Detector | [10.4. pprof、Trace 与调试 · Delve 与错误重现](./performance#concept-8) |
| Deployment & Tooling | [10.5. 可执行文件、交叉编译与部署 · 构建与平台边界](./deployment#concept-3) |
| Building Executables | [10.5. 可执行文件、交叉编译与部署 · 构建与平台边界](./deployment#concept-3) |
| Cross-compilation | [10.5. 可执行文件、交叉编译与部署 · 构建与平台边界](./deployment#concept-3) |

## 11. 高级主题

原图范围：**Advanced Topics**。在理解类型与运行时后，学习动态能力和平台边界。

| 原路线主题 | 课程与正文小节 |
| --- | --- |
| Advanced Topics | [11.1. 逃逸、GC 与内存预算 · 分配、存活与回收是三个时间视角](./memory#concept-1) |
| Memory Mgmt. in Depth | [11.1. 逃逸、GC 与内存预算 · 分配速率、存活集与可达性](./memory#concept-3) |
| Escape Analysis | [11.1. 逃逸、GC 与内存预算 · 栈、堆与逃逸实验](./memory#concept-2) |
| Reflection | [11.2. 反射、类型检查与动态赋值 · 可运行的字段更新实验](./reflection#concept-3) |
| Unsafe Package | [11.3. Unsafe、内存布局与指针约束 · Pointer 与 uintptr 的关键区别](./unsafe#concept-3) |
| Build Constraints & Tags | [11.4. 构建约束、编译器与链接器参数 · 构建约束决定文件是否参与编译](./build-advanced#concept-1) |
| Compiler & Linker Flags | [11.4. 构建约束、编译器与链接器参数 · 编译器参数与链接器参数](./build-advanced#concept-3) |
| CGO Basics | [11.5. cgo、C 内存与跨平台构建 · cgo 最小实验](./cgo#concept-1) |
| Plugins & Dynamic Loading | [11.6. 插件与动态加载 · 两个模块目录的最小实验](./plugins#concept-2) |

## 12. 综合练习与延伸

用项目回顾主线，相关路线与课程只作为后续学习入口。

| 原路线主题 | 课程与正文小节 |
| --- | --- |
| Related Roadmaps | [12.4. 课程、开源练习与学习方向 · 后续路线不是 Go 语言必修清单](./resources#concept-5) |
| Backend Roadmap | [12.4. 课程、开源练习与学习方向 · 后续路线不是 Go 语言必修清单](./resources#concept-5) |
| DevOps Roadmap | [12.4. 课程、开源练习与学习方向 · 后续路线不是 Go 语言必修清单](./resources#concept-5) |
| Docker Roadmap | [12.4. 课程、开源练习与学习方向 · 后续路线不是 Go 语言必修清单](./resources#concept-5) |
| Kubernetes Roadmap | [12.4. 课程、开源练习与学习方向 · 后续路线不是 Go 语言必修清单](./resources#concept-5) |
| System Design | [12.4. 课程、开源练习与学习方向 · 后续路线不是 Go 语言必修清单](./resources#concept-5) |
| Software Design & Architecture | [12.4. 课程、开源练习与学习方向 · 后续路线不是 Go 语言必修清单](./resources#concept-5) |

## 扩展内容与来源快照

HTTP 客户端、综合项目和数据实验用于串联学习，不伪称为原图单独节点。相关课程只作教学辅助；语法、标准库和运行时语义优先查 Go 官方资料。

本次官方 PDF SHA-256：`d8931fda36764f60fdfbb47b4c7617ce94b936cff2e9a35833149020cf19fe5b`，表示核对文件的内容校验，并非官方版本号。

[课程数据](/go/curriculum.json)中保留单元、原主题、实际锚点、官方链接和样本引用；构建会检查章节归属、重复主题、先修引用与正文锚点。后续增加例子时仍可核对来源和位置。
