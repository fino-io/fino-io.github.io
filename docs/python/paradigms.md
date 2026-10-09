---
title: 7.3. 过程式、面向对象与函数式
description: 围绕状态、职责和副作用选择表达方式。
pageClass: aip-article python-course
---

# 7.3. 过程式、面向对象与函数式

先修建议：[类、实例、方法与数据建模](./objects)、[Lambda、函数值与闭包](./lambdas)。

Python 支持多种表达方式。范式选择围绕状态与职责，不要求项目所有代码只属于一种风格。

## 同一任务的不同组织 {#concept-1}

```python
def total(prices):
    return sum(prices)

class Basket:
    def __init__(self, prices):
        self.prices = tuple(prices)
    def total(self):
        return sum(self.prices)

assert total([10, 20]) == Basket([10, 20]).total() == 30
```

函数适合清楚的输入输出，对象适合一组持续状态与行为；两者可合作。不可变输入和纯计算便于测试，文件、日志、网络等副作用放在明确边界。

| 方式 | 主要关注 | 常见用途 |
| --- | --- | --- |
| 过程式 | 操作步骤 | 脚本入口、装配与顺序流程。 |
| 面向对象 | 状态、行为、替代契约 | 有生命周期的协作者和领域对象。 |
| 函数式思路 | 纯计算、组合与不可变数据 | 清洗、转换、聚合与易测试核心。 |

## 避免过度过程化与过度抽象 {#concept-2}

不把每一行拆成一个函数，也不为一个实现建立五层基类。按完整职责拆分：输入读取、纯计算、结果输出就能让一个小工具清楚。只有真实替换边界才需要接口或协作类型。

## 动手练习与验收 {#lab}

1. 把文件清洗工具拆成 I/O 边界与纯转换，核心用值测试。
2. 判断一个只调用一次的小计算是否需要类，并说明理由。
3. 为持续连接对象写出状态与关闭协议，说明为何对象可能更自然。

依据：[Python 类](https://docs.python.org/zh-cn/3/tutorial/classes.html)、[函数式编程 HOWTO](https://docs.python.org/3/howto/functional.html)。
