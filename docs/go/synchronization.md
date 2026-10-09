---
title: 6.3. Mutex、WaitGroup 与同步
description: 保护不变量、等待、Once、Cond、原子与竞态检测。
pageClass: aip-article go-course
---

# 6.3. Mutex、WaitGroup 与同步

先修建议：[Goroutine 与任务生命周期](./concurrency)、[Map、集合与逗号 ok](./maps)。

同步保护的是一个状态不变量，而非某一行赋值。比如“库存不为负”要求检查和扣减在一个临界区；只给扣减加锁仍可能卖出超量。

## 锁保护的是完整判断与修改 {#concept-1}

余额是否足够与扣减余额，是同一个业务不变量的一部分。只给写入加锁、把检查放到锁外，仍可能让多个请求都看见旧余额并同时扣减。

```mermaid
flowchart LR
  L["获取同一把锁"] --> C["读取当前状态"] --> J["判断操作是否允许"]
  J --> U["按判断更新状态"] --> R["释放锁"]
```

只把维护这个不变量需要的短工作留在临界区，网络、数据库和不受控回调尽量放在外面。所有访问者遵循同一锁协议；看起来只读的方法也不能绕过保护。下面库存例子中，检查和扣减正好对应图里的中间两步。

## 完整临界区 {#concept-2}

```go
package main

import (
	"fmt"
	"sync"
)

type Inventory struct {
	mu        sync.Mutex
	available int
}

func (s *Inventory) Take() bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.available == 0 {
		return false
	}
	s.available--
	return true
}

func main() {
	stock := &Inventory{available: 3}
	var wg sync.WaitGroup
	results := make(chan bool, 10)
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func() { defer wg.Done(); results <- stock.Take() }()
	}
	wg.Wait()
	close(results)
	successes := 0
	for success := range results {
		if success {
			successes++
		}
	}
	fmt.Println(successes, stock.available) // 3 0
}
```

结束前库存写入都在锁内；wg.Wait 后没有写者，main 读取最终值不会竞争。通道容量 10 能容纳每个任务的一条结果，否则在等待 wg 时发送者可能堵住，说明同步与队列仍需一起设计。

## Mutex、RWMutex 与 WaitGroup {#concept-3}

Mutex 不可重入，锁内再次 Lock 会阻塞；多把锁用固定顺序获取，降低循环等待。锁内只做保持不变量所需的短工作，不做网络 I/O 或调用不受控回调。使用后不可复制带锁值，含锁类型通过指针传递；go vet 可发现部分 copylock 问题。

RWMutex 允许并行只读，但不一定比 Mutex 快，写入等待和额外成本需测量。所有读者和写者遵循同一保护规则，不能某个“看起来只读”的方法绕开锁。别在 RLock 后尝试升级为 Lock。

WaitGroup 负责计数等待，不负责错误或取消。基线采用 Add 在启动前、defer Done、最后 Wait。不能让 Wait 在任务尚未登记时返回；复用时一批完全结束后再登记下一批。相关任务的错误与取消用 errgroup。

## Once、Cond 与 atomic 的角色 {#concept-4}

| 工具 | 使用场景 | 易错点 |
| --- | --- | --- |
| sync.Once | 延迟初始化一次 | 初始化失败仍算执行过，不自动重试。 |
| sync.Cond | 等待共享状态条件改变 | Wait 在持锁下调用，返回后在循环中重新检查条件。 |
| atomic.Int64 | 独立计数或简单状态 | 多个原子变量不自动组成事务。 |
| sync.Map | 特定并发缓存负载 | 复合业务不变量仍需设计，非默认字典。 |
| sync.Pool | 复用临时对象 | 内容可被回收，不能作持久缓存。 |

片段：`for !ready { cond.Wait() }`，Wait 释放锁并等待，被唤醒后重新获取锁；Signal/Broadcast 表达可能有状态变化，不代表条件必定成立。维护条件和发通知须遵循同一锁协议。通常 Channel/Mutex 已够用，Cond 只在确有需要时采用。

## Race 检测与逻辑错误 {#concept-5}

```sh
go test -race ./...
go run -race .
```

race 对实际执行路径插桩，输出冲突访问的堆栈。测试未覆盖的竞争不会被证明不存在。没有 race 也可能死锁、提前退出或错误扣库存；测试同时检查最终不变量与超时结束。理解同步的 happens-before 保证，不能用“机器上一直没出错”替代证明。参考：[Go 内存模型](https://go.dev/ref/mem)。

## 学习实验与判定 {#lab}

1. 把库存检查移到锁外，运行并发测试与 race，观察数据竞争或逻辑错误。
2. 将 results 容量改为 0，解释为什么程序卡住，并让协调者并行接收修复。
3. 测试 Once 的初始化函数返回失败后不会自动重试，按需求选择普通状态机。

通过标准：不变量完整受保护，每个等待有对应完成操作。参考：[sync](https://pkg.go.dev/sync)、[sync/atomic](https://pkg.go.dev/sync/atomic)。
