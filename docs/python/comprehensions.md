---
title: 7.1. 列表推导式与集合转换
description: 把映射、过滤和嵌套的输入输出关系写清楚。
pageClass: aip-article python-course
---

# 7.1. 列表推导式与集合转换

先修建议：[条件、循环与终止条件](./control-flow)、[列表、元组、集合与字典](./collections)。

推导式将输入、过滤条件和结果映射放在一处。只在一眼能看懂关系时使用，复杂分支与副作用仍写循环。

## 映射与过滤 {#concept-1}

```python
values = [-2, -1, 0, 1, 2]
squares = [value * value for value in values if value > 0]
assert squares == [1, 4]
lookup = {value: value * value for value in values}
assert lookup[-2] == 4
unique_lengths = {len(word) for word in ["Go", "Python", "Go"]}
assert unique_lengths == {2, 6}
```

读法是：从输入逐项取值，先判断是否保留，再计算结果表达式。列表推导式立即生成整个列表，不因为写得短就变成惰性。

## 嵌套与求值顺序 {#concept-2}

```python
matrix = [[1, 2], [3, 4]]
flat = [value for row in matrix for value in row]
assert flat == [1, 2, 3, 4]
```

for 的顺序与展开后的嵌套循环一致。多层条件或复杂业务判断可拆成清楚的函数/循环；不要用推导式仅执行打印或网络副作用并丢弃结果。

## 变量作用域与可变结果 {#concept-3}

Python 3 的推导式有独立循环变量作用域，但闭包仍可能共享其最后值。创建二维列表不要写 `[[0]*3]*2` 并假设每行独立，用逐行创建。

```python
rows = [[0] * 3 for _ in range(2)]
rows[0][0] = 9
assert rows[1] == [0, 0, 0]
```

## 动手练习与验收 {#lab}

1. 把推导式展开成循环，验证结果一致。
2. 对空输入、重复键和嵌套列表检查是否共享或覆盖。
3. 比较列表推导式和生成器表达式的生成时机，下一节解释后者。

依据：[推导式教程](https://docs.python.org/zh-cn/3/tutorial/datastructures.html#list-comprehensions)、[表达式规范](https://docs.python.org/3/reference/expressions.html)。
