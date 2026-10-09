---
title: 14.1. pytest、隔离、参数化与替身
description: 先固定可观察行为，再进行实现和重构。
pageClass: aip-article python-course
---

# 14.1. pytest、隔离、参数化与替身

先修建议：[函数、内置函数与作用域](./functions)、[异常、异常链与清理](./exceptions)。

测试固定调用者能观察的行为。先写正常、边界与失败断言，再实现或重构；不用测试机械模仿每个私有函数的调用顺序。

## 双文件 pytest 实验 {#concept-1}

pricing.py：

```python
def subtotal(price, quantity):
    if price < 0 or quantity < 1:
        raise ValueError("价格和数量不合法")
    return price * quantity
```

test_pricing.py：

```python
import pytest
from pricing import subtotal

@pytest.mark.parametrize("price,quantity,want", [(20, 3, 60), (0, 2, 0), (5, 1, 5)])
def test_subtotal(price, quantity, want):
    assert subtotal(price, quantity) == want

@pytest.mark.parametrize("price,quantity", [(-1, 2), (20, 0)])
def test_invalid(price, quantity):
    with pytest.raises(ValueError):
        subtotal(price, quantity)
```

安装 pytest 后执行 `python -m pytest -q`，应得到五个测试通过。失败消息保留输入和预期；不只检查“没抛异常”。

```mermaid
flowchart LR
  R["写失败断言"] --> G["最小实现使其通过"] --> F["保持行为的重构"] --> N["下一项需求"] --> R
```

## Fixture、隔离与替身 {#concept-2}

文件用 tmp_path，HTTP 用维护者测试客户端，数据库用隔离数据与迁移；时间和随机源可注入。fixture 管理准备与清理，避免跨测试共享可变全局对象。并行测试需要独立文件、端口和数据库状态。

Stub 提供固定结果，Mock 还验证互动。只在真实外部边界替换：比如非法输入不应调用上游、成功后只通知一次；不要给每个内部辅助函数都 mock。

## 覆盖率与并发测试 {#concept-3}

覆盖率表示执行到哪里，不证明断言充分。并发测试检查活动上限、取消后退出和最终不变量，不靠固定 sleep 猜测任务完成。外部网站稳定性不属于单元测试依赖，使用本机或进程内模拟。

## 动手练习与验收 {#lab}

1. 给正常和非法数量分别断言结果与异常。
2. 将输出文件操作隔离到 tmp_path，验证失败时不污染其他测试。
3. 为一个上游接口创建替身，验证错误传播与不必要调用被阻止。

依据：[pytest](https://docs.pytest.org/en/stable/)、[unittest mock](https://docs.python.org/3/library/unittest.mock.html)。
