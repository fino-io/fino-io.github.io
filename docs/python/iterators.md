---
title: 2.3. 迭代器、生成器与装饰器
description: Python 中文学习指南：迭代器、生成器与装饰器，包含概念、代码示例、练习与验收。
pageClass: aip-article
---

# 2.3. 迭代器、生成器与装饰器

本章目标：理解惰性计算和资源生命周期，读懂常用装饰器，并知道何时普通函数更简单。

## 可迭代对象与迭代器

可迭代对象能交给 `iter()` 获取迭代器；迭代器通过 `next()` 产生下一个值，耗尽时抛 `StopIteration`。list 可重复遍历，生成器通常只能消费一次。生成器函数含 `yield`，每次执行暂停并保留局部状态。

```python
from pathlib import Path
from collections.abc import Iterator

def nonempty_lines(path: Path) -> Iterator[str]:
    with path.open(encoding="utf-8") as source:
        for line in source:
            text = line.strip()
            if text:
                yield text
```

此函数逐行处理而不一次加载整个文件。使用时完整迭代，或显式管理提前停止时的关闭；资源位于生成器内部时，文件会在迭代期间保持打开。业务更复杂时让调用者管理 `with`，把纯迭代处理与文件生命周期分开。

生成器表达式 `(x * x for x in values)` 适合一次性聚合。`itertools.islice` 截取迭代序列，`chain` 拼接，`groupby` 按连续相同键分组；groupby 不是全局分组，通常需要先按同一键排序。

## 装饰器保留函数接口

```python
from functools import wraps
from time import perf_counter

def timed(function):
    @wraps(function)
    def wrapper(*args, **kwargs):
        start = perf_counter()
        try:
            return function(*args, **kwargs)
        finally:
            print(f"{function.__name__}: {perf_counter() - start:.6f}s")
    return wrapper

@timed
def total(values):
    return sum(values)

assert total([1, 2, 3]) == 6
```

`@timed` 等价于定义后执行 `total = timed(total)`。`wraps` 保留名称和文档等元数据。该装饰器用于同步示例，不可直接当作异步函数执行耗时统计。实际项目优先使用日志、框架中间件或成熟观测方案。

缓存可用 `functools.lru_cache`，前提是参数可哈希、函数结果适合复用；需考虑缓存上限、失效和敏感数据。不要缓存具有副作用或依赖变化环境的结果而不说明语义。

## 练习与验收

1. 将文件词频统计改为逐行处理，解释内存变化。
2. 对同一个生成器求和两次，解释第二次结果。
3. 给同步函数增加计时装饰器，确认返回值和异常均保留。

验收：能判断何时发生计算、谁持有资源以及装饰器是否改变行为。参考：[itertools](https://docs.python.org/3/library/itertools.html)、[functools](https://docs.python.org/3/library/functools.html)。
