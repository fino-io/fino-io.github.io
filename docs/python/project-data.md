---
title: 16.3. 实战：月度消费分析
description: pandas 数据检查、聚合、金额核对与报告。
pageClass: aip-article python-course
---

# 16.3. 实战：月度消费分析

先修建议：[pandas、自动化与性能](./data)、[实战：CSV 消费报告 CLI](./project-cli)。

本项目把[实战：CSV 消费报告 CLI](./project-cli)的金额规则用于数据分析，产出能核对、能重复执行的月度报告。前置知识：[数据分析、自动化与性能](./data)，以及[实战：CSV 消费报告 CLI](./project-cli)的 `report.py`。使用 pandas 完成表格分析，不重新实现数据分析框架。

## 报告必须能回到原始数据核对 {#concept-1}

先验证 id、日期、分类和金额，再按月聚合。记录数、总金额与排序可重复，是报告验收的一部分，不仅检查输出文件是否存在。

```mermaid
flowchart LR
  I["合成订单 CSV"] --> V["类型、唯一键与金额校验"] --> G["月 / 分类聚合"] --> C["原始总额 = 汇总总额"] --> O["稳定排序导出"]
```

金额规则复用 CLI 的 parse_cents，表格计算复用 pandas；基础逻辑不因进入数据框就重新以 float 处理精确账目。

## 数据契约与样本 {#concept-2}

输入多一个唯一记录 id，字段顺序为 `id,date,category,amount`。重复 id 直接拒绝，不默默保留一条；金额单位输入为元，输出为分。样本保存为 `orders.csv`：

```csv
id,date,category,amount
1,2026-01-02,图书,39.90
2,2026-01-03,课程,100.00
3,2026-01-05,图书,20.10
4,2026-02-01,图书,25.00
```

样本是合成数据，不含真实个人账单。预期一月总计 16000 分，二月总计 2500 分，总计 18500 分。

## 完整分析脚本 {#concept-3}

将[实战：CSV 消费报告 CLI](./project-cli)的 `report.py` 放在同一目录，安装 `python -m pip install pandas`，保存以下代码为 `analyze.py`：

```python
from pathlib import Path
import argparse
import pandas as pd
from report import parse_cents

def analyze(source: Path, output: Path) -> pd.DataFrame:
    if source.resolve() == output.resolve():
        raise ValueError("输出路径不能覆盖输入文件")
    frame = pd.read_csv(source, dtype=str, keep_default_na=False, encoding="utf-8-sig")
    if frame.columns.tolist() != ["id", "date", "category", "amount"]:
        raise ValueError("字段必须依次为 id,date,category,amount")
    if frame.empty:
        raise ValueError("至少需要一条消费记录")
    frame["id"] = frame["id"].str.strip()
    frame["category"] = frame["category"].str.strip()
    if frame["id"].eq("").any() or frame["id"].duplicated().any():
        raise ValueError("id 不能为空或重复")
    if frame["category"].eq("").any():
        raise ValueError("分类不能为空")
    dates = pd.to_datetime(frame["date"], format="%Y-%m-%d", errors="raise")
    frame["month"] = dates.dt.strftime("%Y-%m")
    # 用整数分保留精度，再使用任意精度 Python 整数，避免 int64 累加溢出。
    frame["amount_cents"] = frame["amount"].map(parse_cents).astype(object)
    summary = frame.groupby(["month", "category"], as_index=False).agg(
        records=("id", "count"), amount_cents=("amount_cents", "sum")
    ).sort_values(["month", "category"]).reset_index(drop=True)
    if sum(summary["amount_cents"]) != sum(frame["amount_cents"]):
        raise ValueError("汇总金额与原始金额不一致")
    summary.to_csv(output, index=False, encoding="utf-8-sig")
    return summary

def main() -> None:
    parser = argparse.ArgumentParser(description="生成月度分类消费报告")
    parser.add_argument("input", type=Path)
    parser.add_argument("--output", type=Path, default=Path("monthly.csv"))
    args = parser.parse_args()
    try:
        result = analyze(args.input, args.output)
    except (OSError, ValueError, UnicodeError, pd.errors.ParserError) as error:
        parser.exit(1, f"分析失败：{error}\n")
    print(result.to_string(index=False))

if __name__ == "__main__":
    main()
```

`dtype=str` 保留原始文本，避免金额先变成 float、记录 id 丢失前导零；关闭默认缺失值转换后，空字段由业务规则处理。此版本全量读取，适合可放入内存的数据，不面向超大账单。

## 执行与核对 {#concept-4}

```sh
python analyze.py orders.csv --output monthly.csv
```

输出应有三行：一月图书 2 条 6000 分，一月课程 1 条 10000 分，二月图书 1 条 2500 分。重复执行应得到相同排序与金额。程序覆盖指定报告文件，但拒绝覆盖源文件；保留原始数据，报告可以重建。

保存 `test_analyze.py`，安装 pytest 后运行 `python -m pytest -q`：

```python
import pytest
from analyze import analyze

def test_monthly_report(tmp_path):
    source, output = tmp_path / "orders.csv", tmp_path / "monthly.csv"
    source.write_text(
        "id,date,category,amount\n1,2026-01-02,图书,39.90\n"
        "2,2026-01-05,图书,20.10\n3,2026-02-01,课程,100.00\n",
        encoding="utf-8"
    )
    result = analyze(source, output)
    assert result["amount_cents"].tolist() == [6000, 10000]
    assert result["records"].tolist() == [2, 1]
    first = output.read_bytes()
    analyze(source, output)
    assert output.read_bytes() == first
    source.write_text(
        "id,date,category,amount\n1,2026-01-02,图书,1\n1,2026-01-03,图书,2\n",
        encoding="utf-8"
    )
    with pytest.raises(ValueError, match="重复"):
        analyze(source, output)
```

## 交付与扩展 {#lab}

交付 README、合成样本、脚本、测试与数据字典。验收应同时核对记录数、金额总和、月份范围和重复 id，不能只看图表“像是正确”。升级可增加分类占比图、质量报告和分块聚合；图表标明单位和样本范围。中文绘图需配置实际可用的中文字体。

后续选择一个方向继续：数据分析补统计与 SQL；Web 开发补鉴权、部署和数据库迁移；自动化补幂等、任务调度与可观测性；机器学习先学 NumPy、训练评估分离与数据泄漏，再进入 scikit-learn 或 PyTorch。每个方向先做一个有输入、输出、测试和说明的项目。

参考：[pandas 聚合教程](https://pandas.pydata.org/docs/getting_started/intro_tutorials/06_calculate_statistics.html)、[pandas 输入输出](https://pandas.pydata.org/docs/user_guide/io.html)。
