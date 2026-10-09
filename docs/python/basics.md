---
title: 1.2. 语法、缩进、输入与输出
description: 从表达式和语句写出可复现的小程序。
pageClass: aip-article python-course
---

# 1.2. 语法、缩进、输入与输出

先修建议：[安装、解释器与第一次运行](./toolchain)。

程序由语句组成，表达式产生值，缩进划分代码块。先写一段能解释每一步的小程序，再引入更多语法；不要把“少写符号”理解成“没有结构”。

## 表达式、语句和缩进 {#concept-1}

```python
price = 20
quantity = 3
total = price * quantity
if total >= 50:
    print("满足活动金额")
print(total)  # 60
assert total == 60
```

乘法表达式先得到 60，赋值把名字 total 绑定到结果。if 后的冒号开始一个块，缩进的 print 只在条件成立时运行；最后的 print 不在块内。使用四个空格，避免混用 tab 与空格。

```mermaid
flowchart LR
  E["表达式计算值"] --> A["名字绑定结果"] --> C["条件选择语句块"] --> O["输出或继续处理"]
```

注释说明代码为何这样做，不替代有意义的名字。大小写有区别，Python 中 true/false 应写成 True/False，空值写 None。

## 输入、转换和展示是三个动作 {#concept-2}

输入通常得到 str，计算前须按需求解析。以下是独立程序，输入 8 时输出 16：

```python
raw = input("请输入整数：")
number = int(raw.strip())
print(number * 2)
```

本例故意只展示正常路径，输入非整数会抛 ValueError；错误处理在[异常课程](./exceptions)学习。不会因为提示词写了“整数”就得到一个 int，也不会因为变量名叫 number 就自动完成校验。

| 操作 | 得到什么 |
| --- | --- |
| `input(...)` | 用户提供的一行文本。 |
| `int(text)` | 解析得到整数或失败。 |
| `print(value)` | 写输出，返回 None。 |
| `f"总计 {total}"` | 根据表达式构造字符串。 |

## 运行顺序与错误定位 {#concept-3}

脚本通常从顶层向下运行，函数定义创建可调用对象，不立即执行函数体。语法错误先于正常运行被报告；运行异常有 traceback，最接近异常末尾的文件与行号通常给出关键失败位置。

用最小输入复现问题，不只看最后一行错误文字。逐步打印或调试可以观察值，但最终把预期写成 assert 或测试，让问题修复可重复验证。

## 动手练习与验收 {#lab}

1. 修改 price、quantity，预测条件是否执行及最后结果。
2. 把 if 内 print 移出缩进，解释行为变化。
3. 比较表达式值和 print 返回值，不把展示函数当计算结果。

依据：[Python 速览](https://docs.python.org/zh-cn/3/tutorial/introduction.html)、[词法规则](https://docs.python.org/3/reference/lexical_analysis.html)。
