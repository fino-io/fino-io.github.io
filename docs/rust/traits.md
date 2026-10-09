---
title: 2.1. 泛型与 Trait
description: 通过泛型和 Trait 表达能力约束，理解关联类型、分发方式和接口设计。
pageClass: aip-article rust-article
---

# 2.1. 泛型与 Trait

本章目标：在重复出现的真实需求上建立抽象，读懂标准库中的泛型签名，避免为了通用而通用。

## 泛型复用数据与算法

泛型允许结构体、枚举和函数以类型作为参数。`Option<T>`、`Result<T, E>` 和 `Vec<T>` 都是泛型类型。算法想调用某种方法或运算时，还需要通过 Trait 约束说明该类型具备对应能力。

```rust
fn larger<T: Ord>(left: T, right: T) -> T {
    if left >= right { left } else { right }
}

fn main() {
    assert_eq!(larger(3, 8), 8);
    assert_eq!(larger("cargo", "rust"), "rust");
}
```

上例消费两个参数并返回其中一个。若调用者仍需要原值，应重新评估借用形式，而不是直接为所有 T 添加 Clone 约束。泛型边界应来自函数真正需要的行为。

## Trait 表达能力

Trait 定义方法契约，可提供默认实现。用 `impl Trait for Type` 为类型实现能力；用 `where` 子句拆开复杂约束，让函数签名更易阅读。

```rust
trait Summary {
    fn summary(&self) -> String;
}

struct Article {
    title: String,
}

impl Summary for Article {
    fn summary(&self) -> String {
        format!("文章：{}", self.title)
    }
}

fn print_summary(value: &impl Summary) {
    println!("{}", value.summary());
}

fn main() {
    let article = Article { title: "Trait 入门".into() };
    print_summary(&article);
}
```

方法可通过 `Self` 表示实现者类型。关联类型通常用于「某个实现确定一种输出类型」，例如 Iterator 的 Item；泛型参数适合允许同一类型对应多种实现配置的场景。

## 静态与动态分发

| 接口 | 常见用途 | 需要考虑 |
| --- | --- | --- |
| `T: Trait`、参数 `impl Trait` | 调用处确定具体类型，通用算法。 | 通常通过单态化生成具体代码，可能增加代码体积。 |
| `&dyn Trait`、`Box<dyn Trait>` | 运行时选择实现、保存不同具体类型。 | 通过虚表分发，Trait 必须满足 dyn 兼容规则。 |
| 返回位置 `impl Trait` | 隐藏一个确定的具体返回类型。 | 各分支通常必须返回同一个具体类型。 |

并非所有 Trait 都能变为 `dyn Trait`。例如带有某些泛型方法或要求 `Self: Sized` 的接口可能不满足条件；应查 [Reference：dyn compatibility](https://doc.rust-lang.org/reference/items/traits.html#dyn-compatibility)。

## 常见标准库 Trait

先熟悉 Debug、Display、Clone、Default、PartialEq、Eq、PartialOrd、Ord、Hash、From、TryFrom、AsRef 和 Iterator。它们决定类型能否输出、比较、转换和遍历。浮点数存在 NaN，不能简单套用整数的完全排序假设。

实现外部 Trait 时还要遵守一致性与孤儿规则，通常需要 Trait 或相关类型属于自己的 crate。需要给外部类型添加语义时，可使用 newtype 包装，例如 `struct UserId(u64)`，同时区分不同业务 ID。

## 练习与验收

让文章和通知实现同一个 Summary Trait，分别以泛型函数和 `Vec<Box<dyn Summary>>` 输出。解释两种实现的选择时机。为 UserId 添加 Debug 和 PartialEq，并说明为什么它比裸 u64 更能表达业务意图。

参考：[Rust Book：泛型、Trait 与生命周期](https://doc.rust-lang.org/book/ch10-00-generics.html)、[Trait 定义](https://doc.rust-lang.org/book/ch10-02-traits.html)、[Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)。
