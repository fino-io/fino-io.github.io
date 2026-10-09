---
title: 9.3. 进程、序列化与主入口
description: 为 CPU 工作建立可传递任务，测量通信与内存成本。
pageClass: aip-article python-course
---

# 9.3. 进程、序列化与主入口

先修建议：[并发模型、GIL 与选择依据](./concurrency)、[内置模块、自定义模块与导入](./modules)。

进程隔离对象与解释器状态，适合需要多核 Python CPU 工作的场景。任务必须能传递和重建，启动与序列化成本不自动消失。

## 主入口与可传递函数 {#concept-1}

独立保存为 processes.py，从终端运行：

```python
from concurrent.futures import ProcessPoolExecutor
import multiprocessing

def square(value):
    return value * value

def main():
    context = multiprocessing.get_context("spawn")
    with ProcessPoolExecutor(max_workers=2, mp_context=context) as pool:
        results = list(pool.map(square, range(5)))
    assert results == [0, 1, 4, 9, 16]
    print(results)

if __name__ == "__main__":
    main()
```

使用 spawn 明确建立新解释器，入口保护避免子进程导入时再次无限启动。函数定义在模块顶层，参数与结果要支持相应序列化；局部闭包和未定义传递协议的连接对象不能随意提交。

```mermaid
flowchart LR
  P["父进程输入"] --> S["序列化 / 进程通信"] --> W["工作进程计算"] --> R["传回结果"]
```

## 任务粒度与共享 {#concept-2}

本例很小，进程开销可能超过计算收益，目的在验证生命周期。实际 CPU 任务按块提交，测启动、计算、通信与峰值内存。进程不会直接共享普通全局列表，需明确队列、共享内存或外部存储协议。

平台与 Python 版本的默认启动方式可能变化，按应用兼容性显式选择并测试，不把某台机器的 fork 行为当普遍保证。失败时收拢池和剩余工作，不能只打印一个错误后遗留子进程。

## 动手练习与验收 {#lab}

1. 从终端运行示例，解释主入口为何必要。
2. 比较小任务与大任务的总耗时，计入序列化成本。
3. 制造一个工作函数失败，确认结果读取传播错误且池被关闭。

依据：[multiprocessing](https://docs.python.org/3/library/multiprocessing.html)、[ProcessPoolExecutor](https://docs.python.org/3/library/concurrent.futures.html#processpoolexecutor)。
