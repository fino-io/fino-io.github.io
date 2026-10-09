---
title: 9.2. 线程、锁与有界执行器
description: 维护共享不变量并限制 I/O 任务规模。
pageClass: aip-article python-course
---

# 9.2. 线程、锁与有界执行器

先修建议：[并发模型、GIL 与选择依据](./concurrency)。

线程共享进程内对象，有利于 I/O 协作，也让共享状态需要一致保护。锁维护整个判断和修改，不只是某次赋值。

## 独立任务与有界池 {#concept-1}

```python
from concurrent.futures import ThreadPoolExecutor

def square(value):
    return value * value

with ThreadPoolExecutor(max_workers=3) as pool:
    results = list(pool.map(square, range(5)))
assert results == [0, 1, 4, 9, 16]
```

max_workers 限制活动线程，不意味着提交一百万任务不会占用排队内存。结果读取时传播任务异常，map 的结果顺序与输入对应；按完成顺序处理可用 as_completed。

## 完整临界区 {#concept-2}

```python
from threading import Lock
from concurrent.futures import ThreadPoolExecutor

available = 3
lock = Lock()
def take(_):
    global available
    with lock:
        if available == 0:
            return False
        available -= 1
        return True

with ThreadPoolExecutor(max_workers=4) as pool:
    successes = list(pool.map(take, range(10)))
assert sum(successes) == 3
assert available == 0
```

```mermaid
flowchart LR
  L["获取同一把锁"] --> C["检查剩余数量"] --> U["按检查更新"] --> R["释放锁"]
```

不要把检查移到锁外，也不要持锁等待长网络操作。GIL 不替这个业务不变量建立契约；自由线程环境同样需清楚同步。线程取消通常不能强制停止已运行函数，需要协作信号与操作预算。

## 动手练习与验收 {#lab}

1. 给库存测试不同任务数，成功次数不超过初始库存。
2. 用 queue.Queue 交接任务，明确停止信号、task_done 与 join。
3. 对线程池的任务错误和超时分别写断言，不把等待超时当任务已终止。

依据：[threading](https://docs.python.org/3/library/threading.html)、[concurrent.futures](https://docs.python.org/3/library/concurrent.futures.html)。
