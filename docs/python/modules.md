---
title: 3.1. 内置模块、自定义模块与导入
description: 组织单文件、包入口和模块搜索路径。
pageClass: aip-article python-course
---

# 3.1. 内置模块、自定义模块与导入

先修建议：[函数、内置函数与作用域](./functions)。

模块把一组相关定义放在可导入的命名空间里。原路线区分 Builtin 与 Custom，本节分别运行标准库和自己的模块，再认识包与导入路径。

## 标准库模块 {#concept-1}

```python
import math
from statistics import mean

assert math.isqrt(17) == 4
assert mean([2, 4, 6]) == 4
```

import 绑定模块或名字，不是把其他文件的文字简单粘贴过来。内置/标准库组件的实现方式可能不同，但使用时都按公开 API，不依赖私有布局。

## 自定义模块的双文件实验 {#concept-2}

保存 pricing.py：

```python
def subtotal(price, quantity):
    if price < 0 or quantity < 1:
        raise ValueError("价格和数量不合法")
    return price * quantity
```

同目录保存 main.py，执行 `python main.py`：

```python
from pricing import subtotal

assert subtotal(20, 3) == 60
print(subtotal(20, 3))
```

导入模块会执行其顶层语句，通常同一进程后续导入复用已加载对象。文件名不要遮住 json、typing、csv 等库；不要把数据库连接和大量工作隐藏在导入副作用里。

```mermaid
flowchart LR
  M["main.py"] --> I["import pricing"] --> P["pricing 模块命名空间"] --> F["subtotal 函数"]
```

## 包、入口与搜索路径 {#concept-3}

目录可组织为包，常规包使用 __init__.py，包内相对导入按包上下文解释。`python -m package.module` 与直接运行一个包内文件的上下文不同，不能靠随意修改 sys.path 掩盖结构问题。

`if __name__ == "__main__"` 把脚本入口与可复用定义分开：被导入时不会执行入口工作。项目打包、src 布局和依赖声明在[配置课程](./configuration)继续学习，不在每个文件中各造一套加载器。

## 动手练习与验收 {#lab}

1. 按两个文件运行实验，再从另一个目录说明为什么搜索路径会变化。
2. 给 pricing 增加主入口，验证直接运行与被导入的行为不同。
3. 建一个最小包，通过 -m 运行，解释模块名与文件路径的区别。

依据：[模块教程](https://docs.python.org/zh-cn/3/tutorial/modules.html)、[import 系统](https://docs.python.org/3/reference/import.html)。
