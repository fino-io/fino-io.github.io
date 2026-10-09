---
title: 7.2. 生成器表达式、yield 与流式计算
description: 通过惰性求值、一次性消费和资源管理减少中间集合。
pageClass: aip-article python-course
---

# 7.2. 生成器表达式、yield 与流式计算

先修建议：[迭代协议、惰性与耗尽](./iterators)、[列表推导式与集合转换](./comprehensions)。

生成器保存尚未完成的执行状态，消费时才推进。它能减少中间集合，也会把异常和资源寿命推迟到消费阶段。

## 表达式与 yield {#concept-1}

```python
expression = (n*n for n in range(4))
assert next(expression) == 0
assert list(expression) == [1, 4, 9]
assert list(expression) == []

def squares(values):
    for value in values:
        yield value * value

assert list(squares([1, 2, 3])) == [1, 4, 9]
```

调用含 yield 的函数得到生成器，不会立即完成整个函数体。每次 next/for 推进到下一个 yield，之后继续保留局部状态；耗尽不会自动重放。

```mermaid
flowchart LR
  C["调用：得到生成器"] --> N["消费下一项"] --> Y["运行到 yield 并暂停"] --> N
  N --> E["没有更多值：耗尽"]
```

## 流式处理与边界 {#concept-2}

```python
def cleaned(lines):
    for line in lines:
        value = line.strip()
        if value:
            yield value

assert list(cleaned([" Python\n", "", " Go "])) == ["Python", "Go"]
```

外层如果最终 list(...) 收集全部值，仍要承担结果内存。输入无限时必须限制消费；多个生成器连接的链条仍需明确谁打开、谁关闭底层资源。

## 提前结束与清理 {#concept-3}

用 try/finally 管理生成器内部资源，必要时显式 close 或用上下文协议。不要返回一个依赖已经关闭文件的生成器并期待稍后还能读取。yield from 用于委派另一个迭代来源，不等于把所有值提前展开。

## 动手练习与验收 {#lab}

1. 给生成器加入记录动作，验证动作在消费时发生。
2. 提前结束消费并关闭，验证 finally 执行。
3. 为大输入设计固定批次或消费上限，不把全部结果又装进列表。

依据：[生成器教程](https://docs.python.org/zh-cn/3/tutorial/classes.html#generators)、[生成器表达式](https://docs.python.org/3/reference/expressions.html#generator-expressions)。
