---
title: 09 · 类型标注与边界校验
description: Python 中文学习指南：类型标注与边界校验，包含概念、代码示例、练习与验收。
pageClass: aip-article
---

# 09 · 类型标注与边界校验

本章目标：用标注明确接口，用静态检查发现类型错误，并在外部输入处做真实校验。

## 标注不自动校验值

```python
from collections.abc import Iterable
from typing import TypedDict

class Student(TypedDict):
    name: str
    score: int

def passed_names(students: Iterable[Student]) -> list[str]:
    return [student["name"] for student in students if student["score"] >= 60]

assert passed_names([{"name": "小林", "score": 80}]) == ["小林"]
```

`list[str]` 描述元素类型，`str | None` 描述可选值。`TypedDict` 描述字典字段形状，运行时仍是普通 dict。类型检查器可发现传错参数，但 Python 本身通常不强制注解；不要把类型注解当作输入验证。

接收只读数据时用 `Iterable`、`Sequence`、`Mapping` 等能力接口，返回具体容器更便于调用者使用。没有输入输出类型关系时无需强行引入泛型。`Any` 会削弱检查，适合逐步接入旧代码，不应传播到整个业务核心。

## 先解析，再进入业务

```python
def parse_score(value: object) -> int:
    if isinstance(value, bool) or not isinstance(value, int):
        raise ValueError("分数必须为整数")
    if not 0 <= value <= 100:
        raise ValueError("分数必须在 0 到 100 之间")
    return value
```

bool 是 int 的子类，业务要求纯整数时要明确拒绝。HTTP 请求、配置文件和数据库结果都应在边界解析，内部尽量只流转已验证数据。使用 Pydantic 时阅读严格模式和转换规则，避免把意外的字符串悄悄当成正确值。

## 逐步引入静态检查

可以选 mypy 或 Pyright，先覆盖公共函数和主要数据模型，再逐步收紧。示例安装命令：`python -m pip install mypy`，检查命令：`python -m mypy src`。检查器只能覆盖自己理解的类型；第三方库可能需要类型存根。

`Protocol` 用结构化类型表达协作者能力；例如只需 `.read()` 就不必绑定特定文件类。`cast()` 告诉检查器你的判断，不执行转换；`# type: ignore` 应标明具体原因，不能作为默认解决办法。

## 练习与验收

1. 为词频函数标注参数和返回值，让检查器发现传入整数的问题。
2. 验证 `None`、布尔值、越界整数和字符串分数。
3. 为一个读数据协作者定义最小 Protocol，避免巨大接口。

验收：能明确区分标注、静态检查和运行时校验。参考：[typing 文档](https://docs.python.org/3/library/typing.html)、[mypy 入门](https://mypy.readthedocs.io/en/stable/getting_started.html)。
