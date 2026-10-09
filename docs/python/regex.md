---
title: 4.4. 正则表达式与文本边界
description: 匹配、提取、分组与预编译，不用正则替代结构化解析器。
pageClass: aip-article python-course
---

# 4.4. 正则表达式与文本边界

先修建议：[变量、数据类型与类型转换](./variables)。

正则把明确的字符模式写成匹配规则。先区分全串验证、搜索子串与提取字段，再选择 fullmatch、search 或 finditer；JSON、CSV、HTML 等结构复用解析器。

## 全串与局部匹配 {#concept-1}

```python
import re

pattern = re.compile(r"TASK-(?P<id>[0-9]+)")
match = pattern.fullmatch("TASK-42")
assert match is not None and match.group("id") == "42"
assert pattern.fullmatch("xTASK-42") is None
assert pattern.search("xTASK-42") is not None
```

raw string 避免 Python 字面量提前解释部分反斜线，正则引擎仍会解释自己的语法。match 可能为 None，访问 group 前先检查。用户提供的模式需处理编译错误与复杂度边界。

## 分组、替换与重复 {#concept-2}

```python
import re

text = "TASK-1 TASK-20"
ids = [int(m.group(1)) for m in re.finditer(r"TASK-([0-9]+)", text)]
assert ids == [1, 20]
assert re.sub(r"\s+", " ", "Python   课程\n") == "Python 课程 "
```

贪婪/非贪婪改变匹配范围，但不自动等于最正确协议。相互嵌套的重复模式在某些输入上会产生昂贵回溯；限制外部输入和结果数量，避免用不受控模式处理无限数据。

## Unicode 和格式协议 {#concept-3}

\w、\d 的 Unicode 语义与只允许 ASCII 的协议不同；明确选 `[0-9]` 或适当 flags。手机号、邮件等真实标准不靠一个课程正则完整覆盖；业务按需求和成熟验证方案处理。

## 动手练习与验收 {#lab}

1. 验证 fullmatch 与 search 对前缀垃圾、空输入和有效输入的差异。
2. 用命名分组提取字段，并先判断匹配失败。
3. 给解析加输入长度限制，说明为什么它不同于换成非贪婪模式。

依据：[re](https://docs.python.org/3/library/re.html)、[正则 HOWTO](https://docs.python.org/3/howto/regex.html)。
