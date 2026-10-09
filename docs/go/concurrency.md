---
title: 3.1. Goroutine 与任务生命周期
description: 调度、启动、等待、泄漏与并发规模。
pageClass: aip-article
---

# 3.1. Goroutine 与任务生命周期

学习前应能完成：[函数、闭包与调用语义](./functions)、[指针、别名与内存概览](./pointers)。

本章目标：明确并发任务的生命周期与共享数据归属，避免用 goroutine 掩盖顺序逻辑问题。

## 并发不自动提升速度

Goroutine 是由运行时调度的执行单元，不与操作系统线程一一对应。并发让多个任务交错推进，并行是在多个执行资源上同时运行。网络等待适合并发，CPU 工作需要测量；对每条数据都起一个 goroutine 会放大内存、连接和调度开销。

每个 goroutine 都应能回答：谁启动它、谁等待它、失败如何反馈、怎样取消、资源由谁释放。main 返回时，其他 goroutine 不会自动完成。

## 使用 Mutex 与 WaitGroup

```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	var wg sync.WaitGroup
	var mu sync.Mutex
	count := 0
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			mu.Lock()
			count++
			mu.Unlock()
		}()
	}
	wg.Wait()
	fmt.Println(count) // 10
}
```

基线示例使用 Add/Done：Add 在启动前调用，避免 Wait 提前结束。WaitGroup 只负责等待，不自动传递错误。Mutex 保护完整状态不变量，例如“查找后插入”要处于同一临界区；仅保护单独的写操作可能仍有逻辑竞争。不要在锁内做长时间网络调用，也不要复制已经使用过的同步对象。

## Channel 表达通信与所有权

无缓冲 channel 需要发送与接收配对；带缓冲 channel 在容量未满前可以发送。缓冲限制队列长度，不自动限制已创建 goroutine 的数量。

```go
package main

import "fmt"

func main() {
	values := make(chan int)
	go func() {
		defer close(values)
		for i := 1; i <= 3; i++ {
			values <- i * i
		}
	}()
	total := 0
	for value := range values {
		total += value
	}
	fmt.Println(total) // 14
}
```

由能够确定“不再有发送”的一方关闭 channel，通常是唯一发送方。多发送者时让协调者等待全部发送完成后关闭。向已关闭 channel 发送或重复关闭会 panic；接收已关闭 channel 会得到剩余值，然后得到零值和 ok=false。nil channel 的收发永久阻塞，可在 select 中用于关闭某个分支，但一般业务中避免意外 nil。

## 如何选同步方式

| 情况 | 优先考虑 |
| --- | --- |
| 多个请求共享一个内存字典 | Mutex 保护状态。 |
| 任务在处理阶段之间传递 | Channel。 |
| 独立任务汇总错误与取消 | errgroup，见下一章。 |
| 简单独立计数器 | atomic，但不用于保护复杂不变量。 |
| 大量待处理工作 | 固定 worker 数 + 有界队列 + 取消。 |

不要因为有并发就把所有状态改成 channel，也不要把 sync.Map 当作普通 map 的默认替代。竞态检测、超时测试与压测一起判断正确性。参考：[sync 包](https://pkg.go.dev/sync)、[Go 内存模型](https://go.dev/ref/mem)。

## 调度与阻塞的运行模型

Goroutine 的栈可增长，由 runtime 在多个线程上调度；GOMAXPROCS 主要限制同时执行 Go 代码的资源数量，不是 goroutine 上限或线程总上限。I/O 等待时运行时能调度其他任务，CPU 密集工作并发度通常围绕有效 CPU 容量测量。

不要依赖创建顺序推出执行顺序。`go work()` 只是启动，调用者应等待成功、失败或取消反馈。队列长度、worker 数、连接池容量与外部服务配额共同决定资源上限。

## 谁等待后台任务

一个服务后台轮询器至少需要：服务级 ctx、ticker、等待完成的 done、失败记录与停止路径。请求 goroutine 不应创建不受追踪的永久后台工作。main 返回后所有 goroutine 都失去继续完成工作的保证。

```go
package main

import (
	"context"
	"fmt"
)

func background(ctx context.Context) <-chan struct{} {
	done := make(chan struct{})
	go func() {
		defer close(done)
		<-ctx.Done()
	}()
	return done
}

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	done := background(ctx)
	cancel()
	<-done
	fmt.Println("后台任务已结束")
}
```

这不是用 sleep “给它一点时间”，而是等待明确完成通知。现实轮询还要停止 ticker、传 ctx 给 I/O，发生错误时记录并按策略重试。Go 1.22 基线采用 Add/Done 等经典 API，阅读更新工具链材料时核对新增 API 的最低版本。

## 练习与验收 {#lab}

1. 修改计数器去掉锁，运行 race，解释报告中的两个访问点。
2. 写两个 worker 从同一 jobs channel 处理数据，输出交给协调者关闭。
3. 提前停止消费，观察发送方阻塞，再增加取消处理。

验收：每个 goroutine 有结束条件，共享状态有一致保护，结果不依赖 sleep。
