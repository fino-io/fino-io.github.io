---
title: 02 · 语法、类型与控制流
description: Python 中文学习指南：语法、类型与控制流，包含概念、代码示例、练习与验收。
pageClass: aip-article
---

# 02 · 语法、类型与控制流

本章目标：理解名字绑定、类型转换和条件循环，写出输入、处理、输出分明的小程序。

## 值、名字与基本类型

Python 的名字绑定对象，类型属于对象。`count = 3` 后可以赋值 `count = "三"`，但业务代码应保持名字含义稳定。缩进定义代码块，通常使用四个空格；`#` 开始注释。`int` 表示整数，`float` 表示浮点数，`bool` 表示真假，`str` 表示文本，`None` 表示缺少值。

`input()` 返回字符串；运算前用 `int()` 或 `float()` 显式转换。`/` 是真除法，`//` 是向下取整，`%` 是余数，`**` 是幂。二进制浮点不能精确表示许多十进制小数，金额使用整数分或 `Decimal`。`==` 比较值；`is` 比较对象身份，常用于 `value is None`，不要用它比较数字或字符串。

## 条件与循环

```python
def shipping_fee(total: int) -> int:
    if total < 0:
        raise ValueError("订单金额不能为负数")
    return 0 if total >= 100 else 10

for total in [0, 99, 100]:
    print(f"金额 {total}，运费 {shipping_fee(total)}")
```

`if/elif/else` 按顺序选择分支。空字符串、空容器、零和 `None` 在条件中为假，但业务上它们可能不同；判断“没有提供”应明确使用 `is None`。`and`、`or` 会短路，且返回操作数，不一定返回 bool。

`for` 遍历可迭代对象；`range(1, 4)` 依次产生 1、2、3。`while` 用于次数不确定的循环，必须确保退出条件。`break` 结束循环，`continue` 跳过本次迭代。循环的 `else` 在未通过 break 退出时执行，初学时可先不用。

```python
names = ["Ada", "Linus", "Guido"]
for position, name in enumerate(names, start=1):
    print(position, name)
assert sum(range(1, 6)) == 15
```

遍历时优先使用元素和 `enumerate`，不要到处手写索引。并行遍历可用 `zip`；要求长度一致时用 `zip(a, b, strict=True)`。

## 阅读程序与调试

从第一行开始跟踪值的变化，使用 `print(repr(value), type(value))` 区分空白和类型。错误信息从最后一行查看异常名称，再定位项目中的栈帧。`assert` 可辅助学习，但生产输入验证应使用显式条件和异常，因为优化模式可能禁用断言。

## 练习与验收

1. 写温度转换程序，验证零、负数和小数。
2. 输出 1 到 100 中能被 3 整除的数及总和。
3. 写三次机会的猜数字游戏，并给出成功和失败两种流程。

验收：能解释每个分支、循环边界和转换失败的位置。参考：[内置类型](https://docs.python.org/3/library/stdtypes.html)、[控制流教程](https://docs.python.org/zh-cn/3/tutorial/controlflow.html)。
