---
title: 12.1. Ruff、Black、YAPF 与质量流程
description: 格式化、静态规则与测试分别验证不同问题。
pageClass: aip-article python-course
---

# 12.1. Ruff、Black、YAPF 与质量流程

先修建议：[pyproject.toml 与配置职责](./configuration)。

格式化统一写法，静态规则找可疑用法，测试验证行为。原路线 Ruff、Black、YAPF 都要认识，但不应在一个文件上来回运行相互竞争的格式器。

## 一条清楚的质量流程 {#concept-1}

```mermaid
flowchart LR
  E["编辑"] --> F["选定格式器"] --> L["静态规则 / 类型检查"] --> T["行为测试"] --> B["构建与交付"]
```

| 工具 | 主要作用 | 使用边界 |
| --- | --- | --- |
| Ruff | Linter 与 formatter 工作流 | check 与 format 分开，规则选择有解释。 |
| Black | 固定风格格式化 | 不是业务正确性或类型检查工具。 |
| YAPF | 可配置格式化 | 团队已有风格时按配置与版本使用。 |

## Ruff 与 Black 示例 {#concept-2}

安装选用工具后，在实际项目执行：

```sh
ruff check .
ruff format --check .
# 项目选择 Black 时使用其流程，而不是再叠加不同格式器
black --check .
```

check 不主动改文件，format 或无 --check 的工具会改写；修复前看差异，格式更新不混入无关业务变化。YAPF 可用 `yapf --diff file.py` 查看格式差异，具体参数按当前工具版本。

## 配置与规则 {#concept-3}

把 include/exclude、行长、目标版本等写进支持的项目配置；生成文件、vendor 和上游资料不无条件纳入应用规则。忽略诊断写清原因和范围，不用全仓库无说明禁用。

运行顺序与工具版本记录在 CI，构建后仍要测试真实边界。自动格式通过不证明异常、并发或权限正确。

## 动手练习与验收 {#lab}

1. 为项目选择一个格式器和一套检查规则，说明职责。
2. 制造未使用 import 和错误类型，分别观察哪项工具能发现。
3. 从干净目录运行 check 流程，发现问题时不能默默成功退出。

依据：[Ruff](https://docs.astral.sh/ruff/)、[Black](https://black.readthedocs.io/en/stable/)、[YAPF](https://github.com/google/yapf)。
