---
title: 12 · Context、取消与并发编排
description: Go 中文学习指南：Context、取消与并发编排，包含概念、示例、练习与验收。
pageClass: aip-article
---

# 12 · Context、取消与并发编排

本章目标：在调用链传播截止时间与取消，保证任务失败后能收拢资源。

## Context 是协作取消

Context 通常作为第一个参数 `ctx context.Context`，从上层传入，不长期保存在业务结构体中，也不传 nil。它携带截止时间、取消信号和请求范围的少量元数据；业务参数使用显式参数，不能把所有内容塞进 Value。

```go
package main

import (
	"context"
	"fmt"
	"time"
)

func wait(ctx context.Context, d time.Duration) error {
	timer := time.NewTimer(d)
	defer timer.Stop()
	select {
	case <-timer.C:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Millisecond)
	defer cancel()
	fmt.Println(wait(ctx, time.Second)) // context deadline exceeded
}
```

调用 cancel 释放相关资源，即使正常完成也要调用。取消不会强杀 goroutine；循环要检查 ctx，阻塞操作要使用支持 Context 的 API。HTTP 请求、数据库查询等应传递同一请求的上下文，不在中途换成 Background 而丢失取消信息。详见 [context 文档](https://pkg.go.dev/context)。

## Channel 操作也要能退出

片段，假定 ctx、jobs 和 job 已存在：

```go
select {
case jobs <- job:
    // 工作已交接
case <-ctx.Done():
    return ctx.Err()
}
```

worker 接收同理。若处理函数本身永久阻塞且不观察取消，外围 select 无法替它清理。关闭 channel 与取消 Context 分工不同：关闭表达没有后续消息，取消表达当前工作不再需要继续。

## 复用 errgroup 汇总任务

多个相关 I/O 任务希望“一个失败就取消其他任务”时，使用 [golang.org/x/sync/errgroup](https://pkg.go.dev/golang.org/x/sync/errgroup)，不用自己拼接 WaitGroup、错误 channel 与 cancel。下面是片段，items、fetch、ctx 来自调用方：

```go
g, groupCtx := errgroup.WithContext(ctx)
g.SetLimit(4)
for _, item := range items {
    item := item
    g.Go(func() error {
        return fetch(groupCtx, item)
    })
}
if err := g.Wait(); err != nil {
    return err
}
```

引入前执行 `go get golang.org/x/sync@具体版本`，选择与项目 Go 基线兼容的发布版本，提交后续项目中的 go.mod/go.sum。SetLimit 限制活动任务数，Go 在满额时会阻塞；这不等于带取消的任务队列。任务必须观察 groupCtx 才能及时退出，Wait 不会强制终止它们。

groupCtx 在首个错误或 Wait 返回时取消，不能在 Wait 后继续拿它执行其他工作。对输出切片可以让不同任务写不同索引，并在 Wait 后读取；map 或同一元素的并发写仍需要同步。

## 超时预算与常见错误

调用链共享总预算，不给每一层无限叠加同样超时。客户端断连取消了请求后，数据库和上游调用也应停止；需要独立执行的后台任务明确建立自己的生命周期与截止时间，不偷用已经结束的请求上下文。

CPU 循环定期观察 Done，长期后台任务由服务生命周期 Context 管理。不要起一个额外 goroutine 只为把任意阻塞函数包装成“有超时”，这通常会留下仍在执行的任务。

## 练习与验收

1. 让一个 worker 故意返回错误，确认其他 worker 停止接收任务。
2. 测试调用前已经取消、执行中取消与正常完成。
3. 为并发抓取增加上限，记录最大活动任务数验证限流。

验收：取消传播到真正执行工作的地方，错误被等待方收到，没有永久阻塞的发送。
