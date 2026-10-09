---
title: 6.1. PyPI、pip、Conda、uv 与 Poetry
description: 区分包索引、安装、锁定、环境和非 Python 依赖。
pageClass: aip-article python-course
---

# 6.1. PyPI、pip、Conda、uv 与 Poetry

先修建议：[安装、解释器与第一次运行](./toolchain)、[内置模块、自定义模块与导入](./modules)。

包索引回答“从哪里取得包”，安装工具回答“装到哪里”，项目管理工具还负责声明、锁定与执行环境。原路线的五种方案有重叠，实际项目选择一套主工作流。

## PyPI 与 pip {#concept-1}

PyPI 是公开包索引，不是本机环境。pip 解析发行包并安装到指定解释器环境，使用 `python -m pip` 可减少解释器错配。发行包名与 import 名不总相同，不能单凭导入名字猜安装包。

```sh
python -m pip install httpx
python -m pip show httpx
python -m pip check
python -m pip freeze
```

依赖安装成功不说明版本可复现；记录实际选用版本、Python 要求和平台。freeze 反映当前环境的安装快照，不天然区分直接需求和偶然装入的工具。

```mermaid
flowchart LR
  D["项目依赖声明"] --> R["工具解析版本与兼容性"] --> I["从索引 / 仓库取得发行包"] --> E["安装到项目环境"]
```

## 原路线工具分工 {#concept-2}

| 工具 | 主要职责 | 选择时确认 |
| --- | --- | --- |
| pip | 安装 Python 发行包 | 与 venv、依赖声明/锁定流程一起使用。 |
| Conda | 环境及 Python/非 Python 包管理 | 数据科学与原生库条件、渠道和环境文件。 |
| uv | 项目、解释器、依赖、锁和工具工作流 | 按官方命令统一执行，记录 uv.lock。 |
| Poetry | 项目依赖管理、锁定与打包 | 当前主版本配置和组织既有约定。 |
| PyPI | 包索引 | 来源、许可证、维护与名称匹配。 |

## uv 项目实验 {#concept-3}

在独立目录执行：

```sh
uv init
uv add httpx
uv add --dev pytest
uv run python -c "import sys; print(sys.executable)"
uv run pytest
uv sync --locked
```

最后的 pytest 需要实际测试文件，无测试不算交付通过。pyproject 声明需求，uv.lock 固定解析结果，sync 重建环境；更新依赖时比较锁变化和测试结果，不手工随意改锁文件。

## Conda 与 Poetry 的对应流程 {#concept-4}

Conda 用环境文件描述渠道、Python 和依赖，建立、导出和重建环境；它能管理非 Python 库，混用 pip 时明确顺序与重建契约。Poetry 用项目配置与锁文件组织依赖，常见流程 init/add/install/run。按各自主版本文档使用，不把旧版配置机械套到新版。

不需要把所有管理器安装进同一个项目。工具选型要说明解释器、索引、锁和执行入口分别由谁负责，升级后仍能从干净环境重复安装和测试。

## 动手练习与验收 {#lab}

1. 用 venv+pip 或 uv 建一个带两项直接依赖的项目，写出重建步骤。
2. 解释 PyPI、pip 与 `.venv` 的区别，指出包的发行名和导入名。
3. 比较 Conda、uv、Poetry 对当前项目的职责，不以速度宣传代替需求。

依据：[包安装指南](https://packaging.python.org/en/latest/tutorials/installing-packages/)、[uv](https://docs.astral.sh/uv/)、[Conda](https://docs.conda.io/projects/conda/en/stable/)、[Poetry](https://python-poetry.org/docs/)。
