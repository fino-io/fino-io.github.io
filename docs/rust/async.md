---
title: 14 · Async 与 Tokio
description: 理解 Future 和任务调度，使用 Tokio 处理超时、取消、有界并发和阻塞工作。
pageClass: aip-article rust-article
---

# 14 · Async 与 Tokio

本章目标：能解释异步任务何时推进，为等待和资源使用设置边界，避免在运行时工作线程上执行长时间阻塞操作。

## Future、await 与运行时

调用 `async fn` 得到 Future，创建 Future 本身不会像启动线程那样主动运行函数体。Future 由执行器轮询；`.await` 等待其结果，在尚未完成时允许当前任务让出执行权。Rust 标准库提供核心类型与语法，Tokio 等库提供运行时、I/O 和任务调度。

顺序写 `first().await; second().await;` 仍是顺序等待。需要两个独立操作一起推进时，可用 `tokio::join!`；需要独立任务时用 `tokio::spawn`。异步并不自动等于并行，也不保证 CPU 密集计算更快。

## 一个可运行的超时示例

新建项目后执行 `cargo add tokio --features macros,rt-multi-thread,time`，将以下代码放入 **src/main.rs**：

```rust
use std::time::Duration;
use tokio::time::{sleep, timeout};

async fn read_summary() -> &'static str {
    sleep(Duration::from_millis(20)).await;
    "学习计划已读取"
}

#[tokio::main]
async fn main() {
    match timeout(Duration::from_millis(100), read_summary()).await {
        Ok(summary) => println!("{summary}"),
        Err(_) => eprintln!("读取超时"),
    }
}
```

把延迟改成 200 毫秒就会进入超时路径。Tokio 的 sleep 不阻塞线程；`std::thread::sleep` 会阻塞当前线程，不适合放在普通异步任务中。

## Spawn 的生命周期与错误

`tokio::spawn` 通常要求 Future 及其输出满足 Send 和 `'static`，因为任务可能在线程间移动，并可能比当前函数存活更久。通常用 `async move` 移入拥有的数据。被保留到 await 之后的局部值会进入 Future 的状态，可能影响它是否满足 Send。

等待 JoinHandle 时，先处理任务层面的 JoinError，再处理任务返回的业务 Result。丢弃 Tokio JoinHandle 通常会让任务继续运行；想取消任务要明确使用 abort 或协作取消，并考虑资源状态。

## 有界并发与背压

同时处理一万个输入时，不应无条件为每个输入启动一个无限制任务。可以让固定数量的工作者从有界通道取工作，或维护一个大小受限的 JoinSet，也可用 Semaphore 限制同时持有的资源。

注意「限制同时运行的请求」和「限制排队任务总数」是两个问题。在每个已创建任务内部再等待 Semaphore，依然可能创建大量等待任务。可以先获得许可再启动任务，或使用固定工作者控制排队规模。

有界 `tokio::sync::mpsc` 在缓冲满时让发送者 await，向上游施加背压。channel 容量应由允许的积压与内存预算决定；无限增长的队列只是把过载延后表现出来。

## 锁与阻塞任务

短小且不跨 await 的临界区可使用普通 Mutex；必须跨 await 持有时才考虑 Tokio 的异步 Mutex，并重新判断是否真的需要持锁等待。一般不要在持有共享状态锁时发网络请求。

阻塞库调用可放入 `spawn_blocking`，但已经开始的阻塞任务通常不能像普通 Future 一样直接取消。持续的 CPU 密集工作更适合有界计算线程池，例如 Rayon。线程池、数据库连接池和异步任务都需要明确容量。

## 取消、超时与优雅关闭

timeout 到期会丢弃其包裹的 Future，但不会自动撤销已经发出的远端请求；若包裹的是一个独立任务的 JoinHandle，任务也可能继续执行。`select!` 未被选择的分支会被丢弃，使用前检查操作是否取消安全。支付、写入与事务等操作还需要幂等性和明确提交状态。

优雅关闭通常包含接收关闭信号、停止接收新工作、通知工作者、等待任务和释放资源。可参考 [Tokio Graceful Shutdown](https://tokio.rs/tokio/topics/shutdown) 中的 CancellationToken 与任务管理方案。

## 练习与验收

实现一个最多同时发起四个请求的批处理程序，增加单请求超时、错误汇总和关闭信号。使用本地模拟服务验证慢响应与失败，不依赖公网速度。应能解释超时后哪些工作被取消、哪些可能继续。

参考：[Rust Book：异步](https://doc.rust-lang.org/book/ch17-00-async-await.html)、[Tokio Tutorial](https://tokio.rs/tokio/tutorial)、[任务与生命周期](https://tokio.rs/tokio/tutorial/spawning)、[共享状态](https://tokio.rs/tokio/tutorial/shared-state)。
