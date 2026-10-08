---
title: 10 · 测试、调试与代码质量
description: Python 中文学习指南：测试、调试与代码质量，包含概念、代码示例、练习与验收。
pageClass: aip-article
---

# 10 · 测试、调试与代码质量

本章目标：围绕行为写测试，能复现失败，并建立轻量的检查流程。

## 用 pytest 描述行为

先写可独立调用的函数，测试正常结果、边界值和失败条件。下面保存为 `test_scores.py`：

```python
import pytest

def grade(score: int) -> str:
    if not 0 <= score <= 100:
        raise ValueError("分数超出范围")
    return "通过" if score >= 60 else "未通过"

@pytest.mark.parametrize("score, expected", [(0, "未通过"), (59, "未通过"), (60, "通过"), (100, "通过")])
def test_grade(score, expected):
    assert grade(score) == expected

def test_invalid_score():
    with pytest.raises(ValueError, match="超出范围"):
        grade(-1)
```

运行 `python -m pip install pytest` 和 `python -m pytest -q`。实际项目把函数放业务模块，测试通过 import 使用，避免复制实现。测试描述公开行为，不依赖私有变量名和函数内部执行顺序。

## 文件、网络与时间

`tmp_path` 提供隔离临时目录，适合文件和 SQLite 测试；`monkeypatch` 可临时替换环境变量。网络单元测试使用 HTTPX mock transport 等成熟工具，少量集成测试才访问受控服务。时间和随机数可注入，保证结果复现。

fixture 管理可复用准备与清理，先保持局部简单。不要为一个四行函数建立复杂测试基类。覆盖率能指出未执行路径，不能证明断言有效；优先测试金额、输入验证、事务和权限等关键行为。

## 格式化、检查与调试

```sh
python -m pip install ruff
python -m ruff check .
python -m ruff format --check .
python -m pytest -q
```

Ruff 提供 lint 与格式化。初始配置只启用团队理解的规则，避免一次加入大量忽略项。开发时可执行 `python -m ruff format .`，CI 使用只检查模式。类型检查可在第 09 章基础上加入。

错误排查顺序：复现输入 → 阅读 traceback → 缩小到最小失败用例 → 用 `breakpoint()` 或日志检查值 → 修复 → 保留回归测试。日志记录事实和上下文，避免重复输出每一层相同异常。

## 练习与验收

1. 给 CSV 报告写中文、引号、空数据和无效金额测试。
2. 用 tmp_path 保证测试不会覆盖真实文件。
3. 故意改变通过阈值，确认测试能够失败，再恢复实现。

验收：测试在干净环境可运行，失败指向具体行为，质量检查无未说明错误。参考：[pytest 入门](https://docs.pytest.org/en/stable/getting-started.html)、[Ruff 文档](https://docs.astral.sh/ruff/)。
