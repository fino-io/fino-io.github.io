---
title: 1.3. 字符串、集合与数据处理
description: Python 中文学习指南：字符串、集合与数据处理，包含概念、代码示例、练习与验收。
pageClass: aip-article
---

# 1.3. 字符串、集合与数据处理

本章目标：根据数据含义选容器，掌握常见查询和转换，并识别可变对象共享问题。

## 容器如何选择

| 类型 | 适用场景 | 注意事项 |
| --- | --- | --- |
| list | 有序、可修改的数据序列 | `append` 修改原列表，索引越界抛异常。 |
| tuple | 固定字段组合、不可变序列 | 不可变的是容器，内部仍可能含可变对象。 |
| dict | 按键查询、聚合和配置 | 保持插入顺序；键必须可哈希。 |
| set | 去重、成员判断、集合运算 | 不依赖其遍历顺序；空集合用 `set()`。 |

字符串是不可变 Unicode 文本，`bytes` 是字节，两者经 `encode` / `decode` 转换。`len(text)` 计算 Unicode 码点数量，不一定等于用户看到的字符数。切片 `items[start:stop:step]` 不包含 stop；负索引从末尾开始。

## 清洗与聚合

```python
from collections import Counter

text = " Python, rust, PYTHON, go "
languages = [part.strip().casefold() for part in text.split(",")]
counts = Counter(name for name in languages if name)
assert counts["python"] == 2
print(sorted(counts.items(), key=lambda item: (-item[1], item[0])))
```

`strip()` 清除边缘空白，`split()` 拆分，`join()` 合并。`casefold()` 适合无视大小写的文本比较。正则表达式用于真正的模式匹配；固定前后缀用 `startswith` 和 `endswith` 更清楚。

列表推导式适合简单的映射与筛选；复杂嵌套、有日志或异常处理的流程用普通循环。字典计数优先复用 `Counter`，分组可用 `defaultdict(list)`，队列用 `deque`，避免反复 `list.pop(0)`。

## 可变性与复制

```python
original = [{"score": 10}]
shallow = original.copy()
shallow[0]["score"] = 20
assert original[0]["score"] == 20
```

赋值不会复制对象，浅复制只复制外层容器。只有确实需要独立嵌套结构时才考虑 `copy.deepcopy`。`[[0] * 3] * 2` 会重复引用同一行，二维列表应写 `[[0] * 3 for _ in range(2)]`。

`dict[key]` 适合键必须存在的场景，缺失会抛 `KeyError`；`dict.get(key, default)` 适合缺失有合理默认值的场景。不要让默认值掩盖格式错误。删除或新增集合元素时，优先构建新集合，避免一边遍历一边改变大小。

## 练习与验收

1. 统计一段文本的词频，按频率和词名排序。
2. 用集合找出两个用户列表的共同用户和差异用户。
3. 演示浅复制和深复制的区别；修正二维列表共享引用问题。

验收：能说明所选容器的查询方式、顺序要求和修改影响范围。参考：[数据结构教程](https://docs.python.org/zh-cn/3/tutorial/datastructures.html)、[collections](https://docs.python.org/3/library/collections.html)。
