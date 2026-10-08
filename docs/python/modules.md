---
title: 06 · 模块、包与项目结构
description: Python 中文学习指南：模块、包与项目结构，包含概念、代码示例、练习与验收。
pageClass: aip-article
---

# 06 · 模块、包与项目结构

本章目标：理解导入机制，为小项目建立清晰结构，让代码可直接运行和测试。

## 模块与入口

一个 `.py` 文件是模块；包组织多个模块，常规包包含 `__init__.py`。导入通常先执行模块顶层代码并缓存模块，因此不要在导入时请求网络、修改文件或启动服务。

```python
# greeting.py
def greet(name: str) -> str:
    return f"你好，{name}"

def main() -> None:
    print(greet("Python"))

if __name__ == "__main__":
    main()
```

直接运行时 `__name__` 为 `__main__`，导入时使用模块名称。`python -m 包名.模块名` 按模块路径启动，适合包内程序。优先明确导入，避免 `from module import *` 和手动修改 `sys.path`。循环导入通常意味着职责交叉，先提取真正共享的数据模型或收敛模块边界。

## 从单文件自然增长

```text
study-tool/
├── pyproject.toml
├── README.md
├── src/
│   └── study_tool/
│       ├── __init__.py
│       ├── cli.py
│       └── report.py
└── tests/
    └── test_report.py
```

业务规则放 report，参数和输出放 cli。只有数据库、HTTP 或任务调度确实出现时才增加对应模块，不必预先建立 controller/service/repository 全套目录。

## pyproject.toml 与安装

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "study-tool"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = []

[project.scripts]
study-tool = "study_tool.cli:main"
```

该配置配合上面的 src 布局使用；`cli.py` 中提供 `main()`。在环境中执行 `python -m pip install -e .`，即可运行 `study-tool`。可编辑安装方便开发，发布构建使用 wheel。构建后还应在干净环境安装 wheel 验证，防止本地路径掩盖漏打包文件。

依赖声明表达兼容范围；应用锁文件固定实际解析结果。应用通常保留锁文件以复现环境，库需要同时验证支持的依赖范围。README 至少说明安装、运行、输入格式和验证命令。

## 练习与验收

1. 将词频统计拆成包和 CLI，导入业务模块时不产生输出。
2. 在新的环境安装项目，验证命令行入口。
3. 分析一次循环导入，减少互相依赖而非使用延迟导入掩盖设计。

验收：从仓库根目录能按 README 安装和运行，模块没有意外副作用。参考：[模块教程](https://docs.python.org/zh-cn/3/tutorial/modules.html)、[Python 打包指南](https://packaging.python.org/en/latest/tutorials/packaging-projects/)。
