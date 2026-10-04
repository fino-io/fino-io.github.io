---
title: 11 · 智能指针与内部可变性
description: 根据所有权、共享与修改需求选择 Box、Rc、Arc、RefCell 和 Weak。
pageClass: aip-article rust-article
---

# 11 · 智能指针与内部可变性

本章目标：用简单的所有权模型解决问题，只有在确实需要共享时才引入智能指针和同步工具。

## 选择工具的顺序

优先用普通值、`&T` 与 `&mut T`。需要堆上拥有的数据或固定大小的递归类型时用 Box；单线程共享所有权用 Rc；跨线程共享所有权用 Arc。共享修改是另一个维度，需要 RefCell、Mutex 等相应工具。

| 类型 | 主要能力 | 边界 |
| --- | --- | --- |
| `Box<T>` | 在堆上拥有 T，单一所有者。 | 本身不提供共享所有权。 |
| `Rc<T>` | 单线程引用计数。 | 不能作为普通跨线程共享工具。 |
| `Arc<T>` | 原子引用计数。 | 不自动让内部 T 的操作变得线程安全。 |
| `RefCell<T>` | 运行时检查的内部可变性。 | 借用冲突可能 panic，通常用于单线程。 |
| `Mutex<T>`、`RwLock<T>` | 通过锁保护共享访问。 | 要控制锁粒度与持有时间，避免死锁。 |

Box 的常见场景包括 `Box<dyn Trait>` 和递归结构。泛型结构体直接存放 T 通常更简单，不必为所有字段都套一层 Box。

## Rc 与 RefCell 的组合

```rust
use std::cell::RefCell;
use std::rc::Rc;

fn main() {
    let notes = Rc::new(RefCell::new(vec!["所有权"]));
    let other = Rc::clone(&notes);
    other.borrow_mut().push("内部可变性");
    assert_eq!(notes.borrow().len(), 2);
}
```

Rc 解决多个所有者的问题，RefCell 允许通过共享引用获取运行时检查的可变访问。RefCell 没有取消借用规则，而是把部分检查移到运行时。`borrow_mut()` 与其他活跃借用冲突时会 panic；需要处理冲突时用 `try_borrow`、`try_borrow_mut`。

## Arc、弱引用与循环

克隆 Rc 或 Arc 增加强引用计数，通常不复制内部 T。最后一个强引用被释放时，内部值被清理。互相持有强引用可能产生循环，使计数无法归零；父子关系、缓存观察者等场景可以用 Weak 表达不拥有对象的关系。

Weak 通过 `upgrade()` 返回 Option；对象可能已经不存在，调用者要处理 None。相比复杂的循环对象图，索引、ID 和集中管理的容器有时更容易理解和维护。

Arc 是否实现 Send、Sync 取决于 T 的约束。`Arc<RefCell<T>>` 并不能自然成为线程安全的可变容器；跨线程修改通常选择 `Arc<Mutex<T>>`，或把状态放进单个任务并通过消息访问。

## Deref、Drop 与 RAII

Deref 支持指针式访问和相关强制转换；Drop 在值被释放时执行清理。文件、锁守卫和连接资源可以借助作用域管理释放，形成 RAII。显式写 `drop(guard)` 可提前释放，但清楚的局部作用域往往更易读。

Rust 不承诺所有情况下都会执行 Drop，例如进程直接终止或某些 abort 路径。析构函数也不适合执行需要 await 的异步收尾；重要的提交、flush 和优雅关闭应通过显式流程完成。

## 练习与验收

实现一个单线程共享笔记列表，展示两个 Rc 指向同一数据。故意同时保留共享借用和可变借用，用 `try_borrow_mut` 观察失败。再设计父子节点关系，解释哪一条边应该用 Weak。

参考：[Rust Book：智能指针](https://doc.rust-lang.org/book/ch15-00-smart-pointers.html)、[Rc](https://doc.rust-lang.org/std/rc/struct.Rc.html)、[Arc](https://doc.rust-lang.org/std/sync/struct.Arc.html)、[RefCell](https://doc.rust-lang.org/std/cell/struct.RefCell.html)。
