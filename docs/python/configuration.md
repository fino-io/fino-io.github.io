---
title: 6.2. pyproject.toml 与配置职责
description: 声明项目元数据、依赖、构建和工具配置，分离运行凭据。
pageClass: aip-article python-course
---

# 6.2. pyproject.toml 与配置职责

先修建议：[PyPI、pip、Conda、uv 与 Poetry](./package-managers)。

pyproject.toml 是项目元数据、构建和工具配置的共同入口。依赖需求、锁定结果与运行配置仍是不同层次，不能因为在一个文件里就混成一类。

## 最小可安装包 {#concept-1}

```text
python-study/
  pyproject.toml
  src/study/__init__.py
  src/study/pricing.py
  tests/test_pricing.py
```

pyproject.toml 示例：

```toml
[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"

[project]
name = "python-study-example"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = []

[tool.setuptools.packages.find]
where = ["src"]

[tool.pytest.ini_options]
testpaths = ["tests"]
```

pricing.py 放上一节的 subtotal 函数，__init__.py 可以为空。安装后 tests 导入 `from study.pricing import subtotal`，不通过测试脚本任意修改 sys.path。

```sh
python -m pip install -e .
python -m pytest
```

运行测试前安装 pytest 并创建实际测试文件。editable 方便本地开发，不等于发布产物已验证；构建发行包后可在另一个干净环境安装检查，但本课程不替用户发布包。

## 配置职责 {#concept-2}

| 内容 | 位置 / 责任 |
| --- | --- |
| 发行名称、版本、Python 要求、依赖 | project 元数据。 |
| 构建后端 | build-system。 |
| pytest、mypy、Ruff 等工具选项 | 对应 tool 表。 |
| 具体解析依赖版本 | 选定工具的锁文件或明确清单。 |
| 数据库凭据、API token | 运行环境 / secret 管理，不写入公开源码。 |

TOML 语法与项目规范是不同层：解析成功不说明某工具认识这个表。配置字段以相应工具版本文档为准，路径按项目根和工具规则解释。

## 动手练习与验收 {#lab}

1. 安装最小包并从项目目录外导入，确认不靠当前路径偶然成功。
2. 为测试和格式器添加各自配置，解释是否影响运行时业务。
3. 把示例 secret 移出文件，只保留配置名和默认规则。

依据：[pyproject.toml 指南](https://packaging.python.org/en/latest/guides/writing-pyproject-toml/)、[打包教程](https://packaging.python.org/en/latest/tutorials/packaging-projects/)。
