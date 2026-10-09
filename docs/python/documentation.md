---
title: 13.1. Docstring、Sphinx 与 API 文档
description: 让接口说明、示例和构建可以一起维护。
pageClass: aip-article python-course
---

# 13.1. Docstring、Sphinx 与 API 文档

先修建议：[内置模块、自定义模块与导入](./modules)、[pyproject.toml 与配置职责](./configuration)。

文档说明调用者需要知道的契约：输入、输出、副作用、失败与运行条件。Sphinx 把这些说明组织成可构建文档，代码中的 docstring 与运行示例也应一起维护。

## 从可执行接口说明开始 {#concept-1}

保存 pricing.py：

```python
def subtotal(price, quantity):
    """计算非负单价和正数量的小计。

    >>> subtotal(20, 3)
    60
    """
    if price < 0 or quantity < 1:
        raise ValueError("价格和数量不合法")
    return price * quantity
```

`python -m doctest -v pricing.py` 验证示例。docstring 不只是把函数名换种说法，金额单位、可接受精度和失败条件如有要求也需写明。

## 最小 Sphinx 工程 {#concept-2}

```text
project/
  pricing.py
  docs/conf.py
  docs/index.rst
```

conf.py 示例：

```python
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
project = "Python 课程实验"
extensions = ["sphinx.ext.autodoc", "sphinx.ext.doctest"]
doctest_global_setup = "from pricing import subtotal"
```

index.rst：

```rst
接口说明
========

.. automodule:: pricing
   :members:
```

安装 Sphinx 后执行：

```sh
sphinx-build -b html -W docs docs/_build/html
sphinx-build -b doctest -W docs docs/_build/doctest
```

-W 将警告作为失败，发现缺链接或 API 文档问题。生产工程优先安装自己的包，让 autodoc 导入公开模块；这里用明确文档根路径展示最小独立实验，不把业务路径问题普遍交给 sys.path 修改。

autodoc 导入对象用于生成说明，doctest 在自己的执行命名空间运行例子；它不会自动把源模块所有函数绑定进去。这里通过 doctest_global_setup 明确导入例子需要的 subtotal，其他公开接口同样按测试所需声明。

## 导入副作用与交付 {#concept-3}

自动文档可能导入模块，模块顶层不应悄悄连接真实数据库或执行任务。生成文档与代码版本对应，图片、样本和命令也要能找到。运行条件与已知限制属于接口说明的一部分。

## 动手练习与验收 {#lab}

1. 文档构建通过后故意改坏示例，doctest 必须失败。
2. 写明空输入、非法输入和输出单位，而不是只展示正常调用。
3. 在干净环境生成 HTML，确认没有依赖本机偶然路径。

依据：[Sphinx](https://www.sphinx-doc.org/en/master/)、[doctest](https://docs.python.org/3/library/doctest.html)、[文档字符串](https://docs.python.org/zh-cn/3/tutorial/controlflow.html#documentation-strings)。
