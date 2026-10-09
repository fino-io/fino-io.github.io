---
title: 2.4. 闭包与迭代器
description: 理解闭包捕获、惰性求值和集合所有权，写出清楚的转换与筛选逻辑。
pageClass: aip-article rust-article
---

# 2.4. 闭包与迭代器

本章目标：把数据处理意图写清楚，知道迭代器何时执行、元素何时被借用或移动。

## 闭包捕获环境

闭包可像函数一样调用，也可捕获周围变量。编译器根据使用方式推断共享借用、可变借用或移动捕获。`move` 强制按值捕获，但不会让闭包中的引用变成拥有底层数据的值。

```rust
fn main() {
    let threshold = 10;
    let above = |value: &i32| *value > threshold;
    let values = [4, 12, 18];
    let selected: Vec<i32> = values.iter().copied().filter(above).collect();
    assert_eq!(selected, vec![12, 18]);
}
```

Fn 表示可通过共享引用调用；FnMut 允许修改捕获状态；FnOnce 允许消耗捕获值。它们描述调用能力，满足更强调用能力的闭包也可以用于只要求一次调用的位置。函数接受回调时，根据实际调用方式选择约束。

## 三种遍历入口

| 入口 | 元素形式 | 对原容器的影响 |
| --- | --- | --- |
| `.iter()` | 通常为 `&T` | 共享借用。 |
| `.iter_mut()` | 通常为 `&mut T` | 允许修改元素。 |
| `.into_iter()` | 对拥有的容器通常为 T | 消耗容器；具体语义取决于接收者类型。 |

不要仅凭方法名字判断所有权：`(&values).into_iter()` 仍是对引用的遍历。可先写显式类型、查看 IDE 类型提示，确认 Item 到底是什么。

## 惰性求值与消费

`map`、`filter`、`take`、`enumerate` 等构造新的迭代器，通常不会立即遍历。`collect`、`sum`、`count`、`fold` 或 for 循环才驱动迭代。`find`、`any`、`all` 可以提前停止。

```rust
fn main() {
    let input = "3, 5, 8";
    let numbers: Result<Vec<i32>, _> = input
        .split(',')
        .map(|part| part.trim().parse::<i32>())
        .collect();
    assert_eq!(numbers.unwrap(), vec![3, 5, 8]);
}
```

收集成 `Result<Vec<_>, _>` 会在遇到错误时停止并返回错误。若改成 `filter_map(|part| part.parse().ok())`，无效项会被丢弃；仅在业务确实允许忽略无效项时采用这种方式。

## 借用结果与分配

```rust
fn main() {
    let notes = vec![String::from("rust"), String::from("go")];
    let long: Vec<&str> = notes.iter()
        .map(String::as_str)
        .filter(|text| text.len() > 2)
        .collect();
    assert_eq!(long, vec!["rust"]);
}
```

结果借用 notes 中的字符串，无需复制文本，但不能脱离 notes 独立存活。需要独立保存时再克隆或移动。链式表达并不保证一定更快；清楚的循环和迭代器都可能被有效优化，应使用真实输入测量。

## 练习与验收

用循环和迭代器各实现一次「解析一组整数、过滤负数、求和」。分别设计严格失败模式和忽略无效项模式，给它们不同的函数名和测试。再比较 `iter` 与 `into_iter` 后能否使用原 Vec。

参考：[Rust Book：闭包与迭代器](https://doc.rust-lang.org/book/ch13-00-functional-features.html)、[Iterator API](https://doc.rust-lang.org/std/iter/trait.Iterator.html)。
