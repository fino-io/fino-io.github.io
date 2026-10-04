---
title: 02 · 语法与基本类型
description: 理解变量、表达式、函数、数值类型与控制流，建立 Rust 基础语法习惯。
pageClass: aip-article rust-article
---

# 02 · 语法与基本类型

本章目标：写出清晰的小函数，理解表达式返回值和类型推断，避免把其他语言的隐式转换习惯带入 Rust。

## 变量、可变性与遮蔽

`let` 创建默认不可变的绑定，需要修改时显式写 `mut`。重新使用 `let` 可以遮蔽旧名字，并允许新绑定拥有不同类型。`const` 必须标注类型，使用常量表达式初始化，适合固定配置与边界值。

```rust
fn main() {
    let input = " 42 ";
    let input = input.trim();
    let number: i32 = input.parse().expect("示例输入应为整数");
    let mut total = 0;
    total += number;
    println!("{total}");
}
```

遮蔽适合表达数据处理的不同阶段；`mut` 表达同一变量随时间变化。示例的 `expect` 用于固定输入，用户输入的错误处理见第 06 章。

## 常见类型与转换

| 类型 | 使用要点 |
| --- | --- |
| i32、i64、u32、u64 | 有符号和无符号整数；选型要考虑范围和溢出。 |
| usize | 与目标平台指针宽度一致，常用于集合长度和索引。 |
| f32、f64 | 浮点数不适合直接表达要求精确的小数金额。 |
| bool、char | 布尔值；char 表示一个 Unicode 标量值。 |
| 元组 `(T, U)` | 固定数量、可混合类型的数据，可通过模式解构。 |
| 数组 `[T; N]` | 固定长度、同一元素类型；借用视图常用切片 `&[T]`。 |

Rust 不自动把不同整数类型混在一起运算。`as` 可显式转换，但整数窄化可能截断；处理外部值时，优先使用 `TryFrom` 或 `try_into()` 表达转换失败。整数运算还可按需求使用 `checked_add`、`saturating_add` 或 `wrapping_add`，明确选择语义。

## 函数与表达式

函数参数声明类型，返回类型放在 `->` 后。代码块最后一个不带分号的表达式可作为返回值；加上分号后，它成为语句，块通常返回单位类型 `()`。

```rust
fn shipping_fee(total: u32) -> u32 {
    if total >= 100 { 0 } else { 10 }
}

fn main() {
    let order = (80, "上海");
    let (total, city) = order;
    let fee = shipping_fee(total);
    println!("寄往 {city}，运费 {fee}");
}
```

`if` 也是表达式，各分支需要形成兼容的类型。条件必须是 bool。提前结束函数可写 `return`，正常结尾优先保留清晰的尾表达式。

## 控制流与边界

使用 `for` 遍历范围或集合，`0..5` 不包含 5，`0..=5` 包含 5。`while` 适合条件循环；`loop` 可通过 `break value` 返回值。`break` 和 `continue` 控制循环；复杂的嵌套流程通常值得拆成函数。

```rust
fn main() {
    let mut sum = 0;
    for number in 1..=5 {
        if number % 2 == 0 {
            continue;
        }
        sum += number;
    }
    assert_eq!(sum, 9);
}
```

数组直接越界索引会 panic。索引来自用户或网络时，用 `.get(index)` 得到 Option，再处理不存在的情况。逐个处理集合时，直接遍历元素通常更清楚。

## 练习与验收

1. 编写摄氏温度转华氏温度的函数，为负数和零添加断言。
2. 实现 1 到 n 的求和，说明所选整数类型的范围。
3. 将一个较大的 u64 转成 u8，用 `try_into()` 处理失败。
4. 给一个返回整数的代码块加分号，观察错误并解释 `()`。

能解释绑定是否可变、表达式的类型和范围是否包含终点，就掌握了重点。参考：[Rust Book：基础概念](https://doc.rust-lang.org/book/ch03-00-common-programming-concepts.html)、[Rust by Example：类型转换](https://doc.rust-lang.org/rust-by-example/conversion.html)。
