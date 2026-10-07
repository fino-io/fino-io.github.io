---
title: Rust 学习指南
description: 从工具链、所有权和类型系统到并发、异步与项目实战的完整中文 Rust 学习路线。
pageClass: rust-directory
outline: false
aside: false
prev: false
next: false
---

这份指南面向希望系统学习 Rust 的中文读者。以 [The Rust Programming Language](https://doc.rust-lang.org/book/) 的知识顺序为主线，配合 [Rustlings](https://rustlings.rust-lang.org/) 的练习方式与 [Google Comprehensive Rust](https://google.github.io/comprehensive-rust/zh-CN/) 的课程主题，重新组织为适合自学的中文讲解。每章都提供关键概念、代码示例、练习与参考资料。

建议使用 **stable 工具链与 Rust 2024 edition**。代码以普通应用开发为起点，先建立所有权和类型系统的理解，再进入异步服务与底层专题。语言规则与库 API 可通过各章的官方链接进一步查阅。资料核对日期：2026-10-04。

## 如何安排学习

有编程经验的读者可以按每周 5–8 小时、8–12 周安排学习，时间仅作为计划参考。完全初学者应先熟悉函数、条件、循环和命令行，再放慢前六章的进度。每次学习采用「读一个概念 → 改写示例 → 完成练习 → 解释编译器反馈」的循环。

| 阶段 | 完成标准 |
| --- | --- |
| 第 1–3 周 · 基础 | 完成 01–06，能解释移动与借用，写出带错误处理的文件程序。 |
| 第 4–6 周 · 工程 | 完成 07–12，能组织一个库与命令行入口，编写测试并阅读 crate 文档。 |
| 第 7–9 周 · 并发 | 完成 13–15，能区分线程与异步任务，为 I/O 设置超时并限制并发。 |
| 第 10–12 周 · 实战 | 完成 17 的项目闭环，按需要学习 16 的底层专题与 18 的方向资料。 |

第一遍遇到宏、Unsafe、Pin 等内容时，先理解用途与边界；能独立完成小项目后再深入。学习进度以能否解释和修改程序来衡量。

## 起步与语言基础

| 编号 | 主题与学习目标 |
| --- | --- |
| 01 | [环境与工具链](./toolchain) · 安装 Rust，理解 Cargo、edition、格式化与编译器反馈。 |
| 02 | [语法与基本类型](./basics) · 变量、表达式、函数、控制流与数值转换。 |
| 03 | [所有权与借用](./ownership) · 移动、Copy、Clone、共享借用和可变借用。 |
| 04 | [结构体、枚举与模式匹配](./data-modeling) · 用类型表达业务状态，处理 Option 和穷尽匹配。 |
| 05 | [字符串与集合](./collections) · String、str、Vec、HashMap、切片与 Unicode。 |
| 06 | [错误处理](./error-handling) · Result、问号运算符、错误上下文与 panic 的边界。 |

## 类型系统与工程实践

| 编号 | 主题与学习目标 |
| --- | --- |
| 07 | [泛型与 Trait](./traits) · 能力约束、关联类型、静态分发与动态分发。 |
| 08 | [生命周期](./lifetimes) · 理解引用之间的关系，设计借用接口，辨认 'static。 |
| 09 | [模块、Cargo 与依赖](./project-structure) · crate、模块可见性、workspace、features 与依赖管理。 |
| 10 | [闭包与迭代器](./iterators) · 捕获环境、惰性求值、所有权与集合转换。 |
| 11 | [智能指针与内部可变性](./smart-pointers) · Box、Rc、Arc、RefCell、Weak 与 RAII。 |
| 12 | [测试、文档与质量检查](./testing) · 单元测试、集成测试、文档测试与持续集成。 |

## 并发与进阶

| 编号 | 主题与学习目标 |
| --- | --- |
| 13 | [线程与并发](./concurrency) · 消息传递、共享状态、Send、Sync 与死锁边界。 |
| 14 | [Async 与 Tokio](./async) · Future、任务调度、超时、取消、背压与阻塞任务。 |
| 15 | [常用生态与技术选型](./ecosystem) · 复用成熟的 CLI、序列化、HTTP、数据库与 RPC 库。 |
| 16 | [宏、Unsafe 与性能](./advanced) · 宏的边界、FFI、Pin、性能测量与底层学习顺序。 |

## 项目与延伸阅读

| 编号 | 主题与学习目标 |
| --- | --- |
| 17 | [从练习到完整项目](./projects) · 一个可运行的文本检索 CLI、HTTP 服务起点和明确验收清单。 |
| 18 | [资料、方向与常见问题](./resources) · 选择主教材，规划服务端、系统、WebAssembly 或嵌入式方向。 |

从 [01 · 环境与工具链](./toolchain) 开始；已经会写简单 Rust 程序的读者，可以先检查 [所有权](./ownership) 与 [错误处理](./error-handling)，再进入工程阶段。
