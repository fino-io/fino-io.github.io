---
title: 7.4. 上下文管理器与资源协议
description: 理解 with、enter/exit、contextmanager 和异常传播。
pageClass: aip-article python-course
---

# 7.4. 上下文管理器与资源协议

先修建议：[异常、异常链与清理](./exceptions)、[文件、JSON、CSV 与标准库 I/O](./files-errors)、[生成器表达式、yield 与流式计算](./generators)。

with 把进入、使用、退出连成资源协议。它既可管理文件，也可管理锁、临时目录和事务；退出发生不等于所有错误都应被吞掉。

## 正常与异常退出 {#concept-1}

```python
from contextlib import contextmanager

steps = []
@contextmanager
def resource():
    steps.append("进入")
    try:
        yield "资源"
    finally:
        steps.append("退出")

with resource() as value:
    assert value == "资源"
    steps.append("使用")
assert steps == ["进入", "使用", "退出"]
```

contextmanager 包装的生成器应按协议只 yield 一次，yield 前准备资源，finally 中清理。不是任意生成器都能当上下文管理器。

```mermaid
flowchart LR
  E["进入：获取资源"] --> B["with 块：使用"] --> X["退出：清理"]
  B --> F["块内失败"] --> X
  X --> P["未抑制的异常继续传播"]
```

## enter/exit 与异常抑制 {#concept-2}

类可实现 __enter__/__exit__；__exit__ 收到异常信息，返回真值会抑制异常。只有确实定义为可恢复的错误才抑制，不写万能吞错上下文。

已有文件、TemporaryDirectory、锁等资源使用现成 with 协议。多个条件资源可用 contextlib.ExitStack；异步资源用 async with 与 asynccontextmanager。SQLite 连接的事务上下文不自动代表关闭连接，项目里用 closing 明确寿命。

## 动手练习与验收 {#lab}

1. 在 with 块里制造 ValueError，确认退出记录仍出现且异常传播。
2. 对文件、锁和事务分别说明进入与退出的含义。
3. 构造提前退出的生成器资源，使用明确关闭协议验证清理。

依据：[with 语句](https://docs.python.org/3/reference/compound_stmts.html#the-with-statement)、[contextlib](https://docs.python.org/3/library/contextlib.html)。
