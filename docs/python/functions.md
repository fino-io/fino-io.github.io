---
title: 1.4. 函数、作用域与接口设计
description: Python 中文学习指南：函数、作用域与接口设计，包含概念、代码示例、练习与验收。
pageClass: aip-article
---

# 1.4. 函数、作用域与接口设计

本章目标：把流程拆成输入输出清楚的函数，正确处理参数、默认值和作用域。

## 先设计输入与返回值

函数用 `def` 定义，无显式 return 时返回 `None`。计算函数尽量返回值，把读取文件、打印和网络调用放在入口附近，这样更容易测试。不要为每一行拆一个函数；函数应代表完整、有名称的操作。

```python
def average(values: list[float], *, digits: int = 2) -> float:
    """计算非空序列的均值，按指定精度舍入。"""
    if not values:
        raise ValueError("至少提供一个数值")
    return round(sum(values) / len(values), digits)

assert average([1.0, 2.0], digits=1) == 1.5
```

`*` 后是仅限关键字参数，调用更清楚。`*args` 接收额外位置参数，`**kwargs` 接收额外关键字参数，不必给所有函数都加上它们。参数传递的是对象引用；函数内重新绑定参数不会改变调用者的名字，但修改同一个列表会影响调用者。

## 默认值只计算一次

```python
def add_tag(tag: str, tags: list[str] | None = None) -> list[str]:
    result = [] if tags is None else list(tags)
    result.append(tag)
    return result

assert add_tag("python") == ["python"]
assert add_tag("rust") == ["rust"]
```

不要写 `tags=[]`，因为同一个默认列表会被多次调用共享。本例还复制传入列表，明确选择“返回新结果”的语义；需要原地修改时应在函数名与文档中说明。

## 作用域、闭包与高阶函数

名称通常按局部、外层函数、模块、内置的顺序查找。函数内赋值会使名字成为局部变量；`global` 和 `nonlocal` 可以修改外层绑定，但过多使用会让状态难追踪，通常优先显式传参。

函数也是对象，可以作为参数传入。`sorted(records, key=...)` 是常用的高阶函数。lambda 适合短表达式，有条件分支和复用需求时改用具名函数。闭包捕获名字而非创建时的值，循环创建回调时留意延迟绑定，可用默认参数固定当前值。

## 练习与验收

1. 把词频程序拆成清洗、计数和展示三个操作。
2. 给均值函数测试空输入、负数与指定精度。
3. 写一个返回折扣计算函数的工厂，解释闭包捕获了什么。

验收：同一输入产生可预期输出，函数的副作用和失败条件明确。参考：[函数定义详解](https://docs.python.org/zh-cn/3/tutorial/controlflow.html#more-on-defining-functions)。
