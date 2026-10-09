---
title: 2.2. 哈希表、键与复杂度
description: 理解 dict/set 的键约束、查找和冲突，不依赖私有布局。
pageClass: aip-article python-course
---

# 2.2. 哈希表、键与复杂度

先修建议：[列表、元组、集合与字典](./collections)。

哈希表把键的哈希与相等规则用于查找。Python dict/set 已提供成熟实现，课程关注键的契约、存在性和规模，而不依赖 CPython 某个版本的私有槽位布局。

## 值、存在性与键 {#concept-1}

```python
scores = {"Python": 0}
assert scores["Python"] == 0
assert "Python" in scores
assert "Rust" not in scores
assert scores.get("Rust", 0) == 0
coordinates = {(1, 2): "起点"}
assert coordinates[(1, 2)] == "起点"
```

get 的默认值可能与已存零值相同，需区分时先检查键存在。list 不可哈希；tuple 若内部含不可哈希对象也不能作键。可哈希不等于“整个对象绝对不可变”，自定义键必须保持哈希与相等一致的契约。

## 冲突与相等不是同一件事 {#concept-2}

两个键可能得到相同哈希但并不相等，容器仍要区分它们。不能把 hash(key) 当唯一 ID，也不能把跨运行稳定性假定为所有字符串都相同。

```python
mapping = {1: "整数", True: "布尔"}
assert len(mapping) == 1
assert mapping[1] == "布尔"
```

1 与 True 相等且哈希相同，因此这里指向同一键位置；外部严格区分布尔和整数时要在数据边界校验，不靠字典自行区分。

```mermaid
flowchart LR
  K["查询键"] --> H["计算哈希"] --> C["候选位置与冲突处理"] --> E["按键相等规则确认"] --> V["得到值或缺失"]
```

这是概念流程，不规定具体内部布局。常规 dict/set 查找平均 O(1)，极端碰撞或不良自定义键可能更差；内存占用与扩容也有成本。插入顺序由语言契约保留，但不等于按键排序。

## 动手练习与验收 {#lab}

1. 测试不可哈希键，解释失败原因而非只记住报错。
2. 为缓存区分“缓存了 None”和“未命中”，用专门哨兵或成员检查。
3. 验证两个值相等的键如何覆盖，解释为什么不能把 hash 当业务唯一标识。

依据：[dict 与 set](https://docs.python.org/3/library/stdtypes.html#mapping-types-dict)、[hashable 术语](https://docs.python.org/3/glossary.html#term-hashable)。
