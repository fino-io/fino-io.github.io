---
title: 08 · 生命周期
description: 理解引用之间的有效期约束，设计借用返回值，区分静态引用与类型的 static 约束。
pageClass: aip-article rust-article
---

# 08 · 生命周期

本章目标：理解生命周期标注描述的引用关系，知道什么时候需要标注，什么时候应该改用拥有数据的类型。

## 标注关系，不延长存活

生命周期帮助编译器验证引用始终指向有效数据。大多数局部代码不需要手动写生命周期；当函数接收多个引用并返回引用时，接口可能需要指出返回值与哪一个输入相关。

```rust
fn longer<'a>(left: &'a str, right: &'a str) -> &'a str {
    if left.len() >= right.len() { left } else { right }
}

fn main() {
    let left = String::from("ownership");
    let right = String::from("borrow");
    let result = longer(&left, &right);
    assert_eq!(result, "ownership");
}
```

这里 `'a` 描述两个输入与输出之间的有效期约束。调用时返回引用的使用范围受两个输入共同有效范围限制。标注不会让局部变量活得更久，也无法修复返回局部数据引用的问题。示例用字节长度比较文本，若业务要求字符数量，应换成相应的计数方式。

## 省略规则与设计判断

普通函数中，每个输入引用得到各自的生命周期。只有一个输入引用时，输出引用通常关联该输入；方法中存在 `&self` 或 `&mut self` 时，输出引用通常关联 self。这些省略规则解释了为什么 `fn trim(text: &str) -> &str` 不必手动标注。

若输出只来自一个输入，就明确写出那个关系。若输出是在函数里新建的字符串，应返回 String。为了让错误消失而给所有引用写同一个 `'a`，可能把原本独立的数据绑定得过紧。

## 持有引用的结构体

```rust
struct Excerpt<'a> {
    text: &'a str,
}

impl<'a> Excerpt<'a> {
    fn text(&self) -> &str {
        self.text
    }
}

fn main() {
    let source = String::from("一段学习笔记");
    let excerpt = Excerpt { text: &source };
    println!("{}", excerpt.text());
}
```

Excerpt 借用 source，因此不能比 source 的有效数据活得更久。这适合解析器、零拷贝视图等明确借用的场景。长期保存的业务实体通常先用 String 等拥有数据的字段，让 API 更容易使用；是否避免分配应由测量和需求决定。

## 两种 'static

`&'static str` 表示引用的数据可在整个程序运行期间有效，字符串字面量就是常见例子。`T: 'static` 表示 T 不包含受较短生命周期限制的借用；String 通常满足这一约束，但它仍可以很快被正常释放。

`thread::spawn` 和 `tokio::spawn` 常要求 `'static`，因为独立任务可能比当前函数活得更久。把 String 移入任务可满足拥有数据的需求；把 `&String` 移入任务仍只是移动引用，不会让其所有者自动延长存活。作用域线程则提供另一种受限的借用模型。

## 常见问题的修复方向

| 症状 | 优先检查 |
| --- | --- |
| 返回值引用局部变量 | 返回拥有数据的类型，或让调用方提供底层数据。 |
| 结构体需要到处带生命周期 | 判断是否真正需要借用，长期数据可改为拥有。 |
| 任务要求 static | 移入拥有的数据，必要时使用 Arc 共享。 |
| 标注后调用仍失败 | 标注只是关系，检查底层所有者是否提前被释放。 |

## 练习与验收

写一个返回输入第一行的函数，再写一个给文本加前缀的函数，分别选择 `&str` 和 String 作为返回值并解释原因。把 Excerpt 的字段改成 String，比较两种设计给调用者带来的约束。

参考：[Rust Book：生命周期](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html)、[Tokio：static 与任务](https://tokio.rs/tokio/tutorial/spawning)。
