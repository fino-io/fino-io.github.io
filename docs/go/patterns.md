---
title: 3.5. Worker Pool、Fan-in 与 Pipeline
description: 完整有界流水线、关闭协调、错误与取消验收。
pageClass: aip-article
---

# 3.5. Worker Pool、Fan-in 与 Pipeline

学习前应能完成：[Channel、缓冲与 select](./channels)、[Mutex、WaitGroup 与同步](./synchronization)、[Context、截止时间与取消](./context)。

本章交付一个完整流水线：单个生产者输入、固定 worker fan-out、多个结果 fan-in、消费者汇总。关闭责任和取消行为比模式名称更重要。

## 角色与边界

```text
numbers → producer → jobs(有界) → 3 workers → results(有界) → consumer
                         ↑              ↑              ↑
                         └──── 同一 Context 取消 ────────┘
                                workers 全部结束后由协调者关闭 results
```

Pipeline 把阶段连接起来，fan-out 让多个 worker 消费同一输入，fan-in 汇总它们的输出。只有固定 worker 数 + 有界队列 + 可取消入队，才能控制资源；仅设置 channel 容量不够。

## 可运行的平方汇总流水线

```go
package main

import (
	"context"
	"fmt"
	"sync"
)

func squares(ctx context.Context, numbers []int, workers int) (<-chan int, <-chan struct{}) {
	if workers < 1 {
		workers = 1
	}
	jobs := make(chan int, workers)
	out := make(chan int, workers)
	stopped := make(chan struct{})
	var all sync.WaitGroup
	var processing sync.WaitGroup
	all.Add(1)
	go func() {
		defer all.Done()
		defer close(jobs)
		for _, n := range numbers {
			select {
			case jobs <- n:
			case <-ctx.Done():
				return
			}
		}
	}()
	for i := 0; i < workers; i++ {
		processing.Add(1)
		all.Add(1)
		go func() {
			defer processing.Done()
			defer all.Done()
			for {
				select {
				case <-ctx.Done():
					return
				case n, ok := <-jobs:
					if !ok {
						return
					}
					result := n * n
					select {
					case out <- result:
					case <-ctx.Done():
						return
					}
				}
			}
		}()
	}
	go func() {
		processing.Wait()
		close(out)
		all.Wait()
		close(stopped)
	}()
	return out, stopped
}

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	results, stopped := squares(ctx, []int{1, 2, 3, 4}, 3)
	total := 0
	for n := range results {
		total += n
	}
	<-stopped
	fmt.Println(total) // 30
}
```

结果顺序不确定，但总和稳定。参数 numbers 在任务结束前不得由调用方并发修改；真实计算还需数字范围检查避免平方溢出。本例不用自己写通用并发框架，只展示一个明确的数据流。

producer 独占 jobs 发送与关闭；workers 不关闭 out；协调者等待 processing 后关闭 out，再等待 producer 和 workers 全部结束后关闭 stopped。stopped 是生命周期完成通知，调用方提前结束消费必须 cancel 然后等待 stopped，不能只 break。

## 验证提前退出

把 main 的消费部分改成以下片段：

```go
<-results
cancel()
<-stopped
fmt.Println("全部任务已退出")
```

剩余工作允许被取消，最终汇总不能被当成完整结果。若取消与发送同时就绪，可能多产生少量结果，所以消费者不能用“取消后绝对没有任何输出”作为断言。正确断言是所有任务在预算内退出且无竞争。

### 可运行的关闭与取消测试

将下面保存为 main_test.go，执行 `go test -race .`。断言既检查完整汇总，也检查提前取消后全部任务能够退出；超时用于测试判定，不通过 sleep 同步。

```go
package main

import (
	"context"
	"testing"
	"time"
)

func TestPipelineCompleteAndCancel(t *testing.T) {
	for _, workers := range []int{1, 3, 8} {
		ctx, cancel := context.WithCancel(context.Background())
		out, done := squares(ctx, []int{1, 2, 3, 4}, workers)
		total := 0
		for n := range out {
			total += n
		}
		<-done
		cancel()
		if total != 30 {
			t.Fatalf("workers=%d total=%d", workers, total)
		}
	}
	for i := 0; i < 50; i++ {
		ctx, cancel := context.WithCancel(context.Background())
		out, done := squares(ctx, make([]int, 10000), 3)
		<-out
		cancel()
		select {
		case <-done:
		case <-time.After(time.Second):
			t.Fatal("cancel did not stop pipeline")
		}
	}
}
```

## 错误、背压和顺序

有失败的处理函数，用 errgroup 收拢首个错误与取消，而不是另造一套隐式丢错误的 channel 协议。需要继续处理其他项时定义每项 Result{Value, Err}，区分批次失败与单项失败。

消费者慢会让 results 满，worker 被背压，最终 producer 停止入队；这是有界系统的正常行为。要求按输入顺序输出时为任务带索引，汇总后排序或使用有限重排缓存；严格顺序会增加等待和内存，选择来自接口契约。

## 学习实验与判定 {#lab}

1. workers 为 1、3、8，完整结果总和均为 30，不断言接收顺序。
2. 在收到第一个结果后取消，用带截止时间的测试等待 stopped，超时即失败。
3. 为计算函数增加错误，使用 errgroup 实现首错取消，再测试正常与失败输入。
4. 输入 100000 项，记录活动 worker 数与队列峰值，验证没有按项创建 goroutine。

通过标准：能指出每个 channel 的关闭者、每个 goroutine 的结束条件，以及错误和部分结果的语义。参考：[官方 Pipeline 与取消](https://go.dev/blog/pipelines)、[errgroup](https://pkg.go.dev/golang.org/x/sync/errgroup)。
