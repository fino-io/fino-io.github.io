---
title: 07 · 对象、类与数据建模
description: Python 中文学习指南：对象、类与数据建模，包含概念、代码示例、练习与验收。
pageClass: aip-article
---

# 07 · 对象、类与数据建模

本章目标：理解实例、方法和组合，用少量类型表达数据，避免为了面向对象而增加层次。

## 名字指向对象

Python 中函数、类、模块也都是对象。类定义数据与行为，实例持有具体状态；`self` 是实例方法的第一个参数名称约定。`__init__` 初始化实例，不是返回实例的工厂函数。

```python
from dataclasses import dataclass
from decimal import Decimal

@dataclass(frozen=True)
class Item:
    name: str
    price: Decimal
    quantity: int = 1

    def subtotal(self) -> Decimal:
        if self.quantity < 1 or self.price < 0:
            raise ValueError("价格不能为负，数量必须为正")
        return self.price * self.quantity

item = Item("书", Decimal("39.90"), 2)
assert item.subtotal() == Decimal("79.80")
```

`dataclass` 自动生成初始化和比较等常用方法，适合内部数据。`frozen=True` 阻止字段重新赋值，不保证深层不可变。外部 JSON 的解析与校验可用成熟的 Pydantic，不必手写一套通用验证框架。

## 实例字段与类字段

每个对象自己的列表应在 `__init__` 中创建，或在 dataclass 中用 `field(default_factory=list)`。把列表放成类字段会让实例共享同一对象。类字段适合真正共享的常量或配置。

`@property` 适合保持简单属性接口的计算值；耗时 I/O 更适合显式方法。`@classmethod` 常用于替代构造方式，`@staticmethod` 没有实例状态需求；如果独立函数更自然，就用函数。

## 组合、继承与协议

组合是“包含某个协作者”，继承是“可以替代某种类型”。例如报告生成器接收读取函数或存储对象，通常比继承五层基类清楚。继承时必须保持父类型的行为约定，而不仅是复用代码。

`__repr__` 帮助调试，`__len__`、`__iter__` 等特殊方法让对象参与内置协议。先使用现成容器，只有业务语义需要时才实现协议。单下划线表示内部约定，并不构成访问权限控制。

## 练习与验收

1. 为订单行建模，拒绝负价格与零数量。
2. 创建两个带标签的实例，确认修改其中一个不会影响另一个。
3. 用组合给报告工具增加另一种输入来源，并解释为什么无需继承。

验收：能区分共享状态与实例状态，类的职责可用一句话说明。参考：[类教程](https://docs.python.org/zh-cn/3/tutorial/classes.html)、[dataclasses](https://docs.python.org/3/library/dataclasses.html)。
