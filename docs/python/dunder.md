---
title: 5.3. 方法类型、属性与 Dunder 协议
description: 让对象参与表示、长度、迭代与比较等内置协议。
pageClass: aip-article python-course
---

# 5.3. 方法类型、属性与 Dunder 协议

先修建议：[类、实例、方法与数据建模](./objects)、[迭代协议、惰性与耗尽](./iterators)。

特殊方法让对象参与 len、迭代、表示等 Python 协议。普通调用优先使用内置操作，而不是到处直接调用 dunder；实现协议时要保留其语义。

## 一个可迭代的小容器 {#concept-1}

```python
class Titles:
    def __init__(self, values):
        self._values = tuple(values)

    def __len__(self):
        return len(self._values)

    def __iter__(self):
        return iter(self._values)

    def __repr__(self):
        return f"Titles({self._values!r})"

items = Titles(["Python", "Go"])
assert len(items) == 2
assert list(items) == ["Python", "Go"]
assert repr(items) == "Titles(('Python', 'Go'))"
```

每次 __iter__ 返回新迭代器，本对象可重复遍历；如果返回自身且保存位置，就要提供 __next__，并明确一次性语义。外层 tuple 不自动深复制其中可变元素。

## 不同方法绑定 {#concept-2}

| 形式 | 接收什么 | 常见用途 |
| --- | --- | --- |
| 普通实例方法 | self | 读写实例状态。 |
| classmethod | cls | 替代构造或类范围行为。 |
| staticmethod | 无隐式状态 | 放在类型命名空间的独立操作。 |
| property | 属性访问协议 | 简单计算和受控赋值，避免隐蔽重 I/O。 |

__repr__ 用于开发者诊断，__str__ 面向展示；__eq__/__hash__ 的契约影响字典与集合。定义相等而不理解哈希可能改变可哈希性，尤其可变数据不适合随意作键。

## 动手练习与验收 {#lab}

1. 为 Titles 测试空输入、重复遍历与 repr。
2. 实现一个合理的属性，不把网络请求藏在属性读取中。
3. 为业务对象说明“同 ID”和“所有字段相等”哪一个是所需等价关系。

依据：[特殊方法数据模型](https://docs.python.org/3/reference/datamodel.html#special-method-names)。
