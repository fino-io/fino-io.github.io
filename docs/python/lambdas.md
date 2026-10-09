---
title: 4.1. Lambda、函数值与闭包
description: 用短函数表达排序规则，不把复杂流程藏进表达式。
pageClass: aip-article python-course
---

# 4.1. Lambda、函数值与闭包

先修建议：[函数、内置函数与作用域](./functions)。

Lambda 创建一个只有表达式的匿名函数，函数值则可以传给其他操作。它适合短规则，不意味着复杂函数都应压成一行。

## 排序规则作为函数 {#concept-1}

```python
names = ["Python", "Go", "Rust"]
ordered = sorted(names, key=lambda name: (len(name), name))
assert ordered == ["Go", "Rust", "Python"]
```

key 返回比较键，本例先比长度再比名字。若规则需要校验、多分支或复用，定义具名函数更清楚；不要把 I/O 和异常处理塞入长 lambda。

## 延迟绑定与固定本轮值 {#concept-2}

```python
bad = [lambda: n for n in range(3)]
assert [callback() for callback in bad] == [2, 2, 2]
good = [lambda n=n: n for n in range(3)]
assert [callback() for callback in good] == [0, 1, 2]
```

闭包捕获名字对应的变量，而不是自动冻结每轮数字；默认参数在创建函数时求值，所以第二组固定各自 n。默认值含可变对象时仍可能共享，不能把这条技巧扩展为深复制保证。

## 选择表达方式 {#concept-3}

| 需求 | 起点 |
| --- | --- |
| 一次性短比较键 | lambda。 |
| 有名称的业务规则 | def。 |
| 保留少量状态 | 闭包或清楚的小对象。 |
| 复杂可配置策略 | 先明确接口，不造泛化回调框架。 |

## 动手练习与验收 {#lab}

1. 按分数降序、同分名字排序，分别用 lambda 与具名函数。
2. 解释 bad 的三个回调共享什么，并给每个回调固定输入。
3. 写一个折扣函数工厂，明确创建时状态与调用时参数。

依据：[Lambda 表达式](https://docs.python.org/zh-cn/3/tutorial/controlflow.html#lambda-expressions)、[作用域](https://docs.python.org/3/reference/executionmodel.html)。
