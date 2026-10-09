---
title: 1.1. 环境、解释器与虚拟环境
description: Python 中文学习指南：环境、解释器与虚拟环境，包含概念、代码示例、练习与验收。
pageClass: aip-article
---

# 1.1. 环境、解释器与虚拟环境

本章目标：能从空目录运行 Python 程序，确认解释器位置，并为每个项目隔离依赖。本文代码以 **Python 3.12 及以上**为基线，不依赖某个最新版本；生产环境应按依赖支持范围选版本。

## 安装与第一次运行

从 [Python 官方下载页](https://www.python.org/downloads/) 安装受支持的 Python 3。Windows 安装时留意启动器和 PATH；macOS、Linux 不要覆盖操作系统自带的解释器。下文终端命令统一写 `python`，创建环境前 macOS/Linux 通常用 `python3`，Windows 可用 `py -3`。

```sh
python3 --version
python3 -m venv .venv
# 1.1. macOS / Linux
source .venv/bin/activate
# 1.1. Windows PowerShell 使用：.venv\Scripts\Activate.ps1
python -c "import sys; print(sys.executable)"
python -m pip --version
```

PowerShell 不允许激活脚本时，可直接执行 `.venv\Scripts\python.exe`，无需更改系统策略。虚拟环境只是解释器与依赖的隔离目录，不是容器。把 `.venv/`、`__pycache__/` 放进 `.gitignore`，环境可重建，不要复制到另一台电脑。

保存 `hello.py`，运行 `python hello.py`：

```python
name = input("你的名字：").strip()
print(f"你好，{name or 'Python 学习者'}！")
```

交互解释器适合探索表达式；脚本适合保存和复现流程。终端里的 `>>>` 是交互提示符，不属于程序。编辑器选择已安装的 VS Code、PyCharm 等，并明确选中 `.venv` 的解释器。

## 安装依赖与排查问题

使用 `python -m pip install pytest`，让 pip 属于当前解释器。出现 `ModuleNotFoundError` 时，先比较 `sys.executable` 与编辑器解释器，再运行 `python -m pip show 包名`。不要用管理员权限反复重装来掩盖环境错配。程序文件也不要命名为 `json.py`、`typing.py`，否则可能遮蔽标准库。

项目变大后，可选择 [uv](https://docs.astral.sh/uv/) 统一管理解释器、依赖和锁文件：`uv init`、`uv add httpx`、`uv add --dev pytest ruff`、`uv run pytest`。先掌握 venv 与 pip，再选一种项目工具；同一项目保持一套明确的安装流程。

## 练习与验收

1. 从新目录创建环境，运行上面的问候程序。
2. 退出环境后用其解释器绝对路径运行同一脚本。
3. 解释“系统已安装包，但编辑器导入失败”的原因。

验收：能指出当前解释器、依赖安装位置与程序入口。参考：[venv 文档](https://docs.python.org/3/library/venv.html)、[安装 Python 包](https://packaging.python.org/en/latest/tutorials/installing-packages/)。
