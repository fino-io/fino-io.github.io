---
title: 9.4. 异步、TaskGroup、超时与取消
description: 在事件循环内协作推进任务，收拢失败与资源。
pageClass: aip-article python-course
---

# 9.4. 异步、TaskGroup、超时与取消

先修建议：[并发模型、GIL 与选择依据](./concurrency)、[生成器表达式、yield 与流式计算](./generators)。

异步任务在可等待操作处把执行权交还事件循环。它适合支持异步的 I/O，不会因为函数标记 async 就自动得到 CPU 并行。

## 协程、任务与 await {#concept-1}

```python
import asyncio

async def square(value):
    await asyncio.sleep(0)
    return value * value

async def main():
    coroutine = square(3)
    assert await coroutine == 9
    async with asyncio.TaskGroup() as group:
        tasks = [group.create_task(square(n)) for n in range(4)]
    assert [task.result() for task in tasks] == [0, 1, 4, 9]

if __name__ == "__main__":
    asyncio.run(main())
```

调用 async 函数得到协程，await 或任务调度后才推进。TaskGroup 等待相关任务，并在失败时处理取消与异常传播；它不自动处理任意已脱离组的后台任务。

## 超时和清理 {#concept-2}

```python
import asyncio

async def main():
    cleaned = []
    try:
        async with asyncio.timeout(0.01):
            try:
                await asyncio.sleep(1)
            finally:
                cleaned.append(True)
    except TimeoutError:
        pass
    assert cleaned == [True]

if __name__ == "__main__":
    asyncio.run(main())
```

finally 释放资源，CancelledError 一般清理后继续传播。取消协程不保证已经在线程里执行的工作立刻停掉；to_thread 用于适合的阻塞 I/O，CPU 或不能取消的操作另有生命周期。

## 有界并发与背压 {#concept-3}

```mermaid
flowchart LR
  P["生产输入"] --> Q["有界 asyncio.Queue"] --> W["固定 worker"] --> O["结果 / 错误收拢"]
```

Semaphore 限制同时进入的任务，但一次创建百万协程仍消耗内存。有界队列、固定 worker、预算和取消组合起来才限制系统规模。事件循环内不用同步 sleep、同步长 HTTP 或不受控重计算。

## 动手练习与验收 {#lab}

1. 在一个任务失败时验证同组清理与错误传播。
2. 记录最大活动任务数，确认不是只限连接而无界建任务。
3. 让消费者提前结束，生产者要收到取消并退出，测试不能靠 sleep 同步。

依据：[asyncio 任务](https://docs.python.org/3/library/asyncio-task.html)、[异步队列](https://docs.python.org/3/library/asyncio-queue.html)。
