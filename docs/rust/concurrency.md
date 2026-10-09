---
title: 3.1. 线程与并发
description: 使用线程、消息通道和锁组织并发工作，理解 Send、Sync 与数据竞争边界。
pageClass: aip-article rust-article
---

# 3.1. 线程与并发

本章目标：明确每份数据由谁持有、如何通信和什么时候结束，避免无边界地增加线程与共享状态。

## 并发、并行与线程

并发表示多个任务在一段时间内交替推进；并行表示多个任务同一时刻执行。操作系统线程适合需要独立执行或阻塞调用的工作；CPU 密集任务可使用有限线程池。大量等待 I/O 的任务则常用异步运行时。

```rust
use std::thread;

fn main() {
    let values = vec![1, 2, 3];
    let handle = thread::spawn(move || values.into_iter().sum::<i32>());
    let total = handle.join().expect("示例线程不应 panic");
    assert_eq!(total, 6);
}
```

`move` 让线程持有 values。`join` 等待线程并处理线程 panic 的结果。独立线程可能比调用函数活得更久，因此通常需要拥有数据；需要临时借用局部数据时，可以使用 `std::thread::scope` 的作用域线程。

## 消息传递减少共享状态

```rust
use std::{sync::mpsc, thread};

fn main() {
    let (tx, rx) = mpsc::channel();
    let handle = thread::spawn(move || {
        tx.send(String::from("处理完成")).expect("接收者应存在");
    });
    let message = rx.recv().expect("发送者应发送结果");
    assert_eq!(message, "处理完成");
    handle.join().expect("示例线程不应 panic");
}
```

发送 String 会移动数据到消息路径中。所有发送端被释放后，接收端能识别通道关闭。标准库 `mpsc::channel` 是无界通道，生产速度远高于消费速度时可能积累内存；`sync_channel(capacity)` 提供有界缓冲，并通过阻塞形成背压。

先考虑一个工作者持有状态，其他任务发消息请求操作。只有多个线程确实需要直接访问同一状态时，再考虑共享锁。

## 共享状态与锁

`Arc<Mutex<T>>` 组合跨线程共享所有权和互斥访问。`lock()` 返回守卫；守卫离开作用域时释放锁。使用普通 Mutex 时还需要处理 poisoned 状态，它通常意味着某个持锁线程曾 panic。

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let count = Arc::new(Mutex::new(0));
    let mut handles = Vec::new();
    for _ in 0..4 {
        let count = Arc::clone(&count);
        handles.push(thread::spawn(move || {
            *count.lock().expect("示例锁不应中毒") += 1;
        }));
    }
    for handle in handles {
        handle.join().expect("示例线程不应 panic");
    }
    assert_eq!(*count.lock().expect("示例锁不应中毒"), 4);
}
```

锁内只保留必要的状态操作，避免执行慢 I/O。多个锁要有一致的获取顺序。RwLock 允许多个读者或一个写者，但是否更快取决于真实争用情况。简单独立计数可考虑原子类型；内存序与多字段一致性需要单独学习，不能把任意共享数据改成 Atomic 就认为正确。

## Send 与 Sync

Send 表示类型可以在线程间转移所有权；Sync 表示共享引用 `&T` 可以在线程间安全传递。它们通常由字段自动推导；Rc 和 RefCell 的限制也会传递到包含它们的类型。

Rust 的类型规则防止许多数据竞争，但逻辑竞态、死锁、饥饿和错误的取消顺序依然可能发生。能够编译只是并发正确性的一个条件。手动 `unsafe impl Send/Sync` 属于底层工作，需要严格论证，不应当用来压掉诊断。

## 练习与验收

用四个有限工作者处理一批文本，通过有界通道返回统计结果。实现明确的结束信号，等待所有线程退出。再用共享 Mutex 版本实现一次，比较谁拥有状态、错误怎样返回、缓冲是否有上限。

参考：[Rust Book：并发](https://doc.rust-lang.org/book/ch16-00-concurrency.html)、[thread::scope](https://doc.rust-lang.org/std/thread/fn.scope.html)、[std::sync](https://doc.rust-lang.org/std/sync/index.html)。
