---
title: 13 · 线程、进程与异步
description: Python 中文学习指南：线程、进程与异步，包含概念、代码示例、练习与验收。
pageClass: aip-article
---

# 13 · 线程、进程与异步

本章目标：按负载选并发方式，理解超时和取消，避免只为了“更快”引入异步。

## 如何选择

| 工作 | 起点 | 需要关注 |
| --- | --- | --- |
| 少量文件或请求 | 同步代码 | 最容易调试，先测量瓶颈。 |
| 多个阻塞 I/O | ThreadPoolExecutor | 有界线程数、共享状态、库的线程安全。 |
| Python CPU 密集运算 | ProcessPoolExecutor | 序列化成本、进程内存、任务粒度。 |
| 大量支持异步的网络 I/O | asyncio | 阻塞调用、连接上限、超时、取消。 |

常规 CPython 的 GIL 会限制 Python 字节码线程并行执行；某些扩展会释放 GIL。较新版本有可选自由线程构建，但并非所有环境和依赖都适用，选型时核对目标运行环境，不能假设线程一定加速 CPU 工作。

## 可运行的结构化并发

```python
import asyncio

async def compute(value: int, limit: asyncio.Semaphore) -> int:
    async with limit:
        async with asyncio.timeout(1):
            await asyncio.sleep(0.01)
            return value * value

async def main() -> None:
    limit = asyncio.Semaphore(2)
    async with asyncio.TaskGroup() as group:
        tasks = [group.create_task(compute(n, limit)) for n in range(4)]
    assert [task.result() for task in tasks] == [0, 1, 4, 9]
    print("四个任务已完成")

if __name__ == "__main__":
    asyncio.run(main())
```

调用 async 函数只创建协程，需要 await 或调度执行。TaskGroup 等待组内任务，并在任务失败时处理同组取消与异常传播。Semaphore 限制同时执行数量；对于百万级输入，还要使用有界队列与固定工作者，避免一次创建百万任务。

## 阻塞、取消与共享状态

`time.sleep()`、同步 HTTP 和重 CPU 运算会阻塞事件循环。轻量阻塞 I/O 可以 `await asyncio.to_thread(...)`，但协程取消通常不会强制停止线程里已经开始的工作。CPU 工作移到进程或专门任务服务。

取消时用 finally 释放资源，捕获 `CancelledError` 后通常重新抛出。锁保护共享状态，队列传递数据；不要持锁执行长时间网络 I/O。进程入口用 `if __name__ == "__main__"`，提交的函数与参数需支持进程传递。

## 练习与验收

1. 把 20 个模拟请求分别同步和并发执行，记录耗时与并发峰值。
2. 让一个任务超时，验证资源清理和其他任务的预期行为。
3. 解释为什么限制连接数不等于限制总任务数量。

验收：能解释性能来源，并发数量和总等待时间都有边界。参考：[asyncio 任务](https://docs.python.org/3/library/asyncio-task.html)、[concurrent.futures](https://docs.python.org/3/library/concurrent.futures.html)。
