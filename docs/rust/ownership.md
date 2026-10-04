---
title: 03 · 所有权与借用
description: 理解值的移动、复制、借用和释放，根据数据使用方式设计函数签名。
pageClass: aip-article rust-article
---

# 03 · 所有权与借用

本章目标：看到函数签名，能判断它是读取、修改还是接管数据；看到借用错误，能解释哪两次访问发生冲突。

## 从数据的负责人开始

值由所有者负责管理；所有者离开作用域时，值按其释放规则清理。赋值或传参可能移动所有权。Rust 将这些约束纳入编译检查，使许多悬垂引用、重复释放和数据竞争在编译阶段被发现。

```rust
fn consume(message: String) {
    println!("{message}");
}

fn main() {
    let message = String::from("学习所有权");
    let next = message;
    consume(next);
    // message 和 next 都已不能继续使用。
}
```

移动不等于深拷贝。String 的所有权转交后，旧绑定失效，避免两个绑定同时负责释放同一缓冲区。具体机器层面的复制与优化由编译器决定，移动不一定复制全部数据字节。

## Copy 与 Clone

`Copy` 表示赋值可以隐式复制值，常见于整数、bool、char 和满足条件的组合类型。String、Vec 等拥有资源的类型通常不是 Copy。`Clone` 是显式克隆能力，成本由类型实现决定：克隆 String 会复制文本数据，克隆 Arc 通常增加引用计数。

使用 `clone()` 前判断是否确实需要独立副本。只读操作通常借用更合适；需要让任务独立持有数据时，移动或克隆可能合理。清晰的所有权设计比机械地减少所有 Clone 更重要。

## 共享借用与可变借用

`&T` 临时共享访问值，`&mut T` 临时独占可变访问值。普通借用规则要求：同一段数据的活跃借用可以是多个共享引用，或一个可变引用；引用必须始终有效。

```rust
fn count_chars(text: &str) -> usize {
    text.chars().count()
}

fn add_note(text: &mut String) {
    text.push_str("：已完成");
}

fn main() {
    let mut note = String::from("借用");
    let size = count_chars(&note);
    add_note(&mut note);
    println!("原来有 {size} 个字符，现在是 {note}");
}
```

`count_chars` 读取数据且不接管所有权；`add_note` 需要修改缓冲区。String 可以通过解引用强制转换借用为 str。这样的签名把函数行为直接写在接口上。

借用通常在最后一次使用引用后结束，而不是一定持续到整个花括号结束。先完成读取再修改，往往能自然消除冲突。编译器需要从类型和控制流中证明访问合法。

## 切片与有效范围

切片是连续数据的一段借用视图。`&[T]` 借用数组或 Vec 的部分元素，`&str` 借用 UTF-8 文本。切片不拥有底层数据，所以底层数据必须活得足够久。

```rust
fn first_word(text: &str) -> &str {
    text.split_whitespace().next().unwrap_or("")
}

fn main() {
    let text = String::from("rust ownership");
    let word = first_word(&text);
    assert_eq!(word, "rust");
}
```

返回局部 String 的引用会悬垂，无法通过编译。返回新创建的数据时用 String；返回输入的部分视图时用借用。后者的引用关系在第 08 章展开。

## 处理借用错误的顺序

1. 找到所有者，画出谁读取、谁修改、谁接管。
2. 缩短引用的使用范围，避免保存不必要的中间引用。
3. 只需要读取时把参数设计成 `&str` 或 `&[T]`。
4. 必须独立保存时返回拥有数据的类型。
5. 确实需要共享所有权时再考虑 Rc 或 Arc。

## 练习与验收

实现文本分析函数：借用 `&str`，返回字节数、字符数和单词数。再实现接收 `&mut String` 的追加函数。尝试在共享引用仍被使用时修改文本，读懂错误后调整访问顺序。

应能说明：为什么读取函数不消耗 String，为什么返回局部引用不成立，什么时候克隆符合业务需要。参考：[所有权](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html)、[引用与借用](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html)、[切片](https://doc.rust-lang.org/book/ch04-03-slices.html)。
