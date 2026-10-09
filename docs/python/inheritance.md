---
title: 5.2. 继承、super 与替代关系
description: 在保持行为契约的前提下复用类型，理解 MRO。
pageClass: aip-article python-course
---

# 5.2. 继承、super 与替代关系

先修建议：[类、实例、方法与数据建模](./objects)。

继承表达“子类型可以参与父类型的约定”，不仅是拿到一些同名方法。新增实现必须保留输入、结果与失败语义；仅为了复用几行代码时，组合可能更清楚。

## super 与单继承 {#concept-1}

```python
class Storage:
    def describe(self):
        return "存储"

class MemoryStorage(Storage):
    def describe(self):
        return super().describe() + "：内存"

assert MemoryStorage().describe() == "存储：内存"
assert isinstance(MemoryStorage(), Storage)
```

super 沿方法解析顺序继续查找，并不简单等同于把某个固定父类名字复制进调用。重写时别把父类型原本允许的输入缩小而不说明。

## MRO 与协作 {#concept-2}

```python
class A:
    pass
class B(A):
    pass
class C(A):
    pass
class D(B, C):
    pass

assert D.__mro__ == (D, B, C, A, object)
```

多重继承需一致的协作调用与初始化约定，不靠直觉“左边先执行所以总没问题”。方法解析遇到矛盾层次会失败；教学认识 MRO，不为普通任务模型造复杂菱形结构。

## 组合与协议 {#concept-3}

报告生成器接收一个读取对象时，关键需求是 read 行为，不是所有读取器必须继承某个巨型 BaseReader。Python 可用鸭子类型或后续的 Protocol 表达行为，依赖在使用方保持小而明确。

## 动手练习与验收 {#lab}

1. 给同一存储契约实现内存与文件版本，测试成功、缺失与错误语义一致。
2. 打印一个简单多重继承的 MRO，解释 super 的下一站。
3. 把纯复用代码的继承改成组合，说明接口是否更清楚。

依据：[继承教程](https://docs.python.org/zh-cn/3/tutorial/classes.html#inheritance)、[数据模型](https://docs.python.org/3/reference/datamodel.html)。
