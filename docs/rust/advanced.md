---
title: 16 · 宏、Unsafe 与性能
description: 了解声明宏、Unsafe、FFI、Pin 和性能测量的边界，按需要学习底层专题。
pageClass: aip-article rust-article
---

# 16 · 宏、Unsafe 与性能

本章目标：知道进阶工具为什么存在、使用时需要证明什么。普通应用应先掌握安全 Rust 和成熟库，再按真实需求进入这些专题。

## 宏：什么时候比函数更合适

函数和泛型适合抽象运行时行为；宏适合重复的语法结构、可变参数或代码生成。声明宏 `macro_rules!` 通过模式匹配生成语法；过程宏常见于 `derive`、属性宏与函数式宏，通常放在专门的 proc-macro crate 中。

```rust
macro_rules! string_list {
    ($($item:expr),* $(,)?) => {
        vec![$(String::from($item)),*]
    };
}

fn main() {
    let topics = string_list!["所有权", "并发",];
    assert_eq!(topics.len(), 2);
}
```

上例通过重复模式接收多个表达式，并允许尾随逗号。真实项目中，已有函数或标准宏能解决问题时优先使用它们。宏会增加调试与错误理解成本；输入与输出语法应尽量简单。

## Unsafe 把证明责任交给实现者

Unsafe 开放一些编译器不能自动验证的操作，例如解引用裸指针、调用 unsafe 函数和访问特定外部接口。它仍保留普通类型检查，不会关闭所有 Rust 规则。

```rust
fn main() {
    let number = 42;
    let pointer = &number as *const i32;
    // SAFETY: pointer 来自仍存活的 number，地址对齐且数据已初始化；
    // 读取期间没有与其冲突的可变访问。
    let value = unsafe { *pointer };
    assert_eq!(value, 42);
}
```

这个操作完全可以用安全引用完成，示例仅用于观察裸指针与证明边界。实际 unsafe 代码要说明有效性、对齐、初始化、别名、长度、线程与释放规则。将不安全操作集中在小范围内，并给调用者提供能够维持不变量的安全接口。

`unsafe fn` 定义调用者需满足的契约，`unsafe {}` 表示实现者在该位置承担证明责任。Rust 2024 默认会对 unsafe 函数体内没有放入显式 unsafe 块的不安全操作发出警告，具体见 [Unsafe Reference](https://doc.rust-lang.org/reference/unsafe-keyword.html) 和 Edition Guide。

## FFI 与内存布局

通过 `extern "C"` 与 C ABI 对接时，除了函数签名，还要约定谁分配、谁释放、缓冲区长度、字符串编码、回调生命周期和线程。`#[repr(C)]` 用于指定相应布局，但不能把所有 Rust 类型变成可跨 ABI 直接传递的类型。

String、Vec 和 Rust 引用的内部约定不能随意暴露给外部语言。使用成熟的 [cxx](https://cxx.rs/) 或 [PyO3](https://pyo3.rs/) 可以减少重复的桥接工作，仍需遵守它们的接口与生命周期约束。Rust 2024 的外部块使用 `unsafe extern` 表达声明责任。

## Pin、Unpin 与高级类型

Pin 在相关契约下限制被指向值的移动，常见于异步状态机和自引用结构。它不等于普通的「放到堆上」；Box 单独并不建立所有 Pin 保证。Unpin 表示类型不依赖这种固定地址约束。应用层一般使用 `Box::pin` 和库提供的投影工具，不需要手写 Future 或未经证明地操作内部字段。

进一步学习可按问题选择：关联类型与 GAT 用于表达更精细的借用接口，HRTB 用于对多种生命周期成立的约束，newtype 用于业务语义与接口封装，trait object 用于运行时多态。先能解释需求，再引入更复杂的签名。

## 性能：先测量再改变设计

1. 用真实数据和 release 构建确认瓶颈。
2. 区分算法复杂度、I/O 等待、锁争用、分配与复制。
3. 一次修改一个明确因素，保留正确性测试与测量记录。
4. 优先使用合适的数据结构、缓存布局和批量操作。

基准可使用 [Criterion](https://docs.rs/criterion/latest/criterion/)，分析可使用平台 profiler 或火焰图工具。优化不能仅凭一条耗时断言；要控制输入、构建配置、环境与测量波动。编译时间、代码体积、维护成本也属于工程取舍。

## 练习与验收

阅读一个成熟 crate 的小型 unsafe 封装，逐条解释其安全契约；无需自己发明底层容器。给文本检索项目测量不同文件规模，判断瓶颈后尝试流式读取。能解释改动收益与边界，才算完成优化。

参考：[Rust Book：进阶](https://doc.rust-lang.org/book/ch20-00-advanced-features.html)、[Rustonomicon](https://doc.rust-lang.org/nomicon/)、[Pin 文档](https://doc.rust-lang.org/std/pin/index.html)、[Rust Performance Book](https://nnethercote.github.io/perf-book/)。
