---
title: 05 · 字符串与集合
description: 正确使用 String、str、Vec 和 HashMap，区分字节、字符与切片。
pageClass: aip-article rust-article
---

# 05 · 字符串与集合

本章目标：按数据是否需要拥有、增长和随机访问来选择容器，正确处理 UTF-8 文本。

## String、str 与 Unicode

String 拥有可增长的 UTF-8 缓冲区，`&str` 借用一段有效的 UTF-8 文本。需要保存或构造文本时用 String；只读取文本的参数通常用 `&str`，让字符串字面量与 String 都能传入。

```rust
fn main() {
    let text = String::from("你好 Rust");
    assert_eq!(text.len(), 11);
    assert_eq!(text.chars().count(), 7);
    assert_eq!(text.get(0..3), Some("你"));
    assert_eq!(text.get(0..1), None);
}
```

`len()` 计算字节数，`chars()` 遍历 Unicode 标量值，两者都不等同于屏幕上看到的字形数量。例如组合音标和 emoji 可能由多个标量值组成。需要按用户感知的字符处理时，复用 [unicode-segmentation](https://docs.rs/unicode-segmentation/latest/unicode_segmentation/) 提供的字素簇接口。

String 不能用整数索引取得「第几个字符」。字符串范围切片必须落在 UTF-8 边界上；直接错误切片会 panic，外部索引用 `.get(range)` 检查。追加内容可用 `push`、`push_str`；生成新文本可用 `format!`。

## Vec 与切片

Vec 拥有连续、可增长的一组元素，`&[T]` 借用元素序列。只读算法常接收切片，这样 Vec 和数组都可复用同一函数。

```rust
fn total(values: &[i32]) -> i32 {
    values.iter().sum()
}

fn main() {
    let mut values = vec![2, 4, 6];
    values.push(8);
    assert_eq!(total(&values), 20);
    assert_eq!(values.get(10), None);
    assert_eq!(values.pop(), Some(8));
}
```

Vec 可能在增长时重新分配，所以持有元素引用期间不能任意执行可能改变它的操作。处理完引用后再 `push`，或用索引、批量变换等方式重新组织算法。已知元素数量时可用 `with_capacity` 减少分配，但先保持代码清楚，再测量收益。

## HashMap、Entry 与遍历顺序

HashMap 适合按键查找，键要满足 Eq 和 Hash。`entry` 把查询与按需插入合起来，适合计数、缓存和分组。

```rust
use std::collections::HashMap;

fn main() {
    let text = "rust cargo rust";
    let mut counts = HashMap::new();
    for word in text.split_whitespace() {
        *counts.entry(word).or_insert(0usize) += 1;
    }
    assert_eq!(counts.get("rust"), Some(&2));
}
```

上例的键借用 text。若结果需要比输入活得更久，应将键转为 String。HashMap 的遍历顺序不稳定；需要排序输出时收集后排序，或选择 BTreeMap。集合选型可参考 [标准库 collections](https://doc.rust-lang.org/std/collections/index.html)：按键有序用 BTreeMap，去重用 HashSet，需要双端队列时用 VecDeque。

## 文件与流式处理

`std::fs::read_to_string` 适合小型 UTF-8 文件；非 UTF-8 文件可用 `std::fs::read` 得到字节。大文件使用 BufReader 和 BufRead 逐行或分块读取，避免一次持有整个文件。每一次读取都可能失败，不能只处理打开文件的错误。

## 练习与验收

实现词频统计，按次数降序、同次数按词语排序。添加空输入和中文输入用例，并解释按空白切词对中文自然语言的限制。把计数结果从借用键改成拥有 String 的键，比较接口与分配成本。

参考：[Rust Book：集合](https://doc.rust-lang.org/book/ch08-00-common-collections.html)、[String API](https://doc.rust-lang.org/std/string/struct.String.html)、[BufRead API](https://doc.rust-lang.org/std/io/trait.BufRead.html)。
