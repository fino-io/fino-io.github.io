---
title: 14.2. unittest、doctest 与 nose 的位置
description: 运行标准库测试与示例，解释旧测试体系迁移。
pageClass: aip-article python-course
---

# 14.2. unittest、doctest 与 nose 的位置

先修建议：[pytest、隔离、参数化与替身](./testing)。

原路线列出 unittest/pyUnit、doctest 和 nose。前两者来自标准库，一个组织测试用例，一个验证交互示例；nose 保留作为历史体系理解，不当成所有新项目的默认选择。

## unittest 完整单文件 {#concept-1}

保存 test_example.py：

```python
import unittest

def subtotal(price, quantity):
    if price < 0 or quantity < 1:
        raise ValueError("输入不合法")
    return price * quantity

class PricingTests(unittest.TestCase):
    def test_result(self):
        self.assertEqual(subtotal(20, 3), 60)
    def test_invalid(self):
        with self.assertRaises(ValueError):
            subtotal(20, 0)

if __name__ == "__main__":
    unittest.main()
```

`python -m unittest -v test_example.py` 执行。setUp/tearDown 与 cleanup 管理资源，测试必须可隔离重跑；pyUnit 是 unittest 的历史称呼，不是另一套必须安装的库。

## doctest 可运行说明 {#concept-2}

保存 example.py：

```python
def double(value):
    """把值乘以二。

    >>> double(3)
    6
    >>> double(0)
    0
    """
    return value * 2
```

执行 `python -m doctest -v example.py`。doctest 对输出有具体匹配规则，时间、路径、随机顺序的例子要控制或采用相应选项；它适合说明性例子，不替代完整失败、并发和数据库测试。

## nose 的维护状态与迁移 {#concept-3}

nose 官方说明其长期处于维护模式，并建议新项目考虑 Nose2、pytest 或 unittest。原路线保留 nose 节点，本课程说明历史用途与迁移条件，不照搬旧安装指南中的 root/easy_install 工作流。

迁移先固定测试发现、fixture、插件、跳过与参数化行为，再分批换运行器；不能只替换命令就假设测试数量与语义不变。

## 动手练习与验收 {#lab}

1. 运行 unittest 与 doctest 实验，改坏预期后两者都必须失败。
2. 比较函数断言、异常断言与示例输出断言的用途。
3. 列出现有 nose 工程需要迁移的插件与发现规则，不安装所有历史工具。

依据：[unittest](https://docs.python.org/3/library/unittest.html)、[doctest](https://docs.python.org/3/library/doctest.html)、[nose 官方维护说明](https://nose.readthedocs.io/en/latest/)。
